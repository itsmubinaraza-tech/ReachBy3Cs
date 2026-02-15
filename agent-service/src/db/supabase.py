"""Supabase client configuration and initialization.

This module provides a configured Supabase client for database operations
and authentication with the Supabase backend.
"""

import logging
from functools import lru_cache
from typing import Any

from supabase import Client, create_client

from src.config import get_settings

logger = logging.getLogger(__name__)


class SupabaseClient:
    """Wrapper for Supabase client with convenience methods.

    This class provides a singleton-like pattern for managing
    the Supabase client connection and common database operations.

    Attributes:
        client: The underlying Supabase client instance.
    """

    _instance: "SupabaseClient | None" = None
    _client: Client | None = None

    def __new__(cls) -> "SupabaseClient":
        """Create or return existing instance (singleton pattern).

        Returns:
            SupabaseClient: The singleton instance.
        """
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self) -> None:
        """Initialize the Supabase client if not already initialized."""
        if self._client is None:
            self._initialize_client()

    def _initialize_client(self) -> None:
        """Initialize the Supabase client with settings."""
        settings = get_settings()

        if not settings.supabase_url or not settings.supabase_key.get_secret_value():
            logger.warning(
                "Supabase URL or key not configured. "
                "Database operations will not be available."
            )
            return

        try:
            self._client = create_client(
                settings.supabase_url,
                settings.supabase_key.get_secret_value(),
            )
            logger.info("Supabase client initialized successfully")
        except Exception as e:
            logger.error("Failed to initialize Supabase client: %s", str(e))
            raise

    @property
    def client(self) -> Client | None:
        """Get the Supabase client instance.

        Returns:
            Client | None: The Supabase client or None if not initialized.
        """
        return self._client

    @property
    def is_connected(self) -> bool:
        """Check if the Supabase client is initialized.

        Returns:
            bool: True if client is initialized, False otherwise.
        """
        return self._client is not None

    async def health_check(self) -> bool:
        """Perform a health check on the Supabase connection.

        Returns:
            bool: True if connection is healthy, False otherwise.
        """
        if not self._client:
            return False

        try:
            # Perform a simple query to verify connection
            # This uses the built-in health check or a simple table query
            self._client.table("_health_check").select("*").limit(1).execute()
            return True
        except Exception as e:
            logger.warning("Supabase health check failed: %s", str(e))
            # Connection might still be valid even if table doesn't exist
            # Return True if it's just a "table not found" error
            if "does not exist" in str(e).lower():
                return True
            return False

    def table(self, table_name: str) -> Any:
        """Get a reference to a Supabase table.

        Args:
            table_name: Name of the table to query.

        Returns:
            Table reference for chaining queries.

        Raises:
            RuntimeError: If client is not initialized.
        """
        if not self._client:
            raise RuntimeError("Supabase client is not initialized")
        return self._client.table(table_name)

    def rpc(self, function_name: str, params: dict[str, Any] | None = None) -> Any:
        """Call a Supabase RPC function.

        Args:
            function_name: Name of the RPC function to call.
            params: Optional parameters to pass to the function.

        Returns:
            Result of the RPC call.

        Raises:
            RuntimeError: If client is not initialized.
        """
        if not self._client:
            raise RuntimeError("Supabase client is not initialized")
        return self._client.rpc(function_name, params or {})


@lru_cache
def get_supabase_client() -> SupabaseClient:
    """Get the cached Supabase client instance.

    Returns:
        SupabaseClient: The Supabase client wrapper instance.

    Note:
        The client is cached using lru_cache for performance.
        Call get_supabase_client.cache_clear() to reinitialize.
    """
    return SupabaseClient()
