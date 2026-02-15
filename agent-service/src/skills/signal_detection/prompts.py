"""Prompt templates for the Signal Detection skill.

This module contains prompt templates used for LLM-based signal detection
and problem category classification.
"""

# System prompt for the signal detection analysis
SIGNAL_DETECTION_SYSTEM_PROMPT = """You are an expert analyst specializing in identifying emotional signals and problem categories in social media posts. Your task is to analyze text content and extract structured information about the underlying problems or concerns expressed.

You must always respond with valid JSON in the exact format specified. Be accurate, objective, and consistent in your analysis."""

# Main analysis prompt template
SIGNAL_DETECTION_ANALYSIS_PROMPT = """Analyze the following social media post from {platform} and identify:

1. **Problem Category**: Classify the main problem or concern into ONE of these categories:
   - relationship_communication: Issues with communicating in romantic relationships
   - relationship_trust: Trust issues in romantic relationships
   - relationship_boundaries: Setting or respecting boundaries in relationships
   - family_conflict: Conflicts with family members
   - family_dynamics: Complex family relationship dynamics
   - workplace_conflict: Issues with coworkers or workplace dynamics
   - workplace_career: Career development or job-related concerns
   - workplace_management: Issues with management or leadership
   - financial_stress: Money-related worries or problems
   - financial_planning: Financial decision-making and planning
   - mental_health_anxiety: Anxiety-related concerns
   - mental_health_depression: Depression or mood-related concerns
   - mental_health_stress: General stress and overwhelm
   - social_isolation: Loneliness or feeling disconnected
   - social_confidence: Self-esteem and social confidence issues
   - parenting_discipline: Child discipline and behavior issues
   - parenting_development: Child development concerns
   - health_chronic: Chronic health condition concerns
   - health_lifestyle: Lifestyle and wellness concerns
   - personal_growth: Self-improvement and personal development
   - decision_making: Difficulty making important decisions
   - other: Does not fit any category above

2. **Emotional Intensity**: Rate the emotional intensity on a scale from 0.0 to 1.0:
   - 0.0-0.2: Calm, factual, seeking information
   - 0.2-0.4: Mild concern or curiosity
   - 0.4-0.6: Moderate distress or frustration
   - 0.6-0.8: Significant emotional involvement
   - 0.8-1.0: High distress, urgency, or emotional overwhelm

3. **Keywords**: Extract 3-7 relevant keywords that capture the essence of the problem.

4. **Confidence**: Rate your confidence in this analysis from 0.0 to 1.0.

5. **Reasoning**: Provide a brief (1-2 sentences) explanation of your classification.

POST CONTENT:
---
{text}
---

Respond with ONLY valid JSON in this exact format:
{{
    "problem_category": "<category_name>",
    "emotional_intensity": <float between 0.0 and 1.0>,
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "confidence": <float between 0.0 and 1.0>,
    "reasoning": "<brief explanation>"
}}"""

# Fallback categories for validation
VALID_PROBLEM_CATEGORIES = [
    "relationship_communication",
    "relationship_trust",
    "relationship_boundaries",
    "family_conflict",
    "family_dynamics",
    "workplace_conflict",
    "workplace_career",
    "workplace_management",
    "financial_stress",
    "financial_planning",
    "mental_health_anxiety",
    "mental_health_depression",
    "mental_health_stress",
    "social_isolation",
    "social_confidence",
    "parenting_discipline",
    "parenting_development",
    "health_chronic",
    "health_lifestyle",
    "personal_growth",
    "decision_making",
    "other",
]


def format_analysis_prompt(text: str, platform: str) -> str:
    """Format the analysis prompt with the given text and platform.

    Args:
        text: The post content to analyze.
        platform: The social media platform source.

    Returns:
        str: The formatted prompt ready for LLM input.
    """
    return SIGNAL_DETECTION_ANALYSIS_PROMPT.format(
        text=text,
        platform=platform,
    )
