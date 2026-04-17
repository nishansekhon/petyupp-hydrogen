import React from 'react';
function SeasonalLogo({ logoSrc, alt, logoHeight = 40, logoClassName = '', className = '' }) {
  return (
    <span className={`font-black text-[#06B6D4] tracking-tight ${className} ${logoClassName}`}
      style={{ fontSize: Math.max(16, logoHeight * 0.55) + 'px' }}>
      PetYupp
    </span>
  );
}
export default SeasonalLogo;
