import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';
import { useParams, useNavigate, Link } from 'react-router';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import SuccessModal from '@/components/modals/SuccessModal';
import ConfirmModal from '@/components/modals/ConfirmModal';
import ErrorModal from '@/components/modals/ErrorModal';

const RouteDetailsPage = () => {
  const { route_id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useAdminTheme();
  const backendUrl = API_BASE_URL;

  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Edit state
  const [editedDate, setEditedDate] = useState('');
  const [editedAgentId, setEditedAgentId] = useState('');
  const [editedStores, setEditedStores] = useState([]);
  const [agents, setAgents] = useState([]);
  
  // Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRemoveStoreConfirm, setShowRemoveStoreConfirm] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [storeToRemove, setStoreToRemove] = useState(null);

  useEffect(() => {
    fetchRouteDetails();
    fetchAgents();
  }, [route_id]);

  const fetchAgents = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${backendUrl}/api/retail/agents`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAgents(data);
      }
    } catch (err) {
      console.error('Error fetching agents:', err);
    }
  };

  const fetchRouteDetails = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${backendUrl}/api/retail/routes/${route_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📊 Route data loaded:', data);
        console.log('🏪 Stores:', data.stores);
        if (data.stores && data.stores.length > 0) {
          console.log('📝 First store fields:', Object.keys(data.stores[0]));
        }
        setRoute(data);
        setEditedDate(data.assigned_date);
        setEditedAgentId(data.agent_id);
        setEditedStores(data.stores || []);
      } else {
        setError('Failed to load route details');
      }
    } catch (err) {
      console.error('Error fetching route:', err);
      setError('Error loading route details');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStore = (index) => {
    const updated = editedStores.filter((_, i) => i !== index);
    setEditedStores(updated.map((store, i) => ({ ...store, sequence: i + 1 })));
    setShowRemoveStoreConfirm(false);
  };

  const confirmRemoveStore = (index) => {
    setStoreToRemove(index);
    setShowRemoveStoreConfirm(true);
  };

  const handleSaveChanges = async () => {
    if (editedStores.length === 0) {
      setErrorMessage('Route must have at least 1 store');
      setShowErrorModal(true);
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${backendUrl}/api/retail/routes/${route_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          agent_id: editedAgentId,
          assigned_date: editedDate,
          stores: editedStores
        })
      });

      const data = await response.json().catch(() => ({}));
      
      if (response.ok) {
        setRoute(data);
        setEditMode(false);
        setShowSuccessModal(true);
      } else {
        setErrorMessage(data.detail || 'Unknown error');
        setShowErrorModal(true);
      }
    } catch (err) {
      console.error('Error saving changes:', err);
      setErrorMessage('Error saving changes. Please try again.');
      setShowErrorModal(true);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedDate(route.assigned_date);
    setEditedAgentId(route.agent_id);
    setEditedStores(route.stores || []);
    setEditMode(false);
  };

  const moveStoreUp = (index) => {
    if (index === 0) return;
    const newStores = [...editedStores];
    [newStores[index], newStores[index - 1]] = [newStores[index - 1], newStores[index]];
    // Update sequences
    setEditedStores(newStores.map((store, i) => ({ ...store, sequence: i + 1 })));
  };

  const moveStoreDown = (index) => {
    if (index === editedStores.length - 1) return;
    const newStores = [...editedStores];
    [newStores[index], newStores[index + 1]] = [newStores[index + 1], newStores[index]];
    // Update sequences
    setEditedStores(newStores.map((store, i) => ({ ...store, sequence: i + 1 })));
  };

  const handleShareWhatsApp = () => {
    // Generate estimated visit times (starting at 9 AM, 1.5 hours per store)
    const startHour = 9;
    const minutesPerStore = 90; // 1.5 hours
    
    // Format date
    const routeDate = new Date(route.assigned_date).toLocaleDateString('en-GB');
    
    // Build message
    let message = `📍 Your Route for ${routeDate}\n`;
    message += `Agent: ${route.agent_name}\n`;
    message += `${route.zone || 'Delhi'} - ${route.total_stores} Stores\n\n`;
    
    // Add each store
    const stores = editMode ? editedStores : route.stores || [];
    stores.forEach((store, index) => {
      const visitTime = startHour * 60 + (index * minutesPerStore); // in minutes
      const hours = Math.floor(visitTime / 60);
      const mins = visitTime % 60;
      const timeStr = `${hours}:${mins.toString().padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
      
      message += `🏪 Store ${index + 1}: ${store.store_name || store.name || store.shop_name || 'Store'}\n`;
      
      // Add Google Maps link if coordinates available
      const lat = store.lat || store.latitude;
      const lng = store.lng || store.longitude;
      if (lat && lng) {
        message += `📍 https://www.google.com/maps/search/?api=1&query=${lat},${lng}\n`;
      }
      
      // Add phone if available
      if (store.phone_number) {
        message += `📞 ${store.phone_number}\n`;
      }
      
      message += `⏰ ${timeStr}\n\n`;
    });
    
    // Add totals
    const distance = route.total_distance_km || route.total_route_distance_km || 0;
    const time = route.estimated_time_hours || 0;
    message += `📊 Total: ${distance} km | ~${time} hours\n\n`;
    message += `Good luck! 🐾`;
    
    // Open WhatsApp
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleOpenInGoogleMaps = () => {
    const stores = editMode ? editedStores : route.stores || [];
    
    if (stores.length === 0) {
      setErrorMessage('No stores in route');
      setShowErrorModal(true);
      return;
    }

    // Get coordinates for all stores
    const storesWithCoords = stores.filter(store => {
      const lat = store.lat || store.latitude;
      const lng = store.lng || store.longitude;
      return lat && lng;
    });

    if (storesWithCoords.length === 0) {
      setErrorMessage('No store coordinates available');
      setShowErrorModal(true);
      return;
    }

    // Start point (first store)
    const firstStore = storesWithCoords[0];
    const origin = `${firstStore.lat || firstStore.latitude},${firstStore.lng || firstStore.longitude}`;
    
    // End point (last store)
    const lastStore = storesWithCoords[storesWithCoords.length - 1];
    const destination = `${lastStore.lat || lastStore.latitude},${lastStore.lng || lastStore.longitude}`;
    
    // Waypoints (middle stores) - Google Maps allows max 9 waypoints
    const middleStores = storesWithCoords.slice(1, -1);
    const maxWaypoints = Math.min(middleStores.length, 9);
    const waypoints = middleStores
      .slice(0, maxWaypoints)
      .map(store => `${store.lat || store.latitude},${store.lng || store.longitude}`)
      .join('|');
    
    // Build URL
    let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
    
    if (waypoints) {
      url += `&waypoints=${waypoints}`;
    }
    
    url += '&travelmode=driving';
    
    // Open in new tab
    window.open(url, '_blank');
  };

  const handleDelete = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${backendUrl}/api/retail/routes/${route_id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        navigate('/admin/retail-visits/routes');
      } else {
        setErrorMessage('Failed to delete route');
        setShowErrorModal(true);
      }
    } catch (err) {
      console.error('Error deleting route:', err);
      setErrorMessage('Error deleting route. Please try again.');
      setShowErrorModal(true);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-6xl mx-auto">
          <div className={`text-center py-20 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
            Loading route details...
          </div>
        </div>
      </div>
    );
  }

  if (error || !route) {
    return (
      <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-6xl mx-auto">
          <div className={`text-center py-20 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
            <p className="text-red-500 mb-4">{error || 'Route not found'}</p>
            <Link to="/admin/retail-visits/routes" className="text-blue-500 hover:underline">
              Back to Routes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTierBadgeColor = (tier) => {
    switch (tier) {
      case 'TIER1': return 'bg-purple-100 text-purple-800';
      case 'TIER2': return 'bg-blue-100 text-blue-800';
      case 'TIER3': return 'bg-green-100 text-green-800';
      case 'TIER4': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link 
            to="/admin/retail-visits/routes"
            className={`text-sm mb-4 inline-block ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
          >
            ← Back to Routes
          </Link>
          <div className="flex justify-between items-start">
            <div>
              <h1 className={`text-xl font-bold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                {route.route_name}
              </h1>
              <p className={`mt-1 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                Route ID: {route.route_id}
              </p>
            </div>
            <div className="flex gap-3">
              {editMode ? (
                <>
                  <button
                    onClick={handleCancelEdit}
                    disabled={saving}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    disabled={saving}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleShareWhatsApp}
                    className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    Share via WhatsApp
                  </button>
                  <button
                    onClick={handleOpenInGoogleMaps}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    Open in Google Maps
                  </button>
                  <button
                    onClick={() => setEditMode(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Edit Route
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Delete Route
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Route Overview Card */}
        <div className={`rounded-lg shadow p-6 mb-6 ${isDarkMode ? 'bg-gray-800 border border-white/10' : 'bg-white'}`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
            Route Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>Agent</p>
              {editMode ? (
                <select
                  value={editedAgentId}
                  onChange={(e) => setEditedAgentId(e.target.value)}
                  className={`w-full mt-1 px-3 py-2 rounded border ${isDarkMode ? 'bg-gray-700 border-white/10 text-pearl-white' : 'bg-white border-gray-300'}`}
                >
                  {agents.map(agent => (
                    <option key={agent.agent_id} value={agent.agent_id}>
                      {agent.agent_name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className={`font-semibold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                  {route.agent_name}
                </p>
              )}
            </div>
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>Date</p>
              {editMode ? (
                <input
                  type="date"
                  value={editedDate}
                  onChange={(e) => setEditedDate(e.target.value)}
                  className={`w-full mt-1 px-3 py-2 rounded border ${isDarkMode ? 'bg-gray-700 border-white/10 text-pearl-white' : 'bg-white border-gray-300'}`}
                />
              ) : (
                <p className={`font-semibold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                  {new Date(route.assigned_date).toLocaleDateString()}
                </p>
              )}
            </div>
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>Status</p>
              <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(route.status)}`}>
                {route.status}
              </span>
            </div>
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>Zone</p>
              <p className={`font-semibold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                {route.zone || 'N/A'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>Total Stores</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                {editMode ? editedStores.length : route.total_stores}
              </p>
            </div>
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>Total Distance</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                {route.total_distance_km || route.total_route_distance_km || 0} km
              </p>
            </div>
            <div>
              <p className={`text-sm ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>Est. Time</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                {route.estimated_time_hours || 0} hrs
              </p>
            </div>
          </div>
        </div>

        {/* Store List */}
        <div className={`rounded-lg shadow p-6 mb-6 ${isDarkMode ? 'bg-gray-800 border border-white/10' : 'bg-white'}`}>
          <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
            Store Visit Sequence {editMode && <span className="text-sm font-normal text-gray-500">(Use arrows to reorder)</span>}
          </h2>
          
          {editMode ? (
            <div className="space-y-3">
              {editedStores.map((store, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold ${isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`}>
                      {index + 1}
                    </div>
                    <div className="flex-grow">
                      <h3 className={`font-semibold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                        {store.store_name || store.name || store.shop_name || 'Store ' + (index + 1)}
                      </h3>
                      <p className={`text-sm mt-1 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                        {store.address || store.formatted_address || 'Address not available'}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveStoreUp(index)}
                        disabled={index === 0}
                        className={`text-2xl ${index === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110 transition-transform'}`}
                        title="Move up"
                      >
                        ⬆️
                      </button>
                      <button
                        onClick={() => moveStoreDown(index)}
                        disabled={index === editedStores.length - 1}
                        className={`text-2xl ${index === editedStores.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110 transition-transform'}`}
                        title="Move down"
                      >
                        ⬇️
                      </button>
                    </div>
                    <button
                      onClick={() => confirmRemoveStore(index)}
                      className="text-red-600 hover:text-red-800 font-bold text-xl"
                      title="Remove store"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {route.stores && route.stores.length > 0 ? (
                route.stores.map((store, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold ${isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`}>
                        {store.sequence || index + 1}
                      </div>
                      <div className="flex-grow">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className={`font-semibold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                              {store.store_name || store.name || store.shop_name || 'Store ' + (index + 1)}
                            </h3>
                            <p className={`text-sm mt-1 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                              {store.address || store.formatted_address || 'Address not available'}
                            </p>
                            {store.phone_number && (
                              <p className={`text-sm mt-1 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                                📞 {store.phone_number}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {store.tier && (
                              <span className={`px-2 py-1 text-xs font-semibold rounded ${getTierBadgeColor(store.tier)}`}>
                                {store.tier}
                              </span>
                            )}
                          </div>
                        </div>
                        {store.distance_from_previous_km && store.distance_from_previous_km > 0 && (
                          <p className={`text-xs mt-2 ${isDarkMode ? 'text-pearl-white/50' : 'text-gray-500'}`}>
                            📍 {store.distance_from_previous_km} km from previous stop
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className={`text-center py-8 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                  No stores in this route
                </p>
              )}
            </div>
          )}
        </div>

        {/* Map Section */}
        {!editMode && route.map_url && (
          <div className={`rounded-lg shadow p-6 ${isDarkMode ? 'bg-gray-800 border border-white/10' : 'bg-white'}`}>
            <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
              Route Map
            </h2>
            <a
              href={route.map_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              🗺️ Open in Google Maps
            </a>
          </div>
        )}

        {/* Modals */}
        <SuccessModal
          show={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          title="Route Updated!"
          message="Your changes have been saved successfully."
          subtitle={route.route_name}
        />

        <ConfirmModal
          show={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
          title="Delete Route?"
          message={`Are you sure you want to delete "${route.route_name}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          danger={true}
        />

        <ConfirmModal
          show={showRemoveStoreConfirm}
          onClose={() => setShowRemoveStoreConfirm(false)}
          onConfirm={() => handleRemoveStore(storeToRemove)}
          title="Remove Store?"
          message="Are you sure you want to remove this store from the route?"
          confirmText="Remove"
          cancelText="Cancel"
          danger={true}
        />

        <ErrorModal
          show={showErrorModal}
          onClose={() => setShowErrorModal(false)}
          title="Error"
          message={errorMessage}
        />
      </div>
    </div>
  );
};

export default RouteDetailsPage;
