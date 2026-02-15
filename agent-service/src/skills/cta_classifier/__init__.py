"""CTA Classifier skill for analyzing Call-To-Action levels in responses.

This module classifies responses into CTA levels:
- Level 0 (none): Pure value, no CTA
- Level 1 (soft): Subtle mention of tools/solutions
- Level 2 (medium): Named reference to specific product
- Level 3 (direct): Explicit CTA with link or signup prompt
"""

from src.skills.cta_classifier.skill import CTAClassifierSkill
from src.skills.cta_classifier.schemas import (
    CTAClassifierInput,
    CTAClassifierOutput,
    CTALevel,
    CTAType,
)

__all__ = [
    "CTAClassifierSkill",
    "CTAClassifierInput",
    "CTAClassifierOutput",
    "CTALevel",
    "CTAType",
]
