/**
 * TrueROAS Design System Tokens
 * Architecture: Three-Layer Token Structure (Primitive -> Semantic -> Component)
 */

// 1. Primitive Tokens (Raw Palette & Units)
export const primitives = {
  colors: {
    zinc: {
      50: '#fafafa',
      100: '#f4f4f5',
      200: '#e4e4e7',
      300: '#d4d4d8',
      400: '#a1a1aa',
      500: '#71717a',
      600: '#52525b',
      700: '#3f3f46',
      800: '#27272a',
      900: '#18181b',
      950: '#09090b',
    },
    emerald: {
      50: '#ecfdf5',
      100: '#d1fae5',
      400: '#34d399',
      500: '#10b981',
      600: '#059669',
      700: '#047857',
      950: '#022c22',
    },
    rose: {
      50: '#fff1f2',
      100: '#ffe4e6',
      400: '#fb7185',
      500: '#f43f5e',
      600: '#e11d48',
      700: '#be123c',
      950: '#4c0519',
    },
    amber: {
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
    },
    indigo: {
      400: '#818cf8',
      500: '#6366f1',
      600: '#4f46e5',
    },
  },
  radius: {
    sm: 'rounded-md',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    xl: 'rounded-2xl',
    full: 'rounded-full',
  },
} as const;

// 2. Semantic Tokens (Purpose Aliases for Light & Dark)
export const semantic = {
  bg: {
    app: 'bg-[#f8fafc] dark:bg-[#09090b]',
    surface: 'bg-white dark:bg-[#18181b]',
    surfaceSubtle: 'bg-zinc-50 dark:bg-[#121214]',
    input: 'bg-zinc-50 dark:bg-[#09090b]',
    inputInner: 'bg-white dark:bg-[#18181b]',
    hover: 'hover:bg-zinc-50 dark:hover:bg-[#202024]',
    tableHead: 'bg-zinc-50 dark:bg-[#0f0f11]',
    header: 'bg-white/90 dark:bg-[#09090b]/90',
    modalOverlay: 'bg-black/60 dark:bg-black/80',
    footer: 'bg-white/80 dark:bg-[#09090b]',
    toggleTrack: 'bg-zinc-100 dark:bg-[#18181b]',
  },
  border: {
    default: 'border-zinc-200 dark:border-[#27272a]',
    subtle: 'border-zinc-100 dark:border-[#27272a]/60',
    hover: 'hover:border-zinc-300 dark:hover:border-[#3f3f46]',
    focus: 'focus:border-emerald-500 focus:outline-none',
    active: 'border-emerald-500/50 ring-1 ring-emerald-500/20',
    divider: 'divide-zinc-200 dark:divide-[#27272a]/60',
  },
  text: {
    primary: 'text-zinc-900 dark:text-[#f4f4f5]',
    secondary: 'text-zinc-600 dark:text-[#a1a1aa]',
    muted: 'text-zinc-400 dark:text-[#71717a]',
    placeholder: 'placeholder-zinc-400 dark:placeholder-[#71717a]',
    inverse: 'text-white dark:text-zinc-950',
  },
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
} as const;

// 3. Component Tokens (Component-Specific Specifications)
export const components = {
  button: {
    primary: 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold transition shadow-xs hover:shadow-emerald-500/20',
    secondary: 'bg-white dark:bg-[#18181b] hover:bg-zinc-100 dark:hover:bg-[#27272a] text-zinc-700 dark:text-[#a1a1aa] hover:text-zinc-900 dark:hover:text-[#f4f4f5] border border-zinc-200 dark:border-[#27272a] transition shadow-xs',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white font-bold transition shadow-xs',
    ghost: 'text-zinc-400 dark:text-[#71717a] hover:text-zinc-900 dark:hover:text-[#f4f4f5] hover:bg-zinc-100 dark:hover:bg-[#18181b] transition',
  },
  card: {
    base: 'bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded-2xl shadow-xs transition-colors duration-200',
    subtle: 'bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-[#27272a] rounded-xl transition',
    profitHero: 'bg-white dark:bg-[#18181b] border-emerald-500/40 hover:border-emerald-500/60 rounded-2xl shadow-xs',
    lossHero: 'bg-white dark:bg-[#18181b] border-rose-500/40 hover:border-rose-500/60 rounded-2xl shadow-xs',
  },
  matrix: {
    highProfit: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-900/50 font-bold',
    profit: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30',
    severeLoss: 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-900/50 font-bold',
    loss: 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/30',
    neutral: 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800',
    anchor: 'ring-2 ring-emerald-500 shadow-sm scale-102 font-extrabold',
  },
} as const;

// Backward-compatible unified export
export const tokens = {
  primitives,
  bg: semantic.bg,
  border: semantic.border,
  text: semantic.text,
  status: semantic.status,
  buttons: components.button,
  card: components.card,
  matrix: components.matrix,
} as const;
