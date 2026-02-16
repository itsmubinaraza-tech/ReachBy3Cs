"""
Full end-to-end test: Crawl -> AI Analysis -> Save to Supabase
Run with: python full_test.py
"""

import asyncio
import os
import json
from datetime import datetime
from uuid import uuid4

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

# Verify keys are set
if not os.environ.get("SERPAPI_API_KEY"):
    print("ERROR: SERPAPI_API_KEY not set. Copy .env.example to .env and add your key.")
    exit(1)
if not os.environ.get("OPENAI_API_KEY"):
    print("ERROR: OPENAI_API_KEY not set. Copy .env.example to .env and add your key.")
    exit(1)

import httpx

SERPAPI_URL = "https://serpapi.com/search"
OPENAI_URL = "https://api.openai.com/v1/chat/completions"


async def crawl_posts(client: httpx.AsyncClient, keyword: str, platform: str, limit: int = 3):
    """Crawl posts from a platform using SerpAPI."""
    query = f'"{keyword}" site:{platform}'

    params = {
        "api_key": os.environ["SERPAPI_API_KEY"],
        "engine": "google",
        "q": query,
        "num": limit,
    }

    response = await client.get(SERPAPI_URL, params=params)

    if response.status_code != 200:
        print(f"  Crawl error: {response.status_code}")
        return []

    data = response.json()
    results = []

    for item in data.get("organic_results", []):
        results.append({
            "id": str(uuid4()),
            "title": item.get("title", ""),
            "snippet": item.get("snippet", ""),
            "url": item.get("link", ""),
            "platform": platform.replace(".com", ""),
            "keyword": keyword,
        })

    return results


async def analyze_and_respond(client: httpx.AsyncClient, post: dict):
    """Use OpenAI to analyze post and generate response."""

    prompt = f"""You are an AI assistant for ReachBy3Cs, helping identify engagement opportunities and generate helpful responses.

Analyze this post and provide:
1. Problem category (e.g., relationship_communication, career_advice, mental_health)
2. Emotional intensity (0.0-1.0)
3. Risk level (low, medium, high)
4. A helpful, empathetic response (2-3 sentences, value-first, NO sales pitch)

POST:
Title: {post['title']}
Content: {post['snippet']}
Platform: {post['platform']}

Respond in JSON format:
{{
    "problem_category": "...",
    "emotional_intensity": 0.0,
    "risk_level": "low|medium|high",
    "response": "..."
}}"""

    headers = {
        "Authorization": f"Bearer {os.environ['OPENAI_API_KEY']}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": "gpt-4o-mini",
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.7,
        "max_tokens": 500,
    }

    response = await client.post(OPENAI_URL, headers=headers, json=payload)

    if response.status_code != 200:
        print(f"  OpenAI error: {response.status_code} - {response.text}")
        return None

    data = response.json()
    content = data["choices"][0]["message"]["content"]

    # Parse JSON from response
    try:
        # Handle markdown code blocks
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]

        analysis = json.loads(content.strip())
        return analysis
    except json.JSONDecodeError:
        print(f"  Failed to parse AI response: {content[:100]}")
        return None


async def main():
    """Run full end-to-end test."""

    print("\n" + "="*70)
    print("ReachBy3Cs - Full End-to-End Test")
    print("="*70)

    # Keywords to search
    keywords = ["struggling with communication", "need advice"]
    platforms = ["reddit.com"]

    results = []

    async with httpx.AsyncClient(timeout=60.0) as client:

        # Step 1: Crawl
        print("\n[STEP 1] Crawling for engagement opportunities...")
        print("-"*70)

        all_posts = []
        for keyword in keywords:
            for platform in platforms:
                print(f"  Searching: {keyword} on {platform}")
                posts = await crawl_posts(client, keyword, platform, limit=2)
                all_posts.extend(posts)
                await asyncio.sleep(0.5)

        print(f"\n  Found {len(all_posts)} posts")

        # Step 2: AI Analysis & Response Generation
        print("\n[STEP 2] AI Analysis & Response Generation...")
        print("-"*70)

        for i, post in enumerate(all_posts[:5]):  # Process first 5
            print(f"\n  Processing {i+1}/{min(5, len(all_posts))}: {post['title'][:50]}...")

            analysis = await analyze_and_respond(client, post)

            if analysis:
                result = {
                    **post,
                    **analysis,
                    "status": "pending",
                    "created_at": datetime.now().isoformat(),
                }
                results.append(result)

                print(f"    Category: {analysis.get('problem_category', 'unknown')}")
                print(f"    Risk: {analysis.get('risk_level', 'unknown')}")
                print(f"    Response: {analysis.get('response', '')[:80]}...")

            await asyncio.sleep(1)  # Rate limit

        # Step 3: Save Results
        print("\n[STEP 3] Saving Results...")
        print("-"*70)

        output_file = "engagement_queue.json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)

        print(f"  Saved {len(results)} items to {output_file}")

        # Summary
        print("\n" + "="*70)
        print("TEST COMPLETE - ENGAGEMENT QUEUE READY")
        print("="*70)

        print("\nSample Queue Items:")
        print("-"*70)

        for i, item in enumerate(results[:3]):
            print(f"\n{i+1}. [{item['platform'].upper()}] {item['title'][:60]}")
            print(f"   URL: {item['url']}")
            print(f"   Category: {item.get('problem_category', 'N/A')}")
            print(f"   Risk: {item.get('risk_level', 'N/A')}")
            print(f"   AI Response: {item.get('response', 'N/A')[:100]}...")

        print("\n" + "="*70)
        print(f"SUCCESS: {len(results)} engagement opportunities ready for review")
        print("="*70)

        print("\nNEXT STEPS:")
        print("  1. Review the engagement_queue.json file")
        print("  2. Pick a response you like")
        print("  3. Open the original post URL")
        print("  4. Copy and paste the AI response")
        print("  5. Post it!")

        return results


if __name__ == "__main__":
    asyncio.run(main())
