"""Posting queue with retry logic and priority management.

This module provides a queue system for managing response posting
with support for priorities, retries, and rate limit handling.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Callable, Awaitable
from uuid import uuid4

from pydantic import BaseModel, Field

from src.posting.base import PostResult

logger = logging.getLogger(__name__)


class QueueStatus(str, Enum):
    """Status of a queue item."""

    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    RETRY_PENDING = "retry_pending"
    CANCELLED = "cancelled"
    RATE_LIMITED = "rate_limited"


class QueueItem(BaseModel):
    """Represents an item in the posting queue.

    Attributes:
        id: Unique identifier for this queue item.
        response_id: ID of the response to post.
        organization_id: Organization that owns this response.
        platform: Target platform (reddit, twitter, etc.).
        target_url: URL to post the response to.
        response_text: The text to post.
        priority: Priority level (higher = more urgent).
        status: Current status of the queue item.
        retry_count: Number of retry attempts made.
        max_retries: Maximum number of retries allowed.
        created_at: When the item was added to queue.
        scheduled_for: When the item should be processed.
        started_at: When processing started.
        completed_at: When processing completed.
        last_error: Last error message if any.
        result: Final posting result.
    """

    id: str = Field(default_factory=lambda: str(uuid4()))
    response_id: str
    organization_id: str
    platform: str
    target_url: str
    response_text: str
    priority: int = Field(default=0, ge=0, le=100)
    status: QueueStatus = Field(default=QueueStatus.QUEUED)
    retry_count: int = Field(default=0, ge=0)
    max_retries: int = Field(default=3, ge=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    scheduled_for: datetime | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    last_error: str | None = None
    result: PostResult | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)

    class Config:
        """Pydantic model configuration."""

        json_encoders = {datetime: lambda v: v.isoformat()}


class PostingQueue:
    """Queue for managing response posting with retry logic.

    Provides priority-based queuing, automatic retries with exponential
    backoff, and rate limit handling.

    Attributes:
        max_retries: Maximum number of retry attempts.
        base_retry_delay: Base delay between retries in seconds.
        max_retry_delay: Maximum delay between retries in seconds.
    """

    def __init__(
        self,
        max_retries: int = 3,
        base_retry_delay: float = 60.0,
        max_retry_delay: float = 900.0,  # 15 minutes
        max_queue_size: int = 10000,
    ) -> None:
        """Initialize the posting queue.

        Args:
            max_retries: Maximum number of retry attempts.
            base_retry_delay: Base delay between retries in seconds.
            max_retry_delay: Maximum delay between retries in seconds.
            max_queue_size: Maximum number of items in queue.
        """
        self.max_retries = max_retries
        self.base_retry_delay = base_retry_delay
        self.max_retry_delay = max_retry_delay
        self.max_queue_size = max_queue_size

        self._queue: asyncio.PriorityQueue[tuple[int, float, QueueItem]] = (
            asyncio.PriorityQueue(maxsize=max_queue_size)
        )
        self._items: dict[str, QueueItem] = {}
        self._processing: set[str] = set()
        self._lock = asyncio.Lock()
        self._running = False
        self._workers: list[asyncio.Task] = []

        # Callbacks
        self._post_callback: Callable[[QueueItem], Awaitable[PostResult]] | None = None
        self._on_success: Callable[[QueueItem, PostResult], Awaitable[None]] | None = None
        self._on_failure: Callable[[QueueItem, str], Awaitable[None]] | None = None

        self.logger = logging.getLogger(f"{__name__}.PostingQueue")

    async def enqueue(
        self,
        response_id: str,
        organization_id: str,
        platform: str,
        target_url: str,
        response_text: str,
        priority: int = 0,
        scheduled_for: datetime | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> QueueItem:
        """Add a response to the posting queue.

        Args:
            response_id: ID of the response to post.
            organization_id: Organization that owns this response.
            platform: Target platform.
            target_url: URL to post to.
            response_text: Text to post.
            priority: Priority level (0-100, higher is more urgent).
            scheduled_for: When to process (None = immediately).
            metadata: Additional metadata.

        Returns:
            The created queue item.

        Raises:
            ValueError: If queue is full.
        """
        async with self._lock:
            if len(self._items) >= self.max_queue_size:
                raise ValueError("Queue is full")

            item = QueueItem(
                response_id=response_id,
                organization_id=organization_id,
                platform=platform,
                target_url=target_url,
                response_text=response_text,
                priority=priority,
                max_retries=self.max_retries,
                scheduled_for=scheduled_for,
                metadata=metadata or {},
            )

            # Priority queue uses (priority, timestamp, item)
            # Negative priority so higher priority numbers are processed first
            queue_priority = (
                -priority,
                (scheduled_for or item.created_at).timestamp(),
                item,
            )

            await self._queue.put(queue_priority)
            self._items[item.id] = item

            self.logger.info(
                "Enqueued response %s for %s (priority=%d)",
                response_id,
                platform,
                priority,
            )

            return item

    async def dequeue(self) -> QueueItem | None:
        """Get the next item from the queue.

        Waits for scheduled items and respects priorities.

        Returns:
            The next queue item, or None if queue is empty.
        """
        try:
            while True:
                _, scheduled_time, item = await asyncio.wait_for(
                    self._queue.get(),
                    timeout=1.0,
                )

                # Check if item was cancelled
                if item.id not in self._items:
                    continue

                # Check if scheduled for later
                if item.scheduled_for and datetime.utcnow() < item.scheduled_for:
                    # Re-queue for later
                    await self._queue.put((-item.priority, scheduled_time, item))
                    await asyncio.sleep(1)
                    continue

                # Check if already being processed
                if item.id in self._processing:
                    continue

                async with self._lock:
                    self._processing.add(item.id)
                    item.status = QueueStatus.PROCESSING
                    item.started_at = datetime.utcnow()

                return item

        except asyncio.TimeoutError:
            return None

    async def complete(
        self,
        item_id: str,
        result: PostResult,
    ) -> None:
        """Mark a queue item as completed.

        Args:
            item_id: ID of the queue item.
            result: The posting result.
        """
        async with self._lock:
            if item_id not in self._items:
                return

            item = self._items[item_id]
            item.completed_at = datetime.utcnow()
            item.result = result

            if result.success:
                item.status = QueueStatus.COMPLETED
                self._processing.discard(item_id)

                if self._on_success:
                    try:
                        await self._on_success(item, result)
                    except Exception as e:
                        self.logger.error("Error in success callback: %s", e)

            else:
                # Handle failure
                await self._handle_failure(item, result)

    async def _handle_failure(
        self,
        item: QueueItem,
        result: PostResult,
    ) -> None:
        """Handle a failed posting attempt.

        Args:
            item: The queue item that failed.
            result: The posting result.
        """
        item.last_error = result.error
        item.retry_count += 1

        # Check if should retry
        if result.retryable and item.retry_count < item.max_retries:
            # Calculate retry delay with exponential backoff
            delay = min(
                self.base_retry_delay * (2 ** (item.retry_count - 1)),
                self.max_retry_delay,
            )

            # Check for rate limit specific delay
            if result.error_code == "RATELIMIT" and result.metadata.get("wait_seconds"):
                delay = max(delay, float(result.metadata["wait_seconds"]))

            item.status = QueueStatus.RETRY_PENDING
            item.scheduled_for = datetime.utcnow() + timedelta(seconds=delay)

            # Re-queue for retry
            await self._queue.put((
                -item.priority,
                item.scheduled_for.timestamp(),
                item,
            ))

            self._processing.discard(item.id)

            self.logger.info(
                "Scheduled retry %d/%d for %s in %.1f seconds",
                item.retry_count,
                item.max_retries,
                item.response_id,
                delay,
            )

        else:
            # Max retries exceeded or non-retryable error
            item.status = QueueStatus.FAILED
            self._processing.discard(item.id)

            if self._on_failure:
                try:
                    await self._on_failure(item, result.error or "Unknown error")
                except Exception as e:
                    self.logger.error("Error in failure callback: %s", e)

            self.logger.error(
                "Failed to post response %s after %d attempts: %s",
                item.response_id,
                item.retry_count,
                result.error,
            )

    async def cancel(self, item_id: str) -> bool:
        """Cancel a queued item.

        Args:
            item_id: ID of the queue item to cancel.

        Returns:
            True if cancelled, False if not found or already processing.
        """
        async with self._lock:
            if item_id not in self._items:
                return False

            item = self._items[item_id]

            if item.status == QueueStatus.PROCESSING:
                return False

            item.status = QueueStatus.CANCELLED
            del self._items[item_id]
            return True

    def get_item(self, item_id: str) -> QueueItem | None:
        """Get a queue item by ID.

        Args:
            item_id: ID of the queue item.

        Returns:
            The queue item, or None if not found.
        """
        return self._items.get(item_id)

    def get_status(self, response_id: str) -> QueueItem | None:
        """Get the queue item for a response.

        Args:
            response_id: ID of the response.

        Returns:
            The queue item, or None if not found.
        """
        for item in self._items.values():
            if item.response_id == response_id:
                return item
        return None

    def get_stats(self) -> dict[str, Any]:
        """Get queue statistics.

        Returns:
            Dict with queue statistics.
        """
        status_counts = {status: 0 for status in QueueStatus}
        platform_counts: dict[str, int] = {}

        for item in self._items.values():
            status_counts[item.status] += 1
            platform_counts[item.platform] = platform_counts.get(item.platform, 0) + 1

        return {
            "total_items": len(self._items),
            "processing": len(self._processing),
            "queue_size": self._queue.qsize(),
            "by_status": {k.value: v for k, v in status_counts.items()},
            "by_platform": platform_counts,
            "running": self._running,
            "worker_count": len(self._workers),
        }

    def set_post_callback(
        self,
        callback: Callable[[QueueItem], Awaitable[PostResult]],
    ) -> None:
        """Set the callback for posting items.

        Args:
            callback: Async function that takes a QueueItem and returns PostResult.
        """
        self._post_callback = callback

    def set_success_callback(
        self,
        callback: Callable[[QueueItem, PostResult], Awaitable[None]],
    ) -> None:
        """Set the callback for successful posts.

        Args:
            callback: Async function called on successful post.
        """
        self._on_success = callback

    def set_failure_callback(
        self,
        callback: Callable[[QueueItem, str], Awaitable[None]],
    ) -> None:
        """Set the callback for failed posts.

        Args:
            callback: Async function called when post fails permanently.
        """
        self._on_failure = callback

    async def start(self, num_workers: int = 3) -> None:
        """Start the queue processor.

        Args:
            num_workers: Number of worker tasks to start.
        """
        if self._running:
            return

        if not self._post_callback:
            raise ValueError("Post callback not set")

        self._running = True

        for i in range(num_workers):
            worker = asyncio.create_task(self._worker_loop(f"worker-{i}"))
            self._workers.append(worker)

        self.logger.info("Started %d queue workers", num_workers)

    async def stop(self, timeout: float = 30.0) -> None:
        """Stop the queue processor.

        Args:
            timeout: Maximum time to wait for workers to finish.
        """
        self._running = False

        # Wait for workers to finish
        if self._workers:
            done, pending = await asyncio.wait(
                self._workers,
                timeout=timeout,
            )

            for task in pending:
                task.cancel()

        self._workers.clear()
        self.logger.info("Stopped queue workers")

    async def _worker_loop(self, name: str) -> None:
        """Worker loop for processing queue items.

        Args:
            name: Worker name for logging.
        """
        self.logger.debug("Worker %s started", name)

        while self._running:
            try:
                item = await self.dequeue()

                if item is None:
                    continue

                self.logger.debug(
                    "Worker %s processing %s",
                    name,
                    item.response_id,
                )

                try:
                    result = await self._post_callback(item)
                    await self.complete(item.id, result)

                except Exception as e:
                    self.logger.error(
                        "Worker %s error processing %s: %s",
                        name,
                        item.response_id,
                        e,
                    )
                    await self.complete(
                        item.id,
                        PostResult(
                            success=False,
                            error=str(e),
                            error_code="WORKER_ERROR",
                            retryable=True,
                            platform=item.platform,
                        ),
                    )

            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error("Worker %s error: %s", name, e)
                await asyncio.sleep(1)

        self.logger.debug("Worker %s stopped", name)
