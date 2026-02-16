"""Automation module for auto-posting and scheduled operations.

This module provides automated posting capabilities including
eligibility checking, rate limiting, and background workers.
"""

from src.automation.eligibility import (
    AutoPostEligibility,
    EligibilityResult,
    check_auto_post_eligibility,
)
from src.automation.limits import (
    OrgLimits,
    PlatformLimits,
    RateLimitManager,
    DEFAULT_ORG_LIMITS,
)
from src.automation.scheduler import (
    AutoPostScheduler,
    ScheduledTask,
    TaskStatus,
)
from src.automation.worker import (
    AutoPostWorker,
    WorkerStatus,
)

__all__ = [
    # Eligibility
    "AutoPostEligibility",
    "EligibilityResult",
    "check_auto_post_eligibility",
    # Limits
    "OrgLimits",
    "PlatformLimits",
    "RateLimitManager",
    "DEFAULT_ORG_LIMITS",
    # Scheduler
    "AutoPostScheduler",
    "ScheduledTask",
    "TaskStatus",
    # Worker
    "AutoPostWorker",
    "WorkerStatus",
]
