"""Post clustering algorithm using HDBSCAN.

This module provides the core clustering functionality for grouping
similar posts into communities based on their embeddings.
"""

import logging
from dataclasses import dataclass
from typing import List

import numpy as np

logger = logging.getLogger(__name__)


@dataclass
class ClusterResult:
    """Result of clustering operation.

    Attributes:
        cluster_labels: Array of cluster labels for each post (-1 = noise/unclustered).
        cluster_probabilities: Probability of each point belonging to its cluster.
        num_clusters: Number of clusters found (excluding noise).
        noise_count: Number of points classified as noise.
    """

    cluster_labels: np.ndarray
    cluster_probabilities: np.ndarray
    num_clusters: int
    noise_count: int


class PostClusterer:
    """Clusterer for grouping similar posts using HDBSCAN.

    HDBSCAN (Hierarchical Density-Based Spatial Clustering of
    Applications with Noise) is well-suited for this task because:
    - It doesn't require specifying the number of clusters
    - It handles varying cluster densities
    - It identifies noise/outliers naturally

    Attributes:
        min_cluster_size: Minimum number of posts to form a cluster.
        min_samples: Minimum samples in a neighborhood for a point to be core.
        metric: Distance metric to use.
    """

    def __init__(
        self,
        min_cluster_size: int = 5,
        min_samples: int = 3,
        metric: str = "cosine",
        cluster_selection_epsilon: float = 0.0,
    ) -> None:
        """Initialize the clusterer.

        Args:
            min_cluster_size: Minimum posts to form a cluster.
            min_samples: Minimum samples for core point.
            metric: Distance metric ('cosine', 'euclidean', etc.).
            cluster_selection_epsilon: Epsilon for cluster selection.
        """
        self.min_cluster_size = min_cluster_size
        self.min_samples = min_samples
        self.metric = metric
        self.cluster_selection_epsilon = cluster_selection_epsilon

        # Lazy import HDBSCAN
        self._clusterer = None

    def _get_clusterer(self):
        """Get or create the HDBSCAN clusterer instance."""
        if self._clusterer is None:
            try:
                from sklearn.cluster import HDBSCAN
            except ImportError:
                # Fall back to hdbscan package
                from hdbscan import HDBSCAN

            self._clusterer = HDBSCAN(
                min_cluster_size=self.min_cluster_size,
                min_samples=self.min_samples,
                metric=self.metric,
                cluster_selection_epsilon=self.cluster_selection_epsilon,
                store_centers="centroid",
            )

        return self._clusterer

    def cluster(self, embeddings: np.ndarray) -> ClusterResult:
        """Cluster embeddings and return cluster labels.

        Args:
            embeddings: Array of shape (n_samples, n_features).

        Returns:
            ClusterResult: Clustering results with labels and metadata.
        """
        if len(embeddings) == 0:
            return ClusterResult(
                cluster_labels=np.array([]),
                cluster_probabilities=np.array([]),
                num_clusters=0,
                noise_count=0,
            )

        if len(embeddings) < self.min_cluster_size:
            # Not enough points for clustering
            logger.warning(
                "Only %d embeddings provided, less than min_cluster_size=%d",
                len(embeddings),
                self.min_cluster_size,
            )
            return ClusterResult(
                cluster_labels=np.full(len(embeddings), -1),
                cluster_probabilities=np.zeros(len(embeddings)),
                num_clusters=0,
                noise_count=len(embeddings),
            )

        # Ensure embeddings are normalized for cosine distance
        if self.metric == "cosine":
            norms = np.linalg.norm(embeddings, axis=1, keepdims=True)
            norms[norms == 0] = 1  # Avoid division by zero
            embeddings = embeddings / norms

        clusterer = self._get_clusterer()
        cluster_labels = clusterer.fit_predict(embeddings)

        # Get probabilities if available
        probabilities = getattr(clusterer, "probabilities_", None)
        if probabilities is None:
            probabilities = np.ones(len(embeddings))

        # Count clusters and noise
        unique_labels = set(cluster_labels)
        num_clusters = len(unique_labels) - (1 if -1 in unique_labels else 0)
        noise_count = int(np.sum(cluster_labels == -1))

        logger.info(
            "Clustered %d embeddings into %d clusters with %d noise points",
            len(embeddings),
            num_clusters,
            noise_count,
        )

        return ClusterResult(
            cluster_labels=cluster_labels,
            cluster_probabilities=probabilities,
            num_clusters=num_clusters,
            noise_count=noise_count,
        )

    def find_similar(
        self,
        embedding: np.ndarray,
        all_embeddings: np.ndarray,
        top_k: int = 10,
    ) -> List[tuple[int, float]]:
        """Find most similar posts to a given embedding.

        Uses cosine similarity to find the closest embeddings
        in the corpus.

        Args:
            embedding: Query embedding vector.
            all_embeddings: Array of all embedding vectors.
            top_k: Number of top similar results to return.

        Returns:
            List[tuple[int, float]]: List of (index, similarity_score) tuples.
        """
        if len(all_embeddings) == 0:
            return []

        # Normalize vectors for cosine similarity
        embedding_norm = embedding / np.linalg.norm(embedding)
        all_norms = np.linalg.norm(all_embeddings, axis=1, keepdims=True)
        all_norms[all_norms == 0] = 1
        normalized_embeddings = all_embeddings / all_norms

        # Compute cosine similarities
        similarities = np.dot(normalized_embeddings, embedding_norm)

        # Get top-k indices
        top_k = min(top_k, len(similarities))
        top_indices = np.argsort(similarities)[::-1][:top_k]

        return [(int(idx), float(similarities[idx])) for idx in top_indices]

    def get_cluster_centroids(
        self,
        embeddings: np.ndarray,
        cluster_labels: np.ndarray,
    ) -> dict[int, np.ndarray]:
        """Compute centroids for each cluster.

        Args:
            embeddings: Array of embedding vectors.
            cluster_labels: Cluster label for each embedding.

        Returns:
            dict[int, np.ndarray]: Mapping from cluster label to centroid.
        """
        centroids = {}
        unique_labels = set(cluster_labels)

        for label in unique_labels:
            if label == -1:
                continue  # Skip noise cluster

            mask = cluster_labels == label
            cluster_embeddings = embeddings[mask]
            centroid = np.mean(cluster_embeddings, axis=0)

            # Normalize the centroid
            norm = np.linalg.norm(centroid)
            if norm > 0:
                centroid = centroid / norm

            centroids[label] = centroid

        return centroids

    def assign_to_existing_cluster(
        self,
        embedding: np.ndarray,
        cluster_centroids: dict[int, np.ndarray],
        similarity_threshold: float = 0.7,
    ) -> tuple[int | None, float]:
        """Assign an embedding to an existing cluster if similar enough.

        Args:
            embedding: The embedding to assign.
            cluster_centroids: Dict mapping cluster IDs to centroids.
            similarity_threshold: Minimum similarity to assign.

        Returns:
            tuple[int | None, float]: (cluster_id, similarity) or (None, 0.0).
        """
        if not cluster_centroids:
            return None, 0.0

        # Normalize the embedding
        embedding_norm = embedding / np.linalg.norm(embedding)

        best_cluster = None
        best_similarity = 0.0

        for cluster_id, centroid in cluster_centroids.items():
            similarity = float(np.dot(embedding_norm, centroid))

            if similarity > best_similarity:
                best_similarity = similarity
                best_cluster = cluster_id

        if best_similarity >= similarity_threshold:
            return best_cluster, best_similarity

        return None, best_similarity

    def merge_clusters(
        self,
        embeddings: np.ndarray,
        cluster_labels: np.ndarray,
        merge_threshold: float = 0.85,
    ) -> np.ndarray:
        """Merge clusters that are very similar.

        Args:
            embeddings: Array of embedding vectors.
            cluster_labels: Current cluster labels.
            merge_threshold: Similarity threshold for merging.

        Returns:
            np.ndarray: Updated cluster labels after merging.
        """
        centroids = self.get_cluster_centroids(embeddings, cluster_labels)

        if len(centroids) < 2:
            return cluster_labels

        # Find pairs of clusters to merge
        cluster_ids = list(centroids.keys())
        merge_map = {cid: cid for cid in cluster_ids}

        for i, cid1 in enumerate(cluster_ids):
            for cid2 in cluster_ids[i + 1 :]:
                centroid1 = centroids[cid1]
                centroid2 = centroids[cid2]

                similarity = float(np.dot(centroid1, centroid2))

                if similarity >= merge_threshold:
                    # Merge smaller cluster into larger
                    count1 = np.sum(cluster_labels == cid1)
                    count2 = np.sum(cluster_labels == cid2)

                    if count1 >= count2:
                        merge_map[cid2] = merge_map[cid1]
                    else:
                        merge_map[cid1] = merge_map[cid2]

        # Apply merges
        new_labels = cluster_labels.copy()
        for old_id, new_id in merge_map.items():
            if old_id != new_id:
                new_labels[cluster_labels == old_id] = new_id

        # Renumber clusters to be contiguous
        unique_labels = sorted(set(new_labels) - {-1})
        label_map = {old: new for new, old in enumerate(unique_labels)}
        label_map[-1] = -1

        return np.array([label_map[label] for label in new_labels])
