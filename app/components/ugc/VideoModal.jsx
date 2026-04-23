import {useEffect, useRef} from 'react';
import {Link} from 'react-router';
import {X} from 'lucide-react';
import {problemLabels, videoUrls} from '~/lib/ugcManifest';
import {StarRow} from './VideoCard';

export default function VideoModal({clip, onClose}) {
  const closeBtnRef = useRef(null);
  const label = problemLabels[clip.problemTag] ?? clip.problemTag;
  const productHref = `/products/${clip.productHandle}`;
  const dogName = clip.dogName || 'Pet Parent';
  const urls = videoUrls(clip);

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
      aria-label={`${dogName} video testimonial`}
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
            src={urls.modal}
            poster={urls.poster}
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
                {dogName}
              </div>
              <div className="mt-1">
                <StarRow rating={clip.rating} />
              </div>
            </div>
            <span className="bg-[#06B6D4]/10 text-[#06B6D4] text-xs font-semibold rounded-full px-2 py-1">
              {label}
            </span>
          </div>
          {clip.quote && (
            <p className="text-sm text-gray-700 mt-3 leading-relaxed">
              {clip.quote}
            </p>
          )}
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
