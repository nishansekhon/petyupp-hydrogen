import {useEffect, useImperativeHandle, useRef, useState, forwardRef} from 'react';
import {Link} from 'react-router';

const ENDPOINT = '/api/ai-advisor';
const MAX_HISTORY = 10;

const FALLBACK_ERROR =
  'Our advisor is taking a break. Browse products instead.';

function isValidCategory(category) {
  return typeof category === 'string' && /^[a-z0-9][a-z0-9-]*$/i.test(category);
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

function ProductRecommendations({products}) {
  if (!Array.isArray(products) || products.length === 0) return null;
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
      {products.slice(0, 4).map((product, idx) => {
        const category = isValidCategory(product?.category)
          ? product.category
          : null;
        return (
          <li
            key={`${product?.title ?? 'rec'}-${idx}`}
            className="bg-white rounded-xl border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,.04)] p-3 flex flex-col gap-2"
          >
            <div>
              <p className="text-sm font-semibold text-gray-900 leading-snug">
                {product?.title || 'Recommended'}
              </p>
              {product?.reason && (
                <p className="text-xs text-gray-500 mt-1 leading-snug">
                  {product.reason}
                </p>
              )}
            </div>
            {category ? (
              <Link
                to={`/collections/${category}`}
                className="self-start bg-[#06B6D4] hover:bg-[#0891B2] text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1"
              >
                Add + <span aria-hidden="true">→</span>
              </Link>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function MessageBubble({turn}) {
  if (turn.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="bg-[#06B6D4] text-white text-sm rounded-xl rounded-br-sm px-3.5 py-2 max-w-[85%]">
          {turn.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start">
      <div className="bg-gray-50 border border-gray-100 rounded-xl rounded-bl-sm px-3.5 py-3 max-w-full">
        <p className="text-sm text-gray-800 leading-snug whitespace-pre-wrap">
          {turn.message || turn.content}
        </p>
        <ProductRecommendations products={turn.products} />
      </div>
    </div>
  );
}

export const AIAdvisor = forwardRef(function AIAdvisor(props, ref) {
  const [input, setInput] = useState('');
  const [turns, setTurns] = useState([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  useImperativeHandle(
    ref,
    () => ({
      focusInput: () => inputRef.current?.focus(),
      submitQuery: (text) => {
        if (text) setInput(text);
        submit(text);
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns, pending, error]);

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
          ? turn.rawContent ?? turn.content ?? ''
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
      const parsed = payload.parsed || {};
      setTurns((current) => [
        ...current,
        {
          role: 'assistant',
          message: typeof parsed.message === 'string' ? parsed.message : '',
          products: Array.isArray(parsed.products) ? parsed.products : [],
          content:
            typeof parsed.message === 'string'
              ? parsed.message
              : payload.raw || '',
          rawContent: payload.raw || '',
        },
      ]);
      setPending(false);
    } catch (err) {
      console.error(err);
      setError(FALLBACK_ERROR);
      setPending(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    submit();
  }

  return (
    <div className="ai-advisor">
      <form onSubmit={handleSubmit} className="relative max-w-xl">
        <label htmlFor="ai-advisor-input" className="sr-only">
          Describe your dog&rsquo;s problem
        </label>
        <input
          id="ai-advisor-input"
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={pending}
          placeholder="e.g. My dog has bad breath and chews everything"
          className="w-full border-2 border-[#06B6D4] rounded-xl shadow-lg bg-white px-5 py-4 pr-32 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={pending || input.trim().length === 0}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#06B6D4] hover:bg-[#0891B2] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending ? 'Asking…' : 'Ask AI →'}
        </button>
      </form>

      {(turns.length > 0 || pending || error) && (
        <div
          ref={scrollRef}
          aria-live="polite"
          className="mt-5 max-h-[480px] overflow-y-auto flex flex-col gap-3 pr-1"
        >
          {turns.map((turn, idx) => (
            <MessageBubble key={idx} turn={turn} />
          ))}
          {pending && (
            <div className="flex justify-start">
              <div className="bg-gray-50 border border-gray-100 rounded-xl rounded-bl-sm px-3.5 py-3">
                <LoadingDots />
              </div>
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
