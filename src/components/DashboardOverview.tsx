import React from 'react';
import { Student, PerformanceMetric, FeeStatus } from '../types';
import { Users, CreditCard, Activity, CheckCircle, ArrowRight, Download, FileText, CalendarCheck, IndianRupee } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Legend } from 'recharts';
import kssbFcLogo from '../assets/images/kssb_fc_logo_1784404534667.jpg';
import { downloadAttendanceReportCSV, downloadFeesReportCSV } from '../utils/reports';

interface DashboardOverviewProps {
  students: Student[];
  metrics: PerformanceMetric[];
  fees: FeeStatus[];
  setActiveTab: (tab: string) => void;
}

export default function DashboardOverview({
  students,
  metrics,
  fees,
  setActiveTab
}: DashboardOverviewProps) {
  // Stats calculations
  const totalRoster = students.filter(s => s.status === 'Active').length;
  
  // Fee stats
  const julyFees = fees.filter(f => f.month === 'July 2026');
  const expectedFees = julyFees.reduce((sum, f) => sum + f.amount, 0);
  const collectedFees = julyFees.filter(f => f.status === 'Paid').reduce((sum, f) => sum + f.amount, 0);
  const pendingFees = julyFees.filter(f => f.status === 'Pending' || f.status === 'Overdue').reduce((sum, f) => sum + f.amount, 0);

  // Calculate Average Team Attendance
  const recentDates = [...new Set(metrics.map(m => m.date))].sort().slice(-5);
  const attendanceData = recentDates.map(date => {
    const dayMetrics = metrics.filter(m => m.date === date);
    const present = dayMetrics.filter(m => m.attendance === 'Present').length;
    const total = dayMetrics.length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return {
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      'Attendance Rate (%)': rate
    };
  });

  // Calculate Average Skill Scores Over Time
  const skillProgressionData = recentDates.map(date => {
    const dayMetrics = metrics.filter(m => m.date === date);
    if (dayMetrics.length === 0) return null;
    const avgPassing = dayMetrics.reduce((sum, m) => sum + m.passing, 0) / dayMetrics.length;
    const avgShooting = dayMetrics.reduce((sum, m) => sum + m.shooting, 0) / dayMetrics.length;
    const avgStamina = dayMetrics.reduce((sum, m) => sum + m.stamina, 0) / dayMetrics.length;
    return {
      date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      'Passing': Number(avgPassing.toFixed(1)),
      'Shooting': Number(avgShooting.toFixed(1)),
      'Stamina': Number(avgStamina.toFixed(1)),
    };
  }).filter(Boolean);

  return (
    <div className="space-y-6" id="dashboard-overview-container">
      {/* Top Banner */}
      <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 rounded-2xl text-white shadow-lg relative overflow-hidden border border-slate-800" id="dashboard-hero-banner">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="max-w-xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 rounded-full text-xs font-mono font-bold uppercase tracking-wider">
              🏆 Official Club Headquarters
            </div>
            <h1 className="text-2xl sm:text-3xl font-sans font-black tracking-tight text-white">
              KSSB FC Command Center
            </h1>
            <p className="text-slate-300 font-sans text-xs sm:text-sm md:text-base leading-relaxed">
              Welcome to the Kadamtala Sporting Subhas Bhowmick Football Camp portal. Real-time tactical metrics, automated parent alerts, attendance tracking, and financial ledgers.
            </p>
          </div>
          
          {/* Logo container right in the banner */}
          <div className="shrink-0 flex items-center justify-center p-1.5 bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 rounded-3xl shadow-lg ring-4 ring-yellow-400/20 w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 mx-auto md:mx-0">
            <img 
              src={kssbFcLogo || '/logo.jpg'} 
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.jpg'; }}
              alt="KSSB FC Logo" 
              className="w-full h-full object-contain rounded-2xl bg-white p-1"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
        <div className="absolute left-1/3 top-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 bottom-0 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Grid Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="stats-indicators-grid">
        {/* Roster Card */}
        <div 
          onClick={() => setActiveTab('roster')}
          className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer flex justify-between items-center group"
          id="stat-card-roster"
        >
          <div className="space-y-1">
            <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Active Enrolled Roster</span>
            <div className="text-3xl font-bold text-gray-900">{totalRoster} Student Athletes</div>
            <span className="text-xs text-emerald-600 font-medium inline-flex items-center gap-1">
              Manage player profiles & registration &rarr;
            </span>
          </div>
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <Users size={28} />
          </div>
        </div>

        {/* Financial Card */}
        <div 
          onClick={() => setActiveTab('fees')}
          className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer flex justify-between items-center group"
          id="stat-card-fees"
        >
          <div className="space-y-1">
            <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Tuition Fees Summary</span>
            <div className="text-3xl font-bold text-gray-900">₹{collectedFees} Collected</div>
            <span className="text-xs text-amber-600 font-medium inline-flex items-center gap-1">
              Pending Dues: ₹{pendingFees} (Total Expected: ₹{expectedFees}) &rarr;
            </span>
          </div>
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl">
            <CreditCard size={28} />
          </div>
        </div>
      </div>

      {/* Admin Quick Report Downloads Bar */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl text-white space-y-4 shadow-md" id="admin-reports-download-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-yellow-400 uppercase tracking-widest">Admin Export Portal</span>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px] font-bold">CSV Reports Ready</span>
            </div>
            <h2 className="text-lg font-bold text-slate-100 font-sans">Official Club Reports & Ledger Downloads</h2>
          </div>
          <p className="text-xs text-slate-400">Instantly generate spreadsheet-compatible CSV reports for administrative record-keeping.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
          {/* Attendance Report Download Button */}
          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col justify-between gap-3 hover:border-emerald-500/50 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <CalendarCheck size={16} /> Attendance Report
                </span>
                <p className="text-xs text-slate-300">
                  Includes full session history, athlete attendance rates (%), present/absent/excused counts, and coach notes.
                </p>
              </div>
            </div>
            <button
              onClick={() => downloadAttendanceReportCSV(students, metrics)}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm border border-emerald-400/30"
              id="download-attendance-report-btn"
            >
              <Download size={15} /> Download Attendance Report (CSV)
            </button>
          </div>

          {/* Fees Ledger Report Download Button */}
          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col justify-between gap-3 hover:border-amber-500/50 transition-all">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <IndianRupee size={16} /> Fees & Tuition Ledger Report
                </span>
                <p className="text-xs text-slate-300">
                  Includes athlete fee statuses (Paid, Pending, Overdue), amounts, settlement dates, payment methods, and parent contacts.
                </p>
              </div>
            </div>
            <button
              onClick={() => downloadFeesReportCSV(students, fees, 'July 2026')}
              className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm border border-amber-400/30"
              id="download-fees-report-btn"
            >
              <Download size={15} /> Download Fees Ledger Report (CSV)
            </button>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="dashboard-charts-row">
        {/* Skill Progression Chart */}
        <div className="p-4 sm:p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-4" id="skill-chart-card">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-gray-900 font-sans">Squad Physical Progression</h2>
              <p className="text-xs text-gray-500">Average team development benchmarks (last 5 sessions)</p>
            </div>
            <div className="flex items-center gap-2 p-1.5 bg-gray-50 rounded-lg text-xs font-medium text-gray-600">
              <Activity size={14} className="text-teal-600" />
              Progress Live
            </div>
          </div>
          <div className="h-[280px]" id="squad-performance-chart-container">
            {skillProgressionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={skillProgressionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPassing" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorShooting" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorStamina" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 10]} stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', borderColor: '#f3f4f6' }} />
                  <Legend verticalAlign="top" height={36} iconType="circle" fontSize={12} />
                  <Area type="monotone" dataKey="Passing" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorPassing)" />
                  <Area type="monotone" dataKey="Shooting" stroke="#f59e0b" strokeWidth={2.5} fillOpacity={1} fill="url(#colorShooting)" />
                  <Area type="monotone" dataKey="Stamina" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorStamina)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-gray-500">
                Log athletic benchmarks to populate metrics.
              </div>
            )}
          </div>
        </div>

        {/* Attendance Rates Chart */}
        <div className="p-4 sm:p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-4" id="attendance-chart-card">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-gray-900 font-sans">Camp Attendance Trend</h2>
              <p className="text-xs text-gray-500">Percentage of active students attending training sessions</p>
            </div>
            <div className="flex items-center gap-2 p-1.5 bg-gray-50 rounded-lg text-xs font-medium text-gray-600">
              <CheckCircle size={14} className="text-emerald-600" />
              92% Goal Target
            </div>
          </div>
          <div className="h-[280px]" id="squad-attendance-chart-container">
            {attendanceData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#9ca3af" fontSize={11} tickLine={false} />
                  <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', borderColor: '#f3f4f6' }} />
                  <Bar dataKey="Attendance Rate (%)" fill="#0f766e" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm text-gray-500">
                Mark attendance in standard drills to show trends.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

