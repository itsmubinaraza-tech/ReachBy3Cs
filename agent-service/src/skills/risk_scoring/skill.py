"""Risk Scoring skill implementation.

This module provides the RiskScoringSkill class for analyzing content
risk levels, combining fast pattern-based crisis detection with LLM-based
nuanced risk assessment.
"""

import json
import logging
from typing import Any

import httpx

from src.config import LLMProvider, get_settings
from src.skills.risk_scoring.crisis_detector import CrisisDetector
from src.skills.risk_scoring.prompts import (
    RISK_ANALYSIS_SYSTEM_PROMPT,
    RISK_ANALYSIS_USER_PROMPT,
)
from src.skills.risk_scoring.schemas import (
    LLMRiskAnalysis,
    RiskLevel,
    RiskScoringInput,
    RiskScoringOutput,
)

logger = logging.getLogger(__name__)


class RiskScoringSkill:
    """Risk scoring skill for analyzing content risk levels.

    This skill uses a two-stage approach:
    1. Fast pattern-based crisis detection (no LLM needed)
    2. LLM-based nuanced risk assessment for non-crisis content

    The crisis detector runs first to immediately block dangerous content
    without incurring LLM API costs.

    Attributes:
        crisis_detector: Pattern-based crisis detection instance.
        api_base_url: LLM API base URL.
        api_key: LLM API key.
        model: LLM model name.
        timeout: HTTP timeout for LLM requests.
        temperature: LLM temperature setting.
        max_tokens: Maximum tokens for LLM responses.
    """

    # Risk level thresholds based on score
    RISK_THRESHOLDS = {
        "low": (0.0, 0.3),
        "medium": (0.3, 0.7),
        "high": (0.7, 1.0),
    }

    # Recommended actions for each risk level
    RECOMMENDED_ACTIONS = {
        "blocked": "DO NOT ENGAGE. Crisis content detected. Route to crisis intervention protocol.",
        "high": "Requires manual review before any engagement. Escalate to senior moderator.",
        "medium": "Queue for review. Consider tone adjustment before engagement.",
        "low": "Safe for automated engagement with standard brand voice.",
    }

    def __init__(
        self,
        api_base_url: str | None = None,
        api_key: str | None = None,
        model: str | None = None,
        timeout: float = 30.0,
    ) -> None:
        """Initialize the Risk Scoring skill.

        Args:
            api_base_url: Optional override for the LLM API base URL.
            api_key: Optional override for the LLM API key.
            model: Optional override for the LLM model name.
            timeout: HTTP timeout for LLM requests in seconds.
        """
        settings = get_settings()

        self.api_base_url = api_base_url or self._get_default_api_base_url()
        self.api_key = api_key or self._get_api_key()
        self.model = model or settings.llm_model
        self.timeout = timeout
        self.temperature = settings.llm_temperature
        self.max_tokens = settings.llm_max_tokens

        # Initialize crisis detector for fast pattern matching
        self.crisis_detector = CrisisDetector()

    def _get_default_api_base_url(self) -> str:
        """Get the default API base URL based on the configured provider.

        Returns:
            str: The API base URL.
        """
        settings = get_settings()
        if settings.llm_provider == LLMProvider.OPENAI:
            return "https://api.openai.com/v1"
        elif settings.llm_provider == LLMProvider.ANTHROPIC:
            return "https://api.anthropic.com/v1"
        return "https://api.openai.com/v1"

    def _get_api_key(self) -> str:
        """Get the API key based on the configured provider.

        Returns:
            str: The API key.
        """
        settings = get_settings()
        if settings.llm_provider == LLMProvider.OPENAI:
            return settings.openai_api_key.get_secret_value()
        elif settings.llm_provider == LLMProvider.ANTHROPIC:
            return settings.anthropic_api_key.get_secret_value()
        return settings.openai_api_key.get_secret_value()

    def _determine_risk_level(self, risk_score: float) -> RiskLevel:
        """Determine risk level from numerical score.

        Args:
            risk_score: The risk score from 0.0 to 1.0.

        Returns:
            RiskLevel: The corresponding risk level.
        """
        if risk_score >= 0.7:
            return RiskLevel.HIGH
        elif risk_score >= 0.3:
            return RiskLevel.MEDIUM
        return RiskLevel.LOW

    def _format_user_prompt(self, input_data: RiskScoringInput) -> str:
        """Format the user prompt for LLM analysis.

        Args:
            input_data: The risk scoring input data.

        Returns:
            str: Formatted prompt string.
        """
        keywords_str = ", ".join(input_data.keywords) if input_data.keywords else "None"

        return RISK_ANALYSIS_USER_PROMPT.format(
            text=input_data.text,
            emotional_intensity=input_data.emotional_intensity,
            problem_category=input_data.problem_category,
            keywords=keywords_str,
        )

    async def _call_llm_async(self, prompt: str) -> dict[str, Any]:
        """Call the LLM API asynchronously.

        Args:
            prompt: The formatted user prompt.

        Returns:
            dict: The raw LLM response.

        Raises:
            httpx.HTTPStatusError: If the API returns an error status.
            httpx.RequestError: If there's a network error.
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": RISK_ANALYSIS_SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            "temperature": self.temperature,
            "max_tokens": self.max_tokens,
            "response_format": {"type": "json_object"},
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.api_base_url}/chat/completions",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            return response.json()

    def _parse_llm_response(self, raw_response: dict[str, Any]) -> LLMRiskAnalysis:
        """Parse the LLM response into structured data.

        Args:
            raw_response: The raw response from the LLM API.

        Returns:
            LLMRiskAnalysis: Parsed and validated response.

        Raises:
            ValueError: If response parsing fails.
        """
        try:
            content = raw_response["choices"][0]["message"]["content"]
            parsed_json = json.loads(content)
            return LLMRiskAnalysis(**parsed_json)
        except (KeyError, IndexError) as e:
            logger.error("Error extracting LLM response content: %s", e)
            raise ValueError(f"Invalid LLM response structure: {e}") from e
        except json.JSONDecodeError as e:
            logger.error("Error parsing LLM response JSON: %s", e)
            raise ValueError(f"Invalid JSON in LLM response: {e}") from e

    def _create_crisis_output(
        self, input_data: RiskScoringInput, crisis_result: Any
    ) -> RiskScoringOutput:
        """Create output for detected crisis content.

        Args:
            input_data: The original input data.
            crisis_result: The crisis detection result.

        Returns:
            RiskScoringOutput: Output with blocked status.
        """
        return RiskScoringOutput(
            risk_level="blocked",
            risk_score=1.0,
            risk_factors=crisis_result.matched_patterns,
            context_flags=[
                f"crisis_category:{crisis_result.crisis_category}",
                "requires_immediate_attention",
                "do_not_engage",
            ],
            recommended_action=self.RECOMMENDED_ACTIONS["blocked"],
            raw_analysis={
                "crisis_detected": True,
                "crisis_category": crisis_result.crisis_category,
                "confidence": crisis_result.confidence,
                "matched_patterns": crisis_result.matched_patterns,
                "original_text_snippet": input_data.text[:200] + "..."
                if len(input_data.text) > 200
                else input_data.text,
            },
        )

    def _create_llm_output(
        self, input_data: RiskScoringInput, llm_analysis: LLMRiskAnalysis
    ) -> RiskScoringOutput:
        """Create output from LLM analysis.

        Args:
            input_data: The original input data.
            llm_analysis: The parsed LLM analysis.

        Returns:
            RiskScoringOutput: Output based on LLM assessment.
        """
        risk_level = self._determine_risk_level(llm_analysis.risk_score)

        return RiskScoringOutput(
            risk_level=risk_level.value,
            risk_score=llm_analysis.risk_score,
            risk_factors=llm_analysis.risk_factors,
            context_flags=llm_analysis.context_flags,
            recommended_action=self.RECOMMENDED_ACTIONS.get(
                risk_level.value,
                llm_analysis.engagement_recommendation
            ),
            raw_analysis={
                "crisis_detected": False,
                "llm_sentiment": llm_analysis.sentiment,
                "llm_recommendation": llm_analysis.engagement_recommendation,
                "emotional_intensity_input": input_data.emotional_intensity,
                "problem_category_input": input_data.problem_category,
                "model_used": self.model,
            },
        )

    def _create_fallback_output(
        self, input_data: RiskScoringInput, error: str
    ) -> RiskScoringOutput:
        """Create fallback output when LLM analysis fails.

        Uses emotional intensity and heuristics for basic risk assessment.

        Args:
            input_data: The original input data.
            error: The error message.

        Returns:
            RiskScoringOutput: Fallback output with conservative risk assessment.
        """
        # Use emotional intensity as a proxy for risk
        # High emotional intensity = higher risk assessment
        base_score = input_data.emotional_intensity

        # Add weight for potentially sensitive categories
        sensitive_categories = {
            "health_concern": 0.15,
            "financial_distress": 0.15,
            "legal_matter": 0.2,
            "relationship_crisis": 0.1,
            "employment_issue": 0.1,
        }

        category_weight = sensitive_categories.get(input_data.problem_category, 0.0)
        risk_score = min(base_score + category_weight, 0.99)  # Cap below 1.0

        risk_level = self._determine_risk_level(risk_score)

        return RiskScoringOutput(
            risk_level=risk_level.value,
            risk_score=round(risk_score, 2),
            risk_factors=[
                f"Emotional intensity: {input_data.emotional_intensity:.2f}",
                f"Problem category: {input_data.problem_category}",
                "LLM analysis unavailable - using heuristic assessment",
            ],
            context_flags=[input_data.problem_category] if input_data.problem_category else [],
            recommended_action=f"Review recommended. {self.RECOMMENDED_ACTIONS.get(risk_level.value, 'Manual review suggested.')}",
            raw_analysis={
                "crisis_detected": False,
                "fallback_mode": True,
                "error": error,
                "emotional_intensity_input": input_data.emotional_intensity,
                "problem_category_input": input_data.problem_category,
            },
        )

    async def analyze(self, input_data: RiskScoringInput) -> RiskScoringOutput:
        """Analyze content for risk assessment.

        This method performs a two-stage analysis:
        1. Fast crisis detection using pattern matching
        2. LLM-based nuanced assessment if no crisis detected

        Args:
            input_data: The input data containing text and context.

        Returns:
            RiskScoringOutput: Complete risk assessment with level, score,
                factors, context flags, and recommended action.
        """
        # Step 1: Fast crisis detection (no LLM needed)
        logger.debug("Running crisis detection for input text")
        crisis_result = self.crisis_detector.detect(input_data.text)

        if crisis_result.is_crisis:
            logger.warning(
                "Crisis content detected: category=%s, confidence=%.2f",
                crisis_result.crisis_category,
                crisis_result.confidence,
            )
            return self._create_crisis_output(input_data, crisis_result)

        # Step 2: LLM-based risk assessment for non-crisis content
        logger.debug("No crisis detected, proceeding with LLM analysis")

        try:
            prompt = self._format_user_prompt(input_data)
            raw_response = await self._call_llm_async(prompt)
            llm_analysis = self._parse_llm_response(raw_response)

            logger.debug(
                "LLM risk assessment complete: score=%.2f, sentiment=%s",
                llm_analysis.risk_score,
                llm_analysis.sentiment,
            )

            return self._create_llm_output(input_data, llm_analysis)

        except httpx.HTTPStatusError as e:
            logger.error("LLM API HTTP error: %s", e)
            return self._create_fallback_output(
                input_data, f"LLM API HTTP error: {e.response.status_code}"
            )
        except httpx.RequestError as e:
            logger.error("LLM API request error: %s", e)
            return self._create_fallback_output(
                input_data, f"LLM API request error: {str(e)}"
            )
        except ValueError as e:
            logger.error("LLM response parsing error: %s", e)
            return self._create_fallback_output(
                input_data, f"Response parsing error: {str(e)}"
            )
        except Exception as e:
            logger.error("Unexpected error during risk analysis: %s", e)
            return self._create_fallback_output(
                input_data, f"Unexpected error: {str(e)}"
            )

    def analyze_sync(self, input_data: RiskScoringInput) -> RiskScoringOutput:
        """Synchronous wrapper for risk analysis.

        Args:
            input_data: The input data containing text and context.

        Returns:
            RiskScoringOutput: Complete risk assessment.
        """
        import asyncio

        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            loop = None

        if loop is not None:
            # We're in an async context, need to handle differently
            import concurrent.futures

            with concurrent.futures.ThreadPoolExecutor() as executor:
                future = executor.submit(asyncio.run, self.analyze(input_data))
                return future.result(timeout=self.timeout + 5)
        else:
            return asyncio.run(self.analyze(input_data))

    def quick_check(self, text: str) -> bool:
        """Quick crisis check without full analysis.

        Useful for pre-filtering before more expensive operations.

        Args:
            text: The text to check.

        Returns:
            bool: True if text is safe (no crisis detected), False otherwise.
        """
        return self.crisis_detector.is_safe(text)
