/**
 * SEOTab Component
 * 
 * Handles the SEO tab functionality in Marketing Hub including:
 * - GSC Status and metrics
 * - Quick Health Check
 * - SEO Scores Overview
 * - Smart Recommendations
 * - Product SEO Scores Table
 * - Multiple sub-tabs: Overview, Meta & OG, Schema, Technical, Speed, Sitemap, Redirects, Backlinks
 * 
 * @component
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  RefreshCw, Loader2, ChevronDown, ChevronRight, Zap,
  Award, Target, CheckCircle, Copy, Edit, Trash2, ExternalLink,
  AlertTriangle, Globe, Eye, Search, Share2, Send,
  // SEO Sub-tab icons
  LayoutDashboard, Tags, Code2, Gauge, Map, CornerUpRight, Link2,
  Activity, ShoppingBag, Star, HelpCircle, Building2, Bot, Layers,
  Link as LinkIcon, Timer, CheckCircle2, Settings
} from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/config/api';
import GoogleIndexStatus from '@/components/marketing/GoogleIndexStatus';
import GuestPostOutreach from '@/components/marketing/GuestPostOutreach';

const SEOTab = ({
  isDarkMode,
  navigate,
  // SEO data states
  seoStats,
  gscMetrics,
  seoAlerts,
  seoScores,
  seoRecommendations,
  // Loading states
  loadingSEO,
  loadingGSC,
  loadingAlerts,
  loadingScores,
  loadingRecommendations,
  // View/Navigation states
  seoView,
  setSeoView,
  selectedSeoProduct,
  setSelectedSeoProduct,
  expandedProductId,
  setExpandedProductId,
  activeSeoSubTab,
  setActiveSeoSubTab,
  // SEO Data States
  seoHealthData,
  schemaTypes,
  coreWebVitals,
  setCoreWebVitals,
  redirects,
  backlinks,
  robotsTxtContent,
  setRobotsTxtContent,
  canonicalStats,
  brokenLinksData,
  sitemapStats,
  faqList,
  // Action loading states
  savingRobotsTxt,
  scanningDuplicates,
  scanningBrokenLinks,
  submittingToGSC,
  regeneratingSitemap,
  syncingBacklinks,
  importingRedirects,
  // Form states
  newFaq,
  setNewFaq,
  newRedirect,
  setNewRedirect,
  editingRedirect,
  setEditingRedirect,
  newBacklink,
  setNewBacklink,
  // Modal states
  showFaqModal,
  setShowFaqModal,
  showRedirectModal,
  setShowRedirectModal,
  showBacklinkModal,
  setShowBacklinkModal,
  // Fetch functions
  fetchSEOStats,
  fetchGSCMetrics,
  fetchSEOAlerts,
  fetchSEOScores,
  fetchSEORecommendations,
  fetchFaqs,
  fetchRedirects,
  fetchBacklinks,
  // Action handlers
  handleFixNow,
  handleAddFaq,
  handleDeleteFaq,
  handlePreviewRobotsTxt,
  handleSaveRobotsTxt,
  handleScanDuplicates,
  handleRunBrokenLinkScan,
  handleSubmitToGSC,
  handleRegenerateSitemap,
  handleAddRedirect,
  handleUpdateRedirect,
  handleDeleteRedirect,
  handleEditRedirect,
  handleImportCSV,
  handleAddBacklink,
  handleSyncBacklinks,
  // Helper functions
  getScoreColor,
  getProductsWithRecommendations,
  getActionableRecommendationCount,
  getTotalRecommendationCount,
  getProductsNeedingActionCount,
  getProductsWithIssuesCount
}) => {
  // SEO Sub-tabs configuration
  const seoSubTabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'meta', label: 'Meta & OG', icon: Tags },
    { id: 'schema', label: 'Schema', icon: Code2 },
    { id: 'technical', label: 'Technical', icon: Settings },
    { id: 'speed', label: 'Speed', icon: Gauge },
    { id: 'sitemap', label: 'Sitemap', icon: Map },
    { id: 'redirects', label: 'Redirects', icon: CornerUpRight },
    { id: 'backlinks', label: 'Backlinks', icon: Link2 },
    { id: 'guest-posts', label: 'Guest Posts', icon: Send }
  ];

  // Get status color helper
  const getStatusColor = (status) => {
    switch (status) {
      case 'good': case 'active': return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' };
      case 'warning': case 'partial': return { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' };
      case 'error': case 'missing': return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' };
      default: return { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' };
    }
  };

  // Render SEO Breadcrumb
  const renderSEOBreadcrumb = () => (
    <div className="flex items-center gap-2 text-sm mb-4">
      <span 
        className="text-teal-400 hover:text-teal-300 cursor-pointer transition-colors"
        onClick={() => { setSeoView('main'); setSelectedSeoProduct(null); }}
      >
        Marketing Hub
      </span>
      <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>›</span>
      <span 
        className={seoView === 'main' 
          ? (isDarkMode ? 'text-white' : 'text-gray-900')
          : 'text-teal-400 hover:text-teal-300 cursor-pointer transition-colors'}
        onClick={() => { setSeoView('main'); setSelectedSeoProduct(null); }}
      >
        SEO
      </span>
      {seoView === 'recommendations' && (
        <>
          <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>›</span>
          <span className={isDarkMode ? 'text-white font-medium' : 'text-gray-900 font-medium'}>
            SEO Recommendations
          </span>
        </>
      )}
      {seoView === 'product-detail' && selectedSeoProduct && (
        <>
          <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>›</span>
          <span 
            className="text-teal-400 hover:text-teal-300 cursor-pointer transition-colors"
            onClick={() => { setSeoView('recommendations'); setSelectedSeoProduct(null); }}
          >
            Recommendations
          </span>
          <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>›</span>
          <span className={isDarkMode ? 'text-white font-medium' : 'text-gray-900 font-medium'}>
            {selectedSeoProduct.product_name?.substring(0, 25)}...
          </span>
        </>
      )}
    </div>
  );

  // Render Full Recommendations View
  const renderFullRecommendationsView = () => {
    const productsWithRecs = getProductsWithRecommendations();
    const actionableCount = getActionableRecommendationCount();
    const productsNeedingAction = getProductsNeedingActionCount();
    
    return (
      <div className="space-y-4">
        {renderSEOBreadcrumb()}
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              SEO Recommendations
            </h2>
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              {actionableCount > 0 
                ? `${actionableCount} actionable issue${actionableCount !== 1 ? 's' : ''} across ${productsNeedingAction} product${productsNeedingAction !== 1 ? 's' : ''}`
                : `All products optimized! ${getTotalRecommendationCount()} minor items (waiting for Google data)`
              }
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { fetchSEOScores(); fetchSEORecommendations(); }}
              disabled={loadingScores}
              className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 ${
                isDarkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50`}
            >
              <RefreshCw size={14} className={loadingScores ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>

        {/* Product Cards */}
        {loadingScores ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-400" />
          </div>
        ) : productsWithRecs.length > 0 ? (
          <div className="space-y-3">
            {productsWithRecs.map((product, idx) => {
              const isExpanded = expandedProductId === product.product_id;
              const scoreColor = getScoreColor(product.score);
              
              return (
                <div key={idx} className={`backdrop-blur-lg border rounded-xl overflow-hidden ${
                  isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
                }`}>
                  {/* Collapsed Header */}
                  <div 
                    className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${
                      isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setExpandedProductId(isExpanded ? null : product.product_id)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${scoreColor}`}>
                        {product.score}
                      </span>
                      <span className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {product.product_name}
                      </span>
                      <span className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                        {product.recommendations.length} issue{product.recommendations.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <ChevronDown size={18} className={`transition-transform ${isExpanded ? 'rotate-180' : ''} ${
                      isDarkMode ? 'text-slate-400' : 'text-gray-400'
                    }`} />
                  </div>
                  
                  {/* Expanded Recommendations */}
                  {isExpanded && (
                    <div className={`border-t ${isDarkMode ? 'border-slate-700 bg-slate-900/30' : 'border-gray-200 bg-gray-50'}`}>
                      {product.recommendations.map((rec, recIdx) => {
                        const severityColor = 
                          rec.priority === 'critical' ? 'border-l-red-500' :
                          rec.priority === 'high' ? 'border-l-orange-500' :
                          rec.priority === 'medium' ? 'border-l-yellow-500' :
                          'border-l-teal-500';
                        
                        return (
                          <div key={recIdx} className={`py-2 px-4 border-l-4 ${severityColor} ${
                            recIdx !== product.recommendations.length - 1 
                              ? (isDarkMode ? 'border-b border-slate-700' : 'border-b border-gray-200') 
                              : ''
                          }`}>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="text-sm">📄</span>
                                <span className={`text-sm truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {rec.message || rec.type?.replace(/_/g, ' ')}
                                </span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-medium ${
                                  rec.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                                  rec.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                  rec.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                  'bg-teal-500/20 text-teal-400'
                                }`}>
                                  {rec.priority || 'low'}
                                </span>
                              </div>
                              <button
                                onClick={(e) => { e.stopPropagation(); handleFixNow(product.product_id, rec.type || rec.message); }}
                                className="px-2 py-1 rounded text-xs font-medium bg-teal-600 hover:bg-teal-500 text-white transition-colors whitespace-nowrap"
                              >
                                Fix Now
                              </button>
                            </div>
                            {rec.impact && (
                              <p className={`text-[10px] mt-1 ml-6 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                                Impact: {rec.impact} {rec.current && rec.target && `| Current: ${rec.current} → Target: ${rec.target}`}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`text-center py-12 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            <CheckCircle size={48} className="mx-auto mb-3 text-green-400" />
            <p className="font-medium">All products are optimized!</p>
            <p className="text-sm">No recommendations at this time.</p>
          </div>
        )}
      </div>
    );
  };

  // Render SEO Sub-tab Navigation
  const renderSeoSubTabNav = () => (
    <div className={`rounded-xl p-1 mb-6 ${isDarkMode ? 'bg-slate-800/50' : 'bg-gray-100'}`}>
      <div className="flex gap-1 overflow-x-auto">
        {seoSubTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeSeoSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSeoSubTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-teal-500 text-white'
                  : isDarkMode
                    ? 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  // Render Quick Health Check Section
  const renderQuickHealthCheck = () => {
    const healthItems = [
      { key: 'metaTags', label: 'Meta Tags', icon: Tags, data: seoHealthData.metaTags },
      { key: 'schema', label: 'Schema Markup', icon: Code2, data: seoHealthData.schema },
      { key: 'brokenLinks', label: 'Broken Links', icon: LinkIcon, data: seoHealthData.brokenLinks },
      { key: 'pageSpeed', label: 'Page Speed', icon: Gauge, data: seoHealthData.pageSpeed },
      { key: 'canonicals', label: 'Canonicals', icon: Layers, data: seoHealthData.canonicals },
      { key: 'robotsTxt', label: 'robots.txt', icon: Bot, data: seoHealthData.robotsTxt },
      { key: 'sitemap', label: 'Sitemap', icon: Map, data: seoHealthData.sitemap },
      { key: 'openGraph', label: 'Open Graph', icon: Share2, data: seoHealthData.openGraph }
    ];

    return (
      <div className={`backdrop-blur-lg border rounded-2xl p-6 ${
        isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-teal-500/20">
            <Activity size={20} className="text-teal-400" />
          </div>
          <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Quick Health Check
          </h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {healthItems.map(item => {
            const Icon = item.icon;
            const colors = getStatusColor(item.data.status);
            const displayText = item.data.count !== undefined 
              ? `${item.data.count}${item.data.total ? `/${item.data.total}` : ''}` 
              : item.data.score ? `${item.data.score}%` 
              : item.data.urls ? `${item.data.urls} URLs`
              : item.data.configured ? 'Configured' : 'Missing';
            
            return (
              <div key={item.key} className={`p-3 rounded-xl border ${colors.border} ${colors.bg}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors.bg}`}>
                    <Icon size={16} className={colors.text} />
                  </div>
                  <CheckCircle2 size={16} className={colors.text} />
                </div>
                <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  {item.label}
                </p>
                <p className={`text-sm font-bold ${colors.text}`}>{displayText}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render Meta & OG Sub-tab
  const renderMetaOgSubTab = () => (
    <div className="space-y-6">
      {/* Meta Tags Manager */}
      <div className={`backdrop-blur-lg border rounded-2xl p-6 ${
        isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/20">
            <Tags size={20} className="text-blue-400" />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Meta Tags Manager
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              Manage title tags and meta descriptions
            </p>
          </div>
        </div>
        
        {/* Search and Filter */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search size={16} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Search pages..."
              className={`w-full pl-10 pr-4 py-2 rounded-lg border text-sm ${
                isDarkMode 
                  ? 'bg-slate-700/50 border-slate-600 text-white placeholder-slate-500'
                  : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
              }`}
            />
          </div>
          <select className={`px-3 py-2 rounded-lg border text-sm ${
            isDarkMode ? 'bg-slate-700/50 border-slate-600 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}>
            <option>All Pages</option>
            <option>Products</option>
            <option>Blog</option>
            <option>Categories</option>
          </select>
        </div>

        {/* Meta Tags Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                <th className="text-left pb-3">Page URL</th>
                <th className="text-left pb-3">Title Tag</th>
                <th className="text-left pb-3">Meta Description</th>
                <th className="text-center pb-3">Status</th>
                <th className="text-center pb-3">Edit</th>
              </tr>
            </thead>
            <tbody>
              {[
                { url: '/products/chicken-treats', title: 'Chicken Dog Treats | PetYupp', desc: 'Premium dehydrated chicken treats...', status: 'good' },
                { url: '/products/bone-toy', title: 'Dog Bone Toy | PetYupp', desc: '', status: 'error' },
                { url: '/blog/nutrition-guide', title: 'Dog Nutrition Guide | PetYupp Blog', desc: 'Complete guide to dog nutrition...', status: 'good' },
              ].map((page, idx) => {
                const colors = getStatusColor(page.status);
                return (
                  <tr key={idx} className={`border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                    <td className={`py-3 text-sm ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                      {page.url}
                    </td>
                    <td className={`py-3 text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {page.title.substring(0, 30)}...
                    </td>
                    <td className={`py-3 text-sm ${page.desc ? (isDarkMode ? 'text-slate-400' : 'text-gray-600') : 'text-red-400'}`}>
                      {page.desc ? page.desc.substring(0, 30) + '...' : 'Missing'}
                    </td>
                    <td className="text-center">
                      <span className={`w-6 h-6 rounded-full inline-flex items-center justify-center ${colors.bg}`}>
                        <CheckCircle2 size={14} className={colors.text} />
                      </span>
                    </td>
                    <td className="text-center">
                      <button className={`p-1.5 rounded-lg ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}>
                        <Edit size={14} className={isDarkMode ? 'text-slate-400' : 'text-gray-500'} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Google Preview */}
        <div className={`mt-6 p-4 rounded-xl ${isDarkMode ? 'bg-slate-900' : 'bg-white border border-gray-200'}`}>
          <p className={`text-xs font-medium mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Google Search Preview
          </p>
          <div className="bg-white p-4 rounded-lg">
            <p className="text-blue-600 text-lg hover:underline cursor-pointer">Chicken Dog Treats - Premium Dehydrated | PetYupp</p>
            <p className="text-green-700 text-sm">https://petyupp.com › products › chicken-treats</p>
            <p className="text-gray-600 text-sm">Premium dehydrated chicken treats for dogs. Natural, healthy, and loved by pets. Shop now for the best quality dog treats in India.</p>
          </div>
        </div>
      </div>

      {/* Open Graph Tags */}
      <div className={`backdrop-blur-lg border rounded-2xl p-6 ${
        isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-pink-500/20">
            <Share2 size={20} className="text-pink-400" />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Open Graph Tags
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              Control how your content appears when shared
            </p>
          </div>
        </div>

        {/* OG Status Cards */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { platform: 'Facebook', configured: 10, total: 12, color: 'blue' },
            { platform: 'Twitter', configured: 8, total: 12, color: 'sky' },
            { platform: 'LinkedIn', configured: 8, total: 12, color: 'blue' },
            { platform: 'Default OG', configured: 12, total: 12, color: 'green' }
          ].map((og, idx) => (
            <div key={idx} className={`p-3 rounded-xl ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>{og.platform}</p>
              <p className={`text-lg font-bold ${og.configured === og.total ? 'text-green-400' : 'text-amber-400'}`}>
                {og.configured}/{og.total}
              </p>
            </div>
          ))}
        </div>

        {/* Social Preview */}
        <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
          <p className={`text-xs font-medium mb-2 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
            Social Media Preview
          </p>
          <div className={`rounded-lg overflow-hidden border ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-gray-200 bg-white'}`}>
            <div className={`h-32 flex items-center justify-center ${isDarkMode ? 'bg-slate-700' : 'bg-gray-100'}`}>
              <Eye size={32} className={isDarkMode ? 'text-slate-500' : 'text-gray-400'} />
            </div>
            <div className="p-3">
              <p className={`text-[10px] uppercase ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>petyupp.com</p>
              <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>PetYupp - Premium Dog Treats</p>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Natural, healthy treats your dog will love.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Schema Sub-tab
  const renderSchemaSubTab = () => (
    <div className="space-y-6">
      {/* Schema Types Grid */}
      <div className={`backdrop-blur-lg border rounded-2xl p-6 ${
        isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-violet-500/20">
            <Code2 size={20} className="text-violet-400" />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Schema Markup Status
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              Structured data implementation across your site
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {schemaTypes.map((schema, idx) => {
            const Icon = schema.icon;
            const colors = getStatusColor(schema.status);
            return (
              <div key={idx} className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-700/30 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colors.bg}`}>
                    <Icon size={20} className={colors.text} />
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${colors.bg} ${colors.text}`}>
                    {schema.status === 'active' ? 'Active' : schema.status === 'partial' ? 'Partial' : 'Missing'}
                  </span>
                </div>
                <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{schema.type}</p>
                <p className={`text-lg font-bold ${colors.text}`}>{schema.count} pages</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* FAQ Schema Editor */}
      <div className={`backdrop-blur-lg border rounded-2xl p-6 ${
        isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500/20">
              <HelpCircle size={20} className="text-amber-400" />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                FAQ Schema Editor
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Add FAQ structured data to product pages
              </p>
            </div>
          </div>
          <button 
            onClick={() => setShowFaqModal(true)}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            + Add FAQ
          </button>
        </div>
        
        {faqList.length > 0 ? (
          <div className="space-y-3">
            {faqList.map((faq, idx) => (
              <div key={faq.id || idx} className={`p-4 rounded-xl ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Q: {faq.question}
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                      A: {faq.answer}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleDeleteFaq(faq.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20 text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              No FAQ schemas configured yet. Add frequently asked questions to improve your rich snippets.
            </p>
          </div>
        )}
      </div>
    </div>
  );

  // Render Technical Sub-tab
  const renderTechnicalSubTab = () => (
    <div className="space-y-6">
      {/* robots.txt Editor */}
      <div className={`backdrop-blur-lg border rounded-2xl p-6 ${
        isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-500/20">
            <Bot size={20} className="text-slate-400" />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              robots.txt Editor
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              Control search engine crawling
            </p>
          </div>
        </div>
        <textarea
          value={robotsTxtContent}
          onChange={(e) => setRobotsTxtContent(e.target.value)}
          className={`w-full p-4 rounded-xl font-mono text-sm h-48 resize-none ${isDarkMode ? 'bg-slate-900 text-green-400 border-slate-700' : 'bg-gray-900 text-green-400 border-gray-700'} border`}
        />
        <div className="flex items-center justify-between mt-4">
          <span className="text-green-400 text-xs flex items-center gap-1">
            <CheckCircle2 size={14} /> Valid configuration
          </span>
          <div className="flex gap-2">
            <button 
              onClick={handlePreviewRobotsTxt}
              className={`px-3 py-1.5 rounded-lg text-sm ${isDarkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Preview
            </button>
            <button 
              onClick={handleSaveRobotsTxt}
              disabled={savingRobotsTxt}
              className="px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-sm rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              {savingRobotsTxt && <Loader2 size={14} className="animate-spin" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* Canonical URL Manager */}
      <div className={`backdrop-blur-lg border rounded-2xl p-6 ${
        isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-500/20">
            <Layers size={20} className="text-indigo-400" />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Canonical URL Manager
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              Prevent duplicate content issues
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Pages with Canonical</p>
            <p className="text-2xl font-bold text-green-400">45</p>
          </div>
          <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Missing Canonical</p>
            <p className="text-2xl font-bold text-amber-400">{canonicalStats.missing}</p>
          </div>
          <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Duplicate Content</p>
            <p className="text-2xl font-bold text-red-400">{canonicalStats.duplicates}</p>
          </div>
        </div>
        <button 
          onClick={handleScanDuplicates}
          disabled={scanningDuplicates}
          className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {scanningDuplicates && <Loader2 size={14} className="animate-spin" />}
          {scanningDuplicates ? 'Scanning...' : 'Scan Duplicates'}
        </button>
      </div>

      {/* Broken Link Checker */}
      <div className={`backdrop-blur-lg border rounded-2xl p-6 ${
        isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-red-500/20">
            <LinkIcon size={20} className="text-red-400" />
          </div>
          <div>
            <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Broken Link Checker
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              Find and fix broken links
            </p>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Total Scanned</p>
            <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{brokenLinksData.total}</p>
          </div>
          <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Broken Links</p>
            <p className="text-lg font-bold text-green-400">{brokenLinksData.broken}</p>
          </div>
          <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>External Links</p>
            <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{brokenLinksData.external}</p>
          </div>
          <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Last Scan</p>
            <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Today</p>
          </div>
        </div>
        <div className={`p-4 rounded-xl text-center ${isDarkMode ? 'bg-green-500/10' : 'bg-green-50'}`}>
          <CheckCircle2 size={32} className="mx-auto mb-2 text-green-400" />
          <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>No broken links found!</p>
          <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>All internal and external links are working correctly.</p>
        </div>
        <button 
          onClick={handleRunBrokenLinkScan}
          disabled={scanningBrokenLinks}
          className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {scanningBrokenLinks && <Loader2 size={14} className="animate-spin" />}
          {scanningBrokenLinks ? 'Scanning...' : 'Run Full Scan'}
        </button>
      </div>
    </div>
  );

  // Render Speed Sub-tab
  const renderSpeedSubTab = () => (
    <div className="space-y-6">
      {/* Core Web Vitals */}
      <div className={`backdrop-blur-lg border rounded-2xl p-6 ${
        isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-500/20">
              <Gauge size={20} className="text-green-400" />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Core Web Vitals
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Google&apos;s page experience metrics
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setCoreWebVitals(prev => ({ ...prev, device: 'desktop' }))}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                coreWebVitals.device === 'desktop' 
                  ? 'bg-teal-500 text-white' 
                  : isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Desktop
            </button>
            <button 
              onClick={() => setCoreWebVitals(prev => ({ ...prev, device: 'mobile' }))}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                coreWebVitals.device === 'mobile' 
                  ? 'bg-teal-500 text-white' 
                  : isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-gray-100 text-gray-600'
              }`}
            >
              Mobile
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* LCP */}
          <div className={`p-5 rounded-xl border ${isDarkMode ? 'bg-slate-700/30 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-2xl font-bold ${coreWebVitals.lcp.status === 'good' ? 'text-green-400' : 'text-amber-400'}`}>
                {coreWebVitals.lcp.value}{coreWebVitals.lcp.unit}
              </span>
              <CheckCircle2 size={20} className={coreWebVitals.lcp.status === 'good' ? 'text-green-400' : 'text-amber-400'} />
            </div>
            <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>LCP</p>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Largest Contentful Paint</p>
            <p className={`text-xs mt-2 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>Target: {coreWebVitals.lcp.target}</p>
          </div>

          {/* INP */}
          <div className={`p-5 rounded-xl border ${isDarkMode ? 'bg-slate-700/30 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-2xl font-bold ${coreWebVitals.inp.status === 'good' ? 'text-green-400' : 'text-amber-400'}`}>
                {coreWebVitals.inp.value}{coreWebVitals.inp.unit}
              </span>
              <AlertTriangle size={20} className={coreWebVitals.inp.status === 'good' ? 'text-green-400' : 'text-amber-400'} />
            </div>
            <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>INP</p>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Interaction to Next Paint</p>
            <p className={`text-xs mt-2 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>Target: {coreWebVitals.inp.target}</p>
          </div>

          {/* CLS */}
          <div className={`p-5 rounded-xl border ${isDarkMode ? 'bg-slate-700/30 border-slate-600' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-2xl font-bold ${coreWebVitals.cls.status === 'good' ? 'text-green-400' : 'text-amber-400'}`}>
                {coreWebVitals.cls.value}
              </span>
              <CheckCircle2 size={20} className={coreWebVitals.cls.status === 'good' ? 'text-green-400' : 'text-amber-400'} />
            </div>
            <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>CLS</p>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Cumulative Layout Shift</p>
            <p className={`text-xs mt-2 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>Target: {coreWebVitals.cls.target}</p>
          </div>
        </div>
      </div>

      {/* Performance Score */}
      <div className={`backdrop-blur-lg border rounded-2xl p-6 ${
        isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-500/20">
            <Timer size={20} className="text-blue-400" />
          </div>
          <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Overall Performance Score
          </h3>
        </div>
        <div className="flex items-center gap-8">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke={isDarkMode ? '#334155' : '#e5e7eb'} strokeWidth="8" />
              <circle 
                cx="50" cy="50" r="45" fill="none" 
                stroke={coreWebVitals.performanceScore >= 90 ? '#22c55e' : coreWebVitals.performanceScore >= 50 ? '#f59e0b' : '#ef4444'}
                strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - coreWebVitals.performanceScore / 100)}`}
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${
                coreWebVitals.performanceScore >= 90 ? 'text-green-400' : 
                coreWebVitals.performanceScore >= 50 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {coreWebVitals.performanceScore}
              </span>
            </div>
          </div>
          <div>
            <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              Your site scores {coreWebVitals.performanceScore >= 90 ? 'excellent' : coreWebVitals.performanceScore >= 50 ? 'needs improvement' : 'poor'} on {coreWebVitals.device} performance.
            </p>
            <p className={`text-xs mt-2 ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
              Powered by Google PageSpeed Insights
            </p>
          </div>
        </div>
      </div>

      {/* Optimization Opportunities */}
      <div className={`backdrop-blur-lg border rounded-2xl p-6 ${
        isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Optimization Opportunities
        </h3>
        <div className="space-y-3">
          {[
            { issue: 'Serve images in next-gen formats', impact: 'high', savings: '1.2s' },
            { issue: 'Eliminate render-blocking resources', impact: 'medium', savings: '0.5s' },
            { issue: 'Reduce unused JavaScript', impact: 'low', savings: '0.2s' }
          ].map((item, idx) => (
            <div key={idx} className={`flex items-center justify-between p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                  item.impact === 'high' ? 'bg-red-500/20 text-red-400' :
                  item.impact === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-green-500/20 text-green-400'
                }`}>
                  {item.impact.toUpperCase()}
                </span>
                <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item.issue}</span>
              </div>
              <span className={`text-sm font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Save {item.savings}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render Sitemap Sub-tab
  const renderSitemapSubTab = () => (
    <div className="space-y-6">
      <div className={`backdrop-blur-lg border rounded-2xl p-6 ${
        isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-teal-500/20">
              <Map size={20} className="text-teal-400" />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                XML Sitemap
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Help search engines discover your content
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleSubmitToGSC}
              disabled={submittingToGSC}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${isDarkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} disabled:opacity-50`}
            >
              {submittingToGSC && <Loader2 size={14} className="animate-spin" />}
              {submittingToGSC ? 'Submitting...' : 'Submit to GSC'}
            </button>
            <button 
              onClick={handleRegenerateSitemap}
              disabled={regeneratingSitemap}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {regeneratingSitemap && <Loader2 size={14} className="animate-spin" />}
              {regeneratingSitemap ? 'Regenerating...' : 'Regenerate'}
            </button>
          </div>
        </div>

        {/* Sitemap URL */}
        <div className={`flex items-center gap-3 p-3 rounded-lg mb-6 ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
          <Globe size={16} className="text-teal-400" />
          <code className={`flex-1 text-sm ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
            https://petyupp.com/sitemap.xml
          </code>
          <button 
            onClick={() => { navigator.clipboard.writeText('https://petyupp.com/sitemap.xml'); toast.success('URL copied!'); }}
            className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-slate-600' : 'hover:bg-gray-200'}`}
          >
            <Copy size={14} className={isDarkMode ? 'text-slate-400' : 'text-gray-500'} />
          </button>
        </div>

        {/* URL Breakdown */}
        <h4 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          URL Breakdown
        </h4>
        <div className="space-y-2">
          {[
            { type: 'Products', count: sitemapStats.products, included: true },
            { type: 'Blog Posts', count: sitemapStats.blogs, included: true },
            { type: 'Categories', count: sitemapStats.categories, included: true },
            { type: 'Static Pages', count: sitemapStats.static, included: true },
            { type: 'Tags', count: 24, included: false }
          ].map((item, idx) => (
            <div key={idx} className={`flex items-center justify-between p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-3">
                <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{item.type}</span>
                <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>({item.count} URLs)</span>
              </div>
              <button className={`w-10 h-5 rounded-full transition-colors ${
                item.included ? 'bg-teal-500' : isDarkMode ? 'bg-slate-600' : 'bg-gray-300'
              }`}>
                <div className={`w-4 h-4 rounded-full bg-white transform transition-transform ${
                  item.included ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render Redirects Sub-tab
  const renderRedirectsSubTab = () => (
    <div className="space-y-6">
      <div className={`backdrop-blur-lg border rounded-2xl p-6 ${
        isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-orange-500/20">
              <CornerUpRight size={20} className="text-orange-400" />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                URL Redirects
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Manage 301 and 302 redirects
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleImportCSV}
              disabled={importingRedirects}
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${isDarkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} disabled:opacity-50`}
            >
              {importingRedirects && <Loader2 size={14} className="animate-spin" />}
              Import CSV
            </button>
            <button 
              onClick={() => { setEditingRedirect(null); setNewRedirect({ from_path: '', to_path: '', type: '301' }); setShowRedirectModal(true); }}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              + Add Redirect
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Total Redirects</p>
            <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{redirects.length || 0}</p>
          </div>
          <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>301 Permanent</p>
            <p className="text-lg font-bold text-green-400">{redirects.filter(r => r.type === '301').length}</p>
          </div>
          <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>302 Temporary</p>
            <p className="text-lg font-bold text-amber-400">{redirects.filter(r => r.type === '302').length}</p>
          </div>
          <div className={`p-3 rounded-xl ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Redirect Chains</p>
            <p className="text-lg font-bold text-red-400">0</p>
          </div>
        </div>

        {/* Redirects Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                <th className="text-left pb-3">From</th>
                <th className="text-left pb-3">To</th>
                <th className="text-center pb-3">Type</th>
                <th className="text-center pb-3">Hits</th>
                <th className="text-center pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(redirects.length > 0 ? redirects : [
                { id: 'demo1', from_path: '/old-product', to_path: '/products/new-product', type: '301', hits: 156 },
                { id: 'demo2', from_path: '/sale-2023', to_path: '/products', type: '302', hits: 42 },
                { id: 'demo3', from_path: '/blog/old-post', to_path: '/blog/updated-post', type: '301', hits: 89 }
              ]).map((redirect, idx) => (
                <tr key={redirect.id || idx} className={`border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                  <td className="py-3 text-sm text-red-400">{redirect.from_path || redirect.from}</td>
                  <td className="py-3 text-sm text-green-400">{redirect.to_path || redirect.to}</td>
                  <td className="text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      redirect.type === '301' ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {redirect.type}
                    </span>
                  </td>
                  <td className={`text-center text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                    {redirect.hits || 0}
                  </td>
                  <td className="text-center">
                    <div className="flex justify-center gap-1">
                      <button 
                        onClick={() => handleEditRedirect(redirect)}
                        className={`p-1.5 rounded-lg ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
                      >
                        <Edit size={14} className={isDarkMode ? 'text-slate-400' : 'text-gray-500'} />
                      </button>
                      <button 
                        onClick={() => handleDeleteRedirect(redirect.id)}
                        className={`p-1.5 rounded-lg ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'}`}
                      >
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Render Backlinks Sub-tab
  const renderBacklinksSubTab = () => (
    <div className="space-y-6">
      <div className={`backdrop-blur-lg border rounded-2xl p-6 ${
        isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/20">
              <Link2 size={20} className="text-purple-400" />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Backlinks
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                Monitor your link profile
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowBacklinkModal(true)}
              className={`px-3 py-2 rounded-lg text-sm font-medium ${isDarkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              + Add Manual
            </button>
            <button 
              onClick={handleSyncBacklinks}
              disabled={syncingBacklinks}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {syncingBacklinks && <Loader2 size={14} className="animate-spin" />}
              {syncingBacklinks ? 'Syncing...' : 'Sync Bing API'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Total Backlinks</p>
            <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{backlinks.total || 156}</p>
          </div>
          <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Referring Domains</p>
            <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{backlinks.domains || 42}</p>
          </div>
          <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>DoFollow</p>
            <p className="text-2xl font-bold text-green-400">{backlinks.dofollow || 128}</p>
          </div>
          <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>NoFollow</p>
            <p className={`text-2xl font-bold ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{backlinks.nofollow || 28}</p>
          </div>
        </div>

        {/* Top Referring Domains */}
        <h4 className={`text-sm font-medium mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Top Referring Domains
        </h4>
        <div className="space-y-2">
          {[
            { domain: 'petcare.in', links: 24, da: 45, type: 'dofollow' },
            { domain: 'dogfood.blog', links: 18, da: 38, type: 'dofollow' },
            { domain: 'reddit.com', links: 12, da: 92, type: 'nofollow' },
            { domain: 'instagram.com', links: 8, da: 95, type: 'nofollow' }
          ].map((domain, idx) => (
            <div key={idx} className={`flex items-center justify-between p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-slate-600' : 'bg-gray-200'}`}>
                  <Globe size={14} className={isDarkMode ? 'text-slate-400' : 'text-gray-500'} />
                </div>
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{domain.domain}</p>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>{domain.links} backlinks</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>DA: {domain.da}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                  domain.type === 'dofollow' ? 'bg-green-500/20 text-green-400' : 'bg-slate-500/20 text-slate-400'
                }`}>
                  {domain.type}
                </span>
                <button className={`p-1.5 rounded-lg ${isDarkMode ? 'hover:bg-slate-600' : 'hover:bg-gray-200'}`}>
                  <ExternalLink size={14} className={isDarkMode ? 'text-slate-400' : 'text-gray-500'} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* API Status */}
        <div className={`mt-6 flex items-center gap-2 text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Bing Webmaster API connected
        </div>
      </div>
    </div>
  );

  // Main SEO Tab Render
  // If in full recommendations view, render that instead
  if (seoView === 'recommendations') {
    return renderFullRecommendationsView();
  }

  // Main SEO Dashboard View with Sub-tabs
  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      {renderSeoSubTabNav()}

      {/* Sub-tab Content */}
      {activeSeoSubTab === 'overview' && (
        <div className="space-y-6">
          {/* GSC Status Card */}
          <div className={`backdrop-blur-lg border rounded-2xl p-6 ${
            isDarkMode 
              ? 'bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border-white/10' 
              : 'bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                📈 SEO Status - Live from Google
              </h3>
              <button
                onClick={fetchGSCMetrics}
                disabled={loadingGSC}
                className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all ${
                  isDarkMode
                    ? 'bg-white/10 text-white hover:bg-white/20'
                    : 'bg-white text-gray-900 hover:bg-gray-100'
                } disabled:opacity-50`}
              >
                <RefreshCw size={14} className={loadingGSC ? 'animate-spin' : ''} />
                Sync
              </button>
            </div>

            {loadingGSC ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-teal-400" />
                <p className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
                  Loading live data from Google Search Console...
                </p>
              </div>
            ) : gscMetrics && gscMetrics.success ? (
              <div>
                <p className={`text-xs mb-4 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                  Last Updated: {new Date(gscMetrics.date_range.end).toLocaleDateString()} | 
                  Data Range: Last 7 Days
                </p>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Indexed</p>
                    <p className="text-lg font-semibold text-green-400">
                      {gscMetrics.top_products?.length || 0}/10 ✅
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Avg Position</p>
                    <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {gscMetrics.summary.average_position}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Total Impressions</p>
                    <p className="text-lg font-semibold text-blue-400">
                      {gscMetrics.summary.total_impressions}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Total Clicks</p>
                    <p className="text-lg font-semibold text-teal-400">
                      {gscMetrics.summary.total_clicks}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>Avg CTR</p>
                    <p className={`text-lg font-semibold ${
                      gscMetrics.summary.average_ctr >= 5 ? 'text-green-400' :
                      gscMetrics.summary.average_ctr >= 2 ? 'text-yellow-400' :
                      'text-red-400'
                    }`}>
                      {gscMetrics.summary.average_ctr}%
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`text-center py-8 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                <p>No GSC data available. Make sure your site is verified in Google Search Console.</p>
              </div>
            )}
          </div>

          {/* Quick Health Check */}
          {renderQuickHealthCheck()}

          {/* Google Index Status Dashboard */}
          <GoogleIndexStatus isDarkMode={isDarkMode} />

          {/* SEO Scores and Recommendations in two columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SEO Scores Overview */}
            <div className={`backdrop-blur-lg border rounded-2xl p-6 ${
              isDarkMode 
                ? 'bg-gradient-to-br from-blue-500/20 to-teal-500/10 border-slate-700' 
                : 'bg-gradient-to-br from-blue-50 to-teal-50 border-blue-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Award size={20} className="text-yellow-400" />
                  SEO Scores Overview
                </h3>
                <button
                  onClick={() => { fetchSEOScores(); fetchSEORecommendations(); }}
                  disabled={loadingScores}
                  className={`px-2 py-1 rounded-lg text-xs flex items-center gap-1 ${
                    isDarkMode ? 'bg-slate-700 text-white' : 'bg-white text-gray-900'
                  } disabled:opacity-50`}
                >
                  <RefreshCw size={12} className={loadingScores ? 'animate-spin' : ''} />
                </button>
              </div>

              {loadingScores ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-400" />
                </div>
              ) : seoScores ? (
                <div>
                  {/* Score Circle */}
                  <div className="text-center mb-4">
                    <div className="relative inline-block">
                      <svg className="w-24 h-24">
                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="none"
                          className={isDarkMode ? 'text-slate-700' : 'text-gray-200'} />
                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="none"
                          strokeDasharray={`${2 * Math.PI * 40}`}
                          strokeDashoffset={`${2 * Math.PI * 40 * (1 - seoScores.average_score / 100)}`}
                          className={
                            seoScores.average_score >= 80 ? 'text-green-400' :
                            seoScores.average_score >= 60 ? 'text-yellow-400' :
                            seoScores.average_score >= 40 ? 'text-orange-400' : 'text-red-400'
                          }
                          strokeLinecap="round" transform="rotate(-90 48 48)" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {seoScores.average_score}
                        </span>
                        <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>/100</span>
                      </div>
                    </div>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                      Across {seoScores.total_products} products
                    </p>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-4 gap-2">
                    <div className={`p-2 rounded-lg text-center ${isDarkMode ? 'bg-slate-700/50' : 'bg-white'}`}>
                      <p className="text-lg font-bold text-green-400">{seoScores.products.filter(p => p.grade === 'A').length}</p>
                      <p className="text-[10px] text-gray-400">A</p>
                    </div>
                    <div className={`p-2 rounded-lg text-center ${isDarkMode ? 'bg-slate-700/50' : 'bg-white'}`}>
                      <p className="text-lg font-bold text-yellow-400">{seoScores.products.filter(p => p.grade === 'B').length}</p>
                      <p className="text-[10px] text-gray-400">B</p>
                    </div>
                    <div className={`p-2 rounded-lg text-center ${isDarkMode ? 'bg-slate-700/50' : 'bg-white'}`}>
                      <p className="text-lg font-bold text-orange-400">{seoScores.products.filter(p => p.grade === 'C').length}</p>
                      <p className="text-[10px] text-gray-400">C</p>
                    </div>
                    <div className={`p-2 rounded-lg text-center ${isDarkMode ? 'bg-slate-700/50' : 'bg-white'}`}>
                      <p className="text-lg font-bold text-red-400">{seoScores.products.filter(p => p.grade === 'D').length}</p>
                      <p className="text-[10px] text-gray-400">D</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className={`text-center ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>No scores available</p>
              )}
            </div>

            {/* Compact Smart Recommendations */}
            <div className={`backdrop-blur-lg border rounded-2xl p-6 ${
              isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className={`text-lg font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  <Zap size={20} className="text-yellow-400" />
                  Smart Recommendations
                </h3>
                <button
                  onClick={() => { fetchSEOScores(); fetchSEORecommendations(); }}
                  disabled={loadingRecommendations}
                  className={`p-1.5 rounded-lg ${
                    isDarkMode ? 'bg-slate-700 hover:bg-slate-600' : 'bg-gray-100 hover:bg-gray-200'
                  } disabled:opacity-50`}
                >
                  <RefreshCw size={14} className={`${loadingRecommendations ? 'animate-spin' : ''} ${
                    isDarkMode ? 'text-slate-400' : 'text-gray-500'
                  }`} />
                </button>
              </div>

              {loadingRecommendations || loadingScores ? (
                <div className="text-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-400" />
                </div>
              ) : seoScores && getProductsWithRecommendations().length > 0 ? (
                <div>
                  {/* Summary - Show actionable count for clarity */}
                  <p className={`text-sm mb-3 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                    {getActionableRecommendationCount() > 0 
                      ? `${getActionableRecommendationCount()} actionable issue${getActionableRecommendationCount() !== 1 ? 's' : ''} to fix`
                      : 'All critical issues resolved!'
                    }
                    {getActionableRecommendationCount() === 0 && getTotalRecommendationCount() > 0 && (
                      <span className={`text-xs ml-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
                        ({getTotalRecommendationCount()} waiting for Google data)
                      </span>
                    )}
                  </p>
                  
                  {/* Compact Preview List */}
                  <div className="space-y-2 mb-4">
                    {getProductsWithRecommendations().slice(0, 3).map((product, idx) => {
                      const scoreColor = getScoreColor(product.score);
                      
                      return (
                        <div 
                          key={idx} 
                          className={`flex items-center gap-2 p-2 rounded-lg transition-colors cursor-pointer ${
                            isDarkMode ? 'bg-slate-700/30 hover:bg-slate-700/50' : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                          onClick={() => { setSeoView('recommendations'); setExpandedProductId(product.product_id); }}
                        >
                          <span className={`text-sm flex-1 truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {product.product_name.substring(0, 28)}{product.product_name.length > 28 ? '...' : ''}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${scoreColor}`}>
                            {product.score}
                          </span>
                          <span className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>
                            {product.recommendations.length} issues
                          </span>
                          <span className="text-teal-400 text-xs flex items-center gap-0.5">
                            Optimize <ChevronRight size={12} />
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* View All Link */}
                  <button 
                    onClick={() => setSeoView('recommendations')}
                    className="w-full text-center text-sm text-teal-400 hover:text-teal-300 font-medium transition-colors"
                  >
                    {getActionableRecommendationCount() > 0 
                      ? `View ${getActionableRecommendationCount()} Actionable Issues →`
                      : `View All ${getTotalRecommendationCount()} Items →`
                    }
                  </button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <CheckCircle size={36} className="mx-auto mb-2 text-green-400" />
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>All Clear!</p>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-500' : 'text-gray-500'}`}>No recommendations at this time</p>
                </div>
              )}
            </div>
          </div>

          {/* Product SEO Scores Table */}
          <div className={`backdrop-blur-lg border rounded-2xl p-6 ${
            isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target size={20} className="text-blue-400" />
                <div>
                  <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Product SEO Scores
                  </h3>
                  {seoScores && seoScores.products.length > 0 && (
                    <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                      {seoScores.products.length} products • Avg Score: {seoScores.average_score || Math.round(seoScores.products.reduce((sum, p) => sum + p.score, 0) / seoScores.products.length)}/100
                    </p>
                  )}
                </div>
              </div>
              <button 
                onClick={() => { fetchSEOScores(); fetchSEORecommendations(); }}
                disabled={loadingScores}
                className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 ${
                  isDarkMode ? 'bg-slate-700 text-white hover:bg-slate-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } disabled:opacity-50`}
              >
                <RefreshCw size={12} className={loadingScores ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>

            {loadingScores ? (
              <div className="text-center py-4">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-400" />
              </div>
            ) : seoScores && seoScores.products.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                      <th className="text-left pb-3">Product</th>
                      <th className="text-center pb-3">Score</th>
                      <th className="text-center pb-3">Grade</th>
                      <th className="text-left pb-3">Top Issue</th>
                      <th className="text-center pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...seoScores.products].reverse().slice(0, 8).map((product, idx) => {
                      const gradeColor = 
                        product.grade === 'A' ? 'text-green-400 bg-green-500/20' :
                        product.grade === 'B' ? 'text-yellow-400 bg-yellow-500/20' :
                        product.grade === 'C' ? 'text-orange-400 bg-orange-500/20' :
                        'text-red-400 bg-red-500/20';
                      
                      // Filter out "no_performance_data" for display if score is good
                      const actionableRecs = product.recommendations?.filter(r => 
                        r.type !== 'no_performance_data' || product.score < 60
                      ) || [];
                      const topRec = actionableRecs[0];
                      const isOptimized = product.is_optimized || (product.score >= 75 && !actionableRecs.some(r => ['CRITICAL', 'HIGH', 'MEDIUM'].includes(r.priority)));
                      
                      return (
                        <tr key={idx} className={`border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
                          <td className={`py-3 text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {product.product_name.substring(0, 25)}{product.product_name.length > 25 && '...'}
                          </td>
                          <td className="text-center">
                            <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{product.score}</span>
                            <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>/100</span>
                          </td>
                          <td className="text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${gradeColor}`}>{product.grade}</span>
                          </td>
                          <td className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
                            {isOptimized ? (
                              <span className="text-green-400 font-medium">Optimized ✓</span>
                            ) : topRec ? (
                              <span className={topRec.priority === 'LOW' ? 'text-slate-500' : ''}>
                                {topRec.type.replace(/_/g, ' ')}
                              </span>
                            ) : (
                              <span className="text-green-400">No issues</span>
                            )}
                          </td>
                          <td className="text-center">
                            {!isOptimized && topRec && topRec.type !== 'no_performance_data' && (
                              <button onClick={() => handleFixNow(product.product_id, topRec.type)}
                                className="text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white px-2 py-1 rounded transition-colors flex items-center gap-1 mx-auto">
                                Optimize <ChevronRight size={12} />
                              </button>
                            )}
                            {isOptimized && (
                              <span className="text-xs text-green-500">✓</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className={`text-center text-sm ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>No scores available</p>
            )}
          </div>
        </div>
      )}

      {/* Meta & OG Sub-tab */}
      {activeSeoSubTab === 'meta' && renderMetaOgSubTab()}

      {/* Schema Sub-tab */}
      {activeSeoSubTab === 'schema' && renderSchemaSubTab()}

      {/* Technical Sub-tab */}
      {activeSeoSubTab === 'technical' && renderTechnicalSubTab()}

      {/* Speed Sub-tab */}
      {activeSeoSubTab === 'speed' && renderSpeedSubTab()}

      {/* Sitemap Sub-tab */}
      {activeSeoSubTab === 'sitemap' && renderSitemapSubTab()}

      {/* Redirects Sub-tab */}
      {activeSeoSubTab === 'redirects' && renderRedirectsSubTab()}

      {/* Backlinks Sub-tab */}
      {activeSeoSubTab === 'backlinks' && renderBacklinksSubTab()}

      {/* Guest Posts Sub-tab */}
      {activeSeoSubTab === 'guest-posts' && (
        <GuestPostOutreach isDarkMode={isDarkMode} />
      )}
    </div>
  );
};

export default SEOTab;
