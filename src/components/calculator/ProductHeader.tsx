import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { exportSingleProductToCSV } from '../../lib/excelExport';
import { exportElementToPDF } from '../../lib/pdfExport';
import { DeleteConfirmationModal } from '../modals/DeleteConfirmationModal';
import {
  ArrowLeft,
  ArrowRight,
  FileSpreadsheet,
  FileDown,
  Trash2,
  Copy,
  ChevronDown,
} from 'lucide-react';

export const ProductHeader: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  const {
    activeProduct,
    deleteProduct,
    duplicateProduct,
    products,
    setActiveProductId,
    setView,
    currency,
  } = useApp();

  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  if (!activeProduct) {
    return (
      <div className="flex items-center justify-between py-4">
        <button
          onClick={() => setView('dashboard')}
          className="flex items-center gap-2 text-sm text-zinc-500 dark:text-[#a1a1aa] hover:text-zinc-900 dark:hover:text-[#f4f4f5] transition"
        >
          {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          <span>{t('calculator.backToProducts')}</span>
        </button>
      </div>
    );
  }

  const handleExportCSV = () => {
    exportSingleProductToCSV(activeProduct, currency);
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    await exportElementToPDF(
      'main-content-view',
      `${activeProduct.name}_Unit_Economics_Report`
    );
    setIsExportingPDF(false);
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-200 dark:border-[#27272a] transition-colors duration-200">
        {/* Left: Back button & Product Selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-[#18181b] hover:bg-zinc-100 dark:hover:bg-[#27272a] border border-zinc-200 dark:border-[#27272a] text-xs font-medium text-zinc-700 dark:text-[#a1a1aa] hover:text-zinc-900 dark:hover:text-[#f4f4f5] transition shadow-xs"
          >
            {isRtl ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
            <span>{t('calculator.backToProducts')}</span>
          </button>

          {/* Fast Switch Dropdown */}
          <div className="relative">
            <select
              value={activeProduct.id}
              onChange={(e) => setActiveProductId(e.target.value)}
              className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] hover:border-zinc-300 dark:hover:border-[#3f3f46] text-zinc-900 dark:text-[#f4f4f5] rounded-xl px-3 py-1.5 text-xs font-medium outline-none cursor-pointer appearance-none pr-7 rtl:pl-7 rtl:pr-3 max-w-[200px] truncate shadow-xs"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id} className="bg-white dark:bg-[#18181b] text-zinc-900 dark:text-[#f4f4f5]">
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 dark:text-[#71717a] absolute right-2.5 rtl:left-2.5 rtl:right-auto top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Right: Product Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 bg-white dark:bg-[#18181b] hover:bg-zinc-100 dark:hover:bg-[#27272a] text-zinc-700 dark:text-[#a1a1aa] hover:text-zinc-900 dark:hover:text-[#f4f4f5] border border-zinc-200 dark:border-[#27272a] px-3 py-1.5 rounded-xl text-xs font-medium transition shadow-xs"
            title={t('calculator.exportProductCSV')}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{t('calculator.exportProductCSV')}</span>
          </button>

          <button
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="flex items-center gap-1.5 bg-white dark:bg-[#18181b] hover:bg-zinc-100 dark:hover:bg-[#27272a] text-zinc-700 dark:text-[#a1a1aa] hover:text-zinc-900 dark:hover:text-[#f4f4f5] border border-zinc-200 dark:border-[#27272a] px-3 py-1.5 rounded-xl text-xs font-medium transition disabled:opacity-50 shadow-xs"
            title={t('common.exportPDF')}
          >
            <FileDown className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
            <span>{isExportingPDF ? t('common.exporting') : t('common.exportPDF')}</span>
          </button>

          <button
            onClick={() => duplicateProduct(activeProduct.id)}
            className="p-1.5 rounded-xl text-zinc-500 dark:text-[#a1a1aa] hover:text-zinc-900 dark:hover:text-[#f4f4f5] hover:bg-zinc-100 dark:hover:bg-[#18181b] border border-transparent hover:border-zinc-200 dark:hover:border-[#27272a] transition"
            title={t('calculator.duplicateProduct')}
          >
            <Copy className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center gap-1 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 px-2.5 py-1.5 rounded-xl text-xs font-medium transition"
            title={t('calculator.deleteProduct')}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t('calculator.deleteProduct')}</span>
          </button>
        </div>
      </div>

      {/* Custom Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        itemName={activeProduct.name}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => {
          deleteProduct(activeProduct.id);
        }}
      />
    </>
  );
};
