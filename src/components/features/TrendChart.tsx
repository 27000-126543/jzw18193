import { motion } from 'framer-motion';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { useAppStore } from '@/store/useAppStore';
import { formatNumber } from '@/utils';
import { useState } from 'react';
import { useShallow } from 'zustand/shallow';

type MetricType = 'impressions' | 'engagements' | 'clicks';

const metricConfig = {
  impressions: {
    label: '曝光量',
    color: '#416EA4',
    gradient: 'url(#impressionGradient)',
  },
  engagements: {
    label: '互动量',
    color: '#FF6B35',
    gradient: 'url(#engagementGradient)',
  },
  clicks: {
    label: '转化点击',
    color: '#10B981',
    gradient: 'url(#clickGradient)',
  },
};

export default function TrendChart() {
  const trendData = useAppStore(useShallow((state) => state.trendData));
  const [metric, setMetric] = useState<MetricType>('impressions');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="card p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display font-semibold text-lg text-gray-800 mb-1">
            数据趋势
          </h3>
          <p className="text-sm text-gray-500">近30天表现数据</p>
        </div>
        <div className="flex gap-2">
          {(Object.keys(metricConfig) as MetricType[]).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                metric === m
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {metricConfig[m].label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="impressionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#416EA4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#416EA4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#FF6B35" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: '#94A3B8' }}
              tickFormatter={(value) => value.slice(5)}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#94A3B8' }}
              tickFormatter={(value) => formatNumber(value)}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                padding: '12px 16px',
              }}
              formatter={(value: number) => [formatNumber(value), metricConfig[metric].label]}
              labelFormatter={(label) => `日期: ${label}`}
            />
            <Area
              type="monotone"
              dataKey={metric}
              stroke={metricConfig[metric].color}
              strokeWidth={2}
              fill={metricConfig[metric].gradient}
              activeDot={{ r: 6, strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
