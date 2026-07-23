import React, { useState } from 'react';
import { Student, PerformanceMetric, FeeStatus, Tournament, GalleryImage, CampJersey, JerseyOrder } from '../types';
import { User, Calendar, Award, CreditCard, Trophy, CheckCircle2, AlertCircle, Clock, Star, Users, Phone, Mail, Activity, ArrowUpRight, Zap, Shield, Check, X, ArrowLeft, FileText, Tag, Camera, IdCard, Shirt, ShoppingBag } from 'lucide-react';
import ReceiptModal from './ReceiptModal';
import TournamentScheduler from './TournamentScheduler';
import GalleryView from './GalleryView';
import PlayerIDCardModal from './PlayerIDCardModal';
import StudentJerseyStore from './StudentJerseyStore';
import kssbFcLogo from '../assets/images/kssb_fc_official_logo_1784715023480.jpg';

interface StudentPortalProps {
  students: Student[];
  metrics: PerformanceMetric[];
  fees: FeeStatus[];
  tournaments: Tournament[];
  galleryImages?: GalleryImage[];
  jerseys?: CampJersey[];
  orders?: JerseyOrder[];
  loggedInStudentId: string;
  onSelectStudent: (studentId: string) => void;
  onUpdateFee: (updatedFee: FeeStatus) => void;
  onPlaceOrder?: (order: Omit<JerseyOrder, 'id' | 'orderDate'>) => void;
}

export default function StudentPortal({
  students,
  metrics,
  fees,
  tournaments,
  galleryImages = [],
  jerseys = [],
  orders = [],
  loggedInStudentId,
  onSelectStudent,
  onUpdateFee,
  onPlaceOrder
}: StudentPortalProps) {
  // Fallback to first student if none selected
  const activeStudentId = loggedInStudentId || (students[0]?.id || '');
  const student = students.find(s => s.id === activeStudentId) || students[0];

  const [activeTab, setActiveTab] = useState<'report' | 'fees' | 'matches' | 'gallery' | 'store' | 'profile'>('report');
  const [payingFee, setPayingFee] = useState<FeeStatus | null>(null);
  const [selectedReceiptFee, setSelectedReceiptFee] = useState<FeeStatus | null>(null);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);
  const [showIdCardModal, setShowIdCardModal] = useState<boolean>(false);


  if (!student) {
    return <div className="p-8 text-center text-gray-500">No student profiles found.</div>;
  }

  // Filter student-specific records
  const studentMetrics = metrics.filter(m => m.studentId === student.id);
  const studentFees = fees.filter(f => f.studentId === student.id);

  // Find Registration Fee Record
  const regFeeRecord = studentFees.find(f => f.feeType === 'Registration' || f.month === 'Registration Fee') || {
    id: 'f_reg_' + student.id,
    studentId: student.id,
    feeType: 'Registration' as const,
    month: 'Registration Fee',
    amount: 350,
    status: 'Pending' as const
  };

  // Monthly Fees History
  const monthlyFeesHistory = studentFees.filter(f => f.feeType !== 'Registration' && f.month !== 'Registration Fee');

  // Total Paid & Outstanding Calculations
  const totalAmountPaid = studentFees.filter(f => f.status === 'Paid').reduce((sum, f) => sum + f.amount, 0);
  const totalOutstanding = studentFees.filter(f => f.status !== 'Paid').reduce((sum, f) => sum + f.amount, 0);

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
    const isReg = payingFee.feeType === 'Registration' || payingFee.month === 'Registration Fee';
    const recNum = payingFee.receiptNumber || `KSSB-${isReg ? 'REG' : 'MON'}-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const updated: FeeStatus = {
      ...payingFee,
      status: 'Paid',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'UPI / Digital Payment Portal',
      receiptNumber: recNum
    };
    onUpdateFee(updated);
    setPaymentSuccessMsg(`Payment of ₹${payingFee.amount} for ${payingFee.month} settled successfully!`);
    setPayingFee(null);
    setTimeout(() => setPaymentSuccessMsg(null), 5000);
  };

  return (
    <div className="space-y-6" id="student-portal-root">
      
      {/* Receipt Modal */}
      {selectedReceiptFee && (
        <ReceiptModal 
          fee={selectedReceiptFee} 
          student={student} 
          onClose={() => setSelectedReceiptFee(null)} 
        />
      )}

      {/* Back to Dashboard Navigation Header Bar */}
      {activeTab !== 'report' && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-3.5 px-5 rounded-2xl border border-slate-800 text-slate-100 shadow-md" id="student-back-to-dashboard-bar">
          <button
            onClick={() => setActiveTab('report')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm border border-emerald-400/30 w-fit"
            id="student-back-to-dashboard-btn"
          >
            <ArrowLeft size={16} /> Back to Main Summary Dashboard
          </button>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>Active Student View:</span>
            <span className="px-2.5 py-1 bg-slate-800 text-yellow-400 font-bold rounded-lg text-[11px] uppercase tracking-wider border border-slate-700">
              {activeTab}
            </span>
          </div>
        </div>
      )}
      
      {/* Top Banner & Profile Switcher */}
      <div className="bg-slate-900 border border-slate-800 text-white p-4 sm:p-6 rounded-2xl shadow-lg space-y-4">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex items-center gap-4">
            {student.photoUrl ? (
              <img 
                src={student.photoUrl} 
                alt={student.name} 
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl border-2 border-amber-400 object-cover bg-slate-800 shadow-md shrink-0"
              />
            ) : (
              <img 
                src={kssbFcLogo || '/logo.jpg'} 
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.jpg'; }}
                alt="KSSB FC Logo" 
                className="w-14 h-14 rounded-2xl border-2 border-amber-400 object-contain bg-white p-0.5 shadow-md shrink-0"
                referrerPolicy="no-referrer"
              />
            )}
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
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2.5 w-full lg:w-auto">
            <div className="bg-slate-800/90 border border-slate-700/80 p-3 rounded-xl space-y-1 w-full text-left lg:text-right">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">Registration Info:</span>
              <div className="text-xs font-bold font-mono text-amber-400">{student.registrationNumber || 'Registered Athlete'}</div>
              <div className="text-[11px] text-slate-300">Guardian: {student.fatherName || student.parentName}</div>
            </div>
            <button
              onClick={() => setShowIdCardModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer border border-emerald-400/30 shrink-0"
            >
              <IdCard size={16} /> View Official Player ID Card
            </button>
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
            onClick={() => setActiveTab('matches')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'matches' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Trophy size={16} />
            Match Fixtures & Team Squads
          </button>

          <button
            onClick={() => setActiveTab('gallery')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'gallery' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Camera size={16} />
            Photo Gallery
          </button>

          <button
            onClick={() => setActiveTab('fees')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'fees' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <CreditCard size={16} />
            My Fees Record (Registration ₹350 / Monthly ₹150)
          </button>

          <button
            onClick={() => setActiveTab('store')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'store' ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Shirt size={16} className={activeTab === 'store' ? 'text-slate-950' : 'text-amber-400'} />
            Camp Jersey Store
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'profile' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <User size={16} />
            Personal Profile & Fees Summary
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

          {/* Detailed Attendance History */}
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
          
          {/* Registration Fee Summary Feature Card */}
          <div className="p-5 bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 rounded-2xl text-white shadow-md border border-emerald-800/60 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-amber-400" />
                <span className="text-[10px] font-mono uppercase tracking-widest font-bold text-amber-300">
                  One-Time Academy Registration Fee: ₹350
                </span>
              </div>
              <h4 className="text-xl font-black text-white">Registration Fee Status: {regFeeRecord.status}</h4>
              <div className="text-xs text-slate-300 font-mono space-x-3">
                <span>Paid Date: <strong>{regFeeRecord.paymentDate || 'Pending Settlement'}</strong></span>
                <span>Receipt Number: <strong>{regFeeRecord.receiptNumber || 'N/A'}</strong></span>
              </div>
            </div>

            {regFeeRecord.status === 'Paid' ? (
              <button 
                onClick={() => setSelectedReceiptFee(regFeeRecord)}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
              >
                <FileText size={15} /> View Registration Receipt
              </button>
            ) : (
              <button 
                onClick={() => setPayingFee(regFeeRecord)}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
              >
                <CreditCard size={15} /> Pay Registration Fee (₹350)
              </button>
            )}
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-2 border-b border-gray-100">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <CreditCard size={22} className="text-emerald-700" />
                Personal Tuition & Fee History
              </h3>
              <p className="text-xs text-gray-500">
                Registration Fee = ₹350 (One Time Only) | Monthly Training Fee = ₹150 per month.
              </p>
            </div>

            <div className="flex gap-3 text-xs font-mono font-bold">
              <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-900">
                Total Paid: ₹{totalAmountPaid}
              </div>
              <div className="p-2.5 bg-amber-50 border border-amber-100 rounded-xl text-amber-900">
                Outstanding: ₹{totalOutstanding}
              </div>
            </div>
          </div>

          {/* Full Fees Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-mono uppercase">
                <tr>
                  <th className="p-3">Fee Type</th>
                  <th className="p-3">Month / Category</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Payment Status</th>
                  <th className="p-3">Receipt Number</th>
                  <th className="p-3">Payment Date</th>
                  <th className="p-3 text-right">Receipt / Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {studentFees.map(f => {
                  const isReg = f.feeType === 'Registration' || f.month === 'Registration Fee';
                  return (
                    <tr key={f.id} className="hover:bg-gray-50/60">
                      <td className="p-3 font-bold">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                          isReg ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                        }`}>
                          {isReg ? 'Registration Fee' : 'Monthly Fee'}
                        </span>
                      </td>
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
                      <td className="p-3 font-mono text-emerald-800 font-bold">{f.receiptNumber || '—'}</td>
                      <td className="p-3 text-gray-500 font-mono">
                        {f.paymentDate ? `${f.paymentDate}` : '—'}
                      </td>
                      <td className="p-3 text-right">
                        {f.status === 'Paid' ? (
                          <button 
                            onClick={() => setSelectedReceiptFee(f)}
                            className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-lg text-xs font-bold border border-emerald-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <FileText size={13} /> View Receipt
                          </button>
                        ) : (
                          <button
                            onClick={() => setPayingFee(f)}
                            className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-sm cursor-pointer transition-all inline-flex items-center gap-1"
                          >
                            <CreditCard size={13} /> Pay Dues (₹{f.amount})
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Online Payment Modal */}
          {payingFee && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative border border-emerald-100">
                <button onClick={() => setPayingFee(null)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1 rounded-full">
                  <X size={20} />
                </button>

                <div className="space-y-1">
                  <span className="text-xs font-mono font-bold text-emerald-700 uppercase">Online Settlement Portal</span>
                  <h4 className="text-lg font-bold text-gray-900">Settle Dues for {payingFee.month}</h4>
                  <p className="text-xs text-gray-500">KSSB FC Digital Tuition & Admission Billing</p>
                </div>

                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Athlete Name:</span>
                    <strong className="text-gray-900">{student.name}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Fee Category:</span>
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
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={16} /> Confirm & Issue Digital Receipt (₹{payingFee.amount})
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. CAMP JERSEY STORE TAB */}
      {activeTab === 'store' && (
        <StudentJerseyStore
          student={student}
          jerseys={jerseys}
          orders={orders}
          onPlaceOrder={onPlaceOrder || (() => {})}
        />
      )}

      {/* 4. PERSONAL PROFILE & RECORDS */}
      {activeTab === 'profile' && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 space-y-6 shadow-sm">
          <div className="space-y-1 pb-4 border-b border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <User size={22} className="text-emerald-700" />
              Personal Athlete Profile & Financial Breakdown
            </h3>
            <p className="text-xs text-gray-500">Registered personal details, age category, parent/guardian contact, and complete fee summary.</p>
          </div>

          {/* Camp Jersey Store Direct Profile Card */}
          {jerseys.length > 0 && (
            <div className="p-4 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-emerald-500/10 border border-amber-300 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Shirt className="text-amber-600" size={18} />
                  <span className="font-bold text-xs text-amber-900 font-mono uppercase">Camp Jersey Available in Store</span>
                </div>
                <h4 className="font-extrabold text-sm text-gray-900">{jerseys[0].name}</h4>
                <p className="text-xs text-gray-600">
                  Price: <strong className="text-emerald-800 font-mono">₹{jerseys[0].price}.00</strong> | Sizes: <strong>6yrs, 8yrs, 10yrs, 12yrs, 14yrs, 15yrs, 16yrs</strong>
                </p>
              </div>
              <button
                onClick={() => setActiveTab('store')}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-sm flex items-center gap-2 transition-all cursor-pointer shrink-0"
              >
                <ShoppingBag size={15} /> Order Jersey Now
              </button>
            </div>
          )}


          {/* Registration Fee Summary Block */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3 shadow-md border border-slate-800">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Tag className="text-amber-400" size={18} />
                <span className="font-bold text-sm text-white">Registration Fee Status:</span>
                <span className={`px-2.5 py-0.5 rounded text-xs font-extrabold ${
                  regFeeRecord.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  ₹350 ({regFeeRecord.status})
                </span>
              </div>
              {regFeeRecord.status === 'Paid' && (
                <button 
                  onClick={() => setSelectedReceiptFee(regFeeRecord)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <FileText size={14} /> Receipt
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Registration Fee</span>
                <span className="font-bold text-amber-400">₹350 (One Time Only)</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Registration Paid Date</span>
                <span className="font-bold text-slate-200">{regFeeRecord.paymentDate || '—'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Total Amount Paid</span>
                <span className="font-bold text-emerald-400">₹{totalAmountPaid}.00</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block uppercase">Outstanding Amount</span>
                <span className="font-bold text-rose-400">₹{totalOutstanding}.00</span>
              </div>
            </div>
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
                  <span className="text-gray-500">Registration Number:</span>
                  <strong className="text-emerald-800 font-mono font-bold">{student.registrationNumber || 'N/A'}</strong>
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
                  <strong className="text-gray-900 font-semibold">{student.fatherName || student.parentName}</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-gray-200/60">
                  <span className="text-gray-500 font-mono">Mobile Number:</span>
                  <strong className="text-gray-900 font-semibold font-mono">{student.mobileNo || student.parentPhone}</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-500">Email Address:</span>
                  <strong className="text-gray-900 font-semibold">{student.parentEmail || '—'}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Player ID Card Modal */}
      <PlayerIDCardModal
        isOpen={showIdCardModal}
        onClose={() => setShowIdCardModal(false)}
        student={student}
      />
    </div>
  );
}
