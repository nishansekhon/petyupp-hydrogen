import React, { useState, useEffect } from 'react';

const CookieConsent = () => {
  const CONSENT_KEY = 'petyupp_cookie_consent';
  const hasConsent = () => {
    try {
      return Boolean(localStorage.getItem(CONSENT_KEY));
    } catch {
      return false;
    }
  };
  const [visible, setVisible] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [prefs, setPrefs] = useState({ analytics: false, marketing: false });

  useEffect(() => {
    if (hasConsent()) return;
    const t = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(t);
  }, []);

  const persist = (value) => {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify(value));
    } catch {
      // storage unavailable (private mode, quota) — keep banner dismissed for the session anyway
    }
  };

  const accept = () => {
    persist({ necessary: true, analytics: true, marketing: true });
    setVisible(false);
  };

  const savePrefs = () => {
    persist({ necessary: true, ...prefs });
    setVisible(false);
    setShowPrefs(false);
  };

  if (!visible) return null;

  return (
    <>
      {/* Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-[1000] bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <p className="text-sm text-gray-600 flex-1">
            We use cookies to improve your experience. By continuing, you agree to our{' '}
            <a href="/privacy" className="text-[#06B6D4] hover:underline">cookie policy</a>.
          </p>
          <div className="flex gap-3 flex-shrink-0">
            <button
              onClick={() => setShowPrefs(true)}
              className="px-4 py-2 border border-[#06B6D4] text-[#06B6D4] text-sm font-semibold rounded-lg hover:bg-[#06B6D4]/5 transition-colors"
            >
              Preferences
            </button>
            <button
              onClick={accept}
              className="px-4 py-2 bg-[#06B6D4] text-white text-sm font-semibold rounded-lg hover:bg-[#0891B2] transition-colors"
            >
              Accept
            </button>
          </div>
        </div>
      </div>

      {/* Preferences modal */}
      {showPrefs && (
        <div className="fixed inset-0 z-[1001] bg-black/50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Cookie Preferences</h3>

            <div className="space-y-4">
              {/* Necessary */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Necessary Cookies</p>
                  <p className="text-xs text-gray-500 mt-0.5">Required for the site to function</p>
                </div>
                <div className="w-10 h-5 bg-gray-300 rounded-full cursor-not-allowed opacity-60 relative">
                  <div className="w-4 h-4 bg-white rounded-full absolute right-0.5 top-0.5 shadow"/>
                </div>
              </div>

              {/* Analytics */}
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Analytics Cookies</p>
                  <p className="text-xs text-gray-500 mt-0.5">Help us understand how you use the site</p>
                </div>
                <button
                  onClick={() => setPrefs(p => ({...p, analytics: !p.analytics}))}
                  className={`w-10 h-5 rounded-full relative transition-colors ${prefs.analytics ? 'bg-[#06B6D4]' : 'bg-gray-300'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow transition-transform ${prefs.analytics ? 'translate-x-5' : 'translate-x-0.5'}`}/>
                </button>
              </div>

              {/* Marketing */}
              <div className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Marketing Cookies</p>
                  <p className="text-xs text-gray-500 mt-0.5">Used to personalize ads for you</p>
                </div>
                <button
                  onClick={() => setPrefs(p => ({...p, marketing: !p.marketing}))}
                  className={`w-10 h-5 rounded-full relative transition-colors ${prefs.marketing ? 'bg-[#06B6D4]' : 'bg-gray-300'}`}
                >
                  <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 shadow transition-transform ${prefs.marketing ? 'translate-x-5' : 'translate-x-0.5'}`}/>
                </button>
              </div>
            </div>

            <button
              onClick={savePrefs}
              className="mt-6 w-full py-2.5 bg-[#06B6D4] text-white font-semibold text-sm rounded-xl hover:bg-[#0891B2] transition-colors"
            >
              Save Preferences
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default CookieConsent;
