"""Auto-post eligibility checking.

This module provides eligibility checking for automatic posting,
evaluating CTS scores, risk levels, CTA levels, and rate limits.
"""

import logging
from typing import Any

from pydantic import BaseModel, Field

from src.automation.limits import OrgLimits, RateLimitManager

logger = logging.getLogger(__name__)


class EligibilityResult(BaseModel):
    """Result of an eligibility check.

    Attributes:
        eligible: Whether the response is eligible for auto-posting.
        reason: Human-readable reason for the decision.
        checks_passed: List of checks that passed.
        checks_failed: List of checks that failed.
        requires_review: Whether manual review is required.
        suggested_action: Suggested action to take.
    """

    eligible: bool = Field(description="Whether eligible for auto-posting")
    reason: str = Field(description="Reason for the decision")
    checks_passed: list[str] = Field(default_factory=list)
    checks_failed: list[str] = Field(default_factory=list)
    requires_review: bool = Field(default=False)
    suggested_action: str = Field(default="")
    metadata: dict[str, Any] = Field(default_factory=dict)


class ResponseData(BaseModel):
    """Data about a response for eligibility checking.

    Attributes:
        response_id: ID of the response.
        cts_score: CTS (Commitment-to-Send) score.
        risk_level: Risk level (low, medium, high, blocked).
        cta_level: CTA level (0-3).
        platform: Target platform.
        can_auto_post: Whether marked as can auto-post by pipeline.
        status: Current response status.
        target_url: URL to respond to.
        subreddit: Subreddit name (for Reddit).
    """

    response_id: str
    cts_score: float = Field(ge=0.0, le=1.0)
    risk_level: str
    cta_level: int = Field(ge=0, le=3)
    platform: str
    can_auto_post: bool = False
    status: str = "pending"
    target_url: str = ""
    subreddit: str | None = None


class AutoPostEligibility:
    """Checks eligibility of responses for auto-posting.

    Evaluates multiple criteria including CTS score, risk level,
    CTA level, and rate limits to determine if a response can
    be automatically posted.
    """

    def __init__(
        self,
        rate_limit_manager: RateLimitManager | None = None,
    ) -> None:
        """Initialize the eligibility checker.

        Args:
            rate_limit_manager: Rate limit manager instance.
        """
        self.rate_limit_manager = rate_limit_manager or RateLimitManager()
        self.logger = logging.getLogger(f"{__name__}.AutoPostEligibility")

    async def check(
        self,
        response: ResponseData,
        org_limits: OrgLimits,
    ) -> EligibilityResult:
        """Check if a response is eligible for auto-posting.

        Args:
            response: Response data to check.
            org_limits: Organization limits to apply.

        Returns:
            EligibilityResult with the decision and details.
        """
        checks_passed = []
        checks_failed = []
        metadata: dict[str, Any] = {}

        # Check 1: Auto-posting enabled for organization
        if not org_limits.auto_post_enabled:
            return EligibilityResult(
                eligible=False,
                reason="Auto-posting is disabled for this organization",
                checks_failed=["org_auto_post_enabled"],
                suggested_action="Enable auto-posting in organization settings",
            )
        checks_passed.append("org_auto_post_enabled")

        # Check 2: Response status is approved or pending
        if response.status not in ("pending", "approved"):
            return EligibilityResult(
                eligible=False,
                reason=f"Response status is '{response.status}', must be 'pending' or 'approved'",
                checks_failed=["response_status"],
                checks_passed=checks_passed,
                suggested_action="Approve the response first",
            )
        checks_passed.append("response_status")

        # Check 3: Pipeline marked it as can_auto_post
        if not response.can_auto_post:
            checks_failed.append("pipeline_can_auto_post")
            metadata["pipeline_decision"] = "not_eligible"
        else:
            checks_passed.append("pipeline_can_auto_post")

        # Check 4: CTS score meets threshold
        if response.cts_score < org_limits.min_cts_score:
            checks_failed.append("cts_score")
            metadata["cts_score"] = response.cts_score
            metadata["min_cts_score"] = org_limits.min_cts_score
        else:
            checks_passed.append("cts_score")
            metadata["cts_score"] = response.cts_score

        # Check 5: Risk level is acceptable
        if response.risk_level not in org_limits.allowed_risk_levels:
            checks_failed.append("risk_level")
            metadata["risk_level"] = response.risk_level
            metadata["allowed_risk_levels"] = org_limits.allowed_risk_levels
        else:
            checks_passed.append("risk_level")

        # Check 6: CTA level is acceptable
        if response.cta_level > org_limits.max_cta_level:
            checks_failed.append("cta_level")
            metadata["cta_level"] = response.cta_level
            metadata["max_cta_level"] = org_limits.max_cta_level
        else:
            checks_passed.append("cta_level")

        # Check 7: Platform rate limits
        target = response.subreddit or ""
        rate_allowed, rate_reason = await self.rate_limit_manager.check_limits(
            org_limits.organization_id,
            response.platform,
            target,
        )

        if not rate_allowed:
            checks_failed.append("rate_limits")
            metadata["rate_limit_reason"] = rate_reason

            # Get time until allowed
            wait_time = await self.rate_limit_manager.get_time_until_allowed(
                org_limits.organization_id,
                response.platform,
                target,
            )
            metadata["retry_after_seconds"] = wait_time
        else:
            checks_passed.append("rate_limits")

        # Check 8: Blacklisted subreddits
        if (
            response.subreddit and
            response.subreddit.lower() in [s.lower() for s in org_limits.blacklisted_subreddits]
        ):
            checks_failed.append("subreddit_blacklist")
            metadata["blacklisted_subreddit"] = response.subreddit
        else:
            checks_passed.append("subreddit_not_blacklisted")

        # Determine final eligibility
        if checks_failed:
            # Determine if review is needed vs outright rejection
            requires_review = any(
                check in checks_failed
                for check in ["cts_score", "cta_level", "pipeline_can_auto_post"]
            )

            if requires_review:
                suggested_action = "Send to human review queue"
            elif "rate_limits" in checks_failed:
                suggested_action = f"Retry after {metadata.get('retry_after_seconds', 60):.0f} seconds"
            else:
                suggested_action = "Cannot auto-post - requires manual posting"

            # Build reason string
            failed_reasons = []
            if "cts_score" in checks_failed:
                failed_reasons.append(
                    f"CTS score {response.cts_score:.2f} below threshold {org_limits.min_cts_score}"
                )
            if "risk_level" in checks_failed:
                failed_reasons.append(
                    f"Risk level '{response.risk_level}' not in allowed levels {org_limits.allowed_risk_levels}"
                )
            if "cta_level" in checks_failed:
                failed_reasons.append(
                    f"CTA level {response.cta_level} exceeds max {org_limits.max_cta_level}"
                )
            if "rate_limits" in checks_failed:
                failed_reasons.append(f"Rate limit: {rate_reason}")
            if "subreddit_blacklist" in checks_failed:
                failed_reasons.append(f"Subreddit {response.subreddit} is blacklisted")
            if "pipeline_can_auto_post" in checks_failed:
                failed_reasons.append("Pipeline marked as not eligible for auto-post")

            return EligibilityResult(
                eligible=False,
                reason="; ".join(failed_reasons),
                checks_passed=checks_passed,
                checks_failed=checks_failed,
                requires_review=requires_review,
                suggested_action=suggested_action,
                metadata=metadata,
            )

        # All checks passed
        return EligibilityResult(
            eligible=True,
            reason="All eligibility checks passed",
            checks_passed=checks_passed,
            checks_failed=[],
            requires_review=False,
            suggested_action="Auto-post",
            metadata=metadata,
        )


async def check_auto_post_eligibility(
    response_id: str,
    cts_score: float,
    risk_level: str,
    cta_level: int,
    platform: str,
    org_limits: OrgLimits,
    can_auto_post: bool = False,
    status: str = "pending",
    target_url: str = "",
    subreddit: str | None = None,
    rate_limit_manager: RateLimitManager | None = None,
) -> EligibilityResult:
    """Convenience function to check auto-post eligibility.

    Args:
        response_id: ID of the response.
        cts_score: CTS score.
        risk_level: Risk level.
        cta_level: CTA level.
        platform: Target platform.
        org_limits: Organization limits.
        can_auto_post: Whether pipeline marked as can auto-post.
        status: Current response status.
        target_url: URL to respond to.
        subreddit: Subreddit name (for Reddit).
        rate_limit_manager: Rate limit manager instance.

    Returns:
        EligibilityResult with the decision.
    """
    response = ResponseData(
        response_id=response_id,
        cts_score=cts_score,
        risk_level=risk_level,
        cta_level=cta_level,
        platform=platform,
        can_auto_post=can_auto_post,
        status=status,
        target_url=target_url,
        subreddit=subreddit,
    )

    checker = AutoPostEligibility(rate_limit_manager=rate_limit_manager)
    return await checker.check(response, org_limits)
