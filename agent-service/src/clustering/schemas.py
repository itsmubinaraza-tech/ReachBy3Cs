"""Pydantic schemas for the Clustering skill.

This module defines the input and output data models for clustering operations,
including cluster assignment, theme extraction, and trending detection.
"""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ClusteringInput(BaseModel):
    """Input schema for clustering a single post.

    Attributes:
        post_id: Unique identifier for the post.
        text: The post content to cluster.
        organization_id: Organization context for clustering.
    """

    post_id: str = Field(
        ...,
        description="Unique identifier for the post to cluster.",
    )
    text: str = Field(
        ...,
        min_length=1,
        max_length=10000,
        description="The post content to analyze and cluster.",
    )
    organization_id: str = Field(
        ...,
        description="Organization ID for multi-tenant clustering.",
    )


class ClusterThemes(BaseModel):
    """Extracted themes from a cluster.

    Attributes:
        main_theme: Primary theme of the cluster (2-5 words).
        keywords: Common keywords found in the cluster (5-10).
        sentiment: Overall sentiment of the cluster.
        description: Brief description of what the cluster represents.
    """

    main_theme: str = Field(
        ...,
        max_length=100,
        description="Primary theme of the cluster (2-5 words).",
    )
    keywords: list[str] = Field(
        default_factory=list,
        max_length=10,
        description="Common keywords found in the cluster.",
    )
    sentiment: str = Field(
        default="neutral",
        description="Overall sentiment: positive, negative, neutral, or mixed.",
    )
    description: str = Field(
        default="",
        max_length=500,
        description="Brief description of the cluster (1-2 sentences).",
    )


class ClusterMember(BaseModel):
    """A member post within a cluster.

    Attributes:
        post_id: Unique identifier for the post.
        text: Preview of the post content.
        similarity_score: How similar this post is to the cluster centroid.
        added_at: When the post was added to the cluster.
    """

    post_id: str = Field(description="Unique identifier for the post.")
    text: str = Field(description="Preview of the post content.")
    similarity_score: float = Field(
        ge=0.0,
        le=1.0,
        description="Similarity score to cluster centroid.",
    )
    added_at: datetime = Field(description="When the post was added.")


class ClusterInfo(BaseModel):
    """Full information about a cluster.

    Attributes:
        id: Unique cluster identifier.
        name: Human-readable cluster name.
        description: Brief description of the cluster.
        themes: Extracted themes and keywords.
        member_count: Number of posts in the cluster.
        engagement_count: Number of engagements in the cluster.
        avg_emotional_intensity: Average emotional intensity.
        avg_risk_score: Average risk score.
        is_trending: Whether the cluster is currently trending.
        first_detected_at: When the cluster was first created.
        last_activity_at: When the cluster had last activity.
    """

    id: str = Field(description="Unique cluster identifier.")
    name: str = Field(description="Human-readable cluster name.")
    description: str | None = Field(default=None, description="Brief description.")
    themes: ClusterThemes = Field(description="Extracted themes and keywords.")
    member_count: int = Field(default=0, ge=0, description="Number of posts.")
    engagement_count: int = Field(default=0, ge=0, description="Number of engagements.")
    avg_emotional_intensity: float | None = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Average emotional intensity.",
    )
    avg_risk_score: float | None = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Average risk score.",
    )
    is_trending: bool = Field(default=False, description="Whether trending.")
    first_detected_at: datetime = Field(description="When first created.")
    last_activity_at: datetime = Field(description="Last activity time.")


class ClusterAssignment(BaseModel):
    """Result of assigning a post to a cluster.

    Attributes:
        cluster_id: ID of the assigned cluster.
        cluster_name: Name of the assigned cluster.
        similarity_score: How similar the post is to the cluster.
        is_new_cluster: Whether a new cluster was created.
        themes: Themes of the cluster.
    """

    cluster_id: str = Field(description="ID of the assigned cluster.")
    cluster_name: str = Field(description="Name of the assigned cluster.")
    similarity_score: float = Field(
        ge=0.0,
        le=1.0,
        description="Similarity score to the cluster.",
    )
    is_new_cluster: bool = Field(
        default=False,
        description="Whether a new cluster was created.",
    )
    themes: ClusterThemes | None = Field(
        default=None,
        description="Themes of the cluster (if available).",
    )


class SimilarCluster(BaseModel):
    """A cluster similar to another cluster.

    Attributes:
        id: Cluster identifier.
        name: Cluster name.
        similarity_score: Similarity to the reference cluster.
        member_count: Number of posts in this cluster.
    """

    id: str = Field(description="Cluster identifier.")
    name: str = Field(description="Cluster name.")
    similarity_score: float = Field(
        ge=0.0,
        le=1.0,
        description="Similarity to the reference cluster.",
    )
    member_count: int = Field(default=0, ge=0, description="Number of posts.")


class TrendingCluster(BaseModel):
    """A trending cluster with growth metrics.

    Attributes:
        id: Cluster identifier.
        name: Cluster name.
        member_count: Current number of posts.
        recent_additions: Posts added in the time window.
        growth_rate: Percentage growth rate.
        themes: Cluster themes.
    """

    id: str = Field(description="Cluster identifier.")
    name: str = Field(description="Cluster name.")
    member_count: int = Field(default=0, ge=0, description="Current number of posts.")
    recent_additions: int = Field(
        default=0,
        ge=0,
        description="Posts added in the time window.",
    )
    growth_rate: float = Field(description="Percentage growth rate.")
    themes: ClusterThemes = Field(description="Cluster themes.")


class ClusteringOutput(BaseModel):
    """Output schema for full clustering operation.

    Attributes:
        clusters: List of all clusters found.
        total_posts: Total number of posts processed.
        unclustered_count: Number of posts not assigned to any cluster.
        processing_time_ms: Time taken to process.
    """

    clusters: list[ClusterInfo] = Field(
        default_factory=list,
        description="List of all clusters found.",
    )
    total_posts: int = Field(default=0, ge=0, description="Total posts processed.")
    unclustered_count: int = Field(
        default=0,
        ge=0,
        description="Posts not assigned to any cluster.",
    )
    processing_time_ms: int = Field(
        default=0,
        ge=0,
        description="Processing time in milliseconds.",
    )
    raw_analysis: dict[str, Any] = Field(
        default_factory=dict,
        description="Full analysis for audit trail.",
    )

    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "clusters": [
                        {
                            "id": "cluster-001",
                            "name": "Financial Communication Struggles",
                            "description": "People struggling to discuss finances with their partners.",
                            "themes": {
                                "main_theme": "relationship finances",
                                "keywords": ["money", "partner", "communicate", "budget", "spending"],
                                "sentiment": "negative",
                                "description": "Posts about difficulty discussing financial matters in relationships.",
                            },
                            "member_count": 142,
                            "engagement_count": 45,
                            "avg_emotional_intensity": 0.72,
                            "avg_risk_score": 0.25,
                            "is_trending": True,
                            "first_detected_at": "2026-02-10T10:00:00Z",
                            "last_activity_at": "2026-02-15T14:30:00Z",
                        }
                    ],
                    "total_posts": 500,
                    "unclustered_count": 23,
                    "processing_time_ms": 4500,
                    "raw_analysis": {},
                }
            ]
        }
    }
