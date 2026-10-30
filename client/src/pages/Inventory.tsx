import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { InventoryItem } from '../types';
import { Package, Search, AlertTriangle, CheckCircle, Clock, ShoppingCart } from 'lucide-react';

export const Inventory: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (lowStockOnly) params.append('lowStockOnly', 'true');

      const data = await api.get<{ items: InventoryItem[] }>(`/inventory?${params.toString()}`);
      setItems(data.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [lowStockOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInventory();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Warehouse Inventory</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time SKU availability, safety thresholds, and automated restock triggers.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search SKU, product name..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
          />
        </form>

        <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 select-none">
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={(e) => setLowStockOnly(e.target.checked)}
            className="rounded text-indigo-600"
          />
          <span className="font-semibold text-rose-700">Below Reorder Threshold Only</span>
        </label>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">No inventory items found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">SKU / Code</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Available</th>
                  <th className="py-3 px-4">Reserved</th>
                  <th className="py-3 px-4">Safety Threshold</th>
                  <th className="py-3 px-4">Batch Qty</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => {
                  const isLow = item.availableQuantity <= item.reorderThreshold;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{item.product?.sku}</td>
                      <td className="py-3 px-4 font-medium text-slate-800">{item.product?.name}</td>
                      <td className="py-3 px-4 font-bold">
                        <span className={isLow ? 'text-rose-600' : 'text-slate-800'}>
                          {item.availableQuantity} units
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{item.reservedQuantity} units</td>
                      <td className="py-3 px-4 text-slate-600">{item.reorderThreshold} units</td>
                      <td className="py-3 px-4 text-slate-600">{item.reorderQuantity} units</td>
                      <td className="py-3 px-4">
                        <div className="text-slate-800 font-medium">{item.supplierName}</div>
                        <div className="text-[10px] text-slate-400">{item.supplierContact}</div>
                      </td>
                      <td className="py-3 px-4">
                        {isLow ? (
                          <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800">
                            <AlertTriangle className="w-3 h-3 mr-1 text-rose-600" />
                            Depleted
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            <CheckCircle className="w-3 h-3 mr-1 text-emerald-600" />
                            Optimal
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Restock History Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs text-slate-400">Inventory SKU</span>
                <h3 className="text-lg font-bold text-slate-900">{selectedItem.product?.name}</h3>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block">Available Stock</span>
                <span className="text-lg font-bold text-slate-900">{selectedItem.availableQuantity} units</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <span className="text-slate-500 block">Reorder Batch</span>
                <span className="text-lg font-bold text-slate-900">{selectedItem.reorderQuantity} units</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Recent Restock Requests
              </h4>
              <div className="space-y-2">
                {selectedItem.product?.restockRequests && selectedItem.product.restockRequests.length > 0 ? (
                  selectedItem.product.restockRequests.map((rr: any) => (
                    <div key={rr.id} className="p-2.5 bg-slate-50 rounded-lg text-xs flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-800">
                          +{rr.quantity} units ({rr.status})
                        </div>
                        <div className="text-[11px] text-slate-500">{rr.reason}</div>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(rr.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-lg">
                    No restock requests recorded for this SKU.
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => setSelectedItem(null)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

