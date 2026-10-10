import React from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

export default function ScoreBreakdownModal({ isOpen, onClose, scoreBreakdown, studentName = 'Student' }) {
  if (!isOpen || !scoreBreakdown) return null;

  const components = scoreBreakdown.components || {};

  const componentLabels = {
    academics: { name: 'Academics & Subject Marks', weight: '30%', desc: 'Internal test results, midterm exams & CGPA' },
    attendance: { name: 'Classroom Attendance', weight: '20%', desc: 'Official lecture & tutorial attendance percentage' },
    lms: { name: 'LMS Activity & Resources', weight: '15%', desc: 'Courseware logins, reading hours & quiz downloads' },
    engagement: { name: 'Campus & Peer Engagement', weight: '10%', desc: 'Lab work completion, forum discussions & peer activities' },
    placement: { name: 'Placement Readiness', weight: '15%', desc: 'Coding tests, quantitative aptitude & mock interviews' },
    skills: { name: 'Practical Technical Skills', weight: '10%', desc: 'Verified programming languages & tool proficiencies' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#111827] border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl overflow-hidden relative">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Explainable Student Success Score</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono">
                {scoreBreakdown.success_score} / 100
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Transparent holistic scoring audit for <span className="text-slate-200 font-semibold">{studentName}</span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Provisional alert if applicable */}
        {scoreBreakdown.is_provisional && (
          <div className="my-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2.5 text-xs text-amber-200">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-semibold">Provisional Score Notice: </span>
              {scoreBreakdown.missing_indicators?.length > 0 
                ? `Weights renormalized because indicator(s) [${scoreBreakdown.missing_indicators.join(', ')}] are not yet uploaded.`
                : 'Provisional heuristic based on available indicators.'}
            </div>
          </div>
        )}

        {/* Components Table */}
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-12 text-[11px] font-semibold text-slate-400 px-3 uppercase tracking-wider">
            <div className="col-span-5">Component</div>
            <div className="col-span-2 text-center">Score</div>
            <div className="col-span-2 text-center">Weight</div>
            <div className="col-span-3 text-right">Contribution</div>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {Object.entries(components).map(([key, data]) => {
              const meta = componentLabels[key] || { name: key, weight: 'N/A', desc: '' };
              const isMissing = data.is_missing;

              return (
                <div 
                  key={key} 
                  className={`grid grid-cols-12 items-center p-3 rounded-xl border text-xs transition-colors ${
                    isMissing 
                      ? 'bg-slate-900/30 border-slate-800/40 text-slate-500' 
                      : 'bg-slate-900/70 border-slate-800 text-slate-200'
                  }`}
                >
                  <div className="col-span-5">
                    <p className="font-semibold text-white">{meta.name}</p>
                    <p className="text-[10px] text-slate-400">{meta.desc}</p>
                  </div>
                  <div className="col-span-2 text-center font-mono font-semibold">
                    {isMissing ? (
                      <span className="text-amber-400/80 italic text-[11px]">Pending</span>
                    ) : (
                      <span className="text-cyan-400">{data.score}</span>
                    )}
                  </div>
                  <div className="col-span-2 text-center font-mono text-slate-400">
                    {Math.round((data.effective_weight || 0) * 100)}%
                  </div>
                  <div className="col-span-3 text-right font-mono font-bold text-emerald-400">
                    +{data.weighted_contribution?.toFixed(2)} pts
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Formula Footer */}
        <div className="mt-5 p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-[11px] text-slate-400">
          <p className="font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            Standard Formula
          </p>
          <code className="text-[10px] text-cyan-300 font-mono block bg-slate-900 px-2 py-1 rounded">
            Success Score = (0.30 × Academics) + (0.20 × Attendance) + (0.15 × LMS) + (0.10 × Engagement) + (0.15 × Placement) + (0.10 × Skills)
          </code>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Close Breakdown
          </button>
        </div>

      </div>
    </div>
  );
}
