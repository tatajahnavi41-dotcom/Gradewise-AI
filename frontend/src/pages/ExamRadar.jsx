import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Radar,
  AlertTriangle,
  Calendar,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Gamepad2
} from 'lucide-react';

export default function ExamRadar({ onNavigate }) {
  const { user } = useAuth();
  const [radarData, setRadarData] = useState([]);
  const [loading, setLoading] = useState(true);

  const studentId = user?.student_id;

  useEffect(() => {
    async function loadRadar() {
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
          const res = await api.getExamRadar(targetId);
          setRadarData(res.radar || []);
        } else {
          setRadarData([]);
        }
      } catch (err) {
        console.error('Failed to load exam radar:', err);
      } finally {
        setLoading(false);
      }
    }
    loadRadar();
  }, [studentId]);

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Radar className="w-6 h-6 text-cyan-400" />
            <span>Next Exam Difficulty Radar</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Predictive syllabus difficulty mapped against your previous test results and topic weaknesses.
          </p>
        </div>

        <button
          onClick={() => onNavigate('learning-arena')}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md transition-colors"
        >
          <Gamepad2 className="w-4 h-4" />
          <span>Practice Weak Topics in Arena</span>
        </button>
      </div>

      {/* Intro info box */}
      <div className="glass-panel p-4 rounded-xl border border-indigo-500/30 text-xs text-slate-300 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white">How the Radar Works: </span>
          The vulnerability index combines official exam paper difficulty ratings with your individual marks in internal assignments to pinpoint the exact units requiring targeted revision before exam day.
        </div>
      </div>

      {/* Radar Cards Grid */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Calculating syllabus vulnerability...
          </div>
        ) : radarData.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs glass-panel rounded-2xl border border-slate-800">
            No upcoming examination schedules registered for your semester.
          </div>
        ) : (
          radarData.map((item, idx) => {
            const isHigh = item.threat_level === 'HIGH';
            const isMed = item.threat_level === 'MEDIUM';

            return (
              <div
                key={idx}
                className={`glass-panel p-5 rounded-2xl border transition-all ${
                  isHigh ? 'border-rose-500/40 bg-rose-950/10' : (isMed ? 'border-amber-500/30' : 'border-slate-800')
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-900 text-cyan-400 border border-slate-800 font-bold">
                        {item.subject_code}
                      </span>
                      <h3 className="text-base font-bold text-white">{item.subject_name}</h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>Exam Date: <strong className="text-slate-200">{item.exam_date}</strong></span>
                      <span>• Exam Difficulty: <strong className="text-amber-400 font-mono">{item.difficulty_index}/5.0</strong></span>
                    </p>
                  </div>

                  {/* Vulnerability Score Meter */}
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Vulnerability Threat</span>
                      <span className={`text-xl font-black font-mono ${isHigh ? 'text-rose-400' : (isMed ? 'text-amber-400' : 'text-emerald-400')}`}>
                        {item.vulnerability_score} <span className="text-xs">/ 100</span>
                      </span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono uppercase ${
                      isHigh ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse' : (isMed ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40')
                    }`}>
                      {item.threat_level} Threat
                    </span>
                  </div>
                </div>

                <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <p className="text-slate-300">
                      <span className="text-slate-400 font-medium">Recommended Revision Focus: </span>
                      <strong className="text-cyan-300">{item.recommended_focus}</strong>
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Your current internal coursework benchmark: {item.student_current_score}%
                    </p>
                  </div>

                  <button
                    onClick={() => onNavigate('learning-arena')}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 shrink-0"
                  >
                    <span>Start Revision Quiz</span>
                    <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
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
