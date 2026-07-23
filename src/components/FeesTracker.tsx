import React, { useState } from 'react';
import { Student, FeeStatus } from '../types';
import { Check, CreditCard, IndianRupee, Search, AlertCircle, FileText, CheckCircle2, Clock, AlertTriangle, Download, ShieldCheck, Tag } from 'lucide-react';
import { downloadFeesReportCSV } from '../utils/reports';
import ReceiptModal from './ReceiptModal';

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
  const [selectedMonth, setSelectedMonth] = useState('July 2026');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [feeTypeFilter, setFeeTypeFilter] = useState<'All' | 'Registration' | 'Monthly'>('All');
  
  // Updating fee modal state
  const [editingFee, setEditingFee] = useState<FeeStatus | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash Handover');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  // Viewing Receipt modal state
  const [selectedReceiptFee, setSelectedReceiptFee] = useState<FeeStatus | null>(null);

  // Student Specific payment states
  const [cardNo, setCardNo] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);

  // Helper to mark registration fee received
  const handleMarkRegistrationFeeReceived = (regFee: FeeStatus) => {
    const today = new Date().toISOString().split('T')[0];
    const recNum = regFee.receiptNumber || `KSSB-REG-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
    onUpdateFee({
      ...regFee,
      status: 'Paid',
      paymentDate: today,
      paymentMethod: 'Cash / Direct Settlement',
      receiptNumber: recNum
    });
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFee) return;

    const isReg = editingFee.feeType === 'Registration' || editingFee.month === 'Registration Fee';
    const recPrefix = isReg ? 'KSSB-REG-2026-' : 'KSSB-MON-2026-';
    const recNum = editingFee.receiptNumber || (recPrefix + Math.floor(1000 + Math.random() * 9000));

    onUpdateFee({
      ...editingFee,
      status: 'Paid',
      paymentDate,
      paymentMethod,
      receiptNumber: recNum
    });

    setEditingFee(null);
  };

  if (isStudent) {
    const student = students.find(s => s.id === loggedInStudentId) || students[0];
    const studentLedger = fees.filter(f => f.studentId === student?.id);
    
    // Find Registration Fee Record
    const regFee = studentLedger.find(f => f.feeType === 'Registration' || f.month === 'Registration Fee') || {
      id: 'f_reg_' + student?.id,
      studentId: student?.id || '',
      feeType: 'Registration' as const,
      month: 'Registration Fee',
      amount: 350,
      status: 'Pending' as const
    };

    // Find Active Monthly Fee (e.g. July 2026)
    const activeMonthlyFee = studentLedger.find(f => (f.feeType === 'Monthly' || f.month !== 'Registration Fee') && f.month === selectedMonth) ||
      studentLedger.find(f => f.feeType === 'Monthly' || f.month !== 'Registration Fee');

    const handleStudentMockPayment = (feeToPay: FeeStatus) => {
      setIsPaying(true);
      setTimeout(() => {
        const isReg = feeToPay.feeType === 'Registration' || feeToPay.month === 'Registration Fee';
        const recNum = feeToPay.receiptNumber || `KSSB-${isReg ? 'REG' : 'MON'}-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        onUpdateFee({
          ...feeToPay,
          status: 'Paid',
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMethod: 'Online Payment Portal',
          receiptNumber: recNum
        });
        setIsPaying(false);
        setPaySuccess(true);
        setTimeout(() => setPaySuccess(false), 4000);
      }, 1200);
    };

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
          <p className="text-sm text-gray-500">View one-time Registration Fee status (₹350), monthly training fees (₹150), and download receipts.</p>
        </div>

        {/* Registration Fee Summary Banner */}
        <div className="p-5 bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 rounded-2xl text-white shadow-md border border-emerald-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-yellow-500/20 text-yellow-300 font-mono font-bold text-[10px] rounded uppercase border border-yellow-500/30">
                One-Time Enrolment Fee
              </span>
              <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                regFee.status === 'Paid' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {regFee.status === 'Paid' ? 'Paid & Verified' : 'Pending Payment'}
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-white">Registration Fee: ₹350</h3>
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
            <button 
              onClick={() => handleStudentMockPayment(regFee)}
              disabled={isPaying}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition-all cursor-pointer shrink-0"
            >
              <CreditCard size={15} />
              Settle Registration Fee (₹350)
            </button>
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
                          <button 
                            onClick={() => handleStudentMockPayment(fee)}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-bold transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            Pay ₹{fee.amount}
                          </button>
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
  // Registration Fees
  const allRegFees = fees.filter(f => f.feeType === 'Registration' || f.month === 'Registration Fee');
  const regFeeCollected = allRegFees.filter(f => f.status === 'Paid').reduce((sum, f) => sum + f.amount, 0);
  const regFeePending = allRegFees.filter(f => f.status !== 'Paid').reduce((sum, f) => sum + f.amount, 0);

  // Monthly Fees
  const allMonthlyFees = fees.filter(f => f.feeType !== 'Registration' && f.month !== 'Registration Fee');
  const selectedMonthlyFees = selectedMonth === 'All' ? allMonthlyFees : allMonthlyFees.filter(f => f.month === selectedMonth);
  
  const monthlyFeeCollected = selectedMonthlyFees.filter(f => f.status === 'Paid').reduce((sum, f) => sum + f.amount, 0);
  const monthlyFeePending = selectedMonthlyFees.filter(f => f.status !== 'Paid').reduce((sum, f) => sum + f.amount, 0);

  // Filtered List for Table
  const filteredFees = fees.filter(fee => {
    const student = students.find(s => s.id === fee.studentId);
    if (!student) return false;

    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (student.registrationNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (student.fatherName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (student.mobileNo || '').includes(searchTerm);

    const isReg = fee.feeType === 'Registration' || fee.month === 'Registration Fee';
    
    // Fee Type filter
    if (feeTypeFilter === 'Registration' && !isReg) return false;
    if (feeTypeFilter === 'Monthly' && isReg) return false;

    // Month Filter (only applies to monthly fees)
    if (!isReg && selectedMonth !== 'All' && fee.month !== selectedMonth) return false;

    // Status filter
    if (statusFilter !== 'All' && fee.status !== statusFilter) return false;

    return matchesSearch;
  });

  return (
    <div className="space-y-6" id="fees-tracker-root">
      
      {/* Receipt Modal */}
      {selectedReceiptFee && (
        <ReceiptModal 
          fee={selectedReceiptFee} 
          student={students.find(s => s.id === selectedReceiptFee.studentId)} 
          onClose={() => setSelectedReceiptFee(null)} 
        />
      )}

      {/* Financial Overview Metrics Cards (4 Distinct Separated Indicators) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="fees-overview-grid">
        
        {/* Registration Fee Collected */}
        <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-2xl shadow-sm space-y-1.5" id="fees-reg-collected">
          <div className="flex justify-between items-center text-emerald-800">
            <span className="text-[10px] font-mono uppercase tracking-wider block font-bold">Registration Fee Collected</span>
            <Tag size={16} className="text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-950 flex items-center">
            <CheckCircle2 size={22} className="text-emerald-600 mr-1.5" />
            ₹{regFeeCollected}
          </div>
          <p className="text-[11px] text-emerald-700 font-medium">₹350 One-Time Registration Fee</p>
        </div>

        {/* Registration Fee Pending */}
        <div className="p-5 bg-amber-50 border border-amber-100 rounded-2xl shadow-sm space-y-1.5" id="fees-reg-pending">
          <div className="flex justify-between items-center text-amber-800">
            <span className="text-[10px] font-mono uppercase tracking-wider block font-bold">Registration Fee Pending</span>
            <Clock size={16} className="text-amber-600" />
          </div>
          <div className="text-3xl font-black text-amber-950 flex items-center">
            <Clock size={22} className="text-amber-600 mr-1.5" />
            ₹{regFeePending}
          </div>
          <p className="text-[11px] text-amber-700 font-medium">Outstanding ₹350 Enrolments</p>
        </div>

        {/* Monthly Fee Collected */}
        <div className="p-5 bg-indigo-50 border border-indigo-100 rounded-2xl shadow-sm space-y-1.5" id="fees-monthly-collected">
          <div className="flex justify-between items-center text-indigo-800">
            <span className="text-[10px] font-mono uppercase tracking-wider block font-bold">Monthly Fee Collected</span>
            <IndianRupee size={16} className="text-indigo-600" />
          </div>
          <div className="text-3xl font-black text-indigo-950 flex items-center">
            <CheckCircle2 size={22} className="text-indigo-600 mr-1.5" />
            ₹{monthlyFeeCollected}
          </div>
          <p className="text-[11px] text-indigo-700 font-medium">Monthly ₹150 Training Tuition ({selectedMonth})</p>
        </div>

        {/* Monthly Fee Pending */}
        <div className="p-5 bg-rose-50 border border-rose-100 rounded-2xl shadow-sm space-y-1.5" id="fees-monthly-pending">
          <div className="flex justify-between items-center text-rose-800">
            <span className="text-[10px] font-mono uppercase tracking-wider block font-bold">Monthly Fee Pending</span>
            <AlertTriangle size={16} className="text-rose-600" />
          </div>
          <div className="text-3xl font-black text-rose-950 flex items-center">
            <AlertTriangle size={22} className="text-rose-600 mr-1.5" />
            ₹{monthlyFeePending}
          </div>
          <p className="text-[11px] text-rose-700 font-medium">Outstanding Monthly Fees ({selectedMonth})</p>
        </div>

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
            <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-200 text-xs">
              <span className="text-[10px] font-mono font-bold text-gray-500 uppercase px-1.5">Type:</span>
              {(['All', 'Registration', 'Monthly'] as const).map(type => (
                <button
                  key={type}
                  onClick={() => setFeeTypeFilter(type)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    feeTypeFilter === type ? 'bg-emerald-700 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {type === 'Registration' ? 'Reg Fee (₹350)' : type === 'Monthly' ? 'Monthly (₹150)' : 'All Fees'}
                </button>
              ))}
            </div>

            {/* Month Select */}
            <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-xl border border-gray-200 text-xs">
              <span className="text-[10px] font-mono font-bold text-gray-500 uppercase">Month:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent font-bold text-gray-800 focus:outline-none"
              >
                <option value="All">All Months</option>
                <option value="June 2026">June 2026</option>
                <option value="July 2026">July 2026</option>
                <option value="August 2026">August 2026</option>
              </select>
            </div>

            {/* CSV Report Export */}
            <button
              onClick={() => downloadFeesReportCSV(students, fees, selectedMonth)}
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
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-xl relative border border-emerald-100">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase tracking-widest block">Financial Settlement</span>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <CreditCard size={18} className="text-emerald-600" />
                Mark Fee Received (₹{editingFee.amount})
              </h3>
              <p className="text-xs text-gray-500">
                Student Athlete: <strong>{students.find(s => s.id === editingFee.studentId)?.name}</strong> | Fee Category: <strong>{editingFee.month}</strong>
              </p>
            </div>
            
            <form onSubmit={handleSavePayment} className="space-y-4">
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

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-gray-700 uppercase">Payment Date</label>
                <input 
                  type="date" 
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setEditingFee(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 size={15} /> Confirm Payment & Issue Receipt
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
              const isReg = fee.feeType === 'Registration' || fee.month === 'Registration Fee';
              return (
                <div key={fee.id} className="p-4 bg-gray-50/80 border border-gray-200 rounded-2xl space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase inline-block mb-1 ${
                        isReg ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                      }`}>
                        {isReg ? 'Registration Fee (₹350)' : `Monthly Fee (${fee.month})`}
                      </span>
                      <div className="font-extrabold text-gray-900 text-base">{student?.name || 'Unknown student'}</div>
                      <div className="text-xs text-gray-500 font-mono">Reg: {student?.registrationNumber}</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                      fee.status === 'Paid' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {fee.status === 'Paid' ? 'Paid' : 'Pending'}
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
                  <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-200">
                    {fee.status !== 'Paid' && isReg && (
                      <button
                        onClick={() => handleMarkRegistrationFeeReceived(fee)}
                        className="w-full py-2 bg-emerald-700 text-white hover:bg-emerald-800 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 size={14} /> Mark Registration Fee Received
                      </button>
                    )}

                    {fee.status !== 'Paid' && !isReg && (
                      <button
                        onClick={() => setEditingFee(fee)}
                        className="w-full py-2 bg-emerald-700 text-white hover:bg-emerald-800 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                      >
                        <CreditCard size={14} /> Record Monthly Fee Payment
                      </button>
                    )}

                    {fee.status === 'Paid' && (
                      <button
                        onClick={() => setSelectedReceiptFee(fee)}
                        className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold border border-emerald-200 transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                      >
                        <FileText size={14} /> View Digital Receipt
                      </button>
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
                  const isReg = fee.feeType === 'Registration' || fee.month === 'Registration Fee';
                  return (
                    <tr key={fee.id} className="hover:bg-emerald-50/20 transition-colors">
                      
                      {/* Student Details */}
                      <td className="p-4">
                        <div className="font-bold text-gray-900 text-sm">{student?.name || 'Unknown Athlete'}</div>
                        <div className="text-[11px] font-mono text-emerald-800 font-bold">Reg: {student?.registrationNumber || 'N/A'}</div>
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
                        ₹{fee.amount}
                      </td>

                      {/* Fee Status */}
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                          fee.status === 'Paid' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {fee.status === 'Paid' ? <CheckCircle2 size={13} /> : <Clock size={13} />}
                          {fee.status === 'Paid' ? 'Paid' : 'Pending'}
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
                            <button
                              onClick={() => handleMarkRegistrationFeeReceived(fee)}
                              className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer inline-flex items-center gap-1"
                              id="mark-reg-fee-received-btn"
                            >
                              <CheckCircle2 size={14} /> Mark Registration Fee Received
                            </button>
                          )}

                          {fee.status !== 'Paid' && !isReg && (
                            <button
                              onClick={() => setEditingFee(fee)}
                              className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer inline-flex items-center gap-1"
                            >
                              <CreditCard size={14} /> Record Monthly Fee
                            </button>
                          )}

                          {fee.status === 'Paid' && (
                            <button
                              onClick={() => setSelectedReceiptFee(fee)}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-lg text-xs font-bold border border-emerald-200 transition-all cursor-pointer inline-flex items-center gap-1"
                            >
                              <FileText size={14} /> Receipt View
                            </button>
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
