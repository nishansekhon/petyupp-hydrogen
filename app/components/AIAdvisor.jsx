import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
} from 'react';
import {Link} from 'react-router';
import {CartForm, Money} from '@shopify/hydrogen';

const ENDPOINT = '/api/ai-advisor';
const MAX_HISTORY = 10;

const FALLBACK_ERROR =
  'Our advisor is taking a break. Browse products instead.';

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

function ProductCard({product}) {
  const {handle, title, url, image, price, variantId, available, reason} = product;
  const amount = price?.amount != null ? Number(price.amount) : null;
  const freeShipping = amount != null && amount >= 49;

  return (
    <article className="flex-shrink-0 w-60 md:w-auto snap-center bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
      <Link to={url} className="block p-3 pb-0" prefetch="intent">
        {image?.url ? (
          <img
            src={image.url}
            alt={image.altText || title}
            width={image.width || 400}
            height={image.height || 400}
            loading="lazy"
            decoding="async"
            className="aspect-square w-full object-cover rounded-xl"
          />
        ) : (
          <div
            aria-hidden="true"
            className="aspect-square w-full rounded-xl bg-gray-100 flex items-center justify-center text-3xl text-gray-300"
          >
            🐾
          </div>
        )}
      </Link>
      <div className="p-3 pt-2 flex flex-col flex-1">
        <Link to={url} prefetch="intent" className="block">
          <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 hover:text-[#06B6D4] transition-colors">
            {title}
          </h3>
        </Link>
        {reason ? (
          <p className="italic text-sm text-gray-500 mt-1 leading-snug line-clamp-3">
            {reason}
          </p>
        ) : null}
        <div className="flex items-baseline gap-2 mt-2">
          {price ? (
            <span className="font-bold text-gray-900 text-base">
              <Money data={price} />
            </span>
          ) : null}
          {freeShipping ? (
            <span className="text-[10px] text-green-600 font-semibold">
              Free shipping
            </span>
          ) : null}
        </div>
        <div className="mt-auto pt-3">
          {variantId && available ? (
            <CartForm
              route="/cart"
              inputs={{lines: [{merchandiseId: variantId, quantity: 1}]}}
              action={CartForm.ACTIONS.LinesAdd}
            >
              {(fetcher) => (
                <button
                  type="submit"
                  disabled={fetcher.state !== 'idle'}
                  className="w-full py-2.5 rounded-lg bg-[#06B6D4] hover:bg-[#0891B2] text-white font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {fetcher.state === 'idle' ? 'Add to Cart' : 'Adding…'}
                </button>
              )}
            </CartForm>
          ) : (
            <Link
              to={url}
              prefetch="intent"
              className="block text-center w-full py-2.5 rounded-lg border border-gray-200 text-sm font-semibold text-gray-600 hover:border-[#06B6D4] hover:text-[#06B6D4] transition-colors"
            >
              View product
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

function ProductRecommendations({products}) {
  if (!Array.isArray(products) || products.length === 0) return null;
  return (
    <div className="-mx-1 mt-3 flex gap-3 overflow-x-auto pb-2 snap-x px-1 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:pb-0 md:mx-0 md:px-0">
      {products.map((p) => (
        <ProductCard key={p.handle} product={p} />
      ))}
    </div>
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
  const intro = turn.intro || turn.content || '';
  return (
    <div className="flex justify-start">
      <div className="bg-gray-50 border border-gray-100 rounded-xl rounded-bl-sm px-3.5 py-3 max-w-full w-full">
        {intro ? (
          <p className="text-sm text-gray-800 leading-snug whitespace-pre-wrap">
            {intro}
          </p>
        ) : null}
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
          intro,
          products,
          content: intro,
          rawContent: payload.raw || intro || '',
        },
      ]);
      setPending(false);
    } catch (err) {
      console.error(err);
      setError(FALLBACK_ERROR);
      setPending(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
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
          disabled={pending}
          placeholder="What's going on with your dog?"
          className="w-full border-2 border-[#06B6D4] rounded-xl shadow-lg bg-white px-5 py-4 pr-28 md:pr-32 text-sm md:text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-400 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => submit()}
          disabled={pending || input.trim().length === 0}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#06B6D4] hover:bg-[#0891B2] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {pending ? 'Asking…' : 'Ask AI →'}
        </button>
      </div>

      {(turns.length > 0 || pending || error) && (
        <div
          ref={scrollRef}
          aria-live="polite"
          className="mt-5 max-h-[520px] overflow-y-auto flex flex-col gap-3 pr-1"
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
