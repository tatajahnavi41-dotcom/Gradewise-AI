import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import StatCard from '../components/StatCard';
import {
  Users,
  Award,
  ShieldAlert,
  LifeBuoy,
  Briefcase,
  Activity,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Filter,
  RefreshCw,
  FileSpreadsheet,
  Plus,
  Search,
  Edit2,
  Trash2,
  Power,
  Shield,
  BookOpen,
  ClipboardList,
  GraduationCap,
  Clock,
  Eye,
  X,
  Save,
  Check,
  UserCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from 'recharts';

export default function AdminDashboard({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'students', 'faculty', 'tasks', 'users'
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('');

  // Student DB State
  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentBranch, setStudentBranch] = useState('ALL');
  const [studentYear, setStudentYear] = useState('ALL');
  const [studentRisk, setStudentRisk] = useState('ALL');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showEditStudentModal, setShowEditStudentModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Student Form State
  const [stId, setStId] = useState('');
  const [stName, setStName] = useState('');
  const [stEmail, setStEmail] = useState('');
  const [stBranch, setStBranch] = useState('AIML');
  const [stYear, setStYear] = useState(3);
  const [stSem, setStSem] = useState(5);
  const [stCgpa, setStCgpa] = useState(7.5);
  const [stAttendance, setStAttendance] = useState(82.0);
  const [stAcademicScore, setStAcademicScore] = useState(74.0);
  const [stStudyHours, setStStudyHours] = useState(16.0);
  const [stPhone, setStPhone] = useState('');
  const [stGoal, setStGoal] = useState('Software Developer');

  // Faculty DB State
  const [staffList, setStaffList] = useState([]);
  const [staffSearch, setStaffSearch] = useState('');
  const [staffDept, setStaffDept] = useState('ALL');
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showEditStaffModal, setShowEditStaffModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  // Staff Form State
  const [facId, setFacId] = useState('');
  const [facName, setFacName] = useState('');
  const [facEmail, setFacEmail] = useState('');
  const [facDept, setFacDept] = useState('AIML');
  const [facRoleType, setFacRoleType] = useState('teaching');
  const [facDesignation, setFacDesignation] = useState('Assistant Professor');
  const [facSpecialization, setFacSpecialization] = useState('Machine Learning');
  const [facPhone, setFacPhone] = useState('');

  // Users & Permissions State
  const [usersList, setUsersList] = useState([]);
  const [userSearch, setUserSearch] = useState('');

  // Task Monitoring State
  const [tasksList, setTasksList] = useState([]);

  // Toast / Feedback
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminDashboard({
        branch: branchFilter,
        year: yearFilter || undefined
      });
      setDashboardData(res);
    } catch (err) {
      console.error('Failed to load admin dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const params = { limit: 180 };
      if (studentBranch !== 'ALL') params.branch = studentBranch;
      if (studentYear !== 'ALL') params.year = studentYear;
      if (studentRisk !== 'ALL') params.risk = studentRisk;
      if (studentSearch) params.search = studentSearch;
      const res = await api.getStudents(params);
      setStudents(res.students || []);
    } catch (err) {
      console.error('Failed to load students:', err);
    }
  };

  const fetchStaff = async () => {
    try {
      const params = {};
      if (staffDept !== 'ALL') params.department = staffDept;
      if (staffSearch) params.search = staffSearch;
      const res = await api.getStaff(params);
      setStaffList(res.staff || []);
    } catch (err) {
      console.error('Failed to load staff:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const params = {};
      if (userSearch) params.search = userSearch;
      const res = await api.getUsers(params);
      setUsersList(res.users || []);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await api.getTasks();
      setTasksList(res.tasks || []);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [branchFilter, yearFilter]);

  useEffect(() => {
    if (activeTab === 'students') fetchStudents();
    else if (activeTab === 'faculty') fetchStaff();
    else if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'tasks') fetchTasks();
  }, [activeTab, studentBranch, studentYear, studentRisk, studentSearch, staffDept, staffSearch, userSearch]);

  // Student Actions
  const handleSaveNewStudent = async (e) => {
    e.preventDefault();
    try {
      await api.createStudent({
        student_id: stId,
        name: stName,
        email: stEmail,
        branch: stBranch,
        year: parseInt(stYear),
        semester: parseInt(stSem),
        cgpa: parseFloat(stCgpa),
        attendance_pct: parseFloat(stAttendance),
        academic_score: parseFloat(stAcademicScore),
        study_hours: parseFloat(stStudyHours),
        phone: stPhone,
        career_goal: stGoal
      });
      showToast(`Student ${stName} (${stId}) added successfully!`);
      setShowAddStudentModal(false);
      fetchStudents();
      fetchDashboard();
    } catch (err) {
      showToast(err.message || 'Failed to add student', 'error');
    }
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    try {
      await api.updateStudent(selectedStudent.student_id, {
        name: stName,
        branch: stBranch,
        year: parseInt(stYear),
        semester: parseInt(stSem),
        cgpa: parseFloat(stCgpa),
        attendance_pct: parseFloat(stAttendance),
        academic_score: parseFloat(stAcademicScore),
        study_hours: parseFloat(stStudyHours),
        phone: stPhone,
        career_goal: stGoal
      });
      showToast(`Student record for ${stName} updated.`);
      setShowEditStudentModal(false);
      fetchStudents();
      fetchDashboard();
    } catch (err) {
      showToast(err.message || 'Failed to update student', 'error');
    }
  };

  const handleToggleStudentStatus = async (studentId) => {
    try {
      const res = await api.toggleStudentStatus(studentId);
      showToast(res.message || 'Student status updated.');
      fetchStudents();
    } catch (err) {
      showToast(err.message || 'Failed to toggle status', 'error');
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm(`Are you sure you want to permanently delete student ${studentId}?`)) return;
    try {
      await api.deleteStudent(studentId);
      showToast(`Student ${studentId} deleted.`);
      fetchStudents();
      fetchDashboard();
    } catch (err) {
      showToast(err.message || 'Failed to delete student', 'error');
    }
  };

  // Staff Actions
  const handleSaveNewStaff = async (e) => {
    e.preventDefault();
    try {
      await api.createStaff({
        staff_id: facId,
        name: facName,
        email: facEmail,
        department: facDept,
        role_type: facRoleType,
        designation: facDesignation,
        specialization: facSpecialization,
        assigned_branch: facDept,
        phone: facPhone
      });
      showToast(`Faculty member ${facName} created successfully!`);
      setShowAddStaffModal(false);
      fetchStaff();
      fetchDashboard();
    } catch (err) {
      showToast(err.message || 'Failed to add faculty member', 'error');
    }
  };

  const handleUpdateStaff = async (e) => {
    e.preventDefault();
    if (!selectedStaff) return;
    try {
      await api.updateStaff(selectedStaff.staff_id, {
        name: facName,
        department: facDept,
        role_type: facRoleType,
        designation: facDesignation,
        specialization: facSpecialization,
        assigned_branch: facDept,
        phone: facPhone
      });
      showToast(`Faculty record for ${facName} updated.`);
      setShowEditStaffModal(false);
      fetchStaff();
      fetchDashboard();
    } catch (err) {
      showToast(err.message || 'Failed to update faculty', 'error');
    }
  };

  const handleToggleStaffStatus = async (staffId) => {
    try {
      const res = await api.toggleStaffStatus(staffId);
      showToast(res.message || 'Staff status updated.');
      fetchStaff();
    } catch (err) {
      showToast(err.message || 'Failed to toggle staff status', 'error');
    }
  };

  const handleDeleteStaff = async (staffId) => {
    if (!window.confirm(`Are you sure you want to delete staff record ${staffId}?`)) return;
    try {
      await api.deleteStaff(staffId);
      showToast(`Staff ${staffId} deleted.`);
      fetchStaff();
      fetchDashboard();
    } catch (err) {
      showToast(err.message || 'Failed to delete staff', 'error');
    }
  };

  // User permission changes
  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await api.updateUserPermissions(userId, { role: newRole });
      showToast(`User role updated to ${newRole}.`);
      fetchUsers();
    } catch (err) {
      showToast(err.message || 'Failed to update user role', 'error');
    }
  };

  const handleToggleUserActive = async (userId, currentActive) => {
    try {
      await api.updateUserPermissions(userId, { is_active: !currentActive });
      showToast(`User status updated.`);
      fetchUsers();
    } catch (err) {
      showToast(err.message || 'Failed to update status', 'error');
    }
  };

  const s = dashboardData?.summary || {};
  const branchCounts = s.branches || { AIML: 0, AIDS: 0, CSE: 0 };

  const barChartData = [
    { name: 'AIML', students: branchCounts.AIML || 0, avgScore: s.average_success_score || 0, target: 75 },
    { name: 'AIDS', students: branchCounts.AIDS || 0, avgScore: s.average_success_score || 0, target: 75 },
    { name: 'CSE',  students: branchCounts.CSE || 0,  avgScore: s.average_success_score || 0, target: 75 },
  ];

  const riskPieData = [
    { name: 'Low Risk (Safe)', value: s.high_performers || 0, color: '#10b981' },
    { name: 'Medium Risk', value: s.medium_risk || 0, color: '#f59e0b' },
    { name: 'High Risk (Support)', value: s.high_risk || 0, color: '#ef4444' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in pb-16">
      
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-fadeIn ${
          toast.type === 'error'
            ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
            : 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
        }`}>
          {toast.type === 'error' ? <ShieldAlert className="w-5 h-5 text-rose-400" /> : <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
          <span className="text-xs font-semibold">{toast.message}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <span>Campus Administrator Command Hub</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-medium">
              Admin Portal
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage students, faculty records, monitor academic tasks, AI risk analytics, and role permissions.
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800 overflow-x-auto">
          {[
            { id: 'overview', label: 'Analytics & Risk', icon: Activity },
            { id: 'students', label: 'Student Database', icon: GraduationCap },
            { id: 'faculty', label: 'Faculty Database', icon: BookOpen },
            { id: 'tasks', label: 'Task Monitoring', icon: ClipboardList },
            { id: 'users', label: 'User Roles & Access', icon: Shield },
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
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
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

      {/* TAB 1: OVERVIEW & ANALYTICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          {/* Controls Bar */}
          <div className="flex items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-semibold text-slate-400">Campus Filters:</span>
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
              >
                <option value="ALL">All Branches (AIML, AIDS, CSE)</option>
                <option value="AIML">AIML</option>
                <option value="AIDS">AIDS</option>
                <option value="CSE">CSE</option>
              </select>

              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none"
              >
                <option value="">All Academic Years</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>

            <button
              onClick={fetchDashboard}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Primary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Students"
              value={s.total_students ?? 0}
              subtext={s.branches ? `AIML (${s.branches.AIML || 0}), AIDS (${s.branches.AIDS || 0}), CSE (${s.branches.CSE || 0})` : "Enrolled Students"}
              icon={Users}
              color="cyan"
              tooltip="Total enrolled students in engineering branches"
            />
            <StatCard
              title="Average Success Score"
              value={s.average_success_score ? `${s.average_success_score} / 100` : "0.0 / 100"}
              subtext="Holistic Multi-Factor Metric"
              icon={Award}
              color="indigo"
              tooltip="Composite score combining academics (30%), attendance (20%), LMS (15%), placement (15%), skills (10%), and engagement (10%)"
            />
            <StatCard
              title="Academic Risk Flags"
              value={s.academic_risk_count ?? 0}
              subtext={`High Risk: ${s.high_risk || 0} students`}
              icon={ShieldAlert}
              color="rose"
              tooltip="Students flagged by early warning algorithms"
            />
            <StatCard
              title="Active Tasks & Assignments"
              value={s.tasks_summary?.total_tasks || 0}
              subtext={`${s.tasks_summary?.completed_submissions || 0} graded submissions`}
              icon={ClipboardList}
              color="emerald"
              tooltip="Assignments created by faculty across college"
            />
          </div>

          {/* Dynamic Insights Box */}
          <div className="bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-cyan-950/20 border border-indigo-500/30 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                AI Early-Warning Intelligence Insights
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(dashboardData?.insights || []).map((ins, i) => (
                <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0"></div>
                  <span>{ins}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Branch Performance Bar Chart */}
            <div className="bg-[#0b1222] border border-slate-800 rounded-2xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center justify-between">
                <span>Branch Academic Standing & Enrollment</span>
                <span className="text-[10px] text-indigo-400 font-mono">B.Tech Batches</span>
              </h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="students" name="Enrolled Students" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="avgScore" name="Avg Success Score" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Risk Distribution Pie Chart */}
            <div className="bg-[#0b1222] border border-slate-800 rounded-2xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center justify-between">
                <span>Campus Risk Segmentation Distribution</span>
                <span className="text-[10px] text-emerald-400 font-mono">Real-Time</span>
              </h3>
              <div className="h-64 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {riskPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '10px', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: STUDENT DATABASE MANAGEMENT */}
      {activeTab === 'students' && (
        <div className="space-y-4">
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/70 p-4 rounded-2xl border border-slate-800">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Search by student name, ID, or email..."
                className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <select
                value={studentBranch}
                onChange={(e) => setStudentBranch(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              >
                <option value="ALL">All Branches</option>
                <option value="AIML">AIML</option>
                <option value="AIDS">AIDS</option>
                <option value="CSE">CSE</option>
              </select>

              <select
                value={studentYear}
                onChange={(e) => setStudentYear(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              >
                <option value="ALL">All Years</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
              </select>

              <select
                value={studentRisk}
                onChange={(e) => setStudentRisk(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="LOW">Low Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="HIGH">High Risk</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setStId(`ST-${Date.now().toString().slice(-4)}`);
                  setStName('');
                  setStEmail('');
                  setStBranch('AIML');
                  setStYear(3);
                  setStSem(5);
                  setStCgpa(7.5);
                  setStAttendance(82.0);
                  setStAcademicScore(74.0);
                  setStStudyHours(16.0);
                  setStPhone('');
                  setStGoal('Software Developer');
                  setShowAddStudentModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Student</span>
              </button>
            </div>
          </div>

          {/* Student Table */}
          <div className="bg-[#0b1222] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">Student ID & Name</th>
                    <th className="p-3.5">Department</th>
                    <th className="p-3.5">Year / Sem</th>
                    <th className="p-3.5">CGPA</th>
                    <th className="p-3.5">Attendance</th>
                    <th className="p-3.5">Weekly Study</th>
                    <th className="p-3.5">Success Score</th>
                    <th className="p-3.5">Risk Level</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {students.slice(0, 50).map((st) => (
                    <tr key={st.student_id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-white">{st.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{st.student_id} • {st.email}</div>
                      </td>
                      <td className="p-3.5 font-semibold text-cyan-300">{st.branch}</td>
                      <td className="p-3.5">Year {st.year} (Sem {st.semester})</td>
                      <td className="p-3.5 font-mono font-bold text-white">{st.cgpa}</td>
                      <td className="p-3.5">
                        <span className={`font-mono font-bold ${st.attendance_pct < 65 ? 'text-rose-400' : 'text-emerald-400'}`}>
                          {st.attendance_pct}%
                        </span>
                      </td>
                      <td className="p-3.5 font-mono">{st.study_hours || 16.5} hrs</td>
                      <td className="p-3.5 font-bold font-mono text-indigo-300">{st.success_score}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          st.risk_category === 'HIGH'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : st.risk_category === 'MEDIUM'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {st.risk_category}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          st.is_active !== false
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {st.is_active !== false ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStudent(st);
                              setStName(st.name);
                              setStBranch(st.branch);
                              setStYear(st.year);
                              setStSem(st.semester);
                              setStCgpa(st.cgpa);
                              setStAttendance(st.attendance_pct);
                              setStAcademicScore(st.academic_score || 70);
                              setStStudyHours(st.study_hours || 16);
                              setStPhone(st.phone || '');
                              setStGoal(st.career_goal || 'Software Developer');
                              setShowEditStudentModal(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title="Edit Student"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStudentStatus(st.student_id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              st.is_active !== false
                                ? 'bg-amber-950/40 text-amber-300 hover:bg-amber-900/50'
                                : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50'
                            }`}
                            title={st.is_active !== false ? 'Deactivate Student' : 'Activate Student'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStudent(st.student_id)}
                            className="p-1.5 rounded-lg bg-rose-950/40 text-rose-300 hover:bg-rose-900/50 transition-colors"
                            title="Delete Student Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Showing {Math.min(50, students.length)} of {students.length} students</span>
              <span>All changes automatically synchronized to SQLite database</span>
            </div>
          </div>

        </div>
      )}

      {/* TAB 3: FACULTY DATABASE MANAGEMENT */}
      {activeTab === 'faculty' && (
        <div className="space-y-4">
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/70 p-4 rounded-2xl border border-slate-800">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                placeholder="Search by faculty name, ID, email, or specialization..."
                className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={staffDept}
                onChange={(e) => setStaffDept(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
              >
                <option value="ALL">All Departments</option>
                <option value="AIML">AIML</option>
                <option value="AIDS">AIDS</option>
                <option value="CSE">CSE</option>
                <option value="Administration">Administration</option>
                <option value="Placement">Placement</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setFacId(`FAC-${Date.now().toString().slice(-3)}`);
                  setFacName('');
                  setFacEmail('');
                  setFacDept('AIML');
                  setFacRoleType('teaching');
                  setFacDesignation('Assistant Professor');
                  setFacSpecialization('');
                  setFacPhone('');
                  setShowAddStaffModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Faculty</span>
              </button>
            </div>
          </div>

          {/* Faculty Table */}
          <div className="bg-[#0b1222] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">Faculty ID & Name</th>
                    <th className="p-3.5">Department</th>
                    <th className="p-3.5">Designation</th>
                    <th className="p-3.5">Specialization</th>
                    <th className="p-3.5">Mentee Load</th>
                    <th className="p-3.5">Tasks Created</th>
                    <th className="p-3.5">Interventions</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {staffList.map((fac) => (
                    <tr key={fac.staff_id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-white">{fac.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{fac.staff_id} • {fac.email}</div>
                      </td>
                      <td className="p-3.5 font-semibold text-cyan-300">{fac.department}</td>
                      <td className="p-3.5 text-slate-300">{fac.designation}</td>
                      <td className="p-3.5 text-slate-400 max-w-xs truncate">{fac.specialization || 'Academic Teaching'}</td>
                      <td className="p-3.5 font-mono">
                        <span className="text-white font-bold">{fac.current_mentees || 0}</span> / {fac.max_mentees || 20}
                      </td>
                      <td className="p-3.5 font-mono text-cyan-300 font-bold">{fac.tasks_count || 0}</td>
                      <td className="p-3.5 font-mono text-purple-300 font-bold">{fac.interventions_count || 0}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          fac.is_active !== false
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {fac.is_active !== false ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedStaff(fac);
                              setFacName(fac.name);
                              setFacDept(fac.department);
                              setFacRoleType(fac.role_type);
                              setFacDesignation(fac.designation);
                              setFacSpecialization(fac.specialization || '');
                              setFacPhone(fac.phone || '');
                              setShowEditStaffModal(true);
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                            title="Edit Faculty"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleToggleStaffStatus(fac.staff_id)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              fac.is_active !== false
                                ? 'bg-amber-950/40 text-amber-300 hover:bg-amber-900/50'
                                : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50'
                            }`}
                            title={fac.is_active !== false ? 'Deactivate' : 'Activate'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteStaff(fac.staff_id)}
                            className="p-1.5 rounded-lg bg-rose-950/40 text-rose-300 hover:bg-rose-900/50 transition-colors"
                            title="Delete Faculty"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* TAB 4: TASK MONITORING */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="bg-[#0b1222] border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white">Campus Academic Tasks & Submissions</h3>
                <p className="text-xs text-slate-400">Real-time status of faculty assignments and student completion rates</p>
              </div>
              <button
                type="button"
                onClick={() => onNavigate('tasks-monitor')}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5"
              >
                <span>Open Full Task Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3">Assignment Title</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3">Assigned Faculty</th>
                    <th className="p-3">Target Batch</th>
                    <th className="p-3">Due Date</th>
                    <th className="p-3">Submissions</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {tasksList.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-900/40">
                      <td className="p-3 font-semibold text-white">{t.title}</td>
                      <td className="p-3 text-cyan-300 font-mono">{t.subject_code}</td>
                      <td className="p-3">{t.faculty_name}</td>
                      <td className="p-3">{t.branch} (Year {t.year || 'All'})</td>
                      <td className="p-3 font-mono">{t.due_date}</td>
                      <td className="p-3 font-mono">
                        <strong className="text-white">{t.submitted_count || 0}</strong> received (<strong className="text-emerald-400">{t.completed_count || 0}</strong> graded)
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300">
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: USER ROLES & PERMISSIONS */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          
          <div className="flex items-center justify-between gap-3 bg-slate-900/70 p-4 rounded-2xl border border-slate-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search user accounts by username, email, or name..."
                className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="bg-[#0b1222] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/90 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-3.5">Account Details</th>
                    <th className="p-3.5">Role</th>
                    <th className="p-3.5">Student / Staff ID</th>
                    <th className="p-3.5">Branch</th>
                    <th className="p-3.5">Account Status</th>
                    <th className="p-3.5 text-right">Role & Access Control</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {usersList.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-900/40">
                      <td className="p-3.5">
                        <div className="font-bold text-white">{u.name}</div>
                        <div className="text-[11px] text-slate-400">{u.email} ({u.username})</div>
                      </td>
                      <td className="p-3.5">
                        <select
                          value={u.role}
                          onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                          className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-cyan-300 font-semibold uppercase tracking-wide focus:outline-none"
                        >
                          <option value="admin">Admin</option>
                          <option value="faculty">Faculty</option>
                          <option value="student">Student</option>
                        </select>
                      </td>
                      <td className="p-3.5 font-mono">{u.student_id || u.staff_id || 'System Admin'}</td>
                      <td className="p-3.5">{u.branch || 'College-Wide'}</td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          u.is_active !== false
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : 'bg-rose-500/15 text-rose-300'
                        }`}>
                          {u.is_active !== false ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleToggleUserActive(u.id, u.is_active !== false)}
                          className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                            u.is_active !== false
                              ? 'bg-slate-800 hover:bg-rose-950/50 text-slate-300 hover:text-rose-300'
                              : 'bg-emerald-900/40 text-emerald-300 hover:bg-emerald-800/50'
                          }`}
                        >
                          {u.is_active !== false ? 'Deactivate Access' : 'Activate Access'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* Add Student Modal */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1222] border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-fadeIn max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowAddStudentModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-white mb-1">Add New Student Account</h2>
            <p className="text-xs text-slate-400 mb-4">Creates student record and user login credentials automatically.</p>

            <form onSubmit={handleSaveNewStudent} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Student ID</label>
                  <input
                    type="text"
                    value={stId}
                    onChange={(e) => setStId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={stName}
                    onChange={(e) => setStName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={stEmail}
                  onChange={(e) => setStEmail(e.target.value)}
                  required
                  placeholder="student@campusiq.edu"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Branch</label>
                  <select
                    value={stBranch}
                    onChange={(e) => setStBranch(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="AIML">AIML</option>
                    <option value="AIDS">AIDS</option>
                    <option value="CSE">CSE</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Year</label>
                  <select
                    value={stYear}
                    onChange={(e) => setStYear(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                    <option value={4}>Year 4</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Semester</label>
                  <input
                    type="number"
                    value={stSem}
                    onChange={(e) => setStSem(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    value={stCgpa}
                    onChange={(e) => setStCgpa(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Attendance %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={stAttendance}
                    onChange={(e) => setStAttendance(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Study Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={stStudyHours}
                    onChange={(e) => setStStudyHours(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="py-2 px-4 rounded-xl font-semibold bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl font-semibold bg-cyan-600 hover:bg-cyan-500 text-white"
                >
                  Save Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {showEditStudentModal && selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1222] border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-fadeIn max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowEditStudentModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-white mb-1">Edit Student: {selectedStudent.name}</h2>
            <p className="text-xs text-slate-400 mb-4">Student ID: {selectedStudent.student_id}</p>

            <form onSubmit={handleUpdateStudent} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={stName}
                  onChange={(e) => setStName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Branch</label>
                  <select
                    value={stBranch}
                    onChange={(e) => setStBranch(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="AIML">AIML</option>
                    <option value="AIDS">AIDS</option>
                    <option value="CSE">CSE</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Year</label>
                  <select
                    value={stYear}
                    onChange={(e) => setStYear(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                    <option value={4}>Year 4</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Semester</label>
                  <input
                    type="number"
                    value={stSem}
                    onChange={(e) => setStSem(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">CGPA</label>
                  <input
                    type="number"
                    step="0.01"
                    value={stCgpa}
                    onChange={(e) => setStCgpa(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Attendance %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={stAttendance}
                    onChange={(e) => setStAttendance(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Weekly Study Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={stStudyHours}
                    onChange={(e) => setStStudyHours(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditStudentModal(false)}
                  className="py-2 px-4 rounded-xl font-semibold bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl font-semibold bg-gradient-to-r from-indigo-600 to-cyan-600 text-white"
                >
                  Update Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1222] border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-fadeIn max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowAddStaffModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-white mb-1">Add New Faculty Account</h2>
            <p className="text-xs text-slate-400 mb-4">Creates faculty profile and staff login credentials.</p>

            <form onSubmit={handleSaveNewStaff} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Staff ID</label>
                  <input
                    type="text"
                    value={facId}
                    onChange={(e) => setFacId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={facName}
                    onChange={(e) => setFacName(e.target.value)}
                    required
                    placeholder="e.g. Dr. Ramesh Gupta"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  value={facEmail}
                  onChange={(e) => setFacEmail(e.target.value)}
                  required
                  placeholder="faculty@campusiq.edu"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Department</label>
                  <select
                    value={facDept}
                    onChange={(e) => setFacDept(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="AIML">AIML</option>
                    <option value="AIDS">AIDS</option>
                    <option value="CSE">CSE</option>
                    <option value="Administration">Administration</option>
                    <option value="Placement">Placement</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Designation</label>
                  <input
                    type="text"
                    value={facDesignation}
                    onChange={(e) => setFacDesignation(e.target.value)}
                    required
                    placeholder="e.g. Associate Professor"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Research Specialization</label>
                <input
                  type="text"
                  value={facSpecialization}
                  onChange={(e) => setFacSpecialization(e.target.value)}
                  placeholder="e.g. Natural Language Processing, Deep Learning"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="py-2 px-4 rounded-xl font-semibold bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  Save Faculty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {showEditStaffModal && selectedStaff && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1222] border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-fadeIn max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowEditStaffModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base font-bold text-white mb-1">Edit Faculty: {selectedStaff.name}</h2>
            <p className="text-xs text-slate-400 mb-4">Staff ID: {selectedStaff.staff_id}</p>

            <form onSubmit={handleUpdateStaff} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={facName}
                  onChange={(e) => setFacName(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Department</label>
                  <select
                    value={facDept}
                    onChange={(e) => setFacDept(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="AIML">AIML</option>
                    <option value="AIDS">AIDS</option>
                    <option value="CSE">CSE</option>
                    <option value="Administration">Administration</option>
                    <option value="Placement">Placement</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Designation</label>
                  <input
                    type="text"
                    value={facDesignation}
                    onChange={(e) => setFacDesignation(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Specialization</label>
                <input
                  type="text"
                  value={facSpecialization}
                  onChange={(e) => setFacSpecialization(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditStaffModal(false)}
                  className="py-2 px-4 rounded-xl font-semibold bg-slate-800 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  Update Faculty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
