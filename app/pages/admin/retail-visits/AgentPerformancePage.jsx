import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';

const AgentPerformancePage = () => {
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentMetrics, setAgentMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);

  const backendUrl = API_BASE_URL;

  useEffect(() => {
    fetchTopAgents();
    fetchOverview();
  }, []);

  const fetchTopAgents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${backendUrl}/api/retail/analytics/top-agents?limit=10`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAgents(data.agents || []);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOverview = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${backendUrl}/api/retail/analytics/overview`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOverview(data);
      }
    } catch (error) {
      console.error('Error fetching overview:', error);
    }
  };

  const fetchAgentDetails = async (agentId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${backendUrl}/api/retail/analytics/agent/${agentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAgentMetrics(data);
        setSelectedAgent(agentId);
      }
    } catch (error) {
      console.error('Error fetching agent details:', error);
    }
  };

  const getRatingStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <span key={i} className={`text-lg ${i < fullStars ? 'text-yellow-400' : 'text-gray-300'}`}>
            ★
          </span>
        ))}
        <span className="ml-2 text-sm text-gray-600">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">Agent Performance</h1>
          <p className="text-gray-600 mt-1">Track and analyze agent performance metrics</p>
        </div>

        {/* Overview Stats */}
        {overview && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-6 text-white">
              <div className="text-sm opacity-90">Total Stores</div>
              <div className="text-xl font-bold mt-2">{overview.total_stores}</div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-6 text-white">
              <div className="text-sm opacity-90">Total Visits</div>
              <div className="text-xl font-bold mt-2">{overview.total_visits}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow p-6 text-white">
              <div className="text-sm opacity-90">Active Agents</div>
              <div className="text-xl font-bold mt-2">{overview.total_agents}</div>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg shadow p-6 text-white">
              <div className="text-sm opacity-90">Avg Conversion</div>
              <div className="text-xl font-bold mt-2">{overview.avg_conversion_rate}%</div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Agent Rankings */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Agent Rankings</h2>
              <p className="text-sm text-gray-600 mt-1">Sorted by conversion rate</p>
            </div>
            
            {loading ? (
              <div className="p-6 text-center text-gray-500">Loading agents...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Rank
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Agent
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Visits
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Conversion
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {agents.map((agent, index) => (
                      <tr 
                        key={agent.agent_id}
                        className={`hover:bg-gray-50 cursor-pointer ${selectedAgent === agent.agent_id ? 'bg-blue-50' : ''}`}
                        onClick={() => fetchAgentDetails(agent.agent_id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                            index === 0 ? 'bg-yellow-100 text-yellow-800' :
                            index === 1 ? 'bg-gray-100 text-gray-800' :
                            index === 2 ? 'bg-orange-100 text-orange-800' :
                            'bg-gray-50 text-gray-600'
                          }`}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{agent.agent_name}</div>
                          <div className="text-xs text-gray-500">{agent.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {agent.total_visits}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            agent.conversion_rate >= 20 ? 'bg-green-100 text-green-800' :
                            agent.conversion_rate >= 10 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {agent.conversion_rate}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              fetchAgentDetails(agent.agent_id);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Agent Details */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Agent Details</h2>
              <p className="text-sm text-gray-600 mt-1">
                {agentMetrics ? agentMetrics.agent_name : 'Select an agent to view details'}
              </p>
            </div>
            
            {!agentMetrics ? (
              <div className="p-6 text-center text-gray-500">
                Click on an agent to view their performance metrics
              </div>
            ) : (
              <div className="p-6">
                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm text-blue-600">Total Visits</div>
                    <div className="text-2xl font-bold text-blue-900">
                      {agentMetrics.metrics.total_visits}
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm text-green-600">Stores Stocked</div>
                    <div className="text-2xl font-bold text-green-900">
                      {agentMetrics.metrics.stores_stocked}
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-sm text-purple-600">Total Routes</div>
                    <div className="text-2xl font-bold text-purple-900">
                      {agentMetrics.metrics.total_routes}
                    </div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="text-sm text-yellow-600">Conversion Rate</div>
                    <div className="text-2xl font-bold text-yellow-900">
                      {agentMetrics.metrics.conversion_rate}%
                    </div>
                  </div>
                </div>

                {/* Additional Metrics */}
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Distance Covered</span>
                    <span className="font-semibold text-gray-900">
                      {agentMetrics.metrics.total_distance_km} km
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Avg Visit Duration</span>
                    <span className="font-semibold text-gray-900">
                      {agentMetrics.metrics.avg_visit_duration_minutes} min
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Pending Follow-ups</span>
                    <span className="font-semibold text-gray-900">
                      {agentMetrics.metrics.pending_follow_ups}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Performance Rating</span>
                    {getRatingStars(agentMetrics.metrics.rating)}
                  </div>
                </div>

                {/* Recent Visits */}
                {agentMetrics.recent_visits && agentMetrics.recent_visits.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Visits</h3>
                    <div className="space-y-2">
                      {agentMetrics.recent_visits.slice(0, 5).map((visit, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium text-gray-900">{visit.store_name}</div>
                              <div className="text-xs text-gray-600">
                                {new Date(visit.checkin_time).toLocaleString()}
                              </div>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              visit.visit_outcome === 'stocked' ? 'bg-green-100 text-green-800' :
                              visit.visit_outcome === 'interested' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {visit.visit_outcome}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentPerformancePage;
