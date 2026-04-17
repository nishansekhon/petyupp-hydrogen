import React from 'react';
import { Link } from 'react-router';

const categories = [
  {
    label: 'Natural Treats',
    to: '/collections/natural-treats',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C10 6 7 8 7 13a5 5 0 0010 0c0-5-3-7-5-11z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10c1.5-1.5 4-1 5 1" />
      </svg>
    ),
  },
  {
    label: 'Yak Chews',
    to: '/collections/yak-chews',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 8.5C5 7 5 4.5 6.5 3S10 2.5 11.5 4l9 9c1.5 1.5 1.5 4 0 5.5S17 20 15.5 18.5l-9-10z" />
        <circle cx="5.5" cy="5.5" r="1.5" fill="currentColor" stroke="none"/>
        <circle cx="18.5" cy="18.5" r="1.5" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
  {
    label: 'Dog Toys',
    to: '/collections/dog-toys',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <circle cx="12" cy="12" r="9" />
        <path strokeLinecap="round" d="M6.5 9.5C8 8 10 8.5 11 10" />
        <path strokeLinecap="round" d="M17.5 9.5C16 8 14 8.5 13 10" />
        <path strokeLinecap="round" d="M6.5 14.5C8 16 10 15.5 11 14" />
        <path strokeLinecap="round" d="M17.5 14.5C16 16 14 15.5 13 14" />
      </svg>
    ),
  },
  {
    label: 'Dog Diners',
    to: '/collections/dog-diners',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h16" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 20V8.5a5.5 5.5 0 0111 0V20" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 8.5h5" />
      </svg>
    ),
  },
  {
    label: 'Bowls',
    to: '/collections/bowls-buckets',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 11h18" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 11c0 5.523 1.343 8 7 8s7-2.477 7-8" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h8" />
      </svg>
    ),
  },
];

const QuickCategoryScroll = () => {
  return (
    <div className="flex flex-nowrap overflow-x-auto gap-8 py-8 px-4 justify-center scrollbar-hide my-4 mb-6">
      {categories.map((item) => (
        <Link
          key={item.label}
          to={item.to}
          className="flex flex-col items-center flex-shrink-0"
        >
          <div className="w-16 h-16 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-teal-500 mb-2">
            {item.icon}
          </div>
          <span className="text-xs font-medium text-gray-600 text-center whitespace-nowrap">{item.label}</span>
        </Link>
      ))}
    </div>
  );
};

export default QuickCategoryScroll;
