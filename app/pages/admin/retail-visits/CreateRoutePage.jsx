import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';
import { useNavigate, useLocation } from 'react-router';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { X } from 'lucide-react';

// Hide console errors in production
if (process.env.NODE_ENV === 'production') {
  console.error = () => {};
}

const CreateRoutePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDarkMode } = useAdminTheme();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [agents, setAgents] = useState([]);
  const [generatedRoute, setGeneratedRoute] = useState(null);
  
  // Get selected stores from navigation state
  const { selectedStores = [], area: passedArea = '', zone: passedZone = '', searchQuery = '' } = location.state || {};
  const [routeStores, setRouteStores] = useState(selectedStores);
  
  // Calculate zone from selected stores
  const calculateZoneFromStores = () => {
    if (routeStores.length === 0) return 'West Delhi'; // Default
    
    // Get unique zones from selected stores
    const storeZones = [...new Set(routeStores.map(store => store.zone).filter(Boolean))];
    
    if (storeZones.length === 0) return 'West Delhi'; // No zones found, use default
    if (storeZones.length === 1) return storeZones[0]; // All stores from same zone
    return 'Mixed Zones'; // Stores from different zones
  };
  
  const autoCalculatedZone = calculateZoneFromStores();
  const isMixedZones = autoCalculatedZone === 'Mixed Zones';
  
  const [formData, setFormData] = useState({
    agent_id: '',
    date: new Date().toISOString().split('T')[0],
    area: passedArea || '',
    zone: passedZone || autoCalculatedZone,
    num_stores: selectedStores.length || 8,
    optimization_type: 'nearest_neighbor'
  });

  const backendUrl = API_BASE_URL;
  
  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      // Fetch REAL agents from database
      const response = await fetch(`${backendUrl}/api/retail/agents`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const agentsList = await response.json();
        setAgents(agentsList);
        
        // Auto-select first agent if only 1 agent exists
        if (agentsList.length === 1 && !formData.agent_id) {
          setFormData(prev => ({ ...prev, agent_id: agentsList[0].agent_id }));
        } else if (agentsList.length > 0 && !formData.agent_id) {
          // Auto-select first agent for convenience
          setFormData(prev => ({ ...prev, agent_id: agentsList[0].agent_id }));
        }
      } else {
        console.error('Failed to fetch agents');
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const removeStoreFromRoute = (storeId) => {
    const updatedStores = routeStores.filter(store => store.google_place_id !== storeId);
    setRouteStores(updatedStores);
    setFormData({ ...formData, num_stores: updatedStores.length });
  };

  const handleGenerateRoute = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.agent_id) {
      alert('Please select an agent');
      return;
    }
    
    // Calculate area and zone from selected stores
    let calculatedArea = 'Delhi';  // Default
    let calculatedZone = 'West Delhi';  // Default
    
    if (routeStores.length > 0) {
      // Get unique areas and zones from selected stores
      const storeAreas = [...new Set(routeStores.map(store => store.area).filter(Boolean))];
      const storeZones = [...new Set(routeStores.map(store => store.zone).filter(Boolean))];
      
      // Use first area/zone if available
      if (storeAreas.length > 0) calculatedArea = storeAreas[0];
      if (storeZones.length > 0) calculatedZone = storeZones[0];
    }
    
    setGenerating(true);

    try {
      const token = localStorage.getItem('adminToken');
      
      // Build request payload with calculated area/zone AND selected stores
      const requestPayload = {
        ...formData,
        area: calculatedArea,
        zone: calculatedZone,
        stores: routeStores  // CRITICAL: Send selected stores from search results
      };
      
      console.log('Generating route with data:', requestPayload);
      console.log('Selected stores count:', routeStores.length);
      
      const response = await fetch(`${backendUrl}/api/retail/routes/generate-daily`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestPayload)
      });

      const data = await response.json().catch(() => ({ message: 'Failed to generate route' }));
      
      if (!response.ok) {
        console.error('Route generation error:', data);
        alert(`Error: ${data.detail || data.message || 'Failed to generate route'}`);
        return;
      }

      setGeneratedRoute(data);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error generating route:', error);
      alert('Failed to generate route. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleAssignRoute = async () => {
    if (!generatedRoute) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(
        `${backendUrl}/api/retail/routes/${generatedRoute.route_id}/assign`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            agent_id: formData.agent_id,
            confirm: true
          })
        }
      );

      const data = await response.json().catch(() => ({}));
      
      if (response.ok) {
        alert('Route assigned successfully!');
        navigate('/admin/retail-visits/routes');
      } else {
        alert(`Error: ${data.detail || 'Failed to assign route'}`);
      }
    } catch (error) {
      console.error('Error assigning route:', error);
      alert('Failed to assign route. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Success Modal */}
      {showSuccessModal && generatedRoute && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`max-w-md w-full rounded-lg shadow-xl p-6 ${isDarkMode ? 'bg-gray-800 border border-white/10' : 'bg-white'}`}>
            {/* Modal Header */}
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">✅</div>
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                Route Created!
              </h2>
            </div>

            {/* Route Details */}
            <div className={`space-y-3 mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
              <p className={`text-sm ${isDarkMode ? 'text-pearl-white/80' : 'text-gray-700'}`}>
                Optimized route for <span className="font-semibold">{agents.find(a => a.agent_id === formData.agent_id)?.agent_name || 'Agent'}</span>
              </p>
              <div className={`flex justify-between text-sm ${isDarkMode ? 'text-pearl-white/70' : 'text-gray-600'}`}>
                <span>📅 Date:</span>
                <span className="font-medium">{new Date(formData.date).toLocaleDateString()}</span>
              </div>
              <div className={`flex justify-between text-sm ${isDarkMode ? 'text-pearl-white/70' : 'text-gray-600'}`}>
                <span>🏪 Stores:</span>
                <span className="font-medium">{generatedRoute.total_stores}</span>
              </div>
              <div className={`flex justify-between text-sm ${isDarkMode ? 'text-pearl-white/70' : 'text-gray-600'}`}>
                <span>📍 Distance:</span>
                <span className="font-medium">{generatedRoute.total_distance_km} km</span>
              </div>
              <div className={`flex justify-between text-sm ${isDarkMode ? 'text-pearl-white/70' : 'text-gray-600'}`}>
                <span>⏱️ Est. Time:</span>
                <span className="font-medium">{generatedRoute.estimated_time_hours} hours</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate('/admin/retail-visits/routes');
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
              >
                View All Routes
              </button>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  window.location.reload();
                }}
                className={`w-full font-medium py-3 px-6 rounded-lg border transition-colors ${
                  isDarkMode 
                    ? 'border-white/10 text-pearl-white hover:bg-white/5' 
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Create Another Route
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/retail-visits/routes')}
            className={`mb-4 flex items-center ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`}
          >
            ← Back to Routes
          </button>
          <h1 className={`text-xl font-bold ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>Create Daily Route</h1>
          <p className={`mt-1 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>Generate optimized route for sales agent</p>
        </div>

        {/* Selected Stores for Route */}
        {routeStores.length > 0 && (
          <div className={`rounded-lg shadow p-6 mb-6 ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white'}`}>
            <h2 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
              Stores Selected for Route ({routeStores.length})
            </h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {routeStores.map((store, index) => (
                <div 
                  key={store.google_place_id} 
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    isDarkMode ? 'bg-white/5' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className={`font-bold text-sm ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-500'}`}>
                      {index + 1}.
                    </span>
                    <div className="flex-1">
                      <div className={`font-semibold text-sm ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>
                        {store.store_name}
                      </div>
                      <div className={`text-xs ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                        {store.address}
                      </div>
                    </div>
                    {store.tier && (
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        store.tier === 'TIER1' ? 'bg-green-500/20 text-green-400' :
                        store.tier === 'TIER2' ? 'bg-yellow-500/20 text-yellow-400' :
                        store.tier === 'TIER3' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {store.tier}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => removeStoreFromRoute(store.google_place_id)}
                    className={`ml-3 p-1 rounded hover:bg-red-500/20 transition-colors ${
                      isDarkMode ? 'text-red-400' : 'text-red-600'
                    }`}
                    title="Remove from route"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
            <div className={`mt-4 p-3 rounded-lg ${isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
              <p className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
                ℹ️ These stores will be used to generate the optimized route
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <div className={`rounded-lg shadow p-6 mb-6 ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white'}`}>
          <form onSubmit={handleGenerateRoute}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Agent Selection */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-700'}`}>
                  Select Agent *
                </label>
                <select
                  required
                  value={formData.agent_id}
                  onChange={(e) => setFormData({ ...formData, agent_id: e.target.value })}
                  className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-white/5 border-white/10 text-pearl-white [&>option]:bg-gray-800 [&>option]:text-pearl-white' 
                      : 'border-gray-300'
                  }`}
                >
                  <option value="">Choose an agent</option>
                  {/* Deduplicate agents by name - show each unique agent only once */}
                  {agents
                    .filter((agent, index, self) => 
                      index === self.findIndex(a => a.agent_name === agent.agent_name)
                    )
                    .map(agent => (
                      <option key={agent.agent_id} value={agent.agent_id}>
                        {agent.agent_name}
                      </option>
                    ))
                  }
                </select>
              </div>

              {/* Date */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-700'}`}>
                  Route Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-white/5 border-white/10 text-pearl-white' 
                      : 'border-gray-300'
                  }`}
                />
              </div>

              {/* Number of Stores */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-700'}`}>
                  Number of Stores (1-15) {routeStores.length > 0 && <span className="text-xs text-green-500">(Auto-filled: {routeStores.length} selected)</span>}
                </label>
                <input
                  type="number"
                  min="1"
                  max="15"
                  required
                  value={formData.num_stores}
                  onChange={(e) => setFormData({ ...formData, num_stores: parseInt(e.target.value) })}
                  className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-white/5 border-white/10 text-pearl-white' 
                      : 'border-gray-300'
                  }`}
                />
                {routeStores.length > 0 && (
                  <p className={`text-xs mt-2 ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                    You selected {routeStores.length} store{routeStores.length !== 1 ? 's' : ''} for this route
                  </p>
                )}
              </div>

              {/* Optimization Type */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-pearl-white' : 'text-gray-700'}`}>
                  Optimization Algorithm
                </label>
                <select
                  value={formData.optimization_type}
                  onChange={(e) => setFormData({ ...formData, optimization_type: e.target.value })}
                  className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    isDarkMode 
                      ? 'bg-white/5 border-white/10 text-pearl-white [&>option]:bg-gray-800 [&>option]:text-pearl-white' 
                      : 'border-gray-300'
                  }`}
                >
                  <option value="nearest_neighbor">Nearest Neighbor</option>
                </select>
              </div>
            </div>

            {/* Generate Button */}
            <div className="mt-6">
              <button
                type="submit"
                disabled={generating}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                {generating ? 'Generating Route...' : 'Generate Route'}
              </button>
            </div>
          </form>
        </div>

        {/* Route Preview */}
        {generatedRoute && (
          <div className={`rounded-lg shadow p-6 ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white'}`}>
            <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>Route Preview</h2>
            
            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-blue-500/10' : 'bg-blue-50'}`}>
                <div className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>Total Stores</div>
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-blue-300' : 'text-blue-900'}`}>{generatedRoute.total_stores}</div>
              </div>
              <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-green-500/10' : 'bg-green-50'}`}>
                <div className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>Total Distance</div>
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-green-300' : 'text-green-900'}`}>{generatedRoute.total_distance_km} km</div>
              </div>
              <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-purple-500/10' : 'bg-purple-50'}`}>
                <div className={`text-sm ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>Estimated Time</div>
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-purple-300' : 'text-purple-900'}`}>{generatedRoute.estimated_time_hours} hrs</div>
              </div>
              <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-yellow-500/10' : 'bg-yellow-50'}`}>
                <div className={`text-sm ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>Agent</div>
                <div className={`text-lg font-bold ${isDarkMode ? 'text-yellow-300' : 'text-yellow-900'}`}>{generatedRoute.agent_name}</div>
              </div>
            </div>

            {/* Store List */}
            <div className="mb-6">
              <h3 className={`text-lg font-semibold mb-3 ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>Optimized Store Sequence</h3>
              <div className="space-y-2">
                {generatedRoute.stores?.map((store, index) => (
                  <div key={index} className={`flex items-center rounded-lg p-3 ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-3">
                      {store.sequence}
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${isDarkMode ? 'text-pearl-white' : 'text-gray-900'}`}>{store.store_name}</div>
                      <div className={`text-sm ${isDarkMode ? 'text-pearl-white/60' : 'text-gray-600'}`}>
                        {store.scheduled_time} • {store.distance_from_previous_km} km from previous
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Map Link */}
            {generatedRoute.map_url && (
              <div className="mb-6">
                <a
                  href={generatedRoute.map_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  View Route on Google Maps →
                </a>
              </div>
            )}

            {/* Assign Button */}
            <button
              onClick={handleAssignRoute}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {loading ? 'Assigning...' : 'Assign Route to Agent'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateRoutePage;
