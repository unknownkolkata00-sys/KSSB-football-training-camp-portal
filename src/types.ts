export interface Student {
  id: string;
  registrationNumber: string; // e.g., KSSBFC0001/26-27
  name: string;
  fatherName: string;
  motherName: string;
  address: string;
  mobileNo: string; // Mobile No with WhatsApp
  guardianName: string;
  guardianMobileNo: string;
  position: 'Goalkeeper' | 'Defence' | 'Midfield' | 'Forward' | 'Winger';
  age: number;
  dob?: string; // Date of Birth e.g. "YYYY-MM-DD" or "DD/MM/YYYY"
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  registrationDate: string;
  photoUrl?: string;
  status: 'Active' | 'Inactive';
  aadharNumber: string; // Mandatory Student/Guardian Aadhar No
  isGuardianAadhar?: boolean; // True if child is under 5 years old
}

export interface DeletedStudentRecord {
  id: string;
  student: Student;
  deletedAt: string;
  deletedBy?: string;
  feesHistory: FeeStatus[];
  metricsHistory?: PerformanceMetric[];
}

export interface PerformanceMetric {
  id: string;
  studentId: string;
  date: string; // YYYY-MM-DD
  markedAt?: number; // Unix timestamp in ms when attendance was marked
  speed: number; // 40yd dash (seconds, lower is better)
  agility: number; // shuttle/cone run (seconds, lower is better)
  stamina: number; // rating 1-10
  passing: number; // rating 1-10
  shooting: number; // rating 1-10
  defense: number; // rating 1-10
  attendance: 'Present' | 'Absent' | 'Excused';
  notes: string;
}

export interface FeeStatus {
  id: string;
  studentId: string;
  feeType?: 'Registration' | 'Monthly';
  month: string; // e.g. "Registration Fee" or "August 2026"
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  paymentDate?: string;
  paymentMethod?: string;
  receiptNumber?: string;
}

export interface Tournament {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  opponent: string;
  location: string;
  ageGroup: string;
  departureTime: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
  selectedSquad?: string[]; // Legacy / student IDs
  startingEleven?: string[]; // Legacy starting XI
  proposedSquadByCoach?: {
    startingEleven: string[];
    substitutes: string[];
    notes?: string;
    nominatedAt?: string;
  };
  publishedSquadByAdmin?: {
    startingEleven: string[];
    substitutes: string[];
    publishedAt?: string;
  };
  isPublishedByAdmin?: boolean;
}

export interface GalleryImage {
  id: string;
  title: string;
  category: 'Matches' | 'Training' | 'Events' | 'Celebrations' | 'Awards';
  imageUrl: string;
  date: string;
  uploadedBy: string;
  caption?: string;
}

export interface InjuryReport {
  id: string;
  studentId: string;
  injuryType: string;
  dateOfInjury: string;
  expectedReturn: string;
  status: 'Active' | 'Recovering' | 'Recovered';
  notes: string;
}

export interface NotificationLog {
  id: string;
  title: string;
  message: string;
  recipientGroup: string;
  timestamp: string;
  method: 'SMS' | 'Email' | 'Both';
  status: 'Sent' | 'Delivered' | 'Pending';
  readBy?: string[]; // Student IDs who marked as read
}

export interface CoachRating {
  sessionQuality: number; // 1-5
  communication: number; // 1-5
  punctuality: number; // 1-5
  playerFeedback: string;
}

export interface CoachEvaluation {
  id: string;
  date: string;
  sessionsCount: number;
  avgAttendance: number;
  overallRating: number;
  aiReport?: string;
}

export interface CampJersey {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  availableSizes: string[]; // ['6yrs', '8yrs', '10yrs', '12yrs', '14yrs', '15yrs', '16yrs']
  isAvailable: boolean;
  createdAt: string;
}

export interface JerseyOrder {
  id: string;
  studentId: string;
  studentName: string;
  registrationNumber: string;
  jerseyId: string;
  jerseyName: string;
  jerseyImageUrl?: string;
  size: '6yrs' | '8yrs' | '10yrs' | '12yrs' | '14yrs' | '15yrs' | '16yrs' | string;
  quantity?: number;
  price: number;
  totalPrice?: number;
  orderDate: string;
  status: 'Pending' | 'Confirmed' | 'Delivered' | 'Cancelled';
  paymentStatus: 'Pending' | 'Paid';
  mobileNo?: string;
  notes?: string;
}
