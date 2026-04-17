import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Menu, Search, ShoppingCart, User, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import UserMenu from '@/components/UserMenu';
import MobileNavDrawer from '@/components/MobileNavDrawer';

function Navbar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const cartItemsCount = useCartStore(state => state.getItemCount());
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* 1. ANNOUNCEMENT BAR - Dark charcoal bg-[#111827] text-white — confirmed */}
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

      {/* 2. MAIN NAVBAR - White background */}
      <header className="fixed top-[28px] left-0 right-0 z-[99] flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-white py-5">

        {/* LEFT: Mobile menu + Logo */}
        <div className="flex items-center gap-3">
          {/* Mobile hamburger */}
          <button
            className="p-2 -ml-1 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={22} className="text-gray-700" />
          </button>

          {/* PetYupp Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold text-[#06B6D4] tracking-tight whitespace-nowrap">
              PetYupp<span className="hidden md:inline"> | Pet Lifestyle</span>
            </span>
          </Link>
        </div>

        {/* CENTER: Desktop Navigation - tighter gap-6, font-medium links */}
        <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
          {/* Shop Dropdown */}
          <div className="relative group">
            <button
              className={`text-sm font-medium transition-colors flex items-center gap-1 ${
                isActive('/shop') ? 'text-[#06B6D4]' : 'text-gray-700 hover:text-[#06B6D4]'
              }`}
            >
              Shop
              <ChevronDown size={14} className="transition-transform duration-200 group-hover:rotate-180" />
            </button>
            {/* Dropdown Menu - Two Column */}
            <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden" style={{ minWidth: '460px' }}>
              <div className="flex">
                {/* Left Column: Shop by Product */}
                <div className="flex-1 p-3 border-r border-gray-100">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 pb-2">Shop by Product</p>
                  <Link to="/collections/natural-treats" className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:text-[#06B6D4] hover:border-l-2 hover:border-[#06B6D4] hover:pl-2 transition-all duration-150">
                    Natural Treats and Chews
                  </Link>
                  <Link to="/collections/yak-chews" className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:text-[#06B6D4] hover:border-l-2 hover:border-[#06B6D4] hover:pl-2 transition-all duration-150">
                    Yak Chews
                  </Link>
                  <Link to="/collections/bully-sticks" className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:text-[#06B6D4] hover:border-l-2 hover:border-[#06B6D4] hover:pl-2 transition-all duration-150">
                    Bully Sticks
                  </Link>
                  <Link to="/collections/wooden-chews" className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:text-[#06B6D4] hover:border-l-2 hover:border-[#06B6D4] hover:pl-2 transition-all duration-150">
                    Wooden Chews
                  </Link>
                  <Link to="/collections/dog-toys" className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:text-[#06B6D4] hover:border-l-2 hover:border-[#06B6D4] hover:pl-2 transition-all duration-150">
                    Dog Toys
                  </Link>
                  <Link to="/collections/dog-diners" className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:text-[#06B6D4] hover:border-l-2 hover:border-[#06B6D4] hover:pl-2 transition-all duration-150">
                    Dog Diners
                  </Link>
                  <Link to="/collections/bowls-buckets" className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:text-[#06B6D4] hover:border-l-2 hover:border-[#06B6D4] hover:pl-2 transition-all duration-150">
                    Bowls and Buckets
                  </Link>
                  <Link to="/collections/non-skid-mats" className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:text-[#06B6D4] hover:border-l-2 hover:border-[#06B6D4] hover:pl-2 transition-all duration-150">
                    Non-Skid Mats
                  </Link>
                </div>
                {/* Right Column: Shop by Problem */}
                <div className="flex-1 p-3">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 pb-2">Shop by Problem</p>
                  <Link to="/collections/separation-anxiety" className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:text-[#06B6D4] hover:border-l-2 hover:border-[#06B6D4] hover:pl-2 transition-all duration-150">
                    Separation Anxiety
                  </Link>
                  <Link to="/collections/dental-health" className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:text-[#06B6D4] hover:border-l-2 hover:border-[#06B6D4] hover:pl-2 transition-all duration-150">
                    Dental Health
                  </Link>
                  <Link to="/collections/destructive-chewing" className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:text-[#06B6D4] hover:border-l-2 hover:border-[#06B6D4] hover:pl-2 transition-all duration-150">
                    Destructive Chewing
                  </Link>
                  <Link to="/collections/joint-pain" className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:text-[#06B6D4] hover:border-l-2 hover:border-[#06B6D4] hover:pl-2 transition-all duration-150">
                    Joint Pain
                  </Link>
                  <Link to="/collections/digestive-issues" className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:text-[#06B6D4] hover:border-l-2 hover:border-[#06B6D4] hover:pl-2 transition-all duration-150">
                    Digestive Issues
                  </Link>
                  <Link to="/collections/hyperactivity" className="flex items-center px-3 py-2 text-sm text-gray-700 rounded-lg hover:text-[#06B6D4] hover:border-l-2 hover:border-[#06B6D4] hover:pl-2 transition-all duration-150">
                    Hyperactivity
                  </Link>
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
          <Link
            to="/blog"
            className={`text-sm font-medium transition-colors relative group ${
              isActive('/blog')
                ? 'text-[#06B6D4]'
                : 'text-gray-700 hover:text-[#06B6D4]'
            }`}
          >
            Blog
            <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#06B6D4] transition-all ${isActive('/blog') ? 'w-full' : 'w-0 group-hover:w-full'}`} />
          </Link>
        </nav>

        {/* RIGHT: Search, Cart, Account */}
        <div className="flex items-center gap-4">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-full dark-mode-btn hidden lg:flex items-center justify-center"
            style={{ color: 'var(--accent)', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            {isDarkMode ? (
              <Sun size={20} strokeWidth={2} />
            ) : (
              <Moon size={20} strokeWidth={2} />
            )}
          </button>

          {/* Search */}
          <button
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Search"
            onClick={() => setSearchOpen(!searchOpen)}
          >
            <Search size={20} className="text-gray-700" />
          </button>

          {/* Theme Toggle - Mobile only */}
          <button
            onClick={toggleTheme}
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-full dark-mode-btn flex lg:hidden items-center justify-center"
            style={{ color: 'var(--accent)', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            {isDarkMode ? (
              <Sun size={20} strokeWidth={2} />
            ) : (
              <Moon size={20} strokeWidth={2} />
            )}
          </button>

          {/* Cart */}
          <Link
            to="/cart"
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors relative"
            aria-label="Cart"
            data-testid="nav-cart"
          >
            <ShoppingCart size={20} className="text-gray-700" />
            {cartItemsCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#06B6D4] text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {cartItemsCount > 99 ? '99+' : cartItemsCount}
              </span>
            )}
          </Link>

          {/* Account */}
          <div className="hidden sm:block">
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <MobileNavDrawer isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  );
}

export default Navbar;
