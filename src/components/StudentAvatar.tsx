import React from 'react';
import kssbFcLogo from '../assets/images/kssb_fc_official_logo.jpg';

interface StudentAvatarProps {
  photoUrl?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export default function StudentAvatar({ photoUrl, name, size = 'md', className = '' }: StudentAvatarProps) {
  const sizeClasses = {
    xs: 'w-6 h-6 text-[9px]',
    sm: 'w-8 h-8 text-[11px]',
    md: 'w-10 h-10 text-xs',
    lg: 'w-14 h-14 text-sm',
    xl: 'w-20 h-20 text-base'
  }[size];

  const logoSrc = kssbFcLogo || '/logo.jpg';
  const displaySrc = (photoUrl && photoUrl.trim() !== '') ? photoUrl : logoSrc;

  return (
    <img
      src={displaySrc}
      alt={name}
      className={`${sizeClasses} rounded-xl object-cover border-2 border-emerald-500/50 bg-slate-900 shadow-xs shrink-0 ${className}`}
      onError={(e) => {
        const img = e.currentTarget as HTMLImageElement;
        img.onerror = null;
        img.src = '/logo.jpg';
      }}
    />
  );
}
