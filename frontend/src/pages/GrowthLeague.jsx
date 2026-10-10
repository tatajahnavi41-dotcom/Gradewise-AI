import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Flame,
  Trophy,
  Award,
  TrendingUp,
  Sparkles,
  Zap,
  Target,
  CheckCircle2,
  Users
} from 'lucide-react';

export default function GrowthLeague({ onSelectStudent, onNavigate }) {
  const [leagueData, setLeagueData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLeague() {
      setLoading(true);
      try {
        const res = await api.getGrowthLeague();
        setLeagueData(res);
      } catch (err) {
        console.error('Failed to load growth league:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLeague();
  }, []);

  if (loading || !leagueData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const standings = leagueData.branch_standings || [];
  const topStudents = leagueData.top_growth_students || [];
  const challenges = leagueData.weekly_challenges || [];

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Flame className="w-6 h-6 text-amber-500 animate-pulse" />
            <span>Campus Growth League</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Department team collaboration rewarding daily practice streaks, completed milestones, and Comeback Scores.
          </p>
        </div>

        <button
          onClick={() => onNavigate('learning-arena')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-90 text-white text-xs font-semibold shadow-md transition-all"
        >
          <Zap className="w-4 h-4" />
          <span>Earn Growth Points Now</span>
        </button>
      </div>

      {/* Branch Team Standings Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {standings.map((b, idx) => (
          <div
            key={b.branch}
            className={`glass-panel p-5 rounded-2xl border relative overflow-hidden flex flex-col justify-between ${
              idx === 0 ? 'border-amber-500/40 bg-amber-950/10 shadow-lg shadow-amber-500/10' : 'border-slate-800'
            }`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-400">
                  {idx === 0 ? '🥇 1st Place' : (idx === 1 ? '🥈 2nd Place' : '🥉 3rd Place')}
                </span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                  {b.students_count} Students
                </span>
              </div>

              <h3 className="text-lg font-black text-white mt-2">Department of {b.branch}</h3>
              
              <div className="mt-4 p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total Department Points:</span>
                  <span className="font-mono font-bold text-amber-400 text-sm">{b.total_points.toLocaleString()} pts</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Avg Comeback Score:</span>
                  <span className="font-mono font-semibold text-emerald-400">{b.avg_comeback_score} / 100</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total Active Streaks:</span>
                  <span className="font-mono text-slate-200">🔥 {b.total_streaks} days</span>
                </div>
              </div>
            </div>

            <div className="mt-4 text-[11px] text-slate-400 text-center">
              Avg points per student: <strong className="text-white">{b.avg_points_per_student} pts</strong>
            </div>
          </div>
        ))}
      </div>

      {/* 2-Column Grid: Growth Leaders & Weekly Challenges */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Top Individual Growth Leaders */}
        <div className="lg:col-span-7 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Campus Growth Champions (Delta & Activity)</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Top 10</span>
          </div>

          <div className="space-y-2">
            {topStudents.map((st, i) => (
              <div
                key={st.student_id}
                onClick={() => {
                  if (onSelectStudent) onSelectStudent(st.student_id);
                  if (onNavigate) onNavigate('student-profile');
                }}
                className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors flex items-center justify-between cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-slate-800 text-slate-400 font-mono font-bold text-xs flex items-center justify-center">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-xs text-white group-hover:text-cyan-300 transition-colors">{st.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{st.student_id} • {st.branch}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-sans">Comeback</span>
                    <span className="font-semibold text-emerald-400">{st.comeback_score}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-sans">Points</span>
                    <span className="font-bold text-amber-400">{st.growth_points} pts</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Weekly Challenges */}
        <div className="lg:col-span-5 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-400" />
              <span>Weekly Campus Challenges</span>
            </h3>
            <span className="text-[10px] text-emerald-400 font-mono">Active Sprint</span>
          </div>

          <div className="space-y-3">
            {challenges.map((c) => (
              <div key={c.id} className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{c.title}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    +{c.reward_pts} pts
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{c.target}</p>
                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className="text-slate-400">Ends in: 4 days</span>
                  <button
                    onClick={() => onNavigate('learning-arena')}
                    className="text-cyan-400 hover:underline font-semibold"
                  >
                    Solve Challenge →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
