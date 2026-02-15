"""Prompt templates for Response Generation skill.

This module contains carefully crafted prompts for generating
engagement responses with varying CTA levels.
"""

# System prompt for the response generation skill
SYSTEM_PROMPT = """You are an expert engagement specialist for the ReachBy3Cs platform.
Your role is to craft authentic, helpful responses to social media posts that:
1. Genuinely help the person with their problem
2. Build trust through value-first engagement
3. Naturally connect to relevant solutions when appropriate

You understand the importance of:
- Empathy and emotional intelligence
- Platform-specific communication norms
- Balancing helpfulness with business objectives
- Never being salesy or pushy

Always prioritize the user's needs over promotion. A response that helps someone
and builds trust is more valuable than a response that pushes a product."""


# Main prompt template for generating all response variants
RESPONSE_GENERATION_PROMPT = """Analyze the following social media post and generate three different response variants.

## Original Post
Platform: {platform}
Problem Category: {problem_category}
Content:
{text}

## Business Context
App Name: {app_name}
Value Proposition: {value_prop}
Target Audience: {target_audience}
Key Benefits: {key_benefits}

## Your Task

First, analyze the post:
1. What is the core problem or need being expressed?
2. What is the emotional tone (frustrated, curious, desperate, casual, etc.)?
3. What are the specific pain points mentioned?
4. What response strategy would work best?

Then, generate THREE response variants:

### Response Type 1: value_first (CTA Level 0)
- Pure helpful advice with ZERO product mentions
- Focus entirely on solving their problem
- Be genuine and empathetic
- Share practical, actionable advice
- NO mention of any apps, tools, or products whatsoever

### Response Type 2: soft_cta (CTA Level 1)
- Helpful advice with a subtle hint that tools exist
- Use phrases like "some people find tools helpful for this" or "there are apps that can help"
- Do NOT name any specific product
- The focus should still be 80% value, 20% hint

### Response Type 3: contextual (CTA Level 2)
- Context-aware response with natural product integration
- Share personal experience or observation that naturally leads to the solution
- Make it conversational and authentic
- The product mention should feel organic, not forced

## Platform Tone Guidelines
{platform_guidelines}

## Output Format
Respond with a JSON object containing:
{{
    "problem_understanding": "your understanding of their problem",
    "emotional_tone": "detected emotional tone",
    "key_pain_points": ["pain point 1", "pain point 2"],
    "response_strategy": "your chosen strategy",
    "value_first_response": "your value-first response",
    "soft_cta_response": "your soft CTA response",
    "contextual_response": "your contextual response"
}}

Remember:
- Keep responses appropriate for the platform's character limits and norms
- Be authentic and human - avoid corporate speak
- Focus on genuinely helping the person first
- Each response should stand alone as a complete, helpful reply"""


# Platform-specific guidelines
PLATFORM_GUIDELINES = {
    "reddit": """Reddit Guidelines:
- Be casual and conversational - this is a community, not a business forum
- Avoid corporate speak at all costs - Redditors can smell marketing a mile away
- Use "I" statements and share personal experiences
- Match the subreddit's tone (some are more formal than others)
- Acknowledge the person's feelings before offering advice
- Don't use hashtags - they're not a thing on Reddit
- Slightly longer, more detailed responses are acceptable
- Use paragraph breaks for readability
- It's okay to be a bit vulnerable or self-deprecating""",

    "twitter": """Twitter/X Guidelines:
- Keep it concise - every word counts
- Be engaging and direct
- Use 1-2 relevant hashtags maximum (only if they add value)
- Conversational but punchy
- Can use threads for longer explanations, but keep individual tweets focused
- Emojis are acceptable but don't overdo it
- Be quotable - great tweets get shared
- Ask follow-up questions to encourage engagement""",

    "quora": """Quora Guidelines:
- Be professional and authoritative
- Provide detailed, well-structured answers
- Use formatting (bullet points, headers) for readability
- Back up claims with reasoning or experience
- Write as an expert sharing knowledge
- Longer, more comprehensive responses are expected
- Be educational rather than conversational
- Answer the specific question before expanding on related topics"""
}


# Prompt for refining responses based on feedback
REFINEMENT_PROMPT = """Review and refine this response for {platform}:

Original Response:
{response}

Issues to address:
{issues}

Please provide a refined version that:
1. Addresses all the issues mentioned
2. Maintains the original intent and helpfulness
3. Fits the platform's communication style
4. Feels authentic and human

Refined response:"""


# Prompt for adjusting CTA level
CTA_ADJUSTMENT_PROMPT = """Adjust the following response to change its CTA level.

Original Response ({original_level}):
{response}

Target CTA Level: {target_level}

CTA Level Definitions:
- value_first (0): Pure helpful advice, NO product mentions at all
- soft_cta (1): Helpful advice with subtle "tools exist" hint, no specific product names
- contextual (2): Natural product integration that feels organic

Adjusted response:"""


# Fallback response templates for when LLM fails
FALLBACK_TEMPLATES = {
    "value_first": {
        "reddit": "That's a really common challenge. One thing that's helped others in similar situations is {generic_advice}. Have you tried approaching it from that angle?",
        "twitter": "Totally get this. {short_advice} can make a big difference. What's worked for you so far?",
        "quora": "This is a question many people face. Based on my experience, {detailed_advice}. The key is to {key_action}."
    },
    "soft_cta": {
        "reddit": "I hear you on this. {generic_advice} Some people also find that using tools or apps for this helps take the emotion out of it.",
        "twitter": "{short_advice} - there are also some great tools out there that can help with this!",
        "quora": "{detailed_advice}. Additionally, there are various tools and applications designed specifically for this use case that you might want to explore."
    },
    "contextual": {
        "reddit": "Been there! {generic_advice} I started using a {product_type} and it honestly made things so much easier.",
        "twitter": "{short_advice} A good {product_type} can really help - game changer for me!",
        "quora": "{detailed_advice}. In my experience, using a dedicated {product_type} has been particularly effective for managing this."
    }
}
