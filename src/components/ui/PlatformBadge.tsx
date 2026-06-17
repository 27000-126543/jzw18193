import { cn, getPlatformColor, getPlatformName } from '@/utils';

interface PlatformBadgeProps {
  platform: string;
  className?: string;
}

export default function PlatformBadge({ platform, className }: PlatformBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        getPlatformColor(platform),
        className
      )}
    >
      {getPlatformName(platform)}
    </span>
  );
}
