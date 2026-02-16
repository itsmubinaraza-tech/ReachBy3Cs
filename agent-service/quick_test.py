"""
Quick test script for first end-to-end crawl.
Run with: python quick_test.py
"""

import asyncio
import os
import json
from datetime import datetime

# Load environment variables from .env file
from dotenv import load_dotenv
load_dotenv()

if not os.environ.get("SERPAPI_API_KEY"):
    print("ERROR: SERPAPI_API_KEY not set. Add it to .env file.")
    exit(1)

import httpx

SERPAPI_URL = "https://serpapi.com/search"

async def test_serpapi_crawl():
    """Test SerpAPI crawl for engagement opportunities."""

    print("\n" + "="*60)
    print("ReachBy3Cs - First Crawl Test")
    print("="*60 + "\n")

    # Test keywords - looking for people with problems we can help with
    keywords = [
        "struggling with communication",
        "need help with relationship",
        "feeling overwhelmed"
    ]

    # Platforms to search
    platforms = ["reddit.com", "quora.com"]

    async with httpx.AsyncClient(timeout=30.0) as client:
        all_results = []

        for keyword in keywords:
            for platform in platforms:
                query = f'"{keyword}" site:{platform}'

                print(f"Searching: {query}")

                params = {
                    "api_key": os.environ["SERPAPI_API_KEY"],
                    "engine": "google",
                    "q": query,
                    "num": 5,  # 5 results per search
                }

                try:
                    response = await client.get(SERPAPI_URL, params=params)

                    if response.status_code == 200:
                        data = response.json()

                        organic_results = data.get("organic_results", [])

                        for result in organic_results:
                            post = {
                                "title": result.get("title", ""),
                                "snippet": result.get("snippet", ""),
                                "url": result.get("link", ""),
                                "platform": platform.replace(".com", ""),
                                "keyword": keyword,
                                "found_at": datetime.now().isoformat(),
                            }
                            all_results.append(post)
                            print(f"  Found: {post['title'][:60]}...")

                    elif response.status_code == 401:
                        print(f"  ERROR: Invalid API key")
                        return
                    else:
                        print(f"  ERROR: {response.status_code}")

                except Exception as e:
                    print(f"  ERROR: {e}")

                # Small delay between requests
                await asyncio.sleep(0.5)

        print("\n" + "="*60)
        print(f"CRAWL COMPLETE - Found {len(all_results)} posts")
        print("="*60 + "\n")

        # Save results to file
        output_file = "crawl_results.json"
        with open(output_file, "w") as f:
            json.dump(all_results, f, indent=2)
        print(f"Results saved to: {output_file}")

        # Print sample results
        print("\nSample Results:")
        print("-"*60)
        for i, post in enumerate(all_results[:5]):
            print(f"\n{i+1}. [{post['platform'].upper()}] {post['title']}")
            print(f"   URL: {post['url']}")
            print(f"   Snippet: {post['snippet'][:100]}...")

        return all_results

if __name__ == "__main__":
    results = asyncio.run(test_serpapi_crawl())

    if results:
        print(f"\n✓ SUCCESS! Found {len(results)} engagement opportunities")
        print("\nNext step: Add OpenAI key to generate AI responses")
    else:
        print("\n✗ No results found. Check API key and try again.")
