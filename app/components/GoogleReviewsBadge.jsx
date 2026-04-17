import React from 'react';
function GoogleReviewsBadge({ position = 'INLINE' }) {
  // Placeholder - PetYupp will integrate Google Reviews when available
  return (
    <div className="flex items-center gap-2 text-xs text-gray-400">
      <span>⭐⭐⭐⭐⭐</span>
      <span>PetYupp - Loved by dogs across America</span>
    </div>
  );
}
export default GoogleReviewsBadge;
