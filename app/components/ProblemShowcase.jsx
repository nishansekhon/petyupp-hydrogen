import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';

const PROBLEMS = [
  {
    slug: 'separation-anxiety',
    title: 'Separation Anxiety',
    subtitle: 'Comfort chews to keep them busy',
    heroImage:
      'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1000&h=1200&fit=crop&crop=faces',
    collectionHandle: 'separation-anxiety',
  },
  {
    slug: 'dental-health',
    title: 'Dental Health',
    subtitle: 'Natural chews that clean teeth',
    heroImage:
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1000&h=1200&fit=crop',
    collectionHandle: 'dental-health',
  },
  {
    slug: 'destructive-chewing',
    title: 'Destructive Chewing',
    subtitle: 'Tough chews that last hours',
    heroImage:
      'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=1000&h=1200&fit=crop',
    collectionHandle: 'destructive-chewing',
  },
  {
    slug: 'joint-pain',
    title: 'Joint Pain',
    subtitle: 'Chews that support mobility',
    heroImage:
      'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=1000&h=1200&fit=crop',
    collectionHandle: 'joint-pain',
  },
  {
    slug: 'digestive-issues',
    title: 'Digestive Issues',
    subtitle: 'Gentle, single-ingredient chews',
    heroImage:
      'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=1000&h=1200&fit=crop&crop=center',
    collectionHandle: 'digestive-issues',
  },
  {
    slug: 'hyperactivity',
    title: 'Hyperactivity',
    subtitle: 'Long-lasting chews to burn energy',
    heroImage:
      'https://res.cloudinary.com/petyupp-lifestyle/image/upload/v1776620340/nicholas-brownlow-lx_KwA7hlLU-unsplash_g37voz.jpg',
    collectionHandle: 'hyperactivity',
  },
];

const ROTATE_MS = 6000;

function DesktopSlider() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isPaused) return undefined;
    intervalRef.current = setInterval(() => {
      setActiveIndex((i) => (i + 1) % PROBLEMS.length);
    }, ROTATE_MS);
    return () => clearInterval(intervalRef.current);
  }, [isPaused]);

  return (
    <div
      className="hidden md:block"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex w-full h-[500px] overflow-hidden rounded-2xl shadow-xl bg-gray-900">
        {PROBLEMS.map((p, index) => {
          const isActive = index === activeIndex;
          return (
            <div
              key={p.slug}
              onClick={() => setActiveIndex(index)}
              className="relative overflow-hidden cursor-pointer transition-all duration-700 ease-in-out group"
              style={{
                flex: isActive ? '5 1 0%' : '0 0 5rem',
              }}
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:brightness-110"
                style={{
                  backgroundImage: `url(${p.heroImage})`,
                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                }}
              />
              <div
                className={`absolute inset-0 transition-all duration-500 ${
                  isActive
                    ? 'bg-gradient-to-t from-black/80 via-black/30 to-black/10'
                    : 'bg-black/55 group-hover:bg-black/40'
                }`}
              />

              {!isActive && (
                <div className="absolute bottom-4 left-0 right-0 px-2 text-center">
                  <span className="block text-white text-[11px] font-bold tracking-widest uppercase truncate">
                    {p.title}
                  </span>
                </div>
              )}

              {isActive && (
                <div className="absolute bottom-0 left-0 right-0 p-7 text-white">
                  <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
                    Dog Relief
                  </span>
                  <h3 className="text-2xl md:text-3xl font-black mt-1 mb-2 leading-tight">
                    {p.title}
                  </h3>
                  <p className="text-sm text-gray-200 mb-5">{p.subtitle}</p>
                  <Link
                    to={`/collections/${p.collectionHandle}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-2 text-white text-sm font-bold px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
                    style={{ backgroundColor: 'var(--accent)' }}
                  >
                    See Solutions
                    <ChevronRight size={16} />
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-center gap-2 mt-5">
        {PROBLEMS.map((p, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={p.slug}
              type="button"
              aria-label={`Show ${p.title}`}
              onClick={() => setActiveIndex(index)}
              className="rounded-full transition-all duration-300"
              style={{
                width: isActive ? '28px' : '8px',
                height: '8px',
                backgroundColor: isActive ? 'var(--accent)' : '#D1D5DB',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function MobileGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 md:hidden">
      {PROBLEMS.map((p) => (
        <Link
          key={p.slug}
          to={`/collections/${p.collectionHandle}`}
          className="group bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="relative aspect-square overflow-hidden">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{ backgroundImage: `url(${p.heroImage})` }}
            />
          </div>
          <div className="p-3">
            <h3 className="text-sm font-bold text-gray-900 leading-tight">
              {p.title}
            </h3>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function ProblemShowcase() {
  return (
    <>
      <DesktopSlider />
      <MobileGrid />
    </>
  );
}
