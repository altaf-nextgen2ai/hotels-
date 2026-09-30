import React from 'react';

export default function Logo({ size = 'medium', light = false, showTagline = true }) {
  const sizeClasses = {
    small: { h: 'h-10', text: 'text-lg', subText: 'text-[9px]' },
    medium: { h: 'h-14', text: 'text-2xl', subText: 'text-[11px]' },
    large: { h: 'h-24', text: 'text-4xl', subText: 'text-sm' }
  }[size] || { h: 'h-14', text: 'text-2xl', subText: 'text-[11px]' };

  const textColor = light ? 'text-white' : 'text-slate-900';

  return (
    <div className="flex items-center gap-3 select-none cursor-pointer group">
      {/* SVG Emblem matching Image 2 */}
      <svg className={`${sizeClasses.h} w-auto transition-transform duration-300 group-hover:scale-105`} viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="tmtGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F3E5AB" />
            <stop offset="35%" stopColor="#D4AF37" />
            <stop offset="70%" stopColor="#AA771C" />
            <stop offset="100%" stopColor="#8B6508" />
          </linearGradient>
          <linearGradient id="tmtNavy" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="50%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#0A192F" />
          </linearGradient>
        </defs>

        {/* Outer Circle Ring */}
        <circle cx="120" cy="120" r="95" stroke="url(#tmtGold)" strokeWidth="6" fill="none" opacity="0.9" />

        {/* Top Flight Path Arc */}
        <path d="M 40 70 A 90 90 0 0 1 180 50" stroke="url(#tmtNavy)" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M 50 85 A 90 90 0 0 1 190 65" stroke="url(#tmtGold)" strokeWidth="3" fill="none" strokeLinecap="round" />

        {/* Airplane Flying Up Right */}
        <g transform="translate(195, 55) rotate(35)">
          <path d="M0,0 L-14,6 L-8,0 L-14,-6 Z" fill="url(#tmtGold)" />
          <path d="M-8,0 L-4,12 L-2,0 L-4,-12 Z" fill="url(#tmtGold)" />
        </g>

        {/* TMT Monogram Graphics */}
        {/* Left 'T' */}
        <path d="M 50 75 H 95 V 90 H 80 V 155 H 65 V 90 H 50 Z" fill="url(#tmtNavy)" />
        
        {/* Middle 'M' */}
        <path d="M 95 75 L 120 130 L 145 75 H 160 V 155 H 146 V 105 L 124 150 H 116 L 94 105 V 155 H 80 V 75 H 95 Z" fill="url(#tmtGold)" />
        
        {/* Right 'T' */}
        <path d="M 145 75 H 190 V 90 H 175 V 155 H 160 V 90 H 145 Z" fill="url(#tmtNavy)" />

        {/* Sun Horizon */}
        <circle cx="120" cy="138" r="22" fill="url(#tmtGold)" opacity="0.85" />

        {/* Mountain Silhouette */}
        <path d="M 60 155 L 90 120 L 110 142 L 135 110 L 160 145 L 180 155 Z" fill="url(#tmtNavy)" />
        {/* Snow Caps */}
        <path d="M 90 120 L 98 132 L 84 130 Z" fill="#FFFFFF" opacity="0.9" />
        <path d="M 135 110 L 145 125 L 127 122 Z" fill="#FFFFFF" opacity="0.9" />

        {/* Birds */}
        <path d="M 150 115 Q 154 112 158 115 Q 162 112 166 115" stroke="url(#tmtNavy)" strokeWidth="2" fill="none" />
        <path d="M 160 125 Q 163 123 166 125 Q 169 123 172 125" stroke="url(#tmtNavy)" strokeWidth="1.5" fill="none" />

        {/* Winding River Road */}
        <path d="M 120 155 Q 110 170 130 185 Q 115 195 90 205 H 150 Q 125 195 140 185 Q 130 170 120 155 Z" fill="url(#tmtNavy)" />
        <path d="M 120 155 Q 110 170 130 185 Q 115 195 90 205" stroke="url(#tmtGold)" strokeWidth="2" fill="none" />
      </svg>

      {/* Typography */}
      <div className="flex flex-col">
        <div className={`font-black tracking-wider ${sizeClasses.text} flex items-center leading-none`}>
          <span className={light ? "text-white" : "text-[#0F172A]"}>TRUMI</span>
          <span className="bg-gradient-to-r from-[#D4AF37] via-[#F3E5AB] to-[#B8860B] bg-clip-text text-transparent ml-0.5">TRIP</span>
        </div>
        {showTagline && (
          <div className={`${sizeClasses.subText} font-semibold tracking-widest uppercase mt-0.5 ${light ? 'text-slate-300' : 'text-slate-600'} flex items-center gap-1`}>
            <span className="text-[#D4AF37] font-bold">—</span>
            <span>EXPLORE MORE. EXPERIENCE BEYOND.</span>
            <span className="text-[#D4AF37] font-bold">—</span>
          </div>
        )}
      </div>
    </div>
  );
}
