import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  User, 
  BookOpen, 
  Award, 
  Calendar, 
  Send, 
  Eye, 
  CheckSquare, 
  Trash2, 
  ExternalLink,
  Sparkles,
  ChevronRight,
  X
} from 'lucide-react';

export default function TaskMonitoring({ onNavigate }) {
  const { user } = useAuth();
  
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskDetails, setTaskDetails] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);

  // Form states for creating task
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectCode, setSubjectCode] = useState('ML302');
  const [subjectName, setSubjectName] = useState('Machine Learning Techniques');
  const [taskBranch, setTaskBranch] = useState(user?.branch || 'AIML');
  const [taskYear, setTaskYear] = useState(3);
  const [dueDate, setDueDate] = useState('');
  const [points, setPoints] = useState(100);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalError, setModalError] = useState(null);

  // Form states for student submission
  const [submissionText, setSubmissionText] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  // Form states for faculty review
  const [grade, setGrade] = useState('A+');
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    loadTasks();
  }, [branchFilter, statusFilter]);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (branchFilter !== 'ALL') params.branch = branchFilter;
      if (statusFilter !== 'ALL') params.status = statusFilter;
      
      const res = await api.getTasks(params);
      setTasks(res.tasks || []);
    } catch (err) {
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDetails = async (task) => {
    setSelectedTask(task);
    try {
      const details = await api.getTaskDetails(task.id);
      setTaskDetails(details);
    } catch (err) {
      console.error('Failed to load task details:', err);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setModalError(null);
    try {
      await api.createTask({
        title,
        description,
        subject_code: subjectCode,
        subject_name: subjectName,
        branch: taskBranch,
        year: parseInt(taskYear),
        due_date: dueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        points: parseInt(points) || 100
      });
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      loadTasks();
    } catch (err) {
      setModalError(err.message || 'Failed to create task');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitTask = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;
    setActionLoading(true);
    setModalError(null);
    try {
      await api.submitTask(selectedTask.id, {
        submission_text: submissionText,
        attachment_url: attachmentUrl
      });
      setShowSubmitModal(false);
      setSubmissionText('');
      setAttachmentUrl('');
      loadTasks();
      if (selectedTask) handleOpenDetails(selectedTask);
    } catch (err) {
      setModalError(err.message || 'Failed to submit assignment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewSubmission = async (e) => {
    e.preventDefault();
    if (!selectedSubmission) return;
    setActionLoading(true);
    setModalError(null);
    try {
      await api.reviewSubmission(selectedSubmission.id, {
        grade,
        feedback,
        status: 'Completed'
      });
      setShowReviewModal(false);
      setFeedback('');
      loadTasks();
      if (selectedTask) handleOpenDetails(selectedTask);
    } catch (err) {
      setModalError(err.message || 'Failed to review submission');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await api.deleteTask(taskId);
      loadTasks();
      if (selectedTask?.id === taskId) {
        setSelectedTask(null);
        setTaskDetails(null);
      }
    } catch (err) {
      alert(err.message || 'Failed to delete task');
    }
  };

  // Filter by search
  const filteredTasks = tasks.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.subject_code.toLowerCase().includes(q) ||
      t.subject_name.toLowerCase().includes(q) ||
      t.faculty_name.toLowerCase().includes(q)
    );
  });

  // Calculate statistics
  const totalTasksCount = tasks.length;
  const activeTasksCount = tasks.filter(t => t.status === 'Active').length;
  const totalSubmissionsCount = tasks.reduce((sum, t) => sum + (t.submitted_count || 0), 0);
  const totalCompletedCount = tasks.reduce((sum, t) => sum + (t.completed_count || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* Header Banner */}
      <div className="bg-[#0b1222]/90 border border-slate-800 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 mb-2">
              <ClipboardList className="w-3.5 h-3.5 text-cyan-400" />
              <span>Academic Assignment & Task Monitoring</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {user?.role === 'student' ? 'My Academic Assignments & Tasks' : 'Academic Task & Assignment Engine'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Track assignments created by faculty, submissions by students, grading statuses, and academic milestones.
            </p>
          </div>

          {(user?.role === 'faculty' || user?.role === 'admin') && (
            <button
              type="button"
              onClick={() => {
                setShowCreateModal(true);
                setModalError(null);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-indigo-600 to-cyan-600 hover:opacity-95 transition-all shadow-lg shadow-indigo-600/20 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Assignment</span>
            </button>
          )}
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <span className="text-[11px] text-slate-400 block font-medium">Total Assignments</span>
            <span className="text-xl font-extrabold text-white mt-0.5 block">{totalTasksCount}</span>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <span className="text-[11px] text-slate-400 block font-medium">Active Tasks</span>
            <span className="text-xl font-extrabold text-cyan-400 mt-0.5 block">{activeTasksCount}</span>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <span className="text-[11px] text-slate-400 block font-medium">Submissions Received</span>
            <span className="text-xl font-extrabold text-indigo-400 mt-0.5 block">{totalSubmissionsCount}</span>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <span className="text-[11px] text-slate-400 block font-medium">Graded & Completed</span>
            <span className="text-xl font-extrabold text-emerald-400 mt-0.5 block">{totalCompletedCount}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, subject code, or faculty name..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">All Branches</option>
            <option value="AIML">AIML</option>
            <option value="AIDS">AIDS</option>
            <option value="CSE">CSE</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Tasks Grid / List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs">Loading academic tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/30 border border-slate-800 rounded-2xl">
          <ClipboardList className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-300">No Assignments Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery ? 'Try adjusting your search query or filters.' : 'There are no assignments matching the current criteria.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredTasks.map((t) => {
            const isStudent = user?.role === 'student';
            const mySub = t.my_submission;
            const isSubmitted = mySub && (mySub.status === 'Submitted' || mySub.status === 'Completed');
            const isGraded = mySub && mySub.status === 'Completed';

            return (
              <div
                key={t.id}
                className="bg-[#0b1222] border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between shadow-lg transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {t.subject_code}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {t.branch === 'ALL' ? 'All Branches' : `${t.branch} (Year ${t.year || 'All'})`}
                      </span>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      t.status === 'Active'
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {t.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white mb-1.5">{t.title}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2 mb-4">{t.description}</p>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 mb-4">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span className="truncate">{t.faculty_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>Due: {t.due_date}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions based on Role */}
                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  {isStudent ? (
                    <div className="flex items-center justify-between w-full">
                      {isGraded ? (
                        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Graded: {mySub.grade}</span>
                        </div>
                      ) : isSubmitted ? (
                        <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-medium">
                          <Clock className="w-4 h-4" />
                          <span>Submitted (Under Review)</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
                          <AlertCircle className="w-4 h-4" />
                          <span>Pending Submission</span>
                        </div>
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
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors cursor-pointer"
                      >
                        {isSubmitted ? 'Update Submission' : 'Submit Assignment'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs text-slate-400">
                        <strong className="text-white">{t.submitted_count || 0}</strong> submissions (<strong className="text-emerald-400">{t.completed_count || 0}</strong> graded)
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenDetails(t)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Review</span>
                        </button>
                        {(user?.role === 'admin' || user?.staff_id === t.faculty_id) && (
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(t.id)}
                            className="p-1.5 rounded-xl text-xs text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/30 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Review & Submissions Modal for Faculty / Admin */}
      {selectedTask && taskDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1222] border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative animate-fadeIn p-6">
            
            <div className="flex items-start justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-1 inline-block">
                  {selectedTask.subject_code} • {selectedTask.subject_name}
                </span>
                <h2 className="text-base font-bold text-white">{selectedTask.title}</h2>
                <p className="text-xs text-slate-400 mt-0.5">{selectedTask.description}</p>
              </div>
              <button
                type="button"
                onClick={() => { setSelectedTask(null); setTaskDetails(null); }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-1.5">
              <CheckSquare className="w-4 h-4 text-cyan-400" />
              Student Submissions ({taskDetails.submissions?.length || 0})
            </h3>

            {taskDetails.submissions?.length === 0 ? (
              <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 text-xs text-slate-400">
                No student submissions recorded for this assignment yet.
              </div>
            ) : (
              <div className="space-y-3">
                {taskDetails.submissions.map((sub) => (
                  <div key={sub.id} className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white">{sub.student_name}</span>
                        <span className="text-slate-400 font-mono text-[10px]">{sub.student_id}</span>
                        <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold ${
                          sub.status === 'Completed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-cyan-500/20 text-cyan-300'
                        }`}>
                          {sub.status}
                        </span>
                      </div>
                      <p className="text-slate-300 text-xs mb-1.5">{sub.submission_text || 'No submission notes provided.'}</p>
                      {sub.attachment_url && (
                        <a
                          href={sub.attachment_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>View Attached Link/Repo</span>
                        </a>
                      )}
                      {sub.feedback && (
                        <div className="mt-2 p-2 bg-slate-900 rounded-lg text-[11px] text-slate-300 border border-slate-800">
                          <span className="font-semibold text-emerald-400">Feedback ({sub.grade}): </span>
                          {sub.feedback}
                        </div>
                      )}
                    </div>

                    {(user?.role === 'faculty' || user?.role === 'admin') && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSubmission(sub);
                          setGrade(sub.grade || 'A+');
                          setFeedback(sub.feedback || '');
                          setShowReviewModal(true);
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer shrink-0"
                      >
                        {sub.status === 'Completed' ? 'Re-grade' : 'Grade & Review'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1222] border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-fadeIn">
            
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Create New Academic Assignment</span>
            </h2>
            <p className="text-xs text-slate-400 mb-4">Assign a project or homework to a specific branch and year.</p>

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateTask} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Assignment Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="e.g. Mini-Project: Neural Network Optimizer Implementation"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Subject Code</label>
                  <input
                    type="text"
                    value={subjectCode}
                    onChange={(e) => setSubjectCode(e.target.value)}
                    required
                    placeholder="e.g. ML302"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Subject Name</label>
                  <input
                    type="text"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                    required
                    placeholder="e.g. Machine Learning"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Target Department</label>
                  <select
                    value={taskBranch}
                    onChange={(e) => setTaskBranch(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value="ALL">All Departments</option>
                    <option value="AIML">AIML</option>
                    <option value="AIDS">AIDS</option>
                    <option value="CSE">CSE</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Year of Study</label>
                  <select
                    value={taskYear}
                    onChange={(e) => setTaskYear(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  >
                    <option value={0}>All Years</option>
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                    <option value={4}>Year 4</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Points / Weight</label>
                  <input
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Assignment Instructions</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  placeholder="Provide clear guidelines, deliverables, and requirements..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="py-2 px-4 rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="py-2 px-5 rounded-xl font-semibold bg-gradient-to-r from-indigo-600 to-cyan-600 hover:opacity-95 text-white"
                >
                  {actionLoading ? 'Creating...' : 'Create Assignment'}
                </button>
              </div>
            </form>

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

            {modalError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmitTask} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Submission Notes / Summary</label>
                <textarea
                  rows={4}
                  value={submissionText}
                  onChange={(e) => setSubmissionText(e.target.value)}
                  required
                  placeholder="Explain your solution approach, mathematical derivation, and results..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                ></textarea>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Project Link / Repo / Document URL</label>
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
                  className="py-2 px-4 rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="py-2 px-5 rounded-xl font-semibold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{actionLoading ? 'Submitting...' : 'Submit Work'}</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Review Submission Modal for Faculty */}
      {showReviewModal && selectedSubmission && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1222] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-fadeIn">
            
            <button
              type="button"
              onClick={() => setShowReviewModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-base font-bold text-white mb-1">Grade Student Submission</h2>
            <p className="text-xs text-slate-400 mb-4">{selectedSubmission.student_name} ({selectedSubmission.student_id})</p>

            <form onSubmit={handleReviewSubmission} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Assign Grade</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                >
                  <option value="O">O (Outstanding - 90-100%)</option>
                  <option value="A+">A+ (Excellent - 80-89%)</option>
                  <option value="A">A (Very Good - 70-79%)</option>
                  <option value="B+">B+ (Good - 60-69%)</option>
                  <option value="B">B (Above Average - 50-59%)</option>
                  <option value="Needs Revision">Needs Revision / Resubmit</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Faculty Feedback & Guidance</label>
                <textarea
                  rows={4}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Provide constructive feedback, praise strengths, and specify improvement areas..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-400"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  className="py-2 px-4 rounded-xl font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="py-2 px-5 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  {actionLoading ? 'Saving...' : 'Confirm Grade & Feedback'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
