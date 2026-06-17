import { create } from 'zustand';
import type {
  KOL,
  Campaign,
  Invitation,
  ContentReview,
  PerformanceData,
  Payment,
  CollaborationHistory,
  TrendDataPoint,
  DashboardStats,
  FilterOptions,
} from '../types';
import {
  mockKOLs,
  mockCampaigns,
  mockInvitations,
  mockReviews,
  mockPerformanceData,
  mockPayments,
  mockHistory,
  mockTrendData,
  mockDashboardStats,
} from '../mocks/data';
import { generateId, delay } from '../utils';

const STORAGE_PREFIX = 'kolstar_';

type PersistedKey =
  | 'campaigns'
  | 'invitations'
  | 'reviews'
  | 'performanceData'
  | 'payments';

const PERSISTED_KEYS: PersistedKey[] = [
  'campaigns',
  'invitations',
  'reviews',
  'performanceData',
  'payments',
];

const storageKey = (key: PersistedKey) => `${STORAGE_PREFIX}${key}`;

const loadFromStorage = <T>(key: PersistedKey, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(storageKey(key));
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const saveToStorage = (key: PersistedKey, value: unknown) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(storageKey(key), JSON.stringify(value));
  } catch {
    /* ignore */
  }
};

const initCampaigns = () => loadFromStorage<Campaign[]>('campaigns', mockCampaigns);
const initInvitations = () => loadFromStorage<Invitation[]>('invitations', mockInvitations);
const initReviews = () => loadFromStorage<ContentReview[]>('reviews', mockReviews);
const initPerformanceData = () => loadFromStorage<PerformanceData[]>('performanceData', mockPerformanceData);
const initPayments = () => loadFromStorage<Payment[]>('payments', mockPayments);

interface AppState {
  kols: KOL[];
  campaigns: Campaign[];
  invitations: Invitation[];
  reviews: ContentReview[];
  performanceData: PerformanceData[];
  payments: Payment[];
  history: CollaborationHistory[];
  trendData: TrendDataPoint[];
  dashboardStats: DashboardStats;
  filters: FilterOptions;
  loading: boolean;
  currentKol: KOL | null;
  currentCampaign: Campaign | null;

  setFilters: (filters: Partial<FilterOptions>) => void;
  getFilteredKOLs: () => KOL[];
  createCampaign: (data: Omit<Campaign, 'id' | 'createdAt'>) => Promise<Campaign>;
  sendInvitation: (data: Omit<Invitation, 'id' | 'createdAt' | 'status'>) => Promise<Invitation>;
  updateInvitationStatus: (id: string, status: Invitation['status']) => Promise<void>;
  approveReview: (id: string, feedback?: string) => Promise<void>;
  rejectReview: (id: string, feedback: string) => Promise<void>;
  markPaymentPaid: (id: string) => Promise<void>;
  setCurrentKol: (kol: KOL | null) => void;
  setCurrentCampaign: (campaign: Campaign | null) => void;
  getKolById: (id: string) => KOL | undefined;
  getCampaignById: (id: string) => Campaign | undefined;
  getInvitationsByCampaignId: (campaignId: string) => Invitation[];
  getReviewsByInvitationId: (invitationId: string) => ContentReview[];
  getPerformanceByContentId: (contentId: string) => PerformanceData | undefined;
  getPaymentsByInvitationId: (invitationId: string) => Payment[];
  getHistoryByKolId: (kolId: string) => CollaborationHistory[];

  fetchPerformanceData: (contentId: string) => Promise<PerformanceData>;
  addPerformanceRecord: (
    record: Omit<PerformanceData, 'id' | 'collectedAt'> & {
      targetImpressions?: number;
      targetEngagements?: number;
      targetClicks?: number;
    }
  ) => Promise<PerformanceData>;
  createPaymentsForInvitation: (invitationId: string) => Promise<void>;
  getPerformanceByInvitationId: (invitationId: string) => PerformanceData | undefined;
}

export const useAppStore = create<AppState>()((set, get) => ({
  kols: mockKOLs,
  campaigns: initCampaigns(),
  invitations: initInvitations(),
  reviews: initReviews(),
  performanceData: initPerformanceData(),
  payments: initPayments(),
  history: mockHistory,
  trendData: mockTrendData,
  dashboardStats: mockDashboardStats,
  filters: {},
  loading: false,
  currentKol: null,
  currentCampaign: null,

  setFilters: (filters) => {
    set((state) => ({ filters: { ...state.filters, ...filters } }));
  },

  getFilteredKOLs: () => {
    const { kols, filters } = get();
    let filtered = [...kols];

    if (filters.platform) {
      filtered = filtered.filter((k) => k.platform === filters.platform);
    }

    if (filters.category && filters.category.length > 0) {
      filtered = filtered.filter((k) =>
        k.category.some((c) => filters.category!.includes(c))
      );
    }

    if (filters.followersMin !== undefined) {
      filtered = filtered.filter((k) => k.followers >= filters.followersMin!);
    }

    if (filters.followersMax !== undefined) {
      filtered = filtered.filter((k) => k.followers <= filters.followersMax!);
    }

    if (filters.priceMin !== undefined) {
      filtered = filtered.filter((k) => k.price >= filters.priceMin!);
    }

    if (filters.priceMax !== undefined) {
      filtered = filtered.filter((k) => k.price <= filters.priceMax!);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (k) =>
          k.name.toLowerCase().includes(searchLower) ||
          k.category.some((c) => c.toLowerCase().includes(searchLower)) ||
          k.tags.some((t) => t.toLowerCase().includes(searchLower))
      );
    }

    return filtered;
  },

  createCampaign: async (data) => {
    await delay(500);
    const newCampaign: Campaign = {
      ...data,
      id: `campaign-${generateId()}`,
      createdAt: new Date().toISOString(),
    };
    set((state) => {
      const campaigns = [newCampaign, ...state.campaigns];
      saveToStorage('campaigns', campaigns);
      return { campaigns };
    });
    return newCampaign;
  },

  sendInvitation: async (data) => {
    await delay(500);
    const newInvitation: Invitation = {
      ...data,
      id: `invitation-${generateId()}`,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    set((state) => {
      const invitations = [newInvitation, ...state.invitations];
      saveToStorage('invitations', invitations);
      return { invitations };
    });
    return newInvitation;
  },

  updateInvitationStatus: async (id, status) => {
    await delay(300);
    set((state) => {
      const invitations = state.invitations.map((inv) =>
        inv.id === id ? { ...inv, status } : inv
      );
      saveToStorage('invitations', invitations);
      return { invitations };
    });

    if (status === 'accepted') {
      const state = get();
      const invitation = state.invitations.find((i) => i.id === id);

      await get().createPaymentsForInvitation(id);

      if (invitation) {
        const campaign = state.getCampaignById(invitation.campaignId);
        await get().addPerformanceRecord({
          contentId: invitation.id,
          kolName: invitation.kolName,
          campaignName: invitation.campaignName,
          impressions: 0,
          engagements: 0,
          clicks: 0,
          conversionRate: 0,
          roi: 0,
          targetImpressions: campaign?.kpi.targetImpressions,
          targetEngagements: campaign?.kpi.targetEngagements,
          targetClicks: campaign?.kpi.targetClicks,
          fetchStatus: 'idle',
        });
      }
    }
  },

  approveReview: async (id, feedback) => {
    await delay(300);
    set((state) => {
      const reviews = state.reviews.map((r) =>
        r.id === id
          ? { ...r, status: 'approved' as const, feedback: feedback || '', reviewedAt: new Date().toISOString() }
          : r
      );
      saveToStorage('reviews', reviews);
      return { reviews };
    });
  },

  rejectReview: async (id, feedback) => {
    await delay(300);
    set((state) => {
      const reviews = state.reviews.map((r) =>
        r.id === id
          ? { ...r, status: 'rejected' as const, feedback, reviewedAt: new Date().toISOString() }
          : r
      );
      saveToStorage('reviews', reviews);
      return { reviews };
    });
  },

  markPaymentPaid: async (id) => {
    await delay(300);
    const state = get();
    const payment = state.payments.find((p) => p.id === id);

    if (!payment) {
      throw new Error('支付记录不存在');
    }

    if (payment.type === 'final') {
      const perf = state.getPerformanceByInvitationId(payment.invitationId);
      if (!perf) {
        throw new Error('KPI未达标，无法支付尾款，请先确认数据抓取结果');
      }
      const targetImpressions = perf.targetImpressions ?? 0;
      const targetEngagements = perf.targetEngagements ?? 0;
      if (perf.impressions < targetImpressions || perf.engagements < targetEngagements) {
        throw new Error('KPI未达标，无法支付尾款，请先确认数据抓取结果');
      }
    }

    set((state) => {
      const payments = state.payments.map((p) =>
        p.id === id ? { ...p, status: 'paid' as const, paidAt: new Date().toISOString() } : p
      );
      saveToStorage('payments', payments);
      return { payments };
    });
  },

  setCurrentKol: (kol) => set({ currentKol: kol }),
  setCurrentCampaign: (campaign) => set({ currentCampaign: campaign }),

  getKolById: (id) => get().kols.find((k) => k.id === id),
  getCampaignById: (id) => get().campaigns.find((c) => c.id === id),
  getInvitationsByCampaignId: (campaignId) =>
    get().invitations.filter((i) => i.campaignId === campaignId),
  getReviewsByInvitationId: (invitationId) =>
    get().reviews.filter((r) => r.invitationId === invitationId),
  getPerformanceByContentId: (contentId) =>
    get().performanceData.find((p) => p.contentId === contentId),
  getPaymentsByInvitationId: (invitationId) =>
    get().payments.filter((p) => p.invitationId === invitationId),
  getHistoryByKolId: (kolId) => get().history.filter((h) => h.kolId === kolId),

  fetchPerformanceData: async (contentId) => {
    await delay(800);
    let updated: PerformanceData | undefined;
    set((state) => {
      const performanceData = state.performanceData.map((p) => {
        if (p.contentId !== contentId) return p;
        const targetImpressions = p.targetImpressions ?? p.impressions;
        const targetEngagements = p.targetEngagements ?? p.engagements;
        const targetClicks = p.targetClicks ?? p.clicks;

        const multiplierImpressions = 0.8 + Math.random() * 0.5;
        const multiplierEngagements = 0.8 + Math.random() * 0.5;
        const multiplierClicks = 0.8 + Math.random() * 0.5;

        const impressions = Math.max(0, Math.round(targetImpressions * multiplierImpressions));
        const engagements = Math.max(0, Math.round(targetEngagements * multiplierEngagements));
        const clicks = Math.max(0, Math.round(targetClicks * multiplierClicks));
        const conversionRate = clicks > 0 && impressions > 0 ? clicks / impressions : 0;
        const roi = Math.random() * 2 - 0.2;
        const now = new Date().toISOString();

        updated = {
          ...p,
          impressions,
          engagements,
          clicks,
          conversionRate,
          roi,
          collectedAt: now,
          lastFetchedAt: now,
          fetchStatus: 'success',
        };
        return updated;
      });
      saveToStorage('performanceData', performanceData);
      return { performanceData };
    });
    if (!updated) {
      throw new Error('未找到对应 performanceData 记录');
    }
    return updated;
  },

  addPerformanceRecord: async (record) => {
    await delay(300);
    const newRecord: PerformanceData = {
      ...record,
      id: `perf-${generateId()}`,
      collectedAt: new Date().toISOString(),
      fetchStatus: record.fetchStatus ?? 'idle',
    };
    set((state) => {
      const performanceData = [newRecord, ...state.performanceData];
      saveToStorage('performanceData', performanceData);
      return { performanceData };
    });
    return newRecord;
  },

  createPaymentsForInvitation: async (invitationId) => {
    await delay(300);
    const invitation = get().invitations.find((i) => i.id === invitationId);
    if (!invitation) return;

    const depositAmount = Math.round(invitation.fee * 0.3);
    const finalAmount = Math.round(invitation.fee * 0.7);

    const depositPayment: Payment = {
      id: `payment-${generateId()}`,
      invitationId,
      kolName: invitation.kolName,
      campaignName: invitation.campaignName,
      type: 'deposit',
      amount: depositAmount,
      status: 'pending',
      dueDate: '3个工作日',
    };

    const finalPayment: Payment = {
      id: `payment-${generateId()}`,
      invitationId,
      kolName: invitation.kolName,
      campaignName: invitation.campaignName,
      type: 'final',
      amount: finalAmount,
      status: 'pending',
      dueDate: '数据达标后',
    };

    set((state) => {
      const payments = [depositPayment, finalPayment, ...state.payments];
      saveToStorage('payments', payments);
      return { payments };
    });
  },

  getPerformanceByInvitationId: (invitationId) =>
    get().performanceData.find((p) => p.contentId === invitationId),
}));
