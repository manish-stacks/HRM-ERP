import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  Settings,
  ShieldCheck,
  Save,
  CheckCircle2,
  ScanFace,
  Clock,
  Palette
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [org, setOrg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    enableFaceBiometrics: true,
    biometricThreshold: 0.60,
    requireLivenessCheck: true,
    allowManualAttendance: true,
    autoApproveOvertime: false,
    overtimeGraceMinutes: 15,
    maxCarryForwardDays: 10,
    brandingPrimaryColor: '#2563eb'
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await api.get('/organization');
        if (res.data?.success) {
          setOrg(res.data.data);
          if (res.data.data.settings) {
            setForm({
              enableFaceBiometrics: res.data.data.settings.enableFaceBiometrics,
              biometricThreshold: Number(res.data.data.settings.biometricThreshold),
              requireLivenessCheck: res.data.data.settings.requireLivenessCheck,
              allowManualAttendance: res.data.data.settings.allowManualAttendance,
              autoApproveOvertime: res.data.data.settings.autoApproveOvertime,
              overtimeGraceMinutes: res.data.data.settings.overtimeGraceMinutes,
              maxCarryForwardDays: res.data.data.settings.maxCarryForwardDays,
              brandingPrimaryColor: res.data.data.settings.brandingPrimaryColor
            });
          }
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.put('/organization/settings', form);
      if (res.data?.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update settings');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Organization & System Settings</h1>
        <p className="text-sm text-slate-500">Configure global attendance rules, biometric thresholds, and statutory fiscal preferences.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Organization Information Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">Corporate Identity</h2>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-medium">Organization Name:</span>
              <div className="font-semibold text-slate-800 text-sm mt-0.5">{org?.name}</div>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Tenant Code:</span>
              <div className="font-mono font-bold text-blue-600 text-sm mt-0.5">{org?.code}</div>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Configured Timezone:</span>
              <div className="font-semibold text-slate-800 mt-0.5">{org?.timezone}</div>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Default Currency:</span>
              <div className="font-semibold text-slate-800 mt-0.5">{org?.currency}</div>
            </div>
          </div>
        </div>

        {/* Biometric & Attendance Settings */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
            <ScanFace className="w-5 h-5 text-blue-600" /> Biometrics & Attendance Policies
          </h2>

          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer">
              <div>
                <div className="text-sm font-semibold text-slate-900">Enable Facial Biometric Scanner</div>
                <div className="text-xs text-slate-500">Permit webcam and mobile camera facial recognition check-in</div>
              </div>
              <input
                type="checkbox"
                checked={form.enableFaceBiometrics}
                onChange={(e) => setForm({ ...form, enableFaceBiometrics: e.target.checked })}
                className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
              />
            </label>

            <div className="p-3 bg-slate-50 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Cosine Similarity Matching Threshold</div>
                  <div className="text-xs text-slate-500">Minimum vector confidence required for positive facial match</div>
                </div>
                <span className="text-sm font-bold text-blue-600 font-mono">{(form.biometricThreshold * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.40"
                max="0.95"
                step="0.05"
                value={form.biometricThreshold}
                onChange={(e) => setForm({ ...form, biometricThreshold: Number(e.target.value) })}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <label className="flex items-center justify-between p-3 bg-slate-50 rounded-lg cursor-pointer">
              <div>
                <div className="text-sm font-semibold text-slate-900">Enforce Optical Liveness Anti-Spoofing</div>
                <div className="text-xs text-slate-500">Verify micromovements to prevent printed photo or digital screen spoofing</div>
              </div>
              <input
                type="checkbox"
                checked={form.requireLivenessCheck}
                onChange={(e) => setForm({ ...form, requireLivenessCheck: e.target.checked })}
                className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Overtime Grace Minutes</label>
                <input
                  type="number"
                  value={form.overtimeGraceMinutes}
                  onChange={(e) => setForm({ ...form, overtimeGraceMinutes: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Max Annual Leave Carry-Over (Days)</label>
                <input
                  type="number"
                  value={form.maxCarryForwardDays}
                  onChange={(e) => setForm({ ...form, maxCarryForwardDays: Number(e.target.value) })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between">
          {saved && (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
              <CheckCircle2 className="w-4 h-4" /> Settings updated successfully!
            </span>
          )}
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-sm ml-auto transition"
          >
            <Save className="w-4 h-4" /> Save System Settings
          </button>
        </div>
      </form>
    </div>
  );
};

