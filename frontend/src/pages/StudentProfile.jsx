import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import ScoreBreakdownModal from '../components/ScoreBreakdownModal';
import {
  ArrowLeft,
  Award,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Compass,
  LifeBuoy,
  UserCheck,
  Sliders,
  Sparkles,
  ShieldAlert,
  Calendar
} from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip
} from 'recharts';

export default function StudentProfile({ studentId, onBack, onNavigate, onSimulateStudent }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    async function load() {
      if (!studentId) return;
      setLoading(true);
      try {
        const data = await api.getStudentProfile(studentId);
        setProfile(data);
      } catch (err) {
        console.error('Failed to load student profile:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [studentId]);

  if (loading || !profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const st = profile.student || {};
  const breakdown = profile.score_breakdown || {};
  const risks = profile.risk_evaluation || {};
  const marks = profile.subject_marks || [];
  const milestones = profile.milestones || [];
  const interventions = profile.interventions || [];
  const mentor = profile.mentor;

  // Radar chart data for 6 components
  const radarData = [
    { subject: 'Academics (30%)', value: st.academic_score || 0, fullMark: 100 },
    { subject: 'Attendance (20%)', value: st.attendance_pct || 0, fullMark: 100 },
    { subject: 'LMS Activity (15%)', value: st.lms_activity_score || 0, fullMark: 100 },
    { subject: 'Engagement (10%)', value: st.engagement_score || 0, fullMark: 100 },
    { subject: 'Placement (15%)', value: st.placement_readiness_score || 0, fullMark: 100 },
    { subject: 'Skills (10%)', value: st.skills_score || 0, fullMark: 100 },
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Top Navigation Back */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Cohort Explorer</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (onSimulateStudent) onSimulateStudent(st);
              if (onNavigate) onNavigate('what-if-simulator');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span>Simulate in What-If Engine</span>
          </button>
          <button
            onClick={() => setShowBreakdown(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md transition-colors"
          >
            <Award className="w-3.5 h-3.5" />
            <span>Score Audit Breakdown</span>
          </button>
        </div>
      </div>

      {/* Profile Header Hero */}
      <div className="glass-panel-glow p-6 rounded-2xl border border-indigo-500/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-[2px] shrink-0">
            <div className="w-full h-full bg-[#0a0f1d] rounded-[14px] flex items-center justify-center text-xl font-bold text-cyan-400">
              {st.name?.charAt(0)}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-extrabold text-white">{st.name}</h2>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                {st.student_id}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/40">
                {st.branch} • Year {st.year}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Email: {st.email} • Career Goal: <strong className="text-slate-200">{st.career_goal}</strong>
            </p>
          </div>
        </div>

        {/* Badges and summary metrics */}
        <div className="flex items-center gap-4 text-center">
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 min-w-24">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Success Score</p>
            <p className="text-xl font-extrabold text-cyan-400">{st.success_score}<span className="text-xs text-slate-400">/100</span></p>
          </div>
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 min-w-24">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Comeback Score</p>
            <p className="text-xl font-extrabold text-emerald-400">{st.comeback_score}</p>
          </div>
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 min-w-24">
            <p className="text-[10px] text-slate-400 uppercase font-semibold">Class Rank</p>
            <p className="text-xl font-extrabold text-white">#{st.class_rank}</p>
          </div>
        </div>
      </div>

      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Radar & Evidence */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Radar Chart */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-white">Holistic Component Radar</h3>
              <span className="text-[10px] text-slate-400">Normalized [0-100]</span>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis stroke="#475569" domain={[0, 100]} />
                  <Radar name="Student Score" dataKey="value" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.35} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px' }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Early Warning Evidence Box */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Early Warning Evidence & Rules</span>
            </h3>

            {risks.warnings?.length > 0 ? (
              <div className="space-y-3">
                {risks.warnings.map((w, idx) => (
                  <div key={idx} className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-rose-300">{w.rule}</span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
                        {w.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Indicator: <strong className="text-white">{w.actual_value}</strong> (Threshold: {w.threshold})
                    </p>
                    <p className="text-[11px] text-slate-400">{w.evidence}</p>
                    <div className="pt-1 text-[11px] text-cyan-300 flex items-center gap-1">
                      <span>Action:</span>
                      <span>{w.recommended_action}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>No critical risks triggered. Student maintains good academic standing.</span>
              </div>
            )}
          </div>

          {/* Assigned Mentor Card */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <UserCheck className="w-4 h-4 text-indigo-400" />
              <span>Primary Faculty Mentor</span>
            </h3>
            {mentor ? (
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs">
                <p className="font-bold text-white text-sm">{mentor.name}</p>
                <p className="text-slate-400 mt-0.5">{mentor.designation} • {mentor.department}</p>
                <p className="text-indigo-300 text-[11px] mt-1">{mentor.specialization}</p>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">ID: {mentor.staff_id} • Current Mentees: {mentor.current_mentees}/{mentor.max_mentees}</p>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No primary mentor currently linked.</p>
            )}
          </div>

        </div>

        {/* Right Column: Marks, Milestones, Interventions */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Subject Marks */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-cyan-400" />
              <span>Subject Performance & Internal Marks</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3 text-center">Internals</th>
                    <th className="py-2.5 px-3 text-center">Assignment</th>
                    <th className="py-2.5 px-3 text-center">Lab</th>
                    <th className="py-2.5 px-3 text-center">Total %</th>
                    <th className="py-2.5 px-3 text-center">Grade</th>
                    <th className="py-2.5 px-3 text-right">Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {marks.map((sm) => (
                    <tr key={sm.id}>
                      <td className="py-2.5 px-3">
                        <p className="font-semibold text-white">{sm.subject_name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{sm.subject_code}</p>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-300">{sm.internal_marks}/40</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-300">{sm.assignment_marks}/20</td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-300">{sm.lab_marks}/20</td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-white">{sm.total_percentage}%</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-slate-800 font-mono text-slate-300">{sm.grade}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {sm.is_weak_subject ? (
                          <span className="text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                            Weak
                          </span>
                        ) : (
                          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                            Passing
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Milestones */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <Compass className="w-4 h-4 text-indigo-400" />
              <span>Personalized Roadmap Milestones</span>
            </h3>

            <div className="space-y-2.5">
              {milestones.map((m) => (
                <div key={m.id} className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">{m.title}</span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">{m.track}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{m.description}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    m.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-300'
                  }`}>
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Interventions Log */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
              <LifeBuoy className="w-4 h-4 text-emerald-400" />
              <span>Interventions & Counseling History</span>
            </h3>

            {interventions.length > 0 ? (
              <div className="space-y-2.5">
                {interventions.map((i) => (
                  <div key={i.id} className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{i.concern}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        i.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-300'
                      }`}>
                        {i.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">Plan: {i.action_plan}</p>
                    {i.outcome_notes && (
                      <p className="text-[11px] text-emerald-400 font-medium">Outcome: {i.outcome_notes}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No interventions logged for this student.</p>
            )}
          </div>

        </div>

      </div>

      {/* Modal */}
      <ScoreBreakdownModal
        isOpen={showBreakdown}
        onClose={() => setShowBreakdown(false)}
        scoreBreakdown={breakdown}
        studentName={st.name}
      />

    </div>
  );
}
