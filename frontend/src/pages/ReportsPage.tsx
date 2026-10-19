import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import {
  BarChart3,
  Download,
  Users,
  Clock,
  Banknote,
  FileSpreadsheet
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, PieChart, Pie } from 'recharts';

export const ReportsPage: React.FC = () => {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      try {
        const res = await api.get('/reports/dashboard');
        if (res.data?.success) setDashboard(res.data.data);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  const exportCSV = (type: string) => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    if (type === 'headcount') {
      csvContent += 'Department,Headcount\n';
      dashboard?.departmentDistribution?.forEach((d: any) => {
        csvContent += `"${d.name}",${d.count}\n`;
      });
    } else {
      csvContent += 'Metric,Value\n';
      csvContent += `Active Employees,${dashboard?.headcount?.active}\n`;
      csvContent += `Present Today,${dashboard?.attendanceToday?.present}\n`;
      csvContent += `Late Today,${dashboard?.attendanceToday?.late}\n`;
      csvContent += `Absent Today,${dashboard?.attendanceToday?.absent}\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${type}_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const colors = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Enterprise HR Reports & Analytics</h1>
          <p className="text-sm text-slate-500">Cross-departmental workforce trends, attendance rates, and financial reports.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCSV('headcount')}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" /> Export Headcount CSV
          </button>
          <button
            onClick={() => exportCSV('attendance')}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" /> Export Attendance CSV
          </button>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600" /> Today's Attendance Proportions
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Present On-Time', value: Math.max(0, (dashboard?.attendanceToday?.present || 0) - (dashboard?.attendanceToday?.late || 0)) },
                    { name: 'Late Arrivals', value: dashboard?.attendanceToday?.late || 0 },
                    { name: 'Absent / On Leave', value: dashboard?.attendanceToday?.absent || 0 }
                  ]}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {colors.map((c, i) => (
                    <Cell key={i} fill={c} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Headcounts */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" /> Headcount by Organizational Unit
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboard?.departmentDistribution || []}>
                <XAxis dataKey="name" fontSize={12} stroke="#94a3b8" />
                <YAxis allowDecimals={false} fontSize={12} stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

