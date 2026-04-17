import React from 'react';
import { ChevronLeft, ChevronRight, RefreshCw, Edit3, ShoppingCart, Store, Target } from 'lucide-react';
import { DailySalesTabSkeleton } from './SalesSkeletons';
import { calculateRetailTotals } from '@/utils/retailCalculations';

const DailySalesTab = ({
  isDarkMode,
  dailySalesData,
  globalStats,
  weeklyOverview,
  pipelineData,
  viewBy,
  setViewBy,
  selectedDate,
  setSelectedDate,
  selectedWeek,
  setSelectedWeek,
  selectedMonth,
  setSelectedMonth,
  selectedQuarter,
  setSelectedQuarter,
  selectedYear,
  setSelectedYear,
  navigateDate,
  getLocalDateString,
  formatDateDisplay,
  getWeekOptions,
  getMonthOptions,
  getQuarterOptions,
  getYearOptions,
  getViewLabel,
  formatCurrency,
  setShowRetailModal,
  setShowECommerceModal,
  setShowTargetModal,
  handleOpenRetailModal,
  fetchDailySalesData,
  loading
}) => {
  // Show skeleton while loading
  if (loading) {
    return <DailySalesTabSkeleton isDarkMode={isDarkMode} />;
  }

  // Calculate totals from fetched data using utility function
  const ecomRevenue = dailySalesData.ecom?.summary?.total_revenue || 0;
  
  // Use centralized retail calculation utility
  const retailTotals = calculateRetailTotals(dailySalesData.retail?.totals || dailySalesData.retail);
  const retailRevenue = retailTotals.revenue;
  const retailUnits = retailTotals.units;
  const retailOrders = retailTotals.orders;
  
  const ecomUnits = dailySalesData.ecom?.summary?.total_sold_units || 0;
  const ecomOrders = dailySalesData.ecom?.funnel_totals?.orders || 0;
  const ecomAdSpend = dailySalesData.ecom?.funnel_totals?.ad_spend || 0;
  const ecomImpressions = dailySalesData.ecom?.funnel_totals?.impressions || 0;
  
  // Calculate visits from stores if available
  const retailVisits = dailySalesData.retail?.stores?.reduce((sum, s) => sum + (parseInt(s.visits) || 0), 0) || 
                       dailySalesData.retail?.totals?.visits || 0;
  const retailActiveStores = dailySalesData.retail?.stores?.filter(s => (parseInt(s.orders) || 0) > 0).length || 0;
  const retailTotalStores = dailySalesData.retail?.stores?.length || 0;
  
  const ecomShare = (ecomRevenue + retailRevenue) > 0 
    ? Math.round((ecomRevenue / (ecomRevenue + retailRevenue)) * 100) 
    : null;

  // Calculate KPIs from actual data
  const totalRevenue = ecomRevenue + retailRevenue;
  const totalOrders = ecomOrders + retailOrders;
  const adSpend = ecomAdSpend;
  
  // Calculate derived KPIs
  // ROAS should use ONLY e-commerce revenue since ad spend is for e-commerce marketing only
  const calculatedRoas = adSpend > 0 ? (ecomRevenue / adSpend) : 0;
  const calculatedAvgOrder = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
  const calculatedConvRate = ecomImpressions > 0 ? ((ecomOrders / ecomImpressions) * 100) : 0;

  // Check if today
  const isToday = selectedDate === getLocalDateString();

  // Handle retail modal open (use provided handler or fallback to simple setter)
  const onOpenRetailModal = handleOpenRetailModal || (() => setShowRetailModal(true));

  return (
    <div className="space-y-3">
      {/* Row 1: Compact Header - View By + Period Selector */}
      <div className={`flex items-center justify-between rounded-lg px-3 py-2 ${isDarkMode ? 'bg-slate-800/30' : 'bg-gray-50'}`}>
        <div className="flex items-center gap-3">
          {/* View By */}
          <div className="flex items-center gap-2">
            <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>View:</span>
            <select
              value={viewBy}
              onChange={(e) => setViewBy(e.target.value)}
              className={`px-2 py-1 rounded text-sm border-0 focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                isDarkMode ? 'bg-slate-700 text-white' : 'bg-white text-gray-900'
              }`}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
              <option value="ytd">Year to Date</option>
            </select>
          </div>
          
          {/* Divider */}
          <div className={`w-px h-4 ${isDarkMode ? 'bg-slate-600' : 'bg-gray-300'}`}></div>
          
          {/* Period Selector */}
          {viewBy === 'daily' && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigateDate(-1)}
                className={`p-1 rounded transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-gray-500' : 'hover:bg-gray-200 text-gray-500'}`}
              >
                <ChevronLeft size={14} />
              </button>
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded ${isDarkMode ? 'bg-slate-700/50' : 'bg-white'}`}>
                {isToday && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${isDarkMode ? 'bg-teal-500/20 text-teal-400' : 'bg-teal-100 text-teal-600'}`}>
                    Today
                  </span>
                )}
                <span className={`text-sm font-medium ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>
                  {isToday ? new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : formatDateDisplay(selectedDate)}
                </span>
                <input
                  type="date"
                  value={selectedDate}
                  max={getLocalDateString()}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className={`text-xs bg-transparent border-none outline-none cursor-pointer w-auto ${isDarkMode ? 'text-slate-400' : 'text-gray-500'}`}
                />
              </div>
              <button
                onClick={() => navigateDate(1)}
                disabled={selectedDate === getLocalDateString()}
                className={`p-1 rounded transition-colors ${
                  selectedDate === getLocalDateString()
                    ? 'opacity-30 cursor-not-allowed'
                    : isDarkMode ? 'hover:bg-slate-700 text-gray-500' : 'hover:bg-gray-200 text-gray-500'
                }`}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
          {viewBy === 'weekly' && (
            <select
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className={`px-2 py-1 rounded text-sm border-0 focus:outline-none ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-white text-gray-900'}`}
            >
              {getWeekOptions().map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}
          {viewBy === 'monthly' && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className={`px-2 py-1 rounded text-sm border-0 focus:outline-none ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-white text-gray-900'}`}
            >
              {getMonthOptions().map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}
          {viewBy === 'quarterly' && (
            <select
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
              className={`px-2 py-1 rounded text-sm border-0 focus:outline-none ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-white text-gray-900'}`}
            >
              {getQuarterOptions().map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}
          {viewBy === 'yearly' && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className={`px-2 py-1 rounded text-sm border-0 focus:outline-none ${isDarkMode ? 'bg-slate-700 text-white' : 'bg-white text-gray-900'}`}
            >
              {getYearOptions().map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          )}
          {viewBy === 'ytd' && (
            <span className={`px-2 py-1 rounded text-sm ${isDarkMode ? 'bg-slate-700/50 text-slate-300' : 'bg-white text-gray-700'}`}>
              {getViewLabel()}
            </span>
          )}
        </div>
        <button 
          onClick={fetchDailySalesData} 
          className={`p-1.5 rounded ${isDarkMode ? 'hover:bg-slate-700 text-gray-500' : 'hover:bg-gray-200 text-gray-500'}`}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Aggregation Notice for non-daily views */}
      {viewBy !== 'daily' && (
        <div className={`rounded-lg px-3 py-2 flex items-center justify-between ${isDarkMode ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'}`}>
          <div className="flex items-center gap-2">
            <span className="text-xs">ℹ️</span>
            <span className={`text-xs ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
              Aggregates <strong>{dailySalesData.daysCount || 0}</strong> daily entries
            </span>
          </div>
          <button 
            onClick={() => setViewBy('daily')}
            className="px-2 py-1 bg-teal-600 hover:bg-teal-500 rounded text-[10px] text-white font-medium"
          >
            Switch to Daily to Edit
          </button>
        </div>
      )}

      {/* Row 2: E-Commerce & Retail Cards - Compact */}
      <div className="grid grid-cols-2 gap-3">
        {/* E-Commerce Card */}
        <div className={`border rounded-lg p-3 ${isDarkMode ? 'bg-slate-800/50 border-teal-500/20' : 'bg-white border-teal-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-teal-500/20' : 'bg-teal-50'}`}>
                <ShoppingCart className="w-3.5 h-3.5 text-teal-500" />
              </div>
              <div>
                <h3 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>E-Commerce</h3>
                <p className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{getViewLabel()}</p>
              </div>
            </div>
            {viewBy === 'daily' && (
              <button
                onClick={() => setShowECommerceModal(true)}
                className="px-2 py-1 bg-teal-600 hover:bg-teal-500 rounded text-[10px] text-white flex items-center gap-1"
                data-testid="edit-ecommerce-btn"
              >
                <Edit3 size={10} /> Edit
              </button>
            )}
          </div>
          <div className="grid grid-cols-5 gap-1.5 text-center">
            <div>
              <p className={`text-sm font-bold ${isDarkMode ? 'text-teal-400' : 'text-teal-600'}`}>{formatCurrency(ecomRevenue)}</p>
              <p className={`text-[9px] ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Revenue</p>
            </div>
            <div>
              <p className={`text-sm font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>{formatCurrency(ecomAdSpend)}</p>
              <p className={`text-[9px] ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Ad Spend</p>
            </div>
            <div>
              <p className={`text-sm font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{ecomImpressions.toLocaleString()}</p>
              <p className={`text-[9px] ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Impr</p>
            </div>
            <div>
              <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{ecomUnits}</p>
              <p className={`text-[9px] ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Units</p>
            </div>
            <div>
              <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{ecomOrders}</p>
              <p className={`text-[9px] ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Orders</p>
              {ecomOrders === 0 && ecomAdSpend > 0 && (
                <p className="text-[9px] text-red-500 font-medium mt-0.5">No Sale</p>
              )}
            </div>
          </div>
          {!dailySalesData.ecom && viewBy === 'daily' && (
            <p className={`text-center text-[10px] mt-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
              No data. Click Edit to add.
            </p>
          )}
        </div>

        {/* Retail Card */}
        <div className={`border rounded-lg p-3 ${isDarkMode ? 'bg-slate-800/50 border-orange-500/20' : 'bg-white border-orange-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isDarkMode ? 'bg-orange-500/20' : 'bg-orange-50'}`}>
                <Store className="w-3.5 h-3.5 text-orange-500" />
              </div>
              <div>
                <h3 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Retail</h3>
                <p className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{getViewLabel()}</p>
              </div>
            </div>
            {viewBy === 'daily' && (
              <button
                onClick={onOpenRetailModal}
                className="px-2 py-1 bg-orange-600 hover:bg-orange-500 rounded text-[10px] text-white flex items-center gap-1"
                data-testid="edit-retail-btn"
              >
                <Edit3 size={10} /> Edit
              </button>
            )}
          </div>
          <div className="grid grid-cols-5 gap-1.5 text-center">
            <div>
              <p className={`text-sm font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>{formatCurrency(retailRevenue)}</p>
              <p className={`text-[9px] ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Revenue</p>
            </div>
            <div>
              <p className={`text-sm font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>{retailVisits.toLocaleString()}</p>
              <p className={`text-[9px] ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Visits</p>
            </div>
            <div>
              <p className={`text-sm font-bold ${isDarkMode ? 'text-slate-300' : 'text-gray-700'}`}>{retailActiveStores}/{retailTotalStores}</p>
              <p className={`text-[9px] ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Stores</p>
            </div>
            <div>
              <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{retailUnits}</p>
              <p className={`text-[9px] ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Units</p>
            </div>
            <div>
              <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{retailOrders}</p>
              <p className={`text-[9px] ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Orders</p>
            </div>
          </div>
          {!dailySalesData.retail && viewBy === 'daily' && (
            <p className={`text-center text-[10px] mt-1 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`}>
              No data. Click Edit to add.
            </p>
          )}
        </div>
      </div>

      {/* Row 3: Combined Summary - Inline Bar */}
      <div className={`rounded-lg px-4 py-2 flex items-center justify-between ${isDarkMode ? 'bg-slate-800/30' : 'bg-gray-50'}`}>
        <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>📊 Combined:</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-green-400">{formatCurrency(ecomRevenue + retailRevenue)}</span>
            <span className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Revenue</span>
          </div>
          <div className={`w-px h-4 ${isDarkMode ? 'bg-slate-600' : 'bg-gray-300'}`}></div>
          <div className="flex items-center gap-1.5">
            <span className={`text-sm font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>{formatCurrency(ecomAdSpend)}</span>
            <span className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Ad Spend</span>
          </div>
          <div className={`w-px h-4 ${isDarkMode ? 'bg-slate-600' : 'bg-gray-300'}`}></div>
          <div className="flex items-center gap-1.5">
            <span className={`text-sm font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>{ecomImpressions.toLocaleString()}</span>
            <span className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Impr</span>
          </div>
          <div className={`w-px h-4 ${isDarkMode ? 'bg-slate-600' : 'bg-gray-300'}`}></div>
          <div className="flex items-center gap-1.5">
            <span className={`text-sm font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>{retailVisits.toLocaleString()}</span>
            <span className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Visits</span>
          </div>
          <div className={`w-px h-4 ${isDarkMode ? 'bg-slate-600' : 'bg-gray-300'}`}></div>
          <div className="flex items-center gap-1.5">
            <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{ecomUnits + retailUnits}</span>
            <span className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Units</span>
          </div>
          <div className={`w-px h-4 ${isDarkMode ? 'bg-slate-600' : 'bg-gray-300'}`}></div>
          <div className="flex items-center gap-1.5">
            <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{ecomOrders + retailOrders}</span>
            <span className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Orders</span>
          </div>
          <div className={`w-px h-4 ${isDarkMode ? 'bg-slate-600' : 'bg-gray-300'}`}></div>
          <div className="flex items-center gap-1.5">
            <span className={`text-sm font-bold ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>{ecomShare !== null ? `${ecomShare}%` : '--'}</span>
            <span className={`text-[10px] ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>E-Com</span>
          </div>
        </div>
      </div>

      {/* Row 4: Weekly Overview - Enhanced with Targets & KPIs */}
      <div className={`border rounded-lg p-3 ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              📈 Weekly Overview
            </h3>
            {weeklyOverview?.week_info && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>
                {weeklyOverview.week_info.period_key}
              </span>
            )}
          </div>
          {setShowTargetModal && (
            <button
              onClick={() => setShowTargetModal(true)}
              className={`text-[10px] px-2 py-1 rounded flex items-center gap-1 ${
                isDarkMode ? 'bg-teal-600/20 text-teal-400 hover:bg-teal-600/30' : 'bg-teal-50 text-teal-600 hover:bg-teal-100'
              }`}
              data-testid="set-targets-btn"
            >
              <Target size={10} />
              Set Targets
            </button>
          )}
        </div>
        
        {/* Revenue Row with Progress Bars */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {/* Combined Target */}
          <div className={`rounded p-2 ${isDarkMode ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
            <p className={`text-[10px] mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Weekly Target</p>
            <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatCurrency(weeklyOverview?.targets?.combined || 0)}
            </p>
            <div className="mt-1.5">
              <div className={`h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-600' : 'bg-gray-200'}`}>
                <div 
                  className={`h-full rounded-full transition-all ${
                    (weeklyOverview?.achievement?.combined || 0) >= 100 ? 'bg-green-500' :
                    (weeklyOverview?.achievement?.combined || 0) >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(weeklyOverview?.achievement?.combined || 0, 100)}%` }}
                ></div>
              </div>
              <p className={`text-[9px] mt-0.5 ${
                (weeklyOverview?.achievement?.combined || 0) >= 100 ? 'text-green-400' :
                (weeklyOverview?.achievement?.combined || 0) >= 70 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {weeklyOverview?.achievement?.combined || 0}% achieved
              </p>
            </div>
          </div>
          
          {/* E-Commerce */}
          <div className={`rounded p-2 ${isDarkMode ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
            <p className={`text-[10px] mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>E-Commerce</p>
            <p className="text-sm font-bold text-teal-400">{formatCurrency(weeklyOverview?.actuals?.ecommerce || ecomRevenue)}</p>
            <div className="mt-1.5">
              <div className={`h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-600' : 'bg-gray-200'}`}>
                <div 
                  className={`h-full rounded-full bg-teal-500 transition-all`}
                  style={{ width: `${Math.min(weeklyOverview?.achievement?.ecommerce || 0, 100)}%` }}
                ></div>
              </div>
              <p className={`text-[9px] mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Tgt: {formatCurrency(weeklyOverview?.targets?.ecommerce || 0)}
              </p>
            </div>
          </div>
          
          {/* Retail */}
          <div className={`rounded p-2 ${isDarkMode ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
            <p className={`text-[10px] mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Retail</p>
            <p className="text-sm font-bold text-orange-400">{formatCurrency(weeklyOverview?.actuals?.retail || retailRevenue)}</p>
            <div className="mt-1.5">
              <div className={`h-1.5 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-600' : 'bg-gray-200'}`}>
                <div 
                  className={`h-full rounded-full bg-orange-500 transition-all`}
                  style={{ width: `${Math.min(weeklyOverview?.achievement?.retail || 0, 100)}%` }}
                ></div>
              </div>
              <p className={`text-[9px] mt-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Tgt: {formatCurrency(weeklyOverview?.targets?.retail || 0)}
              </p>
            </div>
          </div>
          
          {/* Combined Actual */}
          <div className={`rounded p-2 ${isDarkMode ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
            <p className={`text-[10px] mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Total Revenue</p>
            <p className="text-sm font-bold text-green-400">{formatCurrency(weeklyOverview?.actuals?.combined || totalRevenue)}</p>
            <p className={`text-[9px] mt-2.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
              {weeklyOverview?.days_data || 0} days data
            </p>
          </div>
        </div>
        
        {/* KPI Row */}
        <div className="grid grid-cols-4 gap-2">
          {/* ROAS */}
          <div className={`rounded p-2 text-center ${isDarkMode ? 'bg-slate-700/20' : 'bg-gray-50/50'}`}>
            <p className={`text-[9px] mb-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>ROAS</p>
            <p className={`text-sm font-bold ${
              (weeklyOverview?.kpis?.roas || calculatedRoas) >= (weeklyOverview?.kpis?.roas_target || 3) ? 'text-green-400' :
              (weeklyOverview?.kpis?.roas || calculatedRoas) >= (weeklyOverview?.kpis?.roas_target || 3) * 0.7 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {(weeklyOverview?.kpis?.roas || calculatedRoas).toFixed(2)}x
            </p>
            <p className={`text-[8px] ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
              Tgt: {(weeklyOverview?.kpis?.roas_target || 3).toFixed(1)}x
            </p>
          </div>
          
          {/* Conv. Rate */}
          <div className={`rounded p-2 text-center ${isDarkMode ? 'bg-slate-700/20' : 'bg-gray-50/50'}`}>
            <p className={`text-[9px] mb-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Conv. Rate</p>
            <p className={`text-sm font-bold ${
              (weeklyOverview?.kpis?.conv_rate || calculatedConvRate) >= 2 ? 'text-green-400' :
              (weeklyOverview?.kpis?.conv_rate || calculatedConvRate) >= 1 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {(weeklyOverview?.kpis?.conv_rate || calculatedConvRate).toFixed(1)}%
            </p>
            <p className={`text-[8px] ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
              Orders/Clicks
            </p>
          </div>
          
          {/* Avg Order */}
          <div className={`rounded p-2 text-center ${isDarkMode ? 'bg-slate-700/20' : 'bg-gray-50/50'}`}>
            <p className={`text-[9px] mb-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Avg Order</p>
            <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {formatCurrency(weeklyOverview?.kpis?.avg_order || calculatedAvgOrder)}
            </p>
            <p className={`text-[8px] ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
              Rev/Orders
            </p>
          </div>
          
          {/* Ad Spend */}
          <div className={`rounded p-2 text-center ${isDarkMode ? 'bg-slate-700/20' : 'bg-gray-50/50'}`}>
            <p className={`text-[9px] mb-0.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Ad Spend</p>
            <p className={`text-sm font-bold ${
              (weeklyOverview?.kpis?.ad_spend_pct || 0) <= 100 ? 'text-green-400' :
              (weeklyOverview?.kpis?.ad_spend_pct || 0) <= 120 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {formatCurrency(weeklyOverview?.kpis?.ad_spend || adSpend)}
            </p>
            <p className={`text-[8px] ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
              {weeklyOverview?.kpis?.ad_spend_budget > 0 ? `${weeklyOverview?.kpis?.ad_spend_pct || 0}% of budget` : 'No budget set'}
            </p>
          </div>
        </div>
      </div>

      {/* Row 5: Retail Pipeline - Compact Inline */}
      <div className={`border rounded-lg p-3 ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-gray-200'}`}>
        <h3 className={`text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>🏪 Retail Pipeline</h3>
        <div className="grid grid-cols-6 gap-2">
          {[
            { label: 'Stores', value: globalStats?.totalStores || 0 },
            { label: 'Visited', value: pipelineData?.funnel?.visited || 0 },
            { label: 'Pitched', value: pipelineData?.funnel?.pitched || 0 },
            { label: 'Ordered', value: pipelineData?.funnel?.ordered || 0 },
            { label: 'Pending', value: pipelineData?.pendingStores || 0 },
            { label: 'Reorder', value: `${pipelineData?.funnel?.reorderRate || 0}%` }
          ].map((metric, idx) => (
            <div key={idx} className={`text-center p-1.5 rounded ${isDarkMode ? 'bg-slate-700/30' : 'bg-gray-50'}`}>
              <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{metric.value}</p>
              <p className={`text-[9px] ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>{metric.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DailySalesTab;
