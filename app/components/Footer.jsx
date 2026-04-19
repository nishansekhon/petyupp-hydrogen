import React, { useState } from 'react';
import { Link } from 'react-router';

// Inline SVG icons for social media
const InstagramIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.23 8.23 0 004.84 1.55V6.79a4.85 4.85 0 01-1.07-.1z"/>
  </svg>
);

const YouTubeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
  </svg>
);

const ChevronDown = ({ isOpen }) => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
  >
    <polyline points="6 9 12 15 18 9"></polyline>
  </svg>
);

const footerColumns = [
  {
    title: "Shop by Problem",
    links: [
      { label: "Dental Health", to: "/collections/dental-health" },
      { label: "Destructive Chewing", to: "/collections/destructive-chewing" },
      { label: "Separation Anxiety", to: "/collections/separation-anxiety" },
      { label: "Joint Support", to: "/collections/joint-support" },
      { label: "Digestive Issues", to: "/collections/digestive-issues" },
      { label: "Hyperactivity", to: "/collections/hyperactivity" },
    ],
  },
  {
    title: "Products",
    links: [
      { label: "Natural Treats", to: "/collections/natural-treats" },
      { label: "Yak Chews", to: "/collections/yak-chews" },
      { label: "Bowls & Buckets", to: "/collections/bowls-buckets" },
      { label: "Diners", to: "/collections/diners" },
      { label: "Toys", to: "/collections/toys" },
      { label: "Non-Skid Mats", to: "/collections/non-skid-mats" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About PetYupp", to: "/about" },
      { label: "Contact Us", to: "/contact" },
      { label: "Shipping & Delivery", to: "/shipping" },
      { label: "Returns & Exchanges", to: "/returns" },
      { label: "Wholesale Inquiries", to: "/wholesale" },
    ],
  },
];

function AccordionSection({ title, links }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }} className="md:border-none">
      {/* Mobile: accordion header */}
      <button
        className="flex items-center justify-between w-full py-3 text-left md:hidden"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="text-white font-semibold text-sm">{title}</span>
        <ChevronDown isOpen={isOpen} />
      </button>

      {/* Desktop: always show title */}
      <h3 className="hidden md:block text-white font-semibold text-sm mb-4 uppercase tracking-wider">
        {title}
      </h3>

      {/* Links: mobile=conditional, desktop=always */}
      <ul
        className={`${isOpen ? "block" : "hidden"} md:block space-y-2 pb-3 md:pb-0`}
      >
        {links.map((link) => (
          <li key={link.label}>
            <Link
              to={link.to}
              className="text-gray-400 hover:text-white text-sm transition-colors duration-150"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Footer() {
  return (
    <footer style={{ backgroundColor: "#1C1917", color: "#fff" }}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-12 pb-6">
        {/* Main columns grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 sm:gap-8 mb-8">
          {/* Columns 1-3: Shop by Problem, Products, Company */}
          {footerColumns.map((col) => (
            <AccordionSection key={col.title} title={col.title} links={col.links} />
          ))}

          {/* Column 4: Connect */}
          <div className="pt-3 md:pt-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            <h3 className="text-white font-semibold text-sm mb-4 uppercase tracking-wider">
              Connect
            </h3>
            <div className="flex flex-col gap-3">
              <a
                href="https://instagram.com/petyupp"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors duration-150"
              >
                <InstagramIcon />
                <span>Instagram</span>
              </a>
              <a
                href="https://tiktok.com/@petyupp"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors duration-150"
              >
                <TikTokIcon />
                <span>TikTok</span>
              </a>
              <a
                href="https://youtube.com/@petyupp"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors duration-150"
              >
                <YouTubeIcon />
                <span>YouTube</span>
              </a>
              <a
                href="mailto:hello@petyupp.com"
                className="flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-colors duration-150"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
                <span>hello@petyupp.com</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="flex flex-col md:flex-row items-center justify-between gap-3 pt-6"
          style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
        >
          <p className="text-gray-500 text-xs">
            &copy; 2026 PetYupp Pet Lifestyle. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
            <Link to="/privacy-policy" className="text-gray-500 hover:text-gray-300 text-xs transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms-of-service" className="text-gray-500 hover:text-gray-300 text-xs transition-colors">
              Terms of Service
            </Link>
            <Link to="/cookie-preferences" className="text-gray-500 hover:text-gray-300 text-xs transition-colors">
              Cookie Preferences
            </Link>
            <Link to="/do-not-sell" className="text-gray-500 hover:text-gray-300 text-xs transition-colors">
              Do Not Sell My Info
            </Link>
          </div>
        </div>
      </div>
            <div className="flex justify-center pt-4">
          <Link to="/admin" aria-label="Admin login" className="text-gray-600 hover:text-gray-400 text-xs opacity-60 hover:opacity-100 transition-opacity">
            <span role="img" aria-hidden="true">⚙️</span>
          </Link>
        </div>
      </footer>
  );
}

export default Footer;
