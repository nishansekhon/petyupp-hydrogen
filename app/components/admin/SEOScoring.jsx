import React, { useState, useEffect, useCallback } from 'react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle,
  AlertCircle,
  XCircle,
  Type,
  FileText,
  Link,
  Image as ImageIcon,
  Hash,
  ChevronDown,
  RefreshCw
} from 'lucide-react';

// Status indicator dot component
const StatusDot = ({ status }) => {
  const colors = {
    good: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500'
  };
  return <span className={`w-2 h-2 rounded-full ${colors[status]}`} />;
};

// Expandable row component
const CompactRow = ({ icon: Icon, label, value, status, expanded, onClick, children, isDarkMode }) => (
  <div className={`border-b last:border-b-0 ${isDarkMode ? 'border-white/5' : 'border-gray-100'}`}>
    <div 
      className={`flex items-center gap-2 py-2 px-3 cursor-pointer hover:bg-white/5 transition-colors ${expanded ? (isDarkMode ? 'bg-white/5' : 'bg-gray-50') : ''}`}
      onClick={onClick}
    >
      <StatusDot status={status} />
      <Icon size={14} className={isDarkMode ? 'text-slate-400' : 'text-gray-500'} />
      <span className={`text-xs font-medium flex-1 ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{label}</span>
      <span className={`text-xs font-semibold ${status === 'good' ? 'text-green-500' : status === 'warning' ? 'text-yellow-500' : 'text-red-400'}`}>
        {value}
      </span>
      <ChevronDown size={12} className={`transition-transform ${expanded ? 'rotate-180' : ''} ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`} />
    </div>
    <AnimatePresence>
      {expanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className={`px-3 pb-2 pt-1 text-xs ${isDarkMode ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

function SEOScoring({ 
  title, 
  content, 
  metaDescription, 
  focusKeyword,
  featuredImage,
  slug,
  onScoreChange 
}) {
  const { isDarkMode } = useAdminTheme();
  const [score, setScore] = useState(0);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

  const extractHeadings = (html) => {
    if (!html) return { h1: 0, h2: 0, h3: 0 };
    const h1Count = (html.match(/<h1[^>]*>/gi) || []).length;
    const h2Count = (html.match(/<h2[^>]*>/gi) || []).length;
    const h3Count = (html.match(/<h3[^>]*>/gi) || []).length;
    return { h1: h1Count, h2: h2Count, h3: h3Count };
  };

  const calculateKeywordDensity = (html, keyword) => {
    if (!keyword || !html) return 0;
    const text = html.replace(/<[^>]*>/g, ' ').toLowerCase();
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const keywordLower = keyword.toLowerCase();
    const keywordCount = words.filter(word => word.includes(keywordLower)).length;
    return words.length > 0 ? (keywordCount / words.length) * 100 : 0;
  };

  const countLinks = (html) => {
    if (!html) return { internal: 0, external: 0 };
    // Internal links: relative paths OR absolute oyebark.com URLs
    const relativeLinks = (html.match(/<a[^>]+href=["']\/[^"']*["']/gi) || []).length;
    const absoluteInternalLinks = (html.match(/<a[^>]+href=["']https?:\/\/(?:www\.)?oyebark\.com[^"']*["']/gi) || []).length;
    const internalCount = relativeLinks + absoluteInternalLinks;
    // External links: any https:// that is NOT oyebark.com
    const allExternalMatches = html.match(/<a[^>]+href=["']https?:\/\/[^"']+["']/gi) || [];
    const externalCount = allExternalMatches.filter(link => !link.toLowerCase().includes('oyebark.com')).length;
    return { internal: internalCount, external: externalCount };
  };

  const countSyllables = (word) => {
    word = word.toLowerCase();
    if (word.length <= 3) return 1;
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  };

  const calculateReadability = (html) => {
    if (!html) return 0;
    const text = html.replace(/<[^>]*>/g, ' ');
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = text.split(/\s+/).filter(w => w.length > 0);
    if (sentences.length === 0 || words.length === 0) return 0;
    const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);
    const scoreVal = 206.835 - 1.015 * (words.length / sentences.length) - 84.6 * (syllables / words.length);
    return Math.max(0, Math.min(100, Math.round(scoreVal)));
  };

  const analyzeContent = useCallback(async () => {
    try {
      setAnalyzing(true);
      
      // Calculate local metrics - Fixed word count parsing
      const plainText = content?.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim() || '';
      const wordCount = plainText.split(/\s+/).filter(word => word.length > 0).length;
      const titleLength = title?.length || 0;
      const metaDescLength = metaDescription?.length || 0;
      const hasImage = !!featuredImage && (typeof featuredImage === 'string' || featuredImage?.url);
      
      // Extract headings from content
      const headings = extractHeadings(content);
      
      // Calculate keyword density
      const keywordDensity = focusKeyword 
        ? calculateKeywordDensity(content, focusKeyword) 
        : 0;
      
      // Check if keyword in title, meta, URL
      const keywordInTitle = focusKeyword && title 
        ? title.toLowerCase().includes(focusKeyword.toLowerCase())
        : false;
      const keywordInMeta = focusKeyword && metaDescription
        ? metaDescription.toLowerCase().includes(focusKeyword.toLowerCase())
        : false;
      const keywordInURL = focusKeyword && slug
        ? slug.toLowerCase().includes(focusKeyword.toLowerCase().replace(/\s+/g, '-'))
        : false;

      // Count internal/external links
      const { internal, external } = countLinks(content);
      
      // Calculate readability
      const readability = calculateReadability(content);

      // Keyword checks summary
      const keywordChecks = [keywordInTitle, keywordInMeta, keywordInURL, keywordDensity >= 0.5];
      const keywordsPassed = keywordChecks.filter(Boolean).length;

      // Build compact analysis
      const analysisData = {
        title: {
          value: titleLength,
          status: titleLength >= 50 && titleLength <= 60 ? 'good' : titleLength > 30 && titleLength <= 70 ? 'warning' : 'error',
          label: `${titleLength} chars`,
          target: '50-60 chars',
          details: titleLength >= 50 && titleLength <= 60 
            ? 'Perfect length for search results' 
            : titleLength > 70 ? 'Too long - may be truncated' : 'Too short - add more keywords'
        },
        keywords: {
          value: keywordsPassed,
          status: keywordsPassed >= 3 ? 'good' : keywordsPassed >= 2 ? 'warning' : 'error',
          label: `${keywordsPassed}/4 passed`,
          target: '4/4 passed',
          checks: [
            { name: 'In Title', passed: keywordInTitle },
            { name: 'In Meta', passed: keywordInMeta },
            { name: 'In URL', passed: keywordInURL },
            { name: 'Density 0.5-2.5%', passed: keywordDensity >= 0.5 && keywordDensity <= 2.5 }
          ],
          focusKeyword: focusKeyword || 'Not set'
        },
        meta: {
          value: metaDescLength,
          status: metaDescLength >= 150 && metaDescLength <= 160 ? 'good' : metaDescLength > 100 && metaDescLength <= 170 ? 'warning' : 'error',
          label: `${metaDescLength} chars`,
          target: '150-160 chars',
          details: metaDescLength >= 150 && metaDescLength <= 160 
            ? 'Perfect length' 
            : metaDescLength > 160 ? 'Too long' : 'Too short - expand description'
        },
        content: {
          value: wordCount,
          status: wordCount >= 300 ? 'good' : wordCount >= 100 ? 'warning' : 'error',
          label: `${wordCount} words`,
          headings: `H1:${headings.h1} H2:${headings.h2}`,
          readability: readability >= 60 ? 'Easy' : readability >= 40 ? 'Medium' : 'Hard',
          readabilityScore: readability,
          target: '300+ words',
          details: `Readability: ${readability}/100`
        },
        image: {
          value: hasImage,
          status: hasImage ? 'good' : 'error',
          label: hasImage ? 'Added' : 'Missing',
          target: 'Required',
          details: hasImage ? 'Featured image set' : 'Add a featured image for better engagement'
        },
        links: {
          internal: internal,
          external: external,
          status: internal >= 2 && external >= 1 ? 'good' : (internal >= 1 || external >= 1) ? 'warning' : 'error',
          label: `${internal} int, ${external} ext`,
          target: '2+ int, 1+ ext',
          details: `Internal: ${internal}/2, External: ${external}/1`
        }
      };

      // Calculate total score
      const checks = [
        { status: analysisData.title.status, weight: 15 },
        { status: analysisData.keywords.status, weight: 25 },
        { status: analysisData.meta.status, weight: 15 },
        { status: analysisData.content.status, weight: 20 },
        { status: analysisData.image.status, weight: 10 },
        { status: analysisData.links.status, weight: 15 }
      ];
      
      let totalScore = 0;
      let maxScore = 0;
      checks.forEach(check => {
        maxScore += check.weight;
        if (check.status === 'good') totalScore += check.weight;
        else if (check.status === 'warning') totalScore += check.weight * 0.5;
      });

      const calculatedScore = Math.round((totalScore / maxScore) * 100);
      
      setScore(calculatedScore);
      setAnalysis(analysisData);
      if (onScoreChange) onScoreChange(calculatedScore);
      
    } catch (error) {
      console.error('SEO analysis failed:', error);
    } finally {
      setAnalyzing(false);
    }
  }, [title, content, metaDescription, focusKeyword, featuredImage, slug, onScoreChange]);

  // Auto-analyze when content changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (title || content) {
        analyzeContent();
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [title, content, metaDescription, focusKeyword, featuredImage, analyzeContent]);

  const getScoreColor = () => {
    if (score >= 80) return { bg: 'bg-green-500', text: 'text-green-500', ring: 'ring-green-500/30' };
    if (score >= 60) return { bg: 'bg-yellow-500', text: 'text-yellow-500', ring: 'ring-yellow-500/30' };
    return { bg: 'bg-red-500', text: 'text-red-500', ring: 'ring-red-500/30' };
  };

  const getScoreLabel = () => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
  };

  const scoreColors = getScoreColor();

  return (
    <div className={`rounded-xl border ${isDarkMode ? 'bg-slate-900/80 border-slate-700' : 'bg-white border-gray-200'} overflow-hidden`}>
      {/* Compact Header with Score */}
      <div className={`p-3 flex items-center gap-3 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
        {/* Small Score Circle */}
        <div className={`relative w-14 h-14 flex-shrink-0`}>
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="none"
              className={isDarkMode ? 'text-slate-700' : 'text-gray-200'} />
            <circle cx="28" cy="28" r="24" strokeWidth="4" fill="none" strokeLinecap="round"
              strokeDasharray={`${score * 1.51} 151`}
              className={`${scoreColors.text} transition-all duration-500`}
              style={{ stroke: 'currentColor' }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-sm font-bold ${scoreColors.text}`}>{score}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            SEO Score
          </div>
          <div className={`text-xs ${scoreColors.text}`}>{getScoreLabel()}</div>
        </div>
        <button
          onClick={analyzeContent}
          disabled={analyzing}
          className={`p-1.5 rounded-lg ${isDarkMode ? 'hover:bg-slate-700' : 'hover:bg-gray-100'} transition-colors`}
          title="Re-analyze"
        >
          <RefreshCw size={14} className={`${analyzing ? 'animate-spin' : ''} ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`} />
        </button>
      </div>

      {/* Compact Checklist */}
      {analysis && (
        <div className="divide-y divide-transparent">
          <CompactRow
            icon={Type}
            label="Title"
            value={analysis.title.label}
            status={analysis.title.status}
            expanded={expandedRow === 'title'}
            onClick={() => setExpandedRow(expandedRow === 'title' ? null : 'title')}
            isDarkMode={isDarkMode}
          >
            <div className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
              <div>Target: {analysis.title.target}</div>
              <div className="mt-1">{analysis.title.details}</div>
            </div>
          </CompactRow>

          <CompactRow
            icon={Hash}
            label="Keywords"
            value={analysis.keywords.label}
            status={analysis.keywords.status}
            expanded={expandedRow === 'keywords'}
            onClick={() => setExpandedRow(expandedRow === 'keywords' ? null : 'keywords')}
            isDarkMode={isDarkMode}
          >
            <div className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
              <div className="mb-1">Focus: <span className="font-medium text-purple-400">{analysis.keywords.focusKeyword}</span></div>
              {analysis.keywords.checks.map((check, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  {check.passed ? <CheckCircle size={10} className="text-green-500" /> : <XCircle size={10} className="text-red-400" />}
                  <span>{check.name}</span>
                </div>
              ))}
            </div>
          </CompactRow>

          <CompactRow
            icon={FileText}
            label="Meta"
            value={analysis.meta.label}
            status={analysis.meta.status}
            expanded={expandedRow === 'meta'}
            onClick={() => setExpandedRow(expandedRow === 'meta' ? null : 'meta')}
            isDarkMode={isDarkMode}
          >
            <div className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
              <div>Target: {analysis.meta.target}</div>
              <div className="mt-1">{analysis.meta.details}</div>
            </div>
          </CompactRow>

          <CompactRow
            icon={FileText}
            label="Content"
            value={`${analysis.content.label} | ${analysis.content.headings}`}
            status={analysis.content.status}
            expanded={expandedRow === 'content'}
            onClick={() => setExpandedRow(expandedRow === 'content' ? null : 'content')}
            isDarkMode={isDarkMode}
          >
            <div className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
              <div>Target: {analysis.content.target}</div>
              <div>Readability: {analysis.content.readability} ({analysis.content.readabilityScore}/100)</div>
              <div>Structure: {analysis.content.headings}</div>
            </div>
          </CompactRow>

          <CompactRow
            icon={ImageIcon}
            label="Image"
            value={analysis.image.label}
            status={analysis.image.status}
            expanded={expandedRow === 'image'}
            onClick={() => setExpandedRow(expandedRow === 'image' ? null : 'image')}
            isDarkMode={isDarkMode}
          >
            <div className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
              {analysis.image.details}
            </div>
          </CompactRow>

          <CompactRow
            icon={Link}
            label="Links"
            value={analysis.links.label}
            status={analysis.links.status}
            expanded={expandedRow === 'links'}
            onClick={() => setExpandedRow(expandedRow === 'links' ? null : 'links')}
            isDarkMode={isDarkMode}
          >
            <div className={isDarkMode ? 'text-slate-400' : 'text-gray-600'}>
              <div>Target: {analysis.links.target}</div>
              <div className="flex items-center gap-1.5 mt-1">
                {analysis.links.internal >= 2 ? <CheckCircle size={10} className="text-green-500" /> : <AlertCircle size={10} className="text-yellow-500" />}
                <span>Internal: {analysis.links.internal}/2</span>
              </div>
              <div className="flex items-center gap-1.5">
                {analysis.links.external >= 1 ? <CheckCircle size={10} className="text-green-500" /> : <AlertCircle size={10} className="text-yellow-500" />}
                <span>External: {analysis.links.external}/1</span>
              </div>
            </div>
          </CompactRow>
        </div>
      )}
    </div>
  );
}

export default SEOScoring;
