import {useRef} from 'react';
import {AIAdvisor} from '~/components/AIAdvisor';

const QUICK_PROBLEMS = [
  {icon: '🦷', label: 'Bad breath', query: 'My dog has bad breath'},
  {
    icon: '🪑',
    label: 'Destroys furniture',
    query: 'My dog destroys furniture when I leave',
  },
  {icon: '😰', label: 'Anxious alone', query: 'My dog gets anxious when alone'},
  {icon: '🦴', label: 'Joint stiffness', query: 'My dog has joint stiffness'},
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
          <p className="text-xs font-semibold text-[#06B6D4] tracking-widest uppercase mb-4">
            Natural relief for dogs
          </p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-tight mb-4">
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
                className="text-xs text-gray-600 border border-gray-200 rounded-full px-3 py-1.5 bg-white hover:border-[#06B6D4] hover:text-[#06B6D4] transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <span aria-hidden="true">{problem.icon}</span>
                {problem.label}
              </button>
            ))}
          </div>
        </div>
        <div
          aria-hidden="true"
          className="hero-placeholder relative hidden md:block w-full h-[650px] rounded-2xl overflow-hidden shadow-2xl"
        >
          <img
            src="https://res.cloudinary.com/petyupp-lifestyle/image/upload/v1776620340/nicholas-brownlow-lx_KwA7hlLU-unsplash_g37voz.jpg"
            alt="Happy dog parent kissing their golden retriever"
            className="w-full h-full object-cover object-center"
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
