import {useEffect, useId, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
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
  const [timeLeft, setTimeLeft] = useState(null);

  const clip = clips[currentIndex];
  const nextIndex = (currentIndex + 1) % clips.length;
  const nextClip = clips[nextIndex];
  const atStart = currentIndex === 0;
  const atEnd = currentIndex === clips.length - 1;
  const titleId = useId();

  const dialogRef = useRef(null);
  const closeBtnRef = useRef(null);
  const videoRef = useRef(null);
  const touchStartRef = useRef(null);

  // Reset the time-remaining tracker when we swap clips. The new clip
  // will fire its own onTimeUpdate once playback begins.
  useEffect(() => {
    setTimeLeft(null);
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

  // Initial focus on close button
  useEffect(() => {
    closeBtnRef.current?.focus();
  }, []);

  // Manual navigation clamps at the ends (chevrons hide there).
  const goPrev = () =>
    setCurrentIndex((i) => (i > 0 ? i - 1 : i));
  const goNext = () =>
    setCurrentIndex((i) => (i < clips.length - 1 ? i + 1 : i));
  // Autoplay advance loops back to first at the end of the list.
  const advanceLooping = () =>
    setCurrentIndex((i) => (i + 1) % clips.length);

  // Keyboard: Esc / arrows / focus trap
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
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

  // Touch: swipe horizontal = nav (50px), swipe down = close (80px)
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
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
      if (dx > 0) goPrev();
      else goNext();
    } else if (dy > 80 && Math.abs(dy) > Math.abs(dx)) {
      onClose();
    }
  };

  const onVideoTimeUpdate = (e) => {
    const v = e.currentTarget;
    if (isFinite(v.duration) && v.duration > 0) {
      setTimeLeft(v.duration - v.currentTime);
    }
  };

  const label = problemLabels[clip.problemTag] ?? clip.problemTag;
  const dogName = clip.dogName || 'Pet Parent';
  const productHref = `/products/${clip.productHandle}`;
  const productName = clip.productName || humanizeHandle(clip.productHandle);
  const urls = videoUrls(clip);
  const nextUrls = videoUrls(nextClip);
  const nextDogName = nextClip.dogName || 'Pet Parent';
  const showUpNext = timeLeft !== null && timeLeft < 3;

  if (typeof document === 'undefined') return null;

  const modalTree = (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
      className="fixed inset-0 z-[9999] bg-black md:bg-black/75 md:flex md:items-center md:justify-center"
    >
      <h2 id={titleId} className="sr-only">
        {dogName} — {label}
      </h2>

      {/* Card — desktop centered row; mobile fullscreen */}
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="relative h-full w-full md:h-[min(85vh,720px)] md:w-auto md:max-w-[960px] md:bg-white md:rounded-2xl md:overflow-hidden md:shadow-2xl md:flex md:flex-row"
      >
        {/* Close X — top-right of card (stays outside video) */}
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          aria-label="Close video"
          className="absolute top-3 right-3 z-30 w-11 h-11 md:w-8 md:h-8 rounded-full bg-black/40 hover:bg-black/60 md:bg-gray-100 md:hover:bg-gray-200 text-white md:text-gray-700 flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <X size={20} />
        </button>

        {/* Video region — desktop: 9:16 width derived from card height. Mobile: fullscreen. */}
        <div
          className="relative w-full h-full md:w-[calc(min(85vh,720px)*9/16)] md:shrink-0 bg-black"
          style={{
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
            paddingLeft: 'env(safe-area-inset-left)',
            paddingRight: 'env(safe-area-inset-right)',
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
            onEnded={advanceLooping}
            onTimeUpdate={onVideoTimeUpdate}
            className="absolute inset-0 w-full h-full object-cover bg-black"
            aria-label={`${dogName} — ${label}`}
          >
            <track kind="captions" />
          </video>

          {/* Counter — top-center of video */}
          <span className="absolute top-3 left-1/2 -translate-x-1/2 z-20 text-white text-[12px] font-medium bg-black/60 rounded-full px-[10px] py-1 tabular-nums">
            {currentIndex + 1} of {clips.length}
          </span>

          {/* Desktop prev/next chevrons — inside video, hide at bounds */}
          {!atStart && (
            <button
              type="button"
              aria-label="Previous clip"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm text-white items-center justify-center opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ChevronLeft size={22} />
            </button>
          )}
          {!atEnd && (
            <button
              type="button"
              aria-label="Next clip"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm text-white items-center justify-center opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <ChevronRight size={22} />
            </button>
          )}

          {/* Speaker toggle — bottom-LEFT of video (moved from right to make room for up-next) */}
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? 'Unmute video' : 'Mute video'}
            className="absolute z-20 left-3 w-11 h-11 md:w-9 md:h-9 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            style={{bottom: 'max(1rem, env(safe-area-inset-bottom))'}}
          >
            {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>

          {/* Up-next preview — desktop only, last 3 seconds */}
          {showUpNext && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                advanceLooping();
              }}
              aria-label={`Skip to next clip: ${nextDogName}`}
              className="hidden md:flex absolute bottom-3 right-3 z-20 items-center gap-2 bg-black/60 backdrop-blur-sm text-white rounded-lg p-2 hover:bg-black/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <img
                src={nextUrls.poster}
                alt=""
                className="w-9 aspect-[9/16] object-cover rounded"
              />
              <div className="text-left pr-1">
                <div className="text-[10px] text-white/70 uppercase tracking-wide">
                  Up next
                </div>
                <div className="text-sm font-semibold leading-tight max-w-[120px] truncate">
                  {nextDogName}
                </div>
              </div>
            </button>
          )}

          {/* Mobile meta overlay — bottom scrim */}
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
                <blockquote className="mt-2 text-sm text-white/90 line-clamp-3">
                  &ldquo;{clip.quote}&rdquo;
                </blockquote>
              )}
              <hr
                style={{
                  margin: '16px 0',
                  border: 'none',
                  borderTop: '1px solid rgba(255,255,255,0.15)',
                }}
              />
              <p className="text-[13px] text-white/70 mb-2">{productName}</p>
              <Link
                to={productHref}
                onClick={onClose}
                className="block w-full text-center bg-[#06B6D4] hover:bg-[#0891B2] text-white text-sm font-medium rounded-lg px-5 py-3 transition-colors"
              >
                Shop now →
              </Link>
            </div>
          </div>
        </div>

        {/* Desktop meta panel */}
        <aside className="hidden md:flex md:flex-col md:w-[360px] md:h-full md:shrink-0 md:p-8 md:overflow-y-auto">
          <span className="self-start bg-[#06B6D4]/10 text-[#06B6D4] text-xs font-semibold rounded-full px-2 py-1">
            {label}
          </span>
          <div className="mt-3 text-2xl font-bold text-gray-900">{dogName}</div>
          <div className="mt-1">
            <StarRow rating={clip.rating} />
          </div>
          {clip.quote && (
            <blockquote className="mt-3 text-sm text-gray-700 leading-relaxed">
              &ldquo;{clip.quote}&rdquo;
            </blockquote>
          )}
          {clip.creator && (
            <p className="mt-3 text-xs text-gray-500">{clip.creator}</p>
          )}
          <div className="mt-auto">
            <hr
              style={{
                margin: '16px 0',
                border: 'none',
                borderTop: '1px solid rgba(0,0,0,0.08)',
              }}
            />
            <p className="text-[13px] text-[var(--text-secondary)] mb-2">
              {productName}
            </p>
            <Link
              to={productHref}
              onClick={onClose}
              className="block w-full text-center bg-[#06B6D4] hover:bg-[#0891B2] text-white text-sm font-medium rounded-lg px-5 py-3 transition-colors"
            >
              Shop now →
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );

  return createPortal(modalTree, document.body);
}
