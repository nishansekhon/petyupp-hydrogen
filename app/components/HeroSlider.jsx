import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';

const slides = [
  {
    headline: "Happier Dogs Start Here",
    subtext: "Natural chews and treats matched to your dog's exact need",
    cta: "Find Your Fix",
    ctaLink: "/shop",
    bubbles: ["6 Problem Categories", "Vet Approved", "Free Ship $50+"],
    bg: "from-[#065F46] to-[#047857]",
    bgImage: "https://images.unsplash.com/photo-1611003228941-98852ba62227?w=1920&h=600&fit=crop",
  },
  {
    headline: "Built for Heavy Chewers",
    subtext: "Coffee wood, yak cheese, and buffalo horn — tested by the toughest dogs",
    cta: "Shop Heavy Chewers",
    ctaLink: "/shop",
    bubbles: ["6 Problem Categories", "Vet Approved", "Free Ship $50+"],
    bg: "from-[#1E3A5F] to-[#1e40af]",
    bgImage: "https://images.unsplash.com/photo-1600079766852-a8d6ebc77b0a?w=1920&h=600&fit=crop",
  },
  {
    headline: "Because They Deserve Better",
    subtext: "100% natural, single-ingredient treats. No preservatives, no rawhide, no compromise.",
    cta: "Shop Natural Treats",
    ctaLink: "/shop",
    bubbles: ["6 Problem Categories", "Vet Approved", "Free Ship $50+"],
    bg: "from-[#4C1D95] to-[#6D28D9]",
    bgImage: "https://images.unsplash.com/photo-1633846445033-d2fa7b1a9fca?w=1920&h=600&fit=crop",
  },
];

const HeroSlider = () => {
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const timerRef = useRef(null);

  const goTo = (idx) => {
    if (transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setCurrent(idx);
      setTransitioning(false);
    }, 300);
  };

  useEffect(() => {
    timerRef.current = setInterval(() => {
      goTo((current + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, [current]);

  const slide = slides[current];

  return (
    <div className="relative w-full overflow-hidden bg-[#065F46]" style={{minHeight: '380px'}}>
      {/* Slide background */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${slide.bg} transition-opacity duration-300 bg-cover bg-center`}
        style={{
          backgroundImage: `url(${slide.bgImage})`,
          backgroundBlend: 'overlay',
          opacity: transitioning ? 0 : 1
        }}
      />

      {/* Content */}
      <div
        className="relative max-w-7xl mx-auto px-6 py-16 md:py-20 flex flex-col items-center"
        style={{opacity: transitioning ? 0 : 1, transition: 'opacity 0.3s ease'}}
      >
        <div className="w-full text-center">
          <h1 className="text-2xl md:text-4xl lg:text-5xl font-black text-white leading-tight mb-4">
            {slide.headline}
          </h1>
          <p className="text-white/80 text-sm md:text-base mb-8 max-w-2xl mx-auto">
            {slide.subtext}
          </p>
          <Link
            to={slide.ctaLink}
            className="inline-block px-8 py-3 bg-[#06B6D4] text-white font-bold text-sm rounded-full hover:bg-[#0891B2] transition-colors shadow-lg"
          >
            {slide.cta}
          </Link>

          {/* Floating bubbles — below CTA */}
          <div className="flex flex-wrap gap-2 mt-6 justify-center">
            {slide.bubbles.map((b, i) => (
              <span
                key={i}
                className="px-3 py-1.5 bg-white/15 backdrop-blur-sm text-white text-xs font-semibold rounded-full border border-white/20"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Dot indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`transition-all rounded-full ${i === current ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/40'}`}
          />
        ))}
      </div>

      {/* Prev/Next arrows */}
      <button
        onClick={() => goTo((current - 1 + slides.length) % slides.length)}
        className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 12L6 8l4-4"/></svg>
      </button>
      <button
        onClick={() => goTo((current + 1) % slides.length)}
        className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 12l4-4-4-4"/></svg>
      </button>
    </div>
  );
};

export default HeroSlider;
