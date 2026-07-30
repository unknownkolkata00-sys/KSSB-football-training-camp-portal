import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { DeletedStudentRecord, Student, PerformanceMetric, FeeStatus, Tournament, InjuryReport, NotificationLog, CoachEvaluation, GalleryImage, CampJersey, JerseyOrder } from '../types';
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
  JERSEY_ORDERS: 'jersey_orders'
};


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
    await setDoc(doc(firestoreDb, COLLECTIONS.DELETED_STUDENTS, record.id), record);
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
    COLLECTIONS.JERSEY_ORDERS
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
    await setDoc(doc(firestoreDb, COLLECTIONS.STUDENTS, studentToSave.id), studentToSave);
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
    await setDoc(doc(firestoreDb, COLLECTIONS.METRICS, metric.id), metric);
  } catch (err) {
    console.error('Failed to save metric to Firestore:', err);
  }
}

export async function saveFeeToCloud(fee: FeeStatus) {
  try {
    await setDoc(doc(firestoreDb, COLLECTIONS.FEES, fee.id), fee);
  } catch (err) {
    console.error('Failed to save fee to Firestore:', err);
  }
}

export async function saveTournamentToCloud(tournament: Tournament) {
  try {
    await setDoc(doc(firestoreDb, COLLECTIONS.TOURNAMENTS, tournament.id), tournament);
  } catch (err) {
    console.error('Failed to save tournament to Firestore:', err);
  }
}

export async function saveInjuryToCloud(injury: InjuryReport) {
  try {
    await setDoc(doc(firestoreDb, COLLECTIONS.INJURIES, injury.id), injury);
  } catch (err) {
    console.error('Failed to save injury to Firestore:', err);
  }
}

export async function saveNotificationToCloud(noti: NotificationLog) {
  try {
    await setDoc(doc(firestoreDb, COLLECTIONS.NOTIFICATIONS, noti.id), noti);
  } catch (err) {
    console.error('Failed to save notification to Firestore:', err);
  }
}

export async function saveEvaluationToCloud(evalItem: CoachEvaluation) {
  try {
    await setDoc(doc(firestoreDb, COLLECTIONS.EVALUATIONS, evalItem.id), evalItem);
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
    await setDoc(doc(firestoreDb, COLLECTIONS.GALLERY, imgToSave.id), imgToSave);
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
    await setDoc(doc(firestoreDb, COLLECTIONS.JERSEYS, jerseyToSave.id), jerseyToSave);
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
    await setDoc(doc(firestoreDb, COLLECTIONS.JERSEY_ORDERS, order.id), order);
  } catch (err) {
    console.error('Failed to save jersey order to Firestore:', err);
  }
}


/**
 * Ensures initial local seed notifications, coach evals, gallery images, and jerseys exist in Firestore if cloud collection is empty.
 */
export async function seedInitialCloudDataIfEmpty(
  seedNotifications: NotificationLog[],
  seedEvals: CoachEvaluation[],
  seedGallery: GalleryImage[] = [],
  seedJerseys: CampJersey[] = []
) {
  try {
    const notiSnap = await getDocs(collection(firestoreDb, COLLECTIONS.NOTIFICATIONS));
    if (notiSnap.empty && seedNotifications.length > 0) {
      const batch = writeBatch(firestoreDb);
      seedNotifications.forEach(n => {
        batch.set(doc(firestoreDb, COLLECTIONS.NOTIFICATIONS, n.id), n);
      });
      await batch.commit();
    }

    const evalSnap = await getDocs(collection(firestoreDb, COLLECTIONS.EVALUATIONS));
    if (evalSnap.empty && seedEvals.length > 0) {
      const batch = writeBatch(firestoreDb);
      seedEvals.forEach(e => {
        batch.set(doc(firestoreDb, COLLECTIONS.EVALUATIONS, e.id), e);
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
          batch.set(doc(firestoreDb, COLLECTIONS.GALLERY, g.id), g);
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
          batch.set(doc(firestoreDb, COLLECTIONS.JERSEYS, j.id), j);
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
