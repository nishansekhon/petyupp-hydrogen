import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router';
import { Star, ShoppingCart, ChevronRight, Minus, Plus, Check } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '@/config/api';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'react-toastify';
import ProductCard from '@/components/ProductCard';

const BACKEND_URL = API_BASE_URL;
const API_URL = API_BASE_URL + '/api';

const pickImage = (entry) => {
  if (!entry) return null;
  if (typeof entry === 'string') return entry;
  return entry.url || entry.src || entry.image || null;
};

const resolveImageUrl = (url) => {
  if (!url) return '';
  return url.startsWith('http') ? url : `${BACKEND_URL}${url}`;
};

const prettifyLabel = (value) =>
  typeof value === 'string'
    ? value
        .replace(/[-_]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim()
    : value;

// Remove consecutive duplicate blocks from user-provided HTML
const cleanDescriptionHtml = (html) => {
  if (!html || typeof window === 'undefined') return html || '';
  try {
    const doc = new DOMParser().parseFromString(`<div id="__root">${html}</div>`, 'text/html');
    const root = doc.getElementById('__root');
    if (!root) return html;
    const seen = new Set();
    Array.from(root.children).forEach((child) => {
      const key = (child.textContent || '').trim().toLowerCase().replace(/\s+/g, ' ');
      if (!key) return;
      if (seen.has(key)) child.remove();
      else seen.add(key);
    });
    return root.innerHTML;
  } catch {
    return html;
  }
};

// Fields we render in the Specs grid if the product provides them
const SPEC_FIELD_ORDER = [
  ['size', 'Size'],
  ['flavor', 'Flavor'],
  ['ageRange', 'Age Range'],
  ['age_range', 'Age Range'],
  ['itemForm', 'Item Form'],
  ['item_form', 'Item Form'],
  ['type', 'Type'],
  ['vendor', 'Brand'],
  ['sku', 'SKU'],
];

function ProductPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setActiveImage(0);
    setRelated([]);
    axios.get(`${API_URL}/products/${slug}`)
      .then((res) => { if (!cancelled) setProduct(res.data); })
      .catch(() => { if (!cancelled) setProduct(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  useEffect(() => {
    const t = product?.title || product?.name;
    document.title = t ? `${t} | PetYupp` : 'Product | PetYupp';
  }, [product]);

  // Fetch related products from the same category
  useEffect(() => {
    if (!product?.category) return;
    let cancelled = false;
    axios.get(`${API_URL}/products`, { params: { category: product.category, limit: 8 } })
      .then((res) => {
        if (cancelled) return;
        const myId = product.id || product._id;
        const myHandle = product.handle || product.slug;
        const list = (res.data || []).filter(
          (p) => (p.id || p._id) !== myId && (p.handle || p.slug) !== myHandle
        );
        setRelated(list.slice(0, 4));
      })
      .catch(() => { if (!cancelled) setRelated([]); });
    return () => { cancelled = true; };
  }, [product]);

  const view = useMemo(() => {
    if (!product) return null;
    const title = product.title || product.name || 'Product';
    const price = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0;
    const compareAtRaw = product.compareAtPrice ?? product.original_price;
    const compareAt = typeof compareAtRaw === 'number' ? compareAtRaw : parseFloat(compareAtRaw);
    const hasCompare = !isNaN(compareAt) && compareAt > price;

    const imagesRaw = Array.isArray(product.images) ? product.images : [];
    const imageUrls = imagesRaw.map(pickImage).filter(Boolean);
    if (imageUrls.length === 0) {
      const single = pickImage(product.image) || product.image_url;
      if (single) imageUrls.push(single);
    }

    const problems = Array.isArray(product.problems)
      ? product.problems
      : typeof product.concern === 'string'
      ? product.concern.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    const inStock = product.inStock !== undefined ? !!product.inStock : product.in_stock !== false;
    const reviewCount = product.reviewCount ?? product.review_count ?? 0;
    const rating = product.rating ?? 4.8;
    const discount = hasCompare ? Math.round(((compareAt - price) / compareAt) * 100) : 0;

    const specs = [];
    const seenLabels = new Set();
    SPEC_FIELD_ORDER.forEach(([key, label]) => {
      const raw = product[key];
      if (raw === undefined || raw === null || raw === '' || seenLabels.has(label)) return;
      const value = Array.isArray(raw) ? raw.join(', ') : String(raw);
      specs.push({ label, value });
      seenLabels.add(label);
    });

    const descriptionHtml = cleanDescriptionHtml(product.description || '');

    const category = product.category || '';
    const categoryLabel = prettifyLabel(category) || 'Shop';

    return {
      title, price, compareAt, hasCompare, imageUrls, problems, inStock,
      reviewCount, rating, discount, specs, descriptionHtml, category, categoryLabel,
    };
  }, [product]);

  const formatPrice = (p) => (typeof p === 'number' ? p.toFixed(2) : p);

  const handleAddToCart = () => {
    if (!product || !view) return;
    addItem({
      id: product.id || product._id,
      name: view.title,
      price: view.price,
      image_url: view.imageUrls[0] || '',
      quantity,
      slug: product.handle || product.slug,
    });
    setAdded(true);
    toast.success(`${view.title} added to cart!`, { position: 'bottom-right' });
    setTimeout(() => setAdded(false), 2000);
  };

  if (loading) return (
    <div className="min-h-screen bg-white flex items-center justify-center pt-[106px]">
      <div className="w-10 h-10 border-4 border-[#06B6D4] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!product || !view) return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3 pt-[106px] py-24">
      <p className="text-gray-500">Product not found.</p>
      <Link to="/shop" className="text-[#06B6D4] font-semibold hover:text-[#0891B2]">Back to shop →</Link>
    </div>
  );

  const activeImg = view.imageUrls[activeImage] || view.imageUrls[0];
  const categoryHref = view.category ? `/shop?category=${encodeURIComponent(view.category)}` : '/shop';

  return (
    <div className="min-h-screen bg-white pt-[106px]">
      {/* Breadcrumb: Home > Category > Title */}
      <nav aria-label="Breadcrumb" className="max-w-6xl mx-auto px-4 pt-2 pb-4 flex items-center gap-1.5 text-xs text-gray-500">
        <Link to="/" className="hover:text-[#06B6D4]">Home</Link>
        <ChevronRight size={12} />
        <Link to={categoryHref} className="hover:text-[#06B6D4]">{view.categoryLabel}</Link>
        <ChevronRight size={12} />
        <span className="text-gray-900 font-medium line-clamp-1">{view.title}</span>
      </nav>

      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid md:grid-cols-2 gap-10">
          {/* Image gallery */}
          <div>
            <div className="aspect-square rounded-2xl overflow-hidden bg-gray-50 mb-4 border border-gray-100">
              {activeImg ? (
                <img
                  src={resolveImageUrl(activeImg)}
                  alt={view.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  No image
                </div>
              )}
            </div>
            {view.imageUrls.length > 1 && (
              <div className="flex gap-3 flex-wrap">
                {view.imageUrls.map((img, i) => {
                  const selected = i === activeImage;
                  return (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      aria-label={`Show image ${i + 1}`}
                      className={`w-20 h-20 rounded-xl overflow-hidden transition-all duration-200 ${
                        selected
                          ? 'border-2 border-[#06B6D4] ring-2 ring-[#06B6D4]/30'
                          : 'border border-gray-200 hover:border-[#06B6D4]'
                      }`}
                    >
                      <img
                        src={resolveImageUrl(img)}
                        alt={`${view.title} ${i + 1}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info panel */}
          <div className="py-1">
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-3 leading-tight">
              {view.title}
            </h1>

            {view.problems.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {view.problems.map((c) => (
                  <span
                    key={c}
                    className="text-xs bg-[#06B6D4]/10 text-[#0891B2] px-3 py-1 rounded-full font-semibold"
                  >
                    {prettifyLabel(c)}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 mb-5">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={i < Math.round(view.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-gray-900">{view.rating}</span>
              <span className="text-sm text-gray-400">({view.reviewCount} reviews)</span>
            </div>

            <div className="flex items-baseline gap-3 mb-6">
              <span className="text-3xl font-black text-gray-900">${formatPrice(view.price)}</span>
              {view.hasCompare && (
                <>
                  <span className="text-lg text-gray-400 line-through">${formatPrice(view.compareAt)}</span>
                  <span className="text-sm bg-[#10B981] text-white px-2 py-0.5 rounded-full font-bold">
                    {view.discount}% OFF
                  </span>
                </>
              )}
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm font-semibold text-gray-700">Quantity</span>
              <div className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-1.5">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="text-gray-600 hover:text-[#06B6D4] p-1"
                  aria-label="Decrease quantity"
                >
                  <Minus size={16} />
                </button>
                <span className="w-8 text-center font-bold text-gray-900">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="text-gray-600 hover:text-[#06B6D4] p-1"
                  aria-label="Increase quantity"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Full-width solid teal CTA, 48px tall */}
            <button
              onClick={handleAddToCart}
              disabled={!view.inStock}
              style={{ height: '48px' }}
              className={`w-full flex items-center justify-center gap-2 rounded-xl font-bold text-sm transition-colors mb-4 ${
                !view.inStock
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : added
                  ? 'bg-[#10B981] text-white'
                  : 'bg-[#06B6D4] hover:bg-[#0891B2] text-white'
              }`}
            >
              {!view.inStock ? (
                'Out of stock'
              ) : added ? (
                <>
                  <Check size={18} /> Added to Cart
                </>
              ) : (
                <>
                  <ShoppingCart size={18} /> Add to Cart
                </>
              )}
            </button>

            <div className="bg-[#F9FAFB] rounded-xl p-3 mb-6 flex items-center gap-2">
              <span className="text-lg">🚚</span>
              <p className="text-sm text-gray-600">
                <span className="font-bold text-[#06B6D4]">Free shipping</span> on orders over $49 across US &amp; Canada
              </p>
            </div>

            {/* Specs grid — clean two-column alternating rows */}
            {view.specs.length > 0 && (
              <div className="mb-6 rounded-xl overflow-hidden border border-gray-100">
                <h3 className="font-bold text-gray-900 text-sm px-4 py-3 bg-gray-50 border-b border-gray-100">
                  Product Details
                </h3>
                <dl className="divide-y divide-gray-100">
                  {view.specs.map((s, i) => (
                    <div
                      key={s.label}
                      className={`grid grid-cols-2 gap-4 px-4 py-3 text-sm ${
                        i % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      <dt className="text-gray-500 font-medium">{s.label}</dt>
                      <dd className="text-gray-900 font-semibold">{prettifyLabel(s.value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </div>

        {/* Single description block */}
        {view.descriptionHtml && (
          <section className="mt-14 max-w-3xl">
            <h2 className="text-xl font-black text-gray-900 mb-4">About this product</h2>
            <div
              className="text-[15px] text-gray-700 leading-relaxed [&_p]:mb-4 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_li]:mb-1.5 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:mt-5 [&_h3]:mb-2 [&_strong]:text-gray-900 [&_a]:text-[#06B6D4] [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: view.descriptionHtml }}
            />
          </section>
        )}

        {/* Related products */}
        {related.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl md:text-2xl font-black text-gray-900">You may also like</h2>
              <Link
                to={categoryHref}
                className="text-sm font-semibold text-[#06B6D4] hover:text-[#0891B2]"
              >
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {related.map((p, i) => (
                <ProductCard key={p.id || p._id} product={p} index={i} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default ProductPage;
