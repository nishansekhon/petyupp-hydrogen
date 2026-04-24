export default function PdpAttributeBadges({badges}) {
  if (!badges?.length) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Product attributes">
      {badges.slice(0, 5).map((badge) => (
        <li
          key={badge}
          className="bg-[#FDF8F4] border border-gray-200 text-xs uppercase tracking-wide px-3 py-1 rounded-full text-gray-700"
        >
          {badge}
        </li>
      ))}
    </ul>
  );
}
