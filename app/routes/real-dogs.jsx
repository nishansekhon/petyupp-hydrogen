import {useRef, useState} from 'react';
import {Link, useLoaderData} from 'react-router';
import {
  getGalleryClips,
  problemLabels,
  problemTagOrder,
} from '~/lib/ugcManifest';
import VideoCard from '~/components/ugc/VideoCard';
import VideoModal from '~/components/ugc/VideoModal';
import {createSeoMeta, SITE_URL} from '~/lib/seo';

export const meta = ({data}) => {
  const url = data?.activeProblem
    ? `${SITE_URL}/real-dogs?problem=${data.activeProblem}`
    : `${SITE_URL}/real-dogs`;
  return createSeoMeta({
    title: 'Real Dogs — PetYupp',
    description:
      'Real dogs, real relief. Stories from pet parents who found what works — for chewing, anxiety, joint pain, and more.',
    url,
  });
};

export async function loader({request}) {
  const url = new URL(request.url);
  const problemParam = url.searchParams.get('problem');
  const activeProblem = problemTagOrder.includes(problemParam)
    ? problemParam
    : null;

  const clips = getGalleryClips({problemTag: activeProblem});
  const totalClips = getGalleryClips().length;

  return {clips, activeProblem, totalClips};
}

function FilterChips({activeProblem}) {
  const chips = [
    {slug: null, label: 'All'},
    ...problemTagOrder.map((slug) => ({slug, label: problemLabels[slug]})),
  ];

  return (
    <div
      className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4 pb-2"
      role="navigation"
      aria-label="Filter by problem"
    >
      {chips.map((chip) => {
        const isActive = chip.slug === activeProblem;
        const to = chip.slug ? `/real-dogs?problem=${chip.slug}` : '/real-dogs';
        return (
          <Link
            key={chip.label}
            to={to}
            prefetch="intent"
            aria-current={isActive ? 'page' : undefined}
            className={`shrink-0 inline-flex items-center rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
              isActive
                ? 'bg-[#06B6D4] text-white border-[#06B6D4]'
                : 'bg-[#FDF8F4] text-slate-800 border-gray-200 hover:border-[#06B6D4] hover:text-[#06B6D4]'
            }`}
          >
            {chip.label}
          </Link>
        );
      })}
    </div>
  );
}

export default function RealDogs() {
  const {clips, activeProblem, totalClips} = useLoaderData();
  const [active, setActive] = useState(null);
  const lastTriggerRef = useRef(null);
  const cardRefs = useRef({});

  const handleOpen = (clip) => {
    lastTriggerRef.current = cardRefs.current[clip.slug] ?? null;
    setActive(clip);
  };

  const handleClose = () => {
    setActive(null);
    requestAnimationFrame(() => {
      lastTriggerRef.current?.focus?.();
    });
  };

  return (
    <div className="bg-[#FDF8F4] min-h-screen">
      <section className="max-w-7xl mx-auto px-4 py-10 md:py-16">
        <header className="text-center mb-6 md:mb-10">
          <h1 className="text-3xl md:text-5xl font-bold text-gray-900">
            Real dogs, real relief
          </h1>
          <p className="text-sm md:text-base text-gray-600 mt-3">
            {totalClips} stories from real pet parents
          </p>
        </header>

        <div className="mb-6 md:mb-10">
          <FilterChips activeProblem={activeProblem} />
        </div>

        {clips.length === 0 ? (
          <p className="text-center text-gray-500 py-16">
            No clips found for this filter.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {clips.map((clip) => (
              <VideoCard
                key={clip.slug}
                clip={clip}
                onOpen={handleOpen}
                modalOpen={active !== null}
                cardRef={(el) => {
                  cardRefs.current[clip.slug] = el;
                }}
              />
            ))}
          </div>
        )}
      </section>

      {active && <VideoModal clip={active} onClose={handleClose} />}
    </div>
  );
}
