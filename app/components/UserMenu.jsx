import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';

function UserMenu() {
  const { user, logout } = useAuth() || {};
  const [open, setOpen] = useState(false);

  if (!user) {
    return (
      <Link
        to="/login"
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors text-sm font-semibold text-gray-700"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
        <span className="hidden sm:block">Sign In</span>
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors text-sm font-semibold text-gray-700"
      >
        <div className="w-6 h-6 bg-[#06B6D4] rounded-full flex items-center justify-center text-white text-xs font-bold">
          {user.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close user menu"
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-20">
            <div className="px-4 py-2 border-b border-gray-100 mb-1">
              <p className="text-xs font-bold text-gray-900 line-clamp-1">{user.name || user.email}</p>
              <p className="text-xs text-gray-400 line-clamp-1">{user.email}</p>
            </div>
            <Link
              to="/account"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#06B6D4] transition-colors"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              Account
            </Link>
            <Link
              to="/orders"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#06B6D4] transition-colors"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 7l9-4 9 4v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                <path d="M9 3v4" />
                <path d="M15 3v4" />
              </svg>
              My Orders
            </Link>
            <hr className="my-1 border-gray-100" />
            <button
              type="button"
              onClick={() => {
                logout && logout();
                setOpen(false);
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 w-full transition-colors"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 16l-4-4 4-4" />
                <path d="M5 12h11" />
                <path d="M15 8v-2a2 2 0 012-2h3a2 2 0 012 2v12a2 2 0 01-2 2h-3a2 2 0 01-2-2v-2" />
              </svg>
              Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default UserMenu;
