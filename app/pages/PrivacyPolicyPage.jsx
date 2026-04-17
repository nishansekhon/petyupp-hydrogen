import React, { useEffect } from 'react';
function PrivacyPolicyPage() {
  useEffect(() => {
    document.title = 'Privacy Policy | PetYupp';
  }, []);
  return (
    <div className="min-h-screen bg-white pt-[96px]">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: March 2026</p>
        <div className="space-y-6 text-sm text-gray-600">
          <p>PetYupp is committed to protecting your personal information and your right to privacy.</p>
          <div><h2 className="text-base font-bold text-gray-900 mb-2">Information We Collect</h2>
            <p>We collect information you provide when creating an account, placing orders, or contacting us, including name, email, address, and payment information.</p></div>
          <div><h2 className="text-base font-bold text-gray-900 mb-2">How We Use Your Information</h2>
            <p>We use your information to process orders, provide customer support, and improve our services. We never sell your data to third parties.</p></div>
          <div><h2 className="text-base font-bold text-gray-900 mb-2">Contact</h2>
            <p>Questions? Email <a href="mailto:hello@petyupp.com" className="text-[#06B6D4]">hello@petyupp.com</a></p></div>
        </div>
      </div>
    </div>
  );
}
export default PrivacyPolicyPage;
