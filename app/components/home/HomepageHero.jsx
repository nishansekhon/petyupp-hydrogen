import {useEffect, useRef, useState} from 'react';
import {ChevronRight, Leaf} from 'lucide-react';
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
  {
    emoji: '🐕‍🦺',
    label: 'We have multiple dogs',
    query:
      'We have multiple dogs — looking for products that work for a multi-dog household, ideally in packs or larger sizes so we are not re-ordering constantly.',
  },
  {
    emoji: '🏕️',
    label: 'Outdoor kennel setup',
    query:
      'Our dog lives in an outdoor kennel setup. We need heavy-duty, weather-resistant feeding and watering gear that can handle the elements.',
  },
  {
    emoji: '🏠',
    label: 'In a crate during the day',
    query:
      'Our dog is crated during the workday. Looking for bowls or buckets that attach to the crate, plus long-lasting chews that keep them occupied.',
  },
];

function renderChip(problem, onClick) {
  return (
    <button
      key={problem.label}
      type="button"
      onClick={() => onClick(problem.query)}
      className="group flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-full text-xs font-semibold text-gray-600 shadow-sm hover:bg-[#06B6D4]/10 hover:border-[#06B6D4]/40 hover:text-[#06B6D4] hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200 ease-out cursor-pointer select-none whitespace-nowrap text-center leading-tight flex-shrink-0 snap-start"
    >
      <span
        aria-hidden="true"
        className="text-sm opacity-70 group-hover:opacity-100 transition-opacity"
      >
        {problem.emoji}
      </span>
      {problem.label}
    </button>
  );
}

function ScrollableChipRow({chips, onClick}) {
  const scrollRef = useRef(null);
  const [hinting, setHinting] = useState(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (window.matchMedia('(min-width: 640px)').matches) return;

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    let cancelled = false;
    let rafId = null;
    let startTimer = null;
    let pauseTimer = null;
    const speedPxPerMs = 30 / 1000;
    const pauseMs = 1000;
    const startDelayMs = 800;

    const stop = () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (startTimer) clearTimeout(startTimer);
      if (pauseTimer) clearTimeout(pauseTimer);
      setHinting(false);
    };

    const events = ['touchstart', 'mousedown', 'wheel', 'pointerdown'];
    events.forEach((e) =>
      el.addEventListener(e, stop, {once: true, passive: true}),
    );

    if (!reducedMotion) {
      const animate = (direction, startTime, startScroll) => {
        const step = (now) => {
          if (cancelled) return;
          const elapsed = now - startTime;
          const pos = startScroll + direction * speedPxPerMs * elapsed;
          const max = el.scrollWidth - el.clientWidth;
          if (direction > 0 && pos >= max) {
            el.scrollLeft = max;
            pauseTimer = setTimeout(() => {
              if (cancelled) return;
              animate(-1, performance.now(), max);
            }, pauseMs);
            return;
          }
          if (direction < 0 && pos <= 0) {
            el.scrollLeft = 0;
            return;
          }
          el.scrollLeft = pos;
          rafId = requestAnimationFrame(step);
        };
        rafId = requestAnimationFrame(step);
      };
      startTimer = setTimeout(() => {
        if (cancelled) return;
        animate(1, performance.now(), 0);
      }, startDelayMs);
    }

    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (startTimer) clearTimeout(startTimer);
      if (pauseTimer) clearTimeout(pauseTimer);
      events.forEach((e) => el.removeEventListener(e, stop));
    };
  }, []);

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex flex-row overflow-x-auto gap-2 -mx-4 px-4 pb-2 snap-x snap-mandatory scrollbar-hide"
      >
        {chips.map((problem) => renderChip(problem, onClick))}
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[#FDF8F4] to-transparent"
      />
      <ChevronRight
        aria-hidden="true"
        strokeWidth={2.5}
        className={`petyupp-chip-chevron-pulse pointer-events-none absolute right-1 top-1/2 w-5 h-5 text-[#06B6D4] transition-opacity duration-300 ${
          hinting ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}

export default function HomepageHero() {
  const advisorRef = useRef(null);

  const handleChipClick = (query) => {
    advisorRef.current?.submitQuery(query);
  };

  return (
    <section className="homepage-hero bg-[#FDF8F4] pt-1 md:pt-4 lg:pt-6 pb-0">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-[11fr_9fr] gap-3 sm:gap-6 md:gap-10 items-start">
        <div className="flex flex-col">
          <div className="hidden sm:block w-12 h-1 bg-teal-500 rounded-full mb-2"></div>
          <p className="hidden sm:block font-heading text-sm font-bold tracking-[0.2em] uppercase text-[#06B6D4] mb-2">
            Natural relief for dogs
          </p>
          <h1 className="font-heading font-medium text-gray-900 text-lg sm:text-xl md:text-3xl lg:text-4xl xl:text-5xl leading-[1.25] sm:leading-tight sm:tracking-tight mt-0 sm:mt-3 mb-3 sm:mb-4">
            <span className="block">Your dog deserves the best.</span>
            <span className="block italic" style={{color: '#5A7664'}}>
              Nature made it.<Leaf
                aria-hidden="true"
                className="inline-block align-[-0.125em] ml-1"
                style={{width: '0.7em', height: '0.7em', strokeWidth: 1.75}}
              />
            </span>
          </h1>
          <AIAdvisor ref={advisorRef} />

          {/* Mobile: 2 scrollable rows. Auto-scroll on mount + pulsing chevron
              signal "swipe" until first user interaction. */}
          <div className="flex flex-col gap-2 sm:hidden mt-3">
            {[
              {id: 'row-1', chips: QUICK_PROBLEMS.slice(0, 8)},
              {id: 'row-2', chips: QUICK_PROBLEMS.slice(8)},
            ].map(({id, chips}) => (
              <ScrollableChipRow
                key={id}
                chips={chips}
                onClick={handleChipClick}
              />
            ))}
          </div>

          {/* Desktop: single flex-wrap row (unchanged layout) */}
          <div className="hidden sm:flex sm:flex-wrap sm:gap-3 sm:mt-4">
            {QUICK_PROBLEMS.map((problem) => renderChip(problem, handleChipClick))}
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
