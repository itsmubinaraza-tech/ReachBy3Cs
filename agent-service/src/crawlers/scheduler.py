"""Crawl scheduler for ReachBy3Cs platform.

This module provides scheduling functionality to run crawls
at regular intervals across multiple platforms.
"""

import asyncio
import logging
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Callable, Coroutine

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from src.crawlers.base import BaseCrawler, CrawlResult

logger = logging.getLogger(__name__)


class CrawlFrequency(str, Enum):
    """Predefined crawl frequencies."""

    HOURLY = "hourly"
    EVERY_6_HOURS = "every_6_hours"
    DAILY = "daily"
    TWICE_DAILY = "twice_daily"
    FOUR_TIMES_DAILY = "four_times_daily"
    WEEKLY = "weekly"


@dataclass
class CrawlConfig:
    """Configuration for a scheduled crawl.

    Attributes:
        name: Unique name for this crawl configuration.
        platform: Platform to crawl (reddit, twitter, quora, google).
        keywords: Keywords to search for.
        sources: Platform-specific sources (subreddits, topics, etc.).
        frequency: How often to run the crawl.
        limit: Maximum results per crawl.
        enabled: Whether this crawl is enabled.
        extra_params: Additional platform-specific parameters.
        last_run: Timestamp of last run.
        last_result: Result of last run.
    """

    name: str
    platform: str
    keywords: list[str]
    sources: list[str] | None = None
    frequency: CrawlFrequency = CrawlFrequency.EVERY_6_HOURS
    limit: int = 100
    enabled: bool = True
    extra_params: dict[str, Any] = field(default_factory=dict)
    last_run: datetime | None = None
    last_result: CrawlResult | None = None


@dataclass
class CrawlJobStatus:
    """Status of a crawl job.

    Attributes:
        job_id: Unique job identifier.
        config_name: Name of the crawl configuration.
        platform: Platform being crawled.
        next_run: Next scheduled run time.
        last_run: Last run time.
        last_status: Status of last run.
        total_runs: Total number of runs.
        successful_runs: Number of successful runs.
        failed_runs: Number of failed runs.
    """

    job_id: str
    config_name: str
    platform: str
    next_run: datetime | None = None
    last_run: datetime | None = None
    last_status: str = "pending"
    total_runs: int = 0
    successful_runs: int = 0
    failed_runs: int = 0


class CrawlScheduler:
    """Scheduler for automated crawling across platforms.

    Manages scheduled crawl jobs using APScheduler and coordinates
    execution across multiple platform crawlers.

    Attributes:
        scheduler: APScheduler AsyncIOScheduler instance.
        crawlers: Dict mapping platform names to crawler instances.
        configs: Dict mapping config names to CrawlConfig objects.
        job_statuses: Dict mapping job IDs to CrawlJobStatus objects.
    """

    def __init__(self) -> None:
        """Initialize the crawl scheduler."""
        self.scheduler = AsyncIOScheduler()
        self.crawlers: dict[str, BaseCrawler] = {}
        self.configs: dict[str, CrawlConfig] = {}
        self.job_statuses: dict[str, CrawlJobStatus] = {}
        self._running = False
        self._result_callback: Callable[
            [str, CrawlResult], Coroutine[Any, Any, None]
        ] | None = None

        self.logger = logging.getLogger(__name__)

    def register_crawler(self, platform: str, crawler: BaseCrawler) -> None:
        """Register a crawler for a platform.

        Args:
            platform: Platform name.
            crawler: Crawler instance.
        """
        self.crawlers[platform] = crawler
        self.logger.info(f"Registered crawler for platform: {platform}")

    def set_result_callback(
        self,
        callback: Callable[[str, CrawlResult], Coroutine[Any, Any, None]],
    ) -> None:
        """Set callback to be called with crawl results.

        Args:
            callback: Async function taking (config_name, CrawlResult).
        """
        self._result_callback = callback

    def add_crawl_config(self, config: CrawlConfig) -> str:
        """Add a crawl configuration and schedule it.

        Args:
            config: Crawl configuration to add.

        Returns:
            Job ID for the scheduled crawl.

        Raises:
            ValueError: If platform crawler is not registered.
        """
        if config.platform not in self.crawlers:
            raise ValueError(
                f"No crawler registered for platform: {config.platform}"
            )

        self.configs[config.name] = config

        # Create job ID
        job_id = f"crawl_{config.name}"

        # Get trigger based on frequency
        trigger = self._get_trigger(config.frequency)

        # Add job to scheduler
        self.scheduler.add_job(
            self._execute_crawl,
            trigger=trigger,
            id=job_id,
            args=[config.name],
            name=f"Crawl: {config.name}",
            replace_existing=True,
        )

        # Initialize job status
        job = self.scheduler.get_job(job_id)
        self.job_statuses[job_id] = CrawlJobStatus(
            job_id=job_id,
            config_name=config.name,
            platform=config.platform,
            next_run=job.next_run_time if job else None,
        )

        self.logger.info(
            f"Scheduled crawl job: {job_id} for platform {config.platform} "
            f"with frequency {config.frequency.value}"
        )

        return job_id

    def remove_crawl_config(self, config_name: str) -> bool:
        """Remove a crawl configuration and unschedule it.

        Args:
            config_name: Name of the configuration to remove.

        Returns:
            True if removed, False if not found.
        """
        job_id = f"crawl_{config_name}"

        if config_name in self.configs:
            del self.configs[config_name]

        if job_id in self.job_statuses:
            del self.job_statuses[job_id]

        try:
            self.scheduler.remove_job(job_id)
            self.logger.info(f"Removed crawl job: {job_id}")
            return True
        except Exception:
            return False

    def update_crawl_config(self, config: CrawlConfig) -> str:
        """Update a crawl configuration.

        Args:
            config: Updated crawl configuration.

        Returns:
            Job ID for the scheduled crawl.
        """
        # Remove existing job if present
        self.remove_crawl_config(config.name)

        # Add with new settings
        return self.add_crawl_config(config)

    def schedule_crawls(self, crawl_configs: list[dict[str, Any]]) -> list[str]:
        """Schedule multiple crawls from configuration dicts.

        Args:
            crawl_configs: List of crawl configuration dictionaries.

        Returns:
            List of job IDs for scheduled crawls.
        """
        job_ids = []

        for config_dict in crawl_configs:
            try:
                # Convert frequency string to enum if needed
                if "frequency" in config_dict:
                    freq = config_dict["frequency"]
                    if isinstance(freq, str):
                        config_dict["frequency"] = CrawlFrequency(freq)

                config = CrawlConfig(**config_dict)
                job_id = self.add_crawl_config(config)
                job_ids.append(job_id)

            except Exception as e:
                self.logger.error(
                    f"Error scheduling crawl {config_dict.get('name', 'unknown')}: {e}"
                )

        return job_ids

    def _get_trigger(self, frequency: CrawlFrequency) -> IntervalTrigger | CronTrigger:
        """Get APScheduler trigger for a frequency.

        Args:
            frequency: Crawl frequency.

        Returns:
            APScheduler trigger.
        """
        if frequency == CrawlFrequency.HOURLY:
            return IntervalTrigger(hours=1)
        elif frequency == CrawlFrequency.EVERY_6_HOURS:
            return IntervalTrigger(hours=6)
        elif frequency == CrawlFrequency.DAILY:
            return CronTrigger(hour=0, minute=0)
        elif frequency == CrawlFrequency.TWICE_DAILY:
            return IntervalTrigger(hours=12)
        elif frequency == CrawlFrequency.FOUR_TIMES_DAILY:
            return IntervalTrigger(hours=6)
        elif frequency == CrawlFrequency.WEEKLY:
            return CronTrigger(day_of_week="mon", hour=0, minute=0)
        else:
            return IntervalTrigger(hours=6)

    async def _execute_crawl(self, config_name: str) -> None:
        """Execute a crawl for a configuration.

        Args:
            config_name: Name of the crawl configuration.
        """
        config = self.configs.get(config_name)
        if not config:
            self.logger.error(f"Crawl config not found: {config_name}")
            return

        if not config.enabled:
            self.logger.debug(f"Crawl disabled: {config_name}")
            return

        job_id = f"crawl_{config_name}"
        status = self.job_statuses.get(job_id)

        crawler = self.crawlers.get(config.platform)
        if not crawler:
            self.logger.error(f"Crawler not found for platform: {config.platform}")
            return

        self.logger.info(f"Executing crawl: {config_name}")

        try:
            # Ensure crawler is initialized
            if not crawler._initialized:
                await crawler.initialize()

            # Execute the search
            result = await crawler.search(
                keywords=config.keywords,
                subreddits=config.sources,
                limit=config.limit,
                **config.extra_params,
            )

            # Update config
            config.last_run = datetime.now(timezone.utc)
            config.last_result = result

            # Update status
            if status:
                status.last_run = config.last_run
                status.total_runs += 1
                if result.errors:
                    status.last_status = "partial" if result.posts else "failed"
                    if not result.posts:
                        status.failed_runs += 1
                    else:
                        status.successful_runs += 1
                else:
                    status.last_status = "success"
                    status.successful_runs += 1

                # Update next run time
                job = self.scheduler.get_job(job_id)
                if job:
                    status.next_run = job.next_run_time

            self.logger.info(
                f"Crawl completed: {config_name}, "
                f"found {len(result.posts)} posts in {result.crawl_time_seconds:.2f}s"
            )

            # Call result callback if set
            if self._result_callback:
                await self._result_callback(config_name, result)

        except Exception as e:
            self.logger.error(f"Crawl failed: {config_name}: {e}")
            if status:
                status.last_run = datetime.now(timezone.utc)
                status.last_status = "error"
                status.total_runs += 1
                status.failed_runs += 1

    async def run_crawl_now(self, config_name: str) -> CrawlResult | None:
        """Run a crawl immediately.

        Args:
            config_name: Name of the crawl configuration.

        Returns:
            CrawlResult or None if crawl failed.
        """
        config = self.configs.get(config_name)
        if not config:
            self.logger.error(f"Crawl config not found: {config_name}")
            return None

        await self._execute_crawl(config_name)
        return config.last_result

    def start(self) -> None:
        """Start the scheduler."""
        if not self._running:
            self.scheduler.start()
            self._running = True
            self.logger.info("Crawl scheduler started")

    def stop(self) -> None:
        """Stop the scheduler."""
        if self._running:
            self.scheduler.shutdown(wait=False)
            self._running = False
            self.logger.info("Crawl scheduler stopped")

    def pause(self) -> None:
        """Pause all scheduled jobs."""
        self.scheduler.pause()
        self.logger.info("Crawl scheduler paused")

    def resume(self) -> None:
        """Resume all scheduled jobs."""
        self.scheduler.resume()
        self.logger.info("Crawl scheduler resumed")

    def get_status(self) -> dict[str, Any]:
        """Get scheduler status.

        Returns:
            Dict with scheduler status information.
        """
        jobs = []
        for job in self.scheduler.get_jobs():
            status = self.job_statuses.get(job.id)
            jobs.append({
                "job_id": job.id,
                "name": job.name,
                "next_run": job.next_run_time.isoformat() if job.next_run_time else None,
                "status": status.last_status if status else "unknown",
                "total_runs": status.total_runs if status else 0,
                "successful_runs": status.successful_runs if status else 0,
                "failed_runs": status.failed_runs if status else 0,
            })

        return {
            "running": self._running,
            "paused": self.scheduler.state == 2,  # APScheduler STATE_PAUSED
            "total_jobs": len(jobs),
            "jobs": jobs,
            "registered_crawlers": list(self.crawlers.keys()),
        }

    def get_job_status(self, job_id: str) -> CrawlJobStatus | None:
        """Get status of a specific job.

        Args:
            job_id: Job ID to get status for.

        Returns:
            CrawlJobStatus or None if not found.
        """
        return self.job_statuses.get(job_id)

    def get_config(self, config_name: str) -> CrawlConfig | None:
        """Get a crawl configuration.

        Args:
            config_name: Name of the configuration.

        Returns:
            CrawlConfig or None if not found.
        """
        return self.configs.get(config_name)

    def list_configs(self) -> list[dict[str, Any]]:
        """List all crawl configurations.

        Returns:
            List of configuration dictionaries.
        """
        return [
            {
                "name": config.name,
                "platform": config.platform,
                "keywords": config.keywords,
                "sources": config.sources,
                "frequency": config.frequency.value,
                "limit": config.limit,
                "enabled": config.enabled,
                "last_run": config.last_run.isoformat() if config.last_run else None,
            }
            for config in self.configs.values()
        ]


# Global scheduler instance
_scheduler: CrawlScheduler | None = None


def get_scheduler() -> CrawlScheduler:
    """Get the global scheduler instance.

    Returns:
        Global CrawlScheduler instance.
    """
    global _scheduler
    if _scheduler is None:
        _scheduler = CrawlScheduler()
    return _scheduler
