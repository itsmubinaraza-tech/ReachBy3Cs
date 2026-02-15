"""LangGraph Engagement Pipeline Orchestrator for ReachBy3Cs Platform.

This module implements a LangGraph-based workflow that chains all engagement
skills in sequence:
1. Signal Detection - Analyze post for problem signals
2. Risk Scoring - Assess content risk level
3. Response Generation - Generate platform-appropriate responses
4. CTA Classifier - Classify CTA level of selected response
5. CTS Decision - Make final commitment-to-send decision

The pipeline handles errors gracefully at each step and supports early
termination when risk level is 'blocked'.
"""

import logging
from typing import Any, TypedDict

from langgraph.graph import END, StateGraph

from src.skills.signal_detection import (
    SignalDetectionInput,
    SignalDetectionOutput,
    SignalDetectionSkill,
)
from src.skills.risk_scoring import (
    RiskScoringInput,
    RiskScoringOutput,
    RiskScoringSkill,
)
from src.skills.response_generation import (
    ResponseGenerationInput,
    ResponseGenerationOutput,
    ResponseGenerationSkill,
    TenantContext,
)
from src.skills.cta_classifier import (
    CTAClassifierInput,
    CTAClassifierOutput,
    CTAClassifierSkill,
)
from src.skills.cts_decision import (
    CTSDecisionInput,
    CTSDecisionOutput as CTSSkillOutput,
    CTSDecisionSkill,
)

logger = logging.getLogger(__name__)


class PipelineState(TypedDict):
    """State for the Engagement Pipeline workflow.

    Attributes:
        text: The original post content to analyze.
        platform: Social media platform (reddit, twitter, quora).
        tenant_context: Business context for response generation.
        signal: Output from Signal Detection skill.
        risk: Output from Risk Scoring skill.
        responses: Output from Response Generation skill.
        cta: Output from CTA Classifier skill.
        cts: Output from CTS Decision skill.
        error: Any error that occurred during processing.
        blocked: Whether the pipeline was stopped due to blocked content.
    """

    # Inputs
    text: str
    platform: str
    tenant_context: dict[str, Any]

    # Skill outputs (populated as pipeline runs)
    signal: dict[str, Any] | None
    risk: dict[str, Any] | None
    responses: dict[str, Any] | None
    cta: dict[str, Any] | None
    cts: dict[str, Any] | None

    # Control flags
    error: str | None
    blocked: bool


class CTSDecisionOutput(TypedDict):
    """Output from the CTS (Commitment-to-Send) Decision skill.

    Attributes:
        cts_score: Confidence score for auto-posting (0.0-1.0).
        can_auto_post: Whether the response can be auto-posted.
        requires_review: Whether manual review is required.
        decision_factors: Factors that influenced the decision.
        recommended_action: Recommended action to take.
    """

    cts_score: float
    can_auto_post: bool
    requires_review: bool
    decision_factors: list[str]
    recommended_action: str


class EngagementPipeline:
    """LangGraph-based engagement pipeline orchestrator.

    This class creates and manages a LangGraph workflow that chains
    all engagement skills together in sequence, handling data flow
    and error conditions.

    The pipeline flow is:
    Signal Detection -> Risk Scoring -> Response Generation -> CTA Classifier -> CTS Decision

    If risk_level is 'blocked', the pipeline terminates early after Risk Scoring.
    """

    def __init__(
        self,
        signal_skill: SignalDetectionSkill | None = None,
        risk_skill: RiskScoringSkill | None = None,
        response_skill: ResponseGenerationSkill | None = None,
        cta_skill: CTAClassifierSkill | None = None,
        cts_skill: CTSDecisionSkill | None = None,
    ) -> None:
        """Initialize the Engagement Pipeline.

        Args:
            signal_skill: Optional pre-configured Signal Detection skill.
            risk_skill: Optional pre-configured Risk Scoring skill.
            response_skill: Optional pre-configured Response Generation skill.
            cta_skill: Optional pre-configured CTA Classifier skill.
            cts_skill: Optional pre-configured CTS Decision skill.
        """
        # Initialize skills (use provided or create new instances)
        self.signal_skill = signal_skill or SignalDetectionSkill()
        self.risk_skill = risk_skill or RiskScoringSkill()
        self.response_skill = response_skill or ResponseGenerationSkill()
        self.cta_skill = cta_skill or CTAClassifierSkill()
        self.cts_skill = cts_skill or CTSDecisionSkill()

        # Build the workflow
        self._workflow = self._build_workflow()

    def _build_workflow(self) -> StateGraph:
        """Build the LangGraph workflow for the engagement pipeline.

        Returns:
            StateGraph: The compiled workflow.
        """
        workflow = StateGraph(PipelineState)

        # Add nodes for each skill
        workflow.add_node("signal_detection", self._run_signal_detection)
        workflow.add_node("risk_scoring", self._run_risk_scoring)
        workflow.add_node("response_generation", self._run_response_generation)
        workflow.add_node("cta_classifier", self._run_cta_classifier)
        workflow.add_node("cts_decision", self._run_cts_decision)
        workflow.add_node("handle_blocked", self._handle_blocked)

        # Set entry point
        workflow.set_entry_point("signal_detection")

        # Define edges
        workflow.add_conditional_edges(
            "signal_detection",
            self._check_signal_error,
            {
                "success": "risk_scoring",
                "error": END,
            },
        )

        workflow.add_conditional_edges(
            "risk_scoring",
            self._check_risk_result,
            {
                "continue": "response_generation",
                "blocked": "handle_blocked",
                "error": END,
            },
        )

        workflow.add_conditional_edges(
            "response_generation",
            self._check_response_error,
            {
                "success": "cta_classifier",
                "error": END,
            },
        )

        workflow.add_conditional_edges(
            "cta_classifier",
            self._check_cta_error,
            {
                "success": "cts_decision",
                "error": END,
            },
        )

        workflow.add_edge("cts_decision", END)
        workflow.add_edge("handle_blocked", END)

        return workflow.compile()

    def _run_signal_detection(self, state: PipelineState) -> dict[str, Any]:
        """Run the Signal Detection skill.

        Args:
            state: Current pipeline state.

        Returns:
            dict: Updated state with signal output.
        """
        logger.info("Running Signal Detection...")

        try:
            input_data = SignalDetectionInput(
                text=state["text"],
                platform=state["platform"],
            )

            output: SignalDetectionOutput = self.signal_skill.run(input_data)

            logger.info(
                "Signal Detection complete: category=%s, intensity=%.2f",
                output.problem_category,
                output.emotional_intensity,
            )

            return {
                "signal": {
                    "problem_category": output.problem_category,
                    "emotional_intensity": output.emotional_intensity,
                    "keywords": output.keywords,
                    "confidence": output.confidence,
                    "raw_analysis": output.raw_analysis,
                },
                "error": None,
            }

        except Exception as e:
            logger.error("Signal Detection failed: %s", e)
            return {
                "signal": None,
                "error": f"Signal Detection error: {str(e)}",
            }

    def _check_signal_error(self, state: PipelineState) -> str:
        """Check if Signal Detection succeeded."""
        if state.get("error") or state.get("signal") is None:
            return "error"
        return "success"

    def _run_risk_scoring(self, state: PipelineState) -> dict[str, Any]:
        """Run the Risk Scoring skill.

        Args:
            state: Current pipeline state.

        Returns:
            dict: Updated state with risk output.
        """
        logger.info("Running Risk Scoring...")

        try:
            signal = state["signal"]

            input_data = RiskScoringInput(
                text=state["text"],
                emotional_intensity=signal["emotional_intensity"],
                problem_category=signal["problem_category"],
                keywords=signal.get("keywords", []),
            )

            output: RiskScoringOutput = self.risk_skill.analyze_sync(input_data)

            logger.info(
                "Risk Scoring complete: level=%s, score=%.2f",
                output.risk_level,
                output.risk_score,
            )

            return {
                "risk": {
                    "risk_level": output.risk_level,
                    "risk_score": output.risk_score,
                    "risk_factors": output.risk_factors,
                    "context_flags": output.context_flags,
                    "recommended_action": output.recommended_action,
                    "raw_analysis": output.raw_analysis,
                },
                "blocked": output.risk_level == "blocked",
                "error": None,
            }

        except Exception as e:
            logger.error("Risk Scoring failed: %s", e)
            return {
                "risk": None,
                "error": f"Risk Scoring error: {str(e)}",
            }

    def _check_risk_result(self, state: PipelineState) -> str:
        """Check Risk Scoring result and determine next step."""
        if state.get("error"):
            return "error"

        risk = state.get("risk")
        if risk is None:
            return "error"

        if risk.get("risk_level") == "blocked":
            return "blocked"

        return "continue"

    def _handle_blocked(self, state: PipelineState) -> dict[str, Any]:
        """Handle blocked content - pipeline ends early.

        Args:
            state: Current pipeline state.

        Returns:
            dict: Updated state with blocked status.
        """
        logger.warning("Content blocked - pipeline terminated early")

        return {
            "responses": None,
            "cta": None,
            "cts": {
                "cts_score": 0.0,
                "can_auto_post": False,
                "requires_review": False,
                "decision_factors": ["Content blocked due to crisis indicators"],
                "recommended_action": "Do not engage - route to crisis protocol",
            },
            "blocked": True,
        }

    def _run_response_generation(self, state: PipelineState) -> dict[str, Any]:
        """Run the Response Generation skill.

        Args:
            state: Current pipeline state.

        Returns:
            dict: Updated state with responses output.
        """
        logger.info("Running Response Generation...")

        try:
            signal = state["signal"]
            risk = state["risk"]
            tenant_dict = state["tenant_context"]

            # Build TenantContext from dict
            tenant = TenantContext(
                app_name=tenant_dict.get("app_name", "App"),
                value_prop=tenant_dict.get("value_prop", ""),
                target_audience=tenant_dict.get("target_audience", ""),
                key_benefits=tenant_dict.get("key_benefits", []),
                website_url=tenant_dict.get("website_url", ""),
            )

            # Map risk level for response generation
            # blocked -> high, high -> high, medium -> medium, low -> low
            risk_level = risk["risk_level"]
            if risk_level == "blocked":
                risk_level = "high"

            input_data = ResponseGenerationInput(
                text=state["text"],
                problem_category=signal["problem_category"],
                risk_level=risk_level,
                platform=state["platform"],
                tenant_context=tenant,
            )

            output: ResponseGenerationOutput = self.response_skill.run(input_data)

            logger.info(
                "Response Generation complete: selected_type=%s",
                output.selected_type,
            )

            return {
                "responses": {
                    "value_first_response": output.value_first_response,
                    "soft_cta_response": output.soft_cta_response,
                    "contextual_response": output.contextual_response,
                    "selected_response": output.selected_response,
                    "selected_type": output.selected_type,
                    "raw_analysis": output.raw_analysis,
                },
                "error": None,
            }

        except Exception as e:
            logger.error("Response Generation failed: %s", e)
            return {
                "responses": None,
                "error": f"Response Generation error: {str(e)}",
            }

    def _check_response_error(self, state: PipelineState) -> str:
        """Check if Response Generation succeeded."""
        if state.get("error") or state.get("responses") is None:
            return "error"
        return "success"

    def _run_cta_classifier(self, state: PipelineState) -> dict[str, Any]:
        """Run the CTA Classifier skill.

        Args:
            state: Current pipeline state.

        Returns:
            dict: Updated state with CTA output.
        """
        logger.info("Running CTA Classifier...")

        try:
            responses = state["responses"]

            input_data = CTAClassifierInput(
                response_text=responses["selected_response"],
            )

            output: CTAClassifierOutput = self.cta_skill.classify_sync(input_data)

            logger.info(
                "CTA Classifier complete: level=%d, type=%s",
                output.cta_level,
                output.cta_type,
            )

            return {
                "cta": {
                    "cta_level": output.cta_level,
                    "cta_type": output.cta_type,
                    "cta_analysis": output.cta_analysis.model_dump()
                    if output.cta_analysis
                    else {},
                },
                "error": None,
            }

        except Exception as e:
            logger.error("CTA Classifier failed: %s", e)
            return {
                "cta": None,
                "error": f"CTA Classifier error: {str(e)}",
            }

    def _check_cta_error(self, state: PipelineState) -> str:
        """Check if CTA Classifier succeeded."""
        if state.get("error") or state.get("cta") is None:
            return "error"
        return "success"

    def _run_cts_decision(self, state: PipelineState) -> dict[str, Any]:
        """Run the CTS (Commitment-to-Send) Decision skill.

        This uses the CTSDecisionSkill to determine whether the response
        can be auto-posted or requires manual review based on all previous outputs.

        Args:
            state: Current pipeline state.

        Returns:
            dict: Updated state with CTS decision.
        """
        logger.info("Running CTS Decision...")

        try:
            risk = state["risk"]
            cta = state["cta"]
            signal = state["signal"]

            # Build CTS Decision input
            input_data = CTSDecisionInput(
                signal_confidence=signal.get("confidence", 0.8),
                risk_level=risk["risk_level"],
                risk_score=risk["risk_score"],
                cta_level=cta["cta_level"],
                emotional_intensity=signal["emotional_intensity"],
            )

            # Run the CTS Decision skill
            output: CTSSkillOutput = self.cts_skill.run(input_data)

            # Determine if review is required based on output
            requires_review = not output.can_auto_post

            # Generate decision factors from breakdown
            decision_factors = []
            if output.cts_breakdown:
                breakdown = output.cts_breakdown
                if isinstance(breakdown, dict):
                    decision_factors.append(
                        f"Signal component: {breakdown.get('signal_component', 0):.2f}"
                    )
                    decision_factors.append(
                        f"Risk component: {breakdown.get('risk_component', 0):.2f}"
                    )
                    decision_factors.append(
                        f"CTA component: {breakdown.get('cta_component', 0):.2f}"
                    )

            # Add the auto-post reason to factors
            if output.auto_post_reason:
                decision_factors.append(output.auto_post_reason)

            # Determine recommended action
            if output.can_auto_post:
                recommended_action = "Safe for auto-posting"
            elif risk["risk_level"] == "high":
                recommended_action = "Requires senior review before posting"
            else:
                recommended_action = "Queue for team review"

            logger.info(
                "CTS Decision complete: score=%.2f, can_auto_post=%s",
                output.cts_score,
                output.can_auto_post,
            )

            return {
                "cts": {
                    "cts_score": round(output.cts_score, 2),
                    "can_auto_post": output.can_auto_post,
                    "requires_review": requires_review,
                    "decision_factors": decision_factors,
                    "recommended_action": recommended_action,
                },
                "error": None,
            }

        except Exception as e:
            logger.error("CTS Decision failed: %s", e)
            return {
                "cts": {
                    "cts_score": 0.0,
                    "can_auto_post": False,
                    "requires_review": True,
                    "decision_factors": [f"Error during decision: {str(e)}"],
                    "recommended_action": "Manual review required due to processing error",
                },
                "error": f"CTS Decision error: {str(e)}",
            }

    def run(
        self,
        text: str,
        platform: str,
        tenant_context: dict[str, Any],
    ) -> dict[str, Any]:
        """Run the engagement pipeline synchronously.

        Args:
            text: The post content to analyze.
            platform: Social media platform (reddit, twitter, quora).
            tenant_context: Business context for response generation.

        Returns:
            dict: Combined results from all pipeline skills.
        """
        logger.info("Starting Engagement Pipeline for platform=%s", platform)

        initial_state: PipelineState = {
            "text": text,
            "platform": platform,
            "tenant_context": tenant_context,
            "signal": None,
            "risk": None,
            "responses": None,
            "cta": None,
            "cts": None,
            "error": None,
            "blocked": False,
        }

        result = self._workflow.invoke(initial_state)

        # Build response
        response = {
            "signal": result.get("signal"),
            "risk": result.get("risk"),
            "responses": result.get("responses"),
            "cta": result.get("cta"),
            "cts": result.get("cts"),
            "error": result.get("error"),
            "blocked": result.get("blocked", False),
        }

        if result.get("error"):
            logger.error("Pipeline completed with error: %s", result["error"])
        else:
            logger.info("Pipeline completed successfully")

        return response

    async def run_async(
        self,
        text: str,
        platform: str,
        tenant_context: dict[str, Any],
    ) -> dict[str, Any]:
        """Run the engagement pipeline asynchronously.

        Args:
            text: The post content to analyze.
            platform: Social media platform (reddit, twitter, quora).
            tenant_context: Business context for response generation.

        Returns:
            dict: Combined results from all pipeline skills.
        """
        logger.info("Starting Engagement Pipeline (async) for platform=%s", platform)

        initial_state: PipelineState = {
            "text": text,
            "platform": platform,
            "tenant_context": tenant_context,
            "signal": None,
            "risk": None,
            "responses": None,
            "cta": None,
            "cts": None,
            "error": None,
            "blocked": False,
        }

        result = await self._workflow.ainvoke(initial_state)

        # Build response
        response = {
            "signal": result.get("signal"),
            "risk": result.get("risk"),
            "responses": result.get("responses"),
            "cta": result.get("cta"),
            "cts": result.get("cts"),
            "error": result.get("error"),
            "blocked": result.get("blocked", False),
        }

        if result.get("error"):
            logger.error("Pipeline completed with error: %s", result["error"])
        else:
            logger.info("Pipeline completed successfully")

        return response


def create_engagement_pipeline(
    signal_skill: SignalDetectionSkill | None = None,
    risk_skill: RiskScoringSkill | None = None,
    response_skill: ResponseGenerationSkill | None = None,
    cta_skill: CTAClassifierSkill | None = None,
    cts_skill: CTSDecisionSkill | None = None,
) -> EngagementPipeline:
    """Factory function to create an EngagementPipeline instance.

    Args:
        signal_skill: Optional pre-configured Signal Detection skill.
        risk_skill: Optional pre-configured Risk Scoring skill.
        response_skill: Optional pre-configured Response Generation skill.
        cta_skill: Optional pre-configured CTA Classifier skill.
        cts_skill: Optional pre-configured CTS Decision skill.

    Returns:
        EngagementPipeline: Configured pipeline instance.
    """
    return EngagementPipeline(
        signal_skill=signal_skill,
        risk_skill=risk_skill,
        response_skill=response_skill,
        cta_skill=cta_skill,
        cts_skill=cts_skill,
    )
