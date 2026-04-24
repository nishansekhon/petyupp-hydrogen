import {useEffect, useId, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {useFetcher} from 'react-router';
import {ChevronLeft, ChevronRight, Volume2, VolumeX, X} from 'lucide-react';
import {problemLabels, videoUrls} from '~/lib/ugcManifest';
import {StarRow} from './VideoCard';
import QuickAddBlock from './QuickAddBlock';

function humanizeHandle(handle) {
  return handle
    .split('-')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ''))
    .join(' ');
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Unified layout at all viewports:
 *   - Card is portrait-oriented; mobile = fullscreen, desktop = centered
 *     480px × up to 720px tall (85-90vh).
 *   - Video fills the card with object-cover.
 *   - Bottom gradient scrim sits over the video and contains chip, dog
 *     name, stars, quote, and QuickAddBlock (product + quick-add).
 *
 * This is the deliberate TikTok-Shop pattern; the previous side-by-side
 * desktop aside was removed because QuickAddBlock wouldn't render
 * reliably in that subtree.
 */
export default function VideoModal({clips, startIndex, onClose}) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [muted, setMuted] = useState(true);

  const clip = clips[currentIndex];
  const atStart = currentIndex === 0;
  const atEnd = currentIndex === clips.length - 1;
  const titleId = useId();

  const dialogRef = useRef(null);
  const closeBtnRef = useRef(null);
  const videoRef = useRef(null);
  const touchStartRef = useRef(null);

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

  // Manual nav clamps at the ends (chevrons hide there).
  const goPrev = () => setCurrentIndex((i) => (i > 0 ? i - 1 : i));
  const goNext = () => setCurrentIndex((i) => (i < clips.length - 1 ? i + 1 : i));
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

  const label = problemLabels[clip.problemTag] ?? clip.problemTag;
  const dogName = clip.dogName || 'Pet Parent';
  const urls = videoUrls(clip);

  const quickAddClip = {
    ...clip,
    productName: clip.productName || humanizeHandle(clip.productHandle),
  };

  // Product fetcher — one per modal, reloaded on clip change.
  const productFetcher = useFetcher();
  useEffect(() => {
    productFetcher.load(
      `/api/product-for-modal?handle=${encodeURIComponent(clip.productHandle)}`,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clip.productHandle]);

  const rawData = productFetcher.data;
  const stale =
    rawData?.product && rawData.product.handle !== clip.productHandle;
  const fetchedProduct = stale ? null : rawData?.product || null;
  const fetchError = stale ? false : Boolean(rawData?.error);
  const productLoading =
    productFetcher.state !== 'idle' ||
    (!fetchedProduct && !fetchError);

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

      {/* Card — mobile fullscreen; desktop centered 480px × up to 720px. */}
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className="relative h-full w-full md:h-[min(90vh,720px)] md:w-full md:max-w-[480px] md:rounded-2xl md:overflow-hidden md:shadow-2xl bg-black"
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
          className="absolute inset-0 w-full h-full object-cover bg-black"
          aria-label={`${dogName} — ${label}`}
        >
          <track kind="captions" />
        </video>

        {/* Close X — top-right */}
        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          aria-label="Close video"
          className="absolute top-3 right-3 z-30 w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <X size={20} />
        </button>

        {/* Counter — top-center */}
        <span className="absolute top-3 left-1/2 -translate-x-1/2 z-20 text-white text-[12px] font-medium bg-black/60 rounded-full px-[10px] py-1 tabular-nums">
          {currentIndex + 1} of {clips.length}
        </span>

        {/* Desktop prev/next chevrons (mobile uses swipe) */}
        {!atStart && (
          <button
            type="button"
            aria-label="Previous clip"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm text-white items-center justify-center opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
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
            className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm text-white items-center justify-center opacity-70 hover:opacity-100 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ChevronRight size={22} />
          </button>
        )}

        {/* Speaker — bottom-left (over scrim, above its content by z-index) */}
        <button
          type="button"
          onClick={() => setMuted((m) => !m)}
          aria-label={muted ? 'Unmute video' : 'Mute video'}
          className="absolute z-30 left-3 w-11 h-11 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          style={{bottom: 'max(1rem, env(safe-area-inset-bottom))'}}
        >
          {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>

        {/* Bottom scrim — meta + QuickAddBlock. Always visible. */}
        <div
          className="absolute inset-x-0 bottom-0 pt-24 px-4 text-white pointer-events-none z-20"
          style={{
            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
            background:
              'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 50%, rgba(0,0,0,0) 100%)',
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
            <QuickAddBlock
              clip={quickAddClip}
              product={fetchedProduct}
              loading={productLoading}
              error={fetchError}
              dark
              onClose={onClose}
              showTrustLine={false}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalTree, document.body);
}
