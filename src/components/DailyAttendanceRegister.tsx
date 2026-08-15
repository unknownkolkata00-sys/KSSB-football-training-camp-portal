import React, { useState, useMemo } from 'react';
import { Student, PerformanceMetric } from '../types';
import { 
  UserCheck, 
  Lock, 
  CheckCircle2, 
  Search, 
  Calendar, 
  Download, 
  Check, 
  X, 
  AlertCircle, 
  Clock, 
  ArrowLeft, 
  ArrowRight,
  ShieldAlert,
  Users,
  Filter
} from 'lucide-react';
import StudentAvatar from './StudentAvatar';
import { downloadAttendanceReportCSV } from '../utils/reports';

interface DailyAttendanceRegisterProps {
  students: Student[];
  metrics: PerformanceMetric[];
  onAddMetric: (metric: Omit<PerformanceMetric, 'id'>) => void;
  userRole?: 'admin' | 'coach';
}

export default function DailyAttendanceRegister({
  students,
  metrics,
  onAddMetric,
  userRole = 'coach'
}: DailyAttendanceRegisterProps) {
  // Selected Training Date (Defaults to today in YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [sessionType, setSessionType] = useState<string>('Tactical & Fitness Training');
  const [sessionNotes, setSessionNotes] = useState<string>('');
  
  // Real-time filter & search
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [positionFilter, setPositionFilter] = useState<string>('All');
  
  // Local pending attendance state for unmarked students on the selected date
  const [pendingAttendance, setPendingAttendance] = useState<Record<string, 'Present' | 'Absent' | 'Excused'>>({});
  
  // Feedback alert banner
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Save confirmation modal
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

  // Natural Registration Sequence Extraction Helper (1, 2, 3, etc.)
  const parseRegistrationSeq = (s: Student): number => {
    if (s.registrationNumber) {
      const match = s.registrationNumber.match(/KSSBFC(\d+)\//i);
      if (match && match[1]) {
        const n = parseInt(match[1], 10);
        if (!isNaN(n)) return n;
      }
    }
    const idMatch = s.id.match(/^p(\d+)/i);
    if (idMatch && idMatch[1]) {
      const n = parseInt(idMatch[1], 10);
      if (!isNaN(n)) return n;
    }
    if (s.registrationDate) {
      const d = new Date(s.registrationDate).getTime();
      if (!isNaN(d)) return d;
    }
    return 999999;
  };

  // Sort students strictly by registration sequence (First Registered #1 to Till-Date #N)
  const sequenceSortedStudents = useMemo(() => {
    return [...students].sort((a, b) => parseRegistrationSeq(a) - parseRegistrationSeq(b));
  }, [students]);

  // Map of existing recorded metrics for the currently selected date
  const existingMetricsMap = useMemo(() => {
    const map: Record<string, PerformanceMetric> = {};
    metrics.forEach(m => {
      if (m.date === selectedDate) {
        // Keep the latest or first metric recorded for this student on this date
        if (!map[m.studentId] || (m.markedAt && map[m.studentId].markedAt && m.markedAt > (map[m.studentId].markedAt || 0))) {
          map[m.studentId] = m;
        }
      }
    });
    return map;
  }, [metrics, selectedDate]);

  // Check if attendance for student on selectedDate is already permanently locked
  const getLockedRecord = (studentId: string): PerformanceMetric | undefined => {
    return existingMetricsMap[studentId];
  };

  // Filter students by search and position
  const filteredStudents = useMemo(() => {
    return sequenceSortedStudents.filter(s => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term || 
        s.name.toLowerCase().includes(term) || 
        (s.registrationNumber || '').toLowerCase().includes(term) ||
        (s.mobileNo || '').includes(term) ||
        (s.fatherName || '').toLowerCase().includes(term);
      const matchesPos = positionFilter === 'All' || s.position === positionFilter;
      return matchesSearch && matchesPos;
    });
  }, [sequenceSortedStudents, searchTerm, positionFilter]);

  // Current status helper for a student on selected date
  const getStudentStatus = (studentId: string): 'Present' | 'Absent' | 'Excused' => {
    const locked = getLockedRecord(studentId);
    if (locked) {
      return locked.attendance;
    }
    return pendingAttendance[studentId] || 'Present';
  };

  // Toggle status for a student (Only allowed if NOT locked)
  const handleSetStatus = (studentId: string, status: 'Present' | 'Absent' | 'Excused') => {
    const locked = getLockedRecord(studentId);
    if (locked) {
      setAlert({
        type: 'error',
        message: `Attendance is PERMANENTLY LOCKED for ${students.find(s => s.id === studentId)?.name || 'this athlete'} on ${selectedDate}. Records cannot be altered by Admin or Coach.`
      });
      return;
    }
    setPendingAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  // Quick Action: Mark all currently unmarked students as Present
  const handleMarkAllUnmarkedPresent = () => {
    const next: Record<string, 'Present' | 'Absent' | 'Excused'> = { ...pendingAttendance };
    let count = 0;
    sequenceSortedStudents.forEach(s => {
      if (!getLockedRecord(s.id)) {
        next[s.id] = 'Present';
        count++;
      }
    });
    setPendingAttendance(next);
    setAlert({
      type: 'info',
      message: `Set ${count} unmarked athletes to "Present". Click "Save & Lock Attendance" when ready to lock records.`
    });
  };

  // Quick Action: Mark all currently unmarked students as Absent
  const handleMarkAllUnmarkedAbsent = () => {
    const next: Record<string, 'Present' | 'Absent' | 'Excused'> = { ...pendingAttendance };
    let count = 0;
    sequenceSortedStudents.forEach(s => {
      if (!getLockedRecord(s.id)) {
        next[s.id] = 'Absent';
        count++;
      }
    });
    setPendingAttendance(next);
    setAlert({
      type: 'info',
      message: `Set ${count} unmarked athletes to "Absent". Click "Save & Lock Attendance" when ready to lock records.`
    });
  };

  // Date Navigation Helpers
  const handlePreviousDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleSetToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  // Count Unmarked vs Locked for Selected Date
  const totalAthletes = sequenceSortedStudents.length;
  const lockedCount = sequenceSortedStudents.filter(s => !!getLockedRecord(s.id)).length;
  const unmarkedCount = totalAthletes - lockedCount;

  // Status breakdown for the selected date
  const presentCount = sequenceSortedStudents.filter(s => getStudentStatus(s.id) === 'Present' && !!getLockedRecord(s.id)).length;
  const absentCount = sequenceSortedStudents.filter(s => getStudentStatus(s.id) === 'Absent' && !!getLockedRecord(s.id)).length;
  const excusedCount = sequenceSortedStudents.filter(s => getStudentStatus(s.id) === 'Excused' && !!getLockedRecord(s.id)).length;

  // Save and permanently lock attendance for all unmarked athletes
  const handleConfirmSaveAttendance = () => {
    let savedCount = 0;
    const now = Date.now();

    sequenceSortedStudents.forEach(s => {
      // If already locked, skip to preserve original permanent record
      if (getLockedRecord(s.id)) return;

      const chosenStatus = pendingAttendance[s.id] || 'Present';
      onAddMetric({
        studentId: s.id,
        date: selectedDate,
        markedAt: now,
        speed: 5.0,
        agility: 5.0,
        stamina: 7,
        passing: 7,
        shooting: 7,
        defense: 7,
        attendance: chosenStatus,
        notes: `[${sessionType}] ${sessionNotes ? sessionNotes.trim() : 'Daily session attendance marked and locked'}`
      });
      savedCount++;
    });

    setShowConfirmModal(false);
    setSessionNotes('');
    setAlert({
      type: 'success',
      message: `Successfully locked & saved attendance for ${savedCount} athletes on ${selectedDate}! Attendance is now permanently locked and cannot be changed.`
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6" id="daily-attendance-register-root">
      
      {/* Alert Banner */}
      {alert && (
        <div className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-center justify-between shadow-sm animate-fade-in ${
          alert.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : alert.type === 'error' 
              ? 'bg-rose-50 border-rose-200 text-rose-900'
              : 'bg-sky-50 border-sky-200 text-sky-900'
        }`}>
          <div className="flex items-center gap-2.5">
            {alert.type === 'success' && <CheckCircle2 size={18} className="text-emerald-700 shrink-0" />}
            {alert.type === 'error' && <ShieldAlert size={18} className="text-rose-700 shrink-0" />}
            {alert.type === 'info' && <AlertCircle size={18} className="text-sky-700 shrink-0" />}
            <span>{alert.message}</span>
          </div>
          <button 
            onClick={() => setAlert(null)} 
            className="p-1 text-gray-400 hover:text-gray-700 cursor-pointer rounded-lg hover:bg-black/5 ml-2"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Main Header & Date Selector Card */}
      <div className="bg-slate-900 border border-slate-800 text-white p-4 sm:p-5 rounded-3xl shadow-lg space-y-4" id="attendance-header-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Title & Sequence Label */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold rounded-lg flex items-center gap-1.5">
                <UserCheck size={14} className="text-emerald-400" />
                One-Screen Attendance Register
              </span>
              <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-mono font-bold rounded-lg flex items-center gap-1">
                <Lock size={12} className="text-amber-400" />
                Permanent Lock Enforced
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold font-sans flex items-center gap-2 text-white">
              Daily Training Attendance Sheet
            </h2>
            <p className="text-xs text-slate-300">
              Athletes listed in strict registration sequence (First Registered <strong className="text-emerald-400">#1</strong> to Till-Date <strong className="text-emerald-400">#{totalAthletes}</strong>). Once marked, attendance is permanently locked.
            </p>
          </div>

          {/* Quick Date Controls */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-950 p-2.5 rounded-2xl border border-slate-800 self-start lg:self-center">
            <button
              onClick={handlePreviousDay}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all cursor-pointer"
              title="Previous Day"
            >
              <ArrowLeft size={16} />
            </button>

            <div className="flex items-center gap-2 px-2">
              <Calendar size={16} className="text-amber-400" />
              <input 
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              onClick={handleNextDay}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-all cursor-pointer"
              title="Next Day"
            >
              <ArrowRight size={16} />
            </button>

            <button
              onClick={handleSetToday}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                selectedDate === new Date().toISOString().split('T')[0]
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              Today
            </button>
          </div>

        </div>

        {/* Real-Time Session Attendance Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-2 border-t border-slate-800/80">
          
          <div className="bg-slate-800/70 border border-slate-700/70 p-2.5 rounded-2xl text-center">
            <div className="text-[10px] text-slate-400 font-mono uppercase font-bold">Total Athletes</div>
            <div className="text-base font-black text-white font-mono">{totalAthletes}</div>
          </div>

          <div className="bg-slate-800/70 border border-slate-700/70 p-2.5 rounded-2xl text-center">
            <div className="text-[10px] text-slate-400 font-mono uppercase font-bold flex items-center justify-center gap-1">
              <Lock size={10} className="text-amber-400" />
              Locked Records
            </div>
            <div className="text-base font-black text-amber-300 font-mono">{lockedCount} / {totalAthletes}</div>
          </div>

          <div className="bg-emerald-950/80 border border-emerald-700/60 p-2.5 rounded-2xl text-center">
            <div className="text-[10px] text-emerald-400 font-mono uppercase font-bold">✓ Present (Locked)</div>
            <div className="text-base font-black text-emerald-300 font-mono">{presentCount}</div>
          </div>

          <div className="bg-rose-950/80 border border-rose-700/60 p-2.5 rounded-2xl text-center">
            <div className="text-[10px] text-rose-400 font-mono uppercase font-bold">✕ Absent (Locked)</div>
            <div className="text-base font-black text-rose-300 font-mono">{absentCount}</div>
          </div>

          <div className="bg-amber-950/80 border border-amber-700/60 p-2.5 rounded-2xl text-center">
            <div className="text-[10px] text-amber-400 font-mono uppercase font-bold">~ Excused (Locked)</div>
            <div className="text-base font-black text-amber-300 font-mono">{excusedCount}</div>
          </div>

          <div className={`p-2.5 rounded-2xl text-center border ${
            unmarkedCount > 0 
              ? 'bg-sky-950/80 border-sky-600/80 text-sky-200' 
              : 'bg-slate-800/70 border-slate-700/70 text-slate-400'
          }`}>
            <div className="text-[10px] font-mono uppercase font-bold">⏳ Pending to Lock</div>
            <div className="text-base font-black font-mono">{unmarkedCount}</div>
          </div>

        </div>
      </div>

      {/* Fast 1-Screen Action Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-3" id="attendance-toolbar">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search and Position Filter */}
          <div className="flex flex-wrap items-center gap-2 flex-1 max-w-xl">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text"
                placeholder="Search athlete by name, reg no (e.g. 0001), phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-emerald-600/20"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value)}
              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none"
            >
              <option value="All">All Positions</option>
              <option value="Goalkeeper">Goalkeeper</option>
              <option value="Defender">Defender</option>
              <option value="Midfielder">Midfielder</option>
              <option value="Forward">Forward</option>
            </select>
          </div>

          {/* Quick Mark Batch Buttons & Report Export */}
          <div className="flex flex-wrap items-center gap-2">
            {unmarkedCount > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleMarkAllUnmarkedPresent}
                  className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  title="Fill all unmarked athletes with Present status"
                >
                  <Check size={14} className="text-emerald-700" />
                  <span>Mark All Unmarked Present</span>
                </button>

                <button
                  type="button"
                  onClick={handleMarkAllUnmarkedAbsent}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  title="Fill all unmarked athletes with Absent status"
                >
                  <X size={14} className="text-rose-700" />
                  <span>Mark All Unmarked Absent</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => downloadAttendanceReportCSV(sequenceSortedStudents, metrics)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Download Full Attendance History CSV Report"
            >
              <Download size={14} />
              <span>CSV Report</span>
            </button>
          </div>

        </div>

        {/* Session Type & Coach Session Notes (for pending save) */}
        {unmarkedCount > 0 && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="w-full md:w-64 shrink-0">
              <label className="text-[10px] font-mono font-bold text-gray-500 uppercase block mb-1">Session Program Type</label>
              <select 
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-800 focus:outline-none"
              >
                <option value="Tactical & Fitness Training">Tactical & Fitness Training</option>
                <option value="Match Day Practice">Match Day Practice</option>
                <option value="Physical Conditioning">Physical Conditioning</option>
                <option value="Recovery Session">Recovery Session</option>
              </select>
            </div>

            <div className="flex-1">
              <label className="text-[10px] font-mono font-bold text-gray-500 uppercase block mb-1">Coach Training Notes (Optional)</label>
              <input 
                type="text"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="e.g. Morning ball mastery, 4v4 pressing grids, hydration check..."
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium focus:outline-none"
              />
            </div>

            <div className="shrink-0 self-end md:self-auto pt-2 md:pt-4">
              <button
                type="button"
                onClick={() => setShowConfirmModal(true)}
                className="w-full md:w-auto px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                id="save-and-lock-attendance-btn"
              >
                <Lock size={15} className="text-yellow-300" />
                <span>Save & Lock Attendance ({unmarkedCount} athletes)</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Single-Screen Attendance Register Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden" id="attendance-register-table-container">
        
        {/* Table Header Details */}
        <div className="p-4 bg-gray-50/80 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">
              Master Attendance Sheet ({selectedDate})
            </span>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold rounded">
              {filteredStudents.length} of {totalAthletes} Athletes Shown
            </span>
          </div>

          <div className="text-[11px] font-mono text-gray-500 flex items-center gap-1.5">
            <Lock size={12} className="text-amber-600" />
            <span>Rule: Once marked and saved, records cannot be changed by Admin or Coach.</span>
          </div>
        </div>

        {/* Compact Table View for High Density & Zero Unnecessary Scrolling */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-slate-200 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800 select-none">
                <th className="py-3 px-3.5 text-center w-16">Seq #</th>
                <th className="py-3 px-3 w-36">Reg No</th>
                <th className="py-3 px-4 min-w-[200px]">Player Name & Position</th>
                <th className="py-3 px-4 hidden md:table-cell min-w-[160px]">Guardian & Contact</th>
                <th className="py-3 px-4 text-center min-w-[280px]">Daily Attendance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const seqNum = parseRegistrationSeq(student);
                  const lockedRecord = getLockedRecord(student.id);
                  const isLocked = !!lockedRecord;
                  const currentStatus = getStudentStatus(student.id);

                  return (
                    <tr 
                      key={student.id} 
                      className={`transition-colors ${
                        isLocked 
                          ? currentStatus === 'Present' 
                            ? 'bg-emerald-50/20 hover:bg-emerald-50/40' 
                            : currentStatus === 'Absent' 
                              ? 'bg-rose-50/20 hover:bg-rose-50/40' 
                              : 'bg-amber-50/20 hover:bg-amber-50/40'
                          : 'hover:bg-gray-50/80'
                      }`}
                    >
                      {/* Natural Sequence Number */}
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-slate-900 text-yellow-400 font-mono font-black text-xs shadow-xs border border-slate-800">
                          #{seqNum}
                        </span>
                      </td>

                      {/* Registration Number */}
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-1 bg-slate-100 text-slate-800 font-mono font-bold text-[11px] rounded-lg border border-slate-200/80 whitespace-nowrap block w-fit">
                          {student.registrationNumber || `KSSBFC${String(seqNum).padStart(4, '0')}/26-27`}
                        </span>
                      </td>

                      {/* Athlete Identity */}
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <StudentAvatar photoUrl={student.photoUrl} name={student.name} size="sm" />
                          <div className="min-w-0">
                            <div className="font-bold text-gray-900 text-xs sm:text-sm truncate">
                              {student.name}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-mono">
                              <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-800 font-semibold rounded border border-emerald-100">
                                {student.position}
                              </span>
                              <span>• Age: {student.age}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Parent & Phone */}
                      <td className="py-2.5 px-4 hidden md:table-cell">
                        <div className="text-xs text-gray-700">
                          <div className="font-medium truncate">{student.fatherName || student.guardianName || 'Parent/Guardian'}</div>
                          <a 
                            href={`tel:${student.mobileNo}`} 
                            className="font-mono text-[11px] text-emerald-700 font-bold hover:underline"
                          >
                            {student.mobileNo || 'N/A'}
                          </a>
                        </div>
                      </td>

                      {/* Attendance Actions & Permanent Lock Status */}
                      <td className="py-2.5 px-4 text-center">
                        {isLocked ? (
                          <div className="inline-flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl border font-mono text-xs font-bold shadow-xs">
                            {currentStatus === 'Present' && (
                              <span className="bg-emerald-100/90 text-emerald-950 border border-emerald-300 px-3 py-1 rounded-lg flex items-center gap-1.5">
                                <Lock size={12} className="text-emerald-700" />
                                <Check size={14} className="text-emerald-700" />
                                <span>PRESENT (PERMANENTLY LOCKED)</span>
                              </span>
                            )}
                            {currentStatus === 'Absent' && (
                              <span className="bg-rose-100/90 text-rose-950 border border-rose-300 px-3 py-1 rounded-lg flex items-center gap-1.5">
                                <Lock size={12} className="text-rose-700" />
                                <X size={14} className="text-rose-700" />
                                <span>ABSENT (PERMANENTLY LOCKED)</span>
                              </span>
                            )}
                            {currentStatus === 'Excused' && (
                              <span className="bg-amber-100/90 text-amber-950 border border-amber-300 px-3 py-1 rounded-lg flex items-center gap-1.5">
                                <Lock size={12} className="text-amber-700" />
                                <span>~ EXCUSED (PERMANENTLY LOCKED)</span>
                              </span>
                            )}
                          </div>
                        ) : (
                          /* Unlocked Active Selector for Selected Date */
                          <div className="inline-flex items-center p-1 bg-gray-100 rounded-xl gap-1 border border-gray-200">
                            <button
                              type="button"
                              onClick={() => handleSetStatus(student.id, 'Present')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                currentStatus === 'Present'
                                  ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-700'
                                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                              }`}
                            >
                              <Check size={13} />
                              <span>Present</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSetStatus(student.id, 'Absent')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                currentStatus === 'Absent'
                                  ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-700'
                                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                              }`}
                            >
                              <X size={13} />
                              <span>Absent</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleSetStatus(student.id, 'Excused')}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                currentStatus === 'Excused'
                                  ? 'bg-amber-500 text-white shadow-sm ring-1 ring-amber-600'
                                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                              }`}
                            >
                              <span>~ Excused</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500 text-xs">
                    No athletes found matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Lock Info Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <Lock size={14} className="text-amber-600 shrink-0" />
            <span>
              <strong>Permanent Attendance Rule:</strong> Once attendance is saved, it cannot be modified or deleted by Admin or Coach.
            </span>
          </div>

          {unmarkedCount > 0 && (
            <button
              type="button"
              onClick={() => setShowConfirmModal(true)}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-2"
            >
              <Lock size={14} className="text-yellow-300" />
              <span>Lock & Save ({unmarkedCount} Unmarked Athletes)</span>
            </button>
          )}
        </div>
      </div>

      {/* Confirmation Modal to Prevent Accidental Lock */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-emerald-100 animate-fade-in relative">
            <button 
              onClick={() => setShowConfirmModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl shrink-0">
                <Lock size={26} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">Lock Attendance Confirmation</h3>
                <p className="text-xs text-gray-500 font-mono">Training Date: {selectedDate}</p>
              </div>
            </div>

            <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-amber-950 space-y-2">
              <p className="font-bold flex items-center gap-1.5 text-amber-900">
                <ShieldAlert size={16} className="text-amber-700 shrink-0" />
                Attendance Once Marked CANNOT Be Changed!
              </p>
              <p className="text-[11px] leading-relaxed text-amber-900/90">
                You are about to permanently save and lock attendance for <strong>{unmarkedCount} athletes</strong> on <strong>{selectedDate}</strong> ({sessionType}).
              </p>
              <p className="text-[11px] font-bold text-rose-800">
                ⚠️ Neither Admin nor Coach will be permitted to edit or overwrite these attendance entries once confirmed.
              </p>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 cursor-pointer"
              >
                Cancel / Review
              </button>
              <button
                type="button"
                onClick={handleConfirmSaveAttendance}
                className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-md cursor-pointer"
                id="confirm-permanent-lock-btn"
              >
                <Lock size={14} className="text-yellow-300" />
                Yes, Permanently Lock & Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
