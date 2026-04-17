import React from 'react';
import { motion } from 'framer-motion';
import { FileText, ChevronRight } from 'lucide-react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';

const DraftsCounterCard = ({ draftsCount = 5, onShowDrafts }) => {
  const { isDarkMode } = useAdminTheme();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <button
        onClick={onShowDrafts}
        className={`w-full group relative p-6 rounded-2xl border transition-all ${
          isDarkMode
            ? 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20 hover:border-yellow-500/40 hover:from-yellow-500/15 hover:to-orange-500/15'
            : 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 hover:border-yellow-300 hover:shadow-md'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
              isDarkMode ? 'bg-yellow-500/20' : 'bg-yellow-100'
            }`}>
              <FileText size={32} className="text-yellow-500" />
            </div>
            <div className="text-left">
              <div className={`text-3xl font-black ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                {draftsCount}
              </div>
              <div className={`text-sm font-semibold ${isDarkMode ? 'text-pearl-white/80' : 'text-gray-700'}`}>
                Drafts Awaiting Review
              </div>
              <div className={`text-xs mt-1 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                ⚠️ Action Required
              </div>
            </div>
          </div>
          <ChevronRight 
            size={24} 
            className={`transition-transform group-hover:translate-x-1 ${
              isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'
            }`}
          />
        </div>
      </button>
    </motion.div>
  );
};

export default DraftsCounterCard;
