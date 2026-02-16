"""Theme detection for clusters using LLM analysis.

This module provides functionality to extract themes, keywords,
and insights from clusters using language model analysis.
"""

import json
import logging
from datetime import datetime, timedelta
from typing import Any, List

import httpx

from src.config import LLMProvider, get_settings
from src.clustering.schemas import ClusterThemes, TrendingCluster

logger = logging.getLogger(__name__)


THEME_EXTRACTION_SYSTEM_PROMPT = """You are an expert at analyzing groups of social media posts and extracting common themes, keywords, and sentiment.

Your task is to analyze a cluster of similar posts and provide:
1. A main theme (2-5 words that capture the essence)
2. Common keywords (5-10 important terms)
3. Overall sentiment (positive, negative, neutral, or mixed)
4. A brief description (1-2 sentences)

Always respond in valid JSON format with this exact structure:
{
    "main_theme": "string",
    "keywords": ["string"],
    "sentiment": "positive|negative|neutral|mixed",
    "description": "string"
}"""


def format_theme_extraction_prompt(posts: List[str]) -> str:
    """Format the prompt for theme extraction.

    Args:
        posts: List of post contents to analyze.

    Returns:
        str: Formatted prompt for the LLM.
    """
    # Limit posts to avoid token limits
    sample_posts = posts[:15]
    posts_text = "\n\n---\n\n".join(
        f"Post {i + 1}:\n{post[:500]}" for i, post in enumerate(sample_posts)
    )

    return f"""Analyze these {len(sample_posts)} posts that have been grouped together based on semantic similarity.

Posts:
{posts_text}

Based on these posts, extract:
1. The main theme/topic (2-5 words) that connects all these posts
2. Common keywords (5-10 important terms that appear across posts)
3. The overall sentiment of this community
4. A brief description (1-2 sentences) explaining what this cluster represents

Respond with only the JSON object, no additional text."""


CLUSTER_NAMING_PROMPT = """Given the following theme analysis of a post cluster, generate a concise, descriptive name for this cluster/community.

Theme Analysis:
- Main theme: {main_theme}
- Keywords: {keywords}
- Sentiment: {sentiment}
- Description: {description}

Generate a name that is:
1. 3-6 words maximum
2. Descriptive and specific
3. Professional but accessible
4. Captures the essence of the community

Respond with only the cluster name, nothing else."""


class ThemeDetector:
    """Detector for extracting themes from clustered posts.

    This class uses LLM analysis to extract meaningful themes,
    keywords, and insights from groups of similar posts.
    """

    def __init__(
        self,
        api_base_url: str | None = None,
        api_key: str | None = None,
        model: str | None = None,
        timeout: float = 60.0,
    ) -> None:
        """Initialize the theme detector.

        Args:
            api_base_url: Optional override for the API base URL.
            api_key: Optional override for the API key.
            model: Optional override for the LLM model.
            timeout: HTTP timeout for LLM requests.
        """
        settings = get_settings()

        self.api_base_url = api_base_url or self._get_default_api_base_url()
        self.api_key = api_key or self._get_api_key()
        self.model = model or settings.llm_model
        self.timeout = timeout
        self.temperature = 0.3  # Lower temperature for more consistent themes

    def _get_default_api_base_url(self) -> str:
        """Get the default API base URL."""
        settings = get_settings()
        if settings.llm_provider == LLMProvider.OPENAI:
            return "https://api.openai.com/v1"
        elif settings.llm_provider == LLMProvider.ANTHROPIC:
            return "https://api.anthropic.com/v1"
        return "https://api.openai.com/v1"

    def _get_api_key(self) -> str:
        """Get the API key based on provider."""
        settings = get_settings()
        if settings.llm_provider == LLMProvider.OPENAI:
            return settings.openai_api_key.get_secret_value()
        elif settings.llm_provider == LLMProvider.ANTHROPIC:
            return settings.anthropic_api_key.get_secret_value()
        return settings.openai_api_key.get_secret_value()

    async def _call_llm(
        self,
        system_prompt: str,
        user_prompt: str,
    ) -> dict[str, Any]:
        """Call the LLM API.

        Args:
            system_prompt: System prompt for the LLM.
            user_prompt: User prompt with the request.

        Returns:
            dict: The LLM response.
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "temperature": self.temperature,
            "max_tokens": 500,
            "response_format": {"type": "json_object"},
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.api_base_url}/chat/completions",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            return response.json()

    async def extract_themes(
        self,
        posts: List[str],
        cluster_label: int | None = None,
    ) -> ClusterThemes:
        """Extract themes from a cluster of posts.

        Args:
            posts: List of post contents in the cluster.
            cluster_label: Optional cluster label for logging.

        Returns:
            ClusterThemes: Extracted themes and metadata.
        """
        if not posts:
            return ClusterThemes(
                main_theme="Unknown",
                keywords=[],
                sentiment="neutral",
                description="No posts provided for analysis.",
            )

        try:
            prompt = format_theme_extraction_prompt(posts)
            response = await self._call_llm(
                THEME_EXTRACTION_SYSTEM_PROMPT,
                prompt,
            )

            content = response["choices"][0]["message"]["content"]
            parsed = json.loads(content)

            themes = ClusterThemes(
                main_theme=parsed.get("main_theme", "Unknown Theme")[:100],
                keywords=parsed.get("keywords", [])[:10],
                sentiment=parsed.get("sentiment", "neutral"),
                description=parsed.get("description", "")[:500],
            )

            logger.info(
                "Extracted themes for cluster %s: %s",
                cluster_label,
                themes.main_theme,
            )

            return themes

        except json.JSONDecodeError as e:
            logger.error("Failed to parse theme extraction response: %s", e)
            return self._fallback_themes(posts)
        except httpx.HTTPStatusError as e:
            logger.error("LLM API error during theme extraction: %s", e)
            return self._fallback_themes(posts)
        except Exception as e:
            logger.error("Unexpected error during theme extraction: %s", e)
            return self._fallback_themes(posts)

    def _fallback_themes(self, posts: List[str]) -> ClusterThemes:
        """Generate fallback themes when LLM fails.

        Uses simple heuristics to extract basic themes.

        Args:
            posts: List of post contents.

        Returns:
            ClusterThemes: Basic extracted themes.
        """
        # Extract most common words as keywords
        all_text = " ".join(posts).lower()
        words = all_text.split()

        # Simple stopword removal
        stopwords = {
            "the", "a", "an", "is", "are", "was", "were", "be", "been",
            "being", "have", "has", "had", "do", "does", "did", "will",
            "would", "could", "should", "may", "might", "must", "shall",
            "can", "need", "dare", "ought", "used", "to", "of", "in",
            "for", "on", "with", "at", "by", "from", "as", "into",
            "through", "during", "before", "after", "above", "below",
            "between", "under", "again", "further", "then", "once",
            "i", "me", "my", "myself", "we", "our", "ours", "ourselves",
            "you", "your", "yours", "yourself", "he", "him", "his",
            "she", "her", "hers", "it", "its", "they", "them", "their",
            "and", "but", "or", "nor", "so", "yet", "both", "either",
            "neither", "not", "only", "own", "same", "than", "too",
            "very", "just", "about", "this", "that", "these", "those",
        }

        filtered_words = [w for w in words if w not in stopwords and len(w) > 3]

        # Count word frequencies
        word_counts: dict[str, int] = {}
        for word in filtered_words:
            word_counts[word] = word_counts.get(word, 0) + 1

        # Get top keywords
        sorted_words = sorted(word_counts.items(), key=lambda x: x[1], reverse=True)
        keywords = [word for word, count in sorted_words[:7]]

        return ClusterThemes(
            main_theme=" ".join(keywords[:3]) if keywords else "General Discussion",
            keywords=keywords,
            sentiment="neutral",
            description=f"Cluster of {len(posts)} related posts.",
        )

    async def generate_cluster_name(
        self,
        themes: ClusterThemes,
    ) -> str:
        """Generate a human-readable name for a cluster.

        Args:
            themes: The extracted themes for the cluster.

        Returns:
            str: A concise cluster name.
        """
        try:
            prompt = CLUSTER_NAMING_PROMPT.format(
                main_theme=themes.main_theme,
                keywords=", ".join(themes.keywords),
                sentiment=themes.sentiment,
                description=themes.description,
            )

            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            }

            payload = {
                "model": self.model,
                "messages": [
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.5,
                "max_tokens": 50,
            }

            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    f"{self.api_base_url}/chat/completions",
                    headers=headers,
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()

            name = data["choices"][0]["message"]["content"].strip()

            # Clean up the name
            name = name.strip('"\'')
            if len(name) > 100:
                name = name[:100]

            return name

        except Exception as e:
            logger.warning("Failed to generate cluster name: %s", e)
            # Fallback to main theme
            return themes.main_theme.title()

    def detect_trending(
        self,
        clusters: List[dict[str, Any]],
        time_window: timedelta = timedelta(hours=24),
        growth_threshold: float = 0.2,
    ) -> List[TrendingCluster]:
        """Find clusters with increasing activity.

        Args:
            clusters: List of cluster data with member counts and timestamps.
            time_window: Time window for measuring growth.
            growth_threshold: Minimum growth rate to be considered trending.

        Returns:
            List[TrendingCluster]: List of trending clusters.
        """
        trending = []
        now = datetime.utcnow()
        window_start = now - time_window

        for cluster in clusters:
            try:
                cluster_id = cluster.get("id", "")
                name = cluster.get("name", "Unknown")
                member_count = cluster.get("member_count", 0)
                themes_data = cluster.get("themes", {})

                # Parse themes
                if isinstance(themes_data, dict):
                    themes = ClusterThemes(
                        main_theme=themes_data.get("main_theme", "Unknown"),
                        keywords=themes_data.get("keywords", []),
                        sentiment=themes_data.get("sentiment", "neutral"),
                        description=themes_data.get("description", ""),
                    )
                else:
                    themes = ClusterThemes(
                        main_theme="Unknown",
                        keywords=[],
                        sentiment="neutral",
                        description="",
                    )

                # Count recent additions
                members = cluster.get("members", [])
                recent_additions = 0

                for member in members:
                    added_at_str = member.get("added_at", "")
                    if added_at_str:
                        try:
                            added_at = datetime.fromisoformat(
                                added_at_str.replace("Z", "+00:00")
                            )
                            if added_at.replace(tzinfo=None) > window_start:
                                recent_additions += 1
                        except (ValueError, TypeError):
                            continue

                # Calculate growth rate
                if member_count > recent_additions and member_count > 0:
                    previous_count = member_count - recent_additions
                    growth_rate = recent_additions / previous_count
                else:
                    growth_rate = 0.0

                # Check if trending
                if growth_rate >= growth_threshold and recent_additions >= 3:
                    trending.append(
                        TrendingCluster(
                            id=cluster_id,
                            name=name,
                            member_count=member_count,
                            recent_additions=recent_additions,
                            growth_rate=growth_rate * 100,  # Convert to percentage
                            themes=themes,
                        )
                    )

            except Exception as e:
                logger.warning("Error processing cluster for trending: %s", e)
                continue

        # Sort by growth rate descending
        trending.sort(key=lambda x: x.growth_rate, reverse=True)

        return trending
