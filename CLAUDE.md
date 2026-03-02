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
│                     │       │                                        │
│                     │       ▼                                        │
│                     │   Projects ──▶ Search Configs                  │
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

### Data Model (Organization Structure)

┌───────────────┐
│  Organization │
└───────┬───────┘
        │ has many
        ▼
┌───────────────┐
│    Project    │  (max unlimited per org)
│               │
│ - name        │
│ - description │
│ - tone        │
│ - value_prop  │
│ - status      │
└───────┬───────┘
        │ has many (max 10)
        ▼
┌───────────────────────┐
│  Project Search Config │
│                       │
│ - keywords[]          │
│ - excluded_keywords[] │
│ - matching_mode       │
│ - max_post_age_days   │
│ - platforms[]         │
│ - reddit_subreddits[] │
│ - min_engagement      │
│ - crawl_frequency     │
└───────────────────────┘
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

## Implementation Progress (Updated: 2026-03-02)

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
- [x] Feature 11: Platform Crawlers (SerpAPI integration working)
- [x] Feature 12: Engagement Queue UI (Web + Mobile)
- [x] Feature 13: Response Posting System (manual copy/paste workflow)
- [ ] Feature 14: Auto-post Automation (Phase 2 - needs platform APIs)

### Phase 4: Analytics & Community - COMPLETE (Code Written)
- [x] Feature 15: Analytics Dashboard
- [x] Feature 16: Community Cluster Detection
- [x] Feature 17: Tenant Onboarding & Settings

### Deployment Status
- [x] Web App deployed on Vercel
  - Production: https://reachby3cs.com (custom domain)
  - Preview: https://reachby3cs.vercel.app
- [x] Supabase database configured (https://lwubdaoaqoutcutqhnim.supabase.co)
- [x] SerpAPI integration working
- [x] Python agent service deployed on Render (https://reachby3cs-agent.onrender.com)
- [x] First end-to-end test completed

### Additional Features (2026 Sprint)
- [x] Feature 1: Fix Signup Flow & Add Google OAuth
- [x] Feature 2: Database Schema - Projects & Search Configs
- [x] Feature 3: Projects UI - List & Create
- [x] Feature 4: Project Detail & Search Config Form
- [x] Feature 5: Improve Queue Approval Workflow
- [x] Feature 6: Organization Onboarding Enhancement

### Previously Completed
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

## Pricing

3-tier pricing model based on AI processing and search costs:

| Plan | Price | Responses/mo | Detections/mo | Key Features |
|------|-------|--------------|---------------|--------------|
| **Starter** | $49 | 500 | 1,000 | 1 project, 3 configs, Reddit & Quora, manual posting |
| **Professional** | $149 | 2,500 | 10,000 | 5 projects, 10 configs each, all platforms, auto-post, API |
| **Enterprise** | $399 | 10,000 | 50,000 | Unlimited projects, custom AI, white-label, SLA |

Overage rates: $0.05/response, $0.01/detection

## Demo Ready

Run `npm run dev` and visit http://localhost:3000 to see:
- **Landing Page**: 3Cs branding, value props, how it works, pricing section
- **Dashboard**: Stats and recent activity (at /dashboard)
- **Queue**: Approve/reject/edit + Copy/Open Original/Mark Posted (at /dashboard/queue)
- **Projects**: Create and manage projects with search configs (at /dashboard/projects)
- **Demo Mode**: Click "Try Free Demo" to see mock data without signup
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

### Projects System (New)
- `apps/web/src/app/(dashboard)/dashboard/projects/page.tsx` - Projects list
- `apps/web/src/app/(dashboard)/dashboard/projects/new/page.tsx` - Create project form
- `apps/web/src/app/(dashboard)/dashboard/projects/[id]/page.tsx` - Project detail with search configs
- `apps/web/src/hooks/use-projects.ts` - Projects CRUD hook with memoization
- `apps/web/src/hooks/use-search-configs.ts` - Search configs CRUD hook
- `apps/web/src/components/projects/project-card.tsx` - Project card, empty state, skeleton
- `apps/web/src/components/projects/search-config-form.tsx` - Search config form with all fields
- `apps/web/src/components/projects/keyword-manager.tsx` - Tag-based keyword input

### Onboarding Flow (New)
- `apps/web/src/app/(auth)/post-oauth/page.tsx` - Post-OAuth options (create org, join, demo)
- `apps/web/src/app/(dashboard)/onboarding/organization/page.tsx` - Create organization form
- `apps/web/src/app/(dashboard)/onboarding/project/page.tsx` - Create first project with keywords

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

The Python agent service (`agent-service/`) uses LangGraph for AI skills.
**Production URL**: https://reachby3cs-agent.onrender.com

### API Endpoints

#### Health & Status
```bash
GET /health                    # Service health check
GET /health/ready              # Readiness probe
```

#### Crawlers (SerpAPI-powered)
```bash
# Search Google for discussions on specific platforms
POST /crawlers/google/search
{
  "keywords": ["topic to search"],
  "limit": 10,
  "site_filter": "reddit.com"  # Optional: filter to specific site
}

# Search across multiple discussion platforms
POST /crawlers/google/discussions?limit=10
{
  "keywords": ["search terms"],
  "platforms": ["reddit", "quora"]  # Optional filter
}
```

#### Pipeline (Full AI Processing)
```bash
# Process a post and save to queue
POST /pipeline/process-and-save
{
  "url": "https://reddit.com/r/...",
  "text": "Post content to analyze",
  "platform": "reddit",
  "organization_id": "uuid-here"
}
# Returns: { "status": "success", "queue_id": "...", "cts_score": 0.8, "requires_review": true }

# Analyze without saving (for testing)
POST /pipeline/analyze
{
  "text": "Post content",
  "platform": "reddit",
  "tenant_context": {
    "app_name": "WeAttuned",
    "value_prop": "Emotional intelligence app for couples"
  }
}
```

#### Individual Skills
```bash
POST /skills/signal-detection     # Detect problem signals
POST /skills/risk-scoring         # Score risk level
POST /skills/response-generation  # Generate responses
POST /skills/cta-classifier       # Classify CTA level
POST /skills/cts-decision         # Calculate confidence-to-send
```

#### Clustering
```bash
GET /clustering/clusters?organization_id=xxx     # List clusters
GET /clustering/trending?organization_id=xxx     # Get trending clusters
POST /clustering/assign                          # Assign post to cluster
POST /clustering/run                             # Re-cluster all posts
```

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

### Agent Service (Render)
- URL: https://reachby3cs-agent.onrender.com
- Health check: https://reachby3cs-agent.onrender.com/health
- API docs: https://reachby3cs-agent.onrender.com/docs

## Known Issues & Fixes

### Queue Status Mapping (Fixed 2026-03-02)
**Issue**: Queue page showed 0 items despite data existing in database.
**Cause**: Database stores `status: 'queued'` but UI filtered for `status: 'pending'`.
**Fix**: In `apps/web/src/hooks/use-queue.ts`, map status on fetch:
```typescript
status: item.status === 'queued' ? 'pending' : item.status
```

### Supabase Client Memoization (Fixed 2026-03-02)
**Issue**: WebSocket infinite reconnection loop, excessive re-renders.
**Cause**: `createClient()` called on every render, included in useEffect dependencies.
**Fix**: Memoize Supabase client in all hooks:
```typescript
const supabase = useMemo(() => createClient(), []);
```
**Files fixed**:
- `apps/web/src/hooks/use-queue.ts`
- `apps/web/src/hooks/use-dashboard-stats.ts`
- `apps/web/src/hooks/use-realtime-queue.ts`

### RLS Policy for Signup (Fixed 2026-03-02)
**Issue**: "Failed to create organization" error on signup.
**Cause**: Missing INSERT policies on `organizations` and `users` tables.
**Fix**: Added RLS policies:
```sql
CREATE POLICY "orgs_insert" ON public.organizations
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
```

### Demo Mode Showing Empty Queue (Fixed 2026-03-02)
**Issue**: Demo mode users saw 0 items in queue instead of mock data.
**Cause**: `shouldUseMockData` logic was too restrictive and had timing issues with state initialization.
**Fix**: Simplified logic and used lazy state initializer:
```typescript
// Use lazy initializer to get demo mode synchronously on first client render
const [isDemo, setIsDemo] = useState(() => getDemoModeFromStorage());

// Use mock data if demo mode is enabled OR user is not authenticated
const shouldUseMockData = isDemo || !user;
```
**Files fixed**:
- `apps/web/src/app/(dashboard)/dashboard/queue/page.tsx`
- `apps/web/src/hooks/use-dashboard-stats.ts`

## Queue Workflow

The queue supports manual posting with the following actions:

1. **Approve** - Mark response as approved (green button)
2. **Reject** - Mark response as rejected (red button)
3. **Edit** - Open editor to modify response before approval (gray button)
4. **Copy** - Copy response text to clipboard (for pasting on platform)
5. **Open Original** - Open the original post URL in new tab
6. **Mark Posted** - Mark as manually posted (completes the workflow)

Keyboard shortcuts: `a` approve, `r` reject, `e` edit, `c` copy, `o` open, `p` posted

## Test Plans

### Unit Test Guidelines
All new features must include unit tests covering:
- Component rendering
- User interactions (clicks, input changes)
- State management
- Error handling
- Edge cases

### E2E Test Guidelines
Critical user flows must have E2E tests:
- Authentication (login, signup, OAuth)
- Queue operations (approve, reject, copy, post)
- Project management (create, edit, delete)
- Settings changes

### Test Commands
```bash
# Run unit tests
npm run test

# Run unit tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui
```

### Test Coverage Requirements
- **Minimum Coverage**: 80% for new code
- **Critical Paths**: 100% coverage for auth and payment flows
- **Components**: All exported components must have render tests

## Crawling Workflow

To crawl for new posts and add to queue:

```bash
# 1. Search for posts (returns post URLs and snippets)
curl -X POST "https://reachby3cs-agent.onrender.com/crawlers/google/search" \
  -H "Content-Type: application/json" \
  -d '{"keywords": ["your search topic"], "limit": 10, "site_filter": "reddit.com"}'

# 2. Process each post through AI pipeline and save to queue
curl -X POST "https://reachby3cs-agent.onrender.com/pipeline/process-and-save" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://reddit.com/r/...",
    "text": "Full post content",
    "platform": "reddit",
    "organization_id": "your-org-uuid"
  }'
```

Each processed post:
1. Gets analyzed for signals (keywords, emotional intensity)
2. Gets risk scored (low/medium/high/blocked)
3. Gets 3 response variants generated (value_first, soft_cta, contextual)
4. Gets CTA level classified (0-3)
5. Gets CTS score calculated (confidence-to-send)
6. Gets added to engagement_queue for human review
