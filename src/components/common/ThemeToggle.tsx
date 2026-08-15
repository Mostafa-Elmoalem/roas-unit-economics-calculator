import React from 'react';
import { useApp } from '../../context/AppContext';
import { Sun, Moon, Monitor } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { theme, effectiveTheme, setTheme } = useApp();

  return (
    <div className="relative flex items-center bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded-lg p-0.5 shadow-xs">
      <button
        onClick={() => setTheme('light')}
        className={`p-1.5 rounded-md transition-all ${
          theme === 'light' || (theme === 'system' && effectiveTheme === 'light')
            ? 'bg-white text-amber-500 shadow-xs'
            : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
        }`}
        title="Light Mode"
      >
        <Sun className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => setTheme('dark')}
        className={`p-1.5 rounded-md transition-all ${
          theme === 'dark' || (theme === 'system' && effectiveTheme === 'dark')
            ? 'bg-[#27272a] text-indigo-400 shadow-xs'
            : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
        }`}
        title="Dark Mode"
      >
        <Moon className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => setTheme('system')}
        className={`p-1.5 rounded-md transition-all ${
          theme === 'system'
            ? 'bg-white dark:bg-[#27272a] text-emerald-500 shadow-xs'
            : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
        }`}
        title="Auto (System Browser Default)"
      >
        <Monitor className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
