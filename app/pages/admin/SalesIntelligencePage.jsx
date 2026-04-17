import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import './SalesIntelligencePage.css';
import { API_BASE_URL } from '@/config/api';

const API_BASE = API_BASE_URL;

// Helper functions
const getWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
};

const formatDate = (date) => {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const generatePeriods = (type) => {
  const periods = [];
  const now = new Date();
  
  if (type === 'daily') {
    // Generate last 30 days
    for (let i = 0; i < 30; i++) {
      const day = new Date(now);
      day.setDate(now.getDate() - i);
      const dateKey = day.toISOString().split('T')[0]; // YYYY-MM-DD format
      periods.push({
        value: dateKey,
        label: day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
        start: day,
        end: day,
        isCurrent: i === 0
      });
    }
  } else if (type === 'weekly') {
    for (let i = 0; i < 12; i++) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7) - now.getDay() + 1);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekNum = getWeekNumber(weekStart);
      periods.push({
        value: `${weekStart.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`,
        label: `Week ${weekNum} (${formatDate(weekStart)} - ${formatDate(weekEnd)})`,
        start: weekStart,
        end: weekEnd,
        isCurrent: i === 0
      });
    }
  } else if (type === 'monthly') {
    for (let i = 0; i < 12; i++) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      periods.push({
        value: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`,
        label: month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        start: month,
        end: new Date(month.getFullYear(), month.getMonth() + 1, 0),
        isCurrent: i === 0
      });
    }
  } else if (type === 'quarterly') {
    const currentQuarter = Math.ceil((now.getMonth() + 1) / 3);
    for (let i = 0; i < 8; i++) {
      const q = ((currentQuarter - i - 1 + 4) % 4) + 1;
      const year = now.getFullYear() - Math.floor((i + (4 - currentQuarter)) / 4);
      periods.push({
        value: `${year}-Q${q}`,
        label: `Q${q} ${year}`,
        isCurrent: i === 0
      });
    }
  } else if (type === 'ytd') {
    for (let i = 0; i < 3; i++) {
      const year = now.getFullYear() - i;
      periods.push({
        value: `${year}`,
        label: `${year}${i === 0 ? ' (YTD)' : ''}`,
        isCurrent: i === 0
      });
    }
  }
  
  return periods;
};

const SalesIntelligencePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('ecommerce');
  const [loading, setLoading] = useState(true);
  const [viewBy, setViewBy] = useState('daily');  // Default to daily - single source of truth
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [periods, setPeriods] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [summary, setSummary] = useState(null);
  const [ecomData, setEcomData] = useState(null);
  const [retailData, setRetailData] = useState(null);

  useEffect(() => {
    // Generate periods when viewBy changes
    const newPeriods = generatePeriods(viewBy);
    setPeriods(newPeriods);
    if (newPeriods.length > 0) {
      setSelectedPeriod(newPeriods[0].value);
    }
  }, [viewBy]);

  useEffect(() => {
    if (selectedPeriod) {
      fetchAllData();
    }
  }, [selectedPeriod]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      // Fetch period data - daily is source of truth, weekly/monthly are aggregated
      const periodDataRes = await fetch(
        `${API_BASE}/api/v1/sales/ecommerce/period-data?type=${viewBy}&key=${selectedPeriod}`
      );
      const periodData = await periodDataRes.json();
      
      if (periodData.success && periodData.data) {
        // Transform saved/aggregated data to nested structure for table rendering
        const products = periodData.data.products || [];
        const transformedProducts = products.map(savedProduct => {
          const sold = savedProduct.units_sold || savedProduct.sold_units || 0;
          const target = savedProduct.target_units || 0;
          const gap = sold - target;
          const sellPrice = savedProduct.sell_price || savedProduct.ecom_sell_price || 0;
          const margin = savedProduct.margin || savedProduct.ecom_margin || 0;
          
          return {
            product: {
              product_name: savedProduct.name || savedProduct.product_name || 'Unknown Product',
              sku: savedProduct.sku || 'N/A',
              weight: savedProduct.weight || 'N/A',
              ecom_sell_price: sellPrice,
              ecom_cogs: savedProduct.cogs || savedProduct.ecom_cogs || 0,
              ecom_margin: margin,
              ecom_margin_percent: savedProduct.ecom_margin_percent || 40
            },
            target_units: target,
            sold_units: sold,
            gap: gap,
            revenue: savedProduct.revenue || (sold * sellPrice),
            profit: savedProduct.profit || (sold * margin),
            status: gap >= 0 ? 'ahead' : (gap > -5 ? 'behind' : 'critical'),
            funnel: {
              impressions: savedProduct.impressions || 0,
              clicks: savedProduct.clicks || 0,
              add_to_cart: savedProduct.add_to_cart || 0,
              checkouts: savedProduct.checkouts || 0,
              orders: savedProduct.orders || 0,
              click_rate: savedProduct.click_rate || 0,
              cart_rate: savedProduct.cart_rate || 0,
              checkout_rate: savedProduct.checkout_rate || 0,
              conversion_rate: savedProduct.conversion_rate || 0
            }
          };
        });
        
        // Use transformed saved data with aggregation info
        setEcomData({
          products: transformedProducts,
          funnel_aggregate: periodData.data.funnel_totals || {},
          kpis: periodData.data.kpis || {},
          totals: periodData.data.summary || {},
          // Include aggregation metadata
          daysIncluded: periodData.daysIncluded || periodData.data?.daysIncluded || 0,
          isAggregated: periodData.isAggregated || false,
          editable: periodData.editable !== false
        });
      } else {
        // No data for this period - show empty state
        setEcomData({ 
          products: [], 
          funnel_aggregate: {}, 
          kpis: {}, 
          totals: {},
          daysIncluded: 0,
          isAggregated: viewBy !== 'daily',
          editable: viewBy === 'daily',
          message: periodData.message || 'No data available'
        });
      }
      
      // Always fetch retail (not period-dependent yet)
      const retailRes = await fetch(`${API_BASE}/api/v1/sales/intelligence/retail`);
      setRetailData(await retailRes.json());
      
      // Fetch summary
      const summaryRes = await fetch(`${API_BASE}/api/v1/sales/intelligence/summary`);
      setSummary(await summaryRes.json());
      
    } catch (error) {
      console.error('Error fetching data:', error);
      // Set fallback empty data to prevent crashes
      setEcomData({ products: [], funnel_aggregate: {}, kpis: {}, totals: {}, daysIncluded: 0 });
      setRetailData({ stores: [], funnel_aggregate: {}, kpis: {}, totals: {} });
      setSummary({ summary: {}, ecommerce: {}, retail: {} });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      ahead: { text: '🟢 Ahead', class: 'ahead' },
      behind: { text: '🟡 Behind', class: 'behind' },
      critical: { text: '🔴 Critical', class: 'critical' }
    };
    const badge = config[status] || config.behind;
    return <span className={`status-badge ${badge.class}`}>{badge.text}</span>;
  };

  const formatCurrency = (amount) => {
    return '₹' + Math.round(amount).toLocaleString('en-IN');
  };

  const currentPeriod = periods.find(p => p.value === selectedPeriod);

  if (loading) {
    return (
      <div className="sales-intel-page">
        <div className="loading">Loading Sales Intelligence...</div>
      </div>
    );
  }

  return (
    <div className="sales-intel-page">
      {/* Header with Period Controls */}
      <div className="page-header">
        <div className="header-left">
          <button className="back-btn" onClick={() => navigate('/admin/retail-visits')}>
            ← Back
          </button>
          <h1>📊 Sales Intelligence Dashboard</h1>
        </div>
        
        <div className="period-controls">
          <div className="control-group">
            <label>View By:</label>
            <select value={viewBy} onChange={(e) => setViewBy(e.target.value)} className="period-select">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="ytd">Year to Date</option>
            </select>
          </div>
          
          <div className="control-group">
            <label>Period:</label>
            {viewBy === 'daily' ? (
              <input
                type="date"
                value={selectedPeriod || ''}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="period-select date-picker"
                max={new Date().toISOString().split('T')[0]}
              />
            ) : (
              <select 
                value={selectedPeriod || ''} 
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="period-select"
              >
                {periods.map(p => (
                  <option key={p.value} value={p.value}>
                    {p.label} {p.has_data ? '✓' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
          
          {/* Edit button only shows for Daily view */}
          {viewBy === 'daily' ? (
            <button className="edit-btn" onClick={() => setShowEditModal(true)}>
              ✏️ Edit {activeTab === 'ecommerce' ? 'E-Commerce' : 'Retail'} Data
            </button>
          ) : (
            <div className="aggregation-notice">
              <span className="aggregation-badge">
                📊 Aggregated from {ecomData?.daysIncluded || 0} days
              </span>
              <span className="aggregation-hint">(Edit data in Daily view)</span>
            </div>
          )}
          
          <button className="refresh-btn" onClick={fetchAllData}>
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Aggregation Banner for non-daily views */}
      {viewBy !== 'daily' && (
        <div className="aggregation-banner">
          <span className="banner-icon">ℹ️</span>
          <span className="banner-text">
            This {viewBy === 'ytd' ? 'yearly' : viewBy} view aggregates data from <strong>{ecomData?.daysIncluded || 0}</strong> daily entries.
            {ecomData?.daysIncluded === 0 && " No daily data found for this period."}
          </span>
          <button className="switch-to-daily-btn" onClick={() => setViewBy('daily')}>
            Switch to Daily View to Edit
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="summary-row">
        <div className="summary-card total">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <span className="label">Weekly Revenue Target</span>
            <span className="value">{formatCurrency(summary?.summary?.total_revenue_target || 0)}</span>
            <span className="sub">{summary?.summary?.achievement_rate || 0}% achieved</span>
          </div>
        </div>
        <div className="summary-card ecom">
          <div className="card-icon">🛍️</div>
          <div className="card-content">
            <span className="label">E-Commerce</span>
            <span className="value">{formatCurrency(summary?.ecommerce?.revenue_achieved || 0)}</span>
            <span className="sub">Target: {formatCurrency(summary?.ecommerce?.revenue_target || 0)}</span>
          </div>
          <div className="progress-ring" style={{'--progress': summary?.ecommerce?.achievement_rate || 0}}>
            <span>{summary?.ecommerce?.achievement_rate || 0}%</span>
          </div>
        </div>
        <div className="summary-card retail">
          <div className="card-icon">🏪</div>
          <div className="card-content">
            <span className="label">Retail</span>
            <span className="value">{formatCurrency(summary?.retail?.revenue_achieved || 0)}</span>
            <span className="sub">Target: {formatCurrency(summary?.retail?.revenue_target || 0)}</span>
          </div>
          <div className="progress-ring" style={{'--progress': summary?.retail?.achievement_rate || 0}}>
            <span>{summary?.retail?.achievement_rate || 0}%</span>
          </div>
        </div>
        <div className="summary-card profit">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <span className="label">Total Profit</span>
            <span className="value">{formatCurrency(summary?.summary?.total_profit || 0)}</span>
            <span className="sub">Combined margin</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'ecommerce' ? 'active' : ''}`}
          onClick={() => setActiveTab('ecommerce')}
        >
          🛍️ E-Commerce
        </button>
        <button 
          className={`tab ${activeTab === 'retail' ? 'active' : ''}`}
          onClick={() => setActiveTab('retail')}
        >
          🏪 Retail
        </button>
      </div>

      {/* E-Commerce Tab */}
      {activeTab === 'ecommerce' && ecomData && (
        <div className="tab-content">
          {/* Funnel */}
          <div className="section funnel-section">
            <h3>📊 Sales Funnel</h3>
            <div className="funnel">
              <div className="funnel-step">
                <div className="step-value">{ecomData.funnel_aggregate?.impressions?.toLocaleString()}</div>
                <div className="step-label">Impressions</div>
                <div className="step-rate">100%</div>
              </div>
              <div className="funnel-arrow">→</div>
              <div className="funnel-step">
                <div className="step-value">{ecomData.funnel_aggregate?.clicks?.toLocaleString()}</div>
                <div className="step-label">Clicks</div>
                <div className="step-rate">{ecomData.funnel_aggregate?.click_rate}%</div>
              </div>
              <div className="funnel-arrow">→</div>
              <div className="funnel-step">
                <div className="step-value">{ecomData.funnel_aggregate?.add_to_cart?.toLocaleString()}</div>
                <div className="step-label">Add to Cart</div>
                <div className="step-rate">{ecomData.funnel_aggregate?.cart_rate}%</div>
              </div>
              <div className="funnel-arrow">→</div>
              <div className="funnel-step">
                <div className="step-value">{ecomData.funnel_aggregate?.checkouts?.toLocaleString()}</div>
                <div className="step-label">Checkout</div>
                <div className="step-rate">{ecomData.funnel_aggregate?.checkout_rate}%</div>
              </div>
              <div className="funnel-arrow">→</div>
              <div className="funnel-step highlight">
                <div className="step-value">{ecomData.funnel_aggregate?.orders?.toLocaleString()}</div>
                <div className="step-label">Orders</div>
                <div className="step-rate">{ecomData.funnel_aggregate?.conversion_rate}%</div>
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div className="section kpis-section">
            <h3>📈 Key Metrics</h3>
            <div className="kpis-grid">
              <div className="kpi-card">
                <span className="kpi-value">{ecomData.kpis?.conversion_rate}%</span>
                <span className="kpi-label">Conversion Rate</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-value">{ecomData.kpis?.cart_abandonment}%</span>
                <span className="kpi-label">Cart Abandonment</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-value">{formatCurrency(ecomData.kpis?.avg_order_value || 0)}</span>
                <span className="kpi-label">Avg Order Value</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-value">{formatCurrency(ecomData.kpis?.customer_acquisition_cost || 0)}</span>
                <span className="kpi-label">Customer Acquisition Cost</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-value">{ecomData.kpis?.return_rate}%</span>
                <span className="kpi-label">Return Rate</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-value">{ecomData.kpis?.repeat_customer_rate}%</span>
                <span className="kpi-label">Repeat Customers</span>
              </div>
            </div>
          </div>

          {/* Product Performance Table */}
          <div className="section">
            <h3>📦 Product Performance</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Weight</th>
                    <th>Sell Price</th>
                    <th>COGS</th>
                    <th>Margin</th>
                    <th>Target</th>
                    <th>Sold</th>
                    <th>Gap</th>
                    <th>Revenue</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ecomData.products && ecomData.products.length > 0 ? (
                    ecomData.products.map((item, idx) => {
                      // Safe data extraction with fallbacks
                      const product = item.product || item;
                      const productName = product.product_name || product.name || item.name || 'Unknown Product';
                      const sku = product.sku || item.sku || 'N/A';
                      const weight = product.weight || item.weight || 'N/A';
                      const sellPrice = product.ecom_sell_price || product.sell_price || item.sell_price || 0;
                      const cogs = product.ecom_cogs || product.cogs || item.cogs || 0;
                      const margin = product.ecom_margin || product.margin || item.margin || 0;
                      const marginPercent = product.ecom_margin_percent || item.ecom_margin_percent || 40;
                      const targetUnits = item.target_units || 0;
                      const soldUnits = item.sold_units || item.units_sold || 0;
                      const gap = item.gap !== undefined ? item.gap : (soldUnits - targetUnits);
                      const revenue = item.revenue || (soldUnits * sellPrice);
                      const status = item.status || (gap >= 0 ? 'ahead' : 'behind');
                      
                      return (
                        <tr key={idx}>
                          <td className="product-name">{productName}</td>
                          <td><code>{sku}</code></td>
                          <td>{weight}</td>
                          <td>{formatCurrency(sellPrice)}</td>
                          <td>{formatCurrency(cogs)}</td>
                          <td className="margin">{formatCurrency(margin)} ({marginPercent}%)</td>
                          <td className="target">{targetUnits}</td>
                          <td className="sold">{soldUnits}</td>
                          <td className={`gap ${gap >= 0 ? 'positive' : 'negative'}`}>
                            {gap >= 0 ? '+' : ''}{gap}
                          </td>
                          <td className="revenue">{formatCurrency(revenue)}</td>
                          <td>{getStatusBadge(status)}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="11" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                        No product data available. Click "Edit Data" to add products.
                      </td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="6"><strong>TOTALS</strong></td>
                    <td><strong>{ecomData.totals?.total_target_units}</strong></td>
                    <td><strong>{ecomData.totals?.total_sold_units}</strong></td>
                    <td className={`gap ${(ecomData.totals?.total_sold_units - ecomData.totals?.total_target_units) >= 0 ? 'positive' : 'negative'}`}>
                      <strong>{(ecomData.totals?.total_sold_units - ecomData.totals?.total_target_units) >= 0 ? '+' : ''}{ecomData.totals?.total_sold_units - ecomData.totals?.total_target_units}</strong>
                    </td>
                    <td><strong>{formatCurrency(ecomData.totals?.total_revenue || 0)}</strong></td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Retail Tab */}
      {activeTab === 'retail' && retailData && (
        <div className="tab-content">
          {/* Retail Funnel */}
          <div className="section funnel-section">
            <h3>🏪 Retail Pipeline</h3>
            <div className="funnel retail-funnel">
              <div className="funnel-step">
                <div className="step-value">{retailData.funnel_aggregate?.total_stores}</div>
                <div className="step-label">Total Stores</div>
              </div>
              <div className="funnel-arrow">→</div>
              <div className="funnel-step">
                <div className="step-value">{retailData.funnel_aggregate?.stores_visited_this_week}</div>
                <div className="step-label">Visited This Week</div>
              </div>
              <div className="funnel-arrow">→</div>
              <div className="funnel-step">
                <div className="step-value">{retailData.funnel_aggregate?.stores_ordered}</div>
                <div className="step-label">Placed Orders</div>
              </div>
              <div className="funnel-arrow">→</div>
              <div className="funnel-step highlight">
                <div className="step-value">{retailData.funnel_aggregate?.avg_reorder_rate}%</div>
                <div className="step-label">Reorder Rate</div>
              </div>
            </div>
          </div>

          {/* Retail KPIs */}
          <div className="section kpis-section">
            <h3>📈 Retail Metrics</h3>
            <div className="kpis-grid">
              <div className="kpi-card">
                <span className="kpi-value">{retailData.kpis?.units_per_store_per_week}</span>
                <span className="kpi-label">Units/Store/Week</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-value">{retailData.kpis?.reorder_rate}%</span>
                <span className="kpi-label">Reorder Rate</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-value">{retailData.kpis?.store_churn_rate}%</span>
                <span className="kpi-label">Store Churn</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-value">+{retailData.kpis?.new_stores_this_month}</span>
                <span className="kpi-label">New Stores (Month)</span>
              </div>
              <div className="kpi-card">
                <span className="kpi-value">{formatCurrency(retailData.kpis?.avg_revenue_per_store || 0)}</span>
                <span className="kpi-label">Avg Revenue/Store</span>
              </div>
              <div className="kpi-card tier-breakdown">
                <div className="tier-mini">
                  <span className="tier platinum">{retailData.tier_breakdown?.platinum || 0}</span>
                  <span className="tier gold">{retailData.tier_breakdown?.gold || 0}</span>
                  <span className="tier silver">{retailData.tier_breakdown?.silver || 0}</span>
                </div>
                <span className="kpi-label">Tier Distribution</span>
              </div>
            </div>
          </div>

          {/* Store Performance */}
          <div className="section">
            <h3>🏪 Store Performance</h3>
            <div className="stores-grid">
              {retailData.stores?.map((store, idx) => (
                <div key={idx} className={`store-card ${store.store.tier}`}>
                  <div className="store-header">
                    <h4>{store.store.store_name}</h4>
                    <span className={`tier-badge ${store.store.tier}`}>{store.store.tier.toUpperCase()}</span>
                  </div>
                  <div className="store-summary">
                    <div className="stat">
                      <span className="stat-value">{store.summary.total_sold_units}</span>
                      <span className="stat-label">Units Sold</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{formatCurrency(store.summary.total_revenue)}</span>
                      <span className="stat-label">Revenue</span>
                    </div>
                    <div className="stat">
                      <span className="stat-value">{store.summary.achievement_rate}%</span>
                      <span className="stat-label">Achievement</span>
                    </div>
                  </div>
                  <div className="store-products">
                    <h5>Products</h5>
                    {store.products.map((prod, pidx) => (
                      <div key={pidx} className="product-row">
                        <span className="prod-name">{prod.product.sku}</span>
                        <span className="prod-sold">{prod.sold_units}/{prod.target_units}</span>
                        {getStatusBadge(prod.status)}
                      </div>
                    ))}
                  </div>
                  <div className="store-meta">
                    <span>📍 Visits: {store.funnel.visits_this_week}</span>
                    <span>📦 Stock: {store.funnel.stock_level}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Data Modals - Show based on active tab */}
      {showEditModal && activeTab === 'ecommerce' && (
        <EditEcommerceDataModal 
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          period={currentPeriod}
          ecomProducts={ecomData?.products || []}
          onSave={async (data) => {
            try {
              const response = await fetch(`${API_BASE}/api/v1/sales/ecommerce/period-data`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  period_type: viewBy,
                  period_key: selectedPeriod,
                  period_label: currentPeriod?.label,
                  start_date: currentPeriod?.start,
                  end_date: currentPeriod?.end,
                  products: data.products,
                  funnel_totals: data.totals,
                  kpis: data.kpis,
                  summary: {
                    total_target_units: data.totals.target_units || 0,
                    total_sold_units: data.totals.units_sold || 0,
                    total_revenue: data.totals.revenue || 0,
                    total_profit: data.totals.profit || 0
                  }
                })
              });
              
              const result = await response.json();
              
              if (response.ok && result.success) {
                // Successfully saved - close modal and refresh
                setShowEditModal(false);
                await fetchAllData();
              } else {
                throw new Error(result.message || 'Save failed');
              }
            } catch (error) {
              console.error('Error saving:', error);
              alert('Failed to save e-commerce data: ' + error.message);
            }
          }}
        />
      )}
      
      {showEditModal && activeTab === 'retail' && (
        <EditRetailModal 
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          period={currentPeriod}
          stores={retailData?.stores || []}
          onSave={async (data) => {
            try {
              const response = await fetch(`${API_BASE}/api/v1/sales/retail/period-data`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  period_type: viewBy,
                  period_key: selectedPeriod,
                  period_label: currentPeriod?.label,
                  start_date: currentPeriod?.start,
                  end_date: currentPeriod?.end,
                  stores: data.stores,
                  kpis: data.kpis,
                  totals: data.totals
                })
              });
              
              const result = await response.json();
              
              if (response.ok && result.success) {
                // Successfully saved - close modal and refresh
                setShowEditModal(false);
                await fetchAllData();
              } else {
                throw new Error(result.message || 'Save failed');
              }
            } catch (error) {
              console.error('Error saving retail data:', error);
              alert('Failed to save retail data: ' + error.message);
            }
          }}
        />
      )}
    </div>
  );
};

// Edit Data Modal Component - With Add Product Functionality
const EditEcommerceDataModal = ({ isOpen, onClose, period, ecomProducts, onSave }) => {
  const [productData, setProductData] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [kpis, setKpis] = useState({
    avg_order_value: 500,
    customer_acquisition_cost: 100,
    return_rate: 2.0,
    repeat_customer_rate: 30.0,
    // Auto-calculated values (stored for display)
    _auto_aov: 0,
    _auto_cac: 0
  });

  // Fetch available products on mount
  useEffect(() => {
    fetchAvailableProducts();
  }, []);

  const fetchAvailableProducts = async () => {
    try {
      console.log('🔍 Fetching available products from:', `${API_BASE}/api/products`);
      const response = await fetch(`${API_BASE}/api/products`);
      const data = await response.json();
      console.log('📦 Raw API response:', data);
      console.log('📦 Is array?', Array.isArray(data));
      
      const products = Array.isArray(data) ? data : (data.products || []);
      console.log('📦 Processed products count:', products.length);
      if (products.length > 0) {
        console.log('📦 First product sample:', products[0]);
      }
      
      setAvailableProducts(products);
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      setAvailableProducts([]);
    }
  };

  useEffect(() => {
    // Initialize with product catalog from existing ecom data or create new
    if (ecomProducts && ecomProducts.length > 0) {
      // Use existing data structure
      const products = ecomProducts.map(item => ({
        product_id: item.product?.product_id || item.product_id,
        sku: item.product?.sku || item.sku || 'N/A',
        name: item.product?.product_name || item.product_name || item.name || 'Unknown Product',
        weight: item.product?.weight || item.weight || 'N/A',
        sell_price: item.product?.ecom_sell_price || item.ecom_sell_price || item.sell_price || 0,
        sale_price: item.sale_price || item.product?.ecom_sell_price || item.ecom_sell_price || item.sell_price || 0,  // Initialize sale_price
        cogs: item.product?.ecom_cogs || item.ecom_cogs || item.cogs || 0,
        margin: item.product?.ecom_margin || item.ecom_margin || item.margin || 0,
        target_units: item.target_units || 20,
        impressions: item.funnel?.impressions || item.impressions || 0,
        clicks: item.funnel?.clicks || item.clicks || 0,
        ad_spend: item.funnel?.ad_spend || item.ad_spend || 0,  // Ad Spend field
        add_to_cart: item.funnel?.add_to_cart || item.add_to_cart || 0,
        checkouts: item.funnel?.checkouts || item.checkouts || 0,
        orders: item.funnel?.orders || item.orders || 0,
        units_sold: item.sold_units || item.units_sold || 0
      }));
      setProductData(products);
    } else {
      // Fallback to hardcoded product catalog - SIMPLIFIED TO 3 PRODUCTS
      const products = [
        { sku: 'CHK-100', name: 'Chicken Feet', weight: '100g', sell_price: 299, sale_price: 299, cogs: 179, margin: 120, target_units: 20 },
        { sku: 'CHK-250', name: 'Chicken Feet', weight: '250g', sell_price: 599, sale_price: 599, cogs: 359, margin: 240, target_units: 20 },
        { sku: 'LMB-250', name: 'Lamb Puffs', weight: '250g', sell_price: 699, sale_price: 699, cogs: 419, margin: 280, target_units: 20 }
      ];
      setProductData(products.map(p => ({ 
        ...p, 
        impressions: 0, 
        clicks: 0,
        ad_spend: 0,  // Ad Spend field 
        add_to_cart: 0, 
        checkouts: 0, 
        orders: 0, 
        units_sold: 0 
      })));
    }
  }, [ecomProducts]);

  const addProduct = (product) => {
    // FIXED: Products from API have 'id' field, not '_id'
    const productId = product.id || product._id || product.product_id;
    const productSku = product.sku || product.slug || `SKU-${productId?.toString().slice(-6)}`;
    
    // Check if already added - FIXED: Only check product_id, not SKU (SKU is auto-generated)
    const alreadyExists = productData.some(p => {
      const existingId = p.product_id;
      // Match if IDs are the same
      return existingId && productId && existingId === productId;
    });
    
    if (alreadyExists) {
      alert('Product already added');
      return;
    }
    
    setProductData(prev => [...prev, {
      product_id: productId,
      sku: productSku,
      name: product.name || product.product_name || 'Unknown Product',
      weight: product.weight || '',
      sell_price: product.price || product.sell_price || 0,
      sale_price: product.price || product.sell_price || 0,  // Initialize sale_price with default price
      cogs: product.cogs || Math.round((product.price || product.sell_price || 0) * 0.6),
      margin: product.margin || Math.round((product.price || product.sell_price || 0) * 0.4),
      impressions: 0,
      clicks: 0,
      ad_spend: 0,  // Ad Spend field
      add_to_cart: 0,
      checkouts: 0,
      orders: 0,
      units_sold: 0,
      target_units: 20
    }]);
    setShowProductPicker(false);
    setSearchQuery('');
  };

  const removeProduct = (sku) => {
    if (productData.length <= 1) {
      alert('Cannot remove all products. At least one product is required.');
      return;
    }
    setProductData(prev => prev.filter(p => p.sku !== sku));
  };

  const updateProduct = (sku, field, value) => {
    setProductData(prev => prev.map(p => {
      if (p.sku !== sku) return p;
      // Use parseFloat for price and ad_spend fields, parseInt for others
      const parsedValue = field === 'sale_price' || field === 'sell_price' || field === 'ad_spend'
        ? parseFloat(value) || 0 
        : parseInt(value) || 0;
      return { ...p, [field]: parsedValue };
    }));
  };

  const totals = {
    impressions: productData.reduce((sum, p) => sum + (p.impressions || 0), 0),
    clicks: productData.reduce((sum, p) => sum + (p.clicks || 0), 0),
    ad_spend: productData.reduce((sum, p) => sum + (p.ad_spend || 0), 0),
    add_to_cart: productData.reduce((sum, p) => sum + (p.add_to_cart || 0), 0),
    checkouts: productData.reduce((sum, p) => sum + (p.checkouts || 0), 0),
    orders: productData.reduce((sum, p) => sum + (p.orders || 0), 0),
    units_sold: productData.reduce((sum, p) => sum + (p.units_sold || 0), 0),
    revenue: productData.reduce((sum, p) => sum + ((p.units_sold || 0) * (p.sale_price || p.sell_price || 0)), 0)
  };

  const click_rate = totals.impressions > 0 ? ((totals.clicks / totals.impressions) * 100).toFixed(1) : 0;
  const cart_rate = totals.impressions > 0 ? ((totals.add_to_cart / totals.impressions) * 100).toFixed(1) : 0;
  const checkout_rate = totals.impressions > 0 ? ((totals.checkouts / totals.impressions) * 100).toFixed(1) : 0;
  const conversion_rate = totals.impressions > 0 ? ((totals.orders / totals.impressions) * 100).toFixed(2) : 0;

  // Auto-calculate AOV and CAC based on product data
  const autoAOV = totals.orders > 0 ? parseFloat((totals.revenue / totals.orders).toFixed(2)) : 0;
  const autoCAC = totals.orders > 0 ? parseFloat((totals.ad_spend / totals.orders).toFixed(2)) : 0;

  // Update auto values in kpis state when they change
  useEffect(() => {
    setKpis(prev => ({
      ...prev,
      _auto_aov: autoAOV,
      _auto_cac: autoCAC,
      // Auto-update actual values if user hasn't manually overridden (first load)
      avg_order_value: prev._auto_aov === 0 ? autoAOV : prev.avg_order_value,
      customer_acquisition_cost: prev._auto_cac === 0 ? autoCAC : prev.customer_acquisition_cost
    }));
  }, [autoAOV, autoCAC]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }} onClick={onClose}>
      <div style={{
        backgroundColor: '#1e293b',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '1000px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)'
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          backgroundColor: '#0f172a',
          borderBottom: '1px solid #334155'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', color: '#fff' }}>✏️ Edit E-Commerce Data</h2>
            <span style={{
              backgroundColor: '#6366f1',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              color: '#fff'
            }}>{period?.label || 'Week 48'}</span>
          </div>
          <button 
            onClick={onClose}
            style={{
              backgroundColor: '#334155',
              border: 'none',
              color: '#fff',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              fontSize: '24px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >×</button>
        </div>

        {/* Body - Scrollable */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px'
        }}>
          {/* Section Header with Add Product Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: '16px', color: '#fff' }}>📦 Product Metrics</h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                Enter data for each product from your analytics dashboard
              </p>
            </div>
            <button
              onClick={() => setShowProductPicker(!showProductPicker)}
              style={{
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                border: 'none',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              ➕ Add Product
            </button>
          </div>

          {/* Product Picker Dropdown */}
          {showProductPicker && (
            <div style={{
              backgroundColor: '#0f172a',
              border: '1px solid #6366f1',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px',
              boxShadow: '0 10px 25px rgba(99, 102, 241, 0.2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, color: '#fff', fontSize: '14px', fontWeight: 600 }}>Select Product from Catalog</h4>
                <button 
                  onClick={() => setShowProductPicker(false)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '20px' }}
                >×</button>
              </div>
              
              <input
                type="text"
                placeholder="🔍 Search products by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#fff',
                  marginBottom: '12px',
                  boxSizing: 'border-box',
                  fontSize: '14px'
                }}
              />
              
              <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                {availableProducts.filter(p => {
                  const searchLower = searchQuery.toLowerCase();
                  // Fix: Check if product is already added (handle id vs _id field difference)
                  const alreadyAdded = productData.find(pd => {
                    const pdSku = pd.sku;
                    const pSku = p.sku || p.slug;
                    const pdId = pd.product_id;
                    const pId = p.id || p._id || p.product_id;
                    
                    // Only match if both values exist to avoid undefined === undefined
                    return (pdSku && pSku && pdSku === pSku) || (pdId && pId && pdId === pId);
                  });
                  
                  const productName = (p.name || p.product_name || '').toLowerCase();
                  const productSku = (p.sku || p.slug || '').toLowerCase();
                  const matchesSearch = !searchQuery || 
                    productName.includes(searchLower) ||
                    productSku.includes(searchLower);
                  
                  return matchesSearch && !alreadyAdded;
                }).length === 0 ? (
                  <p style={{ color: '#64748b', textAlign: 'center', padding: '30px 20px', margin: 0 }}>
                    {searchQuery ? 'No products match your search' : 'No more products available to add'}
                  </p>
                ) : (
                  availableProducts.filter(p => {
                    const searchLower = searchQuery.toLowerCase();
                    // Fix: Same duplicate detection logic
                    const alreadyAdded = productData.find(pd => {
                      const pdSku = pd.sku;
                      const pSku = p.sku || p.slug;
                      const pdId = pd.product_id;
                      const pId = p.id || p._id || p.product_id;
                      
                      return (pdSku && pSku && pdSku === pSku) || (pdId && pId && pdId === pId);
                    });
                    
                    const productName = (p.name || p.product_name || '').toLowerCase();
                    const productSku = (p.sku || p.slug || '').toLowerCase();
                    const matchesSearch = !searchQuery || 
                      productName.includes(searchLower) ||
                      productSku.includes(searchLower);
                    
                    return matchesSearch && !alreadyAdded;
                  }).map((product, idx) => (
                    <div
                      key={idx}
                      onClick={() => addProduct(product)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        backgroundColor: '#1e293b',
                        borderRadius: '8px',
                        marginBottom: '8px',
                        cursor: 'pointer',
                        border: '1px solid transparent',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                    >
                      <div>
                        <span style={{ color: '#fff', fontWeight: 500, fontSize: '14px' }}>
                          {product.name || product.product_name}
                        </span>
                        <span style={{ 
                          marginLeft: '8px', 
                          backgroundColor: '#334155', 
                          padding: '2px 8px', 
                          borderRadius: '4px',
                          fontSize: '11px',
                          color: '#94a3b8',
                          fontFamily: 'monospace'
                        }}>
                          {product.sku || product.slug || 'No SKU'}
                        </span>
                        {product.weight && (
                          <span style={{ marginLeft: '8px', color: '#64748b', fontSize: '12px' }}>
                            {product.weight}
                          </span>
                        )}
                      </div>
                      <span style={{ color: '#10b981', fontWeight: 600, fontSize: '14px' }}>
                        ₹{product.price || product.sell_price || 0}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Product Cards or Empty State */}
          {productData.length === 0 ? (
            <div style={{
              backgroundColor: '#0f172a',
              borderRadius: '12px',
              padding: '60px 40px',
              textAlign: 'center',
              border: '2px dashed #334155',
              marginTop: '20px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
              <h4 style={{ color: '#fff', margin: '0 0 8px', fontSize: '18px' }}>No Products Added</h4>
              <p style={{ color: '#64748b', margin: '0 0 20px', fontSize: '14px' }}>
                Click "Add Product" to select products from your catalog
              </p>
              <button
                onClick={() => setShowProductPicker(true)}
                style={{
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  border: 'none',
                  color: '#fff',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '14px'
                }}
              >
                ➕ Add Your First Product
              </button>
            </div>
          ) : (
            productData.map((product, idx) => (
              <div key={idx} style={{
                backgroundColor: '#0f172a',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '16px',
                border: '1px solid #334155',
                position: 'relative'
              }}>
                {/* Delete Button */}
                <button
                  onClick={() => removeProduct(product.sku)}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: '#ef4444',
                    border: 'none',
                    color: '#fff',
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Remove product"
                >🗑️</button>
              {/* Product Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '1px solid #334155'
              }}>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>{product.name}</span>
                <code style={{
                  backgroundColor: '#334155',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#94a3b8',
                  fontFamily: 'monospace'
                }}>{product.sku}</code>
                <span style={{
                  backgroundColor: '#1e293b',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#64748b'
                }}>{product.weight}</span>
              </div>

              {/* 8-Column Input Grid - With Ad Spend and Sale Price */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(8, 1fr)',
                gap: '12px'
              }}>
                {['impressions', 'clicks'].map(field => (
                  <div key={field} style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      color: '#94a3b8',
                      marginBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {field.replace(/_/g, ' ')}
                    </label>
                    <input
                      type="number"
                      value={product[field] || ''}
                      onChange={(e) => updateProduct(product.sku, field, e.target.value)}
                      placeholder="0"
                      style={{
                        width: '100%',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        padding: '12px',
                        fontSize: '15px',
                        color: '#fff',
                        textAlign: 'center',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                ))}
                {/* Ad Spend Field - Blue/Purple highlight */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    color: '#818cf8',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    AD SPEND (₹)
                  </label>
                  <input
                    type="number"
                    value={product.ad_spend || ''}
                    onChange={(e) => updateProduct(product.sku, 'ad_spend', e.target.value)}
                    placeholder="0"
                    style={{
                      width: '100%',
                      backgroundColor: 'rgba(99, 102, 241, 0.15)',
                      border: '1px solid #6366f1',
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: '15px',
                      color: '#fff',
                      textAlign: 'center',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                {['add_to_cart', 'checkouts', 'orders', 'units_sold'].map(field => (
                  <div key={field} style={{ display: 'flex', flexDirection: 'column' }}>
                    <label style={{
                      fontSize: '11px',
                      fontWeight: 500,
                      color: '#94a3b8',
                      marginBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      {field.replace(/_/g, ' ')}
                    </label>
                    <input
                      type="number"
                      value={product[field] || ''}
                      onChange={(e) => updateProduct(product.sku, field, e.target.value)}
                      placeholder="0"
                      style={{
                        width: '100%',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        padding: '12px',
                        fontSize: '15px',
                        color: '#fff',
                        textAlign: 'center',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                ))}
                {/* Sale Price Field */}
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    color: '#f59e0b',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    SALE PRICE (₹)
                  </label>
                  <input
                    type="number"
                    value={product.sale_price ?? product.sell_price ?? ''}
                    onChange={(e) => updateProduct(product.sku, 'sale_price', e.target.value)}
                    placeholder={product.sell_price || '0'}
                    style={{
                      width: '100%',
                      backgroundColor: '#1e293b',
                      border: '1px solid #f59e0b',
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: '15px',
                      color: '#f59e0b',
                      textAlign: 'center',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
              
              {/* Calculated Revenue and ROAS Display */}
              <div style={{
                marginTop: '12px',
                padding: '10px 16px',
                backgroundColor: '#1e293b',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '12px', display: 'block' }}>Revenue</span>
                    <span style={{ color: '#10b981', fontSize: '16px', fontWeight: 600 }}>
                      ₹{((product.units_sold || 0) * (product.sale_price || product.sell_price || 0)).toLocaleString('en-IN')}
                    </span>
                  </div>
                  {/* ROAS Display - Only show if ad_spend > 0 */}
                  {(product.ad_spend || 0) > 0 && (() => {
                    const revenue = (product.units_sold || 0) * (product.sale_price || product.sell_price || 0);
                    const roas = revenue / product.ad_spend;
                    // Color: Green (3x+), Yellow (1-3x), Red (<1x)
                    const roasColor = roas >= 3 ? '#10b981' : roas >= 1 ? '#f59e0b' : '#ef4444';
                    return (
                      <div style={{
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: '1px solid #6366f1'
                      }}>
                        <span style={{ color: '#818cf8', fontSize: '12px', display: 'block' }}>ROAS</span>
                        <span style={{ color: roasColor, fontSize: '16px', fontWeight: 600 }}>
                          {roas.toFixed(2)}x
                        </span>
                      </div>
                    );
                  })()}
                </div>
                <span style={{ color: '#64748b', fontSize: '12px' }}>
                  {product.units_sold || 0} units × ₹{product.sale_price || product.sell_price || 0}
                  {(product.ad_spend || 0) > 0 && ` | Ad Spend: ₹${product.ad_spend.toLocaleString('en-IN')}`}
                </span>
              </div>
            </div>
          ))
          )}

          {/* Totals Preview */}
          <div style={{
            backgroundColor: '#0f172a',
            borderRadius: '12px',
            padding: '20px',
            marginTop: '24px',
            border: '1px solid #334155'
          }}>
            <h4 style={{ margin: '0 0 16px', fontSize: '14px', color: '#94a3b8' }}>
              📊 Funnel Totals (Auto-calculated)
            </h4>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px'
            }}>
              {[
                { label: 'Impressions', value: totals.impressions },
                { label: 'Clicks', value: totals.clicks, rate: click_rate },
                { label: 'Add to Cart', value: totals.add_to_cart, rate: cart_rate },
                { label: 'Checkouts', value: totals.checkouts, rate: checkout_rate },
                { label: 'Orders', value: totals.orders, rate: conversion_rate, highlight: true }
              ].map((item, idx) => (
                <React.Fragment key={item.label}>
                  {idx > 0 && <span style={{ color: '#475569', fontSize: '20px', flexShrink: 0 }}>→</span>}
                  <div style={{
                    textAlign: 'center',
                    padding: item.highlight ? '12px 20px' : '12px',
                    backgroundColor: item.highlight ? '#6366f1' : '#1e293b',
                    borderRadius: '8px',
                    flex: 1
                  }}>
                    <span style={{ display: 'block', fontSize: '20px', fontWeight: 700, color: '#fff' }}>
                      {item.value.toLocaleString()}
                    </span>
                    <span style={{ display: 'block', fontSize: '11px', color: item.highlight ? '#c7d2fe' : '#64748b', marginTop: '4px' }}>
                      {item.label}
                    </span>
                    {item.rate && (
                      <span style={{ display: 'block', fontSize: '12px', color: '#10b981', fontWeight: 500, marginTop: '2px' }}>
                        {item.rate}%
                      </span>
                    )}
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* KPIs - Auto-calculated AOV/CAC + Manual Return Rate/Repeat Rate */}
          <div style={{ marginTop: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#fff' }}>📈 Additional KPIs</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px'
            }}>
              {/* AOV - Auto-calculated with override option */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{
                  fontSize: '12px',
                  color: '#94a3b8',
                  marginBottom: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  Avg Order Value (₹)
                  <span style={{ color: '#14b8a6', fontSize: '10px', fontWeight: 500 }}>(Auto)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    step="0.01"
                    value={kpis.avg_order_value}
                    onChange={(e) => setKpis({ ...kpis, avg_order_value: parseFloat(e.target.value) || 0 })}
                    style={{
                      width: '100%',
                      backgroundColor: 'rgba(20, 184, 166, 0.1)',
                      border: '1px solid #14b8a6',
                      borderRadius: '8px',
                      padding: '12px',
                      paddingRight: '36px',
                      fontSize: '15px',
                      color: '#fff',
                      textAlign: 'center',
                      boxSizing: 'border-box'
                    }}
                  />
                  {kpis.avg_order_value !== kpis._auto_aov && kpis._auto_aov > 0 && (
                    <button
                      onClick={() => setKpis({ ...kpis, avg_order_value: kpis._auto_aov })}
                      title="Reset to auto-calculated"
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#14b8a6',
                        cursor: 'pointer',
                        fontSize: '16px',
                        padding: '4px'
                      }}
                    >↺</button>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  Auto: ₹{kpis._auto_aov?.toLocaleString('en-IN') || 0}
                </div>
              </div>

              {/* CAC - Auto-calculated with override option */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{
                  fontSize: '12px',
                  color: '#94a3b8',
                  marginBottom: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  Customer Acquisition Cost (₹)
                  <span style={{ color: '#14b8a6', fontSize: '10px', fontWeight: 500 }}>(Auto)</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    step="0.01"
                    value={kpis.customer_acquisition_cost}
                    onChange={(e) => setKpis({ ...kpis, customer_acquisition_cost: parseFloat(e.target.value) || 0 })}
                    style={{
                      width: '100%',
                      backgroundColor: 'rgba(20, 184, 166, 0.1)',
                      border: '1px solid #14b8a6',
                      borderRadius: '8px',
                      padding: '12px',
                      paddingRight: '36px',
                      fontSize: '15px',
                      color: '#fff',
                      textAlign: 'center',
                      boxSizing: 'border-box'
                    }}
                  />
                  {kpis.customer_acquisition_cost !== kpis._auto_cac && kpis._auto_cac > 0 && (
                    <button
                      onClick={() => setKpis({ ...kpis, customer_acquisition_cost: kpis._auto_cac })}
                      title="Reset to auto-calculated"
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#14b8a6',
                        cursor: 'pointer',
                        fontSize: '16px',
                        padding: '4px'
                      }}
                    >↺</button>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  Auto: ₹{kpis._auto_cac?.toLocaleString('en-IN') || 0}
                </div>
              </div>

              {/* Return Rate - Manual entry */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{
                  fontSize: '12px',
                  color: '#94a3b8',
                  marginBottom: '6px'
                }}>Return Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={kpis.return_rate}
                  onChange={(e) => setKpis({ ...kpis, return_rate: parseFloat(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '15px',
                    color: '#fff',
                    textAlign: 'center',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Repeat Customer Rate - Manual entry */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{
                  fontSize: '12px',
                  color: '#94a3b8',
                  marginBottom: '6px'
                }}>Repeat Customer Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={kpis.repeat_customer_rate}
                  onChange={(e) => setKpis({ ...kpis, repeat_customer_rate: parseFloat(e.target.value) || 0 })}
                  style={{
                    width: '100%',
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '15px',
                    color: '#fff',
                    textAlign: 'center',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          padding: '16px 24px',
          backgroundColor: '#0f172a',
          borderTop: '1px solid #334155'
        }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#334155',
              border: 'none',
              color: '#fff',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >Cancel</button>
          <button
            onClick={() => onSave({ products: productData, kpis, totals: { ...totals, click_rate, cart_rate, checkout_rate, conversion_rate } })}
            style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              color: '#fff',
              padding: '12px 28px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >💾 Save Data</button>
        </div>
      </div>
    </div>
  );
};

// Edit Retail Data Modal Component
const EditRetailModal = ({ isOpen, onClose, period, stores, onSave }) => {
  const [storeData, setStoreData] = useState([]);
  const [availableStores, setAvailableStores] = useState([]);
  const [showStorePicker, setShowStorePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [kpis, setKpis] = useState({
    store_churn_rate: 5.0,
    new_stores_this_month: 1,
    avg_order_value: 1200,
    target_stores: 10
  });

  // Fetch available stores on mount
  useEffect(() => {
    fetchAvailableStores();
  }, []);

  const fetchAvailableStores = async () => {
    try {
      const adminToken = localStorage.getItem('adminToken');
      const response = await fetch(`${API_BASE}/api/v1/retail/stores`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      const data = await response.json();
      const storesList = data.stores || [];
      setAvailableStores(storesList);
    } catch (error) {
      console.error('Error fetching stores:', error);
      setAvailableStores([]);
    }
  };

  useEffect(() => {
    if (stores && stores.length > 0) {
      setStoreData(stores.map(s => ({
        store_id: s.store?.store_id || s.store_id || `store_${Date.now()}`,
        store_name: s.store?.store_name || s.store_name || 'Unknown Store',
        tier: s.store?.tier || s.tier || 'silver',
        visits_this_week: s.funnel?.visits_this_week || 0,
        orders_placed: s.funnel?.orders_placed || 0,
        units_sold: s.summary?.total_sold_units || 0,
        revenue: s.summary?.total_revenue || 0,
        new_placements: 0,
        stock_level: s.funnel?.stock_level || 'medium',
        owner_engagement: 'neutral',
        reorder_likelihood: s.funnel?.reorder_rate || 50,
        notes: ''
      })));
    }
  }, [stores]);

  const addStore = (store) => {
    const storeId = store._id || store.store_id;
    
    // Check if already added
    if (storeData.find(s => s.store_id === storeId)) {
      alert('Store already added');
      return;
    }
    
    setStoreData(prev => [...prev, {
      store_id: storeId,
      store_name: store.store_name || store.name || 'Unknown Store',
      tier: store.tier || 'silver',
      visits_this_week: 0,
      orders_placed: 0,
      units_sold: 0,
      revenue: 0,
      new_placements: 0,
      stock_level: 'medium',
      owner_engagement: 'neutral',
      reorder_likelihood: 50,
      notes: ''
    }]);
    setShowStorePicker(false);
    setSearchQuery('');
  };

  const removeStore = (storeId) => {
    if (storeData.length <= 1) {
      alert('Cannot remove all stores. At least one store is required.');
      return;
    }
    setStoreData(prev => prev.filter(s => s.store_id !== storeId));
  };

  const updateStore = (storeId, field, value) => {
    setStoreData(prev => prev.map(s => 
      s.store_id === storeId ? { ...s, [field]: value } : s
    ));
  };

  const inputStyle = {
    width: '100%',
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '14px',
    color: '#fff',
    textAlign: 'center',
    boxSizing: 'border-box'
  };

  const selectStyle = {
    width: '100%',
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '14px',
    color: '#fff',
    boxSizing: 'border-box',
    cursor: 'pointer'
  };

  if (!isOpen) return null;

  const totals = {
    total_visits: storeData.reduce((sum, s) => sum + (parseInt(s.visits_this_week) || 0), 0),
    total_orders: storeData.reduce((sum, s) => sum + (parseInt(s.orders_placed) || 0), 0),
    total_units: storeData.reduce((sum, s) => sum + (parseInt(s.units_sold) || 0), 0),
    total_revenue: storeData.reduce((sum, s) => sum + (parseInt(s.revenue) || 0), 0),
    avg_reorder: storeData.length > 0 ? Math.round(storeData.reduce((sum, s) => sum + (parseInt(s.reorder_likelihood) || 0), 0) / storeData.length) : 0
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999
    }} onClick={onClose}>
      <div style={{
        backgroundColor: '#1e293b',
        borderRadius: '16px',
        width: '90%',
        maxWidth: '1100px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)'
      }} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          backgroundColor: '#0f172a',
          borderBottom: '1px solid #334155'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h2 style={{ margin: 0, fontSize: '20px', color: '#fff' }}>🏪 Edit Retail Data</h2>
            <span style={{
              backgroundColor: '#10b981',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '13px',
              color: '#fff'
            }}>{period?.label || 'Week 48'}</span>
          </div>
          <button onClick={onClose} style={{
            backgroundColor: '#334155',
            border: 'none',
            color: '#fff',
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            fontSize: '24px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>×</button>
        </div>

        {/* Body - Scrollable */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {/* Section Header with Add Store Button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: '16px', color: '#fff' }}>🏪 Store Performance</h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                Enter weekly performance data for each retail store
              </p>
            </div>
            <button
              onClick={() => setShowStorePicker(!showStorePicker)}
              style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              ➕ Add Store
            </button>
          </div>

          {/* Store Picker Dropdown */}
          {showStorePicker && (
            <div style={{
              backgroundColor: '#0f172a',
              border: '1px solid #10b981',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '16px',
              boxShadow: '0 10px 25px rgba(16, 185, 129, 0.2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ margin: 0, color: '#fff', fontSize: '14px', fontWeight: 600 }}>Select Store from Database</h4>
                <button 
                  onClick={() => setShowStorePicker(false)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '20px' }}
                >×</button>
              </div>
              
              <input
                type="text"
                placeholder="🔍 Search stores by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  padding: '12px',
                  color: '#fff',
                  marginBottom: '12px',
                  boxSizing: 'border-box',
                  fontSize: '14px'
                }}
              />
              
              <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                {availableStores.filter(st => {
                  const searchLower = searchQuery.toLowerCase();
                  // Fix: Proper duplicate detection with null checks
                  const alreadyAdded = storeData.find(sd => {
                    const sdId = sd.store_id;
                    const stId = st.id || st._id || st.store_id;
                    return sdId && stId && sdId === stId;
                  });
                  const matchesSearch = !searchQuery || 
                    (st.store_name || st.name || '').toLowerCase().includes(searchLower);
                  return matchesSearch && !alreadyAdded;
                }).length === 0 ? (
                  <p style={{ color: '#64748b', textAlign: 'center', padding: '30px 20px', margin: 0 }}>
                    {searchQuery ? 'No stores match your search' : 'No more stores available to add'}
                  </p>
                ) : (
                  availableStores.filter(st => {
                    const searchLower = searchQuery.toLowerCase();
                    const alreadyAdded = storeData.find(sd => {
                      const sdId = sd.store_id;
                      const stId = st.id || st._id || st.store_id;
                      return sdId && stId && sdId === stId;
                    });
                    const matchesSearch = !searchQuery || 
                      (st.store_name || st.name || '').toLowerCase().includes(searchLower);
                    return matchesSearch && !alreadyAdded;
                  }).map((store, idx) => (
                    <div
                      key={idx}
                      onClick={() => addStore(store)}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        backgroundColor: '#1e293b',
                        borderRadius: '8px',
                        marginBottom: '8px',
                        cursor: 'pointer',
                        border: '1px solid transparent',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#10b981'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
                    >
                      <div>
                        <span style={{ color: '#fff', fontWeight: 500, fontSize: '14px' }}>
                          {store.store_name || store.name}
                        </span>
                        {store.tier && (
                          <span style={{ 
                            marginLeft: '8px', 
                            backgroundColor: store.tier === 'platinum' ? '#8b5cf6' :
                                           store.tier === 'gold' ? '#f59e0b' :
                                           '#94a3b8',
                            padding: '2px 8px', 
                            borderRadius: '4px',
                            fontSize: '10px',
                            color: '#fff',
                            textTransform: 'uppercase',
                            fontWeight: 600
                          }}>
                            {store.tier}
                          </span>
                        )}
                        {store.area && (
                          <span style={{ marginLeft: '8px', color: '#64748b', fontSize: '12px' }}>
                            {store.area}
                          </span>
                        )}
                      </div>
                      <span style={{ color: '#10b981', fontWeight: 600, fontSize: '12px' }}>
                        {store.visit_status || 'Add →'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Store Cards or Empty State */}
          {storeData.length === 0 ? (
            <div style={{
              backgroundColor: '#0f172a',
              borderRadius: '12px',
              padding: '60px 40px',
              textAlign: 'center',
              border: '2px dashed #334155',
              marginTop: '20px'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏪</div>
              <h4 style={{ color: '#fff', margin: '0 0 8px', fontSize: '18px' }}>No Stores Added</h4>
              <p style={{ color: '#64748b', margin: '0 0 20px', fontSize: '14px' }}>
                Click "Add Store" to select stores from your database
              </p>
              <button
                onClick={() => setShowStorePicker(true)}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  color: '#fff',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 500,
                  fontSize: '14px'
                }}
              >
                ➕ Add Your First Store
              </button>
            </div>
          ) : (
            storeData.map((store, idx) => (
              <div key={idx} style={{
                backgroundColor: '#0f172a',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '16px',
                border: '1px solid #334155',
                borderLeft: `4px solid ${
                  store.tier === 'platinum' ? '#8b5cf6' :
                  store.tier === 'gold' ? '#f59e0b' :
                  store.tier === 'silver' ? '#94a3b8' : '#64748b'
                }`,
                position: 'relative'
              }}>
                {/* Delete Button */}
                <button
                  onClick={() => removeStore(store.store_id)}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    background: '#ef4444',
                    border: 'none',
                    color: '#fff',
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="Remove store"
                >🗑️</button>
              {/* Store Header */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '1px solid #334155'
              }}>
                <span style={{ fontSize: '15px', fontWeight: 600, color: '#fff' }}>
                  {store.store_name}
                </span>
                <span style={{
                  backgroundColor: store.tier === 'platinum' ? '#8b5cf6' :
                               store.tier === 'gold' ? '#f59e0b' :
                               store.tier === 'silver' ? '#94a3b8' : '#64748b',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '11px',
                  color: '#fff',
                  textTransform: 'uppercase',
                  fontWeight: 600
                }}>{store.tier}</span>
              </div>

              {/* Input Grid - Row 1: Numeric metrics */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Visits This Week
                  </label>
                  <input
                    type="number"
                    value={store.visits_this_week}
                    onChange={(e) => updateStore(store.store_id, 'visits_this_week', e.target.value)}
                    style={inputStyle}
                    placeholder="0"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Orders Placed
                  </label>
                  <input
                    type="number"
                    value={store.orders_placed}
                    onChange={(e) => updateStore(store.store_id, 'orders_placed', e.target.value)}
                    style={inputStyle}
                    placeholder="0"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Units Sold
                  </label>
                  <input
                    type="number"
                    value={store.units_sold}
                    onChange={(e) => updateStore(store.store_id, 'units_sold', e.target.value)}
                    style={inputStyle}
                    placeholder="0"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Revenue (₹)
                  </label>
                  <input
                    type="number"
                    value={store.revenue}
                    onChange={(e) => updateStore(store.store_id, 'revenue', e.target.value)}
                    style={inputStyle}
                    placeholder="0"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>
                    New Placements
                  </label>
                  <input
                    type="number"
                    value={store.new_placements}
                    onChange={(e) => updateStore(store.store_id, 'new_placements', e.target.value)}
                    style={inputStyle}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Row 2: Dropdowns and qualitative */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Stock Level
                  </label>
                  <select
                    value={store.stock_level}
                    onChange={(e) => updateStore(store.store_id, 'stock_level', e.target.value)}
                    style={selectStyle}
                  >
                    <option value="low">🔴 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🟢 High</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Owner Engagement
                  </label>
                  <select
                    value={store.owner_engagement}
                    onChange={(e) => updateStore(store.store_id, 'owner_engagement', e.target.value)}
                    style={selectStyle}
                  >
                    <option value="cold">❄️ Cold</option>
                    <option value="neutral">😐 Neutral</option>
                    <option value="warm">🙂 Warm</option>
                    <option value="hot">🔥 Hot</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Reorder Likelihood (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={store.reorder_likelihood}
                    onChange={(e) => updateStore(store.store_id, 'reorder_likelihood', e.target.value)}
                    style={inputStyle}
                    placeholder="50"
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <label style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>
                    Notes
                  </label>
                  <input
                    type="text"
                    value={store.notes}
                    onChange={(e) => updateStore(store.store_id, 'notes', e.target.value)}
                    placeholder="Optional notes..."
                    style={{...inputStyle, textAlign: 'left'}}
                  />
                </div>
              </div>
            </div>
          ))
          )}

          {/* Totals Summary */}
          <div style={{
            backgroundColor: '#0f172a',
            borderRadius: '12px',
            padding: '20px',
            marginTop: '24px',
            border: '1px solid #334155'
          }}>
            <h4 style={{ margin: '0 0 16px', fontSize: '14px', color: '#94a3b8' }}>
              📊 Weekly Totals (Auto-calculated)
            </h4>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '16px'
            }}>
              <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#1e293b', borderRadius: '10px' }}>
                <span style={{ display: 'block', fontSize: '24px', fontWeight: 700, color: '#fff' }}>
                  {totals.total_visits}
                </span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Total Visits</span>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#1e293b', borderRadius: '10px' }}>
                <span style={{ display: 'block', fontSize: '24px', fontWeight: 700, color: '#fff' }}>
                  {totals.total_orders}
                </span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Total Orders</span>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#1e293b', borderRadius: '10px' }}>
                <span style={{ display: 'block', fontSize: '24px', fontWeight: 700, color: '#fff' }}>
                  {totals.total_units}
                </span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Total Units</span>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#10b981', borderRadius: '10px' }}>
                <span style={{ display: 'block', fontSize: '24px', fontWeight: 700, color: '#fff' }}>
                  ₹{totals.total_revenue.toLocaleString()}
                </span>
                <span style={{ fontSize: '12px', color: '#d1fae5' }}>Total Revenue</span>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', backgroundColor: '#1e293b', borderRadius: '10px' }}>
                <span style={{ display: 'block', fontSize: '24px', fontWeight: 700, color: '#fff' }}>
                  {totals.avg_reorder}%
                </span>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Avg Reorder Rate</span>
              </div>
            </div>
          </div>

          {/* Retail KPIs */}
          <div style={{ marginTop: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: '#fff' }}>📈 Retail KPIs</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Store Churn Rate (%)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  value={kpis.store_churn_rate}
                  onChange={(e) => setKpis({...kpis, store_churn_rate: parseFloat(e.target.value) || 0})}
                  style={inputStyle} 
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>New Stores This Month</label>
                <input 
                  type="number" 
                  value={kpis.new_stores_this_month}
                  onChange={(e) => setKpis({...kpis, new_stores_this_month: parseInt(e.target.value) || 0})}
                  style={inputStyle} 
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Avg Order Value (₹)</label>
                <input 
                  type="number" 
                  value={kpis.avg_order_value}
                  onChange={(e) => setKpis({...kpis, avg_order_value: parseInt(e.target.value) || 0})}
                  style={inputStyle} 
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <label style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Target Stores</label>
                <input 
                  type="number" 
                  value={kpis.target_stores}
                  onChange={(e) => setKpis({...kpis, target_stores: parseInt(e.target.value) || 0})}
                  style={inputStyle} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          padding: '16px 24px',
          backgroundColor: '#0f172a',
          borderTop: '1px solid #334155'
        }}>
          <button onClick={onClose} style={{
            backgroundColor: '#334155',
            border: 'none',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer'
          }}>Cancel</button>
          <button onClick={() => onSave({ stores: storeData, kpis, totals })} style={{
            background: 'linear-gradient(135deg, #10b981, #059669)',
            border: 'none',
            color: '#fff',
            padding: '12px 28px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer'
          }}>💾 Save Retail Data</button>
        </div>
      </div>
    </div>
  );
};


export default SalesIntelligencePage;
