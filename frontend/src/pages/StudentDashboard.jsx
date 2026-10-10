import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import ScoreBreakdownModal from '../components/ScoreBreakdownModal';
import {
  Award,
  TrendingUp,
  CheckCircle2,
  Calendar,
  Compass,
  Gamepad2,
  Flame,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  Zap,
  Target,
  BookOpen,
  Sparkles,
  ClipboardList,
  Clock,
  Send,
  ExternalLink,
  Check,
  AlertCircle,
  User,
  X
} from 'lucide-react';

export default function StudentDashboard({ onNavigate }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'tasks', 'academics'
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBreakdown, setShowBreakdown] = useState(false);
  
  // Student Tasks
  const [tasks, setTasks] = useState([]);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitMsg, setSubmitMsg] = useState(null);

  const [resolvedStudentId, setResolvedStudentId] = useState(user?.student_id || null);

  const fetchProfileAndTasks = async () => {
    try {
      setLoading(true);
      let targetId = user?.student_id || resolvedStudentId;
      if (!targetId) {
        const studentsResp = await api.getStudents();
        if (studentsResp?.students && studentsResp.students.length > 0) {
          targetId = studentsResp.students[0].student_id;
          setResolvedStudentId(targetId);
        }
      }

      if (targetId) {
        const [pData, tData] = await Promise.all([
          api.getStudentProfile(targetId),
          api.getTasks()
        ]);
        setProfileData(pData);
        setTasks(tData.tasks || []);
      } else {
        const tData = await api.getTasks();
        setTasks(tData.tasks || []);
      }
    } catch (err) {
      console.error('Failed to fetch student profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileAndTasks();
  }, [user?.student_id]);

  const handleSubmitTask = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;
    setSubmitLoading(true);
    setSubmitMsg(null);
    try {
      await api.submitTask(selectedTask.id, {
        submission_text: submissionText,
        attachment_url: attachmentUrl
      });
      setSubmitMsg('Assignment submitted successfully! Your mentor will review it.');
      setTimeout(() => {
        setShowSubmitModal(false);
        setSubmitMsg(null);
        setSubmissionText('');
        setAttachmentUrl('');
      }, 2000);
      fetchProfileAndTasks();
    } catch (err) {
      setSubmitMsg(err.message || 'Failed to submit task');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading && !profileData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const st = profileData?.student || {};
  const breakdown = profileData?.score_breakdown || {};
  const marks = profileData?.subject_marks || [];
  const milestones = profileData?.milestones || [];
  const mentor = profileData?.mentor;

  const isStruggling = (st.success_score || 0) < 60 || st.attendance_risk || st.academic_risk;

  // Task stats
  const pendingTasks = tasks.filter(t => !t.my_submission || t.my_submission.status === 'Pending');
  const submittedTasks = tasks.filter(t => t.my_submission && t.my_submission.status === 'Submitted');
  const completedTasks = tasks.filter(t => t.my_submission && t.my_submission.status === 'Completed');

  return (
    <div className="space-y-6 animate-in fade-in pb-16">
      
      {/* Welcome Banner */}
      <div className="glass-panel-glow p-6 rounded-2xl border border-indigo-500/30 relative overflow-hidden shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
                {st.student_id} • {st.branch} • Year {st.year} (Sem {st.semester})
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                Career Goal: {st.career_goal}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Welcome back, {st.name}! 👋
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-xl">
              {isStruggling 
                ? "Here are achievable, guided milestones to boost your attendance and clear upcoming exam units without stress."
                : "You're on track for campus placement readiness! Complete today's DSA challenge to protect your learning streak."}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setShowBreakdown(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span>Score Breakdown</span>
            </button>
            <button
              onClick={() => onNavigate('learning-arena')}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:opacity-90 text-white text-xs font-semibold shadow-lg shadow-cyan-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Gamepad2 className="w-4 h-4" />
              <span>Quiz Arena</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Student Success Score"
          value={st.success_score > 0 ? `${st.success_score} / 100` : "Provisional"}
          subtext={st.class_rank ? `Class Rank #${st.class_rank}` : "Scores update with marks & attendance"}
          icon={Award}
          color="cyan"
          tooltip="Explainable composite score calculated from all 6 verified indicators"
          onClick={() => setShowBreakdown(true)}
        />
        <StatCard
          title="Comeback Score"
          value={st.comeback_score > 0 ? `${st.comeback_score} / 100` : "0 / 100"}
          subtext={st.prev_semester_score ? `Improvement delta: ${st.prev_semester_score} pts` : "Initial semester baseline"}
          icon={TrendingUp}
          color="emerald"
          tooltip="Special recognition metric rewarding growth from previous baseline"
        />
        <StatCard
          title="Classroom Attendance"
          value={`${st.attendance_pct || 0}%`}
          subtext={st.attendance_pct >= 75 ? "Safe exam eligibility" : (st.attendance_pct > 0 ? "⚠️ Attendance warning active" : "No attendance recorded yet")}
          icon={CheckCircle2}
          color={st.attendance_pct >= 75 ? "emerald" : (st.attendance_pct > 0 ? "rose" : "slate")}
        />
        <StatCard
          title="Learning Streak & Points"
          value={`${st.growth_points || 0} pts`}
          subtext={`🔥 ${st.learning_streak || 0} day streak • ${st.study_hours || 0}h study`}
          icon={Flame}
          color="amber"
          tooltip="Earned by answering Arena questions and clearing roadmap milestones"
          onClick={() => onNavigate('growth-league')}
        />
      </div>

      {/* Academic Performance Guidance Hub (for score < 50% or weak subjects) */}
      {((profileData?.academic_guidance && profileData.academic_guidance.length > 0) || (st.academic_score > 0 && st.academic_score < 50) || (st.success_score > 0 && st.success_score < 50)) && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-purple-950/30 to-rose-950/30 border border-amber-500/40 shadow-xl animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-500/20 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Performance Improvement & Academic Guidance Hub</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold">
                    Score &lt; 50% Remedial Plan
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Actionable guidance recommendations to raise your subject marks above the passing threshold and secure examination eligibility.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('materials')}
                className="px-3 py-1.5 rounded-xl bg-indigo-600/40 hover:bg-indigo-600/60 border border-indigo-500/40 text-indigo-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Study Notes</span>
              </button>
              <button
                onClick={() => onNavigate('learning-arena')}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-90 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>Practice Arena</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(profileData?.academic_guidance || [
              {
                area: "Academic Subject Recovery",
                message: "Current performance is below 50%. Focus on foundational problem sets and consult your faculty mentor.",
                recommended_action: "Review Course Notes & Formula Sheets",
                priority: "HIGH"
              }
            ]).map((g, idx) => (
              <div key={idx} className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0"></div>
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white">{g.area}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                      {g.priority || 'ACTION REQUIRED'}
                    </span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{g.message}</p>
                  <p className="text-cyan-400 text-[11px] font-semibold mt-1.5 flex items-center gap-1">
                    <span>💡 Recommendation: {g.recommended_action}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Overview & Study Roadmaps
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'tasks'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          <span>My Tasks & Assignments ({tasks.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('academics')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'academics'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Course Results & Marks</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & ROADMAPS */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Next Steps & Academic Results */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Actionable Next Steps Card */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-cyan-400" />
                  <span>Personalized Study Milestones & Next Steps</span>
                </h3>
                <button
                  onClick={() => onNavigate('roadmap')}
                  className="text-xs text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Full Roadmap</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-3">
                {milestones.length > 0 ? (
                  milestones.slice(0, 3).map((m) => (
                    <div
                      key={m.id}
                      className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          m.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'
                        }`}>
                          {m.status === 'completed' ? <CheckCircle2 className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-white">{m.title}</span>
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                              {m.track}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{m.description}</p>
                        </div>
                      </div>

                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                        m.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30'
                      }`}>
                        {m.status === 'completed' ? 'Completed' : 'In Progress'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800/60 text-center">
                    <p className="text-xs text-slate-400">No study milestones assigned yet.</p>
                    <button
                      onClick={() => onNavigate('career-mission')}
                      className="mt-2 text-xs text-cyan-400 hover:underline font-semibold"
                    >
                      Set Your Career Goal in Mission Mode →
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Subject Marks Table Preview */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span>Semester Subject Marks Summary</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('academics')}
                  className="text-xs text-cyan-400 hover:underline"
                >
                  View All Details
                </button>
              </div>

              <div className="overflow-x-auto">
                {marks.length > 0 ? (
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        <th className="pb-2.5">Code</th>
                        <th className="pb-2.5">Course Name</th>
                        <th className="pb-2.5 text-center">Internals</th>
                        <th className="pb-2.5 text-center">Score</th>
                        <th className="pb-2.5 text-center">Grade</th>
                        <th className="pb-2.5 text-right">Standing</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {marks.slice(0, 4).map((sm) => (
                        <tr key={sm.id} className="hover:bg-slate-900/50">
                          <td className="py-2.5 font-mono text-cyan-400 font-semibold">{sm.subject_code}</td>
                          <td className="py-2.5 font-medium text-slate-200">{sm.subject_name}</td>
                          <td className="py-2.5 text-center font-mono text-slate-300">{sm.internal_marks}/40</td>
                          <td className="py-2.5 text-center font-mono font-bold text-white">{sm.total_percentage}%</td>
                          <td className="py-2.5 text-center">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-semibold">
                              {sm.grade}
                            </span>
                          </td>
                          <td className="py-2.5 text-right">
                            {sm.is_weak_subject ? (
                              <span className="text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/30">
                                Needs Focus
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                                Proficient
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400">
                    <p>No subject marks entered for this student yet.</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Faculty marks and exam evaluations will be tabulated here.</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Mentor & Radar Preview */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Next Exam Radar Preview Card */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Next Exam Radar</span>
                </h3>
                <button
                  onClick={() => onNavigate('exam-radar')}
                  className="text-xs text-cyan-400 hover:underline cursor-pointer"
                >
                  Inspect Radar
                </button>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                AI difficulty radar matches syllabus topics against your weak areas before exam day.
              </p>
              {marks.length > 0 ? (
                <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{marks[0].subject_name} ({marks[0].subject_code})</span>
                    <span className="text-[10px] text-cyan-400 font-mono">Score: {marks[0].total_percentage}%</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {marks[0].is_weak_subject ? "Priority focus: Revise core conceptual units" : "On track for upcoming semester exams"}
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-center">
                  <p className="text-xs text-slate-400">No active exam difficulty flags.</p>
                  <button
                    onClick={() => onNavigate('learning-arena')}
                    className="mt-1.5 text-[11px] text-cyan-400 hover:underline font-medium inline-block"
                  >
                    Take a Quiz in Arena to Map Weak Areas →
                  </button>
                </div>
              )}
            </div>

            {/* Assigned Faculty Mentor Card */}
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 shadow-xl">
              <h3 className="text-sm font-bold text-white mb-3">Assigned Faculty Mentor</h3>
              {mentor ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                    {mentor.name?.charAt(0) || 'F'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">{mentor.name}</p>
                    <p className="text-[11px] text-slate-400">{mentor.designation} • {mentor.department}</p>
                    <p className="text-[10px] text-indigo-300 mt-0.5">{mentor.specialization}</p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800 text-center">
                  <p className="text-xs text-slate-400">Mentor will be assigned by department faculty.</p>
                </div>
              )}
            </div>

            {/* Career Mission Quick CTA */}
            <div className="glass-panel p-5 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/20 to-indigo-950/20 shadow-xl">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-cyan-400" />
                <span>Career Mission Mode</span>
              </h3>
              <p className="text-xs text-slate-400 mb-3">
                Track skill milestones to crack your target role: <strong className="text-white">{st.career_goal}</strong>
              </p>
              <button
                onClick={() => onNavigate('career-mission')}
                className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md transition-colors cursor-pointer"
              >
                Enter Career Mission Mode
              </button>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: TASKS & ASSIGNMENTS */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">Pending Submission</span>
              <span className="text-xl font-bold text-amber-400 mt-1 block">{pendingTasks.length}</span>
            </div>
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">Submitted (Under Review)</span>
              <span className="text-xl font-bold text-cyan-400 mt-1 block">{submittedTasks.length}</span>
            </div>
            <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 block font-medium">Graded & Completed</span>
              <span className="text-xl font-bold text-emerald-400 mt-1 block">{completedTasks.length}</span>
            </div>
          </div>

          <div className="space-y-3">
            {tasks.map((t) => {
              const mySub = t.my_submission;
              const isSubmitted = mySub && (mySub.status === 'Submitted' || mySub.status === 'Completed');
              const isGraded = mySub && mySub.status === 'Completed';

              return (
                <div key={t.id} className="p-5 bg-[#0b1222] border border-slate-800 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {t.subject_code}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">Due: {t.due_date}</span>
                      <span className="text-xs text-slate-400 font-mono">• Points: {t.points}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white mb-1">{t.title}</h3>
                    <p className="text-xs text-slate-300 mb-2">{t.description}</p>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Assigned by {t.faculty_name}</span>
                    </div>

                    {/* Show Grade & Feedback if Graded */}
                    {isGraded && mySub.feedback && (
                      <div className="mt-3 p-2.5 bg-emerald-950/30 border border-emerald-500/30 rounded-xl text-xs text-emerald-200">
                        <span className="font-bold text-emerald-300">Faculty Feedback (Grade {mySub.grade}): </span>
                        <span>{mySub.feedback}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-between md:justify-end">
                    {isGraded ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Graded ({mySub.grade})</span>
                      </span>
                    ) : isSubmitted ? (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Submitted</span>
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Pending</span>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTask(t);
                        if (mySub) {
                          setSubmissionText(mySub.submission_text || '');
                          setAttachmentUrl(mySub.attachment_url || '');
                        }
                        setShowSubmitModal(true);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg cursor-pointer"
                    >
                      {isSubmitted ? 'Edit Submission' : 'Submit Assignment'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: ACADEMICS & MARKS */}
      {activeTab === 'academics' && (
        <div className="space-y-4">
          <div className="bg-[#0b1222] border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-2">Detailed Course Results & Internal Evaluations</h3>
            <p className="text-xs text-slate-400 mb-4">Official breakdown of semester marks across assignments, laboratory tests, and internals.</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">Course Code</th>
                    <th className="p-3">Course Name</th>
                    <th className="p-3 text-center">Internals (/40)</th>
                    <th className="p-3 text-center">Assignments (/20)</th>
                    <th className="p-3 text-center">Lab (/20)</th>
                    <th className="p-3 text-center">Total Score</th>
                    <th className="p-3 text-center">Grade</th>
                    <th className="p-3 text-right">Academic Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {marks.map((sm) => (
                    <tr key={sm.id} className="hover:bg-slate-900/40">
                      <td className="p-3 font-mono font-bold text-cyan-400">{sm.subject_code}</td>
                      <td className="p-3 font-semibold text-white">{sm.subject_name}</td>
                      <td className="p-3 text-center font-mono">{sm.internal_marks}</td>
                      <td className="p-3 text-center font-mono">{sm.assignment_marks}</td>
                      <td className="p-3 text-center font-mono">{sm.lab_marks}</td>
                      <td className="p-3 text-center font-mono font-bold text-white">{sm.total_percentage}%</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-200 font-mono font-bold">
                          {sm.grade}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        {sm.is_weak_subject ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            Remedial Support Recommended
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Clear & Proficient
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Student Submit Task Modal */}
      {showSubmitModal && selectedTask && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1222] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-fadeIn">
            <button
              type="button"
              onClick={() => setShowSubmitModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-white mb-1">Submit Assignment</h2>
            <p className="text-xs text-slate-400 mb-4">{selectedTask.title}</p>

            {submitMsg && (
              <div className="mb-4 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs">
                {submitMsg}
              </div>
            )}

            <form onSubmit={handleSubmitTask} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Your Submission Summary / Notes</label>
                <textarea
                  rows={4}
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  required
                  placeholder="Explain your approach, key equations, algorithms, and results..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                ></textarea>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">GitHub Repo / Document URL</label>
                <input
                  type="url"
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                  placeholder="https://github.com/your-username/project-repo"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSubmitModal(false)}
                  className="py-2 px-4 rounded-xl font-semibold bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="py-2 px-5 rounded-xl font-semibold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitLoading ? 'Submitting...' : 'Submit Assignment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Explainable Score Breakdown Modal */}
      <ScoreBreakdownModal
        isOpen={showBreakdown}
        onClose={() => setShowBreakdown(false)}
        scoreBreakdown={breakdown}
        studentName={st.name}
      />

    </div>
  );
}
