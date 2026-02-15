"""Reddit content parser for ReachBy3Cs platform.

This module provides parsing utilities to convert Reddit API responses
into standardized CrawledPost objects.
"""

import logging
from datetime import datetime, timezone
from typing import Any

from src.crawlers.base import ContentType, CrawledPost

logger = logging.getLogger(__name__)


class RedditParser:
    """Parser for Reddit API responses.

    Converts Reddit submissions and comments into standardized
    CrawledPost objects for processing.
    """

    @staticmethod
    def parse_submission(
        submission: Any,
        keywords_matched: list[str] | None = None,
        include_raw: bool = False,
    ) -> CrawledPost:
        """Parse a Reddit submission into a CrawledPost.

        Args:
            submission: asyncpraw Submission object.
            keywords_matched: List of keywords that matched this post.
            include_raw: Whether to include raw data for debugging.

        Returns:
            CrawledPost object with submission data.
        """
        # Extract creation time
        created_at = None
        if hasattr(submission, 'created_utc'):
            created_at = datetime.fromtimestamp(
                submission.created_utc, tz=timezone.utc
            )

        # Build content from title and selftext
        content = submission.title
        if hasattr(submission, 'selftext') and submission.selftext:
            content = f"{submission.title}\n\n{submission.selftext}"

        # Determine content type
        content_type = ContentType.POST
        if hasattr(submission, 'is_self') and not submission.is_self:
            content_type = ContentType.THREAD  # Link post

        # Extract engagement metrics
        engagement_metrics = {
            "upvotes": getattr(submission, 'score', 0),
            "upvote_ratio": int(getattr(submission, 'upvote_ratio', 0) * 100),
            "num_comments": getattr(submission, 'num_comments', 0),
            "awards": getattr(submission, 'total_awards_received', 0),
        }

        # Platform-specific metadata
        platform_metadata = {
            "subreddit": str(getattr(submission, 'subreddit', '')),
            "subreddit_subscribers": getattr(
                getattr(submission, 'subreddit', None),
                'subscribers',
                0
            ),
            "is_self": getattr(submission, 'is_self', True),
            "link_flair_text": getattr(submission, 'link_flair_text', None),
            "over_18": getattr(submission, 'over_18', False),
            "spoiler": getattr(submission, 'spoiler', False),
            "stickied": getattr(submission, 'stickied', False),
            "locked": getattr(submission, 'locked', False),
            "url": getattr(submission, 'url', ''),
        }

        # Build raw data if requested
        raw_data = None
        if include_raw:
            raw_data = {
                "id": submission.id,
                "name": getattr(submission, 'name', ''),
                "permalink": getattr(submission, 'permalink', ''),
            }

        return CrawledPost(
            external_id=f"reddit_{submission.id}",
            external_url=f"https://reddit.com{getattr(submission, 'permalink', '')}",
            content=content,
            content_type=content_type,
            author_handle=str(getattr(submission, 'author', '[deleted]')),
            author_display_name=str(getattr(submission, 'author', '[deleted]')),
            platform_metadata=platform_metadata,
            external_created_at=created_at,
            platform="reddit",
            keywords_matched=keywords_matched or [],
            engagement_metrics=engagement_metrics,
            parent_id=None,
            raw_data=raw_data,
        )

    @staticmethod
    def parse_comment(
        comment: Any,
        keywords_matched: list[str] | None = None,
        include_raw: bool = False,
    ) -> CrawledPost:
        """Parse a Reddit comment into a CrawledPost.

        Args:
            comment: asyncpraw Comment object.
            keywords_matched: List of keywords that matched this comment.
            include_raw: Whether to include raw data for debugging.

        Returns:
            CrawledPost object with comment data.
        """
        # Extract creation time
        created_at = None
        if hasattr(comment, 'created_utc'):
            created_at = datetime.fromtimestamp(
                comment.created_utc, tz=timezone.utc
            )

        # Get parent ID
        parent_id = None
        if hasattr(comment, 'parent_id'):
            parent_id = f"reddit_{comment.parent_id}"

        # Extract engagement metrics
        engagement_metrics = {
            "upvotes": getattr(comment, 'score', 0),
            "awards": getattr(comment, 'total_awards_received', 0),
        }

        # Platform-specific metadata
        platform_metadata = {
            "subreddit": str(getattr(comment, 'subreddit', '')),
            "is_submitter": getattr(comment, 'is_submitter', False),
            "stickied": getattr(comment, 'stickied', False),
            "edited": bool(getattr(comment, 'edited', False)),
            "depth": getattr(comment, 'depth', 0),
        }

        # Build raw data if requested
        raw_data = None
        if include_raw:
            raw_data = {
                "id": comment.id,
                "name": getattr(comment, 'name', ''),
                "permalink": getattr(comment, 'permalink', ''),
            }

        return CrawledPost(
            external_id=f"reddit_{comment.id}",
            external_url=f"https://reddit.com{getattr(comment, 'permalink', '')}",
            content=getattr(comment, 'body', ''),
            content_type=ContentType.COMMENT,
            author_handle=str(getattr(comment, 'author', '[deleted]')),
            author_display_name=str(getattr(comment, 'author', '[deleted]')),
            platform_metadata=platform_metadata,
            external_created_at=created_at,
            platform="reddit",
            keywords_matched=keywords_matched or [],
            engagement_metrics=engagement_metrics,
            parent_id=parent_id,
            raw_data=raw_data,
        )

    @staticmethod
    def find_matching_keywords(text: str, keywords: list[str]) -> list[str]:
        """Find which keywords match in the given text.

        Args:
            text: Text to search in.
            keywords: List of keywords to search for.

        Returns:
            List of keywords found in the text.
        """
        text_lower = text.lower()
        return [kw for kw in keywords if kw.lower() in text_lower]
