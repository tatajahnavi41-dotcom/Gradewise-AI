import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  GraduationCap, 
  Lock, 
  User, 
  Mail,
  Phone,
  Briefcase,
  BookOpen,
  Eye, 
  EyeOff, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  KeyRound,
  X,
  ShieldCheck,
  UserPlus,
  LogIn,
  Layers,
  Award,
  Compass
} from 'lucide-react';

export default function Login({ onLoginSuccess }) {
  const { login, handleSignupSuccess } = useAuth();
  
  // Auth Mode: 'signin' | 'signup'
  const [mode, setMode] = useState('signin');
  // Signup Role: 'student' | 'faculty'
  const [signupRole, setSignupRole] = useState('student');

  // Sign In Form States
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Student Sign Up Form States
  const [studentForm, setStudentForm] = useState({
    name: '',
    email: '',
    student_id: '',
    branch: 'AIML',
    year: 1,
    semester: 1,
    phone: '',
    career_goal: 'Software Engineer',
    password: '',
    confirmPassword: ''
  });

  // Faculty Sign Up Form States
  const [facultyForm, setFacultyForm] = useState({
    name: '',
    email: '',
    staff_id: '',
    department: 'AIML',
    designation: 'Assistant Professor',
    specialization: 'Artificial Intelligence & Machine Learning',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [signupSuccessMsg, setSignupSuccessMsg] = useState(null);

  // Forgot / Reset Password state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: request code, 2: enter code & new pwd
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState(null);
  const [forgotSuccess, setForgotSuccess] = useState(null);

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter your email/username and password.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const user = await login(username.trim(), password);
      if (onLoginSuccess) {
        onLoginSuccess(user);
      }
    } catch (err) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Student Signup Submit
  const handleStudentSignupSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!studentForm.name.trim() || !studentForm.email.trim() || !studentForm.student_id.trim() || !studentForm.password) {
      setError('Please complete all required fields for student registration.');
      return;
    }

    if (studentForm.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (studentForm.password !== studentForm.confirmPassword) {
      setError('Passwords do not match. Please verify your password confirmation.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: studentForm.name.trim(),
        email: studentForm.email.trim(),
        student_id: studentForm.student_id.trim().toUpperCase(),
        branch: studentForm.branch,
        year: parseInt(studentForm.year),
        semester: parseInt(studentForm.semester),
        phone: studentForm.phone.trim() || null,
        career_goal: studentForm.career_goal.trim() || 'Software Engineer',
        password: studentForm.password
      };

      const res = await api.signupStudent(payload);
      setSignupSuccessMsg('Student account successfully registered!');
      
      setTimeout(() => {
        if (handleSignupSuccess) {
          handleSignupSuccess(res);
        }
        if (onLoginSuccess) {
          onLoginSuccess(res.user);
        }
      }, 900);
    } catch (err) {
      setError(err.message || 'Student registration failed. Please check the details provided.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Faculty Signup Submit
  const handleFacultySignupSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!facultyForm.name.trim() || !facultyForm.email.trim() || !facultyForm.staff_id.trim() || !facultyForm.password) {
      setError('Please complete all required fields for faculty registration.');
      return;
    }

    if (facultyForm.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (facultyForm.password !== facultyForm.confirmPassword) {
      setError('Passwords do not match. Please verify your password confirmation.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: facultyForm.name.trim(),
        email: facultyForm.email.trim(),
        staff_id: facultyForm.staff_id.trim().toUpperCase(),
        department: facultyForm.department,
        designation: facultyForm.designation,
        specialization: facultyForm.specialization.trim() || null,
        phone: facultyForm.phone.trim() || null,
        password: facultyForm.password
      };

      const res = await api.signupFaculty(payload);
      setSignupSuccessMsg('Faculty account successfully registered!');
      
      setTimeout(() => {
        if (handleSignupSuccess) {
          handleSignupSuccess(res);
        }
        if (onLoginSuccess) {
          onLoginSuccess(res.user);
        }
      }, 900);
    } catch (err) {
      setError(err.message || 'Faculty registration failed. Please check the details provided.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Forgot Password Code Request
  const handleRequestResetCode = async (e) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) {
      setForgotError('Please enter your registered email or username.');
      return;
    }
    setForgotLoading(true);
    setForgotError(null);
    try {
      const res = await api.forgotPassword({ identifier: forgotIdentifier.trim() });
      setResetCode(res.reset_code || '');
      setForgotSuccess(`Reset code generated: ${res.reset_code}`);
      setForgotStep(2);
    } catch (err) {
      setForgotError(err.message || 'Unable to find account. Please check the identifier.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Handle Password Reset
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetCode.trim() || !newPassword) {
      setForgotError('Please enter the reset code and new password.');
      return;
    }
    if (newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters long.');
      return;
    }
    setForgotLoading(true);
    setForgotError(null);
    try {
      const res = await api.resetPassword({
        identifier: forgotIdentifier.trim(),
        reset_code: resetCode.trim(),
        new_password: newPassword
      });
      setForgotSuccess(res.message || 'Password reset successfully! You can now sign in.');
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep(1);
        setPassword(newPassword);
        setUsername(forgotIdentifier);
        setForgotSuccess(null);
        setMode('signin');
      }, 2000);
    } catch (err) {
      setForgotError(err.message || 'Password reset failed. Please check the code.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Quick fill helper for root admin
  const handleQuickAdmin = () => {
    setMode('signin');
    setUsername('admin@campusiq.edu');
    setPassword('Admin@123');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#070b16] text-slate-100 flex flex-col justify-center items-center relative overflow-hidden px-4 sm:px-6 py-10">
      
      {/* Background Cinematic Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-gradient-to-tr from-cyan-600/15 via-indigo-600/10 to-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className={`w-full z-10 transition-all duration-300 ${mode === 'signup' ? 'max-w-2xl' : 'max-w-md'}`}>
        
        {/* Header Hero */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-3 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI-Powered Student Analytics & Success Platform</span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-[1.5px] shadow-xl shadow-cyan-500/20">
              <div className="w-full h-full bg-[#0a0f1d] rounded-[14px] flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
              CampusIQ
            </h1>
          </div>

          <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
            {mode === 'signin' 
              ? 'Sign in to access your analytics, task monitoring, and performance insights.'
              : 'Create your academic profile to track academic progress and collaborate with faculty.'}
          </p>
        </div>

        {/* Clean Mode Switcher Tabs */}
        <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 mb-5 max-w-xs mx-auto">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setError(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'signin'
                ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition-all ${
              mode === 'signup'
                ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Sign Up</span>
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-[#0b1222]/90 backdrop-blur-xl p-6 sm:p-8 rounded-2xl border border-slate-700/80 shadow-2xl shadow-black/60 relative">
          
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {signupSuccessMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <span>{signupSuccessMsg} Logging in...</span>
            </div>
          )}

          {/* ================= MODE: SIGN IN ================= */}
          {mode === 'signin' && (
            <div>
              <div className="mb-5">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">Sign In to Your Account</h2>
                <p className="text-xs text-slate-400 mt-0.5">Enter your email or username to access your workspace.</p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Email or Username
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      placeholder="e.g. yourname@campusiq.edu"
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotModal(true);
                        setForgotIdentifier(username);
                        setForgotError(null);
                        setForgotSuccess(null);
                        setForgotStep(1);
                      }}
                      className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline transition-colors cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Enter your account password"
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 active:scale-[0.99] transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Admin quick access & Footer */}
              <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleQuickAdmin}
                  className="text-[11px] text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Admin Sign In</span>
                </button>
                <div className="text-[11px] text-slate-500">
                  <span>Don't have an account? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setError(null);
                    }}
                    className="text-cyan-400 hover:underline font-medium"
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= MODE: SIGN UP ================= */}
          {mode === 'signup' && (
            <div>
              {/* Persona Selector Tabs */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setSignupRole('student');
                    setError(null);
                  }}
                  className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                    signupRole === 'student'
                      ? 'bg-cyan-950/40 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${signupRole === 'student' ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'}`}>
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Student Account</h3>
                    <p className="text-[11px] opacity-75">Analytics & LMS Submissions</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSignupRole('faculty');
                    setError(null);
                  }}
                  className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                    signupRole === 'faculty'
                      ? 'bg-indigo-950/40 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${signupRole === 'faculty' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-400'}`}>
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-white">Faculty Account</h3>
                    <p className="text-[11px] opacity-75">Teaching, Tasks & Mentorship</p>
                  </div>
                </button>
              </div>

              {/* ---------------- STUDENT SIGN UP FORM ---------------- */}
              {signupRole === 'student' && (
                <form onSubmit={handleStudentSignupSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={studentForm.name}
                          onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                          placeholder="e.g. Alex Johnson"
                          className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Email Address *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={studentForm.email}
                          onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                          placeholder="e.g. alex@student.edu"
                          className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Student ID / Roll No *
                      </label>
                      <div className="relative">
                        <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={studentForm.student_id}
                          onChange={(e) => setStudentForm({ ...studentForm, student_id: e.target.value })}
                          placeholder="e.g. 2024CS001"
                          className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 uppercase focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Branch / Department *
                      </label>
                      <select
                        value={studentForm.branch}
                        onChange={(e) => setStudentForm({ ...studentForm, branch: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                      >
                        <option value="AIML">AIML (AI & Machine Learning)</option>
                        <option value="AIDS">AIDS (AI & Data Science)</option>
                        <option value="CSE">CSE (Computer Science)</option>
                        <option value="IT">IT (Information Tech)</option>
                        <option value="ECE">ECE (Electronics & Comm)</option>
                        <option value="EEE">EEE (Electrical)</option>
                        <option value="MECH">MECH (Mechanical)</option>
                        <option value="CIVIL">CIVIL (Civil Engg)</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Year
                        </label>
                        <select
                          value={studentForm.year}
                          onChange={(e) => setStudentForm({ ...studentForm, year: e.target.value })}
                          className="w-full px-2.5 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                        >
                          <option value={1}>1st Year</option>
                          <option value={2}>2nd Year</option>
                          <option value={3}>3rd Year</option>
                          <option value={4}>4th Year</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                          Semester
                        </label>
                        <select
                          value={studentForm.semester}
                          onChange={(e) => setStudentForm({ ...studentForm, semester: e.target.value })}
                          className="w-full px-2.5 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                            <option key={s} value={s}>Sem {s}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Phone (Optional)
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          value={studentForm.phone}
                          onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                          placeholder="+1 (555) 000-0000"
                          className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Career Goal / Aspiring Role
                      </label>
                      <div className="relative">
                        <Compass className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={studentForm.career_goal}
                          onChange={(e) => setStudentForm({ ...studentForm, career_goal: e.target.value })}
                          placeholder="e.g. AI Research Scientist, Full Stack Developer, Cloud Architect"
                          className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          required
                          value={studentForm.password}
                          onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                          placeholder="Min. 6 characters"
                          className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          required
                          value={studentForm.confirmPassword}
                          onChange={(e) => setStudentForm({ ...studentForm, confirmPassword: e.target.value })}
                          placeholder="Confirm your password"
                          className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-3 py-3 px-4 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 active:scale-[0.99] transition-all shadow-lg shadow-cyan-600/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <GraduationCap className="w-4 h-4" />
                        <span>Create Student Account</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* ---------------- FACULTY SIGN UP FORM ---------------- */}
              {signupRole === 'faculty' && (
                <form onSubmit={handleFacultySignupSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Full Name *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={facultyForm.name}
                          onChange={(e) => setFacultyForm({ ...facultyForm, name: e.target.value })}
                          placeholder="e.g. Dr. Sarah Jenkins"
                          className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Institutional Email *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={facultyForm.email}
                          onChange={(e) => setFacultyForm({ ...facultyForm, email: e.target.value })}
                          placeholder="e.g. sarah@faculty.edu"
                          className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Staff / Faculty ID *
                      </label>
                      <div className="relative">
                        <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={facultyForm.staff_id}
                          onChange={(e) => setFacultyForm({ ...facultyForm, staff_id: e.target.value })}
                          placeholder="e.g. FAC-AIML-01"
                          className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 uppercase focus:outline-none focus:border-indigo-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Department *
                      </label>
                      <select
                        value={facultyForm.department}
                        onChange={(e) => setFacultyForm({ ...facultyForm, department: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-400"
                      >
                        <option value="AIML">AIML (AI & Machine Learning)</option>
                        <option value="AIDS">AIDS (AI & Data Science)</option>
                        <option value="CSE">CSE (Computer Science)</option>
                        <option value="IT">IT (Information Tech)</option>
                        <option value="ECE">ECE (Electronics & Comm)</option>
                        <option value="EEE">EEE (Electrical)</option>
                        <option value="MECH">MECH (Mechanical)</option>
                        <option value="CIVIL">CIVIL (Civil Engg)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Designation *
                      </label>
                      <select
                        value={facultyForm.designation}
                        onChange={(e) => setFacultyForm({ ...facultyForm, designation: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-400"
                      >
                        <option value="Assistant Professor">Assistant Professor</option>
                        <option value="Associate Professor">Associate Professor</option>
                        <option value="Professor">Professor</option>
                        <option value="Head of Department">Head of Department (HOD)</option>
                        <option value="Senior Lecturer">Senior Lecturer</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Phone (Optional)
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          value={facultyForm.phone}
                          onChange={(e) => setFacultyForm({ ...facultyForm, phone: e.target.value })}
                          placeholder="+1 (555) 000-0000"
                          className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Subject Specialization / Research Area
                      </label>
                      <div className="relative">
                        <Award className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={facultyForm.specialization}
                          onChange={(e) => setFacultyForm({ ...facultyForm, specialization: e.target.value })}
                          placeholder="e.g. Deep Learning, Distributed Systems, Cloud Computing"
                          className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          required
                          value={facultyForm.password}
                          onChange={(e) => setFacultyForm({ ...facultyForm, password: e.target.value })}
                          placeholder="Min. 6 characters"
                          className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          required
                          value={facultyForm.confirmPassword}
                          onChange={(e) => setFacultyForm({ ...facultyForm, confirmPassword: e.target.value })}
                          placeholder="Confirm your password"
                          className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-3 py-3 px-4 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 active:scale-[0.99] transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Briefcase className="w-4 h-4" />
                        <span>Create Faculty Account</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Back to sign in link */}
              <div className="mt-5 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
                <span>Already have an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                  }}
                  className="text-cyan-400 hover:underline font-semibold"
                >
                  Sign In here
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Footnote */}
        <div className="mt-4 text-center text-[11px] text-slate-500 flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>CampusIQ Secure Authentication • Role-Based Access Control</span>
        </div>

      </div>

      {/* ================= FORGOT PASSWORD MODAL ================= */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1222] border border-slate-700 rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative animate-fadeIn">
            
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Reset Your Password</h3>
                <p className="text-xs text-slate-400">
                  {forgotStep === 1 ? 'Step 1 of 2: Generate reset verification code' : 'Step 2 of 2: Enter code & new password'}
                </p>
              </div>
            </div>

            {forgotError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleRequestResetCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Registered Email or Username
                  </label>
                  <input
                    type="text"
                    value={forgotIdentifier}
                    onChange={(e) => setForgotIdentifier(e.target.value)}
                    required
                    placeholder="e.g. yourname@campusiq.edu"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    A secure 6-character code will be generated to authorize your new password.
                  </p>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {forgotLoading ? 'Generating...' : 'Get Reset Code'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Reset Verification Code
                  </label>
                  <input
                    type="text"
                    value={resetCode}
                    onChange={(e) => setResetCode(e.target.value)}
                    required
                    placeholder="Enter 6-character code (e.g. A3F8B2)"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 font-mono tracking-widest focus:outline-none focus:border-cyan-400 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Enter new password (min. 6 characters)"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600 to-cyan-600 hover:opacity-95 text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {forgotLoading ? 'Updating Password...' : 'Save New Password'}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
