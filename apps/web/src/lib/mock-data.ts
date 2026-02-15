/**
 * Mock data for demo purposes
 * This file provides realistic demo data for testing the UI
 */

import type { QueueItemDisplay, DashboardOverview } from 'shared-types';

// ============================================
// Queue Items Mock Data
// ============================================

export const mockQueueItems: QueueItemDisplay[] = [
  {
    id: 'queue-1',
    original: {
      platform: {
        id: 'plt-reddit',
        name: 'Reddit',
        slug: 'reddit',
        iconUrl: null,
      },
      content:
        "I've been struggling with customer retention for months now. We're a small SaaS company and our churn rate is killing us. Any advice on how to improve this? We've tried email campaigns but nothing seems to work.",
      authorHandle: 'u/startup_founder_22',
      url: 'https://reddit.com/r/SaaS/comments/abc123',
      detectedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
    },
    analysis: {
      problemCategory: 'Customer Retention',
      emotionalIntensity: 0.72,
      keywords: ['customer retention', 'churn rate', 'SaaS', 'email campaigns'],
      riskLevel: 'low',
      riskScore: 0.15,
      riskFactors: ['Genuine business problem', 'Open to solutions'],
    },
    responses: {
      valueFirst:
        "Customer retention is definitely a challenge for early-stage SaaS. One thing that worked well for us was implementing a customer success touchpoint at day 7, 30, and 60. The key was personalization - not automated emails, but genuine check-ins asking about their specific use case.",
      softCta:
        "We struggled with the same issue until we started focusing on onboarding optimization. Happy to share what worked for us if you're interested.",
      contextual:
        "The email campaign approach can work, but timing and personalization are key. What's your current onboarding flow like? That's often where retention issues start.",
      selected:
        "Customer retention is definitely a challenge for early-stage SaaS. One thing that worked well for us was implementing a customer success touchpoint at day 7, 30, and 60. The key was personalization - not automated emails, but genuine check-ins asking about their specific use case.",
      selectedType: 'value_first',
    },
    metrics: {
      ctaLevel: 0,
      ctsScore: 0.89,
      canAutoPost: true,
    },
    cluster: {
      id: 'cluster-1',
      name: 'SaaS Founders',
      memberCount: 1247,
    },
    status: 'pending',
    priority: 85,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: 'queue-2',
    original: {
      platform: {
        id: 'plt-twitter',
        name: 'Twitter/X',
        slug: 'twitter',
        iconUrl: null,
      },
      content:
        "Does anyone know a good tool for managing social media engagement? I'm drowning in mentions and can't keep up with all the conversations happening about our brand.",
      authorHandle: '@marketing_mike',
      url: 'https://twitter.com/marketing_mike/status/123456789',
      detectedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
    },
    analysis: {
      problemCategory: 'Social Media Management',
      emotionalIntensity: 0.58,
      keywords: ['social media', 'engagement', 'mentions', 'brand monitoring'],
      riskLevel: 'medium',
      riskScore: 0.42,
      riskFactors: ['Direct product query', 'Competitive space'],
    },
    responses: {
      valueFirst:
        "Managing high-volume social engagement is tough. What helped us was setting up keyword alerts and prioritizing based on sentiment. The key is having a triage system so you're not trying to respond to everything equally.",
      softCta:
        "We built an internal tool for this exact problem. The game-changer was automated prioritization based on influence and sentiment. Would be happy to share our approach.",
      contextual:
        "The drowning feeling is real! What platforms are you most active on? The strategy differs quite a bit between Twitter, LinkedIn, and others.",
      selected:
        "Managing high-volume social engagement is tough. What helped us was setting up keyword alerts and prioritizing based on sentiment. The key is having a triage system so you're not trying to respond to everything equally.",
      selectedType: 'value_first',
    },
    metrics: {
      ctaLevel: 1,
      ctsScore: 0.71,
      canAutoPost: false,
    },
    cluster: {
      id: 'cluster-2',
      name: 'Marketing Professionals',
      memberCount: 892,
    },
    status: 'pending',
    priority: 72,
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 'queue-3',
    original: {
      platform: {
        id: 'plt-quora',
        name: 'Quora',
        slug: 'quora',
        iconUrl: null,
      },
      content:
        'What are the best practices for automating customer outreach without coming across as spammy? I want to scale our sales process but maintain authenticity.',
      authorHandle: null,
      url: 'https://quora.com/What-are-the-best-practices-for-automating-customer-outreach',
      detectedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    },
    analysis: {
      problemCategory: 'Sales Automation',
      emotionalIntensity: 0.45,
      keywords: ['automation', 'customer outreach', 'sales', 'authenticity'],
      riskLevel: 'low',
      riskScore: 0.18,
      riskFactors: ['Educational intent', 'Broad question'],
    },
    responses: {
      valueFirst:
        "Great question. The key to non-spammy automation is personalization at scale. This means: 1) Segment your audience properly, 2) Use dynamic content based on behavior, 3) Always provide value before asking for anything, 4) Respect timing and frequency limits.",
      softCta:
        "Authenticity in automation is about the right balance. We've tested dozens of approaches and found that personalized triggers based on actual user behavior work best.",
      contextual:
        "What industry are you in? The approach varies significantly between B2B and B2C, and even within those categories, different verticals have different norms.",
      selected:
        "Great question. The key to non-spammy automation is personalization at scale. This means: 1) Segment your audience properly, 2) Use dynamic content based on behavior, 3) Always provide value before asking for anything, 4) Respect timing and frequency limits.",
      selectedType: 'value_first',
    },
    metrics: {
      ctaLevel: 0,
      ctsScore: 0.92,
      canAutoPost: true,
    },
    cluster: null,
    status: 'pending',
    priority: 90,
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 'queue-4',
    original: {
      platform: {
        id: 'plt-reddit',
        name: 'Reddit',
        slug: 'reddit',
        iconUrl: null,
      },
      content:
        "Looking for recommendations on a tool that can help with community management. We have a Discord server with 5000+ members and it's getting hard to track conversations and identify potential issues.",
      authorHandle: 'u/community_lead',
      url: 'https://reddit.com/r/communitymanagement/comments/xyz789',
      detectedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    },
    analysis: {
      problemCategory: 'Community Management',
      emotionalIntensity: 0.51,
      keywords: ['community management', 'Discord', 'conversations', 'moderation'],
      riskLevel: 'high',
      riskScore: 0.68,
      riskFactors: ['Direct tool recommendation request', 'Potential self-promotion flag'],
    },
    responses: {
      valueFirst:
        "Managing a 5K+ community is no joke! The key challenges are usually: surfacing important conversations, identifying toxic patterns early, and maintaining culture at scale. What specific issues are you facing most?",
      softCta:
        "We've worked with several Discord communities of similar size. The common pattern we see is that reactive moderation doesn't scale - you need proactive signal detection. Happy to share more specifics.",
      contextual:
        "Great scale! Are your main challenges around moderation, engagement tracking, or member support? Each requires a different approach and toolset.",
      selected:
        "Managing a 5K+ community is no joke! The key challenges are usually: surfacing important conversations, identifying toxic patterns early, and maintaining culture at scale. What specific issues are you facing most?",
      selectedType: 'value_first',
    },
    metrics: {
      ctaLevel: 0,
      ctsScore: 0.65,
      canAutoPost: false,
    },
    cluster: {
      id: 'cluster-3',
      name: 'Community Managers',
      memberCount: 534,
    },
    status: 'pending',
    priority: 78,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'queue-5',
    original: {
      platform: {
        id: 'plt-linkedin',
        name: 'LinkedIn',
        slug: 'linkedin',
        iconUrl: null,
      },
      content:
        "We've been evaluating different engagement platforms for our brand. Key requirements: AI-powered responses, multi-platform support, and strong analytics. Any recommendations from fellow marketers?",
      authorHandle: 'Sarah Chen',
      url: 'https://linkedin.com/posts/sarah-chen-123456',
      detectedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 mins ago
    },
    analysis: {
      problemCategory: 'Marketing Tools',
      emotionalIntensity: 0.35,
      keywords: ['engagement platform', 'AI-powered', 'multi-platform', 'analytics'],
      riskLevel: 'blocked',
      riskScore: 0.85,
      riskFactors: ['Competitor evaluation post', 'High self-promotion risk', 'Direct sales context'],
    },
    responses: {
      valueFirst:
        "Great criteria! When evaluating these platforms, I'd add: look at the quality of AI responses (not just speed), check how well they handle context, and ensure the analytics connect engagement to business outcomes.",
      softCta:
        "We've been through this evaluation recently. The market has matured a lot in the past year. Would love to compare notes on what you're finding.",
      contextual:
        "What's your primary use case - customer support, sales engagement, or brand monitoring? That changes which features matter most.",
      selected:
        "Great criteria! When evaluating these platforms, I'd add: look at the quality of AI responses (not just speed), check how well they handle context, and ensure the analytics connect engagement to business outcomes.",
      selectedType: 'value_first',
    },
    metrics: {
      ctaLevel: 2,
      ctsScore: 0.38,
      canAutoPost: false,
    },
    cluster: {
      id: 'cluster-2',
      name: 'Marketing Professionals',
      memberCount: 892,
    },
    status: 'pending',
    priority: 45,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 'queue-6',
    original: {
      platform: {
        id: 'plt-reddit',
        name: 'Reddit',
        slug: 'reddit',
        iconUrl: null,
      },
      content:
        "Just venting here - we lost another enterprise deal because our response time was too slow. The prospect said they went with a competitor who replied within 2 hours while we took 2 days. This keeps happening.",
      authorHandle: 'u/sales_team_lead',
      url: 'https://reddit.com/r/sales/comments/vent123',
      detectedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
    },
    analysis: {
      problemCategory: 'Sales Operations',
      emotionalIntensity: 0.82,
      keywords: ['enterprise deal', 'response time', 'competitor', 'lost deal'],
      riskLevel: 'low',
      riskScore: 0.22,
      riskFactors: ['Emotional context - empathy first', 'Pain point discussion'],
    },
    responses: {
      valueFirst:
        "That's frustrating, and you're definitely not alone. Response time is becoming a key competitive differentiator. Some teams are solving this with automation for initial responses + prioritization systems for human follow-up.",
      softCta:
        "Been there. We lost a few deals the same way before systematizing our response process. The good news is it's a solvable problem once you identify the bottlenecks.",
      contextual:
        "Where is the delay happening - lead routing, qualification, or getting the right people involved? Each needs a different fix.",
      selected:
        "That's frustrating, and you're definitely not alone. Response time is becoming a key competitive differentiator. Some teams are solving this with automation for initial responses + prioritization systems for human follow-up.",
      selectedType: 'value_first',
    },
    metrics: {
      ctaLevel: 0,
      ctsScore: 0.88,
      canAutoPost: true,
    },
    cluster: {
      id: 'cluster-4',
      name: 'Sales Leaders',
      memberCount: 2103,
    },
    status: 'pending',
    priority: 82,
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
];

// ============================================
// Dashboard Overview Mock Data
// ============================================

export const mockDashboardOverview: DashboardOverview = {
  today: {
    postsDetected: 127,
    responsesGenerated: 89,
    responsesApproved: 42,
    responsesRejected: 8,
    autoPosted: 31,
    pendingReview: 6,
  },
  trends: {
    postsChange: 0.12, // 12% increase
    approvalRateChange: 0.05, // 5% increase
    ctsScoreChange: 0.02, // 2% increase
  },
  health: {
    allSystemsOperational: true,
    services: [
      { name: 'Signal Detection', status: 'operational', latency: 145 },
      { name: 'Response Generation', status: 'operational', latency: 890 },
      { name: 'Risk Analysis', status: 'operational', latency: 234 },
      { name: 'Platform APIs', status: 'operational', latency: 312 },
    ],
  },
};

// ============================================
// Recent Activity Mock Data
// ============================================

export interface RecentActivity {
  id: string;
  type: 'approved' | 'rejected' | 'auto_posted' | 'edited' | 'flagged';
  platform: string;
  description: string;
  timestamp: string;
  user?: string;
}

export const mockRecentActivity: RecentActivity[] = [
  {
    id: 'activity-1',
    type: 'auto_posted',
    platform: 'Reddit',
    description: 'Response auto-posted to r/SaaS thread',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 'activity-2',
    type: 'approved',
    platform: 'Twitter',
    description: 'Response approved and scheduled',
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    user: 'Sarah',
  },
  {
    id: 'activity-3',
    type: 'flagged',
    platform: 'LinkedIn',
    description: 'High-risk response flagged for review',
    timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: 'activity-4',
    type: 'edited',
    platform: 'Quora',
    description: 'Response edited before approval',
    timestamp: new Date(Date.now() - 1000 * 60 * 38).toISOString(),
    user: 'Mike',
  },
  {
    id: 'activity-5',
    type: 'rejected',
    platform: 'Reddit',
    description: 'Response rejected - off-topic',
    timestamp: new Date(Date.now() - 1000 * 60 * 52).toISOString(),
    user: 'Sarah',
  },
  {
    id: 'activity-6',
    type: 'auto_posted',
    platform: 'Twitter',
    description: 'Response auto-posted to @founder_tips thread',
    timestamp: new Date(Date.now() - 1000 * 60 * 67).toISOString(),
  },
  {
    id: 'activity-7',
    type: 'approved',
    platform: 'Reddit',
    description: 'Response approved for r/startups',
    timestamp: new Date(Date.now() - 1000 * 60 * 89).toISOString(),
    user: 'Mike',
  },
];

// ============================================
// Quick Stats Mock Data
// ============================================

export interface QuickStat {
  id: string;
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  description: string;
}

export const mockQuickStats: QuickStat[] = [
  {
    id: 'stat-1',
    title: 'Pending Reviews',
    value: '6',
    description: 'Responses awaiting approval',
  },
  {
    id: 'stat-2',
    title: 'Approved Today',
    value: '42',
    change: 0.15,
    changeLabel: 'vs yesterday',
    description: 'Manually approved',
  },
  {
    id: 'stat-3',
    title: 'Auto-posted',
    value: '31',
    change: 0.08,
    changeLabel: 'vs yesterday',
    description: 'Posted automatically',
  },
  {
    id: 'stat-4',
    title: 'Success Rate',
    value: '84%',
    change: 0.02,
    changeLabel: 'this week',
    description: 'Approval rate',
  },
];
