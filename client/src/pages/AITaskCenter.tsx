import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Eye,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';

const PRESET_OBJECTIVES = [
  {
    title: 'Intelligent Order Delay Resolution (Primary Hackathon Scenario)',
    prompt:
      'Investigate all delayed orders, identify their causes, prioritize them, and resolve the issues wherever possible.',
    tag: 'Recommended',
  },
  {
    title: 'Audit Inventory Deficits & Restock Depleted SKUs',
    prompt:
      'Inspect all warehouse inventory levels below reorder threshold and formulate emergency supplier restock requests.',
    tag: 'Inventory',
  },
  {
    title: 'Logistics Carrier Webhook Sync & Resilient Self-Healing',
    prompt:
      'Synchronize carrier dispatch tracking with automated retry, idempotency safeguards, and independent verification.',
    tag: 'Recovery Demo',
  },
];

export const AITaskCenter: React.FC = () => {
  const location = useLocation();
  const prefill = location.state?.prefillOrder
    ? `Investigate delayed order ${location.state.prefillOrder}, determine root causes across inventory and logistics, and propose corrective actions.`
    : '';

  const [objective, setObjective] = useState(
    prefill || 'Investigate all delayed orders, identify their causes, prioritize them, and resolve the issues wherever possible.'
  );
  const [executionMode, setExecutionMode] = useState<'PLAN_ONLY' | 'ASSISTED' | 'AUTHORIZED_AUTOMATION'>('ASSISTED');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!objective.trim()) return;

    setError('');
    setLoading(true);

    try {
      const response = await api.post<{ workflow: { id: string } }>('/workflows', {
        objective,
        executionMode,
        workflowType: 'ORDER_DELAY_RESOLUTION',
      });

      // Navigate to live workflow monitor!
      navigate(`/workflows/${response.workflow.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to start AI workflow');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-navy-950 via-slate-900 to-indigo-950 p-8 rounded-3xl text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Autonomous Orchestration Workspace</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Transform Problems into Verified Outcomes
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Specify a high-level operational objective. FlowPilot AI investigates warehouse records,
            evaluates business rules, formulates an ordered resolution plan, and executes authorized
            actions with independent result verification.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Task Form */}
      <form onSubmit={handleLaunch} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div>
          <label className="block text-sm font-bold text-slate-900 mb-2">
            Describe Your Operational Objective
          </label>
          <textarea
            rows={4}
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            placeholder="e.g., Investigate delayed orders, identify causes, and prepare restock or carrier reroute actions..."
            className="w-full p-4 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 font-normal leading-relaxed text-slate-800 placeholder:text-slate-400"
            required
          />
        </div>

        {/* Preset Prompt Buttons */}
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            Preset Demonstration Scenarios
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PRESET_OBJECTIVES.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setObjective(item.prompt)}
                className="text-left p-3 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all text-xs group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-800 group-hover:text-indigo-700">
                    {item.title}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-800">
                    {item.tag}
                  </span>
                </div>
                <p className="text-slate-500 line-clamp-2">{item.prompt}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Execution Mode Radio Selector */}
        <div>
          <label className="block text-sm font-bold text-slate-900 mb-3">
            Select Autonomous Execution Mode
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Mode 1: Plan Only */}
            <label
              className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                executionMode === 'PLAN_ONLY'
                  ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-900 flex items-center">
                    <Eye className="w-4 h-4 mr-1.5 text-slate-600" />
                    Plan Only
                  </span>
                  <input
                    type="radio"
                    name="executionMode"
                    value="PLAN_ONLY"
                    checked={executionMode === 'PLAN_ONLY'}
                    onChange={() => setExecutionMode('PLAN_ONLY')}
                    className="text-indigo-600"
                  />
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Performs read-only investigation and generates structured actions without mutating database state.
                </p>
              </div>
              <span className="text-[10px] font-semibold text-slate-600 mt-3 inline-block">Safe Simulation</span>
            </label>

            {/* Mode 2: Assisted Execution */}
            <label
              className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                executionMode === 'ASSISTED'
                  ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-900 flex items-center">
                    <ShieldCheck className="w-4 h-4 mr-1.5 text-indigo-600" />
                    Assisted Execution
                  </span>
                  <input
                    type="radio"
                    name="executionMode"
                    value="ASSISTED"
                    checked={executionMode === 'ASSISTED'}
                    onChange={() => setExecutionMode('ASSISTED')}
                    className="text-indigo-600"
                  />
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Prepares proposed actions and pauses workflow at approval gates whenever human authority is required.
                </p>
              </div>
              <span className="text-[10px] font-semibold text-indigo-700 mt-3 inline-block">
                Recommended for Enterprise
              </span>
            </label>

            {/* Mode 3: Authorized Automation */}
            <label
              className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                executionMode === 'AUTHORIZED_AUTOMATION'
                  ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-slate-900 flex items-center">
                    <Zap className="w-4 h-4 mr-1.5 text-amber-500" />
                    Authorized Automation
                  </span>
                  <input
                    type="radio"
                    name="executionMode"
                    value="AUTHORIZED_AUTOMATION"
                    checked={executionMode === 'AUTHORIZED_AUTOMATION'}
                    onChange={() => setExecutionMode('AUTHORIZED_AUTOMATION')}
                    className="text-indigo-600"
                  />
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Executes low and medium risk actions automatically. High risk actions still mandate approval.
                </p>
              </div>
              <span className="text-[10px] font-semibold text-amber-700 mt-3 inline-block">Policy Constrained</span>
            </label>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Deterministic backend policy checks enforce safety allowlist</span>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50"
          >
            {loading ? (
              <span>Initiating Agent Coordinator...</span>
            ) : (
              <>
                <span>Launch Workflow Orchestration</span>
                <ArrowRight className="ml-2 w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

