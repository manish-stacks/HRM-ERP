import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp,
  Target,
  Award,
  CheckCircle,
  Plus,
  Percent
} from 'lucide-react';

export const PerformancePage: React.FC = () => {
  const [cycles, setCycles] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cycRes, goalRes] = await Promise.all([
        api.get('/performance/cycles'),
        api.get('/performance/goals')
      ]);

      if (cycRes.data?.success) setCycles(cycRes.data.data);
      if (goalRes.data?.success) setGoals(goalRes.data.data);
    } catch (err) {
      console.error('Failed to load performance data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateProgress = async (id: string, newProgress: number) => {
    try {
      await api.patch(`/performance/goals/${id}/progress`, { progress: newProgress });
      loadData();
    } catch (err) {
      console.error('Failed to update goal progress:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Performance & Goal Management</h1>
          <p className="text-sm text-slate-500">Corporate review cycles, KPI goal weighting, and performance appraisal evaluations.</p>
        </div>
      </div>

      {/* Review Cycles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cycles.map((c) => (
          <div key={c.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Review Cycle</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">
                {c.status}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900">{c.title}</h3>
            <div className="text-xs text-slate-500">
              Period: {new Date(c.startDate).toLocaleDateString()} to {new Date(c.endDate).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      {/* Goal Objectives Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Target className="w-4 h-4 text-blue-600" /> Active Employee Performance Goals
          </h2>
        </div>

        <div className="divide-y divide-slate-100">
          {goals.map((goal) => (
            <div key={goal.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition">
              <div className="space-y-1 max-w-lg">
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-sm">{goal.title}</h4>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700">
                    Weight: {goal.weightage}%
                  </span>
                </div>
                <p className="text-xs text-slate-600">{goal.description}</p>
                <div className="text-[11px] text-slate-400 font-medium">
                  Assigned to: {goal.employee?.firstName} {goal.employee?.lastName} ({goal.employee?.employeeCode})
                </div>
              </div>

              {/* Progress Slider */}
              <div className="w-full sm:w-64 space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-600">Goal Progress</span>
                  <span className="text-blue-600">{goal.progress}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={goal.progress}
                  onChange={(e) => handleUpdateProgress(goal.id, Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

