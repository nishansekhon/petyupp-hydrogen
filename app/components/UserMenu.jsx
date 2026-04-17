import React, { useState } from 'react';
import { Link } from 'react-router';
import { User, Package, LogOut, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

function UserMenu() {
  const { user, logout } = useAuth() || {};
  const [open, setOpen] = useState(false);

  if (!user) {
    return (
      <Link to="/login"
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors text-sm font-semibold text-gray-700">
        <User size={18} />
        <span className="hidden sm:block">Sign In</span>
      </Link>
    );
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors text-sm font-semibold text-gray-700">
        <div className="w-6 h-6 bg-[#06B6D4] rounded-full flex items-center justify-center text-white text-xs font-bold">
          {user.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <ChevronDown size={14} className="text-gray-400" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-20">
            <div className="px-4 py-2 border-b border-gray-100 mb-1">
              <p className="text-xs font-bold text-gray-900 line-clamp-1">{user.name || user.email}</p>
              <p className="text-xs text-gray-400 line-clamp-1">{user.email}</p>
            </div>
            <Link to="/account" onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#06B6D4] transition-colors">
              <User size={14} /> Account
            </Link>
            <Link to="/orders" onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#06B6D4] transition-colors">
              <Package size={14} /> My Orders
            </Link>
            <hr className="my-1 border-gray-100" />
            <button onClick={() => { logout && logout(); setOpen(false); }}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 w-full transition-colors">
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default UserMenu;
