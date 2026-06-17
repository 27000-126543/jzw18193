import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number): string {
  if (num >= 100000000) {
    return (num / 100000000).toFixed(1) + '亿';
  }
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: number): string {
  return (value * 100).toFixed(1) + '%';
}

export function getPlatformName(platform: string): string {
  const names: Record<string, string> = {
    douyin: '抖音',
    xiaohongshu: '小红书',
    weibo: '微博',
    bilibili: 'B站',
    kuaishou: '快手',
  };
  return names[platform] || platform;
}

export function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    douyin: 'bg-black text-white',
    xiaohongshu: 'bg-red-500 text-white',
    weibo: 'bg-orange-500 text-white',
    bilibili: 'bg-sky-500 text-white',
    kuaishou: 'bg-orange-600 text-white',
  };
  return colors[platform] || 'bg-gray-500 text-white';
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    active: 'bg-primary-100 text-primary-700',
    completed: 'bg-success-100 text-success-700',
    cancelled: 'bg-gray-100 text-gray-500',
    pending: 'bg-amber-100 text-amber-700',
    accepted: 'bg-success-100 text-success-700',
    rejected: 'bg-danger-100 text-danger-700',
    negotiating: 'bg-accent-100 text-accent-700',
    approved: 'bg-success-100 text-success-700',
    paid: 'bg-success-100 text-success-700',
    overdue: 'bg-danger-100 text-danger-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

export function getStatusName(status: string): string {
  const names: Record<string, string> = {
    draft: '草稿',
    active: '进行中',
    completed: '已完成',
    cancelled: '已取消',
    pending: '待确认',
    accepted: '已接受',
    rejected: '已拒绝',
    negotiating: '协商中',
    approved: '已通过',
    paid: '已支付',
    overdue: '已逾期',
  };
  return names[status] || status;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
