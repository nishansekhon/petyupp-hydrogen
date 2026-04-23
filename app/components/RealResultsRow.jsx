import {useRef, useState} from 'react';
import {getHomepageClips} from '~/lib/ugcManifest';
import VideoCard from '~/components/ugc/VideoCard';
import VideoModal from '~/components/ugc/VideoModal';

export default function RealResultsRow() {
  const clips = getHomepageClips();

  const [active, setActive] = useState(null);
  const lastTriggerRef = useRef(null);
  const cardRefs = useRef({});

  const handleOpen = (clip) => {
    lastTriggerRef.current = cardRefs.current[clip.problemTag] ?? null;
    setActive(clip);
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
        {clips.map((clip) => (
          <div
            key={clip.slug}
            className="shrink-0 snap-start w-[160px] md:w-[240px]"
          >
            <VideoCard
              clip={clip}
              onOpen={handleOpen}
              modalOpen={active !== null}
              cardRef={(el) => {
                cardRefs.current[clip.problemTag] = el;
              }}
            />
          </div>
        ))}
      </div>

      {active && <VideoModal clip={active} onClose={handleClose} />}
    </section>
  );
}
