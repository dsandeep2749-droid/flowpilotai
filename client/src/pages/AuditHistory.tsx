import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AuditEvent } from '../types';
import { ShieldCheck, Search, Filter, Clock, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export const AuditHistory: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventType, setEventType] = useState('ALL');
  const [actorEmail, setActorEmail] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (eventType !== 'ALL') params.append('eventType', eventType);
      if (actorEmail) params.append('actorEmail', actorEmail);

      const data = await api.get<{ events: AuditEvent[] }>(`/audit-events?${params.toString()}`);
      setEvents(data.events);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [eventType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEvents();
  };

  const parseDetails = (details: any) => {
    if (!details) return null;
    if (typeof details === 'object') return details;
    try {
      return JSON.parse(details);
    } catch {
      return details;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit History & Provenance</h1>
          <p className="text-sm text-slate-500 mt-1">
            Immutable, append-oriented audit log tracking all autonomous decisions, tool executions, and authorizations.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={actorEmail}
            onChange={(e) => setActorEmail(e.target.value)}
            placeholder="Filter by actor email..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
          />
        </form>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700"
          >
            <option value="ALL">All Event Types</option>
            <option value="WORKFLOW_CREATED">WORKFLOW_CREATED</option>
            <option value="PLAN_GENERATED">PLAN_GENERATED</option>
            <option value="APPROVAL_REQUESTED">APPROVAL_REQUESTED</option>
            <option value="APPROVAL_GRANTED">APPROVAL_GRANTED</option>
            <option value="APPROVAL_REJECTED">APPROVAL_REJECTED</option>
            <option value="TOOL_EXECUTED">TOOL_EXECUTED</option>
            <option value="RECOVERY_COMPLETED">RECOVERY_COMPLETED</option>
            <option value="USER_LOGIN">USER_LOGIN</option>
          </select>
        </div>
      </div>

      {/* Audit Events Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">No audit events found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Workflow / Entity</th>
                  <th className="py-3 px-4">Outcome</th>
                  <th className="py-3 px-4 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {events.map((ev) => (
                  <tr
                    key={ev.id}
                    onClick={() => setSelectedEvent(ev)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 text-slate-500">
                      {new Date(ev.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {ev.eventType}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-700">
                      <div>{ev.actorEmail || 'System Agent'}</div>
                      {ev.actorRole && (
                        <span className="text-[10px] text-slate-400 font-mono">[{ev.actorRole}]</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {ev.workflowId ? `Workflow: ${ev.workflowId.slice(0, 8)}` : ev.entityType || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                          ev.outcome === 'SUCCESS'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ev.outcome === 'FAILURE' || ev.outcome === 'DENIED'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ev.outcome}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button className="text-indigo-600 hover:text-indigo-800 font-sans font-semibold">
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="font-mono text-xs text-slate-400">Audit Trail Entry</span>
                <h3 className="text-base font-bold text-slate-900">{selectedEvent.eventType}</h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600">
              <div><strong>Recorded At:</strong> {new Date(selectedEvent.createdAt).toISOString()}</div>
              <div><strong>Actor:</strong> {selectedEvent.actorEmail || 'FlowPilot Coordinator'}</div>
              <div><strong>Role:</strong> {selectedEvent.actorRole || 'SYSTEM'}</div>
              {selectedEvent.workflowId && (
                <div><strong>Workflow ID:</strong> <span className="font-mono">{selectedEvent.workflowId}</span></div>
              )}
            </div>

            <div>
              <span className="font-semibold text-xs text-slate-700 block mb-1">
                Sanitized Payload & Metadata:
              </span>
              <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl overflow-x-auto font-mono text-[11px] max-h-64">
                {JSON.stringify(parseDetails(selectedEvent.details), null, 2)}
              </pre>
            </div>

            <button
              onClick={() => setSelectedEvent(null)}
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

