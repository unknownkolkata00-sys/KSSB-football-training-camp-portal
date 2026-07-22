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
  parentName: string;
  parentEmail: string;
  parentPhone: string;
  registrationDate: string;
  status: 'Active' | 'Inactive';
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
  month: string; // e.g. "July 2026"
  amount: number;
  status: 'Paid' | 'Pending' | 'Overdue';
  paymentDate?: string;
  paymentMethod?: string;
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
  selectedSquad?: string[]; // student IDs selected for matchday squad
  startingEleven?: string[]; // student IDs in starting XI
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
