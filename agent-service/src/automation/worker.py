"""Background worker for auto-posting operations.

This module provides a background worker that processes eligible
responses and posts them automatically to their target platforms.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Callable, Awaitable

from src.automation.eligibility import AutoPostEligibility, ResponseData
from src.automation.limits import OrgLimits, RateLimitManager
from src.posting.base import PostResult
from src.posting.queue import PostingQueue, QueueItem

logger = logging.getLogger(__name__)


class WorkerStatus(str, Enum):
    """Status of the auto-post worker."""

    STOPPED = "stopped"
    STARTING = "starting"
    RUNNING = "running"
    PAUSED = "paused"
    STOPPING = "stopping"
    ERROR = "error"


class AutoPostWorker:
    """Background worker for processing auto-post responses.

    Periodically checks for eligible responses and queues them
    for automatic posting.

    Attributes:
        check_interval: Seconds between checking for new responses.
        batch_size: Maximum responses to process per check.
        status: Current worker status.
    """

    def __init__(
        self,
        check_interval: int = 300,  # 5 minutes
        batch_size: int = 10,
        posting_queue: PostingQueue | None = None,
        rate_limit_manager: RateLimitManager | None = None,
    ) -> None:
        """Initialize the auto-post worker.

        Args:
            check_interval: Seconds between checks for new responses.
            batch_size: Maximum responses to process per check.
            posting_queue: Queue for posting operations.
            rate_limit_manager: Rate limit manager.
        """
        self.check_interval = check_interval
        self.batch_size = batch_size
        self.posting_queue = posting_queue or PostingQueue()
        self.rate_limit_manager = rate_limit_manager or RateLimitManager()
        self.eligibility_checker = AutoPostEligibility(self.rate_limit_manager)

        self.status = WorkerStatus.STOPPED
        self._task: asyncio.Task | None = None
        self._stop_event = asyncio.Event()
        self._pause_event = asyncio.Event()
        self._pause_event.set()  # Not paused by default

        # Callbacks
        self._fetch_responses: Callable[
            [int], Awaitable[list[dict[str, Any]]]
        ] | None = None
        self._fetch_org_limits: Callable[
            [str], Awaitable[OrgLimits]
        ] | None = None
        self._update_response_status: Callable[
            [str, str, str | None], Awaitable[None]
        ] | None = None
        self._log_audit: Callable[
            [str, str, str, dict[str, Any]], Awaitable[None]
        ] | None = None

        # Statistics
        self._stats = {
            "total_processed": 0,
            "total_posted": 0,
            "total_failed": 0,
            "total_skipped": 0,
            "last_run_at": None,
            "last_run_duration_ms": 0,
            "errors": [],
        }

        self.logger = logging.getLogger(f"{__name__}.AutoPostWorker")

    def set_fetch_responses_callback(
        self,
        callback: Callable[[int], Awaitable[list[dict[str, Any]]]],
    ) -> None:
        """Set callback for fetching eligible responses from database.

        Args:
            callback: Async function that takes batch_size and returns
                     list of response dicts with required fields.
        """
        self._fetch_responses = callback

    def set_fetch_org_limits_callback(
        self,
        callback: Callable[[str], Awaitable[OrgLimits]],
    ) -> None:
        """Set callback for fetching organization limits.

        Args:
            callback: Async function that takes org_id and returns OrgLimits.
        """
        self._fetch_org_limits = callback

    def set_update_response_status_callback(
        self,
        callback: Callable[[str, str, str | None], Awaitable[None]],
    ) -> None:
        """Set callback for updating response status in database.

        Args:
            callback: Async function that takes (response_id, status, error).
        """
        self._update_response_status = callback

    def set_audit_callback(
        self,
        callback: Callable[[str, str, str, dict[str, Any]], Awaitable[None]],
    ) -> None:
        """Set callback for logging audit events.

        Args:
            callback: Async function that takes (org_id, action, entity_id, data).
        """
        self._log_audit = callback

    async def start(self) -> None:
        """Start the background worker."""
        if self.status == WorkerStatus.RUNNING:
            return

        if not self._fetch_responses:
            raise ValueError("fetch_responses callback not set")

        self.status = WorkerStatus.STARTING
        self._stop_event.clear()

        self._task = asyncio.create_task(self._run_loop())
        self.status = WorkerStatus.RUNNING

        self.logger.info(
            "Auto-post worker started (interval=%ds, batch=%d)",
            self.check_interval,
            self.batch_size,
        )

    async def stop(self, timeout: float = 30.0) -> None:
        """Stop the background worker.

        Args:
            timeout: Maximum time to wait for graceful shutdown.
        """
        if self.status == WorkerStatus.STOPPED:
            return

        self.status = WorkerStatus.STOPPING
        self._stop_event.set()

        if self._task:
            try:
                await asyncio.wait_for(self._task, timeout=timeout)
            except asyncio.TimeoutError:
                self._task.cancel()
                try:
                    await self._task
                except asyncio.CancelledError:
                    pass

        self._task = None
        self.status = WorkerStatus.STOPPED
        self.logger.info("Auto-post worker stopped")

    async def pause(self) -> None:
        """Pause the worker (completes current batch first)."""
        self._pause_event.clear()
        self.status = WorkerStatus.PAUSED
        self.logger.info("Auto-post worker paused")

    async def resume(self) -> None:
        """Resume a paused worker."""
        self._pause_event.set()
        self.status = WorkerStatus.RUNNING
        self.logger.info("Auto-post worker resumed")

    async def _run_loop(self) -> None:
        """Main worker loop."""
        while not self._stop_event.is_set():
            try:
                # Wait for pause to clear
                await self._pause_event.wait()

                # Process eligible responses
                await self.process_eligible_responses()

                # Wait for next check interval or stop signal
                try:
                    await asyncio.wait_for(
                        self._stop_event.wait(),
                        timeout=self.check_interval,
                    )
                    break  # Stop event was set
                except asyncio.TimeoutError:
                    pass  # Normal timeout, continue loop

            except Exception as e:
                self.logger.error("Error in worker loop: %s", e, exc_info=True)
                self._stats["errors"].append({
                    "time": datetime.utcnow().isoformat(),
                    "error": str(e),
                })
                # Keep only last 100 errors
                self._stats["errors"] = self._stats["errors"][-100:]

                # Wait before retrying
                await asyncio.sleep(60)

    async def process_eligible_responses(self) -> int:
        """Process a batch of eligible responses.

        Returns:
            Number of responses processed.
        """
        start_time = datetime.utcnow()

        try:
            # Fetch responses that might be eligible
            responses = await self._fetch_responses(self.batch_size)

            if not responses:
                return 0

            processed = 0
            posted = 0
            failed = 0
            skipped = 0

            for response_data in responses:
                try:
                    result = await self._process_single_response(response_data)

                    if result == "posted":
                        posted += 1
                    elif result == "failed":
                        failed += 1
                    else:
                        skipped += 1

                    processed += 1

                except Exception as e:
                    self.logger.error(
                        "Error processing response %s: %s",
                        response_data.get("response_id"),
                        e,
                    )
                    failed += 1
                    processed += 1

            # Update stats
            duration = (datetime.utcnow() - start_time).total_seconds() * 1000
            self._stats["total_processed"] += processed
            self._stats["total_posted"] += posted
            self._stats["total_failed"] += failed
            self._stats["total_skipped"] += skipped
            self._stats["last_run_at"] = start_time.isoformat()
            self._stats["last_run_duration_ms"] = int(duration)

            self.logger.info(
                "Processed %d responses: %d posted, %d failed, %d skipped (%.0fms)",
                processed,
                posted,
                failed,
                skipped,
                duration,
            )

            return processed

        except Exception as e:
            self.logger.error("Error fetching responses: %s", e)
            self._stats["errors"].append({
                "time": datetime.utcnow().isoformat(),
                "error": f"Fetch error: {str(e)}",
            })
            return 0

    async def _process_single_response(
        self,
        response_data: dict[str, Any],
    ) -> str:
        """Process a single response for auto-posting.

        Args:
            response_data: Response data dict.

        Returns:
            Status string: "posted", "failed", or "skipped".
        """
        response_id = response_data["response_id"]
        org_id = response_data["organization_id"]

        # Build ResponseData for eligibility check
        response = ResponseData(
            response_id=response_id,
            cts_score=response_data.get("cts_score", 0.0),
            risk_level=response_data.get("risk_level", "unknown"),
            cta_level=response_data.get("cta_level", 3),
            platform=response_data.get("platform", "unknown"),
            can_auto_post=response_data.get("can_auto_post", False),
            status=response_data.get("status", "pending"),
            target_url=response_data.get("target_url", ""),
            subreddit=response_data.get("subreddit"),
        )

        # Get organization limits
        if self._fetch_org_limits:
            org_limits = await self._fetch_org_limits(org_id)
        else:
            org_limits = OrgLimits(organization_id=org_id)

        # Check eligibility
        eligibility = await self.eligibility_checker.check(response, org_limits)

        if not eligibility.eligible:
            self.logger.debug(
                "Response %s not eligible: %s",
                response_id,
                eligibility.reason,
            )

            # Log audit if callback set
            if self._log_audit:
                await self._log_audit(
                    org_id,
                    "auto_post.skipped",
                    response_id,
                    {
                        "reason": eligibility.reason,
                        "checks_failed": eligibility.checks_failed,
                        "requires_review": eligibility.requires_review,
                    },
                )

            return "skipped"

        # Queue for posting
        try:
            queue_item = await self.posting_queue.enqueue(
                response_id=response_id,
                organization_id=org_id,
                platform=response.platform,
                target_url=response.target_url,
                response_text=response_data.get("selected_response", ""),
                priority=self._calculate_priority(response_data),
                metadata={
                    "cts_score": response.cts_score,
                    "risk_level": response.risk_level,
                    "cta_level": response.cta_level,
                    "subreddit": response.subreddit,
                    "auto_posted": True,
                },
            )

            # Update response status
            if self._update_response_status:
                await self._update_response_status(response_id, "posting", None)

            # Record for rate limiting
            await self.rate_limit_manager.record_post(
                org_id,
                response.platform,
                response.subreddit or "",
            )

            # Log audit
            if self._log_audit:
                await self._log_audit(
                    org_id,
                    "auto_post.queued",
                    response_id,
                    {
                        "queue_item_id": queue_item.id,
                        "priority": queue_item.priority,
                        "eligibility": eligibility.model_dump(),
                    },
                )

            self.logger.info(
                "Queued response %s for auto-posting (priority=%d)",
                response_id,
                queue_item.priority,
            )

            return "posted"

        except Exception as e:
            self.logger.error(
                "Failed to queue response %s: %s",
                response_id,
                e,
            )

            if self._update_response_status:
                await self._update_response_status(response_id, "failed", str(e))

            if self._log_audit:
                await self._log_audit(
                    org_id,
                    "auto_post.queue_failed",
                    response_id,
                    {"error": str(e)},
                )

            return "failed"

    def _calculate_priority(self, response_data: dict[str, Any]) -> int:
        """Calculate posting priority based on response data.

        Higher priority = processed first.

        Args:
            response_data: Response data dict.

        Returns:
            Priority value (0-100).
        """
        priority = 50  # Base priority

        # Higher CTS score = higher priority
        cts_score = response_data.get("cts_score", 0.5)
        priority += int(cts_score * 20)

        # Lower CTA level = higher priority
        cta_level = response_data.get("cta_level", 2)
        priority += (3 - cta_level) * 5

        # Recently created posts get higher priority
        created_at = response_data.get("created_at")
        if created_at:
            if isinstance(created_at, str):
                created_at = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
            age_hours = (datetime.utcnow() - created_at.replace(tzinfo=None)).total_seconds() / 3600
            if age_hours < 1:
                priority += 10
            elif age_hours < 6:
                priority += 5

        return min(100, max(0, priority))

    def get_stats(self) -> dict[str, Any]:
        """Get worker statistics.

        Returns:
            Dict with worker statistics.
        """
        return {
            "status": self.status.value,
            "check_interval_seconds": self.check_interval,
            "batch_size": self.batch_size,
            **self._stats,
            "queue_stats": self.posting_queue.get_stats(),
            "rate_limit_stats": {},  # Would need org_id to get specific stats
        }

    async def trigger_check(self) -> int:
        """Manually trigger a check for eligible responses.

        Useful for testing or immediate processing needs.

        Returns:
            Number of responses processed.
        """
        if self.status != WorkerStatus.RUNNING:
            self.logger.warning("Worker not running, starting temporary check")

        return await self.process_eligible_responses()
