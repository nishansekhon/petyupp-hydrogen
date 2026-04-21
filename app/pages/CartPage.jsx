import React, { useEffect } from 'react';
import { Link } from 'react-router';
import { useCartStore } from '@/store/cartStore';
import { API_BASE_URL } from '@/config/api';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';

const BACKEND_URL = API_BASE_URL;

function CartPage() {
  useEffect(() => {
    document.title = 'Your Cart | PetYupp';
  }, []);

  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCartStore();
  
  const total = getTotal();
  const freeShippingThreshold = 49;
  const remainingForFreeShip = Math.max(0, freeShippingThreshold - total);

  const formatPrice = (p) => typeof p === 'number' ? p.toFixed(2) : p;
  const getImageUrl = (url) => url?.startsWith('http') ? url : `${BACKEND_URL}${url}`;

  if (!items || items.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-black text-gray-900 mb-3">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Add some natural dog treats to get started!</p>
          <Link to="/shop" className="inline-flex items-center gap-2 bg-[#06B6D4] hover:bg-[#0891B2] text-white font-bold px-6 py-3 rounded-xl transition-colors">
            <ShoppingBag size={18} /> Shop Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-black text-gray-900 mb-6">Your Cart ({items.length} items)</h1>

        {/* Free shipping progress */}
        {remainingForFreeShip > 0 ? (
          <div className="bg-white rounded-2xl p-4 mb-6 border border-[#06B6D4]/20">
            <p className="text-sm text-gray-700 mb-2">
              Add <span className="font-bold text-[#06B6D4]">${formatPrice(remainingForFreeShip)}</span> more for free shipping! 🚚
            </p>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-[#06B6D4] h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, (total / freeShippingThreshold) * 100)}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="bg-[#10B981]/10 rounded-2xl p-4 mb-6 border border-[#10B981]/20">
            <p className="text-sm font-semibold text-[#10B981]">✓ You qualify for free shipping!</p>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="md:col-span-2 space-y-3">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-4 flex gap-4 border border-gray-100 shadow-sm">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                  <img src={getImageUrl(item.image_url)} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 mb-1">{item.name}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQuantity(item.id, Math.max(0, item.quantity - 1))}
                        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                        <Minus size={12} />
                      </button>
                      <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg bg-[#06B6D4] hover:bg-[#0891B2] text-white flex items-center justify-center transition-colors">
                        <Plus size={12} />
                      </button>
                    </div>
                    <span className="font-black text-gray-900">${formatPrice(item.price * item.quantity)}</span>
                  </div>
                </div>
                <button onClick={() => removeItem(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm h-fit">
            <h3 className="font-black text-gray-900 mb-4">Order Summary</h3>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span><span>${formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Shipping</span>
                <span className={total >= freeShippingThreshold ? 'text-[#10B981] font-semibold' : ''}>
                  {total >= freeShippingThreshold ? 'FREE' : 'Calculated at checkout'}
                </span>
              </div>
              <div className="border-t border-gray-100 pt-2 flex justify-between font-black text-gray-900">
                <span>Total</span><span>${formatPrice(total)}</span>
              </div>
            </div>
            <Link to="/checkout"
              className="block w-full bg-[#06B6D4] hover:bg-[#0891B2] text-white font-bold text-center py-3 rounded-xl transition-colors mb-3">
              Proceed to Checkout →
            </Link>
            <Link to="/shop" className="block w-full text-center text-sm text-[#06B6D4] hover:text-[#0891B2] font-semibold py-2">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;
