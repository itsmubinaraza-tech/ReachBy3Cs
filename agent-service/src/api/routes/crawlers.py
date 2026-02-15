"""Crawler API routes for ReachBy3Cs platform.

This module provides REST API endpoints for managing and executing
crawls across different platforms.
"""

import logging
from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException, status, BackgroundTasks
from pydantic import BaseModel, Field

from src.crawlers.base import CrawledPost, CrawlResult
from src.crawlers.scheduler import (
    CrawlConfig,
    CrawlFrequency,
    CrawlScheduler,
    get_scheduler,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/crawlers", tags=["crawlers"])


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
