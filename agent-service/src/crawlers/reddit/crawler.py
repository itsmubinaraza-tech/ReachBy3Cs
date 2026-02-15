"""Reddit crawler implementation for ReachBy3Cs platform.

This module provides a crawler for Reddit using asyncpraw to search
for posts, monitor subreddits, and identify engagement opportunities.
"""

import asyncio
import logging
import time
from typing import Any

import asyncpraw
from asyncpraw.models import Submission

from src.config import get_settings
from src.crawlers.base import BaseCrawler, CrawledPost, CrawlResult
from src.crawlers.rate_limiter import RateLimitConfig, get_rate_limiter_manager
from src.crawlers.reddit.parser import RedditParser

logger = logging.getLogger(__name__)


class RedditCrawler(BaseCrawler):
    """Crawler for Reddit using asyncpraw.

    Searches Reddit for posts and comments matching specified keywords,
    monitors subreddits for new content, and identifies engagement opportunities.

    Attributes:
        platform_name: Identifier for this crawler ("reddit").
        reddit: asyncpraw Reddit instance.
        parser: RedditParser instance for parsing responses.
    """

    platform_name = "reddit"

    def __init__(self) -> None:
        """Initialize the Reddit crawler."""
        super().__init__()
        self.reddit: asyncpraw.Reddit | None = None
        self.parser = RedditParser()

        # Get rate limiter with Reddit's API limits
        # Reddit allows ~60 requests per minute for OAuth apps
        rate_limiter_manager = get_rate_limiter_manager()
        self.rate_limiter = rate_limiter_manager.get_or_create(
            name="reddit",
            config=RateLimitConfig(
                requests_per_minute=30,  # Conservative limit
                min_delay_seconds=0.5,
                max_delay_seconds=120.0,
            )
        )

    async def initialize(self) -> None:
        """Initialize the Reddit API client with credentials.

        Loads credentials from configuration and creates the asyncpraw
        Reddit instance.

        Raises:
            ValueError: If required credentials are not configured.
        """
        settings = get_settings()

        client_id = getattr(settings, 'reddit_client_id', '')
        client_secret = getattr(settings, 'reddit_client_secret', '')
        user_agent = getattr(settings, 'reddit_user_agent', 'ReachBy3Cs/1.0')

        if not client_id or not client_secret:
            self.logger.warning(
                "Reddit credentials not configured. "
                "Set REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET."
            )
            # Create read-only client for limited functionality
            self.reddit = asyncpraw.Reddit(
                client_id=client_id or "placeholder",
                client_secret=client_secret or "placeholder",
                user_agent=user_agent,
            )
        else:
            self.reddit = asyncpraw.Reddit(
                client_id=client_id,
                client_secret=client_secret,
                user_agent=user_agent,
            )

        self._initialized = True
        self.logger.info("Reddit crawler initialized")

    async def close(self) -> None:
        """Close the Reddit API client and clean up resources."""
        if self.reddit:
            await self.reddit.close()
            self.reddit = None
        self._initialized = False
        self.logger.info("Reddit crawler closed")

    async def search(
        self,
        keywords: list[str],
        subreddits: list[str] | None = None,
        limit: int = 100,
        time_filter: str = "week",
        sort: str = "relevance",
        include_comments: bool = False,
        **kwargs: Any,
    ) -> CrawlResult:
        """Search Reddit for posts matching keywords.

        Args:
            keywords: List of keywords to search for.
            subreddits: Optional list of subreddits to search within.
            limit: Maximum number of results to return.
            time_filter: Time filter (hour, day, week, month, year, all).
            sort: Sort order (relevance, hot, top, new, comments).
            include_comments: Whether to include comments in search.
            **kwargs: Additional parameters.

        Returns:
            CrawlResult containing matching posts.
        """
        if not self._initialized or not self.reddit:
            await self.initialize()

        self._log_crawl_start(
            "search",
            keywords=keywords,
            subreddits=subreddits,
            limit=limit,
        )

        start_time = time.time()
        posts: list[CrawledPost] = []
        errors: list[str] = []
        rate_limited = False

        try:
            # Build search query
            query = " OR ".join(f'"{kw}"' for kw in keywords)

            # Search in specific subreddits or all of Reddit
            if subreddits:
                for subreddit_name in subreddits:
                    try:
                        await self.rate_limiter.acquire()

                        subreddit = await self.reddit.subreddit(subreddit_name)
                        async for submission in subreddit.search(
                            query,
                            limit=limit // len(subreddits),
                            time_filter=time_filter,
                            sort=sort,
                        ):
                            matched_keywords = self.parser.find_matching_keywords(
                                f"{submission.title} {getattr(submission, 'selftext', '')}",
                                keywords,
                            )
                            if matched_keywords:
                                post = self.parser.parse_submission(
                                    submission,
                                    keywords_matched=matched_keywords,
                                )
                                posts.append(post)

                        self.rate_limiter.record_success()

                    except Exception as e:
                        self.rate_limiter.record_failure()
                        error_msg = f"Error searching r/{subreddit_name}: {str(e)}"
                        errors.append(error_msg)
                        self.logger.error(error_msg)
            else:
                # Search all of Reddit
                try:
                    await self.rate_limiter.acquire()

                    async for submission in self.reddit.subreddit("all").search(
                        query,
                        limit=limit,
                        time_filter=time_filter,
                        sort=sort,
                    ):
                        matched_keywords = self.parser.find_matching_keywords(
                            f"{submission.title} {getattr(submission, 'selftext', '')}",
                            keywords,
                        )
                        if matched_keywords:
                            post = self.parser.parse_submission(
                                submission,
                                keywords_matched=matched_keywords,
                            )
                            posts.append(post)

                    self.rate_limiter.record_success()

                except Exception as e:
                    self.rate_limiter.record_failure()
                    if "429" in str(e) or "rate limit" in str(e).lower():
                        rate_limited = True
                        self.rate_limiter.record_rate_limit_hit()
                    error_msg = f"Error searching Reddit: {str(e)}"
                    errors.append(error_msg)
                    self.logger.error(error_msg)

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
        """Get recent posts from monitored subreddits.

        Args:
            sources: List of subreddits to monitor (without r/ prefix).
            limit: Maximum number of results to return.
            **kwargs: Additional parameters.

        Returns:
            CrawlResult containing recent posts.
        """
        return await self.monitor_subreddits(
            subreddits=sources or [],
            limit=limit,
            **kwargs,
        )

    async def monitor_subreddits(
        self,
        subreddits: list[str],
        limit: int = 100,
        sort: str = "new",
        **kwargs: Any,
    ) -> CrawlResult:
        """Monitor subreddits for recent posts.

        Args:
            subreddits: List of subreddits to monitor (without r/ prefix).
            limit: Maximum number of results per subreddit.
            sort: Sort order (new, hot, rising, top).
            **kwargs: Additional parameters.

        Returns:
            CrawlResult containing recent posts.
        """
        if not self._initialized or not self.reddit:
            await self.initialize()

        self._log_crawl_start(
            "monitor",
            subreddits=subreddits,
            limit=limit,
            sort=sort,
        )

        start_time = time.time()
        posts: list[CrawledPost] = []
        errors: list[str] = []
        rate_limited = False

        for subreddit_name in subreddits:
            try:
                await self.rate_limiter.acquire()

                subreddit = await self.reddit.subreddit(subreddit_name)

                # Get posts based on sort type
                if sort == "new":
                    submissions = subreddit.new(limit=limit)
                elif sort == "hot":
                    submissions = subreddit.hot(limit=limit)
                elif sort == "rising":
                    submissions = subreddit.rising(limit=limit)
                elif sort == "top":
                    submissions = subreddit.top(limit=limit, time_filter="day")
                else:
                    submissions = subreddit.new(limit=limit)

                async for submission in submissions:
                    post = self.parser.parse_submission(submission)
                    posts.append(post)

                self.rate_limiter.record_success()

            except Exception as e:
                self.rate_limiter.record_failure()
                if "429" in str(e) or "rate limit" in str(e).lower():
                    rate_limited = True
                    self.rate_limiter.record_rate_limit_hit()
                error_msg = f"Error monitoring r/{subreddit_name}: {str(e)}"
                errors.append(error_msg)
                self.logger.error(error_msg)

        duration = time.time() - start_time

        result = CrawlResult(
            platform=self.platform_name,
            posts=posts,
            total_found=len(posts),
            crawl_time_seconds=duration,
            errors=errors,
            rate_limited=rate_limited,
        )

        self._log_crawl_complete("monitor", result, duration)
        return result

    async def get_post_comments(
        self,
        post_id: str,
        limit: int = 100,
        sort: str = "best",
        keywords: list[str] | None = None,
    ) -> CrawlResult:
        """Get comments for a specific Reddit post.

        Args:
            post_id: Reddit post ID (without prefix).
            limit: Maximum number of comments to return.
            sort: Sort order (best, top, new, controversial, old, qa).
            keywords: Optional keywords to filter comments.

        Returns:
            CrawlResult containing post comments.
        """
        if not self._initialized or not self.reddit:
            await self.initialize()

        self._log_crawl_start(
            "comments",
            post_id=post_id,
            limit=limit,
        )

        start_time = time.time()
        posts: list[CrawledPost] = []
        errors: list[str] = []

        try:
            await self.rate_limiter.acquire()

            submission = await self.reddit.submission(id=post_id)
            submission.comment_sort = sort

            # Replace MoreComments with actual comments
            await submission.comments.replace_more(limit=0)

            comments = submission.comments.list()

            for comment in comments[:limit]:
                if hasattr(comment, 'body'):
                    matched_keywords = []
                    if keywords:
                        matched_keywords = self.parser.find_matching_keywords(
                            comment.body, keywords
                        )
                        if not matched_keywords:
                            continue

                    post = self.parser.parse_comment(
                        comment,
                        keywords_matched=matched_keywords,
                    )
                    posts.append(post)

            self.rate_limiter.record_success()

        except Exception as e:
            self.rate_limiter.record_failure()
            self._log_error("comments", e)
            errors.append(str(e))

        duration = time.time() - start_time

        result = CrawlResult(
            platform=self.platform_name,
            posts=posts,
            total_found=len(posts),
            crawl_time_seconds=duration,
            errors=errors,
        )

        self._log_crawl_complete("comments", result, duration)
        return result

    async def health_check(self) -> dict[str, Any]:
        """Check Reddit API connectivity and rate limit status.

        Returns:
            Dict with health status information.
        """
        base_health = await super().health_check()

        # Add rate limiter stats
        base_health["rate_limiter"] = self.rate_limiter.get_stats()

        # Check API connectivity
        if self._initialized and self.reddit:
            try:
                await self.rate_limiter.acquire()
                # Try to get a simple piece of data
                user = await self.reddit.user.me()
                base_health["api_connected"] = True
                base_health["authenticated"] = user is not None
                self.rate_limiter.record_success()
            except Exception as e:
                self.rate_limiter.record_failure()
                base_health["api_connected"] = False
                base_health["api_error"] = str(e)

        return base_health
