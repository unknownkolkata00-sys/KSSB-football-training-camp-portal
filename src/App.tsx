import React, { useState, useEffect } from 'react';
import { db } from './utils/db';
import { Student, PerformanceMetric, FeeStatus, Tournament, InjuryReport, NotificationLog, CoachEvaluation } from './types';
import DashboardOverview from './components/DashboardOverview';
import RosterManagement from './components/RosterManagement';
import PlayerPerformanceView from './components/PlayerPerformanceView';
import FeesTracker from './components/FeesTracker';
import TournamentScheduler from './components/TournamentScheduler';
import InjuryTracker from './components/InjuryTracker';
import NotificationAutomator from './components/NotificationAutomator';
import CoachPerformance from './components/CoachPerformance';
import CoachPortal from './components/CoachPortal';
import StudentPortal from './components/StudentPortal';
import Login from './components/Login';
import AndroidAppModal from './components/AndroidAppModal';
import { AnimatePresence, motion } from 'motion/react';
import kssbFcLogo from './assets/images/kssb_fc_logo_1784404534667.jpg';
import { 
  Users, 
  Activity, 
  Trophy, 
  CreditCard, 
  ShieldAlert, 
  Send, 
  Award, 
  LayoutDashboard, 
  FileDown, 
  ShieldCheck, 
  User, 
  Menu, 
  X,
  Target,
  Key,
  Check,
  LogOut,
  Smartphone
} from 'lucide-react';

export default function App() {
  // Sync core databases
  const [students, setStudents] = useState<Student[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [fees, setFees] = useState<FeeStatus[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [injuries, setInjuries] = useState<InjuryReport[]>([]);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [evaluations, setEvaluations] = useState<CoachEvaluation[]>([]);

  // Authentication & Role State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false); // Show login screen by default
  const [role, setRole] = useState<'admin' | 'coach' | 'student'>('admin');
  const [loggedInStudentId, setLoggedInStudentId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAndroidModal, setShowAndroidModal] = useState(false);

  // Load baseline on mount
  useEffect(() => {
    const loadedStudents = db.getStudents();
    setStudents(loadedStudents);
    setMetrics(db.getMetrics());
    setFees(db.getFees());
    setTournaments(db.getTournaments());
    setInjuries(db.getInjuries());
    setNotifications(db.getNotifications());
    setEvaluations(db.getEvaluations());

    if (loadedStudents.length > 0) {
      setLoggedInStudentId(loadedStudents[0].id);
    }
  }, []);

  // Sync state helpers
  const handleAddStudent = (student: Omit<Student, 'id' | 'registrationDate'>) => {
    db.addStudent(student);
    setStudents(db.getStudents());
    setFees(db.getFees()); // Reload fees as registration auto-generates ledger tuition
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    db.updateStudent(updatedStudent);
    setStudents(db.getStudents());
  };

  const handleAddMetric = (metric: Omit<PerformanceMetric, 'id'>) => {
    db.addMetric(metric);
    setMetrics(db.getMetrics());
  };

  const handleUpdateFee = (updatedFee: FeeStatus) => {
    db.updateFee(updatedFee);
    setFees(db.getFees());
  };

  const handleAddTournament = (tournament: Omit<Tournament, 'id'>) => {
    db.addTournament(tournament);
    setTournaments(db.getTournaments());
  };

  const handleUpdateTournament = (updated: Tournament) => {
    db.updateTournament(updated);
    setTournaments(db.getTournaments());
  };

  const handleAddInjury = (injury: Omit<InjuryReport, 'id'>) => {
    db.addInjury(injury);
    setInjuries(db.getInjuries());
  };

  const handleUpdateInjury = (updated: InjuryReport) => {
    db.updateInjury(updated);
    setInjuries(db.getInjuries());
  };

  const handleAddNotification = (noti: Omit<NotificationLog, 'id' | 'timestamp' | 'status'>) => {
    db.addNotification(noti);
    setNotifications(db.getNotifications());
  };

  const handleAddEvaluation = (evalItem: Omit<CoachEvaluation, 'id' | 'date'>) => {
    db.addEvaluation(evalItem);
    setEvaluations(db.getEvaluations());
  };

  // Secure Master Reporting Export (Admin Only)
  const triggerMasterExport = () => {
    if (role !== 'admin') return;

    const reportPayload = {
      reportCycle: 'July 2026 Monthly Summary',
      exportedAt: new Date().toISOString(),
      statisticsSummary: {
        totalRegisteredAthletes: students.length,
        activeCampers: students.filter(s => s.status === 'Active').length,
        ongoingInjuries: injuries.filter(i => i.status !== 'Recovered').length,
        totalTuitionsDue: fees.filter(f => f.month === 'July 2026').reduce((s, f) => s + f.amount, 0),
        totalTuitionsCollected: fees.filter(f => f.month === 'July 2026' && f.status === 'Paid').reduce((s, f) => s + f.amount, 0)
      },
      datasets: {
        athletes: students,
        historicalAthleticDrills: metrics,
        financialLedgers: fees,
        fixturesAndTournaments: tournaments,
        medicalReports: injuries,
        notificationsBroadcastHistory: notifications,
        coachEvaluationsHistory: evaluations
      }
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(reportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `KSSB_FC_Master_Report_July_2026.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Safe tab selection
  const selectTab = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  // Sidebar Items for Admin Mode
  const adminSidebarItems = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'roster', label: 'New Registration & Roster', icon: Users },
    { id: 'fees', label: 'Fees Record (Ledger)', icon: CreditCard },
    { id: 'performance', label: 'Attendance & Reviews', icon: Target },
    { id: 'notifications', label: 'Mobile Comms / SMS', icon: Send },
    { id: 'evaluations', label: 'Coach Evaluations', icon: Award }
  ];

  // Handle Sign Out / Log Out
  const handleLogOut = () => {
    setIsAuthenticated(false);
    setLoggedInStudentId('');
  };

  if (!isAuthenticated) {
    return (
      <Login 
        students={students}
        onLoginSuccess={(newRole, student) => {
          setRole(newRole);
          setIsAuthenticated(true);
          if (student) {
            setLoggedInStudentId(student.id);
          }
        }}
      />
    );
  }

  const activeStudentProfile = students.find(s => s.id === loggedInStudentId) || students[0];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-sans text-gray-800" id="ftc-app-viewport">
      
      {/* Sidebar - Desktop */}
      <aside 
        className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-100 border-r border-slate-800 shrink-0 select-none"
        id="sidebar-desktop"
      >
        {/* Portal Branding */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 p-0.5 shadow-md shadow-emerald-950/40 shrink-0">
              <img 
                src={kssbFcLogo} 
                alt="KSSB FC Logo" 
                className="w-full h-full object-cover rounded-full bg-slate-950"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-sm font-display font-extrabold tracking-tight text-white">KSSB FC</h1>
              <span className="text-[9px] font-mono font-bold text-yellow-400 uppercase tracking-widest block">Kadamtala Subhas Bhowmick FC</span>
            </div>
          </div>
        </div>

        {/* Current Logged In Role Status & Log Out */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/70 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
              {role === 'admin' && <><ShieldCheck size={14} /> Admin Access</>}
              {role === 'coach' && <><Trophy size={14} /> Head Coach</>}
              {role === 'student' && <><User size={14} /> Student Portal</>}
            </div>
            <button 
              onClick={handleLogOut}
              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer border border-amber-500/30"
              title="Sign Out to Login Screen"
            >
              <LogOut size={12} /> Sign Out
            </button>
          </div>
          <p className="text-[10px] text-slate-400 font-mono">
            {role === 'admin' && 'Full Administrative Rights'}
            {role === 'coach' && 'Coach Abedemi Faniyan'}
            {role === 'student' && (activeStudentProfile ? activeStudentProfile.name : 'Student Athlete')}
          </p>
        </div>

        {/* Tab Items Menu (Shown in Admin Mode Only) */}
        {role === 'admin' && (
          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
            {adminSidebarItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => selectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold tracking-wide cursor-pointer transition-all ${
                    activeTab === item.id 
                      ? 'bg-slate-800 text-white font-bold border-l-4 border-emerald-500 shadow-sm' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                  }`}
                >
                  <Icon size={16} className={activeTab === item.id ? 'text-emerald-500' : 'text-slate-400'} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        )}

        {/* Role Portal Summaries in Sidebar */}
        {role === 'coach' && (
          <div className="flex-1 p-4 text-xs text-slate-400 space-y-3">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                <Trophy size={14} /> Coach Operations
              </div>
              <p className="text-[11px]">Head Coach: Abedemi Faniyan</p>
              <p className="text-[10px] text-slate-500">Log Daily Attendance, Drills Performance, Review Match Squads & Pending Fees.</p>
            </div>
          </div>
        )}

        {role === 'student' && (
          <div className="flex-1 p-4 text-xs text-slate-400 space-y-3">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                <User size={14} /> Student Dashboard
              </div>
              <p className="text-[11px] font-bold text-slate-200">{activeStudentProfile?.name || 'Student Profile'}</p>
              <p className="text-[10px] text-slate-500">Reg: {activeStudentProfile?.registrationNumber || 'N/A'}</p>
            </div>
          </div>
        )}

        {/* Sidebar Footer with Export and Android App buttons */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <button
            onClick={() => setShowAndroidModal(true)}
            className="w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-emerald-400/30"
            title="Install Android App"
          >
            <Smartphone size={14} className="text-yellow-300" />
            Android App
          </button>

          {role === 'admin' && (
            <button
              onClick={triggerMasterExport}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-700"
              title="Export Master Database Packages"
              id="master-export-btn"
            >
              <FileDown size={14} />
              Export Camp Master Report
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Header Menu */}
      <header 
        className="md:hidden bg-slate-900 border-b border-slate-800 p-4 text-slate-100 flex items-center justify-between z-20 shrink-0 select-none"
        id="mobile-header"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 p-0.5 shrink-0">
            <img 
              src={kssbFcLogo} 
              alt="KSSB FC" 
              className="w-full h-full object-cover rounded-full bg-slate-950"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h1 className="text-xs font-display font-bold uppercase tracking-tight text-white">KSSB FC</h1>
            <span className="text-[9px] font-mono font-bold text-yellow-400 uppercase tracking-widest block leading-none">Subhas Bhowmick FC</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowAndroidModal(true)}
            className="px-2.5 py-1 bg-emerald-600/90 hover:bg-emerald-500 text-white rounded text-xs font-bold flex items-center gap-1 cursor-pointer shadow-sm border border-emerald-400/30"
          >
            <Smartphone size={12} className="text-yellow-300" /> Android App
          </button>

          <button 
            onClick={handleLogOut}
            className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded text-xs font-bold flex items-center gap-1 cursor-pointer border border-amber-500/30"
          >
            <LogOut size={12} /> Sign Out
          </button>
          
          {role === 'admin' && (
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1 text-slate-400 hover:text-white rounded cursor-pointer ml-1"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          )}
        </div>
      </header>

      {/* Mobile Drawer Menu Dropdown for Admin Navigation */}
      {mobileMenuOpen && role === 'admin' && (
        <div className="md:hidden fixed inset-x-0 top-[65px] bg-slate-950 text-slate-100 border-b border-slate-800 z-30 p-4 space-y-2 shadow-lg" id="mobile-menu-drawer">
          <nav className="space-y-1">
            {adminSidebarItems.map(item => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => selectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                    activeTab === item.id ? 'bg-slate-800 text-white font-bold' : 'text-slate-400'
                  }`}
                >
                  <Icon size={14} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Content Viewport */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full" id="main-content-viewport">
        <AnimatePresence mode="wait">
          <motion.div
            key={role + '_' + activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="h-full"
          >
            {/* 1. ADMIN LOGIN VIEW */}
            {role === 'admin' && (
              <>
                {activeTab === 'dashboard' && (
                  <DashboardOverview 
                    students={students}
                    metrics={metrics}
                    fees={fees}
                    setActiveTab={setActiveTab}
                  />
                )}

                {activeTab === 'roster' && (
                  <RosterManagement 
                    students={students}
                    metrics={metrics}
                    userRole={role}
                    onAddStudent={handleAddStudent}
                    onUpdateStudent={handleUpdateStudent}
                    onAddMetric={handleAddMetric}
                  />
                )}

                {activeTab === 'performance' && (
                  <PlayerPerformanceView 
                    students={students}
                    metrics={metrics}
                    role="admin"
                  />
                )}

                {activeTab === 'fees' && (
                  <FeesTracker 
                    students={students}
                    fees={fees}
                    onUpdateFee={handleUpdateFee}
                    role="admin"
                  />
                )}

                {activeTab === 'tournaments' && (
                  <TournamentScheduler 
                    tournaments={tournaments}
                    students={students}
                    userRole="admin"
                    onAddTournament={handleAddTournament}
                    onUpdateTournament={handleUpdateTournament}
                  />
                )}

                {activeTab === 'injuries' && (
                  <InjuryTracker 
                    students={students}
                    injuries={injuries}
                    onAddInjury={handleAddInjury}
                    onUpdateInjury={handleUpdateInjury}
                  />
                )}

                {activeTab === 'notifications' && (
                  <NotificationAutomator 
                    notifications={notifications}
                    onAddNotification={handleAddNotification}
                  />
                )}

                {activeTab === 'evaluations' && (
                  <CoachPerformance 
                    evaluations={evaluations}
                    onAddEvaluation={handleAddEvaluation}
                  />
                )}
              </>
            )}

            {/* 2. COACH LOGIN VIEW */}
            {role === 'coach' && (
              <CoachPortal 
                students={students}
                metrics={metrics}
                fees={fees}
                onAddMetric={handleAddMetric}
              />
            )}

            {/* 3. STUDENT LOGIN VIEW */}
            {role === 'student' && (
              <StudentPortal 
                students={students}
                metrics={metrics}
                fees={fees}
                tournaments={tournaments}
                loggedInStudentId={loggedInStudentId}
                onSelectStudent={setLoggedInStudentId}
                onUpdateFee={handleUpdateFee}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Android PWA / App Installation Modal */}
      <AndroidAppModal 
        isOpen={showAndroidModal} 
        onClose={() => setShowAndroidModal(false)} 
      />
    </div>
  );
}
