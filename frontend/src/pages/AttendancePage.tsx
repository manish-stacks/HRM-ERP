import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Filter,
  Plus,
  Check,
  X,
  FileEdit,
  ArrowRight,
  Download,
  Search
} from 'lucide-react';

export const AttendancePage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'TODAY' | 'HISTORY' | 'CORRECTIONS'>('TODAY');
  const [todayData, setTodayData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [corrections, setCorrections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchEmployee, setSearchEmployee] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Correction Modal
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [correctionForm, setCorrectionForm] = useState({
    date: new Date().toISOString().split('T')[0],
    requestedIn: '',
    requestedOut: '',
    reason: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [todayRes, histRes, corrRes] = await Promise.all([
        api.get('/attendance/today'),
        api.get('/attendance/history'),
        api.get('/attendance/corrections')
      ]);

      if (todayRes.data?.success) setTodayData(todayRes.data.data);
      if (histRes.data?.success) setHistory(histRes.data.data);
      if (corrRes.data?.success) setCorrections(corrRes.data.data);
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleManualPunch = async (punchType: 'CHECK_IN' | 'CHECK_OUT') => {
    try {
      const res = await api.post('/attendance/punch', { punchType, source: 'WEB' });
      if (res.data?.success) {
        alert(res.data.message);
        loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Punch failed');
    }
  };

  const handleApplyCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const inTime = correctionForm.requestedIn ? `${correctionForm.date}T${correctionForm.requestedIn}:00.000Z` : undefined;
      const outTime = correctionForm.requestedOut ? `${correctionForm.date}T${correctionForm.requestedOut}:00.000Z` : undefined;

      const res = await api.post('/attendance/correction', {
        date: correctionForm.date,
        requestedIn: inTime,
        requestedOut: outTime,
        reason: correctionForm.reason
      });

      if (res.data?.success) {
        setShowCorrectionModal(false);
        setCorrectionForm({ date: new Date().toISOString().split('T')[0], requestedIn: '', requestedOut: '', reason: '' });
        loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit correction');
    }
  };

  const handleActionCorrection = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await api.post(`/attendance/corrections/${id}/approve`, { status });
      if (res.data?.success) {
        loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  const exportAttendanceCSV = () => {
    let csv = 'Date,Employee Code,Employee Name,Check In,Check Out,Actual Minutes,Late Minutes,Status\n';
    const sourceList = activeTab === 'HISTORY' ? history : (todayData?.records || []);
    sourceList.forEach((r: any) => {
      const inTime = r.firstCheckIn ? new Date(r.firstCheckIn).toLocaleTimeString() : 'N/A';
      const outTime = r.lastCheckOut ? new Date(r.lastCheckOut).toLocaleTimeString() : 'N/A';
      csv += `"${new Date(r.date).toLocaleDateString()}","${r.employee?.employeeCode}","${r.employee?.firstName} ${r.employee?.lastName}","${inTime}","${outTime}",${r.actualMinutes || 0},${r.lateMinutes || 0},"${r.status}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_records_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance & Time Management</h1>
          <p className="text-sm text-slate-500">Live workplace punch logging, shift scheduled hours, and discrepancy corrections.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportAttendanceCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button
            onClick={() => handleManualPunch('CHECK_IN')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            Quick Web Check-In
          </button>
          <button
            onClick={() => handleManualPunch('CHECK_OUT')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition"
          >
            Quick Web Check-Out
          </button>
          <button
            onClick={() => setShowCorrectionModal(true)}
            className="px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
          >
            <FileEdit className="w-3.5 h-3.5" /> Request Correction
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('TODAY')}
          className={`pb-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'TODAY'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Today's Live Register
        </button>
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`pb-3 text-sm font-semibold border-b-2 transition ${
            activeTab === 'HISTORY'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Historical Attendance Log
        </button>
        <button
          onClick={() => setActiveTab('CORRECTIONS')}
          className={`pb-3 text-sm font-semibold border-b-2 transition flex items-center gap-1.5 ${
            activeTab === 'CORRECTIONS'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Correction Requests
          {corrections.filter(c => c.status === 'PENDING').length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
              {corrections.filter(c => c.status === 'PENDING').length}
            </span>
          )}
        </button>
      </div>

      {/* Filter Bar for Register */}
      {activeTab !== 'CORRECTIONS' && (
        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter by employee name or code..."
              value={searchEmployee}
              onChange={(e) => setSearchEmployee(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
          >
            <option value="">All Statuses</option>
            <option value="PRESENT">Present</option>
            <option value="ABSENT">Absent</option>
            <option value="HALF_DAY">Half Day</option>
            <option value="ON_LEAVE">On Leave</option>
          </select>
        </div>
      )}

      {/* Tab 1: Today's Live Register */}
      {activeTab === 'TODAY' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">First Check-In</th>
                <th className="px-6 py-4">Last Check-Out</th>
                <th className="px-6 py-4">Worked Minutes</th>
                <th className="px-6 py-4">Late Arrivals</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Loading live punches...</td>
                </tr>
              ) : todayData?.records?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">No punches recorded for today yet.</td>
                </tr>
              ) : (
                todayData?.records?.filter((r: any) => {
                  const empName = `${r.employee?.firstName} ${r.employee?.lastName}`.toLowerCase();
                  const empCode = (r.employee?.employeeCode || '').toLowerCase();
                  const matchesSearch = empName.includes(searchEmployee.toLowerCase()) || empCode.includes(searchEmployee.toLowerCase());
                  const matchesStatus = statusFilter ? r.status === statusFilter : true;
                  return matchesSearch && matchesStatus;
                }).map((rec: any) => (
                  <tr key={rec.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{rec.employee?.firstName} {rec.employee?.lastName}</div>
                      <div className="text-xs text-slate-400 font-mono">{rec.employee?.employeeCode} • {rec.employee?.department?.name}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono font-medium text-slate-800">
                      {rec.firstCheckIn ? new Date(rec.firstCheckIn).toLocaleTimeString() : '—'}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono font-medium text-slate-800">
                      {rec.lastCheckOut ? new Date(rec.lastCheckOut).toLocaleTimeString() : 'In Progress'}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-slate-700">
                      {rec.actualMinutes} mins ({Math.floor(rec.actualMinutes / 60)}h {rec.actualMinutes % 60}m)
                    </td>
                    <td className="px-6 py-4">
                      {rec.lateMinutes > 0 ? (
                        <span className="text-xs font-semibold text-amber-600">+{rec.lateMinutes} mins late</span>
                      ) : (
                        <span className="text-xs text-emerald-600 font-medium">On time</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        rec.status === 'PRESENT'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {rec.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Historical Log */}
      {activeTab === 'HISTORY' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">In / Out</th>
                <th className="px-6 py-4">Scheduled vs Actual</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.filter((h) => {
                const empName = `${h.employee?.firstName} ${h.employee?.lastName}`.toLowerCase();
                const empCode = (h.employee?.employeeCode || '').toLowerCase();
                const matchesSearch = empName.includes(searchEmployee.toLowerCase()) || empCode.includes(searchEmployee.toLowerCase());
                const matchesStatus = statusFilter ? h.status === statusFilter : true;
                return matchesSearch && matchesStatus;
              }).map((h) => (
                <tr key={h.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-6 py-4 text-xs font-medium text-slate-800">
                    {new Date(h.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{h.employee?.firstName} {h.employee?.lastName}</div>
                    <div className="text-xs text-slate-400 font-mono">{h.employee?.employeeCode}</div>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono">
                    {h.firstCheckIn ? new Date(h.firstCheckIn).toLocaleTimeString() : '—'} /{' '}
                    {h.lastCheckOut ? new Date(h.lastCheckOut).toLocaleTimeString() : '—'}
                  </td>
                  <td className="px-6 py-4 text-xs">
                    {h.actualMinutes}m / {h.scheduledMinutes}m
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700">
                      {h.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: Corrections Queue */}
      {activeTab === 'CORRECTIONS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Target Date</th>
                <th className="px-6 py-4">Requested Punch Times</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {corrections.map((corr) => (
                <tr key={corr.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{corr.employee?.firstName} {corr.employee?.lastName}</div>
                    <div className="text-xs text-slate-400 font-mono">{corr.employee?.employeeCode}</div>
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-800">
                    {new Date(corr.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-xs font-mono">
                    In: {corr.requestedIn ? new Date(corr.requestedIn).toLocaleTimeString() : 'Keep'}<br />
                    Out: {corr.requestedOut ? new Date(corr.requestedOut).toLocaleTimeString() : 'Keep'}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-600 max-w-xs truncate">
                    {corr.reason}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                      corr.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                      corr.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {corr.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {corr.status === 'PENDING' && hasRole('Super Admin', 'HR Admin', 'Department Manager') ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleActionCorrection(corr.id, 'APPROVED')}
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition"
                          title="Approve"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleActionCorrection(corr.id, 'REJECTED')}
                          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                          title="Reject"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Processed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Request Correction Modal */}
      {showCorrectionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Request Attendance Correction</h2>
              <button onClick={() => setShowCorrectionModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyCorrection} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date to Correct</label>
                <input
                  type="date"
                  required
                  value={correctionForm.date}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, date: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Requested Check-In</label>
                  <input
                    type="time"
                    value={correctionForm.requestedIn}
                    onChange={(e) => setCorrectionForm({ ...correctionForm, requestedIn: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Requested Check-Out</label>
                  <input
                    type="time"
                    value={correctionForm.requestedOut}
                    onChange={(e) => setCorrectionForm({ ...correctionForm, requestedOut: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Adjustment</label>
                <textarea
                  required
                  rows={3}
                  value={correctionForm.reason}
                  onChange={(e) => setCorrectionForm({ ...correctionForm, reason: e.target.value })}
                  placeholder="e.g. Card reader hardware failure at NYC Floor 12 turnstile"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

