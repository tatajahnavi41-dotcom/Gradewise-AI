import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  PieChart,
  Users,
  Award,
  AlertTriangle,
  Flame,
  TrendingDown,
  FileQuestion,
  ChevronRight,
  Filter
} from 'lucide-react';

export default function StudentSegmentation({ onSelectStudent, onNavigate }) {
  const [segments, setSegments] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeSegmentKey, setActiveSegmentKey] = useState('balanced_high_performers');
  const [branch, setBranch] = useState('ALL');

  const fetchSegmentation = async () => {
    setLoading(true);
    try {
      const res = await api.getSegmentation(branch !== 'ALL' ? branch : undefined);
      setSegments(res || {});
    } catch (err) {
      console.error('Failed to load student segmentation:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSegmentation();
  }, [branch]);

  const activeSegment = segments[activeSegmentKey] || { title: 'Segment', description: '', count: 0, students: [] };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <PieChart className="w-6 h-6 text-indigo-400" />
            <span>Student Segmentation & Diagnostic Clusters</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic behavioral segmentation identifying specific strengths and targeted intervention clusters.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="bg-transparent text-slate-200 focus:outline-none text-xs cursor-pointer font-medium"
          >
            <option value="ALL">All Branches</option>
            <option value="AIML">AIML</option>
            <option value="AIDS">AIDS</option>
            <option value="CSE">CSE</option>
          </select>
        </div>
      </div>

      {/* Segment Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {Object.entries(segments).map(([key, seg]) => {
          const isSelected = activeSegmentKey === key;
          return (
            <button
              key={key}
              onClick={() => setActiveSegmentKey(key)}
              className={`p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-gradient-to-b from-indigo-950 to-slate-900 border-cyan-400 shadow-md'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold">Cluster</span>
                <span className={`text-xs font-mono font-bold px-1.5 py-0.2 rounded ${
                  isSelected ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-300'
                }`}>
                  {seg.count}
                </span>
              </div>
              <p className="text-xs font-bold text-white mt-2 line-clamp-1">{seg.title}</p>
            </button>
          );
        })}
      </div>

      {/* Active Segment Detail Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <div className="pb-4 border-b border-slate-800/80 mb-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">{activeSegment.title}</h3>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
              {activeSegment.count} Students Identified
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">{activeSegment.description}</p>
        </div>

        {/* Student List in active segment */}
        <div className="space-y-2.5">
          {activeSegment.students?.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No students belong to this segment currently.
            </div>
          ) : (
            activeSegment.students?.map((s) => (
              <div
                key={s.student_id}
                onClick={() => {
                  if (onSelectStudent) onSelectStudent(s.student_id);
                  if (onNavigate) onNavigate('student-profile');
                }}
                className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer group"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-white group-hover:text-cyan-300 transition-colors">{s.name}</span>
                    <span className="font-mono text-[11px] text-cyan-400 bg-cyan-950/60 px-1.5 py-0.2 rounded border border-cyan-800/40">
                      {s.student_id}
                    </span>
                    <span className="text-[10px] text-slate-400">{s.branch} • Year {s.year}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Diagnosis: <span className="text-slate-200 font-medium">{s.reason}</span>
                  </p>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-sans">Success Score</span>
                    <span className="font-bold text-white">{s.success_score}/100</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-sans">Attendance</span>
                    <span className="text-slate-300">{s.attendance_pct}%</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 group-hover:text-cyan-400 transition-all" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
