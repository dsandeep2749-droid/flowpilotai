import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { ApprovalRequest } from '../types';
import {
  CheckSquare,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ShieldAlert,
  Clock,
  User,
  MessageSquare,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Approvals: React.FC = () => {
  const { user } = useAuth();
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');

  // Decision Modal State
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [decisionType, setDecisionType] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const data = await api.get<{ approvals: ApprovalRequest[] }>(
        `/approvals?status=${statusFilter}`
      );
      setApprovals(data.approvals);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [statusFilter]);

  const openDecisionModal = (approval: ApprovalRequest, type: 'APPROVE' | 'REJECT') => {
    setSelectedApproval(approval);
    setDecisionType(type);
    setComment(type === 'APPROVE' ? 'Approved by operational authority.' : '');
    setModalError('');
  };

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApproval || !decisionType) return;

    setModalError('');
    setSubmitting(true);

    try {
      if (decisionType === 'APPROVE') {
        await api.post(`/approvals/${selectedApproval.id}/approve`, { comment });
      } else {
        await api.post(`/approvals/${selectedApproval.id}/reject`, { comment });
      }

      setSelectedApproval(null);
      setDecisionType(null);
      fetchApprovals();
    } catch (err: any) {
      setModalError(err.message || 'Decision failed');
    } finally {
      setSubmitting(false);
    }
  };

  const isAuthorizedToDecide = user?.role === 'MANAGER' || user?.role === 'ADMIN';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Human Approval Center</h1>
          <p className="text-sm text-slate-500 mt-1">
            Governance gate for sensitive operational actions, supplier restocks, and carrier reroutes.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500">Your Approval Authority:</span>
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-bold ${
              isAuthorizedToDecide
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {isAuthorizedToDecide ? 'Authorized (Manager/Admin)' : 'Read-Only (Operator)'}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-slate-200">
        {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors ${
              statusFilter === tab
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Operator notice if unauthorized */}
      {!isAuthorizedToDecide && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              You are signed in as an <strong>OPERATOR</strong>. Decision controls are disabled. Use the
              navigation menu to switch to a <strong>MANAGER</strong> or <strong>ADMIN</strong> account to approve requests.
            </span>
          </div>
        </div>
      )}

      {/* Approvals Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : approvals.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-sm text-slate-500">
            No approval requests found matching the current filter.
          </div>
        ) : (
          approvals.map((appr) => (
            <div
              key={appr.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:border-slate-300 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <span className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <CheckSquare className="w-5 h-5" />
                  </span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-slate-900 uppercase">
                        {appr.actionType.replace(/_/g, ' ')}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          appr.riskLevel === 'CRITICAL' || appr.riskLevel === 'HIGH'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {appr.riskLevel} RISK
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          appr.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : appr.status === 'REJECTED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {appr.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Target Entity: <span className="font-mono text-slate-700">{appr.targetEntityId}</span>
                    </div>
                  </div>
                </div>

                {/* Approve / Reject buttons */}
                {appr.status === 'PENDING' && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openDecisionModal(appr, 'REJECT')}
                      disabled={!isAuthorizedToDecide}
                      className="px-3 py-1.5 border border-red-200 text-red-700 hover:bg-red-50 text-xs font-semibold rounded-lg transition-colors disabled:opacity-40"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => openDecisionModal(appr, 'APPROVE')}
                      disabled={!isAuthorizedToDecide}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-40"
                    >
                      Authorize Action
                    </button>
                  </div>
                )}
              </div>

              {/* Rationale and Impact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="font-semibold text-slate-700 block mb-1">Operational Justification:</span>
                  <p className="text-slate-600 leading-relaxed">{appr.reason}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="font-semibold text-slate-700 block mb-1">Anticipated Impact:</span>
                  <p className="text-slate-600 leading-relaxed">{appr.expectedImpact}</p>
                </div>
              </div>

              {/* Decision comment if approved or rejected */}
              {appr.decisionComment && (
                <div
                  className={`p-3 rounded-xl text-xs ${
                    appr.status === 'APPROVED'
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-red-50 text-red-900 border border-red-200'
                  }`}
                >
                  <span className="font-semibold">Decision Record:</span> "{appr.decisionComment}" by{' '}
                  {appr.approver?.name || 'Authorized Manager'} at{' '}
                  {appr.decisionAt ? new Date(appr.decisionAt).toLocaleString() : ''}
                </div>
              )}

              {/* Footer metadata */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-400">
                <div className="flex items-center space-x-4">
                  <span>Requested by: {appr.requester?.name || 'FlowPilot Agent'}</span>
                  <span>•</span>
                  <span>Requested: {new Date(appr.createdAt).toLocaleString()}</span>
                </div>
                {appr.workflow && (
                  <Link
                    to={`/workflows/${appr.workflow.id}`}
                    className="font-semibold text-indigo-600 hover:text-indigo-700 flex items-center"
                  >
                    View Workflow
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Decision Modal */}
      {selectedApproval && decisionType && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {decisionType === 'APPROVE' ? 'Authorize Proposed Action' : 'Reject Action Proposal'}
              </h3>
              <button
                onClick={() => setSelectedApproval(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg">{modalError}</div>
            )}

            <div className="space-y-2 text-xs text-slate-600">
              <p>
                <strong>Action:</strong> {selectedApproval.actionType}
              </p>
              <p>
                <strong>Target:</strong> {selectedApproval.targetEntityId}
              </p>
              <p>
                <strong>Risk Level:</strong> {selectedApproval.riskLevel}
              </p>
            </div>

            <form onSubmit={handleDecisionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  {decisionType === 'APPROVE' ? 'Approval Note (Optional)' : 'Rejection Reason (Required)'}
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required={decisionType === 'REJECT'}
                  placeholder={
                    decisionType === 'APPROVE'
                      ? 'Approved for fulfillment...'
                      : 'State clear operational grounds for rejection...'
                  }
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedApproval(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-4 py-2 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors ${
                    decisionType === 'APPROVE'
                      ? 'bg-indigo-600 hover:bg-indigo-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {submitting
                    ? 'Recording Decision...'
                    : decisionType === 'APPROVE'
                    ? 'Confirm Authorization'
                    : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

