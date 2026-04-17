import React from 'react';
import { PipelineTabSkeleton } from './SalesSkeletons';

const PipelineTab = ({
  isDarkMode,
  pipelineData,
  setActiveTab,
  loading
}) => {
  // Show skeleton while loading
  if (loading) {
    return <PipelineTabSkeleton isDarkMode={isDarkMode} />;
  }

  return (
    <div className="space-y-6">
      {/* Sales Funnel */}
      <div className={`backdrop-blur-lg border rounded-2xl p-5 ${
        isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          🏪 Retail Sales Funnel
        </h3>
        <div className="flex items-center justify-between gap-2">
          {[
            { label: 'Total Stores', value: pipelineData.funnel.totalStores || 0, rate: '100%' },
            { label: 'Visited', value: pipelineData.funnel.visited || 0, rate: `${pipelineData.funnel.totalStores ? Math.round((pipelineData.funnel.visited / pipelineData.funnel.totalStores) * 100) : 0}%` },
            { label: 'Pitched', value: pipelineData.funnel.pitched || 0, rate: `${pipelineData.funnel.visited ? Math.round((pipelineData.funnel.pitched / pipelineData.funnel.visited) * 100) : 0}%` },
            { label: 'Ordered', value: pipelineData.funnel.ordered || 0, rate: `${pipelineData.funnel.pitched ? Math.round((pipelineData.funnel.ordered / pipelineData.funnel.pitched) * 100) : 0}%` },
            { label: 'Reorder', value: `${pipelineData.funnel.reorderRate || 0}%`, rate: 'repeat' }
          ].map((step, idx, arr) => (
            <React.Fragment key={idx}>
              <div className="flex-1 text-center">
                <div className={`text-2xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{step.value}</div>
                <div className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>{step.label}</div>
                <div className={`text-xs mt-1 ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>{step.rate}</div>
              </div>
              {idx < arr.length - 1 && <div className={`text-xl ${isDarkMode ? 'text-slate-600' : 'text-gray-300'}`}>→</div>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Conversion Metrics */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Visit → Pitch', value: `${pipelineData.conversions.visitToPitch || 0}%`, sub: 'conversion' },
          { label: 'Pitch → Order', value: `${pipelineData.conversions.pitchToOrder || 0}%`, sub: 'conversion' },
          { label: 'Reorder Rate', value: `${pipelineData.conversions.reorderRate || 0}%`, sub: 'repeat customers' }
        ].map((metric, idx) => (
          <div key={idx} className={`backdrop-blur-lg border rounded-xl p-4 text-center ${
            isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
          }`}>
            <p className={`text-2xl font-bold ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>{metric.value}</p>
            <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{metric.label}</p>
            <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{metric.sub}</p>
          </div>
        ))}
      </div>

      {/* Pending Alert */}
      {pipelineData.pendingStores > 0 && (
        <div className={`backdrop-blur-lg border rounded-xl p-4 ${
          isDarkMode ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
                ⏳ Pending Follow-ups
              </h3>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-yellow-300/70' : 'text-yellow-600'}`}>
                {pipelineData.pendingStores} stores awaiting first visit
              </p>
            </div>
            <button
              onClick={() => setActiveTab('routes')}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 rounded-lg text-sm font-medium text-white"
            >
              Create Routes →
            </button>
          </div>
        </div>
      )}

      {/* Active Stores */}
      {pipelineData.activeStores && pipelineData.activeStores.length > 0 && (
        <div className={`backdrop-blur-lg border rounded-2xl p-5 ${
          isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
        }`}>
          <h3 className={`text-sm font-bold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            📊 Active Stores (Stocked)
          </h3>
          <div className="space-y-2">
            {pipelineData.activeStores.map((store, idx) => (
              <div key={idx} className={`flex items-center justify-between p-3 rounded-lg ${isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{store.store_name}</p>
                  <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{store.area}</p>
                </div>
                <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">Active</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PipelineTab;
