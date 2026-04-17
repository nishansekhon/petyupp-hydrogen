import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQS = [
  { q: 'What makes PetYupp products different?', a: 'All PetYupp products are natural, vet-approved, and formulated to solve specific dog health problems. We use no artificial additives, fillers, or preservatives.' },
  { q: 'Do you offer free shipping?', a: 'Yes! We offer free shipping on all orders over $49 across the US and Canada. For orders under $49, standard shipping rates apply.' },
  { q: 'What is your return policy?', a: 'We offer a hassle-free 30-day return guarantee. If your dog doesn\'t love our products, contact us and we\'ll make it right — no questions asked.' },
  { q: 'Are your products safe for all dog breeds?', a: 'Our products are formulated for dogs of all breeds and sizes. However, please always consult with your veterinarian before introducing new supplements.' },
  { q: 'How long does shipping take?', a: 'Standard shipping takes 5-7 business days. Expedited options are available at checkout for faster delivery.' },
  { q: 'Are your ingredients natural?', a: 'Yes! Every product is natural. We source only responsibly-farmed, clean ingredients. Full ingredient lists are available on each product page.' },
  { q: 'Can I use multiple products together?', a: 'Yes, our products are designed to complement each other. For specific health concerns, we recommend consulting your vet.' },
];

function FAQPage() {
  const [open, setOpen] = useState(null);

  useEffect(() => {
    document.title = 'FAQ | PetYupp';
  }, []);
  
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-gray-900 mb-3">Frequently Asked Questions</h1>
          <p className="text-gray-500">Everything you need to know about PetYupp</p>
        </div>
        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="border border-gray-200 rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-gray-900 text-sm md:text-base">{faq.q}</span>
                {open === i ? <ChevronUp size={18} className="text-[#06B6D4] flex-shrink-0" /> : <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />}
              </button>
              {open === i && (
                <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
        <div className="text-center mt-10 p-6 bg-[#F9FAFB] rounded-2xl">
          <p className="text-gray-700 mb-3">Still have questions?</p>
          <a href="mailto:hello@petyupp.com" className="text-[#06B6D4] font-bold hover:underline">hello@petyupp.com</a>
        </div>
      </div>
    </div>
  );
}

export default FAQPage;
