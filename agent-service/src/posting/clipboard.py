"""Clipboard poster fallback for manual posting.

This module provides a clipboard-based poster that copies the response
text to the system clipboard for manual posting. This is useful when
API access is not available or for platforms that don't support
automated posting.
"""

import logging
import time
from datetime import datetime
from typing import Any

from src.posting.base import BasePoster, PostResult

logger = logging.getLogger(__name__)


class ClipboardPoster(BasePoster):
    """Clipboard-based poster for manual posting.

    Copies response text to the system clipboard so the user can
    manually paste and post it on the target platform.

    Attributes:
        platform_name: Always "clipboard" for this poster.
    """

    platform_name = "clipboard"

    def __init__(self) -> None:
        """Initialize the clipboard poster."""
        super().__init__()
        self._pyperclip_available = False

    async def initialize(self) -> None:
        """Initialize the clipboard poster.

        Checks if pyperclip is available for clipboard operations.
        """
        try:
            import pyperclip
            # Test clipboard access
            pyperclip.copy("")
            self._pyperclip_available = True
            self.logger.info("Clipboard poster initialized with pyperclip")
        except ImportError:
            self.logger.warning(
                "pyperclip not available. Install with: pip install pyperclip"
            )
            self._pyperclip_available = False
        except Exception as e:
            self.logger.warning("Clipboard access not available: %s", str(e))
            self._pyperclip_available = False

        self._initialized = True

    async def close(self) -> None:
        """Close the clipboard poster (no-op)."""
        self._initialized = False

    async def post(
        self,
        response_text: str,
        target_url: str,
        **kwargs: Any,
    ) -> PostResult:
        """Copy response text to clipboard for manual posting.

        Args:
            response_text: The text to copy to clipboard.
            target_url: URL where the user should post (for reference).
            **kwargs: Additional parameters (ignored).

        Returns:
            PostResult indicating whether the clipboard copy was successful.
        """
        if not self._initialized:
            await self.initialize()

        self._log_post_start(target_url, len(response_text))
        start_time = time.time()

        if not self._pyperclip_available:
            return PostResult(
                success=False,
                error="Clipboard not available. Install pyperclip or use a supported platform.",
                error_code="CLIPBOARD_UNAVAILABLE",
                retryable=False,
                platform=self.platform_name,
                method="clipboard",
            )

        try:
            import pyperclip

            # Copy text to clipboard
            pyperclip.copy(response_text)

            # Verify copy was successful
            copied_text = pyperclip.paste()
            if copied_text != response_text:
                return PostResult(
                    success=False,
                    error="Clipboard verification failed",
                    error_code="CLIPBOARD_VERIFY_FAILED",
                    retryable=True,
                    platform=self.platform_name,
                    method="clipboard",
                )

            result = PostResult(
                success=True,
                external_id=None,  # No external ID for clipboard
                external_url=None,  # User needs to post manually
                posted_at=datetime.utcnow(),
                platform=self.platform_name,
                method="clipboard",
                metadata={
                    "target_url": target_url,
                    "text_length": len(response_text),
                    "requires_manual_post": True,
                },
            )

            duration = time.time() - start_time
            self._log_post_complete(result, duration)

            self.logger.info(
                "Response copied to clipboard. Please navigate to %s and paste.",
                target_url,
            )

            return result

        except Exception as e:
            self._log_error("clipboard_copy", e)
            return PostResult(
                success=False,
                error=f"Failed to copy to clipboard: {str(e)}",
                error_code="CLIPBOARD_ERROR",
                retryable=True,
                platform=self.platform_name,
                method="clipboard",
            )

    async def verify_posted(self, external_id: str) -> bool:
        """Verify that a post exists (always False for clipboard).

        Since clipboard posting is manual, we cannot verify if the
        user actually posted the content.

        Args:
            external_id: The external ID (not applicable for clipboard).

        Returns:
            Always False since we can't verify manual posts.
        """
        self.logger.warning(
            "Cannot verify clipboard posts - manual verification required"
        )
        return False

    async def health_check(self) -> dict[str, Any]:
        """Check if clipboard access is available.

        Returns:
            Dict with health status information.
        """
        base_health = await super().health_check()
        base_health["pyperclip_available"] = self._pyperclip_available

        if self._pyperclip_available:
            try:
                import pyperclip
                # Test clipboard access
                pyperclip.copy("test")
                base_health["clipboard_accessible"] = True
            except Exception as e:
                base_health["clipboard_accessible"] = False
                base_health["clipboard_error"] = str(e)
        else:
            base_health["clipboard_accessible"] = False

        return base_health


class ManualPostingTracker:
    """Tracks manual posting tasks pending user action.

    Keeps track of clipboard posts that need manual follow-up,
    allowing the system to prompt users to complete posting.
    """

    def __init__(self) -> None:
        """Initialize the manual posting tracker."""
        self._pending_posts: dict[str, dict[str, Any]] = {}

    def add_pending(
        self,
        response_id: str,
        target_url: str,
        response_text: str,
        copied_at: datetime | None = None,
    ) -> None:
        """Add a pending manual post.

        Args:
            response_id: ID of the response.
            target_url: URL where the post should be made.
            response_text: The text to post.
            copied_at: When the text was copied to clipboard.
        """
        self._pending_posts[response_id] = {
            "response_id": response_id,
            "target_url": target_url,
            "response_text": response_text,
            "copied_at": copied_at or datetime.utcnow(),
            "reminded_count": 0,
        }

    def mark_completed(
        self,
        response_id: str,
        external_id: str | None = None,
        external_url: str | None = None,
    ) -> dict[str, Any] | None:
        """Mark a pending post as completed.

        Args:
            response_id: ID of the response.
            external_id: ID on the platform (if known).
            external_url: URL on the platform (if known).

        Returns:
            The completed post data, or None if not found.
        """
        if response_id in self._pending_posts:
            post_data = self._pending_posts.pop(response_id)
            post_data["completed_at"] = datetime.utcnow()
            post_data["external_id"] = external_id
            post_data["external_url"] = external_url
            return post_data
        return None

    def get_pending(self, response_id: str | None = None) -> list[dict[str, Any]]:
        """Get pending manual posts.

        Args:
            response_id: Optional specific response to get.

        Returns:
            List of pending post data.
        """
        if response_id:
            post = self._pending_posts.get(response_id)
            return [post] if post else []
        return list(self._pending_posts.values())

    def get_stale_posts(self, max_age_minutes: int = 30) -> list[dict[str, Any]]:
        """Get posts that have been pending too long.

        Args:
            max_age_minutes: Maximum age before a post is considered stale.

        Returns:
            List of stale post data.
        """
        now = datetime.utcnow()
        stale = []

        for post in self._pending_posts.values():
            age = (now - post["copied_at"]).total_seconds() / 60
            if age >= max_age_minutes:
                stale.append(post)

        return stale

    def increment_reminder(self, response_id: str) -> int:
        """Increment the reminder count for a pending post.

        Args:
            response_id: ID of the response.

        Returns:
            New reminder count, or -1 if not found.
        """
        if response_id in self._pending_posts:
            self._pending_posts[response_id]["reminded_count"] += 1
            return self._pending_posts[response_id]["reminded_count"]
        return -1
