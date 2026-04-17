import React, { useState } from 'react';
import { API_BASE_URL } from '@/config/api';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { Search, TrendingUp, AlertCircle, CheckCircle, Loader, Sparkles, Target, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const KeywordResearch = ({ onKeywordSelect }) => {
  const { isDarkMode } = useAdminTheme();
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(true);

  const researchKeywords = async () => {
    if (!topic.trim()) {
      setError('Please enter a topic');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const API_BASE = API_BASE_URL;
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch(`${API_BASE}/api/ai/keyword-research`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ topic, target_country: 'india' })
      });

      if (!response.ok) {
        throw new Error('Research failed');
      }

      const data = await response.json();
      setResults(data);
      setExpanded(true);
    } catch (err) {
      setError('Failed to research keywords. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const KeywordCard = ({ keyword, onSelect }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-lg border transition-all ${
        isDarkMode 
          ? 'bg-obsidian-light border-white/10 hover:border-electric-coral/50'
          : 'bg-white border-gray-200 hover:border-purple-300'
      } hover:shadow-lg`}
    >
      <div className="flex justify-between items-start mb-3">
        <h4 className={`font-semibold text-base ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
          {keyword.keyword}
        </h4>
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
          keyword.relevance_score >= 85 
            ? 'bg-cyber-lime/20 text-cyber-lime'
            : keyword.relevance_score >= 70
            ? 'bg-electric-coral/20 text-electric-coral'
            : 'bg-deep-purple/20 text-deep-purple'
        }`}>
          {keyword.relevance_score}/100
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={14} className={isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'} />
          <div>
            <span className={`${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'} text-xs`}>Volume</span>
            <p className={`font-medium ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>{keyword.search_volume}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Target size={14} className={isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'} />
          <div>
            <span className={`${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'} text-xs`}>Difficulty</span>
            <p className={`font-medium ${
              keyword.difficulty === 'Easy' ? 'text-cyber-lime' : 
              keyword.difficulty === 'Medium' ? 'text-electric-coral' : 'text-red-500'
            }`}>
              {keyword.difficulty}
            </p>
          </div>
        </div>
        <div>
          <span className={`${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'} text-xs`}>Competition</span>
          <p className={`font-medium ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>{keyword.competition}</p>
        </div>
        <div>
          <span className={`${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'} text-xs`}>CPC</span>
          <p className={`font-medium ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>{keyword.cpc}</p>
        </div>
      </div>

      <button
        onClick={() => onKeywordSelect(keyword.keyword)}
        className="w-full py-2 bg-gradient-to-r from-[#6366F1] to-[#EC4899] text-white rounded-lg font-semibold hover:shadow-lg transition-all"
      >
        Use This Keyword
      </button>
    </motion.div>
  );

  return (
    <div className={`rounded-xl border mb-6 overflow-hidden ${
      isDarkMode ? 'bg-obsidian-light border-white/10' : 'bg-white border-gray-200'
    }`}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full p-6 flex items-center justify-between ${
          isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'
        } transition-colors`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#EC4899] flex items-center justify-center">
            <Sparkles className="text-white" size={20} />
          </div>
          <div className="text-left">
            <h3 className={`text-xl font-black ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
              🤖 AI Keyword Research
            </h3>
            <p className={`text-sm ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
              Find high-value keywords for your blog post
            </p>
          </div>
        </div>
        {expanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
      </button>

      {/* Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t"
            style={{ borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
          >
            <div className="p-6">
              {/* Search Input */}
              <div className="mb-6">
                <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                  What topic do you want to write about?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., best dog treats for indian breeds"
                    className={`flex-1 px-4 py-3 rounded-lg border ${
                      isDarkMode 
                        ? 'bg-obsidian border-white/10 text-pearl-white placeholder-pearl-white/40'
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                    } focus:outline-none focus:ring-2 focus:ring-deep-purple`}
                    onKeyPress={(e) => e.key === 'Enter' && researchKeywords()}
                  />
                  <motion.button
                    onClick={researchKeywords}
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-[#6366F1] to-[#EC4899] text-white rounded-lg font-semibold disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {loading ? (
                      <>
                        <Loader className="animate-spin" size={20} />
                        Researching...
                      </>
                    ) : (
                      <>
                        <Search size={20} />
                        Research
                      </>
                    )}
                  </motion.button>
                </div>
                {error && (
                  <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                    <AlertCircle size={16} />
                    {error}
                  </p>
                )}
              </div>

              {/* Results */}
              {results && (
                <div className="space-y-6">
                  {/* Primary Keywords */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="text-cyber-lime" size={20} />
                      <h4 className={`font-bold text-lg ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                        Primary Keywords (High Value)
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {results.primary_keywords.map((keyword, idx) => (
                        <KeywordCard
                          key={idx}
                          keyword={keyword}
                          onSelect={onKeywordSelect}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Related Keywords */}
                  <div>
                    <h4 className={`font-bold text-lg mb-3 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                      📝 Related Keywords
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {results.related_keywords.map((keyword, idx) => (
                        <motion.button
                          key={idx}
                          onClick={() => onKeywordSelect(keyword.keyword)}
                          className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                            isDarkMode 
                              ? 'bg-white/10 text-pearl-white hover:bg-white/20'
                              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                          }`}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {keyword.keyword}
                          <span className={`ml-2 text-xs ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                            ({keyword.search_volume})
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Questions */}
                  <div>
                    <h4 className={`font-bold text-lg mb-3 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                      ❓ Questions People Ask
                    </h4>
                    <div className="space-y-2">
                      {results.questions.map((question, idx) => (
                        <div 
                          key={idx}
                          className={`flex items-start gap-2 p-3 rounded-lg ${
                            isDarkMode ? 'bg-white/5' : 'bg-gray-50'
                          }`}
                        >
                          <CheckCircle size={18} className="text-cyber-lime mt-0.5 flex-shrink-0" />
                          <span className={`text-sm ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                            {question}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Competitor Insights */}
                  <div className={`p-4 rounded-lg ${
                    isDarkMode ? 'bg-deep-purple/20 border border-deep-purple/30' : 'bg-blue-50 border border-blue-200'
                  }`}>
                    <h4 className={`font-bold text-lg mb-3 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                      🏆 Competitor Analysis
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <span className={isDarkMode ? 'text-pearl-white/70' : 'text-gray-700'}>Avg word count:</span>
                        <span className={`font-semibold ml-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                          {results.competitor_insights.avg_word_count}
                        </span>
                      </div>
                      <div>
                        <span className={isDarkMode ? 'text-pearl-white/70' : 'text-gray-700'}>Avg images:</span>
                        <span className={`font-semibold ml-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                          {results.competitor_insights.avg_images}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-pearl-white/70' : 'text-gray-700'}`}>
                        Common sections:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {results.competitor_insights.common_sections.map((section, idx) => (
                          <span 
                            key={idx}
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              isDarkMode ? 'bg-white/10 text-pearl-white' : 'bg-white text-gray-900'
                            }`}
                          >
                            {section}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    {results.competitor_insights.content_gaps && results.competitor_insights.content_gaps.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold mb-2 text-cyber-lime flex items-center gap-1">
                          💡 Content Opportunities:
                        </p>
                        <ul className="text-sm space-y-1">
                          {results.competitor_insights.content_gaps.map((gap, idx) => (
                            <li key={idx} className={isDarkMode ? 'text-pearl-white/80' : 'text-gray-800'}>
                              • {gap}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default KeywordResearch;
