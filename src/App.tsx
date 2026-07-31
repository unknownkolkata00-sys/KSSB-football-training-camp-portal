import React, { useState, useEffect } from 'react';
import { db, SEED_JERSEYS } from './utils/db';
import { 
  subscribeStudents, 
  subscribeMetrics, 
  subscribeFees, 
  subscribeTournaments, 
  subscribeInjuries, 
  subscribeNotifications, 
  subscribeEvaluations,
  subscribeGallery,
  subscribeJerseys,
  subscribeJerseyOrders,
  subscribeDeletedStudents,
  saveStudentToCloud,
  saveMetricToCloud,
  saveFeeToCloud,
  saveTournamentToCloud,
  saveInjuryToCloud,
  saveNotificationToCloud,
  saveEvaluationToCloud,
  saveGalleryImageToCloud,
  deleteGalleryImageFromCloud,
  deleteStudentFromCloud,
  deleteStudentFeesFromCloud,
  saveJerseyToCloud,
  deleteJerseyFromCloud,
  saveJerseyOrderToCloud,
  saveDeletedStudentToCloud,
  removeDeletedStudentFromCloud,
  deleteAllNotificationsFromCloud,
  clearAllDataExceptGalleryFromCloud,
  seedInitialCloudDataIfEmpty
} from './utils/firebase';
import { Student, PerformanceMetric, FeeStatus, Tournament, InjuryReport, NotificationLog, CoachEvaluation, GalleryImage, CampJersey, JerseyOrder, DeletedStudentRecord } from './types';
import DashboardOverview from './components/DashboardOverview';
import RosterManagement from './components/RosterManagement';
import PlayerPerformanceView from './components/PlayerPerformanceView';
import FeesTracker from './components/FeesTracker';
import TournamentScheduler from './components/TournamentScheduler';
import GalleryView from './components/GalleryView';
import InjuryTracker from './components/InjuryTracker';
import NotificationAutomator from './components/NotificationAutomator';
import CoachPerformance from './components/CoachPerformance';
import CoachPortal from './components/CoachPortal';
import StudentPortal from './components/StudentPortal';
import JerseyStoreManager from './components/JerseyStoreManager';
import DeletedStudentsView from './components/DeletedStudentsView';
import Login from './components/Login';
import AndroidAppModal from './components/AndroidAppModal';
import { downloadAttendanceReportCSV, downloadFeesReportCSV } from './utils/reports';
import { AnimatePresence, motion } from 'motion/react';
import kssbFcLogo from './assets/images/kssb_fc_official_logo.jpg';
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
  Smartphone,
  ArrowLeft,
  Camera,
  Shirt,
  ShoppingBag,
  UserX,
  Trash2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';


const AUTH_STORAGE_KEY = 'ftc_auth_session';

export default function App() {
  // Sync core databases
  const [students, setStudents] = useState<Student[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [fees, setFees] = useState<FeeStatus[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [injuries, setInjuries] = useState<InjuryReport[]>([]);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [evaluations, setEvaluations] = useState<CoachEvaluation[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [jerseys, setJerseys] = useState<CampJersey[]>([]);
  const [jerseyOrders, setJerseyOrders] = useState<JerseyOrder[]>([]);
  const [deletedStudents, setDeletedStudents] = useState<DeletedStudentRecord[]>([]);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);

  // Authentication & Role State with LocalStorage Persistence

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Boolean(parsed.isAuthenticated);
      }
    } catch (e) {
      console.error('Failed to parse auth session:', e);
    }
    return false;
  });

  const [role, setRole] = useState<'admin' | 'coach' | 'student'>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.role || 'admin';
      }
    } catch (e) {
      console.error('Failed to parse auth role:', e);
    }
    return 'admin';
  });

  const [loggedInStudentId, setLoggedInStudentId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.loggedInStudentId || '';
      }
    } catch (e) {
      console.error('Failed to parse loggedInStudentId:', e);
    }
    return '';
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [navigationHistory, setNavigationHistory] = useState<string[]>(['dashboard']);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAndroidModal, setShowAndroidModal] = useState(false);

  const selectTab = (tabId: string) => {
    if (tabId !== activeTab) {
      setNavigationHistory(prev => [...prev, activeTab]);
      setActiveTab(tabId);
    }
    setMobileMenuOpen(false);
  };

  const handleGoBack = () => {
    if (navigationHistory.length > 0) {
      const previous = navigationHistory[navigationHistory.length - 1];
      setNavigationHistory(prev => prev.slice(0, -1));
      setActiveTab(previous);
    } else {
      setActiveTab('dashboard');
    }
  };

  // Load baseline & Subscribe to real-time Firestore multi-handset updates
  useEffect(() => {
    // Ensure persistent storage indicator
    localStorage.setItem('kssbfc_persistent_store_active', 'true');

    // 1. Initial Local Backup Load
    const loadedStudents = db.getStudents();
    setStudents(loadedStudents);
    setMetrics(db.getMetrics());
    setFees(db.getFees());
    setTournaments(db.getTournaments());
    setInjuries(db.getInjuries());
    const initialNotis = db.getNotifications();
    setNotifications(initialNotis);
    const initialEvals = db.getEvaluations();
    setEvaluations(initialEvals);
    const initialGallery = db.getGallery();
    setGalleryImages(initialGallery);
    setJerseys(db.getJerseys());
    setJerseyOrders(db.getJerseyOrders());
    setDeletedStudents(db.getDeletedStudents());

    if (loadedStudents.length > 0 && !loggedInStudentId) {
      setLoggedInStudentId(loadedStudents[0].id);
    }


    // 2. Seed default cloud records if cloud database is empty
    seedInitialCloudDataIfEmpty(initialNotis, initialEvals, initialGallery, SEED_JERSEYS);

    // 3. Real-time Firebase Firestore subscriptions for Multi-Handset Live Sync
    const unsubStudents = subscribeStudents((cloudStudents) => {
      setStudents(cloudStudents);
      db.saveStudents(cloudStudents);
      if (cloudStudents.length > 0 && !loggedInStudentId) {
        setLoggedInStudentId(cloudStudents[0].id);
      }
    });

    const unsubMetrics = subscribeMetrics((cloudMetrics) => {
      setMetrics(cloudMetrics);
      db.saveMetrics(cloudMetrics);
    });

    const unsubFees = subscribeFees((cloudFees) => {
      setFees(cloudFees);
      db.saveFees(cloudFees);
    });

    const unsubTournaments = subscribeTournaments((cloudTournaments) => {
      setTournaments(cloudTournaments);
      db.saveTournaments(cloudTournaments);
    });

    const unsubInjuries = subscribeInjuries((cloudInjuries) => {
      setInjuries(cloudInjuries);
      db.saveInjuries(cloudInjuries);
    });

    const unsubNotifications = subscribeNotifications((cloudNotis) => {
      setNotifications(cloudNotis);
      db.saveNotifications(cloudNotis);
    });

    const unsubEvaluations = subscribeEvaluations((cloudEvals) => {
      setEvaluations(cloudEvals);
      db.saveEvaluations(cloudEvals);
    });

    const unsubGallery = subscribeGallery((cloudGallery) => {
      const localGallery = db.getGallery();
      const cloudIds = new Set(cloudGallery.map(g => g.id));
      
      // Push local photos to cloud if missing
      localGallery.forEach(localItem => {
        if (!cloudIds.has(localItem.id)) {
          saveGalleryImageToCloud(localItem);
        }
      });

      const map = new Map<string, GalleryImage>();
      cloudGallery.forEach(g => map.set(g.id, g));
      localGallery.forEach(g => {
        if (!map.has(g.id)) map.set(g.id, g);
      });

      const mergedList = Array.from(map.values()).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      setGalleryImages(mergedList);
      db.saveGallery(mergedList);
    });

    const unsubJerseys = subscribeJerseys((cloudJerseys) => {
      const localJerseys = db.getJerseys();
      const cloudIds = new Set(cloudJerseys.map(j => j.id));
      
      // Push local items to cloud if missing
      localJerseys.forEach(localItem => {
        if (!cloudIds.has(localItem.id)) {
          saveJerseyToCloud(localItem);
        }
      });

      const map = new Map<string, CampJersey>();
      cloudJerseys.forEach(j => map.set(j.id, j));
      localJerseys.forEach(j => {
        if (!map.has(j.id)) map.set(j.id, j);
      });

      const mergedList = Array.from(map.values());
      setJerseys(mergedList);
      db.saveJerseys(mergedList);
    });

    const unsubJerseyOrders = subscribeJerseyOrders((cloudOrders) => {
      setJerseyOrders(cloudOrders);
      db.saveJerseyOrders(cloudOrders);
    });

    const unsubDeletedStudents = subscribeDeletedStudents((cloudDeleted) => {
      setDeletedStudents(cloudDeleted);
      db.saveDeletedStudents(cloudDeleted);
    });

    return () => {
      unsubStudents();
      unsubMetrics();
      unsubFees();
      unsubTournaments();
      unsubInjuries();
      unsubNotifications();
      unsubEvaluations();
      unsubGallery();
      unsubJerseys();
      unsubJerseyOrders();
      unsubDeletedStudents();
    };

  }, []);

  // Sync state helpers with Dual Persistence (Local DB + Cloud Firestore)
  const handleAddStudent = (student: Omit<Student, 'id' | 'registrationDate'>) => {
    const { newStudent, newFees } = db.addStudent(student);
    setStudents(db.getStudents());
    setFees(db.getFees());
    // Sync to Cloud Firestore
    saveStudentToCloud(newStudent);
    newFees.forEach(f => saveFeeToCloud(f));
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    db.updateStudent(updatedStudent);
    setStudents(db.getStudents());
    saveStudentToCloud(updatedStudent);
  };

  const handleDeleteStudent = (studentId: string) => {
    const deletedRecord = db.deleteStudent(studentId);
    setStudents(db.getStudents());
    setFees(db.getFees());
    setMetrics(db.getMetrics());
    setDeletedStudents(db.getDeletedStudents());
    deleteStudentFromCloud(studentId);
    deleteStudentFeesFromCloud(studentId);
    if (deletedRecord) {
      saveDeletedStudentToCloud(deletedRecord);
    }
  };

  const handleRestoreStudent = (recordId: string) => {
    const restored = db.restoreDeletedStudent(recordId);
    if (restored) {
      setStudents(db.getStudents());
      setFees(db.getFees());
      setMetrics(db.getMetrics());
      setDeletedStudents(db.getDeletedStudents());
      saveStudentToCloud(restored.student);
      restored.feesHistory.forEach(f => saveFeeToCloud(f));
      removeDeletedStudentFromCloud(recordId);
    }
  };

  const handleDeleteAllNotifications = () => {
    db.clearAllNotifications();
    setNotifications([]);
    deleteAllNotificationsFromCloud();
  };

  const handleResetAllAppData = async () => {
    db.clearAllAppDataExceptGallery();
    setStudents([]);
    setDeletedStudents([]);
    setMetrics([]);
    setFees([]);
    setTournaments([]);
    setInjuries([]);
    setNotifications([]);
    setEvaluations([]);
    setJerseyOrders([]);
    await clearAllDataExceptGalleryFromCloud();
  };

  const handleAddMetric = (metric: Omit<PerformanceMetric, 'id'>) => {
    const newMetric = db.addMetric(metric);
    setMetrics(db.getMetrics());
    saveMetricToCloud(newMetric);
  };

  const handleUpdateFee = (updatedFee: FeeStatus) => {
    db.updateFee(updatedFee);
    setFees(db.getFees());
    saveFeeToCloud(updatedFee);
  };

  const handleAddTournament = (tournament: Omit<Tournament, 'id'>) => {
    const newTournament = db.addTournament(tournament);
    setTournaments(db.getTournaments());
    saveTournamentToCloud(newTournament);
  };

  const handleUpdateTournament = (updated: Tournament) => {
    db.updateTournament(updated);
    setTournaments(db.getTournaments());
    saveTournamentToCloud(updated);
  };

  const handleAddInjury = (injury: Omit<InjuryReport, 'id'>) => {
    const newInjury = db.addInjury(injury);
    setInjuries(db.getInjuries());
    saveInjuryToCloud(newInjury);
  };

  const handleUpdateInjury = (updated: InjuryReport) => {
    db.updateInjury(updated);
    setInjuries(db.getInjuries());
    saveInjuryToCloud(updated);
  };

  const handleAddNotification = (noti: Omit<NotificationLog, 'id' | 'timestamp' | 'status'>) => {
    const newNoti = db.addNotification(noti);
    setNotifications(db.getNotifications());
    saveNotificationToCloud(newNoti);
  };

  const handleMarkNotificationRead = (notificationId: string, studentId: string) => {
    db.markNotificationAsRead(notificationId, studentId);
    const updated = db.getNotifications();
    setNotifications(updated);
    const target = updated.find(n => n.id === notificationId);
    if (target) {
      saveNotificationToCloud(target);
    }
  };

  const handleMarkAllNotificationsRead = (studentId: string) => {
    db.markAllNotificationsAsRead(studentId);
    const updated = db.getNotifications();
    setNotifications(updated);
    updated.forEach(n => saveNotificationToCloud(n));
  };

  const handleAddEvaluation = (evalItem: Omit<CoachEvaluation, 'id' | 'date'>) => {
    const newEval = db.addEvaluation(evalItem);
    setEvaluations(db.getEvaluations());
    saveEvaluationToCloud(newEval);
  };

  const handleAddGalleryImage = (image: Omit<GalleryImage, 'id' | 'date'>) => {
    const newImg = db.addGalleryImage(image);
    setGalleryImages(db.getGallery());
    saveGalleryImageToCloud(newImg);
  };

  const handleDeleteGalleryImage = (id: string) => {
    db.deleteGalleryImage(id);
    setGalleryImages(db.getGallery());
    deleteGalleryImageFromCloud(id);
  };

  const handleAddJersey = (jersey: Omit<CampJersey, 'id' | 'createdAt'>) => {
    const newJersey = db.addJersey(jersey);
    setJerseys(db.getJerseys());
    saveJerseyToCloud(newJersey);
  };

  const handleUpdateJersey = (updated: CampJersey) => {
    db.updateJersey(updated);
    setJerseys(db.getJerseys());
    saveJerseyToCloud(updated);
  };

  const handleDeleteJersey = (id: string) => {
    db.deleteJersey(id);
    setJerseys(db.getJerseys());
    deleteJerseyFromCloud(id);
  };

  const handlePlaceJerseyOrder = (order: Omit<JerseyOrder, 'id' | 'orderDate'>) => {
    const newOrder = db.addJerseyOrder(order);
    setJerseyOrders(db.getJerseyOrders());
    saveJerseyOrderToCloud(newOrder);
  };

  const handleUpdateJerseyOrder = (updated: JerseyOrder) => {
    db.updateJerseyOrder(updated);
    setJerseyOrders(db.getJerseyOrders());
    saveJerseyOrderToCloud(updated);
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

  // Sidebar Items for Admin Mode
  const adminSidebarItems = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'roster', label: 'New Registration & Roster', icon: Users },
    { id: 'fees', label: 'Fees Record (Ledger)', icon: CreditCard },
    { id: 'store', label: 'Camp Jersey Store & Orders', icon: Shirt },
    { id: 'performance', label: 'Attendance & Reviews', icon: Target },
    { id: 'tournaments', label: 'Match Fixtures & Team Selection', icon: Trophy },
    { id: 'gallery', label: 'Photo Vault Gallery', icon: Camera },
    { id: 'notifications', label: 'Mobile App Push Alerts', icon: Send },
    { id: 'evaluations', label: 'Coach Evaluations', icon: Award },
    { id: 'deleted_history', label: 'Deleted Student History', icon: UserX }
  ];


  // Handle Sign Out / Log Out
  const handleLogOut = () => {
    setIsAuthenticated(false);
    setLoggedInStudentId('');
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear auth session:', e);
    }
  };

  if (!isAuthenticated) {
    return (
      <Login 
        students={students}
        onLoginSuccess={(newRole, student) => {
          setRole(newRole);
          setIsAuthenticated(true);
          const studentId = student ? student.id : '';
          if (studentId) {
            setLoggedInStudentId(studentId);
          }
          try {
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
              isAuthenticated: true,
              role: newRole,
              loggedInStudentId: studentId
            }));
          } catch (e) {
            console.error('Failed to save auth session:', e);
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
            <div className="w-11 h-11 rounded-xl bg-slate-950 shadow-md border-2 border-amber-400/80 overflow-hidden shrink-0">
              <img 
                src={kssbFcLogo || '/logo.jpg'} 
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  img.onerror = null;
                  img.src = '/logo.jpg';
                }}
                alt="KSSB FC Logo" 
                className="w-full h-full object-cover"
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
            <div className="space-y-1.5 pt-1">
              <button
                onClick={() => downloadAttendanceReportCSV(students, metrics)}
                className="w-full py-2 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-emerald-800/60"
                title="Download Attendance & Metrics CSV Report"
                id="sidebar-attendance-export-btn"
              >
                <FileDown size={13} className="text-emerald-400" />
                Attendance Report (CSV)
              </button>

              <button
                onClick={() => downloadFeesReportCSV(students, fees, 'July 2026')}
                className="w-full py-2 bg-amber-950/80 hover:bg-amber-900 text-amber-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-amber-800/60"
                title="Download Fees & Ledger CSV Report"
                id="sidebar-fees-export-btn"
              >
                <FileDown size={13} className="text-amber-400" />
                Fees Ledger Report (CSV)
              </button>

              <button
                onClick={triggerMasterExport}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                title="Export Master Database Packages (JSON)"
                id="master-export-btn"
              >
                <FileDown size={13} />
                Master JSON Package
              </button>

              <button
                onClick={() => setShowResetConfirmModal(true)}
                className="w-full py-2 bg-rose-950/70 hover:bg-rose-900 text-rose-300 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-rose-800/80 mt-1"
                title="Clear all previous records (Keep Gallery intact)"
                id="reset-all-data-btn"
              >
                <Trash2 size={13} className="text-rose-400" />
                Clear Data (Keep Gallery)
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Header Menu */}
      <header 
        className="md:hidden bg-slate-900 border-b border-slate-800 p-4 text-slate-100 flex items-center justify-between z-20 shrink-0 select-none"
        id="mobile-header"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-slate-950 border-2 border-amber-400/80 shadow-md overflow-hidden shrink-0">
            <img 
              src={kssbFcLogo || '/logo.jpg'} 
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                img.onerror = null;
                img.src = '/logo.jpg';
              }}
              alt="KSSB FC" 
              className="w-full h-full object-cover"
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
      <main className="flex-1 p-3 sm:p-5 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full min-w-0" id="main-content-viewport">
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
                {/* Back Navigation Header Bar */}
                {activeTab !== 'dashboard' && (
                  <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-3.5 px-5 rounded-2xl border border-slate-800 text-slate-100 shadow-md" id="admin-back-to-dashboard-bar">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={handleGoBack}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm border border-emerald-400/30"
                        id="back-to-previous-btn"
                      >
                        <ArrowLeft size={16} /> Back to Previous Screen
                      </button>
                      <button
                        onClick={() => selectTab('dashboard')}
                        className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                        id="back-to-dashboard-btn"
                      >
                        <LayoutDashboard size={14} className="text-emerald-400" /> Overview Dashboard
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                      <span>Active Module:</span>
                      <span className="px-2.5 py-1 bg-slate-800 text-yellow-400 font-bold rounded-lg text-[11px] uppercase tracking-wider border border-slate-700">
                        {activeTab.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                )}

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
                    onDeleteStudent={handleDeleteStudent}
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

                {activeTab === 'store' && (
                  <JerseyStoreManager
                    jerseys={jerseys}
                    orders={jerseyOrders}
                    students={students}
                    onAddJersey={handleAddJersey}
                    onUpdateJersey={handleUpdateJersey}
                    onDeleteJersey={handleDeleteJersey}
                    onUpdateOrder={handleUpdateJerseyOrder}
                  />
                )}

                {activeTab === 'tournaments' && (
                  <TournamentScheduler 

                    tournaments={tournaments}
                    students={students}
                    metrics={metrics}
                    userRole="admin"
                    onAddTournament={handleAddTournament}
                    onUpdateTournament={handleUpdateTournament}
                  />
                )}

                {activeTab === 'gallery' && (
                  <GalleryView 
                    galleryImages={galleryImages}
                    onAddImage={handleAddGalleryImage}
                    onDeleteImage={handleDeleteGalleryImage}
                    role="admin"
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
                    students={students}
                    onAddNotification={handleAddNotification}
                    onDeleteAllNotifications={handleDeleteAllNotifications}
                  />
                )}

                {activeTab === 'evaluations' && (
                  <CoachPerformance 
                    evaluations={evaluations}
                    onAddEvaluation={handleAddEvaluation}
                  />
                )}

                {activeTab === 'deleted_history' && (
                  <DeletedStudentsView 
                    deletedRecords={deletedStudents}
                    onRestoreStudent={handleRestoreStudent}
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
                tournaments={tournaments}
                galleryImages={galleryImages}
                onAddMetric={handleAddMetric}
                onUpdateTournament={handleUpdateTournament}
                onAddGalleryImage={handleAddGalleryImage}
                onDeleteGalleryImage={handleDeleteGalleryImage}
              />
            )}

            {/* 3. STUDENT LOGIN VIEW */}
            {role === 'student' && (
              <StudentPortal 
                students={students}
                metrics={metrics}
                fees={fees}
                tournaments={tournaments}
                notifications={notifications}
                galleryImages={galleryImages}
                jerseys={jerseys}
                orders={jerseyOrders}
                loggedInStudentId={loggedInStudentId}
                onSelectStudent={setLoggedInStudentId}
                onUpdateFee={handleUpdateFee}
                onPlaceOrder={handlePlaceJerseyOrder}
                onAddGalleryImage={handleAddGalleryImage}
                onDeleteGalleryImage={handleDeleteGalleryImage}
                onMarkAsRead={handleMarkNotificationRead}
                onMarkAllAsRead={handleMarkAllNotificationsRead}
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

      {/* Fresh Reset Data Modal (Keep Gallery) */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative border border-rose-100">
            <button 
              onClick={() => setShowResetConfirmModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl shrink-0">
                <Trash2 size={28} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">Clear Previous Data?</h3>
                <p className="text-xs text-gray-500">KSSB FC Fresh Application Setup</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-2xl text-xs text-rose-900 space-y-2">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle size={15} className="text-rose-600 shrink-0" />
                This will purge all previous test data:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] font-mono text-rose-800 pl-1">
                <li>Students & Payment Ledgers</li>
                <li>Jersey Orders</li>
                <li>Performance Drills & Attendance</li>
                <li>Fixtures, Injuries, Notifications, Evals</li>
                <li>Deleted Student History</li>
              </ul>
              <div className="pt-2 border-t border-rose-200/80 font-bold text-emerald-800 flex items-center gap-1">
                <CheckCircle size={14} className="text-emerald-600 shrink-0" />
                <span>Gallery photos and jersey catalog will NOT be deleted!</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleResetAllAppData();
                  setShowResetConfirmModal(false);
                }}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer"
              >
                <Trash2 size={14} />
                Yes, Clear All (Keep Gallery)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
