import React, { useState } from 'react';
import { Tournament, Student } from '../types';
import { Trophy, Calendar, MapPin, Clock, Plus, Check, X, Sparkles, Users, UserCheck, Shield, Star } from 'lucide-react';

interface TournamentSchedulerProps {
  tournaments: Tournament[];
  students: Student[];
  userRole?: 'admin' | 'coach' | 'student';
  loggedInStudentId?: string;
  onAddTournament: (tournament: Omit<Tournament, 'id'>) => void;
  onUpdateTournament: (tournament: Tournament) => void;
}

export default function TournamentScheduler({
  tournaments,
  students,
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

  // Squad Selection Modal State
  const [tempSquad, setTempSquad] = useState<string[]>([]);
  const [tempXI, setTempXI] = useState<string[]>([]);

  const [alert, setAlert] = useState<string | null>(null);

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
    setTempSquad(t.selectedSquad || []);
    setTempXI(t.startingEleven || []);
  };

  const toggleSquadMember = (studentId: string) => {
    if (tempSquad.includes(studentId)) {
      setTempSquad(tempSquad.filter(id => id !== studentId));
      setTempXI(tempXI.filter(id => id !== studentId));
    } else {
      setTempSquad([...tempSquad, studentId]);
    }
  };

  const toggleStartingXIMember = (studentId: string) => {
    if (!tempSquad.includes(studentId)) {
      // Auto-add to squad if selected for starting XI
      setTempSquad([...tempSquad, studentId]);
      setTempXI([...tempXI, studentId]);
      return;
    }

    if (tempXI.includes(studentId)) {
      setTempXI(tempXI.filter(id => id !== studentId));
    } else {
      setTempXI([...tempXI, studentId]);
    }
  };

  const handleSaveTeamSelection = () => {
    if (!selectedMatchForSquad) return;
    onUpdateTournament({
      ...selectedMatchForSquad,
      selectedSquad: tempSquad,
      startingEleven: tempXI
    });
    setAlert(`Team selection updated for ${selectedMatchForSquad.title}! (${tempSquad.length} in Squad, ${tempXI.length} in Starting XI)`);
    setSelectedMatchForSquad(null);
    setTimeout(() => setAlert(null), 4000);
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
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <Check size={18} className="text-emerald-600 shrink-0" />
            {alert}
          </div>
          <button onClick={() => setAlert(null)} className="text-gray-400 hover:text-gray-600 font-bold cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4" id="scheduler-header">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-gray-900 font-sans">Upcoming Matches & Team Selection</h2>
          <p className="text-sm text-gray-500">
            {userRole === 'student' 
              ? 'Check upcoming match logistics and view your team selection status.' 
              : 'Schedule fixtures, manage departure times, and select starting lineups for KSSB FC.'}
          </p>
        </div>
        
        {userRole !== 'student' && (
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
            id="add-fixture-btn"
          >
            <Plus size={18} />
            Schedule Match
          </button>
        )}
      </div>

      {/* Add Match Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all" id="add-fixture-modal">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowAddForm(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-50 cursor-pointer"
            >
              <X size={20} />
            </button>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Sparkles size={20} className="text-emerald-600" />
                Schedule Match Fixture
              </h3>
              <p className="text-xs text-gray-500">Insert team match logistics. This will broadcast to player schedules instantly.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-gray-700 uppercase">Tournament / Event Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Kolkata Youth League Knockout"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-700"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-gray-700 uppercase">Opponent Academy</label>
                  <input 
                    type="text" 
                    value={opponent}
                    onChange={(e) => setOpponent(e.target.value)}
                    placeholder="e.g. East Bengal Youth Academy"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-gray-700 uppercase">Age Group / Division</label>
                  <select 
                    value={ageGroup}
                    onChange={(e) => setAgeGroup(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white"
                  >
                    <option value="Under 12">Under 12 Division</option>
                    <option value="Under 14">Under 14 Division</option>
                    <option value="Under 16">Under 16 Division</option>
                    <option value="All Divisions">All Divisions</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-gray-700 uppercase">Event Date</label>
                  <input 
                    type="date" 
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-gray-700 uppercase">Departure / Meeting Time</label>
                  <input 
                    type="text" 
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    placeholder="e.g. 08:30 AM"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-gray-700 uppercase">Turf / Arena Location</label>
                <input 
                  type="text" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Kadamtala Stadium Grounds, Field A"
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 text-white rounded-lg text-sm font-semibold hover:bg-emerald-800 cursor-pointer"
                >
                  Schedule Match
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Team Selection Management Modal (Admin/Coach) */}
      {selectedMatchForSquad && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setSelectedMatchForSquad(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-50 cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="space-y-1">
              <span className="text-xs font-mono font-bold text-emerald-700 uppercase tracking-wider block">Matchday Team Selection</span>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Users size={22} className="text-emerald-700" />
                {selectedMatchForSquad.title} vs {selectedMatchForSquad.opponent}
              </h3>
              <p className="text-xs text-gray-500">
                Select athletes for the <strong>Match Squad</strong> and pick the <strong>Starting XI</strong> lineup.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-100 p-3 rounded-xl text-xs text-emerald-900 font-semibold">
              <div className="flex items-center gap-1.5">
                <Users size={16} className="text-emerald-700" />
                <span>Squad Selected: <strong>{tempSquad.length} Players</strong></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star size={16} className="text-amber-500" />
                <span>Starting XI: <strong>{tempXI.length} Players</strong></span>
              </div>
            </div>

            {/* Roster Selection Table */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-mono uppercase">
                  <tr>
                    <th className="p-3">Player Name</th>
                    <th className="p-3">Position</th>
                    <th className="p-3 text-center">In Match Squad</th>
                    <th className="p-3 text-center">Starting XI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {students.map(s => {
                    const inSquad = tempSquad.includes(s.id);
                    const inXI = tempXI.includes(s.id);
                    return (
                      <tr key={s.id} className={`hover:bg-gray-50/60 transition-colors ${inXI ? 'bg-amber-50/30' : inSquad ? 'bg-emerald-50/20' : ''}`}>
                        <td className="p-3">
                          <div className="font-bold text-gray-900">{s.name}</div>
                          <div className="text-[11px] text-gray-500">Age: {s.age}</div>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-mono text-[10px] font-bold">
                            {s.position}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <input 
                            type="checkbox"
                            checked={inSquad}
                            onChange={() => toggleSquadMember(s.id)}
                            className="h-4 w-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <input 
                            type="checkbox"
                            checked={inXI}
                            onChange={() => toggleStartingXIMember(s.id)}
                            className="h-4 w-4 text-amber-500 rounded border-gray-300 focus:ring-amber-500 cursor-pointer"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button 
                onClick={() => setSelectedMatchForSquad(null)}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveTeamSelection}
                className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Check size={16} />
                Save Match Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Match Ticket Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="tournament-fixtures-grid">
        {sortedTournaments.length > 0 ? (
          sortedTournaments.map(t => {
            const squadIds = t.selectedSquad || [];
            const xiIds = t.startingEleven || [];
            const isStudentInSquad = loggedInStudentId ? squadIds.includes(loggedInStudentId) : false;
            const isStudentInXI = loggedInStudentId ? xiIds.includes(loggedInStudentId) : false;

            return (
              <div 
                key={t.id} 
                className={`p-5 bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 ${
                  t.status === 'Completed' ? 'border-gray-100 bg-gray-50/20' :
                  t.status === 'Cancelled' ? 'border-red-100 bg-red-50/10' :
                  'border-emerald-100 bg-emerald-50/10'
                }`}
                id={`tournament-card-${t.id}`}
              >
                <div className="space-y-3">
                  {/* Age group tag and status indicator */}
                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      t.status === 'Completed' ? 'bg-gray-100 text-gray-700' :
                      t.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-emerald-100 text-emerald-800'
                    }`}>
                      {t.ageGroup}
                    </span>
                    
                    <span className={`h-2.5 w-2.5 rounded-full inline-block ${
                      t.status === 'Completed' ? 'bg-gray-400' :
                      t.status === 'Cancelled' ? 'bg-red-500 animate-pulse' :
                      'bg-emerald-500 animate-pulse'
                    }`} title={`Status: ${t.status}`} />
                  </div>

                  {/* Student Selection Banner if in Student Mode */}
                  {userRole === 'student' && loggedInStudentId && (
                    <div className="pt-1">
                      {isStudentInXI ? (
                        <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-900 rounded-xl text-xs font-bold flex items-center gap-2">
                          <Star size={16} className="text-amber-600 shrink-0 fill-amber-500" />
                          <span>Selected in Starting XI ⚽!</span>
                        </div>
                      ) : isStudentInSquad ? (
                        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
                          <UserCheck size={16} className="text-emerald-600 shrink-0" />
                          <span>Selected in Matchday Squad 🏃</span>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-gray-100 text-gray-600 rounded-xl text-xs font-medium">
                          Standby / Training Reserve
                        </div>
                      )}
                    </div>
                  )}

                  {/* Match title */}
                  <h4 className="font-bold text-gray-900 text-base leading-snug">{t.title}</h4>
                  
                  {/* Logistics */}
                  <div className="space-y-1.5 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <Trophy size={14} className="text-gray-400 shrink-0" />
                      <span>Opponent: <strong className="text-gray-950">vs {t.opponent}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-gray-400 shrink-0" />
                      <span>Date: <strong className="text-gray-800">{t.date}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-gray-400 shrink-0" />
                      <span>Meeting Time: <strong className="text-gray-800">{t.departureTime}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-gray-400 shrink-0 text-rose-500" />
                      <span className="truncate" title={t.location}>Location: <strong>{t.location}</strong></span>
                    </div>
                  </div>

                  {/* Team Selection Summary Pill */}
                  <div className="p-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between items-center text-[11px] font-mono text-gray-600">
                      <span>Squad: <strong>{squadIds.length} Athletes</strong></span>
                      <span>Starting XI: <strong>{xiIds.length} Athletes</strong></span>
                    </div>
                    {xiIds.length > 0 && (
                      <div className="text-[11px] text-gray-500 truncate" title={students.filter(s => xiIds.includes(s.id)).map(s => s.name).join(', ')}>
                        <strong className="text-emerald-800 font-semibold">Lineup: </strong>
                        {students.filter(s => xiIds.includes(s.id)).map(s => s.name).join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Update & Team Selection Trigger for Admin / Coach */}
                {userRole !== 'student' && (
                  <div className="pt-3 border-t border-gray-100 flex flex-col gap-2">
                    <button 
                      onClick={() => openSquadModal(t)}
                      className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Users size={14} />
                      Team Selection & Lineup ({squadIds.length})
                    </button>

                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-[10px] font-mono font-semibold text-gray-500 uppercase">Match Status:</span>
                      <div className="flex bg-gray-50 p-0.5 rounded border border-gray-200">
                        <button 
                          onClick={() => handleStatusChange(t, 'Scheduled')}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                            t.status === 'Scheduled' ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:text-gray-800'
                          }`}
                        >
                          Active
                        </button>
                        <button 
                          onClick={() => handleStatusChange(t, 'Completed')}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                            t.status === 'Completed' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-800'
                          }`}
                        >
                          Done
                        </button>
                        <button 
                          onClick={() => handleStatusChange(t, 'Cancelled')}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                            t.status === 'Cancelled' ? 'bg-rose-600 text-white' : 'text-gray-500 hover:text-gray-800'
                          }`}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="col-span-full text-center py-10 bg-white border border-gray-100 rounded-2xl text-gray-500">
            No tournaments scheduled yet.
          </div>
        )}
      </div>
    </div>
  );
}
