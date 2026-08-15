import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  itemName?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  itemName,
  onClose,
  onConfirm,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs">
      <div className="bg-white dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-[#27272a]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-[#f4f4f5]">
                {t('modals.deleteTitle')}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-[#a1a1aa] mt-0.5">
                {t('modals.deleteSub')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 dark:text-[#a1a1aa] hover:text-zinc-900 dark:hover:text-[#f4f4f5] hover:bg-zinc-100 dark:hover:bg-[#27272a] transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3">
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-[#a1a1aa] leading-relaxed">
            {t('modals.deletePrompt')}{' '}
            <strong className="text-zinc-900 dark:text-[#f4f4f5] font-semibold bg-zinc-100 dark:bg-[#27272a] px-1.5 py-0.5 rounded border border-zinc-200 dark:border-[#3f3f46]">
              "{itemName || t('modals.thisItem')}"
            </strong>
            ?
          </p>
          <p className="text-xs text-rose-600 dark:text-rose-400/90 font-medium">
            {t('modals.deleteWarning')}
          </p>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-zinc-200 dark:border-[#27272a] bg-zinc-50 dark:bg-[#0f0f11] flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-[#a1a1aa] hover:text-zinc-900 dark:hover:text-[#f4f4f5] hover:bg-zinc-200 dark:hover:bg-[#27272a] transition"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t('modals.confirmDeleteBtn')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
