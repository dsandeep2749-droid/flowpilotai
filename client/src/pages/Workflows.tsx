import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Workflow, WorkflowStatus } from '../types';
import {
  GitBranch,
  Search,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const Workflows: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const data = await api.get<{ workflows: Workflow[] }>(
        `/workflows?status=${statusFilter}`
      );
      setWorkflows(data.workflows);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, [statusFilter]);

  const getStatusBadge = (status: WorkflowStatus) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">Completed</span>;
      case 'EXECUTING':
      case 'INVESTIGATING':
      case 'PLANNING':
      case 'VALIDATING':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 animate-pulse">{status}</span>;
      case 'AWAITING_APPROVAL':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">Awaiting Approval</span>;
      case 'FAILED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">Failed</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Workflow Executions</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track, inspect, and audit active and historical business process workflows.
          </p>
        </div>
        <Link
          to="/task-center"
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Start New Workflow
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 border-b border-slate-200">
        {['ALL', 'EXECUTING', 'AWAITING_APPROVAL', 'COMPLETED', 'FAILED'].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
              statusFilter === tab
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Workflows List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : workflows.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            No workflows found for the selected status filter.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {workflows.map((wf) => (
              <div key={wf.id} className="p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-base text-slate-900">{wf.title}</span>
                    {getStatusBadge(wf.status)}
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {wf.executionMode.replace(/_/g, ' ')}
                    </span>
                    {wf.isDemoMode && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                        Demo Mode
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-1 max-w-2xl">{wf.objective}</p>
                  <div className="flex items-center space-x-4 text-xs text-slate-400">
                    <span>Initiated by: {wf.creator?.name || 'FlowPilot Agent'}</span>
                    <span>•</span>
                    <span>Created: {new Date(wf.createdAt).toLocaleString()}</span>
                    <span>•</span>
                    <span>Steps: {wf.steps?.length ?? 0}</span>
                  </div>
                </div>

                <Link
                  to={`/workflows/${wf.id}`}
                  className="shrink-0 inline-flex items-center px-4 py-2 border border-slate-200 hover:border-indigo-300 rounded-lg text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all"
                >
                  Inspect Monitor
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

