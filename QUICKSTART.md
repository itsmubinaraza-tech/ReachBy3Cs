# Quick Start Guide

Get the Needs-Matched Engagement Platform running locally in 5 minutes.

## Prerequisites

- Node.js 18.17+
- npm 10+
- Git

## 1. Install Dependencies

```bash
cd needs-matched-platform_N_community
npm install
```

## 2. Environment Setup

```bash
# Copy environment template
copy .env.example .env

# For the demo, the defaults work fine (uses mock data)
# For Supabase integration, you'll need to update the Supabase keys
```

## 3. Run the Web App

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### What You'll See

- **Login Page**: Demo credentials or create account
- **Dashboard**: Quick stats and recent activity
- **Queue**: Pending responses to approve/reject
- **Mobile-responsive**: Resize browser to see mobile layout

## 4. Run the Mobile App (Optional)

Requires Expo CLI:

```bash
# Install Expo CLI globally (if not installed)
npm install -g @expo/cli

# Start mobile app
npm run dev:mobile
```

Scan the QR code with Expo Go app on your phone.

## 5. Run Python Agent Service (Optional)

```bash
cd agent-service
pip install -e .
uvicorn src.main:app --reload
```

Health check: http://localhost:8000/health

---

## Demo Features

### Web Dashboard
- Responsive layout (mobile/tablet/desktop)
- Queue with approve/reject actions
- Filter by risk level, CTS score
- Keyboard shortcuts (j/k to navigate, a to approve, r to reject)

### Mobile App
- Swipe right to approve
- Swipe left to reject
- Pull to refresh
- Biometric authentication
- Offline support

---

## Project Structure

```
needs-matched-platform_N_community/
├── apps/
│   ├── web/          # Next.js web app
│   └── mobile/       # React Native/Expo app
├── packages/
│   ├── shared-types/ # TypeScript types
│   ├── api-client/   # API client
│   └── shared-utils/ # Utilities
├── agent-service/    # Python AI service
└── supabase/         # Database config
```

## Commands Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start web app |
| `npm run dev:mobile` | Start mobile app |
| `npm run dev:all` | Start all apps |
| `npm run test` | Run all tests |
| `npm run build` | Build for production |
| `npm run typecheck` | Check TypeScript |

## Troubleshooting

### Port already in use
```bash
# Kill process on port 3000
npx kill-port 3000
```

### Module not found
```bash
npm install
npm run build
```

### Mobile app not connecting
- Ensure phone and computer on same network
- Try `npx expo start --tunnel`

---

## Next Steps

1. Set up Supabase (local or cloud)
2. Configure environment variables
3. Run database migrations
4. Test the full flow

See [CLAUDE.md](./CLAUDE.md) for full implementation details.
