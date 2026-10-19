import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  Laptop,
  Plus,
  UserCheck,
  RotateCcw,
  Search,
  Filter,
  Download,
  CheckCircle2,
  X
} from 'lucide-react';

export const AssetsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [assets, setAssets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAssetForm, setNewAssetForm] = useState({
    assetTag: '',
    name: '',
    category: 'LAPTOP',
    serialNumber: '',
    cost: '',
    purchaseDate: new Date().toISOString().split('T')[0]
  });

  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [targetEmployeeId, setTargetEmployeeId] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [assRes, empRes] = await Promise.all([
        api.get('/assets'),
        api.get('/employees')
      ]);

      if (assRes.data?.success) setAssets(assRes.data.data);
      if (empRes.data?.success) setEmployees(empRes.data.data);
    } catch (err) {
      console.error('Failed to load assets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/assets', {
        ...newAssetForm,
        cost: newAssetForm.cost ? Number(newAssetForm.cost) : undefined
      });
      if (res.data?.success) {
        setShowAddModal(false);
        setNewAssetForm({
          assetTag: '',
          name: '',
          category: 'LAPTOP',
          serialNumber: '',
          cost: '',
          purchaseDate: new Date().toISOString().split('T')[0]
        });
        loadData();
        alert('Hardware asset added to inventory successfully.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create asset');
    }
  };

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/assets/allocate', {
        assetId: selectedAssetId,
        employeeId: targetEmployeeId
      });
      if (res.data?.success) {
        setShowAllocateModal(false);
        loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to allocate asset');
    }
  };

  const handleReturn = async (assignmentId: string) => {
    if (confirm('Process asset return and mark hardware available in inventory?')) {
      try {
        const res = await api.post(`/assets/return/${assignmentId}`);
        if (res.data?.success) {
          loadData();
        }
      } catch (err: any) {
        alert(err.response?.data?.message || 'Return failed');
      }
    }
  };

  const exportAssetsCSV = () => {
    let csv = 'Asset Tag,Item Name,Category,Serial Number,Cost ($),Status,Assigned Custodian\n';
    assets.forEach((a) => {
      const custodian = a.assignments?.[0]?.employee
        ? `${a.assignments[0].employee.firstName} ${a.assignments[0].employee.lastName} (${a.assignments[0].employee.employeeCode})`
        : 'In Stock';
      csv += `"${a.assetTag}","${a.name}","${a.category}","${a.serialNumber || ''}",${a.cost || 0},"${a.status}","${custodian}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asset_inventory_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredAssets = assets.filter((a) => {
    const matchesSearch =
      a.assetTag.toLowerCase().includes(search.toLowerCase()) ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.serialNumber && a.serialNumber.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = categoryFilter ? a.category === categoryFilter : true;
    const matchesStatus = statusFilter ? a.status === statusFilter : true;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">IT Hardware & Asset Management</h1>
          <p className="text-sm text-slate-500">Corporate laptops, mobile workstations, monitors, and equipment custody.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportAssetsCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          {hasRole('Super Admin', 'IT/Asset Manager', 'HR Admin') && (
            <button
              onClick={() => {
                const count = assets.length + 1;
                setNewAssetForm({
                  assetTag: `APX-AST-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`,
                  name: '',
                  category: 'LAPTOP',
                  serialNumber: '',
                  cost: '',
                  purchaseDate: new Date().toISOString().split('T')[0]
                });
                setShowAddModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add New Asset
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by asset tag, model name, or serial number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          <option value="LAPTOP">Laptops</option>
          <option value="MONITOR">Monitors</option>
          <option value="MOBILE">Mobile Phones</option>
          <option value="ACCESSORY">Accessories</option>
          <option value="DESKTOP">Desktops</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="AVAILABLE">Available (In Stock)</option>
          <option value="ALLOCATED">Allocated</option>
          <option value="REPAIR">In Repair</option>
          <option value="RETIRED">Retired</option>
        </select>
      </div>

      {/* Asset Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Laptop className="w-4 h-4 text-blue-600" /> Physical Equipment Inventory
          </h2>
          <span className="text-xs text-slate-500">{filteredAssets.length} assets shown</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Asset Tag</th>
                <th className="px-6 py-4">Item & Specification</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Cost ($)</th>
                <th className="px-6 py-4">Assigned Custodian</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    No hardware assets found matching filter criteria.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => {
                  const activeAssignment = asset.assignments?.[0];
                  return (
                    <tr key={asset.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-6 py-4 font-mono font-bold text-xs text-blue-600">
                        {asset.assetTag}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900 text-xs">
                        {asset.name}
                        <div className="text-[11px] text-slate-400 font-mono">S/N: {asset.serialNumber || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                        {asset.category}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono font-medium text-slate-800">
                        {asset.cost ? `$${Number(asset.cost).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-6 py-4 text-xs">
                        {activeAssignment ? (
                          <span className="font-semibold text-slate-800">
                            {activeAssignment.employee?.firstName} {activeAssignment.employee?.lastName} ({activeAssignment.employee?.employeeCode})
                          </span>
                        ) : (
                          <span className="text-slate-400">In IT Storage</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                          asset.status === 'ALLOCATED' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {asset.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {asset.status === 'AVAILABLE' ? (
                          <button
                            onClick={() => {
                              setSelectedAssetId(asset.id);
                              setShowAllocateModal(true);
                            }}
                            className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold"
                          >
                            Allocate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReturn(activeAssignment.id)}
                            className="px-3 py-1 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 ml-auto"
                          >
                            <RotateCcw className="w-3 h-3" /> Return to Stock
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Add New IT Asset Entry</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAsset} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Asset Tag</label>
                  <input
                    type="text"
                    required
                    placeholder="APX-LPT-0099"
                    value={newAssetForm.assetTag}
                    onChange={(e) => setNewAssetForm({ ...newAssetForm, assetTag: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newAssetForm.category}
                    onChange={(e) => setNewAssetForm({ ...newAssetForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="LAPTOP">Laptop</option>
                    <option value="MONITOR">Monitor / Display</option>
                    <option value="MOBILE">Mobile Phone</option>
                    <option value="ACCESSORY">Accessory / Peripherals</option>
                    <option value="DESKTOP">Workstation / Desktop</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Item & Model Name</label>
                <input
                  type="text"
                  required
                  placeholder="Apple MacBook Pro 16 M3 Max 64GB"
                  value={newAssetForm.name}
                  onChange={(e) => setNewAssetForm({ ...newAssetForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Serial Number</label>
                  <input
                    type="text"
                    placeholder="C02G1234XYZ"
                    value={newAssetForm.serialNumber}
                    onChange={(e) => setNewAssetForm({ ...newAssetForm, serialNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cost / Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="2499.00"
                    value={newAssetForm.cost}
                    onChange={(e) => setNewAssetForm({ ...newAssetForm, cost: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Allocate Modal */}
      {showAllocateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Allocate Hardware Asset</h2>
              <button onClick={() => setShowAllocateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAllocate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Employee</label>
                <select
                  required
                  value={targetEmployeeId}
                  onChange={(e) => setTargetEmployeeId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="">Select Employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                >
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
