"""Schemas for CTA Classifier skill.

This module defines the input/output schemas for CTA classification,
including CTA levels and types.
"""

from enum import IntEnum
from typing import Literal

from pydantic import BaseModel, Field


class CTALevel(IntEnum):
    """CTA Level enumeration.

    Levels:
        NONE (0): Pure value, no call-to-action
        SOFT (1): Subtle mention of tools/solutions
        MEDIUM (2): Named reference to specific product
        DIRECT (3): Explicit CTA with link or signup prompt
    """

    NONE = 0
    SOFT = 1
    MEDIUM = 2
    DIRECT = 3


CTAType = Literal["none", "soft", "medium", "direct"]


class CTAAnalysis(BaseModel):
    """Detailed analysis of CTA presence in response.

    Attributes:
        reasoning: Explanation of why the CTA level was assigned.
        promotional_phrases: List of promotional phrases detected.
        product_mentions: Whether specific product names are mentioned.
        link_present: Whether URLs or links are present.
        signup_language: Whether signup/trial language is present.
        value_ratio: Ratio of value content to promotional content (0.0-1.0).
    """

    reasoning: str = Field(
        description="Explanation of the CTA level classification"
    )
    promotional_phrases: list[str] = Field(
        default_factory=list,
        description="List of promotional phrases detected in the response"
    )
    product_mentions: bool = Field(
        default=False,
        description="Whether specific product/brand names are mentioned"
    )
    link_present: bool = Field(
        default=False,
        description="Whether URLs or signup links are present"
    )
    signup_language: bool = Field(
        default=False,
        description="Whether signup, trial, or registration language is present"
    )
    value_ratio: float = Field(
        default=1.0,
        ge=0.0,
        le=1.0,
        description="Ratio of value content to promotional content"
    )


class CTAClassifierInput(BaseModel):
    """Input schema for CTA Classifier.

    Attributes:
        response_text: The generated response text to classify.
    """

    response_text: str = Field(
        description="The generated response text to analyze for CTA level",
        min_length=1
    )


class CTAClassifierOutput(BaseModel):
    """Output schema for CTA Classifier.

    Attributes:
        cta_level: Integer CTA level (0-3).
        cta_type: String representation of CTA type.
        cta_analysis: Detailed analysis of CTA classification.
    """

    cta_level: int = Field(
        ge=0,
        le=3,
        description="CTA level from 0 (none) to 3 (direct)"
    )
    cta_type: CTAType = Field(
        description="String representation of CTA type"
    )
    cta_analysis: CTAAnalysis = Field(
        description="Detailed analysis and reasoning for classification"
    )

    @classmethod
    def from_level(cls, level: CTALevel, analysis: CTAAnalysis) -> "CTAClassifierOutput":
        """Create output from CTALevel enum and analysis.

        Args:
            level: The CTA level enumeration value.
            analysis: The detailed CTA analysis.

        Returns:
            CTAClassifierOutput with appropriate type mapping.
        """
        type_mapping: dict[CTALevel, CTAType] = {
            CTALevel.NONE: "none",
            CTALevel.SOFT: "soft",
            CTALevel.MEDIUM: "medium",
            CTALevel.DIRECT: "direct",
        }

        return cls(
            cta_level=level.value,
            cta_type=type_mapping[level],
            cta_analysis=analysis,
        )
