"""Pydantic schemas for the Signal Detection skill.

This module defines the input and output data models for signal detection,
using Pydantic v2 for validation and serialization.
"""

from typing import Any

from pydantic import BaseModel, Field, field_validator


class SignalDetectionInput(BaseModel):
    """Input schema for the Signal Detection skill.

    Attributes:
        text: The post content to analyze for problem signals.
        platform: The social media platform where the post originated.
    """

    text: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="The post content to analyze for problem signals.",
    )
    platform: str = Field(
        ...,
        min_length=1,
        max_length=50,
        description="The social media platform (e.g., reddit, twitter, quora).",
    )

    @field_validator("platform")
    @classmethod
    def normalize_platform(cls, v: str) -> str:
        """Normalize the platform name to lowercase.

        Args:
            v: The platform name to normalize.

        Returns:
            str: The normalized platform name.
        """
        return v.lower().strip()

    @field_validator("text")
    @classmethod
    def strip_text(cls, v: str) -> str:
        """Strip whitespace from the text.

        Args:
            v: The text to strip.

        Returns:
            str: The stripped text.
        """
        return v.strip()


class SignalDetectionOutput(BaseModel):
    """Output schema for the Signal Detection skill.

    Attributes:
        problem_category: The detected problem type classification.
        emotional_intensity: The emotional intensity score from 0.0 to 1.0.
        keywords: List of relevant keywords extracted from the text.
        confidence: The confidence score for the analysis from 0.0 to 1.0.
        raw_analysis: The full LLM response for audit trail purposes.
    """

    problem_category: str = Field(
        ...,
        description="The detected problem type (e.g., 'relationship_communication', 'workplace_conflict').",
    )
    emotional_intensity: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Emotional intensity score from 0.0 (calm) to 1.0 (highly emotional).",
    )
    keywords: list[str] = Field(
        default_factory=list,
        description="List of relevant keywords extracted from the text.",
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence score for the analysis from 0.0 to 1.0.",
    )
    raw_analysis: dict[str, Any] = Field(
        default_factory=dict,
        description="Full LLM response for audit trail purposes.",
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "problem_category": "relationship_communication",
                    "emotional_intensity": 0.65,
                    "keywords": ["communicate", "partner", "finances", "struggling"],
                    "confidence": 0.85,
                    "raw_analysis": {
                        "model": "gpt-4",
                        "reasoning": "The text indicates communication difficulties in a romantic relationship context.",
                    },
                }
            ]
        }
    }


class LLMAnalysisResponse(BaseModel):
    """Schema for parsing the LLM's structured analysis response.

    This is used internally to validate and parse the LLM output.
    """

    problem_category: str = Field(
        ...,
        description="The detected problem category.",
    )
    emotional_intensity: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Emotional intensity from 0.0 to 1.0.",
    )
    keywords: list[str] = Field(
        default_factory=list,
        description="Extracted keywords.",
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Analysis confidence from 0.0 to 1.0.",
    )
    reasoning: str = Field(
        default="",
        description="Brief explanation of the analysis.",
    )
