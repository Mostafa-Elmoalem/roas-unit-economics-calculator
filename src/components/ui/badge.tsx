import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | 'default'
    | 'secondary'
    | 'destructive'
    | 'outline'
    | 'success'
    | 'warning'
    | 'indigo';
}

const badgeVariants: Record<NonNullable<BadgeProps['variant']>, string> = {
  default:
    'border-transparent bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900',
  secondary:
    'border-transparent bg-zinc-100 dark:bg-[#27272a] text-zinc-900 dark:text-[#f4f4f5]',
  destructive:
    'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-400',
  outline:
    'border-zinc-200 dark:border-[#27272a] text-zinc-700 dark:text-[#a1a1aa]',
  success:
    'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  warning:
    'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  indigo:
    'border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-400',
};

export const Badge = ({
  className,
  variant = 'default',
  ...props
}: BadgeProps) => {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2',
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  );
};
