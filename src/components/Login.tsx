import React, { useState } from 'react';
import { Student } from '../types';
import logo from '../assets/images/kssb_fc_logo_1784404534667.jpg';
import { Shield, User, Lock, Phone, Trophy, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface LoginProps {
  students: Student[];
  onLoginSuccess: (role: 'admin' | 'coach' | 'student', student?: Student) => void;
}

export default function Login({ students, onLoginSuccess }: LoginProps) {
  const [loginType, setLoginType] = useState<'admin' | 'coach' | 'student'>('admin');
  
  // Credentials state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (loginType === 'admin') {
      if (username.trim() === 'admin' && password === 'kssbfcadmin') {
        onLoginSuccess('admin');
      } else {
        setError('Invalid Admin credentials! Please check your username and password.');
      }
    } else if (loginType === 'coach') {
      if (username.trim() === 'coach' && password === 'kssbfccoach') {
        onLoginSuccess('coach');
      } else {
        setError('Invalid Coach credentials! Please check your username and password.');
      }
    } else if (loginType === 'student') {
      const cleanInput = mobileNo.trim().replace(/\D/g, '');
      if (!cleanInput) {
        setError('Please enter your registered mobile number.');
        return;
      }

      // Match student by mobileNo, parentPhone, or guardianMobileNo
      const matchedStudent = students.find(s => {
        const m1 = (s.mobileNo || '').replace(/\D/g, '');
        const m2 = (s.parentPhone || '').replace(/\D/g, '');
        const m3 = (s.guardianMobileNo || '').replace(/\D/g, '');
        return m1.includes(cleanInput) || m2.includes(cleanInput) || m3.includes(cleanInput) || cleanInput.includes(m1) || cleanInput.includes(m2);
      });

      if (matchedStudent) {
        onLoginSuccess('student', matchedStudent);
      } else {
        if (students.length === 0) {
          setError('No students registered yet. Please ask Admin to register your student profile first.');
        } else {
          setError(`No registered student found matching mobile number "${mobileNo}". Please check with Admin.`);
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-950 via-gray-900 to-emerald-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white text-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-emerald-800/30">
        
        {/* Header Branding */}
        <div className="bg-emerald-950 p-6 text-center text-white relative border-b border-emerald-800">
          <div className="flex justify-center mb-3">
            <img 
              src={logo || '/logo.jpg'} 
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.jpg'; }}
              alt="KSSB FC Logo" 
              className="w-24 h-24 rounded-2xl border-2 border-amber-400 shadow-lg object-contain bg-white p-1" 
            />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white font-sans">KSSB FOOTBALL CLUB</h1>
          <p className="text-xs font-mono text-emerald-300 font-semibold tracking-wider uppercase mt-1">
            Official Academy Management Portal
          </p>
        </div>

        {/* Login Type Tab Selector */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1.5 rounded-2xl">
            <button
              type="button"
              onClick={() => { setLoginType('admin'); setError(null); }}
              className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                loginType === 'admin' ? 'bg-emerald-700 text-white shadow-md' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Shield size={14} />
              Admin
            </button>
            <button
              type="button"
              onClick={() => { setLoginType('coach'); setError(null); }}
              className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                loginType === 'coach' ? 'bg-emerald-700 text-white shadow-md' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Trophy size={14} />
              Coach
            </button>
            <button
              type="button"
              onClick={() => { setLoginType('student'); setError(null); }}
              className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer ${
                loginType === 'student' ? 'bg-emerald-700 text-white shadow-md' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User size={14} />
              Student
            </button>
          </div>

          {/* Alert Message */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs font-semibold flex items-start gap-2">
              <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {loginType === 'admin' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-gray-700 uppercase">Admin Username</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter Admin Username"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-700"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-gray-700 uppercase">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-700"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {loginType === 'coach' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-gray-700 uppercase">Coach Username</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Enter Coach Username"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-700"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-gray-700 uppercase">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-700"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {loginType === 'student' && (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-gray-700 uppercase">Registered Mobile Number</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      value={mobileNo}
                      onChange={(e) => setMobileNo(e.target.value)}
                      placeholder="Enter registered mobile number"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600/20 focus:border-emerald-700"
                      required
                    />
                  </div>
                </div>

                <div className="bg-emerald-50/70 border border-emerald-100 p-3 rounded-xl text-[11px] text-emerald-900 font-medium">
                  <p className="font-bold text-emerald-950 mb-0.5">📱 Student Portal Login</p>
                  <p>Enter the mobile number provided during registration (WhatsApp / Primary Contact).</p>
                </div>
              </>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>Log In to Portal</span>
              <ArrowRight size={18} />
            </button>
          </form>

        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 text-center border-t border-gray-100 text-[11px] text-gray-500 font-medium">
          KSSB Football Club Management System &copy; 2026
        </div>
      </div>
    </div>
  );
}
