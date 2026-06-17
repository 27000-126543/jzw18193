import { useState, useMemo, useCallback } from 'react';
import { useShallow } from 'zustand/shallow';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { formatMoney, formatNumber, cn } from '@/utils';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import {
  Wallet,
  DollarSign,
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  FileText,
  ChevronRight,
  Calendar,
  Target,
  AlertCircle,
  ArrowUpRight,
  Eye,
  X,
  FileCheck,
  FileX,
  Receipt,
  CheckCircle2,
  Circle,
  Eye as EyeIcon,
  Heart,
  MousePointerClick,
} from 'lucide-react';
import type { Payment, Invitation, PerformanceData } from '@/types';

const stageFilters = [
  { value: 'all', label: '全部' },
  { value: 'unsigned', label: '未签约' },
  { value: 'deposit_pending', label: '待定金' },
  { value: 'kpi_pending', label: '待数据达标' },
  { value: 'final_pending', label: '待尾款' },
  { value: 'completed', label: '已完成' },
] as const;
type StageFilter = typeof stageFilters[number]['value'];

type CollaborationStage =
  | 'unsigned'
  | 'deposit_pending'
  | 'kpi_pending'
  | 'final_pending'
  | 'completed';

interface CollaborationView {
  invitation: Invitation;
  payments: Payment[];
  depositPayment?: Payment;
  finalPayment?: Payment;
  performance?: PerformanceData;
  totalFee: number;
  stage: CollaborationStage;
  kpiStatus: 'met' | 'not_met' | 'pending';
  contractSigned: boolean;
  invoicesIssued: number;
  platform?: string;
}

function computeKpiStatus(perf?: PerformanceData): 'met' | 'not_met' | 'pending' {
  if (!perf || !perf.lastFetchedAt) return 'pending';
  const impressionRate = perf.targetImpressions ? perf.impressions / perf.targetImpressions : 0;
  const engagementRate = perf.targetEngagements ? perf.engagements / perf.targetEngagements : 0;
  const clickRate = perf.targetClicks ? perf.clicks / perf.targetClicks : 0;
  if (impressionRate >= 1 && engagementRate >= 1 && clickRate >= 1) return 'met';
  return 'not_met';
}

function computeStage(cv: {
  invitation: Invitation;
  depositPayment?: Payment;
  finalPayment?: Payment;
  kpiStatus: 'met' | 'not_met' | 'pending';
  contractSigned: boolean;
}): CollaborationStage {
  if (!cv.contractSigned) return 'unsigned';
  if (!cv.depositPayment || cv.depositPayment.status !== 'paid') return 'deposit_pending';
  if (cv.kpiStatus !== 'met') return 'kpi_pending';
  if (!cv.finalPayment || cv.finalPayment.status !== 'paid') return 'final_pending';
  return 'completed';
}

export default function Finance() {
  const navigate = useNavigate();
  const {
    invitations,
    payments,
    performanceData,
    markPaymentPaid,
    getPerformanceByInvitationId,
    getKolById,
  } = useAppStore(
    useShallow((state) => ({
      invitations: state.invitations,
      payments: state.payments,
      performanceData: state.performanceData,
      markPaymentPaid: state.markPaymentPaid,
      getPerformanceByInvitationId: state.getPerformanceByInvitationId,
      getKolById: state.getKolById,
    }))
  );

  const [stageFilter, setStageFilter] = useState<StageFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollab, setSelectedCollab] = useState<CollaborationView | null>(null);
  const [signedContracts, setSignedContracts] = useState<Set<string>>(new Set());
  const [issuedInvoices, setIssuedInvoices] = useState<Set<string>>(new Set());

  const collaborations = useMemo<CollaborationView[]>(() => {
    const acceptedInvitations = invitations.filter((inv) => inv.status === 'accepted');
    return acceptedInvitations.map((inv) => {
      const invPayments = payments.filter((p) => p.invitationId === inv.id);
      const depositPayment = invPayments.find((p) => p.type === 'deposit');
      const finalPayment = invPayments.find((p) => p.type === 'final');
      const performance = getPerformanceByInvitationId(inv.id);
      const kpiStatus = computeKpiStatus(performance);
      const contractSigned = signedContracts.has(inv.id);
      const invoicesIssued = invPayments.filter((p) => issuedInvoices.has(p.id)).length;

      const kol = inv.kolId ? getKolById(inv.kolId) : undefined;

      const cv = {
        invitation: inv,
        payments: invPayments,
        depositPayment,
        finalPayment,
        performance,
        totalFee: inv.fee,
        stage: 'unsigned' as CollaborationStage,
        kpiStatus,
        contractSigned,
        invoicesIssued,
        platform: kol?.platform,
      };
      cv.stage = computeStage(cv);
      return cv;
    });
  }, [invitations, payments, performanceData, signedContracts, issuedInvoices, getPerformanceByInvitationId, getKolById]);

  const filteredCollaborations = useMemo(() => {
    return collaborations.filter((cv) => {
      const matchesStage = stageFilter === 'all' || cv.stage === stageFilter;
      const matchesSearch =
        !searchQuery ||
        cv.invitation.kolName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cv.invitation.campaignName?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStage && matchesSearch;
    });
  }, [collaborations, stageFilter, searchQuery]);

  const stats = useMemo(() => {
    const total = collaborations.reduce((sum, cv) => sum + cv.totalFee, 0);
    let paid = 0;
    let pending = 0;
    let overdue = 0;
    collaborations.forEach((cv) => {
      cv.payments.forEach((p) => {
        if (p.status === 'paid') paid += p.amount;
        else if (p.status === 'pending') pending += p.amount;
        else if (p.status === 'overdue') {
          pending += p.amount;
          overdue += p.amount;
        }
      });
    });
    return { total, paid, pending, overdue };
  }, [collaborations]);

  const stageCounts = useMemo(() => {
    const counts: Record<CollaborationStage, number> = {
      unsigned: 0,
      deposit_pending: 0,
      kpi_pending: 0,
      final_pending: 0,
      completed: 0,
    };
    collaborations.forEach((cv) => {
      counts[cv.stage]++;
    });
    return counts;
  }, [collaborations]);

  const handleSignContract = useCallback((invId: string) => {
    setSignedContracts((prev) => new Set(prev).add(invId));
    alert('合同已签署！');
  }, []);

  const handleMarkPaid = useCallback(
    async (payment: Payment) => {
      try {
        if (payment.type === 'final') {
          const perf = getPerformanceByInvitationId(payment.invitationId);
          if (perf) {
            const kpiStatus = computeKpiStatus(perf);
            if (kpiStatus !== 'met') {
              alert('KPI未达标，无法支付尾款，请先确认数据抓取结果');
              return;
            }
          } else {
            if (!confirm('注意：该笔尾款对应的效果数据尚未抓取，数据未达标的情况下将无法支付尾款。建议先抓取数据再操作，确认继续吗？')) {
              return;
            }
          }
        }
        await markPaymentPaid(payment.id);
        alert(payment.type === 'deposit' ? '定金已标记为已支付！' : '尾款已标记为已支付！');
      } catch (e: any) {
        alert('操作失败：' + e.message);
      }
    },
    [markPaymentPaid, getPerformanceByInvitationId]
  );

  const handleIssueInvoice = useCallback((paymentId: string) => {
    setIssuedInvoices((prev) => new Set(prev).add(paymentId));
    alert('发票已开具！');
  }, []);

  const getStageLabel = (stage: CollaborationStage) => {
    const map: Record<CollaborationStage, string> = {
      unsigned: '未签约',
      deposit_pending: '待定金',
      kpi_pending: '待数据达标',
      final_pending: '待尾款',
      completed: '已完成',
    };
    return map[stage];
  };

  const getStageBadgeClass = (stage: CollaborationStage) => {
    const map: Record<CollaborationStage, string> = {
      unsigned: 'bg-gray-100 text-gray-700',
      deposit_pending: 'bg-blue-100 text-blue-700',
      kpi_pending: 'bg-amber-100 text-amber-700',
      final_pending: 'bg-purple-100 text-purple-700',
      completed: 'bg-success-100 text-success-700',
    };
    return map[stage];
  };

  const getPlatformBadge = (platform?: string) => {
    if (!platform) return null;
    const map: Record<string, string> = {
      douyin: 'bg-black text-white',
      xiaohongshu: 'bg-red-500 text-white',
      weibo: 'bg-orange-500 text-white',
      bilibili: 'bg-sky-500 text-white',
      kuaishou: 'bg-orange-600 text-white',
    };
    const nameMap: Record<string, string> = {
      douyin: '抖音',
      xiaohongshu: '小红书',
      weibo: '微博',
      bilibili: 'B站',
      kuaishou: '快手',
    };
    return (
      <span className={cn('px-2 py-0.5 rounded text-xs font-medium', map[platform] || 'bg-gray-500 text-white')}>
        {nameMap[platform] || platform}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-800">费用结算</h1>
          <p className="text-gray-500 mt-1">管理合作费用，追踪里程碑付款状态</p>
        </div>
        <button className="btn-secondary">
          <Download className="w-4 h-4" />
          导出账单
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <Wallet className="w-6 h-6 text-primary-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-1">应付款总额</p>
          <p className="font-display font-bold text-2xl text-gray-800">{formatMoney(stats.total)}</p>
          <p className="text-xs text-gray-400 mt-2">共 {collaborations.length} 个合作单</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-1">已支付</p>
          <p className="font-display font-bold text-2xl text-success-600">{formatMoney(stats.paid)}</p>
          <p className="text-xs text-gray-400 mt-2">已完成 {stageCounts.completed} 单</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-1">待支付</p>
          <p className="font-display font-bold text-2xl text-amber-600">{formatMoney(stats.pending)}</p>
          <p className="text-xs text-gray-400 mt-2">
            待定金 {stageCounts.deposit_pending} | 待尾款 {stageCounts.final_pending}
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-danger-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-danger-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-1">已逾期</p>
          <p className="font-display font-bold text-2xl text-danger-600">{formatMoney(stats.overdue)}</p>
          <p className="text-xs text-gray-400 mt-2">需关注处理</p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <span className="text-gray-600 font-medium">各阶段进度：</span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            未签约 <span className="font-bold text-gray-800">{stageCounts.unsigned}</span>
          </span>
          <span className="text-gray-300">|</span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            待定金 <span className="font-bold text-gray-800">{stageCounts.deposit_pending}</span>
          </span>
          <span className="text-gray-300">|</span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            待数据达标 <span className="font-bold text-gray-800">{stageCounts.kpi_pending}</span>
          </span>
          <span className="text-gray-300">|</span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            待尾款 <span className="font-bold text-gray-800">{stageCounts.final_pending}</span>
          </span>
          <span className="text-gray-300">|</span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-success-500" />
            已完成 <span className="font-bold text-gray-800">{stageCounts.completed}</span>
          </span>
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="搜索KOL或活动名称..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-12"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {stageFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStageFilter(filter.value)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                stageFilter === filter.value
                  ? 'bg-primary-700 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-semibold text-lg text-gray-800">合作单列表</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-500">KOL / 活动</th>
                <th className="text-right py-4 px-4 text-sm font-medium text-gray-500">总费用</th>
                <th className="text-center py-4 px-4 text-sm font-medium text-gray-500">付款进度</th>
                <th className="text-center py-4 px-4 text-sm font-medium text-gray-500">KPI状态</th>
                <th className="text-center py-4 px-4 text-sm font-medium text-gray-500">合同状态</th>
                <th className="text-center py-4 px-4 text-sm font-medium text-gray-500">发票</th>
                <th className="text-center py-4 px-4 text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredCollaborations.map((cv, index) => {
                const depositPaid = cv.depositPayment?.status === 'paid';
                const finalPaid = cv.finalPayment?.status === 'paid';
                const finalCanPay = cv.kpiStatus === 'met' && !finalPaid;
                const finalTooltip = cv.kpiStatus === 'pending'
                  ? '请先抓取数据'
                  : cv.kpiStatus === 'not_met'
                  ? 'KPI未达标，无法支付尾款'
                  : finalPaid
                  ? '尾款已支付'
                  : '';

                return (
                  <motion.tr
                    key={cv.invitation.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-primary-700 font-semibold text-sm">
                              {cv.invitation.kolName?.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800">{cv.invitation.kolName}</span>
                              {getPlatformBadge(cv.platform)}
                            </div>
                            <span className="text-xs text-gray-500">{cv.invitation.campaignName}</span>
                          </div>
                        </div>
                        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium w-fit ml-11', getStageBadgeClass(cv.stage))}>
                          {getStageLabel(cv.stage)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <p className="font-display font-bold text-lg text-gray-800">{formatMoney(cv.totalFee)}</p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <span className={cn(
                          'px-2 py-0.5 rounded text-xs font-medium',
                          depositPaid ? 'bg-success-100 text-success-700' : 'bg-amber-100 text-amber-700'
                        )}>
                          定金 {depositPaid ? '已付' : '待付'}
                        </span>
                        <ChevronRight className="w-3 h-3 text-gray-400" />
                        <span className={cn(
                          'px-2 py-0.5 rounded text-xs font-medium',
                          finalPaid
                            ? 'bg-success-100 text-success-700'
                            : cv.kpiStatus === 'met'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-gray-100 text-gray-500'
                        )}>
                          尾款 {finalPaid ? '已付' : cv.kpiStatus === 'met' ? '待付' : '待达标'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {cv.kpiStatus === 'met' && (
                        <span className="inline-flex items-center gap-1 text-success-600 text-sm font-medium">
                          🟢 全达标
                        </span>
                      )}
                      {cv.kpiStatus === 'not_met' && (
                        <span className="inline-flex items-center gap-1 text-danger-600 text-sm font-medium">
                          🔴 未达标
                        </span>
                      )}
                      {cv.kpiStatus === 'pending' && (
                        <span className="inline-flex items-center gap-1 text-gray-400 text-sm font-medium">
                          ⚪ 待抓取
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {cv.contractSigned ? (
                        <span className="inline-flex items-center gap-1 text-success-600 text-sm font-medium">
                          <FileCheck className="w-4 h-4" />
                          已签约
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-500 text-sm font-medium">
                          <FileX className="w-4 h-4" />
                          未签约
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-gray-600 text-sm font-medium">
                        <Receipt className="w-4 h-4" />
                        {cv.invoicesIssued}/{cv.payments.length}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        {!cv.contractSigned && (
                          <button
                            onClick={() => handleSignContract(cv.invitation.id)}
                            className="btn-primary text-xs py-1.5 px-2.5"
                          >
                            <FileCheck className="w-3.5 h-3.5" />
                            签约
                          </button>
                        )}
                        {cv.stage === 'deposit_pending' && cv.depositPayment && (
                          <button
                            onClick={() => handleMarkPaid(cv.depositPayment!)}
                            className="btn-primary text-xs py-1.5 px-2.5"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            标记定金已付
                          </button>
                        )}
                        <button
                          onClick={() => navigate('/reports')}
                          className="btn-secondary text-xs py-1.5 px-2.5"
                        >
                          {cv.kpiStatus === 'pending' ? (
                            <>
                              <Target className="w-3.5 h-3.5" />
                              抓取数据
                            </>
                          ) : (
                            <>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              查看报告
                            </>
                          )}
                        </button>
                        {cv.stage === 'final_pending' && cv.finalPayment && (
                          <button
                            onClick={() => handleMarkPaid(cv.finalPayment!)}
                            disabled={!finalCanPay}
                            title={finalTooltip || undefined}
                            className="btn-primary text-xs py-1.5 px-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            标记尾款已付
                          </button>
                        )}
                        {cv.payments
                          .filter((p) => p.status === 'paid' && !issuedInvoices.has(p.id))
                          .slice(0, 1)
                          .map((p) => (
                            <button
                              key={p.id}
                              onClick={() => handleIssueInvoice(p.id)}
                              className="btn-secondary text-xs py-1.5 px-2.5"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              开票
                            </button>
                          ))}
                        <button
                          onClick={() => setSelectedCollab(cv)}
                          className="btn-secondary text-xs py-1.5 px-2.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          详情
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredCollaborations.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500">暂无匹配的合作单</p>
          </div>
        )}
      </Card>

      <AnimatePresence>
        {selectedCollab && (
          <CollaborationDetailModal
            cv={selectedCollab}
            onClose={() => setSelectedCollab(null)}
            onSignContract={handleSignContract}
            onMarkPaid={handleMarkPaid}
            onIssueInvoice={handleIssueInvoice}
            onGoReports={() => navigate('/reports')}
            issuedInvoices={issuedInvoices}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface ModalProps {
  cv: CollaborationView;
  onClose: () => void;
  onSignContract: (invId: string) => void;
  onMarkPaid: (payment: Payment) => void;
  onIssueInvoice: (paymentId: string) => void;
  onGoReports: () => void;
  issuedInvoices: Set<string>;
}

function CollaborationDetailModal({
  cv,
  onClose,
  onSignContract,
  onMarkPaid,
  onIssueInvoice,
  onGoReports,
  issuedInvoices,
}: ModalProps) {
  const depositPaid = cv.depositPayment?.status === 'paid';
  const finalPaid = cv.finalPayment?.status === 'paid';
  const finalCanPay = cv.kpiStatus === 'met' && !finalPaid;

  const stepState = (idx: number) => {
    const steps = [
      cv.contractSigned,
      depositPaid,
      cv.kpiStatus === 'met',
      finalPaid,
      cv.payments.every((p) => issuedInvoices.has(p.id)),
    ];
    const completedCount = steps.filter(Boolean).length;
    if (idx < completedCount) return 'done';
    if (idx === completedCount) return 'active';
    return 'pending';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-display font-bold text-xl text-gray-800">
            合作详情 - {cv.invitation.kolName}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">KOL</p>
              <p className="font-semibold text-gray-800">{cv.invitation.kolName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">活动</p>
              <p className="font-semibold text-gray-800 truncate">{cv.invitation.campaignName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">总金额</p>
              <p className="font-display font-bold text-lg text-gray-800">
                {formatMoney(cv.totalFee)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">预期发布日期</p>
              <p className="font-semibold text-gray-800">
                {cv.invitation.publishDate || '待确认'}
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-4">合作流程</h3>
            <div className="space-y-0">
              {[
                {
                  key: 'contract',
                  title: '合同签署',
                  desc: cv.contractSigned ? '合同已签署' : '等待签署合同',
                  time: cv.contractSigned ? '已完成' : undefined,
                  action: !cv.contractSigned ? (
                    <button
                      onClick={() => onSignContract(cv.invitation.id)}
                      className="btn-primary text-xs py-1.5 px-3"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      签署合同
                    </button>
                  ) : null,
                },
                {
                  key: 'deposit',
                  title: '定金支付',
                  desc: cv.depositPayment
                    ? `${formatMoney(cv.depositPayment.amount)} (30%)`
                    : '待生成',
                  time: cv.depositPayment?.paidAt
                    ? new Date(cv.depositPayment.paidAt).toLocaleDateString('zh-CN')
                    : depositPaid
                    ? '已支付'
                    : '待支付',
                  action:
                    cv.contractSigned && cv.depositPayment && !depositPaid ? (
                      <button
                        onClick={() => onMarkPaid(cv.depositPayment!)}
                        className="btn-primary text-xs py-1.5 px-3"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        标记定金已付
                      </button>
                    ) : null,
                },
                {
                  key: 'kpi',
                  title: '内容发布与数据抓取',
                  desc: cv.performance
                    ? `曝光 ${formatNumber(cv.performance.impressions)} · 互动 ${formatNumber(cv.performance.engagements)} · 点击 ${formatNumber(cv.performance.clicks)}`
                    : '等待发布内容',
                  time: cv.performance?.lastFetchedAt
                    ? new Date(cv.performance.lastFetchedAt).toLocaleDateString('zh-CN')
                    : cv.kpiStatus === 'pending'
                    ? '待抓取'
                    : undefined,
                  action: (
                    <button
                      onClick={onGoReports}
                      className="btn-secondary text-xs py-1.5 px-3"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                      {cv.kpiStatus === 'pending' ? '抓取数据' : '查看报告'}
                    </button>
                  ),
                  extra: cv.performance?.lastFetchedAt ? (
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      <KpiMiniBar
                        label="曝光"
                        icon={<EyeIcon className="w-3 h-3" />}
                        actual={cv.performance.impressions}
                        target={cv.performance.targetImpressions || 0}
                      />
                      <KpiMiniBar
                        label="互动"
                        icon={<Heart className="w-3 h-3" />}
                        actual={cv.performance.engagements}
                        target={cv.performance.targetEngagements || 0}
                      />
                      <KpiMiniBar
                        label="点击"
                        icon={<MousePointerClick className="w-3 h-3" />}
                        actual={cv.performance.clicks}
                        target={cv.performance.targetClicks || 0}
                      />
                    </div>
                  ) : null,
                },
                {
                  key: 'final',
                  title: '尾款支付',
                  desc: cv.finalPayment
                    ? `${formatMoney(cv.finalPayment.amount)} (70%)`
                    : '待生成',
                  time: cv.finalPayment?.paidAt
                    ? new Date(cv.finalPayment.paidAt).toLocaleDateString('zh-CN')
                    : finalPaid
                    ? '已支付'
                    : cv.kpiStatus !== 'met'
                    ? '等待KPI达标'
                    : '待支付',
                  action:
                    cv.kpiStatus === 'met' && cv.finalPayment && !finalPaid ? (
                      <button
                        onClick={() => onMarkPaid(cv.finalPayment!)}
                        className="btn-primary text-xs py-1.5 px-3"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                        标记尾款已付
                      </button>
                    ) : null,
                },
                {
                  key: 'invoice',
                  title: '发票开具',
                  desc: `${cv.invoicesIssued}/${cv.payments.length} 张已开具`,
                  time: undefined,
                  action: cv.payments
                    .filter((p) => p.status === 'paid' && !issuedInvoices.has(p.id))
                    .slice(0, 1)
                    .map((p) => (
                      <button
                        key={p.id}
                        onClick={() => onIssueInvoice(p.id)}
                        className="btn-secondary text-xs py-1.5 px-3"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        开具{p.type === 'deposit' ? '定金' : '尾款'}发票
                      </button>
                    ))[0] || null,
                },
              ].map((step, idx) => {
                const state = stepState(idx);
                return (
                  <div key={step.key} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={cn(
                          'w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0',
                          state === 'done'
                            ? 'bg-success-500'
                            : state === 'active'
                            ? 'bg-primary-500'
                            : 'bg-gray-300'
                        )}
                      >
                        {state === 'done' ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                      </div>
                      {idx < 4 && (
                        <div
                          className={cn(
                            'w-0.5 flex-1 min-h-[60px]',
                            state === 'done' ? 'bg-success-300' : 'bg-gray-200'
                          )}
                        />
                      )}
                    </div>
                    <div className="flex-1 pb-6">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-800">{step.title}</h4>
                            {state === 'done' && (
                              <span className="text-xs px-2 py-0.5 rounded bg-success-100 text-success-700 font-medium">
                                已完成
                              </span>
                            )}
                            {state === 'active' && (
                              <span className="text-xs px-2 py-0.5 rounded bg-primary-100 text-primary-700 font-medium">
                                进行中
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5">{step.desc}</p>
                          {step.time && (
                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {step.time}
                            </p>
                          )}
                        </div>
                        {step.action}
                      </div>
                      {step.extra}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-3">付款历史</h3>
            <div className="space-y-2">
              {cv.payments.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center',
                        p.type === 'deposit'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-purple-100 text-purple-600'
                      )}
                    >
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">
                          {p.type === 'deposit' ? '定金' : '尾款'}
                        </span>
                        <Badge status={p.status} />
                        {issuedInvoices.has(p.id) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                            <Receipt className="w-3 h-3" />
                            已开票
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        到期：{p.dueDate}
                        {p.paidAt && ` · 支付于 ${new Date(p.paidAt).toLocaleDateString('zh-CN')}`}
                      </p>
                    </div>
                  </div>
                  <span className="font-display font-bold text-gray-800">
                    {formatMoney(p.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <button onClick={onClose} className="btn-secondary">
              关闭
            </button>
            <button onClick={onGoReports} className="btn-primary">
              <ArrowUpRight className="w-4 h-4" />
              查看数据报告
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function KpiMiniBar({
  label,
  icon,
  actual,
  target,
}: {
  label: string;
  icon: React.ReactNode;
  actual: number;
  target: number;
}) {
  const rate = target > 0 ? actual / target : 0;
  const ok = rate >= 1;
  return (
    <div className="bg-gray-50 rounded-lg p-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500 flex items-center gap-1">
          {icon}
          {label}
        </span>
        <span
          className={cn(
            'text-xs font-bold',
            ok ? 'text-success-600' : target === 0 ? 'text-gray-400' : 'text-accent-600'
          )}
        >
          {(rate * 100).toFixed(0)}%
        </span>
      </div>
      <div className="progress-bar h-1.5">
        <div
          className={cn(
            'progress-fill',
            ok
              ? 'bg-gradient-to-r from-success-400 to-success-600'
              : 'bg-gradient-to-r from-accent-400 to-accent-600'
          )}
          style={{ width: `${Math.min(rate * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}
