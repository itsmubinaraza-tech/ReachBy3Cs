"""Quora crawler implementation for ReachBy3Cs platform.

This module provides a crawler for Quora using web scraping with
aiohttp and BeautifulSoup to find questions and answers.
"""

import asyncio
import logging
import random
import time
from typing import Any
from urllib.parse import quote, urljoin

import aiohttp

from src.config import get_settings
from src.crawlers.base import BaseCrawler, CrawledPost, CrawlResult
from src.crawlers.rate_limiter import RateLimitConfig, get_rate_limiter_manager
from src.crawlers.quora.parser import QuoraParser

logger = logging.getLogger(__name__)


class QuoraCrawler(BaseCrawler):
    """Crawler for Quora using web scraping.

    Scrapes Quora search results and question pages to find
    engagement opportunities. Implements respectful crawling
    with delays and user agent rotation.

    Attributes:
        platform_name: Identifier for this crawler ("quora").
        session: aiohttp ClientSession for HTTP requests.
        parser: QuoraParser instance for parsing HTML.
    """

    platform_name = "quora"
    BASE_URL = "https://www.quora.com"

    # Rotate user agents to avoid detection
    USER_AGENTS = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    ]

    def __init__(self) -> None:
        """Initialize the Quora crawler."""
        super().__init__()
        self.session: aiohttp.ClientSession | None = None
        self.parser = QuoraParser()

        # Get rate limiter with conservative limits for web scraping
        rate_limiter_manager = get_rate_limiter_manager()
        self.rate_limiter = rate_limiter_manager.get_or_create(
            name="quora",
            config=RateLimitConfig(
                requests_per_minute=10,  # Very conservative for scraping
                min_delay_seconds=3.0,  # Minimum 3 seconds between requests
                max_delay_seconds=120.0,
            )
        )

    def _get_random_user_agent(self) -> str:
        """Get a random user agent string.

        Returns:
            Random user agent string.
        """
        return random.choice(self.USER_AGENTS)

    def _get_headers(self) -> dict[str, str]:
        """Get headers for HTTP requests.

        Returns:
            Dict of HTTP headers.
        """
        return {
            "User-Agent": self._get_random_user_agent(),
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate, br",
            "Connection": "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "none",
            "Sec-Fetch-User": "?1",
            "DNT": "1",
        }

    async def initialize(self) -> None:
        """Initialize the HTTP session for web scraping."""
        if self.session:
            await self.session.close()

        # Create connector with connection limits
        connector = aiohttp.TCPConnector(
            limit=5,  # Max concurrent connections
            limit_per_host=2,  # Max connections per host
        )

        self.session = aiohttp.ClientSession(
            connector=connector,
            timeout=aiohttp.ClientTimeout(total=30),
        )

        self._initialized = True
        self.logger.info("Quora crawler initialized")

    async def close(self) -> None:
        """Close the HTTP session and clean up resources."""
        if self.session:
            await self.session.close()
            self.session = None
        self._initialized = False
        self.logger.info("Quora crawler closed")

    async def _fetch_page(self, url: str) -> str | None:
        """Fetch a page with rate limiting and error handling.

        Args:
            url: URL to fetch.

        Returns:
            HTML content or None if fetch failed.
        """
        if not self.session:
            await self.initialize()

        await self.rate_limiter.acquire()

        # Add random jitter to appear more human-like
        jitter = random.uniform(0.5, 2.0)
        await asyncio.sleep(jitter)

        try:
            async with self.session.get(
                url,
                headers=self._get_headers(),
                allow_redirects=True,
            ) as response:
                if response.status == 200:
                    self.rate_limiter.record_success()
                    return await response.text()
                elif response.status == 429:
                    self.rate_limiter.record_rate_limit_hit()
                    self.logger.warning(f"Rate limited by Quora: {url}")
                    return None
                elif response.status == 403:
                    self.rate_limiter.record_failure()
                    self.logger.warning(f"Access forbidden by Quora: {url}")
                    return None
                else:
                    self.rate_limiter.record_failure()
                    self.logger.warning(
                        f"Unexpected status {response.status} fetching {url}"
                    )
                    return None

        except aiohttp.ClientError as e:
            self.rate_limiter.record_failure()
            self.logger.error(f"Error fetching {url}: {e}")
            return None
        except asyncio.TimeoutError:
            self.rate_limiter.record_failure()
            self.logger.error(f"Timeout fetching {url}")
            return None

    async def search(
        self,
        keywords: list[str],
        subreddits: list[str] | None = None,  # Unused, for interface compatibility
        limit: int = 100,
        include_answers: bool = False,
        **kwargs: Any,
    ) -> CrawlResult:
        """Search Quora for questions matching keywords.

        Args:
            keywords: List of keywords to search for.
            subreddits: Unused, for interface compatibility with BaseCrawler.
            limit: Maximum number of results to return.
            include_answers: Whether to fetch answers for each question.
            **kwargs: Additional parameters.

        Returns:
            CrawlResult containing matching questions.
        """
        if not self._initialized or not self.session:
            await self.initialize()

        self._log_crawl_start(
            "search",
            keywords=keywords,
            limit=limit,
        )

        start_time = time.time()
        posts: list[CrawledPost] = []
        errors: list[str] = []
        rate_limited = False

        try:
            # Search for each keyword
            for keyword in keywords:
                if len(posts) >= limit:
                    break

                # Build search URL
                search_url = f"{self.BASE_URL}/search?q={quote(keyword)}&type=question"

                html = await self._fetch_page(search_url)

                if html is None:
                    if "rate" in str(html).lower():
                        rate_limited = True
                    continue

                # Parse search results
                results = self.parser.parse_search_results(
                    html,
                    keywords=[keyword],
                )

                # Add matched keywords from search
                for post in results:
                    if keyword.lower() not in [k.lower() for k in post.keywords_matched]:
                        post.keywords_matched.append(keyword)

                posts.extend(results)

                # Optionally fetch answers for each question
                if include_answers and results:
                    for question in results[:5]:  # Limit to first 5 questions
                        if len(posts) >= limit:
                            break

                        question_html = await self._fetch_page(question.external_url)
                        if question_html:
                            _, answers = self.parser.parse_question_page(
                                question_html,
                                question.external_url,
                                keywords=[keyword],
                            )
                            posts.extend(answers[:3])  # Limit to 3 answers per question

        except Exception as e:
            self._log_error("search", e)
            errors.append(str(e))

        duration = time.time() - start_time

        # Deduplicate posts by external_id
        seen_ids: set[str] = set()
        unique_posts: list[CrawledPost] = []
        for post in posts:
            if post.external_id not in seen_ids:
                seen_ids.add(post.external_id)
                unique_posts.append(post)

        result = CrawlResult(
            platform=self.platform_name,
            posts=unique_posts[:limit],
            total_found=len(unique_posts),
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
        """Get recent questions from Quora topics.

        Args:
            sources: List of topic names to monitor.
            limit: Maximum number of results to return.
            **kwargs: Additional parameters.

        Returns:
            CrawlResult containing recent questions.
        """
        if not sources:
            return CrawlResult(
                platform=self.platform_name,
                posts=[],
                total_found=0,
                crawl_time_seconds=0.0,
                errors=["No topics specified for get_recent"],
            )

        if not self._initialized or not self.session:
            await self.initialize()

        self._log_crawl_start(
            "get_recent",
            sources=sources,
            limit=limit,
        )

        start_time = time.time()
        posts: list[CrawledPost] = []
        errors: list[str] = []
        rate_limited = False

        try:
            for topic in sources:
                if len(posts) >= limit:
                    break

                # Build topic URL
                topic_slug = topic.replace(" ", "-")
                topic_url = f"{self.BASE_URL}/topic/{quote(topic_slug)}"

                html = await self._fetch_page(topic_url)

                if html is None:
                    continue

                # Parse topic page (similar to search results)
                results = self.parser.parse_search_results(html)
                posts.extend(results)

        except Exception as e:
            self._log_error("get_recent", e)
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

        self._log_crawl_complete("get_recent", result, duration)
        return result

    async def get_question_with_answers(
        self,
        question_url: str,
        keywords: list[str] | None = None,
    ) -> CrawlResult:
        """Get a specific question and its answers.

        Args:
            question_url: URL of the Quora question.
            keywords: Optional keywords to match.

        Returns:
            CrawlResult containing question and answers.
        """
        if not self._initialized or not self.session:
            await self.initialize()

        start_time = time.time()
        posts: list[CrawledPost] = []
        errors: list[str] = []

        try:
            html = await self._fetch_page(question_url)

            if html:
                question, answers = self.parser.parse_question_page(
                    html,
                    question_url,
                    keywords=keywords,
                )
                if question:
                    posts.append(question)
                posts.extend(answers)
            else:
                errors.append(f"Failed to fetch question: {question_url}")

        except Exception as e:
            self._log_error("get_question_with_answers", e)
            errors.append(str(e))

        duration = time.time() - start_time

        return CrawlResult(
            platform=self.platform_name,
            posts=posts,
            total_found=len(posts),
            crawl_time_seconds=duration,
            errors=errors,
        )

    async def health_check(self) -> dict[str, Any]:
        """Check Quora connectivity.

        Returns:
            Dict with health status information.
        """
        base_health = await super().health_check()

        # Add rate limiter stats
        base_health["rate_limiter"] = self.rate_limiter.get_stats()

        # Check connectivity by fetching the homepage
        if self._initialized and self.session:
            try:
                html = await self._fetch_page(self.BASE_URL)
                base_health["api_connected"] = html is not None
                if html is None:
                    base_health["api_error"] = "Failed to fetch Quora homepage"
            except Exception as e:
                base_health["api_connected"] = False
                base_health["api_error"] = str(e)

        return base_health
