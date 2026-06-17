import { useParams, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { formatMoney, formatNumber, formatPercent } from '@/utils';
import Card from '@/components/ui/Card';
import PlatformBadge from '@/components/ui/PlatformBadge';
import {
  ArrowLeft,
  Send,
  Star,
  Users,
  Eye,
  Heart,
  MousePointerClick,
  TrendingUp,
  Calendar,
  MessageSquare,
} from 'lucide-react';

export default function KOLDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const getKolById = useAppStore((state) => state.getKolById);
  const getHistoryByKolId = useAppStore((state) => state.getHistoryByKolId);

  const kol = id ? getKolById(id) : undefined;
  const history = id ? getHistoryByKolId(id) : [];

  if (!kol) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-500 mb-4">KOL不存在</p>
        <button onClick={() => navigate('/kol')} className="btn-primary">
          返回KOL列表
        </button>
      </div>
    );
  }

  const avgStats = useMemo(() => {
    const avgRoi =
      history.length > 0
        ? history.reduce((sum, h) => sum + h.finalRoi, 0) / history.length
        : 0;
    const avgRating =
      history.length > 0
        ? history.reduce((sum, h) => sum + h.rating, 0) / history.length
        : kol.score;
    return { avgRoi, avgRating };
  }, [history, kol.score]);

  const { avgRoi, avgRating } = avgStats;

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-4"
      >
        <button
          onClick={() => navigate('/kol')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="font-display font-bold text-2xl text-gray-800">KOL详情</h1>
      </motion.div>

      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex items-start gap-6 flex-1">
            <img
              src={kol.avatar}
              alt={kol.name}
              className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white shadow-xl"
            />
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="font-display font-bold text-2xl text-gray-800">
                  {kol.name}
                </h2>
                <PlatformBadge platform={kol.platform} />
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="w-5 h-5 fill-current" />
                  <span className="font-semibold">{avgRating.toFixed(1)}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {kol.category.map((c) => (
                  <span
                    key={c}
                    className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm"
                  >
                    {c}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {kol.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="text-gray-600 mt-4">{kol.description}</p>
            </div>
          </div>
          <div className="flex flex-col gap-4 md:border-l md:pl-6 md:w-64">
            <div className="text-center p-4 bg-gradient-to-br from-accent-50 to-accent-100 rounded-2xl">
              <p className="text-sm text-gray-600 mb-1">合作报价</p>
              <p className="font-display font-bold text-3xl text-accent-600">
                {formatMoney(kol.price)}
              </p>
            </div>
            <button
              onClick={() => navigate('/invitations')}
              className="btn-accent w-full"
            >
              <Send className="w-4 h-4" />
              发送合作邀约
            </button>
            <div className="text-center text-sm text-gray-500">
              历史合作 {kol.historyCount} 次
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 text-center">
          <Users className="w-6 h-6 text-primary-500 mx-auto mb-2" />
          <p className="text-xs text-gray-500 mb-1">粉丝数</p>
          <p className="font-display font-bold text-xl text-gray-800">
            {formatNumber(kol.followers)}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <Eye className="w-6 h-6 text-blue-500 mx-auto mb-2" />
          <p className="text-xs text-gray-500 mb-1">平均播放</p>
          <p className="font-display font-bold text-xl text-gray-800">
            {formatNumber(kol.avgViews)}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <Heart className="w-6 h-6 text-accent-500 mx-auto mb-2" />
          <p className="text-xs text-gray-500 mb-1">平均点赞</p>
          <p className="font-display font-bold text-xl text-gray-800">
            {formatNumber(kol.avgLikes)}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <TrendingUp className="w-6 h-6 text-success-500 mx-auto mb-2" />
          <p className="text-xs text-gray-500 mb-1">互动率</p>
          <p className="font-display font-bold text-xl text-gray-800">
            {formatPercent(kol.engagementRate)}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <Star className="w-6 h-6 text-amber-500 mx-auto mb-2" />
          <p className="text-xs text-gray-500 mb-1">平均ROI</p>
          <p className="font-display font-bold text-xl text-gray-800">
            {avgRoi.toFixed(1)}x
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="font-display font-semibold text-lg text-gray-800 mb-6">
            内容样例
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="aspect-square rounded-xl overflow-hidden bg-gray-100"
              >
                <img
                  src={`https://picsum.photos/seed/${kol.id}-${i}/300/300`}
                  alt={`内容样例 ${i}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-display font-semibold text-lg text-gray-800 mb-6">
            联系方式
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">联系邮箱</p>
                <p className="font-medium text-gray-800">{kol.contact}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-accent-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">最近可排期</p>
                <p className="font-medium text-gray-800">2024年2月后</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {history.length > 0 && (
        <Card className="p-6">
          <h3 className="font-display font-semibold text-lg text-gray-800 mb-6">
            历史合作记录 ({history.length})
          </h3>
          <div className="space-y-4">
            {history.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 bg-gray-50 rounded-xl"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-medium text-gray-800">
                      {item.campaignName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(item.completedAt).toLocaleDateString('zh-CN')} 完成
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(item.rating)
                            ? 'text-amber-500 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">曝光量</p>
                    <p className="font-mono font-semibold text-gray-800">
                      {formatNumber(item.finalImpressions)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">互动量</p>
                    <p className="font-mono font-semibold text-gray-800">
                      {formatNumber(item.finalEngagements)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">点击量</p>
                    <p className="font-mono font-semibold text-gray-800">
                      {formatNumber(item.finalClicks)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">ROI</p>
                    <p
                      className={`font-mono font-bold ${
                        item.finalRoi >= 3
                          ? 'text-success-600'
                          : 'text-accent-600'
                      }`}
                    >
                      {item.finalRoi.toFixed(2)}x
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-lg">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-800">评价：</span>
                    {item.feedback}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
