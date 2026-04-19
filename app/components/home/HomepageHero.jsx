import {useRef} from 'react';
import {AIAdvisor} from '~/components/AIAdvisor';

const QUICK_PROBLEMS = [
  {
    emoji: '🦷',
    label: 'Breath smells terrible',
    query:
      "My dog's breath is really bad. Looking for natural dental chews that actually clean teeth.",
  },
  {
    emoji: '😰',
    label: 'Cries when I leave',
    query:
      "My dog whines and gets destructive when I'm gone. Need something to keep them calm and busy.",
  },
  {
    emoji: '🐾',
    label: 'Destroys every toy',
    query:
      'My dog shreds every toy in minutes. I need something durable and safe for aggressive chewers.',
  },
  {
    emoji: '🦴',
    label: 'Safe rawhide alternative',
    query:
      'I want to stop giving rawhide. What natural chew alternatives are safe and long-lasting?',
  },
  {
    emoji: '⚡',
    label: 'Eats way too fast',
    query:
      'My dog inhales food in seconds and then throws up. Need a slow feeder bowl or solution.',
  },
  {
    emoji: '🍽️',
    label: 'Food bowl slides everywhere',
    query:
      'My dog pushes the bowl across the floor while eating. Need a non-skid mat or heavy bowl.',
  },
  {
    emoji: '🐕',
    label: 'Slowing down on walks',
    query:
      'My older dog is getting stiff on walks. Looking for joint support chews.',
  },
  {
    emoji: '🪵',
    label: 'Loves chewing sticks outside',
    query:
      'My dog always chews sticks on walks. Want a safe natural wood chew alternative for indoors.',
  },
];

export default function HomepageHero() {
  const advisorRef = useRef(null);

  const handleChipClick = (query) => {
    advisorRef.current?.submitQuery(query);
  };

  return (
    <section className="homepage-hero bg-[#FDF8F4] pt-8 md:pt-12 pb-0">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-[55%_45%] gap-10 items-center">
        <div className="flex flex-col justify-center min-h-[400px] md:min-h-[480px]">
          <div className="w-12 h-1 bg-teal-500 rounded-full mb-4"></div>
          <p className="font-heading text-sm font-bold tracking-[0.2em] uppercase text-[#06B6D4] mb-4">
            Natural relief for dogs
          </p>
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight mb-4">
            Your dog deserves relief.
            <br />
            Nature provides it.
          </h1>
          <p className="text-base text-gray-500 mb-6 max-w-xl">
            Describe what&rsquo;s going on — our AI matches your dog to
            vet-approved chews and treats that actually help.
          </p>
          <AIAdvisor ref={advisorRef} />
          <div className="flex flex-wrap gap-2 mt-4">
            {QUICK_PROBLEMS.map((problem) => (
              <button
                key={problem.label}
                type="button"
                onClick={() => handleChipClick(problem.query)}
                className="group inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-full text-xs font-semibold text-gray-600 shadow-sm hover:bg-[#06B6D4]/10 hover:border-[#06B6D4]/40 hover:text-[#06B6D4] hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200 ease-out cursor-pointer select-none whitespace-nowrap"
              >
                <span
                  aria-hidden="true"
                  className="text-sm opacity-70 group-hover:opacity-100 transition-opacity"
                >
                  {problem.emoji}
                </span>
                {problem.label}
              </button>
            ))}
          </div>
        </div>
        <div
          aria-hidden="true"
          className="hero-placeholder relative hidden md:block rounded-2xl overflow-hidden shadow-2xl"
        >
          <img
            src="https://res.cloudinary.com/petyupp-lifestyle/image/upload/w_800,f_auto,q_auto/v1776620340/nicholas-brownlow-lx_KwA7hlLU-unsplash_g37voz.jpg"
            alt="Happy dog parent kissing their golden retriever"
            className="w-full h-auto rounded-2xl"
            loading="eager"
            width="800"
            height="1000"
          />
        </div>
        </div>
      </div>
    </section>
  );
}
