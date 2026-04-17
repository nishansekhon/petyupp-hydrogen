import React from 'react';

/**
 * Reusable Skeleton Loading Components for Sales Hub
 * Provides consistent loading states across all tabs
 */

// Base skeleton box with pulse animation
export const SkeletonBox = ({ className = '', isDarkMode = true }) => (
  <div className={`animate-pulse rounded ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'} ${className}`} />
);

// Skeleton for stat cards (4 across)
export const SkeletonStatCards = ({ isDarkMode, count = 4 }) => (
  <div className={`grid grid-cols-${count} gap-4`}>
    {[...Array(count)].map((_, idx) => (
      <div key={idx} className={`backdrop-blur-lg border rounded-xl p-4 ${
        isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <SkeletonBox isDarkMode={isDarkMode} className="w-8 h-8 rounded-lg" />
          <SkeletonBox isDarkMode={isDarkMode} className="w-12 h-8" />
        </div>
        <SkeletonBox isDarkMode={isDarkMode} className="w-20 h-4 mt-2" />
      </div>
    ))}
  </div>
);

// Skeleton for table rows
export const SkeletonTableRow = ({ isDarkMode, columns = 6 }) => (
  <tr className={isDarkMode ? 'border-slate-700' : 'border-gray-200'}>
    {[...Array(columns)].map((_, idx) => (
      <td key={idx} className="px-4 py-3">
        <SkeletonBox isDarkMode={isDarkMode} className={`h-4 ${idx === 0 ? 'w-32' : idx === 1 ? 'w-24' : 'w-16'}`} />
      </td>
    ))}
  </tr>
);

// Skeleton for a table with header and rows
export const SkeletonTable = ({ isDarkMode, rows = 5, columns = 6 }) => (
  <div className={`backdrop-blur-lg border rounded-2xl overflow-hidden ${
    isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
  }`}>
    {/* Header skeleton */}
    <div className={`p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between">
        <SkeletonBox isDarkMode={isDarkMode} className="w-24 h-5" />
        <div className="flex gap-2">
          <SkeletonBox isDarkMode={isDarkMode} className="w-24 h-8 rounded-lg" />
          <SkeletonBox isDarkMode={isDarkMode} className="w-24 h-8 rounded-lg" />
        </div>
      </div>
    </div>
    {/* Table skeleton */}
    <table className="w-full">
      <tbody className={`divide-y ${isDarkMode ? 'divide-slate-700' : 'divide-gray-200'}`}>
        {[...Array(rows)].map((_, idx) => (
          <SkeletonTableRow key={idx} isDarkMode={isDarkMode} columns={columns} />
        ))}
      </tbody>
    </table>
  </div>
);

// Skeleton for funnel visualization
export const SkeletonFunnel = ({ isDarkMode }) => (
  <div className={`backdrop-blur-lg border rounded-2xl p-5 ${
    isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
  }`}>
    <SkeletonBox isDarkMode={isDarkMode} className="w-40 h-5 mb-4" />
    <div className="flex items-center justify-between gap-2">
      {[...Array(5)].map((_, idx) => (
        <React.Fragment key={idx}>
          <div className="flex-1 text-center">
            <SkeletonBox isDarkMode={isDarkMode} className="w-16 h-8 mx-auto mb-2" />
            <SkeletonBox isDarkMode={isDarkMode} className="w-20 h-4 mx-auto mb-1" />
            <SkeletonBox isDarkMode={isDarkMode} className="w-12 h-3 mx-auto" />
          </div>
          {idx < 4 && <div className={`text-xl ${isDarkMode ? 'text-slate-600' : 'text-gray-300'}`}>→</div>}
        </React.Fragment>
      ))}
    </div>
  </div>
);

// Skeleton for metric cards (3 across)
export const SkeletonMetricCards = ({ isDarkMode, count = 3 }) => (
  <div className={`grid grid-cols-${count} gap-4`}>
    {[...Array(count)].map((_, idx) => (
      <div key={idx} className={`backdrop-blur-lg border rounded-xl p-4 text-center ${
        isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
      }`}>
        <SkeletonBox isDarkMode={isDarkMode} className="w-16 h-8 mx-auto mb-2" />
        <SkeletonBox isDarkMode={isDarkMode} className="w-24 h-4 mx-auto mb-1" />
        <SkeletonBox isDarkMode={isDarkMode} className="w-20 h-3 mx-auto" />
      </div>
    ))}
  </div>
);

// Skeleton for search form
export const SkeletonSearchForm = ({ isDarkMode }) => (
  <div className={`backdrop-blur-lg border rounded-2xl p-5 ${
    isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
  }`}>
    <SkeletonBox isDarkMode={isDarkMode} className="w-40 h-5 mb-4" />
    <div className="grid grid-cols-3 gap-4 mb-4">
      <SkeletonBox isDarkMode={isDarkMode} className="h-10 rounded-lg" />
      <SkeletonBox isDarkMode={isDarkMode} className="h-10 rounded-lg" />
      <SkeletonBox isDarkMode={isDarkMode} className="h-10 rounded-lg" />
    </div>
    <SkeletonBox isDarkMode={isDarkMode} className="w-full h-10 rounded-lg" />
  </div>
);

// Skeleton for store cards in grid view
export const SkeletonStoreCards = ({ isDarkMode, count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {[...Array(count)].map((_, idx) => (
      <div key={idx} className={`backdrop-blur-lg border rounded-xl p-4 ${
        isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-start gap-3">
          <SkeletonBox isDarkMode={isDarkMode} className="w-10 h-10 rounded-lg flex-shrink-0" />
          <div className="flex-1">
            <SkeletonBox isDarkMode={isDarkMode} className="w-3/4 h-5 mb-2" />
            <SkeletonBox isDarkMode={isDarkMode} className="w-full h-4 mb-1" />
            <SkeletonBox isDarkMode={isDarkMode} className="w-1/2 h-3" />
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <SkeletonBox isDarkMode={isDarkMode} className="w-16 h-6 rounded-full" />
          <SkeletonBox isDarkMode={isDarkMode} className="w-20 h-6 rounded-full" />
        </div>
      </div>
    ))}
  </div>
);

// Skeleton for partner cards
export const SkeletonPartnerCards = ({ isDarkMode, count = 4 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {[...Array(count)].map((_, idx) => (
      <div key={idx} className={`backdrop-blur-lg border rounded-xl p-4 ${
        isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-4">
          <SkeletonBox isDarkMode={isDarkMode} className="w-12 h-12 rounded-full" />
          <div className="flex-1">
            <SkeletonBox isDarkMode={isDarkMode} className="w-3/4 h-5 mb-2" />
            <SkeletonBox isDarkMode={isDarkMode} className="w-1/2 h-4" />
          </div>
          <SkeletonBox isDarkMode={isDarkMode} className="w-20 h-8 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

// Skeleton for route cards
export const SkeletonRouteCards = ({ isDarkMode, count = 4 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {[...Array(count)].map((_, idx) => (
      <div key={idx} className={`backdrop-blur-lg border rounded-xl p-4 ${
        isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <SkeletonBox isDarkMode={isDarkMode} className="w-8 h-8 rounded-lg" />
            <SkeletonBox isDarkMode={isDarkMode} className="w-24 h-5" />
          </div>
          <SkeletonBox isDarkMode={isDarkMode} className="w-16 h-6 rounded-full" />
        </div>
        <div className="space-y-2">
          <SkeletonBox isDarkMode={isDarkMode} className="w-full h-4" />
          <SkeletonBox isDarkMode={isDarkMode} className="w-3/4 h-4" />
        </div>
        <div className="flex items-center gap-2 mt-3">
          <SkeletonBox isDarkMode={isDarkMode} className="w-20 h-6 rounded-lg" />
          <SkeletonBox isDarkMode={isDarkMode} className="w-20 h-6 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

// Skeleton for Daily Sales Ecommerce/Retail cards
export const SkeletonDailySalesCards = ({ isDarkMode }) => (
  <div className="grid grid-cols-2 gap-6">
    {/* Ecommerce Card */}
    <div className={`backdrop-blur-lg border rounded-2xl p-5 ${
      isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <SkeletonBox isDarkMode={isDarkMode} className="w-32 h-6" />
        <SkeletonBox isDarkMode={isDarkMode} className="w-20 h-8 rounded-lg" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, idx) => (
          <div key={idx} className="text-center">
            <SkeletonBox isDarkMode={isDarkMode} className="w-full h-8 mx-auto mb-2" />
            <SkeletonBox isDarkMode={isDarkMode} className="w-16 h-3 mx-auto" />
          </div>
        ))}
      </div>
      <SkeletonBox isDarkMode={isDarkMode} className="w-full h-24 mt-4 rounded-lg" />
    </div>
    
    {/* Retail Card */}
    <div className={`backdrop-blur-lg border rounded-2xl p-5 ${
      isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <SkeletonBox isDarkMode={isDarkMode} className="w-28 h-6" />
        <SkeletonBox isDarkMode={isDarkMode} className="w-20 h-8 rounded-lg" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, idx) => (
          <div key={idx} className="text-center">
            <SkeletonBox isDarkMode={isDarkMode} className="w-full h-8 mx-auto mb-2" />
            <SkeletonBox isDarkMode={isDarkMode} className="w-16 h-3 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Skeleton for KPI cards row
export const SkeletonKPICards = ({ isDarkMode, count = 4 }) => (
  <div className={`backdrop-blur-lg border rounded-2xl p-5 ${
    isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
  }`}>
    <SkeletonBox isDarkMode={isDarkMode} className="w-32 h-5 mb-4" />
    <div className={`grid grid-cols-${count} gap-4`}>
      {[...Array(count)].map((_, idx) => (
        <div key={idx} className={`p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
          <SkeletonBox isDarkMode={isDarkMode} className="w-16 h-6 mb-2" />
          <SkeletonBox isDarkMode={isDarkMode} className="w-20 h-4" />
        </div>
      ))}
    </div>
  </div>
);

// Full Hunt Tab Skeleton
export const HuntTabSkeleton = ({ isDarkMode }) => (
  <div className="space-y-6">
    {/* Budget & Cost Stats */}
    <SkeletonStatCards isDarkMode={isDarkMode} count={4} />
    
    {/* Search Form */}
    <SkeletonSearchForm isDarkMode={isDarkMode} />
    
    {/* Results */}
    <SkeletonStoreCards isDarkMode={isDarkMode} count={6} />
  </div>
);

// Full Stores Tab Skeleton
export const StoresTabSkeleton = ({ isDarkMode }) => (
  <div className="space-y-6">
    {/* Tier Cards */}
    <SkeletonStatCards isDarkMode={isDarkMode} count={4} />
    
    {/* Table */}
    <SkeletonTable isDarkMode={isDarkMode} rows={8} columns={6} />
  </div>
);

// Full Routes Tab Skeleton
export const RoutesTabSkeleton = ({ isDarkMode }) => (
  <div className="space-y-6">
    {/* Stats */}
    <SkeletonStatCards isDarkMode={isDarkMode} count={4} />
    
    {/* Route Cards */}
    <SkeletonRouteCards isDarkMode={isDarkMode} count={4} />
  </div>
);

// Full Pipeline Tab Skeleton
export const PipelineTabSkeleton = ({ isDarkMode }) => (
  <div className="space-y-6">
    {/* Funnel */}
    <SkeletonFunnel isDarkMode={isDarkMode} />
    
    {/* Metrics */}
    <SkeletonMetricCards isDarkMode={isDarkMode} count={3} />
    
    {/* Alert placeholder */}
    <div className={`backdrop-blur-lg border rounded-xl p-4 ${
      isDarkMode ? 'bg-slate-800/30 border-slate-700' : 'bg-gray-50 border-gray-200'
    }`}>
      <SkeletonBox isDarkMode={isDarkMode} className="w-48 h-5 mb-2" />
      <SkeletonBox isDarkMode={isDarkMode} className="w-64 h-4" />
    </div>
  </div>
);

// Full Partners Tab Skeleton
export const PartnersTabSkeleton = ({ isDarkMode }) => (
  <div className="space-y-6">
    {/* Stats */}
    <SkeletonStatCards isDarkMode={isDarkMode} count={4} />
    
    {/* Partner Cards */}
    <SkeletonPartnerCards isDarkMode={isDarkMode} count={4} />
  </div>
);

// Full Daily Sales Tab Skeleton
export const DailySalesTabSkeleton = ({ isDarkMode }) => (
  <div className="space-y-6">
    {/* Period selector skeleton */}
    <div className="flex items-center gap-4">
      <SkeletonBox isDarkMode={isDarkMode} className="w-32 h-10 rounded-lg" />
      <SkeletonBox isDarkMode={isDarkMode} className="w-40 h-10 rounded-lg" />
    </div>
    
    {/* Main Cards */}
    <SkeletonDailySalesCards isDarkMode={isDarkMode} />
    
    {/* KPIs */}
    <SkeletonKPICards isDarkMode={isDarkMode} count={4} />
  </div>
);

export default {
  SkeletonBox,
  SkeletonStatCards,
  SkeletonTable,
  SkeletonFunnel,
  SkeletonMetricCards,
  SkeletonSearchForm,
  SkeletonStoreCards,
  SkeletonPartnerCards,
  SkeletonRouteCards,
  SkeletonDailySalesCards,
  SkeletonKPICards,
  HuntTabSkeleton,
  StoresTabSkeleton,
  RoutesTabSkeleton,
  PipelineTabSkeleton,
  PartnersTabSkeleton,
  DailySalesTabSkeleton
};
