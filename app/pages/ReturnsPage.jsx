import React, { useEffect } from 'react';
function ReturnsPage() {
  useEffect(() => {
    document.title = 'Returns | PetYupp';
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-black text-gray-900 mb-6">Returns & Refunds</h1>
        <div className="bg-[#10B981]/10 rounded-2xl p-5 border border-[#10B981]/20 mb-6">
          <h2 className="text-lg font-black text-gray-900 mb-2">30-Day Hassle-Free Returns</h2>
          <p className="text-gray-600 text-sm">Your dog's satisfaction is our priority. If you\'re not 100% happy with your purchase, we\'ll make it right — no questions asked.</p>
        </div>
        <div className="space-y-4 text-sm text-gray-600">
          <div>
            <h3 className="font-bold text-gray-900 mb-1">How to Return</h3>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Email hello@petyupp.com within 30 days of purchase</li>
              <li>Include your order number and reason for return</li>
              <li>We\'ll send you a prepaid return label</li>
              <li>Refund processed within 3-5 business days of receiving return</li>
            </ol>
          </div>
          <div>
            <h3 className="font-bold text-gray-900 mb-1">Eligible Items</h3>
            <p>Unopened items in original packaging. For opened products, contact us — we\'ll work with you.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
export default ReturnsPage;
