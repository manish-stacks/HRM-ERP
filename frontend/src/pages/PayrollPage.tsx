import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  Banknote,
  Lock,
  Plus,
  Eye,
  CheckCircle2,
  FileText,
  Printer,
  ShieldCheck,
  Building,
  Calendar,
  X,
  Download
} from 'lucide-react';

export const PayrollPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [structures, setStructures] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);
  const [myPayslips, setMyPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Process Modal
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedPeriodId, setSelectedPeriodId] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [strRes, perRes, mySlipRes] = await Promise.all([
        api.get('/payroll/structures').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/payroll/periods').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/payroll/payslips/my').catch(() => ({ data: { success: false, data: [] } }))
      ]);

      if (strRes.data?.success) setStructures(strRes.data.data);
      if (perRes.data?.success) setPeriods(perRes.data.data);
      if (mySlipRes.data?.success) setMyPayslips(mySlipRes.data.data);
    } catch (err) {
      console.error('Failed to load payroll data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProcessPayroll = async () => {
    if (!selectedPeriodId) {
      alert('Please select a payroll period.');
      return;
    }

    try {
      const res = await api.post('/payroll/process', { periodId: selectedPeriodId });
      if (res.data?.success) {
        alert(res.data.message);
        setShowProcessModal(false);
        loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Payroll processing failed');
    }
  };

  const handleLockPayroll = async (runId: string) => {
    if (confirm('Locking payroll freezes all salary, attendance, and deduction calculations and generates immutable payslips. Proceed?')) {
      try {
        const res = await api.post(`/payroll/runs/${runId}/lock`);
        if (res.data?.success) {
          alert('Payroll locked and payslips published successfully.');
          loadData();
        }
      } catch (err: any) {
        alert(err.response?.data?.message || 'Locking failed');
      }
    }
  };

  const viewPayslip = async (id: string) => {
    try {
      const res = await api.get(`/payroll/payslips/${id}`);
      if (res.data?.success) {
        setSelectedPayslip(res.data.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to retrieve payslip');
    }
  };

  const exportPayrollRunsCSV = () => {
    const allRuns = periods.flatMap((p) => p.payrollRuns || []);
    if (allRuns.length === 0) return;
    const headers = ['Run Number', 'Total Gross', 'Total Deductions', 'Net Payout', 'Status'];
    const rows = allRuns.map((r: any) => [
      `"${r.runNumber}"`,
      r.totalGross,
      r.totalDeductions,
      r.totalNet,
      r.status
    ]);
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `payroll_runs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportMyPayslipsCSV = () => {
    if (myPayslips.length === 0) return;
    const headers = ['Payslip Number', 'Month', 'Year', 'Net Payout'];
    const rows = myPayslips.map((s) => [
      `"${s.payslipNumber}"`,
      s.month,
      s.year,
      s.payrollItem?.netPay || 0
    ]);
    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `my_payslips_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payroll & Compensation Management</h1>
          <p className="text-sm text-slate-500">Statutory salary calculations, locked historical payroll runs, and employee payslips.</p>
        </div>

        {hasRole('Super Admin', 'Payroll Manager') && (
          <button
            onClick={() => setShowProcessModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> Process Payroll Run
          </button>
        )}
      </div>

      {/* Salary Structures Section */}
      {hasRole('Super Admin', 'Payroll Manager', 'HR Admin') && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Banknote className="w-4 h-4 text-emerald-600" /> Configured Salary Structures
            </h2>
          </div>

          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
            {structures.map((st) => (
              <div key={st.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">{st.name}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                    Currency: {st.currency}
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  {st.components?.map((c: any) => (
                    <div key={c.id} className="flex justify-between text-slate-600">
                      <span>{c.name} ({c.type})</span>
                      <strong className={c.type === 'EARNING' ? 'text-emerald-700' : 'text-red-700'}>
                        {c.fixedAmount ? `$${Number(c.fixedAmount).toLocaleString()}` : `${c.percentageOfBasic}% of Basic`}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payroll Periods & Runs Section */}
      {hasRole('Super Admin', 'Payroll Manager', 'HR Admin') && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" /> Payroll Periods & Executed Runs
            </h2>
            <button
              onClick={exportPayrollRunsCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" /> Export Runs CSV
            </button>
          </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Period</th>
                <th className="px-6 py-4">Run Number</th>
                <th className="px-6 py-4">Total Gross</th>
                <th className="px-6 py-4">Total Deductions</th>
                <th className="px-6 py-4">Net Payout</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {periods.flatMap((p) => p.payrollRuns).map((run: any) => (
                <tr key={run.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-6 py-4 font-semibold text-slate-900 text-xs">
                    {run.runNumber}
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-slate-600">
                    {run.runNumber}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-800">
                    ${Number(run.totalGross).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-red-600">
                    -${Number(run.totalDeductions).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-emerald-700">
                    ${Number(run.totalNet).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                      run.status === 'LOCKED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {run.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {run.status === 'DRAFT' && hasRole('Super Admin', 'Payroll Manager') && (
                      <button
                        onClick={() => handleLockPayroll(run.id)}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 ml-auto"
                      >
                        <Lock className="w-3.5 h-3.5" /> Lock & Publish
                      </button>
                    )}
                    {run.status === 'LOCKED' && (
                      <span className="text-xs text-slate-400 flex items-center gap-1 justify-end font-medium">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Locked & Audited
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Employee My Payslips */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" /> My Published Payslips
          </h2>
          {myPayslips.length > 0 && (
            <button
              onClick={exportMyPayslipsCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" /> Export Payslips CSV
            </button>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          {myPayslips.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">No published payslips found for your account.</div>
          ) : (
            myPayslips.map((slip) => (
              <div key={slip.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                <div>
                  <div className="text-sm font-bold text-slate-900 font-mono">{slip.payslipNumber}</div>
                  <div className="text-xs text-slate-500">
                    Period: {slip.month}/{slip.year} • Net Payout: <strong className="text-emerald-700">${Number(slip.payrollItem?.netPay).toLocaleString()}</strong>
                  </div>
                </div>
                <button
                  onClick={() => viewPayslip(slip.id)}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Eye className="w-3.5 h-3.5" /> View Payslip
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Process Payroll Modal */}
      {showProcessModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Execute Monthly Payroll Run</h2>
              <button onClick={() => setShowProcessModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Select Payroll Period</label>
              <select
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              >
                <option value="">Select Period...</option>
                {periods.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 space-y-1">
                <strong>Decimal Financial Engine:</strong>
                <p>
                  Payable days, attendance penalties, and statutory withholdings will be calculated with exact decimal precision.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowProcessModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleProcessPayroll}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                >
                  Generate Payroll Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payslip View Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-slate-100 space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-slate-200 pb-5">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Apex Global Technologies Inc.</h2>
                <div className="text-xs text-slate-500">100 Enterprise Boulevard, Suite 500 • New York, NY</div>
                <div className="text-xs text-blue-600 font-mono mt-1">Tax ID: US-EIN-987654321</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Official Payslip</div>
                <div className="text-sm font-mono font-bold text-slate-800">{selectedPayslip.payslipNumber}</div>
                <div className="text-xs text-slate-500">Month: {selectedPayslip.month}/{selectedPayslip.year}</div>
              </div>
            </div>

            {/* Employee Info */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-slate-400 font-medium">Employee Name:</span>{' '}
                <strong className="text-slate-800">{selectedPayslip.employee?.firstName} {selectedPayslip.employee?.lastName}</strong>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Employee Code:</span>{' '}
                <strong className="font-mono text-slate-800">{selectedPayslip.employee?.employeeCode}</strong>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Department:</span>{' '}
                <span className="text-slate-700">{selectedPayslip.employee?.department?.name || 'Engineering'}</span>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Designation:</span>{' '}
                <span className="text-slate-700">{selectedPayslip.employee?.designation?.title || 'Staff'}</span>
              </div>
            </div>

            {/* Earnings & Deductions Breakdown */}
            <div className="grid grid-cols-2 gap-6 text-xs">
              {/* Earnings */}
              <div className="space-y-2">
                <div className="font-bold text-emerald-800 uppercase tracking-wider border-b border-emerald-200 pb-1">Earnings</div>
                {selectedPayslip.payrollItem?.earnings?.map((e: any) => (
                  <div key={e.id} className="flex justify-between py-1 text-slate-700">
                    <span>{e.name}</span>
                    <strong className="font-mono">${Number(e.amount).toFixed(2)}</strong>
                  </div>
                ))}
                <div className="flex justify-between py-2 border-t border-slate-200 font-bold text-slate-900">
                  <span>Gross Earnings:</span>
                  <span className="font-mono text-emerald-700">${Number(selectedPayslip.payrollItem?.grossPay).toFixed(2)}</span>
                </div>
              </div>

              {/* Deductions */}
              <div className="space-y-2">
                <div className="font-bold text-red-800 uppercase tracking-wider border-b border-red-200 pb-1">Deductions</div>
                {selectedPayslip.payrollItem?.deductions?.map((d: any) => (
                  <div key={d.id} className="flex justify-between py-1 text-slate-700">
                    <span>{d.name}</span>
                    <strong className="font-mono text-red-600">-${Number(d.amount).toFixed(2)}</strong>
                  </div>
                ))}
                <div className="flex justify-between py-2 border-t border-slate-200 font-bold text-slate-900">
                  <span>Total Deductions:</span>
                  <span className="font-mono text-red-600">-${Number(selectedPayslip.payrollItem?.totalDeductions).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Net Payout Banner */}
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center">
              <div>
                <div className="text-xs text-emerald-700 font-semibold uppercase">Net Take-Home Remuneration</div>
                <div className="text-2xl font-black text-emerald-800 font-mono">
                  ${Number(selectedPayslip.payrollItem?.netPay).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 bg-emerald-600 text-white rounded-lg">PAID DIRECT DEPOSIT</span>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" /> Print Payslip
              </button>
              <button
                onClick={() => setSelectedPayslip(null)}
                className="px-4 py-2 bg-slate-800 text-white hover:bg-slate-900 rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

