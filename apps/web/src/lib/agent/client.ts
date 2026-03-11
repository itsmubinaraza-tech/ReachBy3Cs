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
    external_id: string;
    platform: string;
    external_url: string;
    content: string;
    author_handle?: string;
    author_display_name?: string;
    external_created_at?: string;
    crawled_at: string;
    engagement_metrics: {
      upvotes?: number;
      comments?: number;
      shares?: number;
    };
    platform_metadata?: {
      source_platform?: string;
      position?: number;
      displayed_link?: string;
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

interface EnhancedPost {
  external_id: string;
  external_url: string;
  content: string;
  platform: string;
  author_handle?: string;
  author_display_name?: string;
  external_created_at?: string;
  crawled_at: string;
  engagement_metrics: {
    upvotes?: number;
    comments?: number;
    shares?: number;
  };
  platform_metadata?: {
    source_platform?: string;
    position?: number;
    displayed_link?: string;
  };
  // AI-generated fields
  ai_response: string;
  response_variants: {
    value_first: string;
    soft_cta: string;
    contextual: string;
  };
  risk_level: 'low' | 'medium' | 'high' | 'blocked';
  cts_score: number;
  error?: string;
}

interface AISearchWithResponsesResult {
  posts: EnhancedPost[];
  total_found: number;
  crawl_time_seconds: number;
  pipeline_time_seconds: number;
  errors: string[];
  rate_limited: boolean;
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
   * AI-powered search that generates optimal queries from natural language
   */
  async aiSearch(
    targetAudience: string,
    solution: string,
    platforms?: string[],
    limit?: number
  ): Promise<CrawlResult> {
    return this.fetch<CrawlResult>('/crawlers/google/ai-search', {
      method: 'POST',
      body: JSON.stringify({
        target_audience: targetAudience,
        solution: solution,
        platforms,
        limit,
      }),
    });
  }

  /**
   * AI-powered search that generates optimal queries AND AI responses for each post.
   * Returns posts with AI-drafted responses ready for sales agents.
   */
  async aiSearchWithResponses(
    targetAudience: string,
    solution: string,
    platforms?: string[],
    limit?: number
  ): Promise<AISearchWithResponsesResult> {
    return this.fetch<AISearchWithResponsesResult>('/crawlers/google/ai-search-with-responses', {
      method: 'POST',
      body: JSON.stringify({
        target_audience: targetAudience,
        solution: solution,
        platforms,
        limit,
        generate_responses: true,
      }),
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
export type {
  SearchRequest,
  CrawlResult,
  HealthResponse,
  ScheduleRequest,
  EnhancedPost,
  AISearchWithResponsesResult,
};
