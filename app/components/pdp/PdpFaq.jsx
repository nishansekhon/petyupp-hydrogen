export default function PdpFaq({faqs}) {
  if (!faqs?.length) return null;
  return (
    <section className="mt-8" aria-label="Frequently asked questions">
      <h2 className="text-xl font-medium text-gray-900 mb-4">Questions</h2>
      <ul className="divide-y divide-gray-200 border-t border-b border-gray-200">
        {faqs.map(({question, answer}) => (
          <li key={question}>
            <details className="group">
              <summary className="flex items-center justify-between py-4 cursor-pointer list-none text-sm font-medium text-gray-900 hover:text-[#06B6D4]">
                <span>{question}</span>
                <span
                  aria-hidden
                  className="text-gray-400 transition-transform group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="pb-4 text-sm text-gray-700 leading-relaxed">
                {answer}
              </p>
            </details>
          </li>
        ))}
      </ul>
    </section>
  );
}
