import { DeletedStudentRecord, Student, PerformanceMetric, FeeStatus, Tournament, InjuryReport, NotificationLog, CoachEvaluation, GalleryImage, CampJersey, JerseyOrder } from '../types';

// Storage keys
const STORAGE_KEYS = {
  STUDENTS: 'ftc_students',
  DELETED_STUDENTS: 'ftc_deleted_students',
  METRICS: 'ftc_metrics',
  FEES: 'ftc_fees',
  TOURNAMENTS: 'ftc_tournaments',
  INJURIES: 'ftc_injuries',
  NOTIFICATIONS: 'ftc_notifications',
  COACH_EVALS: 'ftc_coach_evals',
  GALLERY: 'ftc_gallery',
  JERSEYS: 'ftc_jerseys',
  JERSEY_ORDERS: 'ftc_jersey_orders'
};

// Initial Seed Data - Student list empty by default for Admin registration
const SEED_STUDENTS: Student[] = [];

const SEED_DELETED_STUDENTS: DeletedStudentRecord[] = [];

const SEED_METRICS: PerformanceMetric[] = [];

const SEED_FEES: FeeStatus[] = [];

const SEED_TOURNAMENTS: Tournament[] = [];

const SEED_INJURIES: InjuryReport[] = [];

export const SEED_JERSEYS: CampJersey[] = [
  {
    id: 'j1',
    name: 'KSSB FC Official Camp Jersey 2026',
    description: 'Official Kadamtala Subhas Bhowmick FC high-performance breathable football kit with club crest.',
    imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1000&q=80',
    price: 550,
    availableSizes: ['6yrs', '8yrs', '10yrs', '12yrs', '14yrs', '15yrs', '16yrs'],
    isAvailable: true,
    createdAt: '2026-07-01'
  }
];

const SEED_JERSEY_ORDERS: JerseyOrder[] = [];

const SEED_NOTIFICATIONS: NotificationLog[] = [];

const SEED_COACH_EVALS: CoachEvaluation[] = [];

const SEED_GALLERY: GalleryImage[] = [
  {
    id: 'g1',
    title: 'KSSB FC Youth League Victory',
    category: 'Matches',
    imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
    date: '2026-07-10',
    uploadedBy: 'Admin',
    caption: 'Celebration after securing 3 points in the U-16 Kolkata Zonal Championship.'
  },
  {
    id: 'g2',
    title: 'Morning Tactical Drills & Agility Session',
    category: 'Training',
    imageUrl: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1200&q=80',
    date: '2026-07-15',
    uploadedBy: 'Admin',
    caption: 'High-intensity cone shuttle and passing combination drills led by Head Coach Abedemi.'
  },
  {
    id: 'g3',
    title: 'Annual Boot & Jersey Distribution Ceremony',
    category: 'Events',
    imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
    date: '2026-07-01',
    uploadedBy: 'Admin',
    caption: 'KSSB FC management presenting official club kits to enrolled student athletes.'
  },
  {
    id: 'g4',
    title: 'Goalkeeping & Defensive Line Masterclass',
    category: 'Training',
    imageUrl: 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1200&q=80',
    date: '2026-07-20',
    uploadedBy: 'Admin',
    caption: 'Specialized shot-stopping, cross claims, and 1v1 positioning drills with senior coaches.'
  },
  {
    id: 'g5',
    title: 'U-17 Academy Championship Trophy Presentation',
    category: 'Celebrations',
    imageUrl: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1200&q=80',
    date: '2026-07-25',
    uploadedBy: 'Admin',
    caption: 'Kadamtala Subhas Bhowmick Football Camp lifting the regional academy championship shield.'
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
  // Deleted Students Archive
  getDeletedStudents: () => getLocalStorageData<DeletedStudentRecord>(STORAGE_KEYS.DELETED_STUDENTS, SEED_DELETED_STUDENTS),
  saveDeletedStudents: (data: DeletedStudentRecord[]) => saveLocalStorageData(STORAGE_KEYS.DELETED_STUDENTS, data),
  
  getNextRegistrationNumber: (): string => {
    const students = db.getStudents();
    const deleted = db.getDeletedStudents();
    const allRegs = [
      ...students.map(s => s.registrationNumber),
      ...deleted.map(d => d.student.registrationNumber)
    ];

    let maxNum = 0;
    allRegs.forEach(reg => {
      if (reg) {
        const match = reg.match(/KSSBFC(\d+)\//i);
        if (match && match[1]) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    });

    const totalRegistered = students.length + deleted.length;
    const nextSeq = Math.max(maxNum + 1, totalRegistered + 1);
    return `KSSBFC${String(nextSeq).padStart(4, '0')}/26-27`;
  },

  checkDuplicateStudent: (data: { aadharNumber?: string; mobileNo?: string; name?: string; fatherName?: string }) => {
    const students = db.getStudents();
    const deleted = db.getDeletedStudents();
    const allStudents = [...students, ...deleted.map(d => d.student)];

    const cleanAadhar = data.aadharNumber?.replace(/\s+/g, '').trim();
    const cleanMobile = data.mobileNo?.replace(/\D/g, '').trim();
    const cleanName = data.name?.trim().toLowerCase();
    const cleanFatherName = data.fatherName?.trim().toLowerCase();

    for (const existing of allStudents) {
      // 1. Aadhar check
      if (cleanAadhar && existing.aadharNumber) {
        const existingAadhar = existing.aadharNumber.replace(/\s+/g, '').trim();
        if (existingAadhar === cleanAadhar) {
          return `Duplicate Entry Blocked: A player with Aadhar No. '${data.aadharNumber}' is already registered (${existing.name}, Reg No: ${existing.registrationNumber}).`;
        }
      }

      // 2. Name + Mobile check
      if (cleanName && cleanMobile) {
        const existingName = existing.name?.trim().toLowerCase();
        const existingMobile = existing.mobileNo?.replace(/\D/g, '').trim();
        if (existingName === cleanName && existingMobile === cleanMobile) {
          return `Duplicate Entry Blocked: Student '${existing.name}' with mobile '${existing.mobileNo}' is already registered (Reg No: ${existing.registrationNumber}).`;
        }
      }

      // 3. Name + Father Name check
      if (cleanName && cleanFatherName) {
        const existingName = existing.name?.trim().toLowerCase();
        const existingFather = existing.fatherName?.trim().toLowerCase();
        if (existingName === cleanName && existingFather === cleanFatherName) {
          return `Duplicate Entry Blocked: Student '${existing.name}' (Father: ${existing.fatherName}) is already registered (Reg No: ${existing.registrationNumber}).`;
        }
      }
    }

    return null;
  },

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
    const autoRegNum = db.getNextRegistrationNumber();
    const totalCount = students.length + db.getDeletedStudents().length + 1;
    
    const newStudent: Student = {
      ...student,
      registrationNumber: autoRegNum,
      id: 'p' + totalCount + '_' + Date.now(),
      registrationDate: new Date().toISOString().split('T')[0],
    };
    db.saveStudents([...students, newStudent]);
    // Create baseline fees (Registration Fee: Free for first 15 students under Inaugural Offer, otherwise ₹350)
    const currentMonth = "July 2026";
    const fees = db.getFees();
    const isFirst15 = (students.length + db.getDeletedStudents().length) < 15;
    const todayStr = new Date().toISOString().split('T')[0];
    
    const f1: FeeStatus = {
      id: 'f_reg_' + Date.now(),
      studentId: newStudent.id,
      feeType: 'Registration',
      month: isFirst15 ? 'Registration Fee (Inaugural Free Offer)' : 'Registration Fee',
      amount: isFirst15 ? 0 : 350,
      status: isFirst15 ? 'Paid' : 'Pending',
      paymentMethod: isFirst15 ? 'Inaugural Offer Waived (First 15 Students)' : undefined,
      paymentDate: isFirst15 ? todayStr : undefined,
      receiptNumber: isFirst15 ? `KSSB-FREE-OFFER-${String(totalCount).padStart(2, '0')}` : undefined
    };
    const f2: FeeStatus = {
      id: 'f_mon_' + Date.now(),
      studentId: newStudent.id,
      feeType: 'Monthly',
      month: currentMonth,
      amount: 150,
      status: 'Pending'
    };
    db.saveFees([...fees, f1, f2]);
    return { newStudent, newFees: [f1, f2] };
  },
  updateStudent: (updated: Student) => {
    const students = db.getStudents();
    db.saveStudents(students.map(s => s.id === updated.id ? updated : s));
  },
  deleteStudent: (id: string, deletedBy = 'Admin') => {
    const students = db.getStudents();
    const targetStudent = students.find(s => s.id === id);
    if (!targetStudent) return null;

    const allFees = db.getFees();
    const studentFees = allFees.filter(f => f.studentId === id);
    const allMetrics = db.getMetrics();
    const studentMetrics = allMetrics.filter(m => m.studentId === id);

    const deletedRecord: DeletedStudentRecord = {
      id: 'del_' + id + '_' + Date.now(),
      student: targetStudent,
      deletedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      deletedBy,
      feesHistory: studentFees,
      metricsHistory: studentMetrics
    };

    const currentDeleted = db.getDeletedStudents();
    db.saveDeletedStudents([deletedRecord, ...currentDeleted]);

    db.saveStudents(students.filter(s => s.id !== id));
    db.saveFees(allFees.filter(f => f.studentId !== id));
    db.saveMetrics(allMetrics.filter(m => m.studentId !== id));

    return deletedRecord;
  },
  restoreDeletedStudent: (recordId: string) => {
    const deletedRecords = db.getDeletedStudents();
    const targetRecord = deletedRecords.find(d => d.id === recordId);
    if (!targetRecord) return null;

    const students = db.getStudents();
    db.saveStudents([...students, targetRecord.student]);

    const fees = db.getFees();
    db.saveFees([...fees, ...targetRecord.feesHistory]);

    if (targetRecord.metricsHistory && targetRecord.metricsHistory.length > 0) {
      const metrics = db.getMetrics();
      db.saveMetrics([...metrics, ...targetRecord.metricsHistory]);
    }

    db.saveDeletedStudents(deletedRecords.filter(d => d.id !== recordId));
    return targetRecord;
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
    
    // Normalize existing fees: map "Admission Fee" to "Registration Fee"
    let modified = false;
    let normalized = raw
      .filter(f => validStudentIds.has(f.studentId))
      .map(f => {
        if (f.month === 'Admission Fee') {
          modified = true;
          return { ...f, month: 'Registration Fee', feeType: 'Registration' as const };
        }
        if (f.month === 'Registration Fee' && !f.feeType) {
          modified = true;
          return { ...f, feeType: 'Registration' as const };
        }
        if (f.month !== 'Registration Fee' && !f.feeType) {
          return { ...f, feeType: 'Monthly' as const };
        }
        return f;
      });

    // Ensure every student has a Registration Fee record
    students.forEach(student => {
      const hasRegFee = normalized.some(f => f.studentId === student.id && (f.feeType === 'Registration' || f.month === 'Registration Fee'));
      if (!hasRegFee) {
        modified = true;
        normalized.push({
          id: 'f_reg_' + student.id + '_' + Date.now(),
          studentId: student.id,
          feeType: 'Registration',
          month: 'Registration Fee',
          amount: 350,
          status: 'Pending'
        });
      }
    });

    if (modified || normalized.length !== raw.length) {
      saveLocalStorageData(STORAGE_KEYS.FEES, normalized);
    }
    return normalized;
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
      status: 'Delivered',
      readBy: []
    };
    db.saveNotifications([newNotification, ...notifications]);
    return newNotification;
  },
  markNotificationAsRead: (notificationId: string, studentId: string) => {
    const notifications = db.getNotifications();
    const updated = notifications.map(n => {
      if (n.id === notificationId) {
        const existingRead = n.readBy || [];
        if (!existingRead.includes(studentId)) {
          return { ...n, readBy: [...existingRead, studentId] };
        }
      }
      return n;
    });
    db.saveNotifications(updated);
    return updated;
  },
  markAllNotificationsAsRead: (studentId: string) => {
    const notifications = db.getNotifications();
    const updated = notifications.map(n => {
      const existingRead = n.readBy || [];
      if (!existingRead.includes(studentId)) {
        return { ...n, readBy: [...existingRead, studentId] };
      }
      return n;
    });
    db.saveNotifications(updated);
    return updated;
  },
  clearAllNotifications: () => {
    saveLocalStorageData(STORAGE_KEYS.NOTIFICATIONS, []);
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
  },

  // Gallery
  getGallery: () => {
    const raw = getLocalStorageData<GalleryImage>(STORAGE_KEYS.GALLERY, SEED_GALLERY);
    const existingIds = new Set(raw.map(g => g.id));
    let modified = false;
    SEED_GALLERY.forEach(seedItem => {
      if (!existingIds.has(seedItem.id)) {
        raw.push(seedItem);
        modified = true;
      }
    });
    if (modified) {
      saveLocalStorageData(STORAGE_KEYS.GALLERY, raw);
    }
    return raw;
  },
  saveGallery: (data: GalleryImage[]) => saveLocalStorageData(STORAGE_KEYS.GALLERY, data),
  addGalleryImage: (image: Omit<GalleryImage, 'id' | 'date'>) => {
    const gallery = db.getGallery();
    const newImage: GalleryImage = {
      ...image,
      id: 'g_' + Date.now(),
      date: new Date().toISOString().split('T')[0]
    };
    db.saveGallery([newImage, ...gallery]);
    return newImage;
  },
  deleteGalleryImage: (id: string) => {
    const gallery = db.getGallery();
    const updated = gallery.filter(g => g.id !== id);
    db.saveGallery(updated);
  },

  // Camp Jerseys
  getJerseys: () => getLocalStorageData<CampJersey>(STORAGE_KEYS.JERSEYS, SEED_JERSEYS),
  saveJerseys: (data: CampJersey[]) => saveLocalStorageData(STORAGE_KEYS.JERSEYS, data),
  addJersey: (jersey: Omit<CampJersey, 'id' | 'createdAt'>) => {
    const jerseys = db.getJerseys();
    const newJersey: CampJersey = {
      ...jersey,
      id: 'j_' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0]
    };
    db.saveJerseys([newJersey, ...jerseys]);
    return newJersey;
  },
  updateJersey: (updated: CampJersey) => {
    const jerseys = db.getJerseys();
    db.saveJerseys(jerseys.map(j => j.id === updated.id ? updated : j));
  },
  deleteJersey: (id: string) => {
    const jerseys = db.getJerseys();
    db.saveJerseys(jerseys.filter(j => j.id !== id));
  },

  // Jersey Orders
  getJerseyOrders: () => getLocalStorageData<JerseyOrder>(STORAGE_KEYS.JERSEY_ORDERS, SEED_JERSEY_ORDERS),
  saveJerseyOrders: (data: JerseyOrder[]) => saveLocalStorageData(STORAGE_KEYS.JERSEY_ORDERS, data),
  addJerseyOrder: (order: Omit<JerseyOrder, 'id' | 'orderDate'>) => {
    const orders = db.getJerseyOrders();
    const newOrder: JerseyOrder = {
      ...order,
      id: 'jo_' + Date.now(),
      orderDate: new Date().toISOString().split('T')[0]
    };
    db.saveJerseyOrders([newOrder, ...orders]);
    return newOrder;
  },
  updateJerseyOrder: (updated: JerseyOrder) => {
    const orders = db.getJerseyOrders();
    db.saveJerseyOrders(orders.map(o => o.id === updated.id ? updated : o));
  },

  clearAllAppDataExceptGallery: () => {
    db.saveStudents([]);
    db.saveDeletedStudents([]);
    db.saveMetrics([]);
    db.saveFees([]);
    db.saveTournaments([]);
    db.saveInjuries([]);
    db.saveNotifications([]);
    db.saveEvaluations([]);
    db.saveJerseyOrders([]);
  }
};

