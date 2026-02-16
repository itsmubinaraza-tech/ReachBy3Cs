# ReachBy3Cs

**Communicate. Connect. Community.**

AI-powered engagement platform that finds high-intent conversations online, generates contextual responses, and enables staff to review and post them.

## Live Demo

- **Web App**: [Deployed on Vercel](https://reachby3cs.vercel.app)

## Phase 1 Architecture (Current)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   SerpAPI    │────▶│    Python    │────▶│   Supabase   │
│   (Search)   │     │    Agent     │     │   Database   │
│              │     │              │     │              │
│  Google      │     │  - Signal    │     │  - Posts     │
│  searches    │     │  - Risk      │     │  - Responses │
│  across      │     │  - Response  │     │  - Queue     │
│  platforms   │     │  - CTA/CTS   │     │  - Audit     │
└──────────────┘     └──────────────┘     └──────────────┘
                            │                    │
                            ▼                    ▼
                     ┌────────────────────────────────┐
                     │     Vercel (Next.js Web App)   │
                     │                                │
                     │  Dashboard → Queue → Analytics │
                     └────────────────────────────────┘
                                    │
                                    ▼
                     ┌────────────────────────────────┐
                     │        HUMAN REVIEWER          │
                     │                                │
                     │  1. Review AI response         │
                     │  2. Approve/Reject             │
                     │  3. Copy response              │
                     │  4. Open original post         │
                     │  5. Paste & post manually      │
                     └────────────────────────────────┘
```

## Features

- **AI-Powered Search**: Find engagement opportunities across Reddit, Twitter, Quora, HN via SerpAPI
- **Signal Detection**: Identify problem categories and emotional intensity
- **Risk Scoring**: Classify content as Low/Medium/High/Blocked
- **Response Generation**: Create value-first, contextual responses
- **CTA Control**: Smart call-to-action scoring (0-3 levels)
- **Human Review**: Queue-based approval workflow
- **Analytics**: Track engagement performance
- **Community Detection**: Cluster similar discussions

## Tech Stack

| Component | Technology |
|-----------|------------|
| Web App | Next.js 14, Tailwind CSS, shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| AI Agent | Python, FastAPI, LangGraph |
| Search | SerpAPI |
| LLM | OpenAI GPT-4 / Claude |
| Hosting | Vercel (web), Railway (agent) |

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- Supabase account
- SerpAPI account
- OpenAI API key

### 1. Clone & Install

```bash
git clone https://github.com/itsmubinaraza-tech/ReachBy3Cs.git
cd ReachBy3Cs
npm install
```

### 2. Environment Setup

Create `apps/web/.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 3. Run Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Project Structure

```
ReachBy3Cs/
├── apps/
│   ├── web/                 # Next.js web app
│   │   ├── src/app/        # Pages (App Router)
│   │   ├── src/components/ # UI components
│   │   └── src/hooks/      # React hooks
│   └── mobile/             # React Native (future)
│
├── agent-service/          # Python AI service
│   ├── src/skills/        # AI skills
│   ├── src/crawlers/      # Platform crawlers
│   └── src/agents/        # LangGraph orchestrator
│
├── packages/               # Shared packages
│   ├── shared-types/      # TypeScript types
│   ├── api-client/        # API client
│   └── shared-utils/      # Utilities
│
└── supabase/              # Database config
```

## Workflow

### Phase 1 (Current): Human-in-the-Loop

1. **SerpAPI** searches Google for discussions (site:reddit.com, etc.)
2. **AI Agent** analyzes posts and generates responses
3. **Staff** reviews responses in dashboard queue
4. **Staff** copies approved response and posts manually
5. **System** tracks all engagements for analytics

### Phase 2 (Future): Auto-Posting

When platform APIs become available:
- Twitter/X API for auto-posting
- Reddit API for auto-posting
- LinkedIn API for business discussions

## Environment Variables

### Vercel (Web App)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Railway (Agent Service)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `SERPAPI_API_KEY`
- `OPENAI_API_KEY`

## Deployment

### Web App (Vercel)
```bash
git push origin main  # Auto-deploys
```

### Agent Service (Railway)
1. Connect GitHub repo to Railway
2. Set root directory to `agent-service`
3. Add environment variables
4. Deploy

## License

MIT

## Support

- GitHub Issues: [Report bugs](https://github.com/itsmubinaraza-tech/ReachBy3Cs/issues)
