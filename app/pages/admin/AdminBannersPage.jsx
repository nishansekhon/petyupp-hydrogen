import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { 
  ArrowLeft, 
  Plus, 
  Edit2, 
  Trash2, 
  Eye, 
  EyeOff,
  Image as ImageIcon,
  Monitor,
  Smartphone,
  X,
  Check,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  RefreshCw
} from 'lucide-react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import axios from 'axios';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/utils/api';

const API_URL = API_BASE_URL + '/api';

const IMAGE_GUIDELINES = {
  desktop: {
    width: 1920,
    height: 600,
    aspectRatio: '16:5',
    maxSize: '1 MB',
    formats: 'JPG, PNG, WebP'
  },
  mobile: {
    width: 800,
    height: 800,
    aspectRatio: '1:1',
    maxSize: '500 KB',
    formats: 'JPG, PNG, WebP'
  }
};

const defaultFormData = {
  name: '',
  desktopImage: { url: '', width: 1920, height: 600 },
  mobileImage: { url: '', width: 800, height: 800 },
  title: '',
  subtitle: '',
  buttonText: '',
  buttonLink: '',
  isActive: true,
  displayOrder: 0
};

function AdminBannersPage() {
  const { isDarkMode } = useAdminTheme();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState(defaultFormData);
  const [saving, setSaving] = useState(false);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get(`${API_URL}/banners`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setBanners(response.data.banners || []);
    } catch (error) {
      console.error('Failed to fetch banners:', error);
      toast.error('Failed to load banners');
    } finally {
      setLoading(false);
    }
  };

  // Move banner up or down
  const moveBanner = async (bannerId, direction) => {
    const currentIndex = banners.findIndex(b => b.id === bannerId);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= banners.length) return;
    
    // Swap banners in array
    const newBanners = [...banners];
    [newBanners[currentIndex], newBanners[newIndex]] = [newBanners[newIndex], newBanners[currentIndex]];
    
    // Optimistically update UI
    setBanners(newBanners);
    
    // Update display orders on server
    const newOrder = newBanners.map(b => b.id);
    
    try {
      setReordering(true);
      const token = localStorage.getItem('adminToken');
      await axios.patch(
        `${API_URL}/banners/reorder`,
        newOrder,
        { headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      toast.success('Banner order updated');
    } catch (err) {
      console.error('Failed to reorder:', err);
      toast.error('Failed to reorder banners');
      // Revert on error
      fetchBanners();
    } finally {
      setReordering(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.desktopImage.url || !formData.mobileImage.url) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem('adminToken');
      
      if (editingBanner) {
        await axios.patch(
          `${API_URL}/banners/${editingBanner.id}`,
          formData,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        toast.success('Banner updated successfully');
      } else {
        await axios.post(
          `${API_URL}/banners`,
          { ...formData, displayOrder: banners.length },
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        toast.success('Banner created successfully');
      }
      
      fetchBanners();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Failed to save banner:', error);
      toast.error('Failed to save banner');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (bannerId) => {
    if (!window.confirm('Are you sure you want to delete this banner?')) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`${API_URL}/banners/${bannerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      toast.success('Banner deleted');
      fetchBanners();
    } catch (error) {
      console.error('Failed to delete banner:', error);
      toast.error('Failed to delete banner');
    }
  };

  const handleToggleActive = async (banner) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.patch(
        `${API_URL}/banners/${banner.id}`,
        { isActive: !banner.isActive },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      toast.success(banner.isActive ? 'Banner deactivated' : 'Banner activated');
      fetchBanners();
    } catch (error) {
      console.error('Failed to toggle banner:', error);
      toast.error('Failed to update banner');
    }
  };

  const resetForm = () => {
    setFormData(defaultFormData);
    setEditingBanner(null);
  };

  const openEditModal = (banner) => {
    setEditingBanner(banner);
    setFormData({
      name: banner.name || '',
      desktopImage: banner.desktopImage || { url: '', width: 1920, height: 600 },
      mobileImage: banner.mobileImage || { url: '', width: 800, height: 800 },
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      buttonText: banner.buttonText || '',
      buttonLink: banner.buttonLink || '',
      isActive: banner.isActive ?? true,
      displayOrder: banner.displayOrder || 0
    });
    setShowModal(true);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link 
              to="/admin" 
              className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-200'}`}
            >
              <ArrowLeft className={isDarkMode ? 'text-white' : 'text-gray-900'} size={20} />
            </Link>
            <div>
              <h1 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Banner Management
              </h1>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                Manage homepage hero sliders
              </p>
            </div>
          </div>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <Plus size={18} />
            Add Banner
          </button>
        </div>

        {/* Image Guidelines Info Box */}
        <div className={`rounded-xl p-4 mb-6 border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
          <h3 className="font-semibold text-teal-500 mb-3 flex items-center gap-2">
            <ImageIcon size={18} />
            Image Guidelines
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
              <h4 className={`font-medium mb-2 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <Monitor size={16} />
                Desktop Banner
              </h4>
              <ul className={`text-sm space-y-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                <li>• Size: <span className="text-teal-500 font-medium">{IMAGE_GUIDELINES.desktop.width} x {IMAGE_GUIDELINES.desktop.height}px</span></li>
                <li>• Aspect Ratio: <span className="text-teal-500 font-medium">{IMAGE_GUIDELINES.desktop.aspectRatio}</span></li>
                <li>• Max File Size: <span className="text-teal-500 font-medium">{IMAGE_GUIDELINES.desktop.maxSize}</span></li>
                <li>• Formats: <span className="text-teal-500 font-medium">{IMAGE_GUIDELINES.desktop.formats}</span></li>
              </ul>
            </div>
            <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
              <h4 className={`font-medium mb-2 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <Smartphone size={16} />
                Mobile Banner
              </h4>
              <ul className={`text-sm space-y-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
                <li>• Size: <span className="text-teal-500 font-medium">{IMAGE_GUIDELINES.mobile.width} x {IMAGE_GUIDELINES.mobile.height}px</span></li>
                <li>• Aspect Ratio: <span className="text-teal-500 font-medium">{IMAGE_GUIDELINES.mobile.aspectRatio}</span></li>
                <li>• Max File Size: <span className="text-teal-500 font-medium">{IMAGE_GUIDELINES.mobile.maxSize}</span></li>
                <li>• Formats: <span className="text-teal-500 font-medium">{IMAGE_GUIDELINES.mobile.formats}</span></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Banners List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : banners.length === 0 ? (
          <div className={`text-center py-16 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            <ImageIcon className={`mx-auto mb-4 ${isDarkMode ? 'text-slate-600' : 'text-gray-400'}`} size={48} />
            <p className={`text-lg font-medium mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              No banners yet
            </p>
            <p className={`mb-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              Create your first banner to display on the homepage
            </p>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium inline-flex items-center gap-2"
            >
              <Plus size={18} />
              Create Banner
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Banner Sequence Header */}
            <div className="flex items-center justify-between">
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Banner Sequence ({banners.length} {banners.length === 1 ? 'slide' : 'slides'})
              </h3>
              <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                Banners rotate every 3 seconds on homepage
              </p>
            </div>

            {/* Visual Sequence Preview */}
            <div className={`flex items-center gap-2 p-4 rounded-xl overflow-x-auto scrollbar-hide ${isDarkMode ? 'bg-slate-800/50' : 'bg-gray-100'}`}>
              {banners.map((banner, index) => (
                <div key={banner.id} className="flex items-center flex-shrink-0">
                  <div className={`relative w-20 h-12 rounded-lg overflow-hidden border-2 ${
                    banner.isActive 
                      ? 'border-teal-500' 
                      : isDarkMode ? 'border-slate-600 opacity-50' : 'border-gray-300 opacity-50'
                  }`}>
                    {banner.desktopImage?.url ? (
                      <img 
                        src={banner.desktopImage.url} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                        <ImageIcon size={16} className={isDarkMode ? 'text-slate-500' : 'text-gray-400'} />
                      </div>
                    )}
                    <div className="absolute -top-1 -left-1 w-5 h-5 bg-teal-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </div>
                  </div>
                  {index < banners.length - 1 && (
                    <span className={`mx-2 text-lg ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>→</span>
                  )}
                </div>
              ))}
              {banners.length > 0 && (
                <div className="flex items-center ml-2">
                  <RefreshCw size={16} className={`${isDarkMode ? 'text-teal-400' : 'text-teal-500'}`} />
                  <span className={`ml-1 text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>loops</span>
                </div>
              )}
            </div>

            {/* Banner Cards */}
            <div className="space-y-4">
              {banners.map((banner, index) => (
                <div 
                  key={banner.id}
                  className={`rounded-xl p-4 border transition-all relative ${
                    banner.isActive 
                      ? isDarkMode ? 'bg-slate-800 border-teal-500/50' : 'bg-white border-teal-500/50'
                      : isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  {/* Order Badge */}
                  <div className="absolute -top-3 -left-3 w-8 h-8 bg-teal-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                    {index + 1}
                  </div>

                  <div className="flex items-start gap-4 ml-4">
                    {/* Up/Down Reorder Buttons */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveBanner(banner.id, 'up')}
                        disabled={index === 0 || reordering}
                        className={`p-1.5 rounded transition-colors ${
                          index === 0 || reordering
                            ? isDarkMode ? 'text-slate-600 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed'
                            : isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                        title="Move Up"
                      >
                        <ChevronUp size={18} />
                      </button>
                      <button
                        onClick={() => moveBanner(banner.id, 'down')}
                        disabled={index === banners.length - 1 || reordering}
                        className={`p-1.5 rounded transition-colors ${
                          index === banners.length - 1 || reordering
                            ? isDarkMode ? 'text-slate-600 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed'
                            : isDarkMode ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                        title="Move Down"
                      >
                        <ChevronDown size={18} />
                      </button>
                    </div>

                    {/* Preview Images */}
                    <div className="flex gap-2 flex-shrink-0">
                      <div className={`w-32 h-20 rounded-lg overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                        {banner.desktopImage?.url ? (
                          <img 
                            src={banner.desktopImage.url} 
                            alt="Desktop" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                            <Monitor size={20} />
                          </div>
                        )}
                      </div>
                      <div className={`w-16 h-16 rounded-lg overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}>
                        {banner.mobileImage?.url ? (
                          <img 
                            src={banner.mobileImage.url} 
                            alt="Mobile" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className={`w-full h-full flex items-center justify-center text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                            <Smartphone size={16} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Banner Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {banner.name || 'Untitled Banner'}
                        </h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                          banner.isActive 
                            ? 'bg-green-500/20 text-green-400' 
                            : isDarkMode ? 'bg-slate-600 text-slate-400' : 'bg-gray-200 text-gray-500'
                        }`}>
                          {banner.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      {banner.title && (
                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                          {banner.title}
                        </p>
                      )}
                      {banner.buttonLink && (
                        <p className="text-xs text-teal-500 mt-1 flex items-center gap-1">
                          <ExternalLink size={12} />
                          {banner.buttonLink}
                        </p>
                      )}
                    </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleToggleActive(banner)}
                      className={`p-2 rounded-lg transition-colors ${
                        banner.isActive
                          ? isDarkMode ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' : 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                          : isDarkMode ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-green-100 text-green-600 hover:bg-green-200'
                      }`}
                      title={banner.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {banner.isActive ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <button
                      onClick={() => openEditModal(banner)}
                      className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(banner.id)}
                      className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className={`rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {editingBanner ? 'Edit Banner' : 'Add New Banner'}
                  </h2>
                  <button 
                    onClick={() => { setShowModal(false); resetForm(); }}
                    className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
                  >
                    <X className={isDarkMode ? 'text-white' : 'text-gray-900'} size={20} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Banner Name */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      Banner Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        isDarkMode 
                          ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="e.g. Summer Sale Banner"
                      required
                    />
                  </div>

                  {/* Desktop Image */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      <Monitor size={14} className="inline mr-1" />
                      Desktop Image URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      value={formData.desktopImage.url}
                      onChange={(e) => setFormData({
                        ...formData, 
                        desktopImage: {...formData.desktopImage, url: e.target.value}
                      })}
                      className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        isDarkMode 
                          ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="https://res.cloudinary.com/petyupp/..."
                      required
                    />
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                      Recommended: {IMAGE_GUIDELINES.desktop.width}x{IMAGE_GUIDELINES.desktop.height}px
                    </p>
                    {formData.desktopImage.url && (
                      <div className={`mt-2 rounded-lg overflow-hidden border ${isDarkMode ? 'border-slate-600' : 'border-gray-200'}`}>
                        <img 
                          src={formData.desktopImage.url} 
                          alt="Desktop preview" 
                          className="w-full h-24 object-cover"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      </div>
                    )}
                  </div>

                  {/* Mobile Image */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      <Smartphone size={14} className="inline mr-1" />
                      Mobile Image URL <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="url"
                      value={formData.mobileImage.url}
                      onChange={(e) => setFormData({
                        ...formData, 
                        mobileImage: {...formData.mobileImage, url: e.target.value}
                      })}
                      className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        isDarkMode 
                          ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                      }`}
                      placeholder="https://res.cloudinary.com/petyupp/..."
                      required
                    />
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                      Recommended: {IMAGE_GUIDELINES.mobile.width}x{IMAGE_GUIDELINES.mobile.height}px
                    </p>
                    {formData.mobileImage.url && (
                      <div className={`mt-2 w-24 rounded-lg overflow-hidden border ${isDarkMode ? 'border-slate-600' : 'border-gray-200'}`}>
                        <img 
                          src={formData.mobileImage.url} 
                          alt="Mobile preview" 
                          className="w-full h-24 object-cover"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      </div>
                    )}
                  </div>

                  {/* Text Overlay (Optional) */}
                  <div className={`border-t pt-6 ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                    <h3 className={`text-sm font-medium mb-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                      Optional: Text Overlay
                    </h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Title</label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData({...formData, title: e.target.value})}
                          className={`w-full px-3 py-2 rounded-lg border text-sm ${
                            isDarkMode 
                              ? 'bg-slate-700 border-slate-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          placeholder="Premium Treats"
                        />
                      </div>
                      <div>
                        <label className={`block text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Subtitle</label>
                        <input
                          type="text"
                          value={formData.subtitle}
                          onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
                          className={`w-full px-3 py-2 rounded-lg border text-sm ${
                            isDarkMode 
                              ? 'bg-slate-700 border-slate-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          placeholder="For Happy Dogs"
                        />
                      </div>
                      <div>
                        <label className={`block text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Button Text</label>
                        <input
                          type="text"
                          value={formData.buttonText}
                          onChange={(e) => setFormData({...formData, buttonText: e.target.value})}
                          className={`w-full px-3 py-2 rounded-lg border text-sm ${
                            isDarkMode 
                              ? 'bg-slate-700 border-slate-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          placeholder="Shop Now"
                        />
                      </div>
                      <div>
                        <label className={`block text-xs mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>Button Link</label>
                        <input
                          type="text"
                          value={formData.buttonLink}
                          onChange={(e) => setFormData({...formData, buttonLink: e.target.value.trim()})}
                          onBlur={(e) => setFormData({...formData, buttonLink: e.target.value.trim()})}
                          className={`w-full px-3 py-2 rounded-lg border text-sm ${
                            isDarkMode 
                              ? 'bg-slate-700 border-slate-600 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          placeholder="/shop?category=treats"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Active Toggle */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                      className={`w-12 h-6 rounded-full transition-colors relative ${
                        formData.isActive ? 'bg-teal-500' : isDarkMode ? 'bg-slate-600' : 'bg-gray-300'
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                        formData.isActive ? 'translate-x-6' : 'translate-x-0.5'
                      }`} />
                    </button>
                    <span className={`text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
                      {formData.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => { setShowModal(false); resetForm(); }}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium ${
                        isDarkMode 
                          ? 'bg-slate-700 hover:bg-slate-600 text-white' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                      }`}
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                      disabled={saving}
                    >
                      {saving ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Check size={18} />
                          {editingBanner ? 'Update Banner' : 'Create Banner'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminBannersPage;
