import React, { useState } from 'react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';

const dogProblems = [
  {
    id: 0,
    problem: 'Separation Anxiety',
    description: 'Calming chews and treats',
    shopLink: '/collections/separation-anxiety',
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=1000&fit=crop&crop=faces',
  },
  {
    id: 1,
    problem: 'Dental Health',
    description: 'Natural dental chews',
    shopLink: '/collections/dental-health',
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=1000&fit=crop',
  },
  {
    id: 2,
    problem: 'Destructive Chewing',
    description: 'Long-lasting power chews',
    shopLink: '/collections/destructive-chewing',
    image: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&h=1000&fit=crop',
  },
  {
    id: 3,
    problem: 'Joint Pain',
    description: 'Joint support supplements',
    shopLink: '/collections/joint-pain',
    image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&h=1000&fit=crop',
  },
  {
    id: 4,
    problem: 'Digestive Issues',
    description: 'Gut health solutions',
    shopLink: '/collections/digestive-issues',
    image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=1000&fit=crop&crop=center',
  },
  {
    id: 5,
    problem: 'Hyperactivity',
    description: 'Natural calming support',
    shopLink: '/collections/hyperactivity',
    image: 'https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=800&h=1000&fit=crop',
  },
];

const DogProblemSlider = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="w-full h-[480px] flex overflow-hidden rounded-2xl shadow-xl bg-gray-900">
      {dogProblems.map((item, index) => {
        const isActive = index === activeIndex;
        return (
          <div
            key={item.id}
            onClick={() => setActiveIndex(index)}
            className="relative overflow-hidden cursor-pointer transition-all duration-700 ease-in-out"
            style={{
              flex: isActive ? '5' : '1',
              minWidth: isActive ? '0' : '52px',
            }}
          >
            {/* Background Image */}
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-700"
              style={{
                backgroundImage: `url(${item.image})`,
                transform: isActive ? 'scale(1.05)' : 'scale(1)',
              }}
            />

            {/* Dark Overlay */}
            <div className={`absolute inset-0 transition-all duration-500 ${
              isActive
                ? 'bg-gradient-to-t from-black/80 via-black/30 to-black/10'
                : 'bg-black/60'
            }`} />

            {/* Collapsed State - Vertical Text */}
            {!isActive && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="text-white text-[11px] font-bold tracking-[0.15em] uppercase whitespace-nowrap"
                  style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', transform: 'rotate(180deg)' }}
                >
                  {item.problem}
                </span>
              </div>
            )}

            {/* Expanded State - Full Content */}
            {isActive && (
              <div className="absolute bottom-0 left-0 right-0 p-7 text-white">
                <div className="mb-1">
                  <span className="text-xs font-semibold uppercase tracking-widest text-cyan-400">
                    Dog Relief
                  </span>
                </div>
                <h3 className="text-2xl md:text-3xl font-black mb-2 leading-tight">
                  {item.problem}
                </h3>
                <p className="text-sm text-gray-300 mb-5">{item.description}</p>
                <Link
                  to={item.shopLink}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-2 hover:bg-[#0891B2] text-white text-sm font-bold px-6 py-3 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg" style={{ backgroundColor: 'var(--accent)' }}
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
  );
};

export default DogProblemSlider;
