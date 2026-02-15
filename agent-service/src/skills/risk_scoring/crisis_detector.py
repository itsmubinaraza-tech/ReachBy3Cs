"""Crisis detection module for fast pattern-based filtering.

This module provides a fast pre-filter to detect crisis indicators
before LLM analysis. It uses pattern matching for:
- Self-harm keywords
- Violence indicators
- Mental health crisis language

This runs FIRST to immediately block dangerous content without
incurring LLM API costs.
"""

import re
from dataclasses import dataclass, field

from src.skills.risk_scoring.schemas import CrisisDetectionResult


@dataclass
class CrisisPattern:
    """A crisis detection pattern.

    Attributes:
        pattern: Compiled regex pattern.
        category: Crisis category (self_harm, violence, mental_health_crisis).
        severity: Severity weight (0.0-1.0).
        description: Human-readable description of what this pattern detects.
    """

    pattern: re.Pattern[str]
    category: str
    severity: float
    description: str


class CrisisDetector:
    """Pattern-based crisis language detector.

    This class provides fast pattern matching to detect dangerous content
    that should block all engagement. It checks for:
    - Self-harm keywords and phrases
    - Violence indicators
    - Mental health crisis language

    The detector uses compiled regex patterns for performance and
    returns immediately upon detecting any crisis indicator.

    Example:
        >>> detector = CrisisDetector()
        >>> result = detector.detect("I feel happy today!")
        >>> result.is_crisis
        False
        >>> result = detector.detect("I want to end it all")
        >>> result.is_crisis
        True
        >>> result.crisis_category
        'self_harm'
    """

    # Self-harm patterns
    SELF_HARM_PATTERNS: list[tuple[str, str, float]] = [
        (r"\b(kill\s*(my)?self)\b", "explicit self-harm intent", 1.0),
        (r"\b(end\s*(it\s*)?all)\b", "suicidal ideation phrase", 0.95),
        (r"\b(suicide|suicidal)\b", "suicide keyword", 0.9),
        (r"\b(want\s*to\s*die)\b", "death wish expression", 0.95),
        (r"\b(better\s*off\s*dead)\b", "suicidal ideation", 0.95),
        (r"\b(take\s*my\s*(own\s*)?life)\b", "explicit self-harm intent", 1.0),
        (r"\b(slit\s*(my\s*)?(wrist|throat)s?)\b", "self-harm method", 1.0),
        (r"\b(overdose|od)\b.*\b(myself|me)\b", "self-harm method", 0.9),
        (r"\b(hang\s*(my)?self)\b", "self-harm method", 1.0),
        (r"\b(jump\s*(off|from))\b.*\b(bridge|building|roof)\b", "self-harm method", 0.9),
        (r"\b(no\s*reason\s*to\s*live)\b", "suicidal ideation", 0.9),
        (r"\b(cut\s*(my)?self)\b", "self-harm behavior", 0.85),
        (r"\b(self[- ]?harm)\b", "self-harm keyword", 0.85),
        (r"\b(don'?t\s*want\s*to\s*be\s*(here|alive))\b", "suicidal ideation", 0.9),
    ]

    # Violence patterns
    VIOLENCE_PATTERNS: list[tuple[str, str, float]] = [
        (r"\b(kill\s*(him|her|them|you|someone|people))\b", "violent threat", 0.95),
        (r"\b(hurt\s*(someone|people|them|him|her))\b", "violent intent", 0.85),
        (r"\b(revenge)\b.*\b(kill|hurt|attack|shoot|stab)\b", "revenge violence", 0.95),
        (r"\b(shoot\s*(up|them|people|everyone))\b", "mass violence threat", 1.0),
        (r"\b(bomb|bombing)\b.*\b(place|school|building|people)\b", "terrorism threat", 1.0),
        (r"\b(murder|murderous)\b", "murder reference", 0.8),
        (r"\b(attack\s*(people|them|someone))\b", "violent intent", 0.85),
        (r"\b(stab\s*(someone|them|him|her))\b", "violent threat", 0.95),
        (r"\b(beat\s*(up|them|him|her)\s*(badly|to\s*death)?)\b", "violent intent", 0.85),
        (r"\b(make\s*(them|him|her)\s*pay)\b.*\b(hurt|suffer|die)\b", "revenge violence", 0.9),
        (r"\b(bring\s*a\s*(gun|weapon|knife))\b", "weapon threat", 0.95),
    ]

    # Mental health crisis patterns
    MENTAL_HEALTH_CRISIS_PATTERNS: list[tuple[str, str, float]] = [
        (r"\b(can'?t\s*go\s*on)\b", "crisis expression", 0.8),
        (r"\b(no\s*point)\b.*\b(living|life|anymore)\b", "hopelessness", 0.9),
        (r"\b(give\s*up)\b.*\b(life|everything|living)\b", "giving up on life", 0.85),
        (r"\b(everyone\s*(would\s*be|is)\s*better\s*off\s*without\s*me)\b", "suicidal ideation", 0.95),
        (r"\b(goodbye)\b.*\b(forever|final|last)\b", "final goodbye", 0.85),
        (r"\b(this\s*is\s*(my\s*)?(goodbye|the\s*end))\b", "farewell message", 0.9),
        (r"\b(can'?t\s*take\s*(it|this)\s*(anymore|any\s*more))\b", "crisis expression", 0.75),
        (r"\b(nothing\s*matters\s*anymore)\b", "hopelessness", 0.8),
        (r"\b(no\s*way\s*out)\b", "hopelessness", 0.85),
        (r"\b(lost\s*all\s*hope)\b", "hopelessness", 0.85),
        (r"\b(voices\s*(tell|telling)\s*me)\b.*\b(hurt|kill|die)\b", "psychiatric crisis", 0.95),
    ]

    def __init__(self) -> None:
        """Initialize the crisis detector with compiled patterns."""
        self._patterns: list[CrisisPattern] = []
        self._compile_patterns()

    def _compile_patterns(self) -> None:
        """Compile all regex patterns for efficient matching."""
        # Compile self-harm patterns
        for pattern_str, description, severity in self.SELF_HARM_PATTERNS:
            self._patterns.append(
                CrisisPattern(
                    pattern=re.compile(pattern_str, re.IGNORECASE),
                    category="self_harm",
                    severity=severity,
                    description=description,
                )
            )

        # Compile violence patterns
        for pattern_str, description, severity in self.VIOLENCE_PATTERNS:
            self._patterns.append(
                CrisisPattern(
                    pattern=re.compile(pattern_str, re.IGNORECASE),
                    category="violence",
                    severity=severity,
                    description=description,
                )
            )

        # Compile mental health crisis patterns
        for pattern_str, description, severity in self.MENTAL_HEALTH_CRISIS_PATTERNS:
            self._patterns.append(
                CrisisPattern(
                    pattern=re.compile(pattern_str, re.IGNORECASE),
                    category="mental_health_crisis",
                    severity=severity,
                    description=description,
                )
            )

    def detect(self, text: str) -> CrisisDetectionResult:
        """Detect crisis patterns in text.

        This method performs fast pattern matching to identify
        dangerous content that should block engagement.

        Args:
            text: The text content to analyze.

        Returns:
            CrisisDetectionResult: Detection result with matched patterns
                and crisis category if detected.
        """
        if not text or not text.strip():
            return CrisisDetectionResult(is_crisis=False)

        # Normalize text for matching
        normalized_text = self._normalize_text(text)

        matched_patterns: list[str] = []
        categories_found: dict[str, float] = {}

        for crisis_pattern in self._patterns:
            if crisis_pattern.pattern.search(normalized_text):
                matched_patterns.append(
                    f"{crisis_pattern.category}: {crisis_pattern.description}"
                )

                # Track highest severity per category
                current_severity = categories_found.get(
                    crisis_pattern.category, 0.0
                )
                if crisis_pattern.severity > current_severity:
                    categories_found[crisis_pattern.category] = crisis_pattern.severity

        if not matched_patterns:
            return CrisisDetectionResult(is_crisis=False)

        # Determine primary crisis category (highest severity)
        primary_category = max(categories_found, key=lambda k: categories_found[k])
        max_confidence = categories_found[primary_category]

        return CrisisDetectionResult(
            is_crisis=True,
            matched_patterns=matched_patterns,
            crisis_category=primary_category,
            confidence=max_confidence,
        )

    def _normalize_text(self, text: str) -> str:
        """Normalize text for pattern matching.

        Handles common obfuscation techniques like:
        - Replacing letters with numbers (e.g., "su1c1de")
        - Adding spaces between letters
        - Using special characters

        Args:
            text: The original text.

        Returns:
            str: Normalized text for pattern matching.
        """
        # Basic normalization
        normalized = text.lower()

        # Common leetspeak substitutions
        leetspeak_map = {
            "0": "o",
            "1": "i",
            "3": "e",
            "4": "a",
            "5": "s",
            "7": "t",
            "@": "a",
            "$": "s",
        }

        for char, replacement in leetspeak_map.items():
            normalized = normalized.replace(char, replacement)

        # Remove excessive spaces between characters (anti-obfuscation)
        # This handles "k i l l" -> "kill"
        words = normalized.split()
        cleaned_words = []
        for word in words:
            # If word is a single character, check if it's part of a spaced-out word
            if len(word) == 1 and word.isalpha():
                if cleaned_words and len(cleaned_words[-1]) == 1:
                    cleaned_words[-1] += word
                else:
                    cleaned_words.append(word)
            else:
                cleaned_words.append(word)

        return " ".join(cleaned_words)

    def is_safe(self, text: str) -> bool:
        """Quick check if text is safe (no crisis detected).

        Args:
            text: The text to check.

        Returns:
            bool: True if no crisis patterns detected, False otherwise.
        """
        return not self.detect(text).is_crisis
