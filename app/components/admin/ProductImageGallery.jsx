import React, { useState } from 'react';
import { 
  Copy, Eye, Star, Trash2, Check, X, Plus, 
  RefreshCw, AlertTriangle, ImagePlus, ChevronUp, ChevronDown,
  Clipboard, CheckCircle, AlertCircle, ExternalLink
} from 'lucide-react';

const IMAGE_TYPES = [
  { value: 'main', label: 'Main', color: '#F59E0B', icon: '⭐' },
  { value: 'gallery', label: 'Gallery', color: '#9CA3AF', icon: '🎨' },
  { value: 'lifestyle', label: 'Lifestyle', color: '#EC4899', icon: '🐕' },
  { value: 'process', label: 'Process', color: '#3B82F6', icon: '⚙️' },
  { value: 'nutrition', label: 'Nutrition', color: '#8B5CF6', icon: '📊' },
  { value: 'benefits', label: 'Benefits', color: '#10B981', icon: '✓' },
  { value: 'ingredients', label: 'Ingredients', color: '#06B6D4', icon: '🌿' },
  { value: 'packaging', label: 'Packaging', color: '#6B7280', icon: '📦' },
];

const ProductImageGallery = ({ images, onUpdate, onDelete, onReorder, onAddImage, isDarkMode }) => {
  const [previewImage, setPreviewImage] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [imageLoadErrors, setImageLoadErrors] = useState({});
  
  // Add Image Modal state
  const [showAddImageModal, setShowAddImageModal] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newImageType, setNewImageType] = useState('Gallery');
  const [urlError, setUrlError] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [previewLoaded, setPreviewLoaded] = useState(false);

  // Smart URL cleaner and validator
  const cleanAndValidateUrl = (input) => {
    // Trim whitespace
    let url = input.trim();
    
    // Remove any quotes that might be copied
    url = url.replace(/['"]/g, '');
    
    // Check if it's a valid Cloudinary URL
    const isCloudinary = url.includes('res.cloudinary.com') || url.includes('cloudinary.com');
    
    // Check if it's any valid image URL
    const isValidImage = /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(url) || 
                         url.includes('/image/upload/');
    
    if (!url) {
      return { valid: false, error: '', url: '' };
    }
    
    if (!url.startsWith('http')) {
      return { valid: false, error: 'URL must start with https://', url };
    }
    
    if (!isCloudinary) {
      return { valid: false, error: 'Please use a Cloudinary URL (res.cloudinary.com)', url };
    }
    
    if (isCloudinary && (isValidImage || url.includes('petyupp'))) {
      return { valid: true, error: '', url };
    }
    
    return { valid: false, error: 'Invalid image URL format', url };
  };

  const handleUrlChange = (e) => {
    const input = e.target.value;
    setNewImageUrl(input);
    setPreviewLoaded(false);
    
    const result = cleanAndValidateUrl(input);
    setIsValidUrl(result.valid);
    setUrlError(result.error);
  };

  // Paste from clipboard button
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setNewImageUrl(text);
      setPreviewLoaded(false);
      const result = cleanAndValidateUrl(text);
      setIsValidUrl(result.valid);
      setUrlError(result.error);
    } catch (err) {
      setUrlError('Unable to paste. Please paste manually with Ctrl+V');
    }
  };

  const handleCopyUrl = (url, index) => {
    navigator.clipboard.writeText(url);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const getImageType = (image) => {
    if (typeof image === 'object') {
      return image.type || 'gallery';
    }
    return 'gallery';
  };

  const getImageUrl = (image) => {
    if (typeof image === 'string') return image;
    return image?.url || '';
  };

  const getTypeConfig = (type) => {
    return IMAGE_TYPES.find(t => t.value === type.toLowerCase()) || IMAGE_TYPES[1]; // Default to Gallery
  };

  // Check if URL is a broken/local path that won't load
  const isBrokenImageUrl = (url) => {
    if (!url) return true;
    if (url.startsWith('/uploads/')) return true;
    if (url.startsWith('blob:')) return true;
    if (!url.startsWith('http') && !url.includes('cloudinary.com')) return true;
    return false;
  };

  const moveImage = (index, direction) => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= images.length) return;
    
    const newImages = [...images];
    [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
    onReorder(newImages);
  };

  const setAsMain = (index) => {
    const newImages = [...images];
    const [removed] = newImages.splice(index, 1);
    newImages.unshift(removed);
    onReorder(newImages);
  };

  const handleImageLoadError = (index) => {
    setImageLoadErrors(prev => ({ ...prev, [index]: true }));
  };

  // Handle adding image from URL
  const handleAddImageUrl = () => {
    if (!isValidUrl || !newImageUrl) return;
    
    const cleanedUrl = newImageUrl.trim().replace(/['"]/g, '');
    
    const newImage = {
      url: cleanedUrl,
      type: newImageType || 'Gallery',
      order: images.length
    };
    
    console.log('🖼️ Adding new image:', newImage);
    console.log('🖼️ Current images count:', images.length);
    
    if (onAddImage) {
      onAddImage(newImage);
      console.log('🖼️ onAddImage callback called successfully');
    } else {
      console.error('❌ onAddImage callback is not defined!');
    }
    
    // Reset modal state
    setNewImageUrl('');
    setNewImageType('Gallery');
    setUrlError('');
    setIsValidUrl(false);
    setPreviewLoaded(false);
    setShowAddImageModal(false);
  };

  // Close modal and reset state
  const closeModal = () => {
    setShowAddImageModal(false);
    setNewImageUrl('');
    setNewImageType('Gallery');
    setUrlError('');
    setIsValidUrl(false);
    setPreviewLoaded(false);
  };

  // Check if any images have broken/local URLs
  const hasBrokenImages = images.some(img => {
    const url = getImageUrl(img);
    return isBrokenImageUrl(url);
  });

  return (
    <div className="product-image-gallery">
      {/* ========== ADD IMAGE MODAL ========== */}
      {showAddImageModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[10001]">
          <div className="bg-slate-800 rounded-xl p-5 w-full max-w-lg mx-4 border border-slate-700 shadow-2xl">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-teal-500/20 rounded-lg">
                  <ImagePlus className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Add Image from Cloudinary</h3>
                  <p className="text-xs text-slate-400">Paste your Cloudinary image URL</p>
                </div>
              </div>
              <button 
                onClick={closeModal} 
                className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>
            
            {/* Instructions */}
            <div className="bg-slate-700/50 rounded-lg p-3 mb-4">
              <p className="text-xs text-slate-300 mb-2 font-medium">📋 How to get the URL:</p>
              <ol className="text-xs text-slate-400 space-y-1 ml-4 list-decimal">
                <li>Go to <a href="https://console.cloudinary.com" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline inline-flex items-center gap-1">Cloudinary Dashboard <ExternalLink className="w-3 h-3" /></a></li>
                <li>Click on your image</li>
                <li>Click "Copy URL" or the link icon</li>
                <li>Paste below</li>
              </ol>
            </div>
            
            {/* URL Input with Paste Button */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Cloudinary URL *</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input 
                      type="text"
                      value={newImageUrl}
                      onChange={handleUrlChange}
                      onPaste={(e) => {
                        // Allow paste to complete, then validate
                        setTimeout(() => {
                          const result = cleanAndValidateUrl(e.target.value);
                          setIsValidUrl(result.valid);
                          setUrlError(result.error);
                        }, 100);
                      }}
                      placeholder="https://res.cloudinary.com/petyupp/image/upload/..."
                      className={`w-full bg-slate-700/50 border rounded-lg px-3 py-2.5 pr-10 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors ${
                        urlError ? 'border-red-500 focus:border-red-500' : isValidUrl ? 'border-green-500 focus:border-green-500' : 'border-slate-600 focus:border-teal-500'
                      }`}
                    />
                    {isValidUrl && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-400" />
                    )}
                    {urlError && (
                      <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <button
                    onClick={handlePasteFromClipboard}
                    className="px-3 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors flex items-center gap-1.5 text-slate-300 hover:text-white border border-slate-600 hover:border-slate-500"
                    title="Paste from clipboard"
                  >
                    <Clipboard className="w-4 h-4" />
                    <span className="text-xs font-medium">Paste</span>
                  </button>
                </div>
                {urlError && (
                  <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    {urlError}
                  </p>
                )}
                {isValidUrl && !urlError && (
                  <p className="text-xs text-green-400 mt-1.5 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 flex-shrink-0" />
                    Valid Cloudinary URL
                  </p>
                )}
              </div>
              
              {/* Image Type Selector - Grid of buttons */}
              <div>
                <label className="block text-xs text-slate-400 mb-2 font-medium">Image Type</label>
                <div className="grid grid-cols-4 gap-2">
                  {['Main', 'Gallery', 'Lifestyle', 'Process', 'Nutrition', 'Benefits', 'Ingredients', 'Packaging'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setNewImageType(type)}
                      className={`px-2 py-2 text-xs rounded-lg border transition-all ${
                        newImageType === type
                          ? 'bg-teal-500 border-teal-500 text-white font-medium shadow-md'
                          : 'bg-slate-700/50 border-slate-600 text-slate-300 hover:border-slate-500 hover:bg-slate-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview */}
              {isValidUrl && newImageUrl && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5 font-medium">Preview</label>
                  <div className="border border-slate-600 rounded-lg p-2 bg-slate-700/30">
                    {!previewLoaded && (
                      <div className="w-full h-40 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    <img 
                      src={newImageUrl.trim().replace(/['"]/g, '')} 
                      alt="Preview" 
                      className={`w-full h-40 object-contain rounded ${previewLoaded ? 'block' : 'hidden'}`}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        setUrlError('Image failed to load. Please check the URL.');
                        setIsValidUrl(false);
                        setPreviewLoaded(false);
                      }}
                      onLoad={(e) => {
                        e.target.style.display = 'block';
                        setPreviewLoaded(true);
                        setUrlError('');
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex gap-3 mt-5">
              <button 
                onClick={closeModal}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-sm py-2.5 rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddImageUrl}
                disabled={!isValidUrl || !previewLoaded}
                className={`flex-1 text-sm py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium ${
                  isValidUrl && previewLoaded
                    ? 'bg-teal-500 hover:bg-teal-600 text-white' 
                    : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                }`}
              >
                <ImagePlus className="w-4 h-4" />
                Add Image
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warning banner for broken images */}
      {hasBrokenImages && (
        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-400 font-medium">Some images need re-uploading</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Images with local paths won't display. Delete them and add new Cloudinary URLs.
            </p>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[10000] p-5"
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className={`${isDarkMode ? 'bg-slate-800' : 'bg-white'} rounded-2xl p-6 max-w-[90vw] max-h-[90vh] relative flex flex-col gap-4`}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              className="absolute top-3 right-3 bg-black/50 hover:bg-black/70 border-none rounded-full w-9 h-9 flex items-center justify-center cursor-pointer text-white z-10"
              onClick={() => setPreviewImage(null)}
            >
              <X size={20} />
            </button>
            <img 
              src={previewImage.url} 
              alt="Full preview" 
              className="max-w-[800px] max-h-[600px] object-contain rounded-lg"
            />
            <div className={`flex flex-col gap-2 text-sm ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
              <p><strong>Type:</strong> {previewImage.type}</p>
              <p className="flex items-center gap-2">
                <strong>URL:</strong> 
                <code className={`${isDarkMode ? 'bg-slate-900' : 'bg-slate-100'} px-2 py-1 rounded text-xs break-all`}>
                  {previewImage.url}
                </code>
              </p>
              <button 
                onClick={() => handleCopyUrl(previewImage.url, -1)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white border-none rounded-lg text-sm font-semibold cursor-pointer self-start"
              >
                <Copy size={16} /> Copy URL
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 ? (
        <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center">
          <div className="p-4 rounded-full bg-slate-700 inline-block mb-4">
            <ImagePlus className="w-8 h-8 text-slate-400" />
          </div>
          <h4 className="text-sm font-medium text-white mb-1">No product images yet</h4>
          <p className="text-xs text-slate-400 mb-4">Add images from your Cloudinary dashboard</p>
          <button 
            onClick={() => setShowAddImageModal(true)}
            className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add First Image
          </button>
        </div>
      ) : (
        <>
          {/* Image Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => {
              const imageUrl = getImageUrl(image);
              const imageType = getImageType(image);
              const typeConfig = getTypeConfig(imageType);
              const isMain = index === 0;
              const isBroken = isBrokenImageUrl(imageUrl) || imageLoadErrors[index];
              // Create unique key using URL hash + index to avoid collisions
              const uniqueKey = `img-${index}-${imageUrl.slice(-10).replace(/[^a-zA-Z0-9]/g, '')}`;

              return (
                <div
                  key={uniqueKey}
                  className={`relative rounded-xl overflow-hidden border group transition-all ${
                    isMain 
                      ? 'ring-2 ring-amber-500 border-amber-500/50' 
                      : isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'
                  }`}
                >
                  {/* Image Display Area */}
                  <div className="aspect-square relative">
                    {isBroken ? (
                      <div className="w-full h-full bg-slate-700 flex flex-col items-center justify-center relative group">
                        <RefreshCw className="w-6 h-6 text-amber-400 mb-2" />
                        <span className="text-xs text-amber-400 font-medium">Broken Image</span>
                        <span className="text-xs text-slate-400 mt-1 mb-2">Cannot load image</span>
                        <button 
                          onClick={() => onDelete(index)}
                          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 rounded-lg transition-colors flex items-center gap-1.5 text-white text-xs font-medium"
                          title="Delete broken image"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      </div>
                    ) : (
                      <>
                        <img
                          src={imageUrl}
                          alt={`Product ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={() => handleImageLoadError(index)}
                        />
                        
                        {/* Hover overlay with actions */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 z-20">
                          {/* Preview button */}
                          <button
                            onClick={() => setPreviewImage({ url: imageUrl, type: typeConfig.label })}
                            className="p-2 rounded-lg bg-slate-700/80 hover:bg-slate-600 transition-colors"
                            title="Preview"
                          >
                            <Eye className="w-5 h-5 text-white" />
                          </button>
                          
                          {/* Action row */}
                          <div className="flex items-center gap-1">
                            {index > 0 && (
                              <button 
                                onClick={() => moveImage(index, 'up')}
                                className="p-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-600 transition-colors"
                                title="Move up"
                              >
                                <ChevronUp className="w-4 h-4 text-white" />
                              </button>
                            )}
                            {index < images.length - 1 && (
                              <button 
                                onClick={() => moveImage(index, 'down')}
                                className="p-1.5 rounded-lg bg-slate-700/80 hover:bg-slate-600 transition-colors"
                                title="Move down"
                              >
                                <ChevronDown className="w-4 h-4 text-white" />
                              </button>
                            )}
                            {!isMain && (
                              <button 
                                onClick={() => setAsMain(index)}
                                className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 transition-colors"
                                title="Set as main"
                              >
                                <Star className="w-4 h-4 text-white" />
                              </button>
                            )}
                            <button 
                              onClick={() => onDelete(index)}
                              className="p-1.5 rounded-lg bg-red-500 hover:bg-red-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4 text-white" />
                            </button>
                          </div>

                          {/* Type selector on hover */}
                          <select
                            value={imageType.toLowerCase()}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => {
                              const updatedImage = typeof image === 'object' 
                                ? { ...image, type: e.target.value }
                                : { url: image, type: e.target.value };
                              onUpdate(index, updatedImage);
                            }}
                            className="text-xs bg-slate-900/90 border border-slate-600 rounded px-1.5 py-0.5 text-white cursor-pointer"
                          >
                            {IMAGE_TYPES.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.icon} {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}

                    {/* Main badge */}
                    {isMain && (
                      <span className="absolute top-2 right-2 text-xs px-1.5 py-0.5 rounded bg-amber-500 text-white font-medium z-10">
                        MAIN
                      </span>
                    )}

                    {/* Type badge */}
                    <span 
                      className="absolute top-2 left-2 text-xs px-1.5 py-0.5 rounded text-white font-medium z-10"
                      style={{ backgroundColor: typeConfig.color }}
                    >
                      {typeConfig.icon} {typeConfig.label}
                    </span>

                    {/* Image number */}
                    <span className="absolute bottom-2 left-2 text-xs text-white/70 z-10 bg-black/50 px-1.5 py-0.5 rounded">
                      #{index + 1}
                    </span>
                  </div>

                  {/* URL display with copy button */}
                  <div className="p-2 bg-slate-800 border-t border-slate-700">
                    <div className="flex items-center gap-1">
                      <input 
                        type="text"
                        value={imageUrl}
                        readOnly
                        className="flex-1 text-xs bg-slate-700 border border-slate-600 rounded px-2 py-1 text-slate-300 truncate"
                      />
                      <button 
                        onClick={() => handleCopyUrl(imageUrl, index)}
                        className="p-1.5 bg-slate-600 hover:bg-slate-500 rounded transition-colors"
                        title="Copy URL"
                      >
                        {copiedIndex === index ? (
                          <Check className="w-3 h-3 text-green-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-300" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add Image Card - Opens URL modal */}
            <div 
              onClick={() => setShowAddImageModal(true)}
              className="aspect-square border-2 border-dashed border-slate-600 hover:border-teal-500 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-800/50 hover:bg-slate-700/50 group"
            >
              <div className="p-3 rounded-full bg-slate-700 group-hover:bg-teal-500/20 transition-colors mb-2">
                <Plus className="w-6 h-6 text-slate-400 group-hover:text-teal-400" />
              </div>
              <span className="text-sm text-slate-400 group-hover:text-teal-400 font-medium">Add Image</span>
              <span className="text-xs text-slate-500 mt-1">Paste Cloudinary URL</span>
            </div>
          </div>

          {/* Tip */}
          <p className={`text-xs mt-3 p-3 rounded-lg ${isDarkMode ? 'bg-cyan-500/10 text-slate-400' : 'bg-cyan-50 text-slate-600'}`}>
            💡 <strong>Tip:</strong> Hover over images to reorder, set as main, or delete. First image is always the main product image.
          </p>
        </>
      )}
    </div>
  );
};

export default ProductImageGallery;
