import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/config/api';
import { useNavigate } from 'react-router';
import {
  Image, Eraser, Maximize2, Video, Sparkles, Package, 
  Download, Cloud, Check, X, Loader2, RefreshCw,
  ChevronDown, Play, Pause, ExternalLink, Trash2,
  FolderOpen, Filter, Calendar, AlertCircle, Zap,
  Lock, Settings, ShieldAlert
} from 'lucide-react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const API_URL = API_BASE_URL;

// ============================================
// PRODUCT STUDIO TAB COMPONENT
// ============================================

const ProductStudioTab = () => {
  const { isDarkMode } = useAdminTheme();
  const navigate = useNavigate();
  
  // State
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [presets, setPresets] = useState([]);
  const [apiStatus, setApiStatus] = useState({ api_configured: false, api_accessible: false });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState({});
  const [generatedContent, setGeneratedContent] = useState([]);
  
  // Scene generation state
  const [selectedPreset, setSelectedPreset] = useState('');
  const [customScene, setCustomScene] = useState('');
  const [generatedScenes, setGeneratedScenes] = useState([]);
  
  // Background removal state
  const [removedBgImage, setRemovedBgImage] = useState(null);
  
  // Upscale state
  const [scaleFactor, setScaleFactor] = useState(2);
  const [upscaledImage, setUpscaledImage] = useState(null);
  
  // Batch state
  const [batchProducts, setBatchProducts] = useState([]);
  const [batchProgress, setBatchProgress] = useState(null);

  // Helper to show API not configured toast
  const showApiNotConfiguredToast = () => {
    toast.warning(
      <div>
        <p className="font-medium">Product Studio API credentials required</p>
        <p className="text-xs mt-1 opacity-80">Configure in Settings → API Settings</p>
      </div>,
      { autoClose: 5000 }
    );
  };

  // ============================================
  // DATA FETCHING
  // ============================================

  const fetchApiStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/product-studio/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setApiStatus(data);
    } catch (error) {
      console.error('Error fetching API status:', error);
      setApiStatus({ api_configured: false, api_accessible: false, error: error.message });
    }
  }, []);

  const fetchPresets = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/product-studio/presets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setPresets(data.presets || []);
      }
    } catch (error) {
      console.error('Error fetching presets:', error);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/api/admin/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      const productList = Array.isArray(data) ? data : data.products || [];
      setProducts(productList);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchApiStatus(), fetchPresets(), fetchProducts()]);
      setLoading(false);
    };
    loadData();
  }, [fetchApiStatus, fetchPresets, fetchProducts]);

  // ============================================
  // GENERATION HANDLERS
  // ============================================

  const handleGenerateScene = async () => {
    if (!selectedProduct) {
      toast.error('Please select a product first');
      return;
    }
    
    // Check if API is configured
    if (!apiStatus.api_accessible) {
      showApiNotConfiguredToast();
      return;
    }
    
    const sceneDesc = selectedPreset 
      ? presets.find(p => p.id === selectedPreset)?.description 
      : customScene;
    
    if (!sceneDesc) {
      toast.error('Please select a preset or enter a custom scene description');
      return;
    }

    setGenerating(prev => ({ ...prev, scene: true }));
    setGeneratedScenes([]);

    try {
      const token = localStorage.getItem('adminToken');
      const productImage = getProductMainImage(selectedProduct);
      
      const response = await fetch(`${API_URL}/api/product-studio/generate-scene`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image_url: productImage,
          product_description: selectedProduct.name,
          scene_description: sceneDesc,
          preset_id: selectedPreset || null,
          num_samples: 4
        })
      });
      
      const data = await response.json();
      console.log('Generate scene response:', data);
      
      if (data.success) {
        const images = data.data?.images || [];
        console.log('Generated images:', images);
        setGeneratedScenes(images);
        toast.success(`${images.length} scene images generated successfully!`);
      } else {
        // Check error types
        if (data.error_type === 'not_configured') {
          toast.error(
            <div>
              <p className="font-medium">Google Gemini API Not Configured</p>
              <p className="text-xs mt-1">Add "Google Gemini API" in Admin Settings → API Settings</p>
            </div>,
            { autoClose: 8000 }
          );
        } else if (data.error_type === 'budget_exceeded' || (data.error && data.error.includes('budget'))) {
          toast.error(
            <div>
              <p className="font-medium">API Budget Exceeded</p>
              <p className="text-xs mt-1">Check your Google Cloud billing or add credits</p>
            </div>,
            { autoClose: 8000 }
          );
        } else {
          toast.error(data.error || 'Scene generation failed');
        }
      }
    } catch (error) {
      toast.error('Error generating scenes: ' + error.message);
    } finally {
      setGenerating(prev => ({ ...prev, scene: false }));
    }
  };

  const handleRemoveBackground = async () => {
    if (!selectedProduct) {
      toast.error('Please select a product first');
      return;
    }

    // Check if API is configured
    if (!apiStatus.api_accessible) {
      showApiNotConfiguredToast();
      return;
    }

    setGenerating(prev => ({ ...prev, background: true }));
    setRemovedBgImage(null);

    try {
      const token = localStorage.getItem('adminToken');
      const productImage = getProductMainImage(selectedProduct);
      
      const response = await fetch(`${API_URL}/api/product-studio/remove-background`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image_url: productImage })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setRemovedBgImage(data.data?.image_url);
        toast.success('Background removed successfully!');
      } else {
        toast.error(data.error || 'Background removal failed - API may not be configured');
      }
    } catch (error) {
      toast.error('Error removing background: ' + error.message);
    } finally {
      setGenerating(prev => ({ ...prev, background: false }));
    }
  };

  const handleUpscaleImage = async () => {
    if (!selectedProduct) {
      toast.error('Please select a product first');
      return;
    }

    // Check if API is configured
    if (!apiStatus.api_accessible) {
      showApiNotConfiguredToast();
      return;
    }

    setGenerating(prev => ({ ...prev, upscale: true }));
    setUpscaledImage(null);

    try {
      const token = localStorage.getItem('adminToken');
      const productImage = getProductMainImage(selectedProduct);
      
      const response = await fetch(`${API_URL}/api/product-studio/upscale`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          image_url: productImage,
          scale_factor: scaleFactor
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUpscaledImage(data.data?.image_url);
        toast.success(`Image upscaled ${scaleFactor}x successfully!`);
      } else {
        toast.error(data.error || 'Image upscaling failed - API may not be configured');
      }
    } catch (error) {
      toast.error('Error upscaling image: ' + error.message);
    } finally {
      setGenerating(prev => ({ ...prev, upscale: false }));
    }
  };

  const handleGenerateVideo = async () => {
    if (!selectedProduct) {
      toast.error('Please select a product first');
      return;
    }

    // Check if API is configured
    if (!apiStatus.api_accessible) {
      showApiNotConfiguredToast();
      return;
    }

    setGenerating(prev => ({ ...prev, video: true }));

    // Video generation would be implemented here
    // For now, show a placeholder message
    setTimeout(() => {
      toast.info('Video generation is coming soon! This feature requires Google Product Studio API alpha access.');
      setGenerating(prev => ({ ...prev, video: false }));
    }, 1500);
  };

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  const getProductMainImage = (product) => {
    const images = product?.images || [];
    for (const img of images) {
      if (typeof img === 'object') {
        const imgType = (img.type || '').toLowerCase();
        if (imgType === 'main') return img.url;
      }
    }
    if (images.length > 0) {
      const first = images[0];
      return typeof first === 'object' ? first.url : first;
    }
    return '';
  };

  const getImageCount = (product) => {
    return product?.images?.length || 0;
  };

  // ============================================
  // RENDER COMPONENTS
  // ============================================

  // API Status Badge
  const ApiStatusBadge = () => (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
      apiStatus.api_accessible 
        ? 'bg-green-500/10 text-green-400' 
        : 'bg-yellow-500/10 text-yellow-400'
    }`}>
      <div className={`w-2 h-2 rounded-full ${
        apiStatus.api_accessible ? 'bg-green-400' : 'bg-yellow-400'
      } ${apiStatus.api_accessible ? 'animate-pulse' : ''}`} />
      <span className="text-xs font-medium">
        {apiStatus.api_accessible ? 'API Connected' : 'API Not Configured'}
      </span>
    </div>
  );

  // Product Selector Card
  const ProductSelectorCard = () => (
    <div className={`rounded-xl p-4 ${isDarkMode ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-white border border-gray-200'}`}>
      <div className="flex items-center gap-3 mb-3">
        <Package className="w-5 h-5 text-teal-500" />
        <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Select Product
        </h3>
      </div>
      
      <select
        value={selectedProduct?.id || ''}
        onChange={(e) => {
          const product = products.find(p => p.id === e.target.value);
          setSelectedProduct(product || null);
          // Reset generated content when product changes
          setGeneratedScenes([]);
          setRemovedBgImage(null);
          setUpscaledImage(null);
        }}
        className={`w-full px-3 py-2 rounded-lg text-sm ${
          isDarkMode 
            ? 'bg-slate-700 text-white border-slate-600' 
            : 'bg-gray-50 text-gray-900 border-gray-300'
        } border focus:ring-2 focus:ring-teal-500 focus:border-transparent`}
      >
        <option value="">-- Select a product --</option>
        {products.map(product => (
          <option key={product.id} value={product.id}>
            {product.name} ({getImageCount(product)} images)
          </option>
        ))}
      </select>
      
      {selectedProduct && (
        <div className="mt-3 flex items-center gap-3 p-2 rounded-lg bg-slate-700/30">
          {getProductMainImage(selectedProduct) && (
            <img 
              src={getProductMainImage(selectedProduct)} 
              alt={selectedProduct.name}
              className="w-12 h-12 object-cover rounded-lg"
            />
          )}
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {selectedProduct.name}
            </p>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              {getImageCount(selectedProduct)} images • {selectedProduct.category}
            </p>
          </div>
        </div>
      )}
    </div>
  );

  // Tool Card Component
  const ToolCard = ({ icon: Icon, title, description, children, isGenerating, onGenerate, buttonText = "Generate" }) => (
    <div className={`rounded-xl p-4 ${isDarkMode ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-white border border-gray-200'}`}>
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 rounded-lg bg-teal-500/10">
          <Icon className="w-5 h-5 text-teal-500" />
        </div>
        <div className="flex-1">
          <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {title}
          </h3>
          <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            {description}
          </p>
        </div>
      </div>
      
      <div className="space-y-3">
        {children}
        
        <button
          onClick={onGenerate}
          disabled={isGenerating || !selectedProduct}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            isGenerating || !selectedProduct
              ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
              : 'bg-teal-500 hover:bg-teal-600 text-white'
          }`}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              {buttonText}
            </>
          )}
        </button>
      </div>
    </div>
  );

  // Generated Image Grid
  const GeneratedImageGrid = ({ images, title }) => {
    if (!images || images.length === 0) return null;
    
    // Helper to get image source (handles both URL and base64)
    const getImageSrc = (img) => {
      if (typeof img === 'string') return img;
      if (img.url) return img.url;
      if (img.base64) {
        const format = img.format || 'png';
        return `data:image/${format};base64,${img.base64}`;
      }
      if (img.data) {
        const format = img.format || 'png';
        return `data:image/${format};base64,${img.data}`;
      }
      return '';
    };
    
    return (
      <div className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
        <h4 className={`text-xs font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
          {title} ({images.length})
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {images.map((img, idx) => {
            const imgSrc = getImageSrc(img);
            return (
              <div key={idx} className="relative group">
                {imgSrc ? (
                  <img 
                    src={imgSrc}
                    alt={`Generated ${idx + 1}`}
                    className="w-full h-32 object-cover rounded-lg bg-slate-700"
                    onError={(e) => {
                      console.error('Image failed to load:', img);
                      e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23334155" width="100" height="100"/><text x="50%" y="50%" fill="%2394a3b8" font-size="12" text-anchor="middle" dy=".3em">Error</text></svg>';
                    }}
                  />
                ) : (
                  <div className="w-full h-32 bg-slate-700 rounded-lg flex items-center justify-center">
                    <span className="text-xs text-slate-400">No image</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                  <button 
                    onClick={() => {
                      // Download the image
                      const link = document.createElement('a');
                      link.href = imgSrc;
                      link.download = `product-scene-${idx + 1}.png`;
                      link.click();
                    }}
                    className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30"
                    title="Download"
                  >
                    <Download className="w-4 h-4 text-white" />
                  </button>
                  <button className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30" title="Save to Cloudinary">
                    <Cloud className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Single Generated Image Display
  const GeneratedImageDisplay = ({ image, title, originalImage }) => {
    if (!image) return null;
    
    return (
      <div className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
        <h4 className={`text-xs font-medium mb-2 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>
          {title}
        </h4>
        <div className="flex gap-2">
          {originalImage && (
            <div className="flex-1">
              <p className="text-[10px] text-slate-500 mb-1">Before</p>
              <img 
                src={originalImage}
                alt="Original"
                className="w-full h-32 object-cover rounded-lg opacity-70"
              />
            </div>
          )}
          <div className="flex-1">
            <p className="text-[10px] text-slate-500 mb-1">{originalImage ? 'After' : 'Result'}</p>
            <img 
              src={image}
              alt="Generated"
              className="w-full h-32 object-cover rounded-lg"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-2">
          <button className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-slate-600 hover:bg-slate-500 rounded-lg text-xs text-white transition-colors">
            <Download className="w-3 h-3" />
            Download
          </button>
          <button className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-teal-600 hover:bg-teal-500 rounded-lg text-xs text-white transition-colors">
            <Cloud className="w-3 h-3" />
            Save to Cloudinary
          </button>
        </div>
      </div>
    );
  };

  // ============================================
  // MAIN RENDER
  // ============================================

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="product-studio-tab">
      <ToastContainer position="top-right" theme={isDarkMode ? 'dark' : 'light'} autoClose={4000} />
      
      {/* API Status Banner - Show only if not configured */}
      {!apiStatus.api_accessible && (
        <div className={`rounded-xl overflow-hidden ${isDarkMode ? 'bg-gradient-to-r from-amber-900/40 via-orange-900/30 to-amber-900/40 border border-amber-500/40' : 'bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-300'}`}>
          <div className="p-4 sm:p-5">
            <div className="flex items-start gap-4">
              <div className={`p-2.5 rounded-xl ${isDarkMode ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
                <Lock className="w-6 h-6 text-amber-500" />
              </div>
              <div className="flex-1">
                <h3 className={`text-base font-semibold ${isDarkMode ? 'text-amber-300' : 'text-amber-800'}`}>
                  ⚙️ Google Gemini API Required
                </h3>
                <p className={`text-sm mt-1.5 ${isDarkMode ? 'text-amber-200/80' : 'text-amber-700'}`}>
                  Add your Google Gemini API key in <strong>Admin Settings → API Settings</strong> to enable AI image generation.
                  Name it "Google Gemini API" and add your API key from Google AI Studio.
                </p>
              </div>
              <button
                onClick={() => navigate('/admin/settings')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  isDarkMode 
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-900' 
                    : 'bg-amber-500 hover:bg-amber-600 text-white'
                }`}
                data-testid="configure-api-btn"
              >
                <Settings className="w-4 h-4" />
                Add API Key
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Success Banner - Show when API is configured */}
      {apiStatus.api_accessible && (
        <div className={`rounded-xl overflow-hidden ${isDarkMode ? 'bg-gradient-to-r from-teal-900/40 via-emerald-900/30 to-teal-900/40 border border-teal-500/40' : 'bg-gradient-to-r from-teal-50 via-emerald-50 to-teal-50 border border-teal-300'}`}>
          <div className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-teal-500/20' : 'bg-teal-100'}`}>
                <Sparkles className="w-5 h-5 text-teal-500" />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${isDarkMode ? 'text-teal-300' : 'text-teal-800'}`}>
                  ✓ AI Image Generation Ready
                </p>
                <p className={`text-xs ${isDarkMode ? 'text-teal-400/70' : 'text-teal-600'}`}>
                  Powered by {apiStatus.service || 'Google Gemini Imagen 3'} • Using your Google Cloud credits
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Product Studio
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            AI-powered product image generation
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ApiStatusBadge />
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span className={`text-xs ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>
              Google Gemini (Direct)
            </span>
          </div>
        </div>
      </div>

      {/* Product Selector */}
      <ProductSelectorCard />

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Generate Scene Card */}
        <ToolCard
          icon={Image}
          title="Generate Lifestyle Scene"
          description="Create AI backgrounds for your product"
          isGenerating={generating.scene}
          onGenerate={handleGenerateScene}
          buttonText="Generate Scenes"
        >
          <div className="space-y-2">
            <select
              value={selectedPreset}
              onChange={(e) => {
                setSelectedPreset(e.target.value);
                if (e.target.value) setCustomScene('');
              }}
              className={`w-full px-2.5 py-1.5 rounded-lg text-xs ${
                isDarkMode ? 'bg-slate-700 text-white border-slate-600' : 'bg-gray-50 text-gray-900 border-gray-300'
              } border`}
            >
              <option value="">-- Select a preset scene --</option>
              {presets.map(preset => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
            
            <div className={`text-center text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
              or
            </div>
            
            <input
              type="text"
              value={customScene}
              onChange={(e) => {
                setCustomScene(e.target.value);
                if (e.target.value) setSelectedPreset('');
              }}
              placeholder="Custom scene: e.g., 'rustic wooden table with sunlight'"
              className={`w-full px-2.5 py-1.5 rounded-lg text-xs ${
                isDarkMode ? 'bg-slate-700 text-white border-slate-600 placeholder-slate-500' : 'bg-gray-50 text-gray-900 border-gray-300 placeholder-gray-400'
              } border`}
            />
          </div>
          
          <GeneratedImageGrid images={generatedScenes} title="Generated Scenes (4)" />
        </ToolCard>

        {/* Remove Background Card */}
        <ToolCard
          icon={Eraser}
          title="Remove Background"
          description="Get clean product cutout"
          isGenerating={generating.background}
          onGenerate={handleRemoveBackground}
          buttonText="Remove Background"
        >
          {selectedProduct && getProductMainImage(selectedProduct) && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-700/30">
              <img 
                src={getProductMainImage(selectedProduct)} 
                alt="Current"
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div className="flex-1">
                <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                  Current product image will be processed
                </p>
              </div>
            </div>
          )}
          
          <GeneratedImageDisplay 
            image={removedBgImage} 
            title="Background Removed"
            originalImage={selectedProduct ? getProductMainImage(selectedProduct) : null}
          />
        </ToolCard>

        {/* Upscale Image Card */}
        <ToolCard
          icon={Maximize2}
          title="Increase Resolution"
          description="Upscale low-res images 2x-4x"
          isGenerating={generating.upscale}
          onGenerate={handleUpscaleImage}
          buttonText={`Upscale ${scaleFactor}x`}
        >
          <div className="flex items-center gap-2">
            <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              Scale Factor:
            </span>
            <select
              value={scaleFactor}
              onChange={(e) => setScaleFactor(parseInt(e.target.value))}
              className={`flex-1 px-2.5 py-1.5 rounded-lg text-xs ${
                isDarkMode ? 'bg-slate-700 text-white border-slate-600' : 'bg-gray-50 text-gray-900 border-gray-300'
              } border`}
            >
              <option value={2}>2x (Double resolution)</option>
              <option value={4}>4x (Quadruple resolution)</option>
            </select>
          </div>
          
          <GeneratedImageDisplay 
            image={upscaledImage} 
            title={`Upscaled ${scaleFactor}x`}
          />
        </ToolCard>

        {/* Generate Video Card */}
        <ToolCard
          icon={Video}
          title="Create Product Video"
          description="8-second animated video from image"
          isGenerating={generating.video}
          onGenerate={handleGenerateVideo}
          buttonText="Generate Video"
        >
          <div className={`flex items-center gap-2 p-2 rounded-lg ${isDarkMode ? 'bg-slate-700/30' : 'bg-gray-100'}`}>
            <Play className="w-4 h-4 text-teal-500" />
            <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
              Creates 8-second product animation
            </span>
          </div>
          
          <div className={`text-center py-3 rounded-lg border-2 border-dashed ${isDarkMode ? 'border-slate-600 text-slate-500' : 'border-gray-300 text-gray-400'}`}>
            <Video className="w-8 h-8 mx-auto mb-1 opacity-50" />
            <p className="text-xs">Video preview will appear here</p>
          </div>
        </ToolCard>
      </div>

      {/* Batch Generation Section */}
      <div className={`rounded-xl p-4 ${isDarkMode ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-white border border-gray-200'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10">
              <Zap className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Batch Generate for All Products
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                Generate scenes for multiple products at once
              </p>
            </div>
          </div>
          <span className={`px-2 py-1 rounded text-xs ${isDarkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
            Coming Soon
          </span>
        </div>
        
        <div className={`text-center py-6 rounded-lg border-2 border-dashed ${isDarkMode ? 'border-slate-600 text-slate-500' : 'border-gray-300 text-gray-400'}`}>
          <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">Select products and generate lifestyle scenes in bulk</p>
          <p className="text-xs mt-1">Requires API configuration</p>
        </div>
      </div>

      {/* Content Library Section */}
      <div className={`rounded-xl p-4 ${isDarkMode ? 'bg-slate-800/50 border border-slate-700/50' : 'bg-white border border-gray-200'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <FolderOpen className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Generated Content Library
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                View and manage all AI-generated content
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'}`}>
              <Filter className="w-3 h-3" />
              Filter
            </button>
          </div>
        </div>
        
        {generatedContent.length === 0 ? (
          <div className={`text-center py-8 rounded-lg border-2 border-dashed ${isDarkMode ? 'border-slate-600 text-slate-500' : 'border-gray-300 text-gray-400'}`}>
            <Image className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No generated content yet</p>
            <p className="text-xs mt-1">Generate scenes, remove backgrounds, or upscale images to see them here</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-3">
            {generatedContent.map((item, idx) => (
              <div key={idx} className="relative group">
                <img 
                  src={item.url}
                  alt={item.name}
                  className="w-full h-24 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg p-2 flex flex-col justify-end">
                  <p className="text-[10px] text-white truncate">{item.name}</p>
                  <p className="text-[9px] text-slate-400">{item.type}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API Status Card */}
      <div className={`rounded-xl p-4 ${isDarkMode ? 'bg-slate-800/30 border border-slate-700/30' : 'bg-gray-50 border border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${apiStatus.api_accessible ? 'bg-green-400' : 'bg-yellow-400'}`} />
            <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              API Status: {apiStatus.api_accessible ? 'Connected' : 'Not Configured'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className={isDarkMode ? 'text-slate-500' : 'text-gray-400'}>
              Merchant ID: {apiStatus.merchant_id || '5640753810'}
            </span>
            <button 
              onClick={fetchApiStatus}
              className={`flex items-center gap-1 ${isDarkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-500'}`}
            >
              <RefreshCw className="w-3 h-3" />
              Refresh Status
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductStudioTab;
