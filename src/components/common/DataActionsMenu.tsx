import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { exportPortfolioToExcel } from '../../lib/excelExport';
import { exportElementToPDF } from '../../lib/pdfExport';
import { tokens } from '../../theme/tokens';
import {
  Upload,
  FileSpreadsheet,
  FileDown,
  RotateCcw,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

interface DataActionsMenuProps {
  onOpenImportModal: () => void;
}

export const DataActionsMenu: React.FC<DataActionsMenuProps> = ({
  onOpenImportModal,
}) => {
  const { t } = useTranslation();
  const { projectName, products, currency, resetToDemoData, view, activeProduct } =
    useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleExportExcel = () => {
    exportPortfolioToExcel(projectName, products, currency);
    setIsOpen(false);
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
    setIsOpen(false);
  };

  const handleResetDemo = () => {
    if (confirm(t('common.resetConfirm'))) {
      resetToDemoData();
    }
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 ${tokens.buttons.secondary} px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition`}
        title={t('common.actions')}
      >
        <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
        <span className="hidden sm:inline">{t('common.actions')}</span>
        <ChevronDown
          className={`w-3 h-3 ${tokens.text.muted} transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className={`absolute right-0 rtl:left-0 rtl:right-auto mt-2 w-56 rounded-2xl ${tokens.bg.surface} border ${tokens.border.default} p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150`}>
          {/* Import option */}
          <button
            onClick={() => {
              onOpenImportModal();
              setIsOpen(false);
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl text-zinc-700 dark:text-zinc-300 hover:${tokens.bg.hover} hover:${tokens.text.primary} transition text-left rtl:text-right cursor-pointer`}
          >
            <Upload className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            <div className="flex-1">
              <p className="font-semibold">{t('common.importCSV')}</p>
            </div>
          </button>

          {/* Export Excel option */}
          <button
            onClick={handleExportExcel}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl text-zinc-700 dark:text-zinc-300 hover:${tokens.bg.hover} hover:${tokens.text.primary} transition text-left rtl:text-right cursor-pointer`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <div className="flex-1">
              <p className="font-semibold">{t('common.exportExcel')}</p>
            </div>
          </button>

          {/* Export PDF option */}
          <button
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl text-zinc-700 dark:text-zinc-300 hover:${tokens.bg.hover} hover:${tokens.text.primary} transition text-left rtl:text-right cursor-pointer disabled:opacity-50`}
          >
            <FileDown className="w-4 h-4 text-rose-500 dark:text-rose-400" />
            <div className="flex-1">
              <p className="font-semibold">
                {isExportingPDF ? t('common.exporting') : t('common.exportPDF')}
              </p>
            </div>
          </button>

          <div className={`my-1 border-t ${tokens.border.subtle}`} />

          {/* Reset Demo Data */}
          <button
            onClick={handleResetDemo}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition text-left rtl:text-right cursor-pointer`}
          >
            <RotateCcw className="w-4 h-4" />
            <div className="flex-1">
              <p className="font-semibold">{t('common.resetDemo')}</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};
