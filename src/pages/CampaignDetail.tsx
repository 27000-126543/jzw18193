import { useParams, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { formatMoney, formatNumber, formatPercent } from '@/utils';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import PlatformBadge from '@/components/ui/PlatformBadge';
import {
  ArrowLeft,
  Edit,
  Users,
  Calendar,
  Target,
  Wallet,
  TrendingUp,
  Eye,
  Heart,
  MousePointerClick,
  Send,
} from 'lucide-react';

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const getCampaignById = useAppStore((state) => state.getCampaignById);
  const getInvitationsByCampaignId = useAppStore(
    (state) => state.getInvitationsByCampaignId
  );

  const campaign = id ? getCampaignById(id) : undefined;
  const invitations = id ? getInvitationsByCampaignId(id) : [];

  if (!campaign) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">活动不存在</p>
        <button onClick={() => navigate('/campaigns')} className="btn-primary">
          返回活动列表
        </button>
      </div>
    );
  }

  const invitationStats = useMemo(() => {
    const acceptedCount = invitations.filter((i) => i.status === 'accepted').length;
    const pendingCount = invitations.filter((i) => i.status === 'pending').length;
    const totalFee = invitations.reduce((sum, i) => sum + i.fee, 0);
    const budgetUsage = totalFee / campaign.budget;
    return { acceptedCount, pendingCount, totalFee, budgetUsage };
  }, [invitations, campaign.budget]);

  const { acceptedCount, pendingCount, totalFee, budgetUsage } = invitationStats;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-4"
      >
        <button
          onClick={() => navigate('/campaigns')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-display font-bold text-2xl text-gray-800">
              {campaign.name}
            </h1>
            <Badge status={campaign.status} />
          </div>
          <p className="text-gray-500">{campaign.description}</p>
        </div>
        <button className="btn-secondary">
          <Edit className="w-4 h-4" />
          编辑活动
        </button>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">活动周期</p>
              <p className="font-mono font-semibold text-gray-800 text-sm">
                {campaign.startDate.slice(5)} ~ {campaign.endDate.slice(5)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-success-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-success-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">合作KOL</p>
              <p className="font-display font-bold text-2xl text-gray-800">
                {acceptedCount}
                <span className="text-sm font-normal text-gray-500 ml-1">
                  / {invitations.length}
                </span>
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-accent-100 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-accent-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">预算使用</p>
              <p className="font-display font-bold text-2xl text-gray-800">
                {(budgetUsage * 100).toFixed(0)}%
              </p>
            </div>
          </div>
          <div className="progress-bar">
            <div
              className={`progress-fill ${
                budgetUsage > 0.9
                  ? 'bg-gradient-to-r from-danger-400 to-danger-600'
                  : 'bg-gradient-to-r from-accent-400 to-accent-600'
              }`}
              style={{ width: `${Math.min(budgetUsage * 100, 100)}%` }}
            />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">预期ROI</p>
              <p className="font-display font-bold text-2xl text-gray-800">3.2x</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-semibold text-lg text-gray-800">
              KPI 目标
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gray-50 rounded-2xl">
              <Eye className="w-8 h-8 text-primary-500 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-2">目标曝光量</p>
              <p className="font-display font-bold text-2xl text-gray-800">
                {formatNumber(campaign.kpi.targetImpressions)}
              </p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-2xl">
              <Heart className="w-8 h-8 text-accent-500 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-2">目标互动量</p>
              <p className="font-display font-bold text-2xl text-gray-800">
                {formatNumber(campaign.kpi.targetEngagements)}
              </p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-2xl">
              <MousePointerClick className="w-8 h-8 text-success-500 mx-auto mb-3" />
              <p className="text-sm text-gray-500 mb-2">目标点击量</p>
              <p className="font-display font-bold text-2xl text-gray-800">
                {formatNumber(campaign.kpi.targetClicks)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-display font-semibold text-lg text-gray-800 mb-6">
            预算明细
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-500">总预算</span>
              <span className="font-semibold text-gray-800">
                {formatMoney(campaign.budget)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">已分配</span>
              <span className="font-semibold text-gray-800">
                {formatMoney(totalFee)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">已支付</span>
              <span className="font-semibold text-success-600">
                {formatMoney(totalFee * 0.3)}
              </span>
            </div>
            <div className="border-t border-gray-100 pt-4 flex justify-between">
              <span className="text-gray-500">剩余预算</span>
              <span className="font-display font-bold text-xl text-primary-600">
                {formatMoney(campaign.budget - totalFee)}
              </span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-semibold text-lg text-gray-800">
            合作KOL列表 ({invitations.length})
          </h3>
          <button
            onClick={() => navigate('/kol')}
            className="btn-accent text-sm"
          >
            <Send className="w-4 h-4" />
            添加KOL
          </button>
        </div>

        <div className="space-y-3">
          {invitations.map((invitation, index) => (
            <motion.div
              key={invitation.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              onClick={() => navigate(`/kol/${invitation.kolId}`)}
            >
              <div className="flex items-center gap-4">
                <img
                  src={`https://i.pravatar.cc/60?u=${invitation.kolName}`}
                  alt={invitation.kolName}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-800">
                      {invitation.kolName}
                    </p>
                    <Badge status={invitation.status} />
                  </div>
                  <p className="text-sm text-gray-500">
                    费用: {formatMoney(invitation.fee)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {invitation.publishDate && (
                  <div className="text-right hidden sm:block">
                    <p className="text-sm text-gray-800">{invitation.publishDate}</p>
                    <p className="text-xs text-gray-500">计划发布</p>
                  </div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/invitations');
                  }}
                  className="btn-secondary text-sm py-1.5 px-3"
                >
                  查看邀约
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>
    </div>
  );
}
