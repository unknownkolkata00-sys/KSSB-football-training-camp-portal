import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Check, X, RotateCcw, Upload, Image as ImageIcon, AlertTriangle, ShieldCheck, User } from 'lucide-react';

interface PassportPhotoCaptureProps {
  currentPhotoUrl?: string;
  onPhotoCaptured: (photoUrl: string) => void;
  label?: string;
}

export default function PassportPhotoCapture({
  currentPhotoUrl = '',
  onPhotoCaptured,
  label = 'Player Passport Photo'
}: PassportPhotoCaptureProps) {
  // Mode state: 'idle' | 'camera' | 'preview'
  const [mode, setMode] = useState<'idle' | 'camera' | 'preview'>('idle');
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string>('');
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll into view when camera or preview mode activates on mobile
  useEffect(() => {
    if (mode === 'camera' || mode === 'preview') {
      setTimeout(() => {
        containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [mode]);

  // Stop camera on unmount or mode exit
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const startCamera = async (targetFacingMode: 'environment' | 'user' = cameraFacingMode) => {
    setCameraError(null);
    stopCamera();

    try {
      let stream: MediaStream | null = null;
      
      // Attempt 1: Ideal facingMode with 720p constraints
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: targetFacingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        });
      } catch (err1) {
        console.warn('First camera attempt failed, trying fallback constraints:', err1);
        try {
          // Attempt 2: Direct facingMode constraint
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: targetFacingMode },
            audio: false
          });
        } catch (err2) {
          console.warn('Second camera attempt failed, trying default camera:', err2);
          // Attempt 3: Any video
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }
      }

      if (!stream) {
        throw new Error('Could not access video stream');
      }

      streamRef.current = stream;
      setCameraFacingMode(targetFacingMode);
      setMode('camera');

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.error('Error playing camera feed:', e));
        }
      }, 100);
    } catch (err: any) {
      console.error('Camera permission or availability error:', err);
      setCameraError('Camera access unavailable or blocked. Please allow camera permissions in browser settings or upload from device gallery.');
      setMode('idle');
    }
  };

  const toggleCameraFacingMode = () => {
    const nextMode = cameraFacingMode === 'environment' ? 'user' : 'environment';
    startCamera(nextMode);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    // Passport photo resolution: 400x400 (1:1 square crop)
    const passportSize = 400;
    const canvas = document.createElement('canvas');
    canvas.width = passportSize;
    canvas.height = passportSize;
    const ctx = canvas.getContext('2d');

    const vWidth = video.videoWidth || 640;
    const vHeight = video.videoHeight || 480;

    if (ctx && vWidth && vHeight) {
      const minDim = Math.min(vWidth, vHeight);
      const sx = (vWidth - minDim) / 2;
      const sy = (vHeight - minDim) / 2;

      // Mirror horizontally if front camera so photo matches user mirror view
      if (cameraFacingMode === 'user') {
        ctx.translate(passportSize, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, sx, sy, minDim, minDim, 0, 0, passportSize, passportSize);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      stopCamera();
      setPreviewPhotoUrl(dataUrl);
      setMode('preview');
    }
  };

  const handleGalleryFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const passportSize = 400;
        const canvas = document.createElement('canvas');
        canvas.width = passportSize;
        canvas.height = passportSize;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;

          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, passportSize, passportSize);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          
          stopCamera();
          setPreviewPhotoUrl(dataUrl);
          setMode('preview');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleUsePhoto = () => {
    onPhotoCaptured(previewPhotoUrl);
    setMode('idle');
  };

  const handleRetake = () => {
    setPreviewPhotoUrl('');
    startCamera(cameraFacingMode);
  };

  const handleCancel = () => {
    stopCamera();
    setPreviewPhotoUrl('');
    setMode('idle');
  };

  return (
    <div ref={containerRef} className={`mt-4 sm:mt-5 p-3.5 sm:p-4 rounded-2xl border shadow-xs transition-all w-full ${
      mode === 'camera' || mode === 'preview' 
        ? 'bg-emerald-100/90 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg space-y-3.5' 
        : 'bg-emerald-50/90 border-emerald-300'
    }`}>
      {/* Header Label Row */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <label className="text-xs font-mono font-bold text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
          <Camera size={16} className="text-emerald-700 shrink-0" />
          <span>{label}</span>
        </label>
        <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 border border-amber-200/80 px-2 py-0.5 rounded shrink-0">
          1:1 Passport Format
        </span>
      </div>

      {/* Camera Error / Permission Warning */}
      {cameraError && (
        <div className="bg-amber-50 border border-amber-300 p-3 rounded-xl text-xs text-amber-900 space-y-2 mb-3">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertTriangle size={16} className="text-amber-600 shrink-0" />
            <span>Camera Access Notice</span>
          </div>
          <p className="text-[11px] leading-relaxed text-amber-800">
            {cameraError}
          </p>
          <div className="pt-1 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Upload size={14} /> Select from Phone Gallery
            </button>
            <button
              type="button"
              onClick={() => startCamera('environment')}
              className="px-3 py-1.5 border border-amber-400 text-amber-950 hover:bg-amber-100 rounded-lg text-xs font-bold cursor-pointer"
            >
              Retry Camera
            </button>
          </div>
        </div>
      )}

      {/* Hidden Gallery File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleGalleryFileSelect}
        className="hidden"
      />

      {/* IDLE MODE: Balanced Side-by-Side Compact Photo Box Alignment */}
      {mode === 'idle' ? (
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 bg-white/70 p-3 rounded-xl border border-emerald-100">
          
          {/* Photo Box Preview Frame (1:1 Ratio, 130px) */}
          <div className="w-32 h-32 sm:w-36 sm:h-36 shrink-0 aspect-square relative rounded-2xl border-2 border-emerald-600 bg-slate-950 overflow-hidden shadow-sm flex items-center justify-center">
            {currentPhotoUrl ? (
              <div className="w-full h-full relative">
                <img 
                  src={currentPhotoUrl} 
                  alt="Player Passport Photo" 
                  className="w-full h-full object-cover rounded-xl" 
                />
                <span className="absolute bottom-1 right-1 bg-emerald-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-1">
                  <ShieldCheck size={10} /> Saved
                </span>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-slate-400 bg-slate-900/95">
                <User size={36} className="text-emerald-400 mb-1" />
                <span className="text-[11px] font-mono font-bold text-slate-200 block">No Photo</span>
                <span className="text-[9px] text-amber-400 font-bold block mt-0.5">Photo Required</span>
              </div>
            )}
          </div>

          {/* Photo Action Controls & Info */}
          <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left w-full">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-gray-900">
              {currentPhotoUrl ? (
                <span className="text-emerald-700 flex items-center gap-1 font-extrabold">
                  <Check size={14} className="text-emerald-600" /> Passport Photo Attached
                </span>
              ) : (
                <span className="text-amber-800 font-extrabold">
                  Upload or Take Passport Photo
                </span>
              )}
            </div>

            {/* Buttons Row */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => startCamera('environment')}
                className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
              >
                <Camera size={15} />
                <span>{currentPhotoUrl ? '🔄 Retake Photo' : '📷 Take Photo'}</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3.5 py-2 bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-50 rounded-xl text-xs font-bold shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                title="Select photo from device gallery"
              >
                <ImageIcon size={15} className="text-emerald-600" />
                <span>Gallery</span>
              </button>

              {currentPhotoUrl && (
                <button
                  type="button"
                  onClick={() => onPhotoCaptured('')}
                  className="px-2.5 py-2 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold cursor-pointer transition-all"
                  title="Remove Photo"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

        </div>
      ) : (
        /* CAMERA or PREVIEW MODE: Centered Live Stream Viewport */
        <div className="w-full max-w-xs sm:max-w-sm mx-auto flex flex-col items-center gap-3">
          
          <div className="w-full aspect-square relative rounded-2xl border-2 border-emerald-600 bg-slate-950 overflow-hidden shadow-md flex items-center justify-center">
            
            {/* LIVE CAMERA FEED */}
            {mode === 'camera' ? (
              <div className="w-full h-full relative flex items-center justify-center overflow-hidden rounded-2xl">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover max-w-full block rounded-2xl ${
                    cameraFacingMode === 'user' ? 'scale-x-[-1]' : ''
                  }`}
                  style={{
                    width: '100%',
                    maxWidth: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: '16px'
                  }}
                />
                
                {/* Oval Face Guide Frame Overlay */}
                <div className="absolute inset-4 border-2 border-dashed border-amber-400/90 rounded-[50%] pointer-events-none flex items-center justify-center shadow-xs">
                  <span className="text-[10px] font-mono font-bold text-amber-300 bg-black/65 backdrop-blur-xs px-2.5 py-1 rounded-full border border-amber-400/30">
                    Align Head Inside Guide
                  </span>
                </div>

                <span className="absolute bottom-2 left-2 bg-black/75 text-emerald-300 font-mono text-[9px] font-bold px-2 py-0.5 rounded-md border border-emerald-500/30">
                  {cameraFacingMode === 'environment' ? '📷 Rear Camera' : '🤳 Front Camera'}
                </span>
              </div>
            ) : (
              /* CAPTURED SNAPSHOT PREVIEW */
              <div className="w-full h-full relative rounded-2xl overflow-hidden">
                <img 
                  src={previewPhotoUrl} 
                  alt="Captured Passport Preview" 
                  className="w-full h-full object-cover rounded-2xl" 
                />
                <span className="absolute bottom-2 right-2 bg-amber-500 text-slate-950 font-mono text-[10px] font-black px-2 py-0.5 rounded shadow-sm">
                  1:1 PREVIEW
                </span>
              </div>
            )}

          </div>

          {/* CONTROLS BELOW CAMERA PREVIEW */}
          <div className="w-full space-y-2 text-center pt-1">
            {mode === 'camera' ? (
              <div className="space-y-2.5 animate-fade-in">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-sm font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
                >
                  <Camera size={18} />
                  <span>📸 Capture Passport Photo</span>
                </button>

                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={toggleCameraFacingMode}
                    className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-900 active:bg-slate-950 text-amber-300 rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 cursor-pointer border border-slate-700 transition-all"
                  >
                    <RotateCcw size={14} />
                    <span>{cameraFacingMode === 'environment' ? 'Front Camera' : 'Rear Camera'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCancel}
                    className="py-2 px-4 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl text-xs font-bold cursor-pointer transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 animate-fade-in">
                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={handleUsePhoto}
                    className="flex-1 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
                  >
                    <Check size={16} /> Save & Use Photo
                  </button>

                  <button
                    type="button"
                    onClick={handleRetake}
                    className="py-2.5 px-3.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <RefreshCw size={14} /> Retake
                  </button>

                  <button
                    type="button"
                    onClick={handleCancel}
                    className="py-2.5 px-3 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl text-xs font-bold cursor-pointer transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

