"""Signal Detection Skill implementation using LangGraph.

This module implements the Signal Detection skill that analyzes social media posts
to detect problem categories, emotional intensity, and relevant keywords.
"""

import json
import logging
from typing import Any, TypedDict

import httpx
from langgraph.graph import END, StateGraph

from src.config import LLMProvider, get_settings
from src.skills.signal_detection.prompts import (
    SIGNAL_DETECTION_SYSTEM_PROMPT,
    VALID_PROBLEM_CATEGORIES,
    format_analysis_prompt,
)
from src.skills.signal_detection.schemas import (
    LLMAnalysisResponse,
    SignalDetectionInput,
    SignalDetectionOutput,
)

logger = logging.getLogger(__name__)


class SignalDetectionState(TypedDict):
    """State for the Signal Detection workflow.

    Attributes:
        input: The original input data.
        prompt: The formatted prompt for the LLM.
        raw_response: The raw response from the LLM.
        parsed_response: The parsed and validated response.
        output: The final output data.
        error: Any error that occurred during processing.
    """

    input: SignalDetectionInput
    prompt: str
    raw_response: dict[str, Any]
    parsed_response: LLMAnalysisResponse | None
    output: SignalDetectionOutput | None
    error: str | None


class SignalDetectionSkill:
    """Signal Detection skill for analyzing social media posts.

    This skill uses an LLM to analyze post content and extract:
    - Problem category classification
    - Emotional intensity scoring
    - Relevant keywords
    - Confidence score

    The skill is designed to work with any OpenAI-compatible LLM endpoint.
    """

    def __init__(
        self,
        api_base_url: str | None = None,
        api_key: str | None = None,
        model: str | None = None,
        timeout: float = 30.0,
    ) -> None:
        """Initialize the Signal Detection skill.

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

        # Build the LangGraph workflow
        self._workflow = self._build_workflow()

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

    def _build_workflow(self) -> StateGraph:
        """Build the LangGraph workflow for signal detection.

        Returns:
            StateGraph: The compiled workflow.
        """
        workflow = StateGraph(SignalDetectionState)

        # Add nodes
        workflow.add_node("prepare_prompt", self._prepare_prompt)
        workflow.add_node("call_llm", self._call_llm)
        workflow.add_node("parse_response", self._parse_response)
        workflow.add_node("build_output", self._build_output)
        workflow.add_node("handle_error", self._handle_error)

        # Set entry point
        workflow.set_entry_point("prepare_prompt")

        # Add edges
        workflow.add_edge("prepare_prompt", "call_llm")
        workflow.add_conditional_edges(
            "call_llm",
            self._check_llm_error,
            {
                "success": "parse_response",
                "error": "handle_error",
            },
        )
        workflow.add_conditional_edges(
            "parse_response",
            self._check_parse_error,
            {
                "success": "build_output",
                "error": "handle_error",
            },
        )
        workflow.add_edge("build_output", END)
        workflow.add_edge("handle_error", END)

        return workflow.compile()

    def _prepare_prompt(self, state: SignalDetectionState) -> dict[str, Any]:
        """Prepare the prompt for the LLM.

        Args:
            state: The current workflow state.

        Returns:
            dict: Updated state with the formatted prompt.
        """
        input_data = state["input"]
        prompt = format_analysis_prompt(
            text=input_data.text,
            platform=input_data.platform,
        )
        return {"prompt": prompt}

    async def _call_llm_async(self, prompt: str) -> dict[str, Any]:
        """Call the LLM API asynchronously.

        Args:
            prompt: The formatted prompt.

        Returns:
            dict: The raw LLM response.
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": SIGNAL_DETECTION_SYSTEM_PROMPT},
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

    def _call_llm(self, state: SignalDetectionState) -> dict[str, Any]:
        """Call the LLM synchronously (wrapper for async).

        Args:
            state: The current workflow state.

        Returns:
            dict: Updated state with the raw response or error.
        """
        import asyncio

        prompt = state["prompt"]

        try:
            # Get or create event loop
            try:
                loop = asyncio.get_running_loop()
            except RuntimeError:
                loop = None

            if loop is not None:
                # We're in an async context, need to handle differently
                import concurrent.futures

                with concurrent.futures.ThreadPoolExecutor() as executor:
                    future = executor.submit(
                        asyncio.run, self._call_llm_async(prompt)
                    )
                    raw_response = future.result(timeout=self.timeout + 5)
            else:
                raw_response = asyncio.run(self._call_llm_async(prompt))

            return {"raw_response": raw_response, "error": None}

        except httpx.HTTPStatusError as e:
            logger.error("LLM API HTTP error: %s", e)
            return {
                "raw_response": {},
                "error": f"LLM API HTTP error: {e.response.status_code}",
            }
        except httpx.RequestError as e:
            logger.error("LLM API request error: %s", e)
            return {"raw_response": {}, "error": f"LLM API request error: {str(e)}"}
        except Exception as e:
            logger.error("Unexpected error calling LLM: %s", e)
            return {"raw_response": {}, "error": f"Unexpected error: {str(e)}"}

    def _check_llm_error(self, state: SignalDetectionState) -> str:
        """Check if there was an error calling the LLM.

        Args:
            state: The current workflow state.

        Returns:
            str: "success" or "error".
        """
        return "error" if state.get("error") else "success"

    def _parse_response(self, state: SignalDetectionState) -> dict[str, Any]:
        """Parse the LLM response into structured data.

        Args:
            state: The current workflow state.

        Returns:
            dict: Updated state with parsed response or error.
        """
        raw_response = state["raw_response"]

        try:
            # Extract the content from the response
            content = raw_response["choices"][0]["message"]["content"]

            # Parse JSON from the content
            parsed_json = json.loads(content)

            # Validate with Pydantic
            parsed_response = LLMAnalysisResponse(**parsed_json)

            # Validate problem category
            if parsed_response.problem_category not in VALID_PROBLEM_CATEGORIES:
                logger.warning(
                    "Unknown problem category '%s', defaulting to 'other'",
                    parsed_response.problem_category,
                )
                parsed_response = LLMAnalysisResponse(
                    problem_category="other",
                    emotional_intensity=parsed_response.emotional_intensity,
                    keywords=parsed_response.keywords,
                    confidence=parsed_response.confidence,
                    reasoning=parsed_response.reasoning,
                )

            return {"parsed_response": parsed_response, "error": None}

        except (KeyError, IndexError) as e:
            logger.error("Error extracting LLM response content: %s", e)
            return {
                "parsed_response": None,
                "error": f"Invalid LLM response structure: {str(e)}",
            }
        except json.JSONDecodeError as e:
            logger.error("Error parsing LLM response JSON: %s", e)
            return {
                "parsed_response": None,
                "error": f"Invalid JSON in LLM response: {str(e)}",
            }
        except Exception as e:
            logger.error("Error validating LLM response: %s", e)
            return {
                "parsed_response": None,
                "error": f"Response validation error: {str(e)}",
            }

    def _check_parse_error(self, state: SignalDetectionState) -> str:
        """Check if there was an error parsing the response.

        Args:
            state: The current workflow state.

        Returns:
            str: "success" or "error".
        """
        return "error" if state.get("error") or not state.get("parsed_response") else "success"

    def _build_output(self, state: SignalDetectionState) -> dict[str, Any]:
        """Build the final output from the parsed response.

        Args:
            state: The current workflow state.

        Returns:
            dict: Updated state with the final output.
        """
        parsed = state["parsed_response"]
        raw = state["raw_response"]

        output = SignalDetectionOutput(
            problem_category=parsed.problem_category,
            emotional_intensity=parsed.emotional_intensity,
            keywords=parsed.keywords,
            confidence=parsed.confidence,
            raw_analysis={
                "model": raw.get("model", self.model),
                "reasoning": parsed.reasoning,
                "usage": raw.get("usage", {}),
                "raw_content": raw.get("choices", [{}])[0].get("message", {}).get("content", ""),
            },
        )

        return {"output": output}

    def _handle_error(self, state: SignalDetectionState) -> dict[str, Any]:
        """Handle errors by creating a fallback output.

        Args:
            state: The current workflow state.

        Returns:
            dict: Updated state with error output.
        """
        error = state.get("error", "Unknown error occurred")
        input_data = state["input"]

        # Create a fallback output with error information
        output = SignalDetectionOutput(
            problem_category="other",
            emotional_intensity=0.5,
            keywords=[],
            confidence=0.0,
            raw_analysis={
                "error": error,
                "original_text": input_data.text[:500] if input_data else "",
                "platform": input_data.platform if input_data else "",
            },
        )

        return {"output": output, "error": error}

    def run(self, input_data: SignalDetectionInput) -> SignalDetectionOutput:
        """Run the signal detection skill synchronously.

        Args:
            input_data: The input data containing text and platform.

        Returns:
            SignalDetectionOutput: The analysis results.

        Raises:
            ValueError: If input validation fails.
        """
        initial_state: SignalDetectionState = {
            "input": input_data,
            "prompt": "",
            "raw_response": {},
            "parsed_response": None,
            "output": None,
            "error": None,
        }

        result = self._workflow.invoke(initial_state)
        return result["output"]

    async def run_async(self, input_data: SignalDetectionInput) -> SignalDetectionOutput:
        """Run the signal detection skill asynchronously.

        Args:
            input_data: The input data containing text and platform.

        Returns:
            SignalDetectionOutput: The analysis results.

        Raises:
            ValueError: If input validation fails.
        """
        initial_state: SignalDetectionState = {
            "input": input_data,
            "prompt": "",
            "raw_response": {},
            "parsed_response": None,
            "output": None,
            "error": None,
        }

        result = await self._workflow.ainvoke(initial_state)
        return result["output"]
