import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';
import { formatMoney, formatNumber } from '@/utils';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import {
  Plus,
  Search,
  Filter,
  Calendar,
  Users,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import type { CampaignStatus } from '@/types';
import { useShallow } from 'zustand/shallow';

const statusFilters: { value: CampaignStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'active', label: '进行中' },
  { value: 'draft', label: '草稿' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];

export default function Campaigns() {
  const navigate = useNavigate();
  const campaigns = useAppStore(useShallow((state) => state.campaigns));
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCampaigns = useMemo(
    () =>
      campaigns.filter((c) => {
        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
        const matchesSearch =
          !searchQuery ||
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
      }),
    [campaigns, statusFilter, searchQuery]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索活动..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-12"
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary">
            <Filter className="w-4 h-4" />
            筛选
          </button>
          <button onClick={() => navigate('/campaigns/create')} className="btn-accent">
            <Plus className="w-4 h-4" />
            创建活动
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              statusFilter === filter.value
                ? 'bg-primary-700 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCampaigns.map((campaign, index) => (
          <motion.div
            key={campaign.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card
              className="p-6 cursor-pointer h-full flex flex-col"
              onClick={() => navigate(`/campaigns/${campaign.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-display font-semibold text-lg text-gray-800 mb-1 line-clamp-1">
                    {campaign.name}
                  </h3>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {campaign.description}
                  </p>
                </div>
                <Badge status={campaign.status} />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs">周期</span>
                  </div>
                  <p className="font-mono text-sm font-medium text-gray-800">
                    {campaign.startDate.slice(5)} ~ {campaign.endDate.slice(5)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                    <Users className="w-4 h-4" />
                    <span className="text-xs">KOL数量</span>
                  </div>
                  <p className="font-mono text-sm font-medium text-gray-800">
                    {campaign.kolCount || 0} 位
                  </p>
                </div>
              </div>

              <div className="mt-auto">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">预算</p>
                    <p className="font-display font-bold text-xl text-primary-700">
                      {formatMoney(campaign.budget)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 mb-1">预期曝光</p>
                    <p className="font-mono font-semibold text-gray-800">
                      {formatNumber(campaign.kpi.targetImpressions)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-sm text-primary-600">
                    <TrendingUp className="w-4 h-4" />
                    <span>KPI 设置完善</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredCampaigns.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 mb-4">暂无匹配的活动</p>
          <button
            onClick={() => navigate('/campaigns/create')}
            className="btn-accent"
          >
            <Plus className="w-4 h-4" />
            创建第一个活动
          </button>
        </div>
      )}
    </div>
  );
}
