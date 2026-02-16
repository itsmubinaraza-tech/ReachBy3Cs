"""Abstract base poster class for all platform posters.

This module defines the interface and common functionality that all
platform-specific posters must implement.
"""

import logging
from abc import ABC, abstractmethod
from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class PostingError(Exception):
    """Exception raised when posting fails."""

    def __init__(
        self,
        message: str,
        platform: str,
        error_code: str | None = None,
        retryable: bool = True,
        original_error: Exception | None = None,
    ):
        """Initialize PostingError.

        Args:
            message: Error message.
            platform: Platform where error occurred.
            error_code: Platform-specific error code.
            retryable: Whether the operation can be retried.
            original_error: Original exception that caused this error.
        """
        super().__init__(message)
        self.platform = platform
        self.error_code = error_code
        self.retryable = retryable
        self.original_error = original_error


class PostResult(BaseModel):
    """Result of a posting operation.

    Attributes:
        success: Whether the post was successful.
        external_id: ID of the post on the platform.
        external_url: URL of the post on the platform.
        error: Error message if posting failed.
        error_code: Platform-specific error code.
        posted_at: Timestamp when the post was created.
        retryable: Whether a failed post can be retried.
        platform: Name of the platform.
        method: How the post was made (api, clipboard, manual).
        metadata: Additional platform-specific metadata.
    """

    success: bool = Field(description="Whether the post was successful")
    external_id: str | None = Field(None, description="ID on the platform")
    external_url: str | None = Field(None, description="URL on the platform")
    error: str | None = Field(None, description="Error message if failed")
    error_code: str | None = Field(None, description="Platform error code")
    posted_at: datetime | None = Field(None, description="When the post was created")
    retryable: bool = Field(True, description="Whether failure can be retried")
    platform: str = Field("", description="Platform name")
    method: str = Field("api", description="Posting method used")
    metadata: dict[str, Any] = Field(default_factory=dict, description="Extra metadata")

    class Config:
        """Pydantic model configuration."""

        json_encoders = {datetime: lambda v: v.isoformat()}


class BasePoster(ABC):
    """Abstract base class for all platform posters.

    All platform-specific posters must inherit from this class and
    implement the required abstract methods.

    Attributes:
        platform_name: Name of the platform this poster targets.
        logger: Logger instance for this poster.
    """

    platform_name: str = "unknown"

    def __init__(self) -> None:
        """Initialize the base poster."""
        self.logger = logging.getLogger(f"{__name__}.{self.platform_name}")
        self._initialized = False

    @abstractmethod
    async def initialize(self) -> None:
        """Initialize the poster with necessary credentials and setup.

        Must be called before any post operations.
        """
        pass

    @abstractmethod
    async def close(self) -> None:
        """Clean up resources and close connections."""
        pass

    @abstractmethod
    async def post(
        self,
        response_text: str,
        target_url: str,
        **kwargs: Any,
    ) -> PostResult:
        """Post a response to the platform.

        Args:
            response_text: The text to post.
            target_url: URL of the content to respond to.
            **kwargs: Additional platform-specific parameters.

        Returns:
            PostResult with success status and details.
        """
        pass

    @abstractmethod
    async def verify_posted(self, external_id: str) -> bool:
        """Verify that a post exists on the platform.

        Args:
            external_id: The ID of the post on the platform.

        Returns:
            True if the post exists, False otherwise.
        """
        pass

    async def health_check(self) -> dict[str, Any]:
        """Check if the poster is healthy and can connect to the platform.

        Returns:
            Dict with health status information.
        """
        return {
            "platform": self.platform_name,
            "initialized": self._initialized,
            "status": "healthy" if self._initialized else "not_initialized",
        }

    def _log_post_start(self, target_url: str, text_length: int) -> None:
        """Log the start of a posting operation."""
        self.logger.info(
            "Starting post to %s: target=%s, text_length=%d",
            self.platform_name,
            target_url,
            text_length,
        )

    def _log_post_complete(self, result: PostResult, duration: float) -> None:
        """Log completion of a posting operation."""
        if result.success:
            self.logger.info(
                "Successfully posted to %s: external_id=%s, url=%s in %.2fs",
                self.platform_name,
                result.external_id,
                result.external_url,
                duration,
            )
        else:
            self.logger.error(
                "Failed to post to %s: error=%s, retryable=%s in %.2fs",
                self.platform_name,
                result.error,
                result.retryable,
                duration,
            )

    def _log_error(self, operation: str, error: Exception) -> None:
        """Log an error during posting operation."""
        self.logger.error(
            "Error during %s on %s: %s",
            operation,
            self.platform_name,
            str(error),
            exc_info=True,
        )
