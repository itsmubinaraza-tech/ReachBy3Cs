"""Pytest configuration and fixtures for the agent service tests."""

import os
from collections.abc import Generator
from typing import Any

import pytest
from fastapi.testclient import TestClient

# Set testing environment before importing app
os.environ["APP_ENV"] = "testing"
os.environ["DEBUG"] = "true"


@pytest.fixture(scope="session")
def test_settings() -> dict[str, Any]:
    """Provide test settings.

    Returns:
        dict: Test configuration settings.
    """
    return {
        "APP_ENV": "testing",
        "DEBUG": "true",
        "SUPABASE_URL": "https://test.supabase.co",
        "SUPABASE_KEY": "test-key",
    }


@pytest.fixture(scope="function")
def client() -> Generator[TestClient, None, None]:
    """Create a test client for the FastAPI application.

    Yields:
        TestClient: FastAPI test client instance.
    """
    # Import here to ensure environment is set
    from src.main import app

    with TestClient(app) as test_client:
        yield test_client
