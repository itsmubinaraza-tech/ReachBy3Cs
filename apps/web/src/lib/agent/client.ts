/**
 * Agent Service Client
 *
 * Client for communicating with the Python agent service on Render.
 * Handles crawling, AI analysis, and scheduled jobs.
 */

const AGENT_SERVICE_URL = process.env.NEXT_PUBLIC_AGENT_SERVICE_URL || 'http://localhost:8000';

interface SearchRequest {
  keywords: string[];
  limit?: number;
  site_filter?: string;
}

interface CrawlResult {
  platform: string;
  posts: Array<{
    id: string;
    platform: string;
    url: string;
    title: string;
    content: string;
    author: string;
    created_at: string;
    engagement: {
      upvotes?: number;
      comments?: number;
      shares?: number;
    };
  }>;
  total_found: number;
  crawl_time_seconds: number;
  errors: string[];
  rate_limited: boolean;
}

interface HealthResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  service: string;
  version: string;
  environment: string;
  timestamp: string;
}

interface ScheduleRequest {
  name: string;
  platform: string;
  keywords: string[];
  sources?: string[];
  frequency?: string;
  limit?: number;
  enabled?: boolean;
  extra_params?: Record<string, unknown>;
}

class AgentServiceClient {
  private baseUrl: string;

  constructor(baseUrl: string = AGENT_SERVICE_URL) {
    this.baseUrl = baseUrl;
  }

  private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Agent service error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Check agent service health
   */
  async health(): Promise<HealthResponse> {
    return this.fetch<HealthResponse>('/health');
  }

  /**
   * Search Google/SerpAPI for posts across platforms
   */
  async searchGoogle(request: SearchRequest): Promise<CrawlResult> {
    return this.fetch<CrawlResult>('/crawlers/google/search', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Search Reddit directly (requires API credentials)
   */
  async searchReddit(request: SearchRequest & { subreddits?: string[] }): Promise<CrawlResult> {
    return this.fetch<CrawlResult>('/crawlers/reddit/search', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Search Twitter directly (requires API credentials)
   */
  async searchTwitter(request: SearchRequest): Promise<CrawlResult> {
    return this.fetch<CrawlResult>('/crawlers/twitter/search', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Search for discussions across multiple platforms via Google
   */
  async searchDiscussions(
    keywords: string[],
    platforms?: string[],
    limit?: number
  ): Promise<CrawlResult> {
    return this.fetch<CrawlResult>('/crawlers/google/discussions', {
      method: 'POST',
      body: JSON.stringify({ keywords, platforms, limit }),
    });
  }

  /**
   * Schedule a recurring crawl
   */
  async scheduleCrawl(request: ScheduleRequest): Promise<{ job_id: string; message: string; next_run: string | null }> {
    return this.fetch('/crawlers/schedule', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * List all scheduled crawls
   */
  async listSchedules(): Promise<Array<Record<string, unknown>>> {
    return this.fetch('/crawlers/schedules');
  }

  /**
   * Get crawler status
   */
  async getStatus(): Promise<{
    running: boolean;
    paused: boolean;
    total_jobs: number;
    jobs: Array<Record<string, unknown>>;
    registered_crawlers: string[];
  }> {
    return this.fetch('/crawlers/status');
  }

  /**
   * Run a scheduled crawl immediately
   */
  async runCrawlNow(configName: string): Promise<CrawlResult> {
    return this.fetch<CrawlResult>(`/crawlers/run/${configName}`, {
      method: 'POST',
    });
  }

  /**
   * Start the scheduler
   */
  async startScheduler(): Promise<{ message: string }> {
    return this.fetch('/crawlers/scheduler/start', { method: 'POST' });
  }

  /**
   * Stop the scheduler
   */
  async stopScheduler(): Promise<{ message: string }> {
    return this.fetch('/crawlers/scheduler/stop', { method: 'POST' });
  }
}

// Singleton instance
export const agentClient = new AgentServiceClient();

// Export class for custom instances
export { AgentServiceClient };
export type { SearchRequest, CrawlResult, HealthResponse, ScheduleRequest };
