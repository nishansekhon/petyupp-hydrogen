import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Eye, Upload, X, ChevronDown, ChevronUp, Wand2, Loader2, Image as ImageIcon, Check, Share2 } from 'lucide-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import slugify from 'slugify';
import { blogAPI } from '@/services/blogAPI';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import KeywordResearch from '@/components/admin/KeywordResearch';
import SEOScoring from '@/components/admin/SEOScoring';
import { API_BASE_URL } from '@/config/api';
import ShareToSocialModal from '@/components/Blog/ShareToSocialModal';

function BlogPostEditor() {
  const { isDarkMode } = useAdminTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const isEditing = !!id;
  const cameFromRef = useRef(null);

  // Form state
  const [title, setTitle] = useState('');
  const [originalTitle, setOriginalTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEditable, setSlugEditable] = useState(false);
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [featuredImage, setFeaturedImage] = useState(null);
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [status, setStatus] = useState('draft');
  const [publishDate, setPublishDate] = useState('');
  
  // SEO state
  const [seoExpanded, setSeoExpanded] = useState(false);
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [focusKeyword, setFocusKeyword] = useState('');
  const [autoFixingSEO, setAutoFixingSEO] = useState(false);
  const [seoScore, setSeoScore] = useState(null);
  const [showImagePicker, setShowImagePicker] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [submitToGoogle, setSubmitToGoogle] = useState(true); // Default checked
  const [showShareModal, setShowShareModal] = useState(false);

  // Determine where user came from for back navigation
  useEffect(() => {
    const referrer = document.referrer;
    const state = location.state;
    
    if (state?.from) {
      cameFromRef.current = state.from;
    } else if (referrer.includes('/admin/sales') || referrer.includes('/admin/marketing')) {
      cameFromRef.current = 'marketing';
    } else {
      cameFromRef.current = 'blog';
    }
  }, [location]);

  const handleBackNavigation = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/admin/blog');
    }
  };

  const categories = [
    'Dog Care',
    'Nutrition',
    'Training',
    'Health',
    'Grooming',
    'Behavior',
    'Products',
    'Tips & Tricks'
  ];

  useEffect(() => {
    if (isEditing) {
      loadPost();
    }
  }, [id]);

  // Auto-save every 30 seconds (only for drafts, not published posts)
  useEffect(() => {
    if (!isEditing || !title) return;
    // Don't auto-save published posts - they should only be updated manually
    if (status === 'published') return;
    
    const autoSave = setInterval(() => {
      handleSaveDraft(true);
    }, 30000);

    return () => clearInterval(autoSave);
  }, [title, content, isEditing, status]);

  const loadPost = async () => {
    try {
      setLoading(true);
      const post = await blogAPI.getPost(id);
      
      setTitle(post.title);
      setOriginalTitle(post.original_title || post.title);
      setSlug(post.slug);
      setContent(post.content);
      setExcerpt(post.excerpt || '');
      setFeaturedImage(post.featuredImage);
      setCategory(post.category || '');
      setTags(post.tags || []);
      setStatus(post.status);
      setPublishDate(post.publishDate || '');
      
      if (post.seo) {
        setMetaTitle(post.seo.metaTitle || '');
        setMetaDescription(post.seo.metaDescription || '');
        setFocusKeyword(post.seo.focusKeyword || '');
      }
      
      const shortTitle = post.title.length > 40 ? post.title.substring(0, 40) + '...' : post.title;
      toast.info(`Editing: ${shortTitle}`, { autoClose: 3000 });
    } catch (error) {
      console.error('Failed to load post:', error);
      toast.error('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleTitleChange = (e) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    
    if (!slugEditable && !isEditing) {
      setSlug(slugify(newTitle, { lower: true, strict: true }));
    }
  };

  const handleSlugEdit = () => {
    setSlugEditable(true);
  };

  const handleSlugChange = (e) => {
    setSlug(slugify(e.target.value, { lower: true, strict: true }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size should be less than 2MB');
      return;
    }

    try {
      setUploading(true);
      const result = await blogAPI.uploadImage(file);
      setFeaturedImage({
        url: result.url,
        alt: title || 'Blog post image'
      });
      setShowImagePicker(false);
      toast.success('Image uploaded successfully');
    } catch (error) {
      console.error('Failed to upload image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setFeaturedImage(null);
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    if (tags.includes(tagInput.trim())) {
      toast.warning('Tag already added');
      return;
    }
    setTags([...tags, tagInput.trim()]);
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleKeywordSelect = (keyword) => {
    setFocusKeyword(keyword);
    if (!metaTitle) {
      const capitalizedKeyword = keyword.charAt(0).toUpperCase() + keyword.slice(1);
      setMetaTitle(`${capitalizedKeyword} | PetYupp Blog`);
    }
    toast.success(`Keyword "${keyword}" selected!`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const validateForm = () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return false;
    }
    if (!content.trim()) {
      toast.error('Content is required');
      return false;
    }
    return true;
  };

  const handleSaveDraft = async (isAutoSave = false) => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const postData = {
        title,
        slug,
        content,
        excerpt,
        featuredImage,
        category,
        tags,
        seo: {
          metaTitle,
          metaDescription,
          focusKeyword
        },
        // Preserve current status - don't force to draft if already published
        status: status || 'draft'
      };

      if (isEditing) {
        await blogAPI.updatePost(id, postData);
      } else {
        const newPost = await blogAPI.createPost(postData);
        navigate(`/admin/blog/edit/${newPost.id}`);
      }

      setLastSaved(new Date());
      if (!isAutoSave) {
        toast.success('Draft saved successfully');
      }
    } catch (error) {
      console.error('Failed to save draft:', error);
      if (!isAutoSave) {
        toast.error('Failed to save draft');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const postData = {
        title,
        slug,
        content,
        excerpt,
        featuredImage,
        category,
        tags,
        seo: {
          metaTitle,
          metaDescription,
          focusKeyword
        },
        status: 'published',
        publishDate: publishDate || new Date().toISOString()
      };

      let postId = id;
      
      if (isEditing) {
        await blogAPI.updatePost(id, postData);
        // Update local status to reflect published state
        setStatus('published');
        setPublishDate(postData.publishDate);
        toast.success('Blog published successfully!');
      } else {
        const result = await blogAPI.createPost(postData);
        postId = result.id || result._id;
        // Navigate to edit page for newly created post
        navigate(`/admin/blog/edit/${postId}`, { replace: true });
        toast.success('Blog published successfully!');
      }

      // Submit to Google Index if checkbox is checked
      if (submitToGoogle && postId) {
        try {
          const token = localStorage.getItem('adminToken');
          const response = await fetch(`${API_BASE_URL}/api/admin/seo/submit-blog/${postId}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          const data = await response.json();
          if (data.success) {
            if (data.mocked) {
              toast.warning('Google API not configured', {
                description: data.hint || 'Add service account JSON to API Settings > Google Indexing API'
              });
            } else {
              toast.success('Submitted to Google for indexing!');
            }
          } else {
            // Show error message from API
            toast.error(data.message || 'Google submission failed', {
              description: data.hint || undefined
            });
          }
        } catch (indexError) {
          console.error('Failed to submit to Google:', indexError);
          toast.warning('Published but Google submission failed');
        }
      }

      // Stay on the same page - don't redirect
    } catch (error) {
      console.error('Failed to publish post:', error);
      toast.error('Failed to publish post');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    if (!slug) {
      toast.warning('Please save the post first');
      return;
    }
    window.open(`/blog/${slug}`, '_blank');
  };

  // Blog images library - using reliable Unsplash images
  const BLOG_IMAGES_LIBRARY = [
    { url: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&q=80', category: 'treats', alt: 'Happy golden retriever' },
    { url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&q=80', category: 'general', alt: 'Happy dog portrait' },
    { url: 'https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=800&q=80', category: 'training', alt: 'Dog with treats' },
    { url: 'https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?w=800&q=80', category: 'nutrition', alt: 'Dog eating healthy' },
    { url: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=800&q=80', category: 'health', alt: 'Healthy happy dog' },
    { url: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&q=80', category: 'wellness', alt: 'Dogs playing' },
    { url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&q=80', category: 'care', alt: 'Dog care' },
    { url: 'https://images.unsplash.com/photo-1544568100-847a948585b9?w=800&q=80', category: 'products', alt: 'Golden retriever' },
    { url: 'https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=800&q=80', category: 'grooming', alt: 'Dog grooming' },
    { url: 'https://images.unsplash.com/photo-1592754862816-1a21a4ea2281?w=800&q=80', category: 'default', alt: 'Cute dog' }
  ];

  const handleSelectLibraryImage = (img) => {
    setFeaturedImage({ url: img.url, alt: img.alt });
    setShowImagePicker(false);
    toast.success('Image selected');
  };

  // Auto-Fix SEO function
  const handleAutoFixSEO = async () => {
    if (!title || !content) {
      toast.error('Please add title and content first');
      return;
    }

    const oldScore = seoScore || 0;
    setAutoFixingSEO(true);
    toast.info('🔧 Optimizing SEO...', { autoClose: 2000 });
    
    const fixes = [];
    let newTitle = title;
    let newMetaDescription = metaDescription;
    let newFocusKeyword = focusKeyword;
    let newSlug = slug;
    let newContent = content;
    let newFeaturedImage = featuredImage;

    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`${API_BASE_URL}/api/admin/blog/auto-fix-seo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          content,
          category,
          current_meta_description: metaDescription,
          current_focus_keyword: focusKeyword,
          current_slug: slug
        })
      });

      if (!response.ok) {
        throw new Error('Failed to optimize SEO');
      }

      const result = await response.json();
      
      if (result.optimized_title && result.optimized_title !== title) {
        setOriginalTitle(title);
        newTitle = result.optimized_title;
        setTitle(newTitle);
        fixes.push('Title shortened');
      }

      if (result.focus_keyword) {
        newFocusKeyword = result.focus_keyword;
        setFocusKeyword(newFocusKeyword);
        fixes.push('Focus keyword set');
      }

      if (result.meta_description) {
        newMetaDescription = result.meta_description;
        setMetaDescription(newMetaDescription);
        fixes.push('Meta description optimized');
      }

      if (result.optimized_slug && result.optimized_slug !== slug) {
        newSlug = result.optimized_slug;
        setSlug(newSlug);
        fixes.push('URL slug optimized');
      }

      if (result.content_with_links && result.content_with_links !== content) {
        newContent = result.content_with_links;
        setContent(newContent);
        const linkCount = (result.internal_links_added || 0) + (result.external_links_added || 0);
        if (linkCount > 0) {
          fixes.push(`${linkCount} links added`);
        }
      }

      // Auto-select featured image if none
      if (!featuredImage && BLOG_IMAGES_LIBRARY.length > 0) {
        const categoryLower = (category || 'general').toLowerCase();
        let selectedImage = BLOG_IMAGES_LIBRARY.find(img => 
          categoryLower.includes(img.category) || img.category.includes(categoryLower)
        );
        if (!selectedImage) {
          selectedImage = BLOG_IMAGES_LIBRARY[Math.floor(Math.random() * BLOG_IMAGES_LIBRARY.length)];
        }
        newFeaturedImage = { url: selectedImage.url, alt: selectedImage.alt };
        setFeaturedImage(newFeaturedImage);
        fixes.push('Featured image added');
      }

      if (!metaTitle && newTitle) {
        setMetaTitle(`${newTitle} | PetYupp Blog`);
        fixes.push('Meta title');
      }

      // Inject internal links if not present
      if (!newContent.includes('href="/shop"') && !newContent.includes("href='/shop'")) {
        const shopLink = '<a href="/shop" class="text-teal-600 hover:underline">premium natural dog treats</a>';
        if (newContent.includes('</p>')) {
          const paragraphs = newContent.split('</p>');
          if (paragraphs.length > 1) {
            paragraphs[0] = paragraphs[0] + ` Browse our collection of ${shopLink} for your furry friend.`;
            newContent = paragraphs.join('</p>');
            fixes.push('Shop link');
          }
        }
      }

      if (!newContent.includes('href="/blog"') && !newContent.includes("href='/blog'")) {
        const blogLink = '<a href="/blog" class="text-teal-600 hover:underline">more pet care tips</a>';
        if (newContent.includes('</p>')) {
          const paragraphs = newContent.split('</p>');
          if (paragraphs.length > 2) {
            const lastIdx = paragraphs.length - 2;
            paragraphs[lastIdx] = paragraphs[lastIdx] + ` For ${blogLink}, explore our blog.`;
            newContent = paragraphs.join('</p>');
            fixes.push('Blog link');
          }
        }
      }

      if (!newContent.includes('<h1') && newTitle) {
        newContent = `<h1>${newTitle}</h1>\n${newContent}`;
        fixes.push('H1 heading');
      }

      if (newContent !== content) {
        setContent(newContent);
      }

      if (fixes.length > 0) {
        setTimeout(() => {
          const improvement = seoScore > oldScore ? `+${seoScore - oldScore}` : '';
          toast.success(
            `✨ SEO Score: ${oldScore} → ${seoScore || '...'} ${improvement ? `(${improvement})` : ''}\nFixed: ${fixes.join(', ')}`,
            { autoClose: 6000 }
          );
        }, 1500);
      } else {
        toast.info('SEO is already well optimized!');
      }

    } catch (error) {
      console.error('Auto-fix SEO error:', error);
      
      // Fallback: Basic optimizations without AI
      if (!focusKeyword) {
        const titleWords = title.toLowerCase().split(' ');
        const commonKeywords = ['dog', 'treats', 'natural', 'healthy', 'nutrition', 'pet', 'food', 'care'];
        const foundKeywords = titleWords.filter(w => commonKeywords.some(k => w.includes(k)));
        if (foundKeywords.length >= 2) {
          newFocusKeyword = foundKeywords.slice(0, 2).join(' ');
        } else if (foundKeywords.length === 1) {
          newFocusKeyword = foundKeywords[0] + ' dog';
        } else {
          newFocusKeyword = 'natural dog treats';
        }
        setFocusKeyword(newFocusKeyword);
        fixes.push('Keywords');
      }

      if (!metaDescription) {
        const plainContent = content.replace(/<[^>]*>/g, '').substring(0, 300);
        newMetaDescription = plainContent.substring(0, 155).trim();
        if (newMetaDescription.length > 150) {
          newMetaDescription = newMetaDescription.substring(0, 150) + '...';
        }
        setMetaDescription(newMetaDescription);
        fixes.push('Meta');
      }

      if (!featuredImage && BLOG_IMAGES_LIBRARY.length > 0) {
        const selectedImage = BLOG_IMAGES_LIBRARY[Math.floor(Math.random() * BLOG_IMAGES_LIBRARY.length)];
        setFeaturedImage({ url: selectedImage.url, alt: selectedImage.alt });
        fixes.push('Image');
      }

      if (!content.includes('href="/shop"')) {
        newContent = content.replace('</p>', ` Check out our <a href="/shop">premium natural dog treats</a>.</p>`);
        if (newContent !== content) {
          setContent(newContent);
          fixes.push('Links');
        }
      }

      if (fixes.length > 0) {
        toast.success(`✨ Basic SEO fixes: ${fixes.join(', ')}`, { autoClose: 4000 });
      }
    } finally {
      setAutoFixingSEO(false);
    }
  };

  const quillModules = {
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        ['blockquote', 'code-block'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        ['link', 'image'],
        ['clean']
      ]
    }
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'blockquote', 'code-block',
    'list', 'bullet', 'indent',
    'link', 'image'
  ];

  if (loading && isEditing) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'bg-obsidian' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className={`text-xl ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
          Loading post...
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-obsidian' : 'bg-gray-50'}`}>
      <ToastContainer position="top-right" theme={isDarkMode ? 'dark' : 'light'} />
      
      {/* STICKY HEADER */}
      <div className={`sticky top-0 z-50 border-b ${isDarkMode ? 'bg-obsidian border-white/10' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left: Back + Title + Last Saved */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/blog')}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm ${isDarkMode ? 'hover:bg-white/10 text-teal-400' : 'hover:bg-gray-100 text-teal-600'}`}
              title="Back to Blog Management"
              data-testid="back-button"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Blog Management</span>
            </button>
            <span className={`font-semibold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
              {isEditing ? 'Edit Post' : 'New Post'}
            </span>
            {lastSaved && (
              <span className={`text-xs ${isDarkMode ? 'text-pearl-white/50' : 'text-gray-500'}`}>
                Last saved: {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          
          {/* Right: Action Buttons */}
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => handleSaveDraft(false)}
              disabled={loading}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 ${
                isDarkMode 
                  ? 'bg-white/10 text-pearl-white hover:bg-white/15'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50`}
              whileTap={{ scale: 0.97 }}
              data-testid="save-draft-btn"
            >
              <Save size={16} />
              Save Draft
            </motion.button>
            <motion.button
              onClick={handlePreview}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 ${
                isDarkMode 
                  ? 'bg-white/10 text-pearl-white hover:bg-white/15'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              whileTap={{ scale: 0.97 }}
              data-testid="preview-btn"
            >
              <Eye size={16} />
              Preview
            </motion.button>
            
            {/* Google Index Checkbox */}
            <label className={`flex items-center gap-1.5 px-3 py-2 rounded-lg cursor-pointer select-none ${
              isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'
            }`}>
              <input
                type="checkbox"
                checked={submitToGoogle}
                onChange={(e) => setSubmitToGoogle(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-teal-500 focus:ring-teal-500"
              />
              <span className={`text-xs ${isDarkMode ? 'text-pearl-white/80' : 'text-gray-600'}`}>
                Submit to Google
              </span>
            </label>
            
            {/* Share to Social Button */}
            <div className="relative group">
              <motion.button
                onClick={() => setShowShareModal(true)}
                disabled={status !== 'published'}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  status === 'published'
                    ? 'bg-slate-700 hover:bg-slate-600 text-white'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
                whileTap={status === 'published' ? { scale: 0.97 } : {}}
                data-testid="share-to-social-btn"
              >
                <Share2 className="w-4 h-4" />
                Share
              </motion.button>
              {status !== 'published' && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  Publish first to share
                </div>
              )}
            </div>
            
            <motion.button
              onClick={handlePublish}
              disabled={loading}
              className="bg-teal-500 hover:bg-teal-600 text-white px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors"
              whileTap={{ scale: 0.97 }}
              data-testid="publish-btn"
            >
              Publish
            </motion.button>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT - 2 Column Layout */}
      <div className="flex" style={{ height: 'calc(100vh - 56px)' }}>
        
        {/* LEFT COLUMN - 65% - Content Editor */}
        <div className={`w-[65%] p-5 overflow-y-auto ${isDarkMode ? 'border-r border-white/10' : 'border-r border-gray-200'}`}>
          
          {/* AI Keyword Research for New Posts */}
          {!isEditing && <KeywordResearch onKeywordSelect={handleKeywordSelect} />}
          
          {/* Title Input */}
          <div className="mb-4">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Post title..."
              className={`w-full px-0 py-2 text-2xl font-bold border-0 focus:outline-none focus:ring-0 ${
                isDarkMode 
                  ? 'bg-transparent text-pearl-white placeholder-pearl-white/30'
                  : 'bg-transparent text-gray-900 placeholder-gray-400'
              }`}
              data-testid="title-input"
            />
          </div>
          
          {/* URL Slug - Compact Single Line */}
          <div className={`flex items-center gap-2 mb-4 text-sm ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'}`}>
            <span>URL:</span>
            {slugEditable ? (
              <input
                type="text"
                value={slug}
                onChange={handleSlugChange}
                className={`flex-1 max-w-xs px-2 py-1 rounded text-sm border ${
                  isDarkMode 
                    ? 'bg-white/5 border-white/10 text-pearl-white'
                    : 'bg-gray-50 border-gray-200 text-gray-900'
                } focus:outline-none focus:ring-1 focus:ring-teal-500`}
                data-testid="slug-input"
              />
            ) : (
              <span className={`${isDarkMode ? 'text-pearl-white/80' : 'text-gray-700'}`}>
                /blog/{slug || 'your-slug-here'}
              </span>
            )}
            <button
              onClick={handleSlugEdit}
              className={`text-xs px-2 py-1 rounded ${
                isDarkMode 
                  ? 'bg-white/10 hover:bg-white/15 text-pearl-white/80'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
              data-testid="edit-slug-btn"
            >
              Edit
            </button>
          </div>
          
          {/* Content Editor - Full Height */}
          <div className={`${isDarkMode ? 'quill-dark' : 'quill-light'}`}>
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
              modules={quillModules}
              formats={quillFormats}
              placeholder="Write your blog post content..."
              style={{ height: 'calc(100vh - 280px)', minHeight: '450px' }}
              data-testid="content-editor"
            />
          </div>
        </div>
        
        {/* RIGHT COLUMN - 35% - Settings Sidebar */}
        <div className={`w-[35%] p-4 overflow-y-auto ${isDarkMode ? 'bg-obsidian-light/30' : 'bg-gray-50/50'}`}>
          <div className="space-y-3">
            
            {/* Fix All SEO Issues Button */}
            <button
              onClick={handleAutoFixSEO}
              disabled={autoFixingSEO || !title || !content}
              className={`w-full py-2.5 px-4 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                autoFixingSEO || !title || !content
                  ? 'bg-gray-600/50 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-400 hover:to-teal-500 text-white shadow-md hover:shadow-teal-500/30'
              }`}
              data-testid="auto-fix-seo-btn"
            >
              {autoFixingSEO ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Fixing...
                </>
              ) : (
                <>
                  <Wand2 size={16} />
                  Fix All SEO Issues
                </>
              )}
            </button>
            
            {/* SEO Scoring Component */}
            <SEOScoring
              title={title}
              content={content}
              metaDescription={metaDescription}
              focusKeyword={focusKeyword}
              featuredImage={featuredImage}
              slug={slug}
              onScoreChange={(score) => setSeoScore(score)}
            />
            
            {/* Featured Image - Compact */}
            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-semibold ${isDarkMode ? 'text-pearl-white/80' : 'text-gray-700'}`}>
                  Featured Image
                </span>
              </div>
              <div className="flex items-center gap-3">
                {featuredImage ? (
                  <>
                    <div className="relative w-20 h-14 flex-shrink-0">
                      <img 
                        src={featuredImage.url} 
                        alt={featuredImage.alt}
                        className="w-full h-full object-cover rounded"
                        onError={(e) => {
                          e.target.src = BLOG_IMAGES_LIBRARY[0].url;
                        }}
                      />
                      <button
                        onClick={handleRemoveImage}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-slate-500 text-white rounded-full flex items-center justify-center hover:bg-slate-600"
                        data-testid="remove-image-btn"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <button
                      onClick={() => setShowImagePicker(!showImagePicker)}
                      className={`text-xs px-3 py-1.5 rounded font-medium ${
                        isDarkMode 
                          ? 'bg-white/10 text-pearl-white hover:bg-white/15'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      data-testid="change-image-btn"
                    >
                      Change
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setShowImagePicker(!showImagePicker)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded border-2 border-dashed ${
                      isDarkMode 
                        ? 'border-white/20 hover:border-white/30 text-pearl-white/60'
                        : 'border-gray-300 hover:border-gray-400 text-gray-500'
                    }`}
                    data-testid="add-image-btn"
                  >
                    <ImageIcon size={16} />
                    <span className="text-xs font-medium">Add Image</span>
                  </button>
                )}
              </div>
              
              {/* Image Picker Dropdown */}
              {showImagePicker && (
                <div className={`mt-3 p-3 rounded-lg ${isDarkMode ? 'bg-obsidian border border-white/10' : 'bg-gray-50 border border-gray-200'}`}>
                  <p className={`text-xs mb-2 font-medium ${isDarkMode ? 'text-pearl-white/70' : 'text-gray-600'}`}>
                    Select from library:
                  </p>
                  <div className="grid grid-cols-5 gap-1.5 mb-3">
                    {BLOG_IMAGES_LIBRARY.slice(0, 10).map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectLibraryImage(img)}
                        className="w-full aspect-square rounded overflow-hidden hover:ring-2 hover:ring-teal-500"
                      >
                        <img src={img.url} alt={img.alt} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <label className={`flex-1 flex items-center justify-center gap-2 py-2 rounded text-xs font-medium cursor-pointer ${
                      isDarkMode 
                        ? 'bg-white/10 text-pearl-white hover:bg-white/15'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}>
                      <Upload size={14} />
                      Upload Custom
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                    </label>
                  </div>
                </div>
              )}
            </div>
            
            {/* Category & Tags - Compact */}
            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'}`}>
              <div className="flex gap-3">
                {/* Category */}
                <div className="w-2/5">
                  <label className={`block text-xs font-semibold mb-1.5 ${isDarkMode ? 'text-pearl-white/80' : 'text-gray-700'}`}>
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`w-full px-2 py-1.5 rounded text-sm border ${
                      isDarkMode 
                        ? 'bg-obsidian border-white/10 text-pearl-white'
                        : 'bg-white border-gray-200 text-gray-900'
                    } focus:outline-none focus:ring-1 focus:ring-teal-500`}
                    data-testid="category-select"
                  >
                    <option value="">Select</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                {/* Tags */}
                <div className="w-3/5">
                  <label className={`block text-xs font-semibold mb-1.5 ${isDarkMode ? 'text-pearl-white/80' : 'text-gray-700'}`}>
                    Tags
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={handleTagInputKeyPress}
                      placeholder="Add tag"
                      className={`flex-1 px-2 py-1.5 rounded text-sm border ${
                        isDarkMode 
                          ? 'bg-obsidian border-white/10 text-pearl-white placeholder-pearl-white/30'
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                      } focus:outline-none focus:ring-1 focus:ring-teal-500`}
                      data-testid="tag-input"
                    />
                    <button
                      onClick={handleAddTag}
                      className={`px-2 rounded text-sm font-medium ${
                        isDarkMode 
                          ? 'bg-white/10 text-pearl-white hover:bg-white/15'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                      data-testid="add-tag-btn"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Tag Chips */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tags.map(tag => (
                    <span 
                      key={tag}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                        isDarkMode 
                          ? 'bg-teal-500/20 text-teal-300'
                          : 'bg-teal-100 text-teal-700'
                      }`}
                    >
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)} className="hover:opacity-70">
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            {/* SEO Settings - Accordion */}
            <div className={`rounded-lg overflow-hidden ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'}`}>
              <button
                onClick={() => setSeoExpanded(!seoExpanded)}
                className={`w-full p-3 flex items-center justify-between ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}
                data-testid="seo-settings-toggle"
              >
                <span className={`text-xs font-semibold ${isDarkMode ? 'text-pearl-white/80' : 'text-gray-700'}`}>
                  SEO Settings
                </span>
                {seoExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              
              {seoExpanded && (
                <div className="px-3 pb-3 space-y-3">
                  <div>
                    <label className={`block text-xs mb-1 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                      Meta Title ({metaTitle.length}/60)
                    </label>
                    <input
                      type="text"
                      value={metaTitle}
                      onChange={(e) => setMetaTitle(e.target.value)}
                      maxLength={60}
                      placeholder="Enter meta title"
                      className={`w-full px-2 py-1.5 rounded text-sm border ${
                        isDarkMode 
                          ? 'bg-obsidian border-white/10 text-pearl-white placeholder-pearl-white/30'
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                      } focus:outline-none focus:ring-1 focus:ring-teal-500`}
                      data-testid="meta-title-input"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-xs mb-1 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                      Meta Description ({metaDescription.length}/160)
                    </label>
                    <textarea
                      value={metaDescription}
                      onChange={(e) => setMetaDescription(e.target.value)}
                      maxLength={160}
                      rows={2}
                      placeholder="Enter meta description"
                      className={`w-full px-2 py-1.5 rounded text-sm border resize-none ${
                        isDarkMode 
                          ? 'bg-obsidian border-white/10 text-pearl-white placeholder-pearl-white/30'
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                      } focus:outline-none focus:ring-1 focus:ring-teal-500`}
                      data-testid="meta-description-input"
                    />
                  </div>
                  
                  <div>
                    <label className={`block text-xs mb-1 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                      Focus Keyword
                    </label>
                    <input
                      type="text"
                      value={focusKeyword}
                      onChange={(e) => setFocusKeyword(e.target.value)}
                      placeholder="Enter focus keyword"
                      className={`w-full px-2 py-1.5 rounded text-sm border ${
                        isDarkMode 
                          ? 'bg-obsidian border-white/10 text-pearl-white placeholder-pearl-white/30'
                          : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                      } focus:outline-none focus:ring-1 focus:ring-teal-500`}
                      data-testid="focus-keyword-input"
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* Publish Status - Compact */}
            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-200'}`}>
              <label className={`block text-xs font-semibold mb-2 ${isDarkMode ? 'text-pearl-white/80' : 'text-gray-700'}`}>
                Status
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    value="draft"
                    checked={status === 'draft'}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-3.5 h-3.5"
                  />
                  <span className={`text-sm ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>Draft</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    value="published"
                    checked={status === 'published'}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-3.5 h-3.5"
                  />
                  <span className={`text-sm ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>Published</span>
                </label>
              </div>
              
              {status === 'published' && (
                <div className="mt-2">
                  <label className={`block text-xs mb-1 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                    Publish Date
                  </label>
                  <input
                    type="datetime-local"
                    value={publishDate}
                    onChange={(e) => setPublishDate(e.target.value)}
                    className={`w-full px-2 py-1.5 rounded text-sm border ${
                      isDarkMode 
                        ? 'bg-obsidian border-white/10 text-pearl-white'
                        : 'bg-white border-gray-200 text-gray-900'
                    } focus:outline-none focus:ring-1 focus:ring-teal-500`}
                    data-testid="publish-date-input"
                  />
                </div>
              )}
            </div>
            
          </div>
        </div>
      </div>

      {/* Custom Quill Styles */}
      <style>{`
        .quill-dark .ql-toolbar {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px 8px 0 0;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .quill-dark .ql-container {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-top: none;
          border-radius: 0 0 8px 8px;
          color: #f5f5f7;
          font-size: 16px;
          line-height: 1.7;
        }
        .quill-dark .ql-editor {
          min-height: 450px;
        }
        .quill-dark .ql-editor.ql-blank::before {
          color: rgba(245, 245, 247, 0.3);
        }
        .quill-dark .ql-stroke {
          stroke: rgba(245, 245, 247, 0.7);
        }
        .quill-dark .ql-fill {
          fill: rgba(245, 245, 247, 0.7);
        }
        .quill-dark .ql-picker-label {
          color: rgba(245, 245, 247, 0.7);
        }
        .quill-dark .ql-picker-options {
          background: #1e1e1e;
          border-color: rgba(255, 255, 255, 0.1);
        }
        
        .quill-light .ql-toolbar {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px 8px 0 0;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .quill-light .ql-container {
          background: white;
          border: 1px solid #e5e7eb;
          border-top: none;
          border-radius: 0 0 8px 8px;
          color: #111827;
          font-size: 16px;
          line-height: 1.7;
        }
        .quill-light .ql-editor {
          min-height: 450px;
        }
        
        /* Responsive adjustments */
        @media (max-width: 1024px) {
          .flex > .w-\\[65\\%\\] {
            width: 100% !important;
          }
          .flex > .w-\\[35\\%\\] {
            width: 100% !important;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            max-height: 50vh;
            z-index: 40;
            border-top: 1px solid rgba(255,255,255,0.1);
          }
        }
      `}</style>

      {/* Share to Social Modal */}
      {showShareModal && (
        <ShareToSocialModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          blog={{
            id: id,
            title: title,
            slug: slug,
            excerpt: excerpt || content.replace(/<[^>]*>/g, '').substring(0, 150) + '...',
            featuredImage: featuredImage,
            tags: tags,
            seo: {
              metaDescription: metaDescription
            }
          }}
        />
      )}
    </div>
  );
}

export default BlogPostEditor;
