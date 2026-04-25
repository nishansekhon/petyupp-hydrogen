// Buy-box density refactor: the rounded-full pill row used to sit between
// title and price, eating ~32px above the fold. Replaced by a one-line meta
// row inside PdpBuyBox (variant-reactive on Plain). This component now
// renders nothing — kept as a stable export so the route's render tree
// doesn't change. Wire any future product-attribute UI through here.
export default function PdpAttributeBadges() {
  return null;
}
