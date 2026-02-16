"""Tests for delay patterns module."""

import pytest

from src.posting.delay_patterns import (
    get_human_like_delay,
    get_inter_post_delay,
    get_random_jitter,
    get_reading_delay,
    get_subreddit_cooldown_delay,
    get_typing_delay,
)


class TestTypingDelay:
    """Tests for get_typing_delay function."""

    def test_returns_positive_delay(self):
        """Test that typing delay is always positive."""
        delay = get_typing_delay(100)
        assert delay > 0

    def test_longer_text_takes_longer(self):
        """Test that longer text results in longer delays."""
        short_delay = get_typing_delay(50)
        long_delay = get_typing_delay(500)
        # Long text should generally take longer
        # We test multiple times due to randomness
        results = []
        for _ in range(10):
            s = get_typing_delay(50)
            l = get_typing_delay(500)
            results.append(l > s)
        # Should be true most of the time
        assert sum(results) >= 7

    def test_minimum_delay(self):
        """Test that even short text has minimum delay."""
        delay = get_typing_delay(5)
        assert delay >= 3.0

    def test_speed_profiles(self):
        """Test different speed profiles."""
        # Slow profile should take longer than fast
        slow_delays = [get_typing_delay(100, "slow") for _ in range(5)]
        fast_delays = [get_typing_delay(100, "fast") for _ in range(5)]
        # Average slow should be higher than average fast
        assert sum(slow_delays) / 5 > sum(fast_delays) / 5


class TestReadingDelay:
    """Tests for get_reading_delay function."""

    def test_returns_positive_delay(self):
        """Test that reading delay is always positive."""
        delay = get_reading_delay(100)
        assert delay > 0

    def test_minimum_delay(self):
        """Test minimum reading delay."""
        delay = get_reading_delay(10)
        assert delay >= 5.0

    def test_comprehension_levels(self):
        """Test different comprehension levels."""
        # Careful reading should take longer than skimming
        careful_delays = [get_reading_delay(500, "careful") for _ in range(5)]
        skim_delays = [get_reading_delay(500, "skim") for _ in range(5)]
        assert sum(careful_delays) / 5 > sum(skim_delays) / 5


class TestHumanLikeDelay:
    """Tests for get_human_like_delay function."""

    def test_includes_reading_and_typing(self):
        """Test that combined delay is longer than just typing."""
        typing_only = get_typing_delay(100)
        combined = get_human_like_delay(200, 100)
        # Combined should include reading + typing + navigation
        assert combined > typing_only

    def test_navigation_time(self):
        """Test that navigation time is included when requested."""
        with_nav = get_human_like_delay(100, 100, include_navigation=True)
        without_nav = get_human_like_delay(100, 100, include_navigation=False)
        # With navigation should be longer on average
        with_navs = [get_human_like_delay(100, 100, True) for _ in range(5)]
        without_navs = [get_human_like_delay(100, 100, False) for _ in range(5)]
        assert sum(with_navs) / 5 > sum(without_navs) / 5


class TestRandomJitter:
    """Tests for get_random_jitter function."""

    def test_stays_within_range(self):
        """Test that jitter stays within percentage range."""
        base = 100.0
        percentage = 0.2  # 20%

        for _ in range(100):
            result = get_random_jitter(base, percentage)
            assert 80.0 <= result <= 120.0

    def test_default_jitter(self):
        """Test default jitter percentage."""
        base = 100.0
        results = [get_random_jitter(base) for _ in range(100)]
        # All should be within 20% of base
        assert all(80.0 <= r <= 120.0 for r in results)


class TestInterPostDelay:
    """Tests for get_inter_post_delay function."""

    def test_within_range(self):
        """Test delay is within specified range."""
        for _ in range(50):
            delay = get_inter_post_delay(60, 300)
            # Allow for jitter (10%)
            assert 54 <= delay <= 330

    def test_custom_range(self):
        """Test custom min/max range."""
        delay = get_inter_post_delay(120, 180)
        assert delay >= 100  # Allow some jitter below min


class TestSubredditCooldownDelay:
    """Tests for get_subreddit_cooldown_delay function."""

    def test_no_delay_after_cooldown(self):
        """Test no delay when cooldown has passed."""
        delay = get_subreddit_cooldown_delay(600, min_gap_seconds=300)
        assert delay == 0

    def test_delay_during_cooldown(self):
        """Test delay when still in cooldown."""
        delay = get_subreddit_cooldown_delay(100, min_gap_seconds=300)
        # Should be approximately 200 seconds remaining
        assert 150 <= delay <= 250  # Allow for jitter

    def test_custom_gap(self):
        """Test custom minimum gap."""
        delay = get_subreddit_cooldown_delay(100, min_gap_seconds=600)
        # Should be approximately 500 seconds remaining
        assert 400 <= delay <= 600
