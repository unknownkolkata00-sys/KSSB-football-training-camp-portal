import React from 'react';
import { FeeStatus, Student } from '../types';
import logo from '../assets/images/kssb_fc_official_logo.jpg';
import { X, Printer, CheckCircle2, ShieldCheck, Download, FileText } from 'lucide-react';

interface ReceiptModalProps {
  fee: FeeStatus;
  student?: Student;
  onClose: () => void;
}

export default function ReceiptModal({ fee, student, onClose }: ReceiptModalProps) {
  const isRegistrationFee = fee.feeType === 'Registration' || fee.month === 'Registration Fee';
  
  const receiptTitle = isRegistrationFee 
    ? 'Official Registration Fee Receipt' 
    : 'Official Monthly Training Fee Receipt';

  const receiptNum = fee.receiptNumber || `KSSB-${isRegistrationFee ? 'REG' : 'MON'}-2026-${fee.id.slice(-5).toUpperCase()}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in" id="receipt-modal-backdrop">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative border border-emerald-100 my-6 print:shadow-none print:border-none print:m-0 print:p-0">
        
        {/* Close & Print Action Buttons */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 print:hidden">
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-800 uppercase">
            <FileText size={16} className="text-emerald-600" />
            <span>Digital Payment Voucher</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-gray-900 text-white hover:bg-gray-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              id="print-receipt-btn"
            >
              <Printer size={14} /> Print / Save PDF
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="space-y-5 p-4 sm:p-6 bg-gradient-to-b from-amber-50/40 via-white to-emerald-50/30 rounded-2xl border border-gray-200/80 shadow-inner" id="printable-receipt-card">
          
          {/* Header Branding */}
          <div className="flex items-start justify-between gap-3 pb-4 border-b-2 border-emerald-800/20">
            <div className="flex items-center gap-3">
              <img 
                src={logo || '/logo.jpg'} 
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement;
                  img.onerror = null;
                  img.src = '/logo.jpg';
                }} 
                alt="KSSB FC Logo" 
                className="w-12 h-12 rounded-xl border-2 border-emerald-700 object-cover bg-slate-900 shrink-0 shadow-sm" 
              />
              <div>
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-tight font-sans">
                  Kadamtala Sporting Subhas Bhowmick Football Club
                </h2>
                <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase tracking-widest block">
                  KSSB FC Management Portal
                </span>
              </div>
            </div>
          </div>

          {/* Receipt Document Title Badge */}
          <div className="text-center space-y-1 py-1 bg-emerald-900/5 rounded-xl border border-emerald-800/10">
            <span className={`inline-block px-3 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
              isRegistrationFee ? 'bg-emerald-700 text-white' : 'bg-indigo-700 text-white'
            }`}>
              {receiptTitle}
            </span>
            <div className="text-[11px] font-mono font-bold text-gray-600">
              Receipt No: <span className="text-gray-900 font-bold">{receiptNum}</span>
            </div>
          </div>

          {/* Details Table */}
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-white rounded-xl border border-gray-200/80 shadow-2xs">
              <div className="flex items-center gap-2.5">
                {student?.photoUrl && (
                  <img 
                    src={student.photoUrl} 
                    alt={student.name} 
                    className="w-11 h-11 rounded-lg border border-amber-400 object-cover shrink-0 shadow-xs" 
                  />
                )}
                <div>
                  <span className="text-[10px] text-gray-400 font-mono uppercase block">Student Athlete</span>
                  <span className="font-bold text-gray-900 text-sm block">{student?.name || 'Registered Athlete'}</span>
                  <span className="text-[10px] font-mono text-emerald-700 font-bold">Reg: {student?.registrationNumber || 'N/A'}</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-mono uppercase block">Parent / Guardian</span>
                <span className="font-bold text-gray-800 block">{student?.fatherName || student?.parentName || '—'}</span>
                <span className="text-[10px] font-mono text-gray-500">{student?.mobileNo || student?.parentPhone || '—'}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-white rounded-xl border border-gray-200/80 shadow-2xs">
              <div>
                <span className="text-[10px] text-gray-400 font-mono uppercase block">Fee Category / Description</span>
                <span className="font-bold text-gray-800 block">
                  {isRegistrationFee ? 'One-Time Registration Fee (₹350)' : `Monthly Training Fee (${fee.month})`}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-gray-400 font-mono uppercase block">Settlement Status</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px]">
                  <CheckCircle2 size={12} /> {fee.status === 'Paid' ? 'VERIFIED & PAID' : fee.status}
                </span>
              </div>
            </div>

            {/* Payment Summary Box */}
            <div className="p-4 bg-emerald-950 text-white rounded-2xl space-y-2 shadow-md">
              <div className="flex justify-between items-center border-b border-emerald-800/80 pb-2">
                <span className="text-xs font-mono text-emerald-300">Total Amount Settled:</span>
                <span className="text-2xl font-black text-amber-400 font-display">₹{fee.amount}.00</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-emerald-200 pt-1">
                <div>
                  <span className="text-[9px] text-emerald-400 block uppercase">Payment Date</span>
                  <span className="font-bold">{fee.paymentDate || new Date().toISOString().split('T')[0]}</span>
                </div>
                <div>
                  <span className="text-[9px] text-emerald-400 block uppercase">Payment Method</span>
                  <span className="font-bold">{fee.paymentMethod || 'Cash / Online Transfer'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Authorization Stamp */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200 text-[10px] text-gray-500 font-mono">
            <div className="flex items-center gap-1 text-emerald-800 font-bold">
              <ShieldCheck size={14} />
              <span>KSSB FC Official Stamp</span>
            </div>
            <span>Authorized Signature / Computer Generated</span>
          </div>

        </div>

      </div>
    </div>
  );
}
