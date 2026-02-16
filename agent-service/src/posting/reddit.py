"""Reddit poster implementation for posting responses to Reddit.

This module provides a poster for Reddit using asyncpraw to post
comments as replies to Reddit posts and comments.
"""

import asyncio
import logging
import re
import time
from typing import Any
from urllib.parse import urlparse

import asyncpraw
from asyncpraw.models import Comment, Submission

from src.config import get_settings
from src.posting.base import BasePoster, PostingError, PostResult
from src.posting.delay_patterns import get_human_like_delay, get_random_jitter

logger = logging.getLogger(__name__)


# Subreddits known to have strict self-promotion rules
# Auto-posting should be blocked for these
STRICT_SELFPROMO_SUBREDDITS = {
    "askreddit",
    "askscience",
    "iama",
    "science",
    "news",
    "worldnews",
    "politics",
    "todayilearned",
    "explainlikeimfive",
    "askhistorians",
    "legaladvice",
    "personalfinance",
    "relationships",
    "relationship_advice",
    "advice",
    "askdocs",
    "medical_advice",
    "nostupidquestions",
    "outoftheloop",
    "changemyview",
}


def parse_reddit_url(url: str) -> dict[str, str | None]:
    """Parse a Reddit URL to extract post and comment IDs.

    Args:
        url: Reddit URL to parse.

    Returns:
        Dict with 'post_id', 'comment_id', and 'subreddit'.

    Example:
        >>> parse_reddit_url("https://reddit.com/r/python/comments/abc123/title/def456")
        {'subreddit': 'python', 'post_id': 'abc123', 'comment_id': 'def456'}
    """
    parsed = urlparse(url)
    path = parsed.path

    result: dict[str, str | None] = {
        "subreddit": None,
        "post_id": None,
        "comment_id": None,
    }

    # Match subreddit
    subreddit_match = re.search(r"/r/([^/]+)", path)
    if subreddit_match:
        result["subreddit"] = subreddit_match.group(1).lower()

    # Match post ID (after /comments/)
    post_match = re.search(r"/comments/([a-z0-9]+)", path)
    if post_match:
        result["post_id"] = post_match.group(1)

    # Match comment ID (after post ID and title)
    # Format: /comments/{post_id}/{title}/{comment_id}
    comment_match = re.search(r"/comments/[a-z0-9]+/[^/]+/([a-z0-9]+)", path)
    if comment_match:
        result["comment_id"] = comment_match.group(1)

    return result


class RedditPoster(BasePoster):
    """Poster for Reddit using asyncpraw.

    Posts comments as replies to Reddit posts or existing comments.

    Attributes:
        platform_name: Identifier for this poster ("reddit").
        reddit: asyncpraw Reddit instance.
    """

    platform_name = "reddit"

    def __init__(self) -> None:
        """Initialize the Reddit poster."""
        super().__init__()
        self.reddit: asyncpraw.Reddit | None = None

    async def initialize(self) -> None:
        """Initialize the Reddit API client with credentials.

        For posting, we need authenticated access (not just read-only).
        This requires username and password in addition to client credentials.

        Raises:
            PostingError: If required credentials are not configured.
        """
        settings = get_settings()

        client_id = getattr(settings, "reddit_client_id", "")
        client_secret = getattr(settings, "reddit_client_secret", "")
        user_agent = getattr(settings, "reddit_user_agent", "ReachBy3Cs/1.0")
        username = getattr(settings, "reddit_username", "")
        password_secret = getattr(settings, "reddit_password", None)
        # Handle SecretStr
        password = password_secret.get_secret_value() if password_secret else ""

        if not client_id or not client_secret:
            raise PostingError(
                message="Reddit client credentials not configured",
                platform=self.platform_name,
                error_code="MISSING_CREDENTIALS",
                retryable=False,
            )

        # For posting, we need full authentication
        if username and password:
            self.reddit = asyncpraw.Reddit(
                client_id=client_id,
                client_secret=client_secret,
                user_agent=user_agent,
                username=username,
                password=password,
            )
            self.logger.info("Reddit poster initialized with authenticated access")
        else:
            # Read-only mode - can verify but not post
            self.reddit = asyncpraw.Reddit(
                client_id=client_id,
                client_secret=client_secret,
                user_agent=user_agent,
            )
            self.logger.warning(
                "Reddit poster initialized in read-only mode. "
                "Set REDDIT_USERNAME and REDDIT_PASSWORD for posting."
            )

        self._initialized = True

    async def close(self) -> None:
        """Close the Reddit API client and clean up resources."""
        if self.reddit:
            await self.reddit.close()
            self.reddit = None
        self._initialized = False
        self.logger.info("Reddit poster closed")

    async def post(
        self,
        response_text: str,
        target_url: str,
        apply_delay: bool = True,
        original_text_length: int = 0,
        **kwargs: Any,
    ) -> PostResult:
        """Post a comment reply on Reddit.

        Args:
            response_text: The comment text to post.
            target_url: URL of the Reddit post or comment to reply to.
            apply_delay: Whether to apply human-like delay before posting.
            original_text_length: Length of original post (for delay calculation).
            **kwargs: Additional parameters.

        Returns:
            PostResult with success status and details.
        """
        if not self._initialized or not self.reddit:
            await self.initialize()

        self._log_post_start(target_url, len(response_text))
        start_time = time.time()

        # Parse the Reddit URL
        url_parts = parse_reddit_url(target_url)

        if not url_parts["post_id"]:
            return PostResult(
                success=False,
                error="Could not parse Reddit URL - missing post ID",
                error_code="INVALID_URL",
                retryable=False,
                platform=self.platform_name,
            )

        # Check if subreddit has strict self-promotion rules
        subreddit = url_parts["subreddit"]
        if subreddit and subreddit.lower() in STRICT_SELFPROMO_SUBREDDITS:
            return PostResult(
                success=False,
                error=f"Auto-posting blocked for r/{subreddit} due to strict self-promotion rules",
                error_code="BLOCKED_SUBREDDIT",
                retryable=False,
                platform=self.platform_name,
            )

        try:
            # Apply human-like delay
            if apply_delay:
                delay = get_human_like_delay(
                    original_text_length or 500,
                    len(response_text),
                )
                delay = get_random_jitter(delay, 0.15)
                self.logger.debug("Applying human-like delay of %.1f seconds", delay)
                await asyncio.sleep(delay)

            # Get the target to reply to
            if url_parts["comment_id"]:
                # Reply to a comment
                target = await self.reddit.comment(id=url_parts["comment_id"])
            else:
                # Reply to a post
                target = await self.reddit.submission(id=url_parts["post_id"])

            # Post the reply
            if isinstance(target, Submission):
                reply = await target.reply(response_text)
            elif isinstance(target, Comment):
                reply = await target.reply(response_text)
            else:
                return PostResult(
                    success=False,
                    error="Unknown target type for reply",
                    error_code="INVALID_TARGET",
                    retryable=False,
                    platform=self.platform_name,
                )

            # Build success result
            from datetime import datetime

            result = PostResult(
                success=True,
                external_id=reply.id,
                external_url=f"https://reddit.com{reply.permalink}",
                posted_at=datetime.utcnow(),
                platform=self.platform_name,
                method="api",
                metadata={
                    "subreddit": subreddit,
                    "parent_type": "comment" if url_parts["comment_id"] else "post",
                    "parent_id": url_parts["comment_id"] or url_parts["post_id"],
                },
            )

            duration = time.time() - start_time
            self._log_post_complete(result, duration)
            return result

        except asyncpraw.exceptions.RedditAPIException as e:
            # Handle Reddit API errors
            error_items = list(e.items) if hasattr(e, "items") else []
            error_types = [item.error_type for item in error_items] if error_items else []

            # Check for rate limiting
            if "RATELIMIT" in error_types:
                wait_match = re.search(r"(\d+)\s*(minute|second)", str(e))
                wait_time = None
                if wait_match:
                    wait_time = int(wait_match.group(1))
                    if wait_match.group(2) == "minute":
                        wait_time *= 60

                return PostResult(
                    success=False,
                    error=f"Reddit rate limit: {str(e)}",
                    error_code="RATELIMIT",
                    retryable=True,
                    platform=self.platform_name,
                    metadata={"wait_seconds": wait_time},
                )

            # Check for deleted/locked content
            if "DELETED_COMMENT" in error_types or "THREAD_LOCKED" in error_types:
                return PostResult(
                    success=False,
                    error=f"Target content unavailable: {str(e)}",
                    error_code=error_types[0] if error_types else "API_ERROR",
                    retryable=False,
                    platform=self.platform_name,
                )

            # Check for banned from subreddit
            if "USER_REQUIRED" in error_types:
                return PostResult(
                    success=False,
                    error="Authentication required for posting",
                    error_code="AUTH_REQUIRED",
                    retryable=False,
                    platform=self.platform_name,
                )

            return PostResult(
                success=False,
                error=f"Reddit API error: {str(e)}",
                error_code=error_types[0] if error_types else "API_ERROR",
                retryable=True,
                platform=self.platform_name,
            )

        except Exception as e:
            self._log_error("post", e)
            return PostResult(
                success=False,
                error=f"Unexpected error: {str(e)}",
                error_code="UNKNOWN_ERROR",
                retryable=True,
                platform=self.platform_name,
            )

    async def verify_posted(self, external_id: str) -> bool:
        """Verify that a comment exists on Reddit.

        Args:
            external_id: The Reddit comment ID.

        Returns:
            True if the comment exists, False otherwise.
        """
        if not self._initialized or not self.reddit:
            await self.initialize()

        try:
            comment = await self.reddit.comment(id=external_id)
            # Try to fetch the comment body to verify it exists
            _ = comment.body
            return True
        except Exception as e:
            self.logger.warning("Could not verify comment %s: %s", external_id, str(e))
            return False

    async def health_check(self) -> dict[str, Any]:
        """Check Reddit API connectivity and authentication status.

        Returns:
            Dict with health status information.
        """
        base_health = await super().health_check()

        if self._initialized and self.reddit:
            try:
                user = await self.reddit.user.me()
                if user:
                    base_health["api_connected"] = True
                    base_health["authenticated"] = True
                    base_health["username"] = user.name
                    base_health["can_post"] = True
                else:
                    base_health["api_connected"] = True
                    base_health["authenticated"] = False
                    base_health["can_post"] = False
            except Exception as e:
                base_health["api_connected"] = False
                base_health["api_error"] = str(e)
                base_health["can_post"] = False

        return base_health

    def is_subreddit_blocked(self, subreddit: str) -> bool:
        """Check if a subreddit is blocked for auto-posting.

        Args:
            subreddit: Subreddit name (without r/ prefix).

        Returns:
            True if auto-posting is blocked for this subreddit.
        """
        return subreddit.lower() in STRICT_SELFPROMO_SUBREDDITS
