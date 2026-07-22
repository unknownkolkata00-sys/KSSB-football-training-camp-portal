import { Student, PerformanceMetric, FeeStatus, Tournament, InjuryReport, NotificationLog, CoachEvaluation } from '../types';

// Storage keys
const STORAGE_KEYS = {
  STUDENTS: 'ftc_students',
  METRICS: 'ftc_metrics',
  FEES: 'ftc_fees',
  TOURNAMENTS: 'ftc_tournaments',
  INJURIES: 'ftc_injuries',
  NOTIFICATIONS: 'ftc_notifications',
  COACH_EVALS: 'ftc_coach_evals'
};

// Initial Seed Data - Student list empty by default for Admin registration
const SEED_STUDENTS: Student[] = [];

const SEED_METRICS: PerformanceMetric[] = [];

const SEED_FEES: FeeStatus[] = [];

const SEED_TOURNAMENTS: Tournament[] = [];

const SEED_INJURIES: InjuryReport[] = [];

const SEED_NOTIFICATIONS: NotificationLog[] = [
  { id: 'n1', title: 'Practice Cancellation - Thunderstorms', message: 'Hi Parents, due to active severe weather warnings and lightning, tonight\'s training session (July 16) is CANCELLED. Stay safe! - Coach Abedemi Faniyan', recipientGroup: 'All Parents', timestamp: '2026-07-16 16:30', method: 'Both', status: 'Delivered' },
  { id: 'n2', title: 'Friendly Tournament Time Reschedule', message: 'Dear U14 Parents, our friendly departure time for July 12 has been shifted to 9:00 AM instead of 8:30 AM due to bus routing delays. See you at the hub! - Club Admin', recipientGroup: 'Under 14 Parents', timestamp: '2026-07-11 18:15', method: 'Email', status: 'Delivered' }
];

const SEED_COACH_EVALS: CoachEvaluation[] = [
  {
    id: 'e1',
    date: '2026-07-01',
    sessionsCount: 12,
    avgAttendance: 92,
    overallRating: 4.8,
    aiReport: '### KSSB FC Professional Coach Evaluation Report\n\n**Coach Profile:** Coach Abedemi Faniyan (Head Coach - U16)\n\n**Evaluation Period:** June 2026\n\n---\n\n### 📈 Quantitative Performance Summary\n- **Sessions Scheduled:** 12 sessions completed.\n- **Average Player Attendance:** 92.4% (Exemplary involvement)\n- **Student Growth Margin:** +14.2% average improvement across speed, agility, and stamina parameters.\n- **Overall Rating Score:** **4.8 / 5.0**\n\n### ⚽ Core Strengths\n1. **Technical Proficiency:** Drills focus highly on game-realistic transitions. Passing accuracy across the squad improved by an average of 1.1 points on our standard 1-10 rating scale.\n2. **Parent Engagement:** Implemented automated announcements effectively. Weather communication was proactive.\n3. **Safety Focus:** Quick action taken regarding Virgil van Dijk’s knee strain, coordinating directly with the team physiotherapist.\n\n### 💡 Recommendations & Action Plan\n- Introduce structured cool-down sessions of at least 15 minutes to minimize soft-tissue strain, especially with high-tempo training.\n- Incorporate tactical video analysis once per month for the defensive line to align offside trap movements.'
  }
];

// Database implementation wrapping LocalStorage with defaults
export function getLocalStorageData<T>(key: string, seed: T[]): T[] {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    console.error(`Error parsing localStorage for key ${key}`, e);
    return seed;
  }
}

export function saveLocalStorageData<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

export const db = {
  // Students
  getStudents: () => {
    const raw = getLocalStorageData<Student>(STORAGE_KEYS.STUDENTS, SEED_STUDENTS);
    // Remove any leftover legacy mock players (ids p1 to p8)
    const cleaned = raw.filter(s => !['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'].includes(s.id));
    if (cleaned.length !== raw.length) {
      saveLocalStorageData(STORAGE_KEYS.STUDENTS, cleaned);
    }
    return cleaned;
  },
  saveStudents: (data: Student[]) => saveLocalStorageData(STORAGE_KEYS.STUDENTS, data),
  addStudent: (student: Omit<Student, 'id' | 'registrationDate'>) => {
    const students = db.getStudents();
    const nextCount = students.length + 1;
    const autoRegNum = `KSSBFC${String(nextCount).padStart(4, '0')}/26-27`;
    
    const newStudent: Student = {
      ...student,
      registrationNumber: student.registrationNumber || autoRegNum,
      id: 'p' + nextCount + '_' + Date.now(),
      registrationDate: new Date().toISOString().split('T')[0],
    };
    db.saveStudents([...students, newStudent]);
    // Create baseline fees (Admission Fee: ₹350 and July Tuition Fee: ₹150)
    const currentMonth = "July 2026";
    const fees = db.getFees();
    db.saveFees([
      ...fees,
      {
        id: 'f_adm_' + Date.now(),
        studentId: newStudent.id,
        month: 'Admission Fee',
        amount: 350,
        status: 'Pending'
      },
      {
        id: 'f_mon_' + Date.now(),
        studentId: newStudent.id,
        month: currentMonth,
        amount: 150,
        status: 'Pending'
      }
    ]);
    return newStudent;
  },
  updateStudent: (updated: Student) => {
    const students = db.getStudents();
    db.saveStudents(students.map(s => s.id === updated.id ? updated : s));
  },

  // Metrics
  getMetrics: () => getLocalStorageData<PerformanceMetric>(STORAGE_KEYS.METRICS, SEED_METRICS),
  saveMetrics: (data: PerformanceMetric[]) => saveLocalStorageData(STORAGE_KEYS.METRICS, data),
  addMetric: (metric: Omit<PerformanceMetric, 'id'>) => {
    const metrics = db.getMetrics();
    const newMetric: PerformanceMetric = {
      ...metric,
      markedAt: metric.markedAt || Date.now(),
      id: 'm_' + Date.now()
    };
    db.saveMetrics([...metrics, newMetric]);
    return newMetric;
  },

  // Fees
  getFees: () => {
    const raw = getLocalStorageData<FeeStatus>(STORAGE_KEYS.FEES, SEED_FEES);
    const students = db.getStudents();
    const validStudentIds = new Set(students.map(s => s.id));
    const cleaned = raw.filter(f => validStudentIds.has(f.studentId));
    if (cleaned.length !== raw.length) {
      saveLocalStorageData(STORAGE_KEYS.FEES, cleaned);
    }
    return cleaned;
  },
  saveFees: (data: FeeStatus[]) => saveLocalStorageData(STORAGE_KEYS.FEES, data),
  updateFee: (updated: FeeStatus) => {
    const fees = db.getFees();
    db.saveFees(fees.map(f => f.id === updated.id ? updated : f));
  },
  addFeeRecord: (fee: Omit<FeeStatus, 'id'>) => {
    const fees = db.getFees();
    const newFee = { ...fee, id: 'f_' + Date.now() };
    db.saveFees([...fees, newFee]);
    return newFee;
  },

  // Tournaments
  getTournaments: () => getLocalStorageData<Tournament>(STORAGE_KEYS.TOURNAMENTS, SEED_TOURNAMENTS),
  saveTournaments: (data: Tournament[]) => saveLocalStorageData(STORAGE_KEYS.TOURNAMENTS, data),
  addTournament: (tournament: Omit<Tournament, 'id'>) => {
    const tournaments = db.getTournaments();
    const newTournament = { ...tournament, id: 't_' + Date.now() };
    db.saveTournaments([...tournaments, newTournament]);
    return newTournament;
  },
  updateTournament: (updated: Tournament) => {
    const tournaments = db.getTournaments();
    db.saveTournaments(tournaments.map(t => t.id === updated.id ? updated : t));
  },

  // Injury Reports
  getInjuries: () => getLocalStorageData<InjuryReport>(STORAGE_KEYS.INJURIES, SEED_INJURIES),
  saveInjuries: (data: InjuryReport[]) => saveLocalStorageData(STORAGE_KEYS.INJURIES, data),
  addInjury: (injury: Omit<InjuryReport, 'id'>) => {
    const injuries = db.getInjuries();
    const newInjury = { ...injury, id: 'i_' + Date.now() };
    db.saveInjuries([...injuries, newInjury]);
    return newInjury;
  },
  updateInjury: (updated: InjuryReport) => {
    const injuries = db.getInjuries();
    db.saveInjuries(injuries.map(i => i.id === updated.id ? updated : i));
  },

  // Notifications
  getNotifications: () => getLocalStorageData<NotificationLog>(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS),
  saveNotifications: (data: NotificationLog[]) => saveLocalStorageData(STORAGE_KEYS.NOTIFICATIONS, data),
  addNotification: (notification: Omit<NotificationLog, 'id' | 'timestamp' | 'status'>) => {
    const notifications = db.getNotifications();
    const dateStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const newNotification: NotificationLog = {
      ...notification,
      id: 'n_' + Date.now(),
      timestamp: dateStr,
      status: 'Delivered'
    };
    db.saveNotifications([newNotification, ...notifications]);
    return newNotification;
  },

  // Coach Evaluations
  getEvaluations: () => getLocalStorageData<CoachEvaluation>(STORAGE_KEYS.COACH_EVALS, SEED_COACH_EVALS),
  saveEvaluations: (data: CoachEvaluation[]) => saveLocalStorageData(STORAGE_KEYS.COACH_EVALS, data),
  addEvaluation: (evalItem: Omit<CoachEvaluation, 'id' | 'date'>) => {
    const evals = db.getEvaluations();
    const newEval: CoachEvaluation = {
      ...evalItem,
      id: 'e_' + Date.now(),
      date: new Date().toISOString().split('T')[0]
    };
    db.saveEvaluations([newEval, ...evals]);
    return newEval;
  }
};
