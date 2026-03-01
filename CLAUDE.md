# ReachBy3Cs - AI-Powered Engagement Platform

## Brand Identity

**Name**: ReachBy3Cs
**Tagline**: Communicate. Connect. Community.
**Domain**: reachby3cs.com

The 3Cs represent the core pillars:
- **Communicate**: AI detects high-intent conversations and generates authentic responses
- **Connect**: Engage at scale without being spammy, with smart CTA controls
- **Community**: Turn scattered conversations into organized communities

## Project Overview

A multi-tenant SaaS platform that identifies high-intent conversations online, scores risk, generates contextual responses, and builds communities around recurring issues. The first tenant is weattuned.com (Emotional Intelligence app).

## Current Phase: Phase 1 (Human-in-the-Loop)

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         PHASE 1 ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                │
│  │  SerpAPI    │───▶│   Python    │───▶│  Supabase   │                │
│  │  (Search)   │    │   Agent     │    │  Database   │                │
│  │             │    │   Service   │    │             │                │
│  │ Finds posts │    │ AI Skills:  │    │ Stores:     │                │
│  │ on Reddit,  │    │ - Signal    │    │ - Posts     │                │
│  │ Twitter,    │    │ - Risk      │    │ - Signals   │                │
│  │ Quora, HN   │    │ - Response  │    │ - Responses │                │
│  │ via Google  │    │ - CTA/CTS   │    │ - Queue     │                │
│  └─────────────┘    └─────────────┘    └─────────────┘                │
│                            │                  │                        │
│                            ▼                  ▼                        │
│                     ┌─────────────────────────────┐                   │
│                     │   Vercel (Next.js Web App)  │                   │
│                     │                             │                   │
│                     │  Dashboard ──▶ Queue ──▶ Analytics             │
│                     └─────────────────────────────┘                   │
│                                   │                                    │
│                                   ▼                                    │
│                     ┌─────────────────────────────┐                   │
│                     │      HUMAN REVIEWER         │                   │
│                     │                             │                   │
│                     │  1. Review AI response      │                   │
│                     │  2. Click "Approve"         │                   │
│                     │  3. Click "Copy Response"   │                   │
│                     │  4. Click "Open Original"   │                   │
│                     │  5. Paste & Post manually   │ ◀── Manual Step  │
│                     │  6. Mark as "Posted"        │                   │
│                     └─────────────────────────────┘                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Why Phase 1 (Manual Posting)?

- **Reddit API**: Registration process is complex/blocked
- **Twitter/X API**: In progress
- **Solution**: Use SerpAPI to FIND posts, human posts responses manually
- **Benefit**: Works immediately without waiting for API approvals

### Tech Stack

- **Monorepo**: Turborepo with npm workspaces
- **Web App**: Next.js 14+ (App Router) on Vercel - DEPLOYED
- **Mobile App**: React Native + Expo (future)
- **Search**: SerpAPI (Google search across platforms)
- **Backend**: Python FastAPI + LangGraph for AI agents
- **Database**: Supabase (PostgreSQL with RLS)
- **LLM**: OpenAI GPT-4 / Claude API

## Directory Structure

```
/
├── apps/
│   ├── web/          # Next.js web application
│   │   ├── src/app/  # Pages (landing, dashboard, queue, etc.)
│   │   ├── src/components/  # UI components
│   │   ├── src/hooks/       # Custom React hooks
│   │   └── src/contexts/    # React contexts
│   └── mobile/       # React Native/Expo mobile app
├── packages/
│   ├── shared-types/ # Shared TypeScript types
│   ├── api-client/   # Shared API client
│   └── shared-utils/ # Shared utilities
├── agent-service/    # Python AI service
└── supabase/         # Database migrations & config
```

## User Flows

### Free Trial Flow
1. User visits landing page (/)
2. Clicks "Start Free Trial" or "Try Free Demo"
3. Trial tracked in localStorage (10 uses max)
4. User sees dashboard with trial banner showing remaining uses
5. When trial expires, redirected to signup

### Authenticated Flow
1. User signs up/logs in
2. Creates or joins organization
3. Accesses dashboard, queue, analytics
4. Approves/rejects AI-generated responses
5. Mobile users can swipe to approve/reject

## Coding Conventions

### TypeScript/JavaScript
- Use TypeScript everywhere (strict mode)
- Prefer functional components with hooks
- Use named exports, not default exports
- File naming: kebab-case (e.g., `user-menu.tsx`)
- Component naming: PascalCase (e.g., `UserMenu`)
- Use absolute imports with `@/` prefix

### React/Next.js
- Use Server Components by default, Client Components only when needed
- Colocate components with their pages when page-specific
- Shared components go in `/components`
- Use shadcn/ui component patterns
- Mobile-first responsive design (Tailwind breakpoints: sm, md, lg, xl, 2xl)

### React Native/Expo
- Use Expo Router for navigation (file-based routing)
- Use NativeWind for styling (Tailwind classes)
- Prefer functional components with hooks
- Use MMKV for local storage

### Python
- Use Python 3.11+
- Type hints required on all functions
- Use Pydantic for data validation
- Follow PEP 8 style guide
- Use pytest for testing

### Database
- All tables must have RLS policies
- Use UUIDs for primary keys
- Include created_at and updated_at timestamps
- Never delete data - use soft deletes or status flags
- Full audit trail required for all user actions

## Testing Requirements

- **Unit Tests**: Required for all utility functions and business logic
- **Integration Tests**: Required for API endpoints and database operations
- **E2E Tests**: Required for critical user flows (auth, queue approval)
- **Mobile Tests**: Detox for critical mobile flows
- Test coverage target: >80%

## Key Principles

1. **Mobile-First**: Design for mobile, enhance for desktop
2. **Full Data Retention**: Never delete engagement data, retain all AI outputs
3. **Audit Everything**: Log all user actions with device info
4. **Type Safety**: TypeScript strict mode, no `any` types
5. **Test Before Merge**: All tests must pass before feature completion
6. **Speed to Market**: Prioritize working features over perfect code

## Important Files

- `C:\Users\Mubina\.claude\plans\fancy-sauteeing-flurry.md` - Full implementation plan
- `supabase/migrations/` - Database schema with audit trail
- `apps/web/src/middleware.ts` - Auth middleware
- `apps/web/src/app/page.tsx` - Landing page with 3Cs branding
- `apps/web/src/hooks/use-trial.ts` - Free trial tracking hook
- `apps/web/src/components/trial/trial-banner.tsx` - Trial status banner
- `agent-service/src/agents/engagement_pipeline.py` - LangGraph workflow

## Commands

```bash
# Development
npm run dev           # Start web app (http://localhost:3000)
npm run dev:mobile    # Start Expo dev server
npm run dev:all       # Start all apps

# Testing
npm run test          # Run all unit tests
npm run test:e2e      # Run Playwright E2E tests
npm run test:mobile   # Run Detox mobile tests

# Build
npm run build         # Build all packages
npm run typecheck     # Check TypeScript

# Database
npx supabase start    # Start local Supabase
npx supabase db reset # Reset database with migrations
npx supabase db push --linked  # Push to cloud Supabase
```

## Environment Variables

### Web App - Vercel (apps/web)
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_DEMO_MODE=false
```

### Python Agent Service - Railway/Render (agent-service)
```
# Database
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...

# Search (Phase 1)
SERPAPI_API_KEY=xxx

# LLM
OPENAI_API_KEY=sk-xxx

# Platform APIs (Phase 2 - when available)
TWITTER_API_KEY=xxx
TWITTER_API_SECRET=xxx
TWITTER_ACCESS_TOKEN=xxx
TWITTER_ACCESS_SECRET=xxx
```

## Feature Development Workflow

1. Read the task from the plan file
2. Create/update task in task list
3. Implement the feature
4. Write tests (unit + integration)
5. Run all tests
6. Mark task complete only when ALL tests pass
7. Do NOT proceed to next feature until current feature is fully tested

## Implementation Progress (Updated: 2026-02-15)

### Phase 1: Foundation - COMPLETE
- [x] Feature 1: Project Setup & Infrastructure
- [x] Feature 2: Database Schema & Migrations (15+ tables, RLS, audit trail)
- [x] Feature 3: Authentication & Multi-tenancy (Supabase Auth, RBAC with 4 roles)
- [x] Feature 4: Dashboard Layout & Navigation (responsive, mobile-first)
- [x] Feature 5: React Native Mobile App Setup (auth, queue, swipe gestures)

### Phase 2: Core AI Skills - COMPLETE (Code Written)
- [x] Feature 6: Python Agent Service Setup (FastAPI + LangGraph)
- [x] Feature 7: Signal Detection Skill
- [x] Feature 8: Risk Scoring Skill
- [x] Feature 9: Response Generation Skill
- [x] Feature 10: CTA Classifier & CTS Decision Skills

### Phase 3: Engagement Pipeline - COMPLETE (Code Written)
- [x] Feature 11: Platform Crawlers (updating to SerpAPI)
- [x] Feature 12: Engagement Queue UI (Web + Mobile)
- [x] Feature 13: Response Posting System (manual copy/paste workflow)
- [ ] Feature 14: Auto-post Automation (Phase 2 - needs platform APIs)

### Phase 4: Analytics & Community - COMPLETE (Code Written)
- [x] Feature 15: Analytics Dashboard
- [x] Feature 16: Community Cluster Detection
- [x] Feature 17: Tenant Onboarding & Settings

### Deployment Status
- [x] Web App deployed on Vercel
- [ ] Supabase database configured (needs env vars)
- [ ] SerpAPI integration (needs API key)
- [ ] Python agent service deployed (needs Railway/Render)
- [ ] First end-to-end test

### Additional Features
- [x] Landing Page: ReachBy3Cs branding with 3Cs sections
- [x] Free Trial System: 10 uses with localStorage tracking
- [x] Trial Banner: Shows remaining uses in dashboard
- [ ] Interactive Walkthrough: Guided tour for new users (pending)

## Current Test Status

- **Total Tests**: 117+ passing
- **shared-utils**: 88 tests (validation + formatting)
- **api-client**: 11 tests (client operations)
- **web**: 18 tests (utility functions)
- **mobile**: Tests pending (--passWithNoTests)
- **agent-service**: Python service ready for testing

## Demo Ready

Run `npm run dev` and visit http://localhost:3000 to see:
- **Landing Page**: 3Cs branding, value props, how it works, signup CTA
- **Dashboard**: Stats and recent activity (at /dashboard)
- **Queue**: Approve/reject functionality (at /dashboard/queue)
- **Trial Banner**: Shows remaining free trial uses
- **Responsive Layout**: Mobile/tablet/desktop views

## Key Files Created

### Landing & Trial System
- `apps/web/src/app/page.tsx` - Landing page with 3Cs branding
- `apps/web/src/hooks/use-trial.ts` - Trial tracking hook
- `apps/web/src/components/trial/trial-banner.tsx` - Trial status banner

### Database
- `supabase/migrations/20260213000001_initial_schema.sql` - Full schema
- `supabase/config.toml` - Local Supabase config
- `supabase/seed.sql` - Development seed data (organizations, posts, responses, etc.)

### Packages
- `packages/shared-types/src/database.ts` - All DB types + insert/update helpers
- `packages/api-client/src/repositories/` - Type-safe repository layer

### Web App
- `apps/web/src/middleware.ts` - Auth protection middleware
- `apps/web/src/contexts/auth-context.tsx` - Auth state management
- `apps/web/src/contexts/org-context.tsx` - Organization context
- `apps/web/src/lib/auth/rbac.ts` - Role-based permissions (25+ permissions)
- `apps/web/src/components/layout/` - Responsive navigation components
- `apps/web/src/hooks/` - Device detection, keyboard shortcuts, sidebar state
- `apps/web/src/app/(dashboard)/dashboard/page.tsx` - Dashboard with stats
- `apps/web/src/app/(dashboard)/dashboard/queue/page.tsx` - Queue with approve/reject
- `apps/web/vercel.json` - Vercel deployment config

### Mobile App
- `apps/mobile/lib/supabase.ts` - Supabase client with secure storage
- `apps/mobile/lib/storage.ts` - MMKV offline storage
- `apps/mobile/contexts/AuthContext.tsx` - Mobile auth management
- `apps/mobile/contexts/OrganizationContext.tsx` - Organization context
- `apps/mobile/hooks/useQueue.ts` - Queue data with offline sync
- `apps/mobile/app/(auth)/login.tsx` - Login with biometrics
- `apps/mobile/app/(auth)/signup.tsx` - Signup with validation
- `apps/mobile/app/(auth)/forgot-password.tsx` - Password reset
- `apps/mobile/app/(app)/(tabs)/queue.tsx` - Swipe-to-approve queue
- `apps/mobile/app/(app)/queue/[id].tsx` - Full response detail view

### Python Agent Service
- `agent-service/pyproject.toml` - Dependencies (FastAPI, LangGraph, etc.)
- `agent-service/src/main.py` - FastAPI app entry point
- `agent-service/src/config.py` - Pydantic settings management
- `agent-service/src/api/routes/health.py` - Health check endpoints
- `agent-service/Dockerfile` - Container configuration

## Agent Service Architecture

The Python agent service (`agent-service/`) uses LangGraph for AI skills:

### When Skills are Triggered

1. **Crawl API called** (`/api/crawl`) → Signal Detection → Risk Scoring
2. **Process API called** (`/api/process`) → Response Generation → CTA/CTS Decision
3. **Queue approval** → Updates response status, triggers posting flow

### Skill Execution Order

```
SerpAPI finds posts → Signal Detection → Risk Scoring → Response Generation → CTA Classifier → CTS Decision → Queue for review
```

### Key Skills

| Skill | Purpose | Input | Output |
|-------|---------|-------|--------|
| Signal Detection | Identifies high-intent conversations | Post content | Signal with keywords, emotional intensity |
| Risk Scoring | Assesses response risk level | Signal data | Risk level (low/medium/high/blocked) |
| Response Generation | Creates contextual responses | Signal + Risk | 3 response variants |
| CTA Classifier | Determines CTA level (0-3) | Response content | CTA level score |
| CTS Decision | Calculates Can-To-Send score | All analysis | CTS score, auto-post eligibility |

## Deployment

### Vercel (Web App)
1. Push code to GitHub
2. Import repository in Vercel
3. Set Root Directory to `apps/web` (uses root vercel.json for config)
4. Add environment variables
5. Deploy

### Supabase (Database)
- Project URL: https://lwubdaoaqoutcutqhnim.supabase.co
- Migrations pushed with `npx supabase db push --linked`
- Seed data loaded with `npx supabase db reset --linked`

### Database Triggers
- `handle_new_user()` - Auto-creates user profile when user signs up via Supabase Auth
- Ensures RLS policies work correctly for new users
