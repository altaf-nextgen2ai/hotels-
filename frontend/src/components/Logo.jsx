import React from 'react';

const LOGO_SRC = '/logo.jpeg';

export default function Logo({ size = 'medium', showTagline = true }) {
  const sizeClasses = {
    small: 'h-9 sm:h-10 max-w-[140px]',
    medium: 'h-12 sm:h-14 max-w-[200px]',
    large: 'h-16 sm:h-20 md:h-24 max-w-[320px]',
  }[size] || 'h-12 sm:h-14 max-w-[200px]';

  return (
    <div className="flex items-center select-none cursor-pointer group">
      <img
        src={LOGO_SRC}
        alt="TRUMITRIP — Explore More. Experience Beyond."
        className={`${sizeClasses} w-auto object-contain object-left transition-transform duration-300 group-hover:scale-[1.02] ${showTagline ? '' : 'max-w-[160px]'}`}
        decoding="async"
      />
    </div>
  );
}
