"""Signal Detection Skill module.

This module provides the Signal Detection skill for analyzing social media posts
and detecting problem categories, emotional intensity, and relevant keywords.
"""

from src.skills.signal_detection.schemas import (
    SignalDetectionInput,
    SignalDetectionOutput,
)
from src.skills.signal_detection.skill import SignalDetectionSkill

__all__ = [
    "SignalDetectionSkill",
    "SignalDetectionInput",
    "SignalDetectionOutput",
]
