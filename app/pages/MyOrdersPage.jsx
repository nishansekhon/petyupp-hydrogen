import React, { useEffect } from 'react';
import { Link } from 'react-router';
import { Package } from 'lucide-react';
function MyOrdersPage() {
  useEffect(() => {
    document.title = 'My Orders | PetYupp';
  }, []);
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-black text-gray-900 mb-6">My Orders</h1>
        <div className="text-center py-12 bg-[#F9FAFB] rounded-2xl">
          <Package size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No orders yet</p>
          <Link to="/shop" className="bg-[#06B6D4] hover:bg-[#0891B2] text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm">
            Start Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
export default MyOrdersPage;
