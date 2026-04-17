import React, { useEffect } from 'react';
function ShippingPage() {
  useEffect(() => {
    document.title = 'Shipping Information | PetYupp';
  }, []);

  return (
    <div className="min-h-screen bg-white pt-[96px]">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-black text-gray-900 mb-6">Shipping Information</h1>
        <div className="bg-[#06B6D4]/10 rounded-2xl p-5 border border-[#06B6D4]/20 mb-6">
          <h2 className="text-lg font-black text-gray-900 mb-2">Free Shipping on Orders Over $49</h2>
          <p className="text-gray-600 text-sm">Across the US and Canada. Always.</p>
        </div>
        <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Order Value</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">US</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Canada</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-100">
                <td className="px-4 py-3">Under $49</td>
                <td className="px-4 py-3">$4.99</td>
                <td className="px-4 py-3">$7.99</td>
              </tr>
              <tr className="border-t border-gray-100 bg-[#10B981]/5">
                <td className="px-4 py-3 font-bold">$49+</td>
                <td className="px-4 py-3 font-bold text-[#10B981]">FREE</td>
                <td className="px-4 py-3 font-bold text-[#10B981]">FREE</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="space-y-3 text-sm text-gray-600">
          <p><strong>Standard shipping:</strong> 5-7 business days</p>
          <p><strong>Expedited shipping:</strong> 2-3 business days</p>
          <p><strong>Processing:</strong> Orders placed before 2 PM EST ship same day</p>
        </div>
      </div>
    </div>
  );
}
export default ShippingPage;
