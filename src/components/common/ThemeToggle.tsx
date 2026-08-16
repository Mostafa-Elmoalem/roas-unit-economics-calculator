import React from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { tokens } from '../../theme/tokens';
import { Sun, Moon, Monitor } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { t } = useTranslation();
  const { theme, effectiveTheme, setTheme } = useApp();

  return (
    <div className={`relative flex items-center ${tokens.bg.toggleTrack} border ${tokens.border.default} rounded-lg p-0.5 shadow-xs`}>
      <button
        onClick={() => setTheme('light')}
        className={`p-1.5 rounded-md transition-all ${
          theme === 'light' || (theme === 'system' && effectiveTheme === 'light')
            ? 'bg-white text-amber-500 shadow-xs'
            : `${tokens.text.muted} hover:${tokens.text.primary}`
        }`}
        title={t('theme.light')}
      >
        <Sun className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => setTheme('dark')}
        className={`p-1.5 rounded-md transition-all ${
          theme === 'dark' || (theme === 'system' && effectiveTheme === 'dark')
            ? 'bg-[#27272a] text-indigo-400 shadow-xs'
            : `${tokens.text.muted} hover:${tokens.text.primary}`
        }`}
        title={t('theme.dark')}
      >
        <Moon className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => setTheme('system')}
        className={`p-1.5 rounded-md transition-all ${
          theme === 'system'
            ? 'bg-white dark:bg-[#27272a] text-emerald-500 shadow-xs'
            : `${tokens.text.muted} hover:${tokens.text.primary}`
        }`}
        title={t('theme.system')}
      >
        <Monitor className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
