import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useCartStore } from '@/store/cartStore';
import UserMenu from '@/components/UserMenu';
import MobileNavDrawer from '@/components/MobileNavDrawer';

function Navbar() {
  const cartItemsCount = useCartStore((state) => state.getItemCount());
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();

  useEffect(() => {
    setMobileMenuOpen(false);
    setIsShopOpen(false);
  }, [location]);

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[100] bg-[#111827] text-white py-1.5 h-[28px] overflow-hidden flex items-center text-xs">
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

      <header className="fixed top-[28px] left-0 right-0 z-[99] flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-white py-5">
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
          <div className="relative">
            <button
              type="button"
              className={`text-sm font-medium transition-colors flex items-center gap-1 ${
                isActive('/shop') ? 'text-[#06B6D4]' : 'text-gray-700 hover:text-[#06B6D4]'
              }`}
              onClick={() => setIsShopOpen((open) => !open)}
              aria-expanded={isShopOpen}
            >
              Shop
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" className={`transition-transform duration-200 ${isShopOpen ? 'rotate-180' : ''}`}>
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            <div className={isShopOpen ? 'block' : 'hidden'}>
              <div className="absolute top-full left-1/2 -translate-x-1/2 bg-white shadow-xl rounded-lg border border-gray-100 p-8 z-50" style={{minWidth:'680px'}}>
                <div className="grid grid-cols-2 gap-16">
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Shop by Product</h3>
                    <ul className="space-y-1">
                      {[
                        {to: '/collections/treats', label: 'Natural Treats and Chews'},
                        {to: '/collections/yak-chews', label: 'Yak Chews'},
                        {to: '/collections/bully-sticks', label: 'Bully Sticks'},
                        {to: '/collections/wooden-chews', label: 'Wooden Chews'},
                        {to: '/collections/dog-toys', label: 'Dog Toys'},
                        {to: '/collections/dog-diners', label: 'Dog Diners'},
                        {to: '/collections/dog-bowls', label: 'Bowls and Buckets'},
                        {to: '/collections/non-skid-mats-for-dogs', label: 'Non-Skid Mats'},
                      ].map((item) => {
                        const active = isActive(item.to);
                        return (
                          <li key={item.to}>
                            <Link
                              to={item.to}
                              className={`block text-sm font-medium py-2 pl-3 border-l-2 transition-all ${
                                active
                                  ? 'border-[#06B6D4] text-[#06B6D4]'
                                  : 'border-transparent text-gray-700 hover:border-[#06B6D4] hover:text-[#06B6D4]'
                              }`}
                            >
                              {item.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Shop by Problem</h3>
                    <ul className="space-y-1">
                      {[
                        'Separation Anxiety',
                        'Dental Health',
                        'Destructive Chewing',
                        'Joint Pain',
                        'Digestive Issues',
                        'Hyperactivity',
                      ].map((label) => (
                        <li key={label}>
                          <Link
                            to="/collections"
                            className="block text-sm font-medium py-2 pl-3 border-l-2 border-transparent text-gray-700 hover:border-[#06B6D4] hover:text-[#06B6D4] transition-all"
                          >
                            {label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <Link
            to="/about"
            className={`text-sm font-medium transition-colors relative group ${
              isActive('/about')
                ? 'text-[#06B6D4]'
                : 'text-gray-700 hover:text-[#06B6D4]'
            }`}
          >
            About
            <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#06B6D4] transition-all ${isActive('/about') ? 'w-full' : 'w-0 group-hover:w-full'}`} />
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          </button>

          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Search"
            onClick={() => setSearchOpen(!searchOpen)}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>

          <Link
            to="/cart"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
            aria-label="Cart"
            data-testid="nav-cart"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            {cartItemsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#06B6D4] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {cartItemsCount > 99 ? '99+' : cartItemsCount}
              </span>
            )}
          </Link>

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
