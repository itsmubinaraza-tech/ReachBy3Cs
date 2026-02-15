"""CTA Classifier skill implementation.

This module provides the CTAClassifierSkill class for analyzing
Call-To-Action levels in generated responses.
"""

import json
import logging
import re
from typing import Any

from src.skills.cta_classifier.prompts import (
    CTA_CLASSIFIER_SYSTEM_PROMPT,
    get_cta_classifier_prompt,
)
from src.skills.cta_classifier.schemas import (
    CTAAnalysis,
    CTAClassifierInput,
    CTAClassifierOutput,
    CTALevel,
)

logger = logging.getLogger(__name__)


class CTAClassifierSkill:
    """Skill for classifying CTA levels in response text.

    This skill analyzes generated responses to determine the level
    of promotional content or call-to-action present. It can operate
    with or without an LLM - falling back to rule-based classification.

    Attributes:
        llm: Optional LLM instance for advanced classification.
    """

    # Patterns for rule-based classification
    DIRECT_CTA_PATTERNS = [
        r'sign\s*up',
        r'get\s*started',
        r'try\s*(it\s*)?free',
        r'click\s*here',
        r'use\s*code',
        r'%\s*off',
        r'discount',
        r'https?://',
        r'www\.',
        r'\.com/',
        r'\[link\]',
        r'register\s*(now|today|here)',
    ]

    MEDIUM_CTA_PATTERNS = [
        r'i\s*(built|created|made|developed)',
        r'check\s*(out|it out)',
        r'my\s*(app|tool|product|service|team)',
        r'our\s*(app|tool|product|service)',
        r'called\s+\w+',
        r'named\s+\w+',
    ]

    SOFT_CTA_PATTERNS = [
        r'there\s*are\s*(some\s*)?(apps?|tools?|solutions?)',
        r'(apps?|tools?)\s*(that\s*)?(can|could|might)\s*help',
        r'some\s*people\s*(use|find|try)',
        r'you\s*could\s*try\s*(using|some)',
        r'(journaling|meditation|tracking)\s*(apps?|tools?)',
    ]

    def __init__(self, llm: Any = None) -> None:
        """Initialize the CTA Classifier skill.

        Args:
            llm: Optional LLM instance for classification.
                 If not provided, uses rule-based classification.
        """
        self.llm = llm

    @property
    def system_prompt(self) -> str:
        """Get the system prompt for LLM-based classification."""
        return CTA_CLASSIFIER_SYSTEM_PROMPT

    async def classify(self, input_data: CTAClassifierInput) -> CTAClassifierOutput:
        """Classify the CTA level of a response.

        Args:
            input_data: The input containing response text to classify.

        Returns:
            CTAClassifierOutput with level, type, and analysis.
        """
        response_text = input_data.response_text

        if self.llm is not None:
            return await self._classify_with_llm(response_text)
        else:
            return self._classify_with_rules(response_text)

    async def _classify_with_llm(self, response_text: str) -> CTAClassifierOutput:
        """Classify using LLM for more nuanced analysis.

        Args:
            response_text: The response text to classify.

        Returns:
            CTAClassifierOutput from LLM analysis.
        """
        try:
            user_prompt = get_cta_classifier_prompt(response_text)

            # Call LLM
            messages = [
                {"role": "system", "content": self.system_prompt},
                {"role": "user", "content": user_prompt},
            ]

            response = await self.llm.ainvoke(messages)
            content = response.content if hasattr(response, 'content') else str(response)

            # Parse JSON from response
            json_match = re.search(r'\{[^{}]*\}', content, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())

                analysis = CTAAnalysis(
                    reasoning=result.get("reasoning", "LLM classification"),
                    promotional_phrases=result.get("promotional_phrases", []),
                    product_mentions=result.get("product_mentions", False),
                    link_present=result.get("link_present", False),
                    signup_language=result.get("signup_language", False),
                    value_ratio=result.get("value_ratio", 0.8),
                )

                level = CTALevel(min(max(result.get("cta_level", 0), 0), 3))
                return CTAClassifierOutput.from_level(level, analysis)

            # Fall back to rules if parsing fails
            logger.warning("Failed to parse LLM response, falling back to rules")
            return self._classify_with_rules(response_text)

        except Exception as e:
            logger.error(f"LLM classification failed: {e}")
            return self._classify_with_rules(response_text)

    def _classify_with_rules(self, response_text: str) -> CTAClassifierOutput:
        """Classify using rule-based pattern matching.

        Args:
            response_text: The response text to classify.

        Returns:
            CTAClassifierOutput from rule-based analysis.
        """
        text_lower = response_text.lower()

        # Check for direct CTA patterns (Level 3)
        direct_matches = self._find_pattern_matches(text_lower, self.DIRECT_CTA_PATTERNS)
        if direct_matches:
            analysis = CTAAnalysis(
                reasoning="Direct CTA patterns detected (links, signup language, or discounts)",
                promotional_phrases=direct_matches,
                product_mentions=self._has_product_mentions(text_lower),
                link_present=bool(re.search(r'https?://|www\.|\.com/', text_lower)),
                signup_language=bool(re.search(r'sign\s*up|register|get\s*started', text_lower)),
                value_ratio=self._calculate_value_ratio(text_lower, direct_matches),
            )
            return CTAClassifierOutput.from_level(CTALevel.DIRECT, analysis)

        # Check for medium CTA patterns (Level 2)
        medium_matches = self._find_pattern_matches(text_lower, self.MEDIUM_CTA_PATTERNS)
        if medium_matches:
            analysis = CTAAnalysis(
                reasoning="Named product/tool reference detected",
                promotional_phrases=medium_matches,
                product_mentions=True,
                link_present=False,
                signup_language=False,
                value_ratio=self._calculate_value_ratio(text_lower, medium_matches),
            )
            return CTAClassifierOutput.from_level(CTALevel.MEDIUM, analysis)

        # Check for soft CTA patterns (Level 1)
        soft_matches = self._find_pattern_matches(text_lower, self.SOFT_CTA_PATTERNS)
        if soft_matches:
            analysis = CTAAnalysis(
                reasoning="Subtle mention of tools or solutions without specific names",
                promotional_phrases=soft_matches,
                product_mentions=False,
                link_present=False,
                signup_language=False,
                value_ratio=self._calculate_value_ratio(text_lower, soft_matches),
            )
            return CTAClassifierOutput.from_level(CTALevel.SOFT, analysis)

        # No CTA detected (Level 0)
        analysis = CTAAnalysis(
            reasoning="Pure value response with no promotional content detected",
            promotional_phrases=[],
            product_mentions=False,
            link_present=False,
            signup_language=False,
            value_ratio=1.0,
        )
        return CTAClassifierOutput.from_level(CTALevel.NONE, analysis)

    def _find_pattern_matches(
        self, text: str, patterns: list[str]
    ) -> list[str]:
        """Find all matching patterns in text.

        Args:
            text: The text to search.
            patterns: List of regex patterns to match.

        Returns:
            List of matched phrases.
        """
        matches = []
        for pattern in patterns:
            found = re.findall(pattern, text, re.IGNORECASE)
            matches.extend(found if isinstance(found[0], str) if found else [])
            if re.search(pattern, text, re.IGNORECASE):
                match = re.search(pattern, text, re.IGNORECASE)
                if match and match.group() not in matches:
                    matches.append(match.group())
        return matches

    def _has_product_mentions(self, text: str) -> bool:
        """Check if text contains product/brand mentions.

        Args:
            text: The text to check.

        Returns:
            True if product mentions are detected.
        """
        product_patterns = [
            r'(my|our)\s*(app|tool|product|service)',
            r'called\s+[A-Z][a-zA-Z]+',
            r'[A-Z][a-zA-Z]+\.com',
        ]
        for pattern in product_patterns:
            if re.search(pattern, text, re.IGNORECASE):
                return True
        return False

    def _calculate_value_ratio(
        self, text: str, promotional_phrases: list[str]
    ) -> float:
        """Calculate the ratio of value content to promotional content.

        Args:
            text: The full response text.
            promotional_phrases: List of detected promotional phrases.

        Returns:
            Float between 0.0 and 1.0 representing value ratio.
        """
        if not promotional_phrases:
            return 1.0

        total_length = len(text)
        promo_length = sum(len(phrase) for phrase in promotional_phrases)

        if total_length == 0:
            return 1.0

        promo_ratio = min(promo_length / total_length, 1.0)
        return round(1.0 - promo_ratio, 2)

    def classify_sync(self, input_data: CTAClassifierInput) -> CTAClassifierOutput:
        """Synchronous classification using rules only.

        Args:
            input_data: The input containing response text to classify.

        Returns:
            CTAClassifierOutput with level, type, and analysis.
        """
        return self._classify_with_rules(input_data.response_text)
