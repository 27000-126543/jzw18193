import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { formatNumber, formatMoney, formatPercent } from '@/utils';
import StatCard from '@/components/features/StatCard';
import TrendChart from '@/components/features/TrendChart';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import PlatformBadge from '@/components/ui/PlatformBadge';
import {
  Megaphone,
  FileCheck,
  Wallet,
  TrendingUp,
  Eye,
  Heart,
  MousePointerClick,
  Star,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { useShallow } from 'zustand/shallow';

export default function Dashboard() {
  const navigate = useNavigate();
  const dashboardStats = useAppStore(useShallow((state) => state.dashboardStats));
  const {
    activeCampaigns,
    pendingReviews,
    monthlyBudget,
    averageRoi,
    totalImpressions,
    totalEngagements,
    totalClicks,
  } = dashboardStats;

  const campaignsAll = useAppStore(useShallow((state) => state.campaigns));
  const kolsAll = useAppStore(useShallow((state) => state.kols));
  const reviewsAll = useAppStore(useShallow((state) => state.reviews));

  const campaigns = useMemo(
    () => campaignsAll.filter((c) => c.status === 'active').slice(0, 5),
    [campaignsAll]
  );

  const topKOLs = useMemo(
    () => [...kolsAll].sort((a, b) => b.score - a.score).slice(0, 5),
    [kolsAll]
  );

  const pendingReviewItems = useMemo(
    () => reviewsAll.filter((r) => r.status === 'pending').slice(0, 5),
    [reviewsAll]
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="进行中活动"
          value={activeCampaigns.toString()}
          change={12.5}
          icon={<Megaphone className="w-6 h-6" />}
          color="primary"
          delay={0}
        />
        <StatCard
          title="待审核内容"
          value={pendingReviews.toString()}
          change={-8.3}
          icon={<FileCheck className="w-6 h-6" />}
          color="accent"
          delay={0.1}
        />
        <StatCard
          title="本月预算"
          value={formatMoney(monthlyBudget)}
          change={5.2}
          icon={<Wallet className="w-6 h-6" />}
          color="success"
          delay={0.2}
        />
        <StatCard
          title="平均 ROI"
          value={`${averageRoi}x`}
          change={15.8}
          icon={<TrendingUp className="w-6 h-6" />}
          color="primary"
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TrendChart />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="card p-6"
        >
          <h3 className="font-display font-semibold text-lg text-gray-800 mb-4">
            核心指标汇总
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary-500" />
                  <span className="text-sm text-gray-600">总曝光量</span>
                </div>
                <span className="font-mono font-semibold text-gray-800">
                  {formatNumber(totalImpressions)}
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill bg-gradient-to-r from-primary-400 to-primary-600"
                  style={{ width: '85%' }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-accent-500" />
                  <span className="text-sm text-gray-600">总互动量</span>
                </div>
                <span className="font-mono font-semibold text-gray-800">
                  {formatNumber(totalEngagements)}
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill bg-gradient-to-r from-accent-400 to-accent-600"
                  style={{ width: '72%' }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MousePointerClick className="w-4 h-4 text-success-500" />
                  <span className="text-sm text-gray-600">总转化点击</span>
                </div>
                <span className="font-mono font-semibold text-gray-800">
                  {formatNumber(totalClicks)}
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill bg-gradient-to-r from-success-400 to-success-600"
                  style={{ width: '68%' }}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">平均互动率</p>
                  <p className="font-display font-bold text-xl text-gray-800">
                    {formatPercent(totalEngagements / totalImpressions)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">点击率</p>
                  <p className="font-display font-bold text-xl text-gray-800">
                    {formatPercent(totalClicks / totalImpressions)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-lg text-gray-800">
              进行中活动
            </h3>
            <button
              onClick={() => navigate('/campaigns')}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              查看全部
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {campaigns.map((campaign, index) => (
              <motion.div
                key={campaign.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => navigate(`/campaigns/${campaign.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">
                    {campaign.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    预算: {formatMoney(campaign.budget)}
                  </p>
                </div>
                <Badge status={campaign.status} />
              </motion.div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-lg text-gray-800">
              待审核内容
            </h3>
            <button
              onClick={() => navigate('/content')}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              查看全部
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {pendingReviewItems.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => navigate('/content')}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent-100 to-accent-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-accent-600 font-medium text-sm">
                    {review.kolName?.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">
                    {review.kolName}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {review.campaignName}
                  </p>
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap">
                  v{review.version}
                </span>
              </motion.div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-lg text-gray-800">
              TOP KOL 榜单
            </h3>
            <button
              onClick={() => navigate('/kol')}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              查看全部
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            {topKOLs.map((kol, index) => (
              <motion.div
                key={kol.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => navigate(`/kol/${kol.id}`)}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-xs">
                    {index + 1}
                  </span>
                </div>
                <img
                  src={kol.avatar}
                  alt={kol.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-800 truncate">
                      {kol.name}
                    </p>
                    <div className="flex items-center gap-0.5 text-amber-500">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-xs font-medium">
                        {kol.score.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <PlatformBadge platform={kol.platform} />
                    <span className="text-xs text-gray-500">
                      {formatNumber(kol.followers)}粉丝
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
