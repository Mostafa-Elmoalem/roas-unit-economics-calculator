/**
 * Design System Theme Tokens
 * Centralized semantic design tokens for light and dark modes.
 * Ensures DRY code, consistent contrast, and modular styling across all components.
 */

export const tokens = {
  // Surfaces & Backgrounds
  bg: {
    app: 'bg-[#f8fafc] dark:bg-[#09090b]',
    header: 'bg-white/90 dark:bg-[#09090b]/90',
    card: 'bg-white dark:bg-[#18181b]',
    cardSubtle: 'bg-zinc-50 dark:bg-[#121214]',
    input: 'bg-zinc-50 dark:bg-[#09090b]',
    inputInner: 'bg-white dark:bg-[#18181b]',
    hover: 'hover:bg-zinc-50 dark:hover:bg-[#202024]',
    tableHead: 'bg-zinc-50 dark:bg-[#0f0f11]',
    modalOverlay: 'bg-black/60 dark:bg-black/80',
    footer: 'bg-white/80 dark:bg-[#09090b]',
    toggleTrack: 'bg-zinc-100 dark:bg-[#18181b]',
  },

  // Borders & Dividers
  border: {
    default: 'border-zinc-200 dark:border-[#27272a]',
    subtle: 'border-zinc-100 dark:border-[#27272a]/60',
    hover: 'hover:border-zinc-300 dark:hover:border-[#3f3f46]',
    focus: 'focus:border-emerald-500 focus:outline-none',
    active: 'border-emerald-500/50 ring-1 ring-emerald-500/20',
    divider: 'divide-zinc-200 dark:divide-[#27272a]/60',
  },

  // Typography & Content Colors
  text: {
    primary: 'text-zinc-900 dark:text-[#f4f4f5]',
    secondary: 'text-zinc-600 dark:text-[#a1a1aa]',
    muted: 'text-zinc-400 dark:text-[#71717a]',
    placeholder: 'placeholder-zinc-400 dark:placeholder-[#71717a]',
    inverse: 'text-white dark:text-zinc-950',
  },

  // Interactive & State Badges
  status: {
    profit: {
      text: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30',
      pillActive: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-semibold',
    },
    loss: {
      text: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/30',
      pillActive: 'bg-rose-500/20 text-rose-700 dark:text-rose-300 font-semibold',
    },
    warning: {
      text: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      badge: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30',
    },
    accent: {
      text: 'text-indigo-600 dark:text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/20',
    },
  },

  // Interactive Buttons
  buttons: {
    primary: 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold transition shadow-xs hover:shadow-emerald-500/20',
    secondary: 'bg-white dark:bg-[#18181b] hover:bg-zinc-100 dark:hover:bg-[#27272a] text-zinc-700 dark:text-[#a1a1aa] hover:text-zinc-900 dark:hover:text-[#f4f4f5] border border-zinc-200 dark:border-[#27272a] transition shadow-xs',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white font-bold transition shadow-xs',
    dangerGhost: 'text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition',
    ghost: 'text-zinc-400 dark:text-[#71717a] hover:text-zinc-900 dark:hover:text-[#f4f4f5] hover:bg-zinc-100 dark:hover:bg-[#18181b] transition',
  },

  // Radii and Card styling
  card: {
    base: 'bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded-2xl shadow-xs transition-colors duration-200',
    subtle: 'bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-[#27272a] rounded-xl transition',
  },
} as const;

export type ThemeTokens = typeof tokens;
