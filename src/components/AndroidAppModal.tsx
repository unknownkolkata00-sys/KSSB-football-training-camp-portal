import React, { useState, useEffect } from 'react';
import { Smartphone, Download, CheckCircle2, Share2, Sparkles, X, QrCode, ShieldCheck, ArrowRight } from 'lucide-react';
import kssbFcLogo from '../assets/images/kssb_fc_official_logo_1784715023480.jpg';

interface AndroidAppModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AndroidAppModal({ isOpen, onClose }: AndroidAppModalProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [installSuccess, setInstallSuccess] = useState<boolean>(false);

  useEffect(() => {
    // Listen for PWA install prompt on Android
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app is already running in standalone mode (installed as PWA)
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallSuccess(true);
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert("To install on Android:\n1. Tap the 3 dots (⋮) in Chrome top right\n2. Select 'Add to Home Screen' or 'Install App'");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden space-y-5">
        {/* Decorative background glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-600/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white p-0.5 border border-amber-400/40 shadow-md shrink-0">
            <img 
              src={kssbFcLogo || '/logo.jpg'} 
              onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/logo.jpg'; }}
              alt="KSSB FC" 
              className="w-full h-full object-contain rounded-[10px]" 
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold rounded-full border border-emerald-500/30">
                Android App
              </span>
              <span className="text-xs text-slate-400">v1.0</span>
            </div>
            <h3 className="text-lg font-bold text-white font-sans tracking-tight">KSSB FC Mobile App</h3>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Install the official <strong>Kadamtala Sporting Subhas Bhowmick Football Camp (KSSB FC)</strong> mobile app directly onto your Android device for instant full-screen access, fast roster lookups, and one-tap parent phone calls.
        </p>

        {/* Android Installation Status or Direct Button */}
        {installSuccess || isInstalled ? (
          <div className="p-4 bg-emerald-950/60 border border-emerald-700/50 rounded-2xl text-center space-y-2">
            <CheckCircle2 size={32} className="text-emerald-400 mx-auto" />
            <div className="font-bold text-emerald-200 text-sm">App Installed on Android!</div>
            <p className="text-xs text-emerald-300/80">
              KSSB FC is ready on your home screen. You can launch it directly anytime from your phone apps menu.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={handleInstallClick}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all cursor-pointer border border-emerald-400/30"
            >
              <Download size={18} />
              Install KSSB FC App on Android
            </button>

            {/* Step-by-step guide */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-xs text-slate-300">
              <div className="font-mono text-[10px] uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                <Smartphone size={13} /> Manual Android Chrome Installation Guide
              </div>
              <ol className="space-y-2 list-decimal list-inside text-slate-300 text-[11px]">
                <li>Open this app in <strong>Google Chrome</strong> or <strong>Edge</strong> on your Android phone.</li>
                <li>Tap the <strong>⋮ (3 dots menu)</strong> at top-right corner.</li>
                <li>Tap <strong>"Add to Home Screen"</strong> or <strong>"Install App"</strong>.</li>
                <li>Launch <strong>KSSB FC</strong> directly from your Android app drawer!</li>
              </ol>
            </div>
          </div>
        )}

        {/* Key Android Features */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-0.5">
            <div className="font-bold text-emerald-400 text-[11px]">⚡ Fast Touch UI</div>
            <div className="text-[10px] text-slate-400">Optimized vertical cards for mobile Android displays</div>
          </div>
          <div className="p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-0.5">
            <div className="font-bold text-yellow-400 text-[11px]">📞 1-Tap Dialer</div>
            <div className="text-[10px] text-slate-400">Instantly call guardians directly from player profiles</div>
          </div>
        </div>

        <div className="pt-2 text-center">
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors font-medium underline cursor-pointer"
          >
            Continue in Browser
          </button>
        </div>
      </div>
    </div>
  );
}
