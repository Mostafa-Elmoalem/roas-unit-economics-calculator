import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { AlertTriangle, Trash2 } from 'lucide-react';

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md" onClose={onClose}>
        <DialogHeader onClose={onClose}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <AlertTriangle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <DialogTitle>{t('modals.deleteTitle')}</DialogTitle>
              <DialogDescription>{t('modals.deleteSub')}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-3">
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
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{t('modals.confirmDeleteBtn')}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
