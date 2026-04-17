import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';
import { motion } from 'framer-motion';
import { X, Save, Sparkles, Tag } from 'lucide-react';

const CATEGORIES = [
  { value: 'treats', label: 'Treats' },
  { value: 'toys', label: 'Toys' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'grooming', label: 'Grooming' },
  { value: 'food', label: 'Food' },
  { value: 'health', label: 'Health & Wellness' }
];

const DOG_SIZES = ['small', 'medium', 'large'];
const DOG_AGES = ['puppy', 'adult', 'senior'];
const HEALTH_BENEFITS = ['dental', 'joints', 'skin', 'digestion', 'immunity', 'coat', 'energy'];

function ProductForm({ product, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'treats',
    price: '',
    original_price: '',
    weight: '500g',
    stock: 100,
    dog_size: [],
    dog_age: [],
    health_benefits: [],
    ingredients: [],
    concerns: [],
    is_vegetarian: false,
    is_grain_free: false,
    featured: false,
    ...product
  });

  const [ingredientInput, setIngredientInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleArrayToggle = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

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

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.price || formData.price <= 0) {
      newErrors.price = 'Price must be a positive number';
    }
    
    if (formData.original_price && formData.original_price <= formData.price) {
      newErrors.original_price = 'Original price must be greater than current price';
    }
    
    if (formData.stock < 0) {
      newErrors.stock = 'Stock cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('adminToken');
      const API_URL = API_BASE_URL + '/api';
      
      // Prepare data for submission
      const submitData = {
        ...formData,
        price: parseFloat(formData.price),
        original_price: formData.original_price ? parseFloat(formData.original_price) : null,
        stock: parseInt(formData.stock),
      };

      const endpoint = product?.id 
        ? `${API_URL}/admin/products/${product.id}`
        : `${API_URL}/admin/products/create`;
      
      const method = product?.id ? 'PUT' : 'POST';

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save product');
      }

      const result = await response.json();
      onSuccess(result);
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
      setErrors({ submit: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-obsidian/80 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 9999 }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-obsidian via-obsidian/95 to-teal-500/20 border border-white/10 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative"
        style={{ zIndex: 10000 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-pearl-white flex items-center gap-2">
              <Sparkles className="text-cyber-lime" size={24} />
              {product?.id ? 'Edit Product' : 'Create New Product'}
            </h2>
            <p className="text-pearl-white/60 text-sm mt-1">
              {product?.id ? 'Update product details' : 'Add a new product to your catalog'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-pearl-white/60 hover:text-pearl-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-pearl-white">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-pearl-white/80 text-sm font-semibold mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-pearl-white focus:border-cyber-lime focus:outline-none transition-colors"
                  placeholder="Premium Chicken Treats"
                />
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-pearl-white/80 text-sm font-semibold mb-2">
                  Category *
                </label>
                <div className="relative">
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-pearl-white focus:border-cyber-lime focus:outline-none transition-colors appearance-none cursor-pointer"
                    style={{ 
                      position: 'relative',
                      zIndex: 1
                    }}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.value} value={cat.value} className="bg-obsidian text-pearl-white">{cat.label}</option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-pearl-white/60">
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="currentColor">
                      <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" fill="none"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-pearl-white/80 text-sm font-semibold mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-pearl-white focus:border-cyber-lime focus:outline-none transition-colors resize-none"
                placeholder="Describe your product..."
              />
              {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
            </div>
          </div>

          {/* Shop by Concern Tags */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
                <Tag className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-pearl-white">Shop by Concern</h3>
                <p className="text-xs text-pearl-white/60">Select concerns this product helps with</p>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'excessive_chewing', label: 'Excessive Chewing' },
                { id: 'bad_breath', label: 'Bad Breath' },
                { id: 'skin_coat', label: 'Skin & Coat' },
                { id: 'dental_health', label: 'Dental Health' },
                { id: 'anxiety', label: 'Anxiety' },
                { id: 'joint_health', label: 'Joint Health' },
                { id: 'picky_eaters', label: 'Picky Eaters' },
                { id: 'training_rewards', label: 'Training Rewards' },
                { id: 'nutrition_boost', label: 'Nutrition Boost' }
              ].map((concern) => (
                <button
                  key={concern.id}
                  type="button"
                  onClick={() => handleArrayToggle('concerns', concern.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                    formData.concerns?.includes(concern.id)
                      ? 'bg-teal-500 text-white border-teal-500 shadow-lg shadow-teal-500/50'
                      : 'bg-slate-700 text-slate-300 border-slate-600 hover:border-teal-500'
                  }`}
                >
                  {concern.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing & Inventory */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-pearl-white">Pricing & Inventory</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-pearl-white/80 text-sm font-semibold mb-2">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-pearl-white focus:border-cyber-lime focus:outline-none transition-colors"
                  placeholder="299"
                />
                {errors.price && <p className="text-red-400 text-sm mt-1">{errors.price}</p>}
              </div>

              <div>
                <label className="block text-pearl-white/80 text-sm font-semibold mb-2">
                  Original Price (₹)
                </label>
                <input
                  type="number"
                  name="original_price"
                  value={formData.original_price}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-pearl-white focus:border-cyber-lime focus:outline-none transition-colors"
                  placeholder="399"
                />
                {errors.original_price && <p className="text-red-400 text-sm mt-1">{errors.original_price}</p>}
              </div>

              <div>
                <label className="block text-pearl-white/80 text-sm font-semibold mb-2">
                  Stock Quantity *
                </label>
                <input
                  type="number"
                  name="stock"
                  value={formData.stock}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-pearl-white focus:border-cyber-lime focus:outline-none transition-colors"
                  placeholder="100"
                />
                {errors.stock && <p className="text-red-400 text-sm mt-1">{errors.stock}</p>}
              </div>
            </div>

            <div>
              <label className="block text-pearl-white/80 text-sm font-semibold mb-2">
                Weight/Size
              </label>
              <input
                type="text"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-pearl-white focus:border-cyber-lime focus:outline-none transition-colors"
                placeholder="500g"
              />
            </div>
          </div>

          {/* Dog Specifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-pearl-white">Dog Specifications</h3>
            
            <div>
              <label className="block text-pearl-white/80 text-sm font-semibold mb-2">
                Suitable for Dog Size
              </label>
              <div className="flex flex-wrap gap-2">
                {DOG_SIZES.map(size => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleArrayToggle('dog_size', size)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      formData.dog_size.includes(size)
                        ? 'bg-cyber-lime text-obsidian'
                        : 'bg-white/5 text-pearl-white border border-white/10 hover:border-cyber-lime'
                    }`}
                  >
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-pearl-white/80 text-sm font-semibold mb-2">
                Suitable for Dog Age
              </label>
              <div className="flex flex-wrap gap-2">
                {DOG_AGES.map(age => (
                  <button
                    key={age}
                    type="button"
                    onClick={() => handleArrayToggle('dog_age', age)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      formData.dog_age.includes(age)
                        ? 'bg-cyber-lime text-obsidian'
                        : 'bg-white/5 text-pearl-white border border-white/10 hover:border-cyber-lime'
                    }`}
                  >
                    {age.charAt(0).toUpperCase() + age.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Health Benefits */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-pearl-white">Health Benefits</h3>
            <div className="flex flex-wrap gap-2">
              {HEALTH_BENEFITS.map(benefit => (
                <button
                  key={benefit}
                  type="button"
                  onClick={() => handleArrayToggle('health_benefits', benefit)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    formData.health_benefits.includes(benefit)
                      ? 'bg-teal-600 text-pearl-white'
                      : 'bg-white/5 text-pearl-white border border-white/10 hover:border-teal-500'
                  }`}
                >
                  {benefit.charAt(0).toUpperCase() + benefit.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Ingredients */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-pearl-white">Ingredients</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={ingredientInput}
                onChange={(e) => setIngredientInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddIngredient())}
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-pearl-white focus:border-cyber-lime focus:outline-none transition-colors"
                placeholder="Add ingredient and press Enter"
              />
              <button
                type="button"
                onClick={handleAddIngredient}
                className="px-6 py-3 bg-cyber-lime text-obsidian font-semibold rounded-xl hover:shadow-glow transition-all"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.ingredients.map((ingredient, index) => (
                <div
                  key={index}
                  className="px-3 py-1 bg-white/10 text-pearl-white text-sm rounded-full flex items-center gap-2"
                >
                  {ingredient}
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(index)}
                    className="text-pearl-white/60 hover:text-red-400 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Dietary Flags */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-pearl-white">Dietary Information</h3>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_vegetarian"
                  checked={formData.is_vegetarian}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-white/10 bg-white/5 text-cyber-lime focus:ring-cyber-lime"
                />
                <span className="text-pearl-white">Vegetarian</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_grain_free"
                  checked={formData.is_grain_free}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-white/10 bg-white/5 text-cyber-lime focus:ring-cyber-lime"
                />
                <span className="text-pearl-white">Grain Free</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="featured"
                  checked={formData.featured}
                  onChange={handleChange}
                  className="w-5 h-5 rounded border-white/10 bg-white/5 text-cyber-lime focus:ring-cyber-lime"
                />
                <span className="text-pearl-white">Featured Product</span>
              </label>
            </div>
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-400 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-white/5 border border-white/10 text-pearl-white font-semibold rounded-xl hover:bg-white/10 transition-all"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-obsidian font-bold rounded-xl hover:shadow-glow transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              <Save size={20} />
              {loading ? 'Saving...' : (product?.id ? 'Update Product' : 'Create Product')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default ProductForm;
