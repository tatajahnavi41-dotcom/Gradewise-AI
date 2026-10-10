import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  LifeBuoy,
  PlusCircle,
  CheckCircle2,
  Clock,
  AlertCircle,
  Filter,
  Search,
  ChevronRight,
  UserCheck,
  Edit3
} from 'lucide-react';

export default function InterventionCentre({ onSelectStudent, onNavigate }) {
  const { user } = useAuth();
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');

  // Modal for status update
  const [selectedIntervention, setSelectedIntervention] = useState(null);
  const [newStatus, setNewStatus] = useState('Completed');
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('2026-11-05');
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  // Modal for creating intervention
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [concern, setConcern] = useState('');
  const [actionPlan, setActionPlan] = useState('');
  const [assignedFaculty, setAssignedFaculty] = useState('');
  const [staffList, setStaffList] = useState([]);
  const [dueDate, setDueDate] = useState('2026-10-30');
  const [msg, setMsg] = useState(null);

  const fetchInterventions = async () => {
    setLoading(true);
    try {
      const [res, staffRes] = await Promise.all([
        api.getInterventions({
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          branch: branchFilter !== 'ALL' ? branchFilter : undefined,
        }),
        api.getStaff()
      ]);
      setInterventions(res.interventions || []);
      const stfs = staffRes.staff || [];
      setStaffList(stfs);
      if (stfs.length > 0 && !assignedFaculty) {
        setAssignedFaculty(stfs[0].staff_id);
      }
    } catch (err) {
      console.error('Failed to load interventions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInterventions();
  }, [statusFilter, branchFilter]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      await api.updateInterventionStatus(selectedIntervention.id, {
        status: newStatus,
        outcome_notes: outcomeNotes,
        follow_up_date: followUpDate
      });
      setStatusModalOpen(false);
      setMsg(`Intervention #${selectedIntervention.id} updated to ${newStatus}`);
      fetchInterventions();
      setTimeout(() => setMsg(null), 4000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateNew = async (e) => {
    e.preventDefault();
    try {
      await api.createIntervention({
        student_id: studentId,
        concern: concern,
        action_plan: actionPlan,
        assigned_faculty_id: assignedFaculty,
        due_date: dueDate
      });
      setCreateModalOpen(false);
      setMsg(`New intervention created for student ${studentId}`);
      fetchInterventions();
      setTimeout(() => setMsg(null), 4000);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <LifeBuoy className="w-6 h-6 text-emerald-400" />
            <span>Intervention & Mentorship Management</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
              {interventions.length} Records
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tracking structured faculty mentorship cases, remedial action plans, and student outcome progress.
          </p>
        </div>

        {user?.role !== 'student' && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Intervention</span>
          </button>
        )}
      </div>

      {msg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Status:</span>
          {['ALL', 'Pending', 'In Progress', 'Completed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === st
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Branch:</span>
          <select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
          >
            <option value="ALL">All Branches</option>
            <option value="AIML">AIML</option>
            <option value="AIDS">AIDS</option>
            <option value="CSE">CSE</option>
          </select>
        </div>
      </div>

      {/* Interventions Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading interventions...
          </div>
        ) : interventions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No interventions found matching current criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Concern Description</th>
                  <th className="py-3 px-4">Prescribed Action Plan</th>
                  <th className="py-3 px-4">Assigned Mentor</th>
                  <th className="py-3 px-4 text-center">Due Date</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {interventions.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-white">{item.student_name}</p>
                      <p className="text-[10px] text-cyan-400 font-mono">{item.student_id} • {item.branch}</p>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="text-slate-300 font-medium truncate" title={item.concern}>{item.concern}</p>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="text-slate-400 truncate" title={item.action_plan}>{item.action_plan}</p>
                      {item.outcome_notes && (
                        <p className="text-[10px] text-emerald-400 mt-0.5 truncate">Outcome: {item.outcome_notes}</p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-slate-200">{item.faculty_name}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-400">
                      {item.due_date}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        item.status === 'Completed'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : (item.status === 'In Progress' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40')
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {user?.role !== 'student' && (
                        <button
                          onClick={() => {
                            setSelectedIntervention(item);
                            setNewStatus(item.status);
                            setOutcomeNotes(item.outcome_notes || '');
                            setStatusModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
                        >
                          Update Status
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Update Status */}
      {statusModalOpen && selectedIntervention && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111827] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in">
            <h3 className="text-base font-bold text-white mb-1">Update Intervention Status</h3>
            <p className="text-xs text-slate-400 mb-4">
              Recording milestone outcome for <span className="text-cyan-400 font-mono">{selectedIntervention.student_name}</span>
            </p>

            <form onSubmit={handleUpdateStatus} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed (Issue Resolved)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Outcome Observations & Notes</label>
                <textarea
                  rows="3"
                  value={outcomeNotes}
                  onChange={(e) => setOutcomeNotes(e.target.value)}
                  placeholder="e.g. Student cleared practical viva with 85% marks and attended all 4 remedial lectures."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Follow-up Check Date</label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setStatusModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                >
                  Commit Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Intervention */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111827] border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in">
            <h3 className="text-base font-bold text-white mb-1">Initiate Mentor Intervention</h3>
            <p className="text-xs text-slate-400 mb-4">
              Create a formal remedial action plan for an engineering student.
            </p>

            <form onSubmit={handleCreateNew} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Student ID</label>
                <input
                  type="text"
                  placeholder="e.g. AIML-001 or CSE-020"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Concern Identified</label>
                <input
                  type="text"
                  placeholder="e.g. Attendance below 60%, struggling in DSA pointer concepts"
                  value={concern}
                  onChange={(e) => setConcern(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Action Plan</label>
                <textarea
                  rows="3"
                  placeholder="1) Mandatory Saturday problem-solving session. 2) Re-test after 10 days."
                  value={actionPlan}
                  onChange={(e) => setActionPlan(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Assigned Faculty Mentor</label>
                  <select
                    value={assignedFaculty}
                    onChange={(e) => setAssignedFaculty(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  >
                    {staffList.length > 0 ? (
                      staffList.map((stf) => (
                        <option key={stf.staff_id} value={stf.staff_id}>
                          {stf.name} ({stf.department || stf.assigned_branch || 'Faculty'})
                        </option>
                      ))
                    ) : (
                      <option value="">No Faculty Registered</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                >
                  Save Intervention
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
