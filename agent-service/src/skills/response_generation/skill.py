"""Response Generation Skill implementation using LangGraph.

This module implements the Response Generation skill that creates platform-appropriate
engagement responses with varying CTA levels based on risk assessment and tenant context.
"""

import json
import logging
from typing import Any, TypedDict

import httpx
from langgraph.graph import END, StateGraph

from src.config import LLMProvider, get_settings
from src.skills.response_generation.prompts import (
    PLATFORM_GUIDELINES,
    RESPONSE_GENERATION_PROMPT,
    SYSTEM_PROMPT,
)
from src.skills.response_generation.schemas import (
    LLMResponseAnalysis,
    Platform,
    ResponseGenerationInput,
    ResponseGenerationOutput,
    ResponseType,
    RiskLevel,
)
from src.skills.response_generation.tone_adapter import ToneAdapter

logger = logging.getLogger(__name__)


class ResponseGenerationState(TypedDict):
    """State for the Response Generation workflow.

    Attributes:
        input: The original input data.
        prompt: The formatted prompt for the LLM.
        raw_response: The raw response from the LLM.
        parsed_response: The parsed and validated response.
        adapted_responses: Platform-adapted responses.
        output: The final output data.
        error: Any error that occurred during processing.
    """

    input: ResponseGenerationInput
    prompt: str
    raw_response: dict[str, Any]
    parsed_response: LLMResponseAnalysis | None
    adapted_responses: dict[str, str]
    output: ResponseGenerationOutput | None
    error: str | None


class ResponseGenerationSkill:
    """Response Generation skill for creating engagement responses.

    This skill generates three types of responses with varying CTA levels:
    - value_first (CTA level 0): Pure helpful advice, NO product mention
    - soft_cta (CTA level 1): Helpful with subtle "tools can help" mention
    - contextual (CTA level 2): Context-aware with natural product integration

    The skill selects the appropriate response based on the risk level:
    - low risk: Can use any response type (default: contextual)
    - medium risk: Prefer value_first or soft_cta (default: soft_cta)
    - high risk: Only value_first (no CTA)
    """

    def __init__(
        self,
        api_base_url: str | None = None,
        api_key: str | None = None,
        model: str | None = None,
        timeout: float = 45.0,
    ) -> None:
        """Initialize the Response Generation skill.

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

        # Initialize tone adapter for platform-specific adjustments
        self.tone_adapter = ToneAdapter()

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
        """Build the LangGraph workflow for response generation.

        Returns:
            StateGraph: The compiled workflow.
        """
        workflow = StateGraph(ResponseGenerationState)

        # Add nodes
        workflow.add_node("prepare_prompt", self._prepare_prompt)
        workflow.add_node("call_llm", self._call_llm)
        workflow.add_node("parse_response", self._parse_response)
        workflow.add_node("adapt_tone", self._adapt_tone)
        workflow.add_node("select_response", self._select_response)
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
                "success": "adapt_tone",
                "error": "handle_error",
            },
        )
        workflow.add_edge("adapt_tone", "select_response")
        workflow.add_edge("select_response", END)
        workflow.add_edge("handle_error", END)

        return workflow.compile()

    def _prepare_prompt(self, state: ResponseGenerationState) -> dict[str, Any]:
        """Prepare the prompt for the LLM.

        Args:
            state: The current workflow state.

        Returns:
            dict: Updated state with the formatted prompt.
        """
        input_data = state["input"]
        tenant = input_data.tenant_context

        # Format key benefits as a readable list
        key_benefits_str = ", ".join(tenant.key_benefits) if tenant.key_benefits else "N/A"

        # Get platform-specific guidelines
        platform_guidelines = PLATFORM_GUIDELINES.get(
            input_data.platform,
            "Follow general best practices for social media engagement."
        )

        # Format the prompt
        prompt = RESPONSE_GENERATION_PROMPT.format(
            platform=input_data.platform,
            problem_category=input_data.problem_category,
            text=input_data.text,
            app_name=tenant.app_name,
            value_prop=tenant.value_prop,
            target_audience=tenant.target_audience or "General audience",
            key_benefits=key_benefits_str,
            platform_guidelines=platform_guidelines,
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
                {"role": "system", "content": SYSTEM_PROMPT},
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

    def _call_llm(self, state: ResponseGenerationState) -> dict[str, Any]:
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

    def _check_llm_error(self, state: ResponseGenerationState) -> str:
        """Check if there was an error calling the LLM.

        Args:
            state: The current workflow state.

        Returns:
            str: "success" or "error".
        """
        return "error" if state.get("error") else "success"

    def _parse_response(self, state: ResponseGenerationState) -> dict[str, Any]:
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
            parsed_response = LLMResponseAnalysis(**parsed_json)

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

    def _check_parse_error(self, state: ResponseGenerationState) -> str:
        """Check if there was an error parsing the response.

        Args:
            state: The current workflow state.

        Returns:
            str: "success" or "error".
        """
        return "error" if state.get("error") or not state.get("parsed_response") else "success"

    def _adapt_tone(self, state: ResponseGenerationState) -> dict[str, Any]:
        """Adapt response tones for the target platform.

        Args:
            state: The current workflow state.

        Returns:
            dict: Updated state with adapted responses.
        """
        parsed = state["parsed_response"]
        platform = state["input"].platform

        adapted_responses = {
            "value_first": self.tone_adapter.adapt(
                parsed.value_first_response, platform
            ),
            "soft_cta": self.tone_adapter.adapt(
                parsed.soft_cta_response, platform
            ),
            "contextual": self.tone_adapter.adapt(
                parsed.contextual_response, platform
            ),
        }

        return {"adapted_responses": adapted_responses}

    def _select_response(self, state: ResponseGenerationState) -> dict[str, Any]:
        """Select the appropriate response based on risk level.

        Selection logic:
        - low risk: Can use any response type (default: contextual)
        - medium risk: Prefer value_first or soft_cta (default: soft_cta)
        - high risk: Only value_first (no CTA)

        Args:
            state: The current workflow state.

        Returns:
            dict: Updated state with the final output.
        """
        parsed = state["parsed_response"]
        adapted = state["adapted_responses"]
        input_data = state["input"]
        raw = state["raw_response"]
        risk_level = input_data.risk_level

        # Select response based on risk level
        selected_type: ResponseType
        selected_response: str

        if risk_level == "high":
            # High risk: Only value_first (no CTA at all)
            selected_type = "value_first"
            selected_response = adapted["value_first"]
        elif risk_level == "medium":
            # Medium risk: Prefer soft_cta (gentle mention of tools)
            selected_type = "soft_cta"
            selected_response = adapted["soft_cta"]
        else:
            # Low risk: Can use contextual (natural product integration)
            selected_type = "contextual"
            selected_response = adapted["contextual"]

        # Build the output
        output = ResponseGenerationOutput(
            value_first_response=adapted["value_first"],
            soft_cta_response=adapted["soft_cta"],
            contextual_response=adapted["contextual"],
            selected_response=selected_response,
            selected_type=selected_type,
            raw_analysis={
                "model": raw.get("model", self.model),
                "problem_understanding": parsed.problem_understanding,
                "emotional_tone": parsed.emotional_tone,
                "key_pain_points": parsed.key_pain_points,
                "response_strategy": parsed.response_strategy,
                "usage": raw.get("usage", {}),
                "risk_level": risk_level,
                "platform": input_data.platform,
            },
        )

        return {"output": output}

    def _handle_error(self, state: ResponseGenerationState) -> dict[str, Any]:
        """Handle errors by creating a fallback output.

        Args:
            state: The current workflow state.

        Returns:
            dict: Updated state with error output.
        """
        error = state.get("error", "Unknown error occurred")
        input_data = state["input"]

        # Generate fallback responses based on platform
        fallback_responses = self._generate_fallback_responses(input_data)

        # Select based on risk level (always safe choice for errors)
        selected_response = fallback_responses["value_first"]
        selected_type: ResponseType = "value_first"

        output = ResponseGenerationOutput(
            value_first_response=fallback_responses["value_first"],
            soft_cta_response=fallback_responses["soft_cta"],
            contextual_response=fallback_responses["contextual"],
            selected_response=selected_response,
            selected_type=selected_type,
            raw_analysis={
                "error": error,
                "original_text": input_data.text[:500] if input_data else "",
                "platform": input_data.platform if input_data else "",
                "fallback_used": True,
            },
        )

        return {"output": output, "error": error}

    def _generate_fallback_responses(
        self, input_data: ResponseGenerationInput
    ) -> dict[str, str]:
        """Generate fallback responses when LLM fails.

        Args:
            input_data: The original input data.

        Returns:
            dict: Dictionary of fallback responses by type.
        """
        platform = input_data.platform
        problem_category = input_data.problem_category

        # Generic fallback templates
        fallback_templates = {
            "value_first": {
                "reddit": (
                    "That's a common challenge many of us face. "
                    "What's worked for others in similar situations is taking "
                    "it step by step and finding what specifically triggers "
                    "the issue for you. Have you noticed any patterns?"
                ),
                "twitter": (
                    "This is something a lot of people struggle with. "
                    "Taking it step by step usually helps. What's your main blocker?"
                ),
                "quora": (
                    "This is a question many people face. Based on common experiences, "
                    "the most effective approach is to break down the problem into "
                    "smaller, manageable parts and address each one systematically."
                ),
            },
            "soft_cta": {
                "reddit": (
                    "Totally get this. It's something a lot of people struggle with. "
                    "Taking it step by step helps, and there are also some tools out "
                    "there that can make tracking progress easier."
                ),
                "twitter": (
                    "Many people face this! Breaking it down helps, "
                    "and there are tools that can make it easier."
                ),
                "quora": (
                    "This is a common challenge. The most effective approach involves "
                    "systematic problem-solving, and there are various tools and "
                    "applications specifically designed to help with this."
                ),
            },
            "contextual": {
                "reddit": (
                    "Been there! It took me a while to figure out what worked. "
                    "Breaking things down into smaller pieces helped a lot, "
                    "and finding the right tools made tracking progress so much easier."
                ),
                "twitter": (
                    "Totally been there! Finding the right approach + tools made "
                    "all the difference for me."
                ),
                "quora": (
                    "This is a challenge I've encountered myself. In my experience, "
                    "combining a structured approach with the right tools has been "
                    "particularly effective for managing this type of situation."
                ),
            },
        }

        return {
            "value_first": fallback_templates["value_first"].get(
                platform, fallback_templates["value_first"]["reddit"]
            ),
            "soft_cta": fallback_templates["soft_cta"].get(
                platform, fallback_templates["soft_cta"]["reddit"]
            ),
            "contextual": fallback_templates["contextual"].get(
                platform, fallback_templates["contextual"]["reddit"]
            ),
        }

    def run(self, input_data: ResponseGenerationInput) -> ResponseGenerationOutput:
        """Run the response generation skill synchronously.

        Args:
            input_data: The input data containing post text, risk level, platform, etc.

        Returns:
            ResponseGenerationOutput: The generated responses.

        Raises:
            ValueError: If input validation fails.
        """
        initial_state: ResponseGenerationState = {
            "input": input_data,
            "prompt": "",
            "raw_response": {},
            "parsed_response": None,
            "adapted_responses": {},
            "output": None,
            "error": None,
        }

        result = self._workflow.invoke(initial_state)
        return result["output"]

    async def run_async(
        self, input_data: ResponseGenerationInput
    ) -> ResponseGenerationOutput:
        """Run the response generation skill asynchronously.

        Args:
            input_data: The input data containing post text, risk level, platform, etc.

        Returns:
            ResponseGenerationOutput: The generated responses.

        Raises:
            ValueError: If input validation fails.
        """
        initial_state: ResponseGenerationState = {
            "input": input_data,
            "prompt": "",
            "raw_response": {},
            "parsed_response": None,
            "adapted_responses": {},
            "output": None,
            "error": None,
        }

        result = await self._workflow.ainvoke(initial_state)
        return result["output"]

    def get_allowed_response_types(self, risk_level: RiskLevel) -> list[ResponseType]:
        """Get the allowed response types for a given risk level.

        Args:
            risk_level: The risk level (low, medium, high).

        Returns:
            list[ResponseType]: List of allowed response types.
        """
        allowed_types: dict[RiskLevel, list[ResponseType]] = {
            "low": ["value_first", "soft_cta", "contextual"],
            "medium": ["value_first", "soft_cta"],
            "high": ["value_first"],
        }
        return allowed_types.get(risk_level, ["value_first"])

    def select_best_response(
        self,
        output: ResponseGenerationOutput,
        risk_level: RiskLevel,
        preferred_type: ResponseType | None = None,
    ) -> tuple[str, ResponseType]:
        """Select the best response from generated options.

        This allows manual override of the automatic selection while
        respecting risk level constraints.

        Args:
            output: The generated output with all response variants.
            risk_level: The risk level for the post.
            preferred_type: Optional preferred response type.

        Returns:
            Tuple of (selected_response, response_type).
        """
        allowed = self.get_allowed_response_types(risk_level)

        # If preferred type is allowed, use it
        if preferred_type and preferred_type in allowed:
            response_map = {
                "value_first": output.value_first_response,
                "soft_cta": output.soft_cta_response,
                "contextual": output.contextual_response,
            }
            return response_map[preferred_type], preferred_type

        # Otherwise use the default selection
        return output.selected_response, output.selected_type
