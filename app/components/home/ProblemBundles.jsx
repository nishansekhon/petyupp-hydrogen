import React from 'react';

const bundles = [
  {
        id: 1,
        name: 'Separation Anxiety',
        description: 'Calming chews and long-lasting treats to keep your pup relaxed',
  },
  {
        id: 2,
        name: 'Destructive Chewing',
        description: 'Tough natural chews that satisfy the urge to chomp',
  },
  {
        id: 3,
        name: 'Dental Health',
        description: 'Chews that clean teeth and freshen breath naturally',
  },
  {
        id: 4,
        name: 'Joint Support',
        description: 'Nutrient-rich treats for active and aging dogs',
  },
  {
        id: 5,
        name: 'Digestive Issues',
        description: 'Gentle, natural ingredients for sensitive stomachs',
  },
  {
        id: 6,
        name: 'Hyperactivity',
        description: 'Long-lasting chews to burn mental energy',
  },
  ];

const ProblemBundles = () => {
    return (
          <section className="py-16 bg-white">
            <div className="max-w-6xl mx-auto px-4">
    {/* Heading */}
              <div className="text-center mb-10">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                  Solutions for Every Pup Problem
      </h2>
            <p className="mt-2 text-gray-500 text-base">
                  Curated bundles for common dog concerns
      </p>
      </div>

  {/* Scroll container */}
          <div
          className="flex gap-6 overflow-x-auto pb-4"
          style={{
                        scrollSnapType: 'x mandatory',
                        WebkitOverflowScrolling: 'touch',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
          }}
        >
{bundles.map((bundle) => (
              <div
                           key={bundle.id}
              className="flex-shrink-0 bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col"
              style={{
                                scrollSnapAlign: 'start',
                                width: 'calc(33.333% - 16px)',
                                minWidth: '260px',
              }}
            >
{/* Problem heading */}
              <h3 className="text-xl font-bold text-gray-900 mb-3">
              {bundle.name}
                </h3>

{/* Description */}
              <p className="text-gray-500 text-sm mb-6 flex-1">
              {bundle.description}
                </p>

{/* CTA button */}
              <button
                className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all hover:opacity-90 active:scale-95"
                style={{ background: '#06B6D4' }}
              >
                Shop Bundle &rarr;
</button>
  </div>
          ))}
</div>
            </div>

{/* Hide scrollbar cross-browser */}
      <style>{`
              .problem-bundles-scroll::-webkit-scrollbar { display: none; }
                    `}</style>
        </section>
  );
};

export default ProblemBundles;
