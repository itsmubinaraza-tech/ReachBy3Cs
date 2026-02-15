"""Quora content parser for ReachBy3Cs platform.

This module provides parsing utilities to extract Quora questions
and answers from scraped HTML content.
"""

import logging
import re
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urljoin

from bs4 import BeautifulSoup, Tag

from src.crawlers.base import ContentType, CrawledPost

logger = logging.getLogger(__name__)


class QuoraParser:
    """Parser for Quora HTML content.

    Extracts questions and answers from Quora search results
    and question pages.
    """

    BASE_URL = "https://www.quora.com"

    @staticmethod
    def parse_search_results(
        html: str,
        keywords: list[str] | None = None,
        include_raw: bool = False,
    ) -> list[CrawledPost]:
        """Parse Quora search results page.

        Args:
            html: Raw HTML content from search results page.
            keywords: Keywords to match against content.
            include_raw: Whether to include raw HTML for debugging.

        Returns:
            List of CrawledPost objects.
        """
        posts: list[CrawledPost] = []
        keywords = keywords or []

        try:
            soup = BeautifulSoup(html, "html.parser")

            # Find question elements - Quora uses various class patterns
            # Look for links to questions
            question_links = soup.find_all("a", href=re.compile(r"^/[^/]+$|^https://www\.quora\.com/[^/]+$"))

            seen_urls: set[str] = set()

            for link in question_links:
                try:
                    href = link.get("href", "")
                    if not href:
                        continue

                    # Normalize URL
                    if href.startswith("/"):
                        url = f"{QuoraParser.BASE_URL}{href}"
                    else:
                        url = href

                    # Skip if already seen or not a question URL
                    if url in seen_urls:
                        continue
                    if "/answer/" in url or "/profile/" in url or "/topic/" in url:
                        continue

                    seen_urls.add(url)

                    # Extract question text
                    question_text = link.get_text(strip=True)
                    if not question_text or len(question_text) < 10:
                        continue

                    # Skip navigation and UI elements
                    if question_text.lower() in [
                        "quora", "answer", "follow", "share", "more",
                        "upvote", "downvote", "continue reading",
                    ]:
                        continue

                    # Find matching keywords
                    matched_keywords = QuoraParser.find_matching_keywords(
                        question_text, keywords
                    )

                    # Generate ID from URL
                    question_id = QuoraParser._extract_question_id(href)

                    # Try to find answer count and follow count near the question
                    engagement_metrics = QuoraParser._extract_engagement_metrics(link)

                    # Build platform metadata
                    platform_metadata = {
                        "question_url": url,
                    }

                    post = CrawledPost(
                        external_id=f"quora_{question_id}",
                        external_url=url,
                        content=question_text,
                        content_type=ContentType.QUESTION,
                        author_handle=None,
                        author_display_name=None,
                        platform_metadata=platform_metadata,
                        external_created_at=None,
                        platform="quora",
                        keywords_matched=matched_keywords,
                        engagement_metrics=engagement_metrics,
                        parent_id=None,
                        raw_data={"html": str(link)} if include_raw else None,
                    )
                    posts.append(post)

                except Exception as e:
                    logger.debug(f"Error parsing question link: {e}")
                    continue

        except Exception as e:
            logger.error(f"Error parsing Quora search results: {e}")

        return posts

    @staticmethod
    def parse_question_page(
        html: str,
        question_url: str,
        keywords: list[str] | None = None,
        include_raw: bool = False,
    ) -> tuple[CrawledPost | None, list[CrawledPost]]:
        """Parse a Quora question page to extract question and answers.

        Args:
            html: Raw HTML content from question page.
            question_url: URL of the question.
            keywords: Keywords to match against content.
            include_raw: Whether to include raw HTML for debugging.

        Returns:
            Tuple of (question CrawledPost, list of answer CrawledPosts).
        """
        keywords = keywords or []
        question: CrawledPost | None = None
        answers: list[CrawledPost] = []

        try:
            soup = BeautifulSoup(html, "html.parser")

            # Extract question title
            title_elem = soup.find("h1") or soup.find("title")
            question_text = ""
            if title_elem:
                question_text = title_elem.get_text(strip=True)
                # Clean up title
                question_text = question_text.replace(" - Quora", "").strip()

            if question_text:
                question_id = QuoraParser._extract_question_id(question_url)
                matched_keywords = QuoraParser.find_matching_keywords(
                    question_text, keywords
                )

                question = CrawledPost(
                    external_id=f"quora_{question_id}",
                    external_url=question_url,
                    content=question_text,
                    content_type=ContentType.QUESTION,
                    author_handle=None,
                    author_display_name=None,
                    platform_metadata={"question_url": question_url},
                    platform="quora",
                    keywords_matched=matched_keywords,
                    engagement_metrics={},
                )

            # Extract answers - look for answer content divs
            answer_containers = soup.find_all(
                "div",
                class_=re.compile(r"answer|Answer", re.IGNORECASE)
            )

            for i, container in enumerate(answer_containers[:20]):  # Limit to 20 answers
                try:
                    # Extract answer text
                    answer_text = container.get_text(strip=True)
                    if not answer_text or len(answer_text) < 50:
                        continue

                    # Try to find author
                    author_elem = container.find("a", href=re.compile(r"/profile/"))
                    author_name = None
                    if author_elem:
                        author_name = author_elem.get_text(strip=True)

                    # Try to find upvote count
                    upvotes = 0
                    upvote_elem = container.find(
                        string=re.compile(r"\d+\s*(upvotes?|K)", re.IGNORECASE)
                    )
                    if upvote_elem:
                        upvotes = QuoraParser._parse_count(str(upvote_elem))

                    matched_keywords = QuoraParser.find_matching_keywords(
                        answer_text, keywords
                    )

                    answer = CrawledPost(
                        external_id=f"quora_{question_id}_answer_{i}",
                        external_url=question_url,
                        content=answer_text[:2000],  # Truncate long answers
                        content_type=ContentType.ANSWER,
                        author_handle=author_name,
                        author_display_name=author_name,
                        platform_metadata={"question_url": question_url},
                        platform="quora",
                        keywords_matched=matched_keywords,
                        engagement_metrics={"upvotes": upvotes},
                        parent_id=f"quora_{question_id}",
                    )
                    answers.append(answer)

                except Exception as e:
                    logger.debug(f"Error parsing answer: {e}")
                    continue

        except Exception as e:
            logger.error(f"Error parsing Quora question page: {e}")

        return question, answers

    @staticmethod
    def _extract_question_id(url: str) -> str:
        """Extract a question ID from URL.

        Args:
            url: Quora question URL.

        Returns:
            Question ID string.
        """
        # Remove base URL if present
        path = url.replace("https://www.quora.com/", "").replace("https://quora.com/", "")
        # Remove leading slash
        path = path.lstrip("/")
        # Take first path segment
        question_id = path.split("/")[0].split("?")[0]
        # URL encode special characters for ID
        return question_id.replace("-", "_").lower()[:100]

    @staticmethod
    def _extract_engagement_metrics(element: Tag) -> dict[str, int]:
        """Extract engagement metrics from nearby elements.

        Args:
            element: BeautifulSoup element to search around.

        Returns:
            Dict of engagement metrics.
        """
        metrics: dict[str, int] = {}

        # Look for parent container
        parent = element.find_parent()
        if not parent:
            return metrics

        # Search for answer count
        text = parent.get_text()
        answer_match = re.search(r"(\d+)\s*answers?", text, re.IGNORECASE)
        if answer_match:
            metrics["answers"] = int(answer_match.group(1))

        # Search for follow count
        follow_match = re.search(r"(\d+)\s*follow", text, re.IGNORECASE)
        if follow_match:
            metrics["followers"] = int(follow_match.group(1))

        return metrics

    @staticmethod
    def _parse_count(text: str) -> int:
        """Parse a count string that may include K/M suffixes.

        Args:
            text: Text containing a number.

        Returns:
            Parsed integer count.
        """
        text = text.strip().upper()
        match = re.search(r"([\d.]+)\s*([KM])?", text)
        if not match:
            return 0

        number = float(match.group(1))
        suffix = match.group(2)

        if suffix == "K":
            number *= 1000
        elif suffix == "M":
            number *= 1000000

        return int(number)

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
