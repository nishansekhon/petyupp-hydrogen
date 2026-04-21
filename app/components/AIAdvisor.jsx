import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
} from 'react';
import {Link} from 'react-router';
import {CartForm, Money} from '@shopify/hydrogen';
import {ThumbsUp, ThumbsDown} from 'lucide-react';

const ENDPOINT = '/api/ai-advisor';
const MAX_HISTORY = 10;
const STORAGE_KEY = 'petyupp_ai_results';
const STORAGE_TTL_MS = 30 * 60 * 1000; // 30 minutes

const FALLBACK_ERROR =
  'Our advisor is taking a break. Browse products instead.';

const STATIC_PLACEHOLDER = 'Tell us about your dog...';
const ROTATING_PLACEHOLDERS = [
  "My dog's breath smells terrible...",
  'She cries when I leave for work...',
  'Puppy is teething on everything...',
  "What's a safe rawhide alternative?",
  'He destroys every toy in minutes...',
  'Big dog who eats way too fast...',
  'Bowl slides across the floor...',
  "What's good for separation anxiety?",
];
const PLACEHOLDER_INITIAL_DELAY_MS = 1500;
const PLACEHOLDER_CYCLE_MS = 3500;
const PLACEHOLDER_FADE_MS = 200;
const PLACEHOLDER_TYPE_MS = 600;

function readSavedResults() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return null;
    if (typeof data.timestamp !== 'number') return null;
    if (Date.now() - data.timestamp >= STORAGE_TTL_MS) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function writeSavedResults(data) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function clearSavedResults() {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
}

function LoadingDots() {
  return (
    <span
      aria-label="Thinking"
      className="inline-flex items-center gap-1 text-sm text-gray-500"
    >
      <span className="animate-pulse">Thinking</span>
      <span className="inline-flex">
        <span className="animate-bounce" style={{animationDelay: '0ms'}}>.</span>
        <span className="animate-bounce" style={{animationDelay: '120ms'}}>.</span>
        <span className="animate-bounce" style={{animationDelay: '240ms'}}>.</span>
      </span>
    </span>
  );
}

const FOLLOW_UP_SUGGESTIONS = [
  {emoji: '💰', label: 'Something cheaper', query: 'Show me something more affordable'},
  {emoji: '🐶', label: 'For puppies', query: 'What about options for puppies?'},
  {emoji: '🔄', label: 'More options', query: 'Show me more options'},
];

function FollowUpChips({onFollowUp}) {
  return (
    <div className="flex gap-2 mt-3 flex-wrap">
      {FOLLOW_UP_SUGGESTIONS.map((item) => (
        <button
          key={item.label}
          type="button"
          onClick={() => onFollowUp(item.query)}
          className="text-[11px] px-3 py-1.5 border border-gray-200 rounded-full text-gray-500 hover:border-[#06B6D4] hover:text-[#06B6D4] transition-all"
        >
          <span aria-hidden="true" className="mr-1">
            {item.emoji}
          </span>
          {item.label}
        </button>
      ))}
    </div>
  );
}

function AdvisorAddButton({variantId}) {
  return (
    <CartForm
      route="/cart"
      inputs={{lines: [{merchandiseId: variantId, quantity: 1}]}}
      action={CartForm.ACTIONS.LinesAdd}
    >
      {(fetcher) => <AdvisorAddButtonInner fetcher={fetcher} />}
    </CartForm>
  );
}

function AdvisorAddButtonInner({fetcher}) {
  const [justAdded, setJustAdded] = useState(false);
  const wasSubmittingRef = useRef(false);

  useEffect(() => {
    if (fetcher.state === 'submitting') {
      wasSubmittingRef.current = true;
      return;
    }
    if (fetcher.state === 'idle' && wasSubmittingRef.current && fetcher.data) {
      wasSubmittingRef.current = false;
      setJustAdded(true);
      const t = setTimeout(() => setJustAdded(false), 2000);
      return () => clearTimeout(t);
    }
  }, [fetcher.state, fetcher.data]);

  const pending = fetcher.state !== 'idle';
  const label = justAdded ? 'Added ✓' : pending ? '…' : 'Add +';
  const bg = justAdded
    ? 'bg-[#10B981] hover:bg-[#059669]'
    : 'bg-[#06B6D4] hover:bg-[#0891B2]';
  return (
    <button
      type="submit"
      disabled={pending}
      className={`text-[10px] font-semibold text-white ${bg} px-2.5 py-1 rounded-full transition-colors disabled:opacity-60`}
    >
      {label}
    </button>
  );
}

function ProductCard({product}) {
  const {title, url, image, price, variantId, available, reason} = product;
  const amountNum = price?.amount != null ? Number(price.amount) : null;
  const freeShipping = amountNum != null && amountNum >= 49;

  return (
    <article className="flex-shrink-0 w-[148px] md:w-[150px] snap-start flex flex-col bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-lg hover:scale-105 transition-all duration-200">
      <Link to={url} prefetch="intent" className="block">
        {image?.url ? (
          <img
            src={image.url}
            alt={image.altText || title}
            width={image.width || 400}
            height={image.height || 300}
            loading="lazy"
            decoding="async"
            className="aspect-[4/3] w-full object-cover bg-gray-50"
          />
        ) : (
          <div
            aria-hidden="true"
            className="aspect-[4/3] w-full bg-gray-50 flex items-center justify-center text-3xl text-gray-300"
          >
            🐾
          </div>
        )}
      </Link>
      <div className="p-2.5 flex flex-col justify-between flex-1">
        <div>
          <Link to={url} prefetch="intent">
            <h4 className="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight hover:text-[#06B6D4] transition-colors">
              {title}
            </h4>
          </Link>
          <div className="flex items-center gap-1 mt-0.5">
            <span
              aria-label="Rated 4.8 out of 5"
              className="text-[10px] text-amber-400"
            >
              ★★★★★
            </span>
            <span className="text-[9px] text-gray-400">(234)</span>
          </div>
          {reason ? (
            <p className="text-[10px] text-gray-400 italic line-clamp-1 mt-0.5">
              {reason}
            </p>
          ) : null}
        </div>
        <div className="mt-auto pt-1.5">
          <div className="flex items-center justify-between">
            {price ? (
              <span className="text-sm font-bold text-gray-900">
                <Money data={price} />
              </span>
            ) : (
              <span />
            )}
            {variantId && available ? (
              <AdvisorAddButton variantId={variantId} />
            ) : (
              <Link
                to={url}
                prefetch="intent"
                className="text-[10px] font-semibold text-gray-500 border border-gray-200 px-2.5 py-1 rounded-full hover:text-[#06B6D4] hover:border-[#06B6D4] transition-colors"
              >
                View
              </Link>
            )}
          </div>
          {freeShipping ? (
            <span className="block text-[9px] text-teal-600 font-semibold mt-1">
              FREE SHIPPING
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function ProductRecommendations({products}) {
  const stripRef = useRef(null);
  const scrollLeftBy = () =>
    stripRef.current?.scrollBy({left: -200, behavior: 'smooth'});
  const scrollRightBy = () =>
    stripRef.current?.scrollBy({left: 200, behavior: 'smooth'});

  if (!Array.isArray(products) || products.length === 0) return null;

  return (
    <div className="max-h-[340px] overflow-y-auto">
      <div className="relative group">
        <button
          type="button"
          onClick={scrollLeftBy}
          aria-label="Scroll left"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 shadow-md rounded-full flex items-center justify-center text-gray-600 hover:text-[#06B6D4] hover:shadow-lg transition-all opacity-70 hover:opacity-100"
        >
          ‹
        </button>
        <div
          ref={stripRef}
          className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide px-1"
        >
          {products.map((p) => (
            <ProductCard key={p.handle} product={p} />
          ))}
        </div>
        <button
          type="button"
          onClick={scrollRightBy}
          aria-label="Scroll right"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 shadow-md rounded-full flex items-center justify-center text-gray-600 hover:text-[#06B6D4] hover:shadow-lg transition-all opacity-70 hover:opacity-100"
        >
          ›
        </button>
      </div>
    </div>
  );
}

function FeedbackRow({query, responseId}) {
  const [rating, setRating] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (rating === null) return;
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, [rating]);

  function handleClick(value) {
    if (rating !== null) return;
    setRating(value);
    // eslint-disable-next-line no-console
    console.log('ai_feedback', {rating: value, query, response_id: responseId});
  }

  if (rating !== null) {
    return (
      <p
        className="text-sm text-teal-600 mt-3"
        style={{
          opacity: visible ? 1 : 0,
          transition: 'opacity 300ms ease-out',
        }}
      >
        Thanks for your feedback!
      </p>
    );
  }

  return (
    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
      <span className="text-xs text-gray-500">Was this helpful?</span>
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => handleClick('up')}
          aria-label="Helpful"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-gray-400 hover:text-teal-600 transition-colors"
        >
          <ThumbsUp size={16} strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={() => handleClick('down')}
          aria-label="Not helpful"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-gray-400 hover:text-teal-600 transition-colors"
        >
          <ThumbsDown size={16} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

function MessageBubble({turn, onFollowUp, onClear, query}) {
  if (turn.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="bg-[#06B6D4] text-white text-sm rounded-xl rounded-br-sm px-3.5 py-2 max-w-[85%]">
          {turn.content}
        </div>
      </div>
    );
  }
  const intro = turn.intro || turn.content || '';
  const hasProducts =
    Array.isArray(turn.products) && turn.products.length > 0;
  return (
    <div className="flex justify-start">
      <div className="bg-gray-50 border border-gray-100 rounded-xl rounded-bl-sm px-3.5 py-3 max-w-full w-full">
        {intro || onClear ? (
          <div className="flex items-start justify-between gap-2 mb-2">
            {intro ? (
              <p className="text-sm text-gray-500 italic leading-snug">
                {intro}
              </p>
            ) : (
              <span />
            )}
            {onClear ? (
              <button
                type="button"
                onClick={onClear}
                className="text-[11px] text-gray-400 hover:text-gray-600 flex-shrink-0 leading-snug"
                aria-label="Clear AI recommendations"
              >
                ✕ Clear
              </button>
            ) : null}
          </div>
        ) : null}
        <ProductRecommendations products={turn.products} />
        {hasProducts && onFollowUp ? (
          <FollowUpChips onFollowUp={onFollowUp} />
        ) : null}
        <FeedbackRow query={query} responseId={turn.id} />
      </div>
    </div>
  );
}

export const AIAdvisor = forwardRef(function AIAdvisor(props, ref) {
  const [input, setInput] = useState('');
  const [turns, setTurns] = useState([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const [placeholder, setPlaceholder] = useState(STATIC_PLACEHOLDER);
  const [placeholderFading, setPlaceholderFading] = useState(false);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const stopPlaceholderRotationRef = useRef(null);

  useImperativeHandle(
    ref,
    () => ({
      focusInput: () => inputRef.current?.focus(),
      populate: (text) => {
        const value = typeof text === 'string' ? text : '';
        setInput(value);
        requestAnimationFrame(() => {
          const node = inputRef.current;
          if (!node) return;
          node.focus();
          try {
            node.setSelectionRange(value.length, value.length);
          } catch {}
        });
      },
      submitQuery: (text) => {
        if (text) setInput(text);
        submit(text);
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Restore the latest conversation from sessionStorage once on mount
  // so users who navigate to a PDP and return keep their AI chat.
  useEffect(() => {
    const data = readSavedResults();
    if (!data) return;
    const restored = [];
    if (typeof data.query === 'string' && data.query.trim()) {
      restored.push({role: 'user', content: data.query});
    }
    const introText = typeof data.intro === 'string' ? data.intro : '';
    const savedProducts = Array.isArray(data.products) ? data.products : [];
    if (introText || savedProducts.length > 0) {
      restored.push({
        role: 'assistant',
        id: crypto.randomUUID(),
        intro: introText,
        products: savedProducts,
        content: introText,
        rawContent: introText,
      });
    }
    if (restored.length > 0) setTurns(restored);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns, pending, error]);

  // Rotating placeholder: after a short read delay, cycle through example
  // questions so users learn what to ask by example. Stops permanently on
  // focus or keystroke — then the static prompt returns.
  useEffect(() => {
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let stopped = false;
    const timeouts = new Set();
    let index = 0;

    const schedule = (fn, ms) => {
      const id = setTimeout(() => {
        timeouts.delete(id);
        if (!stopped) fn();
      }, ms);
      timeouts.add(id);
      return id;
    };

    const clearAll = () => {
      timeouts.forEach(clearTimeout);
      timeouts.clear();
    };

    const stop = () => {
      if (stopped) return;
      stopped = true;
      clearAll();
      setPlaceholderFading(false);
      setPlaceholder(STATIC_PLACEHOLDER);
    };
    stopPlaceholderRotationRef.current = stop;

    const typeIn = (target, onDone) => {
      if (reducedMotion) {
        setPlaceholder(target);
        onDone();
        return;
      }
      const perCharMs = PLACEHOLDER_TYPE_MS / Math.max(target.length, 1);
      let i = 0;
      setPlaceholder('');
      const step = () => {
        i += 1;
        setPlaceholder(target.slice(0, i));
        if (i < target.length) {
          const jitter = perCharMs * (0.8 + Math.random() * 0.4);
          schedule(step, jitter);
        } else {
          onDone();
        }
      };
      schedule(step, perCharMs);
    };

    const rotateNext = () => {
      const target =
        ROTATING_PLACEHOLDERS[index % ROTATING_PLACEHOLDERS.length];
      index += 1;

      const runTypewriter = () => {
        setPlaceholderFading(false);
        typeIn(target, () => {
          const holdMs =
            PLACEHOLDER_CYCLE_MS - PLACEHOLDER_FADE_MS - PLACEHOLDER_TYPE_MS;
          schedule(rotateNext, Math.max(holdMs, 500));
        });
      };

      if (reducedMotion) {
        runTypewriter();
        return;
      }
      setPlaceholderFading(true);
      schedule(runTypewriter, PLACEHOLDER_FADE_MS);
    };

    schedule(rotateNext, PLACEHOLDER_INITIAL_DELAY_MS);

    return () => {
      stopped = true;
      clearAll();
      stopPlaceholderRotationRef.current = null;
    };
  }, []);

  function handleClear() {
    setTurns([]);
    setInput('');
    setError(null);
    clearSavedResults();
  }

  async function submit(queryOverride) {
    const query = (queryOverride ?? input).trim();
    if (!query || pending) return;

    const userTurn = {role: 'user', content: query};
    const nextTurns = [...turns, userTurn].slice(-MAX_HISTORY);
    setTurns(nextTurns);
    setInput('');
    setPending(true);
    setError(null);

    const historyForApi = nextTurns.map((turn) => ({
      role: turn.role,
      content:
        turn.role === 'assistant'
          ? turn.rawContent ?? turn.intro ?? turn.content ?? ''
          : turn.content,
    }));

    try {
      const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {'content-type': 'application/json'},
        body: JSON.stringify({messages: historyForApi}),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(payload?.error || FALLBACK_ERROR);
        setPending(false);
        return;
      }
      const intro = typeof payload.intro === 'string' ? payload.intro : '';
      const products = Array.isArray(payload.products) ? payload.products : [];
      setTurns((current) => [
        ...current,
        {
          role: 'assistant',
          id: crypto.randomUUID(),
          intro,
          products,
          content: intro,
          rawContent: payload.raw || intro || '',
        },
      ]);
      setPending(false);
      writeSavedResults({
        query,
        intro,
        products,
        timestamp: Date.now(),
      });
    } catch (err) {
      console.error(err);
      setError(FALLBACK_ERROR);
      setPending(false);
    }
  }

  function handleKeyDown(event) {
    stopPlaceholderRotationRef.current?.();
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  function handleFocus() {
    stopPlaceholderRotationRef.current?.();
  }

  return (
    <div className="ai-advisor">
      <div className="relative max-w-xl">
        <label htmlFor="ai-advisor-input" className="sr-only">
          Describe your dog&rsquo;s needs
        </label>
        <input
          id="ai-advisor-input"
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          disabled={pending}
          placeholder={placeholder}
          className={`w-full border-2 border-[#06B6D4] rounded-xl shadow-lg bg-white px-5 py-4 pr-32 md:pr-36 text-sm md:text-base text-gray-900 placeholder:text-gray-400 placeholder:transition-opacity placeholder:duration-200 focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:opacity-60 ${placeholderFading ? 'placeholder:opacity-0' : ''}`}
        />
        <button
          type="button"
          onClick={() => submit()}
          disabled={pending || input.trim().length === 0}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#06B6D4] hover:bg-[#0891B2] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending ? 'Asking…' : '✦ Ask AI 🐾'}
        </button>
      </div>

      {(turns.length > 0 || pending || error) && (
        <div
          ref={scrollRef}
          aria-live="polite"
          className="mt-5 max-h-[520px] overflow-y-auto flex flex-col gap-3 pr-1"
        >
          {turns.map((turn, idx) => {
            const isLatestAssistant =
              turn.role === 'assistant' && idx === turns.length - 1;
            const precedingUser =
              turn.role === 'assistant' && turns[idx - 1]?.role === 'user'
                ? turns[idx - 1].content
                : '';
            return (
              <MessageBubble
                key={idx}
                turn={turn}
                onFollowUp={submit}
                onClear={isLatestAssistant ? handleClear : undefined}
                query={precedingUser}
              />
            );
          })}
          {pending && (
            <div className="flex items-center justify-center py-6 gap-1">
              <p className="text-sm text-gray-400 font-medium">
                Finding the perfect match
              </p>
              <span className="inline-flex gap-0.5">
                <span
                  className="w-1 h-1 bg-[#06B6D4] rounded-full animate-bounce"
                  style={{animationDelay: '0ms'}}
                ></span>
                <span
                  className="w-1 h-1 bg-[#06B6D4] rounded-full animate-bounce"
                  style={{animationDelay: '150ms'}}
                ></span>
                <span
                  className="w-1 h-1 bg-[#06B6D4] rounded-full animate-bounce"
                  style={{animationDelay: '300ms'}}
                ></span>
              </span>
            </div>
          )}
          {error && (
            <div className="flex justify-start">
              <div className="bg-red-50 border border-red-100 rounded-xl px-3.5 py-3 max-w-full">
                <p className="text-sm text-red-700 leading-snug">{error}</p>
                <Link
                  to="/collections/all"
                  className="inline-block mt-2 text-sm font-semibold text-[#06B6D4] hover:text-[#0891B2]"
                >
                  Browse all products →
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default AIAdvisor;
