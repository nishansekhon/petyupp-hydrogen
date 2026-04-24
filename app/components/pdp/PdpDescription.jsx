import {useState} from 'react';

export default function PdpDescription({shortDescription, fullDescriptionHtml}) {
  const [expanded, setExpanded] = useState(false);
  const hasFull = Boolean(fullDescriptionHtml?.trim());

  return (
    <div className="text-sm text-gray-700 leading-relaxed">
      {!expanded && (
        <>
          <p className="line-clamp-2 md:line-clamp-none">{shortDescription}</p>
          {hasFull && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="mt-2 text-[#06B6D4] hover:text-[#0891B2] text-sm font-medium"
            >
              Read more →
            </button>
          )}
        </>
      )}
      {expanded && (
        <>
          <p>{shortDescription}</p>
          <div
            className="prose prose-sm max-w-none mt-3 text-gray-700"
            dangerouslySetInnerHTML={{__html: fullDescriptionHtml}}
          />
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="mt-2 text-[#06B6D4] hover:text-[#0891B2] text-sm font-medium"
          >
            Show less
          </button>
        </>
      )}
    </div>
  );
}
