import {Link} from 'react-router';

const FLAVOR_STRIPES = [
  '#93C5FD', // Blueberry
  '#FCD34D', // Honey
  '#86EFAC', // Mint
  '#D4A574', // Peanut Butter
  '#FB923C', // Pumpkin
  '#F87171', // Strawberry
  '#C7B898', // Flax Seed
  '#B45309', // Turmeric & Ashwagandha
];

function PlainThumbnail() {
  return (
    <div
      aria-hidden="true"
      className="w-[38px] h-[38px] shrink-0 rounded-md"
      style={{backgroundColor: '#E8D9C0'}}
    />
  );
}

function FlavoredThumbnail() {
  return (
    <div
      aria-hidden="true"
      className="w-[38px] h-[38px] shrink-0 rounded-md overflow-hidden flex"
    >
      {FLAVOR_STRIPES.map((color) => (
        <span
          key={color}
          style={{backgroundColor: color, width: 4, height: '100%'}}
        />
      ))}
    </div>
  );
}

export default function PdpPairedProductCard({
  pairedHandle,
  pairedTitle,
  label,
  thumbnailVariant,
}) {
  if (!pairedHandle) return null;
  return (
    <div className="border-t border-gray-200 pt-4 mt-1 flex items-center gap-3">
      {thumbnailVariant === 'flavored' ? <FlavoredThumbnail /> : <PlainThumbnail />}
      <div className="flex flex-col min-w-0">
        <span className="text-[11px] uppercase tracking-[0.5px] text-gray-500">
          {label}
        </span>
        <Link
          to={`/products/${pairedHandle}`}
          className="text-[12px] font-medium text-[#06B6D4] hover:underline truncate"
        >
          {pairedTitle} →
        </Link>
      </div>
    </div>
  );
}
