import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Shield, 
  BookOpen, 
  GraduationCap, 
  ArrowRight, 
  AlertTriangle, 
  Lock, 
  CheckCircle2, 
  LogOut, 
  Sparkles,
  UserCheck,
  Building2,
  Users,
  ClipboardList
} from 'lucide-react';

export default function RoleSelection({ onSelectRole }) {
  const { user, logout } = useAuth();
  const [loadingRole, setLoadingRole] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const roles = [
    {
      id: 'admin',
      title: 'Admin Portal',
      badge: 'Institution Control',
      icon: Shield,
      accent: 'from-purple-600 via-indigo-600 to-blue-600',
      borderAccent: 'hover:border-purple-400 group-hover:shadow-purple-500/20',
      iconBg: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      description: 'Manage student & faculty databases, monitor academic tasks, risk intelligence, and college-wide analytics.',
      highlights: ['Student & Faculty Management', 'Campus-Wide Task Monitor', 'AI Risk Reports & Analytics', 'User Access & Permissions']
    },
    {
      id: 'faculty',
      title: 'Faculty Portal',
      badge: 'Academic & Mentorship',
      icon: BookOpen,
      accent: 'from-blue-600 via-cyan-600 to-teal-600',
      borderAccent: 'hover:border-cyan-400 group-hover:shadow-cyan-500/20',
      iconBg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      description: 'Record student marks and attendance, create & grade assignments, manage mentees, and track risk alerts.',
      highlights: ['Marks & Attendance Entry', 'Create & Review Academic Tasks', 'Smart Mentor Matching', 'Remedial Intervention Plans']
    },
    {
      id: 'student',
      title: 'Student Portal',
      badge: 'Learning & Growth',
      icon: GraduationCap,
      accent: 'from-teal-600 via-emerald-600 to-cyan-600',
      borderAccent: 'hover:border-teal-400 group-hover:shadow-teal-500/20',
      iconBg: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
      description: 'Track your personal marks, grades, attendance, complete assignments, view AI study roadmaps, and growth streak.',
      highlights: ['Academic Results & Attendance', 'Submit Assigned Tasks', 'Exam Difficulty Radar', 'Personalized Learning Roadmap']
    }
  ];

  const handlePortalClick = async (targetRole) => {
    setErrorMsg(null);
    setLoadingRole(targetRole);

    try {
      // Backend role verification check
      await api.verifyRole(targetRole);
      onSelectRole(targetRole);
    } catch (err) {
      setErrorMsg(err.message || `Access Denied: Your account is registered as '${user?.role?.toUpperCase()}'. You cannot access the ${targetRole.toUpperCase()} portal.`);
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b16] text-slate-100 flex flex-col justify-center items-center relative overflow-hidden px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Background glow effects */}
      <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/3 right-1/4 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-5xl w-full z-10">
        
        {/* Top User Greeting & Status */}
        <div className="flex flex-col sm:flex-row items-center justify-between bg-slate-900/70 border border-slate-800 backdrop-blur-md rounded-2xl p-4 sm:p-5 mb-8 shadow-xl">
          <div className="flex items-center gap-3.5 mb-3 sm:mb-0">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-[1.5px]">
              <div className="w-full h-full bg-[#0a0f1d] rounded-[10px] flex items-center justify-center font-bold text-white uppercase text-sm">
                {user?.name ? user.name.charAt(0) : 'U'}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white">{user?.name || 'Authenticated User'}</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-cyan-500/15 border border-cyan-500/30 text-cyan-300">
                  {user?.role}
                </span>
              </div>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-[11px] text-slate-400 block">Session Authenticated</span>
              <span className="text-xs font-medium text-emerald-400 flex items-center gap-1 justify-end">
                <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Portal Access
              </span>
            </div>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Switch Account</span>
            </button>
          </div>
        </div>

        {/* Title Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-3">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Role-Based Access Verification</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Select Your Workspace Portal
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            Choose the portal corresponding to your role. Your identity and permissions will be verified by the security engine before granting access.
          </p>
        </div>

        {/* Security / Error Notification Banner */}
        {errorMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs sm:text-sm flex items-start gap-3 shadow-lg animate-fadeIn">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold text-rose-300 block mb-0.5">Role Authorization Warning</span>
              <span>{errorMsg}</span>
            </div>
          </div>
        )}

        {/* 3 Interactive Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {roles.map((r) => {
            const Icon = r.icon;
            const isUserActualRole = user?.role?.toLowerCase() === r.id;
            const isLoading = loadingRole === r.id;

            return (
              <div
                key={r.id}
                className={`group relative bg-[#0b1222]/90 backdrop-blur-xl rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xl ${
                  isUserActualRole
                    ? 'border-indigo-500/50 shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                    : 'border-slate-800 hover:border-slate-700 opacity-90 hover:opacity-100'
                }`}
              >
                {/* Top Accent Line */}
                <div className={`h-1.5 w-full bg-gradient-to-r ${r.accent}`}></div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${r.iconBg}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    {isUserActualRole ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                        <CheckCircle2 className="w-3 h-3" /> Your Role
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                        {r.badge}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-300 transition-colors">
                    {r.title}
                  </h3>

                  <p className="text-xs text-slate-400 leading-relaxed mb-5">
                    {r.description}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                      Key Capabilities:
                    </span>
                    {r.highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div>
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 pt-0 mt-4">
                  <button
                    type="button"
                    onClick={() => handlePortalClick(r.id)}
                    disabled={isLoading}
                    className={`w-full py-3 px-4 rounded-xl font-semibold text-xs text-white transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer ${
                      isUserActualRole
                        ? `bg-gradient-to-r ${r.accent} hover:opacity-95 shadow-indigo-600/20`
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                    }`}
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span>Enter {r.title}</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                </div>

              </div>
            );
          })}
        </div>

        {/* Security Note Footer */}
        <div className="mt-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>Role verification is enforced on both frontend and backend APIs. Cross-role access is strictly blocked.</span>
        </div>

      </div>

    </div>
  );
}
