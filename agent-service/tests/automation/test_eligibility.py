"""Tests for auto-post eligibility checking."""

import pytest

from src.automation.eligibility import (
    AutoPostEligibility,
    EligibilityResult,
    ResponseData,
    check_auto_post_eligibility,
)
from src.automation.limits import OrgLimits, RateLimitManager


@pytest.fixture
def rate_limit_manager():
    """Create a rate limit manager for testing."""
    return RateLimitManager()


@pytest.fixture
def org_limits():
    """Create default org limits for testing."""
    return OrgLimits(
        organization_id="org-123",
        max_daily_auto_posts=50,
        max_hourly_auto_posts=10,
        min_cts_score=0.7,
        max_cta_level=1,
        allowed_risk_levels=["low"],
        auto_post_enabled=True,
    )


@pytest.fixture
def eligible_response():
    """Create a response that should be eligible."""
    return ResponseData(
        response_id="resp-123",
        cts_score=0.85,
        risk_level="low",
        cta_level=0,
        platform="reddit",
        can_auto_post=True,
        status="approved",
        target_url="https://reddit.com/r/test/comments/abc",
        subreddit="test",
    )


class TestAutoPostEligibility:
    """Tests for AutoPostEligibility class."""

    @pytest.mark.asyncio
    async def test_eligible_response(
        self, rate_limit_manager, org_limits, eligible_response
    ):
        """Test that an eligible response passes all checks."""
        checker = AutoPostEligibility(rate_limit_manager)
        result = await checker.check(eligible_response, org_limits)

        assert result.eligible is True
        assert "cts_score" in result.checks_passed
        assert "risk_level" in result.checks_passed
        assert "cta_level" in result.checks_passed
        assert len(result.checks_failed) == 0

    @pytest.mark.asyncio
    async def test_low_cts_score(
        self, rate_limit_manager, org_limits, eligible_response
    ):
        """Test that low CTS score fails eligibility."""
        eligible_response.cts_score = 0.5  # Below threshold
        checker = AutoPostEligibility(rate_limit_manager)
        result = await checker.check(eligible_response, org_limits)

        assert result.eligible is False
        assert "cts_score" in result.checks_failed
        assert "CTS score" in result.reason

    @pytest.mark.asyncio
    async def test_high_risk_level(
        self, rate_limit_manager, org_limits, eligible_response
    ):
        """Test that high risk level fails eligibility."""
        eligible_response.risk_level = "high"
        checker = AutoPostEligibility(rate_limit_manager)
        result = await checker.check(eligible_response, org_limits)

        assert result.eligible is False
        assert "risk_level" in result.checks_failed

    @pytest.mark.asyncio
    async def test_high_cta_level(
        self, rate_limit_manager, org_limits, eligible_response
    ):
        """Test that high CTA level fails eligibility."""
        eligible_response.cta_level = 2  # Above max
        checker = AutoPostEligibility(rate_limit_manager)
        result = await checker.check(eligible_response, org_limits)

        assert result.eligible is False
        assert "cta_level" in result.checks_failed

    @pytest.mark.asyncio
    async def test_disabled_auto_post(
        self, rate_limit_manager, org_limits, eligible_response
    ):
        """Test that disabled auto-post fails immediately."""
        org_limits.auto_post_enabled = False
        checker = AutoPostEligibility(rate_limit_manager)
        result = await checker.check(eligible_response, org_limits)

        assert result.eligible is False
        assert "disabled" in result.reason.lower()

    @pytest.mark.asyncio
    async def test_invalid_status(
        self, rate_limit_manager, org_limits, eligible_response
    ):
        """Test that invalid status fails eligibility."""
        eligible_response.status = "rejected"
        checker = AutoPostEligibility(rate_limit_manager)
        result = await checker.check(eligible_response, org_limits)

        assert result.eligible is False
        assert "response_status" in result.checks_failed

    @pytest.mark.asyncio
    async def test_blacklisted_subreddit(
        self, rate_limit_manager, org_limits, eligible_response
    ):
        """Test that blacklisted subreddits fail eligibility."""
        org_limits.blacklisted_subreddits = ["test", "spam"]
        checker = AutoPostEligibility(rate_limit_manager)
        result = await checker.check(eligible_response, org_limits)

        assert result.eligible is False
        assert "subreddit_blacklist" in result.checks_failed

    @pytest.mark.asyncio
    async def test_rate_limit_exceeded(
        self, rate_limit_manager, org_limits, eligible_response
    ):
        """Test that rate limit exceeded fails eligibility."""
        # Exhaust hourly limit
        for _ in range(10):
            await rate_limit_manager.record_post("org-123", "reddit", "test")

        checker = AutoPostEligibility(rate_limit_manager)
        result = await checker.check(eligible_response, org_limits)

        assert result.eligible is False
        assert "rate_limits" in result.checks_failed

    @pytest.mark.asyncio
    async def test_requires_review_flag(
        self, rate_limit_manager, org_limits, eligible_response
    ):
        """Test that certain failures require review."""
        eligible_response.cts_score = 0.65  # Just below threshold
        checker = AutoPostEligibility(rate_limit_manager)
        result = await checker.check(eligible_response, org_limits)

        assert result.eligible is False
        assert result.requires_review is True

    @pytest.mark.asyncio
    async def test_pipeline_can_auto_post_false(
        self, rate_limit_manager, org_limits, eligible_response
    ):
        """Test that pipeline can_auto_post=False is respected."""
        eligible_response.can_auto_post = False
        checker = AutoPostEligibility(rate_limit_manager)
        result = await checker.check(eligible_response, org_limits)

        assert result.eligible is False
        assert "pipeline_can_auto_post" in result.checks_failed


class TestCheckAutoPostEligibilityFunction:
    """Tests for the convenience function."""

    @pytest.mark.asyncio
    async def test_convenience_function(self, org_limits):
        """Test the convenience function works correctly."""
        result = await check_auto_post_eligibility(
            response_id="resp-123",
            cts_score=0.85,
            risk_level="low",
            cta_level=0,
            platform="reddit",
            org_limits=org_limits,
            can_auto_post=True,
            status="approved",
        )

        assert result.eligible is True

    @pytest.mark.asyncio
    async def test_with_custom_rate_limit_manager(self, org_limits):
        """Test using a custom rate limit manager."""
        rate_manager = RateLimitManager()

        result = await check_auto_post_eligibility(
            response_id="resp-123",
            cts_score=0.85,
            risk_level="low",
            cta_level=0,
            platform="reddit",
            org_limits=org_limits,
            rate_limit_manager=rate_manager,
        )

        assert isinstance(result, EligibilityResult)
