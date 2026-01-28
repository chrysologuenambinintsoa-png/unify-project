import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  count: number;
  max?: number;
  className?: string;
}

export function Badge({ count, max = 99, className }: BadgeProps) {
  if (count === 0) return null;

  const displayCount = count > max ? `${max}+` : count;

  return (
    <span
      className={cn(
        'absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full',
        'min-w-[18px] h-[18px] flex items-center justify-center',
        'px-1.5 py-0.5 shadow-lg',
        className
      )}
    >
      {displayCount}
    </span>
  );
}

interface NotificationDotProps {
  show?: boolean;
  className?: string;
}

export function NotificationDot({ show = true, className }: NotificationDotProps) {
  if (!show) return null;

  return (
    <span
      className={cn(
        'absolute top-0 right-0 w-2.5 h-2.5 bg-red-600 rounded-full',
        'ring-2 ring-white',
        className
      )}
    />
  );
}