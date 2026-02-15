"""Pydantic schemas for Risk Scoring skill.

This module defines the input and output schemas for the risk scoring
skill using Pydantic v2.
"""

from enum import Enum
from typing import Any, Literal

from pydantic import BaseModel, Field


class RiskLevel(str, Enum):
    """Risk level enumeration.

    Attributes:
        LOW: No sensitive topics, safe for auto-engagement.
        MEDIUM: Moderate risk, requires review queue.
        HIGH: High risk, requires manual review.
        BLOCKED: Crisis indicators detected, do not engage.
    """

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    BLOCKED = "blocked"


class RiskScoringInput(BaseModel):
    """Input schema for the Risk Scoring skill.

    Attributes:
        text: The original post content to analyze.
        emotional_intensity: Emotional intensity score from Signal Detection (0.0-1.0).
        problem_category: Problem category identified by Signal Detection.
        keywords: List of keywords extracted by Signal Detection.
    """

    text: str = Field(
        ...,
        min_length=1,
        description="The original post content to analyze for risk"
    )
    emotional_intensity: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Emotional intensity score from Signal Detection (0.0-1.0)"
    )
    problem_category: str = Field(
        ...,
        description="Problem category identified by Signal Detection"
    )
    keywords: list[str] = Field(
        default_factory=list,
        description="List of keywords extracted by Signal Detection"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "text": "I'm really frustrated with this product, it keeps breaking!",
                    "emotional_intensity": 0.6,
                    "problem_category": "product_issue",
                    "keywords": ["frustrated", "breaking", "product"]
                }
            ]
        }
    }


class RiskScoringOutput(BaseModel):
    """Output schema for the Risk Scoring skill.

    Attributes:
        risk_level: The assessed risk level (low, medium, high, blocked).
        risk_score: Numerical risk score from 0.0 to 1.0.
        risk_factors: List of reasons contributing to the risk level.
        context_flags: List of sensitive topics or contexts detected.
        recommended_action: Suggested action based on risk assessment.
        raw_analysis: Full analysis data for audit purposes.
    """

    risk_level: Literal["low", "medium", "high", "blocked"] = Field(
        ...,
        description="The assessed risk level"
    )
    risk_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Numerical risk score from 0.0 (lowest) to 1.0 (highest)"
    )
    risk_factors: list[str] = Field(
        default_factory=list,
        description="List of reasons contributing to the risk level"
    )
    context_flags: list[str] = Field(
        default_factory=list,
        description="List of sensitive topics or contexts detected"
    )
    recommended_action: str = Field(
        ...,
        description="Suggested action based on risk assessment"
    )
    raw_analysis: dict[str, Any] = Field(
        default_factory=dict,
        description="Full analysis data for audit purposes"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "risk_level": "medium",
                    "risk_score": 0.55,
                    "risk_factors": [
                        "Moderate emotional intensity (0.6)",
                        "Frustration expressed"
                    ],
                    "context_flags": ["product_complaint"],
                    "recommended_action": "Queue for review before engagement",
                    "raw_analysis": {
                        "crisis_detected": False,
                        "intensity_contribution": 0.3,
                        "content_contribution": 0.25
                    }
                }
            ]
        }
    }


class CrisisDetectionResult(BaseModel):
    """Result of crisis pattern detection.

    Attributes:
        is_crisis: Whether a crisis pattern was detected.
        matched_patterns: List of patterns that matched.
        crisis_category: Category of crisis detected (if any).
        confidence: Confidence level of the detection.
    """

    is_crisis: bool = Field(
        default=False,
        description="Whether a crisis pattern was detected"
    )
    matched_patterns: list[str] = Field(
        default_factory=list,
        description="List of patterns that matched in the text"
    )
    crisis_category: str | None = Field(
        default=None,
        description="Category of crisis detected (self_harm, violence, mental_health_crisis)"
    )
    confidence: float = Field(
        default=0.0,
        ge=0.0,
        le=1.0,
        description="Confidence level of the detection"
    )


class LLMRiskAnalysis(BaseModel):
    """Schema for LLM risk analysis response.

    Attributes:
        risk_score: Assessed risk score from 0.0 to 1.0.
        risk_factors: List of identified risk factors.
        context_flags: Sensitive topics or contexts detected.
        sentiment: Overall sentiment analysis.
        engagement_recommendation: LLM's recommendation for engagement.
    """

    risk_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Assessed risk score"
    )
    risk_factors: list[str] = Field(
        default_factory=list,
        description="List of identified risk factors"
    )
    context_flags: list[str] = Field(
        default_factory=list,
        description="Sensitive topics or contexts detected"
    )
    sentiment: str = Field(
        default="neutral",
        description="Overall sentiment (positive, negative, neutral, mixed)"
    )
    engagement_recommendation: str = Field(
        default="",
        description="LLM's recommendation for engagement approach"
    )
