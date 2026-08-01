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

  // Zoom & Pan state for 1:1 Passport Cropping
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [rawImageSrc, setRawImageSrc] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Auto scroll into view when camera or preview mode activates
  useEffect(() => {
    if (mode === 'camera' || mode === 'preview') {
      setTimeout(() => {
        containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [mode]);

  // Stop camera on unmount or mode exit
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Update canvas preview when zoom or pan changes in preview mode
  useEffect(() => {
    if (mode === 'preview' && rawImageSrc && previewCanvasRef.current) {
      const canvas = previewCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        const passportSize = 400;
        canvas.width = passportSize;
        canvas.height = passportSize;

        ctx.clearRect(0, 0, passportSize, passportSize);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, passportSize, passportSize);

        const minDim = Math.min(img.width, img.height);
        // Base crop coordinates before zoom/pan
        const baseSx = (img.width - minDim) / 2;
        const baseSy = (img.height - minDim) / 2;

        // Effective source dimension based on zoomLevel (smaller src dimension = zoom in)
        const srcDim = minDim / zoomLevel;

        // Apply pan offset constrained to valid bounds
        const maxOffset = (minDim - srcDim) / 2;
        const clampedPanX = Math.max(-maxOffset, Math.min(maxOffset, (panX / 100) * maxOffset));
        const clampedPanY = Math.max(-maxOffset, Math.min(maxOffset, (panY / 100) * maxOffset));

        const sx = baseSx + (minDim - srcDim) / 2 + clampedPanX;
        const sy = baseSy + (minDim - srcDim) / 2 + clampedPanY;

        ctx.drawImage(img, sx, sy, srcDim, srcDim, 0, 0, passportSize, passportSize);
        
        // Update data url result
        const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setPreviewPhotoUrl(croppedDataUrl);
      };
      img.src = rawImageSrc;
    }
  }, [mode, rawImageSrc, zoomLevel, panX, panY]);

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

      const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      stopCamera();
      setRawImageSrc(dataUrl);
      setPreviewPhotoUrl(dataUrl);
      setZoomLevel(1.0);
      setPanX(0);
      setPanY(0);
      setMode('preview');
    }
  };

  const handleGalleryFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      setRawImageSrc(src);
      setZoomLevel(1.0);
      setPanX(0);
      setPanY(0);
      stopCamera();
      setMode('preview');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleExistingPhotoClick = () => {
    if (currentPhotoUrl) {
      setRawImageSrc(currentPhotoUrl);
      setZoomLevel(1.0);
      setPanX(0);
      setPanY(0);
      setMode('preview');
    } else {
      startCamera('environment');
    }
  };

  const handleUsePhoto = () => {
    onPhotoCaptured(previewPhotoUrl || rawImageSrc);
    setMode('idle');
  };

  const handleRetake = () => {
    setPreviewPhotoUrl('');
    setRawImageSrc('');
    startCamera(cameraFacingMode);
  };

  const handleCancel = () => {
    stopCamera();
    setPreviewPhotoUrl('');
    setRawImageSrc('');
    setMode('idle');
  };

  return (
    <div ref={containerRef} className={`scroll-mt-16 my-3 sm:my-4 p-4 sm:p-5 rounded-2xl border shadow-xs transition-all w-full ${
      mode === 'camera' || mode === 'preview' 
        ? 'bg-emerald-100/90 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg space-y-3.5' 
        : 'bg-emerald-50/90 border-emerald-300'
    }`}>
      {/* Hidden Working Canvas for 1:1 Passport Crop Processing */}
      <canvas ref={previewCanvasRef} className="hidden" width={400} height={400} />

      {/* Header Label Row */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <label className="text-xs font-mono font-bold text-emerald-950 uppercase tracking-wide flex items-center gap-1.5">
          <Camera size={16} className="text-emerald-700 shrink-0" />
          <span>{label}</span>
        </label>
        <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100 border border-amber-200/80 px-2 py-0.5 rounded shrink-0">
          1:1 Passport Size
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
          
          {/* Photo Box Preview Frame (1:1 Ratio, 130px) - Interactive On Click */}
          <div 
            onClick={handleExistingPhotoClick}
            className="w-32 h-32 sm:w-36 sm:h-36 shrink-0 aspect-square relative rounded-2xl border-2 border-emerald-600 bg-slate-950 overflow-hidden shadow-sm flex items-center justify-center cursor-pointer group hover:ring-2 hover:ring-emerald-500/50 transition-all"
            title={currentPhotoUrl ? "Click to crop/edit passport photo" : "Click to take passport photo"}
          >
            {currentPhotoUrl ? (
              <div className="w-full h-full relative">
                <img 
                  src={currentPhotoUrl} 
                  alt="Player Passport Photo" 
                  className="w-full h-full object-cover rounded-xl" 
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-bold gap-1">
                  <Camera size={18} />
                  <span>Crop / Change</span>
                </div>
                <span className="absolute bottom-1 right-1 bg-emerald-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-1">
                  <ShieldCheck size={10} /> Saved
                </span>
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-slate-400 bg-slate-900/95 group-hover:bg-slate-900 transition-colors">
                <User size={36} className="text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-mono font-bold text-slate-200 block">Click to Add Photo</span>
                <span className="text-[9px] text-amber-400 font-bold block mt-0.5">1:1 Passport Size</span>
              </div>
            )}
          </div>

          {/* Photo Action Controls & Info */}
          <div className="flex-1 min-w-0 space-y-2 text-center sm:text-left w-full">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-gray-900">
              {currentPhotoUrl ? (
                <span className="text-emerald-700 flex items-center gap-1 font-extrabold">
                  <Check size={14} className="text-emerald-600" /> Passport Photo Attached (1:1 Cropped)
                </span>
              ) : (
                <span className="text-amber-800 font-extrabold">
                  Upload or Take Passport Photo
                </span>
              )}
            </div>

            <p className="text-[11px] text-gray-600 leading-snug">
              Standard 1:1 passport crop required for the Official Player ID Card. Click the photo box or buttons below to capture/crop.
            </p>

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
                <span>Gallery Upload</span>
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
        /* CAMERA or PREVIEW / PASSPORT CROPPER MODE */
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
                    Align Head Inside Oval
                  </span>
                </div>

                <span className="absolute bottom-2 left-2 bg-black/75 text-emerald-300 font-mono text-[9px] font-bold px-2 py-0.5 rounded-md border border-emerald-500/30">
                  {cameraFacingMode === 'environment' ? '📷 Rear Camera' : '🤳 Front Camera'}
                </span>
              </div>
            ) : (
              /* PASSPORT CROP PREVIEW MODE */
              <div className="w-full h-full relative rounded-2xl overflow-hidden flex items-center justify-center">
                <img 
                  src={previewPhotoUrl || rawImageSrc} 
                  alt="Passport Crop Preview" 
                  className="w-full h-full object-cover rounded-2xl" 
                />
                {/* Oval Passport Guide Overlay */}
                <div className="absolute inset-4 border-2 border-dashed border-amber-400/80 rounded-[50%] pointer-events-none flex items-center justify-center">
                  <span className="text-[9px] font-mono font-bold text-amber-200 bg-black/70 px-2 py-0.5 rounded-full border border-amber-400/30">
                    Passport Crop Frame
                  </span>
                </div>
                <span className="absolute bottom-2 right-2 bg-amber-500 text-slate-950 font-mono text-[10px] font-black px-2 py-0.5 rounded shadow-sm">
                  1:1 PASSPORT CROP
                </span>
              </div>
            )}

          </div>

          {/* PASSPORT CROP CONTROLS & ZOOM SLIDER (PREVIEW MODE) */}
          {mode === 'preview' && (
            <div className="w-full bg-white/80 p-3 rounded-xl border border-emerald-200 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-gray-800 text-[11px]">
                <span>🔍 Passport Face Zoom:</span>
                <span className="font-mono text-emerald-700">{zoomLevel.toFixed(1)}x</span>
              </div>
              <input 
                type="range" 
                min="1.0" 
                max="2.2" 
                step="0.1" 
                value={zoomLevel}
                onChange={(e) => setZoomLevel(parseFloat(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-gray-200 rounded-lg"
              />
              <div className="flex justify-between text-[9px] font-mono text-gray-500">
                <span>Standard (1.0x)</span>
                <span>Zoom Head (2.2x)</span>
              </div>
            </div>
          )}

          {/* CONTROLS BELOW PREVIEW */}
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
                    <Check size={16} /> Save 1:1 Passport Photo
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

