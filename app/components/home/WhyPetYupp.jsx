import React from 'react';

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="10" fill="#06B6D4" />
    <path d="M5.5 10.5L8.5 13.5L14.5 7.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const XIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="10" cy="10" r="10" fill="#E5E7EB" />
    <path d="M7 7L13 13M13 7L7 13" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const benefits = [
  'Trusted supplier',
  'Lot-tracked freshness dating',
  'Quality inspected in Michigan',
  '100% natural, single-ingredient',
  'No artificial preservatives',
  'Free from rawhide',
  'Supports dental health naturally',
];

const WhyPetYupp = () => {
  return (
    <section className="py-12 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Why PetYupp?</h2>
          <p className="text-lg font-medium text-[#06B6D4]">See the difference.</p>
        </div>

        {/* Table Card */}
        <div className="w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm">
          {/* Column Headers */}
          <div
            className="grid bg-gray-50 border-b border-gray-200"
            style={{gridTemplateColumns: '1fr auto auto'}}
          >
            <div className="py-3 px-4">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Benefits</span>
            </div>
            <div className="py-3 px-6 text-center">
              <span className="text-xs font-semibold uppercase tracking-wide text-[#06B6D4]">PetYupp</span>
            </div>
            <div className="py-3 px-4 text-center">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Generic Brands</span>
            </div>
          </div>

          {/* Rows */}
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className={`grid items-center ${
                index < benefits.length - 1 ? 'border-b border-gray-100' : ''
              } ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
              style={{gridTemplateColumns: '1fr auto auto'}}
            >
              <div className="py-3 px-4">
                <span className="text-sm text-gray-700">{benefit}</span>
              </div>
              <div className="py-3 px-6 flex justify-center">
                <CheckIcon />
              </div>
              <div className="py-3 px-4 flex justify-center">
                <XIcon />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyPetYupp;
