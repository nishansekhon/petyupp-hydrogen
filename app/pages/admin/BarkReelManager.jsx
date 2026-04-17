import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ExternalLink, Eye, Heart, Instagram, Video, Star, ArrowLeft, Upload, X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { API_BASE_URL } from '@/config/api';

const BarkReelManager = () => {
    const navigate = useNavigate();
    const [reels, setReels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingReel, setEditingReel] = useState(null);
    const [filter, setFilter] = useState({ status: '', category: '' });
    const [uploading, setUploading] = useState(false);
    
    const [formData, setFormData] = useState({
        videoUrl: '',
        thumbnailUrl: '',
        title: '',
        creator: '',
        petName: '',
        category: 'Trending',
        platform: 'instagram',
        views: 0,
        likes: 0,
        status: 'draft',
        featured: false,
        sortOrder: 0
    });

    const categories = ['Trending', 'Reviews', 'Pet Tips'];
    const platforms = ['instagram', 'tiktok', 'youtube'];
    const statuses = ['published', 'draft'];

    useEffect(() => {
        fetchReels();
    }, [filter]);

    const fetchReels = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filter.status) params.append('status', filter.status);
            if (filter.category) params.append('category', filter.category);
            
            const response = await fetch(`${API_BASE_URL}/api/admin/bark-reels?${params}`);
            const data = await response.json();
            
            if (data.success) {
                setReels(data.reels);
            }
        } catch (error) {
            console.error('Error fetching reels:', error);
        }
        setLoading(false);
    };

    // Handle thumbnail upload to Cloudinary
    const handleThumbnailUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        setUploading(true);
        
        const uploadFormData = new FormData();
        uploadFormData.append('file', file);
        uploadFormData.append('folder', 'bark-reels');
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/upload/image`, {
                method: 'POST',
                body: uploadFormData
            });
            const data = await response.json();
            
            if (data.success && data.url) {
                setFormData(prev => ({ ...prev, thumbnailUrl: data.url }));
            } else {
                alert('Upload failed: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Upload failed: ' + error.message);
        }
        
        setUploading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            const url = editingReel 
                ? `${API_BASE_URL}/api/admin/bark-reels/${editingReel._id}`
                : `${API_BASE_URL}/api/admin/bark-reels`;
            
            const method = editingReel ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                fetchReels();
                closeModal();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            console.error('Error saving reel:', error);
            alert('Error saving reel');
        }
    };

    const handleDelete = async (reelId) => {
        if (!window.confirm('Are you sure you want to delete this reel?')) return;
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/bark-reels/${reelId}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if (data.success) {
                fetchReels();
            } else {
                alert('Error: ' + data.error);
            }
        } catch (error) {
            console.error('Error deleting reel:', error);
        }
    };

    const openAddModal = () => {
        setEditingReel(null);
        setFormData({
            videoUrl: '',
            thumbnailUrl: '',
            title: '',
            creator: '',
            petName: '',
            category: 'Trending',
            platform: 'instagram',
            views: 0,
            likes: 0,
            status: 'draft',
            featured: false,
            sortOrder: reels.length
        });
        setModalOpen(true);
    };

    const openEditModal = (reel) => {
        setEditingReel(reel);
        setFormData({
            videoUrl: reel.videoUrl || '',
            thumbnailUrl: reel.thumbnailUrl || '',
            title: reel.title || '',
            creator: reel.creator || '',
            petName: reel.petName || '',
            category: reel.category || 'Trending',
            platform: reel.platform || 'instagram',
            views: reel.views || 0,
            likes: reel.likes || 0,
            status: reel.status || 'draft',
            featured: reel.featured || false,
            sortOrder: reel.sortOrder || 0
        });
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditingReel(null);
    };

    const getPlatformIcon = (platform) => {
        switch (platform) {
            case 'instagram': return <Instagram className="w-4 h-4 text-pink-500" />;
            case 'tiktok': return <Video className="w-4 h-4 text-white" />;
            case 'youtube': return <Video className="w-4 h-4 text-red-500" />;
            default: return <Video className="w-4 h-4" />;
        }
    };

    return (
        <div className="p-6 bg-gray-900 min-h-screen text-white">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/admin/marketing')}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            🎬 BarkReel Manager
                        </h1>
                        <p className="text-gray-400 text-sm">Manage UGC videos for the BarkReels page</p>
                    </div>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    Add New Reel
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
                <select
                    value={filter.status}
                    onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                >
                    <option value="">All Status</option>
                    {statuses.map(s => (
                        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                </select>
                <select
                    value={filter.category}
                    onChange={(e) => setFilter({ ...filter, category: e.target.value })}
                    className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
                >
                    <option value="">All Categories</option>
                    {categories.map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
                <div className="ml-auto text-gray-400">
                    {reels.length} reel{reels.length !== 1 ? 's' : ''} found
                </div>
            </div>

            {/* Reels Table */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-700">
                        <tr>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Thumbnail</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Title</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Creator</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Category</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Platform</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Stats</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Status</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-300">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan="8" className="px-4 py-8 text-center text-gray-400">
                                    Loading...
                                </td>
                            </tr>
                        ) : reels.length === 0 ? (
                            <tr>
                                <td colSpan="8" className="px-4 py-8 text-center text-gray-400">
                                    No reels found. Click "Add New Reel" to get started.
                                </td>
                            </tr>
                        ) : (
                            reels.map((reel) => (
                                <tr key={reel._id} className="border-t border-gray-700 hover:bg-gray-750">
                                    <td className="px-4 py-3">
                                        {reel.thumbnailUrl ? (
                                            <img 
                                                src={reel.thumbnailUrl} 
                                                alt={reel.title}
                                                className="w-16 h-16 object-cover rounded-lg"
                                            />
                                        ) : (
                                            <div className="w-16 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
                                                <Video className="w-6 h-6 text-gray-500" />
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="font-medium flex items-center gap-2">
                                            {reel.title}
                                            {reel.featured && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                                        </div>
                                        {reel.petName && (
                                            <div className="text-sm text-gray-400">🐕 {reel.petName}</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-teal-400">{reel.creator}</td>
                                    <td className="px-4 py-3">
                                        <span className="px-2 py-1 bg-gray-700 rounded text-sm">
                                            {reel.category}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            {getPlatformIcon(reel.platform)}
                                            <span className="capitalize">{reel.platform}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3 text-sm text-gray-400">
                                            <span className="flex items-center gap-1">
                                                <Eye className="w-4 h-4" /> {(reel.views || 0).toLocaleString()}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Heart className="w-4 h-4" /> {(reel.likes || 0).toLocaleString()}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-2 py-1 rounded text-sm ${
                                            reel.status === 'published' 
                                                ? 'bg-green-600/20 text-green-400' 
                                                : 'bg-yellow-600/20 text-yellow-400'
                                        }`}>
                                            {reel.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <a
                                                href={reel.videoUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 hover:bg-gray-700 rounded transition-colors"
                                                title="View Original"
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                            <button
                                                onClick={() => openEditModal(reel)}
                                                className="p-2 hover:bg-gray-700 rounded text-blue-400 transition-colors"
                                                title="Edit"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(reel._id)}
                                                className="p-2 hover:bg-gray-700 rounded text-red-400 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            {modalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">
                            {editingReel ? '✏️ Edit Reel' : '➕ Add New Reel'}
                        </h2>
                        
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Video URL */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">
                                    Video URL (Instagram/TikTok/YouTube) *
                                </label>
                                <input
                                    type="url"
                                    value={formData.videoUrl}
                                    onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                                    placeholder="https://instagram.com/p/..."
                                    required
                                />
                            </div>

                            {/* Thumbnail URL */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-2">
                                    Thumbnail
                                </label>
                                
                                {/* Upload Button */}
                                <div className="mb-3">
                                    <label className="cursor-pointer block">
                                        <div className={`flex items-center justify-center gap-2 px-4 py-4 border-2 border-dashed rounded-lg transition-colors ${
                                            uploading 
                                                ? 'border-teal-500 bg-teal-500/10' 
                                                : 'border-gray-600 hover:border-teal-500 hover:bg-gray-700/50'
                                        }`}>
                                            {uploading ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                                                    <span className="text-teal-400">Uploading...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="w-5 h-5 text-gray-400" />
                                                    <span className="text-gray-300">Upload Screenshot</span>
                                                </>
                                            )}
                                        </div>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleThumbnailUpload}
                                            className="hidden"
                                            disabled={uploading}
                                        />
                                    </label>
                                </div>
                                
                                {/* Or paste URL */}
                                <div className="text-center text-gray-500 text-xs mb-2">— or paste URL —</div>
                                
                                <input
                                    type="url"
                                    value={formData.thumbnailUrl}
                                    onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                                    placeholder="https://..."
                                />
                                
                                {/* Preview */}
                                {formData.thumbnailUrl && (
                                    <div className="mt-3 relative inline-block">
                                        <img 
                                            src={formData.thumbnailUrl} 
                                            alt="Preview" 
                                            className="w-32 h-32 object-cover rounded-lg border border-gray-600"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, thumbnailUrl: '' })}
                                            className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                                            title="Remove thumbnail"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Title */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Title *</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                                    placeholder="Golden Retriever Tries BarkBite Cookies"
                                    required
                                />
                            </div>

                            {/* Creator & Pet Name */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Creator Handle *</label>
                                    <input
                                        type="text"
                                        value={formData.creator}
                                        onChange={(e) => setFormData({ ...formData, creator: e.target.value })}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                                        placeholder="@happypaws_delhi"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Pet Name</label>
                                    <input
                                        type="text"
                                        value={formData.petName}
                                        onChange={(e) => setFormData({ ...formData, petName: e.target.value })}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                                        placeholder="Max"
                                    />
                                </div>
                            </div>

                            {/* Category & Platform */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                                    >
                                        {categories.map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Platform</label>
                                    <select
                                        value={formData.platform}
                                        onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                                    >
                                        {platforms.map(p => (
                                            <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Views & Likes */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Views</label>
                                    <input
                                        type="number"
                                        value={formData.views}
                                        onChange={(e) => setFormData({ ...formData, views: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Likes</label>
                                    <input
                                        type="number"
                                        value={formData.likes}
                                        onChange={(e) => setFormData({ ...formData, likes: parseInt(e.target.value) || 0 })}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                                    />
                                </div>
                            </div>

                            {/* Status & Featured */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-400 mb-1">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                                    >
                                        {statuses.map(s => (
                                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-center pt-6">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={formData.featured}
                                            onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                                            className="w-5 h-5 rounded bg-gray-700 border-gray-600"
                                        />
                                        <span>⭐ Featured Reel</span>
                                    </label>
                                </div>
                            </div>

                            {/* Sort Order */}
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">Sort Order (lower = higher priority)</label>
                                <input
                                    type="number"
                                    value={formData.sortOrder}
                                    onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white"
                                    placeholder="0"
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex justify-end gap-4 pt-4 border-t border-gray-700">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors"
                                >
                                    {editingReel ? 'Update Reel' : 'Add Reel'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BarkReelManager;
