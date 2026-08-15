import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import confetti from 'canvas-confetti';
import { X, Plus } from 'lucide-react';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose }) => {
  const { addProduct, currency } = useApp();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>(65);
  const [cogs, setCogs] = useState<number | ''>(18);
  const [units, setUnits] = useState<number | ''>(1000);
  const [shippingPerUnit, setShippingPerUnit] = useState<number | ''>(5);
  const [adSpendPerUnit, setAdSpendPerUnit] = useState<number | ''>(20);
  const [fulfillmentRate, setFulfillmentRate] = useState<number>(85);

  if (!isOpen) return null;

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
    // Reset
    setName('');
    setSku('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-[#18181b] border border-[#27272a] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#27272a]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#f4f4f5]">Add New Product</h3>
              <p className="text-xs text-[#a1a1aa]">
                Set up initial unit economics, pricing, and campaign metrics
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

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Title & SKU */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ultra Comfort Memory Pillow"
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-xs font-medium text-[#f4f4f5] outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#a1a1aa] mb-1">SKU</label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g. PLW-01"
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-xs font-medium text-[#f4f4f5] outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Selling Price & COGS */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
                  Selling Price ({currency}) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={sellingPrice}
                  onChange={(e) =>
                    setSellingPrice(e.target.value === '' ? '' : parseFloat(e.target.value))
                  }
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-xs font-bold font-mono-nums text-[#f4f4f5] outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
                  COGS / Cost Per Unit ({currency}) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={cogs}
                  onChange={(e) =>
                    setCogs(e.target.value === '' ? '' : parseFloat(e.target.value))
                  }
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-xs font-bold font-mono-nums text-[#f4f4f5] outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Units & Shipping */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
                  Number of Units *
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={units}
                  onChange={(e) =>
                    setUnits(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                  }
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-xs font-semibold font-mono-nums text-[#f4f4f5] outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
                  Shipping Cost Per Unit ({currency})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={shippingPerUnit}
                  onChange={(e) =>
                    setShippingPerUnit(e.target.value === '' ? '' : parseFloat(e.target.value))
                  }
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-xs font-semibold font-mono-nums text-[#f4f4f5] outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Ad Spend & Fulfillment % */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
                  Ad Spend Per Unit (CPA) ({currency})
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={adSpendPerUnit}
                  onChange={(e) =>
                    setAdSpendPerUnit(e.target.value === '' ? '' : parseFloat(e.target.value))
                  }
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-xs font-semibold font-mono-nums text-[#f4f4f5] outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#a1a1aa] mb-1">
                  Fulfillment Rate (%)
                </label>
                <input
                  type="number"
                  min="10"
                  max="100"
                  value={fulfillmentRate}
                  onChange={(e) => setFulfillmentRate(parseInt(e.target.value, 10) || 80)}
                  className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-xs font-semibold font-mono-nums text-[#f4f4f5] outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-[#27272a] bg-[#0f0f11] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#a1a1aa] hover:text-[#f4f4f5] hover:bg-[#27272a] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition shadow-sm"
            >
              Create Product & Open Calculator
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
