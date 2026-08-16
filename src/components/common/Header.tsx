import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { CurrencySelector } from './CurrencySelector';
import { LanguageSelector } from './LanguageSelector';
import { ThemeToggle } from './ThemeToggle';
import { DataActionsMenu } from './DataActionsMenu';
import { Button } from '../ui/button';
import { tokens } from '../../theme/tokens';
import {
  Calculator,
  LayoutDashboard,
  Plus,
  Check,
  Edit2,
  TrendingUp,
} from 'lucide-react';

interface HeaderProps {
  onOpenImportModal: () => void;
  onOpenAddModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenImportModal,
  onOpenAddModal,
}) => {
  const { t } = useTranslation();

  const {
    projectName,
    setProjectName,
    view,
    setView,
    activeProduct,
  } = useApp();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(projectName);

  const handleSaveTitle = () => {
    if (tempTitle.trim()) {
      setProjectName(tempTitle.trim());
    }
    setIsEditingTitle(false);
  };

  return (
    <header className={`sticky top-0 z-30 ${tokens.bg.header} backdrop-blur-md border-b ${tokens.border.default} transition-colors duration-200`}>
      <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-12">
        {/* Main Header Bar */}
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Left: Brand & Workspace Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div
              onClick={() => setView('dashboard')}
              className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${tokens.status.profit.bg} border ${tokens.status.profit.border} ${tokens.status.profit.text} cursor-pointer hover:opacity-90 active:scale-95 transition shadow-2xs shrink-0`}
              title={t('common.dashboard')}
            >
              <TrendingUp className="w-5 h-5" />
            </div>

            <div className="flex items-center gap-1.5 min-w-0">
              {isEditingTitle ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                    className={`${tokens.bg.input} border border-emerald-500/50 rounded-xl px-2.5 py-1 text-xs font-semibold ${tokens.text.primary} focus:outline-none focus:ring-1 focus:ring-emerald-500 min-w-[130px] sm:min-w-[200px]`}
                    autoFocus
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="p-1.5 rounded-lg bg-emerald-500 text-black hover:bg-emerald-400 active:scale-95 transition cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => {
                    setTempTitle(projectName);
                    setIsEditingTitle(true);
                  }}
                  className="flex items-center gap-1.5 group cursor-pointer py-1 px-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-[#18181b] transition min-w-0"
                  title={t('common.edit')}
                >
                  <h1 className={`text-xs sm:text-base font-bold ${tokens.text.primary} tracking-tight truncate max-w-[110px] sm:max-w-[200px] md:max-w-[280px] xl:max-w-[340px]`}>
                    {projectName}
                  </h1>
                  <Edit2 className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${tokens.text.muted} group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors shrink-0`} />
                </div>
              )}
            </div>
          </div>

          {/* Center (Hidden on small mobile, visible on md+) */}
          <div className={`hidden md:flex items-center ${tokens.bg.toggleTrack} border ${tokens.border.default} rounded-xl p-1 shadow-2xs shrink-0`}>
            <button
              onClick={() => setView('dashboard')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                view === 'dashboard'
                  ? 'bg-white dark:bg-[#27272a] text-zinc-900 dark:text-[#f4f4f5] shadow-xs'
                  : `${tokens.text.secondary} hover:${tokens.text.primary}`
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>{t('common.dashboard')}</span>
            </button>
            <button
              onClick={() => setView('calculator')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                view === 'calculator'
                  ? 'bg-white dark:bg-[#27272a] text-zinc-900 dark:text-[#f4f4f5] shadow-xs'
                  : `${tokens.text.secondary} hover:${tokens.text.primary}`
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>{t('common.calculator')}</span>
              {activeProduct && (
                <span className={`text-[10px] ${tokens.status.profit.text} ${tokens.status.profit.bg} px-1.5 py-0.2 rounded-md font-mono-nums font-bold`}>
                  {t('common.active')}
                </span>
              )}
            </button>
          </div>

          {/* Right: Quick Preferences & Actions Group */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Preferences Hub */}
            <div className="flex items-center gap-1">
              <CurrencySelector />
              <LanguageSelector />
              <ThemeToggle />
            </div>

            {/* Consolidated Data / Export Actions Menu */}
            <DataActionsMenu onOpenImportModal={onOpenImportModal} />

            {/* Primary Action Button */}
            <Button
              onClick={onOpenAddModal}
              variant="default"
              size="sm"
              className="gap-1 font-bold shadow-xs px-2.5 sm:px-3.5"
            >
              <Plus className="w-4 h-4 stroke-[2.8]" />
              <span className="hidden sm:inline">{t('common.addProduct')}</span>
            </Button>
          </div>
        </div>

        {/* Mobile View Switcher (Visible only on small phones below md) */}
        <div className="md:hidden pb-2.5 pt-1">
          <div className={`grid grid-cols-2 gap-1 ${tokens.bg.toggleTrack} border ${tokens.border.default} rounded-xl p-1 shadow-2xs`}>
            <button
              onClick={() => setView('dashboard')}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                view === 'dashboard'
                  ? 'bg-white dark:bg-[#27272a] text-zinc-900 dark:text-[#f4f4f5] shadow-xs'
                  : `${tokens.text.secondary} hover:${tokens.text.primary}`
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>{t('common.dashboard')}</span>
            </button>
            <button
              onClick={() => setView('calculator')}
              className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                view === 'calculator'
                  ? 'bg-white dark:bg-[#27272a] text-zinc-900 dark:text-[#f4f4f5] shadow-xs'
                  : `${tokens.text.secondary} hover:${tokens.text.primary}`
              }`}
            >
              <Calculator className="w-3.5 h-3.5" />
              <span>{t('common.calculator')}</span>
              {activeProduct && (
                <span className={`text-[10px] ${tokens.status.profit.text} ${tokens.status.profit.bg} px-1.5 py-0.2 rounded-md font-mono-nums font-bold`}>
                  {t('common.active')}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
