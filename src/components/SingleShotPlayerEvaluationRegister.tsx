import React, { useState, useMemo, useEffect } from 'react';
import { Student, PerformanceMetric } from '../types';
import { 
  Award, 
  Search, 
  Calendar, 
  Download, 
  Check, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Lock, 
  Filter, 
  Activity, 
  Sparkles, 
  RefreshCw, 
  Save, 
  ShieldCheck,
  TrendingUp,
  Zap,
  ArrowLeft,
  ArrowRight,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import StudentAvatar from './StudentAvatar';
import { downloadAttendanceReportCSV } from '../utils/reports';

interface SingleShotPlayerEvaluationRegisterProps {
  students: Student[];
  metrics: PerformanceMetric[];
  onAddMetric: (metric: Omit<PerformanceMetric, 'id'>) => void;
  userRole?: 'admin' | 'coach';
}

interface PlayerEvaluationRowState {
  speed: number;
  agility: number;
  stamina: number;
  passing: number;
  shooting: number;
  defense: number;
  notes: string;
  isDirty?: boolean;
}

export default function SingleShotPlayerEvaluationRegister({
  students,
  metrics,
  onAddMetric,
  userRole = 'admin'
}: SingleShotPlayerEvaluationRegisterProps) {
  // Selected Evaluation Date (Defaults to today in YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [sessionType, setSessionType] = useState<string>('Tactical & Fitness Drills Assessment');
  const [globalCoachNotes, setGlobalCoachNotes] = useState<string>('');
  
  // Real-time filter & search
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [positionFilter, setPositionFilter] = useState<string>('All');
  
  // Local state for all athletes' evaluation marks for the selected date
  const [evaluationRows, setEvaluationRows] = useState<Record<string, PlayerEvaluationRowState>>({});
  
  // Alert banner
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Saving indicator
  const [isSavingAll, setIsSavingAll] = useState<boolean>(false);

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

  // Existing metrics map for the selected date
  const existingMetricsForDate = useMemo(() => {
    const map: Record<string, PerformanceMetric> = {};
    metrics.forEach(m => {
      if (m.date === selectedDate) {
        if (!map[m.studentId] || (m.markedAt && map[m.studentId].markedAt && m.markedAt > (map[m.studentId].markedAt || 0))) {
          map[m.studentId] = m;
        }
      }
    });
    return map;
  }, [metrics, selectedDate]);

  // Most recent metric for each student (across all dates) to serve as default baselines
  const latestMetricMap = useMemo(() => {
    const map: Record<string, PerformanceMetric> = {};
    const sorted = [...metrics].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    sorted.forEach(m => {
      map[m.studentId] = m;
    });
    return map;
  }, [metrics]);

  // Initialize or re-populate row evaluation state whenever selectedDate or students change
  useEffect(() => {
    const nextState: Record<string, PlayerEvaluationRowState> = {};
    
    sequenceSortedStudents.forEach(s => {
      const existingForDay = existingMetricsForDate[s.id];
      const previousMetric = latestMetricMap[s.id];

      if (existingForDay) {
        nextState[s.id] = {
          speed: existingForDay.speed,
          agility: existingForDay.agility,
          stamina: existingForDay.stamina,
          passing: existingForDay.passing,
          shooting: existingForDay.shooting,
          defense: existingForDay.defense,
          notes: existingForDay.notes || '',
          isDirty: false
        };
      } else if (previousMetric) {
        nextState[s.id] = {
          speed: previousMetric.speed || 5.0,
          agility: previousMetric.agility || 5.0,
          stamina: previousMetric.stamina || 7,
          passing: previousMetric.passing || 7,
          shooting: previousMetric.shooting || 7,
          defense: previousMetric.defense || 7,
          notes: '',
          isDirty: false
        };
      } else {
        nextState[s.id] = {
          speed: 5.0,
          agility: 5.0,
          stamina: 7,
          passing: 7,
          shooting: 7,
          defense: 7,
          notes: '',
          isDirty: false
        };
      }
    });

    setEvaluationRows(nextState);
  }, [selectedDate, sequenceSortedStudents, existingMetricsForDate, latestMetricMap]);

  // Update a specific field for a student
  const handleFieldChange = <K extends keyof PlayerEvaluationRowState>(
    studentId: string, 
    field: K, 
    value: PlayerEvaluationRowState[K]
  ) => {
    setEvaluationRows(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
        isDirty: true
      }
    }));
  };

  // Filter students by search and position
  const filteredStudents = useMemo(() => {
    return sequenceSortedStudents.filter(s => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch = !term || 
        s.name.toLowerCase().includes(term) || 
        (s.registrationNumber || '').toLowerCase().includes(term) ||
        (s.mobileNo || '').includes(term);
      const matchesPos = positionFilter === 'All' || s.position === positionFilter;
      return matchesSearch && matchesPos;
    });
  }, [sequenceSortedStudents, searchTerm, positionFilter]);

  // Save single student's evaluation
  const handleSaveSingleStudent = (studentId: string) => {
    const row = evaluationRows[studentId];
    if (!row) return;

    const existingMetric = existingMetricsForDate[studentId];
    const finalAttendance = existingMetric ? existingMetric.attendance : 'Present';
    const now = existingMetric?.markedAt || Date.now();

    const studentObj = students.find(s => s.id === studentId);
    const noteText = row.notes 
      ? row.notes.trim() 
      : (globalCoachNotes ? `[${sessionType}] ${globalCoachNotes.trim()}` : `[${sessionType}] Evaluation recorded`);

    onAddMetric({
      studentId,
      date: selectedDate,
      markedAt: now,
      speed: Number(row.speed) || 5.0,
      agility: Number(row.agility) || 5.0,
      stamina: Math.max(1, Math.min(10, Number(row.stamina) || 7)),
      passing: Math.max(1, Math.min(10, Number(row.passing) || 7)),
      shooting: Math.max(1, Math.min(10, Number(row.shooting) || 7)),
      defense: Math.max(1, Math.min(10, Number(row.defense) || 7)),
      attendance: finalAttendance,
      notes: noteText
    });

    setEvaluationRows(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        isDirty: false
      }
    }));

    setAlert({
      type: 'success',
      message: `Saved evaluation marks for ${studentObj?.name || 'athlete'} on ${selectedDate}!`
    });
    setTimeout(() => setAlert(null), 4000);
  };

  // Save ALL students' evaluation marks in a single shot
  const handleSaveAllEvaluations = () => {
    setIsSavingAll(true);
    let count = 0;
    const now = Date.now();

    sequenceSortedStudents.forEach(s => {
      const row = evaluationRows[s.id] || {
        speed: 5.0,
        agility: 5.0,
        stamina: 7,
        passing: 7,
        shooting: 7,
        defense: 7,
        notes: ''
      };

      const existingMetric = existingMetricsForDate[s.id];
      const finalAttendance = existingMetric ? existingMetric.attendance : 'Present';
      const recordTime = existingMetric?.markedAt || now;

      const noteText = row.notes && row.notes.trim() 
        ? row.notes.trim() 
        : (globalCoachNotes ? `[${sessionType}] ${globalCoachNotes.trim()}` : `[${sessionType}] Evaluation benchmark saved`);

      onAddMetric({
        studentId: s.id,
        date: selectedDate,
        markedAt: recordTime,
        speed: Number(row.speed) || 5.0,
        agility: Number(row.agility) || 5.0,
        stamina: Math.max(1, Math.min(10, Number(row.stamina) || 7)),
        passing: Math.max(1, Math.min(10, Number(row.passing) || 7)),
        shooting: Math.max(1, Math.min(10, Number(row.shooting) || 7)),
        defense: Math.max(1, Math.min(10, Number(row.defense) || 7)),
        attendance: finalAttendance,
        notes: noteText
      });
      count++;
    });

    // Mark all as non-dirty
    setEvaluationRows(prev => {
      const updated: Record<string, PlayerEvaluationRowState> = {};
      Object.keys(prev).forEach(id => {
        updated[id] = { ...prev[id], isDirty: false };
      });
      return updated;
    });

    setIsSavingAll(false);
    setAlert({
      type: 'success',
      message: `🎉 Successfully saved performance evaluations for all ${count} athletes on ${selectedDate} in a single shot!`
    });
    setTimeout(() => setAlert(null), 6000);
  };

  // Quick Preset: Set Baseline 7/10 and 5.0s for All Athletes
  const handleApplyBaselinePreset = () => {
    setEvaluationRows(prev => {
      const updated: Record<string, PlayerEvaluationRowState> = {};
      sequenceSortedStudents.forEach(s => {
        updated[s.id] = {
          speed: 5.0,
          agility: 5.0,
          stamina: 7,
          passing: 7,
          shooting: 7,
          defense: 7,
          notes: prev[s.id]?.notes || '',
          isDirty: true
        };
      });
      return updated;
    });

    setAlert({
      type: 'info',
      message: `Applied standard baseline (Speed: 5.0s, Agility: 5.0s, Ratings: 7/10) to all athletes. Click "Save All Evaluations" when done.`
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

  // Calculate stats for this date
  const totalAthletes = sequenceSortedStudents.length;
  const evaluatedCount = sequenceSortedStudents.filter(s => !!existingMetricsForDate[s.id]).length;
  const unsavedChangesCount = (Object.values(evaluationRows) as PlayerEvaluationRowState[]).filter(r => r.isDirty).length;

  return (
    <div className="space-y-4 sm:space-y-6" id="single-shot-evaluation-root">
      
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
            {alert.type === 'error' && <AlertCircle size={18} className="text-rose-700 shrink-0" />}
            {alert.type === 'info' && <Sparkles size={18} className="text-sky-700 shrink-0" />}
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

      {/* Main Header & Single-Shot Control Card */}
      <div className="bg-slate-900 border border-slate-800 text-white p-4 sm:p-5 rounded-3xl shadow-lg space-y-4" id="evaluation-header-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Title & Badge */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold rounded-lg flex items-center gap-1.5">
                <Award size={14} className="text-emerald-400" />
                Single-Shot Evaluation Matrix
              </span>
              <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-mono font-bold rounded-lg flex items-center gap-1">
                <Zap size={12} className="text-amber-400" />
                All Players Visible
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold font-sans flex items-center gap-2 text-white">
              Player Performance & Skills Evaluation Sheet
            </h2>
            <p className="text-xs text-slate-300">
              Grade every squad player at once with photos, natural sequence numbering (<strong className="text-emerald-400">#1 to #{totalAthletes}</strong>), speed/agility metrics, and tactical ratings.
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

        {/* Real-Time Session Metric Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
          
          <div className="bg-slate-800/70 border border-slate-700/70 p-2.5 rounded-2xl text-center">
            <div className="text-[10px] text-slate-400 font-mono uppercase font-bold">Total Squad Players</div>
            <div className="text-base font-black text-white font-mono">{totalAthletes}</div>
          </div>

          <div className="bg-slate-800/70 border border-slate-700/70 p-2.5 rounded-2xl text-center">
            <div className="text-[10px] text-slate-400 font-mono uppercase font-bold">Evaluated for Date</div>
            <div className="text-base font-black text-emerald-300 font-mono">{evaluatedCount} / {totalAthletes}</div>
          </div>

          <div className="bg-slate-800/70 border border-slate-700/70 p-2.5 rounded-2xl text-center">
            <div className="text-[10px] text-slate-400 font-mono uppercase font-bold">Unsaved Edits</div>
            <div className={`text-base font-black font-mono ${unsavedChangesCount > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`}>
              {unsavedChangesCount} players
            </div>
          </div>

          <div className="bg-emerald-950/80 border border-emerald-700/60 p-2 rounded-2xl flex items-center justify-center">
            <button
              onClick={handleSaveAllEvaluations}
              disabled={isSavingAll}
              className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
              id="header-save-all-evaluations-btn"
            >
              <Save size={14} />
              <span>{isSavingAll ? 'Saving...' : `Save All Evaluations`}</span>
            </button>
          </div>

        </div>
      </div>

      {/* Global Drill Type, Presets & Batch Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm space-y-3" id="evaluation-toolbar">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Search and Position Filter */}
          <div className="flex flex-wrap items-center gap-2 flex-1 max-w-xl">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text"
                placeholder="Search athlete by name, reg no (e.g. 0001)..."
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
              <option value="Defence">Defence</option>
              <option value="Midfield">Midfield</option>
              <option value="Forward">Forward</option>
              <option value="Winger">Winger</option>
            </select>
          </div>

          {/* Quick Presets & Export Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleApplyBaselinePreset}
              className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              title="Set standard baseline (5.0s, 7/10) for rapid editing"
            >
              <SlidersHorizontal size={13} className="text-amber-700" />
              <span>Fill Baseline Preset</span>
            </button>

            <button
              type="button"
              onClick={() => downloadAttendanceReportCSV(sequenceSortedStudents, metrics)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              title="Download Full Evaluation & Attendance CSV Report"
            >
              <Download size={14} />
              <span>CSV Report</span>
            </button>
          </div>

        </div>

        {/* Global Session Assessment Context Bar */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="w-full md:w-64 shrink-0">
            <label className="text-[10px] font-mono font-bold text-gray-500 uppercase block mb-1">Assessment Session Type</label>
            <select 
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-800 focus:outline-none"
            >
              <option value="Tactical & Fitness Drills Assessment">Tactical & Fitness Drills Assessment</option>
              <option value="Weekly Physical & Speed Benchmark">Weekly Physical & Speed Benchmark</option>
              <option value="Match Day Tactical Evaluation">Match Day Tactical Evaluation</option>
              <option value="Passing & Shooting Accuracy Drills">Passing & Shooting Accuracy Drills</option>
              <option value="Defensive Positioning & Agility Test">Defensive Positioning & Agility Test</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="text-[10px] font-mono font-bold text-gray-500 uppercase block mb-1">Default Assessment Notes (Applied to unmarked notes)</label>
            <input 
              type="text"
              value={globalCoachNotes}
              onChange={(e) => setGlobalCoachNotes(e.target.value)}
              placeholder="e.g. High intensity 3v2 counter-attacking drills and 40yd sprint benchmarks..."
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium focus:outline-none"
            />
          </div>

          <div className="shrink-0 self-end md:self-auto pt-2 md:pt-4">
            <button
              type="button"
              onClick={handleSaveAllEvaluations}
              disabled={isSavingAll}
              className="w-full md:w-auto px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer disabled:opacity-50"
              id="save-all-players-marks-btn"
            >
              <Save size={15} className="text-yellow-300" />
              <span>Save All Player Evaluations ({filteredStudents.length} Players)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Single-Screen Player Evaluation Matrix Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden" id="single-shot-evaluation-table-container">
        
        {/* Table Header Summary */}
        <div className="p-4 bg-gray-50/80 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">
              Squad Evaluation Matrix ({selectedDate})
            </span>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold rounded">
              {filteredStudents.length} of {totalAthletes} Players Shown
            </span>
          </div>

          <div className="text-[11px] font-mono text-gray-500 flex items-center gap-1.5">
            <Sparkles size={13} className="text-emerald-600" />
            <span>Ratings scale: Speed & Agility in seconds; Tactical skills 1 (lowest) to 10 (highest).</span>
          </div>
        </div>

        {/* High-Productivity Evaluation Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 text-slate-200 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800 select-none">
                <th className="py-3 px-3 text-center w-14">Seq #</th>
                <th className="py-3 px-4 min-w-[200px]">Player Name & Photo</th>
                <th className="py-3 px-2.5 text-center w-24">Sprint (sec)</th>
                <th className="py-3 px-2.5 text-center w-24">Agility (sec)</th>
                <th className="py-3 px-2 text-center w-20">Stamina (1-10)</th>
                <th className="py-3 px-2 text-center w-20">Passing (1-10)</th>
                <th className="py-3 px-2 text-center w-20">Shooting (1-10)</th>
                <th className="py-3 px-2 text-center w-20">Defense (1-10)</th>
                <th className="py-3 px-3 min-w-[180px]">Coach Remarks / Feedback</th>
                <th className="py-3 px-3 text-center w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const seqNum = parseRegistrationSeq(student);
                  const row = evaluationRows[student.id] || {
                    speed: 5.0,
                    agility: 5.0,
                    stamina: 7,
                    passing: 7,
                    shooting: 7,
                    defense: 7,
                    notes: '',
                    isDirty: false
                  };
                  const isSavedForDate = !!existingMetricsForDate[student.id];

                  return (
                    <tr 
                      key={student.id} 
                      className={`transition-colors ${
                        row.isDirty 
                          ? 'bg-amber-50/40 hover:bg-amber-50/60' 
                          : isSavedForDate 
                            ? 'bg-emerald-50/20 hover:bg-emerald-50/30' 
                            : 'hover:bg-gray-50/80'
                      }`}
                    >
                      {/* Natural Sequence Number */}
                      <td className="py-2.5 px-3 text-center align-middle">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-xl bg-slate-900 text-yellow-400 font-mono font-black text-xs shadow-xs border border-slate-800">
                          #{seqNum}
                        </span>
                      </td>

                      {/* Player Identity with Photo */}
                      <td className="py-2.5 px-4 align-middle">
                        <div className="flex items-center gap-2.5">
                          <StudentAvatar photoUrl={student.photoUrl} name={student.name} size="md" />
                          <div className="min-w-0">
                            <div className="font-bold text-gray-900 text-xs sm:text-sm truncate">
                              {student.name}
                            </div>
                            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-mono">
                              <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-800 font-semibold rounded border border-emerald-100">
                                {student.position}
                              </span>
                              <span className="truncate">Reg: {student.registrationNumber || `KSSBFC${String(seqNum).padStart(4, '0')}/26-27`}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Speed (40yd sprint in sec) */}
                      <td className="py-2 px-2 text-center align-middle">
                        <div className="relative">
                          <input 
                            type="number"
                            step="0.1"
                            min="3.0"
                            max="9.9"
                            value={row.speed}
                            onChange={(e) => handleFieldChange(student.id, 'speed', parseFloat(e.target.value) || 0)}
                            className="w-16 px-1.5 py-1.5 text-center font-mono font-bold text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                          <span className="text-[9px] text-gray-400 block font-mono">sec</span>
                        </div>
                      </td>

                      {/* Agility (Cone shuttle in sec) */}
                      <td className="py-2 px-2 text-center align-middle">
                        <div className="relative">
                          <input 
                            type="number"
                            step="0.1"
                            min="3.0"
                            max="9.9"
                            value={row.agility}
                            onChange={(e) => handleFieldChange(student.id, 'agility', parseFloat(e.target.value) || 0)}
                            className="w-16 px-1.5 py-1.5 text-center font-mono font-bold text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                          />
                          <span className="text-[9px] text-gray-400 block font-mono">sec</span>
                        </div>
                      </td>

                      {/* Stamina (1-10) */}
                      <td className="py-2 px-1 text-center align-middle">
                        <select
                          value={row.stamina}
                          onChange={(e) => handleFieldChange(student.id, 'stamina', parseInt(e.target.value, 10))}
                          className="w-14 px-1 py-1.5 text-center font-mono font-bold text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-indigo-900"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                            <option key={num} value={num}>{num}/10</option>
                          ))}
                        </select>
                      </td>

                      {/* Passing (1-10) */}
                      <td className="py-2 px-1 text-center align-middle">
                        <select
                          value={row.passing}
                          onChange={(e) => handleFieldChange(student.id, 'passing', parseInt(e.target.value, 10))}
                          className="w-14 px-1 py-1.5 text-center font-mono font-bold text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-900"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                            <option key={num} value={num}>{num}/10</option>
                          ))}
                        </select>
                      </td>

                      {/* Shooting (1-10) */}
                      <td className="py-2 px-1 text-center align-middle">
                        <select
                          value={row.shooting}
                          onChange={(e) => handleFieldChange(student.id, 'shooting', parseInt(e.target.value, 10))}
                          className="w-14 px-1 py-1.5 text-center font-mono font-bold text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-amber-900"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                            <option key={num} value={num}>{num}/10</option>
                          ))}
                        </select>
                      </td>

                      {/* Defense (1-10) */}
                      <td className="py-2 px-1 text-center align-middle">
                        <select
                          value={row.defense}
                          onChange={(e) => handleFieldChange(student.id, 'defense', parseInt(e.target.value, 10))}
                          className="w-14 px-1 py-1.5 text-center font-mono font-bold text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-teal-900"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                            <option key={num} value={num}>{num}/10</option>
                          ))}
                        </select>
                      </td>

                      {/* Coach Remarks / Notes */}
                      <td className="py-2 px-3 align-middle">
                        <input 
                          type="text"
                          value={row.notes}
                          onChange={(e) => handleFieldChange(student.id, 'notes', e.target.value)}
                          placeholder="e.g. Great vision, sharp weak foot..."
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </td>

                      {/* Action */}
                      <td className="py-2 px-3 text-center align-middle">
                        <button
                          type="button"
                          onClick={() => handleSaveSingleStudent(student.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer mx-auto ${
                            row.isDirty 
                              ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                              : isSavedForDate
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          title="Save evaluation for this athlete"
                        >
                          {row.isDirty ? (
                            <>
                              <Save size={13} />
                              <span>Save</span>
                            </>
                          ) : isSavedForDate ? (
                            <>
                              <Check size={13} className="text-emerald-700" />
                              <span>Saved</span>
                            </>
                          ) : (
                            <>
                              <Check size={13} />
                              <span>Log</span>
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-gray-500 text-xs">
                    No athletes found matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Floating/Sticky Save All Bar */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <Award size={16} className="text-emerald-700" />
            <span>
              <strong>Single-Shot Direct Matrix:</strong> Evaluation marks entered here are synchronized in real-time with athlete benchmark charts and cloud records.
            </span>
          </div>

          <button
            type="button"
            onClick={handleSaveAllEvaluations}
            disabled={isSavingAll}
            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            id="bottom-save-all-players-btn"
          >
            <Save size={16} className="text-yellow-300" />
            <span>{isSavingAll ? 'Saving Evaluations...' : `Save All Evaluations (${totalAthletes} Athletes)`}</span>
          </button>
        </div>

      </div>

    </div>
  );
}
