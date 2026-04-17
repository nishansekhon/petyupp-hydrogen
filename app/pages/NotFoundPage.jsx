import React, { useEffect } from 'react';
import { Link } from 'react-router';
function NotFoundPage() {
  useEffect(() => {
    document.title = '404 - Page Not Found | PetYupp';
  }, []);
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center px-4">
        <div className="text-6xl mb-4">🐾</div>
        <h1 className="text-4xl font-black text-gray-900 mb-3">Page Not Found</h1>
        <p className="text-gray-500 mb-6">Looks like this pup ran off! The page you're looking for doesn't exist.</p>
        <Link to="/" className="inline-block bg-[#06B6D4] hover:bg-[#0891B2] text-white font-bold px-6 py-3 rounded-xl transition-colors">
          Back to Home
        </Link>
      </div>
    </div>
  );
}
export default NotFoundPage;
