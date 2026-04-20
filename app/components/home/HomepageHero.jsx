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
    emoji: '🐶',
    label: 'Puppy teething on everything',
    query:
      'My puppy is teething and chewing everything — shoes, furniture, hands. Need safe natural puppy chews.',
  },
  {
    emoji: '🧀',
    label: 'Healthy treat that lasts hours',
    query:
      'I need a long-lasting natural treat that keeps my dog busy for hours. Not rawhide.',
  },
  {
    emoji: '🐾',
    label: 'Destroys every toy in minutes',
    query:
      'My dog shreds every toy in minutes. Need something durable and safe for aggressive chewers.',
  },
  {
    emoji: '🦴',
    label: 'Safe rawhide alternative',
    query:
      'I want to stop giving rawhide. What natural chew alternatives are safe and long-lasting?',
  },
  {
    emoji: '🏠',
    label: 'Bored home alone all day',
    query:
      'My dog is alone 8 hours a day and gets bored and destructive. Need long-lasting chews to keep them busy.',
  },
  {
    emoji: '🪵',
    label: 'Loves chewing sticks outside',
    query:
      'My dog always chews sticks on walks. Want a safe natural wood chew alternative for indoors.',
  },
  {
    emoji: '⚡',
    label: 'Eats way too fast',
    query:
      'My dog inhales food in seconds and throws up. Need a slow feeder bowl or solution.',
  },
  {
    emoji: '🍽️',
    label: 'Bowl slides across the floor',
    query:
      'My dog pushes the food bowl across the floor while eating. Need a non-skid mat or heavy bowl.',
  },
  {
    emoji: '🐕',
    label: 'Slowing down on walks',
    query:
      'My older dog is getting stiff and limping on walks. Looking for natural joint support chews.',
  },
  {
    emoji: '📐',
    label: 'Big dog strains to eat',
    query:
      "My large dog bends down too far to eat and it's uncomfortable. Need an elevated diner or raised bowl stand.",
  },
];

export default function HomepageHero() {
  const advisorRef = useRef(null);

  const handleChipClick = (label) => {
    advisorRef.current?.submitQuery(label);
  };

  return (
    <section className="homepage-hero bg-[#FDF8F4] pt-32 md:pt-36 pb-0">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-[55%_45%] gap-6 md:gap-10 items-start">
        <div className="flex flex-col">
          <div className="w-12 h-1 bg-teal-500 rounded-full mb-4"></div>
          <p className="font-heading text-sm font-bold tracking-[0.2em] uppercase text-[#06B6D4] mb-4">
            Natural relief for dogs
          </p>
          <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight mb-4">
            Your dog deserves the best.
            <br />
            Nature made it.
          </h1>
          <p className="text-base text-gray-500 mb-6 max-w-xl">
            Tell us about your dog — our AI picks the perfect natural chews,
            toys, and treats they&rsquo;ll love.
          </p>
          <AIAdvisor ref={advisorRef} />
          <div className="flex items-center gap-2 mt-4 mb-1 ml-1">
            <svg width="32" height="28" viewBox="0 0 28 24" fill="none" className="text-[#06B6D4] flex-shrink-0" style={{transform: 'rotate(15deg)'}}>
              <path d="M2 2C8 4 14 12 16 20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" strokeDasharray="2 3"/>
              <path d="M12 18L16 22L18 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
            <span className="text-sm text-gray-500 font-medium tracking-wide">or just tap one</span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            {QUICK_PROBLEMS.map((problem, index) => (
              <button
                key={problem.label}
                type="button"
                onClick={() => handleChipClick(problem.label)}
                className={`group flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-full text-xs font-semibold text-gray-600 shadow-sm hover:bg-[#06B6D4]/10 hover:border-[#06B6D4]/40 hover:text-[#06B6D4] hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200 ease-out cursor-pointer select-none whitespace-normal sm:whitespace-nowrap text-center leading-tight min-w-0 w-full sm:w-auto ${
                  index >= 8 ? 'hidden sm:inline-flex' : ''
                }`}
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
          className="hero-placeholder relative block rounded-l-2xl overflow-hidden shadow-2xl"
        >
          <img
            src="https://res.cloudinary.com/petyupp-lifestyle/image/upload/w_800,f_auto,q_auto/v1776620340/nicholas-brownlow-lx_KwA7hlLU-unsplash_g37voz.jpg"
            alt="Happy dog parent kissing their golden retriever"
            className="w-full h-auto max-h-[250px] md:max-h-[600px] object-cover rounded-l-2xl"
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
