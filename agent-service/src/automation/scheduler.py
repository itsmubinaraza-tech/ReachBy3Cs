"""Scheduler for auto-post operations.

This module provides scheduling capabilities for auto-post checks
and other periodic automation tasks.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from enum import Enum
from typing import Any, Callable, Awaitable
from uuid import uuid4

from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)


class TaskStatus(str, Enum):
    """Status of a scheduled task."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"
    PAUSED = "paused"


class ScheduledTask(BaseModel):
    """Represents a scheduled task.

    Attributes:
        id: Unique task identifier.
        name: Human-readable task name.
        description: Task description.
        interval_seconds: Seconds between executions.
        next_run_at: When the task should next run.
        last_run_at: When the task last ran.
        last_run_duration_ms: Duration of last run in milliseconds.
        last_error: Last error message if any.
        status: Current task status.
        run_count: Number of times task has run.
        error_count: Number of errors encountered.
        enabled: Whether task is enabled.
        metadata: Additional task metadata.
    """

    id: str = Field(default_factory=lambda: str(uuid4()))
    name: str
    description: str = ""
    interval_seconds: int = Field(default=300, ge=1)
    next_run_at: datetime | None = None
    last_run_at: datetime | None = None
    last_run_duration_ms: int = 0
    last_error: str | None = None
    status: TaskStatus = TaskStatus.PENDING
    run_count: int = 0
    error_count: int = 0
    enabled: bool = True
    metadata: dict[str, Any] = Field(default_factory=dict)


class AutoPostScheduler:
    """Scheduler for managing periodic auto-post tasks.

    Manages scheduled tasks for auto-posting including:
    - Eligibility checking
    - Queue processing
    - Cleanup operations
    - Statistics collection
    """

    def __init__(self) -> None:
        """Initialize the scheduler."""
        self._tasks: dict[str, ScheduledTask] = {}
        self._callbacks: dict[str, Callable[[], Awaitable[Any]]] = {}
        self._running = False
        self._scheduler_task: asyncio.Task | None = None
        self._lock = asyncio.Lock()

        self.logger = logging.getLogger(f"{__name__}.AutoPostScheduler")

    def register_task(
        self,
        name: str,
        callback: Callable[[], Awaitable[Any]],
        interval_seconds: int = 300,
        description: str = "",
        enabled: bool = True,
        run_immediately: bool = False,
        metadata: dict[str, Any] | None = None,
    ) -> ScheduledTask:
        """Register a new scheduled task.

        Args:
            name: Unique task name.
            callback: Async function to run.
            interval_seconds: Seconds between runs.
            description: Task description.
            enabled: Whether task is enabled.
            run_immediately: Whether to run immediately on start.
            metadata: Additional metadata.

        Returns:
            The created ScheduledTask.

        Raises:
            ValueError: If task with name already exists.
        """
        if name in self._tasks:
            raise ValueError(f"Task '{name}' already registered")

        task = ScheduledTask(
            name=name,
            description=description,
            interval_seconds=interval_seconds,
            enabled=enabled,
            metadata=metadata or {},
        )

        if run_immediately:
            task.next_run_at = datetime.utcnow()
        else:
            task.next_run_at = datetime.utcnow() + timedelta(seconds=interval_seconds)

        self._tasks[name] = task
        self._callbacks[name] = callback

        self.logger.info(
            "Registered task '%s' (interval=%ds, enabled=%s)",
            name,
            interval_seconds,
            enabled,
        )

        return task

    def unregister_task(self, name: str) -> bool:
        """Unregister a scheduled task.

        Args:
            name: Task name to unregister.

        Returns:
            True if task was found and removed.
        """
        if name in self._tasks:
            del self._tasks[name]
            del self._callbacks[name]
            self.logger.info("Unregistered task '%s'", name)
            return True
        return False

    def get_task(self, name: str) -> ScheduledTask | None:
        """Get a task by name.

        Args:
            name: Task name.

        Returns:
            The task or None if not found.
        """
        return self._tasks.get(name)

    def get_all_tasks(self) -> list[ScheduledTask]:
        """Get all registered tasks.

        Returns:
            List of all tasks.
        """
        return list(self._tasks.values())

    def enable_task(self, name: str) -> bool:
        """Enable a task.

        Args:
            name: Task name.

        Returns:
            True if task was found and enabled.
        """
        if name in self._tasks:
            self._tasks[name].enabled = True
            self._tasks[name].status = TaskStatus.PENDING
            self.logger.info("Enabled task '%s'", name)
            return True
        return False

    def disable_task(self, name: str) -> bool:
        """Disable a task.

        Args:
            name: Task name.

        Returns:
            True if task was found and disabled.
        """
        if name in self._tasks:
            self._tasks[name].enabled = False
            self._tasks[name].status = TaskStatus.PAUSED
            self.logger.info("Disabled task '%s'", name)
            return True
        return False

    def update_interval(self, name: str, interval_seconds: int) -> bool:
        """Update task interval.

        Args:
            name: Task name.
            interval_seconds: New interval in seconds.

        Returns:
            True if task was found and updated.
        """
        if name in self._tasks:
            self._tasks[name].interval_seconds = interval_seconds
            self.logger.info("Updated task '%s' interval to %ds", name, interval_seconds)
            return True
        return False

    async def trigger_task(self, name: str) -> Any:
        """Manually trigger a task to run immediately.

        Args:
            name: Task name.

        Returns:
            Result from the task callback.

        Raises:
            ValueError: If task not found.
        """
        if name not in self._tasks:
            raise ValueError(f"Task '{name}' not found")

        return await self._run_task(name)

    async def start(self) -> None:
        """Start the scheduler."""
        if self._running:
            return

        self._running = True
        self._scheduler_task = asyncio.create_task(self._scheduler_loop())
        self.logger.info("Scheduler started with %d tasks", len(self._tasks))

    async def stop(self, timeout: float = 30.0) -> None:
        """Stop the scheduler.

        Args:
            timeout: Maximum time to wait for graceful shutdown.
        """
        if not self._running:
            return

        self._running = False

        if self._scheduler_task:
            try:
                await asyncio.wait_for(self._scheduler_task, timeout=timeout)
            except asyncio.TimeoutError:
                self._scheduler_task.cancel()
                try:
                    await self._scheduler_task
                except asyncio.CancelledError:
                    pass

        self._scheduler_task = None
        self.logger.info("Scheduler stopped")

    async def _scheduler_loop(self) -> None:
        """Main scheduler loop."""
        while self._running:
            try:
                await self._check_and_run_tasks()
                await asyncio.sleep(1)  # Check every second

            except asyncio.CancelledError:
                break
            except Exception as e:
                self.logger.error("Error in scheduler loop: %s", e, exc_info=True)
                await asyncio.sleep(5)

    async def _check_and_run_tasks(self) -> None:
        """Check for tasks due to run and execute them."""
        now = datetime.utcnow()

        for name, task in self._tasks.items():
            if not task.enabled:
                continue

            if task.status == TaskStatus.RUNNING:
                continue

            if task.next_run_at and task.next_run_at <= now:
                # Run task in background
                asyncio.create_task(self._run_task(name))

    async def _run_task(self, name: str) -> Any:
        """Run a specific task.

        Args:
            name: Task name.

        Returns:
            Result from the task callback.
        """
        task = self._tasks.get(name)
        callback = self._callbacks.get(name)

        if not task or not callback:
            return None

        async with self._lock:
            task.status = TaskStatus.RUNNING
            task.last_run_at = datetime.utcnow()

        start_time = datetime.utcnow()
        result = None

        try:
            self.logger.debug("Running task '%s'", name)
            result = await callback()

            # Update task on success
            async with self._lock:
                duration = (datetime.utcnow() - start_time).total_seconds() * 1000
                task.last_run_duration_ms = int(duration)
                task.run_count += 1
                task.status = TaskStatus.COMPLETED
                task.last_error = None
                task.next_run_at = datetime.utcnow() + timedelta(seconds=task.interval_seconds)

            self.logger.debug(
                "Task '%s' completed in %dms",
                name,
                task.last_run_duration_ms,
            )

        except Exception as e:
            self.logger.error("Task '%s' failed: %s", name, e, exc_info=True)

            async with self._lock:
                duration = (datetime.utcnow() - start_time).total_seconds() * 1000
                task.last_run_duration_ms = int(duration)
                task.error_count += 1
                task.run_count += 1
                task.status = TaskStatus.FAILED
                task.last_error = str(e)
                # Still schedule next run
                task.next_run_at = datetime.utcnow() + timedelta(seconds=task.interval_seconds)

        return result

    def get_stats(self) -> dict[str, Any]:
        """Get scheduler statistics.

        Returns:
            Dict with scheduler statistics.
        """
        total_runs = sum(t.run_count for t in self._tasks.values())
        total_errors = sum(t.error_count for t in self._tasks.values())

        return {
            "running": self._running,
            "task_count": len(self._tasks),
            "enabled_tasks": sum(1 for t in self._tasks.values() if t.enabled),
            "total_runs": total_runs,
            "total_errors": total_errors,
            "tasks": {
                name: {
                    "status": task.status.value,
                    "enabled": task.enabled,
                    "interval_seconds": task.interval_seconds,
                    "last_run_at": task.last_run_at.isoformat() if task.last_run_at else None,
                    "next_run_at": task.next_run_at.isoformat() if task.next_run_at else None,
                    "run_count": task.run_count,
                    "error_count": task.error_count,
                    "last_error": task.last_error,
                }
                for name, task in self._tasks.items()
            },
        }


def create_default_scheduler(
    auto_post_worker: Any,
    check_interval: int = 300,
) -> AutoPostScheduler:
    """Create a scheduler with default auto-post tasks.

    Args:
        auto_post_worker: AutoPostWorker instance.
        check_interval: Seconds between auto-post checks.

    Returns:
        Configured scheduler.
    """
    scheduler = AutoPostScheduler()

    # Register auto-post check task
    scheduler.register_task(
        name="auto_post_check",
        callback=auto_post_worker.process_eligible_responses,
        interval_seconds=check_interval,
        description="Check for eligible responses and queue for auto-posting",
        enabled=True,
        run_immediately=False,
    )

    return scheduler
