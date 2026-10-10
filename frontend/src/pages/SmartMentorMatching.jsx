import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  UserCheck,
  Search,
  Sparkles,
  Award,
  CheckCircle2,
  Users,
  Briefcase,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function SmartMentorMatching({ onNavigate }) {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [matchResult, setMatchResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    async function loadStudents() {
      try {
        const res = await api.getStudents({ limit: 100 });
        setStudents(res.students || []);
        if (res.students?.length > 0) {
          setSelectedStudentId(res.students[0].student_id);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadStudents();
  }, []);

  const runMatching = async (studentId) => {
    if (!studentId) return;
    setLoading(true);
    try {
      const res = await api.getMentorCandidates(studentId);
      setMatchResult(res);
    } catch (err) {
      console.error('Failed to run smart mentor match:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStudentId) {
      runMatching(selectedStudentId);
    }
  }, [selectedStudentId]);

  const handleAssign = async (facultyId) => {
    setAssigning(true);
    try {
      const res = await api.assignMentor({
        student_id: selectedStudentId,
        faculty_id: facultyId
      });
      setSuccessMsg(res.message);
      runMatching(selectedStudentId);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      alert(err.message);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-indigo-400" />
            <span>Smart Mentor Matching Algorithm</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Optimized faculty pairing based on subject deficiency, research specialization, and mentee workload balancing.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Student Selector Bar */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-300">Select Student to Pair with Mentor:</label>
          <div className="flex items-center gap-2">
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
            >
              {students.map((s) => (
                <option key={s.student_id} value={s.student_id}>
                  {s.student_id} — {s.name} ({s.branch}, Y{s.year}) - Goal: {s.career_goal}
                </option>
              ))}
            </select>
          </div>
        </div>

        {matchResult && (
          <div className="text-xs text-slate-300 flex items-center gap-3">
            <div>
              <span className="text-slate-400 block text-[10px]">Student Career Ambition</span>
              <strong className="text-cyan-300">{matchResult.career_goal}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Department</span>
              <strong className="text-indigo-300">{matchResult.branch}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Match Candidates List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-400" />
          <span>Ranked Faculty Mentor Candidates (Highest Match First)</span>
        </h3>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Evaluating faculty specialization and workload capacity...
          </div>
        ) : matchResult?.candidates?.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs glass-panel rounded-2xl border border-slate-800">
            No teaching faculty found for this department.
          </div>
        ) : (
          matchResult?.candidates?.map((fac) => (
            <div
              key={fac.faculty_id}
              className={`glass-panel p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                fac.is_current_mentor ? 'border-cyan-500/50 bg-cyan-950/10' : 'border-slate-800'
              }`}
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-white">{fac.faculty_name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                    {fac.faculty_id}
                  </span>
                  <span className="text-xs text-slate-400">{fac.designation} • Dept: {fac.department}</span>
                  {fac.is_current_mentor && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      Currently Assigned Mentor
                    </span>
                  )}
                </div>

                <p className="text-xs text-indigo-300 font-medium">
                  Specialization: {fac.specialization}
                </p>

                {/* Match Reasons Pill list */}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {fac.match_reasons?.map((r, i) => (
                    <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-slate-900 text-emerald-300 border border-slate-800 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                      <span>{r}</span>
                    </span>
                  ))}
                </div>

                <div className="text-[11px] text-slate-400 pt-1">
                  Workload: <strong className="text-white">{fac.current_mentees} / {fac.max_mentees}</strong> mentees assigned
                </div>
              </div>

              {/* Match Score & Action */}
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Fit Score</span>
                  <span className="text-2xl font-black font-mono text-cyan-400">
                    {fac.match_score}%
                  </span>
                </div>

                {!fac.is_current_mentor ? (
                  <button
                    onClick={() => handleAssign(fac.faculty_id)}
                    disabled={assigning}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
                  >
                    Assign Mentor
                  </button>
                ) : (
                  <span className="text-xs text-slate-400 font-mono">Active</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
