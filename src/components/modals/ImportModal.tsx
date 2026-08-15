import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { parseCustomCSVOrExcel, generateSampleCSV } from '../../lib/csvParser';
import type { Product } from '../../types';
import { formatCurrency } from '../../lib/calculations';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose }) => {
  const { importProducts, currency } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [dragOver, setDragOver] = useState(false);
  const [parsedProducts, setParsedProducts] = useState<Product[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string>('');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');

  if (!isOpen) return null;

  const handleFileProcess = async (file: File) => {
    setFileName(file.name);
    setErrors([]);
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isExcel) {
      const buffer = await file.arrayBuffer();
      const result = parseCustomCSVOrExcel(buffer, true);
      setParsedProducts(result.products);
      setErrors(result.errors);
    } else {
      const text = await file.text();
      const result = parseCustomCSVOrExcel(text, false);
      setParsedProducts(result.products);
      setErrors(result.errors);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleDownloadSample = () => {
    const csvContent = generateSampleCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Sample_ROAS_Economics_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleConfirmImport = () => {
    if (parsedProducts.length > 0) {
      importProducts(parsedProducts, importMode === 'replace');
      onClose();
      // Reset
      setParsedProducts([]);
      setFileName('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#18181b] border border-[#27272a] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#27272a]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#f4f4f5]">
                Import Products (CSV / Excel)
              </h3>
              <p className="text-xs text-[#a1a1aa]">
                Upload custom spreadsheets with auto-detected columns
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-[#27272a] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Download Sample Template Banner */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#09090b] border border-[#27272a] text-xs">
            <div className="flex items-center gap-2 text-[#a1a1aa]">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Need a starting point? Download our standard format template.</span>
            </div>
            <button
              onClick={handleDownloadSample}
              className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Template.csv</span>
            </button>
          </div>

          {/* Drag and drop upload zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-emerald-500 bg-emerald-500/5'
                : 'border-[#27272a] hover:border-[#3f3f46] bg-[#09090b]/60'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileProcess(e.target.files[0]);
                }
              }}
            />

            <div className="flex flex-col items-center justify-center gap-3">
              <div className="p-3 rounded-full bg-[#18181b] border border-[#27272a] text-emerald-400">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#f4f4f5]">
                  {fileName ? fileName : 'Click to browse or drag & drop files'}
                </p>
                <p className="text-xs text-[#71717a] mt-0.5">
                  Supports CSV, XLSX, and XLS formats
                </p>
              </div>
            </div>
          </div>

          {/* Parsing Errors (if any) */}
          {errors.length > 0 && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-rose-400">
                <AlertCircle className="w-4 h-4" />
                <span>Notice while parsing:</span>
              </div>
              <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                {errors.slice(0, 3).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Parsed Products Preview Table */}
          {parsedProducts.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Successfully detected {parsedProducts.length} products</span>
                </div>

                {/* Append vs Replace Mode */}
                <div className="flex items-center bg-[#09090b] border border-[#27272a] rounded-lg p-0.5 text-xs">
                  <button
                    onClick={() => setImportMode('append')}
                    className={`px-2.5 py-0.5 rounded font-medium transition ${
                      importMode === 'append'
                        ? 'bg-[#27272a] text-[#f4f4f5]'
                        : 'text-[#71717a]'
                    }`}
                  >
                    Append
                  </button>
                  <button
                    onClick={() => setImportMode('replace')}
                    className={`px-2.5 py-0.5 rounded font-medium transition ${
                      importMode === 'replace'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'text-[#71717a]'
                    }`}
                  >
                    Replace All
                  </button>
                </div>
              </div>

              <div className="border border-[#27272a] rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#09090b] text-[#71717a] border-b border-[#27272a] sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Product</th>
                      <th className="py-2 px-3">Price</th>
                      <th className="py-2 px-3">COGS</th>
                      <th className="py-2 px-3">Units</th>
                      <th className="py-2 px-3">Shipping</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27272a]">
                    {parsedProducts.map((p, idx) => (
                      <tr key={idx} className="hover:bg-[#202024]/50">
                        <td className="py-2 px-3 font-medium text-[#f4f4f5] truncate max-w-[180px]">
                          {p.name}
                        </td>
                        <td className="py-2 px-3 font-mono-nums">
                          {formatCurrency(p.sellingPrice, currency)}
                        </td>
                        <td className="py-2 px-3 font-mono-nums">
                          {formatCurrency(p.cogs, currency)}
                        </td>
                        <td className="py-2 px-3 font-mono-nums">{p.units}</td>
                        <td className="py-2 px-3 font-mono-nums">
                          {formatCurrency(p.shippingPerUnit, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#27272a] bg-[#0f0f11] flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-[#27272a] transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmImport}
            disabled={parsedProducts.length === 0}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            Import {parsedProducts.length > 0 ? `${parsedProducts.length} Products` : ''}
          </button>
        </div>
      </div>
    </div>
  );
};
