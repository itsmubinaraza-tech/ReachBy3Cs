"""Pydantic schemas for CTS (Confidence-to-Send) Decision skill.

This module defines the input and output data models for CTS decision-making,
using Pydantic v2 for validation and serialization.
"""

from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator


class CTSDecisionInput(BaseModel):
    """Input schema for the CTS Decision skill.

    Attributes:
        signal_confidence: Confidence score from Signal Detection (0.0-1.0).
        risk_level: Risk level from Risk Scoring (low, medium, high, blocked).
        risk_score: Numerical risk score from Risk Scoring (0.0-1.0).
        cta_level: CTA level from CTA Classifier (0-3).
        emotional_intensity: Emotional intensity from Signal Detection (0.0-1.0).
    """

    signal_confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence score from Signal Detection (0.0-1.0).",
    )
    risk_level: Literal["low", "medium", "high", "blocked"] = Field(
        ...,
        description="Risk level from Risk Scoring.",
    )
    risk_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Numerical risk score from Risk Scoring (0.0-1.0).",
    )
    cta_level: int = Field(
        ...,
        ge=0,
        le=3,
        description="CTA level from CTA Classifier (0=none, 1=soft, 2=medium, 3=direct).",
    )
    emotional_intensity: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Emotional intensity from Signal Detection (0.0-1.0).",
    )

    @field_validator("risk_level")
    @classmethod
    def normalize_risk_level(cls, v: str) -> str:
        """Normalize the risk level to lowercase.

        Args:
            v: The risk level to normalize.

        Returns:
            str: The normalized risk level.
        """
        return v.lower().strip()

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "signal_confidence": 0.85,
                    "risk_level": "low",
                    "risk_score": 0.2,
                    "cta_level": 1,
                    "emotional_intensity": 0.4,
                }
            ]
        }
    }


class CTSBreakdown(BaseModel):
    """Breakdown of CTS score components.

    Attributes:
        signal_component: Contribution from signal confidence (0.4 weight).
        risk_component: Contribution from inverse risk score (0.3 weight).
        cta_component: Contribution from CTA level (0.3 weight).
    """

    signal_component: float = Field(
        ...,
        ge=0.0,
        le=0.4,
        description="Signal confidence contribution (max 0.4).",
    )
    risk_component: float = Field(
        ...,
        ge=0.0,
        le=0.3,
        description="Inverse risk score contribution (max 0.3).",
    )
    cta_component: float = Field(
        ...,
        ge=0.0,
        le=0.3,
        description="CTA level contribution (max 0.3).",
    )


class CTSDecisionOutput(BaseModel):
    """Output schema for the CTS Decision skill.

    Attributes:
        cts_score: The calculated Confidence-to-Send score (0.0-1.0).
        can_auto_post: Whether the response can be automatically posted.
        auto_post_reason: Explanation for the auto-post decision.
        cts_breakdown: Component-wise breakdown of the CTS score.
    """

    cts_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="The calculated Confidence-to-Send score (0.0-1.0).",
    )
    can_auto_post: bool = Field(
        ...,
        description="Whether the response can be automatically posted.",
    )
    auto_post_reason: str = Field(
        ...,
        description="Explanation for the auto-post decision.",
    )
    cts_breakdown: dict[str, Any] = Field(
        ...,
        description="Component-wise breakdown of the CTS score.",
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "cts_score": 0.78,
                    "can_auto_post": True,
                    "auto_post_reason": "CTS score (0.78) meets threshold, risk is low, and CTA level (1) is acceptable.",
                    "cts_breakdown": {
                        "signal_component": 0.34,
                        "risk_component": 0.24,
                        "cta_component": 0.20,
                    },
                },
                {
                    "cts_score": 0.52,
                    "can_auto_post": False,
                    "auto_post_reason": "CTS score (0.52) below 0.7 threshold.",
                    "cts_breakdown": {
                        "signal_component": 0.28,
                        "risk_component": 0.15,
                        "cta_component": 0.10,
                    },
                },
            ]
        }
    }
