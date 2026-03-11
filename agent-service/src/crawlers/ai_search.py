"""AI-powered search query generation.

Uses OpenAI to generate optimal search queries from natural language descriptions.
"""

import logging
from typing import Any

from openai import AsyncOpenAI

from src.config import get_settings

logger = logging.getLogger(__name__)

SEARCH_QUERY_PROMPT = """You are an expert at finding online discussions and conversations.

Given a user's description of their target audience and what problem they solve, generate optimal search queries to find relevant discussions on Reddit, Stack Overflow, Quora, and Hacker News.

User's Input:
- Target Audience: {target_audience}
- Solution/Product: {solution}

Generate 3-5 different search queries that would find people:
1. Discussing the problem the user solves
2. Asking for recommendations or solutions
3. Expressing frustration with existing alternatives
4. Looking for help with related issues

Rules:
- Each query should be 3-7 words
- Focus on pain points and problems, not product names
- Use natural language people would actually type
- Include emotional keywords when relevant (frustrated, struggling, help, need, looking for)
- Don't include site: filters - we handle that separately

Respond with ONLY a JSON array of search query strings, nothing else.
Example: ["how to improve relationship communication", "couples therapy app recommendations", "frustrated with partner not listening"]
"""


async def generate_search_queries(
    target_audience: str,
    solution: str,
    num_queries: int = 5,
) -> list[str]:
    """Generate AI-optimized search queries from user description.

    Args:
        target_audience: Description of who the user wants to reach.
        solution: Description of what problem the user solves.
        num_queries: Maximum number of queries to generate.

    Returns:
        List of optimized search query strings.
    """
    settings = get_settings()

    if not settings.openai_api_key.get_secret_value():
        logger.warning("OpenAI API key not configured, falling back to basic extraction")
        return _fallback_extraction(target_audience, solution)

    try:
        client = AsyncOpenAI(api_key=settings.openai_api_key.get_secret_value())

        response = await client.chat.completions.create(
            model="gpt-4o-mini",  # Fast and cheap for query generation
            messages=[
                {
                    "role": "system",
                    "content": "You are a search query optimization expert. Respond only with valid JSON arrays.",
                },
                {
                    "role": "user",
                    "content": SEARCH_QUERY_PROMPT.format(
                        target_audience=target_audience,
                        solution=solution,
                    ),
                },
            ],
            temperature=0.7,
            max_tokens=500,
        )

        content = response.choices[0].message.content
        if not content:
            return _fallback_extraction(target_audience, solution)

        # Parse the JSON response
        import json

        # Clean up the response - remove markdown code blocks if present
        content = content.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        content = content.strip()

        queries = json.loads(content)

        if not isinstance(queries, list):
            return _fallback_extraction(target_audience, solution)

        # Filter and limit queries
        queries = [q for q in queries if isinstance(q, str) and len(q) > 3][:num_queries]

        if not queries:
            return _fallback_extraction(target_audience, solution)

        logger.info(f"Generated {len(queries)} AI search queries")
        return queries

    except Exception as e:
        logger.error(f"Error generating AI search queries: {e}")
        return _fallback_extraction(target_audience, solution)


def _fallback_extraction(target_audience: str, solution: str) -> list[str]:
    """Fallback keyword extraction when AI is unavailable.

    Args:
        target_audience: Target audience description.
        solution: Solution description.

    Returns:
        List of extracted keywords combined into queries.
    """
    stop_words = {
        'i', 'me', 'my', 'we', 'our', 'you', 'your', 'the', 'a', 'an', 'and', 'or',
        'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was',
        'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
        'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can',
        'need', 'dare', 'ought', 'used', 'that', 'this', 'these', 'those', 'who',
        'which', 'what', 'where', 'when', 'why', 'how', 'all', 'each', 'every',
        'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'not', 'only',
        'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now', 'here', 'there',
        'provide', 'looking', 'find', 'want', 'people', 'help', 'trying',
    }

    combined = f"{target_audience} {solution}".lower()
    words = ''.join(c if c.isalnum() or c.isspace() else ' ' for c in combined).split()
    keywords = [w for w in words if len(w) > 2 and w not in stop_words]
    unique_keywords = list(dict.fromkeys(keywords))[:10]

    if len(unique_keywords) >= 4:
        return [
            ' '.join(unique_keywords[:4]),
            ' '.join(unique_keywords[2:6]) if len(unique_keywords) > 5 else ' '.join(unique_keywords[:3]),
        ]
    elif unique_keywords:
        return [' '.join(unique_keywords)]
    else:
        return ["help recommendations advice"]
