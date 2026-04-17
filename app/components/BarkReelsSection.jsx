import React from 'react';
import { Play, Star } from 'lucide-react';
import { Link } from 'react-router';

const UGC_ITEMS = [
  { id: 1, name: 'Max', owner: 'Sarah M.', rating: 5, text: 'The calming chews completely transformed Max! He used to bark all day. Now he\'s so relaxed.', product: 'Calming Chews', image: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=300&h=300&fit=crop' },
  { id: 2, name: 'Bella', owner: 'James T.', rating: 5, text: 'Her teeth are so much cleaner after just 2 weeks of the dental chews. Our vet was impressed!', product: 'Dental Chews', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop' },
  { id: 3, name: 'Buddy', owner: 'Emily R.', rating: 5, text: 'Buddy was limping badly. After a month on the joint support chews, he runs like a puppy again!', product: 'Joint Support', image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=300&h=300&fit=crop' },
  { id: 4, name: 'Luna', owner: 'Mike D.', rating: 5, text: 'Luna had terrible digestive issues. These gut health treats fixed her in less than 2 weeks!', product: 'Gut Health', image: 'https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=300&h=300&fit=crop' },
];

function BarkReelsSection() {
  return (
    <div className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {UGC_ITEMS.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="aspect-square overflow-hidden bg-gray-50 relative">
              <img src={item.image} alt={item.name}
                className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <div className="absolute bottom-2 left-2 text-white">
                <p className="text-xs font-bold">{item.name}</p>
                <span className="text-xs bg-[#06B6D4] px-1.5 py-0.5 rounded-full">{item.product}</span>
              </div>
            </div>
            <div className="p-3">
              <div className="flex items-center gap-0.5 mb-1">
                {[...Array(item.rating)].map((_, i) => <Star key={i} size={10} className="text-yellow-400 fill-yellow-400" />)}
              </div>
              <p className="text-xs text-gray-600 line-clamp-3 mb-1">"{item.text}"</p>
              <p className="text-xs font-semibold text-gray-500">— {item.owner}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="text-center mt-6">
        <Link to="/shop" className="inline-flex items-center gap-2 bg-[#06B6D4] hover:bg-[#0891B2] text-white font-bold px-6 py-3 rounded-xl transition-all hover:scale-105 text-sm">
          Shop Products Dogs Love 🐾
        </Link>
      </div>
    </div>
  );
}

export default BarkReelsSection;
