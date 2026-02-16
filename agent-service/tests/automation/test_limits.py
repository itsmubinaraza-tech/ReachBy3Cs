"""Tests for rate limits and daily caps."""

import pytest
from datetime import datetime, timedelta

from src.automation.limits import (
    OrgLimits,
    PlatformLimits,
    RateLimitManager,
    DEFAULT_ORG_LIMITS,
)


@pytest.fixture
def rate_limit_manager():
    """Create a rate limit manager for testing."""
    return RateLimitManager()


@pytest.fixture
def custom_org_limits():
    """Create custom org limits for testing."""
    return OrgLimits(
        organization_id="org-123",
        max_daily_auto_posts=20,
        max_hourly_auto_posts=5,
        min_cts_score=0.8,
        max_cta_level=0,
        allowed_risk_levels=["low"],
        platform_limits={
            "reddit": PlatformLimits(
                platform="reddit",
                posts_per_hour=5,
                posts_per_day=20,
                min_gap_seconds=120,
                subreddit_gap_seconds=600,
            ),
        },
        auto_post_enabled=True,
    )


class TestOrgLimits:
    """Tests for OrgLimits model."""

    def test_default_limits(self):
        """Test default org limits."""
        limits = OrgLimits(organization_id="test")

        assert limits.max_daily_auto_posts == 50
        assert limits.max_hourly_auto_posts == 10
        assert limits.min_cts_score == 0.7
        assert limits.max_cta_level == 1
        assert limits.auto_post_enabled is True

    def test_custom_limits(self):
        """Test custom org limits."""
        limits = OrgLimits(
            organization_id="test",
            max_daily_auto_posts=100,
            max_hourly_auto_posts=20,
            min_cts_score=0.9,
        )

        assert limits.max_daily_auto_posts == 100
        assert limits.max_hourly_auto_posts == 20
        assert limits.min_cts_score == 0.9

    def test_default_org_limits_constant(self):
        """Test the DEFAULT_ORG_LIMITS constant."""
        assert DEFAULT_ORG_LIMITS.max_daily_auto_posts == 50
        assert DEFAULT_ORG_LIMITS.max_hourly_auto_posts == 10
        assert "reddit" in DEFAULT_ORG_LIMITS.platform_limits


class TestPlatformLimits:
    """Tests for PlatformLimits model."""

    def test_default_platform_limits(self):
        """Test default platform limits."""
        limits = PlatformLimits(platform="reddit")

        assert limits.posts_per_hour == 10
        assert limits.posts_per_day == 50
        assert limits.min_gap_seconds == 60
        assert limits.subreddit_gap_seconds == 300
        assert limits.enabled is True

    def test_custom_platform_limits(self):
        """Test custom platform limits."""
        limits = PlatformLimits(
            platform="twitter",
            posts_per_hour=20,
            posts_per_day=100,
            min_gap_seconds=30,
        )

        assert limits.posts_per_hour == 20
        assert limits.posts_per_day == 100
        assert limits.min_gap_seconds == 30


class TestRateLimitManager:
    """Tests for RateLimitManager class."""

    @pytest.mark.asyncio
    async def test_set_and_get_org_limits(self, rate_limit_manager, custom_org_limits):
        """Test setting and getting org limits."""
        rate_limit_manager.set_org_limits("org-123", custom_org_limits)
        retrieved = rate_limit_manager.get_org_limits("org-123")

        assert retrieved.organization_id == "org-123"
        assert retrieved.max_daily_auto_posts == 20

    def test_get_default_limits_for_unknown_org(self, rate_limit_manager):
        """Test getting default limits for unknown org."""
        limits = rate_limit_manager.get_org_limits("unknown-org")

        assert limits.organization_id == "unknown-org"
        assert limits.max_daily_auto_posts == 50  # Default value

    @pytest.mark.asyncio
    async def test_record_post(self, rate_limit_manager):
        """Test recording a post."""
        await rate_limit_manager.record_post("org-123", "reddit", "python")

        stats = rate_limit_manager.get_stats("org-123")
        assert stats["usage"]["hourly"] == 1
        assert stats["usage"]["daily"] == 1

    @pytest.mark.asyncio
    async def test_check_limits_allowed(self, rate_limit_manager):
        """Test checking limits when allowed."""
        allowed, reason = await rate_limit_manager.check_limits(
            "org-123", "reddit", "python"
        )

        assert allowed is True
        assert reason == "OK"

    @pytest.mark.asyncio
    async def test_check_hourly_limit(self, rate_limit_manager, custom_org_limits):
        """Test hourly limit enforcement."""
        rate_limit_manager.set_org_limits("org-123", custom_org_limits)

        # Make 5 posts (the hourly limit)
        for i in range(5):
            await rate_limit_manager.record_post("org-123", "reddit", f"sub-{i}")

        # Next should be blocked
        allowed, reason = await rate_limit_manager.check_limits(
            "org-123", "reddit", "test"
        )

        assert allowed is False
        assert "hourly" in reason.lower()

    @pytest.mark.asyncio
    async def test_check_min_gap(self, rate_limit_manager, custom_org_limits):
        """Test minimum gap between posts."""
        rate_limit_manager.set_org_limits("org-123", custom_org_limits)

        # Make a post
        await rate_limit_manager.record_post("org-123", "reddit", "test")

        # Immediate next post should be blocked by gap
        allowed, reason = await rate_limit_manager.check_limits(
            "org-123", "reddit", "other"
        )

        assert allowed is False
        assert "gap" in reason.lower()

    @pytest.mark.asyncio
    async def test_check_subreddit_gap(self, rate_limit_manager, custom_org_limits):
        """Test subreddit-specific gap for Reddit."""
        rate_limit_manager.set_org_limits("org-123", custom_org_limits)

        # Make a post to a subreddit
        await rate_limit_manager.record_post("org-123", "reddit", "python")

        # Post to same subreddit should be blocked
        # (even if we wait past min_gap)
        import asyncio
        await asyncio.sleep(0.1)

        # This would still be blocked by subreddit gap
        allowed, reason = await rate_limit_manager.check_limits(
            "org-123", "reddit", "python"
        )

        assert allowed is False
        assert "gap" in reason.lower()

    @pytest.mark.asyncio
    async def test_check_blacklisted_subreddit(
        self, rate_limit_manager, custom_org_limits
    ):
        """Test blacklisted subreddit check."""
        custom_org_limits.blacklisted_subreddits = ["spam", "ads"]
        rate_limit_manager.set_org_limits("org-123", custom_org_limits)

        allowed, reason = await rate_limit_manager.check_limits(
            "org-123", "reddit", "spam"
        )

        assert allowed is False
        assert "blacklisted" in reason.lower()

    @pytest.mark.asyncio
    async def test_check_disabled_auto_post(
        self, rate_limit_manager, custom_org_limits
    ):
        """Test disabled auto-posting."""
        custom_org_limits.auto_post_enabled = False
        rate_limit_manager.set_org_limits("org-123", custom_org_limits)

        allowed, reason = await rate_limit_manager.check_limits(
            "org-123", "reddit", "test"
        )

        assert allowed is False
        assert "disabled" in reason.lower()

    @pytest.mark.asyncio
    async def test_get_time_until_allowed(self, rate_limit_manager, custom_org_limits):
        """Test getting time until posting is allowed."""
        rate_limit_manager.set_org_limits("org-123", custom_org_limits)

        # When no posts, should be 0
        wait = await rate_limit_manager.get_time_until_allowed(
            "org-123", "reddit", "test"
        )
        assert wait == 0

        # Make a post
        await rate_limit_manager.record_post("org-123", "reddit", "test")

        # Should have to wait for min_gap
        wait = await rate_limit_manager.get_time_until_allowed(
            "org-123", "reddit", "other"
        )
        # min_gap is 120 seconds in custom_org_limits
        assert 0 < wait <= 130  # Allow some tolerance

    @pytest.mark.asyncio
    async def test_get_stats(self, rate_limit_manager, custom_org_limits):
        """Test getting statistics."""
        rate_limit_manager.set_org_limits("org-123", custom_org_limits)

        # Make some posts
        await rate_limit_manager.record_post("org-123", "reddit", "sub1")
        await rate_limit_manager.record_post("org-123", "reddit", "sub2")
        await rate_limit_manager.record_post("org-123", "twitter", "user1")

        stats = rate_limit_manager.get_stats("org-123")

        assert stats["organization_id"] == "org-123"
        assert stats["auto_post_enabled"] is True
        assert stats["usage"]["hourly"] == 3
        assert stats["usage"]["daily"] == 3
        assert stats["by_platform"]["reddit"]["hourly"] == 2
        assert stats["by_platform"]["twitter"]["hourly"] == 1
