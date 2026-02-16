"""Twitter/X poster implementation for posting responses to Twitter.

This module provides a poster for Twitter/X using the Twitter API v2
to post replies to tweets.
"""

import asyncio
import logging
import re
import time
from typing import Any
from urllib.parse import urlparse

import httpx

from src.config import get_settings
from src.posting.base import BasePoster, PostingError, PostResult
from src.posting.delay_patterns import get_human_like_delay, get_random_jitter

logger = logging.getLogger(__name__)


def parse_twitter_url(url: str) -> dict[str, str | None]:
    """Parse a Twitter URL to extract tweet ID and username.

    Args:
        url: Twitter URL to parse.

    Returns:
        Dict with 'tweet_id' and 'username'.

    Example:
        >>> parse_twitter_url("https://twitter.com/user/status/1234567890")
        {'username': 'user', 'tweet_id': '1234567890'}
    """
    parsed = urlparse(url)
    path = parsed.path

    result: dict[str, str | None] = {
        "username": None,
        "tweet_id": None,
    }

    # Match tweet ID from status URL
    # Formats: /user/status/123, /user/statuses/123
    tweet_match = re.search(r"/([^/]+)/status(?:es)?/(\d+)", path)
    if tweet_match:
        result["username"] = tweet_match.group(1)
        result["tweet_id"] = tweet_match.group(2)

    return result


class TwitterPoster(BasePoster):
    """Poster for Twitter/X using API v2.

    Posts replies to tweets using the Twitter API v2.

    Attributes:
        platform_name: Identifier for this poster ("twitter").
        client: httpx AsyncClient for API requests.
    """

    platform_name = "twitter"
    API_BASE_URL = "https://api.twitter.com/2"

    def __init__(self) -> None:
        """Initialize the Twitter poster."""
        super().__init__()
        self.client: httpx.AsyncClient | None = None
        self.bearer_token: str = ""
        self.access_token: str = ""
        self.access_token_secret: str = ""

    async def initialize(self) -> None:
        """Initialize the Twitter API client with credentials.

        For posting (write operations), we need OAuth 1.0a User Context
        or OAuth 2.0 User Context with appropriate scopes.

        Raises:
            PostingError: If required credentials are not configured.
        """
        settings = get_settings()

        self.bearer_token = getattr(settings, "twitter_bearer_token", "")
        self.access_token = getattr(settings, "twitter_access_token", "")

        # Handle SecretStr fields
        access_token_secret = getattr(settings, "twitter_access_token_secret", None)
        self.access_token_secret = (
            access_token_secret.get_secret_value()
            if access_token_secret and hasattr(access_token_secret, "get_secret_value")
            else ""
        )

        api_key = getattr(settings, "twitter_api_key", "")
        api_secret = getattr(settings, "twitter_api_secret", None)
        api_secret_value = (
            api_secret.get_secret_value()
            if api_secret and hasattr(api_secret, "get_secret_value")
            else ""
        )

        if not self.bearer_token:
            raise PostingError(
                message="Twitter bearer token not configured",
                platform=self.platform_name,
                error_code="MISSING_CREDENTIALS",
                retryable=False,
            )

        # For posting we need OAuth 2.0 with tweet.write scope
        # or OAuth 1.0a with user context
        headers = {
            "Authorization": f"Bearer {self.bearer_token}",
            "Content-Type": "application/json",
        }

        self.client = httpx.AsyncClient(
            base_url=self.API_BASE_URL,
            headers=headers,
            timeout=30.0,
        )

        self._initialized = True
        self.logger.info("Twitter poster initialized")

    async def close(self) -> None:
        """Close the HTTP client and clean up resources."""
        if self.client:
            await self.client.aclose()
            self.client = None
        self._initialized = False
        self.logger.info("Twitter poster closed")

    async def post(
        self,
        response_text: str,
        target_url: str,
        apply_delay: bool = True,
        original_text_length: int = 0,
        **kwargs: Any,
    ) -> PostResult:
        """Post a reply tweet on Twitter.

        Args:
            response_text: The tweet text to post.
            target_url: URL of the tweet to reply to.
            apply_delay: Whether to apply human-like delay before posting.
            original_text_length: Length of original tweet (for delay calculation).
            **kwargs: Additional parameters.

        Returns:
            PostResult with success status and details.

        Note:
            Twitter has a 280 character limit for tweets. The response text
            will be truncated if it exceeds this limit.
        """
        if not self._initialized or not self.client:
            await self.initialize()

        self._log_post_start(target_url, len(response_text))
        start_time = time.time()

        # Parse the Twitter URL
        url_parts = parse_twitter_url(target_url)

        if not url_parts["tweet_id"]:
            return PostResult(
                success=False,
                error="Could not parse Twitter URL - missing tweet ID",
                error_code="INVALID_URL",
                retryable=False,
                platform=self.platform_name,
            )

        # Validate tweet length
        if len(response_text) > 280:
            self.logger.warning(
                "Tweet text exceeds 280 characters (%d), will be truncated",
                len(response_text),
            )
            # Truncate and add ellipsis
            response_text = response_text[:277] + "..."

        try:
            # Apply human-like delay
            if apply_delay:
                delay = get_human_like_delay(
                    original_text_length or 280,
                    len(response_text),
                )
                delay = get_random_jitter(delay, 0.15)
                self.logger.debug("Applying human-like delay of %.1f seconds", delay)
                await asyncio.sleep(delay)

            # Build the request payload
            payload = {
                "text": response_text,
                "reply": {
                    "in_reply_to_tweet_id": url_parts["tweet_id"],
                },
            }

            # Post the tweet
            response = await self.client.post("/tweets", json=payload)

            if response.status_code == 201:
                data = response.json()
                tweet_data = data.get("data", {})

                from datetime import datetime

                result = PostResult(
                    success=True,
                    external_id=tweet_data.get("id"),
                    external_url=f"https://twitter.com/i/status/{tweet_data.get('id')}",
                    posted_at=datetime.utcnow(),
                    platform=self.platform_name,
                    method="api",
                    metadata={
                        "reply_to": url_parts["tweet_id"],
                        "reply_to_user": url_parts["username"],
                    },
                )

                duration = time.time() - start_time
                self._log_post_complete(result, duration)
                return result

            elif response.status_code == 401:
                return PostResult(
                    success=False,
                    error="Twitter authentication failed",
                    error_code="AUTH_FAILED",
                    retryable=False,
                    platform=self.platform_name,
                )

            elif response.status_code == 403:
                error_data = response.json() if response.content else {}
                error_detail = error_data.get("detail", "Forbidden")

                # Check for specific 403 reasons
                if "duplicate" in error_detail.lower():
                    return PostResult(
                        success=False,
                        error="Duplicate tweet detected",
                        error_code="DUPLICATE_TWEET",
                        retryable=False,
                        platform=self.platform_name,
                    )

                return PostResult(
                    success=False,
                    error=f"Twitter forbidden: {error_detail}",
                    error_code="FORBIDDEN",
                    retryable=False,
                    platform=self.platform_name,
                )

            elif response.status_code == 429:
                # Rate limited
                retry_after = response.headers.get("retry-after")
                return PostResult(
                    success=False,
                    error="Twitter rate limit exceeded",
                    error_code="RATELIMIT",
                    retryable=True,
                    platform=self.platform_name,
                    metadata={"retry_after": retry_after},
                )

            else:
                error_text = response.text if response.content else "Unknown error"
                return PostResult(
                    success=False,
                    error=f"Twitter API error {response.status_code}: {error_text}",
                    error_code=f"HTTP_{response.status_code}",
                    retryable=response.status_code >= 500,
                    platform=self.platform_name,
                )

        except httpx.TimeoutException:
            return PostResult(
                success=False,
                error="Twitter API request timed out",
                error_code="TIMEOUT",
                retryable=True,
                platform=self.platform_name,
            )

        except httpx.HTTPError as e:
            self._log_error("post", e)
            return PostResult(
                success=False,
                error=f"HTTP error: {str(e)}",
                error_code="HTTP_ERROR",
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
        """Verify that a tweet exists on Twitter.

        Args:
            external_id: The Twitter tweet ID.

        Returns:
            True if the tweet exists, False otherwise.
        """
        if not self._initialized or not self.client:
            await self.initialize()

        try:
            response = await self.client.get(
                f"/tweets/{external_id}",
                params={"tweet.fields": "id"},
            )
            return response.status_code == 200
        except Exception as e:
            self.logger.warning("Could not verify tweet %s: %s", external_id, str(e))
            return False

    async def health_check(self) -> dict[str, Any]:
        """Check Twitter API connectivity and authentication status.

        Returns:
            Dict with health status information.
        """
        base_health = await super().health_check()
        base_health["bearer_token_configured"] = bool(self.bearer_token)

        if self._initialized and self.client and self.bearer_token:
            try:
                # Use a simple API call to check connectivity
                response = await self.client.get(
                    "/users/me",
                )

                if response.status_code == 200:
                    data = response.json()
                    user_data = data.get("data", {})
                    base_health["api_connected"] = True
                    base_health["authenticated"] = True
                    base_health["username"] = user_data.get("username")
                    base_health["can_post"] = True
                elif response.status_code == 429:
                    base_health["api_connected"] = True
                    base_health["rate_limited"] = True
                    base_health["can_post"] = False
                else:
                    base_health["api_connected"] = False
                    base_health["api_error"] = f"Status {response.status_code}"
                    base_health["can_post"] = False

            except Exception as e:
                base_health["api_connected"] = False
                base_health["api_error"] = str(e)
                base_health["can_post"] = False

        return base_health
