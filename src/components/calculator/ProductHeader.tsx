import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { exportSingleProductToCSV } from '../../lib/excelExport';
import { exportElementToPDF } from '../../lib/pdfExport';
import {
  ArrowLeft,
  FileSpreadsheet,
  FileDown,
  Trash2,
  Copy,
  ChevronDown,
} from 'lucide-react';

export const ProductHeader: React.FC = () => {
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

  if (!activeProduct) {
    return (
      <div className="flex items-center justify-between py-4">
        <button
          onClick={() => setView('dashboard')}
          className="flex items-center gap-2 text-sm text-[#a1a1aa] hover:text-[#f4f4f5] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to products</span>
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

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${activeProduct.name}"?`)) {
      deleteProduct(activeProduct.id);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#27272a]">
      {/* Left: Back button & Product Selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setView('dashboard')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#18181b] hover:bg-[#27272a] border border-[#27272a] text-xs font-medium text-[#a1a1aa] hover:text-[#f4f4f5] transition shadow-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to products</span>
        </button>

        {/* Fast Switch Dropdown */}
        <div className="relative">
          <select
            value={activeProduct.id}
            onChange={(e) => setActiveProductId(e.target.value)}
            className="bg-[#18181b] border border-[#27272a] hover:border-[#3f3f46] text-[#f4f4f5] rounded-xl px-3 py-1.5 text-xs font-medium outline-none cursor-pointer appearance-none pr-7 max-w-[200px] truncate"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id} className="bg-[#18181b] text-[#f4f4f5]">
                {p.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-[#71717a] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Right: Product Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 bg-[#18181b] hover:bg-[#27272a] text-[#a1a1aa] hover:text-[#f4f4f5] border border-[#27272a] px-3 py-1.5 rounded-xl text-xs font-medium transition"
          title="Export product breakdown to CSV"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
          <span>Export CSV</span>
        </button>

        <button
          onClick={handleExportPDF}
          disabled={isExportingPDF}
          className="flex items-center gap-1.5 bg-[#18181b] hover:bg-[#27272a] text-[#a1a1aa] hover:text-[#f4f4f5] border border-[#27272a] px-3 py-1.5 rounded-xl text-xs font-medium transition disabled:opacity-50"
          title="Export product sheet to PDF"
        >
          <FileDown className="w-3.5 h-3.5 text-rose-400" />
          <span>{isExportingPDF ? 'Generating...' : 'Export PDF'}</span>
        </button>

        <button
          onClick={() => duplicateProduct(activeProduct.id)}
          className="p-1.5 rounded-xl text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-[#18181b] border border-transparent hover:border-[#27272a] transition"
          title="Duplicate this product"
        >
          <Copy className="w-4 h-4" />
        </button>

        <button
          onClick={handleDelete}
          className="flex items-center gap-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2.5 py-1.5 rounded-xl text-xs font-medium transition"
          title="Delete product"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete</span>
        </button>
      </div>
    </div>
  );
};
