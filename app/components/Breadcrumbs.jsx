import {Link} from 'react-router';

/**
 * @param {{items: Array<{label: string, to?: string}>}}
 */
export function Breadcrumbs({items}) {
  if (!items?.length) return null;
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <li key={`${item.label}-${idx}`} className="flex items-center gap-2">
              {isLast || !item.to ? (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className="text-gray-900 font-medium truncate max-w-[200px]"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.to}
                  className="hover:text-[#06B6D4] transition-colors"
                >
                  {item.label}
                </Link>
              )}
              {!isLast && <span aria-hidden="true">›</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
