import React, { useState } from 'react';
import { DeletedStudentRecord } from '../types';
import logo from '../assets/images/kssb_fc_official_logo.jpg';
import StudentAvatar from './StudentAvatar';
import { 
  UserX, 
  Search, 
  RotateCcw, 
  CreditCard, 
  FileText, 
  Calendar, 
  Phone, 
  MapPin, 
  CheckCircle, 
  X, 
  AlertCircle,
  FileDown,
  ShieldAlert,
  IdCard
} from 'lucide-react';

interface DeletedStudentsViewProps {
  deletedRecords: DeletedStudentRecord[];
  onRestoreStudent: (recordId: string) => void;
}

export default function DeletedStudentsView({
  deletedRecords,
  onRestoreStudent
}: DeletedStudentsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<DeletedStudentRecord | null>(null);
  const [showFeesModal, setShowFeesModal] = useState(false);
  const [restoreNotice, setRestoreNotice] = useState<string | null>(null);

  const filteredRecords = deletedRecords.filter(r => {
    const s = r.student;
    const q = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.registrationNumber?.toLowerCase().includes(q) ||
      s.mobileNo?.includes(q) ||
      s.aadharNumber?.includes(q) ||
      s.fatherName?.toLowerCase().includes(q)
    );
  });

  const handleRestore = (record: DeletedStudentRecord) => {
    onRestoreStudent(record.id);
    setRestoreNotice(`✅ Successfully restored player ${record.student.name} (${record.student.registrationNumber}) back to active student roster and payment history!`);
    if (selectedRecord?.id === record.id) {
      setShowFeesModal(false);
      setSelectedRecord(null);
    }
    setTimeout(() => setRestoreNotice(null), 6000);
  };

  const handleExportCSV = () => {
    const headers = [
      'Registration No',
      'Student Name',
      'Aadhar No',
      'Father Name',
      'Mobile No',
      'Position',
      'Age',
      'Deletion Date',
      'Total Fees History Count',
      'Paid Fees Amount',
      'Pending Fees Amount'
    ];

    const rows = filteredRecords.map(r => {
      const s = r.student;
      const paidAmt = r.feesHistory.filter(f => f.status === 'Paid').reduce((sum, f) => sum + f.amount, 0);
      const pendingAmt = r.feesHistory.filter(f => f.status === 'Pending').reduce((sum, f) => sum + f.amount, 0);

      return [
        `"${s.registrationNumber || ''}"`,
        `"${s.name || ''}"`,
        `"${s.aadharNumber || ''}"`,
        `"${s.fatherName || ''}"`,
        `"${s.mobileNo || ''}"`,
        `"${s.position || ''}"`,
        s.age || 0,
        `"${r.deletedAt || ''}"`,
        r.feesHistory.length,
        paidAmt,
        pendingAmt
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `KSSB_FC_Deleted_Students_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" id="deleted-students-root">
      
      {/* Notice Banner */}
      {restoreNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between shadow-md animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle size={20} className="text-emerald-600 shrink-0" />
            <span>{restoreNotice}</span>
          </div>
          <button onClick={() => setRestoreNotice(null)} className="text-gray-400 hover:text-gray-600 font-bold cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 md:items-center justify-between" id="deleted-students-header">
        <div className="flex items-center gap-4">
          <img 
            src={logo || '/logo.jpg'} 
            onError={(e) => { const img = e.currentTarget as HTMLImageElement; img.onerror = null; img.src = '/logo.jpg'; }} 
            alt="KSSB FC Logo" 
            className="w-14 h-14 rounded-xl border-2 border-rose-400/80 object-cover bg-slate-900 shadow-sm shrink-0" 
          />
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-rose-700 uppercase tracking-widest">Admin Archive Portal</span>
              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-md flex items-center gap-1">
                <ShieldAlert size={12} /> Restricted Access
              </span>
            </div>
            <h2 className="text-2xl font-black text-gray-900 font-sans flex items-center gap-2">
              <UserX className="text-rose-600" size={26} />
              Deleted Student History & Payment Records ({deletedRecords.length})
            </h2>
            <p className="text-xs text-gray-500">
              Audit log of all removed players and their complete historic fee ledgers. Payment data for deleted students is isolated here and hidden from active fees tracker.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            disabled={filteredRecords.length === 0}
            className="px-4 py-2.5 bg-slate-900 text-white hover:bg-slate-800 disabled:bg-gray-300 rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 transition-all cursor-pointer"
          >
            <FileDown size={16} />
            Export Archive CSV
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
        <Search size={18} className="text-gray-400 shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search deleted records by Student Name, Reg No, Mobile No, or Aadhar No..."
          className="w-full text-xs font-semibold text-gray-900 placeholder-gray-400 focus:outline-none"
        />
        {searchTerm && (
          <button onClick={() => setSearchTerm('')} className="text-xs text-gray-400 hover:text-gray-600 font-bold">Clear</button>
        )}
      </div>

      {/* Deleted Records Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden" id="deleted-records-table-container">
        {filteredRecords.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 font-mono text-[10px] uppercase border-b border-gray-100">
                <tr>
                  <th className="py-3.5 px-4 font-bold">Player Details</th>
                  <th className="py-3.5 px-4 font-bold">Registration No</th>
                  <th className="py-3.5 px-4 font-bold">Aadhar Number</th>
                  <th className="py-3.5 px-4 font-bold">Father / Parent Info</th>
                  <th className="py-3.5 px-4 font-bold">Deleted On</th>
                  <th className="py-3.5 px-4 font-bold">Fee History</th>
                  <th className="py-3.5 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredRecords.map((record) => {
                  const s = record.student;
                  const paidCount = record.feesHistory.filter(f => f.status === 'Paid').length;
                  const totalPaidAmt = record.feesHistory.filter(f => f.status === 'Paid').reduce((sum, f) => sum + f.amount, 0);

                  return (
                    <tr key={record.id} className="hover:bg-rose-50/20 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <StudentAvatar name={s.name} photoUrl={s.photoUrl} size="md" />
                          <div>
                            <div className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                              {s.name}
                              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[9px] font-mono font-bold rounded">
                                Removed
                              </span>
                            </div>
                            <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                              <span>{s.position}</span>
                              <span>•</span>
                              <span>{s.age} yrs</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-bold text-gray-900">
                        {s.registrationNumber || 'N/A'}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-gray-800">
                        {s.aadharNumber ? (
                          <div className="flex items-center gap-1">
                            <IdCard size={14} className="text-gray-400 shrink-0" />
                            <span>{s.aadharNumber}</span>
                            {s.isGuardianAadhar && (
                              <span className="text-[9px] font-mono text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                Guardian
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Not recorded</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-xs font-semibold text-gray-900">{s.fatherName || s.parentName}</div>
                        <div className="text-[11px] font-mono text-gray-500 flex items-center gap-1 mt-0.5">
                          <Phone size={10} className="text-gray-400" />
                          <span>{s.mobileNo || s.parentPhone}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-rose-700">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="text-rose-400 shrink-0" />
                          <span>{record.deletedAt}</span>
                        </div>
                        <div className="text-[10px] text-gray-400 font-sans">
                          By {record.deletedBy || 'Admin'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => {
                            setSelectedRecord(record);
                            setShowFeesModal(true);
                          }}
                          className="px-2.5 py-1.5 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-900 border border-gray-200 hover:border-emerald-300 rounded-lg text-xs font-bold text-gray-800 transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <CreditCard size={13} className="text-emerald-700" />
                          <span>{record.feesHistory.length} Record(s)</span>
                          <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                            ₹{totalPaidAmt}
                          </span>
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleRestore(record)}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer inline-flex items-center gap-1.5"
                          title="Restore player back to active roster"
                        >
                          <RotateCcw size={13} />
                          Restore Player
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center space-y-3">
            <UserX size={44} className="mx-auto text-gray-300" />
            <h4 className="text-base font-bold text-gray-700">No Deleted Student History Found</h4>
            <p className="text-xs text-gray-500 max-w-md mx-auto">
              When players are removed from the active roster, their profile details and complete payment history are automatically archived here for admin auditing.
            </p>
          </div>
        )}
      </div>

      {/* Deleted Student Payment Ledger Modal */}
      {showFeesModal && selectedRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl relative border border-gray-200 max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowFeesModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-gray-100 pr-8">
              <StudentAvatar name={selectedRecord.student.name} photoUrl={selectedRecord.student.photoUrl} size="lg" />
              <div>
                <span className="text-[10px] font-mono font-bold text-rose-700 uppercase tracking-widest block">Deleted Student Payment Ledger</span>
                <h3 className="text-lg font-black text-gray-900">{selectedRecord.student.name}</h3>
                <div className="text-xs font-mono text-gray-500 flex items-center gap-2 mt-0.5">
                  <span>Reg No: <strong>{selectedRecord.student.registrationNumber}</strong></span>
                  <span>•</span>
                  <span>Aadhar: <strong>{selectedRecord.student.aadharNumber || 'N/A'}</strong></span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-mono font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
                <span>Payment History Breakdown ({selectedRecord.feesHistory.length})</span>
                <span className="text-[10px] text-rose-600 font-sans">Deleted on {selectedRecord.deletedAt}</span>
              </h4>

              {selectedRecord.feesHistory.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {selectedRecord.feesHistory.map((fee) => (
                    <div key={fee.id} className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <div className="font-bold text-gray-900 flex items-center gap-2">
                          <span>{fee.month}</span>
                          <span className="text-[10px] font-mono text-gray-500">({fee.feeType})</span>
                        </div>
                        {fee.receiptNumber && (
                          <div className="text-[10px] font-mono text-emerald-800">
                            Receipt: {fee.receiptNumber} {fee.paymentDate ? `• Paid ${fee.paymentDate}` : ''}
                          </div>
                        )}
                        {fee.paymentMethod && (
                          <div className="text-[10px] font-sans text-gray-500">
                            Method: {fee.paymentMethod}
                          </div>
                        )}
                      </div>

                      <div className="text-right space-y-1">
                        <div className="font-extrabold text-sm text-gray-900">₹{fee.amount}</div>
                        <span className={`px-2 py-0.5 text-[9px] font-mono font-extrabold rounded-full ${
                          fee.status === 'Paid' ? 'bg-emerald-100 text-emerald-900 border border-emerald-200' : 'bg-rose-100 text-rose-900 border border-rose-200'
                        }`}>
                          {fee.status.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center text-xs text-gray-500">
                  No payment records were logged prior to deletion.
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={() => handleRestore(selectedRecord)}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                <RotateCcw size={14} />
                Restore This Player & Fees
              </button>
              <button
                onClick={() => setShowFeesModal(false)}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
