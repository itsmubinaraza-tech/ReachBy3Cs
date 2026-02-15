"""Skills API routes for exposing all AI skills via REST endpoints.

This module provides FastAPI routes for all skills in the platform:
- Signal Detection: Analyze text and detect problem signals
- Risk Scoring: Score risk level of content
- Response Generation: Generate response variants
- CTA Classifier: Classify CTA level of a response
- CTS Decision: Calculate confidence-to-send score
"""

import logging
from typing import Any, Literal

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from src.skills.signal_detection import SignalDetectionInput, SignalDetectionSkill
from src.skills.risk_scoring import RiskScoringInput, RiskScoringSkill
from src.skills.response_generation import (
    ResponseGenerationInput,
    ResponseGenerationSkill,
    TenantContext,
)
from src.skills.cta_classifier import CTAClassifierInput, CTAClassifierSkill

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/skills", tags=["Skills"])


# ============================================================================
# Request/Response Models
# ============================================================================


class SignalDetectionRequest(BaseModel):
    """Request model for signal detection endpoint."""

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

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "text": "I've been struggling with communicating about finances with my partner...",
                    "platform": "reddit",
                }
            ]
        }
    }


class SignalDetectionResponse(BaseModel):
    """Response model for signal detection endpoint."""

    problem_category: str = Field(description="The detected problem type classification")
    emotional_intensity: float = Field(
        ge=0.0, le=1.0, description="Emotional intensity score from 0.0 to 1.0"
    )
    keywords: list[str] = Field(description="List of relevant keywords extracted")
    confidence: float = Field(
        ge=0.0, le=1.0, description="Confidence score for the analysis"
    )
    raw_analysis: dict[str, Any] = Field(
        default_factory=dict, description="Full LLM response for audit purposes"
    )


class RiskScoringRequest(BaseModel):
    """Request model for risk scoring endpoint."""

    text: str = Field(
        ...,
        min_length=1,
        description="The original post content to analyze for risk",
    )
    emotional_intensity: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Emotional intensity score from Signal Detection (0.0-1.0)",
    )
    problem_category: str = Field(
        ...,
        description="Problem category identified by Signal Detection",
    )
    keywords: list[str] = Field(
        default_factory=list,
        description="List of keywords extracted by Signal Detection",
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "text": "I've been struggling with communicating about finances with my partner...",
                    "emotional_intensity": 0.65,
                    "problem_category": "relationship_communication",
                    "keywords": ["struggling", "partner", "finances"],
                }
            ]
        }
    }


class RiskScoringResponse(BaseModel):
    """Response model for risk scoring endpoint."""

    risk_level: Literal["low", "medium", "high", "blocked"] = Field(
        description="The assessed risk level"
    )
    risk_score: float = Field(
        ge=0.0, le=1.0, description="Numerical risk score from 0.0 to 1.0"
    )
    risk_factors: list[str] = Field(
        default_factory=list, description="List of reasons contributing to the risk level"
    )
    context_flags: list[str] = Field(
        default_factory=list, description="List of sensitive topics or contexts detected"
    )
    recommended_action: str = Field(
        description="Suggested action based on risk assessment"
    )


class TenantContextRequest(BaseModel):
    """Tenant context for response generation."""

    app_name: str = Field(description="Name of the tenant's application or product")
    value_prop: str = Field(description="Value proposition of the product")
    target_audience: str = Field(
        default="", description="Description of the target audience"
    )
    key_benefits: list[str] = Field(
        default_factory=list, description="List of key benefits the product offers"
    )
    website_url: str = Field(default="", description="Website URL for the product")


class ResponseGenerationRequest(BaseModel):
    """Request model for response generation endpoint."""

    text: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="Original post content to respond to",
    )
    problem_category: str = Field(
        ..., description="Problem category from Signal Detection skill"
    )
    risk_level: Literal["low", "medium", "high"] = Field(
        ..., description="Risk level from Risk Scoring skill"
    )
    platform: Literal["reddit", "twitter", "quora"] = Field(
        ..., description="Social media platform"
    )
    tenant_context: TenantContextRequest = Field(
        ..., description="Business context for response generation"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "text": "I've been struggling with communicating about finances with my partner...",
                    "problem_category": "relationship_communication",
                    "risk_level": "low",
                    "platform": "reddit",
                    "tenant_context": {
                        "app_name": "WeAttuned",
                        "value_prop": "Emotional intelligence app for couples",
                        "target_audience": "couples looking to improve communication",
                        "key_benefits": [
                            "better communication",
                            "conflict resolution",
                            "emotional awareness",
                        ],
                        "website_url": "https://weattuned.app",
                    },
                }
            ]
        }
    }


class ResponseGenerationResponse(BaseModel):
    """Response model for response generation endpoint."""

    value_first_response: str = Field(
        description="Pure helpful advice with NO product mention (CTA level 0)"
    )
    soft_cta_response: str = Field(
        description="Helpful advice with subtle 'tools that can help' mention (CTA level 1)"
    )
    contextual_response: str = Field(
        description="Context-aware response with natural product integration (CTA level 2)"
    )
    selected_response: str = Field(
        description="Recommended response based on risk level"
    )
    selected_type: Literal["value_first", "soft_cta", "contextual"] = Field(
        description="Type of the selected response"
    )


class CTAClassifierRequest(BaseModel):
    """Request model for CTA classifier endpoint."""

    response_text: str = Field(
        ...,
        min_length=1,
        description="The generated response text to analyze for CTA level",
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "response_text": "I hear you - financial conversations in relationships can be really charged..."
                }
            ]
        }
    }


class CTAAnalysisResponse(BaseModel):
    """CTA analysis details."""

    reasoning: str = Field(description="Explanation of the CTA level classification")
    promotional_phrases: list[str] = Field(
        default_factory=list, description="List of promotional phrases detected"
    )
    product_mentions: bool = Field(
        default=False, description="Whether specific product/brand names are mentioned"
    )
    link_present: bool = Field(
        default=False, description="Whether URLs or signup links are present"
    )
    signup_language: bool = Field(
        default=False, description="Whether signup, trial, or registration language is present"
    )
    value_ratio: float = Field(
        default=1.0,
        ge=0.0,
        le=1.0,
        description="Ratio of value content to promotional content",
    )


class CTAClassifierResponse(BaseModel):
    """Response model for CTA classifier endpoint."""

    cta_level: int = Field(
        ge=0, le=3, description="CTA level from 0 (none) to 3 (direct)"
    )
    cta_type: Literal["none", "soft", "medium", "direct"] = Field(
        description="String representation of CTA type"
    )
    cta_analysis: CTAAnalysisResponse = Field(
        description="Detailed analysis and reasoning for classification"
    )


class CTSDecisionRequest(BaseModel):
    """Request model for CTS decision endpoint."""

    signal_confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence score from signal detection",
    )
    risk_level: Literal["low", "medium", "high", "blocked"] = Field(
        ..., description="Risk level from risk scoring"
    )
    risk_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Numerical risk score",
    )
    cta_level: int = Field(
        ...,
        ge=0,
        le=3,
        description="CTA level from CTA classifier",
    )
    emotional_intensity: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Emotional intensity from signal detection",
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "signal_confidence": 0.85,
                    "risk_level": "low",
                    "risk_score": 0.2,
                    "cta_level": 0,
                    "emotional_intensity": 0.65,
                }
            ]
        }
    }


class CTSBreakdownResponse(BaseModel):
    """CTS score breakdown."""

    signal_component: float = Field(description="Contribution from signal confidence")
    risk_component: float = Field(description="Contribution from risk assessment")
    cta_component: float = Field(description="Contribution from CTA level")


class CTSDecisionResponse(BaseModel):
    """Response model for CTS decision endpoint."""

    cts_score: float = Field(
        ge=0.0, le=1.0, description="Confidence-to-send score from 0.0 to 1.0"
    )
    can_auto_post: bool = Field(
        description="Whether the response can be auto-posted without human review"
    )
    auto_post_reason: str = Field(
        description="Explanation for the auto-post decision"
    )
    cts_breakdown: CTSBreakdownResponse = Field(
        description="Breakdown of CTS score components"
    )


class ErrorResponse(BaseModel):
    """Standard error response model."""

    detail: str = Field(description="Error message")
    error_code: str = Field(default="SKILL_ERROR", description="Error code")


# ============================================================================
# API Endpoints
# ============================================================================


@router.post(
    "/signal-detection",
    response_model=SignalDetectionResponse,
    status_code=status.HTTP_200_OK,
    summary="Detect signals in text",
    description="Analyze text content to detect problem categories, emotional intensity, and relevant keywords.",
    responses={
        400: {"model": ErrorResponse, "description": "Invalid input"},
        500: {"model": ErrorResponse, "description": "Skill processing error"},
    },
)
async def detect_signal(request: SignalDetectionRequest) -> SignalDetectionResponse:
    """Analyze text and detect signals.

    This endpoint uses the Signal Detection skill to analyze social media posts
    and extract problem categories, emotional intensity, and keywords.

    Args:
        request: SignalDetectionRequest with text and platform.

    Returns:
        SignalDetectionResponse with analysis results.

    Raises:
        HTTPException: If input is invalid or skill processing fails.
    """
    try:
        skill = SignalDetectionSkill()
        input_data = SignalDetectionInput(
            text=request.text,
            platform=request.platform,
        )
        result = await skill.run_async(input_data)

        return SignalDetectionResponse(
            problem_category=result.problem_category,
            emotional_intensity=result.emotional_intensity,
            keywords=result.keywords,
            confidence=result.confidence,
            raw_analysis=result.raw_analysis,
        )
    except ValueError as e:
        logger.warning("Invalid input for signal detection: %s", e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error("Signal detection error: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Signal detection failed: {str(e)}",
        )


@router.post(
    "/risk-scoring",
    response_model=RiskScoringResponse,
    status_code=status.HTTP_200_OK,
    summary="Score risk level of content",
    description="Analyze content to determine risk level for engagement.",
    responses={
        400: {"model": ErrorResponse, "description": "Invalid input"},
        500: {"model": ErrorResponse, "description": "Skill processing error"},
    },
)
async def score_risk(request: RiskScoringRequest) -> RiskScoringResponse:
    """Score risk level of content.

    This endpoint uses the Risk Scoring skill to analyze content and determine
    risk levels for engagement. It combines pattern-based crisis detection
    with LLM-based risk analysis.

    Args:
        request: RiskScoringRequest with text and signal detection context.

    Returns:
        RiskScoringResponse with risk assessment.

    Raises:
        HTTPException: If input is invalid or skill processing fails.
    """
    try:
        skill = RiskScoringSkill()
        input_data = RiskScoringInput(
            text=request.text,
            emotional_intensity=request.emotional_intensity,
            problem_category=request.problem_category,
            keywords=request.keywords,
        )
        result = await skill.analyze(input_data)

        return RiskScoringResponse(
            risk_level=result.risk_level,
            risk_score=result.risk_score,
            risk_factors=result.risk_factors,
            context_flags=result.context_flags,
            recommended_action=result.recommended_action,
        )
    except ValueError as e:
        logger.warning("Invalid input for risk scoring: %s", e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error("Risk scoring error: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Risk scoring failed: {str(e)}",
        )


@router.post(
    "/response-generation",
    response_model=ResponseGenerationResponse,
    status_code=status.HTTP_200_OK,
    summary="Generate response variants",
    description="Generate platform-appropriate responses with varying CTA levels.",
    responses={
        400: {"model": ErrorResponse, "description": "Invalid input"},
        500: {"model": ErrorResponse, "description": "Skill processing error"},
    },
)
async def generate_response(
    request: ResponseGenerationRequest,
) -> ResponseGenerationResponse:
    """Generate response variants.

    This endpoint uses the Response Generation skill to create three response
    variants with different CTA levels: value_first, soft_cta, and contextual.

    Args:
        request: ResponseGenerationRequest with text, risk level, and context.

    Returns:
        ResponseGenerationResponse with all variants and selected response.

    Raises:
        HTTPException: If input is invalid or skill processing fails.
    """
    try:
        skill = ResponseGenerationSkill()

        # Convert request tenant context to skill format
        tenant_context = TenantContext(
            app_name=request.tenant_context.app_name,
            value_prop=request.tenant_context.value_prop,
            target_audience=request.tenant_context.target_audience,
            key_benefits=request.tenant_context.key_benefits,
            website_url=request.tenant_context.website_url,
        )

        input_data = ResponseGenerationInput(
            text=request.text,
            problem_category=request.problem_category,
            risk_level=request.risk_level,
            platform=request.platform,
            tenant_context=tenant_context,
        )
        result = await skill.run_async(input_data)

        return ResponseGenerationResponse(
            value_first_response=result.value_first_response,
            soft_cta_response=result.soft_cta_response,
            contextual_response=result.contextual_response,
            selected_response=result.selected_response,
            selected_type=result.selected_type,
        )
    except ValueError as e:
        logger.warning("Invalid input for response generation: %s", e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error("Response generation error: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Response generation failed: {str(e)}",
        )


@router.post(
    "/cta-classifier",
    response_model=CTAClassifierResponse,
    status_code=status.HTTP_200_OK,
    summary="Classify CTA level of a response",
    description="Analyze a response to determine its Call-To-Action level (0-3).",
    responses={
        400: {"model": ErrorResponse, "description": "Invalid input"},
        500: {"model": ErrorResponse, "description": "Skill processing error"},
    },
)
async def classify_cta(request: CTAClassifierRequest) -> CTAClassifierResponse:
    """Classify CTA level of a response.

    This endpoint uses the CTA Classifier skill to analyze response text
    and determine the level of promotional content or call-to-action present.

    CTA Levels:
    - 0 (none): Pure value, no CTA
    - 1 (soft): Subtle mention of tools/solutions
    - 2 (medium): Named reference to specific product
    - 3 (direct): Explicit CTA with link or signup prompt

    Args:
        request: CTAClassifierRequest with response text.

    Returns:
        CTAClassifierResponse with CTA level and analysis.

    Raises:
        HTTPException: If input is invalid or skill processing fails.
    """
    try:
        skill = CTAClassifierSkill()
        input_data = CTAClassifierInput(response_text=request.response_text)
        result = await skill.classify(input_data)

        return CTAClassifierResponse(
            cta_level=result.cta_level,
            cta_type=result.cta_type,
            cta_analysis=CTAAnalysisResponse(
                reasoning=result.cta_analysis.reasoning,
                promotional_phrases=result.cta_analysis.promotional_phrases,
                product_mentions=result.cta_analysis.product_mentions,
                link_present=result.cta_analysis.link_present,
                signup_language=result.cta_analysis.signup_language,
                value_ratio=result.cta_analysis.value_ratio,
            ),
        )
    except ValueError as e:
        logger.warning("Invalid input for CTA classification: %s", e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error("CTA classification error: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"CTA classification failed: {str(e)}",
        )


@router.post(
    "/cts-decision",
    response_model=CTSDecisionResponse,
    status_code=status.HTTP_200_OK,
    summary="Calculate confidence-to-send score",
    description="Calculate the CTS score to determine if a response can be auto-posted.",
    responses={
        400: {"model": ErrorResponse, "description": "Invalid input"},
        500: {"model": ErrorResponse, "description": "Calculation error"},
    },
)
async def calculate_cts(request: CTSDecisionRequest) -> CTSDecisionResponse:
    """Calculate confidence-to-send score.

    This endpoint calculates the CTS score based on signal confidence,
    risk level, and CTA level to determine if a response can be auto-posted.

    CTS Score Formula:
    - Signal component: 40% weight
    - Risk component: 30% weight (inverted - lower risk = higher score)
    - CTA component: 30% weight (lower CTA = higher score)

    Auto-post criteria:
    - CTS score >= 0.7
    - Risk level is "low"
    - CTA level <= 1

    Args:
        request: CTSDecisionRequest with all scoring inputs.

    Returns:
        CTSDecisionResponse with CTS score and auto-post decision.

    Raises:
        HTTPException: If input is invalid or calculation fails.
    """
    try:
        # Validate inputs
        if request.risk_level == "blocked":
            return CTSDecisionResponse(
                cts_score=0.0,
                can_auto_post=False,
                auto_post_reason="Content is blocked due to crisis indicators",
                cts_breakdown=CTSBreakdownResponse(
                    signal_component=0.0,
                    risk_component=0.0,
                    cta_component=0.0,
                ),
            )

        # Calculate CTS score components
        # Signal component: 40% weight
        signal_component = request.signal_confidence * 0.4

        # Risk component: 30% weight (inverted - lower risk = higher contribution)
        risk_inversion = 1.0 - request.risk_score
        risk_component = risk_inversion * 0.3

        # CTA component: 30% weight (lower CTA = higher contribution)
        cta_inversion = 1.0 - (request.cta_level / 3.0)
        cta_component = cta_inversion * 0.3

        # Total CTS score
        cts_score = round(signal_component + risk_component + cta_component, 2)

        # Determine auto-post eligibility
        can_auto_post = (
            cts_score >= 0.7 and
            request.risk_level == "low" and
            request.cta_level <= 1
        )

        # Generate reason
        if can_auto_post:
            auto_post_reason = (
                f"All criteria met: CTS >= 0.7 ({cts_score:.2f}), "
                f"low risk, CTA <= 1 ({request.cta_level})"
            )
        else:
            reasons = []
            if cts_score < 0.7:
                reasons.append(f"CTS score {cts_score:.2f} < 0.7")
            if request.risk_level != "low":
                reasons.append(f"risk level is {request.risk_level}")
            if request.cta_level > 1:
                reasons.append(f"CTA level {request.cta_level} > 1")
            auto_post_reason = f"Criteria not met: {', '.join(reasons)}"

        return CTSDecisionResponse(
            cts_score=cts_score,
            can_auto_post=can_auto_post,
            auto_post_reason=auto_post_reason,
            cts_breakdown=CTSBreakdownResponse(
                signal_component=round(signal_component, 2),
                risk_component=round(risk_component, 2),
                cta_component=round(cta_component, 2),
            ),
        )
    except ValueError as e:
        logger.warning("Invalid input for CTS calculation: %s", e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error("CTS calculation error: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"CTS calculation failed: {str(e)}",
        )
