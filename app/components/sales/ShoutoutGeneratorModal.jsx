import React, { useState, useEffect, useCallback } from 'react';
import { X, Megaphone, Instagram, Facebook, Linkedin, Twitter, Copy, Download, RefreshCw, Check, Sparkles, Send, ExternalLink, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/utils/api';

const API_URL = API_BASE_URL + '/api';

const ShoutoutGeneratorModal = ({ partner, onClose }) => {
  const [generating, setGenerating] = useState(false);
  const [postingTwitter, setPostingTwitter] = useState(false);
  const [showTwitterConfirm, setShowTwitterConfirm] = useState(false);
  const [twitterPostResult, setTwitterPostResult] = useState(null); // { success, tweet_url } or null
  const [twitterPostingEnabled, setTwitterPostingEnabled] = useState(true);
  const [tone, setTone] = useState('excited');
  const [includeOptions, setIncludeOptions] = useState({
    storeName: true,
    location: true,
    products: true,
    ownerName: true,
    callToAction: true,
    phone: false,
    mapsLink: false
  });
  const [content, setContent] = useState({
    instagram: '',
    facebook: '',
    linkedin: '',
    twitter: ''
  });
  const [copied, setCopied] = useState({
    instagram: false,
    facebook: false,
    linkedin: false,
    twitter: false
  });
  const [products, setProducts] = useState([]);

  // Fetch Twitter posting status
  const fetchTwitterPostingStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/twitter/posting-status`);
      const data = await response.json();
      setTwitterPostingEnabled(data.twitter_posting_enabled ?? true);
    } catch (error) {
      console.error('Error fetching Twitter posting status:', error);
    }
  };

  const fetchPartnerProducts = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/products`);
      const data = await response.json();
      if (data) {
        const allProducts = Array.isArray(data) ? data : (data.products || []);
        // Filter to only products this partner carries
        const partnerProducts = partner.products || [];
        const filtered = allProducts.filter(p => 
          partnerProducts.some(pp => 
            (pp.name === p.name) || (pp._id === p._id) || (pp === p._id)
          )
        );
        setProducts(filtered.length > 0 ? filtered : allProducts.slice(0, 3));
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }, [partner.products]);

  useEffect(() => {
    // Fetch products on mount
    const loadProducts = async () => {
      try {
        const response = await fetch(`${API_URL}/products`);
        const data = await response.json();
        if (data) {
          const allProducts = Array.isArray(data) ? data : (data.products || []);
          const partnerProducts = partner.products || [];
          const filtered = allProducts.filter(p => 
            partnerProducts.some(pp => 
              (pp.name === p.name) || (pp._id === p._id) || (pp === p._id)
            )
          );
          setProducts(filtered.length > 0 ? filtered : allProducts.slice(0, 3));
        }
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };
    loadProducts();
    fetchTwitterPostingStatus();
  }, [partner.products]);

  const generateShoutouts = () => {
    setGenerating(true);
    
    // Build context for generation
    const storeName = partner.store_name || partner.name || 'Partner Store';
    const location = partner.area ? `${partner.area}, ${partner.city || 'Delhi'}` : partner.address || 'Delhi';
    const area = partner.area || '';
    const city = partner.city || 'Delhi';
    const ownerName = partner.ownerName || partner.owner_name || '';
    const phone = partner.phone || '';
    const mapsLink = partner.google_maps_url || '';
    const igHandle = partner.social_instagram ? `@${partner.social_instagram}` : '';
    const fbHandle = partner.social_facebook || '';
    const twHandle = partner.social_twitter ? `@${partner.social_twitter}` : '';
    
    // Create store slug for URL
    const storeSlug = (partner.store_name || partner.name || 'store')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    const productNames = products.slice(0, 3).map(p => p.name || p.product_name).join(', ');
    const productEmojis = products.slice(0, 3).map(p => {
      const name = (p.name || '').toLowerCase();
      if (name.includes('chicken') || name.includes('feet')) return '🍗';
      if (name.includes('cookie') || name.includes('biscuit')) return '🍪';
      if (name.includes('protein') || name.includes('bar')) return '💪';
      if (name.includes('toy')) return '🧸';
      if (name.includes('kibble') || name.includes('food')) return '🥘';
      return '🦴';
    });

    // Generate content based on tone
    const toneEmoji = tone === 'excited' ? '🎉' : tone === 'professional' ? '📢' : tone === 'friendly' ? '🐕' : '📍';
    
    // Instagram Content
    let instagramContent = '';
    if (tone === 'excited') {
      instagramContent = `${toneEmoji} WELCOME TO THE OYEBARK FAMILY! 🐕

We're thrilled to announce our newest retail partner - 
🏪 ${storeName}${igHandle ? ` ${igHandle}` : ''} in ${location}!

${includeOptions.products ? `Now you can grab your furry friend's favorite PetYupp treats:\n${products.slice(0, 3).map((p, i) => `${productEmojis[i]} ${p.name || p.product_name}`).join('\n')}` : ''}

${includeOptions.ownerName && ownerName ? `Visit ${ownerName} at ${storeName} today!` : `Visit ${storeName} today!`}
📍 ${location}
${includeOptions.phone && phone ? `📞 ${phone}` : ''}

${includeOptions.callToAction ? `Tag a friend who needs to know about this! 👇` : ''}

🛒 For more info: petyupp.com

#PetYupp #NewPartner #DogTreats #${area.replace(/\s+/g, '')} #${city.replace(/\s+/g, '')} #PetShop #DogFood #PetParents #DogsOfInstagram`;
    } else if (tone === 'professional') {
      instagramContent = `📢 Retail Partnership Announcement

We're pleased to welcome ${storeName}${igHandle ? ` ${igHandle}` : ''} as our newest PetYupp retail partner in ${location}.

${includeOptions.products ? `Available products:\n${products.slice(0, 3).map(p => `• ${p.name || p.product_name}`).join('\n')}` : ''}

📍 ${location}
${includeOptions.phone && phone ? `📞 ${phone}` : ''}

🛒 For more info: petyupp.com

#PetYupp #RetailPartner #PremiumDogTreats #${city.replace(/\s+/g, '')}`;
    } else if (tone === 'friendly') {
      instagramContent = `🐕 Hey Pet Parents of ${area || city}!

Great news! You can now find PetYupp treats at ${storeName}${igHandle ? ` ${igHandle}` : ''}! 

${includeOptions.products ? `Your pups will love:\n${products.slice(0, 3).map((p, i) => `${productEmojis[i]} ${p.name || p.product_name}`).join('\n')}` : ''}

${includeOptions.ownerName && ownerName ? `Say hi to ${ownerName} when you visit! 👋` : ''}
📍 ${location}

🛒 For more info: petyupp.com

#PetYupp #DogTreats #${area.replace(/\s+/g, '')} #PetShop`;
    } else {
      instagramContent = `📍 Now Available in ${area || city}!

Find PetYupp premium dog treats at ${storeName}${igHandle ? ` ${igHandle}` : ''}

${includeOptions.products ? products.slice(0, 3).map((p, i) => `${productEmojis[i]} ${p.name || p.product_name}`).join('\n') : ''}

🏪 ${location}
${includeOptions.phone && phone ? `📞 ${phone}` : ''}

🛒 For more info: petyupp.com

#PetYupp #${area.replace(/\s+/g, '')} #DogTreats #PetShop`;
    }

    // Facebook Content (longer, more detailed, with clickable link)
    const facebookContent = `${toneEmoji} Exciting News for Pet Parents in ${area || city}!

We're proud to welcome ${storeName}${fbHandle ? ` (${fbHandle})` : ''} as our newest PetYupp retail partner!

Now you can find premium, healthy dog treats right in your neighborhood at ${location}.

${includeOptions.products ? `🛒 Products available:\n${products.slice(0, 3).map((p, i) => `${productEmojis[i]} ${p.name || p.product_name}`).join('\n')}` : ''}

${includeOptions.ownerName && ownerName ? `${ownerName} and the team at ${storeName} are ready to help you find the perfect treats for your furry family members!` : ''}

📍 Location: ${location}
${includeOptions.phone && phone ? `📞 Contact: ${phone}` : ''}
${includeOptions.mapsLink && mapsLink ? `🗺️ Directions: ${mapsLink}` : ''}

${includeOptions.callToAction ? `Share this with fellow pet parents in ${area || city}! 🐕❤️` : ''}

🛒 Shop PetYupp: https://petyupp.com/stores/${storeSlug}`;

    // LinkedIn Content (professional, with link)
    const linkedinContent = `📢 Retail Expansion Update

We're pleased to announce our partnership with ${storeName}, expanding PetYupp's retail presence in ${city}.

${storeName}, located in ${location}, now carries our complete range of premium dog treats${includeOptions.products ? ` including ${productNames}` : ''}.

This partnership reflects our commitment to making healthy, natural pet nutrition accessible to pet parents across India.

${includeOptions.ownerName && ownerName ? `We're excited to work with ${ownerName} and the ${storeName} team to serve the pet parent community in ${area || city}.` : ''}

🔗 Learn more: https://petyupp.com/stores/${storeSlug}

#RetailPartnership #PetIndustry #PetYupp #BusinessGrowth #PetNutrition #IndianStartup`;

    // Twitter Content (short, with link)
    const twitterContent = `${toneEmoji} New Partner Alert! 

Welcome ${storeName}${twHandle ? ` ${twHandle}` : ''} to the PetYupp family! 🐕

📍 ${location}

🛒 petyupp.com

#PetYupp #DogTreats`;

    setContent({
      instagram: instagramContent.trim(),
      facebook: facebookContent.trim(),
      linkedin: linkedinContent.trim(),
      twitter: twitterContent.trim()
    });

    setTimeout(() => setGenerating(false), 500);
  };

  const copyToClipboard = async (platform, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(prev => ({ ...prev, [platform]: true }));
      toast.success(`${platform} content copied!`);
      setTimeout(() => setCopied(prev => ({ ...prev, [platform]: false })), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const downloadAll = () => {
    const allContent = `
===========================================
PARTNER SHOUTOUT - ${partner.store_name || partner.name}
Generated: ${new Date().toLocaleDateString()}
===========================================

📷 INSTAGRAM
-------------------------------------------
${content.instagram}

📘 FACEBOOK
-------------------------------------------
${content.facebook}

💼 LINKEDIN
-------------------------------------------
${content.linkedin}

🐦 TWITTER/X
-------------------------------------------
${content.twitter}

===========================================
`;
    
    const blob = new Blob([allContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shoutout-${(partner.store_name || partner.name || 'partner').toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Downloaded all shoutouts!');
  };

  const copyAll = async () => {
    const allContent = `📷 INSTAGRAM:\n${content.instagram}\n\n📘 FACEBOOK:\n${content.facebook}\n\n💼 LINKEDIN:\n${content.linkedin}\n\n🐦 TWITTER:\n${content.twitter}`;
    try {
      await navigator.clipboard.writeText(allContent);
      toast.success('All content copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  // Show confirmation modal instead of posting directly
  const handlePostToTwitterClick = () => {
    if (!content.twitter) {
      toast.error('No Twitter content to post');
      return;
    }

    if (content.twitter.length > 280) {
      toast.error(`Tweet too long (${content.twitter.length}/280 chars). Please shorten it.`);
      return;
    }

    setTwitterPostResult(null);
    setShowTwitterConfirm(true);
  };

  // Actually post to Twitter after confirmation
  const confirmPostToTwitter = async () => {
    setPostingTwitter(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/twitter/post`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: content.twitter })
      });

      const data = await response.json();
      if (data.success) {
        setTwitterPostResult({ success: true, tweet_url: data.tweet_url });
        toast.success('Tweet posted successfully!');
      } else {
        setTwitterPostResult({ success: false, error: data.error });
        toast.error(data.error || 'Failed to post tweet');
      }
    } catch (error) {
      console.error('Error posting to Twitter:', error);
      setTwitterPostResult({ success: false, error: 'Failed to connect to Twitter' });
      toast.error('Failed to post tweet');
    } finally {
      setPostingTwitter(false);
    }
  };

  // Get character count color
  const getCharCountColor = (length) => {
    if (length > 280) return 'text-red-400 bg-red-500/20';
    if (length > 270) return 'text-red-400 bg-red-500/20';
    if (length > 250) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-green-400 bg-green-500/20';
  };

  const tones = [
    { id: 'excited', label: '🎉 Excited', bgClass: 'bg-purple-500/30 border-purple-500/50 text-purple-400' },
    { id: 'professional', label: '💼 Professional', bgClass: 'bg-blue-500/30 border-blue-500/50 text-blue-400' },
    { id: 'friendly', label: '🐕 Friendly', bgClass: 'bg-green-500/30 border-green-500/50 text-green-400' },
    { id: 'local', label: '📍 Local', bgClass: 'bg-orange-500/30 border-orange-500/50 text-orange-400' }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-slate-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-slate-700 flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Megaphone className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Partner Shoutout Generator</h3>
              <p className="text-sm text-slate-400">{partner.store_name || partner.name} • {partner.area || partner.address}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Settings Row */}
          <div className="flex flex-wrap items-center gap-4 mb-4 p-3 bg-slate-900/50 rounded-lg">
            {/* Tone Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">Tone:</span>
              <div className="flex gap-1">
                {tones.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setTone(t.id)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors border ${
                      tone === t.id
                        ? t.bgClass
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600 border-transparent'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={generateShoutouts}
              disabled={generating}
              className="ml-auto px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-slate-600 text-white rounded-lg flex items-center gap-2 transition-colors"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Shoutouts
                </>
              )}
            </button>
          </div>

          {/* Include Options */}
          <div className="flex flex-wrap gap-3 mb-4">
            <span className="text-sm text-slate-400">Include:</span>
            {[
              { key: 'storeName', label: 'Store Name' },
              { key: 'location', label: 'Location' },
              { key: 'products', label: 'Products' },
              { key: 'ownerName', label: 'Owner Name' },
              { key: 'callToAction', label: 'Call to Action' },
              { key: 'phone', label: 'Phone' },
              { key: 'mapsLink', label: 'Maps Link' }
            ].map(opt => (
              <label key={opt.key} className="flex items-center gap-1.5 text-sm text-slate-300 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={includeOptions[opt.key]}
                  onChange={(e) => setIncludeOptions({ ...includeOptions, [opt.key]: e.target.checked })}
                  className="rounded border-slate-600 bg-slate-700 text-purple-500 focus:ring-purple-500"
                />
                {opt.label}
              </label>
            ))}
          </div>

          {/* Social Handles Info */}
          {(partner.social_instagram || partner.social_facebook || partner.social_twitter) && (
            <div className="mb-4 p-3 bg-teal-500/10 border border-teal-500/30 rounded-lg">
              <p className="text-sm text-teal-400 flex items-center gap-2 flex-wrap">
                <Check className="w-4 h-4" />
                <span>Will auto-tag:</span>
                {partner.social_instagram && <span className="text-pink-400 font-medium">@{partner.social_instagram}</span>}
                {partner.social_facebook && <span className="text-blue-400 font-medium">{partner.social_facebook}</span>}
                {partner.social_twitter && <span className="text-sky-400 font-medium">@{partner.social_twitter}</span>}
              </p>
            </div>
          )}

          {/* Generated Content */}
          {content.instagram ? (
            <div className="space-y-4">
              {/* Instagram */}
              <div className="bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-slate-700">
                  <div className="flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-pink-400" />
                    <span className="font-medium text-white">Instagram</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard('instagram', content.instagram)}
                    className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded flex items-center gap-1 transition-colors"
                  >
                    {copied.instagram ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    {copied.instagram ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <textarea
                  value={content.instagram}
                  onChange={(e) => setContent({ ...content, instagram: e.target.value })}
                  className="w-full p-4 bg-transparent text-slate-200 text-sm resize-none focus:outline-none"
                  rows={8}
                />
              </div>

              {/* Facebook */}
              <div className="bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-blue-500/20 border-b border-slate-700">
                  <div className="flex items-center gap-2">
                    <Facebook className="w-4 h-4 text-blue-400" />
                    <span className="font-medium text-white">Facebook</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard('facebook', content.facebook)}
                    className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded flex items-center gap-1 transition-colors"
                  >
                    {copied.facebook ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    {copied.facebook ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <textarea
                  value={content.facebook}
                  onChange={(e) => setContent({ ...content, facebook: e.target.value })}
                  className="w-full p-4 bg-transparent text-slate-200 text-sm resize-none focus:outline-none"
                  rows={8}
                />
              </div>

              {/* LinkedIn */}
              <div className="bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-blue-600/20 border-b border-slate-700">
                  <div className="flex items-center gap-2">
                    <Linkedin className="w-4 h-4 text-blue-500" />
                    <span className="font-medium text-white">LinkedIn</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard('linkedin', content.linkedin)}
                    className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded flex items-center gap-1 transition-colors"
                  >
                    {copied.linkedin ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                    {copied.linkedin ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <textarea
                  value={content.linkedin}
                  onChange={(e) => setContent({ ...content, linkedin: e.target.value })}
                  className="w-full p-4 bg-transparent text-slate-200 text-sm resize-none focus:outline-none"
                  rows={6}
                />
              </div>

              {/* Twitter */}
              <div className="bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-600/30 border-b border-slate-700">
                  <div className="flex items-center gap-2">
                    <Twitter className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-white">Twitter/X</span>
                    <span className={`text-xs ${content.twitter.length > 280 ? 'text-red-400' : 'text-slate-500'}`}>
                      ({content.twitter.length}/280)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard('twitter', content.twitter)}
                      className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded flex items-center gap-1 transition-colors"
                    >
                      {copied.twitter ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                      {copied.twitter ? 'Copied!' : 'Copy'}
                    </button>
                    <button
                      onClick={handlePostToTwitterClick}
                      disabled={postingTwitter || content.twitter.length > 280 || !twitterPostingEnabled}
                      title={!twitterPostingEnabled ? 'Twitter posting disabled - enable in Settings' : ''}
                      className={`px-3 py-1 text-white text-sm rounded flex items-center gap-1 transition-colors ${
                        !twitterPostingEnabled 
                          ? 'bg-slate-600 cursor-not-allowed'
                          : postingTwitter || content.twitter.length > 280 
                            ? 'bg-slate-600 cursor-not-allowed'
                            : 'bg-sky-500 hover:bg-sky-600'
                      }`}
                    >
                      <Send className="w-3 h-3" />
                      {!twitterPostingEnabled ? 'Twitter Disabled' : 'Post to Twitter'}
                    </button>
                  </div>
                </div>
                <textarea
                  value={content.twitter}
                  onChange={(e) => setContent({ ...content, twitter: e.target.value })}
                  className="w-full p-4 bg-transparent text-slate-200 text-sm resize-none focus:outline-none"
                  rows={4}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Megaphone className="w-12 h-12 text-slate-600 mb-4" />
              <p className="text-slate-400 mb-2">No shoutout content generated yet</p>
              <p className="text-sm text-slate-500">Select a tone and click &quot;Generate Shoutouts&quot; to create content</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-700 bg-slate-800">
          <p className="text-xs text-slate-500">
            💡 Tip: Copy content → Open Metricool → Paste → Schedule!
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
            >
              Close
            </button>
            {content.instagram && (
              <>
                <button
                  onClick={copyAll}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Copy All
                </button>
                <button
                  onClick={downloadAll}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download All
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Twitter Post Confirmation Modal */}
      {showTwitterConfirm && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
          onClick={() => !postingTwitter && !twitterPostResult?.success && setShowTwitterConfirm(false)}
        >
          <div 
            className="bg-slate-800 rounded-xl w-full max-w-md border border-slate-700 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-gradient-to-r from-sky-900/30 to-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-sky-500/20 rounded-lg">
                  <Twitter className="w-5 h-5 text-sky-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    {twitterPostResult?.success ? 'Tweet Posted!' : 'Post to Twitter?'}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {partner.store_name || partner.name} • {partner.area || partner.city || 'Partner'}
                  </p>
                </div>
              </div>
              {!postingTwitter && (
                <button 
                  onClick={() => setShowTwitterConfirm(false)} 
                  className="text-slate-400 hover:text-white transition-colors p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="p-4">
              {/* Success State */}
              {twitterPostResult?.success ? (
                <div className="text-center py-4">
                  <div className="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Check className="w-8 h-8 text-green-400" />
                  </div>
                  <h4 className="text-lg font-medium text-white mb-2">Successfully Posted!</h4>
                  <p className="text-slate-400 text-sm mb-4">Your tweet is now live on Twitter.</p>
                  <a
                    href={twitterPostResult.tweet_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sky-400 hover:text-sky-300 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View Tweet on Twitter
                  </a>
                </div>
              ) : twitterPostResult?.error ? (
                /* Error State */
                <div className="text-center py-4">
                  <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                    <X className="w-8 h-8 text-red-400" />
                  </div>
                  <h4 className="text-lg font-medium text-white mb-2">Failed to Post</h4>
                  <p className="text-red-400 text-sm mb-4">{twitterPostResult.error}</p>
                  <button
                    onClick={() => setTwitterPostResult(null)}
                    className="text-slate-400 hover:text-white text-sm"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                /* Preview State */
                <>
                  {/* Warning if approaching limit */}
                  {content.twitter.length > 250 && content.twitter.length <= 280 && (
                    <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                      <p className="text-xs text-yellow-400">
                        Approaching character limit ({280 - content.twitter.length} chars remaining)
                      </p>
                    </div>
                  )}

                  {/* Tweet Preview Box */}
                  <div className="bg-slate-900/50 rounded-lg border border-slate-700 p-4 mb-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        OB
                      </div>
                      <div>
                        <p className="font-semibold text-white text-sm">PetYupp</p>
                        <p className="text-slate-500 text-xs">@PetYupp</p>
                      </div>
                    </div>
                    <div className="text-slate-200 text-sm whitespace-pre-wrap leading-relaxed">
                      {content.twitter}
                    </div>
                  </div>

                  {/* Character Count */}
                  <div className="flex justify-end mb-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getCharCountColor(content.twitter.length)}`}>
                      {content.twitter.length}/280
                      {content.twitter.length <= 280 && <Check className="w-3 h-3" />}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-700 bg-slate-800/50">
              {twitterPostResult?.success ? (
                <button
                  onClick={() => setShowTwitterConfirm(false)}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
                >
                  Done
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setShowTwitterConfirm(false)}
                    disabled={postingTwitter}
                    className="px-4 py-2 border border-slate-600 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmPostToTwitter}
                    disabled={postingTwitter || content.twitter.length > 280}
                    className="px-4 py-2 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg flex items-center gap-2 transition-colors min-w-[120px] justify-center"
                  >
                    {postingTwitter ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Post Tweet
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoutoutGeneratorModal;
