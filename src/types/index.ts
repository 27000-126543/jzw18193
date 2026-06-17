export type Platform = 'douyin' | 'xiaohongshu' | 'weibo' | 'bilibili' | 'kuaishou';

export type CampaignStatus = 'draft' | 'active' | 'completed' | 'cancelled';
export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'negotiating';
export type ReviewStatus = 'pending' | 'approved' | 'rejected';
export type PaymentStatus = 'pending' | 'paid' | 'overdue';
export type PaymentType = 'deposit' | 'final';

export interface KOL {
  id: string;
  name: string;
  avatar: string;
  platform: Platform;
  category: string[];
  followers: number;
  avgViews: number;
  avgLikes: number;
  engagementRate: number;
  price: number;
  score: number;
  historyCount: number;
  tags: string[];
  description?: string;
  contact?: string;
}

export interface KPI {
  targetImpressions: number;
  targetEngagements: number;
  targetClicks: number;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  budget: number;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  kpi: KPI;
  createdAt: string;
  kolCount?: number;
}

export interface Invitation {
  id: string;
  campaignId: string;
  kolId: string;
  kolName?: string;
  campaignName?: string;
  status: InvitationStatus;
  fee: number;
  contentRequirements: string;
  timeline: string;
  createdAt: string;
  publishDate?: string;
}

export interface ContentReview {
  id: string;
  invitationId: string;
  kolName?: string;
  campaignName?: string;
  version: number;
  content: string;
  attachments: string[];
  status: ReviewStatus;
  feedback: string;
  submittedAt: string;
  reviewedAt?: string;
}

export interface PerformanceData {
  id: string;
  contentId: string;
  kolName?: string;
  campaignName?: string;
  impressions: number;
  engagements: number;
  clicks: number;
  conversionRate: number;
  roi: number;
  collectedAt: string;
  targetImpressions?: number;
  targetEngagements?: number;
  targetClicks?: number;
  fetchStatus?: 'idle' | 'fetching' | 'success' | 'failed';
  lastFetchedAt?: string;
}

export interface Payment {
  id: string;
  invitationId: string;
  kolName?: string;
  campaignName?: string;
  type: PaymentType;
  amount: number;
  status: PaymentStatus;
  dueDate: string;
  paidAt?: string;
}

export interface CollaborationHistory {
  id: string;
  kolId: string;
  kolName?: string;
  campaignId: string;
  campaignName?: string;
  finalImpressions: number;
  finalEngagements: number;
  finalClicks: number;
  finalRoi: number;
  rating: number;
  feedback: string;
  completedAt: string;
}

export interface DashboardStats {
  activeCampaigns: number;
  pendingReviews: number;
  monthlyBudget: number;
  averageRoi: number;
  totalImpressions: number;
  totalEngagements: number;
  totalClicks: number;
}

export interface TimelineNode {
  id: string;
  title: string;
  date: string;
  status: 'completed' | 'current' | 'upcoming' | 'delayed';
  description?: string;
  kolName?: string;
  campaignName?: string;
}

export interface TrendDataPoint {
  date: string;
  impressions: number;
  engagements: number;
  clicks: number;
}

export interface FilterOptions {
  platform?: Platform;
  category?: string[];
  followersMin?: number;
  followersMax?: number;
  priceMin?: number;
  priceMax?: number;
  search?: string;
}
