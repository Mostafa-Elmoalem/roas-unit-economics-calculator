import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { CurrencySelector } from './CurrencySelector';
import { LanguageSelector } from './LanguageSelector';
import { ThemeToggle } from './ThemeToggle';
import { exportPortfolioToExcel } from '../../lib/excelExport';
import { exportElementToPDF } from '../../lib/pdfExport';
import {
  Calculator,
  LayoutDashboard,
  Plus,
  Upload,
  FileSpreadsheet,
  FileDown,
  RotateCcw,
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
    products,
    currency,
    resetToDemoData,
    activeProduct,
  } = useApp();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(projectName);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleSaveTitle = () => {
    if (tempTitle.trim()) {
      setProjectName(tempTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleExportExcel = () => {
    exportPortfolioToExcel(projectName, products, currency);
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    await exportElementToPDF(
      'main-content-view',
      view === 'dashboard'
        ? `${projectName}_Dashboard_Report`
        : `${activeProduct?.name || 'Product'}_Unit_Economics`
    );
    setIsExportingPDF(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-[#09090b]/90 backdrop-blur-md border-b border-zinc-200 dark:border-[#27272a] transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
          {/* Left: Brand & Editable Project Name */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div
              onClick={() => setView('dashboard')}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 cursor-pointer hover:bg-emerald-500/20 transition-colors shadow-xs shrink-0"
              title={t('common.dashboard')}
            >
              <TrendingUp className="w-5 h-5" />
            </div>

            <div className="flex items-center gap-2 min-w-0">
              {isEditingTitle ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                    className="bg-zinc-100 dark:bg-[#18181b] border border-emerald-500/50 rounded-md px-2.5 py-1 text-sm font-semibold text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 min-w-[180px] sm:min-w-[220px]"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveTitle}
                    className="p-1 rounded-md bg-emerald-500 text-black hover:bg-emerald-400 transition"
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
                  className="flex items-center gap-1.5 group cursor-pointer"
                  title={t('common.edit')}
                >
                  <h1 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-[#f4f4f5] tracking-tight truncate max-w-[130px] sm:max-w-[260px]">
                    {projectName}
                  </h1>
                  <Edit2 className="w-3.5 h-3.5 text-zinc-400 dark:text-[#71717a] group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors shrink-0" />
                </div>
              )}
            </div>

            {/* View switcher buttons */}
            <div className="hidden md:flex items-center bg-zinc-100 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded-lg p-0.5 ml-2 rtl:mr-2 rtl:ml-0">
              <button
                onClick={() => setView('dashboard')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  view === 'dashboard'
                    ? 'bg-white dark:bg-[#27272a] text-zinc-900 dark:text-[#f4f4f5] shadow-xs'
                    : 'text-zinc-500 dark:text-[#a1a1aa] hover:text-zinc-900 dark:hover:text-[#f4f4f5]'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>{t('common.dashboard')}</span>
              </button>
              <button
                onClick={() => setView('calculator')}
                className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  view === 'calculator'
                    ? 'bg-white dark:bg-[#27272a] text-zinc-900 dark:text-[#f4f4f5] shadow-xs'
                    : 'text-zinc-500 dark:text-[#a1a1aa] hover:text-zinc-900 dark:hover:text-[#f4f4f5]'
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>{t('common.calculator')}</span>
                {activeProduct && (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                    {t('common.active')}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Right: Actions, Theme, Language, Currency & Tools */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ThemeToggle />
            <LanguageSelector />
            <CurrencySelector />

            {/* Import Button */}
            <button
              onClick={onOpenImportModal}
              className="flex items-center gap-1.5 bg-white dark:bg-[#18181b] hover:bg-zinc-100 dark:hover:bg-[#27272a] text-zinc-700 dark:text-[#a1a1aa] hover:text-zinc-900 dark:hover:text-[#f4f4f5] border border-zinc-200 dark:border-[#27272a] px-2.5 py-1.5 rounded-lg text-xs font-medium transition shadow-xs"
              title={t('common.importCSV')}
            >
              <Upload className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              <span className="hidden lg:inline">{t('common.importCSV')}</span>
            </button>

            {/* Export buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={handleExportExcel}
                className="flex items-center gap-1.5 bg-white dark:bg-[#18181b] hover:bg-zinc-100 dark:hover:bg-[#27272a] text-zinc-700 dark:text-[#a1a1aa] hover:text-zinc-900 dark:hover:text-[#f4f4f5] border border-zinc-200 dark:border-[#27272a] px-2.5 py-1.5 rounded-lg text-xs font-medium transition shadow-xs"
                title={t('common.exportExcel')}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="hidden xl:inline">{t('common.exportExcel')}</span>
              </button>

              <button
                onClick={handleExportPDF}
                disabled={isExportingPDF}
                className="flex items-center gap-1.5 bg-white dark:bg-[#18181b] hover:bg-zinc-100 dark:hover:bg-[#27272a] text-zinc-700 dark:text-[#a1a1aa] hover:text-zinc-900 dark:hover:text-[#f4f4f5] border border-zinc-200 dark:border-[#27272a] px-2.5 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-50 shadow-xs"
                title={t('common.exportPDF')}
              >
                <FileDown className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                <span className="hidden xl:inline">{isExportingPDF ? t('common.exporting') : t('common.exportPDF')}</span>
              </button>
            </div>

            {/* Add Product Button */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition hover:shadow-emerald-500/20"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{t('common.addProduct')}</span>
            </button>

            {/* Reset to Demo */}
            <button
              onClick={() => {
                if (confirm(t('common.resetConfirm'))) {
                  resetToDemoData();
                }
              }}
              className="p-1.5 rounded-lg text-zinc-400 dark:text-[#71717a] hover:text-zinc-900 dark:hover:text-[#f4f4f5] hover:bg-zinc-100 dark:hover:bg-[#18181b] border border-transparent hover:border-zinc-200 dark:hover:border-[#27272a] transition"
              title={t('common.resetDemo')}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
