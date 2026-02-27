"""Pipeline API routes for the engagement platform.

This module provides API endpoints for running the engagement pipeline,
which orchestrates all skills together to analyze posts and generate
appropriate responses.
"""

import logging
from typing import Any, Literal

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from src.agents import EngagementPipeline, create_engagement_pipeline

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/pipeline", tags=["Pipeline"])

# Create a single pipeline instance for reuse
_pipeline: EngagementPipeline | None = None


def get_pipeline() -> EngagementPipeline:
    """Get or create the engagement pipeline instance.

    Returns:
        EngagementPipeline: The pipeline instance.
    """
    global _pipeline
    if _pipeline is None:
        _pipeline = create_engagement_pipeline()
    return _pipeline


class TenantContextRequest(BaseModel):
    """Tenant context for response generation.

    Attributes:
        app_name: Name of the tenant's application/product.
        value_prop: Value proposition of the product.
        target_audience: Optional target audience description.
        key_benefits: Optional list of key benefits.
        website_url: Optional website URL.
    """

    app_name: str = Field(
        description="Name of the tenant's application or product"
    )
    value_prop: str = Field(
        description="Value proposition of the product"
    )
    target_audience: str = Field(
        default="",
        description="Description of the target audience"
    )
    key_benefits: list[str] = Field(
        default_factory=list,
        description="List of key benefits"
    )
    website_url: str = Field(
        default="",
        description="Website URL for the product"
    )


class PipelineAnalyzeRequest(BaseModel):
    """Request body for pipeline analysis.

    Attributes:
        text: The post content to analyze.
        platform: Social media platform (reddit, twitter, quora).
        tenant_context: Business context for response generation.
    """

    text: str = Field(
        description="The post content to analyze",
        min_length=1,
        max_length=10000,
    )
    platform: Literal["reddit", "twitter", "quora"] = Field(
        description="Social media platform"
    )
    tenant_context: TenantContextRequest = Field(
        description="Business context for response generation"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "text": "I've been struggling with staying organized and managing my time. Every day feels like chaos and I can't seem to get anything done.",
                    "platform": "reddit",
                    "tenant_context": {
                        "app_name": "FocusFlow",
                        "value_prop": "AI-powered productivity app that helps you focus and get things done",
                        "target_audience": "busy professionals",
                        "key_benefits": [
                            "smart task prioritization",
                            "focus mode with distraction blocking",
                            "daily planning assistant"
                        ],
                        "website_url": "https://focusflow.app"
                    }
                }
            ]
        }
    }


class SignalOutput(BaseModel):
    """Signal Detection output in the response."""

    problem_category: str
    emotional_intensity: float
    keywords: list[str] = Field(default_factory=list)
    confidence: float


class RiskOutput(BaseModel):
    """Risk Scoring output in the response."""

    risk_level: str
    risk_score: float
    risk_factors: list[str] = Field(default_factory=list)
    context_flags: list[str] = Field(default_factory=list)
    recommended_action: str


class ResponsesOutput(BaseModel):
    """Response Generation output in the response."""

    value_first_response: str
    soft_cta_response: str
    contextual_response: str
    selected_response: str
    selected_type: str


class CTAOutput(BaseModel):
    """CTA Classifier output in the response."""

    cta_level: int
    cta_type: str


class CTSOutput(BaseModel):
    """CTS Decision output in the response."""

    cts_score: float
    can_auto_post: bool
    requires_review: bool = Field(default=False)
    decision_factors: list[str] = Field(default_factory=list)
    recommended_action: str = Field(default="")


class PipelineAnalyzeResponse(BaseModel):
    """Response body for pipeline analysis.

    Contains the outputs from all skills in the pipeline.

    Attributes:
        signal: Output from Signal Detection skill.
        risk: Output from Risk Scoring skill.
        responses: Output from Response Generation skill (None if blocked).
        cta: Output from CTA Classifier skill (None if blocked).
        cts: Output from CTS Decision skill.
        blocked: Whether the content was blocked.
        error: Any error message.
    """

    signal: SignalOutput | None = None
    risk: RiskOutput | None = None
    responses: ResponsesOutput | None = None
    cta: CTAOutput | None = None
    cts: CTSOutput | None = None
    blocked: bool = False
    error: str | None = None

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "signal": {
                        "problem_category": "productivity_challenge",
                        "emotional_intensity": 0.6,
                        "keywords": ["struggling", "organized", "time", "chaos"],
                        "confidence": 0.85
                    },
                    "risk": {
                        "risk_level": "low",
                        "risk_score": 0.2,
                        "risk_factors": [],
                        "context_flags": [],
                        "recommended_action": "Safe for automated engagement"
                    },
                    "responses": {
                        "value_first_response": "I totally get this - feeling overwhelmed can be paralyzing...",
                        "soft_cta_response": "This is super common. Some people find apps helpful...",
                        "contextual_response": "Been there! I started using a productivity system...",
                        "selected_response": "Been there! I started using a productivity system...",
                        "selected_type": "contextual"
                    },
                    "cta": {
                        "cta_level": 0,
                        "cta_type": "none"
                    },
                    "cts": {
                        "cts_score": 0.85,
                        "can_auto_post": True,
                        "requires_review": False,
                        "decision_factors": ["All quality checks passed"],
                        "recommended_action": "Safe for auto-posting"
                    },
                    "blocked": False,
                    "error": None
                }
            ]
        }
    }


@router.post(
    "/analyze",
    response_model=PipelineAnalyzeResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze Post with Full Pipeline",
    description=(
        "Run the complete engagement pipeline on a social media post. "
        "The pipeline chains Signal Detection, Risk Scoring, Response Generation, "
        "CTA Classification, and CTS Decision in sequence."
    ),
)
async def analyze_post(request: PipelineAnalyzeRequest) -> PipelineAnalyzeResponse:
    """Analyze a social media post using the full engagement pipeline.

    This endpoint runs all five skills in sequence:
    1. Signal Detection - Identifies problem category and emotional intensity
    2. Risk Scoring - Assesses content risk level
    3. Response Generation - Creates platform-appropriate responses
    4. CTA Classifier - Classifies the CTA level of the selected response
    5. CTS Decision - Makes the commitment-to-send decision

    If the content is detected as high-risk (blocked), the pipeline
    terminates early after Risk Scoring.

    Args:
        request: The analysis request containing text, platform, and tenant context.

    Returns:
        PipelineAnalyzeResponse: Combined results from all pipeline skills.

    Raises:
        HTTPException: If a critical error occurs during pipeline execution.
    """
    logger.info(
        "Pipeline analyze request: platform=%s, text_length=%d",
        request.platform,
        len(request.text),
    )

    try:
        pipeline = get_pipeline()

        # Convert tenant context to dict
        tenant_context = {
            "app_name": request.tenant_context.app_name,
            "value_prop": request.tenant_context.value_prop,
            "target_audience": request.tenant_context.target_audience,
            "key_benefits": request.tenant_context.key_benefits,
            "website_url": request.tenant_context.website_url,
        }

        # Run the pipeline
        result = await pipeline.run_async(
            text=request.text,
            platform=request.platform,
            tenant_context=tenant_context,
        )

        # Build response
        response_data: dict[str, Any] = {
            "blocked": result.get("blocked", False),
            "error": result.get("error"),
        }

        # Add signal output if available
        if result.get("signal"):
            response_data["signal"] = SignalOutput(
                problem_category=result["signal"]["problem_category"],
                emotional_intensity=result["signal"]["emotional_intensity"],
                keywords=result["signal"].get("keywords", []),
                confidence=result["signal"].get("confidence", 0.0),
            )

        # Add risk output if available
        if result.get("risk"):
            response_data["risk"] = RiskOutput(
                risk_level=result["risk"]["risk_level"],
                risk_score=result["risk"]["risk_score"],
                risk_factors=result["risk"].get("risk_factors", []),
                context_flags=result["risk"].get("context_flags", []),
                recommended_action=result["risk"].get("recommended_action", ""),
            )

        # Add responses output if available (not for blocked content)
        if result.get("responses"):
            response_data["responses"] = ResponsesOutput(
                value_first_response=result["responses"]["value_first_response"],
                soft_cta_response=result["responses"]["soft_cta_response"],
                contextual_response=result["responses"]["contextual_response"],
                selected_response=result["responses"]["selected_response"],
                selected_type=result["responses"]["selected_type"],
            )

        # Add CTA output if available
        if result.get("cta"):
            response_data["cta"] = CTAOutput(
                cta_level=result["cta"]["cta_level"],
                cta_type=result["cta"]["cta_type"],
            )

        # Add CTS output if available
        if result.get("cts"):
            response_data["cts"] = CTSOutput(
                cts_score=result["cts"]["cts_score"],
                can_auto_post=result["cts"]["can_auto_post"],
                requires_review=result["cts"].get("requires_review", False),
                decision_factors=result["cts"].get("decision_factors", []),
                recommended_action=result["cts"].get("recommended_action", ""),
            )

        return PipelineAnalyzeResponse(**response_data)

    except Exception as e:
        logger.error("Pipeline execution failed: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Pipeline execution failed: {str(e)}",
        ) from e


class ProcessAndSaveRequest(BaseModel):
    """Request to process a post and save to Supabase."""

    url: str = Field(description="URL of the original post")
    text: str = Field(description="Post content", min_length=1, max_length=10000)
    platform: Literal["reddit", "twitter", "quora", "other"] = Field(description="Platform")
    organization_id: str = Field(
        default="aaaa1111-1111-1111-1111-111111111111",
        description="Organization UUID"
    )


@router.post(
    "/process-and-save",
    status_code=status.HTTP_201_CREATED,
    summary="Process Post and Save to Queue",
    description="Run pipeline on a post and save results to Supabase queue for review.",
)
async def process_and_save(request: ProcessAndSaveRequest) -> dict[str, Any]:
    """Process a post through the pipeline and save to Supabase.

    This endpoint:
    1. Runs the post through the AI pipeline
    2. Saves post, signal, risk, response to Supabase
    3. Adds to engagement queue for human review

    Returns:
        dict: Processing result with queue_id.
    """
    from src.processors.crawl_processor import get_crawl_processor
    from src.crawlers.base import CrawledPost
    from datetime import datetime, timezone
    import uuid

    logger.info(f"Processing and saving post: {request.url}")

    try:
        processor = get_crawl_processor()
        pipeline = get_pipeline()

        # Default tenant context for WeAttuned
        tenant_context = {
            "app_name": "WeAttuned",
            "value_prop": "Emotional intelligence app that helps couples communicate better",
            "target_audience": "Couples seeking better communication",
            "key_benefits": ["Better communication", "Emotional awareness", "Conflict resolution"],
            "website_url": "https://weattuned.com"
        }

        # Run through pipeline
        result = await pipeline.run_async(
            text=request.text,
            platform=request.platform,
            tenant_context=tenant_context,
        )

        if result.get("blocked"):
            return {"status": "blocked", "reason": "Content flagged as high risk"}

        # Create a mock CrawledPost for the processor
        from src.crawlers.base import ContentType
        post = CrawledPost(
            external_id=f"manual_{uuid.uuid4().hex[:12]}",
            external_url=request.url,
            content=request.text,
            content_type=ContentType.POST,
            platform=request.platform,
            crawled_at=datetime.now(timezone.utc),
            keywords_matched=[],
        )

        # Save to Supabase
        queue_id = await processor._save_to_supabase(
            client=processor._get_client(),
            post=post,
            platform=request.platform,
            pipeline_result=result,
            organization_id=request.organization_id,
            config_name="manual_submission",
        )

        return {
            "status": "success",
            "queue_id": queue_id,
            "message": "Post processed and added to queue for review",
            "cts_score": result.get("cts", {}).get("cts_score", 0),
            "requires_review": result.get("cts", {}).get("requires_review", True),
        }

    except Exception as e:
        logger.error(f"Failed to process and save: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Processing failed: {str(e)}",
        ) from e


@router.get(
    "/health",
    status_code=status.HTTP_200_OK,
    summary="Pipeline Health Check",
    description="Check if the pipeline is ready to process requests.",
)
async def pipeline_health() -> dict[str, Any]:
    """Check the health status of the engagement pipeline.

    Returns:
        dict: Health status information.
    """
    try:
        pipeline = get_pipeline()
        return {
            "status": "healthy",
            "pipeline_ready": True,
            "skills": {
                "signal_detection": True,
                "risk_scoring": True,
                "response_generation": True,
                "cta_classifier": True,
                "cts_decision": True,
            },
        }
    except Exception as e:
        logger.error("Pipeline health check failed: %s", e)
        return {
            "status": "unhealthy",
            "pipeline_ready": False,
            "error": str(e),
        }
