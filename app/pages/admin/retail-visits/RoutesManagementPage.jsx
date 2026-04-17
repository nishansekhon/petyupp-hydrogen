import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';
import { Link } from 'react-router';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import ConfirmModal from '@/components/modals/ConfirmModal';
import SuccessModal from '@/components/modals/SuccessModal';

const RoutesManagementPage = () => {
  const { isDarkMode } = useAdminTheme();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    agent_id: '',
    date: '',
    status: ''
  });
  
  // Modal states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [routeToDelete, setRouteToDelete] = useState(null);

  const backendUrl = API_BASE_URL;

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      
      // Build query params
      const params = new URLSearchParams();
      if (filters.agent_id) params.append('agent_id', filters.agent_id);
      if (filters.date) params.append('date', filters.date);
      if (filters.status) params.append('status', filters.status);
      
      const response = await fetch(
        `${backendUrl}/api/retail/routes?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRoutes(data.routes || []);
      } else {
        console.error('Failed to fetch routes');
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (route) => {
    setRouteToDelete(route);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!routeToDelete) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${backendUrl}/api/retail/routes/${routeToDelete.route_id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.ok) {
        setShowDeleteModal(false);
        setShowSuccessModal(true);
        fetchRoutes(); // Refresh the list
      } else {
        const errorData = await response.json().catch(() => ({}));
        setShowDeleteModal(false);
        alert(`Failed to delete route: ${errorData.detail || errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting route:', error);
      setShowDeleteModal(false);
      alert('Failed to delete route. Please try again.');
    }
  };

  const getStatusBadge = (status) => {
    const lightStyles = {
      draft: 'bg-gray-100 text-gray-800',
      assigned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    
    const darkStyles = {
      draft: 'bg-gray-500/20 text-gray-300',
      assigned: 'bg-blue-500/20 text-blue-300',
      in_progress: 'bg-yellow-500/20 text-yellow-300',
      completed: 'bg-green-500/20 text-green-300',
      cancelled: 'bg-red-500/20 text-red-300'
    };
    
    const styles = isDarkMode ? darkStyles : lightStyles;

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className={`text-xl font-bold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
              Route Management
            </h1>
            <p className={`mt-1 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
              Manage daily routes and assignments. Create routes from <Link to="/admin/retail-visits/search" className="text-blue-500 hover:underline">Search Stores</Link>.
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className={`rounded-lg shadow p-4 ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white'}`}>
            <div className={`text-sm ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>Total Routes</div>
            <div className={`text-2xl font-bold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>{routes.length}</div>
          </div>
          <div className={`rounded-lg shadow p-4 ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white'}`}>
            <div className={`text-sm ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>Assigned Today</div>
            <div className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              {routes.filter(r => r.route_status === 'assigned').length}
            </div>
          </div>
          <div className={`rounded-lg shadow p-4 ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white'}`}>
            <div className={`text-sm ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>In Progress</div>
            <div className={`text-2xl font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
              {routes.filter(r => r.route_status === 'in_progress').length}
            </div>
          </div>
          <div className={`rounded-lg shadow p-4 ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white'}`}>
            <div className={`text-sm ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>Completed</div>
            <div className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
              {routes.filter(r => r.route_status === 'completed').length}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className={`rounded-lg shadow p-4 mb-6 ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white'}`}>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-pearl-white' : 'text-gray-700'}`}>
                Date
              </label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDarkMode 
                    ? 'bg-white/5 border-white/10 text-pearl-white' 
                    : 'border-gray-300'
                }`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-pearl-white' : 'text-gray-700'}`}>
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  isDarkMode 
                    ? 'bg-white/5 border-white/10 text-pearl-white [&>option]:bg-gray-800 [&>option]:text-pearl-white' 
                    : 'border-gray-300'
                }`}
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchRoutes}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Apply Filters
              </button>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilters({ agent_id: '', date: '', status: '' });
                  fetchRoutes();
                }}
                className={`w-full px-4 py-2 rounded-lg font-medium transition-colors ${
                  isDarkMode 
                    ? 'bg-white/10 hover:bg-white/20 text-pearl-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Routes Table */}
        <div className={`rounded-lg shadow overflow-hidden ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white'}`}>
          {loading ? (
            <div className={`p-8 text-center ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'}`}>
              Loading routes...
            </div>
          ) : routes.length === 0 ? (
            <div className={`p-8 text-center ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'}`}>
              No routes found. Create your first route!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className={isDarkMode ? 'bg-white/5' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'
                    }`}>
                      Route Name
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'
                    }`}>
                      Agent
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'
                    }`}>
                      Date
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'
                    }`}>
                      Stores
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'
                    }`}>
                      Distance
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'
                    }`}>
                      Status
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'
                    }`}>
                      Progress
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                      isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'
                    }`}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? 'bg-transparent divide-white/10' : 'bg-white divide-gray-200'}`}>
                  {routes.map((route) => (
                    <tr key={route.route_id} className={isDarkMode ? 'hover:bg-white/5' : 'hover:bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                          {route.route_name}
                        </div>
                        <div className={`text-xs ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'}`}>
                          {route.area}, {route.zone}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>{route.agent_name}</div>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                        {route.assigned_date}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                        {route.stores_completed || 0} / {route.total_stores}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                        {route.total_route_distance_km} km
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(route.route_status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`w-full rounded-full h-2 ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`}>
                          <div
                            className={isDarkMode ? 'bg-blue-500 h-2 rounded-full' : 'bg-blue-600 h-2 rounded-full'}
                            style={{
                              width: `${((route.stores_completed || 0) / route.total_stores) * 100}%`
                            }}
                          ></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <Link
                          to={`/admin/retail-visits/routes/${route.route_id}`}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(route)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ConfirmModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Delete Route"
        message={`Are you sure you want to delete the route "${routeToDelete?.route_name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        danger={true}
      />

      <SuccessModal
        show={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Route Deleted!"
        message="The route has been successfully deleted."
      />
    </div>
  );
};

export default RoutesManagementPage;
