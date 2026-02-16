"""Rate limits and daily caps for auto-posting.

This module provides limit management for auto-posting operations,
including daily caps, hourly limits, and per-platform rate limiting.
"""

import logging
from datetime import datetime, timedelta
from typing import Any

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class PlatformLimits(BaseModel):
    """Rate limits for a specific platform.

    Attributes:
        platform: Platform name.
        posts_per_hour: Maximum posts per hour.
        posts_per_day: Maximum posts per day.
        min_gap_seconds: Minimum seconds between posts.
        subreddit_gap_seconds: Minimum seconds between posts to same subreddit.
        enabled: Whether posting is enabled for this platform.
    """

    platform: str
    posts_per_hour: int = Field(default=10, ge=0)
    posts_per_day: int = Field(default=50, ge=0)
    min_gap_seconds: int = Field(default=60, ge=0)
    subreddit_gap_seconds: int = Field(default=300, ge=0)  # 5 minutes
    enabled: bool = True


class OrgLimits(BaseModel):
    """Organization-level limits for auto-posting.

    Attributes:
        organization_id: Organization ID.
        max_daily_auto_posts: Maximum auto-posts per day across all platforms.
        max_hourly_auto_posts: Maximum auto-posts per hour.
        min_cts_score: Minimum CTS score for auto-posting.
        max_cta_level: Maximum CTA level for auto-posting.
        allowed_risk_levels: Risk levels that allow auto-posting.
        platform_limits: Per-platform limits.
        auto_post_enabled: Whether auto-posting is enabled for this org.
        blacklisted_subreddits: Subreddits to never auto-post to.
    """

    organization_id: str
    max_daily_auto_posts: int = Field(default=50, ge=0)
    max_hourly_auto_posts: int = Field(default=10, ge=0)
    min_cts_score: float = Field(default=0.7, ge=0.0, le=1.0)
    max_cta_level: int = Field(default=1, ge=0, le=3)
    allowed_risk_levels: list[str] = Field(default_factory=lambda: ["low"])
    platform_limits: dict[str, PlatformLimits] = Field(default_factory=dict)
    auto_post_enabled: bool = True
    blacklisted_subreddits: list[str] = Field(default_factory=list)


# Default limits for new organizations
DEFAULT_ORG_LIMITS = OrgLimits(
    organization_id="default",
    max_daily_auto_posts=50,
    max_hourly_auto_posts=10,
    min_cts_score=0.7,
    max_cta_level=1,
    allowed_risk_levels=["low"],
    platform_limits={
        "reddit": PlatformLimits(
            platform="reddit",
            posts_per_hour=10,
            posts_per_day=50,
            min_gap_seconds=60,
            subreddit_gap_seconds=300,
        ),
        "twitter": PlatformLimits(
            platform="twitter",
            posts_per_hour=15,
            posts_per_day=100,
            min_gap_seconds=30,
            subreddit_gap_seconds=0,  # Not applicable
        ),
    },
)


class RateLimitManager:
    """Manages rate limits for auto-posting operations.

    Tracks posting history and enforces rate limits per organization
    and platform.
    """

    def __init__(self) -> None:
        """Initialize the rate limit manager."""
        # Track posts by organization: {org_id: [(timestamp, platform, target)]}
        self._post_history: dict[str, list[tuple[datetime, str, str]]] = {}
        # Organization limits: {org_id: OrgLimits}
        self._org_limits: dict[str, OrgLimits] = {}
        # Lock for thread safety
        import asyncio
        self._lock = asyncio.Lock()

        self.logger = logging.getLogger(f"{__name__}.RateLimitManager")

    def set_org_limits(self, org_id: str, limits: OrgLimits) -> None:
        """Set limits for an organization.

        Args:
            org_id: Organization ID.
            limits: Limits to apply.
        """
        limits.organization_id = org_id
        self._org_limits[org_id] = limits
        self.logger.info("Set limits for organization %s", org_id)

    def get_org_limits(self, org_id: str) -> OrgLimits:
        """Get limits for an organization.

        Args:
            org_id: Organization ID.

        Returns:
            Organization limits (default if not set).
        """
        if org_id in self._org_limits:
            return self._org_limits[org_id]

        # Return default limits with org_id set
        default = DEFAULT_ORG_LIMITS.model_copy()
        default.organization_id = org_id
        return default

    async def record_post(
        self,
        org_id: str,
        platform: str,
        target: str,
    ) -> None:
        """Record a post for rate limit tracking.

        Args:
            org_id: Organization ID.
            platform: Platform posted to.
            target: Target identifier (e.g., subreddit name).
        """
        async with self._lock:
            if org_id not in self._post_history:
                self._post_history[org_id] = []

            self._post_history[org_id].append((datetime.utcnow(), platform, target))

            # Clean up old entries (older than 24 hours)
            cutoff = datetime.utcnow() - timedelta(hours=24)
            self._post_history[org_id] = [
                entry for entry in self._post_history[org_id]
                if entry[0] > cutoff
            ]

    async def check_limits(
        self,
        org_id: str,
        platform: str,
        target: str = "",
    ) -> tuple[bool, str]:
        """Check if posting is allowed given current rate limits.

        Args:
            org_id: Organization ID.
            platform: Target platform.
            target: Target identifier (e.g., subreddit name).

        Returns:
            Tuple of (allowed, reason).
        """
        limits = self.get_org_limits(org_id)

        # Check if auto-posting is enabled
        if not limits.auto_post_enabled:
            return False, "Auto-posting is disabled for this organization"

        # Check platform-specific limits
        platform_limits = limits.platform_limits.get(platform)
        if platform_limits and not platform_limits.enabled:
            return False, f"Auto-posting is disabled for {platform}"

        async with self._lock:
            history = self._post_history.get(org_id, [])

            now = datetime.utcnow()
            hour_ago = now - timedelta(hours=1)
            day_ago = now - timedelta(hours=24)

            # Count posts in time windows
            hourly_count = sum(1 for ts, _, _ in history if ts > hour_ago)
            daily_count = sum(1 for ts, _, _ in history if ts > day_ago)

            # Platform-specific counts
            platform_hourly = sum(
                1 for ts, p, _ in history if ts > hour_ago and p == platform
            )
            platform_daily = sum(
                1 for ts, p, _ in history if ts > day_ago and p == platform
            )

            # Check org-level limits
            if hourly_count >= limits.max_hourly_auto_posts:
                return False, f"Hourly auto-post limit reached ({hourly_count}/{limits.max_hourly_auto_posts})"

            if daily_count >= limits.max_daily_auto_posts:
                return False, f"Daily auto-post limit reached ({daily_count}/{limits.max_daily_auto_posts})"

            # Check platform-specific limits
            if platform_limits:
                if platform_hourly >= platform_limits.posts_per_hour:
                    return False, f"{platform} hourly limit reached ({platform_hourly}/{platform_limits.posts_per_hour})"

                if platform_daily >= platform_limits.posts_per_day:
                    return False, f"{platform} daily limit reached ({platform_daily}/{platform_limits.posts_per_day})"

                # Check minimum gap
                platform_posts = [
                    (ts, t) for ts, p, t in history if p == platform
                ]
                if platform_posts:
                    last_post_time = max(ts for ts, _ in platform_posts)
                    gap = (now - last_post_time).total_seconds()
                    if gap < platform_limits.min_gap_seconds:
                        return False, f"Minimum gap not met ({gap:.0f}s < {platform_limits.min_gap_seconds}s)"

                # Check subreddit-specific gap (for Reddit)
                if target and platform == "reddit" and platform_limits.subreddit_gap_seconds > 0:
                    target_lower = target.lower()
                    subreddit_posts = [
                        ts for ts, p, t in history
                        if p == platform and t.lower() == target_lower
                    ]
                    if subreddit_posts:
                        last_subreddit_time = max(subreddit_posts)
                        gap = (now - last_subreddit_time).total_seconds()
                        if gap < platform_limits.subreddit_gap_seconds:
                            return False, f"Subreddit gap not met for {target} ({gap:.0f}s < {platform_limits.subreddit_gap_seconds}s)"

            # Check blacklisted subreddits
            if target and target.lower() in [s.lower() for s in limits.blacklisted_subreddits]:
                return False, f"Subreddit {target} is blacklisted"

            return True, "OK"

    async def get_time_until_allowed(
        self,
        org_id: str,
        platform: str,
        target: str = "",
    ) -> float:
        """Get seconds until posting is allowed.

        Args:
            org_id: Organization ID.
            platform: Target platform.
            target: Target identifier.

        Returns:
            Seconds until posting is allowed (0 if already allowed).
        """
        allowed, reason = await self.check_limits(org_id, platform, target)
        if allowed:
            return 0

        limits = self.get_org_limits(org_id)
        platform_limits = limits.platform_limits.get(platform)

        async with self._lock:
            history = self._post_history.get(org_id, [])
            now = datetime.utcnow()

            # Find the earliest time when a limit will reset
            wait_times = []

            # Check minimum gap
            platform_posts = [(ts, t) for ts, p, t in history if p == platform]
            if platform_posts and platform_limits:
                last_post_time = max(ts for ts, _ in platform_posts)
                gap_wait = platform_limits.min_gap_seconds - (now - last_post_time).total_seconds()
                if gap_wait > 0:
                    wait_times.append(gap_wait)

            # Check subreddit gap
            if target and platform == "reddit" and platform_limits:
                target_lower = target.lower()
                subreddit_posts = [
                    ts for ts, p, t in history
                    if p == platform and t.lower() == target_lower
                ]
                if subreddit_posts:
                    last_subreddit_time = max(subreddit_posts)
                    subreddit_wait = (
                        platform_limits.subreddit_gap_seconds -
                        (now - last_subreddit_time).total_seconds()
                    )
                    if subreddit_wait > 0:
                        wait_times.append(subreddit_wait)

            # Check hourly limit reset
            hour_ago = now - timedelta(hours=1)
            hourly_posts = sorted([ts for ts, _, _ in history if ts > hour_ago])
            if len(hourly_posts) >= limits.max_hourly_auto_posts:
                oldest_hourly = hourly_posts[0]
                hourly_reset = (oldest_hourly + timedelta(hours=1) - now).total_seconds()
                if hourly_reset > 0:
                    wait_times.append(hourly_reset)

            return min(wait_times) if wait_times else 0

    def get_stats(self, org_id: str) -> dict[str, Any]:
        """Get posting statistics for an organization.

        Args:
            org_id: Organization ID.

        Returns:
            Dict with posting statistics.
        """
        limits = self.get_org_limits(org_id)
        history = self._post_history.get(org_id, [])

        now = datetime.utcnow()
        hour_ago = now - timedelta(hours=1)
        day_ago = now - timedelta(hours=24)

        # Calculate counts
        hourly_total = sum(1 for ts, _, _ in history if ts > hour_ago)
        daily_total = sum(1 for ts, _, _ in history if ts > day_ago)

        # Per-platform counts
        platform_counts: dict[str, dict[str, int]] = {}
        for ts, platform, target in history:
            if platform not in platform_counts:
                platform_counts[platform] = {"hourly": 0, "daily": 0}
            if ts > hour_ago:
                platform_counts[platform]["hourly"] += 1
            if ts > day_ago:
                platform_counts[platform]["daily"] += 1

        return {
            "organization_id": org_id,
            "auto_post_enabled": limits.auto_post_enabled,
            "limits": {
                "max_hourly": limits.max_hourly_auto_posts,
                "max_daily": limits.max_daily_auto_posts,
                "min_cts_score": limits.min_cts_score,
                "max_cta_level": limits.max_cta_level,
            },
            "usage": {
                "hourly": hourly_total,
                "daily": daily_total,
                "hourly_remaining": max(0, limits.max_hourly_auto_posts - hourly_total),
                "daily_remaining": max(0, limits.max_daily_auto_posts - daily_total),
            },
            "by_platform": platform_counts,
        }
