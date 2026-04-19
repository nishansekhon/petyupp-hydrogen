import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';
import { Plus, Trash2, Edit2, GripVertical, Eye, EyeOff, Play, X, Save, ExternalLink } from 'lucide-react';

const API_URL = API_BASE_URL;

const AdminVideosPage = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    username: '',
    views: '0',
    video_url: '',
    thumbnail_url: '',
    product_id: '',
    product_name: '',
    is_active: true
  });
  const [draggedIndex, setDraggedIndex] = useState(null);

  useEffect(() => {
    fetchVideos();
    fetchProducts();
  }, []);

  const fetchVideos = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/videos`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setVideos(data.videos || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/products`);
      const data = await response.json();
      setProducts(Array.isArray(data) ? data : (data.products || []));
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const url = editingVideo
        ? `${API_URL}/api/videos/${editingVideo.id}`
        : `${API_URL}/api/videos`;

      const method = editingVideo ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        fetchVideos();
        resetForm();
      }
    } catch (error) {
      console.error('Error saving video:', error);
    }
  };

  const handleDelete = async (videoId) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/videos/${videoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        fetchVideos();
      }
    } catch (error) {
      console.error('Error deleting video:', error);
    }
  };

  const toggleActive = async (video) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/videos/${video.id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_active: !video.is_active })
      });

      if (response.ok) {
        fetchVideos();
      }
    } catch (error) {
      console.error('Error toggling video status:', error);
    }
  };

  const handleEdit = (video) => {
    setEditingVideo(video);
    setFormData({
      title: video.title || '',
      username: video.username || '',
      views: video.views || '0',
      video_url: video.video_url || '',
      thumbnail_url: video.thumbnail_url || '',
      product_id: video.product_id || '',
      product_name: video.product_name || '',
      is_active: video.is_active !== false
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingVideo(null);
    setFormData({
      title: '',
      username: '',
      views: '0',
      video_url: '',
      thumbnail_url: '',
      product_id: '',
      product_name: '',
      is_active: true
    });
  };

  const handleProductSelect = (e) => {
    const productId = e.target.value;
    const product = products.find(p => p.id === productId || p._id === productId);
    setFormData({
      ...formData,
      product_id: productId,
      product_name: product ? product.name : ''
    });
  };

  // Drag and drop handlers
  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newVideos = [...videos];
    const draggedVideo = newVideos[draggedIndex];
    newVideos.splice(draggedIndex, 1);
    newVideos.splice(index, 0, draggedVideo);

    setVideos(newVideos);
    setDraggedIndex(index);
  };

  const handleDragEnd = async () => {
    setDraggedIndex(null);
    // Save new order to backend
    try {
      const token = localStorage.getItem('adminToken');
      const videoIds = videos.map(v => v.id);
      await fetch(`${API_URL}/api/videos/reorder`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ video_ids: videoIds })
      });
    } catch (error) {
      console.error('Error saving video order:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">Customer Videos</h1>
            <p className="text-sm text-gray-400 mt-1">Manage testimonial videos displayed on product pages</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Video
          </button>
        </div>

        {/* Video Upload Instructions */}
        <div className="bg-slate-800 rounded-lg p-4 mb-6 border border-slate-700">
          <h3 className="text-sm font-semibold text-teal-400 mb-2">📹 Video Upload Instructions</h3>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>• Upload videos to Cloudinary first, then paste the URL here</li>
            <li>• Recommended: 9:16 aspect ratio (vertical video like TikTok/Reels)</li>
            <li>• Keep videos under 30 seconds for best engagement</li>
            <li>• Thumbnail should be a frame from the video or product image</li>
            <li>• Cloudinary video URL format: https://res.cloudinary.com/petyupp/video/upload/...</li>
          </ul>
        </div>

        {/* Add/Edit Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-4 border-b border-slate-700">
                <h2 className="text-lg font-semibold">
                  {editingVideo ? 'Edit Video' : 'Add New Video'}
                </h2>
                <button onClick={resetForm} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {/* Title/Caption */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Caption *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Bruno loves his chicken feet! 🐾"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>

                {/* Username */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Customer Username *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                    placeholder="@dogmom_priya"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>

                {/* Views */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    View Count
                  </label>
                  <input
                    type="text"
                    value={formData.views}
                    onChange={(e) => setFormData({...formData, views: e.target.value})}
                    placeholder="2.3K"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* Video URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Video URL (Cloudinary) *
                  </label>
                  <input
                    type="url"
                    value={formData.video_url}
                    onChange={(e) => setFormData({...formData, video_url: e.target.value})}
                    placeholder="https://res.cloudinary.com/petyupp/video/upload/..."
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>

                {/* Thumbnail URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Thumbnail URL (Cloudinary) *
                  </label>
                  <input
                    type="url"
                    value={formData.thumbnail_url}
                    onChange={(e) => setFormData({...formData, thumbnail_url: e.target.value})}
                    placeholder="https://res.cloudinary.com/petyupp/image/upload/..."
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-teal-500"
                    required
                  />
                </div>

                {/* Thumbnail Preview */}
                {formData.thumbnail_url && (
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-28 rounded-lg overflow-hidden bg-slate-700">
                      <img
                        src={formData.thumbnail_url}
                        alt="Thumbnail preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="text-xs text-gray-400">Thumbnail Preview (9:16)</span>
                  </div>
                )}

                {/* Link to Product */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Link to Product (Optional)
                  </label>
                  <select
                    value={formData.product_id}
                    onChange={handleProductSelect}
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="">No product linked</option>
                    {products.map(product => (
                      <option key={product.id || product._id} value={product.id || product._id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Active Toggle */}
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-600 rounded-full peer peer-checked:bg-teal-600 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                  <span className="text-sm text-gray-300">Active (visible on product pages)</span>
                </div>

                {/* Submit Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {editingVideo ? 'Update Video' : 'Add Video'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Videos List */}
        {videos.length === 0 ? (
          <div className="bg-slate-800 rounded-xl p-8 text-center border border-slate-700">
            <Play className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-300 mb-1">No videos yet</h3>
            <p className="text-sm text-gray-500 mb-4">Add customer testimonial videos to display on product pages</p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-teal-600 hover:bg-teal-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Add First Video
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {videos.map((video, index) => (
              <div
                key={video.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`bg-slate-800 rounded-xl overflow-hidden border border-slate-700 transition-all ${
                  draggedIndex === index ? 'opacity-50 scale-95' : ''
                } ${!video.is_active ? 'opacity-60' : ''}`}
              >
                {/* Video Thumbnail */}
                <div className="relative aspect-[9/16] bg-slate-700">
                  {video.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-8 h-8 text-gray-600" />
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                  {/* Drag Handle */}
                  <div className="absolute top-2 left-2 cursor-grab active:cursor-grabbing">
                    <GripVertical className="w-5 h-5 text-white/70" />
                  </div>

                  {/* Status Badge */}
                  <div className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-medium ${
                    video.is_active ? 'bg-green-500/80 text-white' : 'bg-gray-500/80 text-white'
                  }`}>
                    {video.is_active ? 'Active' : 'Inactive'}
                  </div>

                  {/* Play Icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <a
                      href={video.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 hover:bg-white/30 transition-colors"
                    >
                      <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                    </a>
                  </div>

                  {/* Bottom Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <p className="text-white text-[10px] font-medium leading-tight line-clamp-2">{video.title}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-white/80 text-[9px]">{video.username}</span>
                      <span className="text-white/60 text-[9px]">· {video.views}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-2 flex items-center justify-between bg-slate-800/90">
                  <button
                    onClick={() => toggleActive(video)}
                    className={`p-1.5 rounded-lg transition-colors ${
                      video.is_active
                        ? 'text-green-400 hover:bg-green-500/20'
                        : 'text-gray-400 hover:bg-gray-500/20'
                    }`}
                    title={video.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {video.is_active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  {video.product_id && (
                    <a
                      href={`/products/${video.product_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-teal-400 hover:bg-teal-500/20 transition-colors"
                      title="View linked product"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}

                  <button
                    onClick={() => handleEdit(video)}
                    className="p-1.5 rounded-lg text-blue-400 hover:bg-blue-500/20 transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(video.id)}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {videos.length > 0 && (
          <div className="mt-6 flex items-center gap-4 text-sm text-gray-400">
            <span>{videos.length} total videos</span>
            <span>·</span>
            <span>{videos.filter(v => v.is_active).length} active</span>
            <span>·</span>
            <span>{videos.filter(v => !v.is_active).length} inactive</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVideosPage;
