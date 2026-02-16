"""Posting service module for publishing responses to social platforms.

This module provides platform-specific posters and a posting queue
for managing response publication with retry logic and rate limiting.
"""

from src.posting.base import BasePoster, PostResult, PostingError
from src.posting.clipboard import ClipboardPoster
from src.posting.delay_patterns import (
    get_human_like_delay,
    get_reading_delay,
    get_typing_delay,
    get_random_jitter,
)
from src.posting.queue import PostingQueue, QueueItem, QueueStatus
from src.posting.reddit import RedditPoster
from src.posting.twitter import TwitterPoster

__all__ = [
    # Base classes
    "BasePoster",
    "PostResult",
    "PostingError",
    # Platform posters
    "RedditPoster",
    "TwitterPoster",
    "ClipboardPoster",
    # Delay patterns
    "get_human_like_delay",
    "get_reading_delay",
    "get_typing_delay",
    "get_random_jitter",
    # Queue
    "PostingQueue",
    "QueueItem",
    "QueueStatus",
]
