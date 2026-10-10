import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Sliders,
  TrendingUp,
  Award,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Info,
  CheckCircle2
} from 'lucide-react';

export default function WhatIfSimulator({ preloadedStudent }) {
  const { user } = useAuth();

  const [studentId, setStudentId] = useState(preloadedStudent?.student_id || user?.student_id || '');
  const [academicScore, setAcademicScore] = useState(preloadedStudent?.academic_score || 75);
  const [attendancePct, setAttendancePct] = useState(preloadedStudent?.attendance_pct || 85);
  const [lmsScore, setLmsScore] = useState(preloadedStudent?.lms_activity_score || 75);
  const [engagementScore, setEngagementScore] = useState(preloadedStudent?.engagement_score || 70);
  const [codingScore, setCodingScore] = useState(preloadedStudent?.coding_score || 70);
  const [aptitudeScore, setAptitudeScore] = useState(preloadedStudent?.aptitude_score || 70);
  const [mockScore, setMockScore] = useState(preloadedStudent?.mock_interview_score || 70);

  const [simulationResult, setSimulationResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function initStudent() {
      if (!studentId) {
        try {
          const res = await api.getStudents();
          if (res?.students && res.students.length > 0) {
            const first = res.students[0];
            setStudentId(first.student_id);
            setAcademicScore(first.academic_score || 75);
            setAttendancePct(first.attendance_pct || 85);
            setLmsScore(first.lms_activity_score || 75);
          }
        } catch (e) {}
      }
    }
    initStudent();
  }, []);

  // Run simulation whenever sliders move
  const triggerSimulation = async () => {
    setLoading(true);
    try {
      const res = await api.runSimulation({
        student_id: studentId,
        academic_score: parseFloat(academicScore),
        attendance_pct: parseFloat(attendancePct),
        lms_activity_score: parseFloat(lmsScore),
        engagement_score: parseFloat(engagementScore),
        coding_score: parseFloat(codingScore),
        aptitude_score: parseFloat(aptitudeScore),
        mock_interview_score: parseFloat(mockScore),
      });
      setSimulationResult(res);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      triggerSimulation();
    }, 150);
    return () => clearTimeout(timer);
  }, [studentId, academicScore, attendancePct, lmsScore, engagementScore, codingScore, aptitudeScore, mockScore]);

  const handleReset = () => {
    setAcademicScore(72);
    setAttendancePct(80);
    setLmsScore(70);
    setEngagementScore(75);
    setCodingScore(65);
    setAptitudeScore(68);
    setMockScore(70);
  };

  const delta = simulationResult?.score_delta || 0;

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sliders className="w-6 h-6 text-cyan-400" />
            <span>Interactive What-If Scenario Simulator</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Simulate hypothetical adjustments across coursework, attendance, coding assessments, and interview prep to discover your most impactful improvement levers.
          </p>
        </div>

        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Sliders</span>
        </button>
      </div>

      {/* Simulator Hero Results Display */}
      {simulationResult && (
        <div className="glass-panel-glow p-6 rounded-2xl border border-cyan-500/30 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
          
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Baseline Score</span>
            <p className="text-2xl font-black text-slate-300 font-mono mt-1">
              {simulationResult.baseline_score} <span className="text-xs">/ 100</span>
            </p>
            <span className="text-[10px] text-slate-400">Risk: {simulationResult.baseline_risk}</span>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-cyan-500/40">
            <span className="text-[10px] text-cyan-400 uppercase font-semibold">Simulated Score</span>
            <p className="text-2xl font-black text-cyan-300 font-mono mt-1">
              {simulationResult.simulated_score} <span className="text-xs">/ 100</span>
            </p>
            <span className={`text-[10px] font-bold ${
              simulationResult.simulated_risk === 'LOW' ? 'text-emerald-400' : (simulationResult.simulated_risk === 'MEDIUM' ? 'text-amber-400' : 'text-rose-400')
            }`}>
              Projected Band: {simulationResult.simulated_risk}
            </span>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Projected Score Delta</span>
            <p className={`text-2xl font-black font-mono mt-1 ${delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {delta > 0 ? `+${delta}` : delta} pts
            </p>
            <span className="text-[10px] text-slate-400">
              {delta >= 5 ? '🚀 Major positive surge' : (delta > 0 ? 'Positive gain' : 'Decline trajectory')}
            </span>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-indigo-500/30 text-left flex flex-col justify-center">
            <span className="text-[10px] text-indigo-300 uppercase font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Highest Impact Lever</span>
            </span>
            <p className="text-xs font-bold text-white mt-1">
              {simulationResult.top_driver}
            </p>
            <span className="text-[10px] text-slate-400 mt-0.5">Focusing here yields the biggest ROI.</span>
          </div>

        </div>
      )}

      {/* Main Sliders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Sliders Panel */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-slate-800 space-y-5">
          <h3 className="text-sm font-bold text-white">Adjust Component Values</h3>

          <div className="space-y-4">
            
            {/* Academic Marks */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Academic Marks (30% weight)</span>
                <span className="font-mono text-cyan-400 font-bold">{academicScore}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                value={academicScore}
                onChange={(e) => setAcademicScore(e.target.value)}
                className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Attendance */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Classroom Attendance (20% weight)</span>
                <span className={`font-mono font-bold ${attendancePct < 65 ? 'text-rose-400' : 'text-cyan-400'}`}>
                  {attendancePct}% {attendancePct < 65 && '⚠️ (Debarment threat)'}
                </span>
              </div>
              <input
                type="range"
                min="40"
                max="100"
                value={attendancePct}
                onChange={(e) => setAttendancePct(e.target.value)}
                className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-400"
              />
            </div>

            {/* LMS Activity */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">LMS Reading & Resource Logins (15% weight)</span>
                <span className="font-mono text-cyan-400 font-bold">{lmsScore}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={lmsScore}
                onChange={(e) => setLmsScore(e.target.value)}
                className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* Peer Engagement */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Campus & Lab Engagement (10% weight)</span>
                <span className="font-mono text-cyan-400 font-bold">{engagementScore}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={engagementScore}
                onChange={(e) => setEngagementScore(e.target.value)}
                className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-indigo-400"
              />
            </div>

            {/* Coding Score */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Coding Assessments (DSA benchmark)</span>
                <span className="font-mono text-emerald-400 font-bold">{codingScore}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={codingScore}
                onChange={(e) => setCodingScore(e.target.value)}
                className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
            </div>

            {/* Aptitude Score */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Quantitative & Logical Aptitude</span>
                <span className="font-mono text-emerald-400 font-bold">{aptitudeScore}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={aptitudeScore}
                onChange={(e) => setAptitudeScore(e.target.value)}
                className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
            </div>

            {/* Mock Interview */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">Mock Interview Presentation</span>
                <span className="font-mono text-emerald-400 font-bold">{mockScore}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                value={mockScore}
                onChange={(e) => setMockScore(e.target.value)}
                className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
            </div>

          </div>
        </div>

        {/* Right Explanations & Policy Notice */}
        <div className="lg:col-span-5 space-y-5">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>Simulated Component Contributions</span>
            </h3>

            {simulationResult?.breakdown && (
              <div className="space-y-2 text-xs">
                {Object.entries(simulationResult.breakdown).map(([k, v]) => (
                  <div key={k} className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-semibold capitalize text-slate-200">{k}</span>
                      <span className="text-[10px] text-slate-400 block">Weight: {Math.round(v.original_weight * 100)}%</span>
                    </div>
                    <span className="font-mono font-bold text-cyan-400">
                      +{v.weighted_contribution} pts
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            <strong className="text-slate-300">Safety & Integrity Guarantee: </strong>
            Calculations run in-memory inside the client session. The simulator does not modify official student grade sheets or attendance rolls in the university database.
          </div>
        </div>

      </div>

    </div>
  );
}
