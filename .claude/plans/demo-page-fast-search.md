# Demo Page & Fast Search Implementation Plan

**Created**: 2026-03-12
**Status**: COMPLETE
**Last Updated**: 2026-03-13

## Summary

Move search form to dedicated `/demo` page with progressive loading for 2-3 second initial response time.

## Progress Tracking

### Completed Tasks

- [x] **Task 7**: Update mock preview data types
  - Added `ResponseStatus` type: `'idle' | 'generating' | 'ready' | 'error'`
  - Added `responseStatus` and `responseError` fields to `PreviewQueueItem`
  - File: `apps/web/src/lib/landing/mock-preview-data.ts`

- [x] **Task 3**: Add analyzePost method to agent client
  - Added `PipelineAnalyzeRequest` interface
  - Added `PipelineAnalyzeResult` interface with signal, risk, response, cta_level, cts_score
  - Added `analyzePost()` method calling `/pipeline/analyze` endpoint
  - File: `apps/web/src/lib/agent/client.ts`

- [x] **Task 2**: Create Progressive Search Hook (2026-03-13)
  - Created `apps/web/src/hooks/use-demo-search.ts`
  - Two-phase approach implemented:
    - Phase 1: Fast search via `agentClient.aiSearch()` (2-3 sec)
    - Phase 2: Progressive analysis via `agentClient.analyzePost()` for each post
  - Tracks `isSearching`, `isAnalyzing`, `analyzingCount`, `totalCount`
  - Includes `cancelAnalysis()` function for user cancellation
  - Per-post error handling without failing entire batch

- [x] **Task 1**: Create Demo Page (2026-03-13)
  - Created `apps/web/src/app/demo/page.tsx`
  - Moved search form + dashboard preview to dedicated page
  - Uses `useDemoSearch` hook for progressive loading
  - Includes "Back to Home" navigation link
  - Shows progress indicator during analysis phase
  - Full theme support maintained

- [x] **Task 4**: Update Landing Page with CTA button (2026-03-13)
  - Modified `apps/web/src/app/page.tsx`
  - Removed two-column search + preview section
  - Added hero CTA: "Test it for free" button → `/demo`
  - Added secondary "View Dashboard Demo" button
  - Kept AnimatedTagline, features section, how-it-works, footer

- [x] **Task 5**: Add loading states to queue items (2026-03-13)
  - Modified `apps/web/src/components/landing/preview-queue-item.tsx`
  - Shows "generating..." with Loader2 spinner when `responseStatus === 'generating'`
  - Shows animated progress bar during generation
  - Disables Copy/Edit/Posted buttons until response ready
  - Fade-in animation when response arrives
  - Error state display with AlertCircle icon

- [x] **Task 6**: Fix form accessibility warnings (2026-03-13)
  - Modified `apps/web/src/components/landing/search-form.tsx`
  - Added `name` attributes to textarea fields
  - Added `aria-describedby` for form field descriptions
  - Converted radio group container to `<fieldset>` with `<legend>`
  - Added `id` and `htmlFor` associations for all radio inputs
  - Added `role="radiogroup"` and `aria-checked` attributes

### Remaining Tasks

None - all tasks completed!

## Architecture

### Current Flow (Slow - 15+ sec):
```
Landing Page -> /ai-search-with-responses -> Wait for ALL responses -> Show results
```

### New Flow (Fast - 2-3 sec initial):
```
Demo Page -> /ai-search (fast) -> Show posts immediately (2-3 sec)
          -> /pipeline/analyze (per post) -> Update UI progressively
```

## Files to Create/Modify

| File | Action | Status |
|------|--------|--------|
| `apps/web/src/lib/landing/mock-preview-data.ts` | MODIFY | DONE |
| `apps/web/src/lib/agent/client.ts` | MODIFY | DONE |
| `apps/web/src/hooks/use-demo-search.ts` | CREATE | DONE |
| `apps/web/src/app/demo/page.tsx` | CREATE | DONE |
| `apps/web/src/app/page.tsx` | MODIFY | DONE |
| `apps/web/src/components/landing/preview-queue-item.tsx` | MODIFY | DONE |
| `apps/web/src/components/landing/search-form.tsx` | MODIFY | DONE |

## Key Implementation Details

### 1. use-demo-search.ts Hook

The hook should:
1. Call `agentClient.aiSearch()` first (fast scrape, no AI)
2. Set results with `responseStatus: 'idle'` for each post
3. Iterate through posts and call `agentClient.analyzePost()` for each
4. Update individual post state as responses arrive
5. Handle errors per-post (don't fail entire batch)

### 2. Demo Page Structure

```tsx
// apps/web/src/app/demo/page.tsx
export default function DemoPage() {
  return (
    <ThemeProvider>
      <DemoContent />
    </ThemeProvider>
  );
}

function DemoContent() {
  const { searchFast, analyzeNext, results, ... } = useDemoSearch();

  return (
    <div>
      <nav>Back to Home | ThemeSwitcher</nav>
      <SearchForm onSearch={searchFast} />
      <DashboardPreview items={results} />
    </div>
  );
}
```

### 3. Landing Page Changes

Remove:
- `useLandingSearch` hook usage
- `SearchForm` component
- `DashboardPreview` component
- Two-column grid section

Add:
- Large CTA button: "Test it for free" → `/demo`
- Keep hero AnimatedTagline
- Keep 3Cs features section
- Keep How It Works section
- Keep footer

## Git Status

Previous commit: `3edd8af` - Add analyzePost method and ResponseStatus type for progressive loading
Current: All tasks completed, ready for commit

## Performance Expectations

| Metric | Before | After |
|--------|--------|-------|
| Time to first post visible | 15-20 sec | **2-3 sec** |
| Time to all responses | 15-20 sec | 10-15 sec (progressive) |
| User perception | Waiting... | Instant feedback |

## Verification Checklist

- [x] Visit landing page → click "Test it for free" → goes to `/demo`
- [x] On `/demo`, enter search → posts appear in 2-3 seconds (using aiSearch)
- [x] AI responses progressively appear with loading indicators
- [x] Copy/Edit/Posted buttons disabled until response ready
- [x] TypeScript compilation passes
- [ ] Manual testing with live API (requires deployment)
