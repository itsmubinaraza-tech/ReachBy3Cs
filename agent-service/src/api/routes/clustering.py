"""Clustering API routes for community detection.

This module provides FastAPI routes for clustering operations:
- Assign posts to clusters
- Run full clustering jobs
- List and manage clusters
- Get trending clusters
"""

import logging
from datetime import datetime, timedelta
from typing import Any, Literal

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from src.clustering import (
    ClusteringSkill,
    ClusterAssignment,
    ClusterInfo,
    ClusteringOutput,
    ClusterThemes,
    SimilarCluster,
    TrendingCluster,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/clustering", tags=["Clustering"])


# ============================================================================
# Request/Response Models
# ============================================================================


class AssignPostRequest(BaseModel):
    """Request model for assigning a post to a cluster."""

    post_id: str = Field(
        ...,
        description="Unique identifier for the post.",
    )
    text: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="The post content to cluster.",
    )
    organization_id: str = Field(
        ...,
        description="Organization ID for multi-tenant clustering.",
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "post_id": "post-123",
                    "text": "I've been struggling to communicate about finances with my partner...",
                    "organization_id": "org-456",
                }
            ]
        }
    }


class AssignPostResponse(BaseModel):
    """Response model for post assignment."""

    cluster_id: str = Field(description="ID of the assigned cluster.")
    cluster_name: str = Field(description="Name of the assigned cluster.")
    similarity_score: float = Field(
        ge=0.0,
        le=1.0,
        description="Similarity score to the cluster.",
    )
    is_new_cluster: bool = Field(description="Whether a new cluster was created.")
    themes: dict[str, Any] | None = Field(
        default=None,
        description="Cluster themes if available.",
    )


class RunClusteringRequest(BaseModel):
    """Request model for running full clustering."""

    organization_id: str = Field(
        ...,
        description="Organization ID to cluster.",
    )
    since: datetime | None = Field(
        default=None,
        description="Only cluster posts since this time.",
    )
    min_cluster_size: int = Field(
        default=5,
        ge=2,
        le=50,
        description="Minimum posts to form a cluster.",
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "organization_id": "org-456",
                    "since": None,
                    "min_cluster_size": 5,
                }
            ]
        }
    }


class ClusterSummary(BaseModel):
    """Summary information about a cluster."""

    id: str
    name: str
    description: str | None
    member_count: int
    engagement_count: int
    is_trending: bool
    keywords: list[str]
    avg_emotional_intensity: float | None
    last_activity_at: datetime


class ClusterListResponse(BaseModel):
    """Response model for listing clusters."""

    clusters: list[ClusterSummary]
    total: int
    page: int
    page_size: int


class ClusterDetailResponse(BaseModel):
    """Response model for cluster details."""

    id: str
    name: str
    description: str | None
    themes: dict[str, Any]
    member_count: int
    engagement_count: int
    avg_emotional_intensity: float | None
    avg_risk_score: float | None
    is_trending: bool
    first_detected_at: datetime
    last_activity_at: datetime
    similar_clusters: list[dict[str, Any]]


class ClusterPostsResponse(BaseModel):
    """Response model for posts in a cluster."""

    cluster_id: str
    cluster_name: str
    posts: list[dict[str, Any]]
    total: int
    page: int
    page_size: int


class TrendingClustersResponse(BaseModel):
    """Response model for trending clusters."""

    trending: list[dict[str, Any]]
    time_window_hours: int


class ErrorResponse(BaseModel):
    """Standard error response."""

    detail: str
    error_code: str = "CLUSTERING_ERROR"


# ============================================================================
# API Endpoints
# ============================================================================


@router.post(
    "/assign",
    response_model=AssignPostResponse,
    status_code=status.HTTP_200_OK,
    summary="Assign post to cluster",
    description="Assign a new post to an existing cluster or create a new one.",
    responses={
        400: {"model": ErrorResponse, "description": "Invalid input"},
        500: {"model": ErrorResponse, "description": "Clustering error"},
    },
)
async def assign_post_to_cluster(request: AssignPostRequest) -> AssignPostResponse:
    """Assign a post to a cluster.

    This endpoint analyzes the post content and either:
    - Assigns it to an existing cluster if similar enough
    - Creates a new cluster placeholder for batch processing
    - Marks it as unclustered if no match found

    Args:
        request: AssignPostRequest with post details.

    Returns:
        AssignPostResponse with cluster assignment.
    """
    try:
        skill = ClusteringSkill()
        assignment = await skill.assign_to_cluster(
            post_text=request.text,
            post_id=request.post_id,
            org_id=request.organization_id,
        )

        return AssignPostResponse(
            cluster_id=assignment.cluster_id,
            cluster_name=assignment.cluster_name,
            similarity_score=assignment.similarity_score,
            is_new_cluster=assignment.is_new_cluster,
            themes=assignment.themes.model_dump() if assignment.themes else None,
        )

    except ValueError as e:
        logger.warning("Invalid input for clustering: %s", e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error("Clustering error: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Clustering failed: {str(e)}",
        )


@router.post(
    "/run",
    response_model=ClusteringOutput,
    status_code=status.HTTP_200_OK,
    summary="Run full clustering job",
    description="Re-cluster all posts for an organization.",
    responses={
        400: {"model": ErrorResponse, "description": "Invalid input"},
        500: {"model": ErrorResponse, "description": "Clustering error"},
    },
)
async def run_clustering_job(request: RunClusteringRequest) -> ClusteringOutput:
    """Run full clustering for an organization.

    This endpoint re-clusters all posts (or posts since a given date)
    for an organization, generating new clusters and themes.

    Args:
        request: RunClusteringRequest with organization details.

    Returns:
        ClusteringOutput with all clusters found.
    """
    try:
        skill = ClusteringSkill(min_cluster_size=request.min_cluster_size)
        result = await skill.run_full_clustering(
            org_id=request.organization_id,
            since=request.since,
        )

        return result

    except ValueError as e:
        logger.warning("Invalid input for clustering job: %s", e)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        logger.error("Clustering job error: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Clustering job failed: {str(e)}",
        )


@router.get(
    "/clusters",
    response_model=ClusterListResponse,
    status_code=status.HTTP_200_OK,
    summary="List clusters",
    description="List all clusters for an organization.",
)
async def list_clusters(
    organization_id: str = Query(..., description="Organization ID"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    sort_by: Literal["member_count", "last_activity", "name"] = Query(
        "last_activity",
        description="Sort field",
    ),
    sort_order: Literal["asc", "desc"] = Query("desc", description="Sort order"),
) -> ClusterListResponse:
    """List clusters for an organization.

    Args:
        organization_id: Organization identifier.
        page: Page number (1-indexed).
        page_size: Number of items per page.
        sort_by: Field to sort by.
        sort_order: Sort direction.

    Returns:
        ClusterListResponse with paginated clusters.
    """
    try:
        from src.db.supabase import get_supabase_client

        supabase = get_supabase_client()

        if not supabase.is_connected:
            return ClusterListResponse(
                clusters=[],
                total=0,
                page=page,
                page_size=page_size,
            )

        # Map sort field to database column
        sort_field_map = {
            "member_count": "member_count",
            "last_activity": "last_activity_at",
            "name": "name",
        }
        db_sort_field = sort_field_map[sort_by]

        # Query clusters
        query = supabase.table("clusters").select(
            "*", count="exact"
        ).eq("organization_id", organization_id).eq("is_active", True)

        # Apply sorting
        query = query.order(db_sort_field, desc=(sort_order == "desc"))

        # Apply pagination
        offset = (page - 1) * page_size
        query = query.range(offset, offset + page_size - 1)

        result = query.execute()

        clusters = [
            ClusterSummary(
                id=row["id"],
                name=row["name"],
                description=row.get("description"),
                member_count=row.get("member_count", 0),
                engagement_count=row.get("engagement_count", 0),
                is_trending=False,  # Calculate separately
                keywords=row.get("keywords", []),
                avg_emotional_intensity=row.get("avg_emotional_intensity"),
                last_activity_at=datetime.fromisoformat(
                    row.get("last_activity_at", datetime.utcnow().isoformat())
                ),
            )
            for row in result.data
        ]

        return ClusterListResponse(
            clusters=clusters,
            total=result.count or len(clusters),
            page=page,
            page_size=page_size,
        )

    except Exception as e:
        logger.error("Error listing clusters: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list clusters: {str(e)}",
        )


@router.get(
    "/clusters/{cluster_id}",
    response_model=ClusterDetailResponse,
    status_code=status.HTTP_200_OK,
    summary="Get cluster details",
    description="Get detailed information about a specific cluster.",
    responses={
        404: {"model": ErrorResponse, "description": "Cluster not found"},
    },
)
async def get_cluster_detail(cluster_id: str) -> ClusterDetailResponse:
    """Get detailed information about a cluster.

    Args:
        cluster_id: Cluster identifier.

    Returns:
        ClusterDetailResponse with full cluster details.
    """
    try:
        skill = ClusteringSkill()
        cluster = await skill.get_cluster_detail(cluster_id)

        if not cluster:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cluster {cluster_id} not found",
            )

        # Get similar clusters
        similar = await skill.get_similar_clusters(cluster_id, top_k=5)

        return ClusterDetailResponse(
            id=cluster.id,
            name=cluster.name,
            description=cluster.description,
            themes=cluster.themes.model_dump(),
            member_count=cluster.member_count,
            engagement_count=cluster.engagement_count,
            avg_emotional_intensity=cluster.avg_emotional_intensity,
            avg_risk_score=cluster.avg_risk_score,
            is_trending=cluster.is_trending,
            first_detected_at=cluster.first_detected_at,
            last_activity_at=cluster.last_activity_at,
            similar_clusters=[s.model_dump() for s in similar],
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error getting cluster detail: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get cluster: {str(e)}",
        )


@router.get(
    "/clusters/{cluster_id}/posts",
    response_model=ClusterPostsResponse,
    status_code=status.HTTP_200_OK,
    summary="Get posts in cluster",
    description="Get all posts belonging to a specific cluster.",
    responses={
        404: {"model": ErrorResponse, "description": "Cluster not found"},
    },
)
async def get_cluster_posts(
    cluster_id: str,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
) -> ClusterPostsResponse:
    """Get posts belonging to a cluster.

    Args:
        cluster_id: Cluster identifier.
        page: Page number (1-indexed).
        page_size: Number of items per page.

    Returns:
        ClusterPostsResponse with paginated posts.
    """
    try:
        from src.db.supabase import get_supabase_client

        supabase = get_supabase_client()

        if not supabase.is_connected:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database not available",
            )

        # Get cluster info
        cluster_result = supabase.table("clusters").select(
            "id, name"
        ).eq("id", cluster_id).single().execute()

        if not cluster_result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Cluster {cluster_id} not found",
            )

        # Get posts via cluster_members
        offset = (page - 1) * page_size
        members_result = supabase.table("cluster_members").select(
            "post_id, similarity_score, added_at, posts(id, content, external_url, author_handle, detected_at)",
            count="exact"
        ).eq("cluster_id", cluster_id).order(
            "similarity_score", desc=True
        ).range(offset, offset + page_size - 1).execute()

        posts = []
        for row in members_result.data:
            post_data = row.get("posts", {})
            if post_data:
                posts.append({
                    "id": post_data.get("id"),
                    "content": post_data.get("content", "")[:500],  # Truncate
                    "url": post_data.get("external_url"),
                    "author": post_data.get("author_handle"),
                    "detected_at": post_data.get("detected_at"),
                    "similarity_score": row.get("similarity_score"),
                    "added_at": row.get("added_at"),
                })

        return ClusterPostsResponse(
            cluster_id=cluster_id,
            cluster_name=cluster_result.data["name"],
            posts=posts,
            total=members_result.count or len(posts),
            page=page,
            page_size=page_size,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error getting cluster posts: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get cluster posts: {str(e)}",
        )


@router.get(
    "/trending",
    response_model=TrendingClustersResponse,
    status_code=status.HTTP_200_OK,
    summary="Get trending clusters",
    description="Get clusters with increasing activity.",
)
async def get_trending_clusters(
    organization_id: str = Query(..., description="Organization ID"),
    time_window_hours: int = Query(
        24,
        ge=1,
        le=168,
        description="Time window in hours for measuring growth",
    ),
    top_k: int = Query(10, ge=1, le=50, description="Number of results"),
) -> TrendingClustersResponse:
    """Get trending clusters for an organization.

    Args:
        organization_id: Organization identifier.
        time_window_hours: Time window in hours.
        top_k: Number of trending clusters to return.

    Returns:
        TrendingClustersResponse with trending clusters.
    """
    try:
        skill = ClusteringSkill()
        time_window = timedelta(hours=time_window_hours)

        trending = await skill.get_trending_clusters(
            org_id=organization_id,
            time_window=time_window,
            top_k=top_k,
        )

        return TrendingClustersResponse(
            trending=[t.model_dump() for t in trending],
            time_window_hours=time_window_hours,
        )

    except Exception as e:
        logger.error("Error getting trending clusters: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get trending clusters: {str(e)}",
        )
