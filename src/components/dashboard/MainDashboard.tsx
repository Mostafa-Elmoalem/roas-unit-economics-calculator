import React from 'react';
import { useTranslation } from 'react-i18next';
import { PortfolioSummaryCards } from './PortfolioSummaryCards';
import { ProductsTable } from './ProductsTable';
import { Sparkles, Plus, Upload } from 'lucide-react';

interface MainDashboardProps {
  onOpenAddModal: () => void;
  onOpenImportModal: () => void;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({
  onOpenAddModal,
  onOpenImportModal,
}) => {
  const { t } = useTranslation();

  return (
    <div id="main-content-view" className="space-y-6">
      {/* Welcome / Dashboard Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#18181b] via-[#1c1c20] to-[#18181b] border border-[#27272a] rounded-2xl p-6 sm:p-8">
        <div className="absolute right-0 top-0 rtl:left-0 rtl:right-auto translate-x-10 rtl:-translate-x-10 -translate-y-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('dashboard.heroTag')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#f4f4f5]">
              {t('dashboard.heroTitle')}
            </h2>
            <p className="text-xs sm:text-sm text-[#a1a1aa] mt-1.5 max-w-2xl leading-relaxed">
              {t('dashboard.heroDesc')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{t('common.addProduct')}</span>
            </button>
            <button
              onClick={onOpenImportModal}
              className="flex items-center gap-2 bg-[#27272a] hover:bg-[#3f3f46] text-[#f4f4f5] px-4 py-2.5 rounded-xl text-xs font-semibold transition"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span>{t('common.importCSV')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Blended KPI Summary Cards */}
      <PortfolioSummaryCards />

      {/* Products Table with search, sort, filter & actions */}
      <ProductsTable onOpenAddModal={onOpenAddModal} />
    </div>
  );
};
