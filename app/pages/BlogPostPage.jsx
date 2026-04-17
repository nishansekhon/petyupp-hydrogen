import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { ChevronRight, Calendar, Clock } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';

const API_URL = API_BASE_URL + '/api';

function BlogPostPage() {
  const { slug } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_URL}/blog/${slug}`)
      .then(r => setPost(r.data))
      .catch(() => setPost({
        title: 'Dog Health Article',
        content: '<p>Article content coming soon...</p>',
        category: 'Dog Health',
        created_at: new Date().toISOString(),
        read_time: 5,
        image_url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=400&fit=crop'
      }))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen bg-white pt-[96px] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-[#06B6D4] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-white pt-[96px]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-6">
          <Link to="/" className="hover:text-[#06B6D4]">Home</Link>
          <ChevronRight size={10} />
          <Link to="/blog" className="hover:text-[#06B6D4]">Blog</Link>
          <ChevronRight size={10} />
          <span className="text-gray-900 line-clamp-1">{post?.title}</span>
        </div>

        {post?.category && <span className="text-xs bg-[#06B6D4]/10 text-[#06B6D4] px-3 py-1 rounded-full font-medium">{post.category}</span>}

        <h1 className="text-2xl md:text-3xl font-black text-gray-900 mt-3 mb-4">{post?.title}</h1>

        <div className="flex items-center gap-4 text-xs text-gray-400 mb-6">
          {post?.created_at && <span className="flex items-center gap-1"><Calendar size={12} />{new Date(post.created_at).toLocaleDateString()}</span>}
          {post?.read_time && <span className="flex items-center gap-1"><Clock size={12} />{post.read_time} min read</span>}
        </div>

        {post?.image_url && (
          <div className="rounded-2xl overflow-hidden mb-6 aspect-video">
            <img src={post.image_url} alt={post.title} className="w-full h-full object-cover" loading="lazy" />
          </div>
        )}

        <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: post?.content || '' }} />

        <div className="mt-10 p-5 bg-[#F9FAFB] rounded-2xl text-center">
          <p className="font-bold text-gray-900 mb-3">Ready to help your dog feel better?</p>
          <Link to="/shop" className="inline-block bg-[#06B6D4] hover:bg-[#0891B2] text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm">
            Shop Natural Dog Products
          </Link>
        </div>
      </div>
    </div>
  );
}

export default BlogPostPage;
