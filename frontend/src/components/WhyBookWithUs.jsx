import React from 'react';
import { Tag, ShieldCheck, Headset, CalendarCheck, Star, Building, Users, Globe, Award } from 'lucide-react';

export default function WhyBookWithUs() {
  const features = [
    {
      icon: Tag,
      bgColor: 'bg-blue-100 text-blue-600',
      title: 'Best Price Guarantee',
      desc: 'Get the best hotel deals at lowest prices'
    },
    {
      icon: ShieldCheck,
      bgColor: 'bg-emerald-100 text-emerald-600',
      title: 'Secure Booking',
      desc: 'Your data is safe with 256-bit SSL encryption'
    },
    {
      icon: Headset,
      bgColor: 'bg-indigo-100 text-indigo-600',
      title: '24/7 Support',
      desc: 'We are here to help you anytime, anywhere'
    },
    {
      icon: CalendarCheck,
      bgColor: 'bg-amber-100 text-amber-600',
      title: 'Free Cancellation',
      desc: 'Most bookings offer free cancellation options'
    },
    {
      icon: Star,
      bgColor: 'bg-rose-100 text-rose-600',
      title: 'Trusted By Millions',
      desc: 'Join millions of happy travelers who book with us'
    }
  ];

  const stats = [
    { icon: Building, number: '100,000+', label: 'Hotels Worldwide' },
    { icon: Users, number: '10M+', label: 'Happy Customers' },
    { icon: Globe, number: '200+', label: 'Countries Covered' },
    { icon: Award, number: 'Exclusive', label: 'Member Deals' },
  ];

  return (
    <section className="py-14 bg-slate-50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            Why Book With Us?
          </h2>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="h-0.5 w-12 bg-amber-400"></span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span className="h-0.5 w-12 bg-amber-400"></span>
          </div>
        </div>

        {/* 5 Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          {features.map((f, index) => {
            const IconComponent = f.icon;
            return (
              <div 
                key={index} 
                className="bg-white rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition-shadow border border-slate-100 flex flex-col items-center group"
              >
                <div className={`w-14 h-14 rounded-full ${f.bgColor} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                  <IconComponent className="w-7 h-7" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm mb-1.5">{f.title}</h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Statistics Bar matching reference image */}
        <div className="mt-10 bg-white rounded-2xl shadow-sm border border-slate-200/80 p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-200">
            {stats.map((s, idx) => {
              const StatIcon = s.icon;
              return (
                <div key={idx} className={`flex items-center justify-center gap-4 ${idx !== 0 ? 'pt-4 md:pt-0' : ''}`}>
                  <StatIcon className="w-8 h-8 text-[#0F172A]" />
                  <div className="text-left">
                    <p className="text-lg md:text-xl font-extrabold text-slate-900 leading-none">{s.number}</p>
                    <p className="text-xs text-slate-500 font-medium mt-1">{s.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
