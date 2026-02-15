"""Application configuration using pydantic-settings.

This module provides centralized configuration management for the agent service,
loading settings from environment variables with sensible defaults.
"""

from enum import Enum
from functools import lru_cache
from typing import Literal

from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Environment(str, Enum):
    """Application environment types."""

    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"
    TESTING = "testing"


class LLMProvider(str, Enum):
    """Supported LLM providers."""

    OPENAI = "openai"
    ANTHROPIC = "anthropic"


class Settings(BaseSettings):
    """Application settings loaded from environment variables.

    Attributes:
        app_name: Name of the application.
        app_env: Current environment (development, staging, production, testing).
        debug: Enable debug mode.
        log_level: Logging level.
        host: Server host address.
        port: Server port number.
        supabase_url: Supabase project URL.
        supabase_key: Supabase anonymous key.
        supabase_service_role_key: Supabase service role key for admin operations.
        openai_api_key: OpenAI API key.
        anthropic_api_key: Anthropic API key.
        llm_provider: LLM provider to use.
        llm_model: LLM model name.
        llm_temperature: Temperature for LLM responses.
        llm_max_tokens: Maximum tokens for LLM responses.
        agent_timeout_seconds: Timeout for agent operations.
        agent_max_iterations: Maximum iterations for agent loops.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application Settings
    app_name: str = Field(default="agent-service", description="Application name")
    app_env: Environment = Field(
        default=Environment.DEVELOPMENT, description="Application environment"
    )
    debug: bool = Field(default=False, description="Enable debug mode")
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = Field(
        default="INFO", description="Logging level"
    )

    # Server Configuration
    host: str = Field(default="0.0.0.0", description="Server host")
    port: int = Field(default=8000, ge=1, le=65535, description="Server port")

    # Supabase Configuration
    supabase_url: str = Field(
        default="", description="Supabase project URL"
    )
    supabase_key: SecretStr = Field(
        default=SecretStr(""), description="Supabase anonymous key"
    )
    supabase_service_role_key: SecretStr = Field(
        default=SecretStr(""), description="Supabase service role key"
    )

    # LLM API Keys
    openai_api_key: SecretStr = Field(
        default=SecretStr(""), description="OpenAI API key"
    )
    anthropic_api_key: SecretStr = Field(
        default=SecretStr(""), description="Anthropic API key"
    )

    # LLM Settings
    llm_provider: LLMProvider = Field(
        default=LLMProvider.OPENAI, description="LLM provider"
    )
    llm_model: str = Field(
        default="gpt-4-turbo-preview", description="LLM model name"
    )
    llm_temperature: float = Field(
        default=0.7, ge=0.0, le=2.0, description="LLM temperature"
    )
    llm_max_tokens: int = Field(
        default=4096, ge=1, description="Maximum tokens for LLM responses"
    )

    # Agent Configuration
    agent_timeout_seconds: int = Field(
        default=120, ge=1, description="Agent operation timeout in seconds"
    )
    agent_max_iterations: int = Field(
        default=10, ge=1, description="Maximum agent loop iterations"
    )

    @property
    def is_development(self) -> bool:
        """Check if running in development mode."""
        return self.app_env == Environment.DEVELOPMENT

    @property
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return self.app_env == Environment.PRODUCTION

    @property
    def is_testing(self) -> bool:
        """Check if running in testing mode."""
        return self.app_env == Environment.TESTING


@lru_cache
def get_settings() -> Settings:
    """Get cached application settings.

    Returns:
        Settings: Application settings instance.

    Note:
        Settings are cached using lru_cache for performance.
        Call get_settings.cache_clear() to reload settings.
    """
    return Settings()
