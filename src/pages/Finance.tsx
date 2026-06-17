import { useState, useMemo, useCallback } from 'react';
import { useShallow } from 'zustand/shallow';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { formatMoney, formatNumber } from '@/utils';
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
} from 'lucide-react';
import type { PaymentStatus, Payment } from '@/types';

const statusFilters: { value: PaymentStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待支付' },
  { value: 'paid', label: '已支付' },
  { value: 'overdue', label: '已逾期' },
];

export default function Finance() {
  const { payments, markPaymentPaid, getPerformanceByInvitationId } = useAppStore(useShallow((state) => ({
    payments: state.payments,
    markPaymentPaid: state.markPaymentPaid,
    getPerformanceByInvitationId: state.getPerformanceByInvitationId,
  })));
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      return statusFilter === 'all' || p.status === statusFilter;
    });
  }, [payments, statusFilter]);

  const stats = useMemo(() => ({
    total: payments.reduce((sum, p) => sum + p.amount, 0),
    paid: payments.filter((p) => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0),
    pending: payments.filter((p) => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0),
    overdue: payments.filter((p) => p.status === 'overdue').reduce((sum, p) => sum + p.amount, 0),
  }), [payments]);

  const milestoneStats = useMemo(() => ({
    deposit: payments.filter((p) => p.type === 'deposit'),
    final: payments.filter((p) => p.type === 'final'),
  }), [payments]);

  const paymentCounts = useMemo(() => ({
    paidDeposit: milestoneStats.deposit.filter((p) => p.status === 'paid').length,
    paidFinal: milestoneStats.final.filter((p) => p.status === 'paid').length,
    pending: payments.filter((p) => p.status === 'pending').length,
    overdue: payments.filter((p) => p.status === 'overdue').length,
  }), [milestoneStats, payments]);

  const handleMarkPaid = useCallback(async (id: string, payment: Payment) => {
    try {
      if (payment.type === 'final') {
        const perf = getPerformanceByInvitationId(payment.invitationId);
        if (perf && (!perf.lastFetchedAt || perf.fetchStatus !== 'success')) {
          if (!confirm('注意：该笔尾款对应的效果数据尚未抓取，数据未达标的情况下将无法支付尾款。建议先抓取数据再操作，确认继续吗？')) {
            return;
          }
        }
      }
      await markPaymentPaid(id);
      alert(payment.type === 'deposit' ? '定金已标记为已支付！' : '尾款已标记为已支付！');
    } catch (e: any) {
      alert('操作失败：' + e.message);
    }
  }, [markPaymentPaid, getPerformanceByInvitationId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-800">
            费用结算
          </h1>
          <p className="text-gray-500 mt-1">
            管理合作费用，追踪里程碑付款状态
          </p>
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
          <p className="font-display font-bold text-2xl text-gray-800">
            {formatMoney(stats.total)}
          </p>
          <p className="text-xs text-gray-400 mt-2">共 {payments.length} 笔</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-1">已支付</p>
          <p className="font-display font-bold text-2xl text-success-600">
            {formatMoney(stats.paid)}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {paymentCounts.paidDeposit} 笔定金 /{' '}
            {paymentCounts.paidFinal} 笔尾款
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-1">待支付</p>
          <p className="font-display font-bold text-2xl text-amber-600">
            {formatMoney(stats.pending)}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {paymentCounts.pending} 笔待处理
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-danger-100 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-danger-600" />
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-1">已逾期</p>
          <p className="font-display font-bold text-2xl text-danger-600">
            {formatMoney(stats.overdue)}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {paymentCounts.overdue} 笔需关注
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-semibold text-lg text-gray-800">
              付款记录
            </h3>
            <div className="flex gap-2">
              {statusFilters.map((filter) => (
                <button
                  key={filter.value}
                  onClick={() => setStatusFilter(filter.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    statusFilter === filter.value
                      ? 'bg-primary-700 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {filteredPayments.map((payment, index) => {
              const perf = payment.type === 'final' ? getPerformanceByInvitationId(payment.invitationId) : undefined;
              let kpiStatus: 'met' | 'not_met' | 'pending' | null = null;
              let kpiDisabled = false;
              let kpiTooltip = '';

              if (payment.type === 'final' && perf) {
                if (perf.lastFetchedAt) {
                  const kpiMet = (perf.impressions >= (perf.targetImpressions || 0)) && (perf.engagements >= (perf.targetEngagements || 0));
                  kpiStatus = kpiMet ? 'met' : 'not_met';
                  if (!kpiMet && payment.status === 'pending') {
                    kpiDisabled = true;
                    kpiTooltip = 'KPI未达标，无法支付尾款';
                  }
                } else {
                  kpiStatus = 'pending';
                }
              }

              return (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        payment.type === 'deposit'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-purple-100 text-purple-600'
                      }`}
                    >
                      <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-gray-800">
                          {payment.kolName}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            payment.type === 'deposit'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}
                        >
                          {payment.type === 'deposit' ? '定金' : '尾款'}
                        </span>
                        {payment.type === 'final' && kpiStatus && (
                          kpiStatus === 'met' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-success-100 text-success-700">
                              <Target className="w-3 h-3" />
                              KPI达标
                            </span>
                          ) : kpiStatus === 'not_met' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-danger-100 text-danger-700">
                              <AlertCircle className="w-3 h-3" />
                              KPI未达标
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
                              <Clock className="w-3 h-3" />
                              待抓取数据
                            </span>
                          )
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{payment.campaignName}</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="text-right">
                      <p className="font-display font-bold text-xl text-gray-800">
                        {formatMoney(payment.amount)}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {payment.type === 'deposit' ? '签约' : '发布'}后{' '}
                          {payment.dueDate}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge status={payment.status} />
                      {payment.status === 'pending' && (
                        <button
                          onClick={() => handleMarkPaid(payment.id, payment)}
                          disabled={kpiDisabled}
                          title={kpiTooltip || undefined}
                          className="btn-primary text-sm py-1.5 px-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          标记已付
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6 bg-gradient-to-br from-primary-50 to-accent-50">
            <h3 className="font-semibold text-primary-800 mb-4">
              里程碑付款说明
            </h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-800 text-sm">定金支付</p>
                  <p className="text-xs text-gray-600">
                    合作确认后支付30%，锁定KOL档期
                  </p>
                </div>
              </div>
              <div className="w-0.5 h-6 bg-blue-300 ml-4" />
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-800 text-sm flex items-center gap-2">
                    尾款支付
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-danger-100 text-danger-700">
                      <AlertCircle className="w-3 h-3" />
                      需KPI达标
                    </span>
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    内容发布且数据达标后支付70%
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4">本月预算概览</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">总预算</span>
                  <span className="font-medium text-gray-800">¥1,500,000</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill bg-gradient-to-r from-primary-400 to-primary-600"
                    style={{ width: '65%' }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="text-center">
                  <p className="text-xs text-gray-500">已使用</p>
                  <p className="font-mono font-bold text-lg text-primary-600">
                    ¥975,000
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">剩余</p>
                  <p className="font-mono font-bold text-lg text-success-600">
                    ¥525,000
                  </p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="font-semibold text-gray-800 mb-4">快捷操作</h3>
            <div className="space-y-3">
              <button className="w-full btn-secondary justify-start">
                <FileText className="w-4 h-4" />
                查看合同模板
              </button>
              <button className="w-full btn-secondary justify-start">
                <Download className="w-4 h-4" />
                下载付款凭证
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
