"""Google Search content parser for ReachBy3Cs platform.

This module provides parsing utilities to convert SerpAPI responses
and Google search results into standardized CrawledPost objects.
"""

import logging
import re
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlparse

from src.crawlers.base import ContentType, CrawledPost

logger = logging.getLogger(__name__)


class GoogleParser:
    """Parser for Google Search / SerpAPI responses.

    Converts search results into standardized CrawledPost objects
    for processing.
    """

    @staticmethod
    def parse_serpapi_response(
        response: dict[str, Any],
        keywords: list[str] | None = None,
        include_raw: bool = False,
    ) -> list[CrawledPost]:
        """Parse SerpAPI organic search results.

        Args:
            response: Full response from SerpAPI.
            keywords: Keywords to match against content.
            include_raw: Whether to include raw data for debugging.

        Returns:
            List of CrawledPost objects.
        """
        posts: list[CrawledPost] = []
        keywords = keywords or []

        organic_results = response.get("organic_results", [])

        for i, result in enumerate(organic_results):
            try:
                url = result.get("link", "")
                title = result.get("title", "")
                snippet = result.get("snippet", "")
                position = result.get("position", i + 1)

                if not url or not title:
                    continue

                # Combine title and snippet for content
                content = f"{title}\n\n{snippet}" if snippet else title

                # Find matching keywords
                matched_keywords = GoogleParser.find_matching_keywords(
                    content, keywords
                )

                # Determine content type based on URL
                content_type = GoogleParser._determine_content_type(url)

                # Extract platform from URL
                source_platform = GoogleParser._extract_platform(url)

                # Generate external ID
                external_id = f"google_{GoogleParser._generate_id(url)}"

                # Extract date if available
                date_str = result.get("date")
                external_created_at = None
                if date_str:
                    external_created_at = GoogleParser._parse_date(date_str)

                # Build platform metadata
                platform_metadata = {
                    "source_platform": source_platform,
                    "position": position,
                    "displayed_link": result.get("displayed_link", ""),
                    "cached_page_link": result.get("cached_page_link"),
                    "related_pages_link": result.get("related_pages_link"),
                    "rich_snippet": result.get("rich_snippet"),
                    "sitelinks": result.get("sitelinks"),
                }

                # Extract engagement hints from rich snippets
                engagement_metrics = GoogleParser._extract_engagement_hints(result)

                post = CrawledPost(
                    external_id=external_id,
                    external_url=url,
                    content=content,
                    content_type=content_type,
                    author_handle=None,
                    author_display_name=None,
                    platform_metadata=platform_metadata,
                    external_created_at=external_created_at,
                    platform="google",
                    keywords_matched=matched_keywords,
                    engagement_metrics=engagement_metrics,
                    parent_id=None,
                    raw_data=result if include_raw else None,
                )
                posts.append(post)

            except Exception as e:
                logger.debug(f"Error parsing search result: {e}")
                continue

        return posts

    @staticmethod
    def parse_related_questions(
        response: dict[str, Any],
        keywords: list[str] | None = None,
    ) -> list[CrawledPost]:
        """Parse "People Also Ask" questions from SerpAPI response.

        Args:
            response: Full response from SerpAPI.
            keywords: Keywords to match against content.

        Returns:
            List of CrawledPost objects for related questions.
        """
        posts: list[CrawledPost] = []
        keywords = keywords or []

        related_questions = response.get("related_questions", [])

        for i, question in enumerate(related_questions):
            try:
                question_text = question.get("question", "")
                snippet = question.get("snippet", "")
                link = question.get("link", "")
                title = question.get("title", "")

                if not question_text:
                    continue

                content = question_text
                if snippet:
                    content = f"{question_text}\n\n{snippet}"

                matched_keywords = GoogleParser.find_matching_keywords(
                    content, keywords
                )

                external_id = f"google_paa_{i}_{GoogleParser._generate_id(link or question_text)}"

                platform_metadata = {
                    "source": "people_also_ask",
                    "source_title": title,
                    "source_platform": GoogleParser._extract_platform(link) if link else None,
                }

                post = CrawledPost(
                    external_id=external_id,
                    external_url=link or "",
                    content=content,
                    content_type=ContentType.QUESTION,
                    platform_metadata=platform_metadata,
                    platform="google",
                    keywords_matched=matched_keywords,
                )
                posts.append(post)

            except Exception as e:
                logger.debug(f"Error parsing related question: {e}")
                continue

        return posts

    @staticmethod
    def _determine_content_type(url: str) -> ContentType:
        """Determine content type based on URL patterns.

        Args:
            url: URL of the search result.

        Returns:
            Appropriate ContentType.
        """
        url_lower = url.lower()

        if "reddit.com" in url_lower:
            if "/comments/" in url_lower:
                return ContentType.THREAD
            return ContentType.POST

        if "twitter.com" in url_lower or "x.com" in url_lower:
            return ContentType.TWEET

        if "quora.com" in url_lower:
            if "/answer/" in url_lower:
                return ContentType.ANSWER
            return ContentType.QUESTION

        if any(domain in url_lower for domain in [
            "stackoverflow.com", "stackexchange.com",
            "superuser.com", "serverfault.com",
        ]):
            if "/questions/" in url_lower:
                return ContentType.QUESTION
            if "/a/" in url_lower:
                return ContentType.ANSWER

        return ContentType.SEARCH_RESULT

    @staticmethod
    def _extract_platform(url: str) -> str:
        """Extract the source platform from a URL.

        Args:
            url: URL to extract platform from.

        Returns:
            Platform name.
        """
        try:
            parsed = urlparse(url)
            domain = parsed.netloc.lower()

            # Remove www. prefix
            domain = domain.replace("www.", "")

            # Extract main domain
            parts = domain.split(".")
            if len(parts) >= 2:
                return parts[-2]

            return domain

        except Exception:
            return "unknown"

    @staticmethod
    def _generate_id(text: str) -> str:
        """Generate a stable ID from text.

        Args:
            text: Text to generate ID from.

        Returns:
            ID string.
        """
        import hashlib
        return hashlib.md5(text.encode()).hexdigest()[:12]

    @staticmethod
    def _parse_date(date_str: str) -> datetime | None:
        """Parse a date string from search results.

        Args:
            date_str: Date string from search result.

        Returns:
            Parsed datetime or None.
        """
        try:
            # Common formats from SerpAPI
            formats = [
                "%b %d, %Y",
                "%B %d, %Y",
                "%Y-%m-%d",
                "%d %b %Y",
            ]

            for fmt in formats:
                try:
                    return datetime.strptime(date_str, fmt).replace(
                        tzinfo=timezone.utc
                    )
                except ValueError:
                    continue

            # Try relative dates
            date_lower = date_str.lower()
            if "ago" in date_lower:
                # Parse relative dates like "2 days ago"
                match = re.search(r"(\d+)\s*(hour|day|week|month|year)s?\s*ago", date_lower)
                if match:
                    amount = int(match.group(1))
                    unit = match.group(2)

                    from datetime import timedelta
                    now = datetime.now(timezone.utc)

                    if unit == "hour":
                        return now - timedelta(hours=amount)
                    elif unit == "day":
                        return now - timedelta(days=amount)
                    elif unit == "week":
                        return now - timedelta(weeks=amount)
                    elif unit == "month":
                        return now - timedelta(days=amount * 30)
                    elif unit == "year":
                        return now - timedelta(days=amount * 365)

        except Exception:
            pass

        return None

    @staticmethod
    def _extract_engagement_hints(result: dict[str, Any]) -> dict[str, int]:
        """Extract engagement metrics from rich snippets.

        Args:
            result: Search result with potential rich snippets.

        Returns:
            Dict of engagement metrics.
        """
        metrics: dict[str, int] = {}

        rich_snippet = result.get("rich_snippet", {})

        # Look for ratings
        if "top" in rich_snippet:
            top = rich_snippet["top"]
            if "rating" in top:
                try:
                    metrics["rating"] = int(float(top["rating"]) * 10)
                except (ValueError, TypeError):
                    pass
            if "reviews" in top:
                try:
                    reviews = str(top["reviews"]).replace(",", "")
                    metrics["reviews"] = int(re.sub(r"[^\d]", "", reviews))
                except (ValueError, TypeError):
                    pass

        # Look for vote counts in snippets (Reddit, Stack Overflow)
        snippet = result.get("snippet", "")
        vote_match = re.search(r"(\d+)\s*(votes?|upvotes?|points?)", snippet, re.IGNORECASE)
        if vote_match:
            metrics["votes"] = int(vote_match.group(1))

        answer_match = re.search(r"(\d+)\s*answers?", snippet, re.IGNORECASE)
        if answer_match:
            metrics["answers"] = int(answer_match.group(1))

        comment_match = re.search(r"(\d+)\s*comments?", snippet, re.IGNORECASE)
        if comment_match:
            metrics["comments"] = int(comment_match.group(1))

        return metrics

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
