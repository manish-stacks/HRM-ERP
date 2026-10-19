import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import {
  GraduationCap,
  Award,
  CheckCircle2,
  Clock,
  BookOpen
} from 'lucide-react';

export const TrainingPage: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, aRes] = await Promise.all([
        api.get('/training/courses'),
        api.get('/training/assignments')
      ]);

      if (cRes.data?.success) setCourses(cRes.data.data);
      if (aRes.data?.success) setAssignments(aRes.data.data);
    } catch (err) {
      console.error('Failed to load training:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleComplete = async (assignmentId: string) => {
    try {
      const res = await api.post(`/training/assignments/${assignmentId}/complete`);
      if (res.data?.success) {
        loadData();
      }
    } catch (err) {
      console.error('Failed to complete course:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Training & Professional Development</h1>
        <p className="text-sm text-slate-500">Corporate compliance courses, security certifications, and skills enablement.</p>
      </div>

      {/* Courses Catalog */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map((course) => (
          <div key={course.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-600 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {course.durationHours} Hours Duration
              </span>
              {course.isMandatory && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                  MANDATORY COMPLIANCE
                </span>
              )}
            </div>
            <h3 className="font-bold text-slate-900 text-base">{course.title}</h3>
            <p className="text-xs text-slate-600">{course.description}</p>
          </div>
        ))}
      </div>

      {/* Employee Assignments */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" /> Assigned Training Modules
          </h2>
        </div>

        <div className="divide-y divide-slate-100">
          {assignments.map((asg) => (
            <div key={asg.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{asg.course?.title}</h4>
                <div className="text-xs text-slate-500">
                  Assigned to: {asg.employee?.firstName} {asg.employee?.lastName} ({asg.employee?.employeeCode})
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                  asg.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {asg.status}
                </span>

                {asg.status !== 'COMPLETED' && (
                  <button
                    onClick={() => handleComplete(asg.id)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                  >
                    Mark Complete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

