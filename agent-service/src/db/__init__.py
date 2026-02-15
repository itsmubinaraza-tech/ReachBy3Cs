"""Database module for the agent service."""

from src.db.supabase import get_supabase_client, SupabaseClient

__all__ = ["get_supabase_client", "SupabaseClient"]
