import React from 'react';

const bundles = [
  {
        id: 1,
        name: 'Separation Anxiety',
        description: 'Calming chews and long-lasting treats to keep your pup relaxed',
        image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop',
  },
  {
        id: 2,
        name: 'Destructive Chewing',
        description: 'Tough natural chews that satisfy the urge to chomp',
        image: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=400&h=300&fit=crop',
  },
  {
        id: 3,
        name: 'Dental Health',
        description: 'Chews that clean teeth and freshen breath naturally',
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
  },
  {
        id: 4,
        name: 'Joint Support',
        description: 'Nutrient-rich treats for active and aging dogs',
        image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&h=300&fit=crop',
  },
  {
        id: 5,
        name: 'Digestive Issues',
        description: 'Gentle, natural ingredients for sensitive stomachs',
        image: 'https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=400&h=300&fit=crop',
  },
  {
        id: 6,
        name: 'Hyperactivity',
        description: 'Long-lasting chews to burn mental energy',
        image: 'https://images.unsplash.com/photo-1633846445033-d2fa7b1a9fca?w=400&h=300&fit=crop',
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
              className="flex-shrink-0 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col"
              style={{
                                scrollSnapAlign: 'start',
                                width: 'calc(33.333% - 16px)',
                                minWidth: '260px',
              }}
            >
{/* Bundle Image */}
              <div className="h-40 bg-gray-200 overflow-hidden">
                <img
                  src={bundle.image}
                  alt={bundle.name}
                  className="w-full h-full object-cover"
                />
              </div>

{/* Content */}
              <div className="p-6 flex flex-col flex-1">
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
