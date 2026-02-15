# Build stage
FROM python:3.11-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy dependency files
COPY pyproject.toml ./

# Install dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir build && \
    pip wheel --no-cache-dir --wheel-dir /app/wheels -e .

# Production stage
FROM python:3.11-slim as production

WORKDIR /app

# Create non-root user for security
RUN groupadd -r appgroup && useradd -r -g appgroup appuser

# Copy wheels from builder
COPY --from=builder /app/wheels /wheels

# Install dependencies from wheels
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir /wheels/* && \
    rm -rf /wheels

# Copy application code
COPY src/ ./src/

# Change ownership to non-root user
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import httpx; httpx.get('http://localhost:8000/health')" || exit 1

# Run the application
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
