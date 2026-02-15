"""Pydantic schemas for Response Generation skill.

This module defines input and output schemas for the response generation
skill, ensuring type safety and validation.
"""

from typing import Any, Literal

from pydantic import BaseModel, Field


class TenantContext(BaseModel):
    """Context information about the tenant's business.

    Attributes:
        app_name: Name of the tenant's application/product.
        value_prop: Value proposition of the product.
        target_audience: Description of target audience.
        key_benefits: List of key benefits the product offers.
        website_url: Optional website URL for the product.
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
        description="List of key benefits the product offers"
    )
    website_url: str = Field(
        default="",
        description="Website URL for the product"
    )


# Type aliases for clarity
Platform = Literal["reddit", "twitter", "quora"]
RiskLevel = Literal["low", "medium", "high"]
ResponseType = Literal["value_first", "soft_cta", "contextual"]


class ResponseGenerationInput(BaseModel):
    """Input schema for the Response Generation skill.

    Attributes:
        text: Original post content to respond to.
        problem_category: Problem category from Signal Detection skill.
        risk_level: Risk level from Risk Scoring skill.
        platform: Social media platform (reddit, twitter, quora).
        tenant_context: Business context for response generation.
    """

    text: str = Field(
        description="Original post content to respond to",
        min_length=1,
        max_length=10000,
    )
    problem_category: str = Field(
        description="Problem category from Signal Detection skill"
    )
    risk_level: RiskLevel = Field(
        description="Risk level from Risk Scoring skill (low, medium, high)"
    )
    platform: Platform = Field(
        description="Social media platform (reddit, twitter, quora)"
    )
    tenant_context: TenantContext = Field(
        description="Business context for response generation"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "text": "My partner and I keep fighting about money. Every time I bring up budgeting, it turns into an argument. I don't know how to approach this anymore.",
                    "problem_category": "relationship_communication",
                    "risk_level": "medium",
                    "platform": "reddit",
                    "tenant_context": {
                        "app_name": "CouplesCents",
                        "value_prop": "A collaborative budgeting app designed for couples",
                        "target_audience": "couples managing shared finances",
                        "key_benefits": [
                            "shared expense tracking",
                            "goal setting together",
                            "neutral ground for money discussions"
                        ],
                        "website_url": "https://couplescents.app"
                    }
                }
            ]
        }
    }


class ResponseGenerationOutput(BaseModel):
    """Output schema for the Response Generation skill.

    Attributes:
        value_first_response: Pure value response with NO product mention.
        soft_cta_response: Value response with subtle tool mention.
        contextual_response: Context-aware response with natural product integration.
        selected_response: Recommended response based on risk level.
        selected_type: Type of the selected response.
        raw_analysis: Full LLM output for audit purposes.
    """

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
    selected_type: ResponseType = Field(
        description="Type of the selected response"
    )
    raw_analysis: dict[str, Any] = Field(
        default_factory=dict,
        description="Full LLM output for audit purposes"
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "value_first_response": "I hear you - financial conversations in relationships can be really charged. One thing that helped me was setting a 'money date' - a specific time each week where finances are the topic, so it doesn't feel like an ambush. Starting with shared goals rather than numbers can also help shift from 'you vs me' to 'us vs the problem'.",
                    "soft_cta_response": "Financial discussions are tough in any relationship. Have you tried setting dedicated times to talk about money? Some couples find apps or tools helpful for tracking shared expenses without the emotional charge - it creates a neutral space for those conversations.",
                    "contextual_response": "This is so common! My partner and I struggled with this too. We started using a shared budgeting approach and it made a huge difference. Having everything visible to both of us removed the 'blame game' aspect entirely.",
                    "selected_response": "I hear you - financial conversations in relationships can be really charged. One thing that helped me was setting a 'money date' - a specific time each week where finances are the topic, so it doesn't feel like an ambush. Starting with shared goals rather than numbers can also help shift from 'you vs me' to 'us vs the problem'.",
                    "selected_type": "value_first",
                    "raw_analysis": {
                        "problem_understanding": "User struggling with financial communication in relationship",
                        "emotional_tone": "frustrated but seeking help",
                        "key_pain_points": ["conflict during money talks", "difficulty approaching the topic"],
                        "response_strategy": "empathetic, practical advice"
                    }
                }
            ]
        }
    }


class LLMResponseAnalysis(BaseModel):
    """Internal schema for parsing LLM response analysis.

    Attributes:
        problem_understanding: LLM's understanding of the user's problem.
        emotional_tone: Detected emotional tone of the original post.
        key_pain_points: List of identified pain points.
        response_strategy: Strategy for crafting the response.
        value_first_response: Generated value-first response.
        soft_cta_response: Generated soft CTA response.
        contextual_response: Generated contextual response.
    """

    problem_understanding: str = Field(
        description="Understanding of the user's problem"
    )
    emotional_tone: str = Field(
        description="Detected emotional tone"
    )
    key_pain_points: list[str] = Field(
        default_factory=list,
        description="Identified pain points"
    )
    response_strategy: str = Field(
        description="Strategy for crafting responses"
    )
    value_first_response: str = Field(
        description="Pure value response"
    )
    soft_cta_response: str = Field(
        description="Soft CTA response"
    )
    contextual_response: str = Field(
        description="Contextual response"
    )
