import React, { useState } from 'react';
import { Student, PerformanceMetric, FeeStatus } from '../types';
import { UserCheck, Activity, CreditCard, Lock, CheckCircle2, Clock, Check, Phone, Award } from 'lucide-react';

interface CoachPortalProps {
  students: Student[];
  metrics: PerformanceMetric[];
  fees: FeeStatus[];
  onAddMetric: (metric: Omit<PerformanceMetric, 'id'>) => void;
}

export default function CoachPortal({
  students,
  metrics,
  fees,
  onAddMetric
}: CoachPortalProps) {
  const [activeSubTab, setActiveSubTab] = useState<'attendance' | 'performance' | 'pending_fees'>('attendance');

  // Attendance Marking State
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionType, setSessionType] = useState('Tactical & Fitness Training');
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, 'Present' | 'Absent' | 'Excused'>>(() => {
    const initial: Record<string, 'Present' | 'Absent' | 'Excused'> = {};
    students.forEach(s => { initial[s.id] = 'Present'; });
    return initial;
  });
  const [sessionNotes, setSessionNotes] = useState('');

  // Performance Review State
  const [selectedStudentForReview, setSelectedStudentForReview] = useState<Student | null>(students[0] || null);
  const [reviewSpeed, setReviewSpeed] = useState<number>(4.8);
  const [reviewAgility, setReviewAgility] = useState<number>(4.9);
  const [reviewStamina, setReviewStamina] = useState<number>(8);
  const [reviewPassing, setReviewPassing] = useState<number>(8);
  const [reviewShooting, setReviewShooting] = useState<number>(7);
  const [reviewDefense, setReviewDefense] = useState<number>(8);
  const [reviewAttendance, setReviewAttendance] = useState<'Present' | 'Absent' | 'Excused'>('Present');
  const [reviewNotes, setReviewNotes] = useState('');

  // Feedback Alert State
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Check if attendance for student on sessionDate was marked > 2 hours ago
  const isAttendanceLocked = (studentId: string) => {
    const existing = metrics.find(m => m.studentId === studentId && m.date === sessionDate);
    if (!existing || !existing.markedAt) return false;
    const diffHours = (Date.now() - existing.markedAt) / (1000 * 60 * 60);
    return diffHours > 2;
  };

  // Toggle single player attendance status for batch entry
  const handleAttendanceToggle = (studentId: string, status: 'Present' | 'Absent' | 'Excused') => {
    if (isAttendanceLocked(studentId)) {
      setAlert({ type: 'error', message: 'Attendance once marked cannot be changed after 2 hours from the time it was recorded!' });
      return;
    }
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  // Save Batch Session Attendance
  const handleSaveBatchAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    let savedCount = 0;
    let lockedCount = 0;

    students.forEach(s => {
      if (isAttendanceLocked(s.id)) {
        lockedCount++;
        return;
      }

      onAddMetric({
        studentId: s.id,
        date: sessionDate,
        markedAt: Date.now(),
        speed: 5.0,
        agility: 5.0,
        stamina: 7,
        passing: 7,
        shooting: 7,
        defense: 7,
        attendance: attendanceRecords[s.id] || 'Present',
        notes: `[${sessionType}] ${sessionNotes || 'Daily session logged by Head Coach Abedemi Faniyan'}`
      });
      savedCount++;
    });

    if (lockedCount > 0) {
      setAlert({ 
        type: 'error', 
        message: `Saved attendance for ${savedCount} students. ${lockedCount} student records were locked (>2hrs since initial marking) and could not be edited.` 
      });
    } else {
      setAlert({ type: 'success', message: `Successfully logged training attendance for ${students.length} athletes on ${sessionDate}!` });
    }
    setSessionNotes('');
    setTimeout(() => setAlert(null), 6000);
  };

  // Save Individual Detailed Performance Review
  const handleSavePerformanceReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForReview) return;

    onAddMetric({
      studentId: selectedStudentForReview.id,
      date: sessionDate,
      speed: Number(reviewSpeed),
      agility: Number(reviewAgility),
      stamina: Number(reviewStamina),
      passing: Number(reviewPassing),
      shooting: Number(reviewShooting),
      defense: Number(reviewDefense),
      attendance: reviewAttendance,
      notes: reviewNotes || `Performance review logged by Coach Abedemi Faniyan`
    });

    setAlert({ type: 'success', message: `Performance review report saved for ${selectedStudentForReview.name}!` });
    setReviewNotes('');
    setTimeout(() => setAlert(null), 5000);
  };

  // Filter pending or overdue fees
  const pendingOrOverdueFees = fees.filter(f => f.status === 'Pending' || f.status === 'Overdue');

  return (
    <div className="space-y-6" id="coach-portal-root">
      
      {/* Coach Welcome & Sub-navigation Header */}
      <div className="bg-emerald-950 border border-emerald-800 text-white p-4 sm:p-6 rounded-2xl shadow-md space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest block">Coach Portal — KSSB FC</span>
            <h2 className="text-2xl font-bold font-sans flex items-center gap-2">
              <Award className="text-amber-400 shrink-0" size={26} />
              Welcome, Coach Abedemi Faniyan
            </h2>
            <p className="text-xs text-emerald-200">
              Manage daily player attendance, record physical & technical drill reviews, monitor pending tuition dues, and select match squads.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-emerald-900/80 p-2 rounded-xl border border-emerald-700/60 text-xs">
            <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 font-bold rounded-md">Head Coach</span>
            <span className="text-emerald-200">Active Squad: <strong>{students.length} Athletes</strong></span>
          </div>
        </div>

        {/* Coach Navigation Tabs */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-emerald-800/80">
          <button 
            onClick={() => setActiveSubTab('attendance')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'attendance' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-emerald-900/50 text-emerald-200 hover:bg-emerald-900'
            }`}
          >
            <UserCheck size={16} />
            Attendance Marking
          </button>

          <button 
            onClick={() => setActiveSubTab('performance')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'performance' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-emerald-900/50 text-emerald-200 hover:bg-emerald-900'
            }`}
          >
            <Activity size={16} />
            Player Performance Reviews
          </button>

          <button 
            onClick={() => setActiveSubTab('pending_fees')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'pending_fees' ? 'bg-amber-600 text-white shadow-sm' : 'bg-emerald-900/50 text-emerald-200 hover:bg-emerald-900'
            }`}
          >
            <CreditCard size={16} />
            Pending Fees Monitor ({pendingOrOverdueFees.length})
          </button>
        </div>
      </div>

      {/* Alert Banner */}
      {alert && (
        <div className={`p-4 rounded-xl border text-sm font-semibold flex items-center justify-between shadow-sm ${
          alert.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className="flex items-center gap-2">
            <Check size={18} className="shrink-0" />
            {alert.message}
          </div>
          <button onClick={() => setAlert(null)} className="font-bold text-gray-400 hover:text-gray-600 cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* 1. ATTENDANCE MARKING */}
      {activeSubTab === 'attendance' && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 space-y-6 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-gray-100">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <UserCheck size={22} className="text-emerald-700" />
                Session Attendance Marking
              </h3>
              <p className="text-xs text-gray-500">Quickly mark Present, Absent, or Excused for all squad athletes during training sessions.</p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div>
                <label className="text-[10px] font-mono font-bold text-gray-500 uppercase block">Training Date</label>
                <input 
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold"
                />
              </div>
              <div className="grow md:grow-0">
                <label className="text-[10px] font-mono font-bold text-gray-500 uppercase block">Session Type</label>
                <select 
                  value={sessionType}
                  onChange={(e) => setSessionType(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold bg-white w-full"
                >
                  <option value="Tactical & Fitness Training">Tactical & Fitness Training</option>
                  <option value="Match Day Practice">Match Day Practice</option>
                  <option value="Physical Conditioning">Physical Conditioning</option>
                  <option value="Recovery Session">Recovery Session</option>
                </select>
              </div>
            </div>
          </div>

          {/* Roster Attendance Entry */}
          <form onSubmit={handleSaveBatchAttendance} className="space-y-6">
            {/* Mobile Vertical View for Portrait Phones */}
            <div className="block sm:hidden space-y-3">
              {students.map(s => {
                const locked = isAttendanceLocked(s.id);
                const currentStatus = attendanceRecords[s.id] || 'Present';
                return (
                  <div key={s.id} className="p-4 bg-gray-50/80 border border-gray-200 rounded-2xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-gray-900 text-base">{s.name}</div>
                        <div className="text-xs text-gray-500 font-mono">Reg: {s.registrationNumber || 'KSSBFC0001/26-27'}</div>
                      </div>
                      <span className="px-2.5 py-1 rounded bg-white border border-gray-200 text-gray-800 font-mono text-[10px] font-bold">
                        {s.position}
                      </span>
                    </div>

                    <div className="text-xs text-gray-600 space-y-0.5">
                      <div>Guardian: <strong>{s.fatherName || s.parentName}</strong></div>
                      <div>Contact: <a href={`tel:${s.mobileNo || s.parentPhone}`} className="font-mono text-emerald-700 font-bold underline">{s.mobileNo || s.parentPhone}</a></div>
                    </div>

                    <div>
                      {locked ? (
                        <div className="flex items-center justify-center gap-1.5 p-2 bg-gray-100 text-gray-500 rounded-xl text-xs font-bold border border-gray-200">
                          <Lock size={14} className="text-amber-600" />
                          <span>Locked ({currentStatus}) — Marked &gt;2 hrs ago</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleAttendanceToggle(s.id, 'Present')}
                            className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                              currentStatus === 'Present' ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            ✓ Present
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAttendanceToggle(s.id, 'Absent')}
                            className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                              currentStatus === 'Absent' ? 'bg-rose-600 text-white shadow-sm ring-2 ring-rose-600' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            ✕ Absent
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAttendanceToggle(s.id, 'Excused')}
                            className={`py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                              currentStatus === 'Excused' ? 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-500' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            ~ Excused
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden sm:block border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-mono uppercase">
                  <tr>
                    <th className="p-3">Athlete Name</th>
                    <th className="p-3">Position</th>
                    <th className="p-3">Parent Contact</th>
                    <th className="p-3 text-center">Attendance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {students.map(s => {
                    const locked = isAttendanceLocked(s.id);
                    const currentStatus = attendanceRecords[s.id] || 'Present';
                    return (
                      <tr key={s.id} className="hover:bg-gray-50/60">
                        <td className="p-3">
                          <div className="font-bold text-gray-900 text-sm">{s.name}</div>
                          <div className="text-[11px] text-gray-500 font-mono">Reg: {s.registrationNumber || 'KSSBFC0001/26-27'}</div>
                        </td>
                        <td className="p-3">
                          <span className="px-2.5 py-1 rounded bg-gray-100 text-gray-700 font-mono text-[10px] font-bold">
                            {s.position}
                          </span>
                        </td>
                        <td className="p-3 text-gray-600">
                          <div>{s.fatherName || s.parentName}</div>
                          <div className="text-[11px] text-gray-400 font-mono">{s.mobileNo || s.parentPhone}</div>
                        </td>
                        <td className="p-3">
                          {locked ? (
                            <div className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-xs font-bold border border-gray-200">
                              <Lock size={14} className="text-amber-600" />
                              <span>Locked ({currentStatus}) — Marked &gt;2 hrs ago</span>
                            </div>
                          ) : (
                            <div className="flex justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleAttendanceToggle(s.id, 'Present')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  currentStatus === 'Present' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                Present
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAttendanceToggle(s.id, 'Absent')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  currentStatus === 'Absent' ? 'bg-rose-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                Absent
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAttendanceToggle(s.id, 'Excused')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  currentStatus === 'Excused' ? 'bg-amber-500 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                Excused
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-gray-700 uppercase">Coach Session Notes</label>
              <input 
                type="text"
                value={sessionNotes}
                onChange={(e) => setSessionNotes(e.target.value)}
                placeholder="e.g. Focus on high-pressing drills and quick transition passes."
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div className="flex justify-end">
              <button 
                type="submit"
                className="w-full sm:w-auto px-6 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <CheckCircle2 size={18} />
                Save Session Attendance
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. PLAYER PERFORMANCE REVIEWS */}
      {activeSubTab === 'performance' && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="space-y-1 pb-4 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Activity size={22} className="text-emerald-700" />
              Player Performance Review Logger
            </h3>
            <p className="text-xs text-gray-500">Log physical benchmarks (40yd dash speed, agility shuttle) and technical skill ratings with coach feedback.</p>
          </div>

          <form onSubmit={handleSavePerformanceReview} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-gray-700 uppercase">Select Athlete to Review</label>
                <select 
                  value={selectedStudentForReview?.id || ''}
                  onChange={(e) => {
                    const st = students.find(s => s.id === e.target.value);
                    if (st) setSelectedStudentForReview(st);
                  }}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold bg-white"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.position} — Age {s.age})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-gray-700 uppercase">Evaluation Date</label>
                <input 
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold"
                />
              </div>
            </div>

            {/* Drill Scores Sliders/Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 flex justify-between">
                  <span>40yd Dash Speed (sec)</span>
                  <span className="text-emerald-700 font-mono">{reviewSpeed}s</span>
                </label>
                <input 
                  type="number" 
                  step="0.1" 
                  min="3.0" 
                  max="10.0"
                  value={reviewSpeed}
                  onChange={(e) => setReviewSpeed(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 flex justify-between">
                  <span>Cone Agility Run (sec)</span>
                  <span className="text-emerald-700 font-mono">{reviewAgility}s</span>
                </label>
                <input 
                  type="number" 
                  step="0.1" 
                  min="3.0" 
                  max="10.0"
                  value={reviewAgility}
                  onChange={(e) => setReviewAgility(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 flex justify-between">
                  <span>Stamina Rating (1-10)</span>
                  <span className="text-emerald-700 font-mono">{reviewStamina}/10</span>
                </label>
                <input 
                  type="number" 
                  min="1" 
                  max="10"
                  value={reviewStamina}
                  onChange={(e) => setReviewStamina(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 flex justify-between">
                  <span>Passing Accuracy (1-10)</span>
                  <span className="text-emerald-700 font-mono">{reviewPassing}/10</span>
                </label>
                <input 
                  type="number" 
                  min="1" 
                  max="10"
                  value={reviewPassing}
                  onChange={(e) => setReviewPassing(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 flex justify-between">
                  <span>Shooting Technique (1-10)</span>
                  <span className="text-emerald-700 font-mono">{reviewShooting}/10</span>
                </label>
                <input 
                  type="number" 
                  min="1" 
                  max="10"
                  value={reviewShooting}
                  onChange={(e) => setReviewShooting(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 flex justify-between">
                  <span>Defensive Positioning (1-10)</span>
                  <span className="text-emerald-700 font-mono">{reviewDefense}/10</span>
                </label>
                <input 
                  type="number" 
                  min="1" 
                  max="10"
                  value={reviewDefense}
                  onChange={(e) => setReviewDefense(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-gray-700 uppercase">Coach Abedemi Faniyan's Feedback Notes</label>
              <textarea 
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="e.g. Excellent tactical awareness during 2-on-1 fast breaks. Needs to work on weaker foot passing under pressure."
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none"
              />
            </div>

            <div className="flex justify-end">
              <button 
                type="submit"
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Award size={18} />
                Save Performance Review
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. PENDING FEES OF STUDENTS */}
      {activeSubTab === 'pending_fees' && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 sm:p-6 space-y-6 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-gray-100">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <CreditCard size={22} className="text-amber-600" />
                Student Pending Fees Monitor
              </h3>
              <p className="text-xs text-gray-500">
                Monitor student athletes with pending or overdue tuition & admission dues to follow up with parents.
              </p>
            </div>

            <div className="px-3.5 py-2 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-900 flex items-center gap-2">
              <Clock size={16} className="text-amber-600" />
              <span>Pending / Overdue Count: <strong>{pendingOrOverdueFees.length} Dues</strong></span>
            </div>
          </div>

          {/* Mobile Vertical Cards View */}
          <div className="block sm:hidden space-y-3">
            {pendingOrOverdueFees.length > 0 ? (
              pendingOrOverdueFees.map(f => {
                const student = students.find(s => s.id === f.studentId);
                return (
                  <div key={f.id} className="p-4 bg-amber-50/30 border border-amber-200/80 rounded-2xl space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold text-gray-900 text-base">{student?.name || 'Athlete'}</div>
                        <div className="text-xs text-gray-500">Position: {student?.position}</div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        f.status === 'Overdue' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {f.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-amber-100 text-xs">
                      <span className="text-gray-600">Cycle: <strong>{f.month}</strong></span>
                      <span className="font-mono font-bold text-amber-900 text-sm">₹{f.amount}.00</span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <div className="text-gray-500">Parent: {student?.parentName}</div>
                        <div className="font-mono text-gray-800 font-semibold">{student?.parentPhone}</div>
                      </div>
                      <a 
                        href={`tel:${student?.parentPhone}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 transition-colors shadow-sm"
                      >
                        <Phone size={13} />
                        Call
                      </a>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8 text-emerald-700 font-semibold text-xs">
                🎉 Great news! All student tuition and admission fees are fully paid!
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-mono uppercase">
                <tr>
                  <th className="p-3">Athlete</th>
                  <th className="p-3">Billing Cycle</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Parent Mobile</th>
                  <th className="p-3 text-right">Coach Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {pendingOrOverdueFees.length > 0 ? (
                  pendingOrOverdueFees.map(f => {
                    const student = students.find(s => s.id === f.studentId);
                    return (
                      <tr key={f.id} className="hover:bg-amber-50/20">
                        <td className="p-3">
                          <div className="font-bold text-gray-900 text-sm">{student?.name || 'Athlete'}</div>
                          <div className="text-[11px] text-gray-500">Position: {student?.position}</div>
                        </td>
                        <td className="p-3 font-semibold text-gray-700">{f.month}</td>
                        <td className="p-3 font-mono font-bold text-gray-950">₹{f.amount}.00</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                            f.status === 'Overdue' ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {f.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="font-mono text-gray-800 font-semibold">{student?.parentPhone}</div>
                          <div className="text-[11px] text-gray-500">{student?.parentName}</div>
                        </td>
                        <td className="p-3 text-right">
                          <a 
                            href={`tel:${student?.parentPhone}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 transition-colors"
                          >
                            <Phone size={14} />
                            Call Parent
                          </a>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-emerald-700 font-semibold">
                      🎉 Great news! All student tuition and admission fees are fully paid!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
