import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

const API_URL = API_BASE_URL + '/api';

const PLACEHOLDER_POSTS = [
  { id: '1', title: '5 Natural Ways to Calm an Anxious Dog', slug: 'calm-anxious-dog', excerpt: 'Separation anxiety is one of the most common issues dog owners face.', category: 'Dog Health', image_url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop' },
  { id: '2', title: 'The Complete Guide to Dog Dental Health', slug: 'dog-dental-health-guide', excerpt: 'Keep your dog\'s teeth clean and healthy with natural dental chews.', category: 'Dental', image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop' },
  { id: '3', title: 'Joint Pain in Dogs: Natural Relief', slug: 'dog-joint-pain-natural-relief', excerpt: 'Signs, causes, and natural solutions for dog joint pain.', category: 'Joint Health', image_url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&h=300&fit=crop' },
];

function LatestBlogsSection() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    axios.get(`${API_URL}/blog?limit=3`)
      .then(r => setPosts(r.data?.length ? r.data.slice(0, 3) : PLACEHOLDER_POSTS))
      .catch(() => setPosts(PLACEHOLDER_POSTS));
  }, []);

  return (
    <div className="grid md:grid-cols-3 gap-5">
      {posts.map((post) => (
        <Link key={post.id} to={`/blog/${post.slug || post.id}`}
          className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
          <div className="aspect-video overflow-hidden bg-gray-50">
            <img src={post.image_url} alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
          </div>
          <div className="p-4">
            {post.category && <span className="text-xs bg-[#06B6D4]/10 text-[#06B6D4] px-2 py-0.5 rounded-full font-medium">{post.category}</span>}
            <h3 className="font-bold text-gray-900 text-sm mt-2 mb-1 line-clamp-2 group-hover:text-[#06B6D4] transition-colors">{post.title}</h3>
            <p className="text-xs text-gray-500 line-clamp-2 mb-3">{post.excerpt}</p>
            <span className="text-xs font-bold text-[#06B6D4] flex items-center gap-1">Read more <ArrowRight size={12} /></span>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default LatestBlogsSection;
