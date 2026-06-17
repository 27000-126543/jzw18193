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
}

export const useAppStore = create<AppState>()((set, get) => ({
  kols: mockKOLs,
  campaigns: mockCampaigns,
  invitations: mockInvitations,
  reviews: mockReviews,
  performanceData: mockPerformanceData,
  payments: mockPayments,
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
    set((state) => ({
      campaigns: [newCampaign, ...state.campaigns],
    }));
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
    set((state) => ({
      invitations: [newInvitation, ...state.invitations],
    }));
    return newInvitation;
  },

  updateInvitationStatus: async (id, status) => {
    await delay(300);
    set((state) => ({
      invitations: state.invitations.map((inv) =>
        inv.id === id ? { ...inv, status } : inv
      ),
    }));
  },

  approveReview: async (id, feedback) => {
    await delay(300);
    set((state) => ({
      reviews: state.reviews.map((r) =>
        r.id === id
          ? { ...r, status: 'approved', feedback: feedback || '', reviewedAt: new Date().toISOString() }
          : r
      ),
    }));
  },

  rejectReview: async (id, feedback) => {
    await delay(300);
    set((state) => ({
      reviews: state.reviews.map((r) =>
        r.id === id
          ? { ...r, status: 'rejected', feedback, reviewedAt: new Date().toISOString() }
          : r
      ),
    }));
  },

  markPaymentPaid: async (id) => {
    await delay(300);
    set((state) => ({
      payments: state.payments.map((p) =>
        p.id === id ? { ...p, status: 'paid', paidAt: new Date().toISOString() } : p
      ),
    }));
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
}));
