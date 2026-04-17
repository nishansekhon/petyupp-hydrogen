import React, { useState } from 'react';
import { API_BASE_URL } from '@/config/api';
import { Sparkles, Check, RefreshCw, AlertCircle, Lightbulb, Wand2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const SEOSuggestionPanel = ({ issue, currentValue, fieldType, productName, onApplySuggestion }) => {
  const [suggestion, setSuggestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(false);

  const API_BASE = API_BASE_URL;

  const issueExplanations = {
    'description_cta': {
      title: '📢 Missing Call-to-Action',
      explanation: 'Your description lacks action words that encourage users to buy. Add phrases like "Shop now", "Order today", "Get yours" to increase click-through rates.',
      example: 'Example: "...grain-free treats. Shop Oye Bark India today!"'
    },
    'description cta': {
      title: '📢 Missing Call-to-Action',
      explanation: 'Your description lacks action words that encourage users to buy. Add phrases like "Shop now", "Order today", "Get yours" to increase click-through rates.',
      example: 'Example: "...grain-free treats. Shop Oye Bark India today!"'
    },
    'title_length': {
      title: '📏 Title Length Issue',
      explanation: 'Meta titles should be 50-60 characters for optimal search display. Too short = missed keywords. Too long = gets truncated.',
      example: 'Add "India" or key benefits to reach optimal length'
    },
    'title length': {
      title: '📏 Title Length Issue',
      explanation: 'Meta titles should be 50-60 characters for optimal search display. Too short = missed keywords. Too long = gets truncated.',
      example: 'Add "India" or key benefits to reach optimal length'
    },
    'description_length': {
      title: '📝 Description Too Short',
      explanation: 'Meta descriptions should be 150-160 characters. Longer descriptions provide more information in search results and get more clicks.',
      example: 'Add product benefits, ingredients, or usage tips'
    },
    'description length': {
      title: '📝 Description Too Short',
      explanation: 'Meta descriptions should be 150-160 characters. Longer descriptions provide more information in search results and get more clicks.',
      example: 'Add product benefits, ingredients, or usage tips'
    },
    'keywords_count': {
      title: '🏷️ Not Enough Keywords',
      explanation: 'Add 5-10 relevant keywords separated by commas. Include product type, benefits, and search terms customers use.',
      example: 'Example: dog treats india, healthy dog snacks, grain free'
    },
    'title_keywords': {
      title: '🔑 Missing Keywords in Title',
      explanation: 'Your title should include high-value search terms that customers actively search for.',
      example: 'Include "India", product category, or key benefits'
    }
  };

  const getIssueInfo = () => {
    const normalizedIssue = issue?.toLowerCase().replace(/_/g, ' ').trim();
    const currentLength = currentValue?.length || 0;
    
    // Dynamic explanation based on actual length
    if (normalizedIssue.includes('description') && normalizedIssue.includes('length')) {
      if (currentLength > 170) {
        return {
          title: '📏 Description Too Long',
          explanation: `Your description is ${currentLength} characters. It should be 150-160 to display fully in search results. Trim unnecessary words.`,
          example: 'Remove redundant phrases, keep key benefits and CTA'
        };
      } else if (currentLength < 120) {
        return {
          title: '📏 Description Too Short',
          explanation: `Your description is ${currentLength} characters. Add more details to reach 150-160 for better SERP display.`,
          example: 'Add product benefits, features, or call-to-action'
        };
      }
    }
    
    if (normalizedIssue.includes('title') && normalizedIssue.includes('length')) {
      if (currentLength > 70) {
        return {
          title: '📏 Title Too Long',
          explanation: `Your title is ${currentLength} characters. Should be 50-60 to prevent truncation in search results.`,
          example: 'Remove brand name or shorten product description'
        };
      } else if (currentLength < 30) {
        return {
          title: '📏 Title Too Short',
          explanation: `Your title is ${currentLength} characters. Add keywords to reach 50-60 for optimal visibility.`,
          example: 'Add "India", product type, or key benefit'
        };
      }
    }
    
    return issueExplanations[normalizedIssue] || issueExplanations[issue] || {
      title: '✨ SEO Improvement Needed',
      explanation: 'This field needs optimization for better search visibility.',
      example: 'Review field guidelines and improve content'
    };
  };

  const generateSuggestion = async () => {
    setLoading(true);
    setApplied(false);
    
    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`${API_BASE}/api/ai/seo-suggestion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_name: productName,
          current_value: currentValue,
          field_type: fieldType, // 'title' or 'description'
          issue_type: issue,
          keywords: '' // Can be populated from product data
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.suggestion) {
          setSuggestion(data.suggestion);
        } else {
          throw new Error('No suggestion received');
        }
      } else {
        throw new Error('Failed to generate suggestion');
      }
    } catch (error) {
      console.error('Error generating AI suggestion:', error);
      toast.error('AI suggestion failed. Using fallback...');
      
      // Fallback to rule-based suggestion
      let fallbackSuggestion = generateFallbackSuggestion();
      setSuggestion(fallbackSuggestion);
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackSuggestion = () => {
    let newSuggestion = currentValue || '';
    const currentLength = newSuggestion.length;
    const issueType = issue?.toLowerCase() || '';
    
    if (fieldType === 'title') {
      if (currentLength > 60) {
        // Shorten title
        newSuggestion = newSuggestion
          .replace(/\s*\|\s*Oye Bark\s*$/i, '')
          .replace(/Premium\s+/i, '')
          .substring(0, 55) + ' | OyeBark';
      } else if (currentLength < 50) {
        // Lengthen title
        if (!newSuggestion.includes('India')) {
          newSuggestion = newSuggestion.trim() + ' India | OyeBark';
        } else {
          newSuggestion = 'Buy ' + newSuggestion.trim() + ' Online | OyeBark';
        }
      }
    } else if (fieldType === 'description') {
      if (currentLength > 160) {
        // Shorten description
        const sentences = newSuggestion.match(/[^.!?]+[.!?]+/g) || [newSuggestion];
        newSuggestion = '';
        for (const sentence of sentences) {
          if ((newSuggestion + sentence).length <= 150) {
            newSuggestion += sentence;
          } else break;
        }
        if (newSuggestion.length < 145) {
          newSuggestion += ' Shop now!';
        }
      } else if (currentLength < 120) {
        // Lengthen description
        const hasCTA = /shop|buy|order|get/i.test(newSuggestion);
        if (!hasCTA) {
          newSuggestion = newSuggestion.replace(/\.\s*$/, '') + '. Shop premium quality at OyeBark India. Free shipping!';
        } else {
          newSuggestion = newSuggestion.replace(/\.\s*$/, '') + '. Made with natural ingredients for your furry friend.';
        }
      }
      
      // Add CTA if missing
      if (issueType.includes('cta') && !/shop|buy|order|get/i.test(newSuggestion.slice(-50))) {
        newSuggestion = newSuggestion.replace(/\.\s*$/, '') + '. Shop OyeBark today!';
      }
    }
    
    return newSuggestion.substring(0, fieldType === 'title' ? 65 : 165);
  };

  const applySuggestion = () => {
    if (suggestion && onApplySuggestion) {
      onApplySuggestion(suggestion);
      setApplied(true);
      toast.success('Suggestion applied!');
      setTimeout(() => setApplied(false), 2000);
    }
  };

  const issueInfo = getIssueInfo();
  const charLimit = fieldType === 'title' ? { min: 50, max: 60 } : { min: 150, max: 160 };

  return (
    <div className="mb-4 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl">
      {/* Issue Explanation */}
      <div className="flex items-start gap-3 mb-3">
        <div className="p-2 bg-amber-500/20 rounded-lg flex-shrink-0">
          <AlertCircle className="w-4 h-4 text-amber-400" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-amber-400 text-sm">{issueInfo.title}</h4>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">{issueInfo.explanation}</p>
        </div>
      </div>

      {/* Quick Tip */}
      <div className="flex items-start gap-2 mb-3 p-2.5 bg-slate-800/50 rounded-lg text-xs">
        <Lightbulb className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
        <span className="text-slate-400">{issueInfo.example}</span>
      </div>

      {/* AI Suggestion Button */}
      {!suggestion && (
        <button
          onClick={generateSuggestion}
          disabled={loading}
          className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 text-sm"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating with Claude Sonnet 4...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4" />
              Generate AI Suggestion
            </>
          )}
        </button>
      )}

      {/* Show Suggestion */}
      {suggestion && (
        <div className="space-y-2.5">
          <div className="p-3 bg-slate-800 rounded-lg border border-teal-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span className="text-xs font-medium text-teal-400">AI Suggestion (Claude Sonnet 4)</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">{suggestion}</p>
            
            {/* Character Count Comparison */}
            <div className="mt-3 flex items-center gap-4 text-xs">
              <span className={`${
                (currentValue?.length || 0) < charLimit.min || (currentValue?.length || 0) > charLimit.max + 10
                  ? 'text-red-400' 
                  : 'text-slate-400'
              }`}>
                Before: {currentValue?.length || 0} chars
              </span>
              <span className="text-slate-600">→</span>
              <span className={`font-medium ${
                suggestion.length >= charLimit.min && suggestion.length <= charLimit.max 
                  ? 'text-green-400' 
                  : suggestion.length >= charLimit.min - 10 && suggestion.length <= charLimit.max + 10
                  ? 'text-yellow-400'
                  : 'text-red-400'
              }`}>
                After: {suggestion.length} chars
                {suggestion.length >= charLimit.min && suggestion.length <= charLimit.max && ' ✓ Optimal'}
                {suggestion.length >= charLimit.min - 10 && suggestion.length < charLimit.min && ' ⚠ Slightly short'}
                {suggestion.length > charLimit.max && suggestion.length <= charLimit.max + 10 && ' ⚠ Slightly long'}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={applySuggestion}
              disabled={applied}
              className={`flex-1 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition-all text-sm ${
                applied 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-teal-500 hover:bg-teal-600 text-white'
              }`}
            >
              {applied ? (
                <>
                  <Check className="w-4 h-4" />
                  Applied!
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Apply This
                </>
              )}
            </button>
            <button
              onClick={generateSuggestion}
              disabled={loading}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center gap-2 transition-all text-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Retry
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SEOSuggestionPanel;
