"""CTS (Confidence-to-Send) Decision skill for ReachBy3Cs platform.

This skill calculates the Confidence-to-Send score based on signal detection,
risk scoring, and CTA classification results to determine whether a response
can be auto-posted or requires human review.
"""

from src.skills.cts_decision.calculator import calculate_cts, determine_auto_post_eligibility
from src.skills.cts_decision.schemas import CTSDecisionInput, CTSDecisionOutput
from src.skills.cts_decision.skill import CTSDecisionSkill

__all__ = [
    "CTSDecisionSkill",
    "CTSDecisionInput",
    "CTSDecisionOutput",
    "calculate_cts",
    "determine_auto_post_eligibility",
]
