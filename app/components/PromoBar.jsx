/**
 * Scrolling promo bar at the top of the page
 */
export function PromoBar() {
  const promoText =
    'Free shipping on orders over $49 across US and Canada ✦ Loved by Dogs ✦ Free US Shipping ✦ Vet Approved ✦ 30-Day Guarantee';

  return (
    <div className="promo-bar">
      <div className="promo-content">
        <span className="promo-text">{promoText}</span>
        <span className="promo-text">{promoText}</span>
      </div>
    </div>
  );
}
