import React, { useState } from 'react';
import { NotificationLog } from '../types';
import { Send, Sparkles, MessageSquare, Mail, RefreshCw, CheckCircle, Clock, Trash, AlertCircle } from 'lucide-react';

interface NotificationAutomatorProps {
  notifications: NotificationLog[];
  onAddNotification: (notification: Omit<NotificationLog, 'id' | 'timestamp' | 'status'>) => void;
}

export default function NotificationAutomator({
  notifications,
  onAddNotification
}: NotificationAutomatorProps) {
  // Notification form states
  const [reason, setReason] = useState('Heavy Thunderstorms (Practice Cancelled)');
  const [recipientGroup, setRecipientGroup] = useState('All Parents');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [method, setMethod] = useState<'SMS' | 'Email' | 'Both'>('Both');

  // AI draft states
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiDraft, setAiDraft] = useState<{ subject: string; emailBody: string; smsBody: string } | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);

  // Success dispatch feedback state
  const [dispatchAlert, setDispatchAlert] = useState<string | null>(null);

  // Pre-configured templates
  const templates = [
    { name: '⛈️ Thunderstorms (Cancel)', reason: 'Heavy Thunderstorms (Practice Cancelled)', group: 'All Parents', notes: 'Tonight\'s practice is cancelled. Make-up sessions will be coordinated next week.' },
    { name: '🔥 Extreme Heatwave (Cancel)', reason: 'Extreme Heatwave Warning (Practice Cancelled)', group: 'All Parents', notes: 'Temperature recorded over 98°F. Health and hydration remain our priority.' },
    { name: '🏟️ Field Maintenance (Reschedule)', reason: 'Turf Re-Seeding & Maintenance (Reschedule)', group: 'All Parents', notes: 'Sessions are relocated to Grass Field C, next to the recreation center.' },
    { name: '⚽ Tournament Reschedule', reason: 'Tournament Departure Time Reschedule', group: 'Under 16 Parents', notes: 'Departure is delayed by 30 minutes. Meeting at 08:30 AM instead of 08:00 AM.' },
    { name: '🤒 Coach Emergency (Reschedule)', reason: 'Coach Emergency (Training Reschedule)', group: 'All Parents', notes: 'Session moved to Saturday morning at 10:00 AM under Assistant Coach Dave.' }
  ];

  const selectTemplate = (t: typeof templates[0]) => {
    setReason(t.reason);
    setRecipientGroup(t.group);
    setAdditionalNotes(t.notes);
    setAiDraft(null);
  };

  const generateAIDraft = async () => {
    setIsGenerating(true);
    setApiError(null);
    setAiDraft(null);

    try {
      const response = await fetch('/api/generate-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason,
          group: recipientGroup,
          notes: additionalNotes,
          method
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to contact server-side generator. Status code: ${response.status}`);
      }

      const data = await response.json();
      setAiDraft(data.draft);
      setIsSimulated(!!data.simulated);
      if (data.apiError) {
        setApiError(`Gemini is unconfigured. Showing a beautiful, structured template instead.`);
      }
    } catch (err: any) {
      console.error(err);
      setApiError(`Could not generate. Server feedback: ${err.message || err}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendNotification = () => {
    if (!aiDraft) return;

    // Dispatching notification to our log DB
    onAddNotification({
      title: aiDraft.subject,
      message: method === 'SMS' ? aiDraft.smsBody : (method === 'Email' ? aiDraft.emailBody : `SMS: ${aiDraft.smsBody}\n\nEMAIL:\n${aiDraft.emailBody}`),
      recipientGroup,
      method
    });

    setDispatchAlert(`Successfully dispatched parent alerts! Parents registered in "${recipientGroup}" have been notified via ${method}.`);
    
    // Clear draft
    setAiDraft(null);
    setAdditionalNotes('');
    
    setTimeout(() => setDispatchAlert(null), 5000);
  };

  return (
    <div className="space-y-6" id="notification-automator-root">
      
      {/* Dispatch feedback Banner */}
      {dispatchAlert && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-semibold flex items-center justify-between shadow-sm animate-bounce">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-emerald-600" />
            {dispatchAlert}
          </div>
          <button onClick={() => setDispatchAlert(null)} className="text-gray-400 hover:text-gray-600 font-bold">Dismiss</button>
        </div>
      )}

      {/* Header */}
      <div className="space-y-1" id="notification-header">
        <h2 className="text-2xl font-bold text-gray-900 font-sans">Parent Notification Automator</h2>
        <p className="text-sm text-gray-500">Draft urgent schedule updates, cancellations, or logistics changes and broadcast them instantly.</p>
      </div>

      {/* Quick Select Presets bar */}
      <div className="space-y-2" id="template-quickselect-bar">
        <span className="text-xs font-mono font-bold text-gray-500 uppercase tracking-wider block">Quick-Select Templates:</span>
        <div className="flex flex-wrap gap-2">
          {templates.map((t, idx) => (
            <button
              key={idx}
              onClick={() => selectTemplate(t)}
              className="px-3.5 py-2 border border-gray-200 bg-white hover:border-emerald-600 hover:bg-emerald-50/10 rounded-xl text-xs font-semibold text-gray-700 hover:text-emerald-950 transition-all cursor-pointer flex items-center gap-1.5"
            >
              {t.name}
            </button>
          ))}
        </div>
      </div>

      {/* Compose Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="notification-grid">
        {/* Editor Form */}
        <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-4" id="notification-form-card">
          <h3 className="font-bold text-gray-900 font-sans text-base">Announcement Settings</h3>
          
          <div className="space-y-4">
            {/* Reason */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-gray-700 uppercase">Reason / Event Trigger</label>
              <input 
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Thunderstorms (Practice Cancelled)"
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Recipient Group */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-gray-700 uppercase">Recipient Parent Group</label>
                <select
                  value={recipientGroup}
                  onChange={(e) => setRecipientGroup(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  <option value="All Parents">All Parents & Guardians</option>
                  <option value="Under 12 Parents">U12 Division Parents</option>
                  <option value="Under 14 Parents">U14 Division Parents</option>
                  <option value="Under 16 Parents">U16 Division Parents</option>
                </select>
              </div>

              {/* Delivery Channel */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-gray-700 uppercase">Delivery Channel</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  <option value="Both">Both SMS and Email</option>
                  <option value="SMS">SMS Alerts Only</option>
                  <option value="Email">Email Newsletters Only</option>
                </select>
              </div>
            </div>

            {/* Custom Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-gray-700 uppercase">Coach/Admin Notes (Specific Details)</label>
              <textarea 
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="e.g. Heavy lightning expected between 5:30 PM and 8:00 PM. Make-up training session will be hosted Saturday morning."
                rows={4}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none"
              />
            </div>

            {/* Submit Generation Action */}
            <button
              onClick={generateAIDraft}
              disabled={isGenerating}
              className="w-full py-3 bg-gray-950 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  AI Writing Parent Drafts...
                </>
              ) : (
                <>
                  <Sparkles size={16} className="text-amber-400" />
                  Generate AI Communication Drafts
                </>
              )}
            </button>
          </div>
        </div>

        {/* AI Preview Draft View */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-slate-100 space-y-4 shadow-inner relative min-h-[400px]" id="notification-ai-draft-card">
          <div className="flex justify-between items-center">
            <h3 className="font-bold font-sans text-base flex items-center gap-2">
              <Sparkles size={18} className="text-amber-400" />
              Live Comm Preview Drafts
            </h3>
            
            {aiDraft && (
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                isSimulated ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
              }`}>
                {isSimulated ? '✨ Structured Core' : '⚡ Gemini Live'}
              </span>
            )}
          </div>

          {apiError && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{apiError}</span>
            </div>
          )}

          {aiDraft ? (
            <div className="space-y-5" id="comm-preview-panels">
              {/* Email View */}
              {(method === 'Email' || method === 'Both') && (
                <div className="space-y-2" id="preview-email-panel">
                  <div className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1">
                    <Mail size={12} />
                    EMAIL NEWSLETTER
                  </div>
                  <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 space-y-3">
                    <div className="text-xs border-b border-slate-700/55 pb-2">
                      <span className="text-slate-400">Subject:</span> <strong className="text-white">{aiDraft.subject}</strong>
                    </div>
                    <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[160px] overflow-y-auto">
                      {aiDraft.emailBody}
                    </p>
                  </div>
                </div>
              )}

              {/* SMS View */}
              {(method === 'SMS' || method === 'Both') && (
                <div className="space-y-2" id="preview-sms-panel">
                  <div className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1">
                    <MessageSquare size={12} />
                    URGENT MOBILE SMS (Char limit)
                  </div>
                  <div className="bg-emerald-950/20 border border-emerald-500/15 text-emerald-100 rounded-xl p-4 text-xs italic">
                    "{aiDraft.smsBody}"
                  </div>
                </div>
              )}

              {/* Send Button */}
              <button
                onClick={handleSendNotification}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <Send size={16} />
                Send & Log Broadcast Alert
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-10 space-y-3 text-slate-400">
              <Sparkles size={40} className="text-slate-600 animate-pulse" />
              <div className="text-sm">No Communication drafts active.</div>
              <p className="text-xs text-slate-500 max-w-xs">
                Select a template or compose custom notes, then press "Generate" to let Gemini compile beautiful notifications.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Broadcast logs feed list */}
      <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-4" id="notifications-log-card">
        <h3 className="font-bold text-gray-900 font-sans text-lg">Broadcast History Logs</h3>
        
        <div className="space-y-3" id="broadcast-history-list">
          {notifications.length > 0 ? (
            notifications.map(n => (
              <div key={n.id} className="p-4 border border-gray-100 rounded-xl space-y-2 bg-gray-50/20">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">{n.title}</h4>
                    <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                      <span>Group: <strong>{n.recipientGroup}</strong></span>
                      <span>•</span>
                      <span>Method: <strong>{n.method}</strong></span>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] font-mono text-gray-500 block">🗓️ {n.timestamp}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded mt-1">
                      <CheckCircle size={10} />
                      Delivered Successfully
                    </span>
                  </div>
                </div>
                
                <p className="text-xs text-gray-700 whitespace-pre-wrap bg-white p-3 border border-gray-50 rounded-lg">
                  {n.message}
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-500 text-sm">No notification alerts broadcasted yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
