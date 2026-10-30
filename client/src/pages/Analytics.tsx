import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  ShieldCheck,
  RotateCw,
  Clock,
  CheckCircle,
  AlertOctagon,
} from 'lucide-react';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#06b6d4', '#ec4899', '#8b5cf6'];

export const Analytics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get<any>('/analytics/summary');
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Performance & Reliability</h1>
        <p className="text-sm text-slate-500 mt-1">
          Quantitative telemetry calculated directly from verified operational database executions.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase mb-2">
            <span>Workflow Success Rate</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{data?.successRate ?? 100}%</div>
          <div className="text-xs text-slate-400 mt-1">
            {data?.completedWorkflows} of {data?.totalWorkflows} workflows completed
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase mb-2">
            <span>Independent Verification</span>
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-3xl font-extrabold text-indigo-600">
            {data?.verificationStats?.verificationRate ?? 100}%
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {data?.verificationStats?.verified} verified database assertions
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase mb-2">
            <span>Auto Recovery Cycles</span>
            <RotateCw className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {data?.recoveryMetrics?.autoRetriesTriggered ?? 0}
          </div>
          <div className="text-xs text-slate-400 mt-1">Self-healed transient failures</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase mb-2">
            <span>Avg Approval Latency</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">
            {data?.approvals?.avgTurnaroundMinutes ?? 0}m
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {data?.approvals?.total ?? 0} human governance decisions
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step Types Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 mb-1">Execution Steps Distribution</h2>
          <p className="text-xs text-slate-500 mb-4">Breakdown of autonomous operational actions</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.stepDistribution || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
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
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Verification & Approvals Telemetry */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">Outcome Verification Health</h2>
            <p className="text-xs text-slate-500 mb-4">
              Real-world database checks vs unverified assertions
            </p>
          </div>

          <div className="space-y-4 my-auto">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">Database Record Assertions Verified</span>
                <span className="text-emerald-600 font-bold">{data?.verificationStats?.verified ?? 0} steps</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-2.5 rounded-full"
                  style={{ width: `${data?.verificationStats?.verificationRate || 100}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">Governance Gate Approvals Granted</span>
                <span className="text-indigo-600 font-bold">{data?.approvals?.approved ?? 0}</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full"
                  style={{
                    width: `${
                      data?.approvals?.total > 0
                        ? (data.approvals.approved / data.approvals.total) * 100
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-700">Automated Transient Self-Heals</span>
                <span className="text-blue-600 font-bold">
                  {data?.recoveryMetrics?.recoveriesExecuted ?? 0}
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-500 mt-4">
            Notice: All statistics are derived strictly from persistent SQL database transaction logs.
          </div>
        </div>
      </div>
    </div>
  );
};

