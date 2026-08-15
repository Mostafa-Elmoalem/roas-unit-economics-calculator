import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import confetti from 'canvas-confetti';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Plus } from 'lucide-react';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { addProduct, currency } = useApp();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>(65);
  const [cogs, setCogs] = useState<number | ''>(18);
  const [units, setUnits] = useState<number | ''>(1000);
  const [shippingPerUnit, setShippingPerUnit] = useState<number | ''>(5);
  const [adSpendPerUnit, setAdSpendPerUnit] = useState<number | ''>(20);
  const [fulfillmentRate, setFulfillmentRate] = useState<number>(85);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    addProduct({
      name: name.trim() || 'New E-Commerce Product',
      sku: sku.trim() || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      sellingPrice: Number(sellingPrice) || 50,
      cogs: Number(cogs) || 15,
      units: Number(units) || 500,
      shippingPerUnit: Number(shippingPerUnit) || 5,
      adSpendPerUnit: Number(adSpendPerUnit) || 15,
      fulfillmentRate: Number(fulfillmentRate) || 80,
      fixedCosts: [
        { id: `fc-${Date.now()}-1`, name: 'Photoshoot & Creative', amount: 600 },
        { id: `fc-${Date.now()}-2`, name: 'Studio & Warehousing Rent', amount: 900 },
        { id: `fc-${Date.now()}-3`, name: 'Salaries & Media Buyer', amount: 1200 },
      ],
    });

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // safe fallback
    }

    onClose();
    setName('');
    setSku('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg" onClose={onClose}>
        <DialogHeader onClose={onClose}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <DialogTitle>{t('modals.addProductTitle')}</DialogTitle>
              <DialogDescription>{t('modals.addProductDesc')}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-5 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Title & SKU */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-zinc-600 dark:text-[#a1a1aa] mb-1">
                  {t('modals.productNameLabel')} *
                </label>
                <Input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('modals.productNamePlaceholder')}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-[#a1a1aa] mb-1">
                  {t('modals.skuLabel')}
                </label>
                <Input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder={t('modals.skuPlaceholder')}
                />
              </div>
            </div>

            {/* Selling Price & COGS */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-[#a1a1aa] mb-1">
                  {t('calculator.sellingPrice')} ({currency}) *
                </label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={sellingPrice}
                  onChange={(e) =>
                    setSellingPrice(e.target.value === '' ? '' : parseFloat(e.target.value))
                  }
                  className="font-bold font-mono-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-[#a1a1aa] mb-1">
                  {t('calculator.cogs')} ({currency}) *
                </label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={cogs}
                  onChange={(e) =>
                    setCogs(e.target.value === '' ? '' : parseFloat(e.target.value))
                  }
                  className="font-bold font-mono-nums"
                />
              </div>
            </div>

            {/* Units & Shipping */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-[#a1a1aa] mb-1">
                  {t('calculator.batchUnits')} *
                </label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={units}
                  onChange={(e) =>
                    setUnits(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                  }
                  className="font-mono-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-[#a1a1aa] mb-1">
                  {t('calculator.shippingPerUnit')} ({currency})
                </label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={shippingPerUnit}
                  onChange={(e) =>
                    setShippingPerUnit(e.target.value === '' ? '' : parseFloat(e.target.value))
                  }
                  className="font-mono-nums"
                />
              </div>
            </div>

            {/* Ad Spend & Fulfillment % */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-[#a1a1aa] mb-1">
                  {t('calculator.cpaPerUnit')} ({currency})
                </label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={adSpendPerUnit}
                  onChange={(e) =>
                    setAdSpendPerUnit(e.target.value === '' ? '' : parseFloat(e.target.value))
                  }
                  className="font-mono-nums"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-600 dark:text-[#a1a1aa] mb-1">
                  {t('calculator.fulfillmentRate')} (%)
                </label>
                <Input
                  type="number"
                  min="10"
                  max="100"
                  value={fulfillmentRate}
                  onChange={(e) => setFulfillmentRate(parseInt(e.target.value, 10) || 80)}
                  className="font-mono-nums font-bold"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <DialogFooter>
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" variant="default" size="sm">
              {t('modals.createProductBtn')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
