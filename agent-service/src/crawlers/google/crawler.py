"""Google Search crawler implementation for ReachBy3Cs platform.

This module provides a crawler for Google Search using SerpAPI
to find discussions and engagement opportunities.
"""

import logging
import time
from typing import Any
from urllib.parse import quote

import httpx

from src.config import get_settings
from src.crawlers.base import BaseCrawler, CrawledPost, CrawlResult
from src.crawlers.rate_limiter import RateLimitConfig, get_rate_limiter_manager
from src.crawlers.google.parser import GoogleParser

logger = logging.getLogger(__name__)


class GoogleCrawler(BaseCrawler):
    """Crawler for Google Search using SerpAPI.

    Searches Google for discussions and content matching specified
    keywords, with optional site filtering for specific platforms.

    Attributes:
        platform_name: Identifier for this crawler ("google").
        client: httpx AsyncClient for API requests.
        parser: GoogleParser instance for parsing responses.
    """

    platform_name = "google"
    SERPAPI_BASE_URL = "https://serpapi.com/search"

    def __init__(self) -> None:
        """Initialize the Google crawler."""
        super().__init__()
        self.client: httpx.AsyncClient | None = None
        self.parser = GoogleParser()
        self.api_key: str = ""

        # Get rate limiter with SerpAPI limits
        # SerpAPI limits vary by plan, using conservative defaults
        rate_limiter_manager = get_rate_limiter_manager()
        self.rate_limiter = rate_limiter_manager.get_or_create(
            name="google",
            config=RateLimitConfig(
                requests_per_minute=10,
                requests_per_hour=100,
                min_delay_seconds=0.5,
                max_delay_seconds=60.0,
            )
        )

    async def initialize(self) -> None:
        """Initialize the SerpAPI client with credentials.

        Loads credentials from configuration and creates the HTTP client.
        """
        settings = get_settings()

        self.api_key = getattr(settings, 'serp_api_key', '')

        if not self.api_key:
            self.logger.warning(
                "SerpAPI key not configured. "
                "Set SERP_API_KEY environment variable."
            )

        self.client = httpx.AsyncClient(
            timeout=30.0,
        )

        self._initialized = True
        self.logger.info("Google crawler initialized")

    async def close(self) -> None:
        """Close the HTTP client and clean up resources."""
        if self.client:
            await self.client.aclose()
            self.client = None
        self._initialized = False
        self.logger.info("Google crawler closed")

    async def search(
        self,
        keywords: list[str],
        subreddits: list[str] | None = None,  # Unused, for interface compatibility
        limit: int = 100,
        site_filter: str | None = None,
        location: str = "United States",
        language: str = "en",
        include_related_questions: bool = True,
        num_results: int = 10,
        **kwargs: Any,
    ) -> CrawlResult:
        """Search Google for content matching keywords.

        Args:
            keywords: List of keywords to search for.
            subreddits: Unused, for interface compatibility with BaseCrawler.
            limit: Maximum number of results to return.
            site_filter: Site filter (e.g., "site:reddit.com").
            location: Location for search results.
            language: Language for search results.
            include_related_questions: Include "People Also Ask" questions.
            num_results: Number of results per page.
            **kwargs: Additional parameters.

        Returns:
            CrawlResult containing matching search results.
        """
        if not self._initialized or not self.client:
            await self.initialize()

        self._log_crawl_start(
            "search",
            keywords=keywords,
            limit=limit,
            site_filter=site_filter,
        )

        start_time = time.time()
        posts: list[CrawledPost] = []
        errors: list[str] = []
        rate_limited = False

        if not self.api_key:
            errors.append("SerpAPI key not configured")
            return CrawlResult(
                platform=self.platform_name,
                posts=[],
                total_found=0,
                crawl_time_seconds=time.time() - start_time,
                errors=errors,
            )

        try:
            # Build search query
            query_parts = []

            # Add keywords
            for kw in keywords:
                query_parts.append(f'"{kw}"')

            query = " OR ".join(query_parts)

            # Add site filter if specified
            if site_filter:
                if not site_filter.startswith("site:"):
                    site_filter = f"site:{site_filter}"
                query = f"{query} {site_filter}"

            # Pagination
            start = 0
            while len(posts) < limit:
                params = {
                    "api_key": self.api_key,
                    "engine": "google",
                    "q": query,
                    "location": location,
                    "hl": language,
                    "gl": "us",
                    "num": min(num_results, 100),
                    "start": start,
                }

                await self.rate_limiter.acquire()

                try:
                    response = await self.client.get(
                        self.SERPAPI_BASE_URL,
                        params=params,
                    )

                    if response.status_code == 429:
                        rate_limited = True
                        self.rate_limiter.record_rate_limit_hit()
                        self.logger.warning("SerpAPI rate limit hit")
                        break

                    if response.status_code == 401:
                        errors.append("SerpAPI authentication failed - check API key")
                        self.rate_limiter.record_failure()
                        break

                    if response.status_code != 200:
                        error_msg = f"SerpAPI error: {response.status_code} - {response.text}"
                        errors.append(error_msg)
                        self.rate_limiter.record_failure()
                        self.logger.error(error_msg)
                        break

                    self.rate_limiter.record_success()

                    data = response.json()

                    # Check for API errors in response
                    if "error" in data:
                        errors.append(f"SerpAPI error: {data['error']}")
                        break

                    # Parse organic results
                    batch_posts = self.parser.parse_serpapi_response(
                        data, keywords=keywords
                    )
                    posts.extend(batch_posts)

                    # Parse related questions if requested and on first page
                    if include_related_questions and start == 0:
                        related = self.parser.parse_related_questions(
                            data, keywords=keywords
                        )
                        posts.extend(related)

                    # Check if there are more results
                    search_info = data.get("search_information", {})
                    total_results = search_info.get("total_results", 0)

                    if start + num_results >= total_results:
                        break

                    start += num_results

                except httpx.HTTPError as e:
                    self.rate_limiter.record_failure()
                    error_msg = f"HTTP error searching Google: {str(e)}"
                    errors.append(error_msg)
                    self.logger.error(error_msg)
                    break

        except Exception as e:
            self._log_error("search", e)
            errors.append(str(e))

        duration = time.time() - start_time

        result = CrawlResult(
            platform=self.platform_name,
            posts=posts[:limit],
            total_found=len(posts),
            crawl_time_seconds=duration,
            errors=errors,
            rate_limited=rate_limited,
        )

        self._log_crawl_complete("search", result, duration)
        return result

    async def get_recent(
        self,
        sources: list[str] | None = None,
        limit: int = 100,
        **kwargs: Any,
    ) -> CrawlResult:
        """Get recent content from specified sites.

        Args:
            sources: List of site domains to search within.
            limit: Maximum number of results to return.
            **kwargs: Additional parameters (including keywords).

        Returns:
            CrawlResult containing recent content.
        """
        keywords = kwargs.get("keywords", [])
        if not keywords and not sources:
            return CrawlResult(
                platform=self.platform_name,
                posts=[],
                total_found=0,
                crawl_time_seconds=0.0,
                errors=["Either keywords or sources must be specified"],
            )

        # Build site filter from sources
        site_filter = None
        if sources:
            site_parts = [f"site:{s}" for s in sources]
            site_filter = " OR ".join(site_parts)

        # Add time filter for recent content
        return await self.search(
            keywords=keywords or ["*"],
            limit=limit,
            site_filter=site_filter,
            **kwargs,
        )

    async def search_discussions(
        self,
        keywords: list[str],
        platforms: list[str] | None = None,
        limit: int = 100,
        **kwargs: Any,
    ) -> CrawlResult:
        """Search for discussions across multiple platforms.

        Args:
            keywords: List of keywords to search for.
            platforms: List of platforms to search (reddit, quora, etc.).
            limit: Maximum number of results to return.
            **kwargs: Additional parameters.

        Returns:
            CrawlResult containing discussions.
        """
        # Default platforms for discussions
        if not platforms:
            platforms = [
                "reddit.com",
                "quora.com",
                "stackoverflow.com",
                "news.ycombinator.com",
            ]

        # Build site filter
        site_parts = [f"site:{p}" for p in platforms]
        site_filter = " OR ".join(site_parts)

        return await self.search(
            keywords=keywords,
            limit=limit,
            site_filter=site_filter,
            **kwargs,
        )

    async def search_reddit(
        self,
        keywords: list[str],
        subreddits: list[str] | None = None,
        limit: int = 100,
        **kwargs: Any,
    ) -> CrawlResult:
        """Search Google for Reddit content.

        Args:
            keywords: List of keywords to search for.
            subreddits: Optional list of subreddits to search within.
            limit: Maximum number of results to return.
            **kwargs: Additional parameters.

        Returns:
            CrawlResult containing Reddit results.
        """
        # Build site filter
        if subreddits:
            site_parts = [f"site:reddit.com/r/{sub}" for sub in subreddits]
            site_filter = " OR ".join(site_parts)
        else:
            site_filter = "site:reddit.com"

        return await self.search(
            keywords=keywords,
            limit=limit,
            site_filter=site_filter,
            **kwargs,
        )

    async def search_quora(
        self,
        keywords: list[str],
        limit: int = 100,
        **kwargs: Any,
    ) -> CrawlResult:
        """Search Google for Quora content.

        Args:
            keywords: List of keywords to search for.
            limit: Maximum number of results to return.
            **kwargs: Additional parameters.

        Returns:
            CrawlResult containing Quora results.
        """
        return await self.search(
            keywords=keywords,
            limit=limit,
            site_filter="site:quora.com",
            **kwargs,
        )

    async def health_check(self) -> dict[str, Any]:
        """Check SerpAPI connectivity and account status.

        Returns:
            Dict with health status information.
        """
        base_health = await super().health_check()

        # Add rate limiter stats
        base_health["rate_limiter"] = self.rate_limiter.get_stats()
        base_health["api_key_configured"] = bool(self.api_key)

        # Check API connectivity
        if self._initialized and self.client and self.api_key:
            try:
                await self.rate_limiter.acquire()

                # Use account info endpoint to check connectivity
                response = await self.client.get(
                    "https://serpapi.com/account",
                    params={"api_key": self.api_key},
                )

                if response.status_code == 200:
                    data = response.json()
                    base_health["api_connected"] = True
                    base_health["account_info"] = {
                        "plan": data.get("plan"),
                        "searches_this_month": data.get("this_month_usage"),
                        "searches_limit": data.get("plan_searches_left"),
                    }
                    self.rate_limiter.record_success()
                elif response.status_code == 429:
                    base_health["api_connected"] = True
                    base_health["rate_limited"] = True
                    self.rate_limiter.record_rate_limit_hit()
                else:
                    base_health["api_connected"] = False
                    base_health["api_error"] = f"Status {response.status_code}"
                    self.rate_limiter.record_failure()

            except Exception as e:
                self.rate_limiter.record_failure()
                base_health["api_connected"] = False
                base_health["api_error"] = str(e)

        return base_health
