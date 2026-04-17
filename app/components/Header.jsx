import {Suspense, useState} from 'react';
import {Await, NavLink, useAsyncValue} from 'react-router';
import {useAnalytics, useOptimisticCart} from '@shopify/hydrogen';
import {useAside} from '~/components/Aside';

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
          <span className="logo-text">PetYupp</span>
          <span className="logo-tagline">| Pet Lifestyle</span>
        </NavLink>

        {/* Desktop Menu */}
        <nav className="header-menu-desktop hidden md:flex items-center gap-8">
          {/* Shop Dropdown */}
          <div
            className="relative group"
            onMouseEnter={() => setIsShopOpen(true)}
            onMouseLeave={() => setIsShopOpen(false)}
          >
            <button className="header-menu-item flex items-center gap-2">
              Shop
              <svg
                className={`w-4 h-4 transition-transform ${isShopOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            <div className={`absolute left-0 mt-0 w-56 bg-white rounded-lg shadow-xl transition-all duration-200 z-50 ${
              isShopOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible translate-y-2'
            }`}>
              <div className="py-2">
                <NavLink
                  to="/collections/bowls"
                  className="block px-4 py-3 hover:bg-cyan-50 text-gray-900 font-inter text-sm"
                >
                  Bowls & Buckets
                </NavLink>
                <NavLink
                  to="/collections/treats"
                  className="block px-4 py-3 hover:bg-cyan-50 text-gray-900 font-inter text-sm"
                >
                  Natural Treats
                </NavLink>
                <NavLink
                  to="/collections/yak-chews"
                  className="block px-4 py-3 hover:bg-cyan-50 text-gray-900 font-inter text-sm"
                >
                  Yak Chews
                </NavLink>
                <NavLink
                  to="/collections/dog-toys"
                  className="block px-4 py-3 hover:bg-cyan-50 text-gray-900 font-inter text-sm"
                >
                  Toys
                </NavLink>
                <NavLink
                  to="/collections/dog-diners"
                  className="block px-4 py-3 hover:bg-cyan-50 text-gray-900 font-inter text-sm"
                >
                  Diners
                </NavLink>
                <NavLink
                  to="/collections/non-skid-mats-for-dogs"
                  className="block px-4 py-3 hover:bg-cyan-50 text-gray-900 font-inter text-sm border-t border-gray-100"
                >
                  Non-Skid Mats
                </NavLink>
              </div>
            </div>
          </div>

          {/* About Link */}
          <NavLink to="/pages/about" className="header-menu-item">
            About
          </NavLink>

          {/* Blog Link */}
          <NavLink to="/blogs/journal" className="header-menu-item">
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
      url: '/blogs/journal',
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

      {/* Account */}
      <NavLink prefetch="intent" to="/account">
        <Suspense fallback="Sign in">
          <Await resolve={isLoggedIn} errorElement="Sign in">
            {(isLoggedIn) => (
              <>
                <svg className="w-5 h-5 text-gray-900 hover:text-cyan-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </>
            )}
          </Await>
        </Suspense>
      </NavLink>

      {/* Cart */}
      <CartToggle cart={cart} />
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
