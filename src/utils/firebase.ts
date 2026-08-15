import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc,
  getDocs,
  writeBatch,
  query,
  where
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { DeletedStudentRecord, Student, PerformanceMetric, FeeStatus, Tournament, InjuryReport, NotificationLog, CoachEvaluation, GalleryImage, CampJersey, JerseyOrder, CampAsset, CampExpense } from '../types';
import { compressImageFile } from './imageCompressor';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firestore with specific databaseId from config if provided
export const firestoreDb = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Firestore Collection References
const COLLECTIONS = {
  STUDENTS: 'students',
  DELETED_STUDENTS: 'deleted_students',
  METRICS: 'performance_metrics',
  FEES: 'fee_statuses',
  TOURNAMENTS: 'tournaments',
  INJURIES: 'injuries',
  NOTIFICATIONS: 'notifications',
  EVALUATIONS: 'coach_evaluations',
  GALLERY: 'gallery_images',
  JERSEYS: 'camp_jerseys',
  JERSEY_ORDERS: 'jersey_orders',
  ASSETS: 'camp_assets',
  EXPENSES: 'camp_expenses'
};

/**
 * Strips all undefined properties from an object recursively before saving to Firestore,
 * completely preventing Firestore "Unsupported field value: undefined" errors.
 */
export function cleanDataForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map(item => cleanDataForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = cleanDataForFirestore(value);
      }
    }
    return cleaned as T;
  }
  return data;
}


/**
 * Real-time listener for Deleted Students
 */
export function subscribeDeletedStudents(callback: (records: DeletedStudentRecord[]) => void) {
  return onSnapshot(collection(firestoreDb, COLLECTIONS.DELETED_STUDENTS), (snapshot) => {
    const list: DeletedStudentRecord[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.id } as DeletedStudentRecord);
    });
    list.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
    callback(list);
  }, (err) => {
    console.error('Firestore deleted_students snapshot error:', err);
  });
}

export async function saveDeletedStudentToCloud(record: DeletedStudentRecord) {
  try {
    await setDoc(doc(firestoreDb, COLLECTIONS.DELETED_STUDENTS, record.id), cleanDataForFirestore(record));
  } catch (err) {
    console.error('Failed to save deleted student to Firestore:', err);
  }
}

export async function removeDeletedStudentFromCloud(id: string) {
  try {
    await deleteDoc(doc(firestoreDb, COLLECTIONS.DELETED_STUDENTS, id));
  } catch (err) {
    console.error('Failed to remove deleted student from Firestore:', err);
  }
}

export async function deleteFeeFromCloud(feeId: string) {
  try {
    await deleteDoc(doc(firestoreDb, COLLECTIONS.FEES, feeId));
  } catch (err) {
    console.error('Failed to delete fee from Firestore:', err);
  }
}

export async function deleteAllNotificationsFromCloud() {
  try {
    const snap = await getDocs(collection(firestoreDb, COLLECTIONS.NOTIFICATIONS));
    const batch = writeBatch(firestoreDb);
    snap.docs.forEach(docSnap => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  } catch (err) {
    console.error('Failed to delete all notifications from Firestore:', err);
  }
}

export async function clearAllDataExceptGalleryFromCloud() {
  const collectionsToClear = [
    COLLECTIONS.STUDENTS,
    COLLECTIONS.DELETED_STUDENTS,
    COLLECTIONS.METRICS,
    COLLECTIONS.FEES,
    COLLECTIONS.TOURNAMENTS,
    COLLECTIONS.INJURIES,
    COLLECTIONS.NOTIFICATIONS,
    COLLECTIONS.EVALUATIONS,
    COLLECTIONS.JERSEY_ORDERS,
    COLLECTIONS.EXPENSES
  ];

  for (const colName of collectionsToClear) {
    try {
      const snap = await getDocs(collection(firestoreDb, colName));
      if (!snap.empty) {
        const batch = writeBatch(firestoreDb);
        snap.docs.forEach(docSnap => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
      }
    } catch (err) {
      console.error(`Failed to clear collection ${colName} from Firestore:`, err);
    }
  }
}
export function subscribeStudents(callback: (students: Student[]) => void) {
  return onSnapshot(collection(firestoreDb, COLLECTIONS.STUDENTS), (snapshot) => {
    const list: Student[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.id } as Student);
    });
    // Clean legacy mock ids if any
    const cleaned = list.filter(s => !['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'].includes(s.id));
    callback(cleaned);
  }, (err) => {
    console.error('Firestore students snapshot error:', err);
  });
}

/**
 * Real-time listener for Performance Metrics
 */
export function subscribeMetrics(callback: (metrics: PerformanceMetric[]) => void) {
  return onSnapshot(collection(firestoreDb, COLLECTIONS.METRICS), (snapshot) => {
    const list: PerformanceMetric[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.id } as PerformanceMetric);
    });
    callback(list);
  }, (err) => {
    console.error('Firestore metrics snapshot error:', err);
  });
}

/**
 * Real-time listener for Fees
 */
export function subscribeFees(callback: (fees: FeeStatus[]) => void) {
  return onSnapshot(collection(firestoreDb, COLLECTIONS.FEES), (snapshot) => {
    const list: FeeStatus[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.id } as FeeStatus);
    });
    callback(list);
  }, (err) => {
    console.error('Firestore fees snapshot error:', err);
  });
}

/**
 * Real-time listener for Tournaments
 */
export function subscribeTournaments(callback: (tournaments: Tournament[]) => void) {
  return onSnapshot(collection(firestoreDb, COLLECTIONS.TOURNAMENTS), (snapshot) => {
    const list: Tournament[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.id } as Tournament);
    });
    callback(list);
  }, (err) => {
    console.error('Firestore tournaments snapshot error:', err);
  });
}

/**
 * Real-time listener for Injury Reports
 */
export function subscribeInjuries(callback: (injuries: InjuryReport[]) => void) {
  return onSnapshot(collection(firestoreDb, COLLECTIONS.INJURIES), (snapshot) => {
    const list: InjuryReport[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.id } as InjuryReport);
    });
    callback(list);
  }, (err) => {
    console.error('Firestore injuries snapshot error:', err);
  });
}

/**
 * Real-time listener for Notifications
 */
export function subscribeNotifications(callback: (notifications: NotificationLog[]) => void) {
  return onSnapshot(collection(firestoreDb, COLLECTIONS.NOTIFICATIONS), (snapshot) => {
    const list: NotificationLog[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.id } as NotificationLog);
    });
    // Sort descending by timestamp
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    callback(list);
  }, (err) => {
    console.error('Firestore notifications snapshot error:', err);
  });
}

/**
 * Real-time listener for Coach Evaluations
 */
export function subscribeEvaluations(callback: (evals: CoachEvaluation[]) => void) {
  return onSnapshot(collection(firestoreDb, COLLECTIONS.EVALUATIONS), (snapshot) => {
    const list: CoachEvaluation[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.id } as CoachEvaluation);
    });
    callback(list);
  }, (err) => {
    console.error('Firestore evaluations snapshot error:', err);
  });
}

/**
 * Real-time listener for Gallery Images
 */
export function subscribeGallery(callback: (images: GalleryImage[]) => void) {
  return onSnapshot(collection(firestoreDb, COLLECTIONS.GALLERY), (snapshot) => {
    const list: GalleryImage[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.id } as GalleryImage);
    });
    list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    callback(list);
  }, (err) => {
    console.error('Firestore gallery snapshot error:', err);
  });
}

// Write Helpers
export async function saveStudentToCloud(student: Student) {
  try {
    let studentToSave = student;
    if (student.photoUrl && student.photoUrl.startsWith('data:image') && student.photoUrl.length > 400000) {
      const compressedPhoto = await compressImageFile(student.photoUrl, 500, 0.75, 300000);
      studentToSave = { ...student, photoUrl: compressedPhoto };
    }
    await setDoc(doc(firestoreDb, COLLECTIONS.STUDENTS, studentToSave.id), cleanDataForFirestore(studentToSave));
  } catch (err) {
    console.error('Failed to save student to Firestore:', err);
  }
}

export async function deleteStudentFromCloud(id: string) {
  try {
    await deleteDoc(doc(firestoreDb, COLLECTIONS.STUDENTS, id));
  } catch (err) {
    console.error('Failed to delete student from Firestore:', err);
  }
}

export async function saveMetricToCloud(metric: PerformanceMetric) {
  try {
    await setDoc(doc(firestoreDb, COLLECTIONS.METRICS, metric.id), cleanDataForFirestore(metric));
  } catch (err) {
    console.error('Failed to save metric to Firestore:', err);
  }
}

export async function saveFeeToCloud(fee: FeeStatus) {
  try {
    await setDoc(doc(firestoreDb, COLLECTIONS.FEES, fee.id), cleanDataForFirestore(fee));
  } catch (err) {
    console.error('Failed to save fee to Firestore:', err);
  }
}

export async function deleteStudentFeesFromCloud(studentId: string) {
  try {
    const q = query(collection(firestoreDb, COLLECTIONS.FEES), where("studentId", "==", studentId));
    const querySnapshot = await getDocs(q);
    const deletePromises = querySnapshot.docs.map(d => deleteDoc(d.ref));
    await Promise.all(deletePromises);
  } catch (err) {
    console.error('Failed to delete student fees from Firestore:', err);
  }
}

export async function saveTournamentToCloud(tournament: Tournament) {
  try {
    await setDoc(doc(firestoreDb, COLLECTIONS.TOURNAMENTS, tournament.id), cleanDataForFirestore(tournament));
  } catch (err) {
    console.error('Failed to save tournament to Firestore:', err);
  }
}

export async function saveInjuryToCloud(injury: InjuryReport) {
  try {
    await setDoc(doc(firestoreDb, COLLECTIONS.INJURIES, injury.id), cleanDataForFirestore(injury));
  } catch (err) {
    console.error('Failed to save injury to Firestore:', err);
  }
}

export async function saveNotificationToCloud(noti: NotificationLog) {
  try {
    await setDoc(doc(firestoreDb, COLLECTIONS.NOTIFICATIONS, noti.id), cleanDataForFirestore(noti));
  } catch (err) {
    console.error('Failed to save notification to Firestore:', err);
  }
}

export async function saveEvaluationToCloud(evalItem: CoachEvaluation) {
  try {
    await setDoc(doc(firestoreDb, COLLECTIONS.EVALUATIONS, evalItem.id), cleanDataForFirestore(evalItem));
  } catch (err) {
    console.error('Failed to save evaluation to Firestore:', err);
  }
}

export async function saveGalleryImageToCloud(image: GalleryImage) {
  try {
    let imgToSave = image;
    if (image.imageUrl && image.imageUrl.startsWith('data:image') && image.imageUrl.length > 400000) {
      const compressedUrl = await compressImageFile(image.imageUrl, 800, 0.75, 300000);
      imgToSave = { ...image, imageUrl: compressedUrl };
    }
    await setDoc(doc(firestoreDb, COLLECTIONS.GALLERY, imgToSave.id), cleanDataForFirestore(imgToSave));
  } catch (err) {
    console.error('Failed to save gallery image to Firestore:', err);
  }
}

export async function deleteGalleryImageFromCloud(id: string) {
  try {
    await deleteDoc(doc(firestoreDb, COLLECTIONS.GALLERY, id));
  } catch (err) {
    console.error('Failed to delete gallery image from Firestore:', err);
  }
}

/**
 * Real-time listener for Camp Jerseys
 */
export function subscribeJerseys(callback: (jerseys: CampJersey[]) => void) {
  return onSnapshot(collection(firestoreDb, COLLECTIONS.JERSEYS), (snapshot) => {
    const list: CampJersey[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.id } as CampJersey);
    });
    callback(list);
  }, (err) => {
    console.error('Firestore jerseys snapshot error:', err);
  });
}

/**
 * Real-time listener for Jersey Orders
 */
export function subscribeJerseyOrders(callback: (orders: JerseyOrder[]) => void) {
  return onSnapshot(collection(firestoreDb, COLLECTIONS.JERSEY_ORDERS), (snapshot) => {
    const list: JerseyOrder[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.id } as JerseyOrder);
    });
    list.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
    callback(list);
  }, (err) => {
    console.error('Firestore jersey orders snapshot error:', err);
  });
}

export async function saveJerseyToCloud(jersey: CampJersey) {
  try {
    let jerseyToSave = jersey;
    if (jersey.imageUrl && jersey.imageUrl.startsWith('data:image') && jersey.imageUrl.length > 400000) {
      const compressedUrl = await compressImageFile(jersey.imageUrl, 800, 0.75, 300000);
      jerseyToSave = { ...jersey, imageUrl: compressedUrl };
    }
    await setDoc(doc(firestoreDb, COLLECTIONS.JERSEYS, jerseyToSave.id), cleanDataForFirestore(jerseyToSave));
  } catch (err) {
    console.error('Failed to save jersey to Firestore:', err);
  }
}

export async function deleteJerseyFromCloud(id: string) {
  try {
    await deleteDoc(doc(firestoreDb, COLLECTIONS.JERSEYS, id));
  } catch (err) {
    console.error('Failed to delete jersey from Firestore:', err);
  }
}

export async function saveJerseyOrderToCloud(order: JerseyOrder) {
  try {
    await setDoc(doc(firestoreDb, COLLECTIONS.JERSEY_ORDERS, order.id), cleanDataForFirestore(order));
  } catch (err) {
    console.error('Failed to save jersey order to Firestore:', err);
  }
}

/**
 * Real-time listener for Camp Assets
 */
export function subscribeCampAssets(callback: (assets: CampAsset[]) => void) {
  return onSnapshot(collection(firestoreDb, COLLECTIONS.ASSETS), (snapshot) => {
    const list: CampAsset[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.id } as CampAsset);
    });
    list.sort((a, b) => (a.itemName || '').localeCompare(b.itemName || ''));
    callback(list);
  }, (err) => {
    console.error('Firestore assets snapshot error:', err);
  });
}

export async function saveCampAssetToCloud(asset: CampAsset) {
  try {
    await setDoc(doc(firestoreDb, COLLECTIONS.ASSETS, asset.id), cleanDataForFirestore(asset));
  } catch (err) {
    console.error('Failed to save asset to Firestore:', err);
  }
}

export async function deleteCampAssetFromCloud(id: string) {
  try {
    await deleteDoc(doc(firestoreDb, COLLECTIONS.ASSETS, id));
  } catch (err) {
    console.error('Failed to delete asset from Firestore:', err);
  }
}

/**
 * Real-time listener for Camp Expenses
 */
export function subscribeCampExpenses(callback: (expenses: CampExpense[]) => void) {
  return onSnapshot(collection(firestoreDb, COLLECTIONS.EXPENSES), (snapshot) => {
    const list: CampExpense[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.id } as CampExpense);
    });
    list.sort((a, b) => new Date(b.expenseDate || '').getTime() - new Date(a.expenseDate || '').getTime());
    callback(list);
  }, (err) => {
    console.error('Firestore expenses snapshot error:', err);
  });
}

export async function saveCampExpenseToCloud(expense: CampExpense) {
  try {
    await setDoc(doc(firestoreDb, COLLECTIONS.EXPENSES, expense.id), cleanDataForFirestore(expense));
  } catch (err) {
    console.error('Failed to save expense to Firestore:', err);
  }
}

export async function deleteCampExpenseFromCloud(id: string) {
  try {
    await deleteDoc(doc(firestoreDb, COLLECTIONS.EXPENSES, id));
  } catch (err) {
    console.error('Failed to delete expense from Firestore:', err);
  }
}

/**
 * Ensures initial local seed notifications, coach evals, gallery images, jerseys, assets, and expenses exist in Firestore if cloud collection is empty.
 */
export async function seedInitialCloudDataIfEmpty(
  seedNotifications: NotificationLog[],
  seedEvals: CoachEvaluation[],
  seedGallery: GalleryImage[] = [],
  seedJerseys: CampJersey[] = [],
  seedAssets: CampAsset[] = [],
  seedExpenses: CampExpense[] = []
) {
  try {
    const notiSnap = await getDocs(collection(firestoreDb, COLLECTIONS.NOTIFICATIONS));
    if (notiSnap.empty && seedNotifications.length > 0) {
      const batch = writeBatch(firestoreDb);
      seedNotifications.forEach(n => {
        batch.set(doc(firestoreDb, COLLECTIONS.NOTIFICATIONS, n.id), cleanDataForFirestore(n));
      });
      await batch.commit();
    }

    const evalSnap = await getDocs(collection(firestoreDb, COLLECTIONS.EVALUATIONS));
    if (evalSnap.empty && seedEvals.length > 0) {
      const batch = writeBatch(firestoreDb);
      seedEvals.forEach(e => {
        batch.set(doc(firestoreDb, COLLECTIONS.EVALUATIONS, e.id), cleanDataForFirestore(e));
      });
      await batch.commit();
    }

    const gallerySnap = await getDocs(collection(firestoreDb, COLLECTIONS.GALLERY));
    const existingCloudIds = new Set(gallerySnap.docs.map(d => d.id));
    if (seedGallery.length > 0) {
      const batch = writeBatch(firestoreDb);
      let needsCommit = false;
      seedGallery.forEach(g => {
        if (!existingCloudIds.has(g.id)) {
          batch.set(doc(firestoreDb, COLLECTIONS.GALLERY, g.id), cleanDataForFirestore(g));
          needsCommit = true;
        }
      });
      if (needsCommit) {
        await batch.commit();
      }
    }

    const jerseySnap = await getDocs(collection(firestoreDb, COLLECTIONS.JERSEYS));
    const existingCloudJerseyIds = new Set(jerseySnap.docs.map(d => d.id));
    if (seedJerseys.length > 0) {
      const batch = writeBatch(firestoreDb);
      let needsCommit = false;
      seedJerseys.forEach(j => {
        if (!existingCloudJerseyIds.has(j.id)) {
          batch.set(doc(firestoreDb, COLLECTIONS.JERSEYS, j.id), cleanDataForFirestore(j));
          needsCommit = true;
        }
      });
      if (needsCommit) {
        await batch.commit();
      }
    }

    const assetSnap = await getDocs(collection(firestoreDb, COLLECTIONS.ASSETS));
    const existingCloudAssetIds = new Set(assetSnap.docs.map(d => d.id));
    if (seedAssets.length > 0) {
      const batch = writeBatch(firestoreDb);
      let needsCommit = false;
      seedAssets.forEach(a => {
        if (!existingCloudAssetIds.has(a.id)) {
          batch.set(doc(firestoreDb, COLLECTIONS.ASSETS, a.id), cleanDataForFirestore(a));
          needsCommit = true;
        }
      });
      if (needsCommit) {
        await batch.commit();
      }
    }

    const expenseSnap = await getDocs(collection(firestoreDb, COLLECTIONS.EXPENSES));
    const existingCloudExpenseIds = new Set(expenseSnap.docs.map(d => d.id));
    if (seedExpenses.length > 0) {
      const batch = writeBatch(firestoreDb);
      let needsCommit = false;
      seedExpenses.forEach(exp => {
        if (!existingCloudExpenseIds.has(exp.id)) {
          batch.set(doc(firestoreDb, COLLECTIONS.EXPENSES, exp.id), cleanDataForFirestore(exp));
          needsCommit = true;
        }
      });
      if (needsCommit) {
        await batch.commit();
      }
    }
  } catch (err) {
    console.warn('Could not seed initial cloud data:', err);
  }
}
