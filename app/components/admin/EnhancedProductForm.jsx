import React, { useState } from 'react';
import { API_BASE_URL } from '@/config/api';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { motion } from 'framer-motion';
import { 
  X, Save, Plus, Trash2, Upload, Image as ImageIcon, 
  ChevronDown, ChevronUp, AlertCircle, Package, Sparkles,
  FileText, Layers, Heart, DollarSign, Target, Tag
} from 'lucide-react';
import { toast } from 'react-toastify';
import ProductImageGallery from './ProductImageGallery';
import SEOSuggestionPanel from './SEOSuggestionPanel';

const CATEGORIES = [
  { value: 'treats', label: 'Treats' },
  { value: 'food', label: 'Food' },
  { value: 'toys', label: 'Toys' },
  { value: 'grooming', label: 'Grooming' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'health', label: 'Health & Wellness' }
];

const DOG_SIZES = ['small', 'medium', 'large'];
const DOG_AGES = ['puppy', 'adult', 'senior'];
const HEALTH_BENEFITS = ['dental', 'joints', 'skin', 'digestion', 'immunity', 'coat', 'energy'];

// Image types for product gallery
const IMAGE_TYPES = [
  { value: 'Main', label: '🏷️ Main - Hero product image', icon: '🏷️' },
  { value: 'Process', label: '🔬 Process - How it\'s made', icon: '🔬' },
  { value: 'Nutrition', label: '📊 Nutrition - Nutritional info', icon: '📊' },
  { value: 'Ingredients', label: '🌿 Ingredients - Ingredient list', icon: '🌿' },
  { value: 'Lifestyle', label: '🐕 Lifestyle - Dog using product', icon: '🐕' },
  { value: 'Details', label: '📋 Details - Product features', icon: '📋' },
  { value: 'Gallery', label: '🎨 Gallery - Additional image', icon: '🎨' }
];

function EnhancedProductForm({ product, onClose, onSuccess, focusField = null, issueType = null }) {
  const { isDarkMode } = useAdminTheme();
  const isEditing = !!product?.id;
  const metaDescRef = React.useRef(null);
  const metaTitleRef = React.useRef(null);
  const keywordsRef = React.useRef(null);

  // Auto-scroll and focus to the highlighted field
  React.useEffect(() => {
    if (focusField) {
      const timer = setTimeout(() => {
        const refMap = {
          'meta_description': metaDescRef,
          'meta_title': metaTitleRef,
          'keywords': keywordsRef
        };
        const ref = refMap[focusField];
        if (ref?.current) {
          ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
          ref.current.focus();
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [focusField]);

  // Helper to get field highlight styles
  const getFieldHighlight = (fieldName) => {
    if (focusField === fieldName) {
      return 'ring-2 ring-orange-500 bg-orange-500/10';
    }
    return '';
  };

  // Debug: Log product data
  React.useEffect(() => {
    console.log('EnhancedProductForm - Product data:', product);
    console.log('EnhancedProductForm - Product images:', product?.images);
    console.log('EnhancedProductForm - Images length:', product?.images?.length);
  }, [product]);

  // Initialize form data with all fields
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    category: product?.category || 'treats',
    price: product?.price || '',
    original_price: product?.original_price || '',
    weight: product?.weight || '500g',
    stock: product?.stock || 100,
    image_url: product?.image_url || '',
    images: Array.isArray(product?.images) ? product.images : [],
    dog_size: product?.dog_size || [],
    dog_age: product?.dog_age || [],
    health_benefits: product?.health_benefits || [],
    ingredients: product?.ingredients || [],
    is_vegetarian: product?.is_vegetarian || false,
    is_grain_free: product?.is_grain_free || false,
    featured: product?.featured || false,
    status: product?.status || 'active',
    // Storytelling fields
    journey_title: product?.journey_title || 'From Farm to Bowl - Our Journey',
    journey_steps: product?.journey_steps || [
      { emoji: '🌾', title: 'Sourced', description: 'Natural Ingredients', step: 1 },
      { emoji: '👨‍🍳', title: 'Prepared', description: 'Expert Crafted', step: 2 },
      { emoji: '✅', title: 'Tested', description: 'Quality Assured', step: 3 },
      { emoji: '📦', title: 'Packed', description: 'Ready to Serve', step: 4 }
    ],
    benefit_cards: product?.benefit_cards || [
      { icon: '🦴', title: 'Benefit 1', description: 'Description here' },
      { icon: '❤️', title: 'Benefit 2', description: 'Description here' },
      { icon: '✨', title: 'Benefit 3', description: 'Description here' },
      { icon: '🌟', title: 'Benefit 4', description: 'Description here' }
    ],
    pro_tip: product?.pro_tip || '',
    // Variants - ensure proper loading
    variants: Array.isArray(product?.variants) && product.variants.length > 0 
      ? product.variants 
      : [],
    // Concerns for Shop by Concern section
    concerns: product?.concerns || [],
    // SEO fields
    seo: {
      metaTitle: product?.seo?.metaTitle || '',
      metaDescription: product?.seo?.metaDescription || '',
      keywords: product?.seo?.keywords || [],
      indexingStatus: product?.seo?.indexingStatus || null
    }
  });

  // Debug: Log form data after initialization
  React.useEffect(() => {
    console.log('EnhancedProductForm - Form data initialized:', formData);
    console.log('EnhancedProductForm - Form images:', formData.images);
    console.log('EnhancedProductForm - Form images length:', formData.images.length);
  }, []);

  // CRITICAL FIX: Update formData when product prop changes
  React.useEffect(() => {
    if (product) {
      console.log('EnhancedProductForm - Updating form data with product:', product);
      setFormData({
        name: product.name || '',
        description: product.description || '',
        category: product.category || 'treats',
        price: product.price || '',
        original_price: product.original_price || '',
        weight: product.weight || '500g',
        stock: product.stock || 100,
        image_url: product.image_url || '',
        images: Array.isArray(product.images) ? product.images : [],
        dog_size: product.dog_size || [],
        dog_age: product.dog_age || [],
        health_benefits: product.health_benefits || [],
        ingredients: product.ingredients || [],
        is_vegetarian: product.is_vegetarian || false,
        is_grain_free: product.is_grain_free || false,
        featured: product.featured || false,
        status: product.status || 'active',
        journey_title: product.journey_title || 'From Farm to Bowl - Our Journey',
        journey_steps: product.journey_steps || [
          { emoji: '🌾', title: 'Sourced', description: 'Natural Ingredients', step: 1 },
          { emoji: '👨‍🍳', title: 'Prepared', description: 'Expert Crafted', step: 2 },
          { emoji: '✅', title: 'Tested', description: 'Quality Assured', step: 3 },
          { emoji: '📦', title: 'Packed', description: 'Ready to Serve', step: 4 }
        ],
        benefit_cards: product.benefit_cards || [
          { icon: '🦴', title: 'Benefit 1', description: 'Description here' },
          { icon: '❤️', title: 'Benefit 2', description: 'Description here' },
          { icon: '✨', title: 'Benefit 3', description: 'Description here' },
          { icon: '🌟', title: 'Benefit 4', description: 'Description here' }
        ],
        pro_tip: product.pro_tip || '',
        variants: Array.isArray(product.variants) && product.variants.length > 0 
          ? product.variants 
          : [],
        // SEO fields - CRITICAL: Must be here to load saved SEO data
        seo: product.seo ? {
          metaTitle: product.seo.metaTitle || '',
          metaDescription: product.seo.metaDescription || '',
          keywords: product.seo.keywords || [],
          indexingStatus: product.seo.indexingStatus || null
        } : {
          metaTitle: '',
          metaDescription: '',
          keywords: [],
          indexingStatus: null
        }
      });
      console.log('EnhancedProductForm - Images loaded:', product.images?.length || 0);
      console.log('EnhancedProductForm - SEO loaded:', product.seo);
    }
  }, [product]);

  const [ingredientInput, setIngredientInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImageType, setSelectedImageType] = useState('Gallery'); // Default to Gallery
  const [imageRefreshKey, setImageRefreshKey] = useState(0); // Force re-render key
  const [loadingIndexing, setLoadingIndexing] = useState(false); // For indexing operations
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    concerns: true,
    description: true,
    images: true,
    specs: false,
    benefits: false,
    variants: false
  });

  // Monitor images array changes
  React.useEffect(() => {
    console.log('Images state changed! Count:', formData.images.length);
    console.log('Current images:', formData.images);
    // Force re-render of image gallery
    setImageRefreshKey(prev => prev + 1);
  }, [formData.images]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleDescriptionChange = (e) => {
    setFormData(prev => ({ ...prev, description: e.target.value }));
  };

  const handleArrayToggle = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  // Ingredient Management
  const handleAddIngredient = () => {
    if (ingredientInput.trim()) {
      setFormData(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, ingredientInput.trim()]
      }));
      setIngredientInput('');
    }
  };

  const handleRemoveIngredient = (index) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  // Journey Steps Management
  // Benefit Cards Management
  const handleBenefitCardChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      benefit_cards: prev.benefit_cards.map((card, i) => 
        i === index ? { ...card, [field]: value } : card
      )
    }));
  };

  // Variant Management
  const handleAddVariant = () => {
    setFormData(prev => ({
      ...prev,
      variants: [...prev.variants, {
        size: '',
        price: 0,
        mrp: 0,
        sku: '',
        stock: 0
      }]
    }));
  };

  const handleRemoveVariant = (index) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  const handleVariantChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) => 
        i === index ? { ...variant, [field]: value } : variant
      )
    }));
  };

  // Image Management
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      console.log('Starting image upload with type:', selectedImageType);
      
      // Convert file to base64 to bypass artifact system
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const base64Data = await base64Promise;
      
      const API_BASE = API_BASE_URL;
      const token = localStorage.getItem('adminToken');

      // Step 1: Upload image using base64
      console.log('Uploading to:', `${API_BASE}/api/admin/products/single-upload-base64`);
      const uploadResponse = await fetch(`${API_BASE}/api/admin/products/single-upload-base64`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          image_data: base64Data,
          filename: file.name,
          content_type: file.type
        })
      });

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Upload failed:', errorText);
        throw new Error('Failed to upload image');
      }

      const uploadResult = await uploadResponse.json();
      const imageUrl = uploadResult.url || uploadResult.image_url;
      
      if (!imageUrl) {
        throw new Error('No image URL returned');
      }
      
      console.log('Image uploaded, URL:', imageUrl);
      
      // Step 2: Create image object with type
      const galleryCount = formData.images.filter(img => {
        const type = typeof img === 'object' ? img.type : null;
        return type === 'Gallery' || type?.startsWith('Gallery');
      }).length;
      
      const imageType = selectedImageType === 'Gallery' 
        ? `Gallery ${galleryCount + 1}` 
        : selectedImageType;
      
      const newImage = {
        url: imageUrl,
        alt: `${formData.name || 'Product'} - ${imageType}`,
        type: imageType
      };
      
      const updatedImages = [...formData.images, newImage];
      
      // Update form state with new image
      setFormData(prev => ({
        ...prev,
        images: updatedImages
      }));
      
      // If editing existing product, save to database immediately
      if (isEditing && product?.id) {
        console.log('Saving product with new image to database...');
        
        const saveResponse = await fetch(`${API_BASE}/api/admin/products/${product.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            ...formData,
            images: updatedImages
          })
        });

        if (!saveResponse.ok) {
          throw new Error('Failed to save product');
        }
        
        console.log('Product saved, reloading fresh data...');
        
        // Reload fresh data from database
        const freshDataResponse = await fetch(`${API_BASE}/api/admin/products`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (freshDataResponse.ok) {
          const freshProducts = await freshDataResponse.json();
          const updatedProduct = freshProducts.find(p => p.id === product.id);
          
          if (updatedProduct) {
            console.log('Fresh product data loaded:', updatedProduct);
            setFormData({
              ...updatedProduct,
              images: updatedProduct.images || []
            });
          }
        }
      } else {
        // For new products, just update form state - will be saved when user clicks Save
        console.log('New product - image added to form, will be saved when product is created');
      }
      
      toast.success('Image uploaded successfully!');
      
      // Reset file input
      e.target.value = '';
    } catch (error) {
      console.error('Image upload/save failed:', error);
      toast.error('Failed to upload image: ' + error.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageAdd = (imageData) => {
    console.log('handleImageAdd called with:', imageData);
    setFormData(prev => {
      const newImage = typeof imageData === 'string' 
        ? { url: imageData, type: 'Additional', alt: '' }
        : imageData;
      const updatedImages = [...prev.images, newImage];
      console.log('Images after add:', updatedImages);
      return {
        ...prev,
        images: updatedImages
      };
    });
  };

  // Handler for gallery upload (supports multiple files)
  const handleGalleryUpload = async (files) => {
    if (!files || files.length === 0) return;
    
    for (const file of files) {
      try {
        setUploadingImage(true);
        
        // Convert file to base64
        const reader = new FileReader();
        const base64Promise = new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const base64Data = await base64Promise;
        
        const API_BASE = API_BASE_URL;
        const token = localStorage.getItem('adminToken');

        // Upload image
        const uploadResponse = await fetch(`${API_BASE}/api/admin/products/single-upload-base64`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            image_data: base64Data,
            filename: file.name,
            content_type: file.type
          })
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload image');
        }

        const uploadResult = await uploadResponse.json();
        const imageUrl = uploadResult.url || uploadResult.image_url;
        
        if (!imageUrl) {
          throw new Error('No image URL returned');
        }
        
        // Determine image type
        const galleryCount = formData.images.filter(img => {
          const type = typeof img === 'object' ? img.type : null;
          return type === 'Gallery' || type?.startsWith('Gallery') || type === 'gallery';
        }).length;
        
        const newImage = {
          url: imageUrl,
          alt: `${formData.name || 'Product'} - Gallery ${galleryCount + 1}`,
          type: 'gallery'
        };
        
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, newImage]
        }));
        
        toast.success('Image uploaded successfully!');
      } catch (error) {
        console.error('Image upload failed:', error);
        toast.error('Failed to upload image: ' + error.message);
      }
    }
    setUploadingImage(false);
  };


  // Handler for updating individual image metadata
  const handleImageUpdate = (index, updatedImage) => {
    setFormData(prev => {
      const newImages = [...prev.images];
      newImages[index] = updatedImage;
      return { ...prev, images: newImages };
    });
  };

  // Handler for drag & drop reordering
  const handleDragReorder = (newImagesArray) => {
    setFormData(prev => ({
      ...prev,
      images: newImagesArray
    }));
  };

  const handleImageRemove = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleImageReorder = (fromIndex, toIndex) => {
    setFormData(prev => {
      const newImages = [...prev.images];
      const [removed] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, removed);
      return { ...prev, images: newImages };
    });
  };

  const handleImageTypeChange = (index, newType) => {
    setFormData(prev => {
      const newImages = [...prev.images];
      const currentImage = newImages[index];
      
      // Count existing Gallery images to assign proper number
      const galleryCount = newImages.filter((img, idx) => {
        const type = typeof img === 'object' ? img.type : null;
        return idx !== index && (type === 'Gallery' || type?.startsWith('Gallery'));
      }).length;
      
      const finalType = newType === 'Gallery' ? `Gallery ${galleryCount + 1}` : newType;
      
      // Update image with new type
      if (typeof currentImage === 'object') {
        newImages[index] = {
          ...currentImage,
          type: finalType,
          alt: `${formData.name || 'Product'} - ${finalType}`
        };
      } else {
        // Convert string to object
        newImages[index] = {
          url: currentImage,
          alt: `${formData.name || 'Product'} - ${finalType}`,
          type: finalType
        };
      }
      
      return { ...prev, images: newImages };
    });
    
    toast.success('Image type changed to ' + newType);
  };

  // SEO Indexing Functions
  const handleSubmitToGoogle = async () => {
    if (!product?.id) {
      toast.error('Save product first before submitting to Google');
      return;
    }

    try {
      setLoadingIndexing(true);
      const API_BASE = API_BASE_URL;
      const token = localStorage.getItem('adminToken');

      const response = await fetch(API_BASE + '/api/products/' + product.id + '/seo/index', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update form data with new indexing status
        setFormData(prev => ({
          ...prev,
          seo: {
            ...prev.seo,
            indexingStatus: data.indexing_status
          }
        }));
        
        toast.success('Product submitted to Google for indexing!');
      } else {
        toast.error('Failed to submit to Google');
      }
    } catch (error) {
      console.error('Indexing error:', error);
      toast.error('Failed to submit to Google');
    } finally {
      setLoadingIndexing(false);
    }
  };

  const handleRefreshIndexStatus = async () => {
    if (!product?.id) return;

    try {
      setLoadingIndexing(true);
      const API_BASE = API_BASE_URL;

      const response = await fetch(API_BASE + '/api/products/' + product.id + '/seo/index-status');

      if (response.ok) {
        const data = await response.json();
        
        // Update form data with refreshed status
        setFormData(prev => ({
          ...prev,
          seo: {
            ...prev.seo,
            indexingStatus: data.indexing_status
          }
        }));
        
        toast.success('Status refreshed');
      }
    } catch (error) {
      console.error('Refresh error:', error);
      toast.error('Failed to refresh status');
    } finally {
      setLoadingIndexing(false);
    }
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return false;
    }
    if (!formData.description.trim()) {
      toast.error('Description is required');
      return false;
    }
    if (!formData.price || formData.price <= 0) {
      toast.error('Price must be a positive number');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const API_BASE = API_BASE_URL;
      const token = localStorage.getItem('adminToken');
      
      // Auto-set image_url from first image in gallery (main image)
      const firstImageUrl = formData.images[0]
        ? (typeof formData.images[0] === 'string' ? formData.images[0] : formData.images[0].url)
        : '';
      
      // Clean up SEO data - remove internal tracking fields before submission
      const cleanSeo = formData.seo ? {
        metaTitle: formData.seo.metaTitle || '',
        metaDescription: formData.seo.metaDescription || '',
        keywords: formData.seo.keywords || [],
        indexingStatus: formData.seo.indexingStatus || null
      } : null;
      
      const submitData = {
        ...formData,
        image_url: firstImageUrl,  // Always use first gallery image as main
        seo: cleanSeo  // Use cleaned SEO object
      };
      
      // DEBUG: Log data being submitted
      console.log('🔍 SEO Data being submitted:', submitData.seo);
      console.log('🔍 Full submitData.seo object:', JSON.stringify(submitData.seo, null, 2));
      console.log('🔍 Images being submitted:', submitData.images);
      console.log('🔍 Full formData.images:', formData.images);
      console.log('🔍 ====== FULL SUBMIT DATA ======');
      console.log(JSON.stringify(submitData, null, 2));
      
      const endpoint = isEditing 
        ? `${API_BASE}/api/admin/products/${product.id}`
        : `${API_BASE}/api/admin/products/create`;
      
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        throw new Error('Failed to save product');
      }

      const result = await response.json();
      toast.success(isEditing ? 'Product updated successfully' : 'Product created successfully');
      
      // Trigger SEO recommendations refresh if available
      if (window.refreshSEORecommendations && typeof window.refreshSEORecommendations === 'function') {
        window.refreshSEORecommendations();
      }
      
      onSuccess(result);
      onClose();
    } catch (error) {
      console.error('Failed to save product:', error);
      toast.error('Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-5xl ${
          isDarkMode ? 'bg-obsidian-light' : 'bg-white'
        } rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto`}
      >
        {/* Header */}
        <div className={`sticky top-0 z-10 flex items-center justify-between p-6 border-b ${
          isDarkMode ? 'bg-obsidian-light border-white/10' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500">
              <Package size={24} className="text-white" />
            </div>
            <div>
              <h2 className={`text-2xl font-black ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                {isEditing ? 'Edit Product' : 'Create New Product'}
              </h2>
              <p className={`text-sm ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                Complete product information and storytelling content
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${
              isDarkMode ? 'hover:bg-white/10' : 'hover:bg-gray-100'
            }`}
          >
            <X size={24} className={isDarkMode ? 'text-pearl-white' : 'text-gray-900'} />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6">
          
          {/* SECTION 1: Basic Information */}
          <div className={`rounded-xl border ${isDarkMode ? 'bg-obsidian border-white/10' : 'bg-gray-50 border-gray-200'}`}>
            <button
              onClick={() => toggleSection('basic')}
              className="w-full flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-teal-400" />
                <span className={`font-bold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                  Basic Information
                </span>
              </div>
              {expandedSections.basic ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            
            {expandedSections.basic && (
              <div className="p-4 pt-0 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                      Product Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g., Premium Chicken Treats"
                      className={`w-full px-4 py-2 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-obsidian border-white/10 text-pearl-white placeholder-pearl-white/40'
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-obsidian border-white/10 text-pearl-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                      Status *
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-obsidian border-white/10 text-pearl-white'
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                      Weight
                    </label>
                    <input
                      type="text"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      placeholder="e.g., 500g"
                      className={`w-full px-4 py-2 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-obsidian border-white/10 text-pearl-white placeholder-pearl-white/40'
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="299"
                      className={`w-full px-4 py-2 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-obsidian border-white/10 text-pearl-white placeholder-pearl-white/40'
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                      Original Price (₹)
                    </label>
                    <input
                      type="number"
                      name="original_price"
                      value={formData.original_price}
                      onChange={handleChange}
                      placeholder="399"
                      className={`w-full px-4 py-2 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-obsidian border-white/10 text-pearl-white placeholder-pearl-white/40'
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                      Stock
                    </label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleChange}
                      placeholder="100"
                      className={`w-full px-4 py-2 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-obsidian border-white/10 text-pearl-white placeholder-pearl-white/40'
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="featured"
                      checked={formData.featured}
                      onChange={handleChange}
                      className="w-4 h-4"
                    />
                    <span className={isDarkMode ? 'text-pearl-white' : 'text-gray-900'}>Featured Product</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_vegetarian"
                      checked={formData.is_vegetarian}
                      onChange={handleChange}
                      className="w-4 h-4"
                    />
                    <span className={isDarkMode ? 'text-pearl-white' : 'text-gray-900'}>Vegetarian</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_grain_free"
                      checked={formData.is_grain_free}
                      onChange={handleChange}
                      className="w-4 h-4"
                    />
                    <span className={isDarkMode ? 'text-pearl-white' : 'text-gray-900'}>Grain Free</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: Shop by Concern */}
          <div className={`rounded-xl border ${isDarkMode ? 'bg-obsidian border-white/10' : 'bg-gray-50 border-gray-200'}`}>
            <button
              type="button"
              onClick={() => toggleSection('concerns')}
              className="w-full flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                  <Tag className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className={`font-bold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                    Shop by Concern
                  </span>
                  <p className={`text-xs ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'}`}>
                    Select health concerns this product addresses
                  </p>
                </div>
              </div>
              {expandedSections.concerns ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {expandedSections.concerns && (
              <div className="px-4 pb-4">
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Excessive Chewing', value: 'excessive_chewing' },
                    { label: 'Bad Breath', value: 'bad_breath' },
                    { label: 'Skin & Coat', value: 'skin_coat' },
                    { label: 'Dental Health', value: 'dental_health' },
                    { label: 'Anxiety', value: 'anxiety' },
                    { label: 'Joint Health', value: 'joint_health' },
                    { label: 'Picky Eaters', value: 'picky_eaters' },
                    { label: 'Training Rewards', value: 'training_rewards' },
                    { label: 'Nutrition Boost', value: 'nutrition_boost' },
                  ].map((concern) => {
                    const isSelected = (formData.concerns || []).includes(concern.value);
                    return (
                      <button
                        key={concern.value}
                        type="button"
                        onClick={() => {
                          const currentConcerns = formData.concerns || [];
                          const newConcerns = isSelected
                            ? currentConcerns.filter(c => c !== concern.value)
                            : [...currentConcerns, concern.value];
                          setFormData({ ...formData, concerns: newConcerns });
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                          isSelected
                            ? 'bg-teal-500 text-white border-teal-500'
                            : isDarkMode
                              ? 'bg-slate-700 text-slate-300 border-slate-600 hover:border-teal-500'
                              : 'bg-gray-200 text-gray-700 border-gray-300 hover:border-teal-500'
                        }`}
                      >
                        {concern.label}
                      </button>
                    );
                  })}
                </div>
                {formData.concerns && formData.concerns.length > 0 && (
                  <div className={`mt-3 text-xs ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'}`}>
                    Selected: {formData.concerns.length} concern{formData.concerns.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SECTION 3: Description */}
          <div className={`rounded-xl border ${isDarkMode ? 'bg-obsidian border-white/10' : 'bg-gray-50 border-gray-200'}`}>
            <button
              onClick={() => toggleSection('description')}
              className="w-full flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-3">
                <FileText size={20} className="text-teal-400" />
                <span className={`font-bold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                  Product Description *
                </span>
              </div>
              {expandedSections.description ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            
            {expandedSections.description && (
              <div className="p-4 pt-0">
                <textarea
                  value={formData.description}
                  onChange={handleDescriptionChange}
                  placeholder="Write detailed product description..."
                  rows={10}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    isDarkMode 
                      ? 'bg-obsidian border-white/10 text-pearl-white placeholder-pearl-white/40'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                  } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                />
                <p className={`text-xs mt-2 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                  You can use basic HTML tags for formatting
                </p>
              </div>
            )}
          </div>

          {/* SECTION 4: Image Gallery */}
          <div key={`gallery-section-${formData.images.length}`} className={`rounded-xl border ${isDarkMode ? 'bg-obsidian border-white/10' : 'bg-gray-50 border-gray-200'}`}>
            <button
              onClick={() => toggleSection('images')}
              className="w-full flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-3">
                <ImageIcon size={20} className="text-teal-400" />
                <span className={`font-bold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                  Image Gallery ({formData.images.length} images)
                </span>
              </div>
              {expandedSections.images ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            
            {expandedSections.images && (
              <div className="p-4 pt-0">
                <ProductImageGallery
                  key={`gallery-${imageRefreshKey}`}
                  images={formData.images}
                  onUpdate={handleImageUpdate}
                  onDelete={handleImageRemove}
                  onReorder={handleDragReorder}
                  onAddImage={(newImage) => {
                    console.log('📸 EnhancedProductForm: Received new image:', newImage);
                    setFormData(prev => {
                      const updatedImages = [...prev.images, newImage];
                      console.log('📸 EnhancedProductForm: Updated images array:', updatedImages);
                      console.log('📸 EnhancedProductForm: New images count:', updatedImages.length);
                      return {
                        ...prev,
                        images: updatedImages
                      };
                    });
                    toast.success(`Image added! (${newImage.type}) - Don't forget to save!`, { duration: 3000 });
                  }}
                  isDarkMode={isDarkMode}
                />
              </div>
            )}
          </div>

          {/* SECTION 5: Dog Specifications */}
          <div className={`rounded-xl border ${isDarkMode ? 'bg-obsidian border-white/10' : 'bg-gray-50 border-gray-200'}`}>
            <button
              onClick={() => toggleSection('specs')}
              className="w-full flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-3">
                <Target size={20} className="text-teal-400" />
                <span className={`font-bold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                  🐕 Dog Specifications
                </span>
              </div>
              {expandedSections.specs ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            
            {expandedSections.specs && (
              <div className="p-4 pt-0 space-y-4">
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                    Dog Size
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DOG_SIZES.map(size => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => handleArrayToggle('dog_size', size)}
                        className={`px-4 py-2 rounded-lg font-semibold capitalize ${
                          formData.dog_size.includes(size)
                            ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white'
                            : isDarkMode
                              ? 'bg-white/10 text-pearl-white hover:bg-white/20'
                              : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                    Dog Age
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DOG_AGES.map(age => (
                      <button
                        key={age}
                        type="button"
                        onClick={() => handleArrayToggle('dog_age', age)}
                        className={`px-4 py-2 rounded-lg font-semibold capitalize ${
                          formData.dog_age.includes(age)
                            ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white'
                            : isDarkMode
                              ? 'bg-white/10 text-pearl-white hover:bg-white/20'
                              : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                        }`}
                      >
                        {age}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                    Health Benefits
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {HEALTH_BENEFITS.map(benefit => (
                      <button
                        key={benefit}
                        type="button"
                        onClick={() => handleArrayToggle('health_benefits', benefit)}
                        className={`px-4 py-2 rounded-lg font-semibold capitalize ${
                          formData.health_benefits.includes(benefit)
                            ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white'
                            : isDarkMode
                              ? 'bg-white/10 text-pearl-white hover:bg-white/20'
                              : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                        }`}
                      >
                        {benefit}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                    Ingredients
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={ingredientInput}
                      onChange={(e) => setIngredientInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddIngredient())}
                      placeholder="Add ingredient..."
                      className={`flex-1 px-4 py-2 rounded-lg border ${
                        isDarkMode 
                          ? 'bg-obsidian border-white/10 text-pearl-white placeholder-pearl-white/40'
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                    />
                    <button
                      type="button"
                      onClick={handleAddIngredient}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.ingredients.map((ingredient, index) => (
                      <div
                        key={index}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                          isDarkMode ? 'bg-white/10' : 'bg-gray-200'
                        }`}
                      >
                        <span className={isDarkMode ? 'text-pearl-white' : 'text-gray-900'}>{ingredient}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveIngredient(index)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 6: Benefit Cards */}
          <div className={`rounded-xl border ${isDarkMode ? 'bg-obsidian border-white/10' : 'bg-gray-50 border-gray-200'}`}>
            <button
              onClick={() => toggleSection('benefits')}
              className="w-full flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-3">
                <Heart size={20} className="text-teal-400" />
                <span className={`font-bold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                  ❤️ Benefit Cards ({formData.benefit_cards.length} Cards)
                </span>
              </div>
              {expandedSections.benefits ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            
            {expandedSections.benefits && (
              <div className="p-4 pt-0 space-y-4">
                {formData.benefit_cards.map((card, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                    <div className="grid gap-3">
                      <input
                        type="text"
                        value={card.icon}
                        onChange={(e) => handleBenefitCardChange(index, 'icon', e.target.value)}
                        placeholder="🦴"
                        className={`px-4 py-2 rounded-lg border ${
                          isDarkMode 
                            ? 'bg-obsidian border-white/10 text-pearl-white placeholder-pearl-white/40'
                            : 'bg-white border-gray-300 text-gray-900'
                        } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                      />
                      <input
                        type="text"
                        value={card.title}
                        onChange={(e) => handleBenefitCardChange(index, 'title', e.target.value)}
                        placeholder="Benefit Title"
                        className={`px-4 py-2 rounded-lg border ${
                          isDarkMode 
                            ? 'bg-obsidian border-white/10 text-pearl-white placeholder-pearl-white/40'
                            : 'bg-white border-gray-300 text-gray-900'
                        } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                      />
                      <textarea
                        value={card.description}
                        onChange={(e) => handleBenefitCardChange(index, 'description', e.target.value)}
                        placeholder="Benefit description..."
                        rows={2}
                        className={`px-4 py-2 rounded-lg border ${
                          isDarkMode 
                            ? 'bg-obsidian border-white/10 text-pearl-white placeholder-pearl-white/40'
                            : 'bg-white border-gray-300 text-gray-900'
                        } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                      />
                    </div>
                  </div>
                ))}

                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                    Pro Tip
                  </label>
                  <textarea
                    value={formData.pro_tip}
                    onChange={(e) => setFormData(prev => ({ ...prev, pro_tip: e.target.value }))}
                    placeholder="Expert tip for using this product..."
                    rows={2}
                    className={`w-full px-4 py-2 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-obsidian border-white/10 text-pearl-white placeholder-pearl-white/40'
                        : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 7: Product Variants */}
          <div className={`rounded-xl border ${isDarkMode ? 'bg-obsidian border-white/10' : 'bg-gray-50 border-gray-200'}`}>
            <button
              onClick={() => toggleSection('variants')}
              className="w-full flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-3">
                <Layers size={20} className="text-teal-400" />
                <span className={`font-bold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                  📦 Product Variants ({formData.variants.length} variants)
                </span>
              </div>
              {expandedSections.variants ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            
            {expandedSections.variants && (
              <div className="p-4 pt-0 space-y-4">
                {formData.variants.map((variant, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 grid md:grid-cols-5 gap-3">
                        <input
                          type="text"
                          value={variant.size}
                          onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                          placeholder="100g"
                          className={`px-4 py-2 rounded-lg border ${
                            isDarkMode 
                              ? 'bg-obsidian border-white/10 text-pearl-white placeholder-pearl-white/40'
                              : 'bg-white border-gray-300 text-gray-900'
                          } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                        />
                        <input
                          type="number"
                          value={variant.price}
                          onChange={(e) => handleVariantChange(index, 'price', parseFloat(e.target.value))}
                          placeholder="Price"
                          className={`px-4 py-2 rounded-lg border ${
                            isDarkMode 
                              ? 'bg-obsidian border-white/10 text-pearl-white placeholder-pearl-white/40'
                              : 'bg-white border-gray-300 text-gray-900'
                          } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                        />
                        <input
                          type="number"
                          value={variant.mrp}
                          onChange={(e) => handleVariantChange(index, 'mrp', parseFloat(e.target.value))}
                          placeholder="MRP"
                          className={`px-4 py-2 rounded-lg border ${
                            isDarkMode 
                              ? 'bg-obsidian border-white/10 text-pearl-white placeholder-pearl-white/40'
                              : 'bg-white border-gray-300 text-gray-900'
                          } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                        />
                        <input
                          type="text"
                          value={variant.sku}
                          onChange={(e) => handleVariantChange(index, 'sku', e.target.value)}
                          placeholder="SKU"
                          className={`px-4 py-2 rounded-lg border ${
                            isDarkMode 
                              ? 'bg-obsidian border-white/10 text-pearl-white placeholder-pearl-white/40'
                              : 'bg-white border-gray-300 text-gray-900'
                          } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                        />
                        <input
                          type="number"
                          value={variant.stock}
                          onChange={(e) => handleVariantChange(index, 'stock', parseInt(e.target.value))}
                          placeholder="Stock"
                          className={`px-4 py-2 rounded-lg border ${
                            isDarkMode 
                              ? 'bg-obsidian border-white/10 text-pearl-white placeholder-pearl-white/40'
                              : 'bg-white border-gray-300 text-gray-900'
                          } focus:outline-none focus:ring-2 focus:ring-teal-500`}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(index)}
                        className="p-2 rounded-lg text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddVariant}
                  className={`w-full py-3 rounded-lg border-2 border-dashed font-semibold flex items-center justify-center gap-2 ${
                    isDarkMode 
                      ? 'border-white/20 text-pearl-white hover:bg-white/5'
                      : 'border-gray-300 text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Plus size={20} />
                  Add Variant
                </button>
              </div>
            )}
          </div>

          {/* SEO Section - Basic Fields */}
          <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-obsidian border-white/10' : 'bg-gray-50 border-gray-200'} ${focusField ? 'ring-2 ring-teal-500' : ''}`}>
            <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
              SEO Optimization
              {focusField && (
                <span className="ml-2 text-sm font-normal text-orange-400">← Fix this section</span>
              )}
            </h3>
            
            {/* AI SEO Suggestion Panel - Shows when issue type is provided */}
            {issueType && focusField && (
              <SEOSuggestionPanel
                issue={issueType}
                currentValue={
                  focusField === 'meta_title' 
                    ? formData.seo?.metaTitle || ''
                    : focusField === 'meta_description'
                    ? formData.seo?.metaDescription || ''
                    : formData.seo?.keywords?.join(', ') || ''
                }
                fieldType={
                  focusField === 'meta_title' ? 'title' : 
                  focusField === 'meta_description' ? 'description' : 
                  'keywords'
                }
                productName={formData.name}
                onApplySuggestion={(newValue) => {
                  console.log('🔍 Apply This clicked - focusField:', focusField);
                  console.log('🔍 Apply This clicked - newValue:', newValue);
                  
                  if (focusField === 'meta_title') {
                    setFormData(prev => ({
                      ...prev,
                      seo: { 
                        ...prev.seo, 
                        metaTitle: newValue,
                        // Mark as updated for visual feedback
                        _lastUpdated: 'metaTitle'
                      }
                    }));
                    // Force focus on the input to show the change
                    setTimeout(() => {
                      if (metaTitleRef.current) {
                        metaTitleRef.current.focus();
                        metaTitleRef.current.select();
                      }
                    }, 100);
                  } else if (focusField === 'meta_description') {
                    setFormData(prev => ({
                      ...prev,
                      seo: { 
                        ...prev.seo, 
                        metaDescription: newValue,
                        _lastUpdated: 'metaDescription'
                      }
                    }));
                    // Force focus on the textarea to show the change
                    setTimeout(() => {
                      if (metaDescRef.current) {
                        metaDescRef.current.focus();
                        metaDescRef.current.select();
                      }
                    }, 100);
                  } else if (focusField === 'keywords') {
                    setFormData(prev => ({
                      ...prev,
                      seo: { 
                        ...prev.seo, 
                        keywords: newValue.split(',').map(k => k.trim()),
                        _lastUpdated: 'keywords'
                      }
                    }));
                  }
                }}
              />
            )}
            
            <div className="space-y-4">
              {/* Meta Title */}
              <div className={`p-3 rounded-lg ${getFieldHighlight('meta_title')}`}>
                <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                  Meta Title (50-60 chars optimal)
                  {(() => {
                    const titleLength = (formData.seo?.metaTitle || '').length;
                    const isEmpty = !formData.seo?.metaTitle || formData.seo.metaTitle.trim() === '';
                    const isTooShort = titleLength > 0 && titleLength < 30;
                    const isTooLong = titleLength > 70;
                    const needsFix = isEmpty || isTooShort || isTooLong;
                    
                    if (focusField === 'meta_title' && needsFix) {
                      return <span className="ml-2 text-orange-400 text-xs font-medium">← Fix this field</span>;
                    }
                    return null;
                  })()}
                </label>
                <input
                  ref={metaTitleRef}
                  type="text"
                  value={formData.seo?.metaTitle || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    seo: { ...prev.seo, metaTitle: e.target.value }
                  }))}
                  placeholder="Premium Dog Treats | PetYupp"
                  maxLength={70}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    (() => {
                      const titleLength = (formData.seo?.metaTitle || '').length;
                      const isEmpty = !formData.seo?.metaTitle || formData.seo.metaTitle.trim() === '';
                      const isTooShort = titleLength > 0 && titleLength < 30;
                      const isTooLong = titleLength > 70;
                      const isOptimal = titleLength >= 50 && titleLength <= 60;
                      const isAcceptable = titleLength >= 30 && titleLength < 50 || titleLength > 60 && titleLength <= 70;
                      
                      if (isEmpty || isTooShort || isTooLong) {
                        return isDarkMode ? 'bg-obsidian border-red-500 text-pearl-white placeholder-pearl-white/40' : 'bg-white border-red-500 text-gray-900';
                      }
                      if (isOptimal) {
                        return isDarkMode ? 'bg-obsidian border-green-500 text-pearl-white placeholder-pearl-white/40' : 'bg-white border-green-500 text-gray-900';
                      }
                      if (isAcceptable) {
                        return isDarkMode ? 'bg-obsidian border-amber-500 text-pearl-white placeholder-pearl-white/40' : 'bg-white border-amber-500 text-gray-900';
                      }
                      return isDarkMode ? 'bg-obsidian border-white/10 text-pearl-white placeholder-pearl-white/40' : 'bg-white border-gray-300 text-gray-900';
                    })()
                  } focus:outline-none focus:ring-2 focus:ring-cyber-lime ${getFieldHighlight('meta_title')}`}
                />
                <div className="flex justify-between mt-1">
                  <span className={`text-xs ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                    Recommended: 50-60 characters
                  </span>
                  <span className={`text-xs ${
                    (() => {
                      const length = (formData.seo?.metaTitle || '').length;
                      if (length === 0) return isDarkMode ? 'text-pearl-white/60' : 'text-gray-400';
                      if (length < 30 || length > 70) return 'text-red-400';
                      if (length >= 50 && length <= 60) return 'text-green-400';
                      if (length >= 30 && length < 50 || length > 60 && length <= 70) return 'text-amber-400';
                      return isDarkMode ? 'text-pearl-white/60' : 'text-gray-400';
                    })()
                  }`}>
                    {(formData.seo?.metaTitle || '').length}/70
                  </span>
                </div>
                {focusField === 'meta_title' && !(formData.seo?.metaTitle) && (
                  <div className="mt-2 p-3 bg-teal-500/10 border border-teal-500/30 rounded-lg">
                    <p className="text-sm text-teal-400 font-medium mb-2">Quick Fix:</p>
                    <button
                      type="button"
                      onClick={() => {
                        const suggestion = `${formData.name || 'Premium Dog Treat'} | PetYupp India`;
                        setFormData(prev => ({
                          ...prev,
                          seo: { ...prev.seo, metaTitle: suggestion.substring(0, 60) }
                        }));
                      }}
                      className="text-xs bg-teal-500 hover:bg-teal-600 text-white px-3 py-1 rounded"
                    >
                      Use Suggested Template
                    </button>
                  </div>
                )}
              </div>

              {/* Meta Description */}
              <div className={`p-3 rounded-lg ${getFieldHighlight('meta_description')}`}>
                <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                  Meta Description (150-160 chars optimal)
                  {(() => {
                    const descLength = (formData.seo?.metaDescription || '').length;
                    const isEmpty = !formData.seo?.metaDescription || formData.seo.metaDescription.trim() === '';
                    const isTooShort = descLength > 0 && descLength < 100;
                    const isTooLong = descLength > 170;
                    const needsFix = isEmpty || isTooShort || isTooLong;
                    
                    if (focusField === 'meta_description' && needsFix) {
                      return <span className="ml-2 text-orange-400 text-xs font-medium">← Fix this field</span>;
                    }
                    return null;
                  })()}
                </label>
                <textarea
                  ref={metaDescRef}
                  value={formData.seo?.metaDescription || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    seo: { ...prev.seo, metaDescription: e.target.value }
                  }))}
                  placeholder="Premium natural dog treats made with high-quality ingredients..."
                  maxLength={170}
                  rows={3}
                  className={`w-full px-4 py-3 rounded-lg border ${
                    (() => {
                      const descLength = (formData.seo?.metaDescription || '').length;
                      const isEmpty = !formData.seo?.metaDescription || formData.seo.metaDescription.trim() === '';
                      const isTooShort = descLength > 0 && descLength < 100;
                      const isTooLong = descLength > 170;
                      const isOptimal = descLength >= 150 && descLength <= 160;
                      const isAcceptable = descLength >= 100 && descLength < 150 || descLength > 160 && descLength <= 170;
                      
                      if (isEmpty || isTooShort || isTooLong) {
                        return isDarkMode ? 'bg-obsidian border-red-500 text-pearl-white placeholder-pearl-white/40' : 'bg-white border-red-500 text-gray-900';
                      }
                      if (isOptimal) {
                        return isDarkMode ? 'bg-obsidian border-green-500 text-pearl-white placeholder-pearl-white/40' : 'bg-white border-green-500 text-gray-900';
                      }
                      if (isAcceptable) {
                        return isDarkMode ? 'bg-obsidian border-amber-500 text-pearl-white placeholder-pearl-white/40' : 'bg-white border-amber-500 text-gray-900';
                      }
                      return isDarkMode ? 'bg-obsidian border-white/10 text-pearl-white placeholder-pearl-white/40' : 'bg-white border-gray-300 text-gray-900';
                    })()
                  } focus:outline-none focus:ring-2 focus:ring-cyber-lime ${getFieldHighlight('meta_description')}`}
                />
                <div className="flex justify-between mt-1">
                  <span className={`text-xs ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                    Recommended: 150-160 characters
                  </span>
                  <span className={`text-xs ${
                    (() => {
                      const length = (formData.seo?.metaDescription || '').length;
                      if (length === 0) return isDarkMode ? 'text-pearl-white/60' : 'text-gray-400';
                      if (length < 100 || length > 170) return 'text-red-400';
                      if (length >= 150 && length <= 160) return 'text-green-400';
                      if (length >= 100 && length < 150 || length > 160 && length <= 170) return 'text-amber-400';
                      return isDarkMode ? 'text-pearl-white/60' : 'text-gray-400';
                    })()
                  }`}>
                    {(formData.seo?.metaDescription || '').length}/170
                  </span>
                </div>
                {focusField === 'meta_description' && !(formData.seo?.metaDescription) && (
                  <div className="mt-2 p-3 bg-teal-500/10 border border-teal-500/30 rounded-lg">
                    <p className="text-sm text-teal-400 font-medium mb-2">Quick Fix Suggestion:</p>
                    <p className="text-xs text-slate-300 mb-2">
                      Write 150-160 characters describing this product. Include name, key benefit, and call to action.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const suggestion = `${formData.name || 'Premium dog treat'} - ${formData.category || 'Natural'} treats for your pet. High-quality ingredients for a healthy, happy dog. Shop now at PetYupp.`;
                        setFormData(prev => ({
                          ...prev,
                          seo: { ...prev.seo, metaDescription: suggestion.substring(0, 160) }
                        }));
                      }}
                      className="text-xs bg-teal-500 hover:bg-teal-600 text-white px-3 py-1 rounded"
                    >
                      Use Suggested Template
                    </button>
                  </div>
                )}
              </div>

              {/* Keywords */}
              <div className={`p-3 rounded-lg ${getFieldHighlight('keywords')}`}>
                <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                  Keywords (comma-separated, 5-10 recommended)
                  {focusField === 'keywords' && (
                    <span className="ml-2 text-orange-400 text-xs font-medium">← Fix this field</span>
                  )}
                </label>
                <input
                  ref={keywordsRef}
                  type="text"
                  value={formData.seo?.keywords?.join(', ') || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    seo: { 
                      ...prev.seo, 
                      keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                    }
                  }))}
                  placeholder="dog treats, chicken feet, healthy, natural"
                  className={`w-full px-4 py-3 rounded-lg border ${
                    isDarkMode
                      ? 'bg-obsidian border-white/10 text-pearl-white placeholder-pearl-white/40'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-cyber-lime ${getFieldHighlight('keywords')}`}
                />
                <p className={`text-xs mt-1 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                  Keywords: {(formData.seo?.keywords?.length || 0)}/10
                </p>
              </div>

              {/* Indexing Status & Controls */}
              <div className={`p-4 rounded-lg border ${
                formData.seo?.indexingStatus?.indexed
                  ? 'bg-green-500/10 border-green-500/20'
                  : 'bg-yellow-500/10 border-yellow-500/20'
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className={`font-bold text-sm ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                    Google Indexing Status
                  </h4>
                  <span className={`text-xs px-3 py-1 rounded-full ${
                    formData.seo?.indexingStatus?.indexed
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {formData.seo?.indexingStatus?.indexed ? '✅ Indexed' : '⏳ Pending'}
                  </span>
                </div>

                <div className="space-y-2 mb-3">
                  <p className={`text-xs ${isDarkMode ? 'text-pearl-white/70' : 'text-gray-600'}`}>
                    <strong>Status:</strong> {formData.seo?.indexingStatus?.status || 'pending'}
                  </p>
                  
                  {formData.seo?.indexingStatus?.lastIndexedAt && (
                    <p className={`text-xs ${isDarkMode ? 'text-pearl-white/70' : 'text-gray-600'}`}>
                      <strong>Last Submitted:</strong>{' '}
                      {new Date(formData.seo.indexingStatus.lastIndexedAt).toLocaleString()}
                    </p>
                  )}

                  {formData.seo?.indexingStatus?.googleURL && (
                    <p className={`text-xs ${isDarkMode ? 'text-pearl-white/70' : 'text-gray-600'}`}>
                      <strong>URL:</strong>{' '}
                      <a 
                        href={formData.seo.indexingStatus.googleURL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyber-lime hover:underline"
                      >
                        {formData.seo.indexingStatus.googleURL}
                      </a>
                    </p>
                  )}

                  {!formData.seo?.indexingStatus?.indexed && (
                    <p className={`text-xs italic ${isDarkMode ? 'text-pearl-white/50' : 'text-gray-500'}`}>
                      Note: Currently using mock indexing. Phase 3 will integrate with Google Search Console API.
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleRefreshIndexStatus}
                    disabled={loadingIndexing || !product?.id}
                    className={`flex-1 px-4 py-2 rounded-lg font-semibold text-sm ${
                      isDarkMode
                        ? 'bg-white/10 text-pearl-white hover:bg-white/20'
                        : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                    } disabled:opacity-50 flex items-center justify-center gap-2`}
                  >
                    🔄 {loadingIndexing ? 'Loading...' : 'Refresh Status'}
                  </button>
                  
                  <button
                    onClick={handleSubmitToGoogle}
                    disabled={loadingIndexing || !product?.id}
                    className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    📤 {loadingIndexing ? 'Submitting...' : 'Submit to Google'}
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className={`sticky bottom-0 flex items-center justify-end gap-3 p-6 border-t ${
          isDarkMode ? 'bg-obsidian-light border-white/10' : 'bg-white border-gray-200'
        }`}>
          <button
            onClick={onClose}
            disabled={loading}
            className={`px-6 py-3 rounded-lg font-semibold ${
              isDarkMode 
                ? 'bg-white/10 text-pearl-white hover:bg-white/20'
                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
            } disabled:opacity-50`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-6 py-3 rounded-lg font-semibold bg-gradient-to-r from-teal-500 to-cyan-500 text-white disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <>Saving...</>
            ) : (
              <>
                <Save size={20} />
                {isEditing ? 'Update Product' : 'Create Product'}
              </>
            )}
          </button>
        </div>

      </motion.div>
    </motion.div>
  );
}

export default EnhancedProductForm;
