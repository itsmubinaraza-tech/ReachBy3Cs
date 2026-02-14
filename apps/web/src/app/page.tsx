export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Needs-Matched Engagement Platform
          </h1>
          <p className="text-muted-foreground">
            AI-powered engagement for meaningful conversations
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="text-sm font-medium">System Online</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <p className="font-medium">Web App</p>
                <p className="text-muted-foreground">Next.js 14</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium">Mobile App</p>
                <p className="text-muted-foreground">React Native</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium">Database</p>
                <p className="text-muted-foreground">Supabase</p>
              </div>
              <div className="space-y-1">
                <p className="font-medium">AI Agent</p>
                <p className="text-muted-foreground">LangGraph</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Version 0.1.0 &middot; Feature 1: Project Setup
        </p>
      </div>
    </main>
  );
}
