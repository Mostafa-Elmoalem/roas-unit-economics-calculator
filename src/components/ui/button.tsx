import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link'
    | 'success';
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'xs';
}

const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
  default:
    'bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-bold shadow-xs hover:shadow-emerald-500/20 active:scale-[0.98]',
  destructive:
    'bg-rose-600 text-white hover:bg-rose-500 font-bold shadow-xs active:scale-[0.98]',
  outline:
    'border border-zinc-200 dark:border-[#27272a] bg-white dark:bg-[#18181b] hover:bg-zinc-100 dark:hover:bg-[#27272a] text-zinc-700 dark:text-[#a1a1aa] hover:text-zinc-900 dark:hover:text-[#f4f4f5] shadow-xs active:scale-[0.98]',
  secondary:
    'bg-zinc-100 dark:bg-[#27272a] text-zinc-900 dark:text-[#f4f4f5] hover:bg-zinc-200 dark:hover:bg-[#3f3f46] active:scale-[0.98]',
  ghost:
    'text-zinc-500 dark:text-[#a1a1aa] hover:text-zinc-900 dark:hover:text-[#f4f4f5] hover:bg-zinc-100 dark:hover:bg-[#18181b]',
  link: 'text-emerald-600 dark:text-emerald-400 underline-offset-4 hover:underline p-0 h-auto',
  success:
    'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 font-semibold',
};

const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
  default: 'h-9 px-4 py-2 text-xs rounded-xl',
  xs: 'h-7 px-2.5 py-1 text-[11px] rounded-lg',
  sm: 'h-8 px-3 text-xs rounded-lg',
  lg: 'h-11 px-6 text-sm rounded-xl',
  icon: 'h-8 w-8 rounded-lg p-0 flex items-center justify-center',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
