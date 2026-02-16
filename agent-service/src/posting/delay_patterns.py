"""Human-like delay patterns for posting operations.

This module provides functions to generate realistic delays that simulate
human behavior when reading content and typing responses. These delays
help avoid detection as automated behavior and make posts appear more
natural.
"""

import random
from typing import Literal


def get_typing_delay(
    text_length: int,
    speed_profile: Literal["slow", "average", "fast"] = "average",
) -> float:
    """Calculate a human-like typing delay based on text length.

    Simulates the time it would take a human to type the given text,
    with natural variation in typing speed.

    Args:
        text_length: Number of characters in the text.
        speed_profile: Typing speed profile (slow: 40 WPM, average: 60 WPM, fast: 80 WPM).

    Returns:
        Delay in seconds that simulates typing time.

    Example:
        >>> delay = get_typing_delay(500)  # 500 character response
        >>> # Returns ~12-20 seconds for average typist
    """
    # Words per minute by profile
    wpm_ranges = {
        "slow": (30, 50),
        "average": (40, 70),
        "fast": (60, 90),
    }

    min_wpm, max_wpm = wpm_ranges.get(speed_profile, (40, 70))

    # Calculate words (average 5 characters per word)
    words = text_length / 5

    # Random WPM within range
    wpm = random.uniform(min_wpm, max_wpm)

    # Base typing time
    base_time = (words / wpm) * 60

    # Add "thinking" pauses (people pause while typing)
    # More pauses for longer text
    pause_count = max(1, int(words / 20))  # Pause roughly every 20 words
    thinking_time = sum(random.uniform(1, 4) for _ in range(pause_count))

    # Add variation for typos and corrections
    typo_time = random.uniform(0, words * 0.1)  # Up to 0.1 seconds per word for corrections

    total_time = base_time + thinking_time + typo_time

    # Add small random jitter
    total_time *= random.uniform(0.9, 1.1)

    # Minimum 3 seconds even for very short text
    return max(3.0, total_time)


def get_reading_delay(
    text_length: int,
    comprehension_level: Literal["skim", "normal", "careful"] = "normal",
) -> float:
    """Calculate a human-like reading delay based on text length.

    Simulates the time it would take a human to read and understand
    the original post before responding.

    Args:
        text_length: Number of characters in the text to read.
        comprehension_level: How carefully the text is being read.

    Returns:
        Delay in seconds that simulates reading time.

    Example:
        >>> delay = get_reading_delay(1000)  # 1000 character post
        >>> # Returns ~15-25 seconds for normal reading
    """
    # Words per minute for reading comprehension
    wpm_ranges = {
        "skim": (300, 450),      # Fast scan
        "normal": (200, 300),    # Normal reading
        "careful": (100, 200),   # Careful consideration
    }

    min_wpm, max_wpm = wpm_ranges.get(comprehension_level, (200, 300))

    # Calculate words
    words = text_length / 5

    # Random WPM within range
    wpm = random.uniform(min_wpm, max_wpm)

    # Base reading time
    base_time = (words / wpm) * 60

    # Add time to scroll/navigate (for longer content)
    if words > 100:
        scroll_time = random.uniform(1, 3)
    else:
        scroll_time = 0

    # Add initial load/focus time
    focus_time = random.uniform(2, 5)

    total_time = base_time + scroll_time + focus_time

    # Minimum 5 seconds even for very short text
    return max(5.0, total_time)


def get_human_like_delay(
    original_text_length: int,
    response_text_length: int,
    include_navigation: bool = True,
) -> float:
    """Calculate total human-like delay for reading and responding.

    Combines reading the original content and typing the response
    with additional navigation time.

    Args:
        original_text_length: Length of the original post to read.
        response_text_length: Length of the response to type.
        include_navigation: Whether to include page navigation time.

    Returns:
        Total delay in seconds.

    Example:
        >>> delay = get_human_like_delay(500, 200)
        >>> # Returns total time for reading 500 chars and typing 200 chars
    """
    # Reading time
    reading_delay = get_reading_delay(original_text_length, "normal")

    # Typing time
    typing_delay = get_typing_delay(response_text_length, "average")

    # Navigation time (loading page, scrolling to reply box, etc.)
    if include_navigation:
        navigation_time = random.uniform(3, 8)
    else:
        navigation_time = 0

    # Final review before posting
    review_time = random.uniform(2, 5)

    total = reading_delay + typing_delay + navigation_time + review_time

    return total


def get_random_jitter(
    base_delay: float,
    jitter_percentage: float = 0.2,
) -> float:
    """Add random jitter to a delay value.

    Adds or subtracts a random percentage of the base delay
    to make timing less predictable.

    Args:
        base_delay: The base delay in seconds.
        jitter_percentage: Maximum percentage variation (0.0 to 1.0).

    Returns:
        Delay with random jitter applied.

    Example:
        >>> delay = get_random_jitter(10.0, 0.2)
        >>> # Returns value between 8.0 and 12.0
    """
    jitter = base_delay * jitter_percentage
    return base_delay + random.uniform(-jitter, jitter)


def get_inter_post_delay(
    min_seconds: int = 60,
    max_seconds: int = 300,
) -> float:
    """Calculate delay between consecutive posts.

    Returns a random delay to space out multiple posts,
    helping avoid rate limits and appearing more natural.

    Args:
        min_seconds: Minimum delay between posts.
        max_seconds: Maximum delay between posts.

    Returns:
        Delay in seconds.
    """
    # Use a slightly weighted distribution - more likely to be in the middle
    # This creates a more natural pattern than uniform distribution
    base = random.triangular(min_seconds, max_seconds, (min_seconds + max_seconds) / 2)
    return get_random_jitter(base, 0.1)


def get_subreddit_cooldown_delay(
    previous_post_time_seconds_ago: float,
    min_gap_seconds: int = 300,  # 5 minutes
) -> float:
    """Calculate remaining cooldown for posting to the same subreddit.

    Args:
        previous_post_time_seconds_ago: Seconds since last post to this subreddit.
        min_gap_seconds: Minimum gap required between posts to same subreddit.

    Returns:
        Remaining delay needed (0 if cooldown has passed).
    """
    remaining = min_gap_seconds - previous_post_time_seconds_ago
    if remaining <= 0:
        return 0

    # Add some jitter to the remaining time
    return get_random_jitter(remaining, 0.1)


def get_time_of_day_multiplier() -> float:
    """Get a posting speed multiplier based on time of day.

    People typically type slower late at night or early morning.
    This adds realism to the delay patterns.

    Returns:
        Multiplier for delays (1.0 = normal speed).
    """
    from datetime import datetime

    hour = datetime.now().hour

    # Late night / early morning: slower
    if hour < 6 or hour >= 23:
        return random.uniform(1.2, 1.5)
    # Morning rush: slightly faster
    elif 7 <= hour < 9:
        return random.uniform(0.9, 1.0)
    # Regular hours: normal
    elif 9 <= hour < 18:
        return random.uniform(0.95, 1.05)
    # Evening: slightly slower
    else:
        return random.uniform(1.0, 1.15)
