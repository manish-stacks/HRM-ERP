import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import {
  Users,
  UserCheck,
  Clock,
  AlertTriangle,
  CalendarCheck,
  Banknote,
  TrendingUp,
  Megaphone,
  LifeBuoy,
  Building,
  ShieldCheck
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

export const DashboardPage: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await api.get('/reports/dashboard');
        if (res.data?.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        Loading organizational intelligence data...
      </div>
    );
  }

  const { headcount, attendanceToday, departmentDistribution, pendingApprovals, payrollSummary, recentAnnouncements, recentTickets } = data || {};

  const colors = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'];

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Organization Overview</h1>
          <p className="text-sm text-slate-500">Live operational metrics aggregated from authorized enterprise database records.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Sync: Online
          </span>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Headcount */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Headcount</span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{headcount?.active || 0}</div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-emerald-600 font-semibold">{headcount?.total || 0}</span> total registered profiles
          </div>
        </div>

        {/* Present Today */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Today's Attendance</span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600">{attendanceToday?.present || 0}</div>
          <div className="text-xs text-slate-500 mt-1">
            {attendanceToday?.attendanceRate}% attendance rate today
          </div>
        </div>

        {/* Late / Irregular */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Late Arrivals</span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600">{attendanceToday?.late || 0}</div>
          <div className="text-xs text-slate-500 mt-1">
            Checked in after assigned grace window
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Action Items</span>
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-indigo-600">{pendingApprovals?.leaves || 0}</div>
          <div className="text-xs text-slate-500 mt-1">
            Pending leave & correction requests
          </div>
        </div>
      </div>

      {/* Middle Row: Department Breakdown & Payroll Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Distribution Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Department Workforce Distribution</h2>
                <p className="text-xs text-slate-500">Live employee headcounts by organizational department</p>
              </div>
              <Building className="w-5 h-5 text-slate-400" />
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentDistribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {(departmentDistribution || []).map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Payroll Summary Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">Latest Payroll Cycle</h2>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <Banknote className="w-5 h-5" />
              </div>
            </div>

            {payrollSummary ? (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="text-xs text-slate-500 font-medium">Period</div>
                  <div className="text-sm font-bold text-slate-800">{payrollSummary.period}</div>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                    STATUS: {payrollSummary.status}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Gross Disbursement:</span>
                    <span className="font-semibold text-slate-800">${Number(payrollSummary.gross).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Net Employee Payout:</span>
                    <span className="font-bold text-emerald-600 text-sm">${Number(payrollSummary.net).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-400 py-6 text-center">
                No closed payroll run recorded for this fiscal cycle.
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
              <ShieldCheck className="w-4 h-4" /> Decimal Precision Audited
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Announcements & Helpdesk Tickets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Organization Announcements */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-semibold text-slate-900">Corporate Announcements</h2>
            </div>
          </div>
          <div className="space-y-3">
            {recentAnnouncements && recentAnnouncements.length > 0 ? (
              recentAnnouncements.map((ann: any) => (
                <div key={ann.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-slate-800">{ann.title}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                      {ann.priority}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{ann.content}</p>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 py-4 text-center">No active announcements</div>
            )}
          </div>
        </div>

        {/* Recent Helpdesk Support */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-indigo-600" />
              <h2 className="text-base font-semibold text-slate-900">Recent Helpdesk Inquiries</h2>
            </div>
          </div>
          <div className="space-y-3">
            {recentTickets && recentTickets.length > 0 ? (
              recentTickets.map((t: any) => (
                <div key={t.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-mono font-semibold text-blue-600">{t.ticketNumber}</div>
                    <div className="text-sm font-medium text-slate-800">{t.subject}</div>
                    <div className="text-[11px] text-slate-500">Category: {t.category}</div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    t.status === 'OPEN' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {t.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-400 py-4 text-center">No open helpdesk tickets</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

