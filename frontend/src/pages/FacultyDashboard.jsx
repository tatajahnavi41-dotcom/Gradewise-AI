import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import {
  Users,
  Award,
  AlertTriangle,
  LifeBuoy,
  CheckCircle,
  Clock,
  PlusCircle,
  FileText,
  Calendar,
  UserCheck,
  ArrowRight,
  TrendingUp,
  Sparkles,
  ClipboardList,
  Edit,
  Save,
  Check,
  X,
  Eye,
  Send,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  BookOpen,
  ShieldAlert,
  Filter,
  HelpCircle
} from 'lucide-react';

export default function FacultyDashboard({ onNavigate, onSelectStudent }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'all_students', 'tasks', 'marks_attendance'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // All Students & Grades state
  const [allStudents, setAllStudents] = useState([]);
  const [allStudentsLoading, setAllStudentsLoading] = useState(false);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('ALL');
  const [selectedYearFilter, setSelectedYearFilter] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [under50Only, setUnder50Only] = useState(false);

  // Quick Action Modal states
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showGuidanceModal, setShowGuidanceModal] = useState(false);
  
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedStudentName, setSelectedStudentName] = useState('');
  const [subjectCode, setSubjectCode] = useState('AI301');
  const [internalMarks, setInternalMarks] = useState(32);
  const [assignMarks, setAssignMarks] = useState(16);
  const [labMarks, setLabMarks] = useState(18);
  const [newAttendancePct, setNewAttendancePct] = useState(85.0);

  // Guidance modal state
  const [guidanceTarget, setGuidanceTarget] = useState(null);
  const [guidanceType, setGuidanceType] = useState('Academic Remedial Plan');
  const [guidanceNote, setGuidanceNote] = useState('');
  const [guidanceMilestone, setGuidanceMilestone] = useState('');
  const [guidanceSubmitting, setGuidanceSubmitting] = useState(false);

  // Task creation state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskSubCode, setTaskSubCode] = useState('ML302');
  const [taskSubName, setTaskSubName] = useState('Machine Learning Techniques');
  const [taskYear, setTaskYear] = useState(3);
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskPoints, setTaskPoints] = useState(100);

  // Tasks List
  const [facultyTasks, setFacultyTasks] = useState([]);
  const [actionSuccess, setActionSuccess] = useState(null);
  const [actionError, setActionError] = useState(null);

  const showToast = (msg, isErr = false) => {
    if (isErr) {
      setActionError(msg);
      setTimeout(() => setActionError(null), 5000);
    } else {
      setActionSuccess(msg);
      setTimeout(() => setActionSuccess(null), 5000);
    }
  };

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const branch = user?.branch || 'AIML';
      const res = await api.getFacultyDashboard(branch);
      setData(res);
      
      // Also fetch tasks
      const tRes = await api.getTasks({ branch });
      setFacultyTasks(tRes.tasks || []);
    } catch (err) {
      console.error('Failed to load faculty dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllStudentsGrades = async () => {
    try {
      setAllStudentsLoading(true);
      const params = {};
      if (selectedBranchFilter !== 'ALL') params.branch = selectedBranchFilter;
      if (selectedYearFilter) params.year = parseInt(selectedYearFilter);
      if (studentSearch) params.search = studentSearch;
      if (under50Only) params.under_50_only = true;

      const res = await api.getFacultyStudentsGrades(params);
      setAllStudents(res.students || []);
    } catch (err) {
      console.error('Failed to load students and grades:', err);
    } finally {
      setAllStudentsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [user]);

  useEffect(() => {
    fetchAllStudentsGrades();
  }, [selectedBranchFilter, selectedYearFilter, studentSearch, under50Only]);

  const handleSendGuidance = async (e) => {
    e.preventDefault();
    if (!guidanceTarget) return;
    setGuidanceSubmitting(true);
    try {
      await api.createIntervention({
        student_id: guidanceTarget.student_id,
        intervention_type: guidanceType,
        action_plan: guidanceNote,
        milestone: guidanceMilestone || "Complete foundational review units and meet mentor.",
        priority: "HIGH"
      });
      showToast(`Academic guidance & remedial plan successfully assigned to ${guidanceTarget.name}!`);
      setShowGuidanceModal(false);
      setGuidanceNote('');
      setGuidanceMilestone('');
      fetchDashboard();
      fetchAllStudentsGrades();
    } catch (err) {
      showToast(err.message || 'Failed to submit guidance plan', true);
    } finally {
      setGuidanceSubmitting(false);
    }
  };

  const handleRecordMarks = async (e) => {
    e.preventDefault();
    try {
      const res = await api.addMarks({
        student_id: selectedStudentId,
        subject_code: subjectCode,
        internal_marks: parseFloat(internalMarks),
        assignment_marks: parseFloat(assignMarks),
        lab_marks: parseFloat(labMarks)
      });
      showToast(`Marks recorded! Student Academic Score updated to ${res.new_academic_score}%, Success Score: ${res.new_success_score}`);
      setShowMarkModal(false);
      fetchDashboard();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleRecordAttendance = async (e) => {
    e.preventDefault();
    try {
      const res = await api.recordAttendance({
        student_id: selectedStudentId,
        attendance_pct: parseFloat(newAttendancePct)
      });
      showToast(`Attendance recorded! Student Attendance updated to ${res.attendance_pct}%`);
      setShowAttendanceModal(false);
      fetchDashboard();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await api.createTask({
        title: taskTitle,
        description: taskDesc,
        subject_code: taskSubCode,
        subject_name: taskSubName,
        branch: user?.branch || 'AIML',
        year: parseInt(taskYear),
        due_date: taskDueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        points: parseInt(taskPoints)
      });
      showToast('Assignment created and assigned to students successfully!');
      setShowTaskModal(false);
      setTaskTitle('');
      setTaskDesc('');
      fetchDashboard();
    } catch (err) {
      showToast(err.message, true);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const d = data || {};

  return (
    <div className="space-y-6 animate-in fade-in pb-16">
      
      {/* Notifications */}
      {actionSuccess && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <span>Faculty Academic Command & Mentorship</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-medium">
              Dept of {d.branch}
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Department oversight for {d.total_students} students, assigned mentees, task management, and academic evaluations.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 overflow-x-auto">
          {[
            { id: 'overview', label: 'Mentorship & Risks', icon: Users },
            { id: 'all_students', label: 'All Students & Grades', icon: GraduationCap },
            { id: 'tasks', label: 'Assignments & Grading', icon: ClipboardList },
            { id: 'marks_attendance', label: 'Marks & Attendance', icon: Award },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Department Students"
          value={d.total_students || 0}
          subtext={`Active in ${d.branch || 'Campus'}`}
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="Branch Average Success"
          value={d.average_success_score ? `${d.average_success_score} / 100` : "0.0 / 100"}
          subtext={`Avg Attendance: ${d.average_attendance || 0}%`}
          icon={Award}
          color="cyan"
        />
        <StatCard
          title="Students Flagged for Support"
          value={d.attention_count || 0}
          subtext="High Risk or Attendance Deficit"
          icon={AlertTriangle}
          color="rose"
        />
        <StatCard
          title="My Assigned Mentees"
          value={d.my_mentees_count || 0}
          subtext="Under active mentorship roadmap"
          icon={LifeBuoy}
          color="purple"
        />
      </div>

      {/* TAB 1: OVERVIEW & MENTORSHIP */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Attention List (Needs Urgent Support) */}
          <div className="lg:col-span-7 bg-[#0b1222] border border-slate-800 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Students Needing Academic Attention</span>
                </h3>
                <p className="text-xs text-slate-400">AI early warning flagged for low internal marks or attendance deficit (&lt;65%)</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('mentor-matching')}
                className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
              >
                <span>Smart Match</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5">
              {(d.attention_list || []).map((st) => (
                <div
                  key={st.student_id}
                  className="p-3 bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 rounded-xl flex items-center justify-between text-xs transition-all"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{st.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{st.student_id} • Year {st.year}</span>
                      <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {st.risk_category} RISK
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-3">
                      <span>Attendance: <strong className="text-rose-400">{st.attendance_pct}%</strong></span>
                      <span>Score: <strong className="text-slate-200">{st.success_score}</strong></span>
                      <span>CGPA: <strong className="text-slate-200">{st.cgpa}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStudentId(st.student_id);
                        setSelectedStudentName(st.name);
                        setShowMarkModal(true);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-colors"
                      title="Add Marks"
                    >
                      <PlusCircle className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStudentId(st.student_id);
                        setSelectedStudentName(st.name);
                        setNewAttendancePct(st.attendance_pct);
                        setShowAttendanceModal(true);
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 transition-colors"
                      title="Update Attendance"
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onSelectStudent(st.student_id)}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold flex items-center gap-1 transition-colors"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Mentees & High Performers */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* My Mentees */}
            <div className="bg-[#0b1222] border border-slate-800 rounded-2xl p-5 shadow-xl">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <LifeBuoy className="w-4 h-4 text-purple-400" />
                <span>My Assigned Mentees ({d.my_mentees_count || 0})</span>
              </h3>
              
              {(d.my_mentees || []).length === 0 ? (
                <p className="text-xs text-slate-400 py-3">No direct mentees assigned yet. Use Smart Mentor Matching to pair students.</p>
              ) : (
                <div className="space-y-2">
                  {(d.my_mentees || []).slice(0, 5).map((m) => (
                    <div
                      key={m.student_id}
                      onClick={() => onSelectStudent(m.student_id)}
                      className="p-2.5 bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between text-xs cursor-pointer transition-all"
                    >
                      <div>
                        <div className="font-semibold text-white">{m.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{m.student_id} • Year {m.year}</div>
                      </div>
                      <div className="text-right">
                        <span className="text-purple-300 font-mono font-bold">{m.success_score} pts</span>
                        <div className="text-[10px] text-slate-400">{m.career_goal}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* High Performers */}
            <div className="bg-[#0b1222] border border-slate-800 rounded-2xl p-5 shadow-xl">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>Top Academic Accelerators</span>
              </h3>
              <div className="space-y-2">
                {(d.high_performers || []).slice(0, 4).map((hp) => (
                  <div
                    key={hp.student_id}
                    onClick={() => onSelectStudent(hp.student_id)}
                    className="p-2.5 bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl flex items-center justify-between text-xs cursor-pointer transition-all"
                  >
                    <div>
                      <div className="font-semibold text-white">{hp.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{hp.student_id} • CGPA {hp.cgpa}</div>
                    </div>
                    <span className="text-emerald-400 font-mono font-bold">{hp.success_score} / 100</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: TASKS & ASSIGNMENTS */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white">Department Assignments</h3>
              <p className="text-xs text-slate-400">Create, monitor, and review academic assignments</p>
            </div>
            <button
              type="button"
              onClick={() => setShowTaskModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Assignment</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {facultyTasks.map((t) => (
              <div key={t.id} className="bg-[#0b1222] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-xl">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {t.subject_code}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Due: {t.due_date}</span>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1">{t.title}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-3">{t.description}</p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    <strong className="text-white">{t.submitted_count || 0}</strong> submissions (<strong className="text-emerald-400">{t.completed_count || 0}</strong> graded)
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate('tasks-monitor')}
                    className="px-3 py-1.5 rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-colors flex items-center gap-1"
                  >
                    <span>Open Submissions</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: ALL STUDENTS & GRADES */}
      {activeTab === 'all_students' && (
        <div className="space-y-4">
          
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/70 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student name, ID or email..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <select
                value={selectedBranchFilter}
                onChange={(e) => setSelectedBranchFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                <option value="ALL">All Branches (AIML, AIDS, CSE)</option>
                <option value="AIML">AIML</option>
                <option value="AIDS">AIDS</option>
                <option value="CSE">CSE</option>
              </select>

              <select
                value={selectedYearFilter}
                onChange={(e) => setSelectedYearFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
              >
                <option value="">All Academic Years</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>

              <label className="flex items-center gap-2 text-xs text-slate-300 font-medium cursor-pointer bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
                <input
                  type="checkbox"
                  checked={under50Only}
                  onChange={(e) => setUnder50Only(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-rose-500 focus:ring-0"
                />
                <span className="text-amber-400 font-semibold">⚠️ Scores &lt; 50% only (Needs Guidance)</span>
              </label>
            </div>

            <span className="text-xs text-slate-400 font-mono">
              Showing <strong className="text-white">{allStudents.length}</strong> Students
            </span>
          </div>

          {/* Students and Grades Table */}
          <div className="bg-[#0b1222] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              {allStudentsLoading ? (
                <div className="p-12 text-center text-slate-400 text-xs">
                  <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  Loading student evaluation registry from database...
                </div>
              ) : allStudents.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No student records match the selected filters.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">Student Details</th>
                      <th className="p-3.5">Branch & Year</th>
                      <th className="p-3.5 text-center">Class Attendance</th>
                      <th className="p-3.5 text-center">CGPA / Score</th>
                      <th className="p-3.5">Course Results & Marks</th>
                      <th className="p-3.5 text-center">Standing</th>
                      <th className="p-3.5 text-right">Faculty Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-200">
                    {allStudents.map((st) => {
                      const isScoreLow = (st.academic_score !== null && st.academic_score < 50) || (st.success_score > 0 && st.success_score < 50) || st.needs_guidance;
                      const isAttendanceLow = st.attendance_pct < 75 && st.attendance_pct > 0;

                      return (
                        <tr key={st.student_id} className={`hover:bg-slate-900/40 transition-colors ${isScoreLow ? 'bg-rose-950/10' : ''}`}>
                          <td className="p-3.5">
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{st.name}</span>
                              {isScoreLow && (
                                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" title="Score < 50% - Guidance Needed"></span>
                              )}
                            </div>
                            <div className="text-[11px] text-cyan-400 font-mono mt-0.5">{st.student_id}</div>
                            <div className="text-[10px] text-slate-400">{st.email}</div>
                          </td>

                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                              {st.branch}
                            </span>
                            <div className="text-[11px] text-slate-400 mt-1">Year {st.year} (Sem {st.semester})</div>
                          </td>

                          <td className="p-3.5 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                              st.attendance_pct >= 75
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : (st.attendance_pct > 0 ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' : 'bg-slate-800 text-slate-400')
                            }`}>
                              {st.attendance_pct || 0}%
                            </span>
                            {isAttendanceLow && (
                              <div className="text-[10px] text-rose-400 mt-1 font-semibold">⚠️ Debar Risk</div>
                            )}
                          </td>

                          <td className="p-3.5 text-center">
                            <div className="font-mono font-bold text-white text-xs">{st.academic_score || 0}%</div>
                            <div className="text-[11px] text-slate-400 font-mono">CGPA: {st.cgpa || 0.0}</div>
                            <div className="text-[10px] text-indigo-300 font-mono mt-0.5">Success: {st.success_score || 0}/100</div>
                          </td>

                          <td className="p-3.5 max-w-xs">
                            {st.subject_marks && st.subject_marks.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {st.subject_marks.map((sm) => (
                                  <span
                                    key={sm.id}
                                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold flex items-center gap-1 ${
                                      sm.is_weak || sm.total_percentage < 50
                                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                        : 'bg-slate-900 text-slate-200 border border-slate-700'
                                    }`}
                                  >
                                    <span>{sm.subject_code}:</span>
                                    <strong className="text-white">{sm.total_percentage}%</strong>
                                    <span className="text-[9px] px-1 rounded bg-black/40 text-cyan-300 font-bold">{sm.grade}</span>
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-500 italic">No subject marks entered yet</span>
                            )}
                          </td>

                          <td className="p-3.5 text-center">
                            {isScoreLow ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 block">
                                ⚠️ Needs Guidance (&lt;50%)
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 block">
                                Satisfactory
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5 flex-wrap">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedStudentId(st.student_id);
                                  setSelectedStudentName(st.name);
                                  setShowMarkModal(true);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/40 text-cyan-300 border border-cyan-500/30 text-xs font-semibold cursor-pointer"
                                title="Enter or Update Subject Marks"
                              >
                                Enter Marks
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedStudentId(st.student_id);
                                  setSelectedStudentName(st.name);
                                  setNewAttendancePct(st.attendance_pct || 80);
                                  setShowAttendanceModal(true);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-xs font-semibold cursor-pointer"
                                title="Record Attendance"
                              >
                                Attendance
                              </button>

                              {isScoreLow && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setGuidanceTarget(st);
                                    setGuidanceNote(`Student ${st.name} is currently scoring ${st.academic_score}% (< 50%). Recommended focus on core syllabus units and tutorial problem sets.`);
                                    setGuidanceMilestone(`Complete foundational chapter practice and submit remedial assignment.`);
                                    setShowGuidanceModal(true);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-600 to-rose-600 hover:opacity-90 text-white text-xs font-semibold shadow-md flex items-center gap-1 cursor-pointer"
                                  title="Send Guidance & Remedial Action Plan"
                                >
                                  <Sparkles className="w-3 h-3" />
                                  <span>Provide Guidance</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  if (onSelectStudent) onSelectStudent(st.student_id);
                                  if (onNavigate) onNavigate('student-profile');
                                }}
                                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                                title="View Full Profile"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: MARKS & ATTENDANCE QUICK EVAL */}
      {activeTab === 'marks_attendance' && (
        <div className="bg-[#0b1222] border border-slate-800 rounded-2xl p-5 shadow-xl">
          <h3 className="text-sm font-bold text-white mb-2">Student Evaluation & Attendance Registry</h3>
          <p className="text-xs text-slate-400 mb-4">Select any student below to update semester marks or record weekly attendance percentage.</p>

          <div className="space-y-2">
            {(d.attention_list || []).concat(d.high_performers || []).slice(0, 15).map((st) => (
              <div key={st.student_id} className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-white">{st.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{st.student_id} • CGPA {st.cgpa} • Attendance {st.attendance_pct}%</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudentId(st.student_id);
                      setSelectedStudentName(st.name);
                      setShowMarkModal(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 font-semibold"
                  >
                    Enter Marks
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudentId(st.student_id);
                      setSelectedStudentName(st.name);
                      setNewAttendancePct(st.attendance_pct);
                      setShowAttendanceModal(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-semibold"
                  >
                    Update Attendance
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Record Marks Modal */}
      {showMarkModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1222] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-fadeIn">
            <button
              type="button"
              onClick={() => setShowMarkModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-white mb-1">Enter Marks & Test Results</h2>
            <p className="text-xs text-slate-400 mb-4">{selectedStudentName} ({selectedStudentId})</p>

            <form onSubmit={handleRecordMarks} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Course Code</label>
                <input
                  type="text"
                  value={subjectCode}
                  onChange={(e) => setSubjectCode(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Internal (0-40)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="40"
                    value={internalMarks}
                    onChange={(e) => setInternalMarks(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Assign (0-20)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="20"
                    value={assignMarks}
                    onChange={(e) => setAssignMarks(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Lab (0-20)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="20"
                    value={labMarks}
                    onChange={(e) => setLabMarks(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowMarkModal(false)}
                  className="py-2 px-4 rounded-xl font-semibold bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
                >
                  Record & Recalculate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Attendance Modal */}
      {showAttendanceModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1222] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-fadeIn">
            <button
              type="button"
              onClick={() => setShowAttendanceModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-white mb-1">Update Attendance Percentage</h2>
            <p className="text-xs text-slate-400 mb-4">{selectedStudentName} ({selectedStudentId})</p>

            <form onSubmit={handleRecordAttendance} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Attendance Percentage (0-100%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={newAttendancePct}
                  onChange={(e) => setNewAttendancePct(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAttendanceModal(false)}
                  className="py-2 px-4 rounded-xl font-semibold bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  Save Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1222] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-fadeIn">
            <button
              type="button"
              onClick={() => setShowTaskModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-white mb-1">Create Academic Assignment</h2>
            <p className="text-xs text-slate-400 mb-4">Assign a project or test to your branch students.</p>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Title</label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                  placeholder="e.g. Deep Learning Backpropagation Lab"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Course Code</label>
                  <input
                    type="text"
                    value={taskSubCode}
                    onChange={(e) => setTaskSubCode(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskDueDate}
                    onChange={(e) => setTaskDueDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Instructions & Guidelines</label>
                <textarea
                  rows={3}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  required
                  placeholder="Provide task requirements..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="py-2 px-4 rounded-xl font-semibold bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 text-white"
                >
                  Create & Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Provide Guidance & Remedial Modal */}
      {showGuidanceModal && guidanceTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1222] border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-fadeIn">
            <button
              type="button"
              onClick={() => setShowGuidanceModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">Assign Academic Guidance & Remedial Plan</h2>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Providing structured guidance for <strong className="text-white">{guidanceTarget.name}</strong> ({guidanceTarget.student_id}) • Current Score: <strong className="text-amber-400">{guidanceTarget.academic_score || 0}%</strong>
            </p>

            <form onSubmit={handleSendGuidance} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Guidance Intervention Category</label>
                <select
                  value={guidanceType}
                  onChange={(e) => setGuidanceType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="Academic Remedial Plan">Academic Remedial Plan (Score &lt; 50%)</option>
                  <option value="1-on-1 Faculty Counseling">1-on-1 Faculty Mentorship & Counseling</option>
                  <option value="Attendance Recovery Warning">Attendance Catch-up & Debarment Alert</option>
                  <option value="Placement Skill Preparation">Placement Coding & Aptitude Drills</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Detailed Guidance & Action Steps for Student</label>
                <textarea
                  rows={4}
                  value={guidanceNote}
                  onChange={(e) => setGuidanceNote(e.target.value)}
                  required
                  placeholder="Outline specific steps for the student: e.g. Revise Module 2 & 3, solve practice sets in Learning Arena, attend remedial clinic..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                ></textarea>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Assigned Target Milestone / Goal</label>
                <input
                  type="text"
                  value={guidanceMilestone}
                  onChange={(e) => setGuidanceMilestone(e.target.value)}
                  required
                  placeholder="e.g. Score ≥ 60% on next quiz and submit Assignment 2"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowGuidanceModal(false)}
                  className="py-2 px-4 rounded-xl font-semibold bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={guidanceSubmitting}
                  className="py-2 px-5 rounded-xl font-semibold bg-gradient-to-r from-amber-600 to-orange-600 hover:opacity-90 text-white flex items-center gap-1.5 shadow-md"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{guidanceSubmitting ? 'Assigning Guidance...' : 'Assign Guidance Plan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
