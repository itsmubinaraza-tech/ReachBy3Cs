# Needs-Matched Engagement Platform

## Project Overview

A multi-tenant SaaS platform that identifies high-intent conversations online, scores risk, generates contextual responses, and builds communities around recurring issues. The first tenant is weattuned.com (Emotional Intelligence app).

## Architecture

- **Monorepo**: Turborepo with npm workspaces
- **Web App**: Next.js 14+ (App Router) on Vercel
- **Mobile App**: React Native + Expo (iOS & Android)
- **Backend**: Python FastAPI + LangGraph for AI agents
- **Database**: Supabase (PostgreSQL with RLS)
- **LLM**: Self-hosted Llama/Mistral on vLLM

## Directory Structure

```
/
├── apps/
│   ├── web/          # Next.js web application
│   └── mobile/       # React Native/Expo mobile app
├── packages/
│   ├── shared-types/ # Shared TypeScript types
│   ├── api-client/   # Shared API client
│   └── shared-utils/ # Shared utilities
├── agent-service/    # Python AI service
└── supabase/         # Database migrations & config
```

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
- `agent-service/src/agents/engagement_pipeline.py` - LangGraph workflow

## Commands

```bash
# Development
npm run dev           # Start web app
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
```

## Feature Development Workflow

1. Read the task from the plan file
2. Create/update task in task list
3. Implement the feature
4. Write tests (unit + integration)
5. Run all tests
6. Mark task complete only when ALL tests pass
7. Do NOT proceed to next feature until current feature is fully tested

## Implementation Progress (Updated: 2026-02-14)

### Phase 1: Foundation - COMPLETE
- [x] Feature 1: Project Setup & Infrastructure
- [x] Feature 2: Database Schema & Migrations (15+ tables, RLS, audit trail)
- [x] Feature 3: Authentication & Multi-tenancy (Supabase Auth, RBAC with 4 roles)
- [x] Feature 4: Dashboard Layout & Navigation (responsive, mobile-first)

### Phase 2: Core AI Skills - PENDING
- [ ] Feature 5: React Native Mobile App Setup
- [ ] Feature 6: Python Agent Service Setup (FastAPI + LangGraph)
- [ ] Feature 7: Signal Detection Skill
- [ ] Feature 8: Risk Scoring Skill
- [ ] Feature 9: Response Generation Skill
- [ ] Feature 10: CTA Classifier & CTS Decision Skills

### Phase 3: Engagement Pipeline - PENDING
- [ ] Feature 11: Platform Crawlers (Reddit, Twitter, Quora, Google)
- [ ] Feature 12: Engagement Queue UI (Web + Mobile)
- [ ] Feature 13: Response Posting System
- [ ] Feature 14: Auto-post Automation

### Phase 4: Analytics & Community - PENDING
- [ ] Feature 15: Analytics Dashboard
- [ ] Feature 16: Community Cluster Detection
- [ ] Feature 17: Tenant Onboarding & Settings

## Current Test Status

- **Total Tests**: 117 passing
- **shared-utils**: 88 tests (validation + formatting)
- **api-client**: 11 tests (client operations)
- **web**: 18 tests (utility functions)
- **mobile**: No tests yet (--passWithNoTests)

## Key Files Created

### Database
- `supabase/migrations/20260213000001_initial_schema.sql` - Full schema
- `supabase/config.toml` - Local Supabase config
- `supabase/seed.sql` - Development seed data

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
