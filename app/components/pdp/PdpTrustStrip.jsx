import {Leaf, ShieldCheck, Truck, RotateCcw} from 'lucide-react';

const DEFAULT_ITEMS = [
  {icon: Leaf, label: 'Natural'},
  {icon: ShieldCheck, label: 'Vet approved'},
  {icon: Truck, label: 'Free shipping $49+'},
  {icon: RotateCcw, label: '30-day guarantee'},
];

export default function PdpTrustStrip({items = DEFAULT_ITEMS}) {
  return (
    <ul className="grid grid-cols-4 gap-2 py-3 border-t border-b border-gray-100 text-center">
      {items.map(({icon: Icon, label}) => (
        <li key={label} className="flex flex-col items-center gap-1">
          <Icon size={22} strokeWidth={1.5} className="text-gray-700" />
          <span className="text-[11px] text-gray-600 leading-tight">
            {label}
          </span>
        </li>
      ))}
    </ul>
  );
}
