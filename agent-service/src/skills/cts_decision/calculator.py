"""CTS (Confidence-to-Send) calculation logic.

This module contains the core calculation functions for determining
the Confidence-to-Send score and auto-post eligibility.
"""

from typing import Literal

# CTS Formula Weights
SIGNAL_WEIGHT = 0.4
RISK_WEIGHT = 0.3
CTA_WEIGHT = 0.3

# Auto-post thresholds
CTS_AUTO_POST_THRESHOLD = 0.7
MAX_CTA_LEVEL_FOR_AUTO_POST = 1


def calculate_cts(
    signal_confidence: float,
    risk_score: float,
    cta_level: int,
) -> tuple[float, dict[str, float]]:
    """Calculate the Confidence-to-Send (CTS) score.

    The CTS score is a weighted combination of three components:
    - Signal confidence (40%): Higher confidence = higher CTS
    - Risk score inverse (30%): Lower risk = higher CTS
    - CTA level inverse (30%): Lower CTA = higher CTS

    Args:
        signal_confidence: Confidence score from Signal Detection (0.0-1.0).
        risk_score: Risk score from Risk Scoring (0.0-1.0).
        cta_level: CTA level from CTA Classifier (0-3).

    Returns:
        tuple: A tuple containing:
            - cts_score (float): The calculated CTS score (0.0-1.0).
            - breakdown (dict): Component-wise breakdown of the score.

    Raises:
        ValueError: If input values are out of expected ranges.
    """
    # Validate inputs
    if not 0.0 <= signal_confidence <= 1.0:
        raise ValueError(f"signal_confidence must be between 0.0 and 1.0, got {signal_confidence}")
    if not 0.0 <= risk_score <= 1.0:
        raise ValueError(f"risk_score must be between 0.0 and 1.0, got {risk_score}")
    if not 0 <= cta_level <= 3:
        raise ValueError(f"cta_level must be between 0 and 3, got {cta_level}")

    # Calculate components
    signal_component = signal_confidence * SIGNAL_WEIGHT
    risk_component = (1 - risk_score) * RISK_WEIGHT  # Inverse of risk
    cta_component = (1 - (cta_level / 3)) * CTA_WEIGHT  # Lower CTA = higher score

    # Calculate total CTS score
    cts_score = signal_component + risk_component + cta_component

    # Build breakdown dictionary
    breakdown = {
        "signal_component": round(signal_component, 4),
        "risk_component": round(risk_component, 4),
        "cta_component": round(cta_component, 4),
    }

    return round(cts_score, 4), breakdown


def determine_auto_post_eligibility(
    cts_score: float,
    risk_level: Literal["low", "medium", "high", "blocked"],
    cta_level: int,
) -> tuple[bool, str]:
    """Determine if a response can be automatically posted.

    Auto-post eligibility requires all of the following:
    - CTS score >= 0.7
    - Risk level is 'low'
    - CTA level is <= 1 (none or soft)

    Args:
        cts_score: The calculated CTS score (0.0-1.0).
        risk_level: Risk level from Risk Scoring.
        cta_level: CTA level from CTA Classifier (0-3).

    Returns:
        tuple: A tuple containing:
            - can_auto_post (bool): Whether auto-posting is allowed.
            - reason (str): Explanation for the decision.
    """
    reasons_against: list[str] = []

    # Check CTS score threshold
    if cts_score < CTS_AUTO_POST_THRESHOLD:
        reasons_against.append(
            f"CTS score ({cts_score:.2f}) below {CTS_AUTO_POST_THRESHOLD} threshold"
        )

    # Check risk level
    if risk_level != "low":
        reasons_against.append(f"Risk level is '{risk_level}' (must be 'low')")

    # Check CTA level
    if cta_level > MAX_CTA_LEVEL_FOR_AUTO_POST:
        reasons_against.append(
            f"CTA level ({cta_level}) exceeds maximum ({MAX_CTA_LEVEL_FOR_AUTO_POST})"
        )

    # Determine eligibility
    can_auto_post = len(reasons_against) == 0

    if can_auto_post:
        reason = (
            f"CTS score ({cts_score:.2f}) meets threshold, "
            f"risk is low, and CTA level ({cta_level}) is acceptable."
        )
    else:
        reason = "; ".join(reasons_against) + "."

    return can_auto_post, reason
