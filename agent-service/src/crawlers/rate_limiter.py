"""Rate limiting utilities for platform crawlers.

This module provides rate limiting functionality to ensure crawlers
respect platform API limits and avoid being blocked.
"""

import asyncio
import logging
import time
from collections import deque
from dataclasses import dataclass, field
from typing import Any

logger = logging.getLogger(__name__)


@dataclass
class RateLimitConfig:
    """Configuration for rate limiting.

    Attributes:
        requests_per_minute: Maximum requests allowed per minute.
        requests_per_hour: Maximum requests allowed per hour.
        requests_per_day: Maximum requests allowed per day.
        min_delay_seconds: Minimum delay between requests.
        max_delay_seconds: Maximum delay for exponential backoff.
        backoff_multiplier: Multiplier for exponential backoff.
    """

    requests_per_minute: int = 60
    requests_per_hour: int | None = None
    requests_per_day: int | None = None
    min_delay_seconds: float = 0.1
    max_delay_seconds: float = 60.0
    backoff_multiplier: float = 2.0


class RateLimiter:
    """Token bucket rate limiter with sliding window.

    Implements rate limiting using a sliding window approach to track
    request counts and enforce limits.

    Attributes:
        config: Rate limit configuration.
        name: Name identifier for this rate limiter.
    """

    def __init__(
        self,
        requests_per_minute: int = 60,
        config: RateLimitConfig | None = None,
        name: str = "default",
    ) -> None:
        """Initialize the rate limiter.

        Args:
            requests_per_minute: Maximum requests per minute (shorthand).
            config: Full configuration object (overrides requests_per_minute).
            name: Name for logging purposes.
        """
        if config:
            self.config = config
        else:
            self.config = RateLimitConfig(requests_per_minute=requests_per_minute)

        self.name = name
        self._minute_window: deque[float] = deque()
        self._hour_window: deque[float] = deque()
        self._day_window: deque[float] = deque()
        self._lock = asyncio.Lock()
        self._consecutive_failures = 0
        self._last_request_time = 0.0
        self.logger = logging.getLogger(f"{__name__}.{name}")

    async def acquire(self) -> float:
        """Acquire permission to make a request.

        Waits if necessary to respect rate limits. Returns the wait time.

        Returns:
            The time waited in seconds.
        """
        async with self._lock:
            wait_time = await self._calculate_wait_time()

            if wait_time > 0:
                self.logger.debug(
                    "Rate limiter %s: waiting %.2f seconds", self.name, wait_time
                )
                await asyncio.sleep(wait_time)

            # Record this request
            now = time.time()
            self._minute_window.append(now)
            if self.config.requests_per_hour:
                self._hour_window.append(now)
            if self.config.requests_per_day:
                self._day_window.append(now)
            self._last_request_time = now

            return wait_time

    async def _calculate_wait_time(self) -> float:
        """Calculate how long to wait before the next request.

        Returns:
            Wait time in seconds.
        """
        now = time.time()
        wait_times: list[float] = []

        # Clean up old entries and calculate waits for each window
        wait_times.append(
            self._calculate_window_wait(
                self._minute_window, now, 60, self.config.requests_per_minute
            )
        )

        if self.config.requests_per_hour:
            wait_times.append(
                self._calculate_window_wait(
                    self._hour_window, now, 3600, self.config.requests_per_hour
                )
            )

        if self.config.requests_per_day:
            wait_times.append(
                self._calculate_window_wait(
                    self._day_window, now, 86400, self.config.requests_per_day
                )
            )

        # Ensure minimum delay between requests
        time_since_last = now - self._last_request_time
        if time_since_last < self.config.min_delay_seconds:
            wait_times.append(self.config.min_delay_seconds - time_since_last)

        # Add backoff delay if there have been consecutive failures
        if self._consecutive_failures > 0:
            backoff = min(
                self.config.min_delay_seconds
                * (self.config.backoff_multiplier**self._consecutive_failures),
                self.config.max_delay_seconds,
            )
            wait_times.append(backoff)

        return max(wait_times) if wait_times else 0.0

    def _calculate_window_wait(
        self,
        window: deque[float],
        now: float,
        window_seconds: int,
        max_requests: int,
    ) -> float:
        """Calculate wait time for a specific time window.

        Args:
            window: Deque of request timestamps.
            now: Current timestamp.
            window_seconds: Size of the window in seconds.
            max_requests: Maximum requests allowed in window.

        Returns:
            Wait time in seconds.
        """
        # Remove entries outside the window
        cutoff = now - window_seconds
        while window and window[0] < cutoff:
            window.popleft()

        # If at limit, calculate wait time
        if len(window) >= max_requests:
            oldest = window[0]
            return (oldest + window_seconds) - now + 0.1

        return 0.0

    def record_success(self) -> None:
        """Record a successful request, resetting failure count."""
        self._consecutive_failures = 0

    def record_failure(self) -> None:
        """Record a failed request, incrementing failure count."""
        self._consecutive_failures += 1
        self.logger.warning(
            "Rate limiter %s: recorded failure #%d",
            self.name,
            self._consecutive_failures,
        )

    def record_rate_limit_hit(self) -> None:
        """Record that a rate limit was hit by the API."""
        self._consecutive_failures += 2
        self.logger.warning(
            "Rate limiter %s: API rate limit hit, backing off",
            self.name,
        )

    def get_stats(self) -> dict[str, Any]:
        """Get current rate limiter statistics.

        Returns:
            Dict with rate limiter stats.
        """
        now = time.time()

        # Clean up windows for accurate counts
        minute_cutoff = now - 60
        hour_cutoff = now - 3600
        day_cutoff = now - 86400

        minute_count = sum(1 for t in self._minute_window if t >= minute_cutoff)
        hour_count = sum(1 for t in self._hour_window if t >= hour_cutoff)
        day_count = sum(1 for t in self._day_window if t >= day_cutoff)

        return {
            "name": self.name,
            "requests_last_minute": minute_count,
            "requests_last_hour": hour_count,
            "requests_last_day": day_count,
            "minute_limit": self.config.requests_per_minute,
            "hour_limit": self.config.requests_per_hour,
            "day_limit": self.config.requests_per_day,
            "consecutive_failures": self._consecutive_failures,
            "last_request_time": self._last_request_time,
        }

    def reset(self) -> None:
        """Reset the rate limiter state."""
        self._minute_window.clear()
        self._hour_window.clear()
        self._day_window.clear()
        self._consecutive_failures = 0
        self._last_request_time = 0.0
        self.logger.info("Rate limiter %s: reset", self.name)


@dataclass
class RateLimiterManager:
    """Manager for multiple rate limiters.

    Provides a central place to manage rate limiters for different
    platforms and track overall statistics.
    """

    limiters: dict[str, RateLimiter] = field(default_factory=dict)

    def get_or_create(
        self,
        name: str,
        requests_per_minute: int = 60,
        config: RateLimitConfig | None = None,
    ) -> RateLimiter:
        """Get an existing rate limiter or create a new one.

        Args:
            name: Name of the rate limiter.
            requests_per_minute: Default requests per minute.
            config: Optional full configuration.

        Returns:
            The rate limiter instance.
        """
        if name not in self.limiters:
            self.limiters[name] = RateLimiter(
                requests_per_minute=requests_per_minute,
                config=config,
                name=name,
            )
        return self.limiters[name]

    def get_all_stats(self) -> dict[str, Any]:
        """Get statistics for all rate limiters.

        Returns:
            Dict with stats for each rate limiter.
        """
        return {name: limiter.get_stats() for name, limiter in self.limiters.items()}

    def reset_all(self) -> None:
        """Reset all rate limiters."""
        for limiter in self.limiters.values():
            limiter.reset()


# Global rate limiter manager
_rate_limiter_manager: RateLimiterManager | None = None


def get_rate_limiter_manager() -> RateLimiterManager:
    """Get the global rate limiter manager.

    Returns:
        The global RateLimiterManager instance.
    """
    global _rate_limiter_manager
    if _rate_limiter_manager is None:
        _rate_limiter_manager = RateLimiterManager()
    return _rate_limiter_manager
