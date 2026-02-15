"""CTS (Confidence-to-Send) Decision Skill implementation.

This module implements the CTS Decision skill that calculates the
Confidence-to-Send score and determines auto-post eligibility based
on inputs from Signal Detection, Risk Scoring, and CTA Classifier.

This is a pure calculation skill - no LLM is required.
"""

import logging
from typing import Any

from src.skills.cts_decision.calculator import (
    calculate_cts,
    determine_auto_post_eligibility,
)
from src.skills.cts_decision.schemas import (
    CTSBreakdown,
    CTSDecisionInput,
    CTSDecisionOutput,
)

logger = logging.getLogger(__name__)


class CTSDecisionSkill:
    """CTS Decision skill for calculating Confidence-to-Send scores.

    This skill combines outputs from Signal Detection, Risk Scoring, and
    CTA Classifier to produce a unified CTS score and auto-post decision.

    The skill is purely computational - no LLM calls are made.
    """

    def __init__(self) -> None:
        """Initialize the CTS Decision skill.

        No configuration is required as this is a pure calculation skill.
        """
        logger.debug("CTSDecisionSkill initialized")

    def run(self, input_data: CTSDecisionInput) -> CTSDecisionOutput:
        """Run the CTS decision calculation synchronously.

        Args:
            input_data: The input data containing signal confidence,
                       risk level, risk score, CTA level, and emotional intensity.

        Returns:
            CTSDecisionOutput: The CTS score and auto-post decision.

        Raises:
            ValueError: If input validation fails.
        """
        logger.debug(
            "Running CTS decision with inputs: signal_confidence=%.2f, "
            "risk_level=%s, risk_score=%.2f, cta_level=%d, emotional_intensity=%.2f",
            input_data.signal_confidence,
            input_data.risk_level,
            input_data.risk_score,
            input_data.cta_level,
            input_data.emotional_intensity,
        )

        # Calculate CTS score
        cts_score, breakdown = calculate_cts(
            signal_confidence=input_data.signal_confidence,
            risk_score=input_data.risk_score,
            cta_level=input_data.cta_level,
        )

        # Determine auto-post eligibility
        can_auto_post, auto_post_reason = determine_auto_post_eligibility(
            cts_score=cts_score,
            risk_level=input_data.risk_level,
            cta_level=input_data.cta_level,
        )

        logger.info(
            "CTS decision complete: score=%.2f, can_auto_post=%s",
            cts_score,
            can_auto_post,
        )

        # Build output
        output = CTSDecisionOutput(
            cts_score=cts_score,
            can_auto_post=can_auto_post,
            auto_post_reason=auto_post_reason,
            cts_breakdown=breakdown,
        )

        return output

    async def run_async(self, input_data: CTSDecisionInput) -> CTSDecisionOutput:
        """Run the CTS decision calculation asynchronously.

        Since this is a pure calculation skill with no I/O operations,
        the async version simply delegates to the synchronous version.

        Args:
            input_data: The input data containing signal confidence,
                       risk level, risk score, CTA level, and emotional intensity.

        Returns:
            CTSDecisionOutput: The CTS score and auto-post decision.

        Raises:
            ValueError: If input validation fails.
        """
        return self.run(input_data)

    def calculate_from_dict(self, data: dict[str, Any]) -> CTSDecisionOutput:
        """Calculate CTS decision from a dictionary input.

        Convenience method that accepts a dictionary and validates it
        against the input schema before processing.

        Args:
            data: Dictionary containing the input fields.

        Returns:
            CTSDecisionOutput: The CTS score and auto-post decision.

        Raises:
            ValidationError: If the dictionary doesn't match the input schema.
        """
        input_data = CTSDecisionInput(**data)
        return self.run(input_data)
