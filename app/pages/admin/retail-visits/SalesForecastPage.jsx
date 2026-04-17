import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';
import { useNavigate } from 'react-router';
import './SalesForecastPage.css';

const API_BASE = API_BASE_URL;

const SalesForecastPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState([]);
  const [forecasts, setForecasts] = useState([]);
  const [summary, setSummary] = useState({
    totalStores: 0,
    todayForecast: 0,
    monthlyProjection: 0,
    marginPerUnit: 50
  });
  const [tierDistribution, setTierDistribution] = useState({
    platinum: 0,
    gold: 0,
    silver: 0,
    bronze: 0
  });
  const [editingStore, setEditingStore] = useState(null);
  const [editMetrics, setEditMetrics] = useState({
    hourlyFootfall: 10,
    operatingHours: 10,
    placement: 'shelf',
    ownerPush: 'neutral'
  });
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const adminToken = localStorage.getItem('adminToken');
      const headers = {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      };

      // Fetch stores from retail_stores collection
      const storesRes = await fetch(`${API_BASE}/api/v1/retail/stores`, { headers });
      const storesData = await storesRes.json();
      
      // Fetch existing forecasts
      const forecastsRes = await fetch(`${API_BASE}/api/v1/retail/forecasts/all`, { headers });
      const forecastsData = await forecastsRes.json();
      
      const storesList = storesData.stores || [];
      const forecastsList = forecastsData.forecasts || [];
      
      setStores(storesList);
      setForecasts(forecastsList);
      
      // Calculate summary
      let totalDaily = 0;
      let platinum = 0, gold = 0, silver = 0, bronze = 0;
      
      forecastsList.forEach(f => {
        const daily = f.calculated?.daily_revenue || 0;
        const monthly = f.calculated?.monthly_revenue || 0;
        totalDaily += daily;
        
        if (monthly >= 5000) platinum++;
        else if (monthly >= 2000) gold++;
        else if (monthly >= 500) silver++;
        else bronze++;
      });
      
      setSummary({
        totalStores: forecastsList.length,
        todayForecast: totalDaily,
        monthlyProjection: totalDaily * 26,
        marginPerUnit: 50
      });
      
      setTierDistribution({ platinum, gold, silver, bronze });
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePreview = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE}/api/v1/retail/forecasts/preview?margin=50`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editMetrics)
      });
      const data = await res.json();
      setPreview(data);
    } catch (error) {
      console.error('Error calculating preview:', error);
    }
  };

  useEffect(() => {
    if (editingStore) {
      calculatePreview();
    }
  }, [editMetrics, editingStore]);

  const handleSaveMetrics = async () => {
    if (!editingStore) return;
    
    try {
      const adminToken = localStorage.getItem('adminToken');
      await fetch(`${API_BASE}/api/v1/retail/forecasts/store/${editingStore._id}/metrics`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ metrics: editMetrics, margin_per_unit: 50 })
      });
      
      setEditingStore(null);
      fetchData();
    } catch (error) {
      console.error('Error saving metrics:', error);
    }
  };

  const openEditModal = (store, forecast) => {
    setEditingStore(store);
    setEditMetrics({
      hourlyFootfall: forecast?.metrics?.hourly_footfall || 10,
      operatingHours: forecast?.metrics?.operating_hours || 10,
      placement: forecast?.metrics?.placement || 'shelf',
      ownerPush: forecast?.metrics?.owner_push || 'neutral'
    });
    setPreview(forecast?.calculated || null);
  };

  const getTierBadge = (monthly) => {
    if (monthly >= 5000) return <span className="tier-badge platinum">💎 Platinum</span>;
    if (monthly >= 2000) return <span className="tier-badge gold">🥇 Gold</span>;
    if (monthly >= 500) return <span className="tier-badge silver">🥈 Silver</span>;
    return <span className="tier-badge bronze">🥉 Bronze</span>;
  };

  const getTopPerformers = () => {
    return [...forecasts]
      .sort((a, b) => (b.calculated?.monthly_revenue || 0) - (a.calculated?.monthly_revenue || 0))
      .slice(0, 3);
  };

  const getNeedsAttention = () => {
    return forecasts.filter(f => {
      const monthly = f.calculated?.monthly_revenue || 0;
      return monthly < 500;
    });
  };

  if (loading) {
    return (
      <div className="forecast-page">
        <div className="loading">Loading Sales Forecast...</div>
      </div>
    );
  }

  return (
    <div className="forecast-page">
      {/* Header */}
      <div className="forecast-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/admin/retail-visits')}>
            ← Back to Retail Visits
          </button>
          <h1>📊 Sales Forecast Board</h1>
          <p>Real-time revenue projections and store intelligence</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-icon">🏪</div>
          <div className="card-content">
            <span className="card-label">Total Stores</span>
            <span className="card-value">{summary.totalStores}</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon">📅</div>
          <div className="card-content">
            <span className="card-label">Today's Forecast</span>
            <span className="card-value">₹{summary.todayForecast.toLocaleString()}</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <span className="card-label">Monthly Projection</span>
            <span className="card-value">₹{summary.monthlyProjection.toLocaleString()}</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <span className="card-label">Margin/Unit</span>
            <span className="card-value">₹{summary.marginPerUnit}</span>
          </div>
        </div>
      </div>

      {/* Formula Bar */}
      <div className="formula-bar">
        <span className="formula-label">Formula:</span>
        <code>Footfall/hr × Hours × Conversion% × ₹50 = Daily Revenue</code>
      </div>

      {/* Tier Distribution */}
      <div className="tier-distribution">
        <h3>Tier Distribution</h3>
        <div className="tier-cards">
          <div className="tier-card platinum">
            <span className="tier-badge">💎 Platinum</span>
            <span className="tier-count">{tierDistribution.platinum} stores</span>
            <span className="tier-threshold">≥₹5,000/mo</span>
          </div>
          <div className="tier-card gold">
            <span className="tier-badge">🥇 Gold</span>
            <span className="tier-count">{tierDistribution.gold} stores</span>
            <span className="tier-threshold">≥₹2,000/mo</span>
          </div>
          <div className="tier-card silver">
            <span className="tier-badge">🥈 Silver</span>
            <span className="tier-count">{tierDistribution.silver} stores</span>
            <span className="tier-threshold">≥₹500/mo</span>
          </div>
          <div className="tier-card bronze">
            <span className="tier-badge">🥉 Bronze</span>
            <span className="tier-count">{tierDistribution.bronze} stores</span>
            <span className="tier-threshold">&lt;₹500/mo</span>
          </div>
        </div>
      </div>

      {/* Insights */}
      <div className="insights-section">
        <h3>Insights</h3>
        <div className="insights-grid">
          <div className="insight-card top-performers">
            <h4>🏆 Top Performers</h4>
            {getTopPerformers().length > 0 ? (
              getTopPerformers().map((f, i) => (
                <div key={i} className="insight-item">
                  <span>{f.store_name || 'Store'}</span>
                  <span className="revenue">₹{(f.calculated?.monthly_revenue || 0).toLocaleString()}/mo</span>
                </div>
              ))
            ) : (
              <p className="no-data">No forecast data yet</p>
            )}
          </div>
          <div className="insight-card needs-attention">
            <h4>⚠️ Needs Attention</h4>
            {getNeedsAttention().length > 0 ? (
              getNeedsAttention().slice(0, 3).map((f, i) => (
                <div key={i} className="insight-item">
                  <span>{f.store_name || 'Store'}</span>
                  <span className="action">Review metrics</span>
                </div>
              ))
            ) : (
              <p className="no-data">All stores performing well</p>
            )}
          </div>
          <div className="insight-card opportunities">
            <h4>💡 Opportunities</h4>
            {forecasts.filter(f => f.metrics?.placement !== 'counter').length > 0 ? (
              <p>{forecasts.filter(f => f.metrics?.placement !== 'counter').length} stores can upgrade to counter placement</p>
            ) : (
              <p className="no-data">No optimization opportunities</p>
            )}
          </div>
        </div>
      </div>

      {/* Store Forecasts Grid */}
      <div className="stores-section">
        <h3>Store Forecasts ({forecasts.length})</h3>
        {forecasts.length === 0 ? (
          <div className="empty-state">
            <p>No stores have forecast data yet.</p>
            <p>Add stores from "View All Stores" page to start forecasting.</p>
          </div>
        ) : (
          <div className="stores-grid">
            {forecasts.map((forecast, index) => {
              const store = stores.find(s => s._id === forecast.store_id) || {};
              return (
                <div key={index} className="store-card">
                  <div className="store-header">
                    <h4>{forecast.store_name || store.store_name || 'Unknown Store'}</h4>
                    {getTierBadge(forecast.calculated?.monthly_revenue || 0)}
                  </div>
                  <div className="store-metrics">
                    <div className="metric">
                      <span className="metric-label">Daily</span>
                      <span className="metric-value">₹{(forecast.calculated?.daily_revenue || 0).toLocaleString()}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Monthly</span>
                      <span className="metric-value">₹{(forecast.calculated?.monthly_revenue || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="store-details">
                    <span>Footfall/hr: {forecast.metrics?.hourly_footfall || '-'}</span>
                    <span>Hours: {forecast.metrics?.operating_hours || '-'}</span>
                    <span>Placement: {forecast.metrics?.placement || '-'}</span>
                    <span>Owner Push: {forecast.metrics?.owner_push || '-'}</span>
                  </div>
                  <div className="store-recommendation">
                    <strong>Recommendation:</strong> {forecast.recommendation?.action || 'N/A'}
                  </div>
                  <button className="edit-btn" onClick={() => openEditModal(store, forecast)}>
                    ✏️ Edit Metrics
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingStore && (
        <div className="modal-overlay" onClick={() => setEditingStore(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Store Metrics</h3>
              <button className="close-btn" onClick={() => setEditingStore(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Hourly Footfall: {editMetrics.hourlyFootfall}</label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={editMetrics.hourlyFootfall}
                  onChange={e => setEditMetrics({...editMetrics, hourlyFootfall: parseInt(e.target.value)})}
                />
              </div>
              <div className="form-group">
                <label>Operating Hours: {editMetrics.operatingHours}</label>
                <input
                  type="range"
                  min="6"
                  max="16"
                  value={editMetrics.operatingHours}
                  onChange={e => setEditMetrics({...editMetrics, operatingHours: parseInt(e.target.value)})}
                />
              </div>
              <div className="form-group">
                <label>Placement</label>
                <div className="button-group">
                  {['hidden', 'shelf', 'counter'].map(p => (
                    <button
                      key={p}
                      className={editMetrics.placement === p ? 'active' : ''}
                      onClick={() => setEditMetrics({...editMetrics, placement: p})}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label>Owner Push</label>
                <div className="button-group">
                  {['none', 'passive', 'neutral', 'active'].map(p => (
                    <button
                      key={p}
                      className={editMetrics.ownerPush === p ? 'active' : ''}
                      onClick={() => setEditMetrics({...editMetrics, ownerPush: p})}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              {preview && (
                <div className="live-preview">
                  <h4>Live Preview</h4>
                  <div className="preview-grid">
                    <div><span>Daily Revenue:</span> <strong>₹{preview.daily_revenue || 0}</strong></div>
                    <div><span>Monthly Revenue:</span> <strong>₹{preview.monthly_revenue || 0}</strong></div>
                    <div><span>Conversion Rate:</span> <strong>{preview.conversion_rate || 0}%</strong></div>
                    <div><span>Tier:</span> {getTierBadge(preview.monthly_revenue || 0)}</div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setEditingStore(null)}>Cancel</button>
              <button className="save-btn" onClick={handleSaveMetrics}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesForecastPage;
