/**
 * Mock data for landing page dashboard preview
 * Shown to new visitors before they perform a search
 */

export type ResponseStatus = 'idle' | 'generating' | 'ready' | 'error';

export interface PreviewQueueItem {
  id: string;
  platform: 'reddit' | 'quora' | 'twitter' | 'linkedin' | 'stackoverflow' | 'hackernews';
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
  // AI-generated fields (optional for backwards compatibility)
  responseVariants?: {
    value_first: string;
    soft_cta: string;
    contextual: string;
  };
  riskLevel?: 'low' | 'medium' | 'high' | 'blocked';
  ctsScore?: number;
  // Progressive loading status
  responseStatus?: ResponseStatus;
  responseError?: string;
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
    title: 'How do I give difficult feedback to my team?',
    content: 'I just got promoted to manager and I struggle with giving constructive criticism. My team seems defensive when I bring up issues. Any tips for delivering feedback effectively?',
    response: "Congrats on the promotion! Giving feedback is one of the trickiest parts of leadership. What helps is focusing on behavior, not personality - and timing matters too. There are tools that coach you in real-time on how to phrase things...",
    author: 'new_manager_2024',
    url: 'https://reddit.com/r/management/example1',
    subreddit: 'r/management',
    createdAt: '2 hours ago',
    engagement: { upvotes: 67, comments: 34 },
  },
  {
    id: '2',
    platform: 'stackoverflow',
    title: 'How to handle conflict in engineering teams?',
    content: 'Our team has strong personalities and technical disagreements often turn personal. How do other tech leads handle conflict resolution while maintaining productivity?',
    response: 'This is common in high-performing teams! The key is creating psychological safety while still encouraging healthy debate. Some leaders use real-time coaching tools to help navigate these conversations...',
    author: 'tech_lead_sarah',
    url: 'https://stackoverflow.com/questions/example2',
    createdAt: '4 hours ago',
    engagement: { upvotes: 142, comments: 28 },
  },
  {
    id: '3',
    platform: 'reddit',
    title: 'Building relationships with remote team members?',
    content: "I manage a fully remote team and it's hard to build rapport through Zoom. How do other managers create meaningful connections with their direct reports virtually?",
    response: "Remote relationship building is definitely a challenge! What works is being more intentional about 1:1s and asking the right questions. Some managers use coaching tools that suggest conversation starters and help read emotional cues...",
    author: 'remote_leader',
    url: 'https://reddit.com/r/remotework/example3',
    subreddit: 'r/remotework',
    createdAt: '5 hours ago',
    engagement: { upvotes: 93, comments: 41 },
  },
];

export const mockRecentActivity: PreviewActivity[] = [
  {
    id: 'a1',
    type: 'approved',
    platform: 'Reddit',
    description: 'Response approved for r/management post',
    timestamp: '5 min ago',
  },
  {
    id: 'a2',
    type: 'posted',
    platform: 'StackOverflow',
    description: 'Response posted to leadership question',
    timestamp: '12 min ago',
  },
  {
    id: 'a3',
    type: 'detected',
    platform: 'Reddit',
    description: '4 new workplace communication posts detected',
    timestamp: '18 min ago',
  },
  {
    id: 'a4',
    type: 'approved',
    platform: 'Reddit',
    description: 'Response approved for r/remotework post',
    timestamp: '25 min ago',
  },
];

export const mockTrendingClusters: PreviewCluster[] = [
  {
    id: 'c1',
    name: 'Leadership Communication',
    postCount: 142,
    growth: 28,
    trending: true,
  },
  {
    id: 'c2',
    name: 'Remote Team Building',
    postCount: 97,
    growth: 19,
    trending: true,
  },
  {
    id: 'c3',
    name: 'Feedback & Coaching',
    postCount: 73,
    growth: 12,
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
