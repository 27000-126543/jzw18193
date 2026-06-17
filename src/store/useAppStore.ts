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
  Contract,
  Invoice,
  CollaborationPayment,
} from '../types';
import {
  mockKOLs,
  mockCampaigns,
  mockInvitations,
  mockReviews,
  mockPerformanceData,
  mockPayments,
  mockContracts,
  mockInvoices,
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
  | 'payments'
  | 'contracts'
  | 'invoices';

const PERSISTED_KEYS: PersistedKey[] = [
  'campaigns',
  'invitations',
  'reviews',
  'performanceData',
  'payments',
  'contracts',
  'invoices',
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
const initContracts = () => loadFromStorage<Contract[]>('contracts', mockContracts);
const initInvoices = () => loadFromStorage<Invoice[]>('invoices', mockInvoices);

interface AppState {
  kols: KOL[];
  campaigns: Campaign[];
  invitations: Invitation[];
  reviews: ContentReview[];
  performanceData: PerformanceData[];
  payments: Payment[];
  contracts: Contract[];
  invoices: Invoice[];
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

  createContractForInvitation: (invitationId: string) => Promise<void>;
  signContract: (contractId: string) => Promise<void>;

  createInvoiceForPayment: (paymentId: string) => Promise<Invoice>;
  markInvoiceIssued: (invoiceId: string) => Promise<void>;

  checkKpiMet: (invitationId: string) => {
    ok: boolean;
    reason: string;
    impressionsRate: number;
    engagementsRate: number;
    clicksRate: number;
    fetched: boolean;
  };

  getCollaborationPayments: () => CollaborationPayment[];

  ensureDataConsistency: () => void;
}

export const useAppStore = create<AppState>()((set, get) => ({
  kols: mockKOLs,
  campaigns: initCampaigns(),
  invitations: initInvitations(),
  reviews: initReviews(),
  performanceData: initPerformanceData(),
  payments: initPayments(),
  contracts: initContracts(),
  invoices: initInvoices(),
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
      await get().createContractForInvitation(id);

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
      const kpiResult = state.checkKpiMet(payment.invitationId);
      if (!kpiResult.fetched) {
        throw new Error('尚未抓取数据，请先到「数据报告」抓取效果数据后再支付尾款');
      }
      if (!kpiResult.ok) {
        throw new Error(kpiResult.reason);
      }
    }

    set((state) => {
      const payments = state.payments.map((p) =>
        p.id === id ? { ...p, status: 'paid' as const, paidAt: new Date().toISOString() } : p
      );
      saveToStorage('payments', payments);
      return { payments };
    });

    await get().createInvoiceForPayment(id);
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

    const existingPayments = get().getPaymentsByInvitationId(invitationId);
    if (existingPayments.length > 0) return;

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

  createContractForInvitation: async (invitationId) => {
    await delay(300);
    const state = get();
    const invitation = state.invitations.find((i) => i.id === invitationId);
    if (!invitation) return;

    const existingContract = state.contracts.find((c) => c.invitationId === invitationId);
    if (existingContract) return;

    const newContract: Contract = {
      id: `contract-${generateId()}`,
      invitationId,
      kolName: invitation.kolName,
      campaignName: invitation.campaignName,
      status: 'unsigned',
      fee: invitation.fee,
      createdAt: new Date().toISOString(),
    };

    set((state) => {
      const contracts = [newContract, ...state.contracts];
      saveToStorage('contracts', contracts);
      return { contracts };
    });
  },

  signContract: async (contractId) => {
    await delay(300);
    set((state) => {
      const contracts = state.contracts.map((c) =>
        c.id === contractId ? { ...c, status: 'signed' as const, signedAt: new Date().toISOString() } : c
      );
      saveToStorage('contracts', contracts);
      return { contracts };
    });
  },

  createInvoiceForPayment: async (paymentId) => {
    await delay(300);
    const state = get();
    const payment = state.payments.find((p) => p.id === paymentId);
    if (!payment) {
      throw new Error('支付记录不存在');
    }

    const existingInvoice = state.invoices.find((i) => i.paymentId === paymentId);
    if (existingInvoice) {
      return existingInvoice;
    }

    const newInvoice: Invoice = {
      id: `invoice-${generateId()}`,
      paymentId,
      invitationId: payment.invitationId,
      kolName: payment.kolName,
      campaignName: payment.campaignName,
      type: payment.type,
      amount: payment.amount,
      status: 'issued',
      issuedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    set((state) => {
      const invoices = [newInvoice, ...state.invoices];
      saveToStorage('invoices', invoices);
      return { invoices };
    });

    return newInvoice;
  },

  markInvoiceIssued: async (invoiceId) => {
    await delay(300);
    set((state) => {
      const invoices = state.invoices.map((i) =>
        i.id === invoiceId ? { ...i, status: 'issued' as const, issuedAt: new Date().toISOString() } : i
      );
      saveToStorage('invoices', invoices);
      return { invoices };
    });
  },

  checkKpiMet: (invitationId) => {
    const perf = get().getPerformanceByInvitationId(invitationId);
    const noDataResult = {
      ok: false,
      reason: '',
      impressionsRate: 0,
      engagementsRate: 0,
      clicksRate: 0,
      fetched: false,
    };

    if (!perf) {
      return {
        ...noDataResult,
        reason: '尚未抓取数据，请先到「数据报告」抓取效果数据后再支付尾款',
      };
    }

    if (perf.fetchStatus !== 'success' || !perf.lastFetchedAt) {
      return {
        ...noDataResult,
        reason: '尚未抓取数据，请先到「数据报告」抓取效果数据后再支付尾款',
      };
    }

    const targetImpressions = perf.targetImpressions ?? 0;
    const targetEngagements = perf.targetEngagements ?? 0;
    const targetClicks = perf.targetClicks ?? 0;

    const impressionsRate = targetImpressions > 0 ? Math.round((perf.impressions / targetImpressions) * 100) : 100;
    const engagementsRate = targetEngagements > 0 ? Math.round((perf.engagements / targetEngagements) * 100) : 100;
    const clicksRate = targetClicks > 0 ? Math.round((perf.clicks / targetClicks) * 100) : 100;

    const impressionsOk = perf.impressions >= targetImpressions;
    const engagementsOk = perf.engagements >= targetEngagements;
    const clicksOk = perf.clicks >= targetClicks;

    if (impressionsOk && engagementsOk && clicksOk) {
      return {
        ok: true,
        reason: 'KPI已达标',
        impressionsRate,
        engagementsRate,
        clicksRate,
        fetched: true,
      };
    }

    const notMet: string[] = [];
    if (!impressionsOk) notMet.push('曝光');
    if (!engagementsOk) notMet.push('互动');
    if (!clicksOk) notMet.push('点击');

    const met: string[] = [];
    if (impressionsOk) met.push('曝光');
    if (engagementsOk) met.push('互动');
    if (clicksOk) met.push('点击');

    let reason = `KPI未达标（曝光${impressionsRate}%、互动${engagementsRate}%、点击${clicksRate}%）`;
    if (met.length > 0 && notMet.length > 0) {
      reason += `，${met.join('和')}达标但${notMet.join('和')}未满足，请确认实际投放效果`;
    } else {
      reason += '，请确认实际投放效果';
    }

    return {
      ok: false,
      reason,
      impressionsRate,
      engagementsRate,
      clicksRate,
      fetched: true,
    };
  },

  getCollaborationPayments: () => {
    const state = get();
    const { invitations, payments, contracts, invoices, performanceData } = state;

    const invitationIds = new Set<string>();
    invitations.forEach((inv) => invitationIds.add(inv.id));
    payments.forEach((p) => invitationIds.add(p.invitationId));

    const result: CollaborationPayment[] = [];

    invitationIds.forEach((invitationId) => {
      const invitation = invitations.find((i) => i.id === invitationId);
      const invPayments = payments.filter((p) => p.invitationId === invitationId);
      const deposit = invPayments.find((p) => p.type === 'deposit');
      const finalPayment = invPayments.find((p) => p.type === 'final');
      const contract = contracts.find((c) => c.invitationId === invitationId);
      const invInvoices = invoices.filter((i) => i.invitationId === invitationId);
      const performance = performanceData.find((p) => p.contentId === invitationId);

      const fee = invitation?.fee ?? (deposit?.amount || 0) + (finalPayment?.amount || 0);

      let currentStage: CollaborationPayment['currentStage'] = 'unsigned';
      let kpiStatus: CollaborationPayment['kpiStatus'] = 'no_data';

      if (!contract || contract.status === 'unsigned') {
        currentStage = 'unsigned';
      } else if (deposit?.status === 'pending') {
        currentStage = 'deposit_pending';
      } else if (deposit?.status === 'paid' && finalPayment?.status === 'pending') {
        const kpiResult = state.checkKpiMet(invitationId);
        if (kpiResult.ok) {
          currentStage = 'final_pending';
        } else {
          currentStage = 'kpi_pending';
        }
      } else if (deposit?.status === 'paid' && finalPayment?.status === 'paid') {
        currentStage = 'completed';
      } else if (deposit?.status === 'paid') {
        currentStage = 'deposit_paid';
      }

      if (!performance) {
        kpiStatus = 'no_data';
      } else if (performance.fetchStatus !== 'success' || !performance.lastFetchedAt) {
        kpiStatus = 'not_fetched';
      } else {
        const kpiResult = state.checkKpiMet(invitationId);
        kpiStatus = kpiResult.ok ? 'met' : 'not_met';
      }

      result.push({
        invitationId,
        kolName: invitation?.kolName,
        campaignName: invitation?.campaignName,
        fee,
        publishDate: invitation?.publishDate,
        deposit,
        finalPayment,
        contract,
        invoices: invInvoices,
        performance,
        currentStage,
        kpiStatus,
      });
    });

    return result.sort((a, b) => {
      const dateA = a.contract?.createdAt || a.deposit?.dueDate || '';
      const dateB = b.contract?.createdAt || b.deposit?.dueDate || '';
      return dateB.localeCompare(dateA);
    });
  },

  ensureDataConsistency: () => {
    const state = get();
    const { invitations, payments, contracts, invoices } = state;

    const acceptedInvitations = invitations.filter((i) => i.status === 'accepted');
    acceptedInvitations.forEach(async (invitation) => {
      const hasPayments = payments.some((p) => p.invitationId === invitation.id);
      if (hasPayments) {
        const hasContract = contracts.some((c) => c.invitationId === invitation.id);
        if (!hasContract) {
          await get().createContractForInvitation(invitation.id);
        }
      }
    });

    const paidPayments = payments.filter((p) => p.status === 'paid');
    paidPayments.forEach(async (payment) => {
      const hasInvoice = invoices.some((i) => i.paymentId === payment.id);
      if (!hasInvoice) {
        await get().createInvoiceForPayment(payment.id);
      }
    });
  },
}));
