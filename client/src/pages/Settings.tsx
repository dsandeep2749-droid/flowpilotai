import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Settings as SettingsIcon, Sparkles, Database, Shield, RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get<any>('/settings');
      setSettings(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleResetDemoData = async () => {
    if (!confirm('This will wipe all existing workflows, orders, and restocks, and reseed the clean demonstration dataset. Proceed?')) {
      return;
    }

    setResetting(true);
    setMessage('');
    setError('');

    try {
      const res = await api.post<{ message: string }>('/settings/reset-demo');
      setMessage(res.message);
      fetchSettings();
    } catch (err: any) {
      setError(err.message || 'Failed to reset demo data');
    } finally {
      setResetting(false);
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings & Governance</h1>
        <p className="text-sm text-slate-500 mt-1">
          Engine configuration, AI integration telemetry, and demonstration sandbox management.
        </p>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Supabase Cloud Database Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-3">
          <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            ⚡
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">Supabase Cloud Database Connection</h2>
            <p className="text-xs text-slate-500">PostgreSQL cloud persistence uniting backend and frontend</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
            <span className="text-slate-400 font-medium">Supabase Project Ref</span>
            <div className="font-mono font-semibold text-slate-900">bbwkxypbomsajgxlckfr</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
            <span className="text-slate-400 font-medium">Database State</span>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-semibold text-slate-900">Cloud Linked (REST & SQL)</span>
            </div>
          </div>
        </div>

        <div className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs text-emerald-950 space-y-1.5">
          <div className="font-bold">Supabase PostgreSQL Schema Script Ready:</div>
          <p className="text-emerald-900 leading-relaxed">
            All 14 tables (User, Order, Product, Shipment, Workflow, Approval, Audit, etc.) are compiled in <code className="bg-white px-1 py-0.5 rounded border border-emerald-200 font-mono">server/prisma/supabase_schema.sql</code>.
            You can paste this script into your Supabase Dashboard's <strong>SQL Editor</strong> to execute schema updates instantly.
          </p>
        </div>
      </div>

      {/* AI Integration Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-3">
          <span className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">AI Intelligence Engine</h2>
            <p className="text-xs text-slate-500">Google Gemini API configuration and reasoning fallback</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
            <span className="text-slate-400 font-medium">Provider & Model</span>
            <div className="font-semibold text-slate-900">{settings?.aiProvider?.toUpperCase() || 'GEMINI'} • {settings?.aiModel || 'gemini-2.5-flash'}</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
            <span className="text-slate-400 font-medium">Engine Status</span>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span className="font-semibold text-slate-900">
                {settings?.isLiveAiConfigured ? 'Live AI Mode Active' : 'Deterministic Demo Mode (Rule-Based)'}
              </span>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-2">
          <p className="font-semibold text-slate-800">Switching between Live AI and Demo Mode:</p>
          <p className="leading-relaxed">
            By default, FlowPilot AI operates with its deterministic <strong>Rule-Based Demo Engine</strong> which reliably reproduces the full order investigation lifecycle without requiring a paid API key.
          </p>
          <p className="leading-relaxed">
            To enable live Gemini reasoning, set <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-indigo-600">GEMINI_API_KEY=your_key_here</code> and <code className="bg-white px-1.5 py-0.5 rounded border border-slate-200 font-mono text-indigo-600">ENABLE_DEMO_MODE=false</code> in <code className="font-mono">server/.env</code> and restart the server.
          </p>
        </div>
      </div>

      {/* Database & Sandbox Reset Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-3">
          <span className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-base font-bold text-slate-900">Demonstration Dataset Management</h2>
            <p className="text-xs text-slate-500">Reset sandbox database state for fresh demo walkthroughs</p>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Wipes any ad-hoc workflows and reseeds the original 16 realistic orders (with delayed items, stock shortages, carrier exceptions, and seeded approval gates).
        </p>

        <div className="pt-2 flex items-center justify-between">
          <div>
            {!isAdmin && (
              <span className="text-xs text-amber-700 font-semibold">
                * Administrator privileges required to reseed dataset.
              </span>
            )}
          </div>
          <button
            onClick={handleResetDemoData}
            disabled={!isAdmin || resetting}
            className="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors disabled:opacity-40"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
            {resetting ? 'Reseeding Dataset...' : 'Reset Demonstration Dataset'}
          </button>
        </div>
      </div>
    </div>
  );
};

