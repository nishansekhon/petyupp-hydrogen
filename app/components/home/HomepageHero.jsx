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
    <section className="homepage-hero max-w-7xl mx-auto px-4 py-12 md:py-20">
      <div className="grid grid-cols-1 md:grid-cols-[55%_45%] gap-10 items-center">
        <div>
          <p className="text-xs font-semibold text-[#06B6D4] tracking-widest uppercase mb-4">
            Problem-first pet care
          </p>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
            Your dog&rsquo;s problem.
            <br />
            Our natural solution.
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
          className="hero-placeholder relative hidden md:block aspect-[4/5] rounded-bl-[48px] rounded-tr-[24px] overflow-hidden"
        >
          <img
            src="https://res.cloudinary.com/petyupp-lifestyle/image/upload/w_800,f_auto,q_auto/v1776620340/nicholas-brownlow-lx_KwA7hlLU-unsplash_g37voz.jpg"
            alt="Happy dog parent kissing their golden retriever"
            className="w-full h-full object-cover"
            loading="eager"
            width="800"
            height="1000"
          />
        </div>
      </div>
    </section>
  );
}
