/**
 * Domain entities and business logic types
 */

import type { RiskLevel, CTALevel, ResponseType, ResponseStatus } from './database';

// ============================================
// Engagement Pipeline
// ============================================

/**
 * Full engagement pipeline state
 * Represents the complete flow from post detection to response posting
 */
export interface EngagementPipeline {
  postId: string;
  signalId: string;
  riskScoreId: string;
  responseId: string;

  // Pipeline stages
  stages: {
    detection: PipelineStage;
    signalAnalysis: PipelineStage;
    riskScoring: PipelineStage;
    responseGeneration: PipelineStage;
    ctaClassification: PipelineStage;
    ctsDecision: PipelineStage;
  };

  // Final decision
  decision: {
    canAutoPost: boolean;
    requiresReview: boolean;
    isBlocked: boolean;
    reason: string;
  };
}

export interface PipelineStage {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startedAt: string | null;
  completedAt: string | null;
  error: string | null;
}

// ============================================
// Queue Management
// ============================================

/**
 * Queue item for display in the approval queue
 */
export interface QueueItemDisplay {
  id: string;

  // Original content
  original: {
    platform: PlatformInfo;
    content: string;
    authorHandle: string | null;
    url: string;
    detectedAt: string;
  };

  // AI analysis results
  analysis: {
    problemCategory: string | null;
    emotionalIntensity: number;
    keywords: string[];
    riskLevel: RiskLevel;
    riskScore: number;
    riskFactors: string[];
  };

  // Generated responses
  responses: {
    valueFirst: string | null;
    softCta: string | null;
    contextual: string | null;
    selected: string;
    selectedType: ResponseType;
  };

  // Decision metrics
  metrics: {
    ctaLevel: CTALevel;
    ctsScore: number;
    canAutoPost: boolean;
  };

  // Community
  cluster: {
    id: string;
    name: string;
    memberCount: number;
  } | null;

  // Queue metadata
  status: ResponseStatus;
  priority: number;
  createdAt: string;
}

export interface PlatformInfo {
  id: string;
  name: string;
  slug: string;
  iconUrl: string | null;
}

// ============================================
// Community & Clusters
// ============================================

/**
 * Community cluster with engagement stats
 */
export interface CommunityCluster {
  id: string;
  name: string;
  description: string | null;

  // Cluster characteristics
  keywords: string[];
  problemCategory: string | null;
  avgEmotionalIntensity: number;

  // Stats
  stats: {
    memberCount: number;
    engagementCount: number;
    growthRate: number; // percentage change
  };

  // AI insights
  insights: {
    summary: string | null;
    trendingTopics: string[];
    suggestedActions: string[];
  };

  // Timestamps
  firstDetectedAt: string;
  lastActivityAt: string;
}

// ============================================
// Analytics & Reporting
// ============================================

/**
 * Dashboard overview data
 */
export interface DashboardOverview {
  // Today's metrics
  today: {
    postsDetected: number;
    responsesGenerated: number;
    responsesApproved: number;
    responsesRejected: number;
    autoPosted: number;
    pendingReview: number;
  };

  // Trends (vs previous period)
  trends: {
    postsChange: number;
    approvalRateChange: number;
    ctsScoreChange: number;
  };

  // System health
  health: {
    allSystemsOperational: boolean;
    services: ServiceStatus[];
  };
}

export interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  latency?: number;
}

/**
 * Funnel analytics
 */
export interface FunnelAnalytics {
  stages: FunnelStage[];
  conversionRate: number;
}

export interface FunnelStage {
  name: string;
  count: number;
  percentage: number;
  dropoff: number;
}

// ============================================
// User & Organization
// ============================================

/**
 * Current user session context
 */
export interface UserSession {
  user: {
    id: string;
    email: string;
    fullName: string | null;
    avatarUrl: string | null;
    role: string;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  preferences: {
    pushNotifications: boolean;
    emailNotifications: boolean;
    theme: 'light' | 'dark' | 'system';
  };
}

// ============================================
// Notifications
// ============================================

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

export type NotificationType =
  | 'new_pending_items'
  | 'high_risk_flagged'
  | 'auto_post_completed'
  | 'daily_summary'
  | 'system_alert';

// ============================================
// Settings
// ============================================

export interface AutomationSettings {
  enabled: boolean;
  ctsThreshold: number;
  maxDailyAutoPost: number;
  allowedRiskLevels: RiskLevel[];
  maxCtaLevel: CTALevel;
  requireReviewForHighIntensity: boolean;
  intensityThreshold: number;
}

export interface NotificationSettings {
  push: {
    enabled: boolean;
    newPendingItems: boolean;
    highRiskFlags: boolean;
    autoPostConfirmations: boolean;
    dailySummary: boolean;
    summaryTime: string; // HH:mm format
  };
  email: {
    enabled: boolean;
    dailyDigest: boolean;
    weeklyReport: boolean;
  };
}
