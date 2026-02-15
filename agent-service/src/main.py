"""FastAPI application entry point.

This module initializes the FastAPI application and configures middleware,
exception handlers, and routes.
"""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.routes import health
from src.config import get_settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application lifespan context manager.

    Handles startup and shutdown events for the application.

    Args:
        app: FastAPI application instance.

    Yields:
        None
    """
    # Startup
    settings = get_settings()
    logger.info(
        "Starting %s in %s mode",
        settings.app_name,
        settings.app_env.value,
    )

    # Initialize services here (e.g., database connections, cache)
    logger.info("Application startup complete")

    yield

    # Shutdown
    logger.info("Shutting down application...")
    # Cleanup resources here
    logger.info("Application shutdown complete")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application.

    Returns:
        FastAPI: Configured FastAPI application instance.
    """
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        description="AI Skills Agent Service for Needs-Matched Platform",
        version="0.1.0",
        debug=settings.debug,
        lifespan=lifespan,
        docs_url="/docs" if settings.is_development else None,
        redoc_url="/redoc" if settings.is_development else None,
        openapi_url="/openapi.json" if settings.is_development else None,
    )

    # Configure CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"] if settings.is_development else [],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers
    app.include_router(health.router, tags=["Health"])

    return app


# Create application instance
app = create_app()


if __name__ == "__main__":
    import uvicorn

    settings = get_settings()
    uvicorn.run(
        "src.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.is_development,
        log_level=settings.log_level.lower(),
    )
