import React from 'react';
import { Link } from 'react-router';
import { useCartStore } from '@/store/cartStore';

const bestSellers = [
  { label: 'Yak Chews', emoji: '🧀', path: '/collections/yak-chews' },
  { label: 'Bully Sticks', emoji: '🥩', path: '/collections/bully-sticks' },
  { label: 'Coffee Wood', emoji: '🪵', path: '/collections/wooden-chews' },
  { label: 'Buffalo Chews', emoji: '🦬', path: '/collections/treats' },
];

const categories = [
  { label: 'Natural Treats', path: '/collections/treats' },
  { label: 'Yak Chews', path: '/collections/yak-chews' },
  { label: 'Dog Toys', path: '/collections/dog-toys' },
  { label: 'Bowls & Buckets', path: '/collections/dog-bowls' },
  { label: 'Diners', path: '/collections/dog-diners' },
  { label: 'Non-Skid Mats', path: '/collections/non-skid-mats-for-dogs' },
];

const MobileNavDrawer = ({ isOpen, onClose }) => {
  const cartItemsCount = useCartStore((state) => state.getItemCount());

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[200]"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className="fixed top-0 left-0 h-full w-[85vw] max-w-sm bg-white z-[201] flex flex-col shadow-2xl overflow-y-auto"
        style={{ overscrollBehavior: 'contain' }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="text-lg font-bold text-[#06B6D4]">PetYupp</span>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            aria-label="Close menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Promo banner */}
        <div className="bg-[#06B6D4] text-white text-xs font-semibold text-center py-2 px-4 flex items-center justify-center gap-2">
          <span>🚚 Free Shipping Over $50</span>
          <span className="text-white/60">|</span>
          <Link to="/shop" onClick={onClose} className="underline underline-offset-2 hover:text-white/80">
            Shop Now
          </Link>
        </div>

        {/* Best Sellers horizontal scroll */}
        <div className="px-4 pt-4 pb-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Best Sellers</p>
          <div
            className="flex gap-3 overflow-x-auto pb-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {bestSellers.map((item) => (
              <Link
                key={item.label}
                to={item.path}
                onClick={onClose}
                className="flex-shrink-0 flex flex-col items-center gap-1"
              >
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-2xl hover:bg-[#E0F7FA] transition-colors">
                  {item.emoji}
                </div>
                <span className="text-xs text-gray-600 text-center leading-tight w-16">{item.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Sale row */}
        <div className="mx-4 mt-2 mb-1">
          <Link
            to="/collections/all"
            onClick={onClose}
            className="flex items-center justify-between w-full px-4 py-3 rounded-xl font-semibold text-sm transition-colors"
            style={{ background: '#FFF1F0', color: '#E53935' }}
          >
            <span className="flex items-center gap-2">
              <span className="text-base">🔥</span>
              <span>Sale</span>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: '#E53935', color: '#fff' }}
              >
                UP TO 30% OFF
              </span>
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>

        {/* Divider */}
        <div className="mx-4 my-2 border-t border-gray-100" />

        {/* Category list with chevrons */}
        <div className="px-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-1">Shop by Category</p>
          {categories.map((cat) => (
            <Link
              key={cat.label}
              to={cat.path}
              onClick={onClose}
              className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-gray-50 text-gray-800 font-medium text-sm transition-colors"
            >
              <span>{cat.label}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </Link>
          ))}
        </div>

        {/* Shop by Problem teal row */}
        <div className="mx-4 mt-2">
          <Link
            to="/collections/all"
            onClick={onClose}
            className="flex items-center justify-between w-full px-4 py-3 rounded-xl font-semibold text-sm text-white transition-colors hover:opacity-90"
            style={{ background: '#06B6D4' }}
          >
            <span className="flex items-center gap-2">
              <span>🐾</span>
              <span>Shop by Relief</span>
            </span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Link>
        </div>

        {/* Divider */}
        <div className="mx-4 my-3 border-t border-gray-100" />

        {/* Footer links */}
        <div className="px-4 pb-4 flex flex-col gap-1">
          {[
            { label: 'About', path: '/about' },
            { label: 'Contact', path: '/contact' },
            { label: 'Shipping Info', path: '/shipping' },
          ].map((link) => (
            <Link
              key={link.label}
              to={link.path}
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-800 py-2 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Cart link at bottom */}
        <div className="p-4 border-t border-gray-100 mt-auto">
          <Link
            to="/cart"
            onClick={onClose}
            className="flex items-center justify-between w-full bg-[#06B6D4] hover:bg-[#0891B2] text-white px-5 py-3 rounded-xl font-bold text-sm"
          >
            <span>View Cart</span>
            {cartItemsCount > 0 && (
              <span className="bg-white text-[#06B6D4] text-xs font-black px-2 py-0.5 rounded-full">
                {cartItemsCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </>
  );
};

export default MobileNavDrawer;
