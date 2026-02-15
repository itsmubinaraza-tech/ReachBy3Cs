"""Prompt templates for Risk Scoring skill.

This module contains prompt templates used for LLM-based
risk analysis of content.
"""

RISK_ANALYSIS_SYSTEM_PROMPT = """You are a content risk analyst for a social media engagement platform. Your role is to assess the risk level of user-generated content to determine appropriate engagement actions.

You analyze content considering:
1. Emotional intensity and sentiment
2. Sensitive topics (health, legal, financial, political, religious)
3. Potential for misunderstanding or escalation
4. Brand safety concerns
5. User vulnerability indicators

Your analysis must be objective, thorough, and err on the side of caution for user safety.

IMPORTANT: You are NOT detecting crisis content (self-harm, violence) - that has already been filtered. Focus on moderate risk assessment for content that passed initial safety checks."""

RISK_ANALYSIS_USER_PROMPT = """Analyze the following content for engagement risk:

CONTENT:
{text}

CONTEXT FROM SIGNAL DETECTION:
- Emotional Intensity: {emotional_intensity}
- Problem Category: {problem_category}
- Keywords: {keywords}

Provide your analysis in the following JSON format:
{{
    "risk_score": <float 0.0-1.0>,
    "risk_factors": [<list of specific risk factors identified>],
    "context_flags": [<list of sensitive topics or contexts>],
    "sentiment": "<positive|negative|neutral|mixed>",
    "engagement_recommendation": "<specific recommendation for engagement approach>"
}}

Risk Score Guidelines:
- 0.0-0.3: Low risk, suitable for automated engagement
- 0.3-0.5: Low-medium risk, may need tone adjustment
- 0.5-0.7: Medium risk, should be reviewed
- 0.7-0.9: High risk, requires careful manual review
- 0.9-1.0: Very high risk, recommend no engagement

Consider these sensitive topic categories:
- Health/Medical: Any health-related concerns
- Legal: Legal issues, disputes, regulations
- Financial: Money problems, scams, financial advice
- Political: Political opinions, controversial topics
- Religious: Religious beliefs, practices
- Personal Crisis: Relationship issues, job loss, grief
- Discrimination: Bias, prejudice, hate speech indicators
- Controversial: Topics that could spark heated debate

Respond ONLY with the JSON object, no additional text."""

RISK_FACTOR_EXAMPLES = """
Example risk factors to identify:
- "High emotional distress expressed"
- "Mentions of financial hardship"
- "Healthcare/medical concerns present"
- "Potential legal implications"
- "Frustration directed at specific entity"
- "Request for sensitive advice"
- "Vulnerable population indicators"
- "Controversial political topic"
- "Religious sensitivity"
- "Discrimination or bias indicators"
- "Personal relationship conflict"
- "Employment/career distress"
- "Grief or loss mentioned"
- "Trust issues with brands/institutions"
"""

CONTEXT_FLAG_EXAMPLES = """
Example context flags:
- "health_concern"
- "financial_distress"
- "legal_matter"
- "political_content"
- "religious_topic"
- "relationship_issue"
- "employment_concern"
- "grief_loss"
- "discrimination_mention"
- "controversy_potential"
- "brand_complaint"
- "product_safety"
- "privacy_concern"
- "minor_involved"
"""
