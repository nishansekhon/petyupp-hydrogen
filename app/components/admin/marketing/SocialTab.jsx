/**
 * SocialTab Component (Ad Intelligence)
 * 
 * Handles the Ad Intelligence tab functionality in Marketing Hub including:
 * - Competitor ads display in grid format
 * - Paste Ad modal trigger
 * - Inspire from ad functionality
 * - Delete competitor ad
 * - Info banner with workflow instructions
 * 
 * @component
 */

import React from 'react';
import { 
  Sparkles, ExternalLink, Trash2, Loader2
} from 'lucide-react';
import { FaInstagram, FaFacebookF } from 'react-icons/fa';

const SocialTab = ({
  isDarkMode,
  // Competitor ads data
  competitorAds,
  deletingAdId,
  handleDeleteCompetitorAd,
  handleInspireFromAd,
  // Modal setter
  setShowPasteAdModal,
  // Helper
  formatTimeAgo
}) => {
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-white">Ad Intelligence</h2>
          <span className="text-xs text-slate-500">• Browse & adapt competitor ads</span>
        </div>
        <button 
          onClick={() => setShowPasteAdModal(true)}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-slate-400 flex items-center gap-1.5"
        >
          <span className="text-[10px]">+</span> Paste Ad
        </button>
      </div>

      {/* Info Banner */}
      <div className="mb-6 p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <p className="text-sm text-white font-medium mb-1">How it works</p>
            <p className="text-xs text-slate-400">
              1. Browse competitor ads from Meta Ad Library → 2. Copy ad text and paste here → 3. Click &quot;Inspire&quot; to generate PetYupp-style content → 4. Save to Content Ideas
            </p>
            <a 
              href="https://www.facebook.com/ads/library" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 mt-2 text-xs text-teal-400 hover:text-teal-300"
            >
              <ExternalLink className="w-3 h-3" /> Open Meta Ad Library
            </a>
          </div>
        </div>
      </div>

      {/* Ad Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {competitorAds.map((ad) => (
          <div key={ad._id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden hover:border-slate-600 transition-all group relative">
            {/* Delete Button - Top Right (appears on hover) */}
            <button
              onClick={(e) => { e.stopPropagation(); handleDeleteCompetitorAd(ad._id); }}
              disabled={deletingAdId === ad._id}
              className="absolute top-2 right-2 p-1.5 bg-slate-900/80 hover:bg-red-500/20 text-slate-500 hover:text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all z-10"
              title="Delete ad"
            >
              {deletingAdId === ad._id ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Trash2 className="w-3 h-3" />
              )}
            </button>

            {/* Status Bar */}
            <div className="px-3 py-2 border-b border-slate-700/50 flex items-center justify-between">
              <span className="px-1.5 py-0.5 bg-green-500/20 text-green-400 text-[9px] font-medium rounded flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-green-400"></span> Active
              </span>
              <span className="text-[10px] text-slate-600">{formatTimeAgo(ad.saved_at)}</span>
            </div>

            <div className="p-3">
              {/* Advertiser */}
              <div className="flex items-center gap-2 mb-2">
                <div 
                  className="w-6 h-6 rounded-full flex items-center justify-center bg-gradient-to-br from-teal-500 to-blue-500"
                >
                  <span className="text-white font-bold text-[10px]">{ad.advertiser?.charAt(0)?.toUpperCase() || 'A'}</span>
                </div>
                <span className="text-xs font-medium text-white">{ad.advertiser || 'Advertiser'}</span>
              </div>

              {/* Ad Copy */}
              <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-4 mb-2">
                {ad.copy}
              </p>

              {/* Ad Image */}
              {ad.image && (
                <div className="rounded-lg overflow-hidden bg-slate-700 aspect-video mb-2">
                  <img src={ad.image} alt="Ad" className="w-full h-full object-cover" />
                </div>
              )}

              {/* Platforms + Inspire Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  {ad.platforms?.includes('facebook') && <FaFacebookF className="w-2.5 h-2.5 text-blue-400" />}
                  {ad.platforms?.includes('instagram') && <FaInstagram className="w-2.5 h-2.5 text-teal-400" />}
                  {(!ad.platforms || ad.platforms.length === 0) && (
                    <>
                      <FaFacebookF className="w-2.5 h-2.5 text-blue-400" />
                      <FaInstagram className="w-2.5 h-2.5 text-teal-400" />
                    </>
                  )}
                </div>
                <button 
                  onClick={() => handleInspireFromAd(ad)}
                  className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded text-[10px] font-medium transition-colors"
                >
                  Inspire
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Empty State / Add First Ad */}
        <div 
          onClick={() => setShowPasteAdModal(true)}
          className="bg-slate-800/30 border border-dashed border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-teal-500/50 hover:bg-slate-800/50 transition-all min-h-[280px]"
        >
          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mb-3">
            <span className="text-slate-500 text-xl">+</span>
          </div>
          <p className="text-sm text-slate-400 font-medium">Add Competitor Ad</p>
          <p className="text-xs text-slate-600 mt-1 text-center">Paste ad copy from Meta Ad Library</p>
        </div>
      </div>
    </div>
  );
};

export default SocialTab;
