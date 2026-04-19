import {Suspense, useState} from 'react';
import {Await, NavLink, useAsyncValue} from 'react-router';
import {useAnalytics, useOptimisticCart} from '@shopify/hydrogen';
import {useAside} from '~/components/Aside';
import {useTheme} from '~/contexts/ThemeContext';

/**
 * @param {HeaderProps}
 */
export function Header({header, isLoggedIn, cart, publicStoreDomain}) {
  const {shop, menu} = header;
  const [isShopOpen, setIsShopOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="petfyupp-header">
      <div className="header-container">
        {/* Logo and Tagline */}
        <NavLink prefetch="intent" to="/" className="logo-section" end>
          <span className="logo-text text-3xl font-bold" style={{color: '#06B6D4', fontSize: '1.875rem', fontWeight: 700}}>PetYupp</span>
          <span className="logo-tagline text-lg font-normal" style={{color: '#6B7280', fontSize: '1.125rem', fontWeight: 400, marginLeft: '0.25rem'}}>| Pet Lifestyle</span>
        </NavLink>

        {/* Desktop Menu */}
        <nav className="header-menu-desktop hidden md:flex items-center gap-8">
          {/* Shop Dropdown */}
          <div
            className="relative group"
            onMouseEnter={() => setIsShopOpen(true)}
            onMouseLeave={() => setIsShopOpen(false)}
          >
            <button
              type="button"
              className="reset header-menu-item text-sm font-medium hover:text-[#06B6D4] flex items-center gap-1"
              style={{background: 'transparent', padding: 0, border: 'none', color: isShopOpen ? '#06B6D4' : '#374151'}}
              onClick={() => setIsShopOpen((open) => !open)}
            >
              Shop
              <svg
                className={`w-4 h-4 transition-transform ${isShopOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Two-Column Mega Menu */}
            <div className={`absolute top-full left-1/2 -translate-x-1/2 bg-white shadow-xl rounded-lg border border-gray-100 p-8 z-50 ${
              isShopOpen ? 'block' : 'hidden'
            }`} style={{minWidth:'620px'}}>
              <div className="grid grid-cols-2 gap-12">
                <div>
                  <h3 style={{color:"#9CA3AF"}} className="text-xs font-bold uppercase tracking-wider mb-4">Shop by Product</h3>
                  <ul className="space-y-3">
                    <li><NavLink to="/collections/treats" style={{color:"#111827",textDecoration:"none"}} className="text-sm font-medium block hover:!text-cyan-500">Natural Treats and Chews</NavLink></li>
                    <li><NavLink to="/collections/yak-chews" style={{color:"#111827",textDecoration:"none"}} className="text-sm font-medium block hover:!text-cyan-500">Yak Chews</NavLink></li>
                    <li><NavLink to="/collections/bully-sticks" style={{color:"#111827",textDecoration:"none"}} className="text-sm font-medium block hover:!text-cyan-500">Bully Sticks</NavLink></li>
                    <li><NavLink to="/collections/wooden-chews" style={{color:"#111827",textDecoration:"none"}} className="text-sm font-medium block hover:!text-cyan-500">Wooden Chews</NavLink></li>
                    <li><NavLink to="/collections/dog-toys" style={{color:"#111827",textDecoration:"none"}} className="text-sm font-medium block hover:!text-cyan-500">Dog Toys</NavLink></li>
                    <li><NavLink to="/collections/dog-diners" style={{color:"#111827",textDecoration:"none"}} className="text-sm font-medium block hover:!text-cyan-500">Dog Diners</NavLink></li>
                    <li><NavLink to="/collections/dog-bowls" style={{color:"#111827",textDecoration:"none"}} className="text-sm font-medium block hover:!text-cyan-500">Bowls and Buckets</NavLink></li>
                    <li><NavLink to="/collections/non-skid-mats-for-dogs" style={{color:"#111827",textDecoration:"none"}} className="text-sm font-medium block hover:!text-cyan-500">Non-Skid Mats</NavLink></li>
                  </ul>
                </div>
                <div>
                  <h3 style={{color:"#9CA3AF"}} className="text-xs font-bold uppercase tracking-wider mb-4">Shop by Relief</h3>
                  <ul className="space-y-3">
                    <li><NavLink to="/collections" style={{color:"#111827",textDecoration:"none"}} className="text-sm font-medium block hover:!text-cyan-500">Separation Anxiety</NavLink></li>
                    <li><NavLink to="/collections" style={{color:"#111827",textDecoration:"none"}} className="text-sm font-medium block hover:!text-cyan-500">Dental Health</NavLink></li>
                    <li><NavLink to="/collections" style={{color:"#111827",textDecoration:"none"}} className="text-sm font-medium block hover:!text-cyan-500">Destructive Chewing</NavLink></li>
                    <li><NavLink to="/collections" style={{color:"#111827",textDecoration:"none"}} className="text-sm font-medium block hover:!text-cyan-500">Joint Pain</NavLink></li>
                    <li><NavLink to="/collections" style={{color:"#111827",textDecoration:"none"}} className="text-sm font-medium block hover:!text-cyan-500">Digestive Issues</NavLink></li>
                    <li><NavLink to="/collections" style={{color:"#111827",textDecoration:"none"}} className="text-sm font-medium block hover:!text-cyan-500">Hyperactivity</NavLink></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* About Link */}
          <NavLink
            to="/pages/about"
            className="header-menu-item text-sm font-medium text-gray-700 hover:text-[#06B6D4]"
            style={{color: '#374151'}}
          >
            About
          </NavLink>

          {/* Blog Link */}
          <NavLink
            to="/blogs"
            className="header-menu-item text-sm font-medium text-gray-700 hover:text-[#06B6D4]"
            style={{color: '#374151'}}
          >
            Blog
          </NavLink>
        </nav>

        {/* Right Side CTAs */}
        <HeaderCtas isLoggedIn={isLoggedIn} cart={cart} isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />
      </div>
    </header>
  );
}

/**
 * @param {{
 *   menu: HeaderProps['header']['menu'];
 *   primaryDomainUrl: HeaderProps['header']['shop']['primaryDomain']['url'];
 *   viewport: Viewport;
 *   publicStoreDomain: HeaderProps['publicStoreDomain'];
 * }}
 */
export function HeaderMenu({
  menu,
  primaryDomainUrl,
  viewport,
  publicStoreDomain,
}) {
  const className = `header-menu-${viewport}`;
  const {close} = useAside();

  return (
    <nav className={className} role="navigation">
      {viewport === 'mobile' && (
        <NavLink
          end
          onClick={close}
          prefetch="intent"
          className="header-menu-item"
          to="/"
        >
          Home
        </NavLink>
      )}
      {(menu || FALLBACK_HEADER_MENU).items.map((item) => {
        if (!item.url) return null;

        // if the url is internal, we strip the domain
        const url =
          item.url.includes('myshopify.com') ||
          item.url.includes(publicStoreDomain) ||
          item.url.includes(primaryDomainUrl)
            ? new URL(item.url).pathname
            : item.url;
        return (
          <NavLink
            className="header-menu-item"
            end
            key={item.id}
            onClick={close}
            prefetch="intent"
            to={url}
          >
            {item.title}
          </NavLink>
        );
      })}
    </nav>
  );
}

const FALLBACK_HEADER_MENU = {
  id: 'gid://shopify/Menu/199655587896',
  items: [
    {
      id: 'gid://shopify/MenuItem/461609500728',
      resourceId: null,
      tags: [],
      title: 'Collections',
      type: 'HTTP',
      url: '/collections',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609533496',
      resourceId: null,
      tags: [],
      title: 'Blog',
      type: 'HTTP',
      url: '/blogs',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609566264',
      resourceId: null,
      tags: [],
      title: 'Policies',
      type: 'HTTP',
      url: '/policies',
      items: [],
    },
    {
      id: 'gid://shopify/MenuItem/461609599032',
      resourceId: 'gid://shopify/Page/92591030328',
      tags: [],
      title: 'About',
      type: 'PAGE',
      url: '/pages/about',
      items: [],
    },
  ],
};

/**
 * @param {Pick<HeaderProps, 'isLoggedIn' | 'cart' | 'isMobileMenuOpen' | 'setIsMobileMenuOpen'>}
 */
function HeaderCtas({isLoggedIn, cart, isMobileMenuOpen, setIsMobileMenuOpen}) {
  const {open} = useAside();
  const {toggleTheme} = useTheme();

  return (
    <nav className="header-ctas" role="navigation">
      {/* Mobile Menu Toggle */}
      <button
        className="header-menu-mobile-toggle md:hidden"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Dark mode toggle */}
      <button
        type="button"
        className="reset text-gray-900 hover:text-cyan-500 transition-colors"
        onClick={toggleTheme}
        title="Toggle dark mode"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
        </svg>
      </button>

      {/* Search Icon */}
      <button
        className="reset text-gray-900 hover:text-cyan-500 transition-colors"
        onClick={() => open('search')}
        title="Search"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </button>

      {/* Cart */}
      <CartToggle cart={cart} />

      {/* Account — Sign In text on desktop */}
      <NavLink
        prefetch="intent"
        to="/account"
        className="hidden md:flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-[#06B6D4]"
        style={{color: '#374151'}}
      >
        <Suspense fallback={<span>Sign In</span>}>
          <Await resolve={isLoggedIn} errorElement={<span>Sign In</span>}>
            {(loggedIn) => <span>{loggedIn ? 'Account' : 'Sign In'}</span>}
          </Await>
        </Suspense>
      </NavLink>
    </nav>
  );
}

/**
 * @param {{count: number}}
 */
function CartBadge({count}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();

  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        open('cart');
        publish('cart_viewed', {
          cart,
          prevCart,
          shop,
          url: window.location.href || '',
        });
      }}
      className="relative text-gray-900 hover:text-cyan-500 transition-colors"
      title="Cart"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        />
      </svg>
      {count > 0 && (
        <span className="absolute -top-2 -right-2 bg-cyan-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  );
}

/**
 * @param {Pick<HeaderProps, 'cart'>}
 */
function CartToggle({cart}) {
  return (
    <Suspense fallback={<CartBadge count={0} />}>
      <Await resolve={cart}>
        <CartBanner />
      </Await>
    </Suspense>
  );
}

function CartBanner() {
  const originalCart = useAsyncValue();
  const cart = useOptimisticCart(originalCart);
  return <CartBadge count={cart?.totalQuantity ?? 0} />;
}

/** @typedef {'desktop' | 'mobile'} Viewport */
/**
 * @typedef {Object} HeaderProps
 * @property {HeaderQuery} header
 * @property {Promise<CartApiQueryFragment|null>} cart
 * @property {Promise<boolean>} isLoggedIn
 * @property {string} publicStoreDomain
 * @property {boolean} isMobileMenuOpen
 * @property {Function} setIsMobileMenuOpen
 */

/** @typedef {import('@shopify/hydrogen').CartViewPayload} CartViewPayload */
/** @typedef {import('storefrontapi.generated').HeaderQuery} HeaderQuery */
/** @typedef {import('storefrontapi.generated').CartApiQueryFragment} CartApiQueryFragment */
