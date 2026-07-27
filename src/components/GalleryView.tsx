import React, { useState, useEffect } from 'react';
import { GalleryImage } from '../types';
import { Image as ImageIcon, Plus, X, Tag, Calendar, User, ShieldAlert, Eye, Filter, Trash2, Camera, Upload, Lock, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

interface GalleryViewProps {
  galleryImages: GalleryImage[];
  onAddImage: (image: Omit<GalleryImage, 'id' | 'date'>) => void;
  onDeleteImage?: (id: string) => void;
  role: 'admin' | 'coach' | 'student';
}

// Helper function to compress uploaded photos for lightweight Firestore & local storage
const compressPhotoFile = (file: File, maxDimension = 1000, initialQuality = 0.7): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        let quality = initialQuality;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        // Keep string size safely below 500KB for Firestore document limits
        while (dataUrl.length > 500000 && quality > 0.3) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }
        resolve(dataUrl);
      };
      img.onerror = () => resolve(event.target?.result as string);
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function GalleryView({
  galleryImages,
  onAddImage,
  onDeleteImage,
  role
}: GalleryViewProps) {
  const isAdmin = role === 'admin';
  const canAdd = isAdmin;
  const canDelete = isAdmin;

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<GalleryImage | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<GalleryImage['category']>('Matches');
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [previewError, setPreviewError] = useState(false);

  const categories: Array<GalleryImage['category'] | 'All'> = ['All', 'Matches', 'Training', 'Events', 'Celebrations', 'Awards'];

  const filteredImages = selectedCategory === 'All'
    ? galleryImages
    : galleryImages.filter(img => img.category === selectedCategory);

  // Keyboard navigation for Full Screen Lightbox
  useEffect(() => {
    if (!lightboxImage) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxImage(null);
      } else if (e.key === 'ArrowLeft') {
        const idx = filteredImages.findIndex(i => i.id === lightboxImage.id);
        if (idx > 0) {
          setLightboxImage(filteredImages[idx - 1]);
        }
      } else if (e.key === 'ArrowRight') {
        const idx = filteredImages.findIndex(i => i.id === lightboxImage.id);
        if (idx >= 0 && idx < filteredImages.length - 1) {
          setLightboxImage(filteredImages[idx + 1]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImage, filteredImages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim()) return;

    const uploaderLabel = role === 'admin' ? 'Admin' : role === 'coach' ? 'Coach' : 'Student';

    onAddImage({
      title: title.trim(),
      category,
      imageUrl: imageUrl.trim(),
      uploadedBy: uploaderLabel,
      caption: caption.trim()
    });

    // Reset Form
    setTitle('');
    setImageUrl('');
    setCaption('');
    setIsAddModalOpen(false);
  };

  // Sample default images for inspiration if empty
  const defaultSampleUrls = [
    { label: 'Match Action', url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Training Drills', url: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Celebration', url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80' },
    { label: 'Youth Academy', url: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=1200&q=80' }
  ];

  return (
    <div className="space-y-6 animate-fade-in" id="gallery-view-root">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-3xl text-white shadow-lg border border-emerald-900/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono font-bold text-[10px] uppercase rounded border border-emerald-500/30">
              KSSB FC Photo Vault
            </span>
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 font-mono text-[10px] font-bold uppercase rounded">
              Uploads Syncing Live ({role.toUpperCase()})
            </span>
          </div>
          <h2 className="text-2xl font-black font-sans tracking-tight text-white flex items-center gap-2">
            <Camera className="text-emerald-400" size={24} />
            Club Gallery & Match Album
          </h2>
          <p className="text-xs text-slate-300">
            High-resolution snapshots of tournament matches, daily training drills, and academy award ceremonies.
          </p>
        </div>

        {canAdd ? (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black flex items-center gap-2 shadow-md transition-all cursor-pointer shrink-0"
            id="admin-add-gallery-btn"
          >
            <Plus size={16} />
            Upload New Photo
          </button>
        ) : (
          <div className="px-3.5 py-2 bg-slate-800/90 text-slate-300 rounded-xl text-xs font-mono font-bold flex items-center gap-2 border border-slate-700/80 shrink-0 shadow-inner" id="student-gallery-vault-notice">
            <Lock size={14} className="text-amber-400" />
            <span>Admin Rights Only • Uploads Restricted</span>
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none" id="gallery-category-tabs">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === cat
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200'
            }`}
          >
            {cat === 'All' ? '📸 All Photos' : cat}
          </button>
        ))}
      </div>

      {/* Gallery Photo Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" id="gallery-photos-grid">
        {filteredImages.length > 0 ? (
          filteredImages.map(img => (
            <div
              key={img.id}
              onClick={() => setLightboxImage(img)}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all overflow-hidden flex flex-col group cursor-pointer"
            >
              <div className="relative aspect-video overflow-hidden bg-slate-900">
                <img
                  src={img.imageUrl}
                  alt={img.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    const target = e.currentTarget as HTMLImageElement;
                    target.onerror = null;
                    target.src = '/logo.jpg';
                  }}
                />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 bg-slate-900/80 backdrop-blur-md text-amber-300 text-[10px] font-mono font-bold uppercase rounded-lg border border-amber-400/30">
                    {img.category}
                  </span>
                </div>

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxImage(img);
                    }}
                    className="px-3 py-1.5 bg-white text-gray-900 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md hover:bg-gray-100 cursor-pointer"
                  >
                    <Eye size={14} /> Full Screen
                  </button>
                  {canDelete && onDeleteImage && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteImage(img.id);
                      }}
                      className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-md hover:bg-rose-700 cursor-pointer"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-1">{img.title}</h3>
                  {img.caption && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{img.caption}</p>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 pt-2 border-t border-gray-100 mt-2">
                  <span className="flex items-center gap-1 text-gray-500 font-semibold">
                    <Calendar size={12} className="text-emerald-600" />
                    {img.date}
                  </span>
                  <span className="text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                    By {img.uploadedBy}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-gray-200 space-y-3">
            <ImageIcon className="mx-auto text-gray-300" size={40} />
            <h3 className="text-sm font-bold text-gray-700">No photos in category "{selectedCategory}"</h3>
            <p className="text-xs text-gray-400">
              {isAdmin ? 'Click "Upload New Photo" above to add club pictures.' : 'Photos will appear here once added by the Admin.'}
            </p>
          </div>
        )}
      </div>

      {/* Admin Add Image Modal */}
      {isAddModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" id="add-gallery-modal">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative border border-emerald-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase tracking-widest block">Admin Privileges</span>
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Camera size={20} className="text-emerald-700" />
                  Upload Photo to Club Vault
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-gray-700 uppercase">Photo Title *</label>
                <input
                  type="text"
                  placeholder="e.g. U-16 Final Match Winning Trophy Presentation"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-gray-700 uppercase">Category *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as GalleryImage['category'])}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold bg-white"
                  >
                    <option value="Matches">Matches</option>
                    <option value="Training">Training</option>
                    <option value="Events">Events</option>
                    <option value="Celebrations">Celebrations</option>
                    <option value="Awards">Awards</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-gray-700 uppercase">Quick Presets</label>
                  <select
                    onChange={(e) => {
                      if (e.target.value) setImageUrl(e.target.value);
                    }}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs text-gray-600 bg-gray-50"
                  >
                    <option value="">Select Sample URL...</option>
                    {defaultSampleUrls.map(s => (
                      <option key={s.url} value={s.url}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-gray-700 uppercase">Attach Photo File or Provide URL *</label>
                <div className="flex flex-col sm:flex-row gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Paste image URL (e.g. https://...)"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none"
                    required
                  />
                  <label className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shrink-0 border border-slate-700">
                    <Upload size={14} className="text-emerald-400" />
                    <span className="whitespace-nowrap">Attach File</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const compressedDataUrl = await compressPhotoFile(file);
                            setImageUrl(compressedDataUrl);
                            if (!title) {
                              const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
                              setTitle(nameWithoutExt);
                            }
                          } catch (err) {
                            console.error('Failed to compress photo:', err);
                          }
                        }
                      }}
                    />
                  </label>
                </div>
              </div>

              {imageUrl && (
                <div className="p-2 border border-gray-200 rounded-xl bg-gray-50 space-y-1">
                  <span className="text-[10px] font-mono text-gray-400 block uppercase">Image Preview</span>
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-36 object-cover rounded-lg border border-gray-200"
                    onError={() => setPreviewError(true)}
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-gray-700 uppercase">Caption / Event Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional brief description of match date, opponent, or players featured..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none"
                />
              </div>

              <div className="flex gap-3 justify-end pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Plus size={15} /> Publish to Gallery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Immersive Full Screen Photo Viewer */}
      {lightboxImage && (() => {
        const currentIndex = filteredImages.findIndex(i => i.id === lightboxImage.id);
        const hasPrev = currentIndex > 0;
        const hasNext = currentIndex >= 0 && currentIndex < filteredImages.length - 1;

        return (
          <div
            className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex flex-col justify-between text-white animate-fade-in select-none"
            id="gallery-fullscreen-modal"
          >
            {/* Top Bar Navigation Controls */}
            <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-700 transition-all cursor-pointer shadow-md"
                id="fullscreen-back-btn"
              >
                <ArrowLeft size={16} /> Back to Gallery
              </button>

              <div className="text-center hidden sm:block">
                <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold uppercase rounded border border-emerald-500/30">
                  {lightboxImage.category}
                </span>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  Photo {currentIndex >= 0 ? currentIndex + 1 : 1} of {filteredImages.length}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="px-4 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-rose-800/80 transition-all cursor-pointer shadow-md"
                id="fullscreen-close-btn"
              >
                <X size={16} /> Close Screen
              </button>
            </div>

            {/* Main Stage Image Canvas */}
            <div className="flex-1 relative flex items-center justify-center p-2 sm:p-6 min-h-0 overflow-hidden bg-black">
              {/* Previous Photo Button */}
              {hasPrev && (
                <button
                  type="button"
                  onClick={() => setLightboxImage(filteredImages[currentIndex - 1])}
                  className="absolute left-3 z-10 p-3 bg-slate-900/80 hover:bg-emerald-600 text-white rounded-full border border-slate-700 transition-all cursor-pointer shadow-lg"
                  title="Previous Photo (Left Arrow)"
                  id="fullscreen-prev-btn"
                >
                  <ChevronLeft size={22} />
                </button>
              )}

              {/* Fullscreen Photo */}
              <img
                src={lightboxImage.imageUrl}
                alt={lightboxImage.title}
                referrerPolicy="no-referrer"
                className="max-h-[78vh] w-auto max-w-full object-contain rounded-lg shadow-2xl transition-all"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.onerror = null;
                  target.src = '/logo.jpg';
                }}
              />

              {/* Next Photo Button */}
              {hasNext && (
                <button
                  type="button"
                  onClick={() => setLightboxImage(filteredImages[currentIndex + 1])}
                  className="absolute right-3 z-10 p-3 bg-slate-900/80 hover:bg-emerald-600 text-white rounded-full border border-slate-700 transition-all cursor-pointer shadow-lg"
                  title="Next Photo (Right Arrow)"
                  id="fullscreen-next-btn"
                >
                  <ChevronRight size={22} />
                </button>
              )}
            </div>

            {/* Bottom Metadata & Action Bar */}
            <div className="p-4 sm:p-6 bg-slate-900/95 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{lightboxImage.title}</h3>
                  <span className="sm:hidden text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                    {lightboxImage.category}
                  </span>
                </div>
                {lightboxImage.caption && (
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">{lightboxImage.caption}</p>
                )}
                <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 pt-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} className="text-emerald-400" /> {lightboxImage.date}
                  </span>
                  <span>•</span>
                  <span>Uploaded by {lightboxImage.uploadedBy}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer shrink-0"
                id="fullscreen-bottom-back-btn"
              >
                <ArrowLeft size={16} /> Back to Gallery
              </button>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
