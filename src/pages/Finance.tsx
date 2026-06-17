import { useState, useMemo, useCallback, useRef } from 'react';
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
  Flag,
  AlertOctagon,
  Check,
  Copy,
  RefreshCw,
  Bell,
} from 'lucide-react';
import type { Payment, Invitation, PerformanceData, Contract, Invoice } from '@/types';

type ExceptionType = 'communication_break' | 'data_anomaly' | 'need_reconfirm' | 'other';
type ExceptionStatus = 'active' | 'resolved';

interface CollaborationException {
  id: string;
  invitationId: string;
  type: ExceptionType;
  remark: string;
  status: ExceptionStatus;
  createdAt: string;
  resolvedAt?: string;
}

type TodoPriority = 'high' | 'medium' | 'low';

interface TodoItem {
  id: string;
  invitationId: string;
  title: string;
  kolName: string;
  campaignName: string;
  priority: TodoPriority;
  dueDate: string;
  stage: string;
}

const exceptionTypeLabels: Record<ExceptionType, string> = {
  communication_break: '沟通中断',
  data_anomaly: '数据异常',
  need_reconfirm: '需重新确认',
  other: '其他',
};

const exceptionFilterOptions = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '有异常' },
  { value: 'resolved', label: '已解决' },
] as const;
type ExceptionFilter = typeof exceptionFilterOptions[number]['value'];

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
  contract?: Contract;
  invoices: Invoice[];
  invoicesIssued: number;
  platform?: string;
  exception?: CollaborationException;
  dueStatus?: {
    type: 'overdue' | 'upcoming' | 'normal';
    days: number;
    text: string;
  };
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

const generateId = () => Math.random().toString(36).substr(2, 9);

const computeDueStatus = (publishDate?: string, stage?: CollaborationStage) => {
  if (!publishDate || stage === 'completed') return undefined;
  const publish = new Date(publishDate);
  const now = new Date();
  const diffTime = now.getTime() - publish.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 7) {
    return {
      type: 'overdue' as const,
      days: diffDays - 7,
      text: `已逾期 ${diffDays - 7} 天`,
    };
  } else if (diffDays >= 0 && diffDays <= 7) {
    const remaining = 7 - diffDays;
    if (remaining === 0) {
      return {
        type: 'upcoming' as const,
        days: 0,
        text: '今日到期',
      };
    }
    return {
      type: 'upcoming' as const,
      days: remaining,
      text: `${remaining}天后到期`,
    };
  } else {
    return undefined;
  }
};

export default function Finance() {
  const navigate = useNavigate();
  const {
    invitations,
    payments,
    performanceData,
    contracts,
    invoices,
    markPaymentPaid,
    getPerformanceByInvitationId,
    getKolById,
    signContract,
    createInvoiceForPayment,
    markInvoiceIssued,
    checkKpiMet,
  } = useAppStore(
    useShallow((state) => ({
      invitations: state.invitations,
      payments: state.payments,
      performanceData: state.performanceData,
      contracts: state.contracts,
      invoices: state.invoices,
      markPaymentPaid: state.markPaymentPaid,
      getPerformanceByInvitationId: state.getPerformanceByInvitationId,
      getKolById: state.getKolById,
      signContract: state.signContract,
      createInvoiceForPayment: state.createInvoiceForPayment,
      markInvoiceIssued: state.markInvoiceIssued,
      checkKpiMet: state.checkKpiMet,
    }))
  );

  const [stageFilter, setStageFilter] = useState<StageFilter>('all');
  const [exceptionFilter, setExceptionFilter] = useState<ExceptionFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollab, setSelectedCollab] = useState<CollaborationView | null>(null);
  const [exceptions, setExceptions] = useState<CollaborationException[]>([]);
  const [exceptionModal, setExceptionModal] = useState<{
    open: boolean;
    invitationId: string | null;
    mode: 'create' | 'resolve';
  }>({ open: false, invitationId: null, mode: 'create' });
  const [exceptionForm, setExceptionForm] = useState({
    type: 'communication_break' as ExceptionType,
    remark: '',
  });
  const tableRef = useRef<HTMLDivElement>(null);

  const setException = useCallback((invitationId: string, type: ExceptionType, remark: string) => {
    const newException: CollaborationException = {
      id: `exc-${generateId()}`,
      invitationId,
      type,
      remark,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    setExceptions((prev) => [...prev.filter((e) => e.invitationId !== invitationId), newException]);
  }, []);

  const resolveException = useCallback((invitationId: string) => {
    setExceptions((prev) =>
      prev.map((e) =>
        e.invitationId === invitationId
          ? { ...e, status: 'resolved' as const, resolvedAt: new Date().toISOString() }
          : e
      )
    );
  }, []);

  const collaborations = useMemo<CollaborationView[]>(() => {
    const acceptedInvitations = invitations.filter((inv) => inv.status === 'accepted');
    return acceptedInvitations.map((inv) => {
      const invPayments = payments.filter((p) => p.invitationId === inv.id);
      const depositPayment = invPayments.find((p) => p.type === 'deposit');
      const finalPayment = invPayments.find((p) => p.type === 'final');
      const performance = getPerformanceByInvitationId(inv.id);
      const contract = contracts.find((c) => c.invitationId === inv.id);
      const contractSigned = contract?.status === 'signed';
      const invInvoices = invoices.filter((i) => i.invitationId === inv.id);
      const invoicesIssued = invPayments.filter((p) =>
        invInvoices.some((i) => i.paymentId === p.id && i.status === 'issued')
      ).length;

      const kpiResult = checkKpiMet(inv.id);
      let kpiStatus: 'met' | 'not_met' | 'pending' = 'pending';
      if (kpiResult.fetched) {
        kpiStatus = kpiResult.ok ? 'met' : 'not_met';
      }

      const kol = inv.kolId ? getKolById(inv.kolId) : undefined;
      const exception = exceptions.find((e) => e.invitationId === inv.id);

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
        contract,
        invoices: invInvoices,
        invoicesIssued,
        platform: kol?.platform,
        exception,
        dueStatus: undefined,
      };
      cv.stage = computeStage(cv);
      cv.dueStatus = computeDueStatus(inv.publishDate, cv.stage);
      return cv;
    });
  }, [invitations, payments, performanceData, contracts, invoices, getPerformanceByInvitationId, getKolById, checkKpiMet, exceptions]);

  const todos = useMemo<TodoItem[]>(() => {
    const todoList: TodoItem[] = [];
    collaborations.forEach((cv) => {
      if (cv.stage === 'completed') return;

      if (cv.stage === 'unsigned') {
        todoList.push({
          id: `todo-${cv.invitation.id}-sign`,
          invitationId: cv.invitation.id,
          title: '签署合同',
          kolName: cv.invitation.kolName || '',
          campaignName: cv.invitation.campaignName || '',
          priority: 'high',
          dueDate: cv.invitation.publishDate || '',
          stage: cv.stage,
        });
      }
      if (cv.stage === 'deposit_pending') {
        todoList.push({
          id: `todo-${cv.invitation.id}-deposit`,
          invitationId: cv.invitation.id,
          title: '支付定金',
          kolName: cv.invitation.kolName || '',
          campaignName: cv.invitation.campaignName || '',
          priority: 'high',
          dueDate: cv.invitation.publishDate || '',
          stage: cv.stage,
        });
      }
      if (cv.stage === 'kpi_pending') {
        todoList.push({
          id: `todo-${cv.invitation.id}-data`,
          invitationId: cv.invitation.id,
          title: '抓取数据',
          kolName: cv.invitation.kolName || '',
          campaignName: cv.invitation.campaignName || '',
          priority: 'medium',
          dueDate: cv.invitation.publishDate || '',
          stage: cv.stage,
        });
      }
      if (cv.stage === 'final_pending') {
        todoList.push({
          id: `todo-${cv.invitation.id}-final`,
          invitationId: cv.invitation.id,
          title: '支付尾款',
          kolName: cv.invitation.kolName || '',
          campaignName: cv.invitation.campaignName || '',
          priority: 'medium',
          dueDate: cv.invitation.publishDate || '',
          stage: cv.stage,
        });
      }
    });

    return todoList
      .sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .slice(0, 5);
  }, [collaborations]);

  const filteredCollaborations = useMemo(() => {
    return collaborations.filter((cv) => {
      const matchesStage = stageFilter === 'all' || cv.stage === stageFilter;
      const matchesSearch =
        !searchQuery ||
        cv.invitation.kolName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cv.invitation.campaignName?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesException =
        exceptionFilter === 'all' ||
        (exceptionFilter === 'active' && cv.exception?.status === 'active') ||
        (exceptionFilter === 'resolved' && cv.exception?.status === 'resolved');
      return matchesStage && matchesSearch && matchesException;
    });
  }, [collaborations, stageFilter, searchQuery, exceptionFilter]);

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

  const handleSignContract = useCallback(
    async (invId: string) => {
      try {
        const contract = contracts.find((c) => c.invitationId === invId);
        if (!contract) throw new Error('未找到合同记录');
        await signContract(contract.id);
        alert('合同已签署！');
      } catch (e: any) {
        alert('签署失败：' + e.message);
      }
    },
    [contracts, signContract]
  );

  const handleMarkPaid = useCallback(
    async (payment: Payment) => {
      try {
        if (payment.type === 'final') {
          const kpiResult = checkKpiMet(payment.invitationId);
          if (!kpiResult.fetched) {
            if (
              !confirm(
                '注意：该笔尾款对应的效果数据尚未抓取，数据未达标的情况下将无法支付尾款。建议先抓取数据再操作，确认继续吗？'
              )
            ) {
              return;
            }
          } else if (!kpiResult.ok) {
            alert(kpiResult.reason);
            return;
          }
        }
        await markPaymentPaid(payment.id);
        alert(payment.type === 'deposit' ? '定金已标记为已支付！' : '尾款已标记为已支付！');
      } catch (e: any) {
        alert('操作失败：' + e.message);
      }
    },
    [markPaymentPaid, checkKpiMet]
  );

  const handleIssueInvoice = useCallback(
    async (paymentId: string) => {
      try {
        const existing = invoices.find((i) => i.paymentId === paymentId);
        if (existing) {
          await markInvoiceIssued(existing.id);
        } else {
          await createInvoiceForPayment(paymentId);
        }
        alert('发票已开具！');
      } catch (e: any) {
        alert('开票失败：' + e.message);
      }
    },
    [invoices, createInvoiceForPayment, markInvoiceIssued]
  );

  const handleOpenExceptionModal = useCallback(
    (invitationId: string, mode: 'create' | 'resolve') => {
      setExceptionModal({ open: true, invitationId, mode });
      if (mode === 'create') {
        setExceptionForm({ type: 'communication_break', remark: '' });
      }
    },
    []
  );

  const handleCloseExceptionModal = useCallback(() => {
    setExceptionModal({ open: false, invitationId: null, mode: 'create' });
    setExceptionForm({ type: 'communication_break', remark: '' });
  }, []);

  const handleSubmitException = useCallback(() => {
    if (!exceptionModal.invitationId) return;
    if (exceptionModal.mode === 'create') {
      setException(exceptionModal.invitationId, exceptionForm.type, exceptionForm.remark);
      alert('异常已标记！');
    } else {
      resolveException(exceptionModal.invitationId);
      alert('异常已解决！');
    }
    handleCloseExceptionModal();
  }, [exceptionModal, exceptionForm, setException, resolveException, handleCloseExceptionModal]);

  const handleTodoClick = useCallback(
    (todo: TodoItem) => {
      const row = document.getElementById(`collab-row-${todo.invitationId}`);
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        row.classList.add('ring-2', 'ring-primary-500');
        setTimeout(() => {
          row.classList.remove('ring-2', 'ring-primary-500');
        }, 2000);
      }
    },
    []
  );

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
      <span
        className={cn(
          'px-2 py-0.5 rounded text-xs font-medium',
          map[platform] || 'bg-gray-500 text-white'
        )}
      >
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

      {todos.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-5 h-5 text-amber-500" />
            <h3 className="font-display font-semibold text-lg text-gray-800">待办提醒</h3>
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              {todos.length} 项待处理
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {todos.map((todo) => {
              const priorityColor = {
                high: 'bg-danger-500',
                medium: 'bg-amber-500',
                low: 'bg-gray-400',
              }[todo.priority];
              const dueText = todo.dueDate
                ? computeDueStatus(todo.dueDate, todo.stage as CollaborationStage)?.text || '正常'
                : '无截止日期';
              const dueClass =
                dueText.includes('逾期')
                  ? 'text-danger-600'
                  : dueText.includes('到期')
                  ? 'text-amber-600'
                  : 'text-gray-500';
              return (
                <motion.div
                  key={todo.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleTodoClick(todo)}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${priorityColor}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-800 text-sm truncate">{todo.title}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {todo.kolName} · {todo.campaignName}
                    </p>
                    <p className={`text-xs mt-1 ${dueClass}`}>{dueText}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                </motion.div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <svg
            className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="搜索KOL或活动名称..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-12"
          />
        </div>
        <div className="flex flex-wrap items-center gap-4">
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
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">异常：</span>
            {exceptionFilterOptions.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setExceptionFilter(filter.value)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all',
                  exceptionFilter === filter.value
                    ? 'bg-danger-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-semibold text-lg text-gray-800">合作单列表</h3>
        </div>

        <div className="overflow-x-auto" ref={tableRef}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-500">
                  KOL / 活动
                </th>
                <th className="text-right py-4 px-4 text-sm font-medium text-gray-500">
                  总费用
                </th>
                <th className="text-center py-4 px-4 text-sm font-medium text-gray-500">
                  付款进度
                </th>
                <th className="text-center py-4 px-4 text-sm font-medium text-gray-500">
                  KPI状态
                </th>
                <th className="text-center py-4 px-4 text-sm font-medium text-gray-500">
                  到期/逾期
                </th>
                <th className="text-center py-4 px-4 text-sm font-medium text-gray-500">
                  异常状态
                </th>
                <th className="text-center py-4 px-4 text-sm font-medium text-gray-500">
                  合同状态
                </th>
                <th className="text-center py-4 px-4 text-sm font-medium text-gray-500">
                  发票
                </th>
                <th className="text-center py-4 px-4 text-sm font-medium text-gray-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCollaborations.map((cv, index) => {
                const depositPaid = cv.depositPayment?.status === 'paid';
                const finalPaid = cv.finalPayment?.status === 'paid';
                const finalCanPay = cv.kpiStatus === 'met' && !finalPaid;

                const kpiResult = checkKpiMet(cv.invitation.id);
                let finalTooltip = '';
                if (cv.kpiStatus === 'pending') {
                  finalTooltip = '请先抓取数据';
                } else if (cv.kpiStatus === 'not_met') {
                  finalTooltip = kpiResult.reason || 'KPI未达标，无法支付尾款';
                } else if (finalPaid) {
                  finalTooltip = '尾款已支付';
                }

                const unpaidIssuable = cv.payments.filter(
                  (p) =>
                    p.status === 'paid' &&
                    !cv.invoices.some((i) => i.paymentId === p.id && i.status === 'issued')
                );

                const isOverdue = cv.dueStatus?.type === 'overdue';
                const hasActiveException = cv.exception?.status === 'active';
                const rowBgClass = isOverdue
                  ? 'bg-danger-50'
                  : hasActiveException
                  ? 'bg-amber-50'
                  : '';

                return (
                  <motion.tr
                    key={cv.invitation.id}
                    id={`collab-row-${cv.invitation.id}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className={cn(
                      'border-b border-gray-50 hover:bg-gray-50 transition-colors',
                      rowBgClass
                    )}
                  >
                    <td className="py-4 px-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          {hasActiveException && (
                            <Flag className="w-4 h-4 text-danger-500 flex-shrink-0" />
                          )}
                          <div className="w-9 h-9 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-primary-700 font-semibold text-sm">
                              {cv.invitation.kolName?.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800">
                                {cv.invitation.kolName}
                              </span>
                              {getPlatformBadge(cv.platform)}
                            </div>
                            <span className="text-xs text-gray-500">
                              {cv.invitation.campaignName}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-11">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium w-fit',
                              getStageBadgeClass(cv.stage)
                            )}
                          >
                            {getStageLabel(cv.stage)}
                          </span>
                          {hasActiveException && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-danger-100 text-danger-700">
                              {exceptionTypeLabels[cv.exception!.type]}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <p className="font-display font-bold text-lg text-gray-800">
                        {formatMoney(cv.totalFee)}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-xs font-medium',
                            depositPaid
                              ? 'bg-success-100 text-success-700'
                              : 'bg-amber-100 text-amber-700'
                          )}
                        >
                          定金 {depositPaid ? '已付' : '待付'}
                        </span>
                        <ChevronRight className="w-3 h-3 text-gray-400" />
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-xs font-medium',
                            finalPaid
                              ? 'bg-success-100 text-success-700'
                              : cv.kpiStatus === 'met'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-gray-500'
                          )}
                        >
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
                      {cv.dueStatus ? (
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 text-sm font-medium',
                            cv.dueStatus.type === 'overdue'
                              ? 'text-danger-600'
                              : cv.dueStatus.type === 'upcoming'
                              ? 'text-amber-600'
                              : 'text-gray-600'
                          )}
                        >
                          {cv.dueStatus.type === 'overdue' ? '🔴' : '🟠'}
                          {cv.dueStatus.text}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {cv.exception ? (
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 text-sm font-medium',
                            cv.exception.status === 'active'
                              ? 'text-danger-600'
                              : 'text-gray-500'
                          )}
                        >
                          {cv.exception.status === 'active' ? (
                            <>
                              <AlertOctagon className="w-4 h-4" />
                              异常中
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              已解决
                            </>
                          )}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
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
                        {unpaidIssuable.slice(0, 1).map((p) => (
                          <button
                            key={p.id}
                            onClick={() => handleIssueInvoice(p.id)}
                            className="btn-secondary text-xs py-1.5 px-2.5"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            开票
                          </button>
                        ))}
                        {hasActiveException ? (
                          <button
                            onClick={() => handleOpenExceptionModal(cv.invitation.id, 'resolve')}
                            className="btn-primary text-xs py-1.5 px-2.5 bg-success-600 hover:bg-success-700"
                          >
                            <Check className="w-3.5 h-3.5" />
                            解决异常
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenExceptionModal(cv.invitation.id, 'create')}
                            className="btn-secondary text-xs py-1.5 px-2.5 text-amber-600 border-amber-200 hover:bg-amber-50"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            标记异常
                          </button>
                        )}
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
        {exceptionModal.open && (
          <ExceptionModal
            mode={exceptionModal.mode}
            form={exceptionForm}
            onFormChange={setExceptionForm}
            onClose={handleCloseExceptionModal}
            onSubmit={handleSubmitException}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedCollab && (
          <CollaborationDetailModal
            cv={selectedCollab}
            onClose={() => setSelectedCollab(null)}
            onSignContract={handleSignContract}
            onMarkPaid={handleMarkPaid}
            onIssueInvoice={handleIssueInvoice}
            onGoReports={() => navigate('/reports')}
            checkKpiMet={checkKpiMet}
            onMarkException={handleOpenExceptionModal}
            onResolveException={resolveException}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface ExceptionModalProps {
  mode: 'create' | 'resolve';
  form: { type: ExceptionType; remark: string };
  onFormChange: (form: { type: ExceptionType; remark: string }) => void;
  onClose: () => void;
  onSubmit: () => void;
}

interface ModalProps {
  cv: CollaborationView;
  onClose: () => void;
  onSignContract: (invId: string) => void;
  onMarkPaid: (payment: Payment) => void;
  onIssueInvoice: (paymentId: string) => void;
  onGoReports: () => void;
  checkKpiMet: (invitationId: string) => {
    ok: boolean;
    reason: string;
    impressionsRate: number;
    engagementsRate: number;
    clicksRate: number;
    fetched: boolean;
  };
  onMarkException: (invitationId: string, mode: 'create' | 'resolve') => void;
  onResolveException: (invitationId: string) => void;
}

function ExceptionModal({ mode, form, onFormChange, onClose, onSubmit }: ExceptionModalProps) {
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
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl"
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-display font-bold text-xl text-gray-800">
            {mode === 'create' ? '标记异常' : '解决异常'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {mode === 'create' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  异常类型
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(exceptionTypeLabels).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => onFormChange({ ...form, type: value as ExceptionType })}
                      className={cn(
                        'px-4 py-2 rounded-lg text-sm font-medium transition-all border',
                        form.type === value
                          ? 'bg-danger-50 text-danger-700 border-danger-200'
                          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  备注说明
                </label>
                <textarea
                  value={form.remark}
                  onChange={(e) => onFormChange({ ...form, remark: e.target.value })}
                  placeholder="请输入异常说明..."
                  rows={3}
                  className="input w-full resize-none"
                />
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-success-600" />
              </div>
              <p className="text-gray-800 font-medium">确认标记异常为已解决？</p>
              <p className="text-gray-500 text-sm mt-1">解决后异常状态将更新为已解决</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-6 pt-0">
          <button onClick={onClose} className="btn-secondary">
            取消
          </button>
          <button
            onClick={onSubmit}
            className={cn(
              'btn-primary',
              mode === 'create' ? 'bg-danger-600 hover:bg-danger-700' : 'bg-success-600 hover:bg-success-700'
            )}
          >
            {mode === 'create' ? '确认标记' : '确认解决'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function CollaborationDetailModal({
  cv,
  onClose,
  onSignContract,
  onMarkPaid,
  onIssueInvoice,
  onGoReports,
  checkKpiMet,
  onMarkException,
  onResolveException,
}: ModalProps) {
  const depositPaid = cv.depositPayment?.status === 'paid';
  const finalPaid = cv.finalPayment?.status === 'paid';
  const finalCanPay = cv.kpiStatus === 'met' && !finalPaid;

  const isInvoiceIssued = (paymentId: string) =>
    cv.invoices.some((i) => i.paymentId === paymentId && i.status === 'issued');

  const getInvoiceForPayment = (paymentId: string) =>
    cv.invoices.find((i) => i.paymentId === paymentId);

  const stepState = (idx: number) => {
    const steps = [
      cv.contractSigned,
      depositPaid,
      cv.kpiStatus === 'met',
      finalPaid,
      cv.payments.every((p) => isInvoiceIssued(p.id)),
    ];
    const completedCount = steps.filter(Boolean).length;
    if (idx < completedCount) return 'done';
    if (idx === completedCount) return 'active';
    return 'pending';
  };

  const unpaidIssuable = cv.payments.filter(
    (p) => p.status === 'paid' && !isInvoiceIssued(p.id)
  );

  const hasActiveException = cv.exception?.status === 'active';
  const hasResolvedException = cv.exception?.status === 'resolved';

  const [expandedPayment, setExpandedPayment] = useState<string | null>(null);

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
              <p className="font-semibold text-gray-800 truncate">
                {cv.invitation.campaignName}
              </p>
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
                  time: cv.contract?.signedAt
                    ? new Date(cv.contract.signedAt).toLocaleDateString('zh-CN')
                    : cv.contractSigned
                    ? '已完成'
                    : undefined,
                  action: !cv.contractSigned ? (
                    <button
                      onClick={() => onSignContract(cv.invitation.id)}
                      className="btn-primary text-xs py-1.5 px-3"
                    >
                      <FileCheck className="w-3.5 h-3.5" />
                      签署合同
                    </button>
                  ) : null,
                  dueStatus: !cv.contractSigned ? cv.dueStatus : undefined,
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
                  dueStatus: cv.stage === 'deposit_pending' ? cv.dueStatus : undefined,
                },
                {
                  key: 'kpi',
                  title: '内容发布与数据抓取',
                  desc: cv.performance
                    ? `曝光 ${formatNumber(cv.performance.impressions)} · 互动 ${formatNumber(
                        cv.performance.engagements
                      )} · 点击 ${formatNumber(cv.performance.clicks)}`
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
                  dueStatus: cv.stage === 'kpi_pending' ? cv.dueStatus : undefined,
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
                  dueStatus: cv.stage === 'final_pending' ? cv.dueStatus : undefined,
                },
                {
                  key: 'invoice',
                  title: '发票开具',
                  desc: `${cv.invoicesIssued}/${cv.payments.length} 张已开具`,
                  time: undefined,
                  action: unpaidIssuable.slice(0, 1).map((p) => (
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
                const stepDueStatus = (step as any).dueStatus;
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
                          <div className="flex items-center gap-2 flex-wrap">
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
                            {stepDueStatus && (
                              <span
                                className={cn(
                                  'text-xs px-2 py-0.5 rounded font-medium',
                                  stepDueStatus.type === 'overdue'
                                    ? 'bg-danger-100 text-danger-700'
                                    : 'bg-amber-100 text-amber-700'
                                )}
                              >
                                {stepDueStatus.type === 'overdue' ? '🔴' : '🟠'} {stepDueStatus.text}
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
              {cv.payments.map((p) => {
                const invoice = getInvoiceForPayment(p.id);
                const isExpanded = expandedPayment === p.id;
                return (
                  <div key={p.id} className="bg-gray-50 rounded-lg overflow-hidden">
                    <div
                      onClick={() => setExpandedPayment(isExpanded ? null : p.id)}
                      className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-100 transition-colors"
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
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-gray-800">
                              {p.type === 'deposit' ? '定金' : '尾款'}
                            </span>
                            <Badge status={p.status} />
                            {isInvoiceIssued(p.id) ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                                <Receipt className="w-3 h-3" />
                                已开票
                              </span>
                            ) : p.status === 'paid' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
                                <Receipt className="w-3 h-3" />
                                待开票
                              </span>
                            ) : null}
                          </div>
                          <p className="text-xs text-gray-500">
                            到期：{p.dueDate}
                            {p.paidAt &&
                              ` · 支付于 ${new Date(p.paidAt).toLocaleDateString('zh-CN')}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-display font-bold text-gray-800">
                          {formatMoney(p.amount)}
                        </span>
                        <ChevronRight
                          className={cn(
                            'w-4 h-4 text-gray-400 transition-transform',
                            isExpanded ? 'rotate-90' : ''
                          )}
                        />
                      </div>
                    </div>
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-3 pt-0 border-t border-gray-200 mt-3">
                            <div className="pt-3">
                              <p className="text-sm font-medium text-gray-700 mb-2">发票信息</p>
                              {invoice ? (
                                <div className="bg-white rounded-lg p-3 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">发票状态</span>
                                    <span
                                      className={cn(
                                        'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium',
                                        invoice.status === 'issued'
                                          ? 'bg-green-100 text-green-700'
                                          : 'bg-gray-100 text-gray-700'
                                      )}
                                    >
                                      {invoice.status === 'issued' ? '已开具' : '待开具'}
                                    </span>
                                  </div>
                                  {invoice.issuedAt && (
                                    <div className="flex items-center justify-between">
                                      <span className="text-sm text-gray-600">开票时间</span>
                                      <span className="text-sm text-gray-800">
                                        {new Date(invoice.issuedAt).toLocaleDateString('zh-CN')}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">发票金额</span>
                                    <span className="text-sm font-medium text-gray-800">
                                      {formatMoney(invoice.amount)}
                                    </span>
                                  </div>
                                </div>
                              ) : p.status === 'paid' ? (
                                <div className="bg-amber-50 rounded-lg p-3 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Receipt className="w-4 h-4 text-amber-500" />
                                    <span className="text-sm text-amber-700">待开票</span>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onIssueInvoice(p.id);
                                    }}
                                    className="btn-primary text-xs py-1.5 px-3"
                                  >
                                    <Receipt className="w-3.5 h-3.5" />
                                    立即开票
                                  </button>
                                </div>
                              ) : (
                                <div className="bg-gray-100 rounded-lg p-3">
                                  <p className="text-sm text-gray-500 text-center">
                                    付款完成后可开具发票
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-800 mb-3">异常处理</h3>
            {hasActiveException && cv.exception ? (
              <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-danger-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertOctagon className="w-5 h-5 text-danger-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-danger-100 text-danger-700">
                        {exceptionTypeLabels[cv.exception.type]}
                      </span>
                      <span className="text-xs text-gray-500">
                        创建于 {new Date(cv.exception.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{cv.exception.remark}</p>
                    <button
                      onClick={() => onMarkException(cv.invitation.id, 'resolve')}
                      className="btn-primary text-xs py-1.5 px-3 bg-success-600 hover:bg-success-700"
                    >
                      <Check className="w-3.5 h-3.5" />
                      解决异常
                    </button>
                  </div>
                </div>
              </div>
            ) : hasResolvedException && cv.exception ? (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-800">异常已解决</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700">
                        {exceptionTypeLabels[cv.exception.type]}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {cv.exception.resolvedAt
                        ? `解决于 ${new Date(cv.exception.resolvedAt).toLocaleDateString('zh-CN')}`
                        : ''}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-gray-400" />
                    </div>
                    <span className="text-gray-500">暂无异常</span>
                  </div>
                  <button
                    onClick={() => onMarkException(cv.invitation.id, 'create')}
                    className="btn-secondary text-xs py-1.5 px-3 text-amber-600 border-amber-200 hover:bg-amber-50"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    标记异常
                  </button>
                </div>
              </div>
            )}
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
