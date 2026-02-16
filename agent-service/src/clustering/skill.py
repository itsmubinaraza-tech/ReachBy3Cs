"""Clustering Skill for community detection.

This module implements the main clustering skill that coordinates
embeddings, clustering, and theme extraction to group similar posts
into communities.
"""

import logging
import time
from datetime import datetime, timedelta
from typing import Any, TypedDict

import numpy as np
from langgraph.graph import END, StateGraph

from src.config import get_settings
from src.db.supabase import get_supabase_client
from src.clustering.embeddings import EmbeddingService
from src.clustering.clusterer import PostClusterer
from src.clustering.theme_detector import ThemeDetector
from src.clustering.schemas import (
    ClusterAssignment,
    ClusterInfo,
    ClusteringInput,
    ClusteringOutput,
    ClusterThemes,
    SimilarCluster,
    TrendingCluster,
)

logger = logging.getLogger(__name__)


class ClusteringState(TypedDict):
    """State for the clustering workflow.

    Attributes:
        input: The input data.
        embedding: Generated embedding for the post.
        existing_clusters: Existing cluster centroids.
        assignment: Cluster assignment result.
        output: Final output.
        error: Any error that occurred.
    """

    input: ClusteringInput
    embedding: list[float]
    existing_clusters: dict[str, Any]
    assignment: ClusterAssignment | None
    output: dict[str, Any]
    error: str | None


class ClusteringSkill:
    """Skill for clustering posts into communities.

    This skill coordinates the embedding generation, clustering algorithm,
    and theme extraction to assign posts to existing clusters or create
    new ones.

    Example:
        skill = ClusteringSkill()
        assignment = await skill.assign_to_cluster(
            post_text="I'm struggling with finances...",
            post_id="post-123",
            org_id="org-456"
        )
    """

    def __init__(
        self,
        min_cluster_size: int = 5,
        similarity_threshold: float = 0.7,
    ) -> None:
        """Initialize the clustering skill.

        Args:
            min_cluster_size: Minimum posts to form a cluster.
            similarity_threshold: Minimum similarity to assign to cluster.
        """
        self.embedder = EmbeddingService()
        self.clusterer = PostClusterer(min_cluster_size=min_cluster_size)
        self.theme_detector = ThemeDetector()
        self.similarity_threshold = similarity_threshold
        self._workflow = self._build_workflow()

    def _build_workflow(self) -> StateGraph:
        """Build the LangGraph workflow for cluster assignment.

        Returns:
            StateGraph: Compiled workflow.
        """
        workflow = StateGraph(ClusteringState)

        # Add nodes
        workflow.add_node("generate_embedding", self._generate_embedding)
        workflow.add_node("load_clusters", self._load_existing_clusters)
        workflow.add_node("find_cluster", self._find_matching_cluster)
        workflow.add_node("create_cluster", self._create_new_cluster)
        workflow.add_node("build_output", self._build_output)
        workflow.add_node("handle_error", self._handle_error)

        # Set entry point
        workflow.set_entry_point("generate_embedding")

        # Add edges
        workflow.add_conditional_edges(
            "generate_embedding",
            self._check_error,
            {"success": "load_clusters", "error": "handle_error"},
        )
        workflow.add_conditional_edges(
            "load_clusters",
            self._check_error,
            {"success": "find_cluster", "error": "handle_error"},
        )
        workflow.add_conditional_edges(
            "find_cluster",
            self._check_cluster_found,
            {"found": "build_output", "not_found": "create_cluster", "error": "handle_error"},
        )
        workflow.add_edge("create_cluster", "build_output")
        workflow.add_edge("build_output", END)
        workflow.add_edge("handle_error", END)

        return workflow.compile()

    def _check_error(self, state: ClusteringState) -> str:
        """Check if there was an error."""
        return "error" if state.get("error") else "success"

    def _check_cluster_found(self, state: ClusteringState) -> str:
        """Check if a matching cluster was found."""
        if state.get("error"):
            return "error"
        if state.get("assignment"):
            return "found"
        return "not_found"

    async def _generate_embedding_async(self, text: str) -> list[float]:
        """Generate embedding for text."""
        return await self.embedder.get_embedding(text)

    def _generate_embedding(self, state: ClusteringState) -> dict[str, Any]:
        """Generate embedding for the input text."""
        import asyncio

        try:
            text = state["input"].text

            try:
                loop = asyncio.get_running_loop()
            except RuntimeError:
                loop = None

            if loop is not None:
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as executor:
                    future = executor.submit(
                        asyncio.run,
                        self._generate_embedding_async(text),
                    )
                    embedding = future.result(timeout=60)
            else:
                embedding = asyncio.run(self._generate_embedding_async(text))

            return {"embedding": embedding, "error": None}

        except Exception as e:
            logger.error("Error generating embedding: %s", e)
            return {"embedding": [], "error": f"Embedding error: {str(e)}"}

    def _load_existing_clusters(self, state: ClusteringState) -> dict[str, Any]:
        """Load existing clusters for the organization."""
        try:
            org_id = state["input"].organization_id
            supabase = get_supabase_client()

            if not supabase.is_connected:
                logger.warning("Supabase not connected, using empty clusters")
                return {"existing_clusters": {}, "error": None}

            # Query existing clusters with embeddings
            result = supabase.table("clusters").select(
                "id, name, embedding, member_count, keywords"
            ).eq(
                "organization_id", org_id
            ).eq(
                "is_active", True
            ).execute()

            clusters = {}
            for row in result.data:
                if row.get("embedding"):
                    clusters[row["id"]] = {
                        "name": row["name"],
                        "embedding": row["embedding"],
                        "member_count": row.get("member_count", 0),
                        "keywords": row.get("keywords", []),
                    }

            logger.info("Loaded %d existing clusters for org %s", len(clusters), org_id)
            return {"existing_clusters": clusters, "error": None}

        except Exception as e:
            logger.error("Error loading clusters: %s", e)
            return {"existing_clusters": {}, "error": None}  # Non-fatal error

    def _find_matching_cluster(self, state: ClusteringState) -> dict[str, Any]:
        """Find a matching cluster for the post."""
        try:
            embedding = np.array(state["embedding"])
            clusters = state["existing_clusters"]

            if not clusters:
                return {"assignment": None, "error": None}

            # Build centroid dict
            centroids = {}
            for cluster_id, cluster_data in clusters.items():
                centroid = cluster_data.get("embedding")
                if centroid:
                    centroids[cluster_id] = np.array(centroid)

            # Find best matching cluster
            best_cluster_id, similarity = self.clusterer.assign_to_existing_cluster(
                embedding,
                centroids,
                similarity_threshold=self.similarity_threshold,
            )

            if best_cluster_id:
                cluster_data = clusters[best_cluster_id]
                assignment = ClusterAssignment(
                    cluster_id=best_cluster_id,
                    cluster_name=cluster_data["name"],
                    similarity_score=similarity,
                    is_new_cluster=False,
                    themes=ClusterThemes(
                        main_theme=cluster_data.get("name", "Unknown"),
                        keywords=cluster_data.get("keywords", []),
                        sentiment="neutral",
                        description="",
                    ),
                )
                return {"assignment": assignment, "error": None}

            return {"assignment": None, "error": None}

        except Exception as e:
            logger.error("Error finding cluster: %s", e)
            return {"assignment": None, "error": None}  # Non-fatal

    def _create_new_cluster(self, state: ClusteringState) -> dict[str, Any]:
        """Create a new cluster or mark as unclustered."""
        import asyncio
        import uuid

        try:
            text = state["input"].text
            embedding = state["embedding"]
            org_id = state["input"].organization_id

            # Generate themes for the new post
            try:
                loop = asyncio.get_running_loop()
            except RuntimeError:
                loop = None

            if loop is not None:
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as executor:
                    future = executor.submit(
                        asyncio.run,
                        self.theme_detector.extract_themes([text]),
                    )
                    themes = future.result(timeout=60)
            else:
                themes = asyncio.run(self.theme_detector.extract_themes([text]))

            # Create placeholder assignment (cluster will be created in batch)
            cluster_id = f"pending-{uuid.uuid4()}"

            assignment = ClusterAssignment(
                cluster_id=cluster_id,
                cluster_name=themes.main_theme.title(),
                similarity_score=1.0,
                is_new_cluster=True,
                themes=themes,
            )

            return {"assignment": assignment, "error": None}

        except Exception as e:
            logger.error("Error creating cluster: %s", e)
            return {
                "assignment": ClusterAssignment(
                    cluster_id="unclustered",
                    cluster_name="Unclustered",
                    similarity_score=0.0,
                    is_new_cluster=False,
                    themes=None,
                ),
                "error": None,
            }

    def _build_output(self, state: ClusteringState) -> dict[str, Any]:
        """Build the final output."""
        assignment = state["assignment"]
        return {
            "output": {
                "assignment": assignment,
                "embedding": state["embedding"],
            }
        }

    def _handle_error(self, state: ClusteringState) -> dict[str, Any]:
        """Handle errors with fallback output."""
        return {
            "output": {
                "assignment": ClusterAssignment(
                    cluster_id="error",
                    cluster_name="Error",
                    similarity_score=0.0,
                    is_new_cluster=False,
                    themes=None,
                ),
                "embedding": [],
                "error": state.get("error"),
            }
        }

    async def assign_to_cluster(
        self,
        post_text: str,
        post_id: str,
        org_id: str,
    ) -> ClusterAssignment:
        """Assign a post to an existing or new cluster.

        Args:
            post_text: The post content.
            post_id: The post identifier.
            org_id: The organization identifier.

        Returns:
            ClusterAssignment: The cluster assignment result.
        """
        input_data = ClusteringInput(
            post_id=post_id,
            text=post_text,
            organization_id=org_id,
        )

        initial_state: ClusteringState = {
            "input": input_data,
            "embedding": [],
            "existing_clusters": {},
            "assignment": None,
            "output": {},
            "error": None,
        }

        result = await self._workflow.ainvoke(initial_state)
        return result["output"]["assignment"]

    async def run_full_clustering(
        self,
        org_id: str,
        since: datetime | None = None,
    ) -> ClusteringOutput:
        """Re-cluster all posts for an organization.

        Args:
            org_id: Organization identifier.
            since: Only cluster posts since this time (optional).

        Returns:
            ClusteringOutput: Full clustering results.
        """
        start_time = time.time()

        try:
            supabase = get_supabase_client()

            if not supabase.is_connected:
                return ClusteringOutput(
                    clusters=[],
                    total_posts=0,
                    unclustered_count=0,
                    processing_time_ms=0,
                    raw_analysis={"error": "Database not connected"},
                )

            # Query posts
            query = supabase.table("posts").select(
                "id, content"
            ).eq("organization_id", org_id)

            if since:
                query = query.gte("detected_at", since.isoformat())

            result = query.limit(1000).execute()
            posts_data = result.data

            if not posts_data:
                return ClusteringOutput(
                    clusters=[],
                    total_posts=0,
                    unclustered_count=0,
                    processing_time_ms=int((time.time() - start_time) * 1000),
                )

            # Extract texts and IDs
            post_ids = [p["id"] for p in posts_data]
            post_texts = [p["content"] for p in posts_data]

            # Generate embeddings
            embeddings = await self.embedder.get_embeddings_batch(post_texts)
            embeddings_array = np.array(embeddings)

            # Run clustering
            cluster_result = self.clusterer.cluster(embeddings_array)

            # Get unique cluster labels (excluding noise)
            unique_labels = set(cluster_result.cluster_labels)
            unique_labels.discard(-1)

            # Process each cluster
            clusters: list[ClusterInfo] = []
            now = datetime.utcnow()

            for label in unique_labels:
                mask = cluster_result.cluster_labels == label
                cluster_post_ids = [post_ids[i] for i, m in enumerate(mask) if m]
                cluster_texts = [post_texts[i] for i, m in enumerate(mask) if m]
                cluster_embeddings = embeddings_array[mask]

                # Extract themes
                themes = await self.theme_detector.extract_themes(
                    cluster_texts,
                    cluster_label=int(label),
                )

                # Generate cluster name
                cluster_name = await self.theme_detector.generate_cluster_name(themes)

                # Compute centroid
                centroid = self.embedder.compute_centroid(cluster_embeddings.tolist())

                # Create cluster info
                cluster_info = ClusterInfo(
                    id=f"cluster-{org_id}-{label}",
                    name=cluster_name,
                    description=themes.description,
                    themes=themes,
                    member_count=len(cluster_post_ids),
                    engagement_count=0,
                    avg_emotional_intensity=None,
                    avg_risk_score=None,
                    is_trending=False,
                    first_detected_at=now,
                    last_activity_at=now,
                )

                clusters.append(cluster_info)

            processing_time = int((time.time() - start_time) * 1000)

            return ClusteringOutput(
                clusters=clusters,
                total_posts=len(posts_data),
                unclustered_count=cluster_result.noise_count,
                processing_time_ms=processing_time,
                raw_analysis={
                    "num_clusters": cluster_result.num_clusters,
                    "post_ids": post_ids,
                    "cluster_labels": cluster_result.cluster_labels.tolist(),
                },
            )

        except Exception as e:
            logger.error("Error running full clustering: %s", e)
            return ClusteringOutput(
                clusters=[],
                total_posts=0,
                unclustered_count=0,
                processing_time_ms=int((time.time() - start_time) * 1000),
                raw_analysis={"error": str(e)},
            )

    async def get_cluster_detail(
        self,
        cluster_id: str,
        include_posts: bool = True,
        max_posts: int = 50,
    ) -> ClusterInfo | None:
        """Get detailed information about a cluster.

        Args:
            cluster_id: Cluster identifier.
            include_posts: Whether to include member posts.
            max_posts: Maximum posts to include.

        Returns:
            ClusterInfo or None if not found.
        """
        try:
            supabase = get_supabase_client()

            if not supabase.is_connected:
                return None

            # Get cluster data
            result = supabase.table("clusters").select("*").eq("id", cluster_id).single().execute()

            if not result.data:
                return None

            cluster_data = result.data

            # Parse themes
            themes = ClusterThemes(
                main_theme=cluster_data.get("name", "Unknown"),
                keywords=cluster_data.get("keywords", []),
                sentiment="neutral",
                description=cluster_data.get("description", ""),
            )

            return ClusterInfo(
                id=cluster_data["id"],
                name=cluster_data["name"],
                description=cluster_data.get("description"),
                themes=themes,
                member_count=cluster_data.get("member_count", 0),
                engagement_count=cluster_data.get("engagement_count", 0),
                avg_emotional_intensity=cluster_data.get("avg_emotional_intensity"),
                avg_risk_score=cluster_data.get("avg_risk_score"),
                is_trending=False,
                first_detected_at=datetime.fromisoformat(
                    cluster_data.get("first_detected_at", datetime.utcnow().isoformat())
                ),
                last_activity_at=datetime.fromisoformat(
                    cluster_data.get("last_activity_at", datetime.utcnow().isoformat())
                ),
            )

        except Exception as e:
            logger.error("Error getting cluster detail: %s", e)
            return None

    async def get_similar_clusters(
        self,
        cluster_id: str,
        top_k: int = 5,
    ) -> list[SimilarCluster]:
        """Find clusters similar to a given cluster.

        Args:
            cluster_id: Reference cluster ID.
            top_k: Number of similar clusters to return.

        Returns:
            List of similar clusters.
        """
        try:
            supabase = get_supabase_client()

            if not supabase.is_connected:
                return []

            # Get reference cluster embedding
            ref_result = supabase.table("clusters").select(
                "embedding, organization_id"
            ).eq("id", cluster_id).single().execute()

            if not ref_result.data or not ref_result.data.get("embedding"):
                return []

            ref_embedding = np.array(ref_result.data["embedding"])
            org_id = ref_result.data["organization_id"]

            # Get all other clusters in org
            all_result = supabase.table("clusters").select(
                "id, name, embedding, member_count"
            ).eq("organization_id", org_id).neq("id", cluster_id).execute()

            candidates = []
            for row in all_result.data:
                if row.get("embedding"):
                    candidates.append({
                        "id": row["id"],
                        "name": row["name"],
                        "embedding": np.array(row["embedding"]),
                        "member_count": row.get("member_count", 0),
                    })

            if not candidates:
                return []

            # Find most similar
            similar = []
            for candidate in candidates:
                similarity = float(
                    np.dot(ref_embedding, candidate["embedding"])
                    / (np.linalg.norm(ref_embedding) * np.linalg.norm(candidate["embedding"]))
                )
                similar.append(
                    SimilarCluster(
                        id=candidate["id"],
                        name=candidate["name"],
                        similarity_score=similarity,
                        member_count=candidate["member_count"],
                    )
                )

            # Sort by similarity
            similar.sort(key=lambda x: x.similarity_score, reverse=True)
            return similar[:top_k]

        except Exception as e:
            logger.error("Error finding similar clusters: %s", e)
            return []

    async def get_trending_clusters(
        self,
        org_id: str,
        time_window: timedelta = timedelta(hours=24),
        top_k: int = 10,
    ) -> list[TrendingCluster]:
        """Get trending clusters for an organization.

        Args:
            org_id: Organization identifier.
            time_window: Time window for measuring growth.
            top_k: Number of trending clusters to return.

        Returns:
            List of trending clusters.
        """
        try:
            supabase = get_supabase_client()

            if not supabase.is_connected:
                return []

            # Get clusters with recent activity
            result = supabase.table("clusters").select(
                "id, name, member_count, keywords, trending_topics, last_activity_at"
            ).eq("organization_id", org_id).eq("is_active", True).execute()

            clusters_data = []
            for row in result.data:
                # Get recent member additions
                window_start = (datetime.utcnow() - time_window).isoformat()
                members_result = supabase.table("cluster_members").select(
                    "added_at"
                ).eq("cluster_id", row["id"]).gte("added_at", window_start).execute()

                recent_additions = len(members_result.data)

                clusters_data.append({
                    "id": row["id"],
                    "name": row["name"],
                    "member_count": row.get("member_count", 0),
                    "recent_additions": recent_additions,
                    "themes": {
                        "main_theme": row["name"],
                        "keywords": row.get("keywords", []),
                        "sentiment": "neutral",
                        "description": "",
                    },
                })

            # Use theme detector to identify trending
            trending_raw = self.theme_detector.detect_trending(
                clusters_data,
                time_window=time_window,
                growth_threshold=0.1,
            )

            return trending_raw[:top_k]

        except Exception as e:
            logger.error("Error getting trending clusters: %s", e)
            return []
