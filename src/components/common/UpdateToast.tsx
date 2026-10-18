import React, { useSyncExternalStore } from 'react';
import { useTranslation } from 'react-i18next';
import { acceptUpdateReload, dismissUpdate, getUpdateSnapshot, onUpdateSnapshot } from '../../pwa';
import { tokens } from '../../theme/tokens';
import { RefreshCw } from 'lucide-react';

/**
 * The whole update UX (AD-20, user-prompted): a single bottom toast that
 * appears only while the flow reports a waiting service worker. Reload hands
 * skip-waiting to the worker (page reloads once it takes control); Dismiss
 * hides the prompt for the session — it is never persisted, so a dismissed
 * update simply re-prompts next session.
 */
export const UpdateToast: React.FC = () => {
  const { t } = useTranslation();
  const snapshot = useSyncExternalStore(onUpdateSnapshot, getUpdateSnapshot);

  if (snapshot.phase !== 'updateAvailable') return null;

  return (
    <div role="status" aria-live="polite" className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div
        className={`flex w-full max-w-md items-center gap-3 rounded-2xl px-4 py-3 shadow-lg ${tokens.bg.surface} ${tokens.border.default} border`}
      >
        <RefreshCw className={`h-4 w-4 shrink-0 ${tokens.status.profit.text}`} />
        <p className={`flex-1 text-sm ${tokens.text.secondary}`}>{t('pwa.updateAvailable')}</p>
        <button
          type="button"
          onClick={acceptUpdateReload}
          className={`rounded-lg px-3 py-1.5 text-xs ${tokens.buttons.primary}`}
        >
          {t('pwa.reload')}
        </button>
        <button
          type="button"
          onClick={dismissUpdate}
          className={`rounded-lg px-3 py-1.5 text-xs ${tokens.buttons.ghost}`}
        >
          {t('pwa.dismiss')}
        </button>
      </div>
    </div>
  );
};
