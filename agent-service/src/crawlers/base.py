"""Abstract base crawler class for all platform crawlers.

This module defines the interface and common functionality that all
platform-specific crawlers must implement.
"""

import logging
from abc import ABC, abstractmethod
from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class ContentType(str, Enum):
    """Types of content that can be crawled."""

    POST = "post"
    COMMENT = "comment"
    REPLY = "reply"
    THREAD = "thread"
    QUESTION = "question"
    ANSWER = "answer"
    TWEET = "tweet"
    RETWEET = "retweet"
    SEARCH_RESULT = "search_result"


class CrawledPost(BaseModel):
    """Represents a single piece of crawled content from any platform.

    Attributes:
        external_id: Unique identifier from the source platform.
        external_url: Direct URL to the content on the source platform.
        content: The text content of the post/comment/etc.
        content_type: Type of content (post, comment, reply, thread, etc.).
        author_handle: Username or handle of the author.
        author_display_name: Display name of the author.
        platform_metadata: Platform-specific metadata.
        external_created_at: When the content was created on the source platform.
        crawled_at: When this content was crawled.
        platform: Name of the source platform.
        keywords_matched: Keywords that matched this content during search.
        engagement_metrics: Engagement metrics (likes, shares, comments, etc.).
        parent_id: ID of parent post/comment if this is a reply.
        raw_data: Raw response data for debugging.
    """

    external_id: str = Field(..., description="Unique ID from source platform")
    external_url: str = Field(..., description="URL to content on source platform")
    content: str = Field(..., description="Text content")
    content_type: ContentType = Field(..., description="Type of content")
    author_handle: str | None = Field(None, description="Author's username/handle")
    author_display_name: str | None = Field(None, description="Author's display name")
    platform_metadata: dict[str, Any] = Field(
        default_factory=dict, description="Platform-specific metadata"
    )
    external_created_at: datetime | None = Field(
        None, description="Creation time on source platform"
    )
    crawled_at: datetime = Field(
        default_factory=datetime.utcnow, description="When content was crawled"
    )
    platform: str = Field(..., description="Source platform name")
    keywords_matched: list[str] = Field(
        default_factory=list, description="Keywords that matched"
    )
    engagement_metrics: dict[str, int] = Field(
        default_factory=dict, description="Engagement metrics"
    )
    parent_id: str | None = Field(None, description="Parent post/comment ID")
    raw_data: dict[str, Any] | None = Field(
        None, description="Raw response data for debugging"
    )

    class Config:
        """Pydantic model configuration."""

        json_encoders = {datetime: lambda v: v.isoformat()}


class CrawlResult(BaseModel):
    """Result of a crawl operation.

    Attributes:
        platform: Name of the platform crawled.
        posts: List of crawled posts.
        total_found: Total number of results found.
        crawl_time_seconds: Time taken to complete crawl.
        errors: Any errors encountered during crawl.
        rate_limited: Whether rate limiting was hit.
        next_cursor: Pagination cursor for next page.
    """

    platform: str
    posts: list[CrawledPost] = Field(default_factory=list)
    total_found: int = 0
    crawl_time_seconds: float = 0.0
    errors: list[str] = Field(default_factory=list)
    rate_limited: bool = False
    next_cursor: str | None = None


class BaseCrawler(ABC):
    """Abstract base class for all platform crawlers.

    All platform-specific crawlers must inherit from this class and
    implement the required abstract methods.

    Attributes:
        platform_name: Name of the platform this crawler targets.
        rate_limiter: Rate limiter instance for this crawler.
        logger: Logger instance for this crawler.
    """

    platform_name: str = "unknown"

    def __init__(self) -> None:
        """Initialize the base crawler."""
        self.logger = logging.getLogger(f"{__name__}.{self.platform_name}")
        self._initialized = False

    @abstractmethod
    async def initialize(self) -> None:
        """Initialize the crawler with necessary credentials and setup.

        Must be called before any crawl operations.
        """
        pass

    @abstractmethod
    async def close(self) -> None:
        """Clean up resources and close connections."""
        pass

    @abstractmethod
    async def search(
        self,
        keywords: list[str],
        subreddits: list[str] | None = None,
        limit: int = 100,
        **kwargs: Any,
    ) -> CrawlResult:
        """Search for posts matching keywords.

        Args:
            keywords: List of keywords to search for.
            subreddits: Optional list of subreddits/communities to search.
            limit: Maximum number of results to return.
            **kwargs: Additional platform-specific parameters.

        Returns:
            CrawlResult containing matching posts.
        """
        pass

    @abstractmethod
    async def get_recent(
        self,
        sources: list[str] | None = None,
        limit: int = 100,
        **kwargs: Any,
    ) -> CrawlResult:
        """Get recent posts from monitored sources.

        Args:
            sources: Optional list of specific sources to monitor.
            limit: Maximum number of results to return.
            **kwargs: Additional platform-specific parameters.

        Returns:
            CrawlResult containing recent posts.
        """
        pass

    async def health_check(self) -> dict[str, Any]:
        """Check if the crawler is healthy and can connect to the platform.

        Returns:
            Dict with health status information.
        """
        return {
            "platform": self.platform_name,
            "initialized": self._initialized,
            "status": "healthy" if self._initialized else "not_initialized",
        }

    def _log_crawl_start(self, operation: str, **kwargs: Any) -> None:
        """Log the start of a crawl operation."""
        self.logger.info(
            "Starting %s crawl on %s: %s",
            operation,
            self.platform_name,
            kwargs,
        )

    def _log_crawl_complete(
        self, operation: str, result: CrawlResult, duration: float
    ) -> None:
        """Log completion of a crawl operation."""
        self.logger.info(
            "Completed %s crawl on %s: found %d posts in %.2fs",
            operation,
            self.platform_name,
            len(result.posts),
            duration,
        )

    def _log_error(self, operation: str, error: Exception) -> None:
        """Log an error during crawl operation."""
        self.logger.error(
            "Error during %s crawl on %s: %s",
            operation,
            self.platform_name,
            str(error),
            exc_info=True,
        )
