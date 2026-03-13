"""Crawler API routes for ReachBy3Cs platform.

This module provides REST API endpoints for managing and executing
crawls across different platforms.
"""

import asyncio
import hashlib
import logging
import time
from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException, status, BackgroundTasks, Request
from pydantic import BaseModel, Field

from src.crawlers.base import CrawledPost, CrawlResult
from src.crawlers.scheduler import (
    CrawlConfig,
    CrawlFrequency,
    CrawlScheduler,
    get_scheduler,
)
from src.crawlers.ai_search import generate_search_queries
from src.db.supabase import get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/crawlers", tags=["crawlers"])


# Anonymous Analytics Functions

def _categorize_target_audience(target_audience: str) -> str:
    """Categorize target audience into generic categories (no PII).

    Args:
        target_audience: The raw target audience description.

    Returns:
        A generic category string for analytics.
    """
    audience_lower = target_audience.lower()

    # Map to generic categories
    if any(word in audience_lower for word in ["business", "entrepreneur", "startup", "company"]):
        return "business"
    elif any(word in audience_lower for word in ["developer", "programmer", "engineer", "tech"]):
        return "technical"
    elif any(word in audience_lower for word in ["health", "fitness", "medical", "wellness"]):
        return "health"
    elif any(word in audience_lower for word in ["finance", "money", "invest", "budget"]):
        return "finance"
    elif any(word in audience_lower for word in ["family", "parent", "child", "couple"]):
        return "family"
    elif any(word in audience_lower for word in ["student", "learn", "education", "school"]):
        return "education"
    elif any(word in audience_lower for word in ["market", "sales", "advertis", "brand"]):
        return "marketing"
    else:
        return "general"


async def log_anonymous_search(
    platforms: list[str],
    result_count: int,
    target_audience_category: str,
    session_hash: str | None = None,
) -> None:
    """Log anonymous search for analytics (no PII stored).

    Args:
        platforms: List of platforms searched.
        result_count: Number of results returned.
        target_audience_category: Generic category of target audience.
        session_hash: Optional hashed session ID (one-way hash).
    """
    try:
        supabase = get_supabase_client()
        if not supabase.is_connected:
            logger.debug("Supabase not connected, skipping analytics logging")
            return

        supabase.table("anonymous_search_analytics").insert({
            "platforms_searched": platforms,
            "result_count": result_count,
            "target_audience_category": target_audience_category,
            "session_hash": session_hash,
        }).execute()

        logger.debug(f"Logged anonymous search analytics: {result_count} results")
    except Exception as e:
        # Don't fail the search if analytics fails
        logger.warning(f"Failed to log anonymous search analytics: {e}")


# Request/Response Models

class SearchRequest(BaseModel):
    """Request model for search endpoints."""

    keywords: list[str] = Field(..., description="Keywords to search for", min_length=1)
    limit: int = Field(default=100, ge=1, le=1000, description="Maximum results")


class RedditSearchRequest(SearchRequest):
    """Request model for Reddit search."""

    subreddits: list[str] | None = Field(
        default=None, description="Subreddits to search within"
    )
    time_filter: str = Field(
        default="week",
        description="Time filter (hour, day, week, month, year, all)"
    )
    sort: str = Field(
        default="relevance",
        description="Sort order (relevance, hot, top, new, comments)"
    )
    include_comments: bool = Field(
        default=False, description="Include comments in results"
    )


class TwitterSearchRequest(SearchRequest):
    """Request model for Twitter search."""

    start_time: str | None = Field(
        default=None, description="Start time (ISO 8601)"
    )
    end_time: str | None = Field(
        default=None, description="End time (ISO 8601)"
    )


class QuoraSearchRequest(SearchRequest):
    """Request model for Quora search."""

    include_answers: bool = Field(
        default=False, description="Include answers for questions"
    )


class GoogleSearchRequest(SearchRequest):
    """Request model for Google search."""

    site_filter: str | None = Field(
        default=None,
        description="Site filter (e.g., 'reddit.com' or 'site:reddit.com')"
    )
    location: str = Field(default="United States", description="Location")
    language: str = Field(default="en", description="Language code")
    include_related_questions: bool = Field(
        default=True, description="Include 'People Also Ask' questions"
    )


class AISearchRequest(BaseModel):
    """Request model for AI-powered search."""

    target_audience: str = Field(
        ...,
        description="Description of who you want to reach",
        min_length=10,
    )
    solution: str = Field(
        ...,
        description="Description of the problem you solve",
        min_length=5,
    )
    platforms: list[str] | None = Field(
        default=None,
        description="Platforms to search (reddit.com, quora.com, etc.)"
    )
    limit: int = Field(default=10, ge=1, le=50, description="Maximum results")


class AISearchWithResponsesRequest(AISearchRequest):
    """Request model for AI-powered search with response generation."""

    generate_responses: bool = Field(
        default=True,
        description="Whether to generate AI responses for each post"
    )
    skip_cta_cts: bool = Field(
        default=False,
        description="Skip CTA classifier and CTS decision for faster processing"
    )


class EnhancedPost(BaseModel):
    """A post with AI-generated response data."""

    external_id: str
    external_url: str
    content: str
    platform: str
    author_handle: str | None = None
    author_display_name: str | None = None
    external_created_at: str | None = None
    crawled_at: str
    engagement_metrics: dict[str, Any] = Field(default_factory=dict)
    platform_metadata: dict[str, Any] = Field(default_factory=dict)

    # AI-generated fields
    ai_response: str = ""
    response_variants: dict[str, str] = Field(default_factory=dict)
    risk_level: str = "medium"
    cts_score: float = 0.5
    error: str | None = None


class AISearchWithResponsesResponse(BaseModel):
    """Response model for AI search with responses."""

    posts: list[EnhancedPost]
    total_found: int
    crawl_time_seconds: float
    pipeline_time_seconds: float
    errors: list[str]
    rate_limited: bool


class ScheduleRequest(BaseModel):
    """Request model for scheduling crawls."""

    name: str = Field(..., description="Unique name for this schedule")
    platform: str = Field(
        ..., description="Platform to crawl (reddit, twitter, quora, google)"
    )
    keywords: list[str] = Field(..., description="Keywords to search for")
    sources: list[str] | None = Field(
        default=None, description="Platform-specific sources"
    )
    frequency: str = Field(
        default="every_6_hours",
        description="Crawl frequency (hourly, every_6_hours, daily, etc.)"
    )
    limit: int = Field(default=100, ge=1, le=1000, description="Maximum results")
    enabled: bool = Field(default=True, description="Whether schedule is enabled")
    extra_params: dict[str, Any] = Field(
        default_factory=dict, description="Additional parameters"
    )


class CrawlResultResponse(BaseModel):
    """Response model for crawl results."""

    platform: str
    posts: list[dict[str, Any]]
    total_found: int
    crawl_time_seconds: float
    errors: list[str]
    rate_limited: bool
    next_cursor: str | None = None


class SchedulerStatusResponse(BaseModel):
    """Response model for scheduler status."""

    running: bool
    paused: bool
    total_jobs: int
    jobs: list[dict[str, Any]]
    registered_crawlers: list[str]


class CrawlerHealthResponse(BaseModel):
    """Response model for crawler health check."""

    platform: str
    initialized: bool
    status: str
    api_connected: bool | None = None
    rate_limiter: dict[str, Any] | None = None
    additional_info: dict[str, Any] = Field(default_factory=dict)


# Crawler instances (lazily initialized)
_crawlers: dict[str, Any] = {}


async def get_crawler(platform: str) -> Any:
    """Get or initialize a crawler for a platform.

    Args:
        platform: Platform name.

    Returns:
        Crawler instance.

    Raises:
        HTTPException: If platform is not supported.
    """
    if platform in _crawlers:
        return _crawlers[platform]

    try:
        if platform == "reddit":
            from src.crawlers.reddit import RedditCrawler
            crawler = RedditCrawler()
        elif platform == "twitter":
            from src.crawlers.twitter import TwitterCrawler
            crawler = TwitterCrawler()
        elif platform == "quora":
            from src.crawlers.quora import QuoraCrawler
            crawler = QuoraCrawler()
        elif platform == "google":
            from src.crawlers.google import GoogleCrawler
            crawler = GoogleCrawler()
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported platform: {platform}"
            )

        await crawler.initialize()
        _crawlers[platform] = crawler

        # Register with scheduler
        scheduler = get_scheduler()
        scheduler.register_crawler(platform, crawler)

        return crawler

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error initializing {platform} crawler: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to initialize {platform} crawler: {str(e)}"
        )


def crawl_result_to_response(result: CrawlResult) -> CrawlResultResponse:
    """Convert CrawlResult to API response."""
    return CrawlResultResponse(
        platform=result.platform,
        posts=[post.model_dump() for post in result.posts],
        total_found=result.total_found,
        crawl_time_seconds=result.crawl_time_seconds,
        errors=result.errors,
        rate_limited=result.rate_limited,
        next_cursor=result.next_cursor,
    )


# Reddit Endpoints

@router.post(
    "/reddit/search",
    response_model=CrawlResultResponse,
    summary="Search Reddit",
    description="Search Reddit for posts matching keywords.",
)
async def search_reddit(request: RedditSearchRequest) -> CrawlResultResponse:
    """Search Reddit for posts matching keywords."""
    crawler = await get_crawler("reddit")

    result = await crawler.search(
        keywords=request.keywords,
        subreddits=request.subreddits,
        limit=request.limit,
        time_filter=request.time_filter,
        sort=request.sort,
        include_comments=request.include_comments,
    )

    return crawl_result_to_response(result)


@router.post(
    "/reddit/monitor",
    response_model=CrawlResultResponse,
    summary="Monitor Subreddits",
    description="Get recent posts from specified subreddits.",
)
async def monitor_subreddits(
    subreddits: list[str],
    limit: int = 100,
    sort: str = "new",
) -> CrawlResultResponse:
    """Monitor subreddits for recent posts."""
    crawler = await get_crawler("reddit")

    result = await crawler.monitor_subreddits(
        subreddits=subreddits,
        limit=limit,
        sort=sort,
    )

    return crawl_result_to_response(result)


# Twitter Endpoints

@router.post(
    "/twitter/search",
    response_model=CrawlResultResponse,
    summary="Search Twitter",
    description="Search Twitter for tweets matching keywords.",
)
async def search_twitter(request: TwitterSearchRequest) -> CrawlResultResponse:
    """Search Twitter for tweets matching keywords."""
    crawler = await get_crawler("twitter")

    result = await crawler.search(
        keywords=request.keywords,
        limit=request.limit,
        start_time=request.start_time,
        end_time=request.end_time,
    )

    return crawl_result_to_response(result)


# Quora Endpoints

@router.post(
    "/quora/search",
    response_model=CrawlResultResponse,
    summary="Search Quora",
    description="Search Quora for questions matching keywords.",
)
async def search_quora(request: QuoraSearchRequest) -> CrawlResultResponse:
    """Search Quora for questions matching keywords."""
    crawler = await get_crawler("quora")

    result = await crawler.search(
        keywords=request.keywords,
        limit=request.limit,
        include_answers=request.include_answers,
    )

    return crawl_result_to_response(result)


# Google Endpoints

@router.post(
    "/google/search",
    response_model=CrawlResultResponse,
    summary="Search Google",
    description="Search Google for content matching keywords.",
)
async def search_google(request: GoogleSearchRequest) -> CrawlResultResponse:
    """Search Google for content matching keywords."""
    crawler = await get_crawler("google")

    result = await crawler.search(
        keywords=request.keywords,
        limit=request.limit,
        site_filter=request.site_filter,
        location=request.location,
        language=request.language,
        include_related_questions=request.include_related_questions,
    )

    return crawl_result_to_response(result)


@router.post(
    "/google/discussions",
    response_model=CrawlResultResponse,
    summary="Search Discussions",
    description="Search Google for discussions across multiple platforms.",
)
async def search_discussions(
    keywords: list[str],
    platforms: list[str] | None = None,
    limit: int = 100,
) -> CrawlResultResponse:
    """Search Google for discussions across platforms."""
    crawler = await get_crawler("google")

    result = await crawler.search_discussions(
        keywords=keywords,
        platforms=platforms,
        limit=limit,
    )

    return crawl_result_to_response(result)


@router.post(
    "/google/ai-search",
    response_model=CrawlResultResponse,
    summary="AI-Powered Search",
    description="Use AI to generate optimal search queries and find relevant discussions.",
)
async def ai_search(request: AISearchRequest) -> CrawlResultResponse:
    """AI-powered search that generates optimal queries from natural language.

    Instead of requiring specific keywords, this endpoint:
    1. Takes a natural language description of the target audience
    2. Uses AI to generate multiple optimized search queries
    3. Searches across platforms with those queries
    4. Returns combined, deduplicated results
    """
    # Generate AI-optimized search queries
    queries = await generate_search_queries(
        target_audience=request.target_audience,
        solution=request.solution,
        num_queries=5,
    )

    logger.info(f"AI generated queries: {queries}")

    if not queries:
        return CrawlResultResponse(
            platform="google",
            posts=[],
            total_found=0,
            crawl_time_seconds=0,
            errors=["Failed to generate search queries"],
            rate_limited=False,
        )

    # Get the Google crawler
    crawler = await get_crawler("google")

    # Default platforms if not specified
    platforms = request.platforms or [
        "reddit.com",
        "stackoverflow.com",
        "news.ycombinator.com",
    ]

    # Search with each query and combine results
    all_posts: list[dict[str, Any]] = []
    seen_urls: set[str] = set()
    total_errors: list[str] = []
    total_time = 0.0
    rate_limited = False

    for query in queries:
        try:
            result = await crawler.search_discussions(
                keywords=[query],
                platforms=platforms,
                limit=request.limit // len(queries) + 2,  # Distribute limit across queries
            )

            total_time += result.crawl_time_seconds
            rate_limited = rate_limited or result.rate_limited
            total_errors.extend(result.errors)

            # Deduplicate by URL
            for post in result.posts:
                post_url = post.external_url or ""
                if post_url and post_url not in seen_urls:
                    seen_urls.add(post_url)
                    all_posts.append(post.model_dump())

                    if len(all_posts) >= request.limit:
                        break

        except Exception as e:
            logger.error(f"Error searching with query '{query}': {e}")
            total_errors.append(f"Query '{query}' failed: {str(e)}")

    return CrawlResultResponse(
        platform="google",
        posts=all_posts[:request.limit],
        total_found=len(all_posts),
        crawl_time_seconds=total_time,
        errors=total_errors,
        rate_limited=rate_limited,
    )


def _detect_platform_from_url(url: str) -> str:
    """Detect the platform from a URL.

    Args:
        url: The URL to analyze.

    Returns:
        Platform name (reddit, twitter, quora, etc.)
    """
    url_lower = url.lower()
    if "reddit.com" in url_lower:
        return "reddit"
    elif "twitter.com" in url_lower or "x.com" in url_lower:
        return "twitter"
    elif "quora.com" in url_lower:
        return "quora"
    elif "stackoverflow.com" in url_lower:
        return "stackoverflow"
    elif "ycombinator.com" in url_lower:
        return "hackernews"
    elif "linkedin.com" in url_lower:
        return "linkedin"
    return "reddit"  # Default


@router.post(
    "/google/ai-search-with-responses",
    response_model=AISearchWithResponsesResponse,
    summary="AI Search with Response Generation",
    description="Search for discussions and generate AI responses for each result.",
)
async def ai_search_with_responses(
    request: AISearchWithResponsesRequest,
) -> AISearchWithResponsesResponse:
    """AI-powered search that also generates responses for each result.

    This endpoint combines:
    1. AI-powered search query generation
    2. SerpAPI search for discussions
    3. AI pipeline processing for each post (signal detection, risk scoring, response generation)

    Returns posts with AI-generated responses ready for sales agents to copy/edit.
    """
    from src.agents.engagement_pipeline import create_engagement_pipeline

    pipeline_start = time.time()

    # Step 1: Run the AI search (reuse existing logic)
    search_result = await ai_search(
        AISearchRequest(
            target_audience=request.target_audience,
            solution=request.solution,
            platforms=request.platforms,
            limit=request.limit,
        )
    )

    crawl_time = search_result.crawl_time_seconds

    # If no posts found, return early
    if not search_result.posts:
        return AISearchWithResponsesResponse(
            posts=[],
            total_found=0,
            crawl_time_seconds=crawl_time,
            pipeline_time_seconds=0,
            errors=search_result.errors,
            rate_limited=search_result.rate_limited,
        )

    # Step 2: Create pipeline and tenant context
    pipeline = create_engagement_pipeline()

    tenant_context = {
        "app_name": request.solution[:50] if request.solution else "Solution",
        "value_prop": request.solution,
        "target_audience": request.target_audience,
        "key_benefits": [],
        "website_url": "",
    }

    # Step 3: Process each post through the pipeline in parallel
    async def process_post(post: dict[str, Any]) -> EnhancedPost:
        """Process a single post through the engagement pipeline."""
        content = post.get("content", "")
        url = post.get("external_url", "")
        platform = _detect_platform_from_url(url)

        # Create base enhanced post
        enhanced = EnhancedPost(
            external_id=post.get("external_id", ""),
            external_url=url,
            content=content,
            platform=platform,
            author_handle=post.get("author_handle"),
            author_display_name=post.get("author_display_name"),
            external_created_at=post.get("external_created_at"),
            crawled_at=post.get("crawled_at", datetime.utcnow().isoformat()),
            engagement_metrics=post.get("engagement_metrics", {}),
            platform_metadata=post.get("platform_metadata", {}),
        )

        # Skip if no content
        if not content or len(content.strip()) < 10:
            enhanced.error = "Insufficient content for analysis"
            return enhanced

        try:
            # Run pipeline with timeout (10 seconds per post)
            result = await asyncio.wait_for(
                pipeline.run_async(
                    text=content,
                    platform=platform,
                    tenant_context=tenant_context,
                ),
                timeout=15.0,
            )

            # Extract response data
            responses = result.get("responses") or {}
            risk = result.get("risk") or {}
            cts = result.get("cts") or {}

            enhanced.ai_response = responses.get("selected_response", "")
            enhanced.response_variants = {
                "value_first": responses.get("value_first_response", ""),
                "soft_cta": responses.get("soft_cta_response", ""),
                "contextual": responses.get("contextual_response", ""),
            }
            enhanced.risk_level = risk.get("risk_level", "medium")
            enhanced.cts_score = cts.get("cts_score", 0.5)

            # Check for pipeline error
            if result.get("error"):
                enhanced.error = result.get("error")

        except asyncio.TimeoutError:
            logger.warning(f"Pipeline timeout for post: {url[:50]}...")
            enhanced.error = "Pipeline processing timeout"
        except Exception as e:
            logger.error(f"Pipeline error for post {url[:50]}: {e}")
            enhanced.error = str(e)

        return enhanced

    # Process all posts in parallel
    tasks = [process_post(post) for post in search_result.posts]
    enhanced_posts = await asyncio.gather(*tasks)

    pipeline_time = time.time() - pipeline_start - crawl_time

    # Collect any processing errors
    all_errors = list(search_result.errors)
    for post in enhanced_posts:
        if post.error:
            all_errors.append(f"Post {post.external_id}: {post.error}")

    # Log anonymous analytics (non-blocking, no PII)
    platforms = request.platforms or ["reddit.com", "stackoverflow.com", "news.ycombinator.com"]
    target_category = _categorize_target_audience(request.target_audience)
    asyncio.create_task(
        log_anonymous_search(
            platforms=platforms,
            result_count=len(enhanced_posts),
            target_audience_category=target_category,
            session_hash=None,  # No session tracking from API
        )
    )

    return AISearchWithResponsesResponse(
        posts=enhanced_posts,
        total_found=len(enhanced_posts),
        crawl_time_seconds=crawl_time,
        pipeline_time_seconds=round(pipeline_time, 2),
        errors=all_errors,
        rate_limited=search_result.rate_limited,
    )


# Status Endpoints

@router.get(
    "/status",
    response_model=SchedulerStatusResponse,
    summary="Get Crawler Status",
    description="Get status of all crawlers and scheduled jobs.",
)
async def get_crawler_status() -> SchedulerStatusResponse:
    """Get status of all crawlers and scheduled jobs."""
    scheduler = get_scheduler()
    status_data = scheduler.get_status()

    return SchedulerStatusResponse(**status_data)


@router.get(
    "/health/{platform}",
    response_model=CrawlerHealthResponse,
    summary="Crawler Health Check",
    description="Check health of a specific platform crawler.",
)
async def crawler_health_check(platform: str) -> CrawlerHealthResponse:
    """Check health of a specific platform crawler."""
    try:
        crawler = await get_crawler(platform)
        health = await crawler.health_check()

        return CrawlerHealthResponse(
            platform=platform,
            initialized=health.get("initialized", False),
            status=health.get("status", "unknown"),
            api_connected=health.get("api_connected"),
            rate_limiter=health.get("rate_limiter"),
            additional_info={
                k: v for k, v in health.items()
                if k not in ["platform", "initialized", "status", "api_connected", "rate_limiter"]
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        return CrawlerHealthResponse(
            platform=platform,
            initialized=False,
            status="error",
            additional_info={"error": str(e)},
        )


# Scheduler Endpoints

@router.post(
    "/schedule",
    status_code=status.HTTP_201_CREATED,
    summary="Schedule Crawl",
    description="Schedule a recurring crawl.",
)
async def schedule_crawl(request: ScheduleRequest) -> dict[str, Any]:
    """Schedule a recurring crawl."""
    # Ensure crawler is initialized
    await get_crawler(request.platform)

    scheduler = get_scheduler()

    try:
        frequency = CrawlFrequency(request.frequency)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid frequency: {request.frequency}. "
                   f"Valid values: {[f.value for f in CrawlFrequency]}"
        )

    config = CrawlConfig(
        name=request.name,
        platform=request.platform,
        keywords=request.keywords,
        sources=request.sources,
        frequency=frequency,
        limit=request.limit,
        enabled=request.enabled,
        extra_params=request.extra_params,
    )

    job_id = scheduler.add_crawl_config(config)

    return {
        "job_id": job_id,
        "message": f"Crawl scheduled: {request.name}",
        "next_run": scheduler.get_job_status(job_id).next_run.isoformat()
        if scheduler.get_job_status(job_id) and scheduler.get_job_status(job_id).next_run
        else None,
    }


@router.delete(
    "/schedule/{config_name}",
    summary="Remove Scheduled Crawl",
    description="Remove a scheduled crawl.",
)
async def remove_scheduled_crawl(config_name: str) -> dict[str, str]:
    """Remove a scheduled crawl."""
    scheduler = get_scheduler()

    if scheduler.remove_crawl_config(config_name):
        return {"message": f"Crawl schedule removed: {config_name}"}
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Crawl schedule not found: {config_name}"
        )


@router.get(
    "/schedules",
    summary="List Scheduled Crawls",
    description="List all scheduled crawls.",
)
async def list_scheduled_crawls() -> list[dict[str, Any]]:
    """List all scheduled crawls."""
    scheduler = get_scheduler()
    return scheduler.list_configs()


@router.post(
    "/run/{config_name}",
    response_model=CrawlResultResponse,
    summary="Run Crawl Now",
    description="Run a scheduled crawl immediately.",
)
async def run_crawl_now(config_name: str) -> CrawlResultResponse:
    """Run a scheduled crawl immediately."""
    scheduler = get_scheduler()

    config = scheduler.get_config(config_name)
    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Crawl configuration not found: {config_name}"
        )

    result = await scheduler.run_crawl_now(config_name)

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Crawl execution failed"
        )

    return crawl_result_to_response(result)


@router.post(
    "/scheduler/start",
    summary="Start Scheduler",
    description="Start the crawl scheduler.",
)
async def start_scheduler() -> dict[str, str]:
    """Start the crawl scheduler."""
    scheduler = get_scheduler()
    scheduler.start()
    return {"message": "Scheduler started"}


@router.post(
    "/scheduler/stop",
    summary="Stop Scheduler",
    description="Stop the crawl scheduler.",
)
async def stop_scheduler() -> dict[str, str]:
    """Stop the crawl scheduler."""
    scheduler = get_scheduler()
    scheduler.stop()
    return {"message": "Scheduler stopped"}


@router.post(
    "/scheduler/pause",
    summary="Pause Scheduler",
    description="Pause all scheduled crawls.",
)
async def pause_scheduler() -> dict[str, str]:
    """Pause the crawl scheduler."""
    scheduler = get_scheduler()
    scheduler.pause()
    return {"message": "Scheduler paused"}


@router.post(
    "/scheduler/resume",
    summary="Resume Scheduler",
    description="Resume all paused crawls.",
)
async def resume_scheduler() -> dict[str, str]:
    """Resume the crawl scheduler."""
    scheduler = get_scheduler()
    scheduler.resume()
    return {"message": "Scheduler resumed"}
