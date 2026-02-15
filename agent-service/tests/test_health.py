"""Tests for health check endpoints."""

import pytest
from fastapi import status
from fastapi.testclient import TestClient


class TestHealthEndpoints:
    """Test suite for health check endpoints."""

    def test_health_check_returns_200(self, client: TestClient) -> None:
        """Test that health check endpoint returns 200 OK.

        Args:
            client: FastAPI test client fixture.
        """
        response = client.get("/health")

        assert response.status_code == status.HTTP_200_OK

    def test_health_check_response_structure(self, client: TestClient) -> None:
        """Test that health check response has correct structure.

        Args:
            client: FastAPI test client fixture.
        """
        response = client.get("/health")
        data = response.json()

        assert "status" in data
        assert "service" in data
        assert "version" in data
        assert "environment" in data
        assert "timestamp" in data

    def test_health_check_status_is_healthy(self, client: TestClient) -> None:
        """Test that health check reports healthy status.

        Args:
            client: FastAPI test client fixture.
        """
        response = client.get("/health")
        data = response.json()

        assert data["status"] == "healthy"

    def test_health_check_environment_is_testing(self, client: TestClient) -> None:
        """Test that environment is correctly reported as testing.

        Args:
            client: FastAPI test client fixture.
        """
        response = client.get("/health")
        data = response.json()

        assert data["environment"] == "testing"

    def test_liveness_probe_returns_200(self, client: TestClient) -> None:
        """Test that liveness probe endpoint returns 200 OK.

        Args:
            client: FastAPI test client fixture.
        """
        response = client.get("/health/live")

        assert response.status_code == status.HTTP_200_OK
        assert response.json()["status"] == "alive"

    def test_readiness_probe_returns_200(self, client: TestClient) -> None:
        """Test that readiness probe endpoint returns 200 OK.

        Args:
            client: FastAPI test client fixture.
        """
        response = client.get("/health/ready")

        assert response.status_code == status.HTTP_200_OK

    def test_readiness_probe_response_structure(self, client: TestClient) -> None:
        """Test that readiness probe response has correct structure.

        Args:
            client: FastAPI test client fixture.
        """
        response = client.get("/health/ready")
        data = response.json()

        assert "ready" in data
        assert "checks" in data
        assert isinstance(data["checks"], dict)

    def test_readiness_probe_checks_included(self, client: TestClient) -> None:
        """Test that readiness probe includes expected checks.

        Args:
            client: FastAPI test client fixture.
        """
        response = client.get("/health/ready")
        data = response.json()

        # Verify expected checks are present
        assert "database" in data["checks"]
        assert "llm_service" in data["checks"]


class TestOpenAPIDocumentation:
    """Test suite for API documentation endpoints."""

    def test_openapi_json_available_in_dev(self, client: TestClient) -> None:
        """Test that OpenAPI JSON is available in development/testing mode.

        Args:
            client: FastAPI test client fixture.
        """
        response = client.get("/openapi.json")

        assert response.status_code == status.HTTP_200_OK
        assert "openapi" in response.json()

    def test_docs_endpoint_available(self, client: TestClient) -> None:
        """Test that Swagger UI docs endpoint is available.

        Args:
            client: FastAPI test client fixture.
        """
        response = client.get("/docs")

        assert response.status_code == status.HTTP_200_OK
