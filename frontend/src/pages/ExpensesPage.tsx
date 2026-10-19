import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  Receipt,
  Plus,
  Check,
  X,
  CreditCard,
  DollarSign,
  Download,
  Search,
  Filter
} from 'lucide-react';

export const ExpensesPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [categories, setCategories] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Submit Modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [claimForm, setClaimForm] = useState({
    categoryId: '',
    amount: '',
    claimDate: new Date().toISOString().split('T')[0],
    description: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [catRes, claimRes, loanRes] = await Promise.all([
        api.get('/expenses/categories'),
        api.get('/expenses/claims'),
        api.get('/expenses/loans').catch(() => ({ data: { success: false, data: [] } }))
      ]);

      if (catRes.data?.success) setCategories(catRes.data.data);
      if (claimRes.data?.success) setClaims(claimRes.data.data);
      if (loanRes.data?.success) setLoans(loanRes.data.data);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/expenses/claims', claimForm);
      if (res.data?.success) {
        setShowSubmitModal(false);
        setClaimForm({ categoryId: '', amount: '', claimDate: new Date().toISOString().split('T')[0], description: '' });
        loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to submit claim');
    }
  };

  const handleActionClaim = async (id: string, status: 'APPROVED' | 'REJECTED' | 'PAID') => {
    try {
      const res = await api.post(`/expenses/claims/${id}/action`, { status });
      if (res.data?.success) {
        loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  const exportClaimsCSV = () => {
    if (claims.length === 0) return;
    const headers = ['Employee Name', 'Category', 'Amount', 'Date', 'Description', 'Status'];
    const rows = filteredClaims.map(c => [
      `"${c.employee?.firstName || ''} ${c.employee?.lastName || ''}"`,
      `"${c.category?.name || ''}"`,
      c.amount,
      `"${new Date(c.claimDate).toISOString().split('T')[0]}"`,
      `"${(c.description || '').replace(/"/g, '""')}"`,
      c.status
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `expense_claims_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredClaims = claims.filter(cl => {
    const fullName = `${cl.employee?.firstName || ''} ${cl.employee?.lastName || ''}`.toLowerCase();
    const catName = (cl.category?.name || '').toLowerCase();
    const desc = (cl.description || '').toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase()) ||
      catName.includes(searchQuery.toLowerCase()) ||
      desc.includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || cl.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Expenses & Employee Advances</h1>
          <p className="text-sm text-slate-500">Reimbursement claims, corporate receipts, and employee loan repayments.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportClaimsCSV}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium shadow-xs transition"
          >
            <Download className="w-4 h-4 text-slate-500" /> Export CSV
          </button>
          <button
            onClick={() => setShowSubmitModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-xs transition"
          >
            <Plus className="w-4 h-4" /> Submit Expense Claim
          </button>
        </div>
      </div>

      {/* Claims Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Reimbursement Claims</h2>
            <span className="text-xs text-slate-500 font-medium">({filteredClaims.length} records)</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search employee or expense..."
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
                <option value="PAID">Paid</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClaims.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">No reimbursement claims matching your filters.</td>
                </tr>
              ) : (
                filteredClaims.map((cl) => (
                <tr key={cl.id} className="hover:bg-slate-50/60 transition">
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    {cl.employee?.firstName} {cl.employee?.lastName}
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-slate-700">
                    {cl.category?.name}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-900 font-mono">
                    ${Number(cl.amount).toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500">
                    {new Date(cl.claimDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-600 max-w-xs truncate">
                    {cl.description}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                      cl.status === 'PENDING' ? 'bg-amber-100 text-amber-700' :
                      cl.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {cl.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {cl.status === 'PENDING' && hasRole('Super Admin', 'Finance Manager', 'HR Admin') ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleActionClaim(cl.id, 'APPROVED')}
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleActionClaim(cl.id, 'REJECTED')}
                          className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">Processed</span>
                    )}
                  </td>
                </tr>
              )))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">New Expense Reimbursement</h2>
              <button onClick={() => setShowSubmitModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitClaim} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Category</label>
                <select
                  required
                  value={claimForm.categoryId}
                  onChange={(e) => setClaimForm({ ...claimForm, categoryId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="">Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Claim Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={claimForm.amount}
                  onChange={(e) => setClaimForm({ ...claimForm, amount: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Claim Description</label>
                <textarea
                  required
                  rows={3}
                  value={claimForm.description}
                  onChange={(e) => setClaimForm({ ...claimForm, description: e.target.value })}
                  placeholder="e.g. Travel tickets, client dinner, developer subscription"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                >
                  Submit Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

