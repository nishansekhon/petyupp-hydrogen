import React from 'react';

// Inline SVG Icons
const TruckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="15" height="13" rx="1"/>
    <path d="M16 8h4l3 5v3h-7V8z"/>
    <circle cx="5.5" cy="18.5" r="2.5"/>
    <circle cx="18.5" cy="18.5" r="2.5"/>
  </svg>
);

const ShieldIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>
);

const FlagIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
    <line x1="4" y1="22" x2="4" y2="15"/>
  </svg>
);

const ArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 14L4 9l5-5"/>
    <path d="M20 20v-7a4 4 0 0 0-4-4H4"/>
  </svg>
);

// Payment brand inline SVGs (grayscale)
const VisaSVG = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 30" width="48" height="30" aria-label="Visa">
    <rect width="48" height="30" rx="4" fill="#e5e7eb"/>
    <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="700" fontSize="13" fill="#6b7280" letterSpacing="1">VISA</text>
  </svg>
);

const MastercardSVG = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 30" width="48" height="30" aria-label="Mastercard">
    <rect width="48" height="30" rx="4" fill="#e5e7eb"/>
    <circle cx="18" cy="15" r="8" fill="#9ca3af"/>
    <circle cx="30" cy="15" r="8" fill="#d1d5db"/>
    <path d="M24 8.8a8 8 0 0 1 0 12.4A8 8 0 0 1 24 8.8z" fill="#b0b5bc"/>
  </svg>
);

const PaypalSVG = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 30" width="48" height="30" aria-label="PayPal">
    <rect width="48" height="30" rx="4" fill="#e5e7eb"/>
    <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="700" fontSize="11" fill="#6b7280" letterSpacing="0.5">PayPal</text>
  </svg>
);

const ApplePaySVG = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 30" width="48" height="30" aria-label="Apple Pay">
    <rect width="48" height="30" rx="4" fill="#e5e7eb"/>
    <text x="50%" y="52%" dominantBaseline="middle" textAnchor="middle" fontFamily="-apple-system,BlinkMacSystemFont,Arial,sans-serif" fontWeight="600" fontSize="9.5" fill="#6b7280" letterSpacing="0.3">Apple Pay</text>
  </svg>
);

const GooglePaySVG = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 30" width="48" height="30" aria-label="Google Pay">
    <rect width="48" height="30" rx="4" fill="#e5e7eb"/>
    <text x="50%" y="52%" dominantBaseline="middle" textAnchor="middle" fontFamily="Arial,sans-serif" fontWeight="600" fontSize="9" fill="#6b7280" letterSpacing="0.3">Google Pay</text>
  </svg>
);

const badges = [
  {
    icon: <TruckIcon />,
    title: "Free Shipping Over $49",
    sub: "Continental US & Canada",
  },
  {
    icon: <ShieldIcon />,
    title: "Vetted & Inspected",
    sub: "Third-party verified quality",
  },
  {
    icon: <FlagIcon />,
    title: "Inspected in Michigan",
    sub: "Quality checked in the USA",
  },
  {
    icon: <ArrowIcon />,
    title: "Easy Returns",
    sub: "30-day hassle-free returns",
  },
];

const paymentIcons = [
  { key: "visa", svg: <VisaSVG /> },
  { key: "mastercard", svg: <MastercardSVG /> },
  { key: "paypal", svg: <PaypalSVG /> },
  { key: "applepay", svg: <ApplePaySVG /> },
  { key: "googlepay", svg: <GooglePaySVG /> },
];

const TrustBadges = () => (
  <section className="py-10 bg-gray-50 border-t border-gray-100">
    <div className="max-w-5xl mx-auto px-4 md:px-6">
      {/* Trust Badges: 2x2 on mobile, single row on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {badges.map((badge, i) => (
          <div key={i} className="flex flex-col items-center text-center gap-2">
            <div className="text-gray-500">
              {badge.icon}
            </div>
            <p className="text-sm font-semibold text-gray-800 leading-tight">{badge.title}</p>
            <p className="text-xs text-gray-500 leading-snug">{badge.sub}</p>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 pt-6">
        <p className="text-xs text-gray-400 text-center mb-4 uppercase tracking-wide font-medium">Secure payment</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {paymentIcons.map(({ key, svg }) => (
            <div key={key} className="opacity-70 hover:opacity-100 transition-opacity">
              {svg}
            </div>
          ))}
        </div>
      </div>
    </div>
  </section>
);

export default TrustBadges;
