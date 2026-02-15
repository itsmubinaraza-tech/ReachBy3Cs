"""Platform-specific tone adaptation for Response Generation skill.

This module provides tone adaptation logic for different social media platforms,
ensuring responses match each platform's communication norms and expectations.
"""

import re
from typing import Literal

from src.skills.response_generation.schemas import Platform


class ToneAdapter:
    """Adapts response tone for different social media platforms.

    This class provides platform-specific adjustments to ensure responses
    feel natural and authentic on each platform.

    Supported platforms:
    - Reddit: Casual, community-focused, avoids corporate speak
    - Twitter: Concise, engaging, punchy
    - Quora: Professional, detailed, authoritative
    """

    # Platform character limits (soft limits for readability)
    PLATFORM_LIMITS = {
        "reddit": 10000,  # Reddit allows long posts, but shorter is better
        "twitter": 280,   # Twitter character limit
        "quora": 5000,    # Quora allows long answers
    }

    # Target lengths for optimal engagement
    OPTIMAL_LENGTHS = {
        "reddit": (200, 500),    # Paragraphs work well
        "twitter": (100, 280),   # Concise but complete
        "quora": (300, 800),     # Detailed but not overwhelming
    }

    # Phrases that feel too corporate for casual platforms
    CORPORATE_PHRASES = [
        r"leverage",
        r"synergy",
        r"circle\s*back",
        r"touch\s*base",
        r"move\s*the\s*needle",
        r"at\s*the\s*end\s*of\s*the\s*day",
        r"best\s*in\s*class",
        r"value\s*add",
        r"deep\s*dive",
        r"low\s*hanging\s*fruit",
        r"win[\-\s]win",
        r"scalable\s*solution",
    ]

    # Casual replacements for Reddit
    REDDIT_REPLACEMENTS = {
        r"\bI\s+would\s+recommend\b": "I'd say",
        r"\bIn\s+my\s+experience\b": "Honestly,",
        r"\bIt\s+is\s+important\s+to\b": "You'll wanna",
        r"\bYou\s+should\s+consider\b": "Have you tried",
        r"\bThis\s+can\s+help\s+you\b": "This might help",
        r"\bAdditionally\b": "Also",
        r"\bFurthermore\b": "Plus",
        r"\bHowever\b": "But",
        r"\bTherefore\b": "So",
    }

    # Professional enhancers for Quora
    QUORA_ENHANCERS = {
        r"\bpretty\s+good\b": "quite effective",
        r"\bworks\s+great\b": "has proven effective",
        r"\btotally\b": "certainly",
        r"\bstuff\b": "aspects",
        r"\bthings\b": "factors",
        r"\bgonna\b": "going to",
        r"\bwanna\b": "want to",
        r"\bkinda\b": "somewhat",
    }

    def __init__(self) -> None:
        """Initialize the ToneAdapter."""
        pass

    def adapt(self, response: str, platform: Platform) -> str:
        """Adapt response tone for the specified platform.

        Args:
            response: The original response text.
            platform: Target platform (reddit, twitter, quora).

        Returns:
            str: Platform-adapted response text.
        """
        if platform == "reddit":
            return self._adapt_for_reddit(response)
        elif platform == "twitter":
            return self._adapt_for_twitter(response)
        elif platform == "quora":
            return self._adapt_for_quora(response)
        else:
            return response

    def _adapt_for_reddit(self, response: str) -> str:
        """Adapt response for Reddit's casual, community-focused tone.

        Reddit users value authenticity and despise marketing-speak.
        Responses should feel like they're from a helpful community member.

        Args:
            response: Original response text.

        Returns:
            str: Reddit-adapted response.
        """
        adapted = response

        # Remove corporate phrases
        adapted = self._remove_corporate_speak(adapted)

        # Apply casual replacements
        for pattern, replacement in self.REDDIT_REPLACEMENTS.items():
            adapted = re.sub(pattern, replacement, adapted, flags=re.IGNORECASE)

        # Remove hashtags (not used on Reddit)
        adapted = re.sub(r'#\w+\s*', '', adapted)

        # Ensure appropriate length
        adapted = self._adjust_length(adapted, "reddit")

        # Add paragraph breaks for readability
        adapted = self._ensure_paragraph_breaks(adapted)

        return adapted.strip()

    def _adapt_for_twitter(self, response: str) -> str:
        """Adapt response for Twitter's concise, engaging format.

        Twitter responses need to be punchy and direct while still
        being helpful. Every word counts.

        Args:
            response: Original response text.

        Returns:
            str: Twitter-adapted response.
        """
        adapted = response

        # Truncate to Twitter limit if needed
        if len(adapted) > self.PLATFORM_LIMITS["twitter"]:
            adapted = self._smart_truncate(adapted, self.PLATFORM_LIMITS["twitter"])

        # Make it more conversational
        adapted = self._make_concise(adapted)

        # Remove markdown formatting (not supported well)
        adapted = re.sub(r'\*\*([^*]+)\*\*', r'\1', adapted)  # Bold
        adapted = re.sub(r'\*([^*]+)\*', r'\1', adapted)       # Italic
        adapted = re.sub(r'^#+\s+', '', adapted, flags=re.MULTILINE)  # Headers

        return adapted.strip()

    def _adapt_for_quora(self, response: str) -> str:
        """Adapt response for Quora's professional, authoritative tone.

        Quora users expect detailed, well-reasoned answers from
        knowledgeable contributors.

        Args:
            response: Original response text.

        Returns:
            str: Quora-adapted response.
        """
        adapted = response

        # Enhance professional language
        for pattern, replacement in self.QUORA_ENHANCERS.items():
            adapted = re.sub(pattern, replacement, adapted, flags=re.IGNORECASE)

        # Ensure proper structure
        adapted = self._add_professional_structure(adapted)

        # Remove excessive casual language
        adapted = self._reduce_casualness(adapted)

        return adapted.strip()

    def _remove_corporate_speak(self, text: str) -> str:
        """Remove corporate jargon that feels inauthentic.

        Args:
            text: Original text.

        Returns:
            str: Text with corporate phrases removed or softened.
        """
        for phrase in self.CORPORATE_PHRASES:
            text = re.sub(phrase, '', text, flags=re.IGNORECASE)
        return text

    def _adjust_length(
        self, text: str, platform: Platform
    ) -> str:
        """Adjust text length for the platform.

        Args:
            text: Original text.
            platform: Target platform.

        Returns:
            str: Length-adjusted text.
        """
        min_len, max_len = self.OPTIMAL_LENGTHS.get(platform, (100, 500))

        if len(text) > max_len:
            return self._smart_truncate(text, max_len)

        return text

    def _smart_truncate(self, text: str, max_length: int) -> str:
        """Truncate text intelligently at sentence boundaries.

        Args:
            text: Text to truncate.
            max_length: Maximum length.

        Returns:
            str: Truncated text ending at a natural break.
        """
        if len(text) <= max_length:
            return text

        # Find the last sentence boundary before max_length
        truncated = text[:max_length]

        # Look for sentence endings
        last_period = truncated.rfind('.')
        last_question = truncated.rfind('?')
        last_exclaim = truncated.rfind('!')

        # Find the last sentence boundary
        last_boundary = max(last_period, last_question, last_exclaim)

        if last_boundary > max_length * 0.5:
            # Good sentence boundary found
            return truncated[:last_boundary + 1].strip()
        else:
            # No good boundary, just truncate at word boundary
            last_space = truncated.rfind(' ')
            if last_space > max_length * 0.7:
                return truncated[:last_space].strip() + "..."
            return truncated.strip() + "..."

    def _ensure_paragraph_breaks(self, text: str) -> str:
        """Ensure text has appropriate paragraph breaks.

        Args:
            text: Original text.

        Returns:
            str: Text with proper paragraph breaks.
        """
        # If text is long enough and has no breaks, add them
        if len(text) > 300 and '\n\n' not in text:
            sentences = re.split(r'(?<=[.!?])\s+', text)
            if len(sentences) >= 4:
                # Split into paragraphs of 2-3 sentences
                paragraphs = []
                current = []
                for i, sentence in enumerate(sentences):
                    current.append(sentence)
                    if len(current) >= 2 and i < len(sentences) - 1:
                        paragraphs.append(' '.join(current))
                        current = []
                if current:
                    paragraphs.append(' '.join(current))
                return '\n\n'.join(paragraphs)
        return text

    def _make_concise(self, text: str) -> str:
        """Make text more concise for Twitter.

        Args:
            text: Original text.

        Returns:
            str: More concise text.
        """
        # Remove filler phrases
        filler_patterns = [
            r'\bI think that\b',
            r'\bIn my opinion,?\b',
            r'\bIt seems like\b',
            r'\bBasically,?\b',
            r'\bEssentially,?\b',
            r'\bYou know,?\b',
        ]

        result = text
        for pattern in filler_patterns:
            result = re.sub(pattern, '', result, flags=re.IGNORECASE)

        # Clean up extra spaces
        result = re.sub(r'\s+', ' ', result)

        return result.strip()

    def _add_professional_structure(self, text: str) -> str:
        """Add professional structure for Quora answers.

        Args:
            text: Original text.

        Returns:
            str: Professionally structured text.
        """
        # If text doesn't have structure and is long enough, consider adding it
        if len(text) > 400 and '\n' not in text:
            sentences = re.split(r'(?<=[.!?])\s+', text)
            if len(sentences) >= 5:
                # Group into logical sections
                intro = sentences[0] if sentences else ""
                body = ' '.join(sentences[1:-1]) if len(sentences) > 2 else ""
                conclusion = sentences[-1] if len(sentences) > 1 else ""

                if intro and body and conclusion:
                    return f"{intro}\n\n{body}\n\n{conclusion}"

        return text

    def _reduce_casualness(self, text: str) -> str:
        """Reduce overly casual language for professional platforms.

        Args:
            text: Original text.

        Returns:
            str: Less casual text.
        """
        casual_patterns = [
            (r'\blol\b', ''),
            (r'\bhaha\b', ''),
            (r'\bomg\b', ''),
            (r'\bimho\b', 'in my view'),
            (r'\bimo\b', 'in my opinion'),
            (r'\btbh\b', 'to be honest'),
            (r'\bfwiw\b', 'for what it\'s worth'),
        ]

        result = text
        for pattern, replacement in casual_patterns:
            result = re.sub(pattern, replacement, result, flags=re.IGNORECASE)

        return result

    def validate_tone(
        self, response: str, platform: Platform
    ) -> tuple[bool, list[str]]:
        """Validate that response matches platform tone.

        Args:
            response: Response text to validate.
            platform: Target platform.

        Returns:
            Tuple of (is_valid, list_of_issues).
        """
        issues = []
        text_lower = response.lower()

        # Check length
        if len(response) > self.PLATFORM_LIMITS[platform]:
            issues.append(
                f"Response exceeds {platform} character limit "
                f"({len(response)} > {self.PLATFORM_LIMITS[platform]})"
            )

        # Platform-specific checks
        if platform == "reddit":
            # Check for hashtags
            if '#' in response:
                issues.append("Hashtags are not commonly used on Reddit")

            # Check for corporate speak
            for phrase in self.CORPORATE_PHRASES:
                if re.search(phrase, text_lower):
                    issues.append(f"Corporate phrase detected: {phrase}")

        elif platform == "twitter":
            # Check for optimal length
            if len(response) > 280:
                issues.append("Response too long for a single tweet")

        elif platform == "quora":
            # Check for overly casual language
            if re.search(r'\b(lol|omg|haha)\b', text_lower):
                issues.append("Overly casual language not suitable for Quora")

            # Check minimum length for authority
            if len(response) < 100:
                issues.append("Response may be too brief for Quora")

        return len(issues) == 0, issues

    def get_platform_guidelines(self, platform: Platform) -> str:
        """Get human-readable guidelines for a platform.

        Args:
            platform: Target platform.

        Returns:
            str: Platform guidelines.
        """
        guidelines = {
            "reddit": (
                "Reddit Guidelines:\n"
                "- Be casual and conversational\n"
                "- Avoid corporate speak at all costs\n"
                "- Use 'I' statements and share personal experiences\n"
                "- No hashtags\n"
                "- Paragraph breaks for readability\n"
                "- Be authentic and slightly vulnerable"
            ),
            "twitter": (
                "Twitter Guidelines:\n"
                "- Keep it under 280 characters\n"
                "- Be engaging and direct\n"
                "- Use 1-2 hashtags max (only if valuable)\n"
                "- Be quotable\n"
                "- Ask follow-up questions when appropriate"
            ),
            "quora": (
                "Quora Guidelines:\n"
                "- Be professional and authoritative\n"
                "- Provide detailed, well-structured answers\n"
                "- Use formatting for readability\n"
                "- Write as an expert sharing knowledge\n"
                "- Be educational rather than conversational"
            ),
        }
        return guidelines.get(platform, "No specific guidelines available.")
