import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Trophy,
  Target,
  CheckCircle2,
  Circle,
  Briefcase,
  Code2,
  Cpu,
  Database,
  Cloud,
  ArrowRight,
  Sparkles
} from 'lucide-react';

const CAREER_PATHWAYS = [
  {
    id: 'AI/ML Engineer',
    icon: Cpu,
    color: 'from-cyan-500 to-blue-600',
    title: 'AI/ML Engineer',
    desc: 'Designing deep learning pipelines, transformer models, computer vision & generative AI services.',
    skills: [
      { name: 'Python & PyTorch', key: 'coding_score', weight: 1.0 },
      { name: 'Linear Algebra & ML Math', key: 'academic_score', weight: 0.95 },
      { name: 'Data Preprocessing & Pandas', key: 'skills_score', weight: 1.0 },
      { name: 'Model Optimization & MLOps', key: 'placement_readiness_score', weight: 0.9 },
      { name: 'Transformer Architecture & NLP', key: 'skills_score', weight: 0.85 },
    ],
    relatedSubjects: ['Artificial Intelligence', 'Machine Learning', 'Linear Algebra & Probability'],
    missions: [
      { id: 1, tier: 'Tier 1 - Foundations', title: 'Complete Gradient Descent & Backprop Foundations', minScore: 50 },
      { id: 2, tier: 'Tier 2 - Systems', title: 'Train CNN image classifier with PyTorch & Data Augmentation', minScore: 65 },
      { id: 3, tier: 'Tier 3 - Advanced', title: 'Fine-tune open-weights HuggingFace LLM on campus datasets', minScore: 75 },
      { id: 4, tier: 'Tier 4 - Placement', title: 'Pass AI Technical Interview Coding Benchmark', minScore: 85 },
    ]
  },
  {
    id: 'Software Developer',
    icon: Code2,
    color: 'from-indigo-500 to-purple-600',
    title: 'Software Developer (SDE)',
    desc: 'Building scalable distributed systems, algorithms, microservices, and backend APIs.',
    skills: [
      { name: 'Data Structures & Algorithms', key: 'coding_score', weight: 1.0 },
      { name: 'Object-Oriented Programming (Java/C++)', key: 'academic_score', weight: 1.0 },
      { name: 'System Design & Architecture', key: 'placement_readiness_score', weight: 0.9 },
      { name: 'Database Indexing & SQL', key: 'skills_score', weight: 1.0 },
      { name: 'Git & CI/CD Pipelines', key: 'lms_activity_score', weight: 0.9 },
    ],
    relatedSubjects: ['Design & Analysis of Algorithms', 'Operating Systems', 'DBMS'],
    missions: [
      { id: 1, tier: 'Tier 1 - Foundations', title: 'Solve 50 Medium LeetCode DSA questions', minScore: 50 },
      { id: 2, tier: 'Tier 2 - Systems', title: 'Build Multi-Threaded Cache or REST API engine', minScore: 65 },
      { id: 3, tier: 'Tier 3 - Placement', title: 'Clear 3 timed Mock Technical Coding Rounds', minScore: 80 },
    ]
  },
  {
    id: 'Data Analyst',
    icon: Database,
    color: 'from-emerald-500 to-teal-600',
    title: 'Data Analyst & BI Specialist',
    desc: 'Transforming messy business data into executive KPI dashboards, SQL warehousing & predictive signals.',
    skills: [
      { name: 'Advanced SQL & Query Optimization', key: 'skills_score', weight: 1.0 },
      { name: 'Tableau / PowerBI Dashboarding', key: 'placement_readiness_score', weight: 0.95 },
      { name: 'Statistical Inference & Hypothesis Testing', key: 'academic_score', weight: 0.9 },
      { name: 'Python for Data Cleaning', key: 'coding_score', weight: 0.9 },
    ],
    relatedSubjects: ['Data Science Principles', 'Big Data Analytics', 'DBMS'],
    missions: [
      { id: 1, tier: 'Tier 1 - SQL', title: 'Complete Complex Window Functions & CTE benchmark', minScore: 50 },
      { id: 2, tier: 'Tier 2 - Dashboard', title: 'Publish interactive Higher-Education KPI dashboard', minScore: 65 },
      { id: 3, tier: 'Tier 3 - Placement', title: 'Case Study Presentation & Business Problem Solving', minScore: 80 },
    ]
  },
  {
    id: 'Cloud & DevOps Engineer',
    icon: Cloud,
    color: 'from-blue-500 to-cyan-600',
    title: 'Cloud & DevOps Engineer',
    desc: 'Automating continuous deployment pipelines, Kubernetes container orchestration, and cloud infrastructure.',
    skills: [
      { name: 'Linux Kernel & Shell Scripting', key: 'skills_score', weight: 1.0 },
      { name: 'Docker & Kubernetes Containers', key: 'coding_score', weight: 0.9 },
      { name: 'AWS / Cloud Architecture', key: 'placement_readiness_score', weight: 0.9 },
      { name: 'Terraform & Infrastructure-as-Code', key: 'lms_activity_score', weight: 0.85 },
    ],
    relatedSubjects: ['Operating Systems', 'Computer Networks', 'Cloud Computing'],
    missions: [
      { id: 1, tier: 'Tier 1 - Containers', title: 'Containerize Full-Stack App with Docker Compose', minScore: 50 },
      { id: 2, tier: 'Tier 2 - CI/CD', title: 'Configure GitHub Actions automated testing and deployment', minScore: 65 },
      { id: 3, tier: 'Tier 3 - Cloud', title: 'Deploy redundant Kubernetes cluster on AWS/GCP', minScore: 80 },
    ]
  }
];

export default function CareerMission({ onNavigate }) {
  const { user } = useAuth();
  const [selectedGoal, setSelectedGoal] = useState('AI/ML Engineer');
  const [studentGoal, setStudentGoal] = useState('AI/ML Engineer');
  const [studentProfile, setStudentProfile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);

  const studentId = user?.student_id;

  useEffect(() => {
    async function loadStudent() {
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
          setStudentProfile(res.student || null);
          if (res.student?.career_goal) {
            setSelectedGoal(res.student.career_goal);
            setStudentGoal(res.student.career_goal);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadStudent();
  }, [studentId]);

  const currentPathway = CAREER_PATHWAYS.find(p => p.id === selectedGoal) || CAREER_PATHWAYS[0];

  const getDynamicSkillPct = (skill) => {
    if (!studentProfile) return 0;
    const baseVal = studentProfile[skill.key] !== undefined && studentProfile[skill.key] !== null 
      ? studentProfile[skill.key] 
      : (studentProfile.skills_score || studentProfile.academic_score || 0);
    return Math.min(100, Math.max(0, Math.round(baseVal * (skill.weight || 1.0))));
  };

  const isMissionDone = (minScore) => {
    if (!studentProfile) return false;
    const score = studentProfile.success_score || studentProfile.academic_score || 0;
    return score >= minScore;
  };

  const handleSetMissionGoal = async () => {
    if (!studentId && !studentProfile?.student_id) return;
    setSaving(true);
    try {
      const target = studentId || studentProfile.student_id;
      await api.updateCareerMission(target, selectedGoal);
      setStudentGoal(selectedGoal);
      setSuccessMsg(`Career Mission set to "${selectedGoal}"! Your roadmaps have been updated.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <span>Career Mission Mode</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Turn your dream engineering career into trackable skill missions, project milestones, and placement checkpoints.
          </p>
        </div>

        {studentGoal !== selectedGoal && (
          <button
            onClick={handleSetMissionGoal}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:opacity-90 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>{saving ? 'Activating...' : `Activate "${selectedGoal}" as Goal`}</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Pathways Selection Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {CAREER_PATHWAYS.map((p) => {
          const Icon = p.icon;
          const isSelected = selectedGoal === p.id;
          const isCurrentActive = studentGoal === p.id;

          return (
            <div
              key={p.id}
              onClick={() => setSelectedGoal(p.id)}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                isSelected
                  ? 'glass-panel-glow border-cyan-400 shadow-xl'
                  : 'glass-panel border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${p.color} flex items-center justify-center text-white shadow-md`}>
                  <Icon className="w-4 h-4" />
                </div>
                {isCurrentActive && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    Active Mission
                  </span>
                )}
              </div>
              <h3 className="font-bold text-sm text-white mt-3">{p.title}</h3>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{p.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Main Pathway Detailed Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Required Skills & Readiness Progress */}
        <div className="lg:col-span-7 glass-panel p-5 rounded-2xl border border-slate-800 space-y-5">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-cyan-400" />
              <span>Skill Proficiency Radar: {currentPathway.title}</span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Comparison between your verified college benchmarks and corporate placement thresholds.
            </p>
          </div>

          <div className="space-y-3.5">
            {currentPathway.skills.map((sk, idx) => {
              const pct = getDynamicSkillPct(sk);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{sk.name}</span>
                    <span className="text-[11px] font-mono text-cyan-400">{pct}% Readiness</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        pct >= 75 ? 'bg-emerald-500' : (pct >= 60 ? 'bg-cyan-500' : 'bg-amber-500')
                      }`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-slate-800">
            <h4 className="text-xs font-semibold text-slate-300 mb-2">Relevant University Coursework:</h4>
            <div className="flex items-center gap-2 flex-wrap">
              {currentPathway.relatedSubjects.map((sub, i) => (
                <span key={i} className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 text-slate-300 border border-slate-800">
                  📚 {sub}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Milestone Missions Timeline */}
        <div className="lg:col-span-5 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-indigo-400" />
              <span>Mission Action Milestones</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">Dynamic Progress</span>
          </div>

          <div className="space-y-3">
            {currentPathway.missions.map((m) => {
              const done = isMissionDone(m.minScore);
              return (
                <div
                  key={m.id}
                  className={`p-3 rounded-xl border text-xs flex items-start gap-3 transition-colors ${
                    done ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200' : 'bg-slate-900/80 border-slate-800 text-slate-300'
                  }`}
                >
                  {done ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="text-[10px] font-mono uppercase font-bold text-slate-400 block">{m.tier}</span>
                    <p className="font-semibold text-white mt-0.5">{m.title}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigate('learning-arena')}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Practice Skill Questions in Arena</span>
              <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
