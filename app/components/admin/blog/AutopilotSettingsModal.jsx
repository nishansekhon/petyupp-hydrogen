/**
 * AutopilotSettingsModal Component
 * 
 * Full settings modal for Blog Autopilot with sections:
 * - Schedule (time, frequency, publish days)
 * - Topic Sources (calendar, keywords, trending)
 * - Quality Thresholds (min SEO score, min word count, max regenerate attempts)
 * - Distribution Platforms (Twitter, Instagram, Facebook, LinkedIn)
 * - Telegram (bot token, chat ID, test notification)
 * - Approval Mode (Telegram or Auto-publish)
 */

import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';
import { 
  X, Loader2, Clock, Calendar, Key, TrendingUp, 
  Settings, Globe, MessageCircle, Plus, Send
} from 'lucide-react';
import { toast } from 'react-toastify';

const AutopilotSettingsModal = ({ isOpen, onClose, settings: initialSettings, onSettingsSaved }) => {
  const [settings, setSettings] = useState({
    publish_time: '10:00',
    frequency: '2_per_week',
    publish_days: [1, 3, 5],
    topic_sources: {
      calendar: true,
      keywords: true,
      trending: true
    },
    keywords: [],
    used_keywords_count: 0,
    min_seo_score: 75,
    min_word_count: 500,
    max_regenerate_attempts: 1,
    distribution_platforms: {
      twitter: false,
      instagram: false,
      facebook: false,
      linkedin: false
    },
    telegram_bot_token: '',
    telegram_chat_id: '',
    approval_mode: 'telegram'
  });
  const [newKeyword, setNewKeyword] = useState('');
  const [saving, setSaving] = useState(false);
  const [testingTelegram, setTestingTelegram] = useState(false);
  
  // Track if user actually changed the Telegram credentials
  const [tokenChanged, setTokenChanged] = useState(false);
  const [chatIdChanged, setChatIdChanged] = useState(false);
  
  // Store original masked values for display
  const [maskedToken, setMaskedToken] = useState('');
  const [maskedChatId, setMaskedChatId] = useState('');

  useEffect(() => {
    if (initialSettings) {
      // Extract keyword strings from used_keywords array if keywords field is not available
      const keywordsFromUsed = initialSettings.used_keywords 
        ? initialSettings.used_keywords.map(k => typeof k === 'string' ? k : k.keyword)
        : [];
      
      setSettings(prev => ({
        ...prev,
        ...initialSettings,
        topic_sources: initialSettings.topic_sources || prev.topic_sources,
        distribution_platforms: initialSettings.distribution_platforms || prev.distribution_platforms,
        // Use dedicated keywords array if available, otherwise extract from used_keywords
        keywords: initialSettings.keywords?.length > 0 
          ? initialSettings.keywords 
          : keywordsFromUsed,
        used_keywords_count: initialSettings.used_keywords?.length || 0,
        publish_days: initialSettings.publish_days || prev.publish_days,
        // Display masked values for credentials (don't store actual values in state)
        telegram_bot_token: '',
        telegram_chat_id: ''
      }));
      
      // Store masked versions for display
      if (initialSettings.telegram_bot_token) {
        setMaskedToken(maskToken(initialSettings.telegram_bot_token));
      }
      if (initialSettings.telegram_chat_id) {
        setMaskedChatId(maskChatId(initialSettings.telegram_chat_id));
      }
      
      // Reset change tracking
      setTokenChanged(false);
      setChatIdChanged(false);
    }
  }, [initialSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Build payload excluding unchanged credentials
      const payload = { ...settings };
      
      // Only include telegram_bot_token if user actually changed it
      if (!tokenChanged) {
        delete payload.telegram_bot_token;
      }
      
      // Only include telegram_chat_id if user actually changed it
      if (!chatIdChanged) {
        delete payload.telegram_chat_id;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/blog/autopilot/settings/full`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        toast.success('Settings saved successfully');
        if (onSettingsSaved) onSettingsSaved();
        onClose();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleTestTelegram = async () => {
    if (!settings.telegram_bot_token || !settings.telegram_chat_id) {
      toast.error('Please enter Telegram bot token and chat ID');
      return;
    }
    
    setTestingTelegram(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/blog/autopilot/telegram/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bot_token: settings.telegram_bot_token,
          chat_id: settings.telegram_chat_id
        })
      });
      
      if (response.ok) {
        toast.success('Test message sent successfully!');
      } else {
        toast.error('Failed to send test message');
      }
    } catch (error) {
      console.error('Failed to test Telegram:', error);
      toast.error('Failed to send test message');
    } finally {
      setTestingTelegram(false);
    }
  };

  const togglePublishDay = (day) => {
    setSettings(prev => ({
      ...prev,
      publish_days: prev.publish_days.includes(day)
        ? prev.publish_days.filter(d => d !== day)
        : [...prev.publish_days, day].sort((a, b) => a - b)
    }));
  };

  const toggleTopicSource = (source) => {
    setSettings(prev => ({
      ...prev,
      topic_sources: {
        ...prev.topic_sources,
        [source]: !prev.topic_sources[source]
      }
    }));
  };

  const togglePlatform = (platform) => {
    setSettings(prev => ({
      ...prev,
      distribution_platforms: {
        ...prev.distribution_platforms,
        [platform]: !prev.distribution_platforms[platform]
      }
    }));
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !settings.keywords.includes(newKeyword.trim())) {
      setSettings(prev => ({
        ...prev,
        keywords: [...prev.keywords, newKeyword.trim()]
      }));
      setNewKeyword('');
    }
  };

  const removeKeyword = (keyword) => {
    setSettings(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  const maskToken = (token) => {
    if (!token) return '';
    if (token.length <= 4) return '****';
    return '•'.repeat(token.length - 4) + token.slice(-4);
  };
  
  const maskChatId = (chatId) => {
    if (!chatId) return '';
    const str = String(chatId);
    if (str.length <= 4) return '****';
    return '•'.repeat(str.length - 4) + str.slice(-4);
  };
  
  // Handle token input change
  const handleTokenChange = (e) => {
    const newValue = e.target.value;
    setSettings(prev => ({ ...prev, telegram_bot_token: newValue }));
    setTokenChanged(true);
  };
  
  // Handle chat ID input change
  const handleChatIdChange = (e) => {
    const newValue = e.target.value;
    setSettings(prev => ({ ...prev, telegram_chat_id: newValue }));
    setChatIdChanged(true);
  };

  const days = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' }
  ];

  const frequencies = [
    { value: '1_per_week', label: '1 per week' },
    { value: '2_per_week', label: '2 per week' },
    { value: '3_per_week', label: '3 per week' },
    { value: 'daily', label: 'Daily' }
  ];

  const platforms = [
    { key: 'twitter', label: 'Twitter', color: '#1DA1F2' },
    { key: 'instagram', label: 'Instagram', color: '#E4405F' },
    { key: 'facebook', label: 'Facebook', color: '#1877F2' },
    { key: 'linkedin', label: 'LinkedIn', color: '#0A66C2' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 md:p-4" data-testid="autopilot-settings-modal">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 md:px-6 py-4 border-b border-slate-700 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-teal-500/15 rounded-xl p-2">
              <Settings className="w-5 h-5 text-teal-400" />
            </div>
            <h2 className="text-lg font-bold text-white">Autopilot Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Section A: Schedule */}
          <div className="px-4 md:px-6 py-5 border-b border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-teal-400" />
              <h3 className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Schedule</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block">Publish Time</label>
                <input
                  type="time"
                  value={settings.publish_time}
                  onChange={(e) => setSettings(prev => ({ ...prev, publish_time: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg text-sm text-white px-3 py-2 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  data-testid="publish-time-input"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block">Frequency</label>
                <select
                  value={settings.frequency}
                  onChange={(e) => setSettings(prev => ({ ...prev, frequency: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg text-sm text-white px-3 py-2 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  data-testid="frequency-select"
                >
                  {frequencies.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block">Publish Days</label>
              <div className="flex gap-1">
                {days.map(day => (
                  <button
                    key={day.value}
                    onClick={() => togglePublishDay(day.value)}
                    className={`flex-1 min-h-[44px] py-2 text-xs rounded-lg font-medium transition-colors ${
                      settings.publish_days.includes(day.value)
                        ? 'bg-teal-500 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                    data-testid={`day-${day.value}`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section B: Topic Sources */}
          <div className="px-4 md:px-6 py-5 border-b border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <Key className="w-4 h-4 text-teal-400" />
              <h3 className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Topic Sources</h3>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => toggleTopicSource('calendar')}
                className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors ${
                  settings.topic_sources?.calendar
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-slate-700 text-slate-300 border border-slate-600'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Calendar
              </button>
              <button
                onClick={() => toggleTopicSource('keywords')}
                className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors ${
                  settings.topic_sources?.keywords
                    ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30'
                    : 'bg-slate-700 text-slate-300 border border-slate-600'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                Keywords
              </button>
              <button
                onClick={() => toggleTopicSource('trending')}
                className={`px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors ${
                  settings.topic_sources?.trending
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'bg-slate-700 text-slate-300 border border-slate-600'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                Trending
              </button>
            </div>
            
            {/* Keywords List */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Keywords</label>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">
                    {settings.keywords?.length || 0} keywords
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {settings.used_keywords_count || 0}/{settings.keywords?.length || 0} used this cycle
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {settings.keywords?.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-700 text-slate-300 rounded-lg text-xs"
                  >
                    {keyword}
                    <button
                      onClick={() => removeKeyword(keyword)}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                  placeholder="Add keyword..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white px-3 py-2 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  data-testid="add-keyword-input"
                />
                <button
                  onClick={addKeyword}
                  className="px-3 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg transition-colors"
                  data-testid="add-keyword-btn"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Section C: Quality Thresholds */}
          <div className="px-4 md:px-6 py-5 border-b border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-4 h-4 text-teal-400" />
              <h3 className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Quality Thresholds</h3>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block">Min SEO Score</label>
                <input
                  type="number"
                  value={settings.min_seo_score}
                  onChange={(e) => setSettings(prev => ({ ...prev, min_seo_score: parseInt(e.target.value) || 75 }))}
                  min={0}
                  max={100}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg text-sm text-white px-3 py-2 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  data-testid="min-seo-score-input"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block">Min Words</label>
                <input
                  type="number"
                  value={settings.min_word_count}
                  onChange={(e) => setSettings(prev => ({ ...prev, min_word_count: parseInt(e.target.value) || 500 }))}
                  min={100}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg text-sm text-white px-3 py-2 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  data-testid="min-word-count-input"
                />
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block">Max Retries</label>
                <input
                  type="number"
                  value={settings.max_regenerate_attempts}
                  onChange={(e) => setSettings(prev => ({ ...prev, max_regenerate_attempts: parseInt(e.target.value) || 1 }))}
                  min={0}
                  max={5}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg text-sm text-white px-3 py-2 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  data-testid="max-retries-input"
                />
              </div>
            </div>
          </div>

          {/* Section D: Distribution Platforms */}
          <div className="px-4 md:px-6 py-5 border-b border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4 text-teal-400" />
              <h3 className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Distribution Platforms</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {platforms.map(platform => (
                <button
                  key={platform.key}
                  onClick={() => togglePlatform(platform.key)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-colors ${
                    settings.distribution_platforms?.[platform.key]
                      ? 'bg-slate-700/50 border-teal-500/50'
                      : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                  }`}
                  data-testid={`platform-${platform.key}`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: platform.color }}
                    />
                    <span className="text-sm text-slate-200">{platform.label}</span>
                  </div>
                  <div className={`w-10 h-5 rounded-full transition-colors ${
                    settings.distribution_platforms?.[platform.key] ? 'bg-teal-500' : 'bg-slate-600'
                  }`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform mt-0.5 ${
                      settings.distribution_platforms?.[platform.key] ? 'translate-x-5' : 'translate-x-0.5'
                    }`} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Section E: Telegram */}
          <div className="px-4 md:px-6 py-5 border-b border-slate-700">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="w-4 h-4 text-teal-400" />
              <h3 className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Telegram</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block">Bot Token</label>
                <input
                  type="text"
                  value={tokenChanged ? settings.telegram_bot_token : ''}
                  onChange={handleTokenChange}
                  placeholder={maskedToken || 'Enter bot token...'}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg text-sm text-white px-3 py-2 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  data-testid="telegram-token-input"
                />
                {maskedToken && !tokenChanged && (
                  <p className="text-xs text-slate-500 mt-1">Current: {maskedToken} (leave empty to keep existing)</p>
                )}
              </div>
              <div>
                <label className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 block">Chat ID</label>
                <input
                  type="text"
                  value={chatIdChanged ? settings.telegram_chat_id : ''}
                  onChange={handleChatIdChange}
                  placeholder={maskedChatId || 'Enter chat ID...'}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg text-sm text-white px-3 py-2 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  data-testid="telegram-chat-id-input"
                />
                {maskedChatId && !chatIdChanged && (
                  <p className="text-xs text-slate-500 mt-1">Current: {maskedChatId} (leave empty to keep existing)</p>
                )}
              </div>
              <button
                onClick={handleTestTelegram}
                disabled={testingTelegram}
                className="px-4 py-2 border border-slate-600 text-slate-300 hover:border-teal-500 hover:text-teal-400 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                data-testid="test-telegram-btn"
              >
                {testingTelegram ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Test Notification
              </button>
            </div>
          </div>

          {/* Section F: Approval Mode */}
          <div className="px-4 md:px-6 py-5">
            <div className="flex items-center gap-2 mb-4">
              <Settings className="w-4 h-4 text-teal-400" />
              <h3 className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Approval Mode</h3>
            </div>
            
            <div className="space-y-3">
              <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                settings.approval_mode === 'telegram'
                  ? 'bg-slate-700/50 border-teal-500/50'
                  : 'bg-slate-800 border-slate-700 hover:border-slate-600'
              }`}>
                <input
                  type="radio"
                  name="approval_mode"
                  value="telegram"
                  checked={settings.approval_mode === 'telegram'}
                  onChange={(e) => setSettings(prev => ({ ...prev, approval_mode: e.target.value }))}
                  className="w-4 h-4 text-teal-500 bg-slate-700 border-slate-600 focus:ring-teal-500"
                  data-testid="approval-mode-telegram"
                />
                <div>
                  <p className="text-sm font-medium text-white">Telegram Approval</p>
                  <p className="text-xs text-slate-400">Receive posts for review via Telegram before publishing</p>
                </div>
              </label>
              
              <label className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                settings.approval_mode === 'auto'
                  ? 'bg-slate-700/50 border-teal-500/50'
                  : 'bg-slate-800 border-slate-700 hover:border-slate-600'
              }`}>
                <input
                  type="radio"
                  name="approval_mode"
                  value="auto"
                  checked={settings.approval_mode === 'auto'}
                  onChange={(e) => setSettings(prev => ({ ...prev, approval_mode: e.target.value }))}
                  className="w-4 h-4 text-teal-500 bg-slate-700 border-slate-600 focus:ring-teal-500"
                  data-testid="approval-mode-auto"
                />
                <div>
                  <p className="text-sm font-medium text-white">Auto-publish</p>
                  <p className="text-xs text-slate-400">Skip approval and auto-publish all generated posts</p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 md:px-6 py-4 border-t border-slate-700 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2.5 min-h-[44px] border border-slate-600 text-slate-300 hover:border-slate-500 hover:text-white rounded-xl text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2.5 min-h-[44px] bg-teal-500 hover:bg-teal-600 text-white rounded-xl shadow-lg shadow-teal-500/25 text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
            data-testid="save-settings-btn"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutopilotSettingsModal;
