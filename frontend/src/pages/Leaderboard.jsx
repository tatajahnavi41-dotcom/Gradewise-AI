import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Trophy,
  Medal,
  Flame,
  TrendingUp,
  Award,
  Filter,
  Sparkles,
  ChevronRight
} from 'lucide-react';

export default function Leaderboard({ onSelectStudent, onNavigate }) {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [branch, setBranch] = useState('ALL');
  const [year, setYear] = useState('');
  const [category, setCategory] = useState('success_score');

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await api.getLeaderboard({
        branch: branch !== 'ALL' ? branch : undefined,
        year: year ? parseInt(year) : undefined,
        category: category,
        limit: 50
      });
      setLeaders(res.leaderboard || []);
    } catch (err) {
      console.error('Failed to load leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [branch, year, category]);

  const topThree = leaders.slice(0, 3);
  const restLeaders = leaders.slice(3);

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <span>Campus & Branch Leaderboard</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Celebrating academic excellence, growth streaks, and exceptional improvement comebacks.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none text-xs cursor-pointer font-medium"
            >
              <option value="success_score">Holistic Success Score</option>
              <option value="comeback_score">Comeback Growth Champions</option>
              <option value="cgpa">University CGPA</option>
              <option value="attendance">Classroom Attendance</option>
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

          <div className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-xs">
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none text-xs cursor-pointer"
            >
              <option value="">All Years</option>
              <option value="2">Year 2</option>
              <option value="3">Year 3</option>
              <option value="4">Year 4</option>
            </select>
          </div>
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      {topThree.length >= 3 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          
          {/* Rank #2 */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-700/80 text-center relative order-2 sm:order-1 flex flex-col justify-between">
            <div className="w-10 h-10 rounded-full bg-slate-400/20 text-slate-300 mx-auto flex items-center justify-center font-bold text-sm mb-2 border border-slate-400/40">
              🥈 #2
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">{topThree[1].name}</h3>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">{topThree[1].student_id} • {topThree[1].branch}</p>
              <div className="mt-3 p-2 bg-slate-900/60 rounded-xl">
                <p className="text-xl font-extrabold text-cyan-400 font-mono">
                  {category === 'comeback_score' ? topThree[1].comeback_score : topThree[1].success_score}
                </p>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">
                  {category === 'comeback_score' ? 'Comeback Index' : 'Success Score'}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-emerald-400">
              <Flame className="w-3.5 h-3.5" />
              <span>{topThree[1].learning_streak} Day Streak</span>
            </div>
          </div>

          {/* Rank #1 Center Spotlight */}
          <div className="glass-panel-glow p-6 rounded-2xl border border-amber-500/40 text-center relative order-1 sm:order-2 shadow-xl shadow-amber-500/10 flex flex-col justify-between scale-105">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-300 mx-auto flex items-center justify-center font-bold text-base mb-2 border border-amber-500/50 shadow-inner">
              🥇 #1
            </div>
            <div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 uppercase font-mono font-bold tracking-wider">
                Cohort Leader
              </span>
              <h3 className="font-extrabold text-white text-base mt-1.5">{topThree[0].name}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{topThree[0].student_id} • {topThree[0].branch}</p>
              <div className="mt-3 p-2.5 bg-slate-900/80 rounded-xl border border-amber-500/20">
                <p className="text-2xl font-black text-amber-400 font-mono">
                  {category === 'comeback_score' ? topThree[0].comeback_score : topThree[0].success_score}
                </p>
                <p className="text-[10px] text-slate-300 uppercase font-semibold">
                  {category === 'comeback_score' ? 'Comeback Index' : 'Success Score'}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-amber-300 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{topThree[0].growth_points} Points • {topThree[0].learning_streak} Day Streak</span>
            </div>
          </div>

          {/* Rank #3 */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-700/80 text-center relative order-3 flex flex-col justify-between">
            <div className="w-10 h-10 rounded-full bg-amber-800/20 text-amber-600 mx-auto flex items-center justify-center font-bold text-sm mb-2 border border-amber-800/40">
              🥉 #3
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">{topThree[2].name}</h3>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">{topThree[2].student_id} • {topThree[2].branch}</p>
              <div className="mt-3 p-2 bg-slate-900/60 rounded-xl">
                <p className="text-xl font-extrabold text-indigo-400 font-mono">
                  {category === 'comeback_score' ? topThree[2].comeback_score : topThree[2].success_score}
                </p>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">
                  {category === 'comeback_score' ? 'Comeback Index' : 'Success Score'}
                </p>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-indigo-400">
              <Flame className="w-3.5 h-3.5" />
              <span>{topThree[2].learning_streak} Day Streak</span>
            </div>
          </div>

        </div>
      )}

      {/* Leaderboard Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Full Leaderboard Standings</h3>
          <span className="text-xs text-slate-400">{leaders.length} Active Ranked Students</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4 text-center">Branch</th>
                <th className="py-3 px-4 text-center">Success Score</th>
                <th className="py-3 px-4 text-center">Comeback Score</th>
                <th className="py-3 px-4 text-center">Streak</th>
                <th className="py-3 px-4 text-center">Growth Points</th>
                <th className="py-3 px-4 text-right">Badge</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {leaders.map((s) => (
                <tr 
                  key={s.student_id}
                  className="hover:bg-slate-800/30 transition-colors cursor-pointer group"
                  onClick={() => {
                    if (onSelectStudent) onSelectStudent(s.student_id);
                    if (onNavigate) onNavigate('student-profile');
                  }}
                >
                  <td className="py-3 px-4 font-mono font-bold text-slate-300">
                    #{s.rank}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-white group-hover:text-cyan-300 transition-colors">{s.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{s.student_id}</p>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-300">
                    {s.branch}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-cyan-400">
                    {s.success_score}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-semibold text-emerald-400">
                    {s.comeback_score}
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-amber-400">
                    🔥 {s.learning_streak}d
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-slate-300">
                    {s.growth_points} pts
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
                      {s.performance_band}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
