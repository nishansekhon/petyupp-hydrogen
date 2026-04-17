import React from 'react';
import { Link } from 'react-router';
import Footer from '@/components/Footer';

const CAT_PRODUCTS = [
  { id: '1', name: 'Calming Treats for Cats', price: 24.99, icon: '🌿', desc: 'Natural chamomile calming chews for anxious cats' },
  { id: '2', name: 'Dental Chews for Cats', price: 19.99, icon: '🦷', desc: 'Keep your cat\'s teeth clean naturally' },
  { id: '3', name: 'Joint Support for Cats', price: 29.99, icon: '🦴', desc: 'Glucosamine support for senior cats' },
  { id: '4', name: 'Digestive Health for Cats', price: 22.99, icon: '🌿', desc: 'Probiotic support for a happy tummy' },
];

function CatCollectionPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-teal-50 py-12 text-center px-4">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
          Cat Collection 🐱
        </h1>
        <p className="text-gray-600 text-base md:text-lg max-w-xl mx-auto">
          Premium natural products for your feline friends. Vet-approved.
        </p>
      <div className="mt-4">
        <span className="inline-block bg-[#06B6D4] text-white text-sm font-semibold px-4 py-2 rounded-full cursor-default select-none">
          Coming Soon
        </span>
      </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {CAT_PRODUCTS.map((product) => (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              className="bg-white rounded-2xl p-5 text-center shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 group"
            >
              <div className="text-4xl mb-3">{product.icon}</div>
              <h3 className="font-bold text-sm text-gray-900 mb-1">{product.name}</h3>
              <p className="text-xs text-gray-500 mb-3">{product.desc}</p>
              <span className="font-black text-[#06B6D4] text-lg">
                ${product.price.toFixed(2)}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default CatCollectionPage;
