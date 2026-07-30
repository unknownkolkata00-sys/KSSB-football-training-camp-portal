import React, { useState } from 'react';
import { NotificationLog, Student } from '../types';
import { Send, Sparkles, RefreshCw, CheckCircle, Clock, AlertCircle, Zap, Smartphone, Users, Search, Bell, Radio, Trash2, X } from 'lucide-react';

interface NotificationAutomatorProps {
  notifications: NotificationLog[];
  students?: Student[];
  onAddNotification: (notification: Omit<NotificationLog, 'id' | 'timestamp' | 'status'>) => void;
  onDeleteAllNotifications?: () => void;
}

export default function NotificationAutomator({
  notifications,
  students = [],
  onAddNotification,
  onDeleteAllNotifications
}: NotificationAutomatorProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // Notification form states
  const [reason, setReason] = useState('Heavy Thunderstorms (Practice Cancelled)');
  const [recipientGroup, setRecipientGroup] = useState('All Parents');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [method, setMethod] = useState<'SMS' | 'Email' | 'Both'>('Both');

  // Student search for roster reference
  const [searchQuery, setSearchQuery] = useState('');

  // AI draft states
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiDraft, setAiDraft] = useState<{ subject: string; emailBody: string; smsBody: string } | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);

  // Success dispatch feedback state
  const [dispatchAlert, setDispatchAlert] = useState<string | null>(null);

  // Express One-Click App Broadcast Presets
  const expressPresets = [
    {
      title: '⛈️ Practice Cancellation',
      reason: 'Practice Cancellation Alert',
      alertText: 'KSSB FC ALERT: Today\'s football training practice is CANCELLED due to inclement weather/field conditions. Next session details are updated on the student portal.',
      category: 'Practice Cancelled'
    },
    {
      title: '⚽ Team Squad Selection',
      reason: 'Match Starting XI & Squad Selection',
      alertText: 'KSSB FC SQUAD NEWS: The team squad & Starting XI for the upcoming tournament match have been officially published. Please check your student portal now!',
      category: 'Team Selection'
    },
    {
      title: '🏆 Tournament & Travel News',
      reason: 'Tournament News & Logistics Update',
      alertText: 'KSSB FC TOURNAMENT UPDATE: Match fixture venue & team bus departure times have been updated. Players must report 30 mins prior at academy grounds.',
      category: 'Tournament News'
    },
    {
      title: '💳 Monthly Fee Due Reminder',
      reason: 'Academy Monthly Training Fee Reminder',
      alertText: 'KSSB FC FEE REMINDER: Monthly training fee for player is due. Please pay digitally via student portal or at the academy counter. Thank you!',
      category: 'Fee Reminder'
    }
  ];

  const handlePublishExpressPreset = (preset: typeof expressPresets[0]) => {
    // Publish mobile app notification directly for all students/parents
    onAddNotification({
      title: preset.reason,
      message: preset.alertText,
      recipientGroup: 'All Parents',
      method: 'SMS'
    });

    setDispatchAlert(`📢 Published App Notification for "${preset.title}"! All students will receive this alert in their mobile app.`);
    setTimeout(() => setDispatchAlert(null), 6000);
  };

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
        setApiError(`Gemini is unconfigured. Showing a structured template instead.`);
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

    // Dispatching notification directly to students' in-app notification feed
    onAddNotification({
      title: aiDraft.subject,
      message: aiDraft.smsBody || aiDraft.emailBody,
      recipientGroup,
      method
    });

    setDispatchAlert(`📢 Published App Notification alert to "${recipientGroup}"! All students will receive this update in their mobile app.`);
    
    // Clear draft
    setAiDraft(null);
    setAdditionalNotes('');
    
    setTimeout(() => setDispatchAlert(null), 5000);
  };

  return (
    <div className="space-y-6" id="notification-automator-root">
      
      {/* Dispatch feedback Banner */}
      {dispatchAlert && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between shadow-md animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle size={20} className="text-emerald-600 shrink-0" />
            <span>{dispatchAlert}</span>
          </div>
          <button onClick={() => setDispatchAlert(null)} className="text-gray-400 hover:text-gray-600 font-bold cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* Header */}
      <div className="space-y-1" id="notification-header">
        <h2 className="text-2xl font-black text-gray-900 font-sans flex items-center gap-2">
          <Smartphone className="text-emerald-700" size={26} />
          In-App Mobile Push Notifications & Camp Broadcast Center
        </h2>
        <p className="text-xs text-gray-500">Publish real-time mobile app alerts and updates directly to student devices and parent portals.</p>
      </div>

      {/* 📢 ONE-CLICK APP BROADCAST EXPRESS DISPATCH PANEL */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 text-white space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold uppercase rounded-full border border-emerald-500/30">
              Direct Mobile App Push Alerts
            </span>
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Zap className="text-yellow-400 fill-yellow-400" size={20} />
              1-Click Instant Camp Push Broadcasts
            </h3>
            <p className="text-xs text-slate-300 max-w-xl">
              Tap any button below to instantly publish official camp alerts for practice cancellations, squad selections, tournament updates, or fee reminders. All students receive notification alerts directly in their mobile app.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {expressPresets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handlePublishExpressPreset(preset)}
              className="p-3.5 bg-slate-800/90 hover:bg-emerald-800/80 border border-slate-700 hover:border-emerald-500 rounded-xl text-left space-y-2 transition-all cursor-pointer group shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-1">
                <div className="font-bold text-xs text-amber-300 group-hover:text-white flex items-center justify-between">
                  <span>{preset.title}</span>
                  <Radio size={12} className="text-emerald-400 animate-pulse" />
                </div>
                <p className="text-[11px] text-slate-300 line-clamp-2 leading-snug font-mono">
                  "{preset.alertText}"
                </p>
              </div>
              <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px] font-mono text-emerald-400 font-bold">
                <span>IN-APP PUSH</span>
                <span className="bg-emerald-500/20 px-2 py-0.5 rounded text-emerald-300">Publish Alert</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 📱 STUDENT MOBILE APP RECIPIENTS ROSTER */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-sm" id="student-app-recipients-roster">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Users size={22} className="text-emerald-600" />
              Registered Student Mobile App Roster ({students.length})
            </h3>
            <p className="text-xs text-gray-500">All registered students receive real-time push alerts and unread notification indicators inside their mobile portal.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-gray-50 p-2.5 px-3.5 border border-gray-200 rounded-xl">
          <Search size={16} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search student by name or registration number..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-gray-900 placeholder-gray-400 focus:outline-none w-full"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[220px] overflow-y-auto pr-1">
          {students
            .filter(s => 
              s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
              s.registrationNumber?.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map(s => (
              <div key={s.id} className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-gray-900">{s.name}</h4>
                  <p className="text-[10px] font-mono text-gray-500">{s.registrationNumber || 'KSSB FC Student'}</p>
                </div>
                <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Bell size={10} className="text-emerald-600" /> App Active
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Quick Select Presets bar */}
      <div className="space-y-2" id="template-quickselect-bar">
        <span className="text-xs font-mono font-bold text-gray-500 uppercase tracking-wider block">Quick-Select News Templates:</span>
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
          <h3 className="font-bold text-gray-900 font-sans text-base">In-App Broadcast Settings</h3>
          
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
                <label className="text-xs font-mono font-bold text-gray-700 uppercase">Recipient Student Group</label>
                <select
                  value={recipientGroup}
                  onChange={(e) => setRecipientGroup(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  <option value="All Parents">All Students & Parents</option>
                  <option value="Under 12 Parents">U12 Division Students</option>
                  <option value="Under 14 Parents">U14 Division Students</option>
                  <option value="Under 16 Parents">U16 Division Students</option>
                </select>
              </div>

              {/* Delivery Channel */}
              <div className="space-y-1.5">
                <label className="text-xs font-mono font-bold text-gray-700 uppercase">Alert Mode</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  <option value="Both">In-App Push Alert & Notice Board</option>
                  <option value="SMS">In-App Banner Alert Only</option>
                  <option value="Email">Notice Board Announcement</option>
                </select>
              </div>
            </div>

            {/* Custom Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold text-gray-700 uppercase">Coach/Admin Update Details</label>
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
                  AI Drafting Push Alert...
                </>
              ) : (
                <>
                  <Sparkles size={16} className="text-amber-400" />
                  Generate AI Broadcast Message
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
              Live Mobile Push Notification Preview
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
              {/* Push Alert Card Preview */}
              <div className="space-y-2">
                <div className="text-xs font-mono font-bold text-slate-400 flex items-center gap-1">
                  <Smartphone size={12} />
                  STUDENT MOBILE APP PUSH ALERT PREVIEW
                </div>
                <div className="bg-gradient-to-r from-amber-500 via-rose-600 to-amber-600 p-4 rounded-2xl text-white space-y-2 shadow-lg">
                  <div className="flex items-center justify-between text-[11px] font-mono text-amber-100">
                    <span>📢 Academy Broadcast Alert</span>
                    <span>Target: {recipientGroup}</span>
                  </div>
                  <h4 className="font-black text-sm text-white">{aiDraft.subject}</h4>
                  <p className="text-xs text-amber-50 font-medium bg-black/20 p-3 rounded-xl whitespace-pre-wrap border border-white/10">
                    {aiDraft.smsBody || aiDraft.emailBody}
                  </p>
                </div>
              </div>

              {/* Publish Button */}
              <button
                onClick={handleSendNotification}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
              >
                <Send size={16} />
                Publish & Push Alert To Mobile App
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-10 space-y-3 text-slate-400">
              <Sparkles size={40} className="text-slate-600 animate-pulse" />
              <div className="text-sm">No Communication drafts active.</div>
              <p className="text-xs text-slate-500 max-w-xs">
                Select a template or compose custom update notes, then press "Generate" to let Gemini compile the mobile app notification.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Broadcast logs feed list */}
      <div className="p-6 bg-white border border-gray-100 rounded-2xl shadow-sm space-y-4" id="notifications-log-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900 font-sans text-lg">Published App Broadcast History ({notifications.length})</h3>
            <p className="text-xs text-gray-500">History of all published push alerts sent to mobile app users.</p>
          </div>

          {onDeleteAllNotifications && notifications.length > 0 && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
              id="delete-all-notifications-btn"
            >
              <Trash2 size={14} />
              Delete All Notifications
            </button>
          )}
        </div>
        
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
                      <span>Target: <strong>Mobile App Push Alert</strong></span>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] font-mono text-gray-500 block">🗓️ {n.timestamp}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded mt-1">
                      <CheckCircle size={10} />
                      Published to Student Portals
                    </span>
                  </div>
                </div>
                
                <p className="text-xs text-gray-700 whitespace-pre-wrap bg-white p-3 border border-gray-50 rounded-lg">
                  {n.message}
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-gray-500 text-sm">No notification alerts published yet.</div>
          )}
        </div>
      </div>

      {/* Delete All Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative border border-rose-100">
            <button 
              onClick={() => setShowDeleteConfirm(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl shrink-0">
                <AlertCircle size={28} />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-900">Delete All Notifications?</h3>
                <p className="text-xs text-gray-500">Admin Portal Broadcast Clear</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed bg-rose-50/50 p-3.5 rounded-xl border border-rose-100">
              Are you sure you want to permanently delete all <strong>{notifications.length}</strong> previous notification broadcast logs from the application and cloud database? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteAllNotifications) {
                    onDeleteAllNotifications();
                  }
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md cursor-pointer"
              >
                <Trash2 size={14} />
                Yes, Delete All Notifications
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

