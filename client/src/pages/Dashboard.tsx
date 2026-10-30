import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { DashboardMetrics } from '../types';
import {
  Play,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Package,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: '#10b981',
  EXECUTING: '#3b82f6',
  AWAITING_APPROVAL: '#f59e0b',
  FAILED: '#ef4444',
  QUEUED: '#94a3b8',
  INVESTIGATING: '#06b6d4',
  PLANNING: '#8b5cf6',
  VALIDATING: '#6366f1',
};

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const data = await api.get<DashboardMetrics>('/dashboard/summary');
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Operations Control Center</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time telemetry, autonomous order investigation, and authorization lifecycle.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchSummary}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            title="Refresh Metrics"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            to="/task-center"
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm hover:from-indigo-700 hover:to-indigo-800 transition-all"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Launch AI Task
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchSummary} className="underline text-red-800 text-xs font-semibold">
            Retry
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Active</span>
            <Play className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics?.activeWorkflows ?? 0}</div>
          <div className="text-xs text-slate-500 mt-1">Under execution</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Completed</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics?.completedWorkflows ?? 0}</div>
          <div className="text-xs text-emerald-600 font-medium mt-1">Verified outcomes</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Approvals</span>
            <ShieldAlert className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-600">{metrics?.awaitingApprovalWorkflows ?? 0}</div>
          <div className="text-xs text-slate-500 mt-1">Awaiting decision</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Delayed Orders</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-600">{metrics?.delayedOrdersCount ?? 0}</div>
          <div className="text-xs text-slate-500 mt-1">Require investigation</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Failed</span>
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics?.failedWorkflows ?? 0}</div>
          <div className="text-xs text-slate-500 mt-1">Escalated to human</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium uppercase tracking-wider mb-2">
            <span>Avg Lead Time</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {metrics?.avgCompletionTimeSeconds ? `${metrics.avgCompletionTimeSeconds}s` : '32s'}
          </div>
          <div className="text-xs text-slate-500 mt-1">Resolution velocity</div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Workflow Execution Activity</h2>
              <p className="text-xs text-slate-500">Autonomous workflow volume over the past 7 days</p>
            </div>
            <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
              Telemetry Live
            </span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics?.activityTrends || []}>
                <defs>
                  <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area type="monotone" dataKey="created" stroke="#6366f1" fillOpacity={1} fill="url(#colorCreated)" name="Created" />
                <Area type="monotone" dataKey="completed" stroke="#10b981" fillOpacity={1} fill="url(#colorCompleted)" name="Completed" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Status Distribution</h2>
            <p className="text-xs text-slate-500">Current workflow breakdown</p>
          </div>
          <div className="h-52 my-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics?.workflowStatusDistribution || [{ name: 'COMPLETED', value: 1 }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(metrics?.workflowStatusDistribution || []).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={STATUS_COLORS[entry.name.replace(/\s+/g, '_')] || '#64748b'}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-3">
            {(metrics?.workflowStatusDistribution || []).slice(0, 4).map((entry) => (
              <div key={entry.name} className="flex items-center space-x-1.5 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: STATUS_COLORS[entry.name.replace(/\s+/g, '_')] || '#64748b',
                  }}
                ></span>
                <span className="text-slate-600 truncate">{entry.name}</span>
                <span className="font-bold text-slate-800 ml-auto">{entry.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Delayed Orders & Pending Approvals Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* High Priority Delayed Orders */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Urgent Delayed Orders</h2>
              <p className="text-xs text-slate-500">Highest priority orders exceeding delivery SLA</p>
            </div>
            <Link to="/orders?delayedOnly=true" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center">
              View All ({metrics?.delayedOrdersCount ?? 0})
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100 flex-1">
            {metrics?.highPriorityDelayedOrders?.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No delayed orders currently recorded.</div>
            ) : (
              metrics?.highPriorityDelayedOrders?.map((order) => (
                <div key={order.id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm font-semibold text-slate-900">{order.orderNumber}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          order.priority === 'CRITICAL'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {order.priority}
                      </span>
                      <span className="text-xs text-rose-600 font-medium">+{order.delayDays}d late</span>
                    </div>
                    <div className="text-xs text-slate-600 truncate max-w-sm">
                      {order.customerName} • {order.product?.name} ({order.quantity} units)
                    </div>
                    <div className="text-[11px] text-slate-400 italic truncate max-w-md">
                      Reason: {order.delayReason || 'Logistics verification needed'}
                    </div>
                  </div>
                  <Link
                    to="/task-center"
                    state={{ prefillOrder: order.orderNumber }}
                    className="shrink-0 text-xs px-3 py-1.5 bg-indigo-50 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    Investigate
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Approval Requests */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Pending Authorization Gate</h2>
              <p className="text-xs text-slate-500">Actions paused awaiting human manager approval</p>
            </div>
            <Link to="/approvals" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center">
              Approval Center
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100 flex-1">
            {metrics?.pendingApprovals?.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No workflows currently paused for approval.
              </div>
            ) : (
              metrics?.pendingApprovals?.map((appr) => (
                <div key={appr.id} className="p-4 hover:bg-slate-50/80 transition-colors flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-indigo-700 uppercase">
                        {appr.actionType.replace(/_/g, ' ')}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          appr.riskLevel === 'CRITICAL' || appr.riskLevel === 'HIGH'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {appr.riskLevel} RISK
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-1">{appr.reason}</p>
                    <p className="text-[11px] text-slate-400">
                      Workflow: {appr.workflow?.title || 'Operational Workflow'}
                    </p>
                  </div>
                  <Link
                    to="/approvals"
                    className="shrink-0 text-xs px-3 py-1.5 bg-amber-50 text-amber-800 font-semibold rounded-lg hover:bg-amber-100 transition-colors border border-amber-200"
                  >
                    Review
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

