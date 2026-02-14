# Needs-Matched Engagement Platform - Architecture & Data Flow

## Table of Contents
1. [High-Level Architecture](#high-level-architecture)
2. [Component Details](#component-details)
3. [Agent Teams & Skills Architecture](#agent-teams--skills-architecture)
4. [Data Flow - End to End](#data-flow---end-to-end)
5. [Database Schema Overview](#database-schema-overview)
6. [API Architecture](#api-architecture)
7. [Real-Time Sync Architecture](#real-time-sync-architecture)

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    FRONTEND LAYER                                        │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐                 │
│   │   Web App        │    │   Mobile App     │    │   Tablet App     │                 │
│   │   (Next.js)      │    │   (Expo/RN)      │    │   (Responsive)   │                 │
│   │                  │    │                  │    │                  │                 │
│   │  • Dashboard     │    │  • Swipe Queue   │    │  • Hybrid UI     │                 │
│   │  • Queue Review  │    │  • Push Notify   │    │  • Touch + KB    │                 │
│   │  • Analytics     │    │  • Biometric     │    │  • Split View    │                 │
│   │  • Settings      │    │  • Offline Mode  │    │                  │                 │
│   └────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘                 │
│            │                       │                       │                            │
│            └───────────────────────┼───────────────────────┘                            │
│                                    │                                                     │
│                    ┌───────────────▼───────────────┐                                    │
│                    │      Shared Packages          │                                    │
│                    │  • shared-types (TypeScript)  │                                    │
│                    │  • api-client (Supabase SDK)  │                                    │
│                    │  • shared-utils (Formatting)  │                                    │
│                    └───────────────┬───────────────┘                                    │
│                                    │                                                     │
└────────────────────────────────────┼────────────────────────────────────────────────────┘
                                     │
                                     │ HTTPS / WebSocket
                                     │
┌────────────────────────────────────┼────────────────────────────────────────────────────┐
│                                    │         BACKEND LAYER                               │
├────────────────────────────────────┼────────────────────────────────────────────────────┤
│                                    │                                                     │
│   ┌────────────────────────────────▼────────────────────────────────────────────┐       │
│   │                           SUPABASE                                           │       │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │       │
│   │  │   Auth      │  │  Database   │  │  Realtime   │  │   Storage   │        │       │
│   │  │             │  │ (PostgreSQL)│  │ (WebSocket) │  │   (S3)      │        │       │
│   │  │ • JWT       │  │ • RLS       │  │ • Live Sync │  │ • Assets    │        │       │
│   │  │ • OAuth     │  │ • Triggers  │  │ • Presence  │  │ • Uploads   │        │       │
│   │  │ • MFA       │  │ • Functions │  │             │  │             │        │       │
│   │  └─────────────┘  └──────┬──────┘  └─────────────┘  └─────────────┘        │       │
│   │                          │                                                   │       │
│   └──────────────────────────┼───────────────────────────────────────────────────┘       │
│                              │                                                           │
│                              │ Database Triggers / Webhooks                              │
│                              │                                                           │
│   ┌──────────────────────────▼───────────────────────────────────────────────────┐      │
│   │                    PYTHON AGENT SERVICE (FastAPI + LangGraph)                 │      │
│   │                                                                               │      │
│   │   ┌─────────────────────────────────────────────────────────────────────┐    │      │
│   │   │                      ENGAGEMENT PIPELINE                             │    │      │
│   │   │                                                                      │    │      │
│   │   │   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌──────┐ │    │      │
│   │   │   │ Signal  │──▶│  Risk   │──▶│Response │──▶│   CTA   │──▶│ CTS  │ │    │      │
│   │   │   │Detection│   │ Scoring │   │  Gen    │   │Classify │   │Score │ │    │      │
│   │   │   └─────────┘   └─────────┘   └─────────┘   └─────────┘   └──────┘ │    │      │
│   │   │                                                                      │    │      │
│   │   └─────────────────────────────────────────────────────────────────────┘    │      │
│   │                                                                               │      │
│   │   ┌───────────────┐   ┌───────────────┐   ┌───────────────┐                  │      │
│   │   │   Crawlers    │   │   Clustering  │   │   Posting     │                  │      │
│   │   │ • Reddit      │   │ • Embeddings  │   │ • API Post    │                  │      │
│   │   │ • Twitter     │   │ • Similarity  │   │ • Clipboard   │                  │      │
│   │   │ • Quora       │   │ • Themes      │   │ • Scheduler   │                  │      │
│   │   │ • Google      │   │               │   │               │                  │      │
│   │   └───────────────┘   └───────────────┘   └───────────────┘                  │      │
│   │                                                                               │      │
│   └───────────────────────────────────────────────────────────────────────────────┘      │
│                              │                                                           │
└──────────────────────────────┼───────────────────────────────────────────────────────────┘
                               │
                               │ API Calls
                               │
┌──────────────────────────────┼───────────────────────────────────────────────────────────┐
│                              │         LLM INFERENCE LAYER                               │
├──────────────────────────────┼───────────────────────────────────────────────────────────┤
│                              │                                                           │
│   ┌──────────────────────────▼───────────────────────────────────────────────────┐      │
│   │                         GPU CLOUD (RunPod / Modal)                            │      │
│   │                                                                               │      │
│   │   ┌───────────────────────────────────────────────────────────────────────┐  │      │
│   │   │                    vLLM / TGI Inference Server                         │  │      │
│   │   │                                                                        │  │      │
│   │   │    ┌─────────────────┐              ┌─────────────────┐               │  │      │
│   │   │    │   Llama 3.1     │              │    Mistral      │               │  │      │
│   │   │    │   (70B/8B)      │              │   (7B/Mixtral)  │               │  │      │
│   │   │    │                 │              │                 │               │  │      │
│   │   │    │ • Signal Det    │              │ • Response Gen  │               │  │      │
│   │   │    │ • Risk Score    │              │ • CTA Classify  │               │  │      │
│   │   │    └─────────────────┘              └─────────────────┘               │  │      │
│   │   │                                                                        │  │      │
│   │   └───────────────────────────────────────────────────────────────────────┘  │      │
│   │                                                                               │      │
│   └───────────────────────────────────────────────────────────────────────────────┘      │
│                                                                                          │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Details

### Frontend Applications

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Web App** | Next.js 14, React, Tailwind | Primary dashboard for queue management, analytics, settings |
| **Mobile App** | Expo, React Native | On-the-go approvals with swipe gestures, push notifications |
| **Shared Packages** | TypeScript | Type safety and code reuse across platforms |

### Backend Services

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Supabase** | PostgreSQL, GoTrue, Realtime | Database, auth, real-time subscriptions |
| **Agent Service** | Python, FastAPI, LangGraph | AI pipeline orchestration, crawling, posting |
| **LLM Inference** | vLLM, Llama 3.1, Mistral | Natural language processing for all AI skills |

---

## Agent Teams & Skills Architecture

This section details where AI agents and skills are involved throughout the system.

### Agent Orchestration Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                            LANGGRAPH AGENT ORCHESTRATION                                 │
└─────────────────────────────────────────────────────────────────────────────────────────┘

    The system uses LangGraph to orchestrate multiple specialized agents working together.
    Each agent team handles a specific domain, and skills are the atomic units of work.

    ┌─────────────────────────────────────────────────────────────────────────────────────┐
    │                                                                                      │
    │                           ┌─────────────────────────┐                               │
    │                           │    MASTER ORCHESTRATOR   │                               │
    │                           │       (LangGraph)        │                               │
    │                           │                         │                               │
    │                           │  • Routes tasks to teams │                               │
    │                           │  • Manages state         │                               │
    │                           │  • Handles failures      │                               │
    │                           │  • Tracks progress       │                               │
    │                           └───────────┬─────────────┘                               │
    │                                       │                                              │
    │           ┌───────────────────────────┼───────────────────────────┐                 │
    │           │                           │                           │                 │
    │           ▼                           ▼                           ▼                 │
    │   ┌───────────────┐          ┌───────────────┐          ┌───────────────┐          │
    │   │  DISCOVERY    │          │  PROCESSING   │          │   COMMUNITY   │          │
    │   │  AGENT TEAM   │          │  AGENT TEAM   │          │  AGENT TEAM   │          │
    │   │               │          │               │          │               │          │
    │   │  Crawling &   │          │  AI Pipeline  │          │  Clustering & │          │
    │   │  Detection    │          │  Execution    │          │  Insights     │          │
    │   └───────────────┘          └───────────────┘          └───────────────┘          │
    │                                                                                      │
    └─────────────────────────────────────────────────────────────────────────────────────┘
```

### Agent Team 1: Discovery Agents

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              DISCOVERY AGENT TEAM                                        │
│                                                                                          │
│  PURPOSE: Find and collect relevant content from external platforms                      │
│  TRIGGER: Scheduled (4x daily) or Manual                                                │
│  OUTPUT: New posts in database ready for processing                                     │
└─────────────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────────────────────┐
    │                                                                                      │
    │   ┌─────────────────────────────────────────────────────────────────────────────┐   │
    │   │                         CRAWLER COORDINATOR AGENT                            │   │
    │   │                                                                              │   │
    │   │   Role: Manages all platform crawlers, handles scheduling, rate limiting    │   │
    │   │   State: { platforms_to_crawl, rate_limits, last_crawl_times }              │   │
    │   │                                                                              │   │
    │   └───────────────────────────────────────────────────────────────────────────────┘   │
    │                                         │                                            │
    │              ┌──────────────────────────┼──────────────────────────┐                │
    │              │                          │                          │                │
    │              ▼                          ▼                          ▼                │
    │   ┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐      │
    │   │  REDDIT CRAWLER     │   │  TWITTER CRAWLER    │   │  QUORA CRAWLER      │      │
    │   │  AGENT              │   │  AGENT              │   │  AGENT              │      │
    │   │                     │   │                     │   │                     │      │
    │   │  Skills:            │   │  Skills:            │   │  Skills:            │      │
    │   │  • subreddit_scan   │   │  • search_tweets    │   │  • question_scan    │      │
    │   │  • comment_extract  │   │  • thread_expand    │   │  • answer_extract   │      │
    │   │  • author_filter    │   │  • filter_bots      │   │  • topic_filter     │      │
    │   │  • dedupe_check     │   │  • dedupe_check     │   │  • dedupe_check     │      │
    │   │                     │   │                     │   │                     │      │
    │   │  API: PRAW          │   │  API: Twitter v2    │   │  Method: Scraping   │      │
    │   └─────────────────────┘   └─────────────────────┘   └─────────────────────┘      │
    │              │                          │                          │                │
    │              └──────────────────────────┼──────────────────────────┘                │
    │                                         │                                            │
    │                                         ▼                                            │
    │   ┌─────────────────────────────────────────────────────────────────────────────┐   │
    │   │                         CONTENT VALIDATOR AGENT                              │   │
    │   │                                                                              │   │
    │   │   Role: Validates content quality, filters spam, checks language            │   │
    │   │   Skills:                                                                    │   │
    │   │   • language_detect      - Ensure content is in supported language          │   │
    │   │   • spam_filter          - Remove obvious spam/promotional content          │   │
    │   │   • quality_score        - Score content relevance (keyword match)          │   │
    │   │   • duplicate_check      - Check against existing posts in DB               │   │
    │   │                                                                              │   │
    │   │   Output: Validated posts → Database                                        │   │
    │   └─────────────────────────────────────────────────────────────────────────────┘   │
    │                                                                                      │
    └─────────────────────────────────────────────────────────────────────────────────────┘

    WHERE IN SYSTEM:
    ┌─────────────────────────────────────────────────────────────────────────────────────┐
    │                                                                                      │
    │   External          Discovery           Database                                    │
    │   Platforms    →    Agent Team     →    (posts table)                              │
    │                                                                                      │
    │   Reddit ─────┐                         ┌─────────────┐                             │
    │   Twitter ────┼──▶  [Crawl + Validate] ──▶│   posts     │                             │
    │   Quora ──────┤                         │  (new rows) │                             │
    │   Google ─────┘                         └─────────────┘                             │
    │                                                                                      │
    └─────────────────────────────────────────────────────────────────────────────────────┘
```

### Agent Team 2: Processing Agents (Core AI Pipeline)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              PROCESSING AGENT TEAM                                       │
│                                                                                          │
│  PURPOSE: Analyze posts and generate engagement responses                               │
│  TRIGGER: New post inserted in database (via trigger)                                   │
│  OUTPUT: Responses ready for review queue                                               │
└─────────────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────────────────────┐
    │                                                                                      │
    │   ┌─────────────────────────────────────────────────────────────────────────────┐   │
    │   │                      PIPELINE COORDINATOR AGENT                              │   │
    │   │                                                                              │   │
    │   │   Role: Orchestrates the 5-skill pipeline, manages state transitions        │   │
    │   │   State: { post_id, current_skill, skill_outputs, errors }                  │   │
    │   │                                                                              │   │
    │   │   LangGraph State Machine:                                                  │   │
    │   │   START → signal → risk → response → cta → cts → END                       │   │
    │   │                                                                              │   │
    │   └───────────────────────────────────────────────────────────────────────────────┘   │
    │                                         │                                            │
    │                    ┌────────────────────┴────────────────────┐                      │
    │                    │              SKILL AGENTS               │                      │
    │                    │         (Sequential Execution)          │                      │
    │                    └────────────────────┬────────────────────┘                      │
    │                                         │                                            │
    │   ┌─────────────────────────────────────┼─────────────────────────────────────┐     │
    │   │                                     │                                      │     │
    │   │  ┌──────────────────────────────────▼──────────────────────────────────┐  │     │
    │   │  │  SKILL 1: SIGNAL DETECTION AGENT                                    │  │     │
    │   │  │  ════════════════════════════════                                   │  │     │
    │   │  │                                                                      │  │     │
    │   │  │  Purpose: Identify engagement signals in post content               │  │     │
    │   │  │                                                                      │  │     │
    │   │  │  Input:  { post_content: string }                                   │  │     │
    │   │  │                                                                      │  │     │
    │   │  │  Skills (Sub-tasks):                                                │  │     │
    │   │  │  ┌────────────────────────────────────────────────────────────────┐ │  │     │
    │   │  │  │  • problem_categorize   → Classify into problem taxonomy       │ │  │     │
    │   │  │  │  • emotion_analyze      → Score emotional intensity (0-1)      │ │  │     │
    │   │  │  │  • keyword_extract      → Extract relevant keywords            │ │  │     │
    │   │  │  │  • confidence_score     → Calculate detection confidence       │ │  │     │
    │   │  │  └────────────────────────────────────────────────────────────────┘ │  │     │
    │   │  │                                                                      │  │     │
    │   │  │  LLM Used: Llama 3.1 70B (high accuracy needed)                    │  │     │
    │   │  │                                                                      │  │     │
    │   │  │  Output: { problem_category, emotional_intensity,                   │  │     │
    │   │  │           keywords[], confidence }                                  │  │     │
    │   │  │                                                                      │  │     │
    │   │  │  Stored: signals table + raw_llm_response                          │  │     │
    │   │  └──────────────────────────────────────────────────────────────────────┘  │     │
    │   │                                     │                                      │     │
    │   │                                     ▼                                      │     │
    │   │  ┌──────────────────────────────────────────────────────────────────────┐  │     │
    │   │  │  SKILL 2: RISK SCORING AGENT                                        │  │     │
    │   │  │  ═══════════════════════════                                        │  │     │
    │   │  │                                                                      │  │     │
    │   │  │  Purpose: Assess risk level for engaging with the post              │  │     │
    │   │  │                                                                      │  │     │
    │   │  │  Input:  { signal_output, post_content }                            │  │     │
    │   │  │                                                                      │  │     │
    │   │  │  Skills (Sub-tasks):                                                │  │     │
    │   │  │  ┌────────────────────────────────────────────────────────────────┐ │  │     │
    │   │  │  │  • crisis_detect        → Check for self-harm, violence        │ │  │     │
    │   │  │  │  • sensitivity_check    → Flag sensitive topics                │ │  │     │
    │   │  │  │  • context_analyze      → Understand broader context           │ │  │     │
    │   │  │  │  • risk_calculate       → Compute final risk score             │ │  │     │
    │   │  │  └────────────────────────────────────────────────────────────────┘ │  │     │
    │   │  │                                                                      │  │     │
    │   │  │  LLM Used: Llama 3.1 70B (safety critical)                         │  │     │
    │   │  │                                                                      │  │     │
    │   │  │  Risk Levels:                                                       │  │     │
    │   │  │  ┌────────┬─────────────────────────────────────────────────────┐  │  │     │
    │   │  │  │  LOW   │ Safe to engage, auto-post eligible                  │  │  │     │
    │   │  │  │ MEDIUM │ Requires human review                               │  │  │     │
    │   │  │  │  HIGH  │ Requires senior review                              │  │  │     │
    │   │  │  │BLOCKED │ DO NOT ENGAGE - crisis/harmful content              │  │  │     │
    │   │  │  └────────┴─────────────────────────────────────────────────────┘  │  │     │
    │   │  │                                                                      │  │     │
    │   │  │  Output: { risk_level, risk_score, context_flags[],                 │  │     │
    │   │  │           recommended_action }                                      │  │     │
    │   │  │                                                                      │  │     │
    │   │  │  Stored: risk_scores table + raw_llm_response                      │  │     │
    │   │  │                                                                      │  │     │
    │   │  │  ⚠️  If risk_level == BLOCKED → Pipeline STOPS here               │  │     │
    │   │  └──────────────────────────────────────────────────────────────────────┘  │     │
    │   │                                     │                                      │     │
    │   │                                     ▼                                      │     │
    │   │  ┌──────────────────────────────────────────────────────────────────────┐  │     │
    │   │  │  SKILL 3: RESPONSE GENERATION AGENT                                 │  │     │
    │   │  │  ══════════════════════════════════                                 │  │     │
    │   │  │                                                                      │  │     │
    │   │  │  Purpose: Generate helpful, contextual engagement responses         │  │     │
    │   │  │                                                                      │  │     │
    │   │  │  Input:  { post_content, signal_output, risk_output }               │  │     │
    │   │  │                                                                      │  │     │
    │   │  │  Skills (Sub-tasks):                                                │  │     │
    │   │  │  ┌────────────────────────────────────────────────────────────────┐ │  │     │
    │   │  │  │  • value_first_gen      → Pure value response, zero CTA        │ │  │     │
    │   │  │  │  • soft_cta_gen         → Value + subtle product hint          │ │  │     │
    │   │  │  │  • contextual_gen       → Context-specific response            │ │  │     │
    │   │  │  │  • tone_adapt           → Match platform culture (Reddit vs X) │ │  │     │
    │   │  │  │  • length_optimize      → Ensure appropriate length            │ │  │     │
    │   │  │  └────────────────────────────────────────────────────────────────┘ │  │     │
    │   │  │                                                                      │  │     │
    │   │  │  LLM Used: Mistral 7B or Mixtral (fast, good quality)              │  │     │
    │   │  │                                                                      │  │     │
    │   │  │  Output: { value_first_response, soft_cta_response,                 │  │     │
    │   │  │           contextual_response }                                     │  │     │
    │   │  │                                                                      │  │     │
    │   │  │  Stored: responses table (ALL 3 variants retained)                 │  │     │
    │   │  └──────────────────────────────────────────────────────────────────────┘  │     │
    │   │                                     │                                      │     │
    │   │                                     ▼                                      │     │
    │   │  ┌──────────────────────────────────────────────────────────────────────┐  │     │
    │   │  │  SKILL 4: CTA CLASSIFIER AGENT                                      │  │     │
    │   │  │  ═════════════════════════════                                      │  │     │
    │   │  │                                                                      │  │     │
    │   │  │  Purpose: Classify CTA intensity of each response variant           │  │     │
    │   │  │                                                                      │  │     │
    │   │  │  Input:  { response_variants }                                      │  │     │
    │   │  │                                                                      │  │     │
    │   │  │  Skills (Sub-tasks):                                                │  │     │
    │   │  │  ┌────────────────────────────────────────────────────────────────┐ │  │     │
    │   │  │  │  • cta_detect           → Find promotional language            │ │  │     │
    │   │  │  │  • cta_level_score      → Score 0-3                            │ │  │     │
    │   │  │  │  • link_detect          → Check for links/mentions             │ │  │     │
    │   │  │  └────────────────────────────────────────────────────────────────┘ │  │     │
    │   │  │                                                                      │  │     │
    │   │  │  CTA Levels:                                                        │  │     │
    │   │  │  ┌───────┬──────────────────────────────────────────────────────┐  │  │     │
    │   │  │  │   0   │ No CTA - pure value only                             │  │  │     │
    │   │  │  │   1   │ Soft CTA - subtle hint, no direct mention            │  │  │     │
    │   │  │  │   2   │ Medium CTA - clear mention with soft push            │  │  │     │
    │   │  │  │   3   │ Direct CTA - explicit call to action with link       │  │  │     │
    │   │  │  └───────┴──────────────────────────────────────────────────────┘  │  │     │
    │   │  │                                                                      │  │     │
    │   │  │  Output: { cta_level, cta_analysis }                                │  │     │
    │   │  │                                                                      │  │     │
    │   │  │  Selection Logic: Choose response based on risk + CTA rules        │  │     │
    │   │  └──────────────────────────────────────────────────────────────────────┘  │     │
    │   │                                     │                                      │     │
    │   │                                     ▼                                      │     │
    │   │  ┌──────────────────────────────────────────────────────────────────────┐  │     │
    │   │  │  SKILL 5: CTS (CONFIDENCE TO SEND) DECISION AGENT                   │  │     │
    │   │  │  ════════════════════════════════════════════                       │  │     │
    │   │  │                                                                      │  │     │
    │   │  │  Purpose: Calculate final confidence score, decide auto-post        │  │     │
    │   │  │                                                                      │  │     │
    │   │  │  Input:  { signal_output, risk_output, cta_output }                 │  │     │
    │   │  │                                                                      │  │     │
    │   │  │  Skills (Sub-tasks):                                                │  │     │
    │   │  │  ┌────────────────────────────────────────────────────────────────┐ │  │     │
    │   │  │  │  • cts_calculate        → Weighted formula calculation         │ │  │     │
    │   │  │  │  • auto_post_decide     → Apply eligibility rules              │ │  │     │
    │   │  │  │  • priority_score       → Calculate queue priority             │ │  │     │
    │   │  │  └────────────────────────────────────────────────────────────────┘ │  │     │
    │   │  │                                                                      │  │     │
    │   │  │  CTS Formula:                                                       │  │     │
    │   │  │  ┌──────────────────────────────────────────────────────────────┐  │  │     │
    │   │  │  │  CTS = (signal_confidence × 0.4) +                           │  │  │     │
    │   │  │  │        (1 - risk_score × 0.3) +                              │  │  │     │
    │   │  │  │        (cta_appropriateness × 0.3)                           │  │  │     │
    │   │  │  └──────────────────────────────────────────────────────────────┘  │  │     │
    │   │  │                                                                      │  │     │
    │   │  │  Auto-Post Eligibility:                                             │  │     │
    │   │  │  ┌──────────────────────────────────────────────────────────────┐  │  │     │
    │   │  │  │  ✓ CTS >= 0.7                                                │  │  │     │
    │   │  │  │  ✓ risk_level == 'low'                                       │  │  │     │
    │   │  │  │  ✓ cta_level <= 1                                            │  │  │     │
    │   │  │  │  ✓ automation_enabled == true (org setting)                  │  │  │     │
    │   │  │  └──────────────────────────────────────────────────────────────┘  │  │     │
    │   │  │                                                                      │  │     │
    │   │  │  Output: { cts_score, can_auto_post, priority }                     │  │     │
    │   │  │                                                                      │  │     │
    │   │  │  Stored: responses table (updated) + engagement_queue               │  │     │
    │   │  └──────────────────────────────────────────────────────────────────────┘  │     │
    │   │                                                                            │     │
    │   └────────────────────────────────────────────────────────────────────────────┘     │
    │                                                                                      │
    └─────────────────────────────────────────────────────────────────────────────────────┘

    WHERE IN SYSTEM:
    ┌─────────────────────────────────────────────────────────────────────────────────────┐
    │                                                                                      │
    │   Database              Processing            Database                               │
    │   (new post)       →    Agent Team       →    (response + queue)                    │
    │                                                                                      │
    │   ┌──────────┐                                ┌──────────────┐                      │
    │   │  posts   │                                │   signals    │                      │
    │   │ (INSERT) │ ──▶ [5-Skill Pipeline] ──▶    │ risk_scores  │                      │
    │   └──────────┘                                │  responses   │                      │
    │        │                                      │    queue     │                      │
    │        │ DB Trigger                           └──────────────┘                      │
    │        ▼                                                                            │
    │   Pipeline Start                                                                    │
    │                                                                                      │
    └─────────────────────────────────────────────────────────────────────────────────────┘
```

### Agent Team 3: Community Agents

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              COMMUNITY AGENT TEAM                                        │
│                                                                                          │
│  PURPOSE: Detect patterns, cluster similar content, build communities                   │
│  TRIGGER: Scheduled (hourly) or threshold-based (100+ new posts)                        │
│  OUTPUT: Cluster assignments and community insights                                      │
└─────────────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────────────────────┐
    │                                                                                      │
    │   ┌─────────────────────────────────────────────────────────────────────────────┐   │
    │   │                      CLUSTERING COORDINATOR AGENT                            │   │
    │   │                                                                              │   │
    │   │   Role: Manages embedding generation and clustering operations              │   │
    │   │   State: { posts_to_cluster, existing_clusters, similarity_threshold }      │   │
    │   │                                                                              │   │
    │   └───────────────────────────────────────────────────────────────────────────────┘   │
    │                                         │                                            │
    │                    ┌────────────────────┴────────────────────┐                      │
    │                    ▼                                         ▼                      │
    │   ┌─────────────────────────────┐           ┌─────────────────────────────┐        │
    │   │  EMBEDDING AGENT            │           │  CLUSTER AGENT              │        │
    │   │                             │           │                             │        │
    │   │  Skills:                    │           │  Skills:                    │        │
    │   │  • text_embed               │     →     │  • similarity_compute       │        │
    │   │    Convert post + keywords  │           │  • cluster_assign           │        │
    │   │    to 1536-dim vector       │           │  • cluster_create           │        │
    │   │                             │           │  • cluster_merge            │        │
    │   │  Model: text-embedding-3    │           │                             │        │
    │   │                             │           │  Algorithm: HDBSCAN         │        │
    │   └─────────────────────────────┘           └───────────────┬─────────────┘        │
    │                                                             │                      │
    │                                                             ▼                      │
    │   ┌─────────────────────────────────────────────────────────────────────────────┐  │
    │   │                         INSIGHT AGENT                                        │  │
    │   │                                                                              │  │
    │   │   Skills:                                                                    │  │
    │   │   • theme_extract         → Identify common themes in cluster               │  │
    │   │   • summary_generate      → AI-generated cluster description                │  │
    │   │   • trend_detect          → Identify trending topics                        │  │
    │   │   • growth_track          → Track cluster growth over time                  │  │
    │   │                                                                              │  │
    │   │   LLM Used: Mistral 7B                                                      │  │
    │   │                                                                              │  │
    │   │   Output: Cluster metadata, AI summaries, trending topics                   │  │
    │   └─────────────────────────────────────────────────────────────────────────────┘  │
    │                                                                                      │
    └─────────────────────────────────────────────────────────────────────────────────────┘

    WHERE IN SYSTEM:
    ┌─────────────────────────────────────────────────────────────────────────────────────┐
    │                                                                                      │
    │   Database              Community            Database                                │
    │   (posts + signals) →   Agent Team      →    (clusters)                             │
    │                                                                                      │
    │   ┌──────────────┐                          ┌───────────────────┐                   │
    │   │    posts     │                          │     clusters      │                   │
    │   │   signals    │ ──▶ [Cluster + Insight] ──▶│  cluster_members │                   │
    │   │  (batched)   │                          │ response.cluster_id│                  │
    │   └──────────────┘                          └───────────────────┘                   │
    │                                                                                      │
    └─────────────────────────────────────────────────────────────────────────────────────┘
```

### Agent Team 4: Posting Agents

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              POSTING AGENT TEAM                                          │
│                                                                                          │
│  PURPOSE: Post approved responses to external platforms                                  │
│  TRIGGER: Response approved (manual or auto)                                            │
│  OUTPUT: Posted response with tracking data                                             │
└─────────────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────────────────────┐
    │                                                                                      │
    │   ┌─────────────────────────────────────────────────────────────────────────────┐   │
    │   │                      POSTING COORDINATOR AGENT                               │   │
    │   │                                                                              │   │
    │   │   Role: Manages posting queue, rate limits, retry logic                     │   │
    │   │   State: { pending_posts, rate_limits, retry_counts }                       │   │
    │   │                                                                              │   │
    │   └───────────────────────────────────────────────────────────────────────────────┘   │
    │                                         │                                            │
    │              ┌──────────────────────────┼──────────────────────────┐                │
    │              │                          │                          │                │
    │              ▼                          ▼                          ▼                │
    │   ┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐      │
    │   │  REDDIT POSTER      │   │  TWITTER POSTER     │   │  CLIPBOARD POSTER   │      │
    │   │  AGENT              │   │  AGENT              │   │  AGENT              │      │
    │   │                     │   │                     │   │                     │      │
    │   │  Skills:            │   │  Skills:            │   │  Skills:            │      │
    │   │  • comment_post     │   │  • reply_post       │   │  • text_format      │      │
    │   │  • rate_limit_check │   │  • rate_limit_check │   │  • clipboard_copy   │      │
    │   │  • human_delay      │   │  • human_delay      │   │  • user_notify      │      │
    │   │  • verify_posted    │   │  • verify_posted    │   │                     │      │
    │   │                     │   │                     │   │  (Fallback for      │      │
    │   │  API: PRAW          │   │  API: Twitter v2    │   │   restricted APIs)  │      │
    │   └─────────────────────┘   └─────────────────────┘   └─────────────────────┘      │
    │                                         │                                            │
    │                                         ▼                                            │
    │   ┌─────────────────────────────────────────────────────────────────────────────┐   │
    │   │                         POST TRACKER AGENT                                   │   │
    │   │                                                                              │   │
    │   │   Skills:                                                                    │   │
    │   │   • status_update     → Update response status to 'posted'                  │   │
    │   │   • external_id_save  → Store platform's ID for the post                   │   │
    │   │   • audit_log         → Record posting event with details                  │   │
    │   │   • analytics_update  → Update daily metrics                               │   │
    │   │                                                                              │   │
    │   └─────────────────────────────────────────────────────────────────────────────┘   │
    │                                                                                      │
    └─────────────────────────────────────────────────────────────────────────────────────┘
```

### Complete Skill Reference Table

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              COMPLETE SKILL REFERENCE                                    │
└─────────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┬────────────────────────┬─────────────────────────────────────────────┐
│  Agent Team     │  Skill Name            │  Description                                │
├─────────────────┼────────────────────────┼─────────────────────────────────────────────┤
│                 │                        │                                             │
│  DISCOVERY      │  subreddit_scan        │  Scan subreddits for relevant posts        │
│                 │  comment_extract       │  Extract comments from threads             │
│                 │  search_tweets         │  Search Twitter for relevant tweets        │
│                 │  question_scan         │  Scan Quora for questions                  │
│                 │  language_detect       │  Detect content language                   │
│                 │  spam_filter           │  Filter spam content                       │
│                 │  quality_score         │  Score content relevance                   │
│                 │  duplicate_check       │  Check for duplicates                      │
│                 │                        │                                             │
├─────────────────┼────────────────────────┼─────────────────────────────────────────────┤
│                 │                        │                                             │
│  PROCESSING     │  problem_categorize    │  Classify into problem taxonomy            │
│  (Pipeline)     │  emotion_analyze       │  Score emotional intensity                 │
│                 │  keyword_extract       │  Extract relevant keywords                 │
│                 │  confidence_score      │  Calculate detection confidence            │
│                 │  crisis_detect         │  Detect crisis/harmful content             │
│                 │  sensitivity_check     │  Flag sensitive topics                     │
│                 │  context_analyze       │  Analyze broader context                   │
│                 │  risk_calculate        │  Calculate risk score                      │
│                 │  value_first_gen       │  Generate pure value response              │
│                 │  soft_cta_gen          │  Generate soft CTA response                │
│                 │  contextual_gen        │  Generate contextual response              │
│                 │  tone_adapt            │  Adapt tone to platform                    │
│                 │  cta_detect            │  Detect promotional language               │
│                 │  cta_level_score       │  Score CTA intensity (0-3)                 │
│                 │  cts_calculate         │  Calculate confidence to send              │
│                 │  auto_post_decide      │  Decide auto-post eligibility              │
│                 │                        │                                             │
├─────────────────┼────────────────────────┼─────────────────────────────────────────────┤
│                 │                        │                                             │
│  COMMUNITY      │  text_embed            │  Generate text embeddings                  │
│                 │  similarity_compute    │  Compute similarity scores                 │
│                 │  cluster_assign        │  Assign posts to clusters                  │
│                 │  cluster_create        │  Create new clusters                       │
│                 │  theme_extract         │  Extract cluster themes                    │
│                 │  summary_generate      │  Generate cluster summaries                │
│                 │  trend_detect          │  Detect trending topics                    │
│                 │                        │                                             │
├─────────────────┼────────────────────────┼─────────────────────────────────────────────┤
│                 │                        │                                             │
│  POSTING        │  comment_post          │  Post comment via API                      │
│                 │  reply_post            │  Post reply via API                        │
│                 │  rate_limit_check      │  Check rate limits                         │
│                 │  human_delay           │  Add human-like delays                     │
│                 │  verify_posted         │  Verify post succeeded                     │
│                 │  clipboard_copy        │  Copy to clipboard (fallback)              │
│                 │  status_update         │  Update response status                    │
│                 │  audit_log             │  Log posting event                         │
│                 │                        │                                             │
└─────────────────┴────────────────────────┴─────────────────────────────────────────────┘
```

### LLM Model Usage by Skill

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              LLM MODEL ALLOCATION                                        │
└─────────────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────────────────────┐
    │                                                                                      │
    │   LLAMA 3.1 70B (High Accuracy Tasks)                                               │
    │   ═══════════════════════════════════                                               │
    │                                                                                      │
    │   Used For:                                                                         │
    │   • Signal Detection (problem categorization, emotion analysis)                     │
    │   • Risk Scoring (crisis detection, sensitivity checking)                          │
    │                                                                                      │
    │   Why: These tasks require high accuracy and nuanced understanding.                │
    │   Errors in these skills could lead to engaging with inappropriate                 │
    │   content or missing important signals.                                            │
    │                                                                                      │
    │   Latency: ~2-5 seconds per request                                                │
    │   Cost: Higher (larger model)                                                      │
    │                                                                                      │
    └─────────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────────────────────┐
    │                                                                                      │
    │   MISTRAL 7B / MIXTRAL (Fast Generation Tasks)                                      │
    │   ═════════════════════════════════════════════                                     │
    │                                                                                      │
    │   Used For:                                                                         │
    │   • Response Generation (all 3 variants)                                           │
    │   • CTA Classification                                                             │
    │   • Cluster Summarization                                                          │
    │   • Theme Extraction                                                               │
    │                                                                                      │
    │   Why: These tasks need good quality but benefit from faster inference.            │
    │   Human review catches any issues before posting.                                  │
    │                                                                                      │
    │   Latency: ~0.5-2 seconds per request                                              │
    │   Cost: Lower (smaller model)                                                      │
    │                                                                                      │
    └─────────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────────────────────┐
    │                                                                                      │
    │   TEXT-EMBEDDING-3 (OpenAI) or LOCAL EMBEDDING MODEL                                │
    │   ═══════════════════════════════════════════════════                               │
    │                                                                                      │
    │   Used For:                                                                         │
    │   • Post content embedding for clustering                                          │
    │   • Similarity search for deduplication                                            │
    │                                                                                      │
    │   Output: 1536-dimensional vectors stored in PostgreSQL (pgvector)                 │
    │                                                                                      │
    └─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow - End to End

### Phase 1: Content Discovery & Detection

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                           PHASE 1: CONTENT DISCOVERY                                  │
└──────────────────────────────────────────────────────────────────────────────────────┘

    EXTERNAL PLATFORMS                      CRAWLER SERVICE                    DATABASE
    ─────────────────                       ───────────────                    ────────

    ┌─────────────┐
    │   Reddit    │ ◀──── API/Scrape ────┐
    │  • Posts    │                      │
    │  • Comments │                      │
    └─────────────┘                      │
                                         │    ┌─────────────────────┐
    ┌─────────────┐                      │    │   Platform          │
    │   Twitter   │ ◀──── API ───────────┼───▶│   Crawlers          │
    │  • Tweets   │                      │    │                     │
    │  • Replies  │                      │    │  • Rate Limiting    │
    └─────────────┘                      │    │  • Deduplication    │
                                         │    │  • Content Filter   │       ┌──────────────┐
    ┌─────────────┐                      │    │  • Keyword Match    │──────▶│    posts     │
    │   Quora     │ ◀──── Scrape ────────┤    │                     │       │              │
    │  • Questions│                      │    └─────────────────────┘       │ • content    │
    │  • Answers  │                      │              │                   │ • platform   │
    └─────────────┘                      │              │                   │ • author     │
                                         │              │                   │ • url        │
    ┌─────────────┐                      │              │                   │ • detected_at│
    │   Google    │ ◀──── SerpAPI ───────┘              │                   └──────────────┘
    │  • Forums   │                                     │
    │  • Blogs    │                                     ▼
    └─────────────┘                          ┌─────────────────────┐
                                             │  Trigger: New Post  │
                                             │  → Start Pipeline   │
                                             └─────────────────────┘
```

### Phase 2: AI Processing Pipeline

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                           PHASE 2: AI PROCESSING PIPELINE                             │
└──────────────────────────────────────────────────────────────────────────────────────┘

    NEW POST DETECTED                    LANGGRAPH ORCHESTRATOR
    ─────────────────                    ──────────────────────

         │
         ▼
    ┌─────────────────────────────────────────────────────────────────────────────────┐
    │                                                                                  │
    │    ┌───────────────┐                                                            │
    │    │    INPUT      │    Post Content: "I've been struggling to communicate      │
    │    │               │    with my partner about finances..."                      │
    │    └───────┬───────┘                                                            │
    │            │                                                                     │
    │            ▼                                                                     │
    │    ┌───────────────────────────────────────────────────────────────────────┐   │
    │    │  SKILL 1: SIGNAL DETECTION                                            │   │
    │    │  ───────────────────────────                                          │   │
    │    │                                                                        │   │
    │    │  Prompt: "Analyze this post for engagement signals..."                │   │
    │    │                                                                        │   │
    │    │  LLM Output:                                                          │   │
    │    │  ┌─────────────────────────────────────────────────────────────────┐  │   │
    │    │  │ {                                                                │  │   │
    │    │  │   "problem_category": "relationship_communication",              │  │   │
    │    │  │   "emotional_intensity": 0.75,                                   │  │   │
    │    │  │   "keywords": ["communicate", "partner", "finances", "struggle"],│  │   │
    │    │  │   "confidence": 0.92                                             │  │   │
    │    │  │ }                                                                │  │   │
    │    │  └─────────────────────────────────────────────────────────────────┘  │   │
    │    │                                                                        │   │
    │    │  SAVED TO: signals table (with raw_llm_response for audit)            │   │
    │    └───────────────────────────────────────────────────────────────────────┘   │
    │            │                                                                     │
    │            ▼                                                                     │
    │    ┌───────────────────────────────────────────────────────────────────────┐   │
    │    │  SKILL 2: RISK SCORING                                                │   │
    │    │  ──────────────────────                                               │   │
    │    │                                                                        │   │
    │    │  Input: Signal data + original text                                   │   │
    │    │                                                                        │   │
    │    │  Crisis Detection:                                                    │   │
    │    │  • Check for self-harm language ❌ Not detected                       │   │
    │    │  • Check for violence indicators ❌ Not detected                      │   │
    │    │  • Check for sensitive topics ✓ Financial stress (minor flag)        │   │
    │    │                                                                        │   │
    │    │  LLM Output:                                                          │   │
    │    │  ┌─────────────────────────────────────────────────────────────────┐  │   │
    │    │  │ {                                                                │  │   │
    │    │  │   "risk_level": "low",                                          │  │   │
    │    │  │   "risk_score": 0.25,                                           │  │   │
    │    │  │   "context_flags": ["financial_topic"],                         │  │   │
    │    │  │   "recommended_action": "proceed_with_value_response"           │  │   │
    │    │  │ }                                                                │  │   │
    │    │  └─────────────────────────────────────────────────────────────────┘  │   │
    │    │                                                                        │   │
    │    │  SAVED TO: risk_scores table                                          │   │
    │    └───────────────────────────────────────────────────────────────────────┘   │
    │            │                                                                     │
    │            ▼                                                                     │
    │    ┌───────────────────────────────────────────────────────────────────────┐   │
    │    │  SKILL 3: RESPONSE GENERATION                                         │   │
    │    │  ───────────────────────────                                          │   │
    │    │                                                                        │   │
    │    │  Generates 3 response variants:                                       │   │
    │    │                                                                        │   │
    │    │  ┌─────────────────────────────────────────────────────────────────┐  │   │
    │    │  │ VALUE_FIRST (CTA Level 0):                                      │  │   │
    │    │  │ "I hear you - financial conversations in relationships can be   │  │   │
    │    │  │ really challenging. One approach that's worked for many couples │  │   │
    │    │  │ is setting a regular 'money date' where you both come prepared  │  │   │
    │    │  │ with your concerns written down. It removes some of the         │  │   │
    │    │  │ emotional charge from spontaneous discussions..."               │  │   │
    │    │  └─────────────────────────────────────────────────────────────────┘  │   │
    │    │                                                                        │   │
    │    │  ┌─────────────────────────────────────────────────────────────────┐  │   │
    │    │  │ SOFT_CTA (CTA Level 1):                                         │  │   │
    │    │  │ "I hear you... [same value content] ...There are also some      │  │   │
    │    │  │ great conversation frameworks designed specifically for this    │  │   │
    │    │  │ that you might find helpful."                                   │  │   │
    │    │  └─────────────────────────────────────────────────────────────────┘  │   │
    │    │                                                                        │   │
    │    │  ┌─────────────────────────────────────────────────────────────────┐  │   │
    │    │  │ CONTEXTUAL (CTA Level 1-2):                                     │  │   │
    │    │  │ "This is so common - you're definitely not alone. The fact     │  │   │
    │    │  │ that you're thinking about this shows you care about the       │  │   │
    │    │  │ relationship. I've seen tools that help couples structure      │  │   │
    │    │  │ these conversations..."                                         │  │   │
    │    │  └─────────────────────────────────────────────────────────────────┘  │   │
    │    │                                                                        │   │
    │    │  SAVED TO: responses table (ALL variants retained)                    │   │
    │    └───────────────────────────────────────────────────────────────────────┘   │
    │            │                                                                     │
    │            ▼                                                                     │
    │    ┌───────────────────────────────────────────────────────────────────────┐   │
    │    │  SKILL 4: CTA CLASSIFIER                                              │   │
    │    │  ───────────────────────                                              │   │
    │    │                                                                        │   │
    │    │  Analyzes each response for CTA intensity:                            │   │
    │    │                                                                        │   │
    │    │  ┌──────────────────┬────────────────────────────────────────────┐   │   │
    │    │  │ CTA Level 0      │ No mention of product/service              │   │   │
    │    │  │ CTA Level 1      │ Subtle hint, no direct mention             │   │   │
    │    │  │ CTA Level 2      │ Clear mention with soft push               │   │   │
    │    │  │ CTA Level 3      │ Direct call to action with link            │   │   │
    │    │  └──────────────────┴────────────────────────────────────────────┘   │   │
    │    │                                                                        │   │
    │    │  Selected Response: VALUE_FIRST (CTA Level 0)                         │   │
    │    │                                                                        │   │
    │    └───────────────────────────────────────────────────────────────────────┘   │
    │            │                                                                     │
    │            ▼                                                                     │
    │    ┌───────────────────────────────────────────────────────────────────────┐   │
    │    │  SKILL 5: CTS (CONFIDENCE TO SEND) DECISION                           │   │
    │    │  ───────────────────────────────────────                              │   │
    │    │                                                                        │   │
    │    │  Formula:                                                             │   │
    │    │  CTS = (signal_score × 0.4) + (risk_inverse × 0.3) + (cta_score × 0.3)│   │
    │    │                                                                        │   │
    │    │  Calculation:                                                         │   │
    │    │  • signal_score = 0.92 (high confidence detection)                    │   │
    │    │  • risk_inverse = 1 - 0.25 = 0.75 (low risk = high inverse)          │   │
    │    │  • cta_score = 1.0 (CTA level 0 = perfect for auto)                  │   │
    │    │                                                                        │   │
    │    │  CTS = (0.92 × 0.4) + (0.75 × 0.3) + (1.0 × 0.3)                      │   │
    │    │      = 0.368 + 0.225 + 0.3                                            │   │
    │    │      = 0.893                                                          │   │
    │    │                                                                        │   │
    │    │  ┌─────────────────────────────────────────────────────────────────┐  │   │
    │    │  │ AUTO-POST ELIGIBILITY CHECK:                                    │  │   │
    │    │  │ ✓ CTS >= 0.7 (0.893 >= 0.7)                                    │  │   │
    │    │  │ ✓ risk_level == 'low'                                          │  │   │
    │    │  │ ✓ cta_level <= 1 (0 <= 1)                                      │  │   │
    │    │  │                                                                 │  │   │
    │    │  │ RESULT: ✓ ELIGIBLE FOR AUTO-POST                               │  │   │
    │    │  └─────────────────────────────────────────────────────────────────┘  │   │
    │    │                                                                        │   │
    │    └───────────────────────────────────────────────────────────────────────┘   │
    │            │                                                                     │
    │            ▼                                                                     │
    │    ┌───────────────┐                                                            │
    │    │    OUTPUT     │    Response ready for queue or auto-post                   │
    │    │               │                                                            │
    │    └───────────────┘                                                            │
    │                                                                                  │
    └──────────────────────────────────────────────────────────────────────────────────┘
```

### Phase 3: Queue & Review

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                           PHASE 3: QUEUE & HUMAN REVIEW                               │
└──────────────────────────────────────────────────────────────────────────────────────┘

    PIPELINE OUTPUT                      QUEUE ROUTING                    REVIEW INTERFACE
    ───────────────                      ─────────────                    ────────────────

         │
         ▼
    ┌─────────────────┐
    │ Response Ready  │
    │                 │
    │ CTS: 0.893      │
    │ Risk: Low       │
    │ CTA: 0          │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │                      ROUTING DECISION                           │
    │                                                                 │
    │   IF auto_post_enabled AND can_auto_post:                      │
    │       → Route to AUTO-POST QUEUE                               │
    │   ELSE:                                                        │
    │       → Route to MANUAL REVIEW QUEUE                           │
    │                                                                 │
    └─────────────────────────────────────────────────────────────────┘
             │
             ├─────────────────────────────────────────┐
             │                                         │
             ▼                                         ▼
    ┌─────────────────┐                     ┌─────────────────┐
    │  AUTO-POST      │                     │  MANUAL REVIEW  │
    │  QUEUE          │                     │  QUEUE          │
    │                 │                     │                 │
    │  • High CTS     │                     │  • Any CTS      │
    │  • Low Risk     │                     │  • Med/High Risk│
    │  • CTA 0-1      │                     │  • CTA 2-3      │
    └────────┬────────┘                     └────────┬────────┘
             │                                        │
             │                                        ▼
             │                     ┌──────────────────────────────────────────┐
             │                     │         MULTI-PLATFORM REVIEW            │
             │                     │                                          │
             │                     │   ┌──────────┐  ┌──────────┐  ┌───────┐ │
             │                     │   │   WEB    │  │  MOBILE  │  │ TABLET│ │
             │                     │   │          │  │          │  │       │ │
             │                     │   │ Keyboard │  │  Swipe   │  │ Both  │ │
             │                     │   │ Shortcuts│  │ Gestures │  │ Modes │ │
             │                     │   │          │  │          │  │       │ │
             │                     │   │ [A]pprove│  │ ←Reject  │  │       │ │
             │                     │   │ [R]eject │  │ Approve→ │  │       │ │
             │                     │   │ [E]dit   │  │ Tap=Edit │  │       │ │
             │                     │   └──────────┘  └──────────┘  └───────┘ │
             │                     │                                          │
             │                     │         ┌─────────────────────┐         │
             │                     │         │   REAL-TIME SYNC    │         │
             │                     │         │   (Supabase)        │         │
             │                     │         │                     │         │
             │                     │         │ Action on mobile    │         │
             │                     │         │ reflects on web     │         │
             │                     │         │ instantly           │         │
             │                     │         └─────────────────────┘         │
             │                     │                                          │
             │                     └───────────────────┬──────────────────────┘
             │                                         │
             │                         ┌───────────────┼───────────────┐
             │                         │               │               │
             │                         ▼               ▼               ▼
             │                   ┌──────────┐   ┌──────────┐   ┌──────────┐
             │                   │ APPROVED │   │ REJECTED │   │  EDITED  │
             │                   │          │   │          │   │          │
             │                   │ Log audit│   │ Log audit│   │ Save edit│
             │                   │ event    │   │ + reason │   │ Log audit│
             │                   └────┬─────┘   └──────────┘   └────┬─────┘
             │                        │                              │
             │                        └──────────────┬───────────────┘
             │                                       │
             └───────────────────────────────────────┤
                                                     │
                                                     ▼
                                            ┌─────────────────┐
                                            │  POSTING QUEUE  │
                                            │                 │
                                            │  Ready to post  │
                                            │  to platform    │
                                            └────────┬────────┘
                                                     │
                                                     ▼
```

### Phase 4: Posting & Tracking

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                           PHASE 4: POSTING & TRACKING                                 │
└──────────────────────────────────────────────────────────────────────────────────────┘

    POSTING QUEUE                        POSTING SERVICE                   PLATFORM
    ─────────────                        ───────────────                   ────────

    ┌─────────────────┐
    │  Response to    │
    │  Post           │
    │                 │
    │  Platform: Reddit
    │  URL: /r/...    │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │                      POSTING STRATEGY                           │
    │                                                                 │
    │   1. Check rate limits for platform                            │
    │   2. Apply human-like delay (randomized)                       │
    │   3. Select posting method:                                    │
    │      • API posting (preferred)                                 │
    │      • Clipboard fallback (restricted platforms)               │
    │                                                                 │
    └─────────────────────────────────────────────────────────────────┘
             │
             ├────────────── API Available ──────────────┐
             │                                           │
             ▼                                           ▼
    ┌─────────────────┐                       ┌─────────────────┐
    │  API POSTING    │                       │    PLATFORM     │
    │                 │                       │                 │
    │  POST /comment  │ ────────────────────▶ │  Comment posted │
    │                 │                       │                 │
    │  Response:      │ ◀──────────────────── │  {id, url}      │
    │  external_id    │                       │                 │
    │  external_url   │                       └─────────────────┘
    └────────┬────────┘
             │
             │ OR
             │
             ├────────── API Restricted ─────────────┐
             │                                       │
             ▼                                       ▼
    ┌─────────────────┐                   ┌─────────────────────────┐
    │  CLIPBOARD      │                   │    HUMAN ASSISTED       │
    │  FALLBACK       │                   │    POSTING              │
    │                 │                   │                         │
    │  Copy to        │ ────────────────▶ │  User manually pastes   │
    │  clipboard      │                   │  and confirms posting   │
    │                 │                   │                         │
    └─────────────────┘                   └───────────┬─────────────┘
                                                      │
                                                      │ Confirmation
                                                      │
                                                      ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │                      POST-POSTING TRACKING                      │
    │                                                                 │
    │   Update responses table:                                      │
    │   ┌─────────────────────────────────────────────────────────┐  │
    │   │ {                                                        │  │
    │   │   "status": "posted",                                   │  │
    │   │   "posted_at": "2026-01-15T12:30:00Z",                 │  │
    │   │   "posted_external_id": "abc123",                       │  │
    │   │   "posted_external_url": "https://reddit.com/r/.../abc" │  │
    │   │ }                                                        │  │
    │   └─────────────────────────────────────────────────────────┘  │
    │                                                                 │
    │   Create audit_log entry:                                      │
    │   ┌─────────────────────────────────────────────────────────┐  │
    │   │ {                                                        │  │
    │   │   "action_type": "response.posted",                     │  │
    │   │   "entity_type": "response",                            │  │
    │   │   "entity_id": "response-uuid",                         │  │
    │   │   "device_type": "auto" | "web" | "mobile",             │  │
    │   │   "action_data": { platform, url, auto_posted: true }   │  │
    │   │ }                                                        │  │
    │   └─────────────────────────────────────────────────────────┘  │
    │                                                                 │
    └─────────────────────────────────────────────────────────────────┘
             │
             ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │                      ANALYTICS UPDATE                           │
    │                                                                 │
    │   Update daily_metrics:                                        │
    │   • responses_posted++                                         │
    │   • platform_breakdown[reddit]++                               │
    │   • Update avg_response_time                                   │
    │                                                                 │
    │   Update cluster statistics:                                   │
    │   • cluster.engagement_count++                                 │
    │   • cluster.last_activity_at = now()                          │
    │                                                                 │
    └─────────────────────────────────────────────────────────────────┘
```

### Phase 5: Community Clustering

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                           PHASE 5: COMMUNITY CLUSTERING                               │
└──────────────────────────────────────────────────────────────────────────────────────┘

    ACCUMULATED POSTS                    CLUSTERING SERVICE              CLUSTER DATABASE
    ─────────────────                    ──────────────────              ────────────────

    ┌─────────────────┐
    │  New Posts      │
    │  (Batch)        │
    │                 │
    │  100+ posts     │
    │  with signals   │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │                      EMBEDDING GENERATION                       │
    │                                                                 │
    │   For each post:                                               │
    │   text_embedding = embed(post.content + signal.keywords)       │
    │                                                                 │
    │   Vector: [0.12, -0.45, 0.78, ..., 0.33]  (1536 dimensions)   │
    │                                                                 │
    └─────────────────────────────────────────────────────────────────┘
             │
             ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │                      SIMILARITY CLUSTERING                      │
    │                                                                 │
    │   Algorithm: HDBSCAN / K-Means                                 │
    │                                                                 │
    │   Groups posts by semantic similarity:                         │
    │                                                                 │
    │   ┌─────────────────────────────────────────────────────────┐  │
    │   │  Cluster A: "Financial Communication in Relationships"  │  │
    │   │  ─────────────────────────────────────────────────────  │  │
    │   │  • Post 1: "struggling to talk about money..."         │  │
    │   │  • Post 2: "partner gets defensive about finances..."  │  │
    │   │  • Post 3: "how to budget as a couple..."              │  │
    │   │  Similarity scores: 0.89, 0.85, 0.82                   │  │
    │   └─────────────────────────────────────────────────────────┘  │
    │                                                                 │
    │   ┌─────────────────────────────────────────────────────────┐  │
    │   │  Cluster B: "Workplace Credit Issues"                   │  │
    │   │  ─────────────────────────────────────────────────────  │  │
    │   │  • Post 4: "coworker takes credit for my work..."      │  │
    │   │  • Post 5: "boss doesn't recognize my contributions..."│  │
    │   │  Similarity scores: 0.91, 0.87                         │  │
    │   └─────────────────────────────────────────────────────────┘  │
    │                                                                 │
    └─────────────────────────────────────────────────────────────────┘
             │
             ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │                      THEME EXTRACTION                           │
    │                                                                 │
    │   For each cluster, extract:                                   │
    │   • Common keywords                                            │
    │   • Problem category distribution                              │
    │   • Emotional intensity average                                │
    │   • Trending topics                                            │
    │                                                                 │
    │   AI-generated summary:                                        │
    │   "This community discusses challenges with having             │
    │    productive financial conversations in romantic              │
    │    relationships, often triggered by differing                 │
    │    spending habits or financial goals."                        │
    │                                                                 │
    └─────────────────────────────────────────────────────────────────┘
             │
             ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │                      DATABASE UPDATE                            │
    │                                                                 │
    │   clusters table:                                              │
    │   ┌─────────────────────────────────────────────────────────┐  │
    │   │ {                                                        │  │
    │   │   "name": "Financial Communication Struggles",          │  │
    │   │   "description": "Couples struggling with money talks", │  │
    │   │   "keywords": ["finances", "partner", "budget", ...],   │  │
    │   │   "embedding": [0.12, -0.45, ...],                      │  │
    │   │   "member_count": 142,                                  │  │
    │   │   "avg_emotional_intensity": 0.72,                      │  │
    │   │   "ai_summary": "This community discusses...",          │  │
    │   │   "trending_topics": ["joint accounts", "debt"]         │  │
    │   │ }                                                        │  │
    │   └─────────────────────────────────────────────────────────┘  │
    │                                                                 │
    │   cluster_members table:                                       │
    │   ┌─────────────────────────────────────────────────────────┐  │
    │   │ { cluster_id, post_id, similarity_score: 0.89 }         │  │
    │   │ { cluster_id, post_id, similarity_score: 0.85 }         │  │
    │   │ ...                                                      │  │
    │   └─────────────────────────────────────────────────────────┘  │
    │                                                                 │
    │   responses table (update):                                    │
    │   ┌─────────────────────────────────────────────────────────┐  │
    │   │ response.cluster_id = cluster.id                        │  │
    │   └─────────────────────────────────────────────────────────┘  │
    │                                                                 │
    └─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE ENTITY RELATIONSHIPS                               │
└─────────────────────────────────────────────────────────────────────────────────────────┘

    ┌──────────────────┐         ┌──────────────────┐
    │  organizations   │◀────────│      users       │
    │                  │   1:N   │                  │
    │  • id            │         │  • id            │
    │  • name          │         │  • organization_id
    │  • slug          │         │  • email         │
    │  • settings      │         │  • role          │
    └────────┬─────────┘         └──────────────────┘
             │
             │ 1:N
             ▼
    ┌──────────────────┐         ┌──────────────────┐
    │    platforms     │◀────────│      posts       │
    │                  │   1:N   │                  │
    │  • id            │         │  • id            │
    │  • name          │         │  • organization_id
    │  • slug          │         │  • platform_id   │
    │  • config        │         │  • content       │──────────────────────┐
    └──────────────────┘         │  • external_url  │                      │
                                 │  • author_handle │                      │
                                 │  • detected_at   │                      │
                                 └────────┬─────────┘                      │
                                          │                                │
                                          │ 1:1                            │
                                          ▼                                │
                                 ┌──────────────────┐                      │
                                 │     signals      │                      │
                                 │                  │                      │
                                 │  • id            │                      │
                                 │  • post_id       │                      │
                                 │  • problem_category_id                  │
                                 │  • emotional_intensity                  │
                                 │  • keywords      │                      │
                                 │  • raw_llm_response (audit)             │
                                 └────────┬─────────┘                      │
                                          │                                │
                                          │ 1:1                            │
                                          ▼                                │
                                 ┌──────────────────┐                      │
                                 │   risk_scores    │                      │
                                 │                  │                      │
                                 │  • id            │                      │
                                 │  • signal_id     │                      │
                                 │  • risk_level    │                      │
                                 │  • risk_score    │                      │
                                 │  • context_flags │                      │
                                 │  • raw_llm_response (audit)             │
                                 └────────┬─────────┘                      │
                                          │                                │
                                          │ (via signal)                   │
                                          ▼                                │
    ┌──────────────────┐         ┌──────────────────┐                      │
    │    clusters      │◀────────│    responses     │                      │
    │                  │   N:1   │                  │                      │
    │  • id            │         │  • id            │                      │
    │  • name          │         │  • signal_id     │                      │
    │  • description   │         │  • cluster_id    │◀─────────────────────┘
    │  • keywords      │         │                  │      (cluster assignment)
    │  • embedding     │         │  ALL VARIANTS:   │
    │  • member_count  │         │  • value_first_response
    │  • ai_summary    │         │  • soft_cta_response
    └──────────────────┘         │  • contextual_response
             │                   │                  │
             │                   │  SELECTED:       │
             │ N:M               │  • selected_response
             ▼                   │  • selected_type │
    ┌──────────────────┐         │                  │
    │ cluster_members  │         │  SCORES:         │
    │                  │         │  • cta_level     │
    │  • cluster_id    │         │  • cts_score     │
    │  • post_id       │         │  • can_auto_post │
    │  • similarity    │         │                  │
    └──────────────────┘         │  REVIEW:         │
                                 │  • status        │
                                 │  • reviewed_by   │
                                 │  • reviewed_at   │
                                 │  • review_device │
                                 │                  │
                                 │  POSTING:        │
                                 │  • posted_at     │
                                 │  • posted_external_id
                                 │  • posted_external_url
                                 │                  │
                                 │  AUDIT:          │
                                 │  • raw_llm_response
                                 └────────┬─────────┘
                                          │
                                          │ 1:1
                                          ▼
                                 ┌──────────────────┐
                                 │ engagement_queue │
                                 │                  │
                                 │  • id            │
                                 │  • response_id   │
                                 │  • organization_id
                                 │  • priority      │
                                 │  • status        │
                                 └──────────────────┘


    ┌──────────────────────────────────────────────────────────────────────┐
    │                         AUDIT & ANALYTICS                            │
    └──────────────────────────────────────────────────────────────────────┘

    ┌──────────────────┐         ┌──────────────────┐
    │    audit_log     │         │  daily_metrics   │
    │                  │         │                  │
    │  EVERY ACTION:   │         │  AGGREGATED:     │
    │  • action_type   │         │  • metric_date   │
    │  • entity_type   │         │  • posts_detected│
    │  • entity_id     │         │  • signals_gen   │
    │  • user_id       │         │  • responses_gen │
    │  • device_type   │         │  • approved      │
    │  • action_data   │         │  • rejected      │
    │  • previous_state│         │  • auto_posted   │
    │  • new_state     │         │  • risk_breakdown│
    │  • created_at    │         │  • platform_breakdown
    └──────────────────┘         └──────────────────┘
```

---

## API Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                    API ENDPOINTS                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘

    FRONTEND                            SUPABASE                         AGENT SERVICE
    ────────                            ────────                         ─────────────

    ┌─────────────────────────────────────────────────────────────────────────────────────┐
    │  AUTHENTICATION (Supabase Auth)                                                     │
    ├─────────────────────────────────────────────────────────────────────────────────────┤
    │                                                                                      │
    │  POST /auth/signup          →  Create user + organization                           │
    │  POST /auth/login           →  Authenticate, return JWT                             │
    │  POST /auth/logout          →  Invalidate session                                   │
    │  POST /auth/refresh         →  Refresh JWT token                                    │
    │  GET  /auth/session         →  Get current session                                  │
    │                                                                                      │
    └─────────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────────────────────┐
    │  QUEUE MANAGEMENT (Supabase + RLS)                                                  │
    ├─────────────────────────────────────────────────────────────────────────────────────┤
    │                                                                                      │
    │  GET  /queue                →  List pending responses (paginated, filtered)         │
    │       ?status=pending                                                               │
    │       &risk_level=low,medium                                                        │
    │       &min_cts=0.5                                                                  │
    │       &page=1&limit=20                                                              │
    │                                                                                      │
    │  GET  /queue/:id            →  Get single queue item with full details              │
    │  GET  /queue/count          →  Get count of pending items                           │
    │                                                                                      │
    └─────────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────────────────────┐
    │  RESPONSE ACTIONS (Supabase + Audit)                                                │
    ├─────────────────────────────────────────────────────────────────────────────────────┤
    │                                                                                      │
    │  POST /responses/:id/approve                                                        │
    │       Body: { device_type, selected_type?, edited_response?, notes? }               │
    │       → Update status, log audit, update queue                                      │
    │                                                                                      │
    │  POST /responses/:id/reject                                                         │
    │       Body: { device_type, reason }                                                 │
    │       → Update status, log audit, update queue                                      │
    │                                                                                      │
    │  POST /responses/:id/edit                                                           │
    │       Body: { edited_response, device_type }                                        │
    │       → Save edit, preserve original, log audit                                     │
    │                                                                                      │
    │  POST /responses/:id/post                                                           │
    │       → Trigger posting to platform                                                 │
    │                                                                                      │
    └─────────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────────────────────┐
    │  ANALYTICS (Supabase)                                                               │
    ├─────────────────────────────────────────────────────────────────────────────────────┤
    │                                                                                      │
    │  GET  /analytics/overview   →  KPIs: total, approved, rejected, posted              │
    │       ?start_date&end_date                                                          │
    │                                                                                      │
    │  GET  /analytics/funnel     →  Conversion funnel data                               │
    │  GET  /analytics/platforms  →  Breakdown by platform                                │
    │  GET  /analytics/risk       →  Risk level distribution                              │
    │  GET  /analytics/daily      →  Daily metrics time series                            │
    │                                                                                      │
    └─────────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────────────────────┐
    │  COMMUNITIES (Supabase)                                                             │
    ├─────────────────────────────────────────────────────────────────────────────────────┤
    │                                                                                      │
    │  GET  /clusters             →  List community clusters                              │
    │  GET  /clusters/:id         →  Get cluster details with members                     │
    │  GET  /clusters/:id/posts   →  Get posts in cluster                                 │
    │                                                                                      │
    └─────────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────────────────────┐
    │  AGENT SERVICE API (FastAPI)                                                        │
    ├─────────────────────────────────────────────────────────────────────────────────────┤
    │                                                                                      │
    │  POST /pipeline/process     →  Process single post through full pipeline            │
    │       Body: { post_id }                                                             │
    │                                                                                      │
    │  POST /skills/signal        →  Run signal detection only                            │
    │  POST /skills/risk          →  Run risk scoring only                                │
    │  POST /skills/response      →  Run response generation only                         │
    │  POST /skills/cta           →  Run CTA classification only                          │
    │  POST /skills/cts           →  Run CTS decision only                                │
    │                                                                                      │
    │  POST /crawl/trigger        →  Trigger manual crawl                                 │
    │  GET  /crawl/status         →  Get crawler status                                   │
    │                                                                                      │
    │  POST /cluster/update       →  Trigger clustering update                            │
    │                                                                                      │
    │  POST /post/submit          →  Submit response for posting                          │
    │       Body: { response_id }                                                         │
    │                                                                                      │
    │  GET  /health               →  Health check                                         │
    │                                                                                      │
    └─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Real-Time Sync Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              REAL-TIME SYNCHRONIZATION                                   │
└─────────────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
    │  Web App    │     │ Mobile App  │     │ Tablet App  │
    │  (Browser)  │     │ (iOS/And)   │     │ (iPad)      │
    └──────┬──────┘     └──────┬──────┘     └──────┬──────┘
           │                   │                   │
           │ WebSocket         │ WebSocket         │ WebSocket
           │                   │                   │
           └───────────────────┼───────────────────┘
                               │
                               ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │                    SUPABASE REALTIME                            │
    │                                                                 │
    │   Channel: organization:{org_id}                               │
    │                                                                 │
    │   Subscriptions:                                               │
    │   ┌─────────────────────────────────────────────────────────┐  │
    │   │  • engagement_queue changes (INSERT, UPDATE, DELETE)    │  │
    │   │  • responses changes (UPDATE on status)                 │  │
    │   │  • notifications (new items requiring attention)        │  │
    │   └─────────────────────────────────────────────────────────┘  │
    │                                                                 │
    └─────────────────────────────────────────────────────────────────┘
                               │
                               │ Broadcast
                               │
           ┌───────────────────┼───────────────────┐
           │                   │                   │
           ▼                   ▼                   ▼
    ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
    │  Web App    │     │ Mobile App  │     │ Tablet App  │
    │             │     │             │     │             │
    │  Updates UI │     │  Updates UI │     │  Updates UI │
    │  instantly  │     │  + Badge    │     │  instantly  │
    │             │     │  + Haptic   │     │             │
    └─────────────┘     └─────────────┘     └─────────────┘


    EXAMPLE FLOW: Mobile Approves, Web Sees Instantly
    ─────────────────────────────────────────────────

    1. User swipes right on mobile to approve
           │
           ▼
    2. Mobile app calls: POST /responses/:id/approve
           │
           ▼
    3. Supabase updates responses table
           │
           ▼
    4. Database trigger fires, broadcasts to channel
           │
           ▼
    5. Web app receives WebSocket message
           │
           ▼
    6. Web UI removes item from queue (animated)
           │
           ▼
    7. Queue count decrements on all devices
```

---

## Security & Multi-Tenancy

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              ROW LEVEL SECURITY (RLS)                                    │
└─────────────────────────────────────────────────────────────────────────────────────────┘

    Every table has RLS policies ensuring tenant isolation:

    ┌─────────────────────────────────────────────────────────────────────────────────────┐
    │  POLICY: Users can only see data from their organization                           │
    │                                                                                      │
    │  CREATE POLICY "org_isolation" ON posts                                             │
    │  FOR ALL                                                                            │
    │  USING (                                                                            │
    │    organization_id = (                                                              │
    │      SELECT organization_id FROM users WHERE id = auth.uid()                       │
    │    )                                                                                │
    │  );                                                                                 │
    │                                                                                      │
    │  Applied to: posts, signals, risk_scores, responses, engagement_queue,             │
    │              clusters, audit_log, analytics_events, daily_metrics                  │
    │                                                                                      │
    └─────────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────────────────────────────┐
    │  ROLE-BASED ACCESS CONTROL (RBAC)                                                   │
    │                                                                                      │
    │  ┌────────────┬──────────────────────────────────────────────────────────────────┐ │
    │  │   Role     │   Permissions                                                    │ │
    │  ├────────────┼──────────────────────────────────────────────────────────────────┤ │
    │  │   owner    │   Full access: settings, billing, users, all features           │ │
    │  │   admin    │   Manage users, configure automation, view all analytics        │ │
    │  │   reviewer │   Approve/reject responses, view queue, basic analytics         │ │
    │  │   member   │   View-only access to dashboard and analytics                   │ │
    │  └────────────┴──────────────────────────────────────────────────────────────────┘ │
    │                                                                                      │
    └─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Complete Data Journey Example

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  EXAMPLE: From Reddit Post to Community Engagement                                       │
└─────────────────────────────────────────────────────────────────────────────────────────┘

    TIME: T+0 (Detection)
    ─────────────────────
    Reddit Crawler finds post in r/relationships:
    "I've been struggling to communicate with my partner about finances.
     Every time I bring it up, it turns into an argument."

    STORED IN posts:
    {
      id: "post-uuid-001",
      platform_id: "reddit-uuid",
      content: "I've been struggling...",
      external_url: "https://reddit.com/r/relationships/...",
      author_handle: "u/anonymous_user",
      detected_at: "2026-01-15T10:00:00Z"
    }


    TIME: T+5s (Signal Detection)
    ─────────────────────────────
    STORED IN signals:
    {
      id: "signal-uuid-001",
      post_id: "post-uuid-001",
      problem_category_id: "relationship_communication",
      emotional_intensity: 0.75,
      keywords: ["communicate", "partner", "finances", "argument"],
      confidence_score: 0.92,
      raw_llm_response: "Full LLM output for audit...",
      model_used: "llama-3.1-70b"
    }


    TIME: T+8s (Risk Scoring)
    ─────────────────────────
    STORED IN risk_scores:
    {
      id: "risk-uuid-001",
      signal_id: "signal-uuid-001",
      risk_level: "low",
      risk_score: 0.25,
      context_flags: ["financial_topic"],
      recommended_action: "proceed_with_value_response",
      raw_llm_response: "Full LLM output for audit..."
    }


    TIME: T+15s (Response Generation)
    ──────────────────────────────────
    STORED IN responses:
    {
      id: "response-uuid-001",
      signal_id: "signal-uuid-001",

      // ALL VARIANTS RETAINED
      value_first_response: "I hear you - financial conversations...",
      soft_cta_response: "I hear you... There are great resources...",
      contextual_response: "This is so common...",

      // SELECTED
      selected_response: "I hear you - financial conversations...",
      selected_type: "value_first",

      // SCORES
      cta_level: 0,
      cts_score: 0.893,
      can_auto_post: true,

      // STATUS
      status: "pending",

      // AUDIT
      raw_llm_response: "Full LLM output...",
      model_used: "mistral-7b"
    }


    TIME: T+16s (Queue Entry)
    ─────────────────────────
    STORED IN engagement_queue:
    {
      id: "queue-uuid-001",
      response_id: "response-uuid-001",
      organization_id: "org-uuid-001",
      priority: 85,  // Based on CTS score
      status: "queued"
    }


    TIME: T+2h (Mobile Review)
    ──────────────────────────
    User swipes right on mobile app to approve.

    UPDATED IN responses:
    {
      status: "approved",
      reviewed_by: "user-uuid-001",
      reviewed_at: "2026-01-15T12:00:00Z",
      review_device: "mobile_ios"
    }

    STORED IN audit_log:
    {
      action_type: "response.approved",
      entity_type: "response",
      entity_id: "response-uuid-001",
      user_id: "user-uuid-001",
      device_type: "mobile_ios",
      action_data: {
        selected_type: "value_first",
        auto_post_eligible: true
      }
    }


    TIME: T+2h 5m (Posted)
    ──────────────────────
    UPDATED IN responses:
    {
      status: "posted",
      posted_at: "2026-01-15T12:05:00Z",
      posted_external_id: "reddit-comment-xyz",
      posted_external_url: "https://reddit.com/r/.../comment/xyz"
    }

    STORED IN audit_log:
    {
      action_type: "response.posted",
      entity_type: "response",
      entity_id: "response-uuid-001",
      action_data: {
        platform: "reddit",
        external_url: "https://reddit.com/..."
      }
    }


    TIME: T+24h (Clustering)
    ────────────────────────
    Post is grouped with similar posts.

    UPDATED IN responses:
    {
      cluster_id: "cluster-uuid-001"
    }

    STORED IN cluster_members:
    {
      cluster_id: "cluster-uuid-001",
      post_id: "post-uuid-001",
      similarity_score: 0.89
    }

    UPDATED IN clusters:
    {
      member_count: 143,  // Incremented
      last_activity_at: "2026-01-15T12:05:00Z"
    }
```

---

This architecture ensures:
- **Complete Data Retention**: Every piece of data is stored with full audit trail
- **Multi-Platform Support**: Web, mobile, and tablet all work seamlessly
- **Real-Time Sync**: Actions on any device reflect instantly on all devices
- **Scalable AI Pipeline**: Modular skills that can be updated independently
- **Multi-Tenant Security**: Complete data isolation between organizations
