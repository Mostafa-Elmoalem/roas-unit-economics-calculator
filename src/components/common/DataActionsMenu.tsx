import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { exportPortfolioToExcel } from '../../lib/excelExport';
import { exportElementToPDF } from '../../lib/pdfExport';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { tokens } from '../../theme/tokens';
import {
  Upload,
  FileSpreadsheet,
  FileDown,
  FileUp,
  Download,
  RotateCcw,
  ChevronDown,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

interface DataActionsMenuProps {
  onOpenImportModal: () => void;
}

export const DataActionsMenu: React.FC<DataActionsMenuProps> = ({
  onOpenImportModal,
}) => {
  const { t } = useTranslation();
  const {
    projectName,
    products,
    currency,
    resetToDemoData,
    view,
    activeProduct,
    effectiveTheme,
    exportBackupJson,
    restoreBackupFromJson,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isRestoreErrorOpen, setIsRestoreErrorOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

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
        : `${activeProduct?.name || 'Product'}_Unit_Economics`,
      effectiveTheme
    );
    setIsExportingPDF(false);
    setIsOpen(false);
  };

  // Backup: full-fidelity JSON snapshot of projects + products (CAP-10)
  const handleExportBackup = () => {
    const json = exportBackupJson();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `trueroas-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  // Restore: parse + merge (LWW by id); malformed files never touch current state
  const handleRestoreClick = () => {
    restoreInputRef.current?.click();
    setIsOpen(false);
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;

    try {
      const text = await file.text();
      restoreBackupFromJson(text);
    } catch {
      setIsRestoreErrorOpen(true);
    }
  };

  const handleResetDemo = () => {
    if (confirm(t('common.resetConfirm'))) {
      resetToDemoData();
    }
    setIsOpen(false);
  };

  return (
    <>
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

            {/* Backup (JSON) option */}
            <button
              onClick={handleExportBackup}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl text-zinc-700 dark:text-zinc-300 hover:${tokens.bg.hover} hover:${tokens.text.primary} transition text-left rtl:text-right cursor-pointer`}
            >
              <Download className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <div className="flex-1">
                <p className="font-semibold">{t('common.exportBackup')}</p>
              </div>
            </button>

            {/* Restore from Backup option */}
            <button
              onClick={handleRestoreClick}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl text-zinc-700 dark:text-zinc-300 hover:${tokens.bg.hover} hover:${tokens.text.primary} transition text-left rtl:text-right cursor-pointer`}
            >
              <FileUp className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              <div className="flex-1">
                <p className="font-semibold">{t('common.restoreBackup')}</p>
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

        {/* Hidden file picker for JSON restore */}
        <input
          ref={restoreInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleRestoreFile}
        />
      </div>

      {/* Restore error dialog — shown only when parsing/validation fails */}
      <Dialog
        open={isRestoreErrorOpen}
        onOpenChange={(open) => !open && setIsRestoreErrorOpen(false)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader onClose={() => setIsRestoreErrorOpen(false)}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
              </div>
              <div>
                <DialogTitle>{t('common.restoreErrorTitle')}</DialogTitle>
                <DialogDescription>{t('common.restoreErrorDesc')}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsRestoreErrorOpen(false)}>
              {t('common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
