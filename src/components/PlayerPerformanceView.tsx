import React, { useState } from 'react';
import { Student, PerformanceMetric } from '../types';
import { Sparkles, Activity, Clock, Award, ShieldAlert, AlignLeft, BarChart2, Download, UserCheck, Calendar, SlidersHorizontal } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { downloadAttendanceReportCSV } from '../utils/reports';
import StudentAvatar from './StudentAvatar';
import DailyAttendanceRegister from './DailyAttendanceRegister';
import SingleShotPlayerEvaluationRegister from './SingleShotPlayerEvaluationRegister';

interface PlayerPerformanceViewProps {
  students: Student[];
  metrics: PerformanceMetric[];
  role?: 'admin' | 'coach' | 'student';
  loggedInStudentId?: string;
  onAddMetric?: (metric: Omit<PerformanceMetric, 'id'>) => void;
}

export default function PlayerPerformanceView({
  students,
  metrics,
  role = 'coach',
  loggedInStudentId = '',
  onAddMetric
}: PlayerPerformanceViewProps) {
  const isStudent = role === 'student';
  const [activeSubTab, setActiveSubTab] = useState<'evaluation' | 'attendance' | 'analytics'>(isStudent ? 'analytics' : 'evaluation');

  const initialStudentId = isStudent ? loggedInStudentId : (students[0]?.id || '');
  const [selectedStudentId, setSelectedStudentId] = useState<string>(initialStudentId);

  // Sync state if loggedInStudentId or role changes
  React.useEffect(() => {
    if (isStudent && loggedInStudentId) {
      setSelectedStudentId(loggedInStudentId);
      setActiveSubTab('analytics');
    }
  }, [isStudent, loggedInStudentId]);

  // Find current student & their logs
  const student = students.find(s => s.id === selectedStudentId);
  const playerMetrics = metrics
    .filter(m => m.studentId === selectedStudentId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Calculations for Summary
  const sessionsCount = playerMetrics.length;
  const presentSessions = playerMetrics.filter(m => m.attendance === 'Present').length;
  const attendanceRate = sessionsCount > 0 ? Math.round((presentSessions / sessionsCount) * 100) : 100;

  // Best speed (min value)
  const speedRecords = playerMetrics.map(m => m.speed).filter(s => s > 0);
  const personalBestSpeed = speedRecords.length > 0 ? Math.min(...speedRecords) : null;

  // Best agility (min value)
  const agilityRecords = playerMetrics.map(m => m.agility).filter(a => a > 0);
  const personalBestAgility = agilityRecords.length > 0 ? Math.min(...agilityRecords) : null;

  // Get most recent metrics to plot on Radar Chart
  const latestMetric = playerMetrics[playerMetrics.length - 1];

  // Convert lower speed/agility (seconds) to a 1-10 visual rating for radar representation
  const calculateRadarSpeed = (s: number) => {
    const val = 10 - (s - 4.5) * 9;
    return Math.max(1, Math.min(10, Math.round(val)));
  };
  const calculateRadarAgility = (a: number) => {
    const val = 10 - (a - 4.5) * 9;
    return Math.max(1, Math.min(10, Math.round(val)));
  };

  const radarData = latestMetric ? [
    { subject: 'Sprinting Speed', value: calculateRadarSpeed(latestMetric.speed), fullMark: 10 },
    { subject: 'Cone Agility', value: calculateRadarAgility(latestMetric.agility), fullMark: 10 },
    { subject: 'Stamina', value: latestMetric.stamina, fullMark: 10 },
    { subject: 'Passing Acc.', value: latestMetric.passing, fullMark: 10 },
    { subject: 'Shooting Prec.', value: latestMetric.shooting, fullMark: 10 },
    { subject: 'Defense/Tackle', value: latestMetric.defense, fullMark: 10 },
  ] : [];

  // Progression over time data formatting
  const progressionData = playerMetrics.map(m => ({
    date: new Date(m.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    '40yd Sprint (s)': m.speed,
    'Cone Agility (s)': m.agility,
    'Passing Acc (1-10)': m.passing,
    'Shooting Prec (1-10)': m.shooting,
    'Stamina (1-10)': m.stamina
  }));

  return (
    <div className="space-y-5 sm:space-y-6" id="player-performance-view-root">
      
      {/* Top Module Subtabs for Admin & Coach */}
      {!isStudent && (
        <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl shadow-sm" id="performance-view-tabs">
          <button
            onClick={() => setActiveSubTab('evaluation')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'evaluation'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            id="tab-single-shot-evaluation"
          >
            <Award size={15} className={activeSubTab === 'evaluation' ? 'text-yellow-300' : 'text-slate-400'} />
            <span>Single-Shot Player Evaluation Sheet (All Players Visible)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('attendance')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'attendance'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            id="tab-daily-attendance-register"
          >
            <UserCheck size={15} />
            <span>Master Daily Attendance Register</span>
          </button>

          <button
            onClick={() => setActiveSubTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'analytics'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            id="tab-player-analytics"
          >
            <Activity size={15} />
            <span>Individual Athlete Radar & Benchmarks</span>
          </button>
        </div>
      )}

      {/* SubTab 1: Single-Shot Multi-Player Evaluation Matrix */}
      {!isStudent && activeSubTab === 'evaluation' && (
        <SingleShotPlayerEvaluationRegister
          students={students}
          metrics={metrics}
          onAddMetric={onAddMetric || (() => {})}
          userRole={role === 'admin' ? 'admin' : 'coach'}
        />
      )}

      {/* SubTab 2: Master Daily Attendance Register */}
      {!isStudent && activeSubTab === 'attendance' && (
        <DailyAttendanceRegister
          students={students}
          metrics={metrics}
          onAddMetric={onAddMetric || (() => {})}
          userRole={role === 'admin' ? 'admin' : 'coach'}
        />
      )}

      {/* SubTab 3: Individual Athlete Benchmarks & Radar Profiles */}
      {(isStudent || activeSubTab === 'analytics') && (
        <div className="space-y-6" id="analytics-subtab-container">
          {/* Header Selector */}
          <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4" id="performance-selector-card">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-gray-900 font-sans">
                {role === 'student' ? 'My Performance Portal' : 'Student Athlete Analytics'}
              </h2>
              <p className="text-xs text-gray-500">
                {role === 'student' ? 'Your active seasonal performance benchmarks, metrics history, and coach feedback.' : 'Track benchmarks, inspect radar charts, and review coach feedback sheets.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {role === 'student' ? (
                <div className="px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                  <StudentAvatar photoUrl={student?.photoUrl} name={student?.name || 'Athlete'} size="sm" />
                  <div>
                    <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase block">Active Athlete:</span>
                    <strong className="text-xs text-emerald-950 font-bold">{student?.name} ({student?.position})</strong>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    {student && <StudentAvatar photoUrl={student.photoUrl} name={student.name} size="sm" />}
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-mono font-bold text-gray-700 uppercase">Select Athlete Profile:</label>
                      <select
                        value={selectedStudentId}
                        onChange={(e) => setSelectedStudentId(e.target.value)}
                        className="px-3.5 py-2 border border-gray-200 rounded-lg text-sm bg-white font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                      >
                        {students.map(s => (
                          <option key={s.id} value={s.id}>{s.name} ({s.position})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={() => downloadAttendanceReportCSV(students, metrics)}
                    className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ml-1"
                    title="Download Camp Attendance & Metrics CSV Report"
                    id="download-attendance-report-header-btn"
                  >
                    <Download size={14} /> Attendance Report
                  </button>
                </>
              )}
            </div>
          </div>

          {student ? (
            <div className="space-y-6" id="performance-content">
              {/* Athlete Metadata summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="performance-metrics-grid">
                {/* PR Sprint */}
                <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm space-y-1.5" id="pr-speed-card">
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">Personal Best Speed (40yd)</span>
                  <div className="text-2xl font-bold text-emerald-800 flex items-center gap-1">
                    <Clock size={18} className="text-emerald-600" />
                    {personalBestSpeed ? `${personalBestSpeed}s` : 'No data'}
                  </div>
                  <p className="text-[11px] text-gray-500">Target goal: Under 4.8 seconds</p>
                </div>

                {/* PR Agility */}
                <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm space-y-1.5" id="pr-agility-card">
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">Best Shuttle Agility</span>
                  <div className="text-2xl font-bold text-teal-800 flex items-center gap-1">
                    <Activity size={18} className="text-teal-600" />
                    {personalBestAgility ? `${personalBestAgility}s` : 'No data'}
                  </div>
                  <p className="text-[11px] text-gray-500">Target goal: Under 4.7 seconds</p>
                </div>

                {/* Attendance Score */}
                <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm space-y-1.5" id="attendance-score-card">
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">Camp Attendance Rate</span>
                  <div className="text-2xl font-bold text-sky-800 flex items-center gap-1">
                    <Award size={18} className="text-sky-600" />
                    {attendanceRate}%
                  </div>
                  <p className="text-[11px] text-gray-500">Total sessions attended: {presentSessions} / {sessionsCount}</p>
                </div>

                {/* Tactical rating */}
                <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm space-y-1.5" id="tactical-rating-card">
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider block">Last Game Rating</span>
                  <div className="text-2xl font-bold text-indigo-800 flex items-center gap-1">
                    <Sparkles size={18} className="text-indigo-600" />
                    {latestMetric ? `${latestMetric.stamina}/10` : 'No data'}
                  </div>
                  <p className="text-[11px] text-gray-500">Determined from scrimmage stamina</p>
                </div>
              </div>

              {/* Visual Graphs Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="performance-charts-row">
                {/* Skill Set Radar Chart */}
                <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-3" id="radar-chart-card">
                  <h3 className="font-bold text-gray-900 font-sans text-base">Athletic & Skill Balance</h3>
                  <p className="text-xs text-gray-500">Mapping tactical execution scores from the most recent session.</p>
                  
                  <div className="h-[320px] flex items-center justify-center" id="radar-recharts-container">
                    {latestMetric ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                          <PolarGrid stroke="#e5e7eb" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#4b5563', fontSize: 11, fontWeight: 500 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 10]} stroke="#9ca3af" tick={{ fontSize: 9 }} />
                          <Radar name={student.name} dataKey="value" stroke="#047857" fill="#10b981" fillOpacity={0.4} />
                          <Tooltip contentStyle={{ borderRadius: '12px', borderColor: '#f3f4f6' }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-10 text-gray-500 text-sm flex flex-col items-center gap-2">
                        <BarChart2 size={36} className="text-gray-300" />
                        No session drills recorded for this athlete yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Sprint & Agility Progression Line Chart */}
                <div className="p-5 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-3" id="sprint-agility-chart-card">
                  <h3 className="font-bold text-gray-900 font-sans text-base">Conditioning Performance Trend</h3>
                  <p className="text-xs text-gray-500">Sprints and cone shuttle timings (Lower numbers represent superior speeds).</p>
                  
                  <div className="h-[320px]" id="line-chart-recharts-container">
                    {playerMetrics.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={progressionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                          <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} />
                          <YAxis domain={['auto', 'auto']} stroke="#9ca3af" fontSize={11} tickLine={false} />
                          <Tooltip contentStyle={{ borderRadius: '12px', borderColor: '#f3f4f6' }} />
                          <Legend verticalAlign="top" height={36} iconType="circle" fontSize={12} />
                          <Line type="monotone" dataKey="40yd Sprint (s)" stroke="#047857" strokeWidth={2.5} activeDot={{ r: 6 }} />
                          <Line type="monotone" dataKey="Cone Agility (s)" stroke="#f59e0b" strokeWidth={2.5} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center py-10 text-gray-500 text-sm flex flex-col items-center justify-center h-full gap-2">
                        <BarChart2 size={36} className="text-gray-300" />
                        No metrics history to display.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Coaching Logs Feed */}
              <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-4" id="coaching-feed-card">
                <h3 className="font-bold text-gray-900 font-sans text-lg flex items-center gap-2">
                  <AlignLeft size={18} className="text-emerald-700" />
                  Daily Log Feed & Coach Abedemi Faniyan's Feedback
                </h3>
                
                <div className="space-y-4" id="coaching-logs-feed">
                  {playerMetrics.length > 0 ? (
                    [...playerMetrics].reverse().map(metric => (
                      <div key={metric.id} className="p-4 border border-gray-100 hover:border-gray-200 transition-all rounded-xl space-y-3 bg-gray-50/20">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              🗓️ {metric.date}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                              metric.attendance === 'Present' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {metric.attendance}
                            </span>
                          </div>
                          
                          {/* Drill Summary Numbers */}
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-600">
                            <span>Sprint: <strong className="text-gray-950">{metric.speed}s</strong></span>
                            <span>•</span>
                            <span>Agility: <strong className="text-gray-950">{metric.agility}s</strong></span>
                            <span>•</span>
                            <span>Passing: <strong className="text-emerald-700">{metric.passing}/10</strong></span>
                            <span>•</span>
                            <span>Shooting: <strong className="text-amber-700">{metric.shooting}/10</strong></span>
                            <span>•</span>
                            <span>Stamina: <strong className="text-indigo-700">{metric.stamina}/10</strong></span>
                          </div>
                        </div>
                        
                        {metric.notes ? (
                          <p className="text-sm text-gray-700 bg-white p-3 rounded-lg border border-gray-50 italic">
                            "{metric.notes}"
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 italic">No feedback remarks saved for this session.</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-gray-500 text-sm">
                      No drills logged for this player.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              No students available. Create one in the Roster tab to begin.
            </div>
          )}
        </div>
      )}

    </div>
  );
}
