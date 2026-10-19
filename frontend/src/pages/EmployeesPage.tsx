import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  Building,
  CheckCircle2,
  XCircle,
  FileText,
  ShieldAlert,
  X,
  Download,
  Unlock
} from 'lucide-react';

export const EmployeesPage: React.FC = () => {
  const { hasRole } = useAuth();
  const canManageBiometrics = hasRole('Super Admin', 'Org Admin', 'HR Admin', 'HR Manager');
  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [designations, setDesignations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isResettingBiometric, setIsResettingBiometric] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    workEmail: '',
    phone: '',
    departmentId: '',
    designationId: '',
    branchId: '',
    employmentType: 'FULL_TIME',
    joiningDate: new Date().toISOString().split('T')[0]
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [empRes, deptRes, branchRes, desigRes] = await Promise.all([
        api.get('/employees', {
          params: { search, departmentId: selectedDept, status: selectedStatus }
        }),
        api.get('/organization/departments'),
        api.get('/organization/branches'),
        api.get('/organization/designations')
      ]);

      if (empRes.data?.success) setEmployees(empRes.data.data);
      if (deptRes.data?.success) setDepartments(deptRes.data.data);
      if (branchRes.data?.success) setBranches(branchRes.data.data);
      if (desigRes.data?.success) setDesignations(desigRes.data.data);
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search, selectedDept, selectedStatus]);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/employees', formData);
      if (res.data?.success) {
        setShowAddModal(false);
        setFormData({
          firstName: '',
          lastName: '',
          workEmail: '',
          phone: '',
          departmentId: '',
          designationId: '',
          branchId: '',
          employmentType: 'FULL_TIME',
          joiningDate: new Date().toISOString().split('T')[0]
        });
        loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create employee');
    }
  };

  const openEmployeeDetails = async (id: string) => {
    try {
      const res = await api.get(`/employees/${id}`);
      if (res.data?.success) {
        setSelectedEmployee(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load employee profile:', err);
    }
  };

  const exportEmployeesCSV = () => {
    let csv = 'Employee Code,First Name,Last Name,Work Email,Phone,Department,Designation,Branch,Status\n';
    employees.forEach((emp) => {
      csv += `"${emp.employeeCode}","${emp.firstName}","${emp.lastName}","${emp.workEmail}","${emp.phone || ''}","${emp.department?.name || ''}","${emp.designation?.title || ''}","${emp.branch?.name || ''}","${emp.status}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employee_directory_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleResetBiometrics = async (employeeId: string, employeeName: string) => {
    if (
      !window.confirm(
        `Are you sure you want to unlock and reset the biometric face template for ${employeeName}?\n\nThis will remove their active biometric face record and allow a new face scan enrollment.`
      )
    ) {
      return;
    }

    setIsResettingBiometric(true);
    try {
      const res = await api.post('/biometric/revoke', { employeeId });
      if (res.data?.success) {
        alert('Biometric face template has been unlocked and reset successfully. The employee can now re-enroll their face.');
        setSelectedEmployee((prev: any) => (prev ? { ...prev, biometricTemplates: [] } : null));
        loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to unlock biometric profile.');
    } finally {
      setIsResettingBiometric(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Employee Directory</h1>
          <p className="text-sm text-slate-500">Manage workforce profiles, lifecycle events, and compliance records.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportEmployeesCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          {hasRole('Super Admin', 'HR Admin', 'HR Manager') && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              Add Employee
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
            placeholder="Search by name, employee code, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={selectedDept}
          onChange={(e) => setSelectedDept(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PROBATION">Probation</option>
          <option value="ON_LEAVE">On Leave</option>
          <option value="RESIGNED">Resigned</option>
        </select>
      </div>

      {/* Employee Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 text-xs font-semibold uppercase text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Employee</th>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Department & Role</th>
                <th className="px-6 py-4">Branch</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Loading directory...</td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">No employee records match the filter criteria.</td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/60 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs uppercase">
                          {emp.firstName[0]}{emp.lastName[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{emp.firstName} {emp.lastName}</div>
                          <div className="text-xs text-slate-400 flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {emp.workEmail}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-medium text-xs text-slate-600">
                      {emp.employeeCode}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{emp.designation?.title || 'Staff'}</div>
                      <div className="text-xs text-slate-400">{emp.department?.name || 'General'}</div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600">
                      {emp.branch?.name || 'Main HQ'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                        emp.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEmployeeDetails(emp.id)}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-xs font-medium text-slate-700 transition"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Add New Employee Profile</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Work Email</label>
                <input
                  type="email"
                  required
                  value={formData.workEmail}
                  onChange={(e) => setFormData({ ...formData, workEmail: e.target.value })}
                  placeholder="name@company.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                  <select
                    value={formData.departmentId}
                    onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                  <select
                    value={formData.designationId}
                    onChange={(e) => setFormData({ ...formData, designationId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="">Select Designation</option>
                    {designations.map((desig) => (
                      <option key={desig.id} value={desig.id}>{desig.title}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Branch</label>
                  <select
                    value={formData.branchId}
                    onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="">Select Branch</option>
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={formData.joiningDate}
                    onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  >
                  </input>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                >
                  Create Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Employee Profile View Modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[85vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                  {selectedEmployee.firstName[0]}{selectedEmployee.lastName[0]}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </h2>
                  <div className="text-xs text-blue-600 font-mono font-medium">
                    {selectedEmployee.employeeCode} • {selectedEmployee.designation?.title || 'Staff'}
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedEmployee(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-slate-400 font-medium">Department</div>
                <div className="text-slate-800 font-semibold mt-0.5">{selectedEmployee.department?.name || 'N/A'}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-slate-400 font-medium">Work Location</div>
                <div className="text-slate-800 font-semibold mt-0.5">{selectedEmployee.branch?.name || 'Main HQ'}</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-slate-400 font-medium">Reporting Manager</div>
                <div className="text-slate-800 font-semibold mt-0.5">
                  {selectedEmployee.manager ? `${selectedEmployee.manager.firstName} ${selectedEmployee.manager.lastName}` : 'Executive / None'}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg">
                <div className="text-slate-400 font-medium">Biometric Face ID Status</div>
                <div className="text-slate-800 font-semibold mt-1 flex items-center justify-between">
                  {selectedEmployee.biometricTemplates?.length > 0 ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Enrolled (Locked)
                    </span>
                  ) : (
                    <span className="text-amber-600 font-bold">Not Enrolled</span>
                  )}
                  {canManageBiometrics && selectedEmployee.biometricTemplates?.length > 0 && (
                    <button
                      type="button"
                      onClick={() => handleResetBiometrics(selectedEmployee.id, `${selectedEmployee.firstName} ${selectedEmployee.lastName}`)}
                      disabled={isResettingBiometric}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-md text-[11px] font-semibold transition flex items-center gap-1 disabled:opacity-50"
                      title="Unlock employee to allow re-enrollment"
                    >
                      <Unlock className="w-3 h-3 text-amber-700" />
                      {isResettingBiometric ? 'Resetting...' : 'Unlock / Reset'}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Employment History Timeline */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Effective-Dated History</h3>
              <div className="space-y-2">
                {selectedEmployee.employmentHistories?.map((h: any) => (
                  <div key={h.id} className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs flex justify-between">
                    <div>
                      <span className="font-semibold text-slate-800">{h.changeReason}</span>
                      <p className="text-slate-500 text-[11px]">{h.notes}</p>
                    </div>
                    <span className="text-slate-400 text-[11px]">{new Date(h.effectiveDate).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedEmployee(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-200"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

