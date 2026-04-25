import {useCallback, useEffect, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {ChevronLeft, ChevronRight, X} from 'lucide-react';

function withWidth(url, width) {
  if (!url || typeof url !== 'string') return url;
  try {
    const u = new URL(url);
    u.searchParams.set('width', String(width));
    return u.toString();
  } catch {
    return url;
  }
}

export default function PdpImageLightbox({
  images,
  startIndex = 0,
  title,
  onClose,
  onIndexChange,
}) {
  const [index, setIndex] = useState(
    Math.max(0, Math.min(startIndex, images.length - 1)),
  );
  const closeButtonRef = useRef(null);

  const goPrev = useCallback(
    () => setIndex((i) => (i - 1 + images.length) % images.length),
    [images.length],
  );
  const goNext = useCallback(
    () => setIndex((i) => (i + 1) % images.length),
    [images.length],
  );

  useEffect(() => {
    onIndexChange?.(index);
  }, [index, onIndexChange]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'Tab') {
        // Trivial focus trap: keep focus on the close button. The lightbox has
        // few interactive elements (close, prev, next, thumbnails) and no
        // form inputs, so a single anchor is enough — no need for a full
        // focus-trap library.
        e.preventDefault();
        closeButtonRef.current?.focus();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, onClose]);

  useEffect(() => {
    closeButtonRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  if (typeof document === 'undefined') return null;

  const active = images[index];

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Product image gallery"
      className="fixed inset-0 z-[100] flex items-center justify-center"
    >
      {/* Backdrop is a real button so click-and-keyboard dismiss is native. */}
      <button
        type="button"
        aria-label="Close gallery"
        onClick={onClose}
        className="absolute inset-0 w-full h-full bg-black/85 cursor-default focus:outline-none"
      />

      <button
        ref={closeButtonRef}
        type="button"
        onClick={onClose}
        aria-label="Close gallery"
        className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <X size={24} strokeWidth={1.75} />
      </button>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous image"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ChevronLeft size={32} strokeWidth={1.75} />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next image"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ChevronRight size={32} strokeWidth={1.75} />
          </button>
        </>
      )}

      <div className="relative z-10 flex flex-col items-center gap-4 max-w-[92vw] pointer-events-none">
        <img
          src={withWidth(active.url, 1600)}
          alt={active.altText || title}
          className="max-w-[90vw] max-h-[80vh] object-contain pointer-events-auto"
        />

        {images.length > 1 && (
          <div
            className="flex gap-2 overflow-x-auto max-w-full px-2 pb-2 pointer-events-auto"
            aria-label="Gallery thumbnails"
          >
            {images.map((img, i) => (
              <button
                key={img.id ?? `lightbox-thumb-${i}`}
                type="button"
                onClick={() => setIndex(i)}
                aria-current={i === index}
                aria-label={`Show image ${i + 1}`}
                className={`shrink-0 w-14 h-14 rounded overflow-hidden bg-white/5 transition-colors ${
                  i === index
                    ? 'ring-2 ring-[#06B6D4]'
                    : 'opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={withWidth(img.url, 200)}
                  alt={img.altText || title}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
