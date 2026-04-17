import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Instagram, Facebook, Twitter, Youtube } from 'lucide-react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';

const NextScheduledPostCard = ({ nextPost }) => {
  const { isDarkMode } = useAdminTheme();

  const getPlatformIcon = (platformName) => {
    const name = platformName?.toLowerCase() || '';
    if (name.includes('instagram')) return Instagram;
    if (name.includes('facebook')) return Facebook;
    if (name.includes('twitter')) return Twitter;
    if (name.includes('youtube')) return Youtube;
    return Clock;
  };

  const getPlatformColor = (platformName) => {
    const name = platformName?.toLowerCase() || '';
    if (name.includes('instagram')) return 'text-pink-400';
    if (name.includes('facebook')) return 'text-blue-400';
    if (name.includes('twitter')) return 'text-sky-400';
    if (name.includes('youtube')) return 'text-red-400';
    return 'text-purple-400';
  };

  const formatTimeUntil = (dateString) => {
    if (!dateString) return 'No posts scheduled';
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.round((date - now) / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'In less than 1 hour';
    if (diffHours < 24) return `In ${diffHours} hours`;
    const diffDays = Math.round(diffHours / 24);
    if (diffDays === 1) return 'Tomorrow';
    return `In ${diffDays} days`;
  };

  const PlatformIcon = nextPost ? getPlatformIcon(nextPost.platform) : Clock;
  const platformColor = nextPost ? getPlatformColor(nextPost.platform) : 'text-purple-400';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      <div className={`p-6 rounded-2xl border ${
        isDarkMode
          ? 'bg-gradient-to-br from-purple-500/10 to-blue-500/10 border-purple-500/20'
          : 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isDarkMode ? 'bg-white/10' : 'bg-white/70'
            }`}>
              <Clock size={24} className="text-purple-400" />
            </div>
            <div>
              <div className={`text-sm font-bold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                Next Scheduled Post
              </div>
              <div className={`text-xs ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                {nextPost ? formatTimeUntil(nextPost.scheduled_date) : 'No posts scheduled'}
              </div>
            </div>
          </div>
          {nextPost && (
            <PlatformIcon size={28} className={platformColor} />
          )}
        </div>

        {nextPost && (
          <>
            <div className={`text-lg font-bold mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
              {nextPost.platform}
            </div>
            <div className={`text-sm ${isDarkMode ? 'text-pearl-white/80' : 'text-gray-700'} line-clamp-2`}>
              {nextPost.content_preview}
            </div>
            <div className="flex items-center gap-2 mt-3">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                isDarkMode
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-green-100 text-green-700'
              }`}>
                {nextPost.content_type || 'Post'}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                isDarkMode
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-blue-100 text-blue-700'
              }`}>
                Scheduled
              </span>
            </div>
          </>
        )}

        {!nextPost && (
          <div className={`text-sm text-center py-4 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
            No upcoming posts scheduled
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default NextScheduledPostCard;
