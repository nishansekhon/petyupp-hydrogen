import React, { useEffect } from 'react';
function CookiePolicyPage() {
  useEffect(() => {
    document.title = 'Cookie Policy | PetYupp';
  }, []);
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Cookie Policy</h1>
        <div className="space-y-4 text-sm text-gray-600">
          <p>PetYupp uses cookies to improve your experience. Essential cookies are required for the site to function. Analytics cookies help us understand usage.</p>
          <p>You can manage cookie preferences in your browser settings.</p>
          <p>Questions? Email <a href="mailto:hello@petyupp.com" className="text-[#06B6D4]">hello@petyupp.com</a></p>
        </div>
      </div>
    </div>
  );
}
export default CookiePolicyPage;
