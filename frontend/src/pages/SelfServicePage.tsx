import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Clock,
  CalendarCheck,
  Banknote,
  Laptop,
  GraduationCap,
  ScanFace,
  CheckCircle2,
  AlertCircle,
  Eye,
  Mail,
  Building
} from 'lucide-react';

export const SelfServicePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [balances, setBalances] = useState<any[]>([]);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSelfService() {
      if (!user?.employee?.id) return;
      try {
        const [profRes, balRes, slipRes] = await Promise.all([
          api.get(`/employees/${user.employee.id}`),
          api.get('/leaves/balances'),
          api.get('/payroll/payslips/my')
        ]);

        if (profRes.data?.success) setProfile(profRes.data.data);
        if (balRes.data?.success) setBalances(balRes.data.data);
        if (slipRes.data?.success) setPayslips(slipRes.data.data);
      } catch (err) {
        console.error('Failed to load self-service profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSelfService();
  }, [user]);

  const handlePunch = async (punchType: 'CHECK_IN' | 'CHECK_OUT') => {
    try {
      const res = await api.post('/attendance/punch', { punchType, source: 'WEB' });
      if (res.data?.success) {
        alert(res.data.message);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Punch failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center font-bold text-2xl border border-white/20">
            {profile?.firstName?.[0] || user?.email?.[0]?.toUpperCase()}
          </div>
          <div>
            <div className="text-xs font-semibold text-blue-200 tracking-wider uppercase">Employee Self-Service Portal</div>
            <h1 className="text-2xl font-black">
              Welcome, {profile ? `${profile.firstName} ${profile.lastName}` : user?.email}
            </h1>
            <div className="text-xs text-blue-100 flex items-center gap-2 mt-1">
              <span>{profile?.employeeCode}</span> • <span>{profile?.designation?.title || 'Senior Engineer'}</span> • <span>{profile?.department?.name || 'Engineering'}</span>
            </div>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => navigate('/face-attendance?tab=enroll')}
            className="px-4 py-2 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-bold transition shadow-md flex items-center gap-2"
          >
            <ScanFace className="w-4 h-4 text-blue-600" />
            {profile?.biometricTemplates?.some((t: any) => t.isActive) ? 'Update My Face ID' : 'Register Face ID'}
          </button>

          <div className="flex items-center gap-2 bg-black/20 p-1.5 rounded-xl backdrop-blur-md border border-white/10">
            <button
              onClick={() => handlePunch('CHECK_IN')}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition shadow-xs"
            >
              Check In
            </button>
            <button
              onClick={() => handlePunch('CHECK_OUT')}
              className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold transition shadow-xs"
            >
              Check Out
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Profile, Face ID, Balances & Payslips */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Profile Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" /> Employment
          </h2>
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400">Work Email</span>
              <span className="font-semibold text-slate-800 truncate max-w-[140px]">{profile?.workEmail}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400">Manager</span>
              <span className="font-semibold text-slate-800">
                {profile?.manager ? `${profile.manager.firstName} ${profile.manager.lastName}` : 'Direct Lead'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400">Branch</span>
              <span className="font-semibold text-slate-800">{profile?.branch?.name || 'New York HQ'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Status</span>
              <span className="font-bold text-emerald-600">{profile?.status || 'ACTIVE'}</span>
            </div>
          </div>
        </div>

        {/* Biometric Face ID Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ScanFace className="w-5 h-5 text-blue-600" /> Face ID
              </h2>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                profile?.biometricTemplates?.some((t: any) => t.isActive) ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {profile?.biometricTemplates?.some((t: any) => t.isActive) ? 'Active' : 'Not Enrolled'}
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {profile?.biometricTemplates?.some((t: any) => t.isActive)
                ? 'Your face template is enrolled. Next time, stand in front of any camera kiosk to punch in automatically.'
                : 'Your face is not registered. Register now to enable touchless kiosk attendance.'}
            </p>
          </div>

          <button
            onClick={() => navigate('/face-attendance?tab=enroll')}
            className={`w-full py-2 px-3 rounded-lg font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-xs ${
              profile?.biometricTemplates?.some((t: any) => t.isActive)
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            <ScanFace className="w-3.5 h-3.5" />
            {profile?.biometricTemplates?.some((t: any) => t.isActive) ? 'Update Face ID' : 'Enroll Face ID Now'}
          </button>
        </div>

        {/* Leave Balances Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-emerald-600" /> Leave Balances
          </h2>
          <div className="space-y-3">
            {balances.map((bal) => (
              <div key={bal.id} className="p-3 bg-slate-50 rounded-lg flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-800 text-xs">{bal.leaveType?.name}</div>
                  <div className="text-[11px] text-slate-400">Used {Number(bal.taken)}d this year</div>
                </div>
                <div className="text-lg font-bold text-slate-900 font-mono">
                  {Number(bal.balance)} <span className="text-xs font-normal text-slate-500">left</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payslips Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
            <Banknote className="w-5 h-5 text-indigo-600" /> Latest Payslip
          </h2>
          {payslips.length > 0 ? (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs font-bold text-blue-600">{payslips[0].payslipNumber}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">PAID</span>
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                ${Number(payslips[0].payrollItem?.netPay).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-slate-500">
                Disbursed for {payslips[0].month}/{payslips[0].year} cycle
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-400">No payslips issued yet.</div>
          )}
        </div>
      </div>
    </div>
  );
};

