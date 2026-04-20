import * as React from 'react';
import {Pagination} from '@shopify/hydrogen';

/**
 * <PaginatedResourceSection> encapsulates the previous and next pagination behaviors throughout your application.
 * @param {Class<Pagination<NodesType>>['connection']>}
 */
export function PaginatedResourceSection({
  connection,
  children,
  ariaLabel,
  resourcesClassName,
}) {
  const buttonClass =
    'inline-flex items-center gap-2 px-8 py-3 rounded-lg bg-[#06B6D4] hover:bg-[#0891B2] text-white font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#06B6D4] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed';

  return (
    <Pagination connection={connection}>
      {({nodes, isLoading, hasPreviousPage, hasNextPage, PreviousLink, NextLink}) => {
        const resourcesMarkup = nodes.map((node, index) =>
          children({node, index}),
        );

        return (
          <div>
            {hasPreviousPage && (
              <div className="flex justify-center mt-6 mb-8">
                <PreviousLink className={buttonClass}>
                  {isLoading ? (
                    'Loading…'
                  ) : (
                    <span>
                      <span aria-hidden="true">↑</span> Load previous
                    </span>
                  )}
                </PreviousLink>
              </div>
            )}
            {resourcesClassName ? (
              <div
                aria-label={ariaLabel}
                className={resourcesClassName}
                role={ariaLabel ? 'region' : undefined}
              >
                {resourcesMarkup}
              </div>
            ) : (
              resourcesMarkup
            )}
            {hasNextPage && (
              <div className="flex justify-center mt-12">
                <NextLink className={buttonClass}>
                  {isLoading ? (
                    'Loading…'
                  ) : (
                    <span>
                      Load more <span aria-hidden="true">↓</span>
                    </span>
                  )}
                </NextLink>
              </div>
            )}
          </div>
        );
      }}
    </Pagination>
  );
}
