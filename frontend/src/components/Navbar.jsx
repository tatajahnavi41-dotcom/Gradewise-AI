import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  GraduationCap, 
  LogOut, 
  Layers
} from 'lucide-react';

export default function Navbar({ onNavigate, currentPage, onOpenProfile }) {
  const { user, logout } = useAuth();

  const getRoleBadge = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return <span className="bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs px-2.5 py-0.5 rounded-full font-semibold">Administrator</span>;
      case 'faculty':
        return <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs px-2.5 py-0.5 rounded-full font-semibold">Faculty Mentor</span>;
      case 'student':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs px-2.5 py-0.5 rounded-full font-semibold">Student</span>;
      default:
        return null;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0c1224]/90 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div 
          onClick={() => {
            if (user?.role === 'admin') onNavigate('admin-dashboard');
            else if (user?.role === 'faculty') onNavigate('faculty-dashboard');
            else onNavigate('student-dashboard');
          }}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-[1.5px] shadow-lg shadow-indigo-500/20 group-hover:shadow-cyan-500/30 transition-all">
            <div className="w-full h-full bg-[#0a0f1d] rounded-[10px] flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent tracking-tight">
                CampusIQ
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-mono font-semibold">
                v1.0
              </span>
            </div>
            <p className="text-[10px] text-slate-400 tracking-wide hidden sm:block">
              AI Student Analytics & Success Platform
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          
          {/* Portal Switcher Button */}
          <button
            type="button"
            onClick={() => onNavigate('role-selection')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
            title="Choose workspace portal"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>Select Portal</span>
          </button>

          {/* Current User Badge & Controls */}
          {user && (
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
              <button
                type="button"
                onClick={onOpenProfile}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-800/80 transition-colors text-left cursor-pointer"
                title="Edit Profile & Password"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 p-[1.5px]">
                  <div className="w-full h-full bg-[#0a0f1d] rounded-full flex items-center justify-center font-bold text-white text-xs uppercase">
                    {user.name ? user.name.charAt(0) : 'U'}
                  </div>
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-semibold text-slate-200 leading-tight">{user.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {getRoleBadge(user.role)}
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={logout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-500/30 transition-colors cursor-pointer"
                title="Logout and return to Sign-In page"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
