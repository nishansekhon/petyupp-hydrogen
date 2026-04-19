import {useRef} from 'react';
import {AIAdvisor} from '~/components/AIAdvisor';

const QUICK_PROBLEMS = [
  {
    emoji: '🐾',
    label: 'Chews everything in sight',
    query:
      'My dog chews everything — furniture, shoes, walls. I need something safe to redirect the chewing.',
  },
  {
    emoji: '😰',
    label: 'Cries when I leave',
    query:
      "My dog whines and barks the whole time I'm gone. Separation anxiety is really bad.",
  },
  {
    emoji: '🦷',
    label: 'Breath smells terrible',
    query:
      "My dog's breath is really bad. Looking for natural dental chews that actually work.",
  },
  {
    emoji: '🦴',
    label: 'Slowing down on walks',
    query:
      'My older dog is getting stiff and slowing down on walks. Need joint support.',
  },
  {
    emoji: '🤢',
    label: 'Upset stomach often',
    query:
      'My dog throws up or has diarrhea frequently. Sensitive stomach.',
  },
  {
    emoji: '⚡',
    label: "Won't calm down",
    query:
      'My dog is constantly hyper and won\u2019t settle. Needs something to take the edge off.',
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
          <div className="flex flex-wrap gap-2 mt-3">
            {QUICK_PROBLEMS.map((problem, index) => (
              <button
                key={problem.label}
                type="button"
                onClick={() => handleChipClick(problem.query)}
                className={`${
                  index >= 4 ? 'hidden md:inline-flex' : 'inline-flex'
                } items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 rounded-full text-sm font-semibold text-gray-700 hover:border-[#06B6D4] hover:text-[#06B6D4] hover:shadow-md transition-all duration-200 cursor-pointer`}
              >
                <span aria-hidden="true">{problem.emoji}</span>
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
