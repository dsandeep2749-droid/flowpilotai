import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { Workflow, WorkflowStep } from '../types';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  RotateCw,
  RefreshCw,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Database,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const WorkflowDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);

  const fetchWorkflow = async () => {
    try {
      const data = await api.get<{ workflow: Workflow }>(`/workflows/${id}`);
      setWorkflow(data.workflow);
      // Automatically expand running, awaiting_approval, or failed step
      if (!expandedStepId && data.workflow.steps) {
        const active = data.workflow.steps.find(
          (s) => s.status === 'RUNNING' || s.stepType === 'APPROVAL_GATE' || s.status === 'FAILED'
        );
        if (active) setExpandedStepId(active.id);
        else if (data.workflow.steps.length > 0) setExpandedStepId(data.workflow.steps[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch workflow');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflow();
    // Poll every 3 seconds if active
    const interval = setInterval(() => {
      if (
        workflow &&
        ['QUEUED', 'INVESTIGATING', 'PLANNING', 'VALIDATING', 'EXECUTING'].includes(workflow.status)
      ) {
        fetchWorkflow();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [id, workflow?.status]);

  const handleRetry = async () => {
    try {
      await api.post(`/workflows/${id}/retry`);
      fetchWorkflow();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this workflow execution?')) return;
    try {
      await api.post(`/workflows/${id}/cancel`);
      fetchWorkflow();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading && !workflow) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !workflow) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="text-red-600 font-semibold">{error || 'Workflow not found'}</div>
        <Link to="/workflows" className="text-xs text-indigo-600 underline">
          Back to Workflows
        </Link>
      </div>
    );
  }

  const parseJsonSafe = (data: any) => {
    if (!data) return null;
    if (typeof data === 'object') return data;
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Navigation & Status Header */}
      <div className="flex items-center justify-between">
        <Link
          to="/workflows"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Executions
        </Link>
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchWorkflow}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200"
            title="Refresh Status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {workflow.status === 'FAILED' && (
            <button
              onClick={handleRetry}
              className="inline-flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700"
            >
              <RotateCw className="w-3.5 h-3.5 mr-1" />
              Retry Workflow
            </button>
          )}
          {['EXECUTING', 'INVESTIGATING', 'PLANNING', 'AWAITING_APPROVAL'].includes(workflow.status) && (
            <button
              onClick={handleCancel}
              className="inline-flex items-center px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-semibold hover:bg-red-100"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Main Workflow Dossier Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs text-slate-400">ID: {workflow.id.slice(0, 8)}</span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  workflow.status === 'COMPLETED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : workflow.status === 'AWAITING_APPROVAL'
                    ? 'bg-amber-100 text-amber-800'
                    : workflow.status === 'FAILED'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-blue-100 text-blue-800 animate-pulse'
                }`}
              >
                {workflow.status.replace(/_/g, ' ')}
              </span>
              <span className="text-xs font-mono px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                MODE: {workflow.executionMode}
              </span>
              {workflow.isDemoMode && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                  Deterministic Demo Engine
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-2">{workflow.title}</h1>
          </div>

          {workflow.status === 'AWAITING_APPROVAL' && (
            <Link
              to="/approvals"
              className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-xl shadow-sm transition-colors animate-pulse"
            >
              <ShieldAlert className="w-4 h-4 mr-1.5" />
              Review Pending Approval in Gate
            </Link>
          )}
        </div>

        <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700">
          <span className="font-semibold text-slate-900">Objective:</span> {workflow.objective}
        </div>

        {workflow.planSummary && (
          <div className="p-3 bg-indigo-50/60 rounded-xl text-xs text-indigo-900 border border-indigo-100">
            <span className="font-semibold text-indigo-950">Plan Synthesis:</span> {workflow.planSummary}
          </div>
        )}

        {workflow.finalSummary && (
          <div className="p-3 bg-emerald-50 rounded-xl text-xs text-emerald-900 border border-emerald-200">
            <span className="font-semibold text-emerald-950">Final Outcome:</span> {workflow.finalSummary}
          </div>
        )}

        {workflow.failureReason && (
          <div className="p-3 bg-red-50 rounded-xl text-xs text-red-900 border border-red-200">
            <span className="font-semibold text-red-950">Failure Detail:</span> {workflow.failureReason}
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 text-xs text-slate-500 border-t border-slate-100">
          <div>
            <span className="block text-slate-400">Created At</span>
            <span className="font-medium text-slate-700">{new Date(workflow.createdAt).toLocaleTimeString()}</span>
          </div>
          <div>
            <span className="block text-slate-400">Started At</span>
            <span className="font-medium text-slate-700">
              {workflow.startedAt ? new Date(workflow.startedAt).toLocaleTimeString() : 'Pending'}
            </span>
          </div>
          <div>
            <span className="block text-slate-400">Completed At</span>
            <span className="font-medium text-slate-700">
              {workflow.completedAt ? new Date(workflow.completedAt).toLocaleTimeString() : 'In Progress'}
            </span>
          </div>
          <div>
            <span className="block text-slate-400">Operator</span>
            <span className="font-medium text-slate-700">{workflow.creator?.name || 'FlowPilot Agent'}</span>
          </div>
        </div>
      </div>

      {/* Execution Timeline & Step Monitor */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center">
          <Database className="w-4 h-4 mr-2 text-indigo-600" />
          Execution Step Hierarchy & Verification Evidence
        </h2>

        <div className="space-y-3">
          {workflow.steps?.map((step) => {
            const isExpanded = expandedStepId === step.id;
            const inputObj = parseJsonSafe(step.inputParams);
            const outputObj = parseJsonSafe(step.outputData);
            const evidenceObj = parseJsonSafe(step.verificationEvidence);

            return (
              <div
                key={step.id}
                className={`border rounded-xl transition-all overflow-hidden ${
                  step.status === 'COMPLETED'
                    ? 'border-slate-200 bg-white'
                    : step.status === 'FAILED'
                    ? 'border-red-200 bg-red-50/20'
                    : step.stepType === 'APPROVAL_GATE'
                    ? 'border-amber-200 bg-amber-50/30'
                    : 'border-blue-200 bg-blue-50/20'
                }`}
              >
                {/* Step Header Accordion */}
                <button
                  type="button"
                  onClick={() => setExpandedStepId(isExpanded ? null : step.id)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/60 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center shrink-0">
                      {step.sequence}
                    </span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-slate-900">{step.description}</span>
                        {step.toolName && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            tool: {step.toolName}
                          </span>
                        )}
                        {step.verificationStatus === 'VERIFIED' && (
                          <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" />
                            Verified
                          </span>
                        )}
                        {step.retryCount > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                            Recovered ({step.retryCount} retry)
                          </span>
                        )}
                      </div>
                      {step.errorMessage && (
                        <p className="text-xs text-amber-700 font-medium mt-1">{step.errorMessage}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        step.status === 'COMPLETED'
                          ? 'text-emerald-700 bg-emerald-50'
                          : step.status === 'FAILED'
                          ? 'text-red-700 bg-red-50'
                          : step.stepType === 'APPROVAL_GATE'
                          ? 'text-amber-700 bg-amber-50 animate-pulse'
                          : 'text-blue-700 bg-blue-50'
                      }`}
                    >
                      {step.status}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Step Details */}
                {isExpanded && (
                  <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3 text-xs">
                    {/* Tool Input */}
                    {inputObj && (
                      <div>
                        <span className="font-semibold text-slate-700 uppercase tracking-wider text-[10px] block mb-1">
                          Validated Input Parameters
                        </span>
                        <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg overflow-x-auto font-mono text-[11px]">
                          {JSON.stringify(inputObj, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Tool Output */}
                    {outputObj && (
                      <div>
                        <span className="font-semibold text-slate-700 uppercase tracking-wider text-[10px] block mb-1">
                          Execution Output
                        </span>
                        <pre className="p-3 bg-slate-900 text-slate-100 rounded-lg overflow-x-auto font-mono text-[11px]">
                          {JSON.stringify(outputObj, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* Independent Verification Evidence */}
                    {evidenceObj && (
                      <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-lg">
                        <div className="flex items-center space-x-1.5 text-emerald-900 font-semibold mb-1">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Independent Database Verification Evidence</span>
                        </div>
                        <p className="text-slate-600 mb-2">
                          Verified through direct query against application database rather than model verbal assertions:
                        </p>
                        <pre className="p-2.5 bg-white border border-emerald-200 text-emerald-950 rounded font-mono text-[11px]">
                          {JSON.stringify(evidenceObj, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

