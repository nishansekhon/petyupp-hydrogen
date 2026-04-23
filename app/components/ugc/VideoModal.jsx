import {useEffect, useId, useRef, useState} from 'react';
import {Link} from 'react-router';
import {ChevronLeft, ChevronRight, Volume2, VolumeX, X} from 'lucide-react';
import {problemLabels, videoUrls} from '~/lib/ugcManifest';
import {StarRow} from './VideoCard';

function humanizeHandle(handle) {
  return handle
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
    .join(' ');
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function VideoModal({clips, startIndex, onClose}) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [muted, setMuted] = useState(true);

  const clip = clips[currentIndex];
  const titleId = useId();

  const dialogRef = useRef(null);
  const closeBtnRef = useRef(null);
  const videoRef = useRef(null);
  const touchStartRef = useRef(null);

  // Reset mute each clip swap so autoplay can resume
  useEffect(() => {
    setMuted(true);
  }, [currentIndex]);

  // Body scroll lock + scrollbar-width compensation
  useEffect(() => {
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlPR = document.documentElement.style.paddingRight;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.documentElement.style.paddingRight = `${scrollbarWidth}px`;
    }
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.paddingRight = prevHtmlPR;
    };
  }, []);

  // Pause all other videos on mount, resume on unmount
  useEffect(() => {
    const others = Array.from(document.querySelectorAll('video')).filter(
      (v) => v !== videoRef.current,
    );
    const wasPlaying = others.filter((v) => !v.paused);
    wasPlaying.forEach((v) => v.pause());
    return () => {
      wasPlaying.forEach((v) => {
        const p = v.play();
        if (p && typeof p.catch === 'function') p.catch(() => {});
      });
    };
  }, []);

  // Initial focus on close
  useEffect(() => {
    closeBtnRef.current?.focus();
  }, []);

  const prev = () =>
    setCurrentIndex((i) => (i - 1 + clips.length) % clips.length);
  const next = () => setCurrentIndex((i) => (i + 1) % clips.length);

  // Keyboard: Esc / arrows / focus trap
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
        return;
      }
      if (e.key === 'Tab') {
        const root = dialogRef.current;
        if (!root) return;
        const focusables = root.querySelectorAll(FOCUSABLE_SELECTOR);
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, clips.length]);

  // Touch: swipe horizontal = nav, swipe down = close (80px threshold)
  const onTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  };
  const onTouchEnd = (e) => {
    const start = touchStartRef.current;
    if (!start) return;
    touchStartRef.current = null;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 80) {
      if (dx > 0) prev();
      else next();
    } else if (dy > 80 && Math.abs(dy) > Math.abs(dx)) {
      onClose();
    }
  };

  const label = problemLabels[clip.problemTag] ?? clip.problemTag;
  const dogName = clip.dogName || 'Pet Parent';
  const productHref = `/products/${clip.productHandle}`;
  const productName = humanizeHandle(clip.productHandle);
  const urls = videoUrls(clip);

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black md:bg-black/80"
    >
      {/* SR-only title — aria-labelledby target */}
      <h2 id={titleId} className="sr-only">
        {dogName} — {label}
      </h2>

      {/* Desktop prev/next chevrons (mobile uses swipe) */}
      <button
        type="button"
        aria-label="Previous clip"
        onClick={(e) => {
          e.stopPropagation();
          prev();
        }}
        className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 text-white items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white z-20"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        type="button"
        aria-label="Next clip"
        onClick={(e) => {
          e.stopPropagation();
          next();
        }}
        className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 text-white items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white z-20"
      >
        <ChevronRight size={24} />
      </button>

      {/* Card — desktop centered row; mobile fullscreen */}
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="relative h-full w-full md:h-auto md:max-w-5xl md:mx-auto md:my-[7.5vh] md:bg-white md:rounded-2xl md:overflow-hidden md:shadow-2xl md:flex md:flex-row"
      >
        {/* Counter */}
        <span className="absolute top-3 left-3 z-10 text-[12px] font-medium text-white md:text-gray-700 bg-black/40 md:bg-gray-100 px-2 py-1 rounded-full">
          {currentIndex + 1} / {clips.length}
        </span>

        {/* Close X */}
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          aria-label="Close video"
          className="absolute top-3 right-3 z-10 w-11 h-11 md:w-8 md:h-8 rounded-full bg-black/40 hover:bg-black/60 md:bg-gray-100 md:hover:bg-gray-200 text-white md:text-gray-700 flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <X size={20} />
        </button>

        {/* Video region */}
        <div
          className="relative w-full h-full md:w-auto md:h-auto md:shrink-0 bg-black"
          style={{
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
            paddingLeft: 'env(safe-area-inset-left)',
            paddingRight: 'env(safe-area-inset-right)',
          }}
        >
          <div
            className="relative w-full h-full md:aspect-[9/16]"
            style={{
              maxHeight: 'min(85vh, 720px)',
            }}
          >
            <video
              ref={videoRef}
              key={clip.slug}
              src={urls.modal}
              poster={urls.poster}
              autoPlay
              muted={muted}
              playsInline
              loop
              className="absolute inset-0 w-full h-full object-cover md:object-contain bg-black"
              aria-label={`${dogName} — ${label}`}
            >
              <track kind="captions" />
            </video>

            {/* Speaker toggle */}
            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? 'Unmute video' : 'Mute video'}
              className="absolute z-20 right-3 w-11 h-11 md:w-9 md:h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              style={{
                bottom: 'max(1rem, env(safe-area-inset-bottom))',
              }}
            >
              {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>

            {/* Mobile meta overlay — bottom 30%, scrim, CTA */}
            <div
              className="md:hidden absolute inset-x-0 bottom-0 pt-24 px-4 text-white pointer-events-none"
              style={{
                paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
                background:
                  'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0) 100%)',
              }}
            >
              <div className="pointer-events-auto">
                <span className="inline-block bg-[#06B6D4] text-white text-xs font-semibold rounded-full px-2 py-1">
                  {label}
                </span>
                <div className="mt-2 text-xl font-bold">{dogName}</div>
                <div className="mt-1">
                  <StarRow rating={clip.rating} />
                </div>
                {clip.quote && (
                  <p className="mt-2 text-sm text-white/90 line-clamp-3">
                    {clip.quote}
                  </p>
                )}
                <Link
                  to={productHref}
                  onClick={onClose}
                  className="mt-3 w-full inline-flex items-center justify-center gap-2 bg-[#06B6D4] hover:bg-[#0891B2] text-white text-sm font-bold rounded-xl px-4 py-3 transition-colors"
                >
                  <span className="truncate">Shop {productName}</span>
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop meta panel */}
        <aside className="hidden md:flex md:flex-col md:w-[360px] md:shrink-0 md:p-6 md:gap-3 md:overflow-y-auto">
          <span className="self-start bg-[#06B6D4]/10 text-[#06B6D4] text-xs font-semibold rounded-full px-2 py-1">
            {label}
          </span>
          <div className="text-2xl font-bold text-gray-900">{dogName}</div>
          <StarRow rating={clip.rating} />
          {clip.quote && (
            <p className="text-sm text-gray-700 leading-relaxed">
              {clip.quote}
            </p>
          )}
          {clip.creator && (
            <p className="text-xs text-gray-500">{clip.creator}</p>
          )}
          <div className="mt-auto pt-4">
            <Link
              to={productHref}
              onClick={onClose}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#06B6D4] hover:bg-[#0891B2] text-white text-sm font-bold rounded-xl px-4 py-3 transition-colors"
            >
              <span className="truncate">Shop {productName}</span>
              <span aria-hidden>→</span>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
