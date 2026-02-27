"""Crawl result processor for ReachBy3Cs platform.

This module processes crawl results through the AI pipeline
and saves them to Supabase for human review.
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from supabase import Client, create_client

from src.config import get_settings
from src.crawlers.base import CrawledPost, CrawlResult
from src.agents import create_engagement_pipeline

logger = logging.getLogger(__name__)


class CrawlProcessor:
    """Processes crawl results through the AI pipeline and saves to Supabase.

    This class:
    1. Takes crawled posts from the scheduler
    2. Deduplicates against existing posts
    3. Runs each post through the AI pipeline
    4. Saves posts, signals, responses to Supabase
    5. Adds items to the engagement queue for review
    """

    def __init__(self) -> None:
        """Initialize the crawl processor."""
        self._client: Client | None = None
        self._pipeline = None
        self._tenant_contexts: dict[str, dict] = {}

        # Default tenant context for WeAttuned
        self._default_tenant = {
            "app_name": "WeAttuned",
            "value_prop": "Emotional intelligence app that helps couples communicate better and strengthen their relationships",
            "target_audience": "Couples and individuals seeking to improve relationship communication",
            "key_benefits": [
                "Better communication skills",
                "Emotional awareness",
                "Conflict resolution",
                "Deeper connection"
            ],
            "website_url": "https://weattuned.com"
        }

    def _get_client(self) -> Client:
        """Get or create Supabase client using service role key."""
        if self._client is None:
            settings = get_settings()

            # Use service role key for write access
            service_key = settings.supabase_service_role_key.get_secret_value()
            if not service_key:
                # Fall back to anon key
                service_key = settings.supabase_key.get_secret_value()

            if not settings.supabase_url or not service_key:
                raise RuntimeError("Supabase not configured")

            self._client = create_client(settings.supabase_url, service_key)

        return self._client

    def _get_pipeline(self):
        """Get or create the engagement pipeline."""
        if self._pipeline is None:
            self._pipeline = create_engagement_pipeline()
        return self._pipeline

    def set_tenant_context(self, organization_id: str, context: dict) -> None:
        """Set tenant context for an organization.

        Args:
            organization_id: Organization UUID.
            context: Tenant context with app_name, value_prop, etc.
        """
        self._tenant_contexts[organization_id] = context

    async def process_crawl_results(
        self,
        config_name: str,
        result: CrawlResult,
        organization_id: str | None = None,
    ) -> dict[str, Any]:
        """Process crawl results through the pipeline and save to Supabase.

        Args:
            config_name: Name of the crawl configuration.
            result: Crawl result with posts.
            organization_id: Optional organization ID (uses default if not provided).

        Returns:
            Summary of processing results.
        """
        logger.info(f"Processing {len(result.posts)} posts from crawl: {config_name}")

        # Use default org ID if not provided
        if not organization_id:
            organization_id = "aaaa1111-1111-1111-1111-111111111111"

        # Get tenant context
        tenant_context = self._tenant_contexts.get(organization_id, self._default_tenant)

        stats = {
            "total_posts": len(result.posts),
            "new_posts": 0,
            "duplicates": 0,
            "processed": 0,
            "errors": 0,
            "queued": 0,
        }

        client = self._get_client()
        pipeline = self._get_pipeline()

        for post in result.posts:
            try:
                # Skip posts without URLs or content
                if not post.external_url or not post.content:
                    continue

                # Check for duplicates
                existing = client.table("posts").select("id").eq(
                    "external_url", post.external_url
                ).execute()

                if existing.data:
                    stats["duplicates"] += 1
                    continue

                stats["new_posts"] += 1

                # Map platform from google results
                platform = self._detect_platform(post.external_url)

                # Run through AI pipeline
                pipeline_result = await pipeline.run_async(
                    text=post.content,
                    platform=platform,
                    tenant_context=tenant_context,
                )

                # Check if blocked
                if pipeline_result.get("blocked"):
                    logger.info(f"Post blocked by pipeline: {post.external_url}")
                    continue

                # Save to Supabase
                await self._save_to_supabase(
                    client=client,
                    post=post,
                    platform=platform,
                    pipeline_result=pipeline_result,
                    organization_id=organization_id,
                    config_name=config_name,
                )

                stats["processed"] += 1
                stats["queued"] += 1

            except Exception as e:
                logger.error(f"Error processing post {post.external_url}: {e}")
                stats["errors"] += 1

        logger.info(
            f"Crawl processing complete: {stats['processed']} processed, "
            f"{stats['queued']} queued, {stats['duplicates']} duplicates, "
            f"{stats['errors']} errors"
        )

        return stats

    def _detect_platform(self, url: str) -> str:
        """Detect platform from URL."""
        url_lower = url.lower()
        if "reddit.com" in url_lower:
            return "reddit"
        elif "twitter.com" in url_lower or "x.com" in url_lower:
            return "twitter"
        elif "quora.com" in url_lower:
            return "quora"
        elif "facebook.com" in url_lower:
            return "facebook"
        elif "linkedin.com" in url_lower:
            return "linkedin"
        else:
            return "other"

    async def _save_to_supabase(
        self,
        client: Client,
        post: CrawledPost,
        platform: str,
        pipeline_result: dict[str, Any],
        organization_id: str,
        config_name: str,
    ) -> str:
        """Save post, signal, response, and queue item to Supabase.

        Returns:
            The queue item ID.
        """
        now = datetime.now(timezone.utc).isoformat()

        # 1. Save post
        post_id = str(uuid.uuid4())
        post_data = {
            "id": post_id,
            "organization_id": organization_id,
            "platform": platform,
            "external_id": post.external_id,
            "external_url": post.external_url,
            "content": post.content[:10000] if post.content else "",  # Limit content length
            "author_handle": post.author_handle,
            "author_display_name": post.author_display_name,
            "crawled_at": post.crawled_at.isoformat() if post.crawled_at else now,
            "created_at": now,
            "updated_at": now,
            "metadata": {
                "crawl_config": config_name,
                "keywords_matched": post.keywords_matched,
                "platform_metadata": post.platform_metadata,
            },
        }

        client.table("posts").insert(post_data).execute()

        # 2. Save signal
        signal = pipeline_result.get("signal", {})
        signal_id = str(uuid.uuid4())
        signal_data = {
            "id": signal_id,
            "post_id": post_id,
            "problem_category": signal.get("problem_category", "unknown"),
            "emotional_intensity": signal.get("emotional_intensity", 0.5),
            "keywords": signal.get("keywords", []),
            "confidence": signal.get("confidence", 0.5),
            "created_at": now,
        }

        client.table("signals").insert(signal_data).execute()

        # 3. Save risk score
        risk = pipeline_result.get("risk", {})
        risk_id = str(uuid.uuid4())
        risk_data = {
            "id": risk_id,
            "post_id": post_id,
            "risk_level": risk.get("risk_level", "medium"),
            "risk_score": risk.get("risk_score", 0.5),
            "risk_factors": risk.get("risk_factors", []),
            "context_flags": risk.get("context_flags", []),
            "created_at": now,
        }

        client.table("risk_scores").insert(risk_data).execute()

        # 4. Save response
        responses = pipeline_result.get("responses", {})
        response_id = str(uuid.uuid4())
        response_data = {
            "id": response_id,
            "post_id": post_id,
            "organization_id": organization_id,
            "response_type": responses.get("selected_type", "soft_cta"),
            "content": responses.get("selected_response", ""),
            "value_first_variant": responses.get("value_first_response", ""),
            "soft_cta_variant": responses.get("soft_cta_response", ""),
            "contextual_variant": responses.get("contextual_response", ""),
            "status": "pending",
            "created_at": now,
            "updated_at": now,
        }

        client.table("responses").insert(response_data).execute()

        # 5. Add to engagement queue
        cts = pipeline_result.get("cts", {})
        queue_id = str(uuid.uuid4())
        queue_data = {
            "id": queue_id,
            "organization_id": organization_id,
            "post_id": post_id,
            "response_id": response_id,
            "status": "pending",
            "priority": self._calculate_priority(cts.get("cts_score", 0.5)),
            "cts_score": cts.get("cts_score", 0.5),
            "requires_review": cts.get("requires_review", True),
            "decision_factors": cts.get("decision_factors", []),
            "created_at": now,
            "updated_at": now,
        }

        client.table("engagement_queue").insert(queue_data).execute()

        logger.debug(f"Saved post {post_id} to queue as {queue_id}")

        return queue_id

    def _calculate_priority(self, cts_score: float) -> int:
        """Calculate queue priority from CTS score (1-5, 1 is highest)."""
        if cts_score >= 0.8:
            return 1
        elif cts_score >= 0.6:
            return 2
        elif cts_score >= 0.4:
            return 3
        elif cts_score >= 0.2:
            return 4
        else:
            return 5


# Singleton instance
_processor: CrawlProcessor | None = None


def get_crawl_processor() -> CrawlProcessor:
    """Get the singleton crawl processor instance."""
    global _processor
    if _processor is None:
        _processor = CrawlProcessor()
    return _processor
