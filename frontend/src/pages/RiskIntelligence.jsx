import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  ShieldAlert,
  AlertTriangle,
  Filter,
  LifeBuoy,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  FileWarning
} from 'lucide-react';

export default function RiskIntelligence({ onSelectStudent, onNavigate }) {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [riskType, setRiskType] = useState('ALL');
  const [severity, setSeverity] = useState('ALL');
  const [branch, setBranch] = useState('ALL');

  // Quick intervention modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState(null);
  const [concern, setConcern] = useState('');
  const [actionPlan, setActionPlan] = useState('');
  const [assignedFaculty, setAssignedFaculty] = useState('');
  const [staffList, setStaffList] = useState([]);
  const [dueDate, setDueDate] = useState('2026-10-30');
  const [createMsg, setCreateMsg] = useState(null);

  const fetchRisks = async () => {
    setLoading(true);
    try {
      const [res, staffRes] = await Promise.all([
        api.getRiskIntelligence({
          risk_type: riskType !== 'ALL' ? riskType : undefined,
          severity: severity !== 'ALL' ? severity : undefined,
          branch: branch !== 'ALL' ? branch : undefined,
        }),
        api.getStaff()
      ]);
      setFlags(res.flags || []);
      const stfs = staffRes.staff || [];
      setStaffList(stfs);
      if (stfs.length > 0 && !assignedFaculty) {
        setAssignedFaculty(stfs[0].staff_id);
      }
    } catch (err) {
      console.error('Failed to fetch risk intelligence:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRisks();
  }, [riskType, severity, branch]);

  const handleOpenCreate = (flag) => {
    setSelectedFlag(flag);
    setConcern(`${flag.risk_type}: ${flag.triggering_rule} (Value: ${flag.actual_value})`);
    setActionPlan(flag.recommended_action);
    setAssignedFaculty(flag.assigned_mentor_id || 'FAC-001');
    setShowCreateModal(true);
  };

  const handleCreateIntervention = async (e) => {
    e.preventDefault();
    try {
      await api.createIntervention({
        student_id: selectedFlag.student_id,
        concern: concern,
        action_plan: actionPlan,
        assigned_faculty_id: assignedFaculty,
        due_date: dueDate
      });
      setCreateMsg(`Intervention opened for ${selectedFlag.student_id}!`);
      setShowCreateModal(false);
      fetchRisks();
      setTimeout(() => setCreateMsg(null), 4000);
    } catch (err) {
      alert(err.message);
    }
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'CRITICAL':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">HIGH</span>;
      case 'WARNING':
      case 'MODERATE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">LOW</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-400" />
            <span>Risk Intelligence Centre</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 font-mono">
              {flags.length} Active Warnings
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Explainable early-warning signals across academic deficit, debarment attendance, and placement benchmark gaps.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
            <select
              value={riskType}
              onChange={(e) => setRiskType(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none text-xs cursor-pointer font-medium"
            >
              <option value="ALL">All Risk Vectors</option>
              <option value="ACADEMIC">Academic Score Deficit</option>
              <option value="ATTENDANCE">Attendance Eligibility</option>
              <option value="ASSIGNMENT">Assignment Submissions</option>
              <option value="PLACEMENT">Placement Readiness</option>
            </select>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none text-xs cursor-pointer"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="HIGH">High Severity</option>
              <option value="MODERATE">Moderate / Warning</option>
            </select>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
            <select
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none text-xs cursor-pointer"
            >
              <option value="ALL">All Branches</option>
              <option value="AIML">AIML</option>
              <option value="AIDS">AIDS</option>
              <option value="CSE">CSE</option>
            </select>
          </div>
        </div>
      </div>

      {createMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{createMsg}</span>
        </div>
      )}

      {/* Warnings Grid / List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <div className="w-6 h-6 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Analyzing heuristic rules...
          </div>
        ) : flags.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs glass-panel rounded-2xl border border-slate-800">
            No active risk flags match the current filters.
          </div>
        ) : (
          flags.map((f, idx) => (
            <div
              key={idx}
              className="glass-panel p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2 flex-wrap">
                  {getSeverityBadge(f.severity)}
                  <span className="font-mono text-xs font-bold text-cyan-300">{f.student_id}</span>
                  <span className="text-xs font-semibold text-white">{f.student_name}</span>
                  <span className="text-[10px] text-slate-400">[{f.branch} • Year {f.year}]</span>
                  <span className="text-[10px] font-mono px-2 py-0.2 rounded bg-slate-900 text-slate-300 border border-slate-800">
                    {f.risk_type}
                  </span>
                </div>

                <p className="text-xs font-semibold text-rose-300">{f.triggering_rule}</p>
                <p className="text-[11px] text-slate-300">{f.evidence}</p>

                <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                  <span>Actual: <strong className="text-white">{f.actual_value}</strong></span>
                  <span>Threshold: <strong className="text-slate-300">{f.threshold}</strong></span>
                  <span>Intervention Status: <strong className="text-indigo-300">{f.intervention_status}</strong></span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleOpenCreate(f)}
                  className="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <LifeBuoy className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Launch Intervention</span>
                </button>
                <button
                  onClick={() => {
                    if (onSelectStudent) onSelectStudent(f.student_id);
                    if (onNavigate) onNavigate('student-profile');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1"
                >
                  <span>Profile</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Create Intervention from Warning */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111827] border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in">
            <h3 className="text-base font-bold text-white mb-1">Create Support Intervention</h3>
            <p className="text-xs text-slate-400 mb-4">
              Directly assign mentor action plan for <span className="text-cyan-400 font-mono">{selectedFlag?.student_name} ({selectedFlag?.student_id})</span>
            </p>

            <form onSubmit={handleCreateIntervention} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Concern Description</label>
                <input
                  type="text"
                  value={concern}
                  onChange={(e) => setConcern(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Prescribed Action Plan</label>
                <textarea
                  rows="3"
                  value={actionPlan}
                  onChange={(e) => setActionPlan(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Assigned Faculty</label>
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
                  <label className="block text-xs font-medium text-slate-300 mb-1">Target Due Date</label>
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
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
                >
                  Create & Notify Faculty
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
