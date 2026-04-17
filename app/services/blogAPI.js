import { API_BASE_URL } from '@/config/api';

const API_BASE = API_BASE_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  };
};

export const blogAPI = {
  // Admin endpoints
  getAllPosts: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE}/api/admin/blog/posts?${query}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch posts');
    return response.json();
  },

  getPost: async (id) => {
    const response = await fetch(`${API_BASE}/api/admin/blog/posts/${id}`, {
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch post');
    return response.json();
  },

  createPost: async (data) => {
    const response = await fetch(`${API_BASE}/api/admin/blog/posts`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to create post');
    return response.json();
  },

  updatePost: async (id, data) => {
    const response = await fetch(`${API_BASE}/api/admin/blog/posts/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to update post');
    return response.json();
  },

  deletePost: async (id) => {
    const response = await fetch(`${API_BASE}/api/admin/blog/posts/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error('Failed to delete post');
    return response.json();
  },

  uploadImage: async (file) => {
    const token = localStorage.getItem('adminToken');
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch(`${API_BASE}/api/admin/blog/upload-image`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: formData
    });
    
    if (!response.ok) throw new Error('Failed to upload image');
    return response.json();
  },

  // Public endpoints
  getPublishedPosts: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const response = await fetch(`${API_BASE}/api/blog/posts?${query}`);
    if (!response.ok) throw new Error('Failed to fetch published posts');
    return response.json();
  },

  getPostBySlug: async (slug, preview = false) => {
    const url = preview 
      ? `${API_BASE}/api/blog/posts/${slug}?preview=true`
      : `${API_BASE}/api/blog/posts/${slug}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch post');
    return response.json();
  },

  getCategories: async () => {
    const response = await fetch(`${API_BASE}/api/blog/categories`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    return response.json();
  },

  getTags: async () => {
    const response = await fetch(`${API_BASE}/api/blog/tags`);
    if (!response.ok) throw new Error('Failed to fetch tags');
    return response.json();
  }
};

export default blogAPI;
