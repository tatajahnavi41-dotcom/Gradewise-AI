import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Trophy,
  ShieldAlert,
  PieChart,
  Flame,
  LifeBuoy,
  MessageSquare,
  UploadCloud,
  Sliders,
  FileSpreadsheet,
  Compass,
  Radar,
  Gamepad2,
  BookOpen,
  UserCheck,
  ClipboardList,
  Layers,
  LogOut,
  User
} from 'lucide-react';

export default function Sidebar({ currentPage, onNavigate, onOpenProfile }) {
  const { user, logout } = useAuth();
  if (!user) return null;

  const role = user.role?.toLowerCase();

  const adminNav = [
    { id: 'admin-dashboard', label: 'Campus Intelligence', icon: LayoutDashboard },
    { id: 'tasks-monitor', label: 'Task Monitoring Engine', icon: ClipboardList },
    { id: 'student-explorer', label: 'Student Explorer', icon: Users },
    { id: 'leaderboard', label: 'Campus Leaderboard', icon: Trophy },
    { id: 'risk-intelligence', label: 'Risk Intelligence', icon: ShieldAlert },
    { id: 'student-segmentation', label: 'Student Segmentation', icon: PieChart },
    { id: 'growth-league', label: 'Campus Growth League', icon: Flame },
    { id: 'intervention-centre', label: 'Intervention Centre', icon: LifeBuoy },
    { id: 'data-integration', label: 'Data Integration', icon: UploadCloud },
    { id: 'what-if-simulator', label: 'What-If Simulator', icon: Sliders },
    { id: 'reports', label: 'Reports & Exports', icon: FileSpreadsheet },
  ];

  const facultyNav = [
    { id: 'faculty-dashboard', label: 'Faculty Dashboard', icon: LayoutDashboard },
    { id: 'tasks-monitor', label: 'Academic Assignments', icon: ClipboardList },
    { id: 'student-explorer', label: 'Department Students', icon: Users },
    { id: 'risk-intelligence', label: 'Risk Intelligence', icon: ShieldAlert },
    { id: 'student-segmentation', label: 'Student Segmentation', icon: PieChart },
    { id: 'mentor-matching', label: 'Smart Mentor Matching', icon: UserCheck },
    { id: 'intervention-centre', label: 'Intervention Centre', icon: LifeBuoy },
    { id: 'materials', label: 'Materials & Tests', icon: BookOpen },
    { id: 'what-if-simulator', label: 'What-If Simulator', icon: Sliders },
  ];

  const studentNav = [
    { id: 'student-dashboard', label: 'My Growth Journey', icon: LayoutDashboard },
    { id: 'tasks-monitor', label: 'My Tasks & Assignments', icon: ClipboardList },
    { id: 'exam-radar', label: 'Next Exam Radar', icon: Radar },
    { id: 'roadmap', label: 'Personalized Roadmap', icon: Compass },
    { id: 'career-mission', label: 'Career Mission Mode', icon: Trophy },
    { id: 'learning-arena', label: 'Gamified Arena', icon: Gamepad2 },
    { id: 'growth-league', label: 'Growth League', icon: Flame },
    { id: 'leaderboard', label: 'Student Leaderboard', icon: Users },
    { id: 'what-if-simulator', label: 'What-If Simulator', icon: Sliders },
    { id: 'feedback-centre', label: 'Submit Feedback', icon: MessageSquare },
  ];

  const navItems = role === 'admin' ? adminNav : (role === 'faculty' ? facultyNav : studentNav);

  return (
    <aside className="w-64 bg-[#0a0f1d] border-r border-slate-800/80 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-1">
        <div className="px-3 pb-3 mb-2 border-b border-slate-800/60 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {role === 'admin' ? 'Campus Administration' : (role === 'faculty' ? 'Faculty Mentorship' : 'Student Portal')}
          </p>
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600/30 to-cyan-600/20 text-cyan-300 border border-indigo-500/30 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/40'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Footer controls: Portal switcher & Account */}
      <div className="space-y-2 pt-4 border-t border-slate-800/60 mt-6">
        <button
          type="button"
          onClick={() => onNavigate('role-selection')}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
        >
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Switch Portal View</span>
        </button>

        <button
          type="button"
          onClick={onOpenProfile}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors cursor-pointer"
        >
          <User className="w-4 h-4 text-indigo-400" />
          <span>Edit Profile & Security</span>
        </button>
      </div>
    </aside>
  );
}
