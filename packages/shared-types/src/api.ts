/**
 * API Request and Response types
 */

import type {
  RiskLevel,
  ResponseType,
  ResponseStatus,
  CTALevel,
  DeviceType,
} from './database';

// ============================================
// Common API Types
// ============================================

export interface ApiResponse<T> {
  data: T;
  error: null;
}

export interface ApiError {
  data: null;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// Auth API
// ============================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    role: string;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}

export interface SignupRequest {
  email: string;
  password: string;
  fullName: string;
  organizationName: string;
}

// ============================================
// Queue API
// ============================================

export interface QueueFilters {
  status?: ResponseStatus;
  riskLevel?: RiskLevel;
  platformId?: string;
  minCtsScore?: number;
  maxCtsScore?: number;
  dateFrom?: string;
  dateTo?: string;
}

export interface QueueItem {
  id: string;
  responseId: string;
  post: {
    id: string;
    platform: string;
    platformSlug: string;
    externalUrl: string;
    content: string;
    authorHandle: string | null;
    detectedAt: string;
  };
  signal: {
    problemCategory: string | null;
    emotionalIntensity: number;
    keywords: string[];
  };
  riskScore: {
    riskLevel: RiskLevel;
    riskScore: number;
    contextFlags: string[];
  };
  response: {
    selectedResponse: string;
    selectedType: ResponseType;
    valueFirstResponse: string | null;
    softCtaResponse: string | null;
    contextualResponse: string | null;
    ctaLevel: CTALevel;
    ctsScore: number;
    canAutoPost: boolean;
    status: ResponseStatus;
  };
  cluster: {
    id: string;
    name: string;
  } | null;
  createdAt: string;
  priority: number;
}

export interface ApproveResponseRequest {
  responseId: string;
  selectedType?: ResponseType;
  editedResponse?: string;
  notes?: string;
  deviceType: DeviceType;
}

export interface RejectResponseRequest {
  responseId: string;
  reason?: string;
  deviceType: DeviceType;
}

// ============================================
// Skills API (Python Agent Service)
// ============================================

export interface SignalDetectionRequest {
  text: string;
  organizationId: string;
}

export interface SignalDetectionResponse {
  problemCategory: string;
  emotionalIntensity: number;
  keywords: string[];
  confidence: number;
  rawAnalysis: Record<string, unknown>;
}

export interface RiskScoringRequest {
  text: string;
  emotionalIntensity: number;
  contextFlags: string[];
}

export interface RiskScoringResponse {
  riskLevel: RiskLevel;
  riskScore: number;
  riskFactors: string[];
  recommendedAction: string;
}

export interface ResponseGenerationRequest {
  postText: string;
  problemCategory: string;
  riskLevel: RiskLevel;
  platformSlug: string;
}

export interface ResponseGenerationResponse {
  valueFirst: string;
  softCta: string;
  contextual: string;
  selectedResponse: string;
  selectedType: ResponseType;
}

export interface CTAClassificationRequest {
  responseText: string;
}

export interface CTAClassificationResponse {
  ctaLevel: CTALevel;
  analysis: {
    hasProductMention: boolean;
    hasLink: boolean;
    hasCallToAction: boolean;
    urgencyLevel: 'none' | 'low' | 'medium' | 'high';
  };
}

export interface CTSDecisionRequest {
  signalScore: number;
  riskLevel: RiskLevel;
  ctaLevel: CTALevel;
}

export interface CTSDecisionResponse {
  ctsScore: number;
  canAutoPost: boolean;
  breakdown: {
    signalComponent: number;
    riskComponent: number;
    ctaComponent: number;
  };
  reason: string;
}

// ============================================
// Analytics API
// ============================================

export interface AnalyticsOverview {
  postsDetected: number;
  signalsGenerated: number;
  responsesGenerated: number;
  responsesApproved: number;
  responsesRejected: number;
  responsesAutoPosted: number;
  avgCtsScore: number;
  approvalRate: number;
}

export interface AnalyticsTrend {
  date: string;
  value: number;
}

export interface PlatformBreakdown {
  platform: string;
  count: number;
  percentage: number;
}

export interface RiskBreakdown {
  riskLevel: RiskLevel;
  count: number;
  percentage: number;
}
