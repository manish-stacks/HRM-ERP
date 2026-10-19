import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  GitBranch,
  Briefcase,
  Users,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Download,
  Search,
  CheckCircle2,
  X
} from 'lucide-react';

export const OrganizationPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [org, setOrg] = useState<any>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [hierarchy, setHierarchy] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search filters
  const [searchBranch, setSearchBranch] = useState('');
  const [searchDept, setSearchDept] = useState('');
  const [searchDesig, setSearchDesig] = useState('');

  // Modals state
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [orgForm, setOrgForm] = useState({
    name: '',
    legalName: '',
    taxId: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    timezone: '',
    currency: ''
  });

  const [showBranchModal, setShowBranchModal] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
  const [branchForm, setBranchForm] = useState({ code: '', name: '', city: '', state: '', country: 'USA' });

  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [deptForm, setDeptForm] = useState({ code: '', name: '', description: '', headEmployeeId: '' });

  const [showDesigModal, setShowDesigModal] = useState(false);
  const [editingDesigId, setEditingDesigId] = useState<string | null>(null);
  const [desigForm, setDesigForm] = useState({ code: '', title: '', level: 1, description: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [orgRes, bRes, dRes, desRes, hRes, empRes] = await Promise.all([
        api.get('/organization'),
        api.get('/organization/branches'),
        api.get('/organization/departments'),
        api.get('/organization/designations'),
        api.get('/organization/hierarchy'),
        api.get('/employees')
      ]);

      if (orgRes.data?.success) {
        setOrg(orgRes.data.data);
        setOrgForm({
          name: orgRes.data.data.name || '',
          legalName: orgRes.data.data.legalName || '',
          taxId: orgRes.data.data.taxId || '',
          contactEmail: orgRes.data.data.contactEmail || '',
          contactPhone: orgRes.data.data.contactPhone || '',
          address: orgRes.data.data.address || '',
          city: orgRes.data.data.city || '',
          state: orgRes.data.data.state || '',
          country: orgRes.data.data.country || 'USA',
          timezone: orgRes.data.data.timezone || 'America/New_York',
          currency: orgRes.data.data.currency || 'USD'
        });
      }
      if (bRes.data?.success) setBranches(bRes.data.data);
      if (dRes.data?.success) setDepartments(dRes.data.data);
      if (desRes.data?.success) setDesignations(desRes.data.data);
      if (hRes.data?.success) setHierarchy(hRes.data.data);
      if (empRes.data?.success) setEmployees(empRes.data.data);
    } catch (err) {
      console.error('Failed to load organization data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Organization Save
  const handleSaveOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.put('/organization', orgForm);
      if (res.data?.success) {
        setShowOrgModal(false);
        loadData();
        alert('Organization details updated successfully.');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update organization');
    }
  };

  // Branch CRUD
  const handleSaveBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingBranchId) {
        await api.put(`/organization/branches/${editingBranchId}`, branchForm);
      } else {
        await api.post('/organization/branches', branchForm);
      }
      setShowBranchModal(false);
      setEditingBranchId(null);
      setBranchForm({ code: '', name: '', city: '', state: '', country: 'USA' });
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDeleteBranch = async (id: string) => {
    if (confirm('Are you sure you want to delete this branch?')) {
      try {
        await api.delete(`/organization/branches/${id}`);
        loadData();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Cannot delete branch');
      }
    }
  };

  // Department CRUD
  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDeptId) {
        await api.put(`/organization/departments/${editingDeptId}`, deptForm);
      } else {
        await api.post('/organization/departments', deptForm);
      }
      setShowDeptModal(false);
      setEditingDeptId(null);
      setDeptForm({ code: '', name: '', description: '', headEmployeeId: '' });
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDeleteDept = async (id: string) => {
    if (confirm('Are you sure you want to delete this department?')) {
      try {
        await api.delete(`/organization/departments/${id}`);
        loadData();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Cannot delete department');
      }
    }
  };

  // Designation CRUD
  const handleSaveDesig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDesigId) {
        await api.put(`/organization/designations/${editingDesigId}`, desigForm);
      } else {
        await api.post('/organization/designations', desigForm);
      }
      setShowDesigModal(false);
      setEditingDesigId(null);
      setDesigForm({ code: '', title: '', level: 1, description: '' });
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Operation failed');
    }
  };

  const handleDeleteDesig = async (id: string) => {
    if (confirm('Are you sure you want to delete this designation?')) {
      try {
        await api.delete(`/organization/designations/${id}`);
        loadData();
      } catch (err: any) {
        alert(err.response?.data?.message || 'Cannot delete designation');
      }
    }
  };

  const exportBranchesCSV = () => {
    let csv = 'Code,Name,City,State,Country,Employees\n';
    branches.forEach((b) => {
      csv += `"${b.code}","${b.name}","${b.city || ''}","${b.state || ''}","${b.country || ''}",${b._count?.employees || 0}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `branches_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportDeptsCSV = () => {
    let csv = 'Code,Department Name,Head,Employees\n';
    departments.forEach((d) => {
      const head = d.headEmployee ? `${d.headEmployee.firstName} ${d.headEmployee.lastName}` : 'Unassigned';
      csv += `"${d.code}","${d.name}","${head}",${d._count?.employees || 0}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `departments_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredBranches = branches.filter((b) =>
    b.name.toLowerCase().includes(searchBranch.toLowerCase()) || b.code.toLowerCase().includes(searchBranch.toLowerCase())
  );
  const filteredDepts = departments.filter((d) =>
    d.name.toLowerCase().includes(searchDept.toLowerCase()) || d.code.toLowerCase().includes(searchDept.toLowerCase())
  );
  const filteredDesigs = designations.filter((des) =>
    des.title.toLowerCase().includes(searchDesig.toLowerCase()) || des.code.toLowerCase().includes(searchDesig.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Organization & Locations</h1>
          <p className="text-sm text-slate-500">Corporate legal entities, branches, departments, and reporting hierarchy.</p>
        </div>

        {hasRole('Super Admin', 'Organization Admin') && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowOrgModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <Pencil className="w-3.5 h-3.5 text-blue-600" /> Edit Organization Details
            </button>
            <button
              onClick={() => {
                setEditingBranchId(null);
                setBranchForm({ code: '', name: '', city: '', state: '', country: 'USA' });
                setShowBranchModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Branch
            </button>
          </div>
        )}
      </div>

      {/* Organization Details Overview Card */}
      {org && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold text-lg flex items-center justify-center">
                {org.name[0]}
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">{org.name}</h2>
                <div className="text-xs text-slate-500">{org.legalName} • <span className="font-mono text-blue-600 font-bold">{org.code}</span></div>
              </div>
            </div>
            {hasRole('Super Admin', 'Organization Admin') && (
              <button
                onClick={() => setShowOrgModal(true)}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit Profile
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Tax Identifier:</span>
              <div className="font-mono font-semibold text-slate-800 mt-0.5">{org.taxId || 'N/A'}</div>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Contact Email:</span>
              <div className="font-semibold text-slate-800 mt-0.5">{org.contactEmail}</div>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Headquarters Address:</span>
              <div className="font-semibold text-slate-800 mt-0.5">{org.address || `${org.city}, ${org.state}`}</div>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Default Currency & Timezone:</span>
              <div className="font-semibold text-slate-800 mt-0.5">{org.currency} ({org.timezone})</div>
            </div>
          </div>
        </div>
      )}

      {/* Branches Section with Search & Export */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Branch Locations ({branches.length})</h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search branches..."
                value={searchBranch}
                onChange={(e) => setSearchBranch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <button
              onClick={exportBranchesCSV}
              className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            {hasRole('Super Admin', 'Organization Admin') && (
              <button
                onClick={() => {
                  setEditingBranchId(null);
                  setBranchForm({ code: '', name: '', city: '', state: '', country: 'USA' });
                  setShowBranchModal(true);
                }}
                className="px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
              >
                + Add
              </button>
            )}
          </div>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredBranches.map((b) => (
            <div key={b.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 relative">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-blue-600">{b.code}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-medium">{b._count?.employees || 0} Staff</span>
                  {hasRole('Super Admin', 'Organization Admin') && (
                    <>
                      <button
                        onClick={() => {
                          setEditingBranchId(b.id);
                          setBranchForm({ code: b.code, name: b.name, city: b.city || '', state: b.state || '', country: b.country || 'USA' });
                          setShowBranchModal(true);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-blue-600"
                        title="Edit Branch"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteBranch(b.id)}
                        className="p-1 rounded text-slate-400 hover:text-red-600"
                        title="Delete Branch"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <h3 className="text-base font-bold text-slate-900">{b.name}</h3>
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{b.city}, {b.state} ({b.country})</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Departments & Designations Two-Column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Departments */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Departments ({departments.length})</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchDept}
                  onChange={(e) => setSearchDept(e.target.value)}
                  className="pl-8 pr-2 py-1 bg-white border border-slate-200 rounded-lg text-xs w-28"
                />
              </div>
              <button
                onClick={exportDeptsCSV}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                CSV
              </button>
              {hasRole('Super Admin', 'Organization Admin') && (
                <button
                  onClick={() => {
                    setEditingDeptId(null);
                    setDeptForm({ code: '', name: '', description: '', headEmployeeId: '' });
                    setShowDeptModal(true);
                  }}
                  className="px-2 py-1 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
                >
                  + Add
                </button>
              )}
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {filteredDepts.map((dept) => (
              <div key={dept.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">{dept.name}</h4>
                    <span className="font-mono text-[10px] text-slate-400">{dept.code}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Dept Head: {dept.headEmployee ? `${dept.headEmployee.firstName} ${dept.headEmployee.lastName}` : 'Unassigned'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {dept._count?.employees || 0} Staff
                  </span>
                  {hasRole('Super Admin', 'Organization Admin') && (
                    <>
                      <button
                        onClick={() => {
                          setEditingDeptId(dept.id);
                          setDeptForm({
                            code: dept.code,
                            name: dept.name,
                            description: dept.description || '',
                            headEmployeeId: dept.headEmployeeId || ''
                          });
                          setShowDeptModal(true);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-blue-600"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDept(dept.id)}
                        className="p-1 rounded text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Designations */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900">Career Designations ({designations.length})</h2>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchDesig}
                  onChange={(e) => setSearchDesig(e.target.value)}
                  className="pl-8 pr-2 py-1 bg-white border border-slate-200 rounded-lg text-xs w-28"
                />
              </div>
              {hasRole('Super Admin', 'Organization Admin') && (
                <button
                  onClick={() => {
                    setEditingDesigId(null);
                    setDesigForm({ code: '', title: '', level: 1, description: '' });
                    setShowDesigModal(true);
                  }}
                  className="px-2 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700"
                >
                  + Add
                </button>
              )}
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {filteredDesigs.map((des) => (
              <div key={des.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{des.title}</h4>
                  <span className="text-xs text-slate-400 font-mono">Code: {des.code}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                    Band: L{des.level}
                  </span>
                  {hasRole('Super Admin', 'Organization Admin') && (
                    <>
                      <button
                        onClick={() => {
                          setEditingDesigId(des.id);
                          setDesigForm({
                            code: des.code,
                            title: des.title,
                            level: des.level,
                            description: des.description || ''
                          });
                          setShowDesigModal(true);
                        }}
                        className="p-1 rounded text-slate-400 hover:text-blue-600"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteDesig(des.id)}
                        className="p-1 rounded text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reporting Hierarchy */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-purple-600" /> Corporate Reporting Structure
          </h2>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {hierarchy.map((emp) => (
            <div key={emp.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
              <div className="font-bold text-slate-900 text-sm">{emp.firstName} {emp.lastName}</div>
              <div className="text-xs text-blue-600 font-medium">{emp.designation?.title}</div>
              <div className="text-[11px] text-slate-500">{emp.department?.name}</div>
              <div className="text-[10px] text-slate-400 font-mono pt-1">
                Reports to: {emp.managerId ? 'Assigned Manager' : 'Executive Board (Top)'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Organization Modal */}
      {showOrgModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Edit Organization Information</h2>
              <button onClick={() => setShowOrgModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOrg} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Company Display Name</label>
                  <input
                    type="text"
                    required
                    value={orgForm.name}
                    onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Legal Entity Name</label>
                  <input
                    type="text"
                    required
                    value={orgForm.legalName}
                    onChange={(e) => setOrgForm({ ...orgForm, legalName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tax ID / EIN</label>
                  <input
                    type="text"
                    value={orgForm.taxId}
                    onChange={(e) => setOrgForm({ ...orgForm, taxId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Contact Email</label>
                  <input
                    type="email"
                    required
                    value={orgForm.contactEmail}
                    onChange={(e) => setOrgForm({ ...orgForm, contactEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Headquarters Address</label>
                <input
                  type="text"
                  value={orgForm.address}
                  onChange={(e) => setOrgForm({ ...orgForm, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={orgForm.city}
                    onChange={(e) => setOrgForm({ ...orgForm, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    value={orgForm.state}
                    onChange={(e) => setOrgForm({ ...orgForm, state: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={orgForm.country}
                    onChange={(e) => setOrgForm({ ...orgForm, country: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Default Timezone</label>
                  <input
                    type="text"
                    value={orgForm.timezone}
                    onChange={(e) => setOrgForm({ ...orgForm, timezone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Default Currency</label>
                  <input
                    type="text"
                    value={orgForm.currency}
                    onChange={(e) => setOrgForm({ ...orgForm, currency: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOrgModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Branch Modal (Add / Edit) */}
      {showBranchModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">{editingBranchId ? 'Edit Branch' : 'Add New Branch'}</h2>
              <button onClick={() => setShowBranchModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBranch} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Branch Code</label>
                  <input
                    type="text"
                    required
                    placeholder="BR-NYC"
                    value={branchForm.code}
                    onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Branch Name</label>
                  <input
                    type="text"
                    required
                    placeholder="New York HQ"
                    value={branchForm.name}
                    onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={branchForm.city}
                    onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={branchForm.state}
                    onChange={(e) => setBranchForm({ ...branchForm, state: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBranchModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                >
                  {editingBranchId ? 'Update Branch' : 'Create Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Department Modal (Add / Edit) */}
      {showDeptModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">{editingDeptId ? 'Edit Department' : 'Add Department'}</h2>
              <button onClick={() => setShowDeptModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDept} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department Code</label>
                  <input
                    type="text"
                    required
                    placeholder="ENG"
                    value={deptForm.code}
                    onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Engineering"
                    value={deptForm.name}
                    onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department Head (Manager)</label>
                <select
                  value={deptForm.headEmployeeId}
                  onChange={(e) => setDeptForm({ ...deptForm, headEmployeeId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="">Select Department Head (Optional)</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} ({emp.employeeCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={deptForm.description}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  placeholder="Department scope and operations..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeptModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                >
                  {editingDeptId ? 'Update Department' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Designation Modal (Add / Edit) */}
      {showDesigModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">{editingDesigId ? 'Edit Designation' : 'Add Designation'}</h2>
              <button onClick={() => setShowDesigModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDesig} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Designation Code</label>
                  <input
                    type="text"
                    required
                    placeholder="SR-SWE"
                    value={desigForm.code}
                    onChange={(e) => setDesigForm({ ...desigForm, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Job Title</label>
                  <input
                    type="text"
                    required
                    placeholder="Senior Software Engineer"
                    value={desigForm.title}
                    onChange={(e) => setDesigForm({ ...desigForm, title: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Seniority Level (1 to 10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  required
                  value={desigForm.level}
                  onChange={(e) => setDesigForm({ ...desigForm, level: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowDesigModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700"
                >
                  {editingDesigId ? 'Update Designation' : 'Create Designation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
