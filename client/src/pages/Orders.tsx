import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Order, Priority, OrderStatus } from '../types';
import {
  ShoppingBag,
  Search,
  Filter,
  AlertTriangle,
  Truck,
  Sparkles,
  ArrowRight,
  X,
  ExternalLink,
} from 'lucide-react';

export const Orders: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || 'ALL');
  const [priority, setPriority] = useState('ALL');
  const [delayedOnly, setDelayedOnly] = useState(searchParams.get('delayedOnly') === 'true');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status !== 'ALL') params.append('status', status);
      if (priority !== 'ALL') params.append('priority', priority);
      if (delayedOnly) params.append('delayedOnly', 'true');

      const data = await api.get<{ orders: Order[] }>(`/orders?${params.toString()}`);
      setOrders(data.orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [status, priority, delayedOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const launchResolutionForOrder = (order: Order) => {
    navigate('/task-center', {
      state: { prefillOrder: order.orderNumber },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Orders</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track fulfillment lifecycle, delivery SLAs, and carrier logistics telemetry.
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
            placeholder="Search order #, customer, SKU..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
          />
        </form>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="DELAYED">Delayed</option>
            <option value="PROCESSING">Processing</option>
            <option value="PENDING">Pending</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <label className="flex items-center space-x-1.5 text-xs text-slate-700 cursor-pointer bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 select-none">
            <input
              type="checkbox"
              checked={delayedOnly}
              onChange={(e) => setDelayedOnly(e.target.checked)}
              className="rounded text-indigo-600"
            />
            <span className="font-semibold text-rose-700">Delayed Only</span>
          </label>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">No orders match criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Order Number</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Product SKU</th>
                  <th className="py-3 px-4">Qty / Total</th>
                  <th className="py-3 px-4">Delivery SLA</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{order.orderNumber}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{order.customerName}</div>
                      <div className="text-[11px] text-slate-400">{order.customerEmail}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{order.product?.name}</div>
                      <div className="font-mono text-[11px] text-slate-400">{order.product?.sku}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{order.quantity} units</div>
                      <div className="text-[11px] text-slate-500">${order.totalAmount.toLocaleString()}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div>{new Date(order.expectedDeliveryDate).toLocaleDateString()}</div>
                      {order.delayDays > 0 && (
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                          +{order.delayDays}d overdue
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          order.priority === 'CRITICAL'
                            ? 'bg-red-100 text-red-800'
                            : order.priority === 'HIGH'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {order.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          order.status === 'DELAYED'
                            ? 'bg-rose-100 text-rose-800'
                            : order.status === 'RESOLVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.status === 'PROCESSING'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {order.status === 'DELAYED' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            launchResolutionForOrder(order);
                          }}
                          className="inline-flex items-center text-[11px] px-2.5 py-1 bg-indigo-50 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-100 transition-colors"
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Details Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="font-mono text-xs text-slate-400">Order Dossier</span>
                <h2 className="text-xl font-bold text-slate-900">{selectedOrder.orderNumber}</h2>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Delay Alert if Delayed */}
            {selectedOrder.status === 'DELAYED' && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
                <div className="flex items-center space-x-2 text-rose-900 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>SLA Breach Detected ({selectedOrder.delayDays} Days Overdue)</span>
                </div>
                <p className="text-xs text-rose-800 leading-relaxed">
                  <strong>Investigated Cause:</strong> {selectedOrder.delayReason || 'Uncategorized delay'}
                </p>
                <button
                  onClick={() => launchResolutionForOrder(selectedOrder)}
                  className="w-full mt-2 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 shadow-sm transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Orchestrate Resolution in AI Task Center</span>
                </button>
              </div>
            )}

            {/* Customer & Product Information */}
            <div className="space-y-3 text-xs">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Customer & Terms</h3>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <div><strong className="text-slate-700">Account:</strong> {selectedOrder.customerName}</div>
                <div><strong className="text-slate-700">Email:</strong> {selectedOrder.customerEmail}</div>
                <div><strong className="text-slate-700">Order Value:</strong> ${selectedOrder.totalAmount.toLocaleString()}</div>
                <div><strong className="text-slate-700">Order Date:</strong> {new Date(selectedOrder.orderDate).toLocaleDateString()}</div>
                <div><strong className="text-slate-700">Target Delivery:</strong> {new Date(selectedOrder.expectedDeliveryDate).toLocaleDateString()}</div>
              </div>
            </div>

            {/* Product & Warehouse Inventory Status */}
            <div className="space-y-3 text-xs">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Product & Warehouse Stock</h3>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                <div><strong className="text-slate-700">Product:</strong> {selectedOrder.product?.name}</div>
                <div><strong className="text-slate-700">SKU:</strong> <span className="font-mono">{selectedOrder.product?.sku}</span></div>
                <div><strong className="text-slate-700">Ordered Qty:</strong> {selectedOrder.quantity} units</div>
                <div>
                  <strong className="text-slate-700">Available Stock in Warehouse:</strong>{' '}
                  <span
                    className={`font-bold ${
                      (selectedOrder.product?.inventoryItem?.availableQuantity ?? 0) < selectedOrder.quantity
                        ? 'text-rose-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {selectedOrder.product?.inventoryItem?.availableQuantity ?? 'N/A'} units
                  </span>
                </div>
              </div>
            </div>

            {/* Shipment Tracking */}
            <div className="space-y-3 text-xs">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Carrier Logistics Telemetry</h3>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5">
                <div><strong className="text-slate-700">Carrier:</strong> {selectedOrder.shipment?.carrier || 'Not assigned'}</div>
                <div><strong className="text-slate-700">Status:</strong> {selectedOrder.shipment?.status || 'PENDING'}</div>
                <div><strong className="text-slate-700">Tracking Number:</strong> <span className="font-mono">{selectedOrder.shipment?.trackingNumber || 'Pending Dispatch'}</span></div>
                <div><strong className="text-slate-700">Destination:</strong> {selectedOrder.shipment?.destination}</div>
                {selectedOrder.shipment?.notes && (
                  <div className="text-slate-500 italic mt-1">{selectedOrder.shipment.notes}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

