import React, { useEffect } from 'react';
function TermsConditionsPage() {
  useEffect(() => {
    document.title = 'Terms and Conditions | PetYupp';
  }, []);
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Terms and Conditions</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: March 2026</p>
        <div className="space-y-4 text-sm text-gray-600">
          <p>By using PetYupp.com, you agree to these Terms. Please read carefully before using our services.</p>
          <div><h2 className="text-base font-bold text-gray-900 mb-1">Use of Site</h2>
            <p>You agree to use our site for lawful purposes only and not to interfere with normal site operation.</p></div>
          <div><h2 className="text-base font-bold text-gray-900 mb-1">Products and Pricing</h2>
            <p>All products are subject to availability. Prices are in USD. We reserve the right to limit quantities.</p></div>
          <div><h2 className="text-base font-bold text-gray-900 mb-1">Governing Law</h2>
            <p>These terms are governed by the laws of the United States.</p></div>
          <div><h2 className="text-base font-bold text-gray-900 mb-1">Contact</h2>
            <p>Email <a href="mailto:hello@petyupp.com" className="text-[#06B6D4]">hello@petyupp.com</a></p></div>
        </div>
      </div>
    </div>
  );
}
export default TermsConditionsPage;
