"""Embedding service for text vectorization.

This module provides services for generating text embeddings using
OpenAI's embedding models or compatible APIs.
"""

import logging
from typing import List

import httpx
import numpy as np

from src.config import get_settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for generating text embeddings.

    This service uses OpenAI's text-embedding API to convert text
    into high-dimensional vectors suitable for similarity search
    and clustering operations.

    Attributes:
        model: The embedding model to use.
        dimensions: The dimensionality of the embeddings.
    """

    def __init__(
        self,
        model: str = "text-embedding-3-small",
        api_base_url: str | None = None,
        api_key: str | None = None,
        timeout: float = 30.0,
    ) -> None:
        """Initialize the embedding service.

        Args:
            model: The embedding model to use.
            api_base_url: Optional override for the API base URL.
            api_key: Optional override for the API key.
            timeout: HTTP timeout for API requests in seconds.
        """
        settings = get_settings()

        self.model = model
        self.api_base_url = api_base_url or "https://api.openai.com/v1"
        self.api_key = api_key or settings.openai_api_key.get_secret_value()
        self.timeout = timeout
        self.dimensions = 1536  # Default for text-embedding-3-small

        # Batch size limits
        self.max_batch_size = 100
        self.max_tokens_per_request = 8000

    async def get_embedding(self, text: str) -> List[float]:
        """Get embedding vector for a single text.

        Args:
            text: The text to embed.

        Returns:
            List[float]: The embedding vector.

        Raises:
            ValueError: If text is empty.
            httpx.HTTPStatusError: If API request fails.
        """
        if not text or not text.strip():
            raise ValueError("Text cannot be empty")

        embeddings = await self.get_embeddings_batch([text])
        return embeddings[0]

    async def get_embeddings_batch(
        self,
        texts: List[str],
    ) -> List[List[float]]:
        """Get embeddings for multiple texts in a batch.

        Args:
            texts: List of texts to embed.

        Returns:
            List[List[float]]: List of embedding vectors.

        Raises:
            ValueError: If texts list is empty.
            httpx.HTTPStatusError: If API request fails.
        """
        if not texts:
            raise ValueError("Texts list cannot be empty")

        # Clean and validate texts
        cleaned_texts = [t.strip() for t in texts if t and t.strip()]
        if not cleaned_texts:
            raise ValueError("No valid texts provided")

        # Process in batches if needed
        all_embeddings: List[List[float]] = []

        for i in range(0, len(cleaned_texts), self.max_batch_size):
            batch = cleaned_texts[i : i + self.max_batch_size]
            batch_embeddings = await self._call_embedding_api(batch)
            all_embeddings.extend(batch_embeddings)

        return all_embeddings

    async def _call_embedding_api(
        self,
        texts: List[str],
    ) -> List[List[float]]:
        """Call the embedding API.

        Args:
            texts: List of texts to embed.

        Returns:
            List[List[float]]: List of embedding vectors.
        """
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        payload = {
            "model": self.model,
            "input": texts,
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(
                f"{self.api_base_url}/embeddings",
                headers=headers,
                json=payload,
            )
            response.raise_for_status()
            data = response.json()

        # Extract embeddings in order
        embeddings_data = sorted(data["data"], key=lambda x: x["index"])
        embeddings = [item["embedding"] for item in embeddings_data]

        logger.debug(
            "Generated embeddings for %d texts, total tokens: %d",
            len(texts),
            data.get("usage", {}).get("total_tokens", 0),
        )

        return embeddings

    def cosine_similarity(
        self,
        embedding1: List[float],
        embedding2: List[float],
    ) -> float:
        """Calculate cosine similarity between two embeddings.

        Args:
            embedding1: First embedding vector.
            embedding2: Second embedding vector.

        Returns:
            float: Cosine similarity score between -1 and 1.
        """
        vec1 = np.array(embedding1)
        vec2 = np.array(embedding2)

        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)

        if norm1 == 0 or norm2 == 0:
            return 0.0

        return float(dot_product / (norm1 * norm2))

    def find_most_similar(
        self,
        query_embedding: List[float],
        candidate_embeddings: List[List[float]],
        top_k: int = 10,
    ) -> List[tuple[int, float]]:
        """Find the most similar embeddings to a query.

        Args:
            query_embedding: The query embedding vector.
            candidate_embeddings: List of candidate embedding vectors.
            top_k: Number of top results to return.

        Returns:
            List[tuple[int, float]]: List of (index, similarity) tuples.
        """
        if not candidate_embeddings:
            return []

        query_vec = np.array(query_embedding)
        candidates_matrix = np.array(candidate_embeddings)

        # Compute cosine similarities
        query_norm = np.linalg.norm(query_vec)
        if query_norm == 0:
            return []

        candidate_norms = np.linalg.norm(candidates_matrix, axis=1)
        dot_products = np.dot(candidates_matrix, query_vec)

        # Handle zero norms
        with np.errstate(divide="ignore", invalid="ignore"):
            similarities = dot_products / (candidate_norms * query_norm)
            similarities = np.nan_to_num(similarities, nan=0.0)

        # Get top-k indices
        top_indices = np.argsort(similarities)[::-1][:top_k]

        return [(int(idx), float(similarities[idx])) for idx in top_indices]

    def compute_centroid(
        self,
        embeddings: List[List[float]],
    ) -> List[float]:
        """Compute the centroid of a list of embeddings.

        Args:
            embeddings: List of embedding vectors.

        Returns:
            List[float]: The centroid vector.
        """
        if not embeddings:
            return [0.0] * self.dimensions

        embeddings_array = np.array(embeddings)
        centroid = np.mean(embeddings_array, axis=0)

        # Normalize the centroid
        norm = np.linalg.norm(centroid)
        if norm > 0:
            centroid = centroid / norm

        return centroid.tolist()
