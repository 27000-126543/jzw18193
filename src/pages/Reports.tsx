import { useState, useMemo } from 'react';
import { useShallow } from 'zustand/shallow';
import { motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { formatNumber, formatPercent, formatMoney } from '@/utils';
import Card from '@/components/ui/Card';
import {
  BarChart3,
  TrendingUp,
  Eye,
  Heart,
  MousePointerClick,
  Target,
  Download,
  Filter,
  ChevronRight,
  Star,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export default function Reports() {
  const performanceData = useAppStore(useShallow((state) => state.performanceData));
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const topPerforming = useMemo(() => {
    return [...performanceData]
      .sort((a, b) => b.roi - a.roi)
      .slice(0, 10);
  }, [performanceData]);

  const chartData = useMemo(() => {
    return topPerforming.map((p) => ({
      name: p.kolName?.slice(0, 4) || '-',
      roi: p.roi,
      impressions: p.impressions / 10000,
      engagements: p.engagements / 10000,
    }));
  }, [topPerforming]);

  const totalStats = useMemo(() => ({
    impressions: performanceData.reduce((sum, p) => sum + p.impressions, 0),
    engagements: performanceData.reduce((sum, p) => sum + p.engagements, 0),
    clicks: performanceData.reduce((sum, p) => sum + p.clicks, 0),
    avgRoi:
      performanceData.length > 0
        ? performanceData.reduce((sum, p) => sum + p.roi, 0) / performanceData.length
        : 0,
  }), [performanceData]);

  const barColors = ['#416EA4', '#FF6B35', '#10B981', '#8B5CF6', '#F59E0B'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-800">
            数据报告
          </h1>
          <p className="text-gray-500 mt-1">
            分析KOL合作表现，对比预期KPI，优化投放策略
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white rounded-lg border border-gray-200 p-1">
            {(['7d', '30d', '90d'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  selectedPeriod === period
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {period === '7d' ? '近7天' : period === '30d' ? '近30天' : '近90天'}
              </button>
            ))}
          </div>
          <button className="btn-secondary">
            <Download className="w-4 h-4" />
            导出报告
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
              <Eye className="w-6 h-6 text-primary-600" />
            </div>
            <div className="flex items-center gap-1 text-success-600 text-sm font-medium">
              <TrendingUp className="w-4 h-4" />
              +23.5%
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-1">总曝光量</p>
          <p className="font-display font-bold text-2xl text-gray-800">
            {formatNumber(totalStats.impressions)}
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center">
              <Heart className="w-6 h-6 text-accent-600" />
            </div>
            <div className="flex items-center gap-1 text-success-600 text-sm font-medium">
              <TrendingUp className="w-4 h-4" />
              +18.2%
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-1">总互动量</p>
          <p className="font-display font-bold text-2xl text-gray-800">
            {formatNumber(totalStats.engagements)}
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
              <MousePointerClick className="w-6 h-6 text-success-600" />
            </div>
            <div className="flex items-center gap-1 text-success-600 text-sm font-medium">
              <TrendingUp className="w-4 h-4" />
              +31.4%
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-1">总转化点击</p>
          <p className="font-display font-bold text-2xl text-gray-800">
            {formatNumber(totalStats.clicks)}
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex items-center gap-1 text-success-600 text-sm font-medium">
              <TrendingUp className="w-4 h-4" />
              +12.8%
            </div>
          </div>
          <p className="text-sm text-gray-500 mb-1">平均 ROI</p>
          <p className="font-display font-bold text-2xl text-gray-800">
            {totalStats.avgRoi.toFixed(2)}x
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-display font-semibold text-lg text-gray-800">
              ROI 排行榜
            </h3>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 rounded-lg text-sm font-medium bg-primary-700 text-white">
                ROI
              </button>
              <button className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100">
                曝光量
              </button>
              <button className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100">
                互动量
              </button>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={true} vertical={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#64748B' }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)}x`, 'ROI']}
                />
                <Bar dataKey="roi" radius={[0, 8, 8, 0]}>
                  {chartData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={barColors[index % barColors.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-display font-semibold text-lg text-gray-800 mb-6">
            KPI 达成情况
          </h3>
          {performanceData.slice(0, 5).map((perf, index) => {
            const impressionRate = perf.targetImpressions
              ? perf.impressions / perf.targetImpressions
              : 1;
            const engagementRate = perf.targetEngagements
              ? perf.engagements / perf.targetEngagements
              : 1;

            return (
              <motion.div
                key={perf.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="mb-6 last:mb-0"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-800 truncate">
                    {perf.kolName}
                  </span>
                  <span
                    className={`text-sm font-bold ${
                      impressionRate >= 1 ? 'text-success-600' : 'text-accent-600'
                    }`}
                  >
                    {(impressionRate * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="progress-bar mb-1">
                  <div
                    className={`progress-fill ${
                      impressionRate >= 1
                        ? 'bg-gradient-to-r from-success-400 to-success-600'
                        : 'bg-gradient-to-r from-accent-400 to-accent-600'
                    }`}
                    style={{ width: `${Math.min(impressionRate * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>曝光 {formatNumber(perf.impressions)}</span>
                  <span>目标 {formatNumber(perf.targetImpressions || 0)}</span>
                </div>
              </motion.div>
            );
          })}
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-semibold text-lg text-gray-800">
            详细报告列表
          </h3>
          <button className="btn-secondary text-sm">
            <Filter className="w-4 h-4" />
            筛选
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-500">
                  KOL
                </th>
                <th className="text-left py-4 px-4 text-sm font-medium text-gray-500">
                  活动
                </th>
                <th className="text-right py-4 px-4 text-sm font-medium text-gray-500">
                  曝光量
                </th>
                <th className="text-right py-4 px-4 text-sm font-medium text-gray-500">
                  互动量
                </th>
                <th className="text-right py-4 px-4 text-sm font-medium text-gray-500">
                  点击量
                </th>
                <th className="text-right py-4 px-4 text-sm font-medium text-gray-500">
                  ROI
                </th>
                <th className="text-center py-4 px-4 text-sm font-medium text-gray-500">
                  操作
                </th>
              </tr>
            </thead>
            <tbody>
              {performanceData.slice(0, 8).map((perf, index) => (
                <motion.tr
                  key={perf.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://i.pravatar.cc/40?u=${perf.kolName}`}
                        alt={perf.kolName}
                        className="w-9 h-9 rounded-full"
                      />
                      <span className="font-medium text-gray-800">
                        {perf.kolName}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600 truncate max-w-[200px]">
                    {perf.campaignName}
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-sm text-gray-800">
                    {formatNumber(perf.impressions)}
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-sm text-gray-800">
                    {formatNumber(perf.engagements)}
                  </td>
                  <td className="py-4 px-4 text-right font-mono text-sm text-gray-800">
                    {formatNumber(perf.clicks)}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span
                      className={`font-mono font-bold ${
                        perf.roi >= 3 ? 'text-success-600' : 'text-accent-600'
                      }`}
                    >
                      {perf.roi.toFixed(2)}x
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <button className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1 mx-auto">
                      详情
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
