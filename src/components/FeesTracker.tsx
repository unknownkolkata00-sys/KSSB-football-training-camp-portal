import React, { useState } from 'react';
import { Student, FeeStatus } from '../types';
import { Check, CreditCard, IndianRupee, Search, AlertCircle, FileText, CheckCircle2, Clock, AlertTriangle, Download, ShieldCheck, Tag, Lock, ArrowLeft, X } from 'lucide-react';
import { downloadFeesReportCSV } from '../utils/reports';
import ReceiptModal from './ReceiptModal';
import StudentAvatar from './StudentAvatar';

interface FeesTrackerProps {
  students: Student[];
  fees: FeeStatus[];
  onUpdateFee: (fee: FeeStatus) => void;
  role?: 'admin' | 'coach' | 'student';
  loggedInStudentId?: string;
}

export default function FeesTracker({
  students,
  fees,
  onUpdateFee,
  role = 'coach',
  loggedInStudentId = ''
}: FeesTrackerProps) {
  const isStudent = role === 'student';
  const [selectedMonth, setSelectedMonth] = useState('August 2026');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Paid'>('All');
  const [feeTypeFilter, setFeeTypeFilter] = useState<'All' | 'Registration' | 'Monthly' | 'PendingRegistration'>('All');
  
  // Updating fee modal state
  const [editingFee, setEditingFee] = useState<FeeStatus | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash Handover');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [regSettlementMode, setRegSettlementMode] = useState<'Paid' | 'Free'>('Paid');
  const [freeRegCategory, setFreeRegCategory] = useState<'Special Child' | 'Members Child' | 'Coach Reference' | 'Members Reference' | 'Inaugural Free Offer'>('Special Child');

  // Viewing Receipt modal state
  const [selectedReceiptFee, setSelectedReceiptFee] = useState<FeeStatus | null>(null);

  // Open modal pre-configured for fee
  const handleOpenEditModal = (fee: FeeStatus, defaultMode?: 'Paid' | 'Free' | 'Pending', defaultCat?: 'Special Child' | 'Members Child' | 'Coach Reference' | 'Members Reference' | 'Inaugural Free Offer') => {
    setEditingFee(fee);
    setPaymentDate(fee.paymentDate || new Date().toISOString().split('T')[0]);
    if (fee.paymentMethod && !fee.paymentMethod.startsWith('Waived')) {
      setPaymentMethod(fee.paymentMethod);
    }
    const isReg = fee.feeType === 'Registration' || fee.month.startsWith('Registration Fee');
    
    if (isReg) {
      if (defaultMode) {
        setRegSettlementMode(defaultMode === 'Pending' ? 'Paid' : defaultMode);
      } else if (fee.amount === 0 || (fee.month && fee.month.includes('('))) {
        setRegSettlementMode('Free');
      } else {
        setRegSettlementMode('Paid');
      }

      if (defaultCat) {
        setFreeRegCategory(defaultCat);
      } else if (fee.month.includes('Special Child')) {
        setFreeRegCategory('Special Child');
      } else if (fee.month.includes('Members Child')) {
        setFreeRegCategory('Members Child');
      } else if (fee.month.includes('Coach Reference')) {
        setFreeRegCategory('Coach Reference');
      } else if (fee.month.includes('Members Reference')) {
        setFreeRegCategory('Members Reference');
      } else if (fee.month.includes('Inaugural Free Offer')) {
        setFreeRegCategory('Inaugural Free Offer');
      } else {
        setFreeRegCategory('Special Child');
      }
    }
  };

  // Helper to mark registration fee as Free Waiver directly (Admin Only)
  const handleMarkAsFreeWaiver = (regFee: FeeStatus, category: 'Special Child' | 'Members Child' | 'Coach Reference' | 'Members Reference' | 'Inaugural Free Offer' = 'Special Child') => {
    const today = new Date().toISOString().split('T')[0];
    let monthTitle = `Registration Fee (${category})`;
    let methodTitle = `Waived - ${category}`;
    let recPrefix = 'KSSB-FREE-';

    if (category === 'Special Child') recPrefix = 'KSSB-FREE-SPECIAL-';
    else if (category === 'Members Child') recPrefix = 'KSSB-FREE-MEMBERS-';
    else if (category === 'Coach Reference') recPrefix = 'KSSB-FREE-COACH-';
    else if (category === 'Members Reference') recPrefix = 'KSSB-FREE-MEM-REF-';
    else if (category === 'Inaugural Free Offer') {
      methodTitle = 'Inaugural Offer Waived (First 15 Students)';
      recPrefix = 'KSSB-FREE-OFFER-';
    }

    const student = students.find(s => s.id === regFee.studentId);
    const recNum = regFee.receiptNumber || (recPrefix + (student?.registrationNumber ? student.registrationNumber.replace(/[\/\s]/g, '-') : Math.floor(1000 + Math.random() * 9000)));

    onUpdateFee({
      ...regFee,
      amount: 0,
      status: 'Paid',
      month: monthTitle,
      paymentDate: today,
      paymentMethod: methodTitle,
      receiptNumber: recNum
    });
  };

  // Helper to mark registration fee received directly (Admin Only)
  const handleMarkRegistrationFeeReceived = (regFee: FeeStatus) => {
    const today = new Date().toISOString().split('T')[0];
    const student = students.find(s => s.id === regFee.studentId);
    const recNum = regFee.receiptNumber || (`KSSB-REG-2026-` + (student?.registrationNumber ? student.registrationNumber.replace(/[\/\s]/g, '-') : Math.floor(1000 + Math.random() * 9000)));
    onUpdateFee({
      ...regFee,
      amount: 350,
      status: 'Paid',
      month: 'Registration Fee',
      paymentDate: today,
      paymentMethod: paymentMethod || 'Cash Handover',
      receiptNumber: recNum
    });
  };

  // Helper to reset a fee back to Pending (Admin Only)
  const handleResetFeeToPending = (fee: FeeStatus) => {
    const isReg = fee.feeType === 'Registration' || fee.month.startsWith('Registration Fee');
    onUpdateFee({
      ...fee,
      amount: isReg ? 350 : 150,
      status: 'Pending',
      month: isReg ? 'Registration Fee' : fee.month,
      paymentDate: undefined,
      paymentMethod: undefined,
      receiptNumber: undefined
    });
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFee) return;

    const isReg = editingFee.feeType === 'Registration' || editingFee.month.startsWith('Registration Fee');
    
    if (isReg) {
      if (regSettlementMode === 'Free') {
        let monthTitle = `Registration Fee (${freeRegCategory})`;
        let methodTitle = `Waived - ${freeRegCategory}`;
        let recPrefix = 'KSSB-FREE-';

        if (freeRegCategory === 'Special Child') recPrefix = 'KSSB-FREE-SPECIAL-';
        else if (freeRegCategory === 'Members Child') recPrefix = 'KSSB-FREE-MEMBERS-';
        else if (freeRegCategory === 'Coach Reference') recPrefix = 'KSSB-FREE-COACH-';
        else if (freeRegCategory === 'Members Reference') recPrefix = 'KSSB-FREE-MEM-REF-';
        else if (freeRegCategory === 'Inaugural Free Offer') {
          methodTitle = 'Inaugural Offer Waived (First 15 Students)';
          recPrefix = 'KSSB-FREE-OFFER-';
        }

        const student = students.find(s => s.id === editingFee.studentId);
        const recNum = editingFee.receiptNumber || (recPrefix + (student?.registrationNumber ? student.registrationNumber.replace(/[\/\s]/g, '-') : Math.floor(1000 + Math.random() * 9000)));

        onUpdateFee({
          ...editingFee,
          amount: 0,
          status: 'Paid',
          month: monthTitle,
          paymentDate,
          paymentMethod: methodTitle,
          receiptNumber: recNum
        });
      } else {
        const student = students.find(s => s.id === editingFee.studentId);
        const recNum = editingFee.receiptNumber || ('KSSB-REG-2026-' + (student?.registrationNumber ? student.registrationNumber.replace(/[\/\s]/g, '-') : Math.floor(1000 + Math.random() * 9000)));
        onUpdateFee({
          ...editingFee,
          amount: 350,
          status: 'Paid',
          month: 'Registration Fee',
          paymentDate,
          paymentMethod,
          receiptNumber: recNum
        });
      }
    } else {
      const recPrefix = 'KSSB-MON-2026-';
      const recNum = editingFee.receiptNumber || (recPrefix + Math.floor(1000 + Math.random() * 9000));

      onUpdateFee({
        ...editingFee,
        status: 'Paid',
        paymentDate,
        paymentMethod,
        receiptNumber: recNum
      });
    }

    setEditingFee(null);
  };

  if (isStudent) {
    const student = students.find(s => s.id === loggedInStudentId) || students[0];
    const studentLedger = fees.filter(f => f.studentId === student?.id);
    
    // Find Registration Fee Record
    const regFee = studentLedger.find(f => f.feeType === 'Registration' || f.month.startsWith('Registration Fee')) || {
      id: 'f_reg_' + student?.id,
      studentId: student?.id || '',
      feeType: 'Registration' as const,
      month: 'Registration Fee',
      amount: 350,
      status: 'Pending' as const
    };

    const isFreeInaugural = regFee.amount === 0 || (regFee.month && regFee.month.includes('Inaugural'));

    const totalPaid = studentLedger.filter(f => f.status === 'Paid').reduce((sum, f) => sum + f.amount, 0);
    const totalOutstanding = studentLedger.filter(f => f.status !== 'Paid').reduce((sum, f) => sum + f.amount, 0);

    return (
      <div className="space-y-6 animate-fade-in" id="student-fees-tracker-root">
        
        {/* Receipt Modal */}
        {selectedReceiptFee && (
          <ReceiptModal 
            fee={selectedReceiptFee} 
            student={student} 
            onClose={() => setSelectedReceiptFee(null)} 
          />
        )}

        {/* Header */}
        <div className="space-y-1" id="student-fees-header">
          <h2 className="text-2xl font-black text-gray-900 font-sans">Student Fee Ledger & Digital Invoices</h2>
          <p className="text-sm text-gray-500">View your registration admission fee status, monthly training fees (₹150), and download official receipts. Payment settlement is handled by Club Admin.</p>
        </div>

        {/* Registration Fee Summary Banner */}
        <div className="p-5 bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 rounded-2xl text-white shadow-md border border-emerald-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-yellow-500/20 text-yellow-300 font-mono font-bold text-[10px] rounded uppercase border border-yellow-500/30">
                {isFreeInaugural ? '🎉 Inaugural Free Offer' : 'One-Time Enrolment Fee'}
              </span>
              <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                regFee.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {regFee.status === 'Paid' ? (isFreeInaugural ? 'Free Admission Claimed' : 'Paid & Verified') : 'Pending Payment'}
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-white">
              Registration Fee: {isFreeInaugural ? 'FREE (Inaugural Offer)' : '₹350'}
            </h3>
            <p className="text-xs text-emerald-300/90 font-medium">
              {isFreeInaugural 
                ? '🎁 Inaugural Offer: 100% Free Registration Admission for the first 15 student athletes!' 
                : 'Standard One-Time Enrolment Fee for KSSB FC Athletes.'}
            </p>
            <div className="text-xs text-slate-300 font-mono flex flex-wrap gap-x-4 gap-y-1 pt-1">
              <span>Paid Date: <strong>{regFee.paymentDate || 'Pending Settlement'}</strong></span>
              <span>Receipt No: <strong>{regFee.receiptNumber || 'N/A'}</strong></span>
            </div>
          </div>

          {regFee.status === 'Paid' ? (
            <button 
              onClick={() => setSelectedReceiptFee(regFee)}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
            >
              <FileText size={15} />
              View Registration Fee Receipt
            </button>
          ) : (
            <div className="px-4 py-2.5 bg-amber-500/20 text-amber-300 rounded-xl text-xs font-bold border border-amber-500/30 flex items-center gap-2 shrink-0">
              <Clock size={16} />
              Pending Admin Settlement
            </div>
          )}
        </div>

        {/* Student Total Financial Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-1">
            <span className="text-[11px] font-mono text-gray-500 uppercase font-bold block">Total Amount Paid</span>
            <div className="text-2xl font-black text-emerald-700">₹{totalPaid}.00</div>
            <span className="text-[10px] text-gray-400">Total fees settled to date</span>
          </div>
          <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm space-y-1">
            <span className="text-[11px] font-mono text-gray-500 uppercase font-bold block">Outstanding Amount</span>
            <div className="text-2xl font-black text-amber-600">₹{totalOutstanding}.00</div>
            <span className="text-[10px] text-gray-400">Total pending dues across all records</span>
          </div>
        </div>

        {/* Monthly Ledger Table */}
        <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-4" id="student-ledger-history-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
            <div>
              <h3 className="font-bold text-gray-900 font-sans text-base">Monthly Training Fees History (₹150 / Month)</h3>
              <p className="text-xs text-gray-500">Detailed list of monthly training fees and official receipts.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-mono font-bold text-gray-500 uppercase">
                  <th className="p-3">Fee Type</th>
                  <th className="p-3">Month / Description</th>
                  <th className="p-3">Fee Amount</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Receipt Number</th>
                  <th className="p-3">Settlement Date</th>
                  <th className="p-3 text-right">Official Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {studentLedger.map(fee => {
                  const isReg = fee.feeType === 'Registration' || fee.month === 'Registration Fee';
                  return (
                    <tr key={fee.id} className="hover:bg-gray-50/40">
                      <td className="p-3 font-bold">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                          isReg ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                        }`}>
                          {isReg ? 'Registration Fee' : 'Monthly Fee'}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-gray-900">{fee.month}</td>
                      <td className="p-3 font-mono font-black text-gray-900">₹{fee.amount}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          fee.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {fee.status === 'Paid' ? 'Paid' : 'Pending'}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-gray-600 font-semibold">{fee.receiptNumber || '—'}</td>
                      <td className="p-3 font-mono text-gray-500">{fee.paymentDate || '—'}</td>
                      <td className="p-3 text-right">
                        {fee.status === 'Paid' ? (
                          <button 
                            onClick={() => setSelectedReceiptFee(fee)}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold border border-emerald-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <FileText size={12} /> Receipt View
                          </button>
                        ) : (
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 border border-amber-200">
                            <Clock size={12} /> Pending Settlement
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ALL ADMIN / COACH AGGREGATES:
  // Sort students in enrollment sequence order
  const sortedStudents = [...students].sort((a, b) => {
    if (a.registrationNumber && b.registrationNumber) {
      const matchA = a.registrationNumber.match(/KSSBFC(\d+)\//i);
      const matchB = b.registrationNumber.match(/KSSBFC(\d+)\//i);
      if (matchA && matchB) {
        return parseInt(matchA[1], 10) - parseInt(matchB[1], 10);
      }
    }
    return (a.registrationDate || '').localeCompare(b.registrationDate || '');
  });

  const first15StudentIds = new Set(sortedStudents.slice(0, 15).map(s => s.id));
  const activeStudentIds = new Set(students.map(s => s.id));
  
  // Guarantee every active student has a Registration fee record in the working list
  // and ensure only the first 15 students have the Inaugural Free Offer
  const normalizedFees: FeeStatus[] = fees.map(f => {
    const isReg = f.feeType === 'Registration' || f.month.startsWith('Registration Fee');
    if (isReg) {
      const isStudentInFirst15 = first15StudentIds.has(f.studentId);
      const isInaugural = f.month.includes('Inaugural') || (f.paymentMethod && f.paymentMethod.includes('Inaugural'));
      // If student is #16+ and had Inaugural Free Offer, normalize to ₹350 Pending
      if (!isStudentInFirst15 && isInaugural) {
        return {
          ...f,
          month: 'Registration Fee',
          amount: 350,
          status: 'Pending' as const,
          paymentMethod: undefined,
          paymentDate: undefined,
          receiptNumber: undefined
        };
      }
    }
    return f;
  });

  sortedStudents.forEach((student, idx) => {
    const isFirst15 = idx < 15;
    const hasRegFee = normalizedFees.some(f => f.studentId === student.id && (f.feeType === 'Registration' || f.month.startsWith('Registration Fee')));
    if (!hasRegFee) {
      const todayStr = new Date().toISOString().split('T')[0];
      normalizedFees.push({
        id: 'f_reg_' + student.id,
        studentId: student.id,
        feeType: 'Registration',
        month: isFirst15 ? 'Registration Fee (Inaugural Free Offer)' : 'Registration Fee',
        amount: isFirst15 ? 0 : 350,
        status: isFirst15 ? 'Paid' : 'Pending',
        paymentMethod: isFirst15 ? 'Inaugural Offer Waived (First 15 Students)' : undefined,
        paymentDate: isFirst15 ? (student.registrationDate || todayStr) : undefined,
        receiptNumber: isFirst15 ? `KSSB-FREE-OFFER-${String(idx + 1).padStart(2, '0')}` : undefined
      });
    }
  });

  const activeFees = normalizedFees.filter(f => activeStudentIds.has(f.studentId));

  // Registration Fees Aggregates
  const allRegFees = activeFees.filter(f => f.feeType === 'Registration' || f.month.startsWith('Registration Fee'));
  const pendingRegFeesList = allRegFees.filter(f => f.status !== 'Paid');
  const paidRegFeesList = allRegFees.filter(f => f.status === 'Paid');
  
  const freeRegCount = allRegFees.filter(f => f.amount === 0 || (f.month && (f.month.includes('Inaugural') || f.month.includes('Free') || f.month.includes('Special') || f.month.includes('Members') || f.month.includes('Coach')))).length;
  const regFeeCollected = paidRegFeesList.reduce((sum, f) => sum + f.amount, 0);
  const regFeePending = pendingRegFeesList.reduce((sum, f) => sum + (f.amount || 350), 0);

  // Monthly Fees Aggregates
  const allMonthlyFees = activeFees.filter(f => f.feeType !== 'Registration' && !f.month.startsWith('Registration Fee'));
  const selectedMonthlyFees = selectedMonth === 'All' ? allMonthlyFees : allMonthlyFees.filter(f => f.month === selectedMonth);
  const pendingMonthlyList = selectedMonthlyFees.filter(f => f.status !== 'Paid');
  const paidMonthlyList = selectedMonthlyFees.filter(f => f.status === 'Paid');
  
  const monthlyFeeCollected = paidMonthlyList.reduce((sum, f) => sum + f.amount, 0);
  const monthlyFeePending = pendingMonthlyList.reduce((sum, f) => sum + f.amount, 0);

  // Filtered List for Table
  const filteredFees = normalizedFees.filter(fee => {
    const student = students.find(s => s.id === fee.studentId);
    if (!student) return false;

    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (student.registrationNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (student.fatherName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (student.mobileNo || '').includes(searchTerm);

    const isReg = fee.feeType === 'Registration' || fee.month.startsWith('Registration Fee');
    
    // Fee Type filter
    if (feeTypeFilter === 'PendingRegistration') {
      if (!isReg || fee.status === 'Paid') return false;
    } else if (feeTypeFilter === 'Registration') {
      if (!isReg) return false;
    } else if (feeTypeFilter === 'Monthly') {
      if (isReg) return false;
    }

    // Month Filter (only applies to monthly fees)
    if (!isReg && selectedMonth !== 'All' && fee.month !== selectedMonth && feeTypeFilter !== 'PendingRegistration') return false;

    // Status filter
    if (statusFilter !== 'All' && fee.status !== statusFilter) return false;

    return matchesSearch;
  });

  return (
    <div className="space-y-6" id="fees-tracker-root">
      
      {/* Admin Fee Rights & Permanent Record Notice */}
      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-2xl text-slate-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-amber-400 shrink-0" />
          <span><strong>Admin Settlement Policy:</strong> Fees settlement is exclusively under admin rights. Once marked as settled (Paid), records are locked permanently and cannot be changed.</span>
        </div>
        <span className="px-2.5 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800/80 rounded-lg text-[10px] font-mono font-bold uppercase shrink-0">
          Admin Rights Active
        </span>
      </div>

      {/* Pending Registration Fees Action Alert Banner */}
      {pendingRegFeesList.length > 0 && (
        <div className="p-4 bg-gradient-to-r from-amber-500/15 via-rose-500/10 to-amber-500/10 border-2 border-amber-400/80 rounded-2xl shadow-md space-y-3 animate-fade-in" id="pending-reg-alert-banner">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xl shrink-0 shadow-sm animate-pulse">
                ⚠️
              </div>
              <div>
                <div className="font-black text-amber-950 text-base flex items-center gap-2 flex-wrap">
                  Action Required: {pendingRegFeesList.length} Student{pendingRegFeesList.length > 1 ? 's' : ''} with PENDING Registration Fee (₹350)
                  <span className="px-2 py-0.5 bg-rose-600 text-white font-mono text-[10px] font-bold rounded-md uppercase">
                    Total Pending: ₹{regFeePending}
                  </span>
                </div>
                <p className="text-xs text-gray-700 font-medium pt-0.5">
                  Registration fees (₹350) for athletes enrolled after the inaugural first 15 or with unpaid registration must be marked as Paid or Waived (Free).
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setFeeTypeFilter('PendingRegistration');
                setStatusFilter('Pending');
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black shadow-sm transition-all cursor-pointer flex items-center gap-1.5 shrink-0 border border-amber-600/40"
            >
              <span>View {pendingRegFeesList.length} Pending Athletes</span>
              <ArrowLeft size={14} className="rotate-180" />
            </button>
          </div>

          {/* Quick Pending Athletes Pills */}
          <div className="pt-2 border-t border-amber-300/40 flex flex-wrap gap-2 items-center">
            <span className="text-[11px] font-mono font-bold text-amber-950 uppercase tracking-wide mr-1">
              Pending Athletes:
            </span>
            {pendingRegFeesList.map(pFee => {
              const pStudent = students.find(s => s.id === pFee.studentId);
              if (!pStudent) return null;
              return (
                <div 
                  key={pFee.id}
                  className="bg-white/90 border border-amber-300 rounded-xl p-1.5 pl-2.5 pr-1.5 flex items-center gap-2 text-xs shadow-2xs hover:bg-white transition-all"
                >
                  <StudentAvatar photoUrl={pStudent.photoUrl} name={pStudent.name} size="sm" />
                  <div className="leading-tight">
                    <span className="font-bold text-gray-900 block">{pStudent.name}</span>
                    <span className="text-[10px] font-mono text-emerald-800 font-semibold">{pStudent.registrationNumber || 'KSSBFC'}</span>
                  </div>
                  <div className="flex items-center gap-1 ml-1">
                    <button
                      onClick={() => handleOpenEditModal(pFee, 'Paid')}
                      className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[10px] font-bold shadow-2xs transition-all cursor-pointer flex items-center gap-0.5"
                      title="Mark Registration Fee Paid (₹350)"
                    >
                      <CreditCard size={10} />
                      <span>₹350</span>
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(pFee, 'Free')}
                      className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-[10px] font-black shadow-2xs transition-all cursor-pointer flex items-center gap-0.5 border border-amber-400"
                      title="Mark Registration Fee as Free Waiver"
                    >
                      <Tag size={10} />
                      <span>Free</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Inaugural Admission Offer Announcement Banner */}
      <div className="p-4 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs" id="inaugural-offer-banner">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center font-bold text-xl shrink-0 border border-amber-500/30 shadow-2xs">
            🎁
          </div>
          <div>
            <div className="font-black text-gray-900 text-sm flex items-center gap-2 flex-wrap">
              Registration Fee Policy & Inaugural Waiver Offer
              <span className="px-2 py-0.5 bg-amber-500 text-white font-mono text-[10px] font-extrabold rounded-full uppercase">First 15 Free</span>
              <span className="px-2 py-0.5 bg-emerald-800 text-white font-mono text-[10px] font-bold rounded-full uppercase">Player #16+ ₹350</span>
            </div>
            <p className="text-xs text-gray-600 font-medium pt-0.5">
              First 15 student enrollments enjoy 100% free inaugural registration admission. Subsequent enrollments (Player #16 onwards) pay standard ₹350 registration fee unless granted a special waiver.
            </p>
          </div>
        </div>
        <div className="px-3.5 py-1.5 bg-emerald-950 text-emerald-200 rounded-xl font-mono text-xs font-bold border border-emerald-700 shrink-0">
          Inaugural Free Slots: <span className="text-amber-400 font-black">{Math.min(freeRegCount, 15)} / 15</span> | Total Enrolled: <span className="text-white font-black">{students.length}</span>
        </div>
      </div>

      {/* Receipt Modal */}
      {selectedReceiptFee && (
        <ReceiptModal 
          fee={selectedReceiptFee} 
          student={students.find(s => s.id === selectedReceiptFee.studentId)} 
          onClose={() => setSelectedReceiptFee(null)} 
        />
      )}

      {/* Financial Overview Metrics Cards (Interactive Filters) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="fees-overview-grid">
        
        {/* Registration Fee Collected */}
        <button 
          type="button"
          onClick={() => {
            setFeeTypeFilter('Registration');
            setStatusFilter('Paid');
          }}
          className={`text-left p-5 rounded-2xl shadow-sm space-y-1.5 transition-all cursor-pointer border ${
            feeTypeFilter === 'Registration' && statusFilter === 'Paid'
              ? 'bg-emerald-100 border-emerald-500 ring-2 ring-emerald-500 shadow-md'
              : 'bg-emerald-50/90 border-emerald-200 hover:bg-emerald-100/60'
          }`}
          id="fees-reg-collected"
        >
          <div className="flex justify-between items-center text-emerald-800">
            <span className="text-[10px] font-mono uppercase tracking-wider block font-bold">Registration Collected</span>
            <Tag size={16} className="text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-950 flex items-center">
            <CheckCircle2 size={22} className="text-emerald-600 mr-1.5" />
            ₹{regFeeCollected}
          </div>
          <p className="text-[11px] text-emerald-700 font-medium">
            {paidRegFeesList.length} Settled ({freeRegCount} Free Waivers)
          </p>
        </button>

        {/* Registration Fee Pending */}
        <button 
          type="button"
          onClick={() => {
            setFeeTypeFilter('PendingRegistration');
            setStatusFilter('Pending');
          }}
          className={`text-left p-5 rounded-2xl shadow-sm space-y-1.5 transition-all cursor-pointer border ${
            feeTypeFilter === 'PendingRegistration'
              ? 'bg-amber-100 border-amber-500 ring-2 ring-amber-500 shadow-md'
              : 'bg-amber-50/90 border-amber-200 hover:bg-amber-100/60'
          }`}
          id="fees-reg-pending"
        >
          <div className="flex justify-between items-center text-amber-800">
            <span className="text-[10px] font-mono uppercase tracking-wider block font-bold">Registration Pending</span>
            <Clock size={16} className="text-amber-600" />
          </div>
          <div className="text-3xl font-black text-amber-950 flex items-center">
            <Clock size={22} className="text-amber-600 mr-1.5" />
            ₹{regFeePending}
          </div>
          <p className="text-[11px] text-amber-700 font-medium">
            {pendingRegFeesList.length} Player{pendingRegFeesList.length !== 1 ? 's' : ''} Pending (₹350 each)
          </p>
        </button>

        {/* Monthly Fee Collected */}
        <button 
          type="button"
          onClick={() => {
            setFeeTypeFilter('Monthly');
            setStatusFilter('Paid');
          }}
          className={`text-left p-5 rounded-2xl shadow-sm space-y-1.5 transition-all cursor-pointer border ${
            feeTypeFilter === 'Monthly' && statusFilter === 'Paid'
              ? 'bg-indigo-100 border-indigo-500 ring-2 ring-indigo-500 shadow-md'
              : 'bg-indigo-50/90 border-indigo-200 hover:bg-indigo-100/60'
          }`}
          id="fees-monthly-collected"
        >
          <div className="flex justify-between items-center text-indigo-800">
            <span className="text-[10px] font-mono uppercase tracking-wider block font-bold">Monthly Fee Collected</span>
            <IndianRupee size={16} className="text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-indigo-950 flex items-center">
            <CheckCircle2 size={22} className="text-indigo-600 mr-1.5" />
            ₹{monthlyFeeCollected}
          </div>
          <p className="text-[11px] text-indigo-700 font-medium">Monthly ₹150 Tuition ({selectedMonth})</p>
        </button>

        {/* Monthly Fee Pending */}
        <button 
          type="button"
          onClick={() => {
            setFeeTypeFilter('Monthly');
            setStatusFilter('Pending');
          }}
          className={`text-left p-5 rounded-2xl shadow-sm space-y-1.5 transition-all cursor-pointer border ${
            feeTypeFilter === 'Monthly' && statusFilter === 'Pending'
              ? 'bg-rose-100 border-rose-500 ring-2 ring-rose-500 shadow-md'
              : 'bg-rose-50/90 border-rose-200 hover:bg-rose-100/60'
          }`}
          id="fees-monthly-pending"
        >
          <div className="flex justify-between items-center text-rose-800">
            <span className="text-[10px] font-mono uppercase tracking-wider block font-bold">Monthly Fee Pending</span>
            <AlertTriangle size={16} className="text-rose-600" />
          </div>
          <div className="text-3xl font-black text-rose-950 flex items-center">
            <AlertTriangle size={22} className="text-rose-600 mr-1.5" />
            ₹{monthlyFeePending}
          </div>
          <p className="text-[11px] text-rose-700 font-medium">{pendingMonthlyList.length} Pending ({selectedMonth})</p>
        </button>

      </div>

      {/* Filter and Control Bar */}
      <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-3" id="fees-filters-card">
        <div className="flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center">
          
          {/* Search bar */}
          <div className="relative max-w-sm w-full">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search athlete, reg no, or parent..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:bg-white"
            />
          </div>

          {/* Filter options */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            
            {/* Category Filter */}
            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200 text-xs flex-wrap">
              <span className="text-[10px] font-mono font-bold text-gray-500 uppercase px-1.5">View:</span>
              
              <button
                onClick={() => { setFeeTypeFilter('All'); setStatusFilter('All'); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  feeTypeFilter === 'All' && statusFilter === 'All' ? 'bg-slate-900 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                All Fees
              </button>

              <button
                onClick={() => { setFeeTypeFilter('PendingRegistration'); setStatusFilter('Pending'); }}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center gap-1 ${
                  feeTypeFilter === 'PendingRegistration' 
                    ? 'bg-amber-500 text-slate-950 font-black shadow-xs ring-1 ring-amber-600' 
                    : 'text-amber-800 bg-amber-50 hover:bg-amber-100'
                }`}
              >
                <span>⚡ Pending Reg Fees</span>
                {pendingRegFeesList.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded-full text-[10px] font-black">
                    {pendingRegFeesList.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setFeeTypeFilter('Registration')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  feeTypeFilter === 'Registration' ? 'bg-emerald-700 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Reg Fees (₹350/Free)
              </button>

              <button
                onClick={() => setFeeTypeFilter('Monthly')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  feeTypeFilter === 'Monthly' ? 'bg-indigo-700 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly Fees (₹150)
              </button>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-xl border border-gray-200 text-xs">
              <span className="text-[10px] font-mono font-bold text-gray-500 uppercase px-1.5">Status:</span>
              {(['All', 'Pending', 'Paid'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    statusFilter === st ? 'bg-gray-800 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {st === 'All' ? 'All' : st === 'Pending' ? 'Pending' : 'Settled (Paid)'}
                </button>
              ))}
            </div>

            {/* Month Select */}
            {feeTypeFilter !== 'PendingRegistration' && feeTypeFilter !== 'Registration' && (
              <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-xl border border-gray-200 text-xs">
                <span className="text-[10px] font-mono font-bold text-gray-500 uppercase">Month:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent font-bold text-gray-800 focus:outline-none"
                >
                  <option value="All">All Months</option>
                  <option value="August 2026">August 2026</option>
                  <option value="September 2026">September 2026</option>
                  <option value="October 2026">October 2026</option>
                  <option value="November 2026">November 2026</option>
                  <option value="December 2026">December 2026</option>
                </select>
              </div>
            )}

            {/* CSV Report Export */}
            <button
              onClick={() => downloadFeesReportCSV(students, normalizedFees, selectedMonth)}
              className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ml-auto lg:ml-0"
              id="fees-tracker-download-btn"
            >
              <Download size={14} /> Download Ledger (CSV)
            </button>
          </div>

        </div>
      </div>

      {/* Record Payment Modal */}
      {editingFee && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all" id="edit-payment-modal">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-xl relative border border-emerald-100 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header Actions */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <button
                type="button"
                onClick={() => setEditingFee(null)}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200"
                id="edit-fee-modal-top-back-btn"
              >
                <ArrowLeft size={14} /> Back
              </button>

              <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase tracking-widest">Financial Settlement</span>

              <button
                type="button"
                onClick={() => setEditingFee(null)}
                className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer border border-rose-200"
                id="edit-fee-modal-top-close-btn"
              >
                <X size={16} /> Close
              </button>
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <CreditCard size={18} className="text-emerald-600" />
                {(editingFee.feeType === 'Registration' || editingFee.month.startsWith('Registration Fee'))
                  ? 'Registration Fee Settlement'
                  : `Mark Fee Received (₹${editingFee.amount})`}
              </h3>
              <p className="text-xs text-gray-500">
                Student Athlete: <strong>{students.find(s => s.id === editingFee.studentId)?.name}</strong> | Category: <strong>{editingFee.month}</strong>
              </p>
            </div>

            <form onSubmit={handleSavePayment} className="space-y-4">
              
              {/* Registration Fee Type Toggle (Paid vs Free) */}
              {(editingFee.feeType === 'Registration' || editingFee.month.startsWith('Registration Fee')) ? (
                <div className="space-y-3 pt-1 border-t border-gray-100">
                  <label className="text-xs font-mono font-bold text-gray-700 uppercase block">Settlement Option</label>
                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setRegSettlementMode('Paid')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        regSettlementMode === 'Paid'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      💳 Paid Fee (₹350)
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegSettlementMode('Free')}
                      className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                        regSettlementMode === 'Free'
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      🎁 Free Registration (₹0)
                    </button>
                  </div>

                  {regSettlementMode === 'Free' ? (
                    <div className="space-y-2 p-3 bg-amber-50/90 border border-amber-200 rounded-xl">
                      <label className="text-xs font-mono font-bold text-amber-900 uppercase block">Select Free Registration Category</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {[
                          { id: 'Special Child', label: 'Special Child', icon: '🌟', desc: '100% Free Registration' },
                          { id: 'Members Child', label: 'Members Child', icon: '🏆', desc: 'Club Member Privilege' },
                          { id: 'Coach Reference', label: 'Coach Reference', icon: '⚽', desc: 'Recommended by Coach' },
                          { id: 'Members Reference', label: 'Members Reference', icon: '🤝', desc: 'Recommended by Member' },
                          { id: 'Inaugural Free Offer', label: 'Inaugural Offer', icon: '🎁', desc: 'First 15 Students Offer' },
                        ].map(cat => (
                          <label 
                            key={cat.id} 
                            className={`p-2.5 rounded-xl border flex items-start gap-2 cursor-pointer transition-all ${
                              freeRegCategory === cat.id 
                                ? 'bg-white border-amber-500 ring-2 ring-amber-400/50 text-amber-950 font-bold shadow-2xs' 
                                : 'bg-white/70 border-amber-200/80 text-gray-700 hover:bg-white'
                            }`}
                          >
                            <input 
                              type="radio" 
                              name="freeCategory" 
                              value={cat.id} 
                              checked={freeRegCategory === cat.id} 
                              onChange={() => setFreeRegCategory(cat.id as any)}
                              className="mt-0.5 text-amber-600 focus:ring-amber-500"
                            />
                            <div>
                              <div className="flex items-center gap-1 font-bold leading-tight">
                                <span>{cat.icon}</span>
                                <span>{cat.label}</span>
                              </div>
                              <span className="text-[10px] text-gray-500 block leading-tight pt-0.5">{cat.desc}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="text-xs font-mono font-bold text-gray-700 uppercase">Payment Method / Channel</label>
                      <select 
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold bg-white"
                      >
                        <option value="Cash Handover">Cash Handover</option>
                        <option value="UPI / GPay / PhonePe">UPI / PhonePe / GPay</option>
                        <option value="Bank Transfer">Direct Bank Transfer</option>
                        <option value="Credit/Debit Card">Credit/Debit Card</option>
                        <option value="Check">Paper Check</option>
                      </select>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-xs font-mono font-bold text-gray-700 uppercase">Payment Method / Channel</label>
                  <select 
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold bg-white"
                  >
                    <option value="Cash Handover">Cash Handover</option>
                    <option value="UPI / GPay / PhonePe">UPI / PhonePe / GPay</option>
                    <option value="Bank Transfer">Direct Bank Transfer</option>
                    <option value="Credit/Debit Card">Credit/Debit Card</option>
                    <option value="Check">Paper Check</option>
                  </select>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-gray-700 uppercase">Payment Settlement Date</label>
                <input 
                  type="date" 
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none"
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5 justify-between items-center pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setEditingFee(null)}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold hover:bg-gray-50 cursor-pointer flex items-center justify-center gap-1.5"
                  id="edit-fee-modal-bottom-back-btn"
                >
                  <ArrowLeft size={14} /> Back
                </button>

                <button 
                  type="submit"
                  className={`w-full sm:w-auto px-5 py-2 rounded-xl text-xs font-extrabold cursor-pointer flex items-center justify-center gap-1.5 shadow-sm transition-all ${
                    (editingFee.feeType === 'Registration' || editingFee.month.startsWith('Registration Fee')) && regSettlementMode === 'Free'
                      ? 'bg-amber-500 text-slate-950 hover:bg-amber-600 border border-amber-400'
                      : 'bg-emerald-700 text-white hover:bg-emerald-800'
                  }`}
                >
                  <CheckCircle2 size={15} />
                  {(editingFee.feeType === 'Registration' || editingFee.month.startsWith('Registration Fee')) && regSettlementMode === 'Free'
                    ? 'Confirm Free Registration & Issue Voucher (₹0.00)'
                    : 'Confirm Payment & Issue Receipt'}
                </button>

                <button 
                  type="button"
                  onClick={() => setEditingFee(null)}
                  className="w-full sm:w-auto px-4 py-2 bg-rose-50 text-rose-700 rounded-xl text-xs font-bold hover:bg-rose-100 cursor-pointer border border-rose-200 flex items-center justify-center gap-1.5"
                  id="edit-fee-modal-bottom-close-btn"
                >
                  <X size={14} /> Close
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Ledger Records View */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 sm:p-0 sm:overflow-hidden" id="fees-table-card">
        
        {/* Mobile Vertical Cards View */}
        <div className="block sm:hidden space-y-3">
          {filteredFees.length > 0 ? (
            filteredFees.map(fee => {
              const student = students.find(s => s.id === fee.studentId);
              const isReg = fee.feeType === 'Registration' || fee.month.startsWith('Registration Fee');
              const isFree = fee.amount === 0 || (fee.month && (fee.month.includes('Inaugural') || fee.month.includes('Free') || fee.month.includes('Special') || fee.month.includes('Members') || fee.month.includes('Coach')));
              return (
                <div key={fee.id} className="p-4 bg-gray-50/80 border border-gray-200 rounded-2xl space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2.5">
                      <StudentAvatar photoUrl={student?.photoUrl} name={student?.name || 'Athlete'} size="md" />
                      <div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase inline-block mb-0.5 ${
                          isReg ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                        }`}>
                          {isReg ? (isFree ? `Registration Fee (FREE - ${fee.month.includes('(') ? fee.month.split('(')[1].replace(')', '') : 'Waived'})` : 'Registration Fee (₹350)') : `Monthly Fee (${fee.month})`}
                        </span>
                        <div className="font-extrabold text-gray-900 text-sm leading-tight">{student?.name || 'Unknown student'}</div>
                        <div className="text-[11px] text-gray-500 font-mono">Reg: {student?.registrationNumber}</div>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                      fee.status === 'Paid' ? (isFree ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-200') : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {fee.status === 'Paid' ? (isFree ? 'Free Admission' : 'Paid') : 'Pending'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-gray-200/80">
                    <div>
                      <span className="text-[10px] text-gray-400 font-mono uppercase block">Paid Date</span>
                      <span className="font-mono font-bold text-gray-800">{fee.paymentDate || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 font-mono uppercase block">Receipt No</span>
                      <span className="font-mono font-bold text-emerald-800 break-all">{fee.receiptNumber || '—'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 pt-1 border-t border-gray-200">
                    {fee.status !== 'Paid' && isReg && (
                      <div className="flex flex-col gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(fee, 'Free')}
                          className="w-full py-2 bg-amber-500 text-slate-950 hover:bg-amber-600 rounded-xl text-xs font-black shadow-2xs transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 border border-amber-400"
                        >
                          🎁 Mark Free Registration (Special/Member/Ref)
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(fee, 'Paid')}
                          className="w-full py-2 bg-emerald-700 text-white hover:bg-emerald-800 rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 size={14} /> Mark Paid (₹350 Standard Fee)
                        </button>
                      </div>
                    )}

                    {fee.status !== 'Paid' && !isReg && (
                      <button
                        onClick={() => handleOpenEditModal(fee, 'Paid')}
                        className="w-full py-2 bg-emerald-700 text-white hover:bg-emerald-800 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                      >
                        <CreditCard size={14} /> Record Monthly Fee Payment
                      </button>
                    )}

                    {fee.status === 'Paid' && (
                      <div className="w-full flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-mono text-[10px] font-bold rounded-lg border border-slate-200 inline-flex items-center gap-1">
                          <Lock size={10} className="text-slate-500" /> Locked Record
                        </span>
                        <button
                          onClick={() => setSelectedReceiptFee(fee)}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold border border-emerald-200 transition-all cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <FileText size={14} /> View Digital Receipt
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 text-gray-500 text-xs">
              No matching fee records found.
            </div>
          )}
        </div>

        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100 text-xs font-mono font-bold text-gray-500 uppercase">
                <th className="p-4">Student Athlete & Reg No</th>
                <th className="p-4">Fee Category</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Registration / Fee Status</th>
                <th className="p-4">Paid Date</th>
                <th className="p-4">Receipt Number</th>
                <th className="p-4 text-right">Actions / Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredFees.length > 0 ? (
                filteredFees.map(fee => {
                  const student = students.find(s => s.id === fee.studentId);
                  const isReg = fee.feeType === 'Registration' || fee.month.startsWith('Registration Fee');
                  const isFree = fee.amount === 0 || (fee.month && (fee.month.includes('Inaugural') || fee.month.includes('Free') || fee.month.includes('Special') || fee.month.includes('Members') || fee.month.includes('Coach')));
                  return (
                    <tr key={fee.id} className="hover:bg-emerald-50/20 transition-colors">
                      
                      {/* Student Details */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <StudentAvatar photoUrl={student?.photoUrl} name={student?.name || 'Athlete'} size="md" />
                          <div>
                            <div className="font-bold text-gray-900 text-sm leading-tight">{student?.name || 'Unknown Athlete'}</div>
                            <div className="text-[11px] font-mono text-emerald-800 font-bold">Reg: {student?.registrationNumber || 'N/A'}</div>
                          </div>
                        </div>
                      </td>

                      {/* Fee Category */}
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isReg ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                        }`}>
                          {isReg ? 'Registration Fee' : `Monthly Fee (${fee.month})`}
                        </span>
                      </td>

                      {/* Fee Amount */}
                      <td className="p-4 font-mono text-sm text-gray-950 font-black">
                        {isFree ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 font-extrabold rounded-lg text-xs">
                            FREE ({fee.month.includes('(') ? fee.month.split('(')[1].replace(')', '') : 'Waived'})
                          </span>
                        ) : (
                          `₹${fee.amount}`
                        )}
                      </td>

                      {/* Fee Status */}
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          fee.status === 'Paid' ? (isFree ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-800 border border-emerald-200') : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {fee.status === 'Paid' ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                          {fee.status === 'Paid' ? (isFree ? 'Free Admission' : 'Paid') : 'Pending'}
                        </span>
                      </td>

                      {/* Paid Date */}
                      <td className="p-4 font-mono font-semibold text-gray-700">
                        {fee.paymentDate || '—'}
                      </td>

                      {/* Receipt Number */}
                      <td className="p-4 font-mono font-bold text-emerald-900">
                        {fee.receiptNumber || (fee.status === 'Paid' ? `KSSB-${isReg ? 'REG' : 'MON'}-2026-${fee.id.slice(-4)}` : '—')}
                      </td>

                      {/* Action Button */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {fee.status !== 'Paid' && isReg && (
                            <>
                              <button
                                onClick={() => handleOpenEditModal(fee, 'Free')}
                                className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-black shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1 border border-amber-400"
                                title="Mark as Free Registration (Special Child, Members Child, Reference)"
                              >
                                🎁 Mark Free
                              </button>
                              <button
                                onClick={() => handleOpenEditModal(fee, 'Paid')}
                                className="px-2.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1"
                                id="mark-reg-fee-received-btn"
                              >
                                <CheckCircle2 size={13} /> Mark Paid (₹350)
                              </button>
                            </>
                          )}

                          {fee.status !== 'Paid' && !isReg && (
                            <button
                              onClick={() => handleOpenEditModal(fee, 'Paid')}
                              className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer inline-flex items-center gap-1"
                            >
                              <CreditCard size={14} /> Record Monthly Fee
                            </button>
                          )}

                          {fee.status === 'Paid' && (
                            <div className="inline-flex items-center gap-2">
                              <span className="px-2 py-1 bg-slate-100 text-slate-700 font-mono text-[10px] font-bold rounded-lg border border-slate-200 inline-flex items-center gap-1">
                                <Lock size={10} className="text-slate-500" /> Settled & Locked
                              </span>
                              <button
                                onClick={() => setSelectedReceiptFee(fee)}
                                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-lg text-xs font-bold border border-emerald-200 transition-all cursor-pointer inline-flex items-center gap-1"
                              >
                                <FileText size={14} /> Receipt View
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500 text-xs">
                    No matching fee records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
