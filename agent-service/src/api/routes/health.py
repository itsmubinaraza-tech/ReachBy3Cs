"""Health check endpoints.

This module provides health check endpoints for monitoring
the application status and readiness.
"""

from datetime import datetime, timezone
from typing import Literal

from fastapi import APIRouter, status
from pydantic import BaseModel, Field

from src.config import get_settings

router = APIRouter()


class HealthResponse(BaseModel):
    """Health check response model.

    Attributes:
        status: Current service status (healthy, unhealthy, degraded).
        service: Name of the service.
        version: Service version.
        environment: Current environment.
        timestamp: ISO 8601 timestamp of the health check.
    """

    status: Literal["healthy", "unhealthy", "degraded"] = Field(
        description="Current service status"
    )
    service: str = Field(description="Service name")
    version: str = Field(description="Service version")
    environment: str = Field(description="Current environment")
    timestamp: str = Field(description="ISO 8601 timestamp")


class ReadinessResponse(BaseModel):
    """Readiness check response model.

    Attributes:
        ready: Whether the service is ready to accept requests.
        checks: Dictionary of individual check results.
    """

    ready: bool = Field(description="Service readiness status")
    checks: dict[str, bool] = Field(
        default_factory=dict, description="Individual check results"
    )


@router.get(
    "/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    summary="Health Check",
    description="Check the health status of the agent service.",
)
async def health_check() -> HealthResponse:
    """Perform a basic health check.

    Returns:
        HealthResponse: Current health status of the service.
    """
    settings = get_settings()

    return HealthResponse(
        status="healthy",
        service=settings.app_name,
        version="0.1.0",
        environment=settings.app_env.value,
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@router.get(
    "/health/live",
    status_code=status.HTTP_200_OK,
    summary="Liveness Probe",
    description="Kubernetes liveness probe endpoint.",
)
async def liveness_probe() -> dict[str, str]:
    """Liveness probe for container orchestration.

    Returns:
        dict: Simple status response.
    """
    return {"status": "alive"}


@router.get(
    "/health/ready",
    response_model=ReadinessResponse,
    status_code=status.HTTP_200_OK,
    summary="Readiness Probe",
    description="Kubernetes readiness probe endpoint.",
)
async def readiness_probe() -> ReadinessResponse:
    """Readiness probe for container orchestration.

    Checks if all required services and dependencies are available.

    Returns:
        ReadinessResponse: Readiness status with individual check results.
    """
    # TODO: Add actual dependency checks (database, external services)
    checks = {
        "database": True,  # Placeholder - implement actual check
        "llm_service": True,  # Placeholder - implement actual check
    }

    all_ready = all(checks.values())

    return ReadinessResponse(
        ready=all_ready,
        checks=checks,
    )
