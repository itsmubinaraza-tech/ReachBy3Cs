"""Twitter/X content parser for ReachBy3Cs platform.

This module provides parsing utilities to convert Twitter API v2 responses
into standardized CrawledPost objects.
"""

import logging
from datetime import datetime, timezone
from typing import Any

from src.crawlers.base import ContentType, CrawledPost

logger = logging.getLogger(__name__)


class TwitterParser:
    """Parser for Twitter API v2 responses.

    Converts Twitter tweet data into standardized CrawledPost objects
    for processing.
    """

    @staticmethod
    def parse_tweet(
        tweet_data: dict[str, Any],
        users_lookup: dict[str, dict[str, Any]] | None = None,
        keywords_matched: list[str] | None = None,
        include_raw: bool = False,
    ) -> CrawledPost:
        """Parse a Twitter API v2 tweet into a CrawledPost.

        Args:
            tweet_data: Tweet data from Twitter API v2.
            users_lookup: Dict mapping user IDs to user data.
            keywords_matched: List of keywords that matched this tweet.
            include_raw: Whether to include raw data for debugging.

        Returns:
            CrawledPost object with tweet data.
        """
        users_lookup = users_lookup or {}

        tweet_id = tweet_data.get("id", "")
        text = tweet_data.get("text", "")
        author_id = tweet_data.get("author_id", "")

        # Get author info from lookup
        author_data = users_lookup.get(author_id, {})
        author_handle = author_data.get("username", "")
        author_display_name = author_data.get("name", "")

        # Extract creation time
        created_at = None
        created_at_str = tweet_data.get("created_at")
        if created_at_str:
            try:
                # Twitter API v2 uses ISO 8601 format
                created_at = datetime.fromisoformat(
                    created_at_str.replace("Z", "+00:00")
                )
            except (ValueError, TypeError):
                pass

        # Determine content type
        content_type = ContentType.TWEET
        referenced_tweets = tweet_data.get("referenced_tweets", [])
        if referenced_tweets:
            ref_type = referenced_tweets[0].get("type", "")
            if ref_type == "retweeted":
                content_type = ContentType.RETWEET
            elif ref_type == "replied_to":
                content_type = ContentType.REPLY

        # Extract public metrics
        public_metrics = tweet_data.get("public_metrics", {})
        engagement_metrics = {
            "likes": public_metrics.get("like_count", 0),
            "retweets": public_metrics.get("retweet_count", 0),
            "replies": public_metrics.get("reply_count", 0),
            "quotes": public_metrics.get("quote_count", 0),
            "impressions": public_metrics.get("impression_count", 0),
            "bookmarks": public_metrics.get("bookmark_count", 0),
        }

        # Extract entities
        entities = tweet_data.get("entities", {})
        hashtags = [h.get("tag", "") for h in entities.get("hashtags", [])]
        mentions = [m.get("username", "") for m in entities.get("mentions", [])]
        urls = [u.get("expanded_url", "") for u in entities.get("urls", [])]

        # Platform-specific metadata
        platform_metadata = {
            "author_id": author_id,
            "conversation_id": tweet_data.get("conversation_id", ""),
            "hashtags": hashtags,
            "mentions": mentions,
            "urls": urls,
            "lang": tweet_data.get("lang", ""),
            "source": tweet_data.get("source", ""),
            "possibly_sensitive": tweet_data.get("possibly_sensitive", False),
            "reply_settings": tweet_data.get("reply_settings", ""),
            "author_verified": author_data.get("verified", False),
            "author_followers": author_data.get("public_metrics", {}).get(
                "followers_count", 0
            ),
        }

        # Get parent ID if this is a reply
        parent_id = None
        if referenced_tweets:
            for ref in referenced_tweets:
                if ref.get("type") == "replied_to":
                    parent_id = f"twitter_{ref.get('id', '')}"
                    break

        # Build raw data if requested
        raw_data = None
        if include_raw:
            raw_data = tweet_data

        return CrawledPost(
            external_id=f"twitter_{tweet_id}",
            external_url=f"https://twitter.com/{author_handle}/status/{tweet_id}",
            content=text,
            content_type=content_type,
            author_handle=f"@{author_handle}" if author_handle else None,
            author_display_name=author_display_name or None,
            platform_metadata=platform_metadata,
            external_created_at=created_at,
            platform="twitter",
            keywords_matched=keywords_matched or [],
            engagement_metrics=engagement_metrics,
            parent_id=parent_id,
            raw_data=raw_data,
        )

    @staticmethod
    def build_users_lookup(includes: dict[str, Any] | None) -> dict[str, dict[str, Any]]:
        """Build a user ID to user data lookup from API includes.

        Args:
            includes: The 'includes' section from Twitter API v2 response.

        Returns:
            Dict mapping user IDs to user data.
        """
        lookup: dict[str, dict[str, Any]] = {}
        if includes and "users" in includes:
            for user in includes["users"]:
                user_id = user.get("id", "")
                if user_id:
                    lookup[user_id] = user
        return lookup

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

    @staticmethod
    def parse_search_response(
        response: dict[str, Any],
        keywords: list[str] | None = None,
        include_raw: bool = False,
    ) -> tuple[list[CrawledPost], str | None]:
        """Parse a Twitter API v2 search response.

        Args:
            response: Full response from Twitter API v2 search endpoint.
            keywords: Keywords to match against tweets.
            include_raw: Whether to include raw data.

        Returns:
            Tuple of (list of CrawledPost objects, next_token for pagination).
        """
        posts: list[CrawledPost] = []
        keywords = keywords or []

        data = response.get("data", [])
        includes = response.get("includes", {})
        meta = response.get("meta", {})

        users_lookup = TwitterParser.build_users_lookup(includes)

        for tweet_data in data:
            matched_keywords = []
            if keywords:
                matched_keywords = TwitterParser.find_matching_keywords(
                    tweet_data.get("text", ""), keywords
                )

            post = TwitterParser.parse_tweet(
                tweet_data,
                users_lookup=users_lookup,
                keywords_matched=matched_keywords,
                include_raw=include_raw,
            )
            posts.append(post)

        next_token = meta.get("next_token")

        return posts, next_token
