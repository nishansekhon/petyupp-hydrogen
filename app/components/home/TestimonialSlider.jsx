import React, { useState, useEffect, useRef } from 'react';

const testimonials = [
  {
    stars: 5,
    text: "Our golden retriever used to destroy everything when we left. The coffee wood chew keeps him busy for hours!",
    name: "Sarah M.",
    role: "Golden Retriever owner"
  },
  {
    stars: 5,
    text: "Best yak cheese chews we've found. No smell, lasts forever, and our pup goes crazy for the peanut butter flavor.",
    name: "James R.",
    role: "Lab owner"
  },
  {
    stars: 5,
    text: "The bully sticks are restaurant quality compared to what we were buying at the pet store. You can see the difference.",
    name: "Maria K.",
    role: "Beagle owner"
  },
  {
    stars: 4,
    text: "Water buffalo ears are now a weekly staple. Great for dental health and my dog actually looks forward to teeth cleaning time.",
    name: "David L.",
    role: "German Shepherd owner"
  },
  {
    stars: 5,
    text: "Switched from rawhide to PetYupp and never looked back. Natural ingredients, no upset stomach, happy dog.",
    name: "Priya S.",
    role: "Mixed breed owner"
  }
];

const StarIcon = ({ filled }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill={filled ? "#06B6D4" : "none"} stroke={filled ? "#06B6D4" : "#9CA3AF"} strokeWidth="1.5">
    <polygon points="8,1.5 10.09,6.26 15.27,6.64 11.45,9.97 12.72,15 8,12.28 3.28,15 4.55,9.97 0.73,6.64 5.91,6.26"/>
  </svg>
);

const TestimonialSlider = () => {
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isHovered) {
      timerRef.current = setInterval(() => {
        setCurrent(prev => (prev + 1) % testimonials.length);
      }, 4000);
    }
    return () => clearInterval(timerRef.current);
  }, [isHovered]);

  const goTo = (idx) => setCurrent(idx);
  const prev = () => setCurrent((current - 1 + testimonials.length) % testimonials.length);
  const next = () => setCurrent((current + 1) % testimonials.length);

  // Desktop shows 3, mobile shows 1
  const getVisible = () => {
    const cards = [];
    for (let i = 0; i < 3; i++) {
      cards.push(testimonials[(current + i) % testimonials.length]);
    }
    return cards;
  };

  return (
    <section className="py-16 bg-[#1C1917]">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-black text-white text-center mb-12">What Dog Owners Say</h2>

        {/* Desktop: 3 cards */}
        <div
          className="hidden md:grid md:grid-cols-3 gap-6 mb-8"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {getVisible().map((t, i) => (
            <div key={i} className="bg-[#292524] rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, j) => (
                  <StarIcon key={j} filled={j < t.stars} />
                ))}
              </div>
              <p className="text-gray-300 text-sm italic leading-relaxed flex-1">"{t.text}"</p>
              <div className="border-t border-gray-700 pt-4">
                <p className="text-white font-bold text-sm">{t.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="bg-[#06B6D4] text-white text-xs px-2 py-0.5 rounded-full font-medium">✓ Verified Purchase</span>
                </div>
                <p className="text-gray-500 text-xs mt-1">{t.role}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile: 1 card */}
        <div className="md:hidden mb-6">
          <div className="bg-[#292524] rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, j) => (
                <StarIcon key={j} filled={j < testimonials[current].stars} />
              ))}
            </div>
            <p className="text-gray-300 text-sm italic leading-relaxed">"{testimonials[current].text}"</p>
            <div className="border-t border-gray-700 pt-4">
              <p className="text-white font-bold text-sm">{testimonials[current].name}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="bg-[#06B6D4] text-white text-xs px-2 py-0.5 rounded-full font-medium">✓ Verified Purchase</span>
              </div>
              <p className="text-gray-500 text-xs mt-1">{testimonials[current].role}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4">
          <button onClick={prev} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10 12L6 8l4-4"/>
            </svg>
          </button>
          <div className="flex gap-2">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`w-2 h-2 rounded-full transition-colors ${i === current ? 'bg-[#06B6D4]' : 'bg-white/30'}`}
              />
            ))}
          </div>
          <button onClick={next} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 12l4-4-4-4"/>
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default TestimonialSlider;
