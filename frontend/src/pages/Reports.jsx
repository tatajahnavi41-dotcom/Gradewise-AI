import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  PieChart,
  BarChart3,
  Calendar,
  Layers,
  Sparkles
} from 'lucide-react';

export default function Reports() {
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReports() {
      setLoading(true);
      try {
        const res = await api.getReportsSummary();
        setReportsData(res);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReports();
  }, []);

  if (loading || !reportsData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const branches = reportsData.branches_comparison || [];
  const intMetrics = reportsData.intervention_metrics || {};
  const dataQuality = reportsData.data_quality || {};

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
            <span>Institutional Reports & Data Exports</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Official department comparisons, intervention resolution ratios, and downloadable accredited datasets.
          </p>
        </div>

        {/* Download CSV Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={api.getExportUrl('students', 'ALL')}
            download
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Students (CSV)</span>
          </a>
          <a
            href={api.getExportUrl('interventions', 'ALL')}
            download
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Interventions (CSV)</span>
          </a>
        </div>
      </div>

      {/* KPI Overview Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400">Total Registered Cohort</span>
          <p className="text-2xl font-black text-white mt-1">{reportsData.dataset_size || 0} Students</p>
          <span className="text-[11px] text-cyan-400 mt-1 block">Across All Active Academic Departments</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400">Mentorship Resolution Rate</span>
          <p className="text-2xl font-black text-emerald-400 mt-1">{intMetrics.resolution_rate_pct}%</p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {intMetrics.completed} resolved out of {intMetrics.total} logged cases
          </span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400">Dataset Completeness Rate</span>
          <p className="text-2xl font-black text-cyan-400 mt-1">{dataQuality.completeness_pct}%</p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            {dataQuality.provisional_records} records flagged with provisional indicators
          </span>
        </div>
      </div>

      {/* Department Comparison Table */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <span>Cross-Branch Department Comparative Metrics</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">Academic Session 2026</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-center">Enrolled</th>
                <th className="py-3 px-4 text-center">Avg Success Score</th>
                <th className="py-3 px-4 text-center">Avg Attendance</th>
                <th className="py-3 px-4 text-center">Avg CGPA</th>
                <th className="py-3 px-4 text-center">Placement Readiness</th>
                <th className="py-3 px-4 text-right">High Risk Cases</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {branches.map((b) => (
                <tr key={b.branch} className="hover:bg-slate-800/20">
                  <td className="py-3 px-4 font-bold text-white font-sans">{b.branch}</td>
                  <td className="py-3 px-4 text-center text-slate-300">{b.students_count}</td>
                  <td className="py-3 px-4 text-center text-cyan-400 font-bold">{b.average_success_score} / 100</td>
                  <td className="py-3 px-4 text-center text-slate-300">{b.average_attendance}%</td>
                  <td className="py-3 px-4 text-center text-slate-300">{b.average_cgpa}</td>
                  <td className="py-3 px-4 text-center text-indigo-400 font-semibold">{b.average_placement_readiness}%</td>
                  <td className="py-3 px-4 text-right font-sans">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                      {b.high_risk_count} Students
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
