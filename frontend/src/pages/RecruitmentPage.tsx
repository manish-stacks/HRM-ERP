import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  UserCheck,
  Plus,
  Briefcase,
  Star,
  Clock,
  ArrowRight,
  X
} from 'lucide-react';

export const RecruitmentPage: React.FC = () => {
  const { hasRole } = useAuth();
  const [requisitions, setRequisitions] = useState<any[]>([]);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddCandidateModal, setShowAddCandidateModal] = useState(false);
  const [candidateForm, setCandidateForm] = useState({
    requisitionId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    source: 'LINKEDIN'
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [reqRes, candRes] = await Promise.all([
        api.get('/recruitment/requisitions'),
        api.get('/recruitment/candidates')
      ]);

      if (reqRes.data?.success) setRequisitions(reqRes.data.data);
      if (candRes.data?.success) setCandidates(candRes.data.data);
    } catch (err) {
      console.error('Failed to load recruitment data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStage = async (id: string, stage: string) => {
    try {
      const res = await api.patch(`/recruitment/candidates/${id}/stage`, { stage });
      if (res.data?.success) {
        loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update candidate stage');
    }
  };

  const handleAddCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/recruitment/candidates', candidateForm);
      if (res.data?.success) {
        setShowAddCandidateModal(false);
        setCandidateForm({ requisitionId: '', firstName: '', lastName: '', email: '', phone: '', source: 'LINKEDIN' });
        loadData();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add candidate');
    }
  };

  const stages = ['APPLIED', 'SCREENING', 'INTERVIEW', 'OFFERED', 'HIRED'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Recruitment & Applicant Tracking (ATS)</h1>
          <p className="text-sm text-slate-500">Job postings, candidate evaluation pipelines, and interview schedules.</p>
        </div>
        <button
          onClick={() => setShowAddCandidateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-xs transition"
        >
          <Plus className="w-4 h-4" /> Add Candidate
        </button>
      </div>

      {/* Active Requisitions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {requisitions.map((req) => (
          <div key={req.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">
                {req.status}
              </span>
              <span className="text-xs text-slate-400 font-medium">{req.openings} Openings</span>
            </div>
            <h3 className="font-bold text-slate-900 text-base">{req.title}</h3>
            <div className="text-xs text-slate-500">{req.department?.name} • {req.experienceYears}+ years exp</div>
          </div>
        ))}
      </div>

      {/* Kanban Pipeline Columns */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-blue-600" /> Candidate Pipeline Funnel
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {stages.map((stage) => {
            const list = candidates.filter((c) => c.stage === stage);
            return (
              <div key={stage} className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex flex-col">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
                  <span className="text-xs font-bold text-slate-700">{stage}</span>
                  <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">
                    {list.length}
                  </span>
                </div>

                <div className="space-y-2 flex-1">
                  {list.map((cand) => (
                    <div key={cand.id} className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs space-y-2">
                      <div className="font-semibold text-slate-900 text-xs">
                        {cand.firstName} {cand.lastName}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">{cand.email}</div>
                      <div className="text-[10px] text-blue-600 font-medium">{cand.requisition?.title}</div>

                      {/* Stage Progression Selector */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <select
                          value={cand.stage}
                          onChange={(e) => handleUpdateStage(cand.id, e.target.value)}
                          className="text-[10px] font-semibold bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5"
                        >
                          {stages.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Candidate Modal */}
      {showAddCandidateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="text-lg font-bold text-slate-900">Add Candidate to Pipeline</h2>
              <button onClick={() => setShowAddCandidateModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCandidate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Requisition</label>
                <select
                  required
                  value={candidateForm.requisitionId}
                  onChange={(e) => setCandidateForm({ ...candidateForm, requisitionId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="">Select Requisition...</option>
                  {requisitions.map((r) => (
                    <option key={r.id} value={r.id}>{r.title}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={candidateForm.firstName}
                    onChange={(e) => setCandidateForm({ ...candidateForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={candidateForm.lastName}
                    onChange={(e) => setCandidateForm({ ...candidateForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Candidate Email</label>
                <input
                  type="email"
                  required
                  value={candidateForm.email}
                  onChange={(e) => setCandidateForm({ ...candidateForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddCandidateModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                >
                  Add Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

