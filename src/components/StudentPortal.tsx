import React, { useState } from 'react';
import { Student, PerformanceMetric, FeeStatus, Tournament } from '../types';
import { User, Calendar, Award, CreditCard, Trophy, CheckCircle2, AlertCircle, Clock, Star, Users, Phone, Mail, Activity, ArrowUpRight, Zap, Shield, Check, X } from 'lucide-react';

interface StudentPortalProps {
  students: Student[];
  metrics: PerformanceMetric[];
  fees: FeeStatus[];
  tournaments: Tournament[];
  loggedInStudentId: string;
  onSelectStudent: (studentId: string) => void;
  onUpdateFee: (updatedFee: FeeStatus) => void;
}

export default function StudentPortal({
  students,
  metrics,
  fees,
  tournaments,
  loggedInStudentId,
  onSelectStudent,
  onUpdateFee
}: StudentPortalProps) {
  // Fallback to first student if none selected
  const activeStudentId = loggedInStudentId || (students[0]?.id || '');
  const student = students.find(s => s.id === activeStudentId) || students[0];

  const [activeTab, setActiveTab] = useState<'report' | 'fees' | 'matches' | 'profile'>('report');
  const [payingFee, setPayingFee] = useState<FeeStatus | null>(null);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);

  if (!student) {
    return <div className="p-8 text-center text-gray-500">No student profiles found.</div>;
  }

  // Filter student-specific records
  const studentMetrics = metrics.filter(m => m.studentId === student.id);
  const studentFees = fees.filter(f => f.studentId === student.id);

  // Calculate attendance statistics
  const totalSessions = studentMetrics.length;
  const presentCount = studentMetrics.filter(m => m.attendance === 'Present').length;
  const attendanceRate = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 100;

  // Personal Best Speeds & Agility
  const validSpeeds = studentMetrics.map(m => m.speed).filter(s => s > 0);
  const personalBestSpeed = validSpeeds.length > 0 ? Math.min(...validSpeeds) : null;

  const validAgility = studentMetrics.map(m => m.agility).filter(a => a > 0);
  const personalBestAgility = validAgility.length > 0 ? Math.min(...validAgility) : null;

  const latestMetric = studentMetrics[studentMetrics.length - 1];

  // Settle Fee Action
  const handleSettleFee = () => {
    if (!payingFee) return;
    const updated: FeeStatus = {
      ...payingFee,
      status: 'Paid',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'UPI / Digital Payment'
    };
    onUpdateFee(updated);
    setPaymentSuccessMsg(`Payment of ₹${payingFee.amount} for ${payingFee.month} settled successfully!`);
    setPayingFee(null);
    setTimeout(() => setPaymentSuccessMsg(null), 5000);
  };

  return (
    <div className="space-y-6" id="student-portal-root">
      
      {/* Top Banner & Profile Switcher */}
      <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-2xl shadow-lg space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-inner font-display">
              {student.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold uppercase rounded">
                  Student Athlete Portal
                </span>
                <span className="text-xs text-slate-400">Position: <strong>{student.position}</strong></span>
              </div>
              <h2 className="text-2xl font-bold font-sans tracking-tight text-white">{student.name}</h2>
              <p className="text-xs text-slate-400">
                Kadamtala Sporting Subhas Bhowmick Football Camp — Age: {student.age} | Reg: {student.registrationDate}
              </p>
            </div>
          </div>

          {/* Student Profile Info Card */}
          <div className="bg-slate-800/90 border border-slate-700/80 p-3 rounded-xl space-y-1 w-full lg:w-auto text-left lg:text-right">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Registration Info:</span>
            <div className="text-xs font-bold font-mono text-amber-400">{student.registrationNumber || 'Registered Athlete'}</div>
            <div className="text-[11px] text-slate-300">Guardian: {student.fatherName || student.parentName}</div>
          </div>
        </div>

        {/* Portal Sub-tabs */}
        <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('report')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'report' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Activity size={16} />
            Attendance & Performance Report
          </button>

          <button
            onClick={() => setActiveTab('fees')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'fees' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <CreditCard size={16} />
            My Fees Record (Admission ₹350 / Monthly ₹150)
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'profile' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <User size={16} />
            Personal Profile & Records
          </button>
        </div>
      </div>

      {/* Payment Success Alert */}
      {paymentSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            {paymentSuccessMsg}
          </div>
          <button onClick={() => setPaymentSuccessMsg(null)} className="font-bold text-gray-400 hover:text-gray-600 cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* 1. ATTENDANCE & PERFORMANCE REPORT */}
      {activeTab === 'report' && (
        <div className="space-y-6">
          
          {/* Top Performance Key Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-1">
              <span className="text-[10px] font-mono text-gray-500 uppercase font-bold block">Attendance Rate</span>
              <div className="text-3xl font-extrabold text-emerald-950 flex items-center gap-1">
                <CheckCircle2 size={22} className="text-emerald-600" />
                {attendanceRate}%
              </div>
              <p className="text-[11px] text-gray-400">{presentCount} of {totalSessions} training sessions attended</p>
            </div>

            <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-1">
              <span className="text-[10px] font-mono text-gray-500 uppercase font-bold block">Personal Best Speed (40yd)</span>
              <div className="text-3xl font-extrabold text-gray-900 flex items-center gap-1">
                <Zap size={22} className="text-amber-500" />
                {personalBestSpeed ? `${personalBestSpeed}s` : 'N/A'}
              </div>
              <p className="text-[11px] text-gray-400">Sprint acceleration benchmark</p>
            </div>

            <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-1">
              <span className="text-[10px] font-mono text-gray-500 uppercase font-bold block">Personal Best Agility</span>
              <div className="text-3xl font-extrabold text-gray-900 flex items-center gap-1">
                <Activity size={22} className="text-emerald-600" />
                {personalBestAgility ? `${personalBestAgility}s` : 'N/A'}
              </div>
              <p className="text-[11px] text-gray-400">Cone shuttle drill time</p>
            </div>

            <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-1">
              <span className="text-[10px] font-mono text-gray-500 uppercase font-bold block">Latest Stamina Score</span>
              <div className="text-3xl font-extrabold text-gray-900 flex items-center gap-1">
                <Star size={22} className="text-amber-500" />
                {latestMetric ? `${latestMetric.stamina}/10` : 'N/A'}
              </div>
              <p className="text-[11px] text-gray-400">Cardiovascular endurance rating</p>
            </div>
          </div>

          {/* Skill Ratings Radar / Scorecard */}
          {latestMetric && (
            <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                <Award className="text-emerald-700" size={20} />
                Technical & Physical Skill Scorecard ({latestMetric.date})
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-center space-y-1">
                  <span className="text-[10px] font-mono font-bold text-gray-500 uppercase">Passing</span>
                  <div className="text-xl font-bold text-emerald-800">{latestMetric.passing} / 10</div>
                </div>

                <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-center space-y-1">
                  <span className="text-[10px] font-mono font-bold text-gray-500 uppercase">Shooting</span>
                  <div className="text-xl font-bold text-emerald-800">{latestMetric.shooting} / 10</div>
                </div>

                <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-center space-y-1">
                  <span className="text-[10px] font-mono font-bold text-gray-500 uppercase">Defense</span>
                  <div className="text-xl font-bold text-emerald-800">{latestMetric.defense} / 10</div>
                </div>

                <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-center space-y-1">
                  <span className="text-[10px] font-mono font-bold text-gray-500 uppercase">Stamina</span>
                  <div className="text-xl font-bold text-emerald-800">{latestMetric.stamina} / 10</div>
                </div>

                <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-center space-y-1">
                  <span className="text-[10px] font-mono font-bold text-gray-500 uppercase">Speed</span>
                  <div className="text-xl font-bold text-emerald-800">{latestMetric.speed}s</div>
                </div>

                <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl text-center space-y-1">
                  <span className="text-[10px] font-mono font-bold text-gray-500 uppercase">Agility</span>
                  <div className="text-xl font-bold text-emerald-800">{latestMetric.agility}s</div>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Attendance History & Coach Abedemi Faniyan's Feedback Log */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <Calendar className="text-emerald-700" size={20} />
              Attendance History & Head Coach Abedemi Faniyan's Feedback Logs
            </h3>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-mono uppercase">
                  <tr>
                    <th className="p-3">Training Date</th>
                    <th className="p-3">Attendance</th>
                    <th className="p-3">Speed / Agility</th>
                    <th className="p-3">Coach Abedemi Faniyan's Review Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {studentMetrics.length > 0 ? (
                    studentMetrics.map(m => (
                      <tr key={m.id} className="hover:bg-gray-50/50">
                        <td className="p-3 font-mono font-bold text-gray-900">{m.date}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            m.attendance === 'Present' ? 'bg-emerald-100 text-emerald-800' :
                            m.attendance === 'Absent' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {m.attendance}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-gray-700">
                          Speed: {m.speed}s | Agility: {m.agility}s
                        </td>
                        <td className="p-3 text-gray-600 italic">
                          "{m.notes || 'Good effort and focus shown during drills.'}"
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-gray-500">
                        No training logs recorded yet for this athlete.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. FEES RECORD DETAILS */}
      {activeTab === 'fees' && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-gray-100">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <CreditCard size={22} className="text-emerald-700" />
                Personal Fees Ledger Details
              </h3>
              <p className="text-xs text-gray-500">
                Official registration fee breakdown: <strong>Admission Fee is ₹350</strong> (one-time) and <strong>Monthly Tuition is ₹150</strong>.
              </p>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-900">
              Total Recorded Fees: {studentFees.length} Items
            </div>
          </div>

          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-mono uppercase">
                <tr>
                  <th className="p-3">Fee Type / Cycle</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Payment Status</th>
                  <th className="p-3">Payment Date</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {studentFees.map(f => (
                  <tr key={f.id} className="hover:bg-gray-50/60">
                    <td className="p-3 font-bold text-gray-900">{f.month}</td>
                    <td className="p-3 font-mono font-bold text-gray-950 text-sm">₹{f.amount}.00</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                        f.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                        f.status === 'Overdue' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {f.status}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500 font-mono">
                      {f.paymentDate ? `${f.paymentDate} (${f.paymentMethod || 'Online'})` : '—'}
                    </td>
                    <td className="p-3 text-right">
                      {f.status !== 'Paid' ? (
                        <button
                          onClick={() => setPayingFee(f)}
                          className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer transition-all"
                        >
                          Pay Dues Online (₹{f.amount})
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-600 font-semibold flex items-center justify-end gap-1">
                          <Check size={14} /> Settled
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Online Payment Modal */}
          {payingFee && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative">
                <button onClick={() => setPayingFee(null)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1 rounded-full">
                  <X size={20} />
                </button>

                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold text-emerald-700 uppercase">Online Fee Settlement</span>
                  <h4 className="text-lg font-bold text-gray-900">Settle Dues for {payingFee.month}</h4>
                  <p className="text-xs text-gray-500">KSSB FC Digital Tuition & Admission Billing</p>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Athlete Name:</span>
                    <strong className="text-gray-900">{student.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cycle / Fee:</span>
                    <strong className="text-gray-900">{payingFee.month}</strong>
                  </div>
                  <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-2 text-emerald-900">
                    <span>Total Amount Due:</span>
                    <span className="font-mono text-base">₹{payingFee.amount}.00</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-mono font-bold text-gray-700 uppercase">Payment Method</label>
                  <select className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold bg-white">
                    <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                    <option value="Card">Debit / Credit Card</option>
                    <option value="NetBanking">Net Banking</option>
                  </select>
                </div>

                <button
                  onClick={handleSettleFee}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm shadow-md transition-all cursor-pointer"
                >
                  Confirm & Complete Payment (₹{payingFee.amount})
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. UPCOMING MATCHES & TEAM SELECTION STATUS */}
      {activeTab === 'matches' && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Trophy size={22} className="text-emerald-700" />
                My Upcoming Match Schedules & Team Selection Status
              </h3>
              <p className="text-xs text-gray-500">
                Check fixture details and see whether Head Coach Abedemi Faniyan has selected you in the Matchday Squad or Starting XI.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {tournaments.map(t => {
                const squad = t.selectedSquad || [];
                const startingXI = t.startingEleven || [];

                const inSquad = squad.includes(student.id);
                const inXI = startingXI.includes(student.id);

                return (
                  <div key={t.id} className="p-5 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-3 relative overflow-hidden">
                    <div className="flex justify-between items-center">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[10px] font-bold uppercase">
                        {t.ageGroup}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-gray-500">{t.date}</span>
                    </div>

                    <h4 className="font-bold text-gray-900 text-base">{t.title}</h4>
                    
                    <div className="text-xs text-gray-600 space-y-1">
                      <div>Opponent: <strong>vs {t.opponent}</strong></div>
                      <div>Meeting Time: <strong>{t.departureTime}</strong></div>
                      <div>Location: <strong>{t.location}</strong></div>
                    </div>

                    {/* Personal Selection Status Banner */}
                    <div className="pt-2 border-t border-gray-100">
                      {inXI ? (
                        <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold flex items-center gap-2">
                          <Star size={18} className="text-amber-500 fill-amber-400 shrink-0" />
                          <span>Selected in Starting XI ⚽</span>
                        </div>
                      ) : inSquad ? (
                        <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
                          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                          <span>Selected in Matchday Squad 🏃</span>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-gray-50 border border-gray-200 text-gray-600 rounded-xl text-xs font-medium">
                          Standby / Training Reserve
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. PERSONAL PROFILE & RECORDS */}
      {activeTab === 'profile' && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="space-y-1 pb-4 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <User size={22} className="text-emerald-700" />
              Personal Athlete Profile & Records
            </h3>
            <p className="text-xs text-gray-500">Registered personal details, age category, parent/guardian contact, and baseline camp records.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-bold text-gray-800 text-sm font-mono uppercase tracking-wider">Athlete Profile Information</h4>
              <div className="p-4 bg-gray-50 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-200/60">
                  <span className="text-gray-500">Full Name:</span>
                  <strong className="text-gray-900 font-semibold">{student.name}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200/60">
                  <span className="text-gray-500">Age:</span>
                  <strong className="text-gray-900 font-semibold">{student.age} Years Old</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200/60">
                  <span className="text-gray-500">Primary Playing Position:</span>
                  <strong className="text-emerald-800 font-bold">{student.position}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200/60">
                  <span className="text-gray-500">Registration Date:</span>
                  <strong className="text-gray-900 font-semibold">{student.registrationDate}</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Camp Status:</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    {student.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-gray-800 text-sm font-mono uppercase tracking-wider">Parent / Guardian Contact</h4>
              <div className="p-4 bg-gray-50 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-gray-200/60">
                  <span className="text-gray-500">Parent / Guardian:</span>
                  <strong className="text-gray-900 font-semibold">{student.parentName}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200/60">
                  <span className="text-gray-500 font-mono">Mobile Number:</span>
                  <strong className="text-gray-900 font-semibold font-mono">{student.parentPhone}</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Email Address:</span>
                  <strong className="text-gray-900 font-semibold">{student.parentEmail}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
