import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { MainDashboard } from './components/dashboard/MainDashboard';
import { ProductCalculator } from './components/calculator/ProductCalculator';
import { ImportModal } from './components/modals/ImportModal';
import { AddProductModal } from './components/modals/AddProductModal';
import { tokens } from './theme/tokens';
import { Heart } from 'lucide-react';

const AppContent: React.FC = () => {
  const { t } = useTranslation();
  const { view } = useApp();

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  return (
    <div className={`min-h-screen ${tokens.bg.app} ${tokens.text.primary} flex flex-col selection:bg-emerald-500/25 selection:text-emerald-600 dark:selection:text-emerald-300 transition-colors duration-200`}>
      {/* Fluid Header */}
      <Header
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
      />

      {/* Fluid Main Content Area */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 sm:py-8 transition-all">
        {view === 'dashboard' ? (
          <MainDashboard
            onOpenAddModal={() => setIsAddModalOpen(true)}
            onOpenImportModal={() => setIsImportModalOpen(true)}
          />
        ) : (
          <ProductCalculator onOpenAddModal={() => setIsAddModalOpen(true)} />
        )}
      </main>

      {/* Fluid Footer */}
      <footer className={`border-t ${tokens.border.default} ${tokens.bg.footer} py-6 text-xs ${tokens.text.muted} transition-colors duration-200`}>
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            <span className={`${tokens.text.secondary} font-medium`}>
              {t('footer.engineDesc')}
            </span>
            <span>•</span>
            <span>{t('footer.storageSynced')}</span>
          </div>

          <div className={`flex items-center gap-2 ${tokens.text.muted}`}>
            <span>{t('footer.madeWith')}</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
            <span>{t('footer.by')}</span>
            <a
              href="https://github.com/Mostafa-Elmoalem"
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 font-semibold ${tokens.text.primary} hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group`}
            >
              <svg
                className={`w-3.5 h-3.5 fill-current ${tokens.text.muted} group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors`}
                viewBox="0 0 24 24"
              >
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>Mostafa Elmoalem</span>
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
