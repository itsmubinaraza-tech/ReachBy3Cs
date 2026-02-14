/**
 * Database types matching Supabase schema
 * These types are auto-generated from the database schema
 */

// ============================================
// Enums
// ============================================

export type UserRole = 'owner' | 'admin' | 'reviewer' | 'member';

export type RiskLevel = 'low' | 'medium' | 'high' | 'blocked';

export type ResponseType = 'value_first' | 'soft_cta' | 'contextual';

export type ResponseStatus = 'pending' | 'approved' | 'rejected' | 'edited' | 'posted' | 'failed';

export type ContentType = 'post' | 'comment' | 'reply' | 'thread';

export type QueueStatus = 'queued' | 'processing' | 'completed' | 'skipped';

export type DeviceType = 'web' | 'mobile_ios' | 'mobile_android' | 'tablet' | 'api';

export type CTALevel = 0 | 1 | 2 | 3;

// ============================================
// Core Entities
// ============================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  organization_id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  notification_preferences: {
    push: boolean;
    email: boolean;
  };
  created_at: string;
  updated_at: string;
  last_active_at: string | null;
}

export interface ProblemCategory {
  id: string;
  organization_id: string;
  name: string;
  parent_id: string | null;
  keywords: string[];
  description: string | null;
  is_ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

export interface Platform {
  id: string;
  name: string;
  slug: string;
  icon_url: string | null;
  config: Record<string, unknown>;
  rate_limits: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
}

// ============================================
// Engagement Data
// ============================================

export interface Post {
  id: string;
  organization_id: string;
  platform_id: string;
  external_id: string;
  external_url: string;
  content: string;
  content_type: ContentType;
  author_handle: string | null;
  author_display_name: string | null;
  platform_metadata: Record<string, unknown>;
  parent_post_id: string | null;
  external_created_at: string | null;
  detected_at: string;
}

export interface Signal {
  id: string;
  post_id: string;
  problem_category_id: string | null;
  emotional_intensity: number;
  keywords: string[];
  confidence_score: number;
  raw_llm_response: string | null;
  raw_analysis: Record<string, unknown> | null;
  prompt_version: string | null;
  model_used: string | null;
  processing_started_at: string | null;
  processing_completed_at: string | null;
  created_at: string;
}

export interface RiskScore {
  id: string;
  signal_id: string;
  risk_level: RiskLevel;
  risk_score: number;
  context_flags: string[];
  risk_factors: Record<string, unknown> | null;
  recommended_action: string | null;
  raw_llm_response: string | null;
  raw_analysis: Record<string, unknown> | null;
  prompt_version: string | null;
  model_used: string | null;
  processing_started_at: string | null;
  processing_completed_at: string | null;
  created_at: string;
}

export interface Response {
  id: string;
  signal_id: string;
  cluster_id: string | null;
  value_first_response: string | null;
  soft_cta_response: string | null;
  contextual_response: string | null;
  selected_response: string;
  selected_type: ResponseType;
  cta_level: CTALevel;
  cta_analysis: Record<string, unknown> | null;
  cts_score: number;
  cts_breakdown: {
    signal_component: number;
    risk_component: number;
    cta_component: number;
  } | null;
  can_auto_post: boolean;
  auto_post_reason: string | null;
  status: ResponseStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_device: DeviceType | null;
  review_notes: string | null;
  original_response: string | null;
  edited_response: string | null;
  edited_by: string | null;
  edited_at: string | null;
  posted_at: string | null;
  posted_external_id: string | null;
  posted_external_url: string | null;
  posting_error: string | null;
  raw_llm_response: string | null;
  raw_analysis: Record<string, unknown> | null;
  prompt_version: string | null;
  model_used: string | null;
  generation_started_at: string | null;
  generation_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface EngagementQueue {
  id: string;
  response_id: string;
  organization_id: string;
  priority: number;
  queue_position: number | null;
  scheduled_for: string | null;
  status: QueueStatus;
  created_at: string;
  processed_at: string | null;
}

// ============================================
// Community Clusters
// ============================================

export interface Cluster {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  problem_category_id: string | null;
  keywords: string[];
  member_count: number;
  engagement_count: number;
  avg_emotional_intensity: number | null;
  ai_summary: string | null;
  trending_topics: Record<string, unknown> | null;
  first_detected_at: string;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
}

export interface ClusterMember {
  id: string;
  cluster_id: string;
  post_id: string;
  similarity_score: number;
  added_at: string;
}

// ============================================
// Audit & Analytics
// ============================================

export interface AuditLog {
  id: string;
  organization_id: string;
  user_id: string | null;
  action_type: string;
  entity_type: string;
  entity_id: string;
  action_data: Record<string, unknown> | null;
  previous_state: Record<string, unknown> | null;
  new_state: Record<string, unknown> | null;
  device_type: DeviceType | null;
  ip_address: string | null;
  user_agent: string | null;
  session_id: string | null;
  created_at: string;
}

export interface AnalyticsEvent {
  id: string;
  organization_id: string;
  user_id: string | null;
  event_type: string;
  event_category: string | null;
  event_data: Record<string, unknown> | null;
  source_platform_id: string | null;
  related_post_id: string | null;
  related_response_id: string | null;
  related_cluster_id: string | null;
  device_type: DeviceType | null;
  created_at: string;
}

export interface DailyMetrics {
  id: string;
  organization_id: string;
  metric_date: string;
  posts_detected: number;
  signals_generated: number;
  responses_generated: number;
  responses_approved: number;
  responses_rejected: number;
  responses_auto_posted: number;
  responses_manually_posted: number;
  platform_breakdown: Record<string, number> | null;
  risk_breakdown: Record<RiskLevel, number> | null;
  new_clusters_detected: number;
  cluster_engagements: number;
  avg_response_time_ms: number | null;
  avg_review_time_ms: number | null;
  created_at: string;
}
