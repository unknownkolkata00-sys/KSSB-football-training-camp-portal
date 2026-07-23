import React, { useState } from 'react';
import { Tournament, Student, PerformanceMetric } from '../types';
import { Trophy, Calendar, MapPin, Clock, Plus, Check, X, Sparkles, Users, UserCheck, Shield, Star, Send, Lock, ChevronDown, Award } from 'lucide-react';

interface TournamentSchedulerProps {
  tournaments: Tournament[];
  students: Student[];
  metrics?: PerformanceMetric[];
  userRole?: 'admin' | 'coach' | 'student';
  loggedInStudentId?: string;
  onAddTournament: (tournament: Omit<Tournament, 'id'>) => void;
  onUpdateTournament: (tournament: Tournament) => void;
}

export default function TournamentScheduler({
  tournaments,
  students,
  metrics = [],
  userRole = 'admin',
  loggedInStudentId = '',
  onAddTournament,
  onUpdateTournament
}: TournamentSchedulerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMatchForSquad, setSelectedMatchForSquad] = useState<Tournament | null>(null);

  // Add Fixture State
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [opponent, setOpponent] = useState('');
  const [location, setLocation] = useState('');
  const [ageGroup, setAgeGroup] = useState('Under 16');
  const [departureTime, setDepartureTime] = useState('08:00 AM');

  // Squad Selection State (Coach nomination or Admin publication)
  const [startingXI, setStartingXI] = useState<string[]>(Array(11).fill(''));
  const [substitutes, setSubstitutes] = useState<string[]>([]);
  const [coachNotes, setCoachNotes] = useState('');

  const [alert, setAlert] = useState<string | null>(null);

  // Calculate quick stats per student for performance-based selection
  const getStudentPerformanceSummary = (studentId: string) => {
    const studentMetrics = metrics.filter(m => m.studentId === studentId);
    if (studentMetrics.length === 0) {
      return { attendanceRate: 100, avgStamina: 7, bestSpeed: null };
    }
    const present = studentMetrics.filter(m => m.attendance === 'Present').length;
    const rate = Math.round((present / studentMetrics.length) * 100);
    const speeds = studentMetrics.map(m => m.speed).filter(s => s > 0);
    const bestSpeed = speeds.length > 0 ? Math.min(...speeds) : null;
    const avgStamina = Math.round(studentMetrics.reduce((acc, m) => acc + (m.stamina || 7), 0) / studentMetrics.length);
    return { attendanceRate: rate, avgStamina, bestSpeed };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !opponent || !location) {
      setAlert('All tournament fields are required!');
      return;
    }

    onAddTournament({
      title,
      date,
      opponent,
      location,
      ageGroup,
      departureTime,
      status: 'Scheduled',
      selectedSquad: students.map(s => s.id),
      startingEleven: students.slice(0, 5).map(s => s.id)
    });

    setTitle('');
    setDate('');
    setOpponent('');
    setLocation('');
    setAgeGroup('Under 16');
    setDepartureTime('08:00 AM');
    setShowAddForm(false);
    setAlert('Successfully scheduled new tournament fixture!');
    setTimeout(() => setAlert(null), 4000);
  };

  const handleStatusChange = (tournament: Tournament, newStatus: 'Scheduled' | 'Completed' | 'Cancelled') => {
    onUpdateTournament({
      ...tournament,
      status: newStatus
    });
  };

  const openSquadModal = (t: Tournament) => {
    setSelectedMatchForSquad(t);
    if (userRole === 'coach' && t.proposedSquadByCoach) {
      // Fill from coach proposed
      const xi = [...t.proposedSquadByCoach.startingEleven];
      while (xi.length < 11) xi.push('');
      setStartingXI(xi);
      setSubstitutes(t.proposedSquadByCoach.substitutes || []);
      setCoachNotes(t.proposedSquadByCoach.notes || '');
    } else if (t.publishedSquadByAdmin) {
      const xi = [...t.publishedSquadByAdmin.startingEleven];
      while (xi.length < 11) xi.push('');
      setStartingXI(xi);
      setSubstitutes(t.publishedSquadByAdmin.substitutes || []);
      setCoachNotes('');
    } else {
      // Defaults
      const xi = students.slice(0, 11).map(s => s.id);
      while (xi.length < 11) xi.push('');
      setStartingXI(xi);
      setSubstitutes(students.slice(11).map(s => s.id));
      setCoachNotes('');
    }
  };

  const handleStartingXIDropdownChange = (index: number, studentId: string) => {
    const updated = [...startingXI];
    updated[index] = studentId;
    setStartingXI(updated);
  };

  const toggleSubstitute = (studentId: string) => {
    if (substitutes.includes(studentId)) {
      setSubstitutes(substitutes.filter(id => id !== studentId));
    } else {
      setSubstitutes([...substitutes, studentId]);
    }
  };

  const handleSaveCoachNomination = () => {
    if (!selectedMatchForSquad) return;
    const cleanXI = startingXI.filter(id => id !== '');
    const updated: Tournament = {
      ...selectedMatchForSquad,
      proposedSquadByCoach: {
        startingEleven: cleanXI,
        substitutes,
        notes: coachNotes,
        nominatedAt: new Date().toISOString()
      }
    };
    onUpdateTournament(updated);
    setAlert(`Coach Team Selection proposed to Admin for ${selectedMatchForSquad.title}! (${cleanXI.length} Starting XI, ${substitutes.length} Substitutes)`);
    setSelectedMatchForSquad(null);
    setTimeout(() => setAlert(null), 5000);
  };

  const handlePublishAdminFinal = () => {
    if (!selectedMatchForSquad) return;
    const cleanXI = startingXI.filter(id => id !== '');
    const updated: Tournament = {
      ...selectedMatchForSquad,
      publishedSquadByAdmin: {
        startingEleven: cleanXI,
        substitutes,
        publishedAt: new Date().toISOString()
      },
      isPublishedByAdmin: true,
      startingEleven: cleanXI,
      selectedSquad: [...cleanXI, ...substitutes]
    };
    onUpdateTournament(updated);
    setAlert(`FINAL MATCHDAY SQUAD PUBLISHED BY ADMIN for ${selectedMatchForSquad.title}! Displaying live to Coach and Students.`);
    setSelectedMatchForSquad(null);
    setTimeout(() => setAlert(null), 5000);
  };

  // Sort upcoming tournaments
  const sortedTournaments = [...tournaments].sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    return timeA - timeB;
  });

  return (
    <div className="space-y-6" id="tournament-scheduler-root">
      
      {/* Alert Banner */}
      {alert && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <Check size={18} className="text-emerald-600 shrink-0" />
            <span>{alert}</span>
          </div>
          <button onClick={() => setAlert(null)} className="text-gray-400 hover:text-gray-600 font-bold cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4" id="scheduler-header">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 font-sans tracking-tight">Match Fixtures & Performance-Based Team Selection</h2>
          <p className="text-xs sm:text-sm text-gray-500">
            {userRole === 'coach' 
              ? 'Select starting XI from dropdowns based on player performance metrics and submit proposed team list to Admin.'
              : userRole === 'admin'
              ? 'Review coach team selections and publish the official matchday squad for players and coaches.'
              : 'Check upcoming match details and view published matchday team lineups.'}
          </p>
        </div>
        
        {userRole === 'admin' && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
            id="add-fixture-btn"
          >
            <Plus size={16} />
            Schedule New Match
          </button>
        )}
      </div>

      {/* Add Match Modal */}
      {showAddForm && userRole === 'admin' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all" id="add-fixture-modal">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowAddForm(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <X size={20} />
            </button>
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase tracking-widest block">Admin Schedule</span>
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                <Sparkles size={20} className="text-emerald-600" />
                Schedule Match Fixture
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-gray-700 uppercase">Tournament / Event Title *</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Kolkata Youth League Knockout"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-gray-700 uppercase">Opponent Academy *</label>
                  <input 
                    type="text" 
                    value={opponent}
                    onChange={(e) => setOpponent(e.target.value)}
                    placeholder="e.g. East Bengal Youth FC"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-gray-700 uppercase">Age Group / Division</label>
                  <select 
                    value={ageGroup}
                    onChange={(e) => setAgeGroup(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold bg-white"
                  >
                    <option value="Under 12">Under 12 Division</option>
                    <option value="Under 14">Under 14 Division</option>
                    <option value="Under 16">Under 16 Division</option>
                    <option value="All Divisions">All Divisions</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-gray-700 uppercase">Event Date *</label>
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-gray-700 uppercase">Departure Time *</label>
                  <input 
                    type="text" 
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    placeholder="e.g. 08:30 AM"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-gray-700 uppercase">Turf / Stadium Location *</label>
                <input 
                  type="text" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Kadamtala Stadium Grounds, Field A"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 cursor-pointer shadow-sm"
                >
                  Schedule Match
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Team Selection Dropdown Selector Modal (Coach / Admin) */}
      {selectedMatchForSquad && (userRole === 'admin' || userRole === 'coach') && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-4 sm:p-6 space-y-6 shadow-2xl relative my-6 max-h-[90vh] overflow-y-auto border border-emerald-100">
            <button 
              onClick={() => setSelectedMatchForSquad(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 cursor-pointer z-10"
            >
              <X size={20} />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase tracking-widest block">
                {userRole === 'coach' ? 'Coach Team Selection (Performance-based)' : 'Admin Review & Squad Publication'}
              </span>
              <h3 className="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2">
                <Trophy size={20} className="text-emerald-700 shrink-0" />
                {selectedMatchForSquad.title} vs {selectedMatchForSquad.opponent}
              </h3>
              <p className="text-xs text-gray-500">
                Select starting players using performance metric indicators (Sprint speed, Stamina, Attendance rate).
              </p>
            </div>

            {/* Coach Proposal Alert if Admin is reviewing */}
            {userRole === 'admin' && selectedMatchForSquad.proposedSquadByCoach && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Star size={14} className="text-amber-600 shrink-0" />
                  Coach Abedemi's Proposed Squad (Submitted {selectedMatchForSquad.proposedSquadByCoach.nominatedAt?.slice(0, 10)})
                </div>
                {selectedMatchForSquad.proposedSquadByCoach.notes && (
                  <p className="italic text-gray-700">"{selectedMatchForSquad.proposedSquadByCoach.notes}"</p>
                )}
              </div>
            )}

            {/* Starting XI Dropdown Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                  <Star size={16} className="text-amber-500 fill-amber-400" />
                  Starting XI Lineup (Select from Dropdown)
                </h4>
                <span className="text-[11px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                  {startingXI.filter(id => id !== '').length} / 11 Selected
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Array.from({ length: 11 }).map((_, idx) => {
                  const currentSelectedId = startingXI[idx] || '';
                  const currentPerf = currentSelectedId ? getStudentPerformanceSummary(currentSelectedId) : null;

                  return (
                    <div key={idx} className="p-3 bg-gray-50/80 border border-gray-200 rounded-2xl space-y-1.5">
                      <div className="flex justify-between items-center text-[11px] font-mono font-bold text-gray-600">
                        <span>Position #{idx + 1}</span>
                        {currentPerf && (
                          <span className="text-emerald-700 font-bold">
                            Att: {currentPerf.attendanceRate}% | Stamina: {currentPerf.avgStamina}/10
                          </span>
                        )}
                      </div>

                      <select
                        value={currentSelectedId}
                        onChange={(e) => handleStartingXIDropdownChange(idx, e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:ring-2 focus:ring-emerald-600/20"
                      >
                        <option value="">-- Select Player for Position #{idx + 1} --</option>
                        {students.map(s => {
                          const perf = getStudentPerformanceSummary(s.id);
                          return (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.position}) - Speed: {perf.bestSpeed ? `${perf.bestSpeed}s` : 'N/A'}, Att: {perf.attendanceRate}%
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Substitutes Multi-Check */}
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                <Users size={16} className="text-emerald-700" />
                Select Substitutes / Reserve Squad ({substitutes.length})
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-2xl bg-gray-50/50">
                {students.map(s => {
                  const isSelectedInXI = startingXI.includes(s.id);
                  const isSub = substitutes.includes(s.id);
                  const perf = getStudentPerformanceSummary(s.id);

                  if (isSelectedInXI) return null; // Already in starting XI

                  return (
                    <label
                      key={s.id}
                      className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between cursor-pointer transition-all ${
                        isSub ? 'bg-emerald-100/70 border-emerald-300 text-emerald-950 font-bold' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSub}
                          onChange={() => toggleSubstitute(s.id)}
                          className="h-4 w-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                        />
                        <div>
                          <div className="font-bold">{s.name}</div>
                          <div className="text-[10px] text-gray-500 font-mono">{s.position} • Att: {perf.attendanceRate}%</div>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Coach Notes */}
            {userRole === 'coach' && (
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-gray-700 uppercase">Tactical Notes for Admin</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Selected Rahul as Forward due to exceptional sprint times this week..."
                  value={coachNotes}
                  onChange={(e) => setCoachNotes(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2.5 justify-end pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setSelectedMatchForSquad(null)}
                className="px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer text-center"
              >
                Cancel
              </button>

              {userRole === 'coach' && (
                <button
                  type="button"
                  onClick={handleSaveCoachNomination}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send size={15} /> Propose Team to Admin
                </button>
              )}

              {userRole === 'admin' && (
                <button
                  type="button"
                  onClick={handlePublishAdminFinal}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <Shield size={15} /> Publish Final Official Squad
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Match Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="tournament-fixtures-grid">
        {sortedTournaments.length > 0 ? (
          sortedTournaments.map(t => {
            const isPublished = t.isPublishedByAdmin;
            const publishedXI = t.publishedSquadByAdmin?.startingEleven || t.startingEleven || [];
            const publishedSubs = t.publishedSquadByAdmin?.substitutes || t.selectedSquad || [];
            const proposedXI = t.proposedSquadByCoach?.startingEleven || [];

            const isStudentInXI = loggedInStudentId ? publishedXI.includes(loggedInStudentId) : false;
            const isStudentInSub = loggedInStudentId ? publishedSubs.includes(loggedInStudentId) : false;

            return (
              <div 
                key={t.id} 
                className="p-5 bg-white border border-gray-200/80 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                id={`tournament-card-${t.id}`}
              >
                <div className="space-y-3">
                  {/* Status Badges */}
                  <div className="flex justify-between items-center gap-2">
                    <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-mono font-bold uppercase rounded-lg border border-emerald-200/60">
                      {t.ageGroup}
                    </span>
                    
                    {isPublished ? (
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-900 border border-amber-300 text-[10px] font-mono font-bold uppercase rounded-lg flex items-center gap-1">
                        <Shield size={10} className="text-amber-600" /> Published
                      </span>
                    ) : t.proposedSquadByCoach ? (
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-mono font-bold uppercase rounded-lg flex items-center gap-1">
                        <Clock size={10} className="text-indigo-600" /> Coach Proposed
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-mono font-bold uppercase rounded-lg">
                        Pending Selection
                      </span>
                    )}
                  </div>

                  {/* Student View Banner */}
                  {userRole === 'student' && loggedInStudentId && (
                    <div className="pt-1">
                      {isPublished ? (
                        isStudentInXI ? (
                          <div className="p-2.5 bg-amber-500/15 border border-amber-400 text-amber-950 rounded-2xl text-xs font-bold flex items-center gap-2">
                            <Star size={16} className="text-amber-600 shrink-0 fill-amber-400" />
                            <span>You are in the Starting XI Lineup! ⚽</span>
                          </div>
                        ) : isStudentInSub ? (
                          <div className="p-2.5 bg-emerald-500/15 border border-emerald-400 text-emerald-950 rounded-2xl text-xs font-bold flex items-center gap-2">
                            <UserCheck size={16} className="text-emerald-700 shrink-0" />
                            <span>You are in the Matchday Substitutes 🏃</span>
                          </div>
                        ) : (
                          <div className="p-2.5 bg-gray-100 text-gray-600 rounded-2xl text-xs font-medium">
                            Standby / Training Reserve
                          </div>
                        )
                      ) : (
                        <div className="p-2.5 bg-slate-100 text-slate-600 rounded-2xl text-xs font-medium flex items-center gap-1.5">
                          <Clock size={14} /> Team selection pending Admin publication
                        </div>
                      )}
                    </div>
                  )}

                  {/* Match Details */}
                  <h4 className="font-black text-gray-900 text-base leading-snug">{t.title}</h4>
                  
                  <div className="space-y-1.5 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <Trophy size={14} className="text-emerald-700 shrink-0" />
                      <span>Opponent: <strong className="text-gray-950">vs {t.opponent}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400 shrink-0" />
                      <span>Date: <strong className="text-gray-800">{t.date}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-gray-400 shrink-0" />
                      <span>Departure: <strong className="text-gray-800">{t.departureTime}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-rose-500 shrink-0" />
                      <span className="break-words">Ground: <strong>{t.location}</strong></span>
                    </div>
                  </div>

                  {/* Published Squad Preview */}
                  {isPublished && publishedXI.length > 0 && (
                    <div className="p-3 bg-amber-50/50 border border-amber-200/70 rounded-2xl text-xs space-y-1.5">
                      <div className="flex justify-between items-center text-[11px] font-mono font-bold text-amber-900">
                        <span>Official Lineup Published</span>
                        <span>{publishedXI.length} Starting XI</span>
                      </div>
                      <p className="text-[11px] text-gray-700 font-medium line-clamp-2">
                        {students.filter(s => publishedXI.includes(s.id)).map(s => s.name).join(', ')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Team Selection Action for Coach / Admin */}
                {userRole !== 'student' && (
                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    <button 
                      onClick={() => openSquadModal(t)}
                      className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                    >
                      <Users size={15} />
                      {userRole === 'coach' ? 'Propose Team Selection' : 'Review & Publish Final Squad'}
                    </button>

                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono text-gray-500 uppercase font-bold">Status:</span>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleStatusChange(t, 'Scheduled')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                            t.status === 'Scheduled' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          Scheduled
                        </button>
                        <button 
                          onClick={() => handleStatusChange(t, 'Completed')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                            t.status === 'Completed' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          Completed
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-12 bg-white border border-gray-200 rounded-3xl text-gray-500">
            No match fixtures scheduled yet.
          </div>
        )}
      </div>
    </div>
  );
}
