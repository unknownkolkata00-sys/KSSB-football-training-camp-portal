import React, { useState } from 'react';
import { Student, PerformanceMetric, FeeStatus, Tournament, GalleryImage } from '../types';
import { UserCheck, Activity, CreditCard, Lock, CheckCircle2, Clock, Check, Phone, Award, ArrowLeft, Trophy, Camera } from 'lucide-react';
import TournamentScheduler from './TournamentScheduler';
import GalleryView from './GalleryView';
import DailyAttendanceRegister from './DailyAttendanceRegister';
import kssbFcLogo from '../assets/images/kssb_fc_official_logo.jpg';
import StudentAvatar from './StudentAvatar';

interface CoachPortalProps {
  students: Student[];
  metrics: PerformanceMetric[];
  fees: FeeStatus[];
  tournaments?: Tournament[];
  galleryImages?: GalleryImage[];
  onAddMetric: (metric: Omit<PerformanceMetric, 'id'>) => void;
  onUpdateTournament?: (tournament: Tournament) => void;
  onAddGalleryImage?: (image: Omit<GalleryImage, 'id' | 'date'>) => void;
  onDeleteGalleryImage?: (id: string) => void;
}

export default function CoachPortal({
  students,
  metrics,
  fees,
  tournaments = [],
  galleryImages = [],
  onAddMetric,
  onUpdateTournament,
  onAddGalleryImage,
  onDeleteGalleryImage
}: CoachPortalProps) {
  const [activeSubTab, setActiveSubTab] = useState<'attendance' | 'performance' | 'tournaments' | 'gallery' | 'pending_fees'>('attendance');

  // Performance Review State
  const [reviewDate, setReviewDate] = useState(new Date().toISOString().split('T')[0]);
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

  // Check if attendance for student on reviewDate is already recorded
  const getExistingAttendance = (studentId: string, date: string) => {
    return metrics.find(m => m.studentId === studentId && m.date === date);
  };

  // Save Individual Detailed Performance Review
  const handleSavePerformanceReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForReview) return;

    const existingRecord = getExistingAttendance(selectedStudentForReview.id, reviewDate);
    // If attendance is already marked and locked, preserve the existing attendance status
    const finalAttendance = existingRecord ? existingRecord.attendance : reviewAttendance;

    onAddMetric({
      studentId: selectedStudentForReview.id,
      date: reviewDate,
      markedAt: existingRecord?.markedAt || Date.now(),
      speed: Number(reviewSpeed),
      agility: Number(reviewAgility),
      stamina: Number(reviewStamina),
      passing: Number(reviewPassing),
      shooting: Number(reviewShooting),
      defense: Number(reviewDefense),
      attendance: finalAttendance,
      notes: reviewNotes || `Performance review logged by Coach Abedemi Faniyan`
    });

    setAlert({ type: 'success', message: `Performance drill review saved for ${selectedStudentForReview.name} on ${reviewDate}!` });
    setReviewNotes('');
    setTimeout(() => setAlert(null), 5000);
  };

  // Filter pending or overdue fees starting from August 2026 onwards for active, non-deleted players
  const activeStudentIds = new Set(students.filter(s => s.status !== 'Inactive').map(s => s.id));
  const pendingOrOverdueFees = fees.filter(f => {
    if (!activeStudentIds.has(f.studentId)) return false;
    if (f.status !== 'Pending' && f.status !== 'Overdue') return false;
    if (f.month === 'June 2026' || f.month === 'July 2026') return false;
    return true;
  });

  return (
    <div className="space-y-6" id="coach-portal-root">
      
      {/* Back to Dashboard Navigation Header Bar */}
      {activeSubTab !== 'attendance' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-3.5 px-5 rounded-2xl border border-slate-800 text-slate-100 shadow-md" id="coach-back-to-dashboard-bar">
          <button
            onClick={() => setActiveSubTab('attendance')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm border border-emerald-400/30 w-fit"
            id="coach-back-to-dashboard-btn"
          >
            <ArrowLeft size={16} /> Back to Attendance & Main Dashboard
          </button>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>Active Coach View:</span>
            <span className="px-2.5 py-1 bg-slate-800 text-yellow-400 font-bold rounded-lg text-[11px] uppercase tracking-wider border border-slate-700">
              {activeSubTab.replace('_', ' ')}
            </span>
          </div>
        </div>
      )}

      {/* Coach Welcome & Sub-navigation Header */}
      <div className="bg-emerald-950 border border-emerald-800 text-white p-4 sm:p-6 rounded-2xl shadow-md space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3.5">
            <img 
              src={kssbFcLogo || '/logo.jpg'} 
              onError={(e) => {
                const img = e.currentTarget as HTMLImageElement;
                img.onerror = null;
                img.src = '/logo.jpg';
              }}
              alt="KSSB FC Official Crest" 
              className="w-14 h-14 rounded-xl border-2 border-amber-400/80 object-cover bg-slate-900 shadow-md shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest block">Coach Portal — KSSB FC</span>
              <h2 className="text-xl sm:text-2xl font-bold font-sans flex items-center gap-2">
                Welcome, Coach Abedemi Faniyan
              </h2>
              <p className="text-xs text-emerald-200">
                Manage daily player attendance, record physical & technical drill reviews, monitor pending tuition dues, and select match squads.
              </p>
            </div>
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
            onClick={() => setActiveSubTab('tournaments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'tournaments' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-emerald-900/50 text-emerald-200 hover:bg-emerald-900'
            }`}
          >
            <Trophy size={16} />
            Team Squad Selection
          </button>

          <button 
            onClick={() => setActiveSubTab('gallery')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'gallery' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-emerald-900/50 text-emerald-200 hover:bg-emerald-900'
            }`}
          >
            <Camera size={16} />
            Photo Gallery
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

      {/* Back Navigation Bar for Coach Portal */}
      {activeSubTab !== 'attendance' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-3.5 px-5 rounded-2xl border border-slate-800 text-slate-100 shadow-md" id="coach-back-to-overview-bar">
          <button
            onClick={() => setActiveSubTab('attendance')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm border border-emerald-400/30 w-fit"
            id="coach-back-to-overview-btn"
          >
            <ArrowLeft size={16} /> Back to Attendance Marking & Main Overview
          </button>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>Active Coach Module:</span>
            <span className="px-2.5 py-1 bg-slate-800 text-yellow-400 font-bold rounded-lg text-[11px] uppercase tracking-wider border border-slate-700">
              {activeSubTab.replace('_', ' ')}
            </span>
          </div>
        </div>
      )}

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
        <DailyAttendanceRegister 
          students={students}
          metrics={metrics}
          onAddMetric={onAddMetric}
          userRole="coach"
        />
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
                  value={reviewDate}
                  onChange={(e) => setReviewDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold"
                />
              </div>
            </div>

            {/* Attendance Status for this Date */}
            {selectedStudentForReview && (() => {
              const existingRecord = getExistingAttendance(selectedStudentForReview.id, reviewDate);
              if (existingRecord) {
                return (
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-mono text-emerald-950 font-bold">
                      <Lock size={15} className="text-emerald-700" />
                      <span>Attendance on {reviewDate}: <strong className="text-emerald-800 uppercase underline">{existingRecord.attendance}</strong></span>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-200/80 text-emerald-900 text-[10px] font-mono font-bold rounded-lg">
                      🔒 Permanently Locked
                    </span>
                  </div>
                );
              }
              return (
                <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold text-amber-950 uppercase flex items-center gap-1.5">
                      <Clock size={14} className="text-amber-700" />
                      <span>Set Session Attendance for {reviewDate}</span>
                    </label>
                    <span className="text-[10px] font-mono text-amber-800">Will be permanently locked upon saving</span>
                  </div>
                  <div className="flex gap-2">
                    {(['Present', 'Absent', 'Excused'] as const).map(status => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setReviewAttendance(status)}
                        className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          reviewAttendance === status
                            ? status === 'Present' ? 'bg-emerald-600 text-white' : status === 'Absent' ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                            : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

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

      {/* 3. TEAM SQUAD SELECTION */}
      {activeSubTab === 'tournaments' && (
        <TournamentScheduler 
          tournaments={tournaments}
          students={students}
          metrics={metrics}
          userRole="coach"
          onAddTournament={() => {}}
          onUpdateTournament={onUpdateTournament || (() => {})}
        />
      )}

      {/* 4. PHOTO GALLERY (COACH VIEW) */}
      {activeSubTab === 'gallery' && (
        <GalleryView 
          galleryImages={galleryImages}
          onAddImage={onAddGalleryImage || (() => {})}
          onDeleteImage={onDeleteGalleryImage || (() => {})}
          role="coach"
        />
      )}

      {/* 5. PENDING FEES OF STUDENTS */}
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
