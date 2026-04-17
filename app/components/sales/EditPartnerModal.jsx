import React, { useState, useEffect } from 'react';
import { X, MapPin, Instagram, Facebook, Twitter, Share2, Package, Loader2, Upload, Check } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/utils/api';

const API_URL = API_BASE_URL + '/api';

const EditPartnerModal = ({ store, onClose, onSave, products = [] }) => {
  // Initialize formData with store values
  const initialFormData = React.useMemo(() => ({
    store_name: store?.store_name || store?.name || '',
    address: store?.address || '',
    area: store?.area || '',
    city: store?.city || 'Delhi',
    pincode: store?.pincode || '',
    phone: store?.phone || '',
    hours: store?.hours || '',
    status: store?.status || 'active',
    latitude: store?.latitude || store?.lat || '',
    longitude: store?.longitude || store?.lon || store?.lng || '',
    images: store?.images || [],
    products: store?.products || [],
    ownerName: store?.ownerName || store?.owner_name || '',
    testimonial: store?.testimonial || '',
    social_instagram: store?.social_instagram || '',
    social_facebook: store?.social_facebook || '',
    social_twitter: store?.social_twitter || '',
    google_maps_url: store?.google_maps_url || ''
  }), [store]);

  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Update formData when store changes (for modal reuse)
  useEffect(() => {
    setFormData(initialFormData);
  }, [initialFormData]);

  const handleSave = async () => {
    if (!formData.store_name || !formData.address) {
      toast.error('Store name and address are required');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/admin/partner-stores/${store.store_id || store._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success || response.ok) {
        toast.success('Partner updated successfully!');
        onSave && onSave({ ...store, ...formData });
        onClose();
      } else {
        toast.error(data.detail || data.error || 'Failed to update partner');
      }
    } catch (error) {
      console.error('Error updating partner:', error);
      toast.error('Failed to update partner');
    }
    setLoading(false);
  };

  const toggleProduct = (product) => {
    const exists = formData.products.find(p => p.name === product.name);
    if (exists) {
      setFormData(prev => ({
        ...prev,
        products: prev.products.filter(p => p.name !== product.name)
      }));
    } else {
      const imageUrl = product.images?.[0]?.url || product.images?.[0] || product.image_url || product.image || '';
      setFormData(prev => ({
        ...prev,
        products: [...prev.products, {
          name: product.name,
          size: product.weight || product.size || '',
          price: product.original_price || product.mrp || product.price || 0,
          image: imageUrl
        }]
      }));
    }
  };

  const handleSelectAllProducts = () => {
    if (formData.products.length === products.length && products.length > 0) {
      setFormData(prev => ({ ...prev, products: [] }));
    } else {
      const allProducts = products.map(product => ({
        name: product.name,
        size: product.weight || product.size || '',
        price: product.original_price || product.mrp || product.price || 0,
        image: product.images?.[0]?.url || product.images?.[0] || product.image_url || product.image || ''
      }));
      setFormData(prev => ({ ...prev, products: allProducts }));
    }
  };

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;

    setUploadingImage(true);
    let uploadedCount = 0;
    
    for (const file of files) {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('folder', 'partner-stores');

      try {
        // Use backend endpoint for authenticated Cloudinary upload
        const response = await fetch(`${API_URL}/admin/upload/image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
          },
          body: formDataUpload
        });
        const data = await response.json();
        if (data.success && data.url) {
          setFormData(prev => ({
            ...prev,
            images: [...prev.images, data.url]
          }));
          uploadedCount++;
        } else if (data.error) {
          toast.error(`Upload failed: ${data.error}`);
        }
      } catch (error) {
        console.error('Upload failed:', error);
        toast.error('Failed to upload image');
      }
    }
    
    setUploadingImage(false);
    if (uploadedCount > 0) {
      toast.success(`${uploadedCount} image${uploadedCount > 1 ? 's' : ''} uploaded`);
    }
    e.target.value = '';
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-slate-700 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
          <h3 className="text-lg font-semibold text-white">Edit Partner Store</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4">
          {/* Store Name */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">Store Name *</label>
            <input
              type="text"
              value={formData.store_name}
              onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">Address *</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Area & City */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Area *</label>
              <input
                type="text"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Pincode & Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Pincode</label>
              <input
                type="text"
                value={formData.pincode}
                onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Hours & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Hours</label>
              <input
                type="text"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                placeholder="Mon-Sun: 9:00 AM - 9:00 PM"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-teal-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Coordinates Section */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Latitude</label>
              <input
                type="text"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                placeholder="e.g., 28.6139"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Longitude</label>
              <input
                type="text"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                placeholder="e.g., 77.2090"
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>
          {/* Missing coordinates warning */}
          {(!formData.latitude || !formData.longitude) && (
            <div className="flex items-start gap-2 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <span className="text-amber-400 text-sm">⚠️</span>
              <div className="text-xs text-amber-300">
                <p className="font-medium">Coordinates missing</p>
                <p className="text-amber-400/80">Distance calculation won't work. Find coordinates on Google Maps by right-clicking the store location.</p>
              </div>
            </div>
          )}

          {/* Owner Name */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">Owner Name</label>
            <input
              type="text"
              value={formData.ownerName}
              onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Store Images */}
          <div className="pt-4 border-t border-slate-700">
            <label className="block text-sm text-slate-400 mb-2">Store Images</label>
            
            {/* Existing images */}
            {formData.images && formData.images.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.images.map((img, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={img}
                      alt={`Store ${index + 1}`}
                      className="w-16 h-16 object-cover rounded-lg border border-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-1 -right-1 p-0.5 bg-red-500 hover:bg-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Upload button */}
            <label className={`flex items-center justify-center gap-2 p-3 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              uploadingImage 
                ? 'border-teal-500 bg-teal-500/10 text-teal-400' 
                : 'border-slate-600 hover:border-teal-500 text-slate-400 hover:text-teal-400'
            }`}>
              {uploadingImage ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
              ) : (
                <><Upload className="w-4 h-4" /> Upload Images</>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="hidden"
              />
            </label>
          </div>

          {/* Social Handles Section */}
          <div className="pt-4 border-t border-slate-700">
            <h4 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-teal-400" />
              Social Handles
              <span className="text-xs text-slate-500 font-normal">(for tagging in shoutouts)</span>
            </h4>

            <div className="grid grid-cols-2 gap-3">
              {/* Instagram */}
              <div>
                <label className="block text-xs text-slate-500 mb-1 flex items-center gap-1">
                  <Instagram className="w-3 h-3 text-pink-400" />
                  Instagram
                </label>
                <div className="flex">
                  <span className="px-2 py-2 bg-slate-900 border border-r-0 border-slate-600 rounded-l-lg text-slate-500 text-sm">@</span>
                  <input
                    type="text"
                    value={formData.social_instagram}
                    onChange={(e) => setFormData({ ...formData, social_instagram: e.target.value.replace('@', '') })}
                    placeholder="username"
                    className="flex-1 px-2 py-2 bg-slate-700 border border-slate-600 rounded-r-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Facebook */}
              <div>
                <label className="block text-xs text-slate-500 mb-1 flex items-center gap-1">
                  <Facebook className="w-3 h-3 text-blue-400" />
                  Facebook
                </label>
                <input
                  type="text"
                  value={formData.social_facebook}
                  onChange={(e) => setFormData({ ...formData, social_facebook: e.target.value })}
                  placeholder="page name or URL"
                  className="w-full px-2 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Twitter */}
              <div>
                <label className="block text-xs text-slate-500 mb-1 flex items-center gap-1">
                  <Twitter className="w-3 h-3 text-sky-400" />
                  Twitter/X
                </label>
                <div className="flex">
                  <span className="px-2 py-2 bg-slate-900 border border-r-0 border-slate-600 rounded-l-lg text-slate-500 text-sm">@</span>
                  <input
                    type="text"
                    value={formData.social_twitter}
                    onChange={(e) => setFormData({ ...formData, social_twitter: e.target.value.replace('@', '') })}
                    placeholder="username"
                    className="flex-1 px-2 py-2 bg-slate-700 border border-slate-600 rounded-r-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Google Maps */}
              <div>
                <label className="block text-xs text-slate-500 mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-red-400" />
                  Google Maps URL
                </label>
                <input
                  type="url"
                  value={formData.google_maps_url}
                  onChange={(e) => setFormData({ ...formData, google_maps_url: e.target.value })}
                  placeholder="https://maps.google.com/..."
                  className="w-full px-2 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Products Available */}
          <div className="pt-4 border-t border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm text-slate-400 flex items-center gap-2">
                <Package className="w-4 h-4 text-teal-400" />
                Products Available
              </label>
              <label className="flex items-center gap-2 text-xs text-teal-400 cursor-pointer hover:text-teal-300">
                <input
                  type="checkbox"
                  checked={formData.products.length === products.length && products.length > 0}
                  onChange={handleSelectAllProducts}
                  className="rounded border-slate-600 bg-slate-700 text-teal-500"
                />
                Select All ({products.length})
              </label>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {products.map((product) => {
                const isSelected = formData.products.find(p => p.name === product.name);
                return (
                  <div
                    key={product._id || product.id}
                    onClick={() => toggleProduct(product)}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-teal-500/20 border border-teal-500'
                        : 'bg-slate-700/50 hover:bg-slate-700'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${
                      isSelected ? 'bg-teal-500 border-teal-500' : 'border-slate-500'
                    }`}>
                      {isSelected && <Check size={14} className="text-white" />}
                    </div>
                    {(product.images?.[0]?.url || product.images?.[0] || product.image_url || product.image) && (
                      <img 
                        src={product.images?.[0]?.url || product.images?.[0] || product.image_url || product.image} 
                        alt="" 
                        className="w-8 h-8 rounded object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    )}
                    <span className="text-sm text-white flex-1">{product.name}</span>
                    <span className="text-xs text-slate-400">₹{product.original_price || product.mrp || product.price}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Selected: {formData.products.length} products
            </p>
          </div>

          {/* Testimonial */}
          <div>
            <label className="block text-sm text-slate-400 mb-1">Testimonial</label>
            <textarea
              value={formData.testimonial}
              onChange={(e) => setFormData({ ...formData, testimonial: e.target.value })}
              rows={2}
              placeholder="Customer feedback about PetYupp products..."
              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 resize-none focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-slate-700 sticky bottom-0 bg-slate-800">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPartnerModal;
