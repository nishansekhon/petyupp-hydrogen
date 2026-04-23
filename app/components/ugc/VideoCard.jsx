import {useEffect, useRef} from 'react';
import {Link} from 'react-router';
import {Play, Star} from 'lucide-react';
import {problemLabels, videoUrls} from '~/lib/ugcManifest';

export function StarRow({rating}) {
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${rating} out of 5 stars`}
    >
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

export default function VideoCard({clip, onOpen, modalOpen = false, cardRef}) {
  const label = problemLabels[clip.problemTag] ?? clip.problemTag;
  const productHref = `/products/${clip.productHandle}`;
  const dogName = clip.dogName || 'Pet Parent';
  const urls = videoUrls(clip);

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
      {threshold: 0.5},
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
      onClick={() => onOpen?.(clip)}
      aria-label={`Watch ${dogName}'s story about ${label}`}
      className="group w-full text-left bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06B6D4]"
    >
      <div className="relative w-full aspect-[9/16] overflow-hidden bg-gray-100">
        <video
          ref={videoRef}
          src={urls.inline}
          poster={urls.poster}
          muted
          loop
          playsInline
          loading="lazy"
          preload="metadata"
          aria-label={`${dogName} — ${label}`}
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
          {dogName}
        </div>
        <div className="mt-1">
          <StarRow rating={clip.rating} />
        </div>
        {clip.quote && (
          <p className="text-xs text-gray-600 mt-1 line-clamp-3">
            {clip.quote}
          </p>
        )}
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
