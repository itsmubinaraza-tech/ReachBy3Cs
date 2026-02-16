# ReachBy3Cs Agent Service

AI-powered engagement detection and response generation service.

## Overview

This service provides:
- Signal Detection - Identifies engagement opportunities from social media posts
- Risk Scoring - Classifies risk levels for appropriate response
- Response Generation - Creates contextual, helpful responses
- CTA Classification - Determines appropriate call-to-action levels

## Tech Stack

- FastAPI - Web framework
- LangGraph - Agent orchestration
- OpenAI - LLM integration
- Supabase - Database
- SerpAPI - Platform crawling

## Running Locally

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env with your API keys

# Run the service
uvicorn src.main:app --reload
```

## API Endpoints

- `GET /health` - Health check
- `POST /api/skills/signal-detection` - Detect engagement signals
- `POST /api/skills/risk-scoring` - Score risk level
- `POST /api/skills/response-generation` - Generate responses

## Environment Variables

See `.env.example` for required configuration.
