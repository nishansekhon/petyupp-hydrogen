import { Suspense, useState, useEffect, useRef } from 'react';
import { Await, Link, useAsyncValue, useLocation, useRouteLoaderData } from 'react-router';
import { useOptimisticCart } from '@shopify/hydrogen';
import { useTheme } from '@/contexts/ThemeContext';
import { useAside } from '~/components/Aside';
import UserMenu from '@/components/UserMenu';
import MobileNavDrawer from '@/components/MobileNavDrawer';

function CartCountBadge() {
  const rootData = useRouteLoaderData('root');
  return (
    <Suspense fallback={null}>
      <Await resolve={rootData?.cart} errorElement={null}>
        <CartCountInner />
      </Await>
    </Suspense>
  );
}

function CartCountInner() {
  const originalCart = useAsyncValue();
  const cart = useOptimisticCart(originalCart);
  const count = cart?.totalQuantity ?? 0;
  const prevCountRef = useRef(count);
  const [pulseKey, setPulseKey] = useState(0);
  useEffect(() => {
    if (count !== prevCountRef.current) {
      prevCountRef.current = count;
      if (count > 0) setPulseKey((k) => k + 1);
    }
  }, [count]);
  if (count <= 0) return null;
  return (
    <span
      key={pulseKey}
      className="petyupp-pulse absolute -top-2 -right-2 min-w-[18px] h-[18px] bg-[#06B6D4] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1"
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

function Navbar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  const {open: openAside} = useAside();
  const shopMenuRef = useRef(null);

  useEffect(() => {
    setMobileMenuOpen(false);
    setIsShopOpen(false);
  }, [location]);

  useEffect(() => {
    if (!isShopOpen) return;
    function handleOutside(event) {
      if (shopMenuRef.current && !shopMenuRef.current.contains(event.target)) {
        setIsShopOpen(false);
      }
    }
    function handleEscape(event) {
      if (event.key === 'Escape') setIsShopOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isShopOpen]);

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <div className="fixed top-7 left-0 right-0 z-[100] bg-[#111827] text-white py-1.5 h-[28px] overflow-hidden flex items-center text-xs">
        <div className="flex items-center animate-ticker whitespace-nowrap" style={{ width: '200%' }}>
          <span className="inline-block px-8 text-xs sm:text-sm font-medium">
            Free shipping on orders over $49 across US and Canada
            &nbsp;&nbsp;✦&nbsp;&nbsp;
            Loved by Dogs
            &nbsp;&nbsp;✦&nbsp;&nbsp;
            Free US Shipping
            &nbsp;&nbsp;✦&nbsp;&nbsp;
            Vet Approved
            &nbsp;&nbsp;✦&nbsp;&nbsp;
            30-Day Guarantee
            &nbsp;&nbsp;✦&nbsp;&nbsp;
            Free shipping on orders over $49 across US and Canada
            &nbsp;&nbsp;✦&nbsp;&nbsp;
            Loved by Dogs
            &nbsp;&nbsp;✦&nbsp;&nbsp;
            Free US Shipping
            &nbsp;&nbsp;✦&nbsp;&nbsp;
            Vet Approved
            &nbsp;&nbsp;✦&nbsp;&nbsp;
            30-Day Guarantee
          </span>
        </div>
      </div>

      <header className="fixed top-[56px] left-0 right-0 z-[99] flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-white py-5">
        <div className="flex items-center gap-3">
          <button
            className="p-2 -ml-1 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 7h16" />
              <path d="M4 12h16" />
              <path d="M4 17h16" />
            </svg>
          </button>

          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold text-[#06B6D4] tracking-tight whitespace-nowrap">
              PetYupp<span className="hidden md:inline"> | Pet Lifestyle</span>
            </span>
          </Link>
        </div>

        <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
          <div className="relative" ref={shopMenuRef}>
            <button
              type="button"
              className={`text-sm font-medium transition-colors flex items-center gap-1 ${
                isShopOpen ? 'text-[#06B6D4]' : 'text-gray-700 hover:text-[#06B6D4]'
              }`}
              onClick={() => setIsShopOpen((open) => !open)}
              aria-expanded={isShopOpen}
              aria-haspopup="true"
            >
              Shop
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" className={`transition-transform duration-200 ${isShopOpen ? 'rotate-180' : ''}`}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            <div
              className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white shadow-xl rounded-lg border border-gray-100 p-6 z-50 origin-top transition duration-150 ease-out ${
                isShopOpen
                  ? 'opacity-100 scale-100 pointer-events-auto'
                  : 'opacity-0 scale-95 pointer-events-none'
              }`}
              style={{minWidth: '620px'}}
            >
              <div className="grid grid-cols-2 gap-12">
                <div>
                  <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-4">Shop by Product</h3>
                  <ul className="space-y-0">
                    {[
                      {to: '/collections/natural-treats-and-chews', label: 'Natural Treats and Chews'},
                      {to: '/collections/yak-chews', label: 'Yak Chews'},
                      {to: '/collections/bully-sticks', label: 'Bully Sticks'},
                      {to: '/collections/wooden-chews', label: 'Wooden Chews'},
                      {to: '/collections/dog-toys', label: 'Dog Toys'},
                      {to: '/collections/dog-diners', label: 'Dog Diners'},
                      {to: '/collections/dog-bowls', label: 'Bowls and Buckets'},
                      {to: '/collections/non-skid-mats-for-dogs', label: 'Non-Skid Mats'},
                    ].map((item) => (
                      <li key={item.to}>
                        <Link
                          to={item.to}
                          prefetch="intent"
                          onClick={() => setIsShopOpen(false)}
                          className={`block py-1.5 pl-3 text-sm font-medium border-l-[3px] transition-all ${
                            location.pathname === item.to
                              ? 'border-[#06B6D4] text-[#06B6D4]'
                              : 'border-transparent text-gray-700 hover:border-[#06B6D4] hover:text-[#06B6D4]'
                          }`}
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-4">Shop by Relief</h3>
                  <ul className="space-y-0">
                    {[
                      {to: '/collections/separation-anxiety', label: 'Separation Anxiety'},
                      {to: '/collections/dental-health', label: 'Dental Health'},
                      {to: '/collections/destructive-chewing', label: 'Destructive Chewing'},
                      {to: '/collections/joint-support', label: 'Joint Pain'},
                      {to: '/collections/digestive-issues', label: 'Digestive Issues'},
                      {to: '/collections/hyperactivity', label: 'Hyperactivity'},
                    ].map((item) => (
                      <li key={item.to}>
                        <Link
                          to={item.to}
                          prefetch="intent"
                          onClick={() => setIsShopOpen(false)}
                          className={`block py-1.5 pl-3 text-sm font-medium border-l-[3px] transition-all ${
                            location.pathname === item.to
                              ? 'border-[#06B6D4] text-[#06B6D4]'
                              : 'border-transparent text-gray-700 hover:border-[#06B6D4] hover:text-[#06B6D4]'
                          }`}
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <Link
            to="/pages/about"
            prefetch="intent"
            className={`text-sm font-medium transition-colors relative group ${
              isActive('/pages/about')
                ? 'text-[#06B6D4]'
                : 'text-gray-700 hover:text-[#06B6D4]'
            }`}
          >
            About
            <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#06B6D4] transition-all ${isActive('/pages/about') ? 'w-full' : 'w-0 group-hover:w-full'}`} />
          </Link>
          <Link
            to="/blogs/news"
            prefetch="intent"
            className={`text-sm font-medium transition-colors relative group ${
              isActive('/blogs/news')
                ? 'text-[#06B6D4]'
                : 'text-gray-700 hover:text-[#06B6D4]'
            }`}
          >
            Blog
            <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#06B6D4] transition-all ${isActive('/blogs/news') ? 'w-full' : 'w-0 group-hover:w-full'}`} />
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            {isDarkMode ? (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>

          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Search"
            onClick={() => openAside('search')}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => openAside('cart')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
            aria-label="Open cart"
            data-testid="nav-cart"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            <CartCountBadge />
          </button>

          <div className="hidden sm:block">
            <UserMenu />
          </div>
        </div>
      </header>

      <MobileNavDrawer isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  );
}

export default Navbar;
