"""
ReachBy3Cs Comprehensive Test Suite
====================================
Runs multiple test cases with clear metrics, edge cases, and failure analysis.
Outputs results to CSV for review.

Run with: python test_suite.py
"""

import asyncio
import os
import json
import csv
from datetime import datetime
from dataclasses import dataclass, asdict
from typing import Optional, List
from enum import Enum

from dotenv import load_dotenv
load_dotenv()

import httpx

# ============================================================================
# CONFIGURATION
# ============================================================================

SERPAPI_URL = "https://serpapi.com/search"
OPENAI_URL = "https://api.openai.com/v1/chat/completions"

# Validate required API keys
SERPAPI_KEY = os.environ.get("SERPAPI_API_KEY")
OPENAI_KEY = os.environ.get("OPENAI_API_KEY")

if not SERPAPI_KEY:
    print("ERROR: SERPAPI_API_KEY not set in .env file")
    exit(1)

if not OPENAI_KEY:
    print("ERROR: OPENAI_API_KEY not set in .env file")
    exit(1)


# ============================================================================
# DATA MODELS
# ============================================================================

class TestStatus(Enum):
    PASSED = "PASSED"
    FAILED = "FAILED"
    PARTIAL = "PARTIAL"
    SKIPPED = "SKIPPED"


class RiskLevel(Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    BLOCKED = "blocked"


@dataclass
class TestCase:
    """Defines a test case to run."""
    id: str
    name: str
    description: str
    keyword: str
    platform: str
    category: str  # normal, edge_case, stress_test
    expected_risk: Optional[str] = None
    expected_min_results: int = 0
    is_edge_case: bool = False


@dataclass
class TestResult:
    """Stores results from a single test case."""
    test_id: str
    test_name: str
    category: str
    timestamp: str

    # Crawl Metrics
    crawl_status: str
    posts_found: int
    crawl_time_ms: int
    crawl_error: Optional[str] = None

    # Sample Post (first result)
    sample_title: Optional[str] = None
    sample_snippet: Optional[str] = None
    sample_url: Optional[str] = None

    # AI Analysis Metrics
    ai_status: str = "NOT_RUN"
    signal_score: Optional[float] = None
    emotional_intensity: Optional[float] = None
    risk_level: Optional[str] = None
    risk_score: Optional[float] = None
    cts_score: Optional[float] = None
    cta_level: Optional[int] = None
    ai_time_ms: int = 0
    ai_error: Optional[str] = None

    # Generated Response
    response_generated: Optional[str] = None
    response_length: int = 0

    # Validation
    test_status: str = "PENDING"
    failure_reason: Optional[str] = None
    failure_analysis: Optional[str] = None


# ============================================================================
# TEST CASES DEFINITION
# ============================================================================

TEST_CASES: List[TestCase] = [
    # ---- NORMAL TEST CASES ----
    TestCase(
        id="TC001",
        name="Relationship Communication",
        description="Find posts about relationship communication struggles",
        keyword="struggling to communicate with partner",
        platform="reddit.com",
        category="normal",
        expected_risk="low",
        expected_min_results=1,
    ),
    TestCase(
        id="TC002",
        name="Workplace Conflict",
        description="Find posts about workplace issues and conflicts",
        keyword="coworker taking credit for my work",
        platform="reddit.com",
        category="normal",
        expected_risk="low",
        expected_min_results=1,
    ),
    TestCase(
        id="TC003",
        name="Anxiety and Overwhelm",
        description="Find posts about feeling overwhelmed (moderate risk)",
        keyword="feeling overwhelmed and anxious",
        platform="reddit.com",
        category="normal",
        expected_risk="medium",
        expected_min_results=1,
    ),
    TestCase(
        id="TC004",
        name="Quora Questions",
        description="Test Quora platform crawling",
        keyword="how to handle difficult conversations",
        platform="quora.com",
        category="normal",
        expected_risk="low",
        expected_min_results=1,
    ),

    # ---- EDGE CASES ----
    TestCase(
        id="EC001",
        name="Empty Results - Gibberish",
        description="Search for nonsensical query that should return no results",
        keyword="xyzzy123foobarbaz999",
        platform="reddit.com",
        category="edge_case",
        expected_min_results=0,
        is_edge_case=True,
    ),
    TestCase(
        id="EC002",
        name="Special Characters",
        description="Test handling of special characters in query",
        keyword="help with @#$% communication",
        platform="reddit.com",
        category="edge_case",
        expected_min_results=0,
        is_edge_case=True,
    ),
    TestCase(
        id="EC003",
        name="Very Long Query",
        description="Test handling of extremely long search query",
        keyword="I have been struggling for a very long time with communication issues in my relationship and I don't know what to do anymore because every time I try to talk it ends badly",
        platform="reddit.com",
        category="edge_case",
        expected_min_results=1,
        is_edge_case=True,
    ),
    TestCase(
        id="EC004",
        name="High Risk Content Detection",
        description="Test that high-risk content is properly flagged (simulated)",
        keyword="feeling hopeless about life",
        platform="reddit.com",
        category="edge_case",
        expected_risk="high",
        expected_min_results=1,
        is_edge_case=True,
    ),

    # ---- PLATFORM VARIATION ----
    TestCase(
        id="PV001",
        name="Twitter/X Platform",
        description="Test Twitter platform search",
        keyword="need advice on relationship",
        platform="twitter.com",
        category="platform_test",
        expected_min_results=0,  # May have limited results
    ),
    TestCase(
        id="PV002",
        name="Multiple Words Exact Match",
        description="Test exact phrase matching",
        keyword='"need help communicating"',
        platform="reddit.com",
        category="normal",
        expected_min_results=0,
    ),
]


# ============================================================================
# AI ANALYSIS FUNCTIONS
# ============================================================================

async def analyze_with_ai(client: httpx.AsyncClient, content: str) -> dict:
    """
    Run AI analysis on content to get signal, risk, and response.
    Returns dict with all scores and generated response.
    """

    prompt = f"""Analyze this social media post and provide engagement analysis.

POST CONTENT:
{content[:1500]}

Respond in this EXACT JSON format:
{{
    "signal_analysis": {{
        "problem_category": "category name",
        "emotional_intensity": 0.0 to 1.0,
        "keywords": ["keyword1", "keyword2"],
        "confidence": 0.0 to 1.0
    }},
    "risk_assessment": {{
        "risk_level": "low" or "medium" or "high" or "blocked",
        "risk_score": 0.0 to 1.0,
        "risk_factors": ["factor1", "factor2"],
        "contains_crisis_language": false
    }},
    "response": {{
        "value_first_response": "A helpful response with no product mention",
        "cta_level": 0 to 3,
        "cts_score": 0.0 to 1.0,
        "can_auto_post": true or false
    }}
}}

Be accurate with risk assessment. Flag high risk for crisis language, self-harm mentions, or severe distress."""

    headers = {
        "Authorization": f"Bearer {OPENAI_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": "You are an AI assistant that analyzes social media posts for engagement opportunities. Always respond with valid JSON."},
            {"role": "user", "content": prompt}
        ],
        "temperature": 0.3,
        "max_tokens": 1000
    }

    response = await client.post(OPENAI_URL, headers=headers, json=payload)

    if response.status_code != 200:
        raise Exception(f"OpenAI API error: {response.status_code} - {response.text}")

    data = response.json()
    content = data["choices"][0]["message"]["content"]

    # Parse JSON from response (handle markdown code blocks)
    if "```json" in content:
        content = content.split("```json")[1].split("```")[0]
    elif "```" in content:
        content = content.split("```")[1].split("```")[0]

    return json.loads(content.strip())


# ============================================================================
# TEST RUNNER
# ============================================================================

async def run_test_case(client: httpx.AsyncClient, test: TestCase) -> TestResult:
    """Run a single test case and return results."""

    print(f"\n{'='*60}")
    print(f"Running: [{test.id}] {test.name}")
    print(f"Category: {test.category} | Edge Case: {test.is_edge_case}")
    print(f"Query: \"{test.keyword}\" site:{test.platform}")
    print('='*60)

    result = TestResult(
        test_id=test.id,
        test_name=test.name,
        category=test.category,
        timestamp=datetime.now().isoformat(),
        crawl_status="PENDING",
        posts_found=0,
        crawl_time_ms=0,
    )

    # ---- STEP 1: CRAWL ----
    crawl_start = datetime.now()

    try:
        query = f'"{test.keyword}" site:{test.platform}'
        params = {
            "api_key": SERPAPI_KEY,
            "engine": "google",
            "q": query,
            "num": 5,
        }

        response = await client.get(SERPAPI_URL, params=params)
        crawl_time = (datetime.now() - crawl_start).total_seconds() * 1000
        result.crawl_time_ms = int(crawl_time)

        if response.status_code == 200:
            data = response.json()
            organic_results = data.get("organic_results", [])
            result.posts_found = len(organic_results)
            result.crawl_status = "SUCCESS"

            print(f"  Crawl: SUCCESS ({result.posts_found} posts in {result.crawl_time_ms}ms)")

            if organic_results:
                first = organic_results[0]
                result.sample_title = first.get("title", "")[:100]
                result.sample_snippet = first.get("snippet", "")[:200]
                result.sample_url = first.get("link", "")
                print(f"  Sample: {result.sample_title[:50]}...")
        else:
            result.crawl_status = "FAILED"
            result.crawl_error = f"HTTP {response.status_code}"
            print(f"  Crawl: FAILED - {result.crawl_error}")

    except Exception as e:
        result.crawl_status = "ERROR"
        result.crawl_error = str(e)[:200]
        print(f"  Crawl: ERROR - {result.crawl_error}")

    # ---- STEP 2: AI ANALYSIS (if we have content) ----
    if result.posts_found > 0 and result.sample_snippet:
        ai_start = datetime.now()

        try:
            content = f"{result.sample_title}\n\n{result.sample_snippet}"
            analysis = await analyze_with_ai(client, content)
            ai_time = (datetime.now() - ai_start).total_seconds() * 1000
            result.ai_time_ms = int(ai_time)
            result.ai_status = "SUCCESS"

            # Extract scores
            signal = analysis.get("signal_analysis", {})
            risk = analysis.get("risk_assessment", {})
            resp = analysis.get("response", {})

            result.signal_score = signal.get("confidence", 0)
            result.emotional_intensity = signal.get("emotional_intensity", 0)
            result.risk_level = risk.get("risk_level", "unknown")
            result.risk_score = risk.get("risk_score", 0)
            result.cts_score = resp.get("cts_score", 0)
            result.cta_level = resp.get("cta_level", 0)
            result.response_generated = resp.get("value_first_response", "")[:500]
            result.response_length = len(result.response_generated)

            print(f"  AI Analysis: SUCCESS ({result.ai_time_ms}ms)")
            print(f"    Signal: {result.signal_score:.2f} | Emotional: {result.emotional_intensity:.2f}")
            print(f"    Risk: {result.risk_level} ({result.risk_score:.2f})")
            print(f"    CTS: {result.cts_score:.2f} | CTA Level: {result.cta_level}")
            print(f"    Response: {result.response_length} chars")

        except Exception as e:
            result.ai_status = "ERROR"
            result.ai_error = str(e)[:200]
            print(f"  AI Analysis: ERROR - {result.ai_error}")
    else:
        result.ai_status = "SKIPPED"
        print(f"  AI Analysis: SKIPPED (no content)")

    # ---- STEP 3: VALIDATION ----
    failures = []

    # Check crawl results vs expected
    if test.expected_min_results > 0 and result.posts_found < test.expected_min_results:
        failures.append(f"Expected min {test.expected_min_results} results, got {result.posts_found}")

    # Check risk level if expected
    if test.expected_risk and result.risk_level:
        if result.risk_level != test.expected_risk:
            # Not necessarily a failure, but note the discrepancy
            if test.expected_risk == "high" and result.risk_level in ["low", "medium"]:
                failures.append(f"Expected {test.expected_risk} risk, got {result.risk_level}")

    # Check for errors
    if result.crawl_status == "ERROR":
        failures.append(f"Crawl error: {result.crawl_error}")
    if result.ai_status == "ERROR":
        failures.append(f"AI error: {result.ai_error}")

    # Determine test status
    if not failures:
        if result.posts_found == 0 and test.is_edge_case:
            result.test_status = "PASSED"  # Expected for edge cases
        elif result.posts_found > 0 and result.ai_status == "SUCCESS":
            result.test_status = "PASSED"
        elif result.posts_found == 0:
            result.test_status = "PARTIAL"
            result.failure_reason = "No results found"
        else:
            result.test_status = "PARTIAL"
    else:
        result.test_status = "FAILED"
        result.failure_reason = "; ".join(failures)

    # Generate failure analysis
    if result.test_status in ["FAILED", "PARTIAL"]:
        result.failure_analysis = generate_failure_analysis(test, result)

    print(f"\n  Result: {result.test_status}")
    if result.failure_reason:
        print(f"  Reason: {result.failure_reason}")

    return result


def generate_failure_analysis(test: TestCase, result: TestResult) -> str:
    """Generate insightful analysis for failed or partial tests."""

    analysis_parts = []

    # Crawl failures
    if result.crawl_status != "SUCCESS":
        if "401" in str(result.crawl_error):
            analysis_parts.append("API authentication failed - check SERPAPI_API_KEY")
        elif "429" in str(result.crawl_error):
            analysis_parts.append("Rate limited - reduce request frequency or upgrade API plan")
        elif "timeout" in str(result.crawl_error).lower():
            analysis_parts.append("Request timeout - network issues or API slowness")
        else:
            analysis_parts.append(f"Crawl issue: {result.crawl_error}")

    # No results analysis
    if result.posts_found == 0 and test.expected_min_results > 0:
        if test.is_edge_case:
            analysis_parts.append("Edge case - no results expected or keyword too specific")
        else:
            analysis_parts.append("No results: keyword may be too specific, platform may have limited content, or search index delay")
            analysis_parts.append("Recommendation: Try broader keywords or different platforms")

    # AI failures
    if result.ai_status == "ERROR":
        if "rate" in str(result.ai_error).lower():
            analysis_parts.append("OpenAI rate limit - wait and retry or check quota")
        elif "json" in str(result.ai_error).lower():
            analysis_parts.append("AI response parsing failed - prompt may need adjustment")
        else:
            analysis_parts.append(f"AI issue: {result.ai_error}")

    # Risk mismatch
    if test.expected_risk and result.risk_level and test.expected_risk != result.risk_level:
        analysis_parts.append(f"Risk assessment mismatch: content may not contain expected indicators for {test.expected_risk} risk")

    # Response quality
    if result.response_length < 50 and result.ai_status == "SUCCESS":
        analysis_parts.append("Short response generated - may need prompt improvement for better engagement")

    return " | ".join(analysis_parts) if analysis_parts else "No specific issues identified"


# ============================================================================
# REPORTING
# ============================================================================

def generate_csv_report(results: List[TestResult], filename: str):
    """Generate CSV report of all test results."""

    if not results:
        print("No results to report")
        return

    fieldnames = [
        'test_id', 'test_name', 'category', 'timestamp',
        'test_status', 'crawl_status', 'posts_found', 'crawl_time_ms',
        'sample_title', 'sample_url',
        'ai_status', 'signal_score', 'emotional_intensity',
        'risk_level', 'risk_score', 'cts_score', 'cta_level',
        'ai_time_ms', 'response_length',
        'failure_reason', 'failure_analysis'
    ]

    with open(filename, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()

        for result in results:
            row = {k: getattr(result, k, '') for k in fieldnames}
            writer.writerow(row)

    print(f"\nCSV report saved to: {filename}")


def generate_summary_report(results: List[TestResult]):
    """Print summary statistics."""

    print("\n" + "="*70)
    print("TEST SUITE SUMMARY")
    print("="*70)

    total = len(results)
    passed = sum(1 for r in results if r.test_status == "PASSED")
    failed = sum(1 for r in results if r.test_status == "FAILED")
    partial = sum(1 for r in results if r.test_status == "PARTIAL")

    print(f"\nTotal Tests: {total}")
    print(f"  PASSED:  {passed} ({passed/total*100:.1f}%)")
    print(f"  FAILED:  {failed} ({failed/total*100:.1f}%)")
    print(f"  PARTIAL: {partial} ({partial/total*100:.1f}%)")

    # Crawl statistics
    crawl_success = sum(1 for r in results if r.crawl_status == "SUCCESS")
    total_posts = sum(r.posts_found for r in results)
    avg_crawl_time = sum(r.crawl_time_ms for r in results) / total if total > 0 else 0

    print(f"\nCrawl Statistics:")
    print(f"  Success Rate: {crawl_success}/{total} ({crawl_success/total*100:.1f}%)")
    print(f"  Total Posts Found: {total_posts}")
    print(f"  Avg Crawl Time: {avg_crawl_time:.0f}ms")

    # AI statistics
    ai_success = sum(1 for r in results if r.ai_status == "SUCCESS")
    ai_run = sum(1 for r in results if r.ai_status != "SKIPPED")
    avg_ai_time = sum(r.ai_time_ms for r in results if r.ai_status == "SUCCESS")
    ai_count = sum(1 for r in results if r.ai_status == "SUCCESS")

    print(f"\nAI Analysis Statistics:")
    print(f"  Success Rate: {ai_success}/{ai_run} ({ai_success/ai_run*100:.1f}% of attempts)")
    if ai_count > 0:
        print(f"  Avg AI Time: {avg_ai_time/ai_count:.0f}ms")

    # Risk distribution
    risk_counts = {}
    for r in results:
        if r.risk_level:
            risk_counts[r.risk_level] = risk_counts.get(r.risk_level, 0) + 1

    if risk_counts:
        print(f"\nRisk Distribution:")
        for level, count in sorted(risk_counts.items()):
            print(f"  {level}: {count}")

    # Score averages
    scores = [r for r in results if r.signal_score is not None]
    if scores:
        avg_signal = sum(r.signal_score for r in scores) / len(scores)
        avg_emotional = sum(r.emotional_intensity for r in scores) / len(scores)
        avg_cts = sum(r.cts_score for r in scores if r.cts_score) / len([r for r in scores if r.cts_score])

        print(f"\nAverage Scores:")
        print(f"  Signal Confidence: {avg_signal:.2f}")
        print(f"  Emotional Intensity: {avg_emotional:.2f}")
        print(f"  CTS Score: {avg_cts:.2f}")

    # Failures summary
    failures = [r for r in results if r.test_status in ["FAILED", "PARTIAL"]]
    if failures:
        print(f"\nFailure Analysis:")
        for r in failures:
            print(f"\n  [{r.test_id}] {r.test_name}")
            print(f"    Status: {r.test_status}")
            print(f"    Reason: {r.failure_reason}")
            if r.failure_analysis:
                print(f"    Analysis: {r.failure_analysis}")

    print("\n" + "="*70)


def save_detailed_json(results: List[TestResult], filename: str):
    """Save detailed JSON results for further analysis."""

    output = {
        "run_timestamp": datetime.now().isoformat(),
        "total_tests": len(results),
        "summary": {
            "passed": sum(1 for r in results if r.test_status == "PASSED"),
            "failed": sum(1 for r in results if r.test_status == "FAILED"),
            "partial": sum(1 for r in results if r.test_status == "PARTIAL"),
        },
        "results": [asdict(r) for r in results]
    }

    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, default=str)

    print(f"Detailed JSON saved to: {filename}")


# ============================================================================
# MAIN EXECUTION
# ============================================================================

async def run_test_suite():
    """Run all test cases and generate reports."""

    print("\n" + "="*70)
    print("ReachBy3Cs COMPREHENSIVE TEST SUITE")
    print(f"Started: {datetime.now().isoformat()}")
    print(f"Test Cases: {len(TEST_CASES)}")
    print("="*70)

    results: List[TestResult] = []

    async with httpx.AsyncClient(timeout=60.0) as client:
        for test in TEST_CASES:
            result = await run_test_case(client, test)
            results.append(result)

            # Rate limiting between tests
            await asyncio.sleep(1.0)

    # Generate reports
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

    generate_summary_report(results)
    generate_csv_report(results, f"test_results_{timestamp}.csv")
    save_detailed_json(results, f"test_results_{timestamp}.json")

    print(f"\nTest suite completed at {datetime.now().isoformat()}")

    return results


if __name__ == "__main__":
    results = asyncio.run(run_test_suite())

    # Exit with appropriate code
    failed = sum(1 for r in results if r.test_status == "FAILED")
    exit(1 if failed > 0 else 0)
