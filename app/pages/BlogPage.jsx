import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

const API_URL = API_BASE_URL + '/api';

const PLACEHOLDER_POSTS = [
  { id: '1', title: '5 Natural Ways to Calm an Anxious Dog', slug: 'calm-anxious-dog', excerpt: 'Separation anxiety is one of the most common issues dog owners face. Here are 5 vet-approved natural solutions that actually work.', category: 'Dog Health', read_time: 5, created_at: '2026-03-01', image_url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=400&fit=crop' },
  { id: '2', title: 'The Complete Guide to Dog Dental Health', slug: 'dog-dental-health-guide', excerpt: 'Did you know 80% of dogs over 3 have dental disease? Here\'s everything you need to know to keep your dog\'s teeth clean naturally.', category: 'Dental Health', read_time: 7, created_at: '2026-03-10', image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop' },
  { id: '3', title: 'Joint Pain in Dogs: Signs, Causes & Natural Relief', slug: 'dog-joint-pain-natural-relief', excerpt: 'Is your dog limping, hesitant to climb stairs, or slower than usual? These could be early signs of joint pain. Learn about natural solutions.', category: 'Joint Health', read_time: 6, created_at: '2026-03-15', image_url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&h=400&fit=crop' },
];

function BlogPage() {
  useEffect(() => {
    document.title = 'Blog | PetYupp';
  }, []);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/blog`)
      .then(r => setPosts(r.data?.length ? r.data : PLACEHOLDER_POSTS))
      .catch(() => setPosts(PLACEHOLDER_POSTS))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">PetYupp Blog</h1>
          <p className="text-gray-500">Expert tips and guides for dog owners</p>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-3 gap-6">
            {[1,2,3].map(i => <div key={i} className="rounded-2xl bg-gray-100 h-64 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link key={post.id} to={`/blog/${post.slug || post.id}`}
                className="group bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                <div className="aspect-video overflow-hidden bg-gray-50">
                  <img src={post.image_url} alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {post.category && <span className="text-xs bg-[#06B6D4]/10 text-[#06B6D4] px-2 py-0.5 rounded-full font-medium">{post.category}</span>}
                    {post.read_time && <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={10} />{post.read_time} min</span>}
                  </div>
                  <h2 className="font-black text-gray-900 text-sm mb-2 line-clamp-2 group-hover:text-[#06B6D4] transition-colors">{post.title}</h2>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{post.excerpt}</p>
                  <span className="text-xs font-bold text-[#06B6D4] flex items-center gap-1">Read more <ArrowRight size={12} /></span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BlogPage;
