import React from 'react';
import { ArrowUpRight, ArrowDownRight, HelpCircle } from 'lucide-react';

export default function StatCard({ 
  title, 
  value, 
  subtext, 
  icon: Icon, 
  color = 'cyan', 
  trend = null, 
  tooltip = null,
  onClick = null
}) {
  const colorMap = {
    cyan: 'from-cyan-500/20 to-blue-600/10 text-cyan-400 border-cyan-500/30',
    indigo: 'from-indigo-500/20 to-purple-600/10 text-indigo-400 border-indigo-500/30',
    purple: 'from-purple-500/20 to-pink-600/10 text-purple-400 border-purple-500/30',
    emerald: 'from-emerald-500/20 to-teal-600/10 text-emerald-400 border-emerald-500/30',
    amber: 'from-amber-500/20 to-yellow-600/10 text-amber-400 border-amber-500/30',
    rose: 'from-rose-500/20 to-red-600/10 text-rose-400 border-rose-500/30',
  };

  const themeClass = colorMap[color] || colorMap.cyan;

  return (
    <div 
      onClick={onClick}
      className={`glass-panel p-5 rounded-2xl relative overflow-hidden transition-all duration-200 hover:border-slate-600/80 hover:shadow-xl ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <span>{title}</span>
            {tooltip && (
              <span title={tooltip} className="cursor-help">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-200" />
              </span>
            )}
          </div>
          <div className="mt-2 text-2xl font-bold text-white tracking-tight">
            {value}
          </div>
        </div>

        {Icon && (
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${themeClass} border flex items-center justify-center shadow-inner`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {(subtext || trend !== null) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {trend !== null && (
            <span className={`inline-flex items-center font-semibold ${trend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trend >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {trend > 0 ? `+${trend}` : trend}%
            </span>
          )}
          {subtext && <span className="text-slate-400">{subtext}</span>}
        </div>
      )}
    </div>
  );
}
