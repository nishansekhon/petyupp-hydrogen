import React, { useEffect, useState } from 'react';

const LoadingScreen = ({ onDone }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 2000);
    const doneTimer = setTimeout(() => {
      if (typeof onDone === 'function') onDone();
    }, 2600);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <>
      <style>{`
        @keyframes petyupp-fade-in {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes petyupp-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.75; transform: scale(1.04); }
        }
        .petyupp-loading-overlay {
          position: fixed;
          inset: 0;
          background: #ffffff;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          transition: opacity 600ms ease-out;
        }
        .petyupp-loading-overlay.fade-out {
          opacity: 0;
          pointer-events: none;
        }
        .petyupp-loading-logo {
          font-size: 4rem;
          font-weight: 800;
          color: #06B6D4;
          letter-spacing: -0.02em;
          animation: petyupp-fade-in 700ms ease-out, petyupp-pulse 2s ease-in-out 700ms infinite;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .petyupp-loading-tagline {
          margin-top: 0.75rem;
          font-size: 1rem;
          color: #9ca3af;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          animation: petyupp-fade-in 900ms ease-out;
        }
      `}</style>
      <div className={'petyupp-loading-overlay' + (fadeOut ? ' fade-out' : '')}>
        <div className="petyupp-loading-logo">PetYupp</div>
        <div className="petyupp-loading-tagline">Pet Lifestyle</div>
      </div>
    </>
  );
};

export default LoadingScreen;
