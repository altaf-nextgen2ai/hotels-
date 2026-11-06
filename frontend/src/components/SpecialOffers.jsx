import React from 'react';
import { Sparkles } from 'lucide-react';
import { FESTIVAL_OFFERS_COPY } from '../data/offersContent';

export default function SpecialOffers() {
  const copy = FESTIVAL_OFFERS_COPY;

  return (
    <div className="bg-amber-50/50 py-10 border-y border-amber-100">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-amber-600" />
          <h2 className="text-xl font-bold text-slate-900">{copy.heading}</h2>
        </div>
        <p className="text-sm text-slate-600 font-medium mb-6 max-w-3xl">{copy.intro}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {copy.seasons.map((season) => (
            <div
              key={season.id}
              className="bg-white rounded-2xl p-5 border border-amber-200 shadow-sm"
            >
              <p className="text-[10px] font-black uppercase tracking-wider text-amber-700 mb-2">{season.when}</p>
              <h3 className="font-extrabold text-slate-900 text-base mb-2">{season.name}</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">{season.text}</p>
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs text-slate-500 font-medium">{copy.note}</p>
      </div>
    </div>
  );
}
