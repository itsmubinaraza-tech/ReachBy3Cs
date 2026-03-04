/**
 * Mock data for landing page dashboard preview
 * Shown to new visitors before they perform a search
 */

export interface PreviewQueueItem {
  id: string;
  platform: 'reddit' | 'quora' | 'twitter' | 'linkedin';
  title: string;
  content: string;
  response: string;
  author: string;
  url: string;
  subreddit?: string;
  createdAt: string;
  engagement: {
    upvotes?: number;
    comments?: number;
  };
}

export interface PreviewActivity {
  id: string;
  type: 'approved' | 'posted' | 'rejected' | 'detected';
  platform: string;
  description: string;
  timestamp: string;
}

export interface PreviewCluster {
  id: string;
  name: string;
  postCount: number;
  growth: number;
  trending: boolean;
}

export interface ChartDataPoint {
  date: string;
  responses: number;
  approved: number;
}

export const mockPreviewQueueItems: PreviewQueueItem[] = [
  {
    id: '1',
    platform: 'reddit',
    title: 'How do I communicate better with my partner?',
    content: 'We keep having the same arguments over and over. I feel like we are not understanding each other. Any tips for improving communication in relationships?',
    response: "I've been there! What really helped us was learning to identify our emotional triggers. There's actually some great research on emotional intelligence in relationships that suggests starting with active listening...",
    author: 'relationship_seeker',
    url: 'https://reddit.com/r/relationships/example1',
    subreddit: 'r/relationships',
    createdAt: '2 hours ago',
    engagement: { upvotes: 47, comments: 23 },
  },
  {
    id: '2',
    platform: 'quora',
    title: 'Why is emotional intelligence important in the workplace?',
    content: 'I keep hearing about EQ being more important than IQ for career success. Can someone explain why emotional intelligence matters so much at work?',
    response: 'Great question! Emotional intelligence in the workplace directly impacts team dynamics, leadership effectiveness, and conflict resolution. Studies show that leaders with high EQ...',
    author: 'CareerSeeker2024',
    url: 'https://quora.com/example2',
    createdAt: '4 hours ago',
    engagement: { upvotes: 156, comments: 12 },
  },
  {
    id: '3',
    platform: 'reddit',
    title: 'Apps for couples therapy exercises?',
    content: "My partner and I want to work on our relationship but can't afford a therapist right now. Are there any apps that help with couples exercises or communication skills?",
    response: "I completely understand - therapy can be expensive! There are actually several digital options that offer guided exercises for couples. The key is finding something that focuses on building emotional awareness...",
    author: 'budget_conscious',
    url: 'https://reddit.com/r/relationship_advice/example3',
    subreddit: 'r/relationship_advice',
    createdAt: '6 hours ago',
    engagement: { upvotes: 89, comments: 45 },
  },
];

export const mockRecentActivity: PreviewActivity[] = [
  {
    id: 'a1',
    type: 'approved',
    platform: 'Reddit',
    description: 'Response approved for r/relationships post',
    timestamp: '5 min ago',
  },
  {
    id: 'a2',
    type: 'posted',
    platform: 'Quora',
    description: 'Response posted to emotional intelligence question',
    timestamp: '12 min ago',
  },
  {
    id: 'a3',
    type: 'detected',
    platform: 'Reddit',
    description: '3 new high-intent posts detected',
    timestamp: '18 min ago',
  },
  {
    id: 'a4',
    type: 'approved',
    platform: 'Reddit',
    description: 'Response approved for r/selfimprovement post',
    timestamp: '25 min ago',
  },
];

export const mockTrendingClusters: PreviewCluster[] = [
  {
    id: 'c1',
    name: 'Relationship Communication',
    postCount: 127,
    growth: 23,
    trending: true,
  },
  {
    id: 'c2',
    name: 'Workplace Emotional Intelligence',
    postCount: 89,
    growth: 15,
    trending: true,
  },
  {
    id: 'c3',
    name: 'Self-Improvement Apps',
    postCount: 64,
    growth: 8,
    trending: false,
  },
];

export const mockChartData: ChartDataPoint[] = [
  { date: 'Mon', responses: 12, approved: 10 },
  { date: 'Tue', responses: 18, approved: 15 },
  { date: 'Wed', responses: 15, approved: 14 },
  { date: 'Thu', responses: 24, approved: 20 },
  { date: 'Fri', responses: 28, approved: 25 },
  { date: 'Sat', responses: 20, approved: 18 },
  { date: 'Sun', responses: 16, approved: 14 },
];
