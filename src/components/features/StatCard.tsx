import { motion } from 'framer-motion';
import { cn, formatNumber, formatMoney, formatPercent } from '@/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  icon: ReactNode;
  color: 'primary' | 'accent' | 'success' | 'danger';
  delay?: number;
}

const colorClasses = {
  primary: 'text-primary-600 bg-primary-50',
  accent: 'text-accent-600 bg-accent-50',
  success: 'text-success-600 bg-success-50',
  danger: 'text-danger-600 bg-danger-50',
};

const gradientClasses = {
  primary: 'from-primary-500 to-primary-700',
  accent: 'from-accent-400 to-accent-600',
  success: 'from-success-400 to-success-600',
  danger: 'from-danger-400 to-danger-600',
};

export default function StatCard({
  title,
  value,
  change,
  icon,
  color,
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="stat-card bg-white border border-gray-100"
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div
            className={cn(
              'w-12 h-12 rounded-xl flex items-center justify-center',
              colorClasses[color]
            )}
          >
            {icon}
          </div>
          {change !== undefined && (
            <div
              className={cn(
                'flex items-center gap-1 text-sm font-medium',
                change >= 0 ? 'text-success-600' : 'text-danger-600'
              )}
            >
              {change >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-500 mb-1">{title}</p>
        <p className="font-display text-3xl font-bold text-gray-800">
          <span className={cn('bg-gradient-to-r bg-clip-text text-transparent', gradientClasses[color])}>
            {value}
          </span>
        </p>
      </div>
    </motion.div>
  );
}
