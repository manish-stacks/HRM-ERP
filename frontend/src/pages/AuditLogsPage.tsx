import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [purgeStatus, setPurgeStatus] = useState<string | null>(null);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/audit-logs');
      if (res.data?.success) setLogs(res.data.data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleManualPurge = async () => {
    if (confirm('Run 1-week retention cleanup? This will permanently delete all audit log records older than 7 days.')) {
      try {
        const res = await api.post('/reports/audit-logs/purge');
        if (res.data?.success) {
          setPurgeStatus(res.data.message);
          loadLogs();
          setTimeout(() => setPurgeStatus(null), 4000);
        }
      } catch (err: any) {
        alert(err.response?.data?.message || 'Purge failed');
      }
    }
  };

  const exportAuditLogsCSV = () => {
    if (filteredLogs.length === 0) return;
    const headers = ['Timestamp (UTC)', 'User', 'Module', 'Action', 'Entity', 'IP Address'];
    const rows = filteredLogs.map((log) => [
      `"${new Date(log.createdAt).toISOString()}"`,
      `"${log.user?.email || 'SYSTEM_ENGINE'}"`,
      `"${log.module}"`,
      `"${log.action}"`,
      `"${log.entityName || ''}"`,
      `"${log.ipAddress || '127.0.0.1'}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const modulesList = Array.from(new Set(logs.map((l) => l.module))).filter(Boolean);

  const filteredLogs = logs.filter((log) => {
    const userEmail = (log.user?.email || 'SYSTEM_ENGINE').toLowerCase();
    const action = (log.action || '').toLowerCase();
    const entity = (log.entityName || '').toLowerCase();
    const ip = (log.ipAddress || '').toLowerCase();
    const module = (log.module || '').toLowerCase();

    const matchesSearch =
      userEmail.includes(searchQuery.toLowerCase()) ||
      action.includes(searchQuery.toLowerCase()) ||
      entity.includes(searchQuery.toLowerCase()) ||
      ip.includes(searchQuery.toLowerCase()) ||
      module.includes(searchQuery.toLowerCase());

    const matchesModule = moduleFilter === 'ALL' || log.module === moduleFilter;
    return matchesSearch && matchesModule;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Security & Compliance Audit Trail</h1>
          <p className="text-sm text-slate-500">
            Immutable ledger of administrative actions, authentication attempts, and data modifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasRole('Super Admin', 'Org Admin', 'HR Admin', 'Auditor') && (
            <button
              onClick={handleManualPurge}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold shadow-xs transition"
              title="Purge logs older than 7 days"
            >
              <Trash2 className="w-3.5 h-3.5" /> Purge Expired Logs (&gt; 7 Days)
            </button>
          )}

          <button
            onClick={exportAuditLogsCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" /> Export CSV
          </button>
        </div>
      </div>

      {/* Retention Notice & Status */}
      <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-blue-900">
        <div className="flex items-center gap-2 font-medium">
          <Clock className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            <strong>1-Week Auto-Retention Policy Active:</strong> Audit log records older than 7 days are automatically deleted by the background cleanup engine to optimize storage.
          </span>
        </div>
        <span className="px-2 py-0.5 rounded font-mono font-bold bg-blue-100 text-blue-800 text-[10px] w-fit">
          7-DAY RETENTION
        </span>
      </div>

      {purgeStatus && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{purgeStatus}</span>
        </div>
      )}

      {/* Audit Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Filters Header */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Audit Events</h2>
            <span className="text-xs text-slate-500 font-medium">({filteredLogs.length} events logged)</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search user, action, IP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Modules</option>
                {modulesList.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Timestamp (UTC)</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Module</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Entity</th>
                <th className="px-6 py-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400 font-sans">
                    Loading audit trail...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400 font-sans">
                    No audit records matching your search.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 font-sans font-semibold text-slate-900">
                      {log.user?.email || 'SYSTEM_ENGINE'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[11px]">
                        {log.module}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {log.action}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {log.entityName}
                    </td>
                    <td className="px-6 py-4 text-slate-400">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
