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
          <p className="text-lg font-medium" style={{ color: '#06B6D4' }}>See the difference.</p>
        </div>

        {/* Table Card */}
        <div
          className="w-full rounded-xl overflow-hidden"
          style={{ border: '1px solid #E5E7EB', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        >
          {/* Column Headers */}
          <div
            className="grid"
            style={{
              gridTemplateColumns: '1fr auto auto',
              backgroundColor: '#F9FAFB',
              borderBottom: '1px solid #E5E7EB',
            }}
          >
            <div className="py-3 px-4">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Benefits</span>
            </div>
            <div className="py-3 px-6 text-center">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: '#06B6D4' }}>PetYupp</span>
            </div>
            <div className="py-3 px-4 text-center">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Generic Brands</span>
            </div>
          </div>

          {/* Rows */}
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="grid items-center"
              style={{
                gridTemplateColumns: '1fr auto auto',
                borderBottom: index < benefits.length - 1 ? '1px solid #F3F4F6' : 'none',
                backgroundColor: index % 2 === 0 ? '#FFFFFF' : '#FAFAFA',
              }}
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
