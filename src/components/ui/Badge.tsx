import { cn, getStatusColor, getStatusName } from '@/utils';
import type { ReactNode } from 'react';

interface BadgeProps {
  status: string;
  className?: string;
  children?: ReactNode;
}

export default function Badge({ status, className, children }: BadgeProps) {
  return (
    <span className={cn('badge', getStatusColor(status), className)}>
      {children || getStatusName(status)}
    </span>
  );
}
