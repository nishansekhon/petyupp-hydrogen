import React, { useEffect } from 'react';
import { Link } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';
import { Package, MapPin, Heart, Settings, LogOut } from 'lucide-react';

function AccountPage() {
  useEffect(() => {
    document.title = 'My Account | PetYupp';
  }, []);

  const { user, logout } = useAuth() || {};

  if (!user) {
    return (
      <div className="min-h-screen bg-white pt-[96px] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🐾</div>
          <h2 className="text-2xl font-black text-gray-900 mb-3">Sign in to your account</h2>
          <Link to="/login" className="inline-block bg-[#06B6D4] hover:bg-[#0891B2] text-white font-bold px-6 py-3 rounded-xl transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const menuItems = [
    { icon: Package, label: 'My Orders', path: '/orders', desc: 'View order history' },
    { icon: Heart, label: 'Wishlist', path: '/wishlist', desc: 'Saved products' },
    { icon: MapPin, label: 'Addresses', path: '/addresses', desc: 'Manage delivery addresses' },
    { icon: Settings, label: 'Account Settings', path: '/settings', desc: 'Profile & preferences' },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] pt-[96px]">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm border border-gray-100 flex items-center gap-4">
          <div className="w-16 h-16 bg-[#06B6D4]/10 rounded-full flex items-center justify-center text-2xl">
            🐾
          </div>
          <div>
            <h2 className="font-black text-gray-900">{user.name || 'Dog Parent'}</h2>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {menuItems.map((item) => (
            <Link key={item.path} to={item.path}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md hover:border-[#06B6D4]/30 transition-all">
              <div className="w-10 h-10 bg-[#06B6D4]/10 rounded-xl flex items-center justify-center">
                <item.icon size={20} className="text-[#06B6D4]" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{item.label}</p>
                <p className="text-xs text-gray-400">{item.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        <button onClick={() => logout && logout()}
          className="mt-6 flex items-center gap-2 text-sm text-red-500 hover:text-red-600 font-semibold">
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );
}
export default AccountPage;
