"""Tests for posting queue module."""

import asyncio
from datetime import datetime, timedelta

import pytest

from src.posting.base import PostResult
from src.posting.queue import PostingQueue, QueueItem, QueueStatus


@pytest.fixture
def posting_queue():
    """Create a posting queue for testing."""
    return PostingQueue(max_retries=3, base_retry_delay=1.0, max_retry_delay=10.0)


class TestPostingQueue:
    """Tests for PostingQueue class."""

    @pytest.mark.asyncio
    async def test_enqueue_item(self, posting_queue):
        """Test adding an item to the queue."""
        item = await posting_queue.enqueue(
            response_id="resp-123",
            organization_id="org-456",
            platform="reddit",
            target_url="https://reddit.com/r/test/comments/abc",
            response_text="Test response",
            priority=50,
        )

        assert item.response_id == "resp-123"
        assert item.organization_id == "org-456"
        assert item.platform == "reddit"
        assert item.status == QueueStatus.QUEUED
        assert item.priority == 50
        assert item.retry_count == 0

    @pytest.mark.asyncio
    async def test_priority_ordering(self, posting_queue):
        """Test that higher priority items are processed first."""
        # Add items with different priorities
        await posting_queue.enqueue(
            response_id="low",
            organization_id="org",
            platform="reddit",
            target_url="url",
            response_text="text",
            priority=10,
        )
        await posting_queue.enqueue(
            response_id="high",
            organization_id="org",
            platform="reddit",
            target_url="url",
            response_text="text",
            priority=90,
        )
        await posting_queue.enqueue(
            response_id="medium",
            organization_id="org",
            platform="reddit",
            target_url="url",
            response_text="text",
            priority=50,
        )

        # Dequeue and verify order
        item1 = await posting_queue.dequeue()
        item2 = await posting_queue.dequeue()
        item3 = await posting_queue.dequeue()

        assert item1.response_id == "high"
        assert item2.response_id == "medium"
        assert item3.response_id == "low"

    @pytest.mark.asyncio
    async def test_complete_success(self, posting_queue):
        """Test completing an item successfully."""
        item = await posting_queue.enqueue(
            response_id="resp-123",
            organization_id="org",
            platform="reddit",
            target_url="url",
            response_text="text",
        )

        # Dequeue to start processing
        dequeued = await posting_queue.dequeue()
        assert dequeued.status == QueueStatus.PROCESSING

        # Complete successfully
        result = PostResult(
            success=True,
            external_id="ext-abc",
            external_url="https://reddit.com/comment/abc",
            posted_at=datetime.utcnow(),
            platform="reddit",
        )
        await posting_queue.complete(item.id, result)

        # Verify status
        completed = posting_queue.get_item(item.id)
        assert completed.status == QueueStatus.COMPLETED
        assert completed.result.external_id == "ext-abc"

    @pytest.mark.asyncio
    async def test_retry_on_failure(self, posting_queue):
        """Test that retryable failures are re-queued."""
        item = await posting_queue.enqueue(
            response_id="resp-123",
            organization_id="org",
            platform="reddit",
            target_url="url",
            response_text="text",
        )

        # Dequeue and fail
        await posting_queue.dequeue()
        result = PostResult(
            success=False,
            error="Temporary error",
            error_code="TEMP_ERROR",
            retryable=True,
            platform="reddit",
        )
        await posting_queue.complete(item.id, result)

        # Verify retry was scheduled
        updated = posting_queue.get_item(item.id)
        assert updated.status == QueueStatus.RETRY_PENDING
        assert updated.retry_count == 1
        assert updated.scheduled_for is not None

    @pytest.mark.asyncio
    async def test_max_retries(self, posting_queue):
        """Test that max retries results in failed status."""
        item = await posting_queue.enqueue(
            response_id="resp-123",
            organization_id="org",
            platform="reddit",
            target_url="url",
            response_text="text",
        )

        # Fail multiple times
        for i in range(4):  # max_retries + 1
            await posting_queue.dequeue()
            result = PostResult(
                success=False,
                error="Persistent error",
                retryable=True,
                platform="reddit",
            )
            await posting_queue.complete(item.id, result)

            # Wait for scheduled retry if not last attempt
            if i < 3:
                await asyncio.sleep(0.1)

        # After max retries, should be failed
        final = posting_queue.get_item(item.id)
        assert final.status == QueueStatus.FAILED

    @pytest.mark.asyncio
    async def test_non_retryable_failure(self, posting_queue):
        """Test that non-retryable failures fail immediately."""
        item = await posting_queue.enqueue(
            response_id="resp-123",
            organization_id="org",
            platform="reddit",
            target_url="url",
            response_text="text",
        )

        # Dequeue and fail with non-retryable error
        await posting_queue.dequeue()
        result = PostResult(
            success=False,
            error="Auth failed",
            error_code="AUTH_FAILED",
            retryable=False,
            platform="reddit",
        )
        await posting_queue.complete(item.id, result)

        # Should be failed immediately
        failed = posting_queue.get_item(item.id)
        assert failed.status == QueueStatus.FAILED
        assert failed.retry_count == 1

    @pytest.mark.asyncio
    async def test_cancel_queued_item(self, posting_queue):
        """Test cancelling a queued item."""
        item = await posting_queue.enqueue(
            response_id="resp-123",
            organization_id="org",
            platform="reddit",
            target_url="url",
            response_text="text",
        )

        cancelled = await posting_queue.cancel(item.id)
        assert cancelled is True

        # Item should no longer exist
        assert posting_queue.get_item(item.id) is None

    @pytest.mark.asyncio
    async def test_cannot_cancel_processing_item(self, posting_queue):
        """Test that processing items cannot be cancelled."""
        item = await posting_queue.enqueue(
            response_id="resp-123",
            organization_id="org",
            platform="reddit",
            target_url="url",
            response_text="text",
        )

        # Start processing
        await posting_queue.dequeue()

        # Try to cancel
        cancelled = await posting_queue.cancel(item.id)
        assert cancelled is False

    @pytest.mark.asyncio
    async def test_get_stats(self, posting_queue):
        """Test getting queue statistics."""
        # Add some items
        await posting_queue.enqueue(
            response_id="resp-1",
            organization_id="org",
            platform="reddit",
            target_url="url",
            response_text="text",
        )
        await posting_queue.enqueue(
            response_id="resp-2",
            organization_id="org",
            platform="twitter",
            target_url="url",
            response_text="text",
        )

        stats = posting_queue.get_stats()

        assert stats["total_items"] == 2
        assert stats["by_status"]["queued"] == 2
        assert stats["by_platform"]["reddit"] == 1
        assert stats["by_platform"]["twitter"] == 1

    @pytest.mark.asyncio
    async def test_scheduled_items(self, posting_queue):
        """Test that scheduled items wait until their time."""
        future_time = datetime.utcnow() + timedelta(seconds=10)

        await posting_queue.enqueue(
            response_id="resp-123",
            organization_id="org",
            platform="reddit",
            target_url="url",
            response_text="text",
            scheduled_for=future_time,
        )

        # Try to dequeue - should timeout since item is scheduled for future
        item = await asyncio.wait_for(
            posting_queue.dequeue(),
            timeout=0.5,
        )

        # Item should be None due to timeout
        # (the item gets re-queued for its scheduled time)
        assert item is None or item.scheduled_for > datetime.utcnow()

    @pytest.mark.asyncio
    async def test_get_status_by_response_id(self, posting_queue):
        """Test getting queue status by response ID."""
        await posting_queue.enqueue(
            response_id="resp-123",
            organization_id="org",
            platform="reddit",
            target_url="url",
            response_text="text",
        )

        item = posting_queue.get_status("resp-123")
        assert item is not None
        assert item.response_id == "resp-123"

        # Non-existent response
        missing = posting_queue.get_status("resp-nonexistent")
        assert missing is None
