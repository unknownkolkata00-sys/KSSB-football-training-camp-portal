import React, { useState } from 'react';
import { CoachEvaluation } from '../types';
import { Award, Sparkles, TrendingUp, Calendar, CheckCircle2, ChevronRight, FileText, AlertCircle, RefreshCw } from 'lucide-react';

interface CoachPerformanceProps {
  evaluations: CoachEvaluation[];
  onAddEvaluation: (evalItem: Omit<CoachEvaluation, 'id' | 'date'>) => void;
}

export default function CoachPerformance({
  evaluations,
  onAddEvaluation
}: CoachPerformanceProps) {
  const [sessionsCount, setSessionsCount] = useState(12);
  const [avgAttendance, setAvgAttendance] = useState(92);
  const [winRatio, setWinRatio] = useState(75);
  const [avgPlayerImprovement, setAvgPlayerImprovement] = useState(14);
  const [rating, setRating] = useState(4.8);
  const [additionalNotes, setAdditionalNotes] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);

  // Quick helper to render simple markdown text into clean styled JSX elements
  const renderMarkdown = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      // Check for headings
      if (line.startsWith('### ')) {
        return <h4 key={idx} className="text-base font-bold text-gray-900 mt-4 mb-2 border-b border-gray-100 pb-1 font-sans">{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={idx} className="text-lg font-bold text-emerald-800 mt-5 mb-2 font-sans">{line.replace('## ', '')}</h3>;
      }
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={idx} className="font-bold text-gray-900 my-1">{line.replace(/\*\*/g, '')}</p>;
      }
      // Check for bullets
      if (line.startsWith('- ')) {
        // Simple bold parser within bullet
        const content = line.replace('- ', '');
        const boldParts = content.split('**');
        if (boldParts.length > 2) {
          return (
            <li key={idx} className="ml-4 list-disc text-xs text-gray-700 my-1 leading-relaxed">
              {boldParts[0]}<strong>{boldParts[1]}</strong>{boldParts.slice(2).join('')}
            </li>
          );
        }
        return <li key={idx} className="ml-4 list-disc text-xs text-gray-700 my-1 leading-relaxed">{content}</li>;
      }
      // Horizontal rule
      if (line.trim() === '---') {
        return <hr key={idx} className="my-4 border-gray-200" />;
      }
      // Default paragraphs
      if (line.trim() !== '') {
        // Simple inline bold replacement for standard lines
        const boldParts = line.split('**');
        if (boldParts.length > 2) {
          return (
            <p key={idx} className="text-xs text-gray-600 my-2 leading-relaxed">
              {boldParts[0]}<strong>{boldParts[1]}</strong>{boldParts.slice(2).join('')}
            </p>
          );
        }
        return <p key={idx} className="text-xs text-gray-600 my-2 leading-relaxed">{line}</p>;
      }
      return <div key={idx} className="h-2" />;
    });
  };

  const generateEvaluation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setApiError(null);
    setAiReport(null);

    try {
      const response = await fetch('/api/coach-evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionsCount,
          avgAttendance,
          winRatio,
          avgPlayerImprovementPercent: avgPlayerImprovement,
          rating,
          additionalNotes
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to request evaluation compile. Status code: ${response.status}`);
      }

      const data = await response.json();
      setAiReport(data.report);
      setIsSimulated(!!data.simulated);

      // Save report automatically in the logs
      onAddEvaluation({
        sessionsCount,
        avgAttendance,
        overallRating: rating,
        aiReport: data.report
      });

    } catch (err: any) {
      console.error(err);
      setApiError(`Failed to generate: ${err.message || err}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6" id="coach-performance-root">
      
      {/* Header */}
      <div className="space-y-1" id="coach-perf-header">
        <h2 className="text-2xl font-bold text-gray-900 font-sans">Coach Performance & Evaluations</h2>
        <p className="text-sm text-gray-500">Conduct seasonal coaching evaluations, compile attendance data, and let Gemini generate reports.</p>
      </div>

      {/* Ratios Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="coach-metrics-grid">
        <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm space-y-1">
          <span className="text-[10px] font-mono text-gray-500 uppercase">Supervised Training Sessions</span>
          <div className="text-2xl font-bold text-gray-900">{sessionsCount} sessions</div>
          <div className="text-[10px] text-emerald-600">June - July cycle</div>
        </div>
        <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm space-y-1">
          <span className="text-[10px] font-mono text-gray-500 uppercase">Avg Squad Attendance</span>
          <div className="text-2xl font-bold text-emerald-700">{avgAttendance}%</div>
          <div className="text-[10px] text-gray-400">Target goal: &gt;90%</div>
        </div>
        <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm space-y-1">
          <span className="text-[10px] font-mono text-gray-500 uppercase">Scrimmage Win Ratio</span>
          <div className="text-2xl font-bold text-indigo-700">{winRatio}%</div>
          <div className="text-[10px] text-gray-400">Tactical drill success</div>
        </div>
        <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm space-y-1">
          <span className="text-[10px] font-mono text-gray-500 uppercase">Avg Player Development</span>
          <div className="text-2xl font-bold text-teal-700">+{avgPlayerImprovement}% growth</div>
          <div className="text-[10px] text-teal-600">Sprint speed improvement</div>
        </div>
      </div>

      {/* Evaluator controls columns */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6" id="evaluator-grid">
        
        {/* Metric Form Controls */}
        <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-4 lg:col-span-2" id="eval-form-card">
          <h3 className="font-bold text-gray-900 font-sans text-base">Compile Performance Inputs</h3>
          
          <form onSubmit={generateEvaluation} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-gray-700 uppercase">Supervised Drills</label>
                <input 
                  type="number"
                  value={sessionsCount}
                  onChange={(e) => setSessionsCount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-gray-700 uppercase">Squad Attendance (%)</label>
                <input 
                  type="number"
                  value={avgAttendance}
                  onChange={(e) => setAvgAttendance(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-gray-700 uppercase">Scrimmage Win (%)</label>
                <input 
                  type="number"
                  value={winRatio}
                  onChange={(e) => setWinRatio(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-gray-700 uppercase">Athletic Growth (%)</label>
                <input 
                  type="number"
                  value={avgPlayerImprovement}
                  onChange={(e) => setAvgPlayerImprovement(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-gray-700 uppercase">Numeric Performance Score (1-5)</label>
              <input 
                type="number"
                step="0.1"
                min="1.0"
                max="5.0"
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-gray-700 uppercase">Director's Qualitative Notes</label>
              <textarea 
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="e.g. Abedemi Faniyan communicates incredibly with parents. Soft-tissue injuries have increased slightly; recommendations to increase static warming sessions should be made."
                rows={3}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-xs focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-2.5 bg-gray-950 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 transition-all cursor-pointer disabled:bg-gray-400"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="animate-spin" size={14} />
                  AI Evaluating & Drafting...
                </>
              ) : (
                <>
                  <Sparkles size={14} className="text-amber-400" />
                  Compile Evaluation Report (Gemini)
                </>
              )}
            </button>
          </form>
        </div>

        {/* AI Report Viewer */}
        <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-4 lg:col-span-3 min-h-[400px] flex flex-col justify-between" id="report-viewer-card">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-gray-900 font-sans text-base flex items-center gap-2">
                <FileText size={18} className="text-emerald-700" />
                Technical Director Evaluation Report
              </h3>
              {aiReport && (
                <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                  {isSimulated ? '✨ Structured Core' : '⚡ Gemini Live'}
                </span>
              )}
            </div>

            {apiError && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle size={14} className="shrink-0 mt-0.5" />
                <span>{apiError}</span>
              </div>
            )}

            <div className="bg-gray-50/50 border border-gray-100 rounded-xl p-5 max-h-[360px] overflow-y-auto space-y-1">
              {aiReport ? (
                renderMarkdown(aiReport)
              ) : (
                <div className="text-center py-12 text-gray-400 text-xs space-y-2">
                  <Award size={36} className="mx-auto text-gray-300 animate-pulse" />
                  <p>No compiled evaluation report active.</p>
                  <p className="text-[10px] text-gray-400 max-w-xs mx-auto">Input the technical metrics and click "Compile" to generate a detailed professional report from Gemini.</p>
                </div>
              )}
            </div>
          </div>

          {aiReport && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 font-medium">
              📄 This report has been automatically formatted, locked, and recorded to the camp evaluation logs.
            </div>
          )}
        </div>
      </div>

      {/* Logs of previous evaluations */}
      <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-4" id="evaluations-history-card">
        <h3 className="font-bold text-gray-900 font-sans text-lg">Evaluation History & Records</h3>
        
        <div className="space-y-4" id="evaluation-history-list">
          {evaluations.length > 0 ? (
            evaluations.map(e => (
              <div key={e.id} className="p-4 border border-gray-100 hover:border-gray-200 rounded-xl space-y-3 bg-gray-50/15">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-gray-500">Evaluation Date: {e.date}</span>
                    <h4 className="font-bold text-sm text-gray-900">Coach Performance Score: <strong className="text-emerald-700">{e.overallRating} / 5.0</strong></h4>
                  </div>
                  <div className="text-xs text-gray-500">
                    Sessions: <strong>{e.sessionsCount}</strong> • Attendance: <strong>{e.avgAttendance}%</strong>
                  </div>
                </div>
                
                {e.aiReport && (
                  <div className="bg-white p-4 border border-gray-100 rounded-xl max-h-[220px] overflow-y-auto text-xs text-gray-700 leading-relaxed shadow-inner">
                    {renderMarkdown(e.aiReport)}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-500 text-sm">No historic evaluation logs compiled yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
