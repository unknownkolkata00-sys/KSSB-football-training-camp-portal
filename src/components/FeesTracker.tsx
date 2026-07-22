import React, { useState } from 'react';
import { Student, FeeStatus } from '../types';
import { Check, CreditCard, IndianRupee, Search, AlertCircle, FileText, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

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
  
  // Updating fee state
  const [editingFee, setEditingFee] = useState<FeeStatus | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);

  // Student Specific payment states
  const [cardNo, setCardNo] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [paySuccess, setPaySuccess] = useState(false);

  if (isStudent) {
    const student = students.find(s => s.id === loggedInStudentId);
    const studentLedger = fees.filter(f => f.studentId === loggedInStudentId);
    
    // Find active fee (e.g., current month "July 2026")
    const activeFee = studentLedger.find(f => f.month === 'July 2026') || studentLedger[0];

    const handleMockPayment = (e: React.FormEvent) => {
      e.preventDefault();
      if (!activeFee) return;
      setIsPaying(true);
      setTimeout(() => {
        onUpdateFee({
          ...activeFee,
          status: 'Paid',
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMethod: 'Credit Card (Stripe Portal)'
        });
        setIsPaying(false);
        setPaySuccess(true);
        setTimeout(() => setPaySuccess(false), 4000);
      }, 1500);
    };

    return (
      <div className="space-y-6 animate-fade-in" id="student-fees-tracker-root">
        {/* Header */}
        <div className="space-y-1" id="student-fees-header">
          <h2 className="text-2xl font-bold text-gray-900 font-sans">My Tuition Ledger & Payment Portal</h2>
          <p className="text-sm text-gray-500">Track registration dues, settle active month fees, and view official digital invoices.</p>
        </div>

        {/* Profile Details Bar */}
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-3 shadow-sm animate-fade-in" id="student-profile-bar">
          <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
            {student?.name.charAt(0)}
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">{student?.name}</h3>
            <p className="text-xs text-gray-500">Primary Parent: {student?.parentName} ({student?.parentEmail})</p>
          </div>
        </div>

        {/* Core Layout Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="student-fees-grid">
          {/* Active Ledger Status Card */}
          <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-slate-100 space-y-6 shadow-lg flex flex-col justify-between min-h-[300px]" id="student-active-ledger-card">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold">Active Billing Period: July 2026</span>
                <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                  activeFee?.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                }`}>
                  {activeFee?.status || 'No Bill'}
                </span>
              </div>

              {/* Card visual */}
              <div className="relative p-5 bg-gradient-to-br from-emerald-800 via-slate-950 to-amber-950/80 rounded-xl border border-slate-700/50 space-y-6 shadow-inner overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <CreditCard size={120} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-mono tracking-wider text-slate-400">KSSB FC TUITION CARD</span>
                  <div className="w-8 h-5 bg-yellow-500/25 rounded border border-yellow-500/20" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 block font-mono">TUITION DUE</span>
                  <div className="text-3xl font-display font-extrabold text-white">₹{activeFee?.amount || 150}.00</div>
                </div>
                <div className="flex justify-between items-end text-[10px] font-mono text-slate-400">
                  <div>
                    <span className="block text-[8px] text-slate-500 uppercase">ATHLETE ACCOUNT</span>
                    <span className="text-slate-200 font-bold">{student?.name}</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-slate-500 uppercase">STATUS</span>
                    <span className={`font-bold ${activeFee?.status === 'Paid' ? 'text-emerald-400' : 'text-rose-400 animate-pulse'}`}>
                      {activeFee?.status === 'Paid' ? 'SETTLED ✓' : 'UNPAID ALERT'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {activeFee?.status === 'Paid' ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Excellent! Your tuition is fully settled for this cycle. Thank you for supporting KSSB FC!</span>
              </div>
            ) : (
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                <AlertCircle size={16} className="text-amber-400 shrink-0" />
                <span>Dues of ₹{activeFee?.amount} are outstanding. Settle with a demo card in the checkout panel.</span>
              </div>
            )}
          </div>

          {/* Payment panel / receipt */}
          <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col justify-between min-h-[300px]" id="student-payment-card">
            {activeFee?.status === 'Paid' ? (
              <div className="space-y-4 my-auto text-center py-6">
                <CheckCircle2 size={48} className="text-emerald-500 mx-auto" />
                <div className="space-y-1">
                  <h4 className="font-bold text-gray-900 font-display text-base">Tuition Cleared Successfully</h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">Your payment of ₹{activeFee.amount} was settled via {activeFee.paymentMethod || 'Credit Card'} on {activeFee.paymentDate}.</p>
                </div>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold border border-gray-100">
                    <FileText size={12} />
                    Download Invoice (Simulated)
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-gray-50">
                  <h4 className="font-bold text-gray-950 font-sans text-sm flex items-center gap-2">
                    <CreditCard size={16} className="text-emerald-600" />
                    Settle Tuition (Stripe Demo Mode)
                  </h4>
                  <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-bold">Secure Gate</span>
                </div>

                {paySuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg text-xs font-semibold">
                    Payment processed! Refreshing balance...
                  </div>
                )}

                <form onSubmit={handleMockPayment} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-gray-700 uppercase">Cardholder Name</label>
                    <input 
                      type="text" 
                      value={student?.parentName || ''} 
                      disabled
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-gray-700 uppercase">Card Number</label>
                    <input 
                      type="text" 
                      required
                      placeholder="4000 1234 5678 9010"
                      value={cardNo} 
                      onChange={(e) => setCardNo(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-gray-700 uppercase">Expiry Date</label>
                      <input 
                        type="text" 
                        required
                        placeholder="MM/YY"
                        value={expiry} 
                        onChange={(e) => setExpiry(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono font-bold text-gray-700 uppercase">CVV / CVC</label>
                      <input 
                        type="password" 
                        required
                        placeholder="•••"
                        maxLength={3}
                        value={cvv} 
                        onChange={(e) => setCvv(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isPaying}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed mt-4 shadow"
                  >
                    {isPaying ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Authorizing Sandbox Charge...
                      </>
                    ) : (
                      <>
                        Settle ₹{activeFee?.amount || 150}.00 Tuition
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Ledger history listing */}
        <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-4" id="student-ledger-history-card">
          <h3 className="font-bold text-gray-900 font-sans text-base">Your Tuition History</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-mono font-bold text-gray-500 uppercase">
                  <th className="p-3">Month</th>
                  <th className="p-3">Tuition Fee</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Payment Channel</th>
                  <th className="p-3">Settlement Date</th>
                  <th className="p-3 text-right">Invoice Record</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-xs">
                {studentLedger.map(l => (
                  <tr key={l.id} className="hover:bg-gray-50/40">
                    <td className="p-3 font-semibold text-gray-950">{l.month}</td>
                    <td className="p-3 font-mono font-bold">₹{l.amount}.00</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        l.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600">{l.paymentMethod || '—'}</td>
                    <td className="p-3 font-mono text-gray-500">{l.paymentDate || '—'}</td>
                    <td className="p-3 text-right">
                      <button className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 transition-colors">
                        Receipt View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Aggregate stats for the selected month
  const monthlyFees = fees.filter(f => f.month === selectedMonth);
  const totalExpected = monthlyFees.reduce((sum, f) => sum + f.amount, 0);
  const totalCollected = monthlyFees.filter(f => f.status === 'Paid').reduce((sum, f) => sum + f.amount, 0);
  const totalPending = monthlyFees.filter(f => f.status === 'Pending').reduce((sum, f) => sum + f.amount, 0);
  const totalOverdue = monthlyFees.filter(f => f.status === 'Overdue').reduce((sum, f) => sum + f.amount, 0);

  const handleUpdateStatus = (fee: FeeStatus, newStatus: 'Paid' | 'Pending' | 'Overdue') => {
    if (newStatus === 'Paid') {
      setEditingFee(fee);
    } else {
      onUpdateFee({
        ...fee,
        status: newStatus,
        paymentDate: undefined,
        paymentMethod: undefined
      });
    }
  };

  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFee) return;

    onUpdateFee({
      ...editingFee,
      status: 'Paid',
      paymentDate,
      paymentMethod
    });

    setEditingFee(null);
  };

  // Filter and search
  const filteredFees = monthlyFees.filter(fee => {
    const student = students.find(s => s.id === fee.studentId);
    if (!student) return false;

    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || fee.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6" id="fees-tracker-root">
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="fees-overview-grid">
        <div className="p-5 bg-white border border-gray-100 rounded-xl shadow-sm space-y-1.5" id="fees-total-expected">
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">Total Expected Tuition ({selectedMonth})</span>
          <div className="text-3xl font-bold text-gray-900 flex items-center gap-1">
            <IndianRupee size={20} className="text-gray-400 shrink-0" />
            {totalExpected}
          </div>
          <p className="text-[11px] text-gray-400">Monthly ₹150 / Admission ₹350</p>
        </div>

        <div className="p-5 bg-emerald-50 border border-emerald-100 rounded-xl shadow-sm space-y-1.5" id="fees-total-collected">
          <span className="text-[10px] font-mono text-emerald-600 uppercase tracking-wider block">Total Tuition Collected</span>
          <div className="text-3xl font-bold text-emerald-950 flex items-center">
            <CheckCircle2 size={20} className="text-emerald-500 mr-1" />
            ₹{totalCollected}
          </div>
          <p className="text-[11px] text-emerald-600">Collection progress: {totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0}%</p>
        </div>

        <div className="p-5 bg-amber-50 border border-amber-100 rounded-xl shadow-sm space-y-1.5" id="fees-total-pending">
          <span className="text-[10px] font-mono text-amber-600 uppercase tracking-wider block">Outstanding Balance (Pending)</span>
          <div className="text-3xl font-bold text-amber-950 flex items-center">
            <Clock size={20} className="text-amber-500 mr-1" />
            ₹{totalPending}
          </div>
          <p className="text-[11px] text-amber-600">Awaiting payment drafts</p>
        </div>

        <div className="p-5 bg-rose-50 border border-rose-100 rounded-xl shadow-sm space-y-1.5" id="fees-total-overdue">
          <span className="text-[10px] font-mono text-rose-600 uppercase tracking-wider block">Delinquent Tuition (Overdue)</span>
          <div className="text-3xl font-bold text-rose-950 flex items-center">
            <AlertTriangle size={20} className="text-rose-500 mr-1" />
            ₹{totalOverdue}
          </div>
          <p className="text-[11px] text-rose-600">Requires administrative outreach</p>
        </div>
      </div>

      {/* Select Month and Filters */}
      <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-4 justify-between" id="fees-filters-card">
        {/* Search */}
        <div className="relative max-w-sm w-full">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search player tuition ledger..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:bg-white"
          />
        </div>
        
        {/* Month Selection and Status filtering */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-xs font-mono font-semibold text-gray-500 uppercase">Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-2 py-1.5 border border-gray-200 bg-white rounded-lg text-xs font-semibold text-gray-700"
            >
              <option value="June 2026">June 2026</option>
              <option value="July 2026">July 2026</option>
              <option value="August 2026">August 2026</option>
            </select>
          </div>

          <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200">
            {['All', 'Paid', 'Pending', 'Overdue'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                  statusFilter === st ? 'bg-white text-emerald-800 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Edit Payment Modal */}
      {editingFee && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-all" id="edit-payment-modal">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-6 shadow-xl relative">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <CreditCard size={18} className="text-emerald-600" />
                Record Tuition Payment
              </h3>
              <p className="text-xs text-gray-500">
                Confirm receipt of fee for <strong>{students.find(s => s.id === editingFee.studentId)?.name}</strong> for {editingFee.month}.
              </p>
            </div>
            
            <form onSubmit={handleSavePayment} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-gray-700 uppercase">Payment Channel / Method</label>
                <select 
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  <option value="Credit Card">Credit Card (Stripe)</option>
                  <option value="Bank Transfer">Direct ACH Bank Transfer</option>
                  <option value="Venmo">Venmo Business</option>
                  <option value="Cash">Cash Handover</option>
                  <option value="Check">Paper Check</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-gray-700 uppercase">Settlement Date</label>
                <input 
                  type="date" 
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none"
                  required
                />
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <button 
                  type="button"
                  onClick={() => setEditingFee(null)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 text-white rounded-lg text-sm font-semibold hover:bg-emerald-800 cursor-pointer"
                >
                  Save Settlement Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ledger Records View */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-4 sm:p-0 sm:overflow-hidden" id="fees-table-card">
        {/* Mobile Vertical Cards View */}
        <div className="block sm:hidden space-y-3">
          {filteredFees.length > 0 ? (
            filteredFees.map(fee => {
              const student = students.find(s => s.id === fee.studentId);
              return (
                <div key={fee.id} className="p-4 bg-gray-50/70 border border-gray-200 rounded-2xl space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-gray-900 text-base">{student?.name || 'Unknown student'}</div>
                      <div className="text-xs text-gray-500">Parent: {student?.parentName}</div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      fee.status === 'Paid' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                      fee.status === 'Pending' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                      'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}>
                      {fee.status}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 text-xs">
                    <span className="text-gray-500">Tuition Amount:</span>
                    <span className="font-mono text-base font-bold text-gray-950">₹{fee.amount}.00</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 bg-white/60 p-2.5 rounded-xl border border-gray-100">
                    <div>
                      <span className="text-[10px] text-gray-400 font-mono uppercase block">Channel</span>
                      <span className="font-medium text-gray-800">{fee.paymentMethod || '—'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-400 font-mono uppercase block">Settled On</span>
                      <span className="font-mono text-gray-800">{fee.paymentDate || '—'}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-1 border-t border-gray-200/80">
                    {fee.status !== 'Paid' && (
                      <button
                        onClick={() => handleUpdateStatus(fee, 'Paid')}
                        className="flex-1 py-2 bg-emerald-700 text-white hover:bg-emerald-800 rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer text-center"
                      >
                        Settle Fee
                      </button>
                    )}
                    {fee.status === 'Paid' && (
                      <button
                        onClick={() => handleUpdateStatus(fee, 'Pending')}
                        className="flex-1 py-2 border border-gray-200 hover:bg-gray-100 rounded-xl text-xs font-semibold text-gray-700 transition-all cursor-pointer text-center"
                      >
                        Reset
                      </button>
                    )}
                    <button
                      onClick={() => handleUpdateStatus(fee, 'Overdue')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer text-center ${
                        fee.status === 'Overdue' ? 'bg-rose-100 text-rose-800 font-bold border border-rose-200' : 'border border-gray-200 text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Overdue
                    </button>
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
              <tr className="bg-gray-50/75 border-b border-gray-100">
                <th className="p-4 text-xs font-mono font-bold text-gray-500 uppercase">Student Athlete</th>
                <th className="p-4 text-xs font-mono font-bold text-gray-500 uppercase">Tuition Fee</th>
                <th className="p-4 text-xs font-mono font-bold text-gray-500 uppercase">Status</th>
                <th className="p-4 text-xs font-mono font-bold text-gray-500 uppercase">Payment Channel</th>
                <th className="p-4 text-xs font-mono font-bold text-gray-500 uppercase">Settlement Date</th>
                <th className="p-4 text-xs font-mono font-bold text-gray-500 uppercase text-right">Ledger Adjustments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredFees.length > 0 ? (
                filteredFees.map(fee => {
                  const student = students.find(s => s.id === fee.studentId);
                  return (
                    <tr key={fee.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-gray-900 text-sm">{student?.name || 'Unknown student'}</div>
                        <div className="text-xs text-gray-500">Parent: {student?.parentName}</div>
                      </td>
                      <td className="p-4 font-mono text-sm text-gray-900 font-bold">₹{fee.amount}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                          fee.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                          fee.status === 'Pending' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {fee.status}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-700">{fee.paymentMethod || '—'}</td>
                      <td className="p-4 text-xs text-gray-500 font-mono">{fee.paymentDate || '—'}</td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {fee.status !== 'Paid' && (
                            <button
                              onClick={() => handleUpdateStatus(fee, 'Paid')}
                              className="px-2.5 py-1.5 bg-emerald-700 text-white hover:bg-emerald-800 rounded text-xs font-bold shadow-sm transition-all cursor-pointer"
                            >
                              Settle Fee
                            </button>
                          )}
                          {fee.status === 'Paid' && (
                            <button
                              onClick={() => handleUpdateStatus(fee, 'Pending')}
                              className="px-2.5 py-1.5 border border-gray-200 hover:bg-gray-50 rounded text-xs font-semibold text-gray-600 transition-all cursor-pointer"
                            >
                              Reset
                            </button>
                          )}
                          <button
                            onClick={() => handleUpdateStatus(fee, 'Overdue')}
                            className={`px-2.5 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer ${
                              fee.status === 'Overdue' ? 'bg-rose-100 text-rose-800 font-bold border border-rose-200' : 'border border-gray-200 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            Mark Overdue
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500 text-sm">
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
