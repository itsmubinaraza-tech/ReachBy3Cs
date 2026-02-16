"""API routes for posting operations.

This module provides API endpoints for posting responses to platforms,
managing the posting queue, and checking posting status.
"""

import logging
from typing import Any, Literal

from fastapi import APIRouter, HTTPException, status, BackgroundTasks
from pydantic import BaseModel, Field

from src.posting import (
    PostResult,
    PostingQueue,
    QueueItem,
    QueueStatus,
    RedditPoster,
    TwitterPoster,
    ClipboardPoster,
)
from src.automation import (
    AutoPostEligibility,
    AutoPostWorker,
    AutoPostScheduler,
    OrgLimits,
    RateLimitManager,
    check_auto_post_eligibility,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/posting", tags=["Posting"])

# Global instances (would typically be dependency injected)
_posting_queue: PostingQueue | None = None
_rate_limit_manager: RateLimitManager | None = None
_auto_post_worker: AutoPostWorker | None = None
_scheduler: AutoPostScheduler | None = None


def get_posting_queue() -> PostingQueue:
    """Get or create the posting queue instance."""
    global _posting_queue
    if _posting_queue is None:
        _posting_queue = PostingQueue()
    return _posting_queue


def get_rate_limit_manager() -> RateLimitManager:
    """Get or create the rate limit manager instance."""
    global _rate_limit_manager
    if _rate_limit_manager is None:
        _rate_limit_manager = RateLimitManager()
    return _rate_limit_manager


# ============================================================
# Request/Response Models
# ============================================================


class PostRequestBody(BaseModel):
    """Request body for posting a response.

    Attributes:
        response_id: ID of the response to post.
        response_text: Text to post.
        target_url: URL to respond to.
        platform: Target platform.
        organization_id: Organization ID.
        apply_delay: Whether to apply human-like delay.
        original_text_length: Length of original post (for delay).
    """

    response_id: str = Field(description="Response ID")
    response_text: str = Field(description="Text to post", min_length=1)
    target_url: str = Field(description="URL to respond to")
    platform: Literal["reddit", "twitter", "clipboard"] = Field(description="Platform")
    organization_id: str = Field(description="Organization ID")
    apply_delay: bool = Field(default=True, description="Apply human-like delay")
    original_text_length: int = Field(default=0, description="Original post length")


class PostResponseBody(BaseModel):
    """Response body for posting operations."""

    success: bool
    response_id: str
    external_id: str | None = None
    external_url: str | None = None
    error: str | None = None
    method: str = "api"


class QueueRequestBody(BaseModel):
    """Request body for adding to posting queue."""

    response_id: str
    organization_id: str
    platform: str
    target_url: str
    response_text: str
    priority: int = Field(default=0, ge=0, le=100)
    metadata: dict[str, Any] = Field(default_factory=dict)


class QueueResponseBody(BaseModel):
    """Response body for queue operations."""

    queue_item_id: str
    response_id: str
    status: str
    priority: int
    position: int | None = None


class QueueStatusResponse(BaseModel):
    """Response for queue status check."""

    response_id: str
    queue_item_id: str | None = None
    status: str
    retry_count: int = 0
    last_error: str | None = None
    result: dict[str, Any] | None = None


class AutomationEnableRequest(BaseModel):
    """Request to enable auto-posting."""

    organization_id: str
    max_daily_auto_posts: int = Field(default=50, ge=0)
    max_hourly_auto_posts: int = Field(default=10, ge=0)
    min_cts_score: float = Field(default=0.7, ge=0.0, le=1.0)
    max_cta_level: int = Field(default=1, ge=0, le=3)
    allowed_risk_levels: list[str] = Field(default_factory=lambda: ["low"])


class AutomationStatusResponse(BaseModel):
    """Response for automation status."""

    organization_id: str
    auto_post_enabled: bool
    limits: dict[str, Any]
    usage: dict[str, Any]
    worker_status: str
    scheduler_status: dict[str, Any]


class EligibilityCheckRequest(BaseModel):
    """Request to check auto-post eligibility."""

    response_id: str
    organization_id: str
    cts_score: float = Field(ge=0.0, le=1.0)
    risk_level: str
    cta_level: int = Field(ge=0, le=3)
    platform: str
    can_auto_post: bool = False
    status: str = "pending"
    target_url: str = ""
    subreddit: str | None = None


class EligibilityCheckResponse(BaseModel):
    """Response for eligibility check."""

    eligible: bool
    reason: str
    checks_passed: list[str]
    checks_failed: list[str]
    requires_review: bool
    suggested_action: str


# ============================================================
# Posting Endpoints
# ============================================================


@router.post(
    "/post",
    response_model=PostResponseBody,
    status_code=status.HTTP_200_OK,
    summary="Post a Response",
    description="Post a response to a platform immediately.",
)
async def post_response(request: PostRequestBody) -> PostResponseBody:
    """Post a response to a platform.

    This endpoint posts a response immediately to the specified platform
    without going through the queue.

    Args:
        request: Post request containing response details.

    Returns:
        Post result with success status and external IDs.
    """
    logger.info(
        "Post request: response_id=%s, platform=%s",
        request.response_id,
        request.platform,
    )

    try:
        # Get appropriate poster
        if request.platform == "reddit":
            poster = RedditPoster()
        elif request.platform == "twitter":
            poster = TwitterPoster()
        elif request.platform == "clipboard":
            poster = ClipboardPoster()
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported platform: {request.platform}",
            )

        # Initialize and post
        await poster.initialize()
        try:
            result = await poster.post(
                response_text=request.response_text,
                target_url=request.target_url,
                apply_delay=request.apply_delay,
                original_text_length=request.original_text_length,
            )
        finally:
            await poster.close()

        # Record for rate limiting
        rate_manager = get_rate_limit_manager()
        await rate_manager.record_post(
            request.organization_id,
            request.platform,
            "",  # Would extract subreddit from URL
        )

        return PostResponseBody(
            success=result.success,
            response_id=request.response_id,
            external_id=result.external_id,
            external_url=result.external_url,
            error=result.error,
            method=result.method,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Posting failed: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Posting failed: {str(e)}",
        )


@router.post(
    "/queue",
    response_model=QueueResponseBody,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Add to Posting Queue",
    description="Add a response to the posting queue for async processing.",
)
async def add_to_queue(request: QueueRequestBody) -> QueueResponseBody:
    """Add a response to the posting queue.

    The response will be processed asynchronously with retry logic.

    Args:
        request: Queue request containing response details.

    Returns:
        Queue item details including ID and status.
    """
    logger.info(
        "Queue request: response_id=%s, platform=%s, priority=%d",
        request.response_id,
        request.platform,
        request.priority,
    )

    try:
        queue = get_posting_queue()

        item = await queue.enqueue(
            response_id=request.response_id,
            organization_id=request.organization_id,
            platform=request.platform,
            target_url=request.target_url,
            response_text=request.response_text,
            priority=request.priority,
            metadata=request.metadata,
        )

        return QueueResponseBody(
            queue_item_id=item.id,
            response_id=item.response_id,
            status=item.status.value,
            priority=item.priority,
            position=queue._queue.qsize(),
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error("Failed to queue response: %s", e, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to queue: {str(e)}",
        )


@router.get(
    "/status/{response_id}",
    response_model=QueueStatusResponse,
    summary="Check Posting Status",
    description="Check the posting status of a response.",
)
async def check_posting_status(response_id: str) -> QueueStatusResponse:
    """Check the posting status of a response.

    Args:
        response_id: ID of the response to check.

    Returns:
        Status information including queue position and errors.
    """
    queue = get_posting_queue()
    item = queue.get_status(response_id)

    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Response {response_id} not found in queue",
        )

    result_dict = None
    if item.result:
        result_dict = item.result.model_dump()

    return QueueStatusResponse(
        response_id=response_id,
        queue_item_id=item.id,
        status=item.status.value,
        retry_count=item.retry_count,
        last_error=item.last_error,
        result=result_dict,
    )


@router.delete(
    "/queue/{item_id}",
    status_code=status.HTTP_200_OK,
    summary="Cancel Queue Item",
    description="Cancel a queued posting item.",
)
async def cancel_queue_item(item_id: str) -> dict[str, Any]:
    """Cancel a queued posting item.

    Args:
        item_id: Queue item ID to cancel.

    Returns:
        Cancellation result.
    """
    queue = get_posting_queue()
    cancelled = await queue.cancel(item_id)

    if not cancelled:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Queue item {item_id} not found or already processing",
        )

    return {"cancelled": True, "item_id": item_id}


@router.get(
    "/queue/stats",
    summary="Get Queue Statistics",
    description="Get posting queue statistics.",
)
async def get_queue_stats() -> dict[str, Any]:
    """Get posting queue statistics.

    Returns:
        Queue statistics including counts by status.
    """
    queue = get_posting_queue()
    return queue.get_stats()


# ============================================================
# Automation Endpoints
# ============================================================


@router.post(
    "/automation/enable",
    response_model=AutomationStatusResponse,
    summary="Enable Auto-Posting",
    description="Enable auto-posting for an organization.",
)
async def enable_automation(request: AutomationEnableRequest) -> AutomationStatusResponse:
    """Enable auto-posting for an organization.

    Configures auto-posting limits and enables the automation.

    Args:
        request: Enable request with limits configuration.

    Returns:
        Updated automation status.
    """
    logger.info("Enabling auto-posting for org %s", request.organization_id)

    rate_manager = get_rate_limit_manager()

    limits = OrgLimits(
        organization_id=request.organization_id,
        max_daily_auto_posts=request.max_daily_auto_posts,
        max_hourly_auto_posts=request.max_hourly_auto_posts,
        min_cts_score=request.min_cts_score,
        max_cta_level=request.max_cta_level,
        allowed_risk_levels=request.allowed_risk_levels,
        auto_post_enabled=True,
    )

    rate_manager.set_org_limits(request.organization_id, limits)

    stats = rate_manager.get_stats(request.organization_id)

    return AutomationStatusResponse(
        organization_id=request.organization_id,
        auto_post_enabled=True,
        limits=stats["limits"],
        usage=stats["usage"],
        worker_status=_auto_post_worker.status.value if _auto_post_worker else "not_started",
        scheduler_status=_scheduler.get_stats() if _scheduler else {},
    )


@router.post(
    "/automation/disable",
    summary="Disable Auto-Posting",
    description="Disable auto-posting for an organization.",
)
async def disable_automation(organization_id: str) -> dict[str, Any]:
    """Disable auto-posting for an organization.

    Args:
        organization_id: Organization to disable.

    Returns:
        Updated status.
    """
    logger.info("Disabling auto-posting for org %s", organization_id)

    rate_manager = get_rate_limit_manager()
    limits = rate_manager.get_org_limits(organization_id)
    limits.auto_post_enabled = False
    rate_manager.set_org_limits(organization_id, limits)

    return {
        "organization_id": organization_id,
        "auto_post_enabled": False,
    }


@router.get(
    "/automation/status/{organization_id}",
    response_model=AutomationStatusResponse,
    summary="Get Automation Status",
    description="Get auto-posting status and statistics for an organization.",
)
async def get_automation_status(organization_id: str) -> AutomationStatusResponse:
    """Get auto-posting status for an organization.

    Args:
        organization_id: Organization to check.

    Returns:
        Automation status including limits and usage.
    """
    rate_manager = get_rate_limit_manager()
    limits = rate_manager.get_org_limits(organization_id)
    stats = rate_manager.get_stats(organization_id)

    return AutomationStatusResponse(
        organization_id=organization_id,
        auto_post_enabled=limits.auto_post_enabled,
        limits=stats["limits"],
        usage=stats["usage"],
        worker_status=_auto_post_worker.status.value if _auto_post_worker else "not_started",
        scheduler_status=_scheduler.get_stats() if _scheduler else {},
    )


@router.put(
    "/automation/limits/{organization_id}",
    summary="Update Auto-Post Limits",
    description="Update auto-posting limits for an organization.",
)
async def update_automation_limits(
    organization_id: str,
    limits: AutomationEnableRequest,
) -> dict[str, Any]:
    """Update auto-posting limits for an organization.

    Args:
        organization_id: Organization to update.
        limits: New limits configuration.

    Returns:
        Updated limits.
    """
    rate_manager = get_rate_limit_manager()

    org_limits = OrgLimits(
        organization_id=organization_id,
        max_daily_auto_posts=limits.max_daily_auto_posts,
        max_hourly_auto_posts=limits.max_hourly_auto_posts,
        min_cts_score=limits.min_cts_score,
        max_cta_level=limits.max_cta_level,
        allowed_risk_levels=limits.allowed_risk_levels,
        auto_post_enabled=rate_manager.get_org_limits(organization_id).auto_post_enabled,
    )

    rate_manager.set_org_limits(organization_id, org_limits)

    return rate_manager.get_stats(organization_id)


@router.post(
    "/automation/eligibility",
    response_model=EligibilityCheckResponse,
    summary="Check Auto-Post Eligibility",
    description="Check if a response is eligible for auto-posting.",
)
async def check_eligibility(request: EligibilityCheckRequest) -> EligibilityCheckResponse:
    """Check if a response is eligible for auto-posting.

    Args:
        request: Eligibility check request.

    Returns:
        Eligibility result with details.
    """
    rate_manager = get_rate_limit_manager()
    org_limits = rate_manager.get_org_limits(request.organization_id)

    result = await check_auto_post_eligibility(
        response_id=request.response_id,
        cts_score=request.cts_score,
        risk_level=request.risk_level,
        cta_level=request.cta_level,
        platform=request.platform,
        org_limits=org_limits,
        can_auto_post=request.can_auto_post,
        status=request.status,
        target_url=request.target_url,
        subreddit=request.subreddit,
        rate_limit_manager=rate_manager,
    )

    return EligibilityCheckResponse(
        eligible=result.eligible,
        reason=result.reason,
        checks_passed=result.checks_passed,
        checks_failed=result.checks_failed,
        requires_review=result.requires_review,
        suggested_action=result.suggested_action,
    )


@router.post(
    "/automation/trigger",
    summary="Trigger Auto-Post Check",
    description="Manually trigger an auto-post eligibility check.",
)
async def trigger_auto_post_check(background_tasks: BackgroundTasks) -> dict[str, Any]:
    """Manually trigger an auto-post eligibility check.

    Useful for testing or immediate processing needs.

    Returns:
        Trigger status.
    """
    if _auto_post_worker is None:
        return {
            "triggered": False,
            "error": "Auto-post worker not initialized",
        }

    # Run in background
    background_tasks.add_task(_auto_post_worker.trigger_check)

    return {
        "triggered": True,
        "message": "Auto-post check triggered",
    }


# ============================================================
# Health Endpoints
# ============================================================


@router.get(
    "/health",
    summary="Posting Service Health",
    description="Check health of posting service components.",
)
async def posting_health() -> dict[str, Any]:
    """Check health of posting service components.

    Returns:
        Health status of all components.
    """
    health = {
        "queue": get_posting_queue().get_stats(),
        "rate_limiter": "healthy",
    }

    # Check platform posters
    platforms = {}

    try:
        reddit = RedditPoster()
        await reddit.initialize()
        platforms["reddit"] = await reddit.health_check()
        await reddit.close()
    except Exception as e:
        platforms["reddit"] = {"status": "error", "error": str(e)}

    try:
        twitter = TwitterPoster()
        await twitter.initialize()
        platforms["twitter"] = await twitter.health_check()
        await twitter.close()
    except Exception as e:
        platforms["twitter"] = {"status": "error", "error": str(e)}

    health["platforms"] = platforms

    if _auto_post_worker:
        health["worker"] = _auto_post_worker.get_stats()

    if _scheduler:
        health["scheduler"] = _scheduler.get_stats()

    return health
