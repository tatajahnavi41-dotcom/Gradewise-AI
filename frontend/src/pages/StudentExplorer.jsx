import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Search,
  Filter,
  Users,
  Award,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export default function StudentExplorer({ onSelectStudent, onNavigate }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [branch, setBranch] = useState('ALL');
  const [year, setYear] = useState('');
  const [risk, setRisk] = useState('ALL');
  const [sortBy, setSortBy] = useState('class_rank');
  const [order, setOrder] = useState('asc');

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await api.getStudents({
        search: search || undefined,
        branch: branch !== 'ALL' ? branch : undefined,
        year: year ? parseInt(year) : undefined,
        risk: risk !== 'ALL' ? risk : undefined,
        sort_by: sortBy,
        order: order,
        limit: 100
      });
      setStudents(res.students || []);
      setTotalCount(res.total || 0);
    } catch (err) {
      console.error('Failed to fetch students:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 200);
    return () => clearTimeout(timer);
  }, [search, branch, year, risk, sortBy, order]);

  const getRiskBadge = (r) => {
    switch (r) {
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">High Risk</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">Medium Risk</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Low Risk</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Student Explorer & Cohort Registry</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-mono">
              {totalCount} Total Records
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Search, filter, and inspect detailed academic profiles and early-warning signals for registered students across branches.
          </p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        
        {/* Search */}
        <div className="lg:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, ID (e.g. STU-001) or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        {/* Branch Filter */}
        <div>
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">All Branches (AIML, AIDS, CSE)</option>
            <option value="AIML">AIML</option>
            <option value="AIDS">AIDS</option>
            <option value="CSE">CSE</option>
          </select>
        </div>

        {/* Year Filter */}
        <div>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            <option value="">All Years</option>
            <option value="2">2nd Year (Sem 3)</option>
            <option value="3">3rd Year (Sem 5)</option>
            <option value="4">4th Year (Sem 7)</option>
          </select>
        </div>

        {/* Risk Filter */}
        <div>
          <select
            value={risk}
            onChange={(e) => setRisk(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            <option value="ALL">All Risk Bands</option>
            <option value="LOW">Low Risk (Safe)</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
          </select>
        </div>

        {/* Sort */}
        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-cyan-400"
          >
            <option value="class_rank">Sort by Class Rank</option>
            <option value="success_score">Sort by Success Score</option>
            <option value="comeback_score">Sort by Comeback Score</option>
            <option value="attendance">Sort by Attendance</option>
            <option value="cgpa">Sort by CGPA</option>
          </select>
        </div>

      </div>

      {/* Table / Results */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading cohort records...
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            No students found matching current search criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">Name & Email</th>
                  <th className="py-3 px-4 text-center">Branch / Year</th>
                  <th className="py-3 px-4 text-center">Success Score</th>
                  <th className="py-3 px-4 text-center">Comeback Score</th>
                  <th className="py-3 px-4 text-center">Attendance</th>
                  <th className="py-3 px-4 text-center">Risk Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {students.map((s) => (
                  <tr 
                    key={s.student_id} 
                    className="hover:bg-slate-800/30 transition-colors cursor-pointer group"
                    onClick={() => {
                      if (onSelectStudent) onSelectStudent(s.student_id);
                      if (onNavigate) onNavigate('student-profile');
                    }}
                  >
                    <td className="py-3 px-4 font-mono font-bold text-slate-400 group-hover:text-cyan-400">
                      #{s.class_rank}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-cyan-300">
                      {s.student_id}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-white group-hover:text-cyan-200 transition-colors">{s.name}</p>
                      <p className="text-[10px] text-slate-400">{s.email}</p>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono text-slate-300">{s.branch}</span>
                      <span className="text-slate-400 text-[10px] ml-1">Y{s.year}</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono font-bold text-white text-sm">{s.success_score}</span>
                      <span className="text-[10px] text-slate-400">/100</span>
                      {s.is_provisional && (
                        <span className="text-[9px] block text-amber-400 font-mono">Provisional</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-mono font-semibold text-emerald-400">{s.comeback_score}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono">
                      <span className={s.attendance_pct < 65 ? 'text-rose-400 font-bold' : (s.attendance_pct < 75 ? 'text-amber-400' : 'text-slate-300')}>
                        {s.attendance_pct}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getRiskBadge(s.risk_category)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] text-cyan-400 font-medium group-hover:translate-x-1 transition-transform">
                        <span>Profile</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
