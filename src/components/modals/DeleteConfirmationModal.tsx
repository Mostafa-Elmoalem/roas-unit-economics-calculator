import React from 'react';
import { useTranslation } from 'react-i18next';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  itemName?: string;
  description?: string;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  itemName,
  description,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const displayTitle = title || t('modals.deleteTitle');
  const displayDesc = description || t('modals.deleteWarning');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#18181b] border border-[#27272a] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#27272a]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#f4f4f5]">{displayTitle}</h3>
              <p className="text-xs text-[#71717a]">{t('modals.deleteSubtitle')}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-[#27272a] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          {itemName && (
            <div className="p-3 rounded-xl bg-[#09090b] border border-[#27272a]">
              <span className="text-[11px] text-[#71717a] block mb-0.5">{t('modals.itemToDelete')}</span>
              <p className="text-xs font-semibold text-[#f4f4f5] truncate">{itemName}</p>
            </div>
          )}

          <p className="text-xs text-[#a1a1aa] leading-relaxed">{displayDesc}</p>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#27272a] bg-[#0f0f11] flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-[#27272a] transition"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold transition shadow-sm hover:shadow-rose-500/20"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t('common.deletePermanently')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
