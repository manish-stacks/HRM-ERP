import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  CalendarCheck,
  Plus,
  Check,
  X,
  FileText,
  Clock,
  ShieldCheck,
  AlertCircle,
  Download,
  Search,
  Filter
} from 'lucide-react';

export const LeavePage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Apply Modal
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyForm, setApplyForm] = useState({
    leaveTypeId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    daysCount: 1,
    isHalfDay: false,
    reason: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [typeRes, balRes, reqRes] = await Promise.all([
        api.get('/leaves/types'),
        api.get('/leaves/balances'),
        api.get('/leaves/requests')
      ]);

      if (typeRes.data?.success) setLeaveTypes(typeRes.data.data);
      if (balRes.data?.success) setBalances(balRes.data.data);
      if (reqRes.data?.success) setRequests(reqRes.data.data);
    } catch (err) {
      console.error('Failed to load leave data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/leaves/apply', applyForm);
      if (res.data?.success) {
        setShowApplyModal(false);
        setApplyForm({
          leaveTypeId: '',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          daysCount: 1,
          isHalfDay: false,
          reason: ''
        });
        loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit leave request');
    }
  };

  const handleActionLeave = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await api.post(`/leaves/requests/${id}/action`, { status });
      if (res.data?.success) {
        loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  const exportLeavesCSV = () => {
    if (requests.length === 0) return;
    const headers = ['Employee Code', 'Employee Name', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Reason', 'Status'];
    const rows = filteredRequests.map(r => [
      `"${r.employee?.employeeCode || ''}"`,
      `"${r.employee?.firstName || ''} ${r.employee?.lastName || ''}"`,
      `"${r.leaveType?.name || ''}"`,
      `"${new Date(r.startDate).toISOString().split('T')[0]}"`,
      `"${new Date(r.endDate).toISOString().split('T')[0]}"`,
      r.daysCount,
      `"${(r.reason || '').replace(/"/g, '""')}"`,
      r.status
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `leaves_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRequests = requests.filter(req => {
    const fullName = `${req.employee?.firstName || ''} ${req.employee?.lastName || ''}`.toLowerCase();
    const empCode = (req.employee?.employeeCode || '').toLowerCase();
    const reason = (req.reason || '').toLowerCase();
    const leaveName = (req.leaveType?.name || '').toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) ||
      empCode.includes(searchQuery.toLowerCase()) ||
      reason.includes(searchQuery.toLowerCase()) ||
      leaveName.includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Leave & Absence Management</h1>
          <p className="text-sm text-slate-500">Track paid annual entitlements, medical leaves, and multi-tier approval workflows.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportLeavesCSV}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium shadow-xs transition"
          >
            <Download className="w-4 h-4 text-slate-500" /> Export CSV
          </button>
          <button
            onClick={() => setShowApplyModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> Apply for Leave
          </button>
        </div>
      </div>

      {/* Leave Balances Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {balances.map((bal) => (
          <div key={bal.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{bal.leaveType?.name}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                {bal.leaveType?.isPaid ? 'PAID' : 'UNPAID'}
              </span>
            </div>
            <div className="text-3xl font-extrabold text-slate-900">
              {Number(bal.balance)} <span className="text-xs font-medium text-slate-400">days left</span>
            </div>
            <div className="text-xs text-slate-500 pt-2 border-t border-slate-100 flex justify-between">
              <span>Taken: <strong>{Number(bal.taken)}d</strong></span>
              <span>Accrued: <strong>{Number(bal.accrued)}d</strong></span>
              <span>Quota: <strong>{Number(bal.leaveType?.annualQuota)}d</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* Leave Requests Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Leave Applications & Approvals</h2>
            <span className="text-xs text-slate-500 font-medium">({filteredRequests.length} records)</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search employee or leave..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 text-slate-700 text-xs rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Leave Type</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Days</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">Loading leave requests...</td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">No leave requests matching your filters.</td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{req.employee?.firstName} {req.employee?.lastName}</div>
                      <div className="text-xs text-slate-400 font-mono">{req.employee?.employeeCode}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800 text-xs">
                      {req.leaveType?.name}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-700">
                      {new Date(req.startDate).toLocaleDateString()} to {new Date(req.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-800">
                      {Number(req.daysCount)} {Number(req.daysCount) === 1 ? 'day' : 'days'}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 max-w-xs truncate">
                      {req.reason}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                        req.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                        req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {req.status === 'PENDING' && hasRole('Super Admin', 'HR Admin', 'Department Manager') ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleActionLeave(req.id, 'APPROVED')}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition"
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleActionLeave(req.id, 'REJECTED')}
                            className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Archived</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Submit Leave Application</h2>
              <button onClick={() => setShowApplyModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplyLeave} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Leave Type</label>
                <select
                  required
                  value={applyForm.leaveTypeId}
                  onChange={(e) => setApplyForm({ ...applyForm, leaveTypeId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="">Select Leave Category</option>
                  {leaveTypes.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.annualQuota}d annual quota)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={applyForm.startDate}
                    onChange={(e) => setApplyForm({ ...applyForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={applyForm.endDate}
                    onChange={(e) => setApplyForm({ ...applyForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Total Days</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  required
                  value={applyForm.daysCount}
                  onChange={(e) => setApplyForm({ ...applyForm, daysCount: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Absence</label>
                <textarea
                  required
                  rows={3}
                  value={applyForm.reason}
                  onChange={(e) => setApplyForm({ ...applyForm, reason: e.target.value })}
                  placeholder="Provide context for manager approval..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

