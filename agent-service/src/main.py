"""FastAPI application entry point.

This module initializes the FastAPI application and configures middleware,
exception handlers, and routes.
"""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.api.routes import health, pipeline, skills, clustering, posting, crawlers
from src.config import get_settings
from src.crawlers.scheduler import get_scheduler
from src.processors.crawl_processor import get_crawl_processor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


async def process_crawl_callback(config_name: str, result) -> None:
    """Callback to process crawl results through pipeline and save to Supabase."""
    try:
        processor = get_crawl_processor()
        stats = await processor.process_crawl_results(config_name, result)
        logger.info(f"Crawl callback processed: {stats}")
    except Exception as e:
        logger.error(f"Error in crawl callback: {e}")


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

    # Connect crawl processor to scheduler
    scheduler = get_scheduler()
    scheduler.set_result_callback(process_crawl_callback)
    logger.info("Crawl processor connected to scheduler")

    logger.info("Application startup complete")

    yield

    # Shutdown
    logger.info("Shutting down application...")
    # Stop scheduler if running
    scheduler = get_scheduler()
    if scheduler._running:
        scheduler.stop()
    logger.info("Application shutdown complete")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application.

    Returns:
        FastAPI: Configured FastAPI application instance.
    """
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        description="AI Skills Agent Service for ReachBy3Cs Platform",
        version="0.1.0",
        debug=settings.debug,
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    # Configure CORS - allow web app origins
    allowed_origins = [
        "http://localhost:3000",
        "https://reachby3cs.vercel.app",
        "https://*.vercel.app",
    ]
    if settings.is_development:
        allowed_origins.append("*")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include routers
    app.include_router(health.router, tags=["Health"])
    app.include_router(skills.router)
    app.include_router(pipeline.router)
    app.include_router(clustering.router)
    app.include_router(posting.router)
    app.include_router(crawlers.router)

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
