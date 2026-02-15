"""Response Generation Skill for the ReachBy3Cs engagement platform.

This skill generates platform-appropriate responses with varying CTA levels
based on detected signals, risk assessment, and tenant context.

Example usage:
    from src.skills.response_generation import (
        ResponseGenerationSkill,
        ResponseGenerationInput,
        TenantContext,
    )

    # Create skill instance
    skill = ResponseGenerationSkill()

    # Prepare input
    input_data = ResponseGenerationInput(
        text="I'm struggling with budgeting as a couple...",
        problem_category="financial_planning",
        risk_level="medium",
        platform="reddit",
        tenant_context=TenantContext(
            app_name="CouplesCents",
            value_prop="A collaborative budgeting app for couples",
            key_benefits=["shared tracking", "goal setting"],
        ),
    )

    # Generate responses
    output = skill.run(input_data)

    # Access responses
    print(output.selected_response)  # Recommended response
    print(output.selected_type)      # "soft_cta" (for medium risk)
"""

from src.skills.response_generation.schemas import (
    LLMResponseAnalysis,
    Platform,
    ResponseGenerationInput,
    ResponseGenerationOutput,
    ResponseType,
    RiskLevel,
    TenantContext,
)
from src.skills.response_generation.skill import ResponseGenerationSkill
from src.skills.response_generation.tone_adapter import ToneAdapter

__all__ = [
    # Main skill class
    "ResponseGenerationSkill",
    # Input/Output schemas
    "ResponseGenerationInput",
    "ResponseGenerationOutput",
    "TenantContext",
    "LLMResponseAnalysis",
    # Type aliases
    "ResponseType",
    "RiskLevel",
    "Platform",
    # Tone adaptation
    "ToneAdapter",
]
