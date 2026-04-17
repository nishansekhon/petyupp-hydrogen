import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/config/api';
import { 
  Sparkles, Plus, Edit2, Trash2, RefreshCw, Calendar, Image, 
  Check, X, Upload, Eye
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = API_BASE_URL + '/api';

/**
 * SeasonalOverlaysSection Component
 * Admin UI for managing seasonal logo overlays in the Settings page.
 */
const SeasonalOverlaysSection = () => {
  const [overlays, setOverlays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeOverlayId, setActiveOverlayId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingOverlay, setEditingOverlay] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    overlay_image: '',
    start_date: '',
    end_date: '',
    position: 'top-right',
    scale: 40,
    is_active: true
  });

  const fetchOverlays = useCallback(async () => {
    setLoading(true);
    try {
      const [allRes, activeRes] = await Promise.all([
        fetch(`${API_URL}/seasonal-overlays`),
        fetch(`${API_URL}/seasonal-overlays/active`)
      ]);
      
      const allData = await allRes.json();
      const activeData = await activeRes.json();
      
      if (allData.success) {
        setOverlays(allData.overlays || []);
      }
      
      if (activeData.success && activeData.overlay) {
        setActiveOverlayId(activeData.overlay.id);
      } else {
        setActiveOverlayId(null);
      }
    } catch (err) {
      console.error('Error fetching overlays:', err);
      toast.error('Failed to load seasonal overlays');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverlays();
  }, [fetchOverlays]);

  const handleAdd = () => {
    setEditingOverlay(null);
    setFormData({
      name: '',
      overlay_image: '',
      start_date: '',
      end_date: '',
      position: 'top-right',
      scale: 40,
      is_active: true
    });
    setShowModal(true);
  };

  const handleEdit = (overlay) => {
    setEditingOverlay(overlay);
    setFormData({
      name: overlay.name,
      overlay_image: overlay.overlay_image,
      start_date: overlay.start_date,
      end_date: overlay.end_date,
      position: overlay.position || 'top-right',
      scale: overlay.scale || 40,
      is_active: overlay.is_active
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${API_URL}/seasonal-overlays/${id}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success('Overlay deleted');
        fetchOverlays();
      } else {
        toast.error(data.detail || 'Failed to delete');
      }
    } catch (err) {
      toast.error('Failed to delete overlay');
    }
    setDeleteConfirmId(null);
  };

  const handleToggleActive = async (overlay) => {
    try {
      const response = await fetch(`${API_URL}/seasonal-overlays/${overlay.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !overlay.is_active })
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Overlay ${!overlay.is_active ? 'activated' : 'deactivated'}`);
        fetchOverlays();
      } else {
        toast.error(data.detail || 'Failed to update');
      }
    } catch (err) {
      toast.error('Failed to update overlay');
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.start_date || !formData.end_date) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const url = editingOverlay 
        ? `${API_URL}/seasonal-overlays/${editingOverlay.id}`
        : `${API_URL}/seasonal-overlays`;
      const method = editingOverlay ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();

      if (data.success) {
        toast.success(editingOverlay ? 'Overlay updated' : 'Overlay created');
        setShowModal(false);
        fetchOverlays();
      } else {
        toast.error(data.detail || 'Failed to save');
      }
    } catch (err) {
      toast.error('Failed to save overlay');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    setUploading(true);
    try {
      // Get Cloudinary credentials
      const configRes = await fetch(`${API_URL}/config/cloudinary`);
      const config = await configRes.json();

      if (!config.cloud_name || !config.upload_preset) {
        // Fallback to direct URL input
        toast.error('Cloudinary not configured. Please enter image URL manually.');
        setUploading(false);
        return;
      }

      // Upload to Cloudinary
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('upload_preset', config.upload_preset);
      formDataUpload.append('folder', 'seasonal');

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${config.cloud_name}/image/upload`,
        { method: 'POST', body: formDataUpload }
      );
      const uploadData = await uploadRes.json();

      if (uploadData.secure_url) {
        setFormData(prev => ({ ...prev, overlay_image: uploadData.secure_url }));
        toast.success('Image uploaded');
      } else {
        toast.error('Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const positionLabels = {
    'top-left': 'Top Left',
    'top-center': 'Top Center',
    'top-right': 'Top Right'
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700/50 bg-slate-700/20">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="font-medium text-white text-sm">Seasonal Logo Overlays</h3>
          <span className="text-xs text-slate-400">({overlays.length})</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchOverlays}
            disabled={loading}
            className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleAdd}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-medium transition-colors"
          >
            <Plus size={14} />
            Add Overlay
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-8 text-center">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-400" />
        </div>
      ) : overlays.length === 0 ? (
        <div className="p-8 text-center">
          <Calendar className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No seasonal overlays configured</p>
          <button 
            onClick={handleAdd}
            className="mt-2 text-xs text-teal-400 hover:text-teal-300"
          >
            Add your first overlay
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-700/30 border-b border-slate-700/50">
                <th className="px-4 py-2 text-left text-xs uppercase tracking-wider text-slate-400 font-medium">Name</th>
                <th className="px-4 py-2 text-center text-xs uppercase tracking-wider text-slate-400 font-medium">Preview</th>
                <th className="px-4 py-2 text-left text-xs uppercase tracking-wider text-slate-400 font-medium">Start</th>
                <th className="px-4 py-2 text-left text-xs uppercase tracking-wider text-slate-400 font-medium">End</th>
                <th className="px-4 py-2 text-left text-xs uppercase tracking-wider text-slate-400 font-medium">Position</th>
                <th className="px-4 py-2 text-center text-xs uppercase tracking-wider text-slate-400 font-medium">Active</th>
                <th className="px-4 py-2 text-right text-xs uppercase tracking-wider text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {overlays.map((overlay, idx) => (
                <tr 
                  key={overlay.id}
                  className={`border-b border-slate-700/30 transition-colors ${
                    overlay.id === activeOverlayId 
                      ? 'bg-teal-500/10 hover:bg-teal-500/15' 
                      : 'hover:bg-slate-700/20'
                  } ${idx === overlays.length - 1 ? 'border-0' : ''}`}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{overlay.name}</span>
                      {overlay.id === activeOverlayId && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-500/30 text-teal-300 font-medium">
                          LIVE
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {overlay.overlay_image ? (
                      <img 
                        src={overlay.overlay_image} 
                        alt={overlay.name}
                        className="w-8 h-8 object-contain mx-auto rounded bg-slate-700/50"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <span className="text-xs text-slate-500">No image</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-300">{formatDate(overlay.start_date)}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{formatDate(overlay.end_date)}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">{positionLabels[overlay.position] || overlay.position}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleActive(overlay)}
                      className={`w-10 h-5 rounded-full relative transition-colors ${
                        overlay.is_active ? 'bg-teal-500' : 'bg-slate-600'
                      }`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${
                        overlay.is_active ? 'left-5' : 'left-0.5'
                      }`} />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {deleteConfirmId === overlay.id ? (
                        <>
                          <button
                            onClick={() => handleDelete(overlay.id)}
                            className="p-1.5 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                            title="Confirm delete"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="p-1.5 rounded bg-slate-700 text-slate-400 hover:bg-slate-600"
                            title="Cancel"
                          >
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(overlay)}
                            className="p-1.5 rounded hover:bg-slate-700 text-teal-400"
                            title="Edit"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(overlay.id)}
                            className="p-1.5 rounded hover:bg-slate-700 text-red-400"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl w-full max-w-md mx-4 shadow-xl border border-slate-700">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
              <h3 className="font-semibold text-white">
                {editingOverlay ? 'Edit Overlay' : 'Add Seasonal Overlay'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded hover:bg-slate-700 text-slate-400"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Diwali 2026"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              {/* Overlay Image */}
              <div>
                <label className="block text-xs text-slate-400 mb-1">Overlay Image (PNG with transparency)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.overlay_image}
                    onChange={(e) => setFormData({ ...formData, overlay_image: e.target.value })}
                    placeholder="Cloudinary URL or upload"
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                  <label className="flex items-center gap-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg cursor-pointer text-xs text-white">
                    {uploading ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Upload size={14} />
                    )}
                    <span className="hidden sm:inline">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
                {formData.overlay_image && (
                  <div className="mt-2 flex items-center gap-2">
                    <img 
                      src={formData.overlay_image} 
                      alt="Preview"
                      className="w-12 h-12 object-contain bg-slate-700/50 rounded"
                    />
                    <span className="text-xs text-slate-500">Preview</span>
                  </div>
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">End Date *</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Position and Scale */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Position</label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  >
                    <option value="top-left">Top Left</option>
                    <option value="top-center">Top Center</option>
                    <option value="top-right">Top Right</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Scale %</label>
                  <input
                    type="number"
                    min="10"
                    max="100"
                    value={formData.scale}
                    onChange={(e) => setFormData({ ...formData, scale: parseInt(e.target.value) || 40 })}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Active toggle */}
              <div className="flex items-center justify-between">
                <label className="text-xs text-slate-400">Active</label>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  className={`w-10 h-5 rounded-full relative transition-colors ${
                    formData.is_active ? 'bg-teal-500' : 'bg-slate-600'
                  }`}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${
                    formData.is_active ? 'left-5' : 'left-0.5'
                  }`} />
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-2 px-4 py-3 border-t border-slate-700">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  editingOverlay ? 'Update' : 'Create'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SeasonalOverlaysSection;
