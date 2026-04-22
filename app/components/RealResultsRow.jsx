import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Play, Star, X } from 'lucide-react';

const PROBLEM_LABELS = {
  'destructive-chewing': 'Destructive Chewing',
  'dental-health': 'Dental Health',
  'separation-anxiety': 'Separation Anxiety',
  'joint-pain': 'Joint Pain',
  'digestive-issues': 'Digestive Issues',
  'hyperactivity': 'Hyperactivity',
};

const TESTIMONIALS = [
  {
    id: 1,
    problemTag: 'destructive-chewing',
    customerName: 'Sarah & Max',
    rating: 5,
    quote: 'Max hasn’t touched a shoe in weeks — he’s obsessed with these chews.',
    videoThumbnail:
      'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&h=800&fit=crop&crop=faces',
    videoUrl: '',
    productHandle: 'coffee-wood-chew',
    productTitle: 'Coffee Wood Chew',
  },
  {
    id: 2,
    problemTag: 'dental-health',
    customerName: 'Jordan & Luna',
    rating: 5,
    quote: 'Luna’s vet noticed cleaner teeth at her 6-month checkup. Game changer.',
    videoThumbnail:
      'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=800&fit=crop&crop=faces',
    videoUrl: '',
    productHandle: 'cheese-chew-mint',
    productTitle: 'Himalayan Cheese Chew — Mint',
  },
  {
    id: 3,
    problemTag: 'separation-anxiety',
    customerName: 'Priya & Biscuit',
    rating: 4,
    quote: 'Biscuit actually stays calm when I leave for work now. First time ever.',
    videoThumbnail:
      'https://images.unsplash.com/photo-1560743641-3914f2c45636?w=600&h=800&fit=crop&crop=faces',
    videoUrl: '',
    productHandle: 'cheese-chew-pumpkin',
    productTitle: 'Himalayan Cheese Chew — Pumpkin',
  },
  {
    id: 4,
    problemTag: 'joint-pain',
    customerName: 'Marcus & Duke',
    rating: 5,
    quote: 'Duke is 11 and back to climbing stairs on his own. Absolutely worth it.',
    videoThumbnail:
      'https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=600&h=800&fit=crop&crop=faces',
    videoUrl: '',
    productHandle: 'water-buffalo-chips',
    productTitle: 'Water Buffalo Chips',
  },
  {
    id: 5,
    problemTag: 'digestive-issues',
    customerName: 'Emily & Cooper',
    rating: 5,
    quote: 'No more upset stomach after switching. Cooper’s gut finally settled down.',
    videoThumbnail:
      'https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=600&h=800&fit=crop&crop=faces',
    videoUrl: '',
    productHandle: 'plain-bully-sticks',
    productTitle: 'Plain Bully Sticks',
  },
  {
    id: 6,
    problemTag: 'hyperactivity',
    customerName: 'Alex & Ziggy',
    rating: 4,
    quote: 'Finally something that tires Ziggy out without a 5-mile run. Bliss.',
    videoThumbnail:
      'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=600&h=800&fit=crop&crop=faces',
    videoUrl: '',
    productHandle: 'cheese-chew-strawberry',
    productTitle: 'Himalayan Cheese Chew — Strawberry',
  },
];

function StarRow({ rating }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= rating;
        return (
          <Star
            key={i}
            size={12}
            strokeWidth={1.5}
            className={filled ? 'text-[#FCD34D]' : 'text-[#E5E7EB]'}
            fill={filled ? '#FCD34D' : '#E5E7EB'}
          />
        );
      })}
    </div>
  );
}

function UGCCard({ testimonial, onOpen, cardRef }) {
  const label = PROBLEM_LABELS[testimonial.problemTag] ?? testimonial.problemTag;
  const collectionHref = `/collections/${testimonial.problemTag}`;

  return (
    <button
      ref={cardRef}
      type="button"
      onClick={() => onOpen(testimonial)}
      aria-label={`Watch ${testimonial.customerName}'s story about ${label}`}
      className="group snap-start shrink-0 w-[160px] md:w-[240px] text-left bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]"
    >
      <div className="relative w-full aspect-[9/16] overflow-hidden bg-gray-100">
        <img
          src={testimonial.videoThumbnail}
          alt={`${testimonial.customerName} — ${label}`}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <span className="absolute top-2 left-2 bg-[#06B6D4] text-white text-[10px] md:text-xs font-semibold rounded-full px-2 py-1 shadow-sm">
          {label}
        </span>
        <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/90 flex items-center justify-center shadow-md group-hover:bg-white transition-colors">
            <Play size={18} className="text-gray-900 ml-0.5" fill="currentColor" />
          </span>
        </span>
      </div>

      <div className="p-2 md:p-3">
        <div className="text-sm font-semibold text-gray-900 leading-tight">
          {testimonial.customerName}
        </div>
        <div className="mt-1">
          <StarRow rating={testimonial.rating} />
        </div>
        <p className="text-xs text-gray-600 line-clamp-2 mt-1">
          {testimonial.quote}
        </p>
        <Link
          to={collectionHref}
          onClick={(e) => e.stopPropagation()}
          className="mt-2 inline-flex items-center gap-1 text-xs text-[#06B6D4] font-medium hover:text-[#0891B2]"
        >
          <span className="truncate">Shop {testimonial.productTitle}</span>
          <span aria-hidden>→</span>
        </Link>
      </div>
    </button>
  );
}

function VideoModal({ testimonial, onClose }) {
  const closeBtnRef = useRef(null);
  const label = PROBLEM_LABELS[testimonial.problemTag] ?? testimonial.problemTag;
  const collectionHref = `/collections/${testimonial.problemTag}`;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtnRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${testimonial.customerName} video testimonial`}
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
    >
      <button
        type="button"
        tabIndex={-1}
        aria-hidden="true"
        onClick={onClose}
        className="absolute inset-0 w-full h-full bg-transparent cursor-default"
      />
      <div className="relative z-10 w-full max-w-md mx-auto bg-white rounded-2xl overflow-hidden shadow-2xl">
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          aria-label="Close video"
          className="absolute top-2 right-2 z-10 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <X size={18} />
        </button>

        <div className="relative w-full aspect-[9/16] bg-gray-900">
          {testimonial.videoUrl ? (
            <video
              src={testimonial.videoUrl}
              controls
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-cover bg-black"
            >
              <track kind="captions" />
            </video>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
              <img
                src={testimonial.videoThumbnail}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover opacity-40"
              />
              <div className="absolute inset-0 bg-black/60" />
              <div className="relative text-white">
                <Play size={36} className="mx-auto mb-3 opacity-80" />
                <div className="text-base font-semibold">Video coming soon</div>
                <div className="text-xs text-gray-300 mt-1">
                  Real footage uploading shortly
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 md:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-gray-900">
                {testimonial.customerName}
              </div>
              <div className="mt-1">
                <StarRow rating={testimonial.rating} />
              </div>
            </div>
            <span className="bg-[#06B6D4]/10 text-[#06B6D4] text-xs font-semibold rounded-full px-2 py-1">
              {label}
            </span>
          </div>
          <p className="text-sm text-gray-700 mt-3 leading-relaxed">
            {testimonial.quote}
          </p>
          <Link
            to={collectionHref}
            onClick={onClose}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-[#06B6D4] hover:bg-[#0891B2] text-white text-sm font-bold rounded-xl px-4 py-3 transition-colors"
          >
            Shop {testimonial.productTitle} →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RealResultsRow() {
  const [active, setActive] = useState(null);
  const lastTriggerRef = useRef(null);
  const cardRefs = useRef({});

  const handleOpen = (testimonial) => {
    lastTriggerRef.current = cardRefs.current[testimonial.id] ?? null;
    setActive(testimonial);
  };

  const handleClose = () => {
    setActive(null);
    requestAnimationFrame(() => {
      lastTriggerRef.current?.focus?.();
    });
  };

  return (
    <section className="max-w-7xl mx-auto px-4 py-8 md:py-16">
      <div className="text-center mb-6 md:mb-10">
        <h2 className="text-2xl md:text-4xl font-bold text-gray-900">
          Real dogs, real relief
        </h2>
        <p className="text-sm md:text-base text-gray-500 mt-2">
          See how PetYupp helped real dogs — from real pet parents
        </p>
      </div>

      <div className="flex gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide -mx-4 px-4">
        {TESTIMONIALS.map((t) => (
          <UGCCard
            key={t.id}
            testimonial={t}
            onOpen={handleOpen}
            cardRef={(el) => {
              cardRefs.current[t.id] = el;
            }}
          />
        ))}
      </div>

      {active && <VideoModal testimonial={active} onClose={handleClose} />}
    </section>
  );
}
