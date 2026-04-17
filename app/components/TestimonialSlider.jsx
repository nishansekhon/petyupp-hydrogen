import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const testimonials = [
  {
    id: 1,
    name: 'Sarah M.',
    location: 'Austin, TX',
    rating: 5,
    text: 'My golden retriever absolutely loves the natural treats from PetYupp! No artificial ingredients and she goes crazy for them. Best dog treats we\'ve ever tried.',
    avatar: '🐾',
    product: 'Natural Treats Bundle',
  },
  {
    id: 2,
    name: 'Jake & Bella',
    location: 'Denver, CO',
    rating: 5,
    text: 'The yak chews keep our high-energy lab busy for hours. Durable, natural, and Bella is obsessed. We\'ve reordered three times already!',
    avatar: '🦴',
    product: 'Himalayan Yak Chews',
  },
  {
    id: 3,
    name: 'Maria L.',
    location: 'Seattle, WA',
    rating: 5,
    text: 'Fast shipping, beautiful packaging, and my pup is healthier than ever. The travel bowl is genius — we bring it on every hike. PetYupp is our go-to store.',
    avatar: '🐶',
    product: 'Adventure Travel Bowl',
  },
  {
    id: 4,
    name: 'Tom R.',
    location: 'Nashville, TN',
    rating: 5,
    text: 'Premium quality you can actually see. Our vet noticed the improvement in our dog\'s coat after just two weeks of the natural diet treats. Highly recommend!',
    avatar: '⭐',
    product: 'Premium Wellness Treats',
  },
  {
    id: 5,
    name: 'Emily K.',
    location: 'Portland, OR',
    rating: 5,
    text: 'Switched to PetYupp 6 months ago and never looked back. The ingredients are clean, the prices are fair, and our dogs are thriving. Customer service is also top-notch!',
    avatar: '🐕',
    product: 'Natural Dog Treats',
  },
];

function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5 justify-center mb-3">
      {[...Array(5)].map((_, i) => (
        <span
          key={i}
          className={`text-lg ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function TestimonialSlider() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const goTo = (index) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  };

  const goPrev = () => {
    setDirection(-1);
    setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goNext = () => {
    setDirection(1);
    setCurrent((prev) => (prev + 1) % testimonials.length);
  };

  const variants = {
    enter: (dir) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  const t = testimonials[current];

  return (
    <section className="py-14 bg-gradient-to-b from-white to-teal-50">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-block bg-teal-100 text-teal-700 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
            Happy Pet Parents
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900">
            What Dog Lovers Are Saying
          </h2>
          <p className="text-gray-500 text-sm mt-2">
            Trusted by thousands of dog owners across America
          </p>
        </div>

        {/* Slider card */}
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={current}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: 'easeInOut' }}
              className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 md:p-10 text-center mx-auto max-w-2xl"
            >
              {/* Avatar emoji */}
              <div className="w-16 h-16 rounded-full bg-teal-50 border-2 border-teal-200 flex items-center justify-center text-3xl mx-auto mb-4">
                {t.avatar}
              </div>

              <StarRating rating={t.rating} />

              {/* Quote */}
              <p className="text-gray-700 text-base md:text-lg leading-relaxed mb-6 italic">
                &ldquo;{t.text}&rdquo;
              </p>

              {/* Reviewer info */}
              <div>
                <p className="font-bold text-gray-900 text-sm">{t.name}</p>
                <p className="text-gray-400 text-xs">{t.location}</p>
                <span className="inline-block mt-2 bg-teal-50 text-teal-600 text-xs px-3 py-1 rounded-full font-medium">
                  {t.product}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Prev / Next arrows */}
          <button
            onClick={goPrev}
            aria-label="Previous testimonial"
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 md:translate-x-0 w-9 h-9 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:bg-teal-50 hover:border-teal-300 transition-all"
          >
            ‹
          </button>
          <button
            onClick={goNext}
            aria-label="Next testimonial"
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 md:translate-x-0 w-9 h-9 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-600 hover:bg-teal-50 hover:border-teal-300 transition-all"
          >
            ›
          </button>
        </div>

        {/* Dot navigation */}
        <div className="flex justify-center gap-2 mt-6">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to testimonial ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === current
                  ? 'w-6 bg-teal-500'
                  : 'w-2 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        {/* Trust badges */}
        <div className="flex justify-center gap-6 mt-8 text-center">
          <div className="text-center">
            <p className="text-2xl font-black text-teal-600">10k+</p>
            <p className="text-xs text-gray-500">Happy Dogs</p>
          </div>
          <div className="w-px bg-gray-200" />
          <div className="text-center">
            <p className="text-2xl font-black text-teal-600">4.9★</p>
            <p className="text-xs text-gray-500">Avg Rating</p>
          </div>
          <div className="w-px bg-gray-200" />
          <div className="text-center">
            <p className="text-2xl font-black text-teal-600">98%</p>
            <p className="text-xs text-gray-500">Would Recommend</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default TestimonialSlider;
