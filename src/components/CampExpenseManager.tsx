import React, { useState, useMemo } from 'react';
import { CampExpense, FeeStatus } from '../types';
import { 
  Receipt, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  FileDown, 
  Printer, 
  IndianRupee, 
  TrendingDown, 
  TrendingUp, 
  Calendar, 
  CreditCard, 
  Tag, 
  X, 
  Check, 
  Sparkles, 
  Wallet,
  ArrowUpRight,
  FileText,
  Clock,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import { downloadExpensesReportCSV } from '../utils/reports';
import { compressImageFile } from '../utils/imageCompressor';

interface CampExpenseManagerProps {
  expenses: CampExpense[];
  fees: FeeStatus[];
  onAddExpense: (expense: Omit<CampExpense, 'id' | 'createdAt'>) => void;
  onUpdateExpense: (expense: CampExpense) => void;
  onDeleteExpense: (id: string) => void;
}

// Quick presets for common football academy / camp expenses
const COMMON_EXPENSE_PRESETS = [
  { title: 'Ground Grass Trimming & Pitch Rolling', category: 'Ground & Pitch Maintenance' as const, defaultAmount: 2500, mode: 'Cash' as const },
  { title: 'Practice Match Refreshments & Glucose', category: 'Nutrition & Refreshments' as const, defaultAmount: 950, mode: 'UPI / Online' as const },
  { title: 'First Aid Kit, Ice Packs & Relief Spray', category: 'Medical & First Aid' as const, defaultAmount: 1200, mode: 'UPI / Online' as const },
  { title: 'Coach Session Honorarium', category: 'Coach & Staff Honorarium' as const, defaultAmount: 3000, mode: 'Bank Transfer' as const },
  { title: 'Line Marking Chalk & Pitch Paint', category: 'Ground & Pitch Maintenance' as const, defaultAmount: 800, mode: 'Cash' as const },
  { title: 'Match Day Team Transport / Van', category: 'Tournaments & Transport' as const, defaultAmount: 1800, mode: 'Cash' as const },
  { title: 'Training Equipment & Gear Purchase', category: 'Equipment & Assets' as const, defaultAmount: 4500, mode: 'UPI / Online' as const }
];

export default function CampExpenseManager({
  expenses,
  fees,
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense
}: CampExpenseManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>('All');
  const [showAddEditModal, setShowAddEditModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<CampExpense | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [viewVoucherExpense, setViewVoucherExpense] = useState<CampExpense | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CampExpense['category']>('Ground & Pitch Maintenance');
  const [amount, setAmount] = useState<string>('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMode, setPaymentMode] = useState<CampExpense['paymentMode']>('UPI / Online');
  const [paidTo, setPaidTo] = useState('');
  const [billInvoiceNo, setBillInvoiceNo] = useState('');
  const [billReceiptImage, setBillReceiptImage] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [isCompressingImg, setIsCompressingImg] = useState(false);

  // Open modal with pre-fill or blank
  const handleOpenAddModal = (preset?: typeof COMMON_EXPENSE_PRESETS[0]) => {
    if (preset) {
      setTitle(preset.title);
      setCategory(preset.category);
      setAmount(String(preset.defaultAmount));
      setPaymentMode(preset.mode);
    } else {
      setTitle('');
      setCategory('Ground & Pitch Maintenance');
      setAmount('');
      setPaymentMode('UPI / Online');
    }
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setPaidTo('');
    setBillInvoiceNo('');
    setBillReceiptImage('');
    setNotes('');
    setEditingExpense(null);
    setShowAddEditModal(true);
  };

  const handleOpenEditModal = (expense: CampExpense) => {
    setEditingExpense(expense);
    setTitle(expense.title);
    setCategory(expense.category);
    setAmount(String(expense.amount));
    setExpenseDate(expense.expenseDate);
    setPaymentMode(expense.paymentMode);
    setPaidTo(expense.paidTo || '');
    setBillInvoiceNo(expense.billInvoiceNo || '');
    setBillReceiptImage(expense.billReceiptImage || '');
    setNotes(expense.notes || '');
    setShowAddEditModal(true);
  };

  // Handle Bill Receipt Photo Upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressingImg(true);
      const compressedBase64 = await compressImageFile(file, 900, 900, 0.75);
      setBillReceiptImage(compressedBase64);
    } catch (err) {
      console.error('Image compression failed:', err);
      // Fallback
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setBillReceiptImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressingImg(false);
    }
  };

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;

    const numAmount = Math.max(0, parseFloat(amount) || 0);

    const payload = {
      title: title.trim(),
      category,
      amount: numAmount,
      expenseDate,
      paymentMode,
      paidTo: paidTo.trim() || 'Vendor',
      billInvoiceNo: billInvoiceNo.trim() || undefined,
      billReceiptImage: billReceiptImage || undefined,
      notes: notes.trim() || undefined,
      loggedBy: 'Admin'
    };

    if (editingExpense) {
      onUpdateExpense({
        ...editingExpense,
        ...payload
      });
    } else {
      onAddExpense(payload);
    }

    setShowAddEditModal(false);
    setEditingExpense(null);
  };

  // Extract unique months for filter
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<string>();
    expenses.forEach(e => {
      if (e.expenseDate && e.expenseDate.length >= 7) {
        monthsSet.add(e.expenseDate.substring(0, 7)); // YYYY-MM
      }
    });
    return Array.from(monthsSet).sort().reverse();
  }, [expenses]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      const matchSearch = 
        exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exp.paidTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exp.billInvoiceNo && exp.billInvoiceNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (exp.notes && exp.notes.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchMonth = selectedMonth === 'All' || (exp.expenseDate && exp.expenseDate.startsWith(selectedMonth));
      const matchCat = selectedCategory === 'All' || exp.category === selectedCategory;
      const matchMode = selectedPaymentMode === 'All' || exp.paymentMode === selectedPaymentMode;

      return matchSearch && matchMonth && matchCat && matchMode;
    });
  }, [expenses, searchTerm, selectedMonth, selectedCategory, selectedPaymentMode]);

  // Financial Calculations
  const totalExpensesAllTime = useMemo(() => expenses.reduce((sum, e) => sum + (e.amount || 0), 0), [expenses]);
  const totalExpensesFiltered = useMemo(() => filteredExpenses.reduce((sum, e) => sum + (e.amount || 0), 0), [filteredExpenses]);

  // Camp Fees Inflow comparison
  const totalFeesCollected = useMemo(() => {
    return fees.filter(f => f.status === 'Paid').reduce((sum, f) => sum + (f.amount || 0), 0);
  }, [fees]);

  const netCampSurplus = totalFeesCollected - totalExpensesAllTime;

  return (
    <div className="space-y-6" id="camp-expense-management-module">
      
      {/* Header & Financial Overview Banner */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-3xl p-5 md:p-7 text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-mono font-bold border border-amber-500/30">
              <Wallet size={13} />
              <span>Camp Expenditure & Accounts Ledger</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black font-display tracking-tight text-white">
              Camp Expenses & Outflow Tracking
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Record all camp running costs including pitch preparation, coach honorarium, medical kits, match refreshments, transport, and equipment maintenance.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => downloadExpensesReportCSV(expenses, selectedMonth)}
              className="px-4 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border border-slate-600 shadow-sm cursor-pointer"
              title="Download Expenses Ledger CSV"
            >
              <FileDown size={15} className="text-amber-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => handleOpenAddModal()}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-amber-950/40 border border-amber-400 cursor-pointer"
            >
              <Plus size={16} />
              <span>+ Log Camp Expense</span>
            </button>
          </div>
        </div>

        {/* FINANCIAL SUMMARY METRICS STRIP */}
        <div className="mt-6 pt-5 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60">
            <span className="text-[11px] font-mono text-slate-400 block uppercase font-bold">Total Expenses Outflow</span>
            <span className="text-2xl font-black text-rose-400 font-mono">
              ₹{totalExpensesAllTime.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">{expenses.length} vouchers logged</span>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60">
            <span className="text-[11px] font-mono text-slate-400 block uppercase font-bold">Fees Revenue Inflow</span>
            <span className="text-2xl font-black text-emerald-400 font-mono">
              ₹{totalFeesCollected.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Paid student tuitions</span>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60">
            <span className="text-[11px] font-mono text-slate-400 block uppercase font-bold">Net Camp Cashflow</span>
            <span className={`text-2xl font-black font-mono ${netCampSurplus >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {netCampSurplus >= 0 ? `+₹${netCampSurplus.toLocaleString('en-IN')}` : `-₹${Math.abs(netCampSurplus).toLocaleString('en-IN')}`}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {netCampSurplus >= 0 ? 'Surplus Balance' : 'Net Deficit'}
            </span>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60">
            <span className="text-[11px] font-mono text-slate-400 block uppercase font-bold">Filtered Period Outflow</span>
            <span className="text-2xl font-black text-amber-300 font-mono">
              ₹{totalExpensesFiltered.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {selectedMonth === 'All' ? 'All time' : selectedMonth}
            </span>
          </div>
        </div>
      </div>

      {/* QUICK PRESET EXPENSE TILES */}
      <div className="bg-white p-5 rounded-3xl border border-gray-200/90 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            <h3 className="text-xs font-mono font-bold text-gray-900 uppercase tracking-wider">
              Quick Expense Log Presets
            </h3>
          </div>
          <span className="text-[11px] text-gray-500">One-click to populate common camp expenses</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {COMMON_EXPENSE_PRESETS.map((preset) => (
            <button
              key={preset.title}
              type="button"
              onClick={() => handleOpenAddModal(preset)}
              className="p-3 rounded-2xl bg-gray-50 hover:bg-amber-50/80 border border-gray-200 hover:border-amber-300 text-left transition-all flex flex-col justify-between gap-1.5 cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-slate-600 bg-white px-2 py-0.5 rounded-md border border-gray-200">
                  {preset.category}
                </span>
                <span className="text-xs font-black text-amber-900 font-mono">
                  ₹{preset.defaultAmount}
                </span>
              </div>
              <div className="text-xs font-bold text-gray-900 group-hover:text-amber-950 leading-snug">
                {preset.title}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search expense, vendor, invoice no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />
        </div>

        {/* Category & Month Selectors */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Month Filter */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700"
          >
            <option value="All">All Months</option>
            {availableMonths.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700"
          >
            <option value="All">All Categories</option>
            <option value="Ground & Pitch Maintenance">Ground & Pitch</option>
            <option value="Equipment & Assets">Equipment & Assets</option>
            <option value="Coach & Staff Honorarium">Coach Honorarium</option>
            <option value="Nutrition & Refreshments">Refreshments</option>
            <option value="Tournaments & Transport">Transport</option>
            <option value="Medical & First Aid">Medical & First Aid</option>
            <option value="Office & Admin">Office & Admin</option>
            <option value="Miscellaneous">Miscellaneous</option>
          </select>

          {/* Payment Mode */}
          <select
            value={selectedPaymentMode}
            onChange={(e) => setSelectedPaymentMode(e.target.value)}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700"
          >
            <option value="All">All Payment Modes</option>
            <option value="Cash">Cash</option>
            <option value="UPI / Online">UPI / Online</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Debit/Credit Card">Card</option>
            <option value="Cheque">Cheque</option>
          </select>
        </div>
      </div>

      {/* EXPENSES LEDGER TABLE */}
      {filteredExpenses.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-200 space-y-3">
          <div className="w-14 h-14 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center mx-auto">
            <Receipt size={28} />
          </div>
          <h3 className="text-base font-bold text-gray-800">No Expense Vouchers Found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            No expenses matching your selected filters. Click below to record a camp expenditure.
          </p>
          <button
            onClick={() => handleOpenAddModal()}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black inline-flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Plus size={14} /> Log Camp Expense
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-slate-200 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <th className="p-4 pl-6">Expense Title & Details</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Amount (INR)</th>
                  <th className="p-4">Expense Date</th>
                  <th className="p-4">Paid To / Vendor</th>
                  <th className="p-4">Payment Mode</th>
                  <th className="p-4">Invoice / Bill</th>
                  <th className="p-4 text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredExpenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Title */}
                    <td className="p-4 pl-6 font-bold text-gray-900">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-sm shrink-0 border border-amber-200">
                          <IndianRupee size={15} />
                        </div>
                        <div>
                          <div className="font-extrabold text-sm text-slate-900">{exp.title}</div>
                          {exp.notes && (
                            <div className="text-[11px] text-gray-500 font-normal line-clamp-1 max-w-xs">{exp.notes}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold border border-slate-200 whitespace-nowrap">
                        {exp.category}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="p-4 font-mono font-black text-sm text-rose-700 whitespace-nowrap">
                      ₹{exp.amount.toLocaleString('en-IN')}
                    </td>

                    {/* Date */}
                    <td className="p-4 text-gray-700 font-medium font-mono whitespace-nowrap">
                      {exp.expenseDate}
                    </td>

                    {/* Paid To */}
                    <td className="p-4 text-gray-800 font-semibold">
                      {exp.paidTo || '-'}
                    </td>

                    {/* Payment Mode */}
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-[11px] font-mono font-bold">
                        {exp.paymentMode}
                      </span>
                    </td>

                    {/* Invoice & Receipt Pill */}
                    <td className="p-4 text-gray-600 font-mono text-[11px]">
                      {exp.billInvoiceNo ? (
                        <span className="font-bold text-slate-800 block">{exp.billInvoiceNo}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                      {exp.billReceiptImage && (
                        <span className="text-[10px] text-emerald-700 font-bold inline-flex items-center gap-0.5 mt-0.5">
                          <ImageIcon size={10} /> Has Receipt
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewVoucherExpense(exp)}
                          className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg transition-colors cursor-pointer"
                          title="View Official Expense Voucher"
                        >
                          <FileText size={14} />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(exp)}
                          className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors cursor-pointer"
                          title="Edit Expense Voucher"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(exp.id)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                          title="Delete Expense"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD / EDIT EXPENSE MODAL */}
      {showAddEditModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative border border-gray-200 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddEditModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 text-amber-900 rounded-2xl shrink-0">
                <Receipt size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">
                  {editingExpense ? 'Edit Camp Expense Voucher' : 'Log New Camp Expense Entry'}
                </h3>
                <p className="text-xs text-gray-500">Record costs, vendor receipts, and accounting vouchers</p>
              </div>
            </div>

            <form onSubmit={handleSaveExpense} className="space-y-4 pt-1">
              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-gray-700 uppercase">
                  Expense Title / Description <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ground Grass Cutting, First Aid Kit, Match Day Transport..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-gray-700 uppercase">
                    Amount (INR ₹) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-gray-500">₹</span>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      required
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full pl-8 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-mono font-black"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-gray-700 uppercase">Date of Expense</label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Category & Payment Mode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-gray-700 uppercase">Expense Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="Ground & Pitch Maintenance">Ground & Pitch Maintenance</option>
                    <option value="Equipment & Assets">Equipment & Assets</option>
                    <option value="Coach & Staff Honorarium">Coach & Staff Honorarium</option>
                    <option value="Nutrition & Refreshments">Nutrition & Refreshments</option>
                    <option value="Tournaments & Transport">Tournaments & Transport</option>
                    <option value="Medical & First Aid">Medical & First Aid</option>
                    <option value="Office & Admin">Office & Admin</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-gray-700 uppercase">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI / Online">UPI / GPay / PhonePe</option>
                    <option value="Bank Transfer">Bank Transfer (NEFT/IMPS)</option>
                    <option value="Debit/Credit Card">Debit / Credit Card</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              {/* Paid To & Bill / Invoice No */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-gray-700 uppercase">Paid To / Beneficiary</label>
                  <input
                    type="text"
                    placeholder="e.g. Ground Team, Store Name, Coach..."
                    value={paidTo}
                    onChange={(e) => setPaidTo(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-gray-700 uppercase">Bill / Invoice / Voucher No.</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-2026-889"
                    value={billInvoiceNo}
                    onChange={(e) => setBillInvoiceNo(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold font-mono"
                  />
                </div>
              </div>

              {/* Bill Receipt Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-gray-700 uppercase flex items-center justify-between">
                  <span>Attach Bill / Receipt Photo (Optional)</span>
                  {billReceiptImage && (
                    <button
                      type="button"
                      onClick={() => setBillReceiptImage('')}
                      className="text-[11px] text-rose-600 hover:underline cursor-pointer"
                    >
                      Remove Photo
                    </button>
                  )}
                </label>

                {billReceiptImage ? (
                  <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50">
                    <img
                      src={billReceiptImage}
                      alt="Bill receipt"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-gray-200 hover:border-amber-400 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-gray-50/60 hover:bg-amber-50/30 transition-all">
                    <Camera size={20} className="text-gray-400" />
                    <span className="text-xs font-bold text-gray-700">
                      {isCompressingImg ? 'Compressing Image...' : 'Click to Upload Bill Photo / Receipt'}
                    </span>
                    <span className="text-[10px] text-gray-400">JPG, PNG supported</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isCompressingImg}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-gray-700 uppercase">Remarks & Purpose</label>
                <textarea
                  rows={2}
                  placeholder="Additional details on items, quantities, or approval remarks..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-medium resize-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowAddEditModal(false)}
                  className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer border border-amber-400"
                >
                  <Check size={16} />
                  <span>{editingExpense ? 'Update Expense' : 'Save Expense Entry'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OFFICIAL EXPENSE VOUCHER MODAL */}
      {viewVoucherExpense && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-200 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setViewVoucherExpense(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <X size={20} />
            </button>

            {/* Printable Voucher Content */}
            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-4">
              <div className="text-center pb-3 border-b border-amber-200/80">
                <span className="text-[10px] font-mono font-bold text-amber-900 uppercase tracking-widest block">Official Payment Voucher</span>
                <h3 className="text-base font-black text-slate-900">KSSB FC CAMP ACCOUNTS</h3>
                <span className="text-xs text-gray-500 font-mono">Voucher ID: EXP-{viewVoucherExpense.id}</span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-amber-100">
                  <span className="text-gray-500 font-mono font-bold">Purpose / Title:</span>
                  <span className="font-bold text-gray-900 text-right">{viewVoucherExpense.title}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-amber-100">
                  <span className="text-gray-500 font-mono font-bold">Category:</span>
                  <span className="font-bold text-slate-800">{viewVoucherExpense.category}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-amber-100">
                  <span className="text-gray-500 font-mono font-bold">Paid To / Beneficiary:</span>
                  <span className="font-bold text-gray-900">{viewVoucherExpense.paidTo}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-amber-100">
                  <span className="text-gray-500 font-mono font-bold">Date of Expenditure:</span>
                  <span className="font-mono font-bold text-gray-800">{viewVoucherExpense.expenseDate}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-amber-100">
                  <span className="text-gray-500 font-mono font-bold">Payment Method:</span>
                  <span className="font-bold text-gray-900">{viewVoucherExpense.paymentMode}</span>
                </div>
                {viewVoucherExpense.billInvoiceNo && (
                  <div className="flex justify-between py-1 border-b border-amber-100">
                    <span className="text-gray-500 font-mono font-bold">Invoice / Bill Ref:</span>
                    <span className="font-mono font-bold text-gray-900">{viewVoucherExpense.billInvoiceNo}</span>
                  </div>
                )}
                <div className="flex justify-between py-2 pt-3 border-t-2 border-amber-300 font-bold text-sm">
                  <span className="text-slate-900 font-mono">Total Paid:</span>
                  <span className="text-rose-700 font-mono text-lg font-black">₹{viewVoucherExpense.amount.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {viewVoucherExpense.billReceiptImage && (
                <div className="pt-2">
                  <span className="text-[11px] font-mono font-bold text-gray-600 block mb-1">Attached Receipt:</span>
                  <img
                    src={viewVoucherExpense.billReceiptImage}
                    alt="Receipt"
                    className="w-full max-h-48 object-contain rounded-xl border border-amber-200 bg-white"
                  />
                </div>
              )}

              {viewVoucherExpense.notes && (
                <div className="p-2.5 bg-white rounded-xl border border-amber-200 text-[11px] text-gray-700">
                  <span className="font-bold block text-gray-500 font-mono text-[10px]">Notes:</span>
                  {viewVoucherExpense.notes}
                </div>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer size={14} /> Print Voucher
              </button>
              <button
                type="button"
                onClick={() => setViewVoucherExpense(null)}
                className="px-4 py-2 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-rose-100">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-gray-900">Delete Expense Record?</h3>
              <p className="text-xs text-gray-500">
                Are you sure you want to remove this expense voucher from the camp ledger?
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (deleteConfirmId) {
                    onDeleteExpense(deleteConfirmId);
                    setDeleteConfirmId(null);
                  }
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
