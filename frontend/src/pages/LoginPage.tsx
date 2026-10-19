import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Building2, ScanFace } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('admin@apexglobal.io');
  const [password, setPassword] = useState('Admin@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.success) {
        login(res.data.data.token, res.data.data.user);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Admin@123');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-8 z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">
            A
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Apex Enterprise HRM</h1>
            <p className="text-xs text-slate-500">Sign in to access corporate workspace</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-red-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Work Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm rounded-lg shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Workspace'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Biometric Face Punch Without Login */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate('/kiosk')}
            className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2"
          >
            <ScanFace className="w-4 h-4" />
            <span>Biometric Kiosk (Direct Face Punch In)</span>
          </button>
        </div>

        {/* Quick Demo Fill Buttons */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
            Quick Demo Accounts (Password: Admin@123)
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setDemoCredentials('admin@apexglobal.io')}
              className="py-1.5 px-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 rounded text-xs font-medium text-slate-700 transition text-center truncate"
            >
              👑 Admin
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('manager@apexglobal.io')}
              className="py-1.5 px-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 rounded text-xs font-medium text-slate-700 transition text-center truncate"
            >
              💼 Manager
            </button>
            <button
              type="button"
              onClick={() => setDemoCredentials('john.doe@apexglobal.io')}
              className="py-1.5 px-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 rounded text-xs font-medium text-slate-700 transition text-center truncate"
            >
              🧑 Employee
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-slate-500 flex items-center gap-2 z-10">
        <ShieldCheck className="w-4 h-4 text-emerald-400" />
        <span>Enterprise RBAC & AES-256 Biometric Protected System</span>
      </div>
    </div>
  );
};

