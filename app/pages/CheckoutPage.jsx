import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useCartStore } from '@/store/cartStore';
import { ShieldCheck, Lock } from 'lucide-react';

function CheckoutPage() {
  useEffect(() => {
    document.title = 'Checkout | PetYupp';
  }, []);

  const { items, getTotal, clearCart } = useCartStore();
  const total = getTotal();
  const formatPrice = (p) => typeof p === 'number' ? p.toFixed(2) : p;

  if (!items?.length) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-black text-gray-900 mb-3">Your cart is empty</h2>
          <Link to="/shop" className="text-[#06B6D4] font-bold hover:underline">Continue Shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Lock size={18} className="text-[#06B6D4]" />
          <h1 className="text-2xl font-black text-gray-900">Secure Checkout</h1>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Form */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-black text-gray-900 mb-4">Contact Information</h2>
              <div className="grid md:grid-cols-2 gap-3">
                {['First Name', 'Last Name', 'Email', 'Phone'].map(field => (
                  <div key={field} className={field === 'Email' || field === 'Phone' ? 'md:col-span-2' : ''}>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">{field}</label>
                    <input type={field === 'Email' ? 'email' : 'text'}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#06B6D4] outline-none" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="font-black text-gray-900 mb-4">Shipping Address</h2>
              <div className="grid md:grid-cols-2 gap-3">
                {['Address', 'City', 'State', 'ZIP Code'].map((field, i) => (
                  <div key={field} className={i === 0 ? 'md:col-span-2' : ''}>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">{field}</label>
                    <input type="text"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#06B6D4] outline-none" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 h-fit">
            <h3 className="font-black text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
              {items.map(item => (
                <div key={item.id} className="flex justify-between text-sm text-gray-600">
                  <span className="line-clamp-1 flex-1 pr-2">{item.name} ×{item.quantity}</span>
                  <span className="font-semibold">${formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-between font-black text-gray-900 mb-4">
              <span>Total</span><span>${formatPrice(total)}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
              <ShieldCheck size={14} className="text-[#10B981]" />
              <span>Secure 256-bit SSL encryption</span>
            </div>
            <button className="w-full bg-[#06B6D4] hover:bg-[#0891B2] text-white font-black py-3 rounded-xl transition-colors">
              Place Order →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
export default CheckoutPage;
