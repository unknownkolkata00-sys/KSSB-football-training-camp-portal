import React, { useState } from 'react';
import { Student, InjuryReport } from '../types';
import { ShieldAlert, Plus, Activity, Heart, CheckCircle, Calendar, User, AlignLeft, X } from 'lucide-react';

interface InjuryTrackerProps {
  students: Student[];
  injuries: InjuryReport[];
  onAddInjury: (injury: Omit<InjuryReport, 'id'>) => void;
  onUpdateInjury: (injury: InjuryReport) => void;
}

export default function InjuryTracker({
  students,
  injuries,
  onAddInjury,
  onUpdateInjury
}: InjuryTrackerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [studentId, setStudentId] = useState(students[0]?.id || '');
  const [injuryType, setInjuryType] = useState('');
  const [dateOfInjury, setDateOfInjury] = useState(new Date().toISOString().split('T')[0]);
  const [expectedReturn, setExpectedReturn] = useState('');
  const [notes, setNotes] = useState('');

  const [alert, setAlert] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId || !injuryType || !dateOfInjury || !expectedReturn) {
      setAlert('All medical fields are required!');
      return;
    }

    onAddInjury({
      studentId,
      injuryType,
      dateOfInjury,
      expectedReturn,
      status: 'Active',
      notes
    });

    setInjuryType('');
    setNotes('');
    setExpectedReturn('');
    setShowAddForm(false);
    setAlert('Injury successfully logged. Player safety flags have been updated.');
    setTimeout(() => setAlert(null), 5000);
  };

  const handleStatusChange = (injury: InjuryReport, newStatus: 'Active' | 'Recovering' | 'Recovered') => {
    onUpdateInjury({
      ...injury,
      status: newStatus
    });
  };

  return (
    <div className="space-y-6" id="injury-tracker-root">
      
      {/* Alert Banner */}
      {alert && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-emerald-600" />
            {alert}
          </div>
          <button onClick={() => setAlert(null)} className="text-gray-400 hover:text-gray-600 font-bold">Dismiss</button>
        </div>
      )}

      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4" id="injury-header">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-gray-900 font-sans">Camp Injury Reports</h2>
          <p className="text-sm text-gray-500">Track player medical status, recovery cycles, and physio clearances.</p>
        </div>
        
        <button
          onClick={() => setShowAddForm(true)}
          className="px-4 py-2.5 bg-rose-700 hover:bg-rose-800 text-white font-semibold text-sm rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          id="log-injury-btn"
        >
          <ShieldAlert size={18} />
          Log Injury Report
        </button>
      </div>

      {/* Log Injury Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all" id="log-injury-modal">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowAddForm(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-50 cursor-pointer"
            >
              <X size={20} />
            </button>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 text-rose-700">
                <ShieldAlert size={20} />
                Create Player Medical/Injury Report
              </h3>
              <p className="text-xs text-gray-500">Log physical limitations or sprains to adjust training and notify coaches.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-mono font-bold text-gray-700 uppercase">Injured Student Athlete</label>
                  <select
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white font-medium text-gray-800 focus:outline-none"
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.position})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 col-span-2">
                  <label className="text-xs font-mono font-bold text-gray-700 uppercase">Injury Diagnosis / Type</label>
                  <input 
                    type="text" 
                    value={injuryType}
                    onChange={(e) => setInjuryType(e.target.value)}
                    placeholder="e.g. Right Hamstring Strain (Grade 1)"
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-gray-700 uppercase">Date of Injury</label>
                  <input 
                    type="date" 
                    value={dateOfInjury}
                    onChange={(e) => setDateOfInjury(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-gray-700 uppercase">Anticipated Clearance Date</label>
                  <input 
                    type="date" 
                    value={expectedReturn}
                    onChange={(e) => setExpectedReturn(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-gray-700 uppercase">Rehabilitation & Training Directives</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Light cycling and pool training allowed. No sprint drills or striking practice for 10 days."
                  rows={3}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none"
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
                  className="px-5 py-2 bg-rose-700 text-white rounded-lg text-sm font-semibold hover:bg-rose-800 cursor-pointer"
                >
                  Log Injury Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Injury Log Sections */}
      <div className="space-y-6" id="injury-list-sections">
        {/* Active and Recovering */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-900 font-sans text-lg flex items-center gap-2">
            <Activity size={18} className="text-rose-600 animate-pulse" />
            Active Recovery & Side-Conditioning ({injuries.filter(i => i.status !== 'Recovered').length})
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {injuries.filter(i => i.status !== 'Recovered').length > 0 ? (
              injuries.filter(i => i.status !== 'Recovered').map(i => {
                const player = students.find(s => s.id === i.studentId);
                return (
                  <div key={i.id} className="p-5 bg-white border border-rose-100 rounded-2xl shadow-sm space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="font-bold text-gray-900 text-sm flex items-center gap-1">
                          <User size={14} className="text-gray-400" />
                          {player?.name || 'Unknown student'}
                        </div>
                        <h4 className="font-bold text-base text-rose-950 leading-tight">{i.injuryType}</h4>
                        <div className="text-xs text-gray-500 font-mono">Date of occurrence: {i.dateOfInjury}</div>
                      </div>
                      
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        i.status === 'Active' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {i.status === 'Active' ? '🚨 Active Treatment' : '⚡ Side-Practice'}
                      </span>
                    </div>

                    {i.notes && (
                      <div className="p-3 bg-rose-50/20 border border-rose-100/35 rounded-lg text-xs text-gray-700 space-y-1">
                        <span className="font-bold flex items-center gap-1 text-rose-800">
                          <AlignLeft size={12} />
                          Rehab Directives:
                        </span>
                        <p className="italic">"{i.notes}"</p>
                      </div>
                    )}

                    <div className="pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-600">
                      <span>Target Clearance: <strong className="text-rose-700 font-bold">{i.expectedReturn}</strong></span>
                      
                      <div className="flex bg-gray-50 p-0.5 rounded border border-gray-200">
                        <button 
                          onClick={() => handleStatusChange(i, 'Active')}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                            i.status === 'Active' ? 'bg-red-600 text-white' : 'text-gray-500 hover:text-gray-800'
                          }`}
                        >
                          Treat
                        </button>
                        <button 
                          onClick={() => handleStatusChange(i, 'Recovering')}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                            i.status === 'Recovering' ? 'bg-amber-600 text-white' : 'text-gray-500 hover:text-gray-800'
                          }`}
                        >
                          Condition
                        </button>
                        <button 
                          onClick={() => handleStatusChange(i, 'Recovered')}
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold text-gray-500 hover:bg-emerald-600 hover:text-white cursor-pointer transition-colors"
                        >
                          Clear ✔
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-8 text-center bg-white border border-gray-100 rounded-2xl text-emerald-600 text-sm font-semibold">
                ✨ Incredible! There are currently no active or recovering player injuries logged.
              </div>
            )}
          </div>
        </div>

        {/* Resolved Injuries */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-900 font-sans text-lg flex items-center gap-2">
            <Heart size={18} className="text-emerald-600" />
            Fully Recovered & Cleared Logs ({injuries.filter(i => i.status === 'Recovered').length})
          </h3>
          
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden" id="recovered-injuries-card">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-100">
                  <th className="p-4 text-xs font-mono font-bold text-gray-500 uppercase">Student Athlete</th>
                  <th className="p-4 text-xs font-mono font-bold text-gray-500 uppercase">Injury description</th>
                  <th className="p-4 text-xs font-mono font-bold text-gray-500 uppercase">Injury Date</th>
                  <th className="p-4 text-xs font-mono font-bold text-gray-500 uppercase">Clearance Date</th>
                  <th className="p-4 text-xs font-mono font-bold text-gray-500 uppercase text-right">Medical Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {injuries.filter(i => i.status === 'Recovered').length > 0 ? (
                  injuries.filter(i => i.status === 'Recovered').map(i => {
                    const player = students.find(s => s.id === i.studentId);
                    return (
                      <tr key={i.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 text-sm font-bold text-gray-900">{player?.name || 'Unknown Athlete'}</td>
                        <td className="p-4 text-sm text-gray-700">{i.injuryType}</td>
                        <td className="p-4 text-xs text-gray-500 font-mono">{i.dateOfInjury}</td>
                        <td className="p-4 text-xs text-emerald-600 font-mono font-bold">{i.expectedReturn}</td>
                        <td className="p-4 text-right">
                          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-50 text-emerald-800 border border-emerald-100">
                            Clear for Play
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-gray-500 text-sm">
                      No recovered injuries logged in past records.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
