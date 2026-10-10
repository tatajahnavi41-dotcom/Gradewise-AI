import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Compass,
  CheckCircle2,
  Circle,
  Clock,
  BookOpen,
  ArrowRight,
  Filter,
  Sparkles,
  ExternalLink
} from 'lucide-react';

export default function PersonalizedRoadmap({ onNavigate }) {
  const { user } = useAuth();
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [trackFilter, setTrackFilter] = useState('ALL');

  const studentId = user?.student_id;

  const fetchRoadmap = async () => {
    setLoading(true);
    try {
      let targetId = studentId;
      if (!targetId) {
        const stResp = await api.getStudents();
        if (stResp?.students && stResp.students.length > 0) {
          targetId = stResp.students[0].student_id;
        }
      }
      if (targetId) {
        const res = await api.getStudentProfile(targetId);
        setMilestones(res.milestones || []);
      } else {
        setMilestones([]);
      }
    } catch (err) {
      console.error('Failed to load roadmap:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoadmap();
  }, [studentId]);

  const handleToggle = async (milestoneId) => {
    try {
      await api.toggleMilestone(milestoneId);
      fetchRoadmap();
    } catch (err) {
      alert(err.message);
    }
  };

  const filtered = trackFilter === 'ALL' 
    ? milestones 
    : milestones.filter(m => m.track.toLowerCase() === trackFilter.toLowerCase());

  const completedCount = milestones.filter(m => m.status === 'completed').length;
  const progressPct = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Compass className="w-6 h-6 text-indigo-400" />
            <span>Personalized Student Roadmap</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Guided sequential learning journey based on your identified subject gaps, skills profile, and placement deadlines.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {['ALL', 'academic', 'technical', 'placement'].map((tr) => (
            <button
              key={tr}
              onClick={() => setTrackFilter(tr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                trackFilter === tr
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {tr}
            </button>
          ))}
        </div>
      </div>

      {/* Progress Bar Card */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-400">Roadmap Milestone Completion</span>
          <h3 className="text-xl font-bold text-white mt-0.5">
            {completedCount} of {milestones.length} Milestones Cleared ({progressPct}%)
          </h3>
        </div>
        <div className="w-full sm:w-64">
          <div className="w-full h-2.5 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Milestones List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading roadmap milestones...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs glass-panel rounded-2xl border border-slate-800">
            No milestones found for track "{trackFilter}".
          </div>
        ) : (
          filtered.map((m, idx) => {
            const isDone = m.status === 'completed';
            return (
              <div
                key={m.id}
                className={`glass-panel p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isDone ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-slate-800'
                }`}
              >
                <div className="flex items-start gap-3.5 max-w-2xl">
                  <button
                    onClick={() => handleToggle(m.id)}
                    className="mt-0.5 text-slate-400 hover:text-emerald-400 transition-colors shrink-0"
                    title="Click to toggle milestone completion status"
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-500" />
                    )}
                  </button>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[10px] uppercase px-2 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800 font-semibold">
                        {m.track}
                      </span>
                      <h3 className={`text-sm font-bold ${isDone ? 'line-through text-slate-400' : 'text-white'}`}>
                        {m.title}
                      </h3>
                      <span className="text-[10px] text-amber-400 font-mono">
                        Difficulty: {m.difficulty}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300">{m.description}</p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Est: {m.estimated_hours}h</span>
                      </span>
                      <span>Target Date: <strong className="text-slate-300">{m.target_date || '2026-10-25'}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                  <button
                    onClick={() => handleToggle(m.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      isDone
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                    }`}
                  >
                    {isDone ? 'Mark In Progress' : 'Mark Complete (+25 pts)'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
