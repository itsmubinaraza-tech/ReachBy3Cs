"""Twitter/X crawler implementation for ReachBy3Cs platform.

This module provides a crawler for Twitter/X using the Twitter API v2
to search for tweets and identify engagement opportunities.
"""

import logging
import time
from typing import Any
from urllib.parse import quote

import httpx

from src.config import get_settings
from src.crawlers.base import BaseCrawler, CrawledPost, CrawlResult
from src.crawlers.rate_limiter import RateLimitConfig, get_rate_limiter_manager
from src.crawlers.twitter.parser import TwitterParser

logger = logging.getLogger(__name__)


class TwitterCrawler(BaseCrawler):
    """Crawler for Twitter/X using API v2.

    Searches Twitter for tweets matching specified keywords and
    identifies engagement opportunities.

    Attributes:
        platform_name: Identifier for this crawler ("twitter").
        client: httpx AsyncClient for API requests.
        parser: TwitterParser instance for parsing responses.
    """

    platform_name = "twitter"
    API_BASE_URL = "https://api.twitter.com/2"

    def __init__(self) -> None:
        """Initialize the Twitter crawler."""
        super().__init__()
        self.client: httpx.AsyncClient | None = None
        self.parser = TwitterParser()
        self.bearer_token: str = ""

        # Get rate limiter with Twitter's API limits
        # Twitter API v2 Basic tier: 10,000 tweets/month, 60 requests/15 min
        rate_limiter_manager = get_rate_limiter_manager()
        self.rate_limiter = rate_limiter_manager.get_or_create(
            name="twitter",
            config=RateLimitConfig(
                requests_per_minute=4,  # ~60 requests per 15 minutes
                requests_per_hour=60,
                min_delay_seconds=1.0,
                max_delay_seconds=300.0,
            )
        )

    async def initialize(self) -> None:
        """Initialize the Twitter API client with credentials.

        Loads credentials from configuration and creates the HTTP client.

        Raises:
            ValueError: If required credentials are not configured.
        """
        settings = get_settings()

        self.bearer_token = getattr(settings, 'twitter_bearer_token', '')

        if not self.bearer_token:
            self.logger.warning(
                "Twitter bearer token not configured. "
                "Set TWITTER_BEARER_TOKEN environment variable."
            )

        self.client = httpx.AsyncClient(
            base_url=self.API_BASE_URL,
            headers={
                "Authorization": f"Bearer {self.bearer_token}",
                "Content-Type": "application/json",
            },
            timeout=30.0,
        )

        self._initialized = True
        self.logger.info("Twitter crawler initialized")

    async def close(self) -> None:
        """Close the HTTP client and clean up resources."""
        if self.client:
            await self.client.aclose()
            self.client = None
        self._initialized = False
        self.logger.info("Twitter crawler closed")

    async def search(
        self,
        keywords: list[str],
        subreddits: list[str] | None = None,  # Unused, for interface compatibility
        limit: int = 100,
        start_time: str | None = None,
        end_time: str | None = None,
        max_results_per_request: int = 10,
        **kwargs: Any,
    ) -> CrawlResult:
        """Search Twitter for tweets matching keywords.

        Args:
            keywords: List of keywords to search for.
            subreddits: Unused, for interface compatibility with BaseCrawler.
            limit: Maximum number of results to return.
            start_time: ISO 8601 timestamp for start of search period.
            end_time: ISO 8601 timestamp for end of search period.
            max_results_per_request: Results per API request (10-100).
            **kwargs: Additional parameters.

        Returns:
            CrawlResult containing matching tweets.
        """
        if not self._initialized or not self.client:
            await self.initialize()

        self._log_crawl_start(
            "search",
            keywords=keywords,
            limit=limit,
        )

        crawl_start_time = time.time()
        posts: list[CrawledPost] = []
        errors: list[str] = []
        rate_limited = False
        next_cursor: str | None = None

        if not self.bearer_token:
            errors.append("Twitter bearer token not configured")
            return CrawlResult(
                platform=self.platform_name,
                posts=[],
                total_found=0,
                crawl_time_seconds=time.time() - crawl_start_time,
                errors=errors,
            )

        try:
            # Build search query
            # Twitter search supports OR operator
            query = " OR ".join(f'"{kw}"' for kw in keywords)

            # Exclude retweets by default to get original content
            query += " -is:retweet"

            # Request tweet fields
            tweet_fields = [
                "id",
                "text",
                "author_id",
                "created_at",
                "conversation_id",
                "public_metrics",
                "entities",
                "referenced_tweets",
                "lang",
                "source",
                "possibly_sensitive",
                "reply_settings",
            ]

            # Request user fields
            user_fields = [
                "id",
                "name",
                "username",
                "verified",
                "public_metrics",
                "description",
            ]

            # Request expansions
            expansions = ["author_id", "referenced_tweets.id"]

            params: dict[str, Any] = {
                "query": query,
                "max_results": min(max_results_per_request, 100),
                "tweet.fields": ",".join(tweet_fields),
                "user.fields": ",".join(user_fields),
                "expansions": ",".join(expansions),
            }

            if start_time:
                params["start_time"] = start_time
            if end_time:
                params["end_time"] = end_time

            # Paginate through results
            while len(posts) < limit:
                if next_cursor:
                    params["next_token"] = next_cursor

                await self.rate_limiter.acquire()

                try:
                    response = await self.client.get(
                        "/tweets/search/recent",
                        params=params,
                    )

                    if response.status_code == 429:
                        rate_limited = True
                        self.rate_limiter.record_rate_limit_hit()
                        self.logger.warning("Twitter rate limit hit")
                        break

                    if response.status_code == 401:
                        errors.append("Twitter authentication failed - check bearer token")
                        self.rate_limiter.record_failure()
                        break

                    if response.status_code != 200:
                        error_msg = f"Twitter API error: {response.status_code} - {response.text}"
                        errors.append(error_msg)
                        self.rate_limiter.record_failure()
                        self.logger.error(error_msg)
                        break

                    self.rate_limiter.record_success()

                    data = response.json()

                    # Parse tweets
                    batch_posts, next_cursor = self.parser.parse_search_response(
                        data, keywords=keywords
                    )

                    posts.extend(batch_posts)

                    # Check if there are more results
                    if not next_cursor:
                        break

                except httpx.HTTPError as e:
                    self.rate_limiter.record_failure()
                    error_msg = f"HTTP error searching Twitter: {str(e)}"
                    errors.append(error_msg)
                    self.logger.error(error_msg)
                    break

        except Exception as e:
            self._log_error("search", e)
            errors.append(str(e))

        duration = time.time() - crawl_start_time

        result = CrawlResult(
            platform=self.platform_name,
            posts=posts[:limit],
            total_found=len(posts),
            crawl_time_seconds=duration,
            errors=errors,
            rate_limited=rate_limited,
            next_cursor=next_cursor,
        )

        self._log_crawl_complete("search", result, duration)
        return result

    async def get_recent(
        self,
        sources: list[str] | None = None,
        limit: int = 100,
        **kwargs: Any,
    ) -> CrawlResult:
        """Get recent tweets from specified users or topics.

        Args:
            sources: List of usernames (without @) to get tweets from.
            limit: Maximum number of results to return.
            **kwargs: Additional parameters.

        Returns:
            CrawlResult containing recent tweets.
        """
        if not sources:
            return CrawlResult(
                platform=self.platform_name,
                posts=[],
                total_found=0,
                crawl_time_seconds=0.0,
                errors=["No sources specified for get_recent"],
            )

        # Build query to get tweets from specific users
        query_parts = [f"from:{username}" for username in sources]
        query = " OR ".join(query_parts)

        return await self._search_with_query(query, limit=limit, **kwargs)

    async def _search_with_query(
        self,
        query: str,
        limit: int = 100,
        **kwargs: Any,
    ) -> CrawlResult:
        """Search Twitter with a raw query string.

        Args:
            query: Twitter search query.
            limit: Maximum number of results to return.
            **kwargs: Additional parameters.

        Returns:
            CrawlResult containing matching tweets.
        """
        if not self._initialized or not self.client:
            await self.initialize()

        crawl_start_time = time.time()
        posts: list[CrawledPost] = []
        errors: list[str] = []
        rate_limited = False
        next_cursor: str | None = None

        if not self.bearer_token:
            errors.append("Twitter bearer token not configured")
            return CrawlResult(
                platform=self.platform_name,
                posts=[],
                total_found=0,
                crawl_time_seconds=time.time() - crawl_start_time,
                errors=errors,
            )

        try:
            tweet_fields = [
                "id", "text", "author_id", "created_at",
                "conversation_id", "public_metrics", "entities",
            ]
            user_fields = ["id", "name", "username", "verified", "public_metrics"]
            expansions = ["author_id"]

            params: dict[str, Any] = {
                "query": query,
                "max_results": min(kwargs.get("max_results_per_request", 10), 100),
                "tweet.fields": ",".join(tweet_fields),
                "user.fields": ",".join(user_fields),
                "expansions": ",".join(expansions),
            }

            while len(posts) < limit:
                if next_cursor:
                    params["next_token"] = next_cursor

                await self.rate_limiter.acquire()

                response = await self.client.get(
                    "/tweets/search/recent",
                    params=params,
                )

                if response.status_code == 429:
                    rate_limited = True
                    self.rate_limiter.record_rate_limit_hit()
                    break

                if response.status_code != 200:
                    errors.append(f"Twitter API error: {response.status_code}")
                    self.rate_limiter.record_failure()
                    break

                self.rate_limiter.record_success()
                data = response.json()

                batch_posts, next_cursor = self.parser.parse_search_response(data)
                posts.extend(batch_posts)

                if not next_cursor:
                    break

        except Exception as e:
            self._log_error("search_with_query", e)
            errors.append(str(e))

        duration = time.time() - crawl_start_time

        return CrawlResult(
            platform=self.platform_name,
            posts=posts[:limit],
            total_found=len(posts),
            crawl_time_seconds=duration,
            errors=errors,
            rate_limited=rate_limited,
            next_cursor=next_cursor,
        )

    async def get_conversation(
        self,
        conversation_id: str,
        limit: int = 100,
    ) -> CrawlResult:
        """Get tweets from a conversation thread.

        Args:
            conversation_id: Twitter conversation ID.
            limit: Maximum number of tweets to return.

        Returns:
            CrawlResult containing conversation tweets.
        """
        query = f"conversation_id:{conversation_id}"
        return await self._search_with_query(query, limit=limit)

    async def health_check(self) -> dict[str, Any]:
        """Check Twitter API connectivity and rate limit status.

        Returns:
            Dict with health status information.
        """
        base_health = await super().health_check()

        # Add rate limiter stats
        base_health["rate_limiter"] = self.rate_limiter.get_stats()
        base_health["bearer_token_configured"] = bool(self.bearer_token)

        # Check API connectivity
        if self._initialized and self.client and self.bearer_token:
            try:
                await self.rate_limiter.acquire()

                # Use a simple API call to check connectivity
                response = await self.client.get(
                    "/tweets/search/recent",
                    params={"query": "test", "max_results": 10},
                )

                if response.status_code == 200:
                    base_health["api_connected"] = True
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
