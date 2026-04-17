import React from 'react';
import { Link } from 'react-router';
import { RefreshCw, MapPin } from 'lucide-react';
import { RoutesTabSkeleton } from './SalesSkeletons';

const RoutesTab = ({
  isDarkMode,
  routesData,
  loading
}) => {
  // Show skeleton while loading
  if (loading) {
    return <RoutesTabSkeleton isDarkMode={isDarkMode} />;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Routes', value: routesData.stats.total || 0, icon: '📋', color: 'slate' },
          { label: 'Assigned Today', value: routesData.stats.assignedToday || 0, icon: '📅', color: 'blue' },
          { label: 'In Progress', value: routesData.stats.inProgress || 0, icon: '🔄', color: 'yellow' },
          { label: 'Completed', value: routesData.stats.completed || 0, icon: '✅', color: 'green' }
        ].map((stat, idx) => (
          <div key={idx} className={`backdrop-blur-lg border rounded-xl p-4 ${
            isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{stat.icon}</span>
              <span className={`text-2xl font-bold ${
                stat.color === 'blue' ? 'text-blue-500' :
                stat.color === 'yellow' ? 'text-yellow-500' :
                stat.color === 'green' ? 'text-green-500' :
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{stat.value}</span>
            </div>
            <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Create Route CTA */}
      <div className={`backdrop-blur-lg border rounded-xl p-5 ${
        isDarkMode ? 'bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border-teal-500/30' : 'bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-sm font-bold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              🗺️ Create New Route
            </h3>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-slate-400' : 'text-gray-600'}`}>
              Select stores from Hunt or Stores tab to create optimized routes
            </p>
          </div>
          <Link to="/admin/retail-visits/search" className="px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm font-medium text-white">
            + Create Route
          </Link>
        </div>
      </div>

      {/* Routes Table */}
      <div className={`backdrop-blur-lg border rounded-2xl overflow-hidden ${
        isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'
      }`}>
        <div className={`p-4 border-b flex items-center justify-between ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}>
          <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Routes</span>
          <Link to="/admin/retail-visits/routes" className="text-xs text-teal-400 hover:text-teal-300">View All →</Link>
        </div>
        {loading ? (
          <div className={`p-8 text-center ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            <RefreshCw className="animate-spin mx-auto mb-2" size={24} />
            Loading routes...
          </div>
        ) : routesData.routes.length === 0 ? (
          <div className={`p-8 text-center ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
            <MapPin className="mx-auto mb-2 opacity-50" size={32} />
            <p>No routes found. Create your first route!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDarkMode ? 'bg-slate-700/50' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-4 py-3 text-left text-xs font-semibold ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Route Name</th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Agent</th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Date</th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Progress</th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Status</th>
                  <th className={`px-4 py-3 text-left text-xs font-semibold ${isDarkMode ? 'text-slate-300' : 'text-gray-600'}`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {routesData.routes.slice(0, 10).map((route, idx) => (
                  <tr key={idx} className={`border-t ${isDarkMode ? 'border-slate-700 hover:bg-slate-700/30' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <td className="px-4 py-3">
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{route.route_name}</p>
                      <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>{route.area}, {route.zone}</p>
                    </td>
                    <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{route.agent_name}</td>
                    <td className={`px-4 py-3 text-sm ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{route.assigned_date}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-24 h-2 rounded-full ${isDarkMode ? 'bg-slate-600' : 'bg-gray-200'}`}>
                          <div className="h-2 rounded-full bg-teal-500" style={{ width: `${((route.stores_completed || 0) / route.total_stores) * 100}%` }} />
                        </div>
                        <span className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}>
                          {route.stores_completed || 0}/{route.total_stores}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        route.route_status === 'assigned' ? 'bg-blue-500/20 text-blue-400' :
                        route.route_status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                        route.route_status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {route.route_status?.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/admin/retail-visits/routes/${route.route_id}`} className="text-teal-400 hover:text-teal-300 text-sm">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RoutesTab;
