import React, { useEffect } from 'react';
import { Link } from 'react-router';
import { Shield, Leaf, Heart, Award, Truck, Star } from 'lucide-react';

function AboutPage() {
  useEffect(() => {
    document.title = 'About Us | PetYupp';
  }, []);

  const values = [
    { icon: Leaf, title: 'Certified Natural', desc: 'Every ingredient is lab-tested and certified natural. No fillers, no artificial additives — ever.', color: 'text-[#10B981]', bg: 'bg-[#10B981]/10' },
    { icon: Shield, title: 'Vet-Approved Formulas', desc: 'Our products are developed in collaboration with veterinary nutritionists for optimal safety and efficacy.', color: 'text-[#06B6D4]', bg: 'bg-[#06B6D4]/10' },
    { icon: Heart, title: 'Made for Real Dogs', desc: 'We solve real problems — anxiety, dental health, joint pain, digestive issues — with targeted natural solutions.', color: 'text-pink-500', bg: 'bg-pink-50' },
    { icon: Award, title: 'Premium US Quality', desc: 'Top-tier ingredients sourced responsibly. Premium quality at fair American prices.', color: 'text-yellow-500', bg: 'bg-yellow-50' },
    { icon: Truck, title: 'Free US & Canada Shipping', desc: 'Free shipping on all orders over $49 across the US and Canada. Always.', color: 'text-[#06B6D4]', bg: 'bg-[#06B6D4]/10' },
    { icon: Star, title: '30-Day Guarantee', desc: 'Your dog will love our products. If not, we\'ll make it right — no questions asked.', color: 'text-[#10B981]', bg: 'bg-[#10B981]/10' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#ecfeff] to-[#f0fdf4] py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="text-4xl mb-4">🐾</div>
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-4">
            Natural solutions for your dog's real problems
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
            PetYupp was founded with one mission: give American dog owners access to the highest-quality natural dog products at fair prices. No hype, no fillers — just results.
          </p>
          <Link to="/shop" className="inline-flex items-center gap-2 bg-[#06B6D4] hover:bg-[#0891B2] text-white font-bold px-8 py-3 rounded-xl transition-all hover:scale-105">
            Shop Our Products
          </Link>
        </div>
      </div>

      {/* Values */}
      <div className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl md:text-3xl font-black text-gray-900 text-center mb-12">Why PetYupp?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {values.map((val, i) => (
            <div key={i} className={`${val.bg} rounded-2xl p-6 border border-gray-100`}>
              <div className={`w-12 h-12 rounded-full bg-white flex items-center justify-center mb-4 shadow-sm`}>
                <val.icon size={22} className={val.color} />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">{val.title}</h3>
              <p className="text-sm text-gray-600">{val.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-[#06B6D4] py-12">
        <div className="max-w-2xl mx-auto px-4 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-black mb-3">Ready to help your dog thrive?</h2>
          <p className="text-cyan-100 mb-6">Free shipping on orders over $49. 30-day guarantee.</p>
          <Link to="/shop" className="inline-block bg-white text-[#06B6D4] font-black px-8 py-3 rounded-xl hover:scale-105 transition-all">
            Shop PetYupp →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AboutPage;
