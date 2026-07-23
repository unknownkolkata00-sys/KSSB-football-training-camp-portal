import React, { useState, useRef, useEffect } from 'react';
import { Camera, RefreshCw, Check, X, RotateCcw, Upload, Image as ImageIcon, AlertTriangle, ShieldCheck } from 'lucide-react';

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

  // Auto scroll into view when camera or preview mode activates so mobile viewport centers the camera box
  useEffect(() => {
    if (mode === 'camera' || mode === 'preview') {
      setTimeout(() => {
        containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 150);
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
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: targetFacingMode },
            width: { ideal: 720 },
            height: { ideal: 960 }
          }
        });
      } catch (firstErr) {
        console.warn('Ideal facing mode rejected, falling back to default camera:', firstErr);
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
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
      setCameraError('Camera access unavailable or blocked. Please grant camera permission in your browser settings or select a photo from gallery.');
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

    if (ctx && video.videoWidth && video.videoHeight) {
      const vWidth = video.videoWidth;
      const vHeight = video.videoHeight;
      const minDim = Math.min(vWidth, vHeight);

      const sx = (vWidth - minDim) / 2;
      const sy = (vHeight - minDim) / 2;

      // Flip horizontally for front camera so user doesn't see mirrored final photo
      if (cameraFacingMode === 'user') {
        ctx.translate(passportSize, 0);
        ctx.scale(-1, 1);
      }

      ctx.drawImage(video, sx, sy, minDim, minDim, 0, 0, passportSize, passportSize);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
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
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          
          stopCamera();
          setPreviewPhotoUrl(dataUrl);
          setMode('preview');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be selected again if needed
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
    <div ref={containerRef} className={`p-4 rounded-2xl border transition-all space-y-3 ${
      mode === 'camera' || mode === 'preview' 
        ? 'bg-emerald-100/90 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg' 
        : 'bg-emerald-50/70 border-emerald-200/80'
    }`}>
      {/* Header Label */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <label className="text-xs font-mono font-bold text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
          <Camera size={16} className="text-emerald-700" />
          <span>{label}</span>
        </label>
        <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 border border-amber-200/80 px-2 py-0.5 rounded">
          1:1 Passport Format • Live Camera / Gallery
        </span>
      </div>

      {/* Camera Permission or Error Warning Box */}
      {cameraError && (
        <div className="bg-amber-50 border border-amber-300 p-3 rounded-xl text-xs text-amber-900 space-y-2">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertTriangle size={16} className="text-amber-600 shrink-0" />
            <span>Camera Access Help</span>
          </div>
          <p className="text-[11px] leading-relaxed text-amber-800">
            {cameraError}
          </p>
          <div className="pt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Upload size={14} /> Upload From Phone Gallery
            </button>
            <button
              type="button"
              onClick={() => startCamera('environment')}
              className="px-3 py-1.5 border border-amber-400 text-amber-950 hover:bg-amber-100 rounded-lg text-xs font-bold cursor-pointer"
            >
              Try Rear Camera Again
            </button>
          </div>
        </div>
      )}

      {/* Hidden File Input for Gallery Fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleGalleryFileSelect}
        className="hidden"
      />

      {/* Main Interactive Box */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        
        {/* Passport Photo Frame (1:1 Aspect Ratio) */}
        <div className="w-40 h-40 sm:w-44 sm:h-44 mx-auto sm:mx-0 rounded-2xl border-2 border-emerald-600 bg-slate-950 overflow-hidden flex items-center justify-center relative shadow-md shrink-0">
          
          {/* Mode 1: PREVIEW (Show Snapshot with Crop) */}
          {mode === 'preview' && previewPhotoUrl ? (
            <div className="w-full h-full relative">
              <img src={previewPhotoUrl} alt="Captured Passport Preview" className="w-full h-full object-cover" />
              <span className="absolute bottom-1 right-1 bg-amber-500 text-slate-950 font-mono text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm">
                PREVIEW
              </span>
            </div>
          ) : mode === 'camera' ? (
            /* Mode 2: LIVE CAMERA FEED with Passport Oval Guide Frame Overlay */
            <div className="w-full h-full relative flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className={`w-full h-full object-cover ${cameraFacingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />
              {/* Centered Passport Oval Alignment Guide Overlay */}
              <div className="absolute inset-2 border-2 border-dashed border-amber-400/90 rounded-full opacity-80 pointer-events-none flex items-center justify-center shadow-xs">
                <span className="text-[8px] font-mono font-bold text-amber-300 bg-black/60 px-1.5 py-0.5 rounded">
                  Align Face
                </span>
              </div>
              <span className="absolute bottom-1 left-1 bg-black/70 text-emerald-300 font-mono text-[8px] font-bold px-1.5 py-0.5 rounded">
                {cameraFacingMode === 'environment' ? '📷 Rear Cam' : '🤳 Front Cam'}
              </span>
            </div>
          ) : (
            /* Mode 3: IDLE (Display current saved photo or placeholder) */
            <div className="w-full h-full relative">
              {currentPhotoUrl ? (
                <div className="w-full h-full relative">
                  <img src={currentPhotoUrl} alt="Saved Player Photo" className="w-full h-full object-cover" />
                  <span className="absolute bottom-1 right-1 bg-emerald-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
                    Saved
                  </span>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-slate-400">
                  <Camera size={36} className="text-emerald-400 opacity-90 mb-1" />
                  <span className="text-[10px] font-mono block text-slate-200 font-bold">No Photo</span>
                  <span className="text-[8px] text-slate-400 block">Passport 1:1</span>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Controls Column */}
        <div className="space-y-2 flex-1 w-full text-left">
          
          {/* Controls for PREVIEW MODE (3 Required Buttons: Use Photo, Retake, Cancel) */}
          {mode === 'preview' ? (
            <div className="space-y-2.5 animate-fade-in">
              <div className="text-xs text-emerald-900 font-bold flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                <span>Passport Photo Snapshot Captured!</span>
              </div>
              <p className="text-[11px] text-gray-600">
                Please verify face alignment in 1:1 passport preview frame before saving.
              </p>
              
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {/* BUTTON 1: Use Photo */}
                <button
                  type="button"
                  onClick={handleUsePhoto}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Check size={16} /> Use Photo
                </button>

                {/* BUTTON 2: Retake */}
                <button
                  type="button"
                  onClick={handleRetake}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <RefreshCw size={14} /> Retake
                </button>

                {/* BUTTON 3: Cancel */}
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-3 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <X size={14} /> Cancel
                </button>
              </div>
            </div>
          ) : mode === 'camera' ? (
            /* Controls for LIVE CAMERA MODE */
            <div className="space-y-2 animate-fade-in">
              <p className="text-xs text-emerald-900 font-medium leading-snug">
                Center player's head inside the guide frame. Switch camera anytime below.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {/* Capture Button */}
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Camera size={16} /> 📸 Capture Photo
                </button>

                {/* Switch Rear / Front Camera */}
                <button
                  type="button"
                  onClick={toggleCameraFacingMode}
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-900 text-amber-300 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer border border-slate-700 transition-all"
                  title="Switch Front / Rear Camera"
                >
                  <RotateCcw size={14} />
                  <span>{cameraFacingMode === 'environment' ? 'Switch to Front' : 'Switch to Rear'}</span>
                </button>

                {/* Cancel Camera */}
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-3 py-2.5 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-xl text-xs font-bold cursor-pointer transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* Controls for IDLE MODE (Click Passport Photo / Change Photo / Gallery) */
            <div className="space-y-2">
              <p className="text-xs text-gray-600 leading-snug">
                {currentPhotoUrl 
                  ? "Passport photo attached. You can change photo using camera or phone gallery." 
                  : "Click below to request camera permission and capture live passport photo, or upload from phone gallery."}
              </p>
              
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {/* Click Passport Photo / Change Photo Button */}
                <button
                  type="button"
                  onClick={() => startCamera('environment')}
                  className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer transition-all"
                >
                  <Camera size={16} /> 
                  <span>{currentPhotoUrl ? '🔄 Change Photo' : '📷 Click Passport Photo'}</span>
                </button>

                {/* Gallery Upload Fallback */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2.5 bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-50 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
                  title="Select photo from device gallery"
                >
                  <ImageIcon size={15} className="text-emerald-600" />
                  <span>Gallery Upload</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
