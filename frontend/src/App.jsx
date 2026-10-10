import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProfileModal from './components/ProfileModal';

// Pages
import Login from './pages/Login';
import RoleSelection from './pages/RoleSelection';
import AdminDashboard from './pages/AdminDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import StudentDashboard from './pages/StudentDashboard';
import TaskMonitoring from './pages/TaskMonitoring';
import StudentExplorer from './pages/StudentExplorer';
import StudentProfile from './pages/StudentProfile';
import Leaderboard from './pages/Leaderboard';
import RiskIntelligence from './pages/RiskIntelligence';
import StudentSegmentation from './pages/StudentSegmentation';
import GrowthLeague from './pages/GrowthLeague';
import ExamRadar from './pages/ExamRadar';
import CareerMission from './pages/CareerMission';
import LearningArena from './pages/LearningArena';
import PersonalizedRoadmap from './pages/PersonalizedRoadmap';
import SmartMentorMatching from './pages/SmartMentorMatching';
import InterventionCentre from './pages/InterventionCentre';
import FeedbackCentre from './pages/FeedbackCentre';
import DataIntegration from './pages/DataIntegration';
import WhatIfSimulator from './pages/WhatIfSimulator';
import Reports from './pages/Reports';
import Materials from './pages/Materials';

export default function App() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('role-selection');
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [simulatorPreloadStudent, setSimulatorPreloadStudent] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Set default page on initial login
  useEffect(() => {
    if (user && !currentPage) {
      setCurrentPage('role-selection');
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b16] flex items-center justify-center text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium text-slate-400">Initializing CampusIQ Platform...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Login
        onLoginSuccess={() => {
          setCurrentPage('role-selection');
        }}
      />
    );
  }

  // If user is on Role Selection Screen, render it full view
  if (currentPage === 'role-selection') {
    return (
      <RoleSelection
        onSelectRole={(role) => {
          if (role === 'admin') setCurrentPage('admin-dashboard');
          else if (role === 'faculty') setCurrentPage('faculty-dashboard');
          else setCurrentPage('student-dashboard');
        }}
      />
    );
  }

  const handleSelectStudent = (id) => {
    setSelectedStudentId(id);
    setCurrentPage('student-profile');
  };

  const handleSimulateStudent = (studentObj) => {
    setSimulatorPreloadStudent(studentObj);
    setCurrentPage('what-if-simulator');
  };

  const renderActivePage = () => {
    switch (currentPage) {
      case 'admin-dashboard':
        return <AdminDashboard onNavigate={setCurrentPage} />;
      case 'faculty-dashboard':
        return <FacultyDashboard onNavigate={setCurrentPage} onSelectStudent={handleSelectStudent} />;
      case 'student-dashboard':
        return <StudentDashboard onNavigate={setCurrentPage} />;
      case 'tasks-monitor':
        return <TaskMonitoring onNavigate={setCurrentPage} />;
      case 'student-explorer':
        return <StudentExplorer onSelectStudent={handleSelectStudent} onNavigate={setCurrentPage} />;
      case 'student-profile':
        return (
          <StudentProfile
            studentId={selectedStudentId || user?.student_id}
            onBack={() => setCurrentPage(user.role === 'admin' ? 'admin-dashboard' : (user.role === 'faculty' ? 'faculty-dashboard' : 'student-dashboard'))}
            onNavigate={setCurrentPage}
            onSimulateStudent={handleSimulateStudent}
          />
        );
      case 'leaderboard':
        return <Leaderboard onSelectStudent={handleSelectStudent} onNavigate={setCurrentPage} />;
      case 'risk-intelligence':
        return <RiskIntelligence onSelectStudent={handleSelectStudent} onNavigate={setCurrentPage} />;
      case 'student-segmentation':
        return <StudentSegmentation onSelectStudent={handleSelectStudent} onNavigate={setCurrentPage} />;
      case 'growth-league':
        return <GrowthLeague onSelectStudent={handleSelectStudent} onNavigate={setCurrentPage} />;
      case 'exam-radar':
        return <ExamRadar onNavigate={setCurrentPage} />;
      case 'career-mission':
        return <CareerMission onNavigate={setCurrentPage} />;
      case 'learning-arena':
        return <LearningArena onNavigate={setCurrentPage} />;
      case 'roadmap':
        return <PersonalizedRoadmap onNavigate={setCurrentPage} />;
      case 'mentor-matching':
        return <SmartMentorMatching onNavigate={setCurrentPage} />;
      case 'intervention-centre':
        return <InterventionCentre onSelectStudent={handleSelectStudent} onNavigate={setCurrentPage} />;
      case 'feedback-centre':
        return <FeedbackCentre />;
      case 'data-integration':
        return <DataIntegration />;
      case 'what-if-simulator':
        return <WhatIfSimulator preloadedStudent={simulatorPreloadStudent} />;
      case 'reports':
        return <Reports />;
      case 'materials':
        return <Materials />;
      default:
        return user.role === 'admin' ? <AdminDashboard onNavigate={setCurrentPage} /> : (user.role === 'faculty' ? <FacultyDashboard onNavigate={setCurrentPage} onSelectStudent={handleSelectStudent} /> : <StudentDashboard onNavigate={setCurrentPage} />);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b16] text-slate-100 flex flex-col">
      <Navbar
        onNavigate={setCurrentPage}
        currentPage={currentPage}
        onOpenProfile={() => setShowProfileModal(true)}
      />
      
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          onOpenProfile={() => setShowProfileModal(true)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {renderActivePage()}
        </main>
      </div>

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onProfileUpdated={() => {}}
      />
    </div>
  );
}
