import {useRef, useState} from 'react';
import {getPdpClips} from '~/lib/ugcManifest';
import VideoCard from '~/components/ugc/VideoCard';
import VideoModal from '~/components/ugc/VideoModal';

export default function PdpUgcSection({productHandle, productTitle}) {
  const clips = getPdpClips(productHandle, {limit: 6});
  const [startIndex, setStartIndex] = useState(null);
  const lastTriggerRef = useRef(null);
  const cardRefs = useRef({});

  if (!clips?.length) return null;

  const handleOpen = (clip) => {
    lastTriggerRef.current = cardRefs.current[clip.slug] ?? null;
    const idx = clips.findIndex((c) => c.slug === clip.slug);
    setStartIndex(idx >= 0 ? idx : 0);
  };

  const handleClose = () => {
    setStartIndex(null);
    requestAnimationFrame(() => {
      lastTriggerRef.current?.focus?.();
    });
  };

  const modalOpen = startIndex !== null;

  return (
    <section className="mt-8" aria-label={`Real dogs using ${productTitle}`}>
      <h2 className="text-xl font-medium text-gray-900 mb-4">
        Real dogs using {productTitle}
      </h2>
      <div className="flex gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-hide -mx-4 px-4">
        {clips.map((clip) => (
          <div
            key={clip.slug}
            className="shrink-0 snap-start w-[160px] md:w-[180px] lg:w-[200px]"
          >
            <VideoCard
              clip={clip}
              onOpen={handleOpen}
              modalOpen={modalOpen}
              cardRef={(el) => {
                cardRefs.current[clip.slug] = el;
              }}
              compact
            />
          </div>
        ))}
      </div>

      {modalOpen && (
        <VideoModal
          clips={clips}
          startIndex={startIndex}
          onClose={handleClose}
        />
      )}
    </section>
  );
}
