import { useState, useMemo, useCallback } from 'react';
import { useShallow } from 'zustand/shallow';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { formatNumber, formatMoney, formatPercent, cn } from '@/utils';
import Card from '@/components/ui/Card';
import PlatformBadge from '@/components/ui/PlatformBadge';
import {
  Database,
  Search,
  Star,
  TrendingUp,
  Users,
  Eye,
  Heart,
  Filter,
  ChevronRight,
  Award,
  Calendar,
  Copy,
  CheckCircle2,
  X,
  AlertCircle,
  ThumbsUp,
  Trophy,
  RefreshCw,
  DollarSign,
  FileText,
} from 'lucide-react';
import type { Invitation, Campaign } from '@/types';

const generateId = () => Math.random().toString(36).substr(2, 9);

interface DuplicateModalState {
  open: boolean;
  historyId: string | null;
  kolName: string;
  campaignName: string;
  budget: string;
  kpiConfig: string;
  paymentSchedule: string;
  contentRequirements: string;
}

const duplicateCollaboration = (historyId: string) => {
  return {
    success: true,
    templateId: `template-${generateId()}`,
  };
};

export default function Archive() {
  const navigate = useNavigate();
  const history = useAppStore(useShallow((state) => state.history));
  const kols = useAppStore(useShallow((state) => state.kols));
  const campaigns = useAppStore(useShallow((state) => state.campaigns));
  const invitations = useAppStore(useShallow((state) => state.invitations));
  const [sortBy, setSortBy] = useState<'roi' | 'rating' | 'impressions'>('roi');
  const [searchQuery, setSearchQuery] = useState('');
  const [duplicateModal, setDuplicateModal] = useState<DuplicateModalState>({
    open: false,
    historyId: null,
    kolName: '',
    campaignName: '',
    budget: '',
    kpiConfig: '',
    paymentSchedule: '定金30%、尾款70%',
    contentRequirements: '',
  });

  const kolHistoryMap = useMemo(() => {
    const map = new Map<string, typeof history>();
    history.forEach((h) => {
      if (!map.has(h.kolId)) {
        map.set(h.kolId, []);
      }
      map.get(h.kolId)!.push(h);
    });
    return map;
  }, [history]);

  const kolSummaries = useMemo(() => {
    const summaries = kols
      .filter((k) => kolHistoryMap.has(k.id))
      .map((kol) => {
        const kolHistory = kolHistoryMap.get(kol.id)!;
        const avgRoi =
          kolHistory.reduce((sum, h) => sum + h.finalRoi, 0) / kolHistory.length;
        const avgRating =
          kolHistory.reduce((sum, h) => sum + h.rating, 0) / kolHistory.length;
        const totalImpressions = kolHistory.reduce(
          (sum, h) => sum + h.finalImpressions,
          0
        );

        const suitableForReinvestment = avgRoi >= 3 && avgRating >= 4.5;
        const lastCooperation = kolHistory[0]?.completedAt;

        return {
          kol,
          historyCount: kolHistory.length,
          avgRoi,
          avgRating,
          totalImpressions,
          lastCooperation,
          suitableForReinvestment,
          roiRank: 0,
        };
      })
      .sort((a, b) => b.avgRoi - a.avgRoi)
      .map((item, index) => ({
        ...item,
        roiRank: index + 1,
      }));

    return summaries.sort((a, b) => {
      if (sortBy === 'roi') return b.avgRoi - a.avgRoi;
      if (sortBy === 'rating') return b.avgRating - a.avgRating;
      return b.totalImpressions - a.totalImpressions;
    });
  }, [kols, kolHistoryMap, sortBy]);

  const handleOpenDuplicateModal = useCallback(
    (historyItem: typeof history[0]) => {
      const invitation = invitations.find(
        (i) => i.campaignId === historyItem.campaignId && i.kolId === historyItem.kolId
      );
      const campaign = campaigns.find((c) => c.id === historyItem.campaignId);

      setDuplicateModal({
        open: true,
        historyId: historyItem.id,
        kolName: historyItem.kolName || '',
        campaignName: historyItem.campaignName || '',
        budget: campaign ? formatMoney(campaign.budget) : '-',
        kpiConfig: campaign
          ? `曝光${formatNumber(campaign.kpi.targetImpressions)}、互动${formatNumber(
              campaign.kpi.targetEngagements
            )}、点击${formatNumber(campaign.kpi.targetClicks)}`
          : '-',
        paymentSchedule: '定金30%、尾款70%',
        contentRequirements: invitation?.contentRequirements || '无特殊要求',
      });
    },
    [invitations, campaigns]
  );

  const handleCloseDuplicateModal = useCallback(() => {
    setDuplicateModal({
      open: false,
      historyId: null,
      kolName: '',
      campaignName: '',
      budget: '',
      kpiConfig: '',
      paymentSchedule: '定金30%、尾款70%',
      contentRequirements: '',
    });
  }, []);

  const handleConfirmDuplicate = useCallback(() => {
    if (!duplicateModal.historyId) return;
    const result = duplicateCollaboration(duplicateModal.historyId);
    if (result.success) {
      alert('模板已生成，可在KOL搜索中发起新的合作');
      handleCloseDuplicateModal();
      navigate('/kol');
    }
  }, [duplicateModal.historyId, handleCloseDuplicateModal, navigate]);

  const filteredSummaries = useMemo(() => {
    return kolSummaries.filter((s) => {
      if (!searchQuery) return true;
      return s.kol.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [kolSummaries, searchQuery]);

  const topKOLs = useMemo(() => {
    return [...filteredSummaries].sort((a, b) => b.avgRoi - a.avgRoi).slice(0, 3);
  }, [filteredSummaries]);

  const totalImpressions = useMemo(() => {
    return filteredSummaries.reduce((sum, s) => sum + s.totalImpressions, 0);
  }, [filteredSummaries]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-800">
            数据沉淀
          </h1>
          <p className="text-gray-500 mt-1">
            历史合作KOL表现数据沉淀，为下次选号提供参考
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {topKOLs.map((item, index) => (
          <motion.div
            key={item.kol.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card
              className={`p-6 cursor-pointer ${
                index === 0
                  ? 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200'
                  : index === 1
                  ? 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'
                  : 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200'
              }`}
              onClick={() => navigate(`/kol/${item.kol.id}`)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={item.kol.avatar}
                      alt={item.kol.name}
                      className="w-14 h-14 rounded-full object-cover ring-4 ring-white shadow-lg"
                    />
                    <div
                      className={`absolute -top-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0
                          ? 'bg-amber-500 text-white'
                          : index === 1
                          ? 'bg-gray-400 text-white'
                          : 'bg-orange-400 text-white'
                      }`}
                    >
                      {index + 1}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{item.kol.name}</h3>
                    <PlatformBadge platform={item.kol.platform} />
                  </div>
                </div>
                <Award
                  className={`w-8 h-8 ${
                    index === 0
                      ? 'text-amber-500'
                      : index === 1
                      ? 'text-gray-400'
                      : 'text-orange-400'
                  }`}
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="font-mono font-bold text-lg text-gray-800">
                    {item.avgRoi.toFixed(1)}x
                  </p>
                  <p className="text-xs text-gray-500">平均ROI</p>
                </div>
                <div className="text-center">
                  <p className="font-mono font-bold text-lg text-gray-800">
                    {item.avgRating.toFixed(1)}
                  </p>
                  <p className="text-xs text-gray-500">平均评分</p>
                </div>
                <div className="text-center">
                  <p className="font-mono font-bold text-lg text-gray-800">
                    {item.historyCount}
                  </p>
                  <p className="text-xs text-gray-500">合作次数</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h3 className="font-display font-semibold text-lg text-gray-800">
            历史合作KOL库
          </h3>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="搜索KOL名称..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-9 py-2 text-sm w-48"
              />
            </div>
            <div className="flex bg-white rounded-lg border border-gray-200 p-1">
              {[
                { value: 'roi', label: '按ROI' },
                { value: 'rating', label: '按评分' },
                { value: 'impressions', label: '按曝光' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() =>
                    setSortBy(opt.value as 'roi' | 'rating' | 'impressions')
                  }
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                    sortBy === opt.value
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-500">
                  KOL信息
                </th>
                <th className="text-center py-4 px-4 text-sm font-medium text-gray-500">
                  ROI排名
                </th>
                <th className="text-center py-4 px-4 text-sm font-medium text-gray-500">
                  合作次数
                </th>
                <th className="text-center py-4 px-4 text-sm font-medium text-gray-500">
                  平均ROI
                </th>
                <th className="text-center py-4 px-4 text-sm font-medium text-gray-500">
                  平均评分
                </th>
                <th className="text-center py-4 px-4 text-sm font-medium text-gray-500">
                  总曝光
                </th>
                <th className="text-center py-4 px-4 text-sm font-medium text-gray-500">
                  最近合作
                </th>
                <th className="text-center py-4 px-4 text-sm font-medium text-gray-500">
                  标签
                </th>
                <th className="text-center py-4 px-4 text-sm font-medium text-gray-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSummaries.map((item, index) => {
                const historyItem = history.find((h) => h.kolId === item.kol.id);
                return (
                  <motion.tr
                    key={item.kol.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.kol.avatar}
                          alt={item.kol.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-medium text-gray-800">{item.kol.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <PlatformBadge platform={item.kol.platform} />
                            <span className="text-xs text-gray-500">
                              {item.kol.category.join('、')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={cn(
                          'inline-flex items-center justify-center',
                          item.roiRank === 1
                            ? 'w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full text-white font-bold text-sm'
                            : 'font-mono font-semibold text-gray-600'
                        )}
                      >
                        {item.roiRank === 1 ? (
                          <>
                            <Trophy className="w-4 h-4" />
                          </>
                        ) : (
                          item.roiRank
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-mono font-semibold text-gray-800">
                        {item.historyCount}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={cn(
                          'font-mono font-bold',
                          item.avgRoi >= 3
                            ? 'text-success-600'
                            : item.avgRoi >= 2
                            ? 'text-primary-600'
                            : 'text-accent-600'
                        )}
                      >
                        {item.avgRoi.toFixed(2)}x
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 text-amber-500 fill-current" />
                        <span className="font-mono font-semibold text-gray-800">
                          {item.avgRating.toFixed(1)}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center font-mono text-sm text-gray-800">
                      {formatNumber(item.totalImpressions)}
                    </td>
                    <td className="py-4 px-4 text-center text-sm text-gray-500">
                      {item.lastCooperation
                        ? new Date(item.lastCooperation).toLocaleDateString('zh-CN')
                        : '-'}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {item.suitableForReinvestment && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-success-100 text-success-700">
                            <ThumbsUp className="w-3 h-3" />
                            适合复投
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        <button
                          onClick={() => navigate(`/kol/${item.kol.id}`)}
                          className="btn-secondary text-xs py-1.5 px-2.5"
                        >
                          查看详情
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                        {historyItem && (
                          <button
                            onClick={() => handleOpenDuplicateModal(historyItem)}
                            className="btn-primary text-xs py-1.5 px-2.5 bg-primary-600 hover:bg-primary-700"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            复用为模板
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-display font-semibold text-lg text-gray-800 mb-4">
            智能推荐
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            基于您的历史合作数据，为您推荐以下高性价比KOL
          </p>
          <div className="space-y-3">
            {filteredSummaries
              .filter((s) => s.avgRoi >= 2.5)
              .slice(0, 4)
              .map((item) => (
                <div
                  key={item.kol.id}
                  className="flex items-center justify-between p-3 bg-primary-50 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={item.kol.avatar}
                      alt={item.kol.name}
                      className="w-10 h-10 rounded-full"
                    />
                    <div>
                      <p className="font-medium text-gray-800">{item.kol.name}</p>
                      <p className="text-xs text-gray-500">
                        ROI {item.avgRoi.toFixed(1)}x · {formatMoney(item.kol.price)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/kol/${item.kol.id}`)}
                    className="btn-primary text-sm py-1.5 px-3"
                  >
                    再次合作
                  </button>
                </div>
              ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-display font-semibold text-lg text-gray-800 mb-4">
            数据洞察
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-success-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-success-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-success-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">ROI 持续提升</p>
                  <p className="text-xs text-gray-500">
                    本季度平均ROI较上季度提升23%
                  </p>
                </div>
              </div>
              <span className="text-2xl font-bold text-success-600">+23%</span>
            </div>

            <div className="flex items-center justify-between p-4 bg-primary-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">优质KOL储备</p>
                  <p className="text-xs text-gray-500">
                    已有 {filteredSummaries.length} 位KOL完成合作
                  </p>
                </div>
              </div>
              <span className="text-2xl font-bold text-primary-600">
                {filteredSummaries.length}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 bg-accent-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent-100 rounded-full flex items-center justify-center">
                  <Eye className="w-5 h-5 text-accent-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-800">总曝光量</p>
                  <p className="text-xs text-gray-500">累计触达用户数</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-accent-600">
                {formatNumber(totalImpressions)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      <AnimatePresence>
        {duplicateModal.open && (
          <DuplicateModal
            modal={duplicateModal}
            onClose={handleCloseDuplicateModal}
            onConfirm={handleConfirmDuplicate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface DuplicateModalProps {
  modal: DuplicateModalState;
  onClose: () => void;
  onConfirm: () => void;
}

function DuplicateModal({ modal, onClose, onConfirm }: DuplicateModalProps) {
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
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl"
      >
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="font-display font-bold text-xl text-gray-800">
            复用为模板
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Copy className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="font-medium text-gray-800 mb-1">
                  即将复用与 <span className="text-primary-600">{modal.kolName}</span> 的合作记录
                </p>
                <p className="text-sm text-gray-500">
                  以下内容将作为模板复制，用于发起新的合作
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">活动信息</span>
              </div>
              <div className="text-right flex-1">
                <p className="text-sm font-medium text-gray-800">{modal.campaignName}</p>
                <p className="text-xs text-gray-500 mt-0.5">预算：{modal.budget}</p>
                <p className="text-xs text-gray-500">KPI：{modal.kpiConfig}</p>
              </div>
            </div>

            <div className="flex items-start justify-between gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">付款节奏</span>
              </div>
              <span className="text-sm font-medium text-gray-800">{modal.paymentSchedule}</span>
            </div>

            <div className="flex items-start justify-between gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">内容要求</span>
              </div>
              <p className="text-sm font-medium text-gray-800 text-right max-w-[60%]">
                {modal.contentRequirements}
              </p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                确认后将生成模板，并跳转至KOL搜索页面，您可以选择该KOL发起新的合作
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-6 pt-0">
          <button onClick={onClose} className="btn-secondary">
            取消
          </button>
          <button onClick={onConfirm} className="btn-primary">
            <RefreshCw className="w-4 h-4" />
            确认复用
          </button>
        </div>
      </motion.div>
    </div>
  );
}
