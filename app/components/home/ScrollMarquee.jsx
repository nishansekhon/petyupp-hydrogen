import React from 'react';

const text = 'HAPPIER DOGS START HERE · NATURAL CHEWS · DENTAL HEALTH · SEPARATION ANXIETY · DESTRUCTIVE CHEWING · JOINT SUPPORT · ';

const ScrollMarquee = () => (
  <div className="overflow-hidden bg-[#0F6E56] py-3" aria-hidden="true">
    <style>{`
      @keyframes marquee {
        0% { transform: translateX(0); }
        100% { transform: translateX(-50%); }
      }
      .marquee-track {
        animation: marquee 20s linear infinite;
        will-change: transform;
      }
      .marquee-track:hover {
        animation-play-state: paused;
      }
    `}</style>
    <div className="marquee-track flex whitespace-nowrap">
      <span className="text-white font-bold text-sm uppercase tracking-widest px-4">{text}{text}</span>
    </div>
  </div>
);

export default ScrollMarquee;
