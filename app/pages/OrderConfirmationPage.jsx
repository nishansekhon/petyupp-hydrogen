import React, { useEffect } from 'react';
import { Link } from 'react-router';
import { CheckCircle } from 'lucide-react';
function OrderConfirmationPage() {
  useEffect(() => {
    document.title = 'Order Confirmed | PetYupp';
  }, []);
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center px-4 max-w-md">
        <CheckCircle size={60} className="text-[#10B981] mx-auto mb-4" />
        <h1 className="text-3xl font-black text-gray-900 mb-3">Order Confirmed!</h1>
        <p className="text-gray-500 mb-6">You will receive a confirmation email shortly.</p>
        <Link to="/shop" className="bg-[#06B6D4] hover:bg-[#0891B2] text-white font-bold px-6 py-3 rounded-xl transition-colors">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
export default OrderConfirmationPage;
