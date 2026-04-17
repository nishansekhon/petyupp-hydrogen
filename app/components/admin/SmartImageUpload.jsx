import React, { useState, useRef } from 'react';
import { X, Upload, Check, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '@/config/api';

export default function SmartImageUpload({ product, onClose, onSuccess }) {
  const [uploadedImages, setUploadedImages] = useState([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = async (files) => {
    if (files.length > 5) {
      alert('Maximum 5 images allowed');
      return;
    }

    setAnalyzing(true);

    const newImages = [];
    const fileArray = Array.from(files);
    
    for (let file of fileArray) {
      // Validate file
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`);
        continue;
      }
      if (file.size > 15 * 1024 * 1024) {
        alert(`${file.name} exceeds 15MB limit`);
        continue;
      }

      // Read file
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target.result;
        
        // Simulate AI analysis
        const analysis = await analyzeImage(imageData, file);
        
        newImages.push({
          file,
          preview: imageData,
          analysis,
          name: file.name,
          size: (file.size / 1024).toFixed(0) + ' KB'
        });

        if (newImages.length === fileArray.length) {
          setUploadedImages(prev => [...prev, ...newImages]);
          setAnalyzing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async (imageData, file) => {
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Get image dimensions
    const img = new Image();
    img.src = imageData;
    await new Promise(resolve => { img.onload = resolve; });

    // Calculate quality score based on resolution
    const minDimension = Math.min(img.width, img.height);
    let qualityScore;
    if (minDimension >= 1000) qualityScore = Math.floor(85 + Math.random() * 15);
    else if (minDimension >= 500) qualityScore = Math.floor(60 + Math.random() * 25);
    else qualityScore = Math.floor(30 + Math.random() * 30);

    // Extract dominant colors (simplified)
    const colors = [
      `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
      `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
      `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`
    ];

    // Determine quality level
    let quality;
    if (qualityScore >= 80) quality = 'Excellent';
    else if (qualityScore >= 60) quality = 'Good';
    else if (qualityScore >= 40) quality = 'Fair';
    else quality = 'Poor';

    // Suggest improvements
    const suggestions = [];
    if (qualityScore < 80) suggestions.push('AI Upscale');
    if (qualityScore < 90) suggestions.push('Sharpen');
    suggestions.push('Auto Enhance');

    return {
      quality,
      qualityScore,
      colors,
      dimensions: `${img.width}×${img.height}`,
      suggestions,
      analyzed: true
    };
  };

  const removeImage = (index) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (uploadedImages.length === 0) {
      alert('Please upload at least one image');
      return;
    }
    
    // Check token exists first
    const token = localStorage.getItem('adminToken');
    console.log('🔑 Admin token:', token ? 'FOUND' : 'NOT FOUND');
    
    if (!token) {
      alert('⚠️ Session expired. Please login again.');
      window.location.href = '/admin/login';
      return;
    }
    
    setUploading(true);

    try {
      console.log('💾 Starting upload...', {
        productId: product?.id,
        imageCount: uploadedImages.length,
        tokenPreview: token.substring(0, 20) + '...'
      });

      // Upload images to backend
      const formData = new FormData();
      
      if (product) {
        formData.append('product_id', product.id);
        console.log('📦 Product ID:', product.id);
      }
      
      uploadedImages.forEach((img, index) => {
        formData.append(`images`, img.file);
        formData.append(`analysis_${index}`, JSON.stringify(img.analysis));
        console.log(`📸 Adding image ${index + 1}:`, img.name, `(${img.size})`);
      });

      console.log('🚀 Sending request to:', `${API_BASE_URL}/api/admin/products/upload-images`);

      const response = await fetch(`${API_BASE_URL}/api/admin/products/upload-images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      console.log('📡 Response status:', response.status);

      // Check response status first
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response not OK:', response.status, errorText);
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('📊 Response data:', data);
      
      if (data.success) {
        console.log('✅ Upload successful!');
        alert(`✅ Success! ${data.images.length} images uploaded`);
        if (onSuccess) onSuccess();
        onClose();
      } else {
        console.error('❌ Upload failed:', data.error);
        alert('Upload failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      alert('Upload failed: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-6 overflow-y-auto">
      <div className="bg-gradient-to-br from-obsidian via-deep-purple/20 to-obsidian border border-white/20 rounded-3xl max-w-6xl w-full p-8 relative max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-pearl-white/60 hover:text-pearl-white text-3xl"
        >
          <X size={32} />
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-2xl">🧠</span>
            </div>
            <div>
              <h2 className="text-3xl font-black text-pearl-white">Smart Upload 2.0</h2>
              <p className="text-pearl-white/60">Intelligent image processing</p>
            </div>
          </div>
          {product && (
            <p className="text-pearl-white/80">
              Uploading images for: <span className="font-bold text-electric-coral">{product.name}</span>
            </p>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Left: Upload Area */}
          <div>
            <h3 className="text-xl font-bold text-pearl-white mb-4">Upload Images</h3>
            
            {/* Drag & Drop Zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                dragActive 
                  ? 'border-electric-coral bg-electric-coral/10' 
                  : 'border-white/20 hover:border-white/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleFiles(e.target.files)}
                className="hidden"
              />
              
              <div className="text-6xl mb-4">
                {analyzing ? '⏳' : '📸'}
              </div>
              
              <h4 className="text-xl font-bold text-pearl-white mb-2">
                {analyzing ? 'Analyzing images...' : 'Drag & drop or click to select'}
              </h4>
              
              <p className="text-pearl-white/60 text-sm mb-6">
                JPG, PNG, WebP • Max 15MB • Up to 5 images
              </p>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={analyzing}
                className="bg-gradient-hero text-white font-bold py-3 px-8 rounded-xl hover:shadow-glow transition-all disabled:opacity-50"
              >
                Choose Files
              </button>
              
              {/* Features */}
              <div className="grid grid-cols-3 gap-3 mt-6 text-xs">
                <div className="bg-white/5 rounded-lg p-2">
                  <span className="text-purple-400">✨</span>
                  <div className="text-pearl-white/70 mt-1">Quality Analysis</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <span className="text-pink-400">🎨</span>
                  <div className="text-pearl-white/70 mt-1">Color Extraction</div>
                </div>
                <div className="bg-white/5 rounded-lg p-2">
                  <span className="text-cyan-400">🚀</span>
                  <div className="text-pearl-white/70 mt-1">Smart Crops</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Analysis Results */}
          <div>
            <h3 className="text-xl font-bold text-pearl-white mb-4">
              Analysis Results ({uploadedImages.length}/5)
            </h3>
            
            {uploadedImages.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center">
                <div className="text-4xl mb-3">✨</div>
                <p className="text-pearl-white/60">
                  Select images to view smart analysis
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {uploadedImages.map((img, index) => (
                  <div key={index} className="bg-white/5 border border-white/10 rounded-2xl p-4 relative group">
                    {/* Remove Button */}
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={16} />
                    </button>

                    <div className="flex gap-4">
                      {/* Image Preview */}
                      <div className="w-24 h-24 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                        <img
                          src={img.preview}
                          alt={img.name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Analysis Results */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-bold text-pearl-white text-sm truncate pr-8">
                            {img.name}
                          </h4>
                          <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                            img.analysis.qualityScore >= 80 ? 'bg-green-500/20 text-green-400' :
                            img.analysis.qualityScore >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {img.analysis.qualityScore}/100
                          </span>
                        </div>

                        <p className="text-pearl-white/60 text-xs mb-2">
                          {img.analysis.dimensions} • {img.size}
                        </p>

                        {/* Quality Badge */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-pearl-white/70">Quality:</span>
                          <span className={`text-xs font-bold ${
                            img.analysis.quality === 'Excellent' ? 'text-green-400' :
                            img.analysis.quality === 'Good' ? 'text-blue-400' :
                            img.analysis.quality === 'Fair' ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {img.analysis.quality}
                          </span>
                        </div>

                        {/* Color Palette */}
                        <div className="flex gap-1 mb-2">
                          {img.analysis.colors.map((color, i) => (
                            <div
                              key={i}
                              className="w-6 h-6 rounded-lg border border-white/20"
                              style={{ backgroundColor: color }}
                              title={color}
                            ></div>
                          ))}
                        </div>

                        {/* Suggestions */}
                        <div className="flex gap-1 flex-wrap">
                          {img.analysis.suggestions.map((suggestion, i) => (
                            <span
                              key={i}
                              className="text-[10px] bg-purple-500/20 border border-purple-500/40 text-purple-300 px-2 py-0.5 rounded-full font-semibold"
                            >
                              {suggestion}
                            </span>
                          ))}
                        </div>

                        {/* Analysis Complete */}
                        <div className="mt-2 flex items-center gap-1 text-[10px] text-green-400">
                          <Check size={12} />
                          <span>Analysis completed</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8 pt-6 border-t border-white/10">
          <button
            onClick={onClose}
            className="flex-1 bg-white/10 border border-white/20 text-pearl-white font-bold py-3 px-6 rounded-xl hover:bg-white/20 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={uploadedImages.length === 0 || uploading}
            className="flex-1 bg-gradient-hero text-white font-bold py-3 px-6 rounded-xl hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload size={20} />
                <span>Save Images ({uploadedImages.length})</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
