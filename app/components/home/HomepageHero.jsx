import {useRef} from 'react';

const QUICK_PROBLEMS = [
  {icon: '🦷', label: 'Bad breath'},
  {icon: '🪑', label: 'Destroys furniture'},
  {icon: '😰', label: 'Anxious alone'},
  {icon: '🦴', label: 'Joint stiffness'},
];

export default function HomepageHero() {
  const inputRef = useRef(null);

  const scrollToProducts = () => {
    const target = document.querySelector('#homepage-products');
    if (target) {
      target.scrollIntoView({behavior: 'smooth', block: 'start'});
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    scrollToProducts();
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
          <form onSubmit={handleSubmit} className="relative max-w-xl">
            <label htmlFor="hero-ai-input" className="sr-only">
              Describe your dog&rsquo;s problem
            </label>
            <input
              id="hero-ai-input"
              ref={inputRef}
              type="text"
              placeholder="e.g. My dog has bad breath and chews everything"
              className="w-full border-2 border-[#06B6D4] rounded-xl shadow-sm bg-white px-5 py-4 pr-32 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#06B6D4]/40"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#06B6D4] hover:bg-[#0891B2] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Ask AI →
            </button>
          </form>
          <div className="flex flex-wrap gap-2 mt-4">
            {QUICK_PROBLEMS.map((problem) => (
              <button
                key={problem.label}
                type="button"
                onClick={() => {
                  if (inputRef.current) {
                    inputRef.current.value = `My dog has ${problem.label.toLowerCase()}`;
                    inputRef.current.focus();
                  }
                }}
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
          className="hero-placeholder relative hidden md:flex aspect-[4/5] bg-gradient-to-b from-cyan-50 to-cyan-100 rounded-bl-[48px] rounded-tr-[24px] items-center justify-center overflow-hidden"
        >
          <div className="text-center">
            <div className="text-8xl mb-2">🐕</div>
            <p className="text-xs text-cyan-700/70 font-medium uppercase tracking-wider">
              Lifestyle photo
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
