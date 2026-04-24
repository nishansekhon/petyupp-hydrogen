// Placeholder until a real review source (Judge.me, Stamped, etc.) is wired up.
// Renders a static summary + one sample quote so the section doesn't look empty.
export default function PdpReviewsSection({
  rating = 4.8,
  count = 234,
  productTitle,
}) {
  return (
    <section className="mt-8" aria-label="Reviews">
      <div className="flex items-baseline gap-3 mb-4">
        <h2 className="text-xl font-medium text-gray-900">Reviews</h2>
        <span className="text-yellow-400" aria-hidden>
          ★★★★★
        </span>
        <span className="text-sm font-medium text-gray-900">
          {rating.toFixed(1)}
        </span>
        <span className="text-sm text-gray-500">· {count} reviews</span>
      </div>
      <figure className="border border-gray-200 rounded-lg p-4 bg-[#FDF8F4]">
        <blockquote className="text-sm text-gray-700 leading-relaxed">
          &ldquo;My dog is obsessed
          {productTitle ? ` with the ${productTitle}` : ''}. It lasts longer
          than anything else I&rsquo;ve tried and she&rsquo;s not bored of it
          weeks in.&rdquo;
        </blockquote>
        <figcaption className="mt-2 text-xs text-gray-500">
          Verified purchaser
        </figcaption>
      </figure>
      <p className="text-xs text-gray-500 mt-3">
        Aggregated rating placeholder &mdash; full review integration pending.
      </p>
    </section>
  );
}
