import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';
import { useNavigate } from 'react-router';
import { Zap, AlertTriangle, TrendingUp, FileText, Tag, Image, ExternalLink, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';

// Using imported API_BASE_URL

const RecommendationsPage = () => {
  const { isDarkMode } = useAdminTheme();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllRecommendations();
  }, []);

  const fetchAllRecommendations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE_URL}/api/seo/recommendations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        // Flatten all recommendations from all priority levels
        const all = [
          ...(data.recommendations?.critical || []),
          ...(data.recommendations?.high || []),
          ...(data.recommendations?.medium || []),
          ...(data.recommendations?.low || [])
        ];
        setRecommendations(all);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL': return 'border-red-500 bg-red-500/10';
      case 'HIGH': return 'border-orange-500 bg-orange-500/10';
      case 'MEDIUM': return 'border-yellow-500 bg-yellow-500/10';
      case 'LOW': return 'border-blue-500 bg-blue-500/10';
      default: return 'border-gray-500 bg-gray-500/10';
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL': return <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400 font-medium">CRITICAL</span>;
      case 'HIGH': return <span className="px-2 py-1 text-xs rounded-full bg-orange-500/20 text-orange-400 font-medium">HIGH</span>;
      case 'MEDIUM': return <span className="px-2 py-1 text-xs rounded-full bg-yellow-500/20 text-yellow-400 font-medium">MEDIUM</span>;
      case 'LOW': return <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400 font-medium">LOW</span>;
      default: return null;
    }
  };

  const getIssueIcon = (issueType) => {
    const type = issueType?.toLowerCase() || '';
    if (type.includes('title')) return <FileText className="w-4 h-4" />;
    if (type.includes('description')) return <FileText className="w-4 h-4" />;
    if (type.includes('keyword')) return <Tag className="w-4 h-4" />;
    if (type.includes('image')) return <Image className="w-4 h-4" />;
    if (type.includes('performance') || type.includes('data')) return <TrendingUp className="w-4 h-4" />;
    return <AlertTriangle className="w-4 h-4" />;
  };

  const isFixableInEditor = (issueType) => {
    const fixableIssues = ['title_length', 'title_keywords', 'description_length', 'description_cta', 'description_missing', 'title_missing', 'keywords_count', 'image_missing', 'content_thin'];
    return fixableIssues.includes(issueType);
  };

  const handleFix = (productId, issueType) => {
    if (isFixableInEditor(issueType)) {
      // Determine which field to focus
      let focusField = 'meta_description';
      if (issueType.includes('title')) focusField = 'meta_title';
      if (issueType.includes('keyword')) focusField = 'keywords';
      
      navigate(`/admin/products?edit=${productId}&focus=${focusField}&issue=${encodeURIComponent(issueType)}`);
    }
  };

  const filteredRecommendations = recommendations.filter(rec => {
    if (filter === 'all') return true;
    return rec.priority?.toLowerCase() === filter.toLowerCase();
  });

  // Group by product
  const groupedByProduct = filteredRecommendations.reduce((acc, rec) => {
    const productId = rec.product_id;
    if (!acc[productId]) {
      acc[productId] = {
        productName: rec.product_name,
        productId: productId,
        score: rec.seo_score,
        issues: []
      };
    }
    acc[productId].issues.push(rec);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Zap className="w-7 h-7 text-yellow-400" />
            <div>
              <h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                SEO Recommendations
              </h1>
              <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {recommendations.length} recommendations across {Object.keys(groupedByProduct).length} products
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={fetchAllRecommendations}
              className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-xs transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
            <div className="flex gap-1 bg-slate-800 rounded-lg p-1">
              {['all', 'critical', 'high', 'medium', 'low'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 rounded text-xs capitalize transition-colors ${
                    filter === f 
                      ? 'bg-teal-500 text-white' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recommendations by Product */}
        <div className="space-y-4">
          {Object.values(groupedByProduct).map((product) => (
            <div key={product.productId} className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700">
              {/* Product Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-white font-semibold text-sm">{product.productName}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-slate-400 text-xs">Score: <span className="text-white font-medium">{product.score}/100</span></span>
                    <span className="text-slate-400 text-xs">{product.issues.length} issue{product.issues.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>

              {/* Issues List */}
              <div className="space-y-2.5">
                {product.issues.map((issue, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-lg border-l-4 ${getPriorityColor(issue.priority)}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="mt-0.5 text-slate-400">
                          {getIssueIcon(issue.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white text-sm font-medium">{issue.message}</span>
                            {getPriorityBadge(issue.priority)}
                          </div>
                          {issue.impact && (
                            <p className="text-xs text-green-400 mt-1">💡 Impact: {issue.impact}</p>
                          )}
                          {issue.current_value && issue.target_value && (
                            <div className="flex gap-4 mt-2 text-xs">
                              <span className="text-slate-400">Current: <span className="text-slate-300">{issue.current_value}</span></span>
                              <span className="text-slate-400">Target: <span className="text-teal-400">{issue.target_value}</span></span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Action Button */}
                      <div className="flex-shrink-0">
                        {isFixableInEditor(issue.type) ? (
                          <button
                            onClick={() => handleFix(product.productId, issue.type)}
                            className="px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-xs flex items-center gap-1.5 transition-colors font-medium"
                          >
                            Fix Now
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-500 text-xs px-3 py-1.5">
                            <TrendingUp className="w-3 h-3" />
                            <span>Needs data</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredRecommendations.length === 0 && (
          <div className="text-center py-16">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <p className="text-xl text-white font-semibold mb-2">All caught up!</p>
            <p className="text-slate-400">No recommendations match your filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendationsPage;
