import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  CalendarDays,
  Plus,
  Moon,
  Sun,
  Clock,
  ArrowLeftRight,
  Check,
  X,
  UserCheck
} from 'lucide-react';

export const ShiftsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [shifts, setShifts] = useState<any[]>([]);
  const [roster, setRoster] = useState<any[]>([]);
  const [swaps, setSwaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newShift, setNewShift] = useState({
    code: '',
    name: '',
    shiftType: 'FIXED',
    startTime: '09:00',
    endTime: '18:00',
    isOvernight: false,
    expectedMinutes: 480,
    breakMinutes: 60,
    graceMinutes: 15,
    lateThresholdMinutes: 30,
    colorTag: '#3b82f6'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [shiftRes, rosterRes, swapRes] = await Promise.all([
        api.get('/shifts'),
        api.get('/shifts/roster'),
        api.get('/shifts/swap-requests')
      ]);

      if (shiftRes.data?.success) setShifts(shiftRes.data.data);
      if (rosterRes.data?.success) setRoster(rosterRes.data.data);
      if (swapRes.data?.success) setSwaps(swapRes.data.data);
    } catch (err) {
      console.error('Failed to load shift schedule data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/shifts', newShift);
      if (res.data?.success) {
        setShowCreateModal(false);
        loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create shift');
    }
  };

  const handleActionSwap = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await api.post(`/shifts/swap-requests/${id}/action`, { status });
      if (res.data?.success) {
        loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Shift Scheduling & Roster</h1>
          <p className="text-sm text-slate-500">Configure fixed, rotating, and overnight shifts and manage workforce coverage.</p>
        </div>
        {hasRole('Super Admin', 'HR Admin', 'Department Manager') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> Create Shift Pattern
          </button>
        )}
      </div>

      {/* Shifts Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {shifts.map((s) => (
          <div key={s.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: s.colorTag || '#3b82f6' }} />
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-slate-500">{s.code}</span>
              {s.isOvernight ? (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                  <Moon className="w-3 h-3" /> Overnight Shift
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                  <Sun className="w-3 h-3" /> Day Shift
                </span>
              )}
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-base">{s.name}</h3>
              <div className="text-xs text-blue-600 font-semibold mt-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{s.startTime} — {s.endTime}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
              <div>Grace: <strong>{s.graceMinutes}m</strong></div>
              <div>Break: <strong>{s.breakMinutes}m</strong></div>
              <div>Duration: <strong>{s.expectedMinutes / 60} hrs</strong></div>
              <div>Assignments: <strong>{s._count?.assignments || 0}</strong></div>
            </div>
          </div>
        ))}
      </div>

      {/* Roster & Assigned Employees Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-blue-600" /> Current Workforce Roster Schedule
          </h2>
          <span className="text-xs text-slate-500">{roster.length} active assignments</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Assigned Shift</th>
                <th className="px-6 py-4">Working Hours</th>
                <th className="px-6 py-4">Effective Date Range</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {roster.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    {r.employee?.firstName} {r.employee?.lastName}
                    <div className="text-xs text-slate-400 font-mono font-normal">{r.employee?.employeeCode}</div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-600">
                    {r.employee?.department?.name || 'General'}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                      {r.shift?.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono font-medium text-slate-800">
                    {r.shift?.startTime} – {r.shift?.endTime} {r.shift?.isOvernight && '(+1 Day)'}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {new Date(r.startDate).toLocaleDateString()} to {r.endDate ? new Date(r.endDate).toLocaleDateString() : 'Ongoing'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shift Swap Requests Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-indigo-600" /> Shift Swap Requests
          </h2>
        </div>

        <div className="divide-y divide-slate-100">
          {swaps.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">No shift swap requests at this time.</div>
          ) : (
            swaps.map((sw) => (
              <div key={sw.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                <div>
                  <div className="text-xs font-semibold text-slate-800">
                    {sw.requester?.firstName} {sw.requester?.lastName} ↔ {sw.targetEmployee?.firstName} {sw.targetEmployee?.lastName}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Dates: {new Date(sw.requestDate).toLocaleDateString()} for {new Date(sw.targetDate).toLocaleDateString()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    sw.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {sw.status}
                  </span>
                  {sw.status === 'PENDING' && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleActionSwap(sw.id, 'APPROVED')}
                        className="p-1 rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        title="Approve"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleActionSwap(sw.id, 'REJECTED')}
                        className="p-1 rounded bg-red-50 text-red-600 hover:bg-red-100"
                        title="Reject"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Shift Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Configure Shift Schedule</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateShift} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Shift Code</label>
                  <input
                    type="text"
                    required
                    placeholder="MORN-0614"
                    value={newShift.code}
                    onChange={(e) => setNewShift({ ...newShift, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Shift Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Morning Shift"
                    value={newShift.name}
                    onChange={(e) => setNewShift({ ...newShift, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={newShift.startTime}
                    onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={newShift.endTime}
                    onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newShift.isOvernight}
                  onChange={(e) => setNewShift({ ...newShift, isOvernight: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-700 font-medium">Overnight Shift (Crosses Midnight Window)</span>
              </label>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                >
                  Save Shift Pattern
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

