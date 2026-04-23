import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { Play, Star, X } from 'lucide-react';
import { getHomepageClips, videoUrls } from '~/lib/ugcManifest';

const problemLabels = {
  'destructive-chewing': 'Destructive Chewing',
  'dental-health': 'Dental Health',
  'separation-anxiety': 'Separation Anxiety',
  'joint-pain': 'Joint Pain',
  'digestive-issues': 'Digestive Issues',
  'hyperactivity': 'Hyperactivity',
};

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

function UGCCard({ testimonial, onOpen, cardRef, modalOpen }) {
  const label = testimonial.problemLabel ?? testimonial.problemSlug;
  const productHref = `/products/${testimonial.productHandle}`;
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const isVisibleRef = useRef(false);

  const setCardRef = (el) => {
    containerRef.current = el;
    if (typeof cardRef === 'function') cardRef(el);
  };

  useEffect(() => {
    const videoEl = videoRef.current;
    const containerEl = containerRef.current;
    if (!videoEl || !containerEl || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }

    const playIfAllowed = () => {
      if (!isVisibleRef.current || modalOpen) return;
      const p = videoEl.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          isVisibleRef.current = entry.isIntersecting;
          if (entry.isIntersecting) {
            playIfAllowed();
          } else {
            videoEl.pause();
          }
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(containerEl);
    return () => observer.disconnect();
  }, [modalOpen]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    if (modalOpen) {
      videoEl.pause();
    } else if (isVisibleRef.current) {
      const p = videoEl.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
    }
  }, [modalOpen]);

  return (
    <button
      ref={setCardRef}
      type="button"
      onClick={() => onOpen(testimonial)}
      aria-label={`Watch ${testimonial.dogName}'s story about ${label}`}
      className="group snap-start shrink-0 w-[160px] md:w-[240px] text-left bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]"
    >
      <div className="relative w-full aspect-[9/16] overflow-hidden bg-gray-100">
        <video
          ref={videoRef}
          src={testimonial.videoInline}
          poster={testimonial.videoPoster}
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={`${testimonial.dogName} — ${label}`}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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
          {testimonial.dogName}
        </div>
        <div className="mt-1">
          <StarRow rating={testimonial.rating} />
        </div>
        <p className="text-xs text-gray-600 mt-1">
          {testimonial.quote}
        </p>
        <Link
          to={productHref}
          onClick={(e) => e.stopPropagation()}
          className="mt-2 inline-flex items-center gap-1 text-xs text-[#06B6D4] font-medium hover:text-[#0891B2]"
        >
          <span className="truncate">Shop this product</span>
          <span aria-hidden>→</span>
        </Link>
      </div>
    </button>
  );
}

function VideoModal({ testimonial, onClose }) {
  const closeBtnRef = useRef(null);
  const label = testimonial.problemLabel ?? testimonial.problemSlug;
  const productHref = `/products/${testimonial.productHandle}`;

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
      aria-label={`${testimonial.dogName} video testimonial`}
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
          <video
            src={testimonial.videoModal}
            poster={testimonial.videoPoster}
            controls
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover bg-black"
          >
            <track kind="captions" />
          </video>
        </div>

        <div className="p-4 md:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-gray-900">
                {testimonial.dogName}
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
            to={productHref}
            onClick={onClose}
            className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-[#06B6D4] hover:bg-[#0891B2] text-white text-sm font-bold rounded-xl px-4 py-3 transition-colors"
          >
            Shop this product →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RealResultsRow() {
  const testimonials = getHomepageClips().map((clip) => {
    const urls = videoUrls(clip);
    return {
      problemSlug: clip.problemTag,
      problemLabel: problemLabels[clip.problemTag],
      dogName: clip.dogName || 'Pet Parent',
      quote: clip.quote,
      rating: clip.rating,
      creator: clip.creator,
      productHandle: clip.productHandle,
      videoInline: urls.inline,
      videoModal: urls.modal,
      videoPoster: urls.poster,
    };
  });

  const [active, setActive] = useState(null);
  const lastTriggerRef = useRef(null);
  const cardRefs = useRef({});

  const handleOpen = (testimonial) => {
    lastTriggerRef.current = cardRefs.current[testimonial.problemSlug] ?? null;
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
        {testimonials.map((t) => (
          <UGCCard
            key={t.problemSlug}
            testimonial={t}
            onOpen={handleOpen}
            modalOpen={active !== null}
            cardRef={(el) => {
              cardRefs.current[t.problemSlug] = el;
            }}
          />
        ))}
      </div>

      {active && <VideoModal testimonial={active} onClose={handleClose} />}
    </section>
  );
}
