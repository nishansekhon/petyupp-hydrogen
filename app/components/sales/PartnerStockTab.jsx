import React, { useState, useEffect, useRef } from 'react';
import { 
  Package, ChevronDown, ChevronRight, Download, RefreshCw, 
  Plus, Trash2, IndianRupee, Calendar, User, CreditCard, X,
  AlertCircle, CheckCircle, TrendingDown, Eye, EyeOff, Play, Loader2, Check,
  Camera, Image as ImageIcon
} from 'lucide-react';
import { API_BASE_URL } from '@/utils/api';
import QuickRestockModal from './QuickRestockModal';
import InlineEditCell from './InlineEditCell';
import { toast } from 'sonner';

const API_URL = API_BASE_URL + '/api';

const PartnerStockTab = () => {
  const [allPartners, setAllPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedPartner, setExpandedPartner] = useState(null);
  const [summary, setSummary] = useState({
    totalConsignment: 0,
    totalSold: 0,
    totalCollected: 0,
    totalOutstanding: 0,
    trackedCount: 0,
    untrackedCount: 0
  });
  const [legacyEntries, setLegacyEntries] = useState({ count: 0, total_revenue: 0, entries: [] });
  const [partnerCollections, setPartnerCollections] = useState({});
  const [partnerSalesLogs, setPartnerSalesLogs] = useState({});
  const [partnerStockDetails, setPartnerStockDetails] = useState({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStartTrackingModal, setShowStartTrackingModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Collection delete confirmation state
  const [deleteConfirmCollection, setDeleteConfirmCollection] = useState(null);
  const [deletingCollection, setDeletingCollection] = useState(false);
  
  // Collection form error state
  const [collectionFormError, setCollectionFormError] = useState('');
  
  // Proof image upload state
  const [proofImageFile, setProofImageFile] = useState(null);
  const [proofImagePreview, setProofImagePreview] = useState(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const proofInputRef = useRef(null);
  
  // Lightbox state for viewing proof images
  const [lightboxImage, setLightboxImage] = useState(null);

  // Collection form state
  const [collectionForm, setCollectionForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    amount: '',
    payment_mode: 'Cash',
    collected_by: '',
    notes: ''
  });

  // Fetch unified partner data from the new endpoint
  const fetchUnifiedPartnerData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/v1/partner-stock/sales-summary`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setAllPartners(data.summaries || []);
        setSummary({
          totalConsignment: data.grand_total_consignment || 0,
          totalSold: data.grand_total_sold || 0,
          totalCollected: data.grand_total_collected || 0,
          totalOutstanding: data.grand_total_outstanding || 0,
          trackedCount: data.tracked_count || 0,
          untrackedCount: data.untracked_count || 0
        });
        // Store legacy entries info
        if (data.legacy_entries) {
          setLegacyEntries(data.legacy_entries);
        }
      }
    } catch (error) {
      console.error('Error fetching unified partner data:', error);
    }
    setLoading(false);
  };

  const fetchPartnerCollections = async (partnerId, partnerName) => {
    try {
      const token = localStorage.getItem('adminToken');
      // Try to fetch by partner name for untracked stores
      const response = await fetch(`${API_URL}/admin/partner-collections?partner_id=${encodeURIComponent(partnerId)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setPartnerCollections(prev => ({
          ...prev,
          [partnerId]: data.collections || []
        }));
      }
    } catch (error) {
      console.error('Error fetching partner collections:', error);
    }
  };

  const fetchPartnerSalesLog = async (partnerId, partnerName) => {
    try {
      const token = localStorage.getItem('adminToken');
      // Pass store_name as query param for untracked stores
      const url = `${API_URL}/v1/partner-stock/sales-log/${encodeURIComponent(partnerId)}?store_name=${encodeURIComponent(partnerName)}`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setPartnerSalesLogs(prev => ({
          ...prev,
          [partnerId]: data.sales || []
        }));
      }
    } catch (error) {
      console.error('Error fetching partner sales log:', error);
    }
  };

  const fetchPartnerStockDetails = async (partnerId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/v1/partner-stock/by-partner/${partnerId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (data.success) {
        setPartnerStockDetails(prev => ({
          ...prev,
          [partnerId]: data.products || []
        }));
      }
    } catch (error) {
      console.error('Error fetching partner stock details:', error);
    }
  };

  // Inline edit handler for stock entries
  const handleUpdateStockEntry = async (partnerId, productId, field, newValue) => {
    try {
      const token = localStorage.getItem('adminToken');
      const currentStock = partnerStockDetails[partnerId]?.find(s => s.product_id === productId);
      if (!currentStock) return false;

      const quantity = field === 'qty' ? newValue : currentStock.quantity_remaining;
      const costPerUnit = field === 'cost' ? newValue : currentStock.unit_price;

      const response = await fetch(`${API_URL}/v1/partner-stock/update-entry`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          partner_id: partnerId,
          product_id: productId,
          quantity: quantity,
          cost_per_unit: costPerUnit
        })
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setPartnerStockDetails(prev => ({
          ...prev,
          [partnerId]: prev[partnerId].map(item =>
            item.product_id === productId
              ? {
                  ...item,
                  quantity_remaining: quantity,
                  unit_price: costPerUnit,
                  stock_value: quantity * costPerUnit
                }
              : item
          )
        }));
        
        // Refresh unified data for updated totals
        fetchUnifiedPartnerData();
        toast.success('Stock updated');
        return true;
      } else {
        toast.error(data.error || 'Failed to update');
        return false;
      }
    } catch (error) {
      console.error('Error updating stock entry:', error);
      toast.error('Failed to update stock');
      return false;
    }
  };

  useEffect(() => {
    fetchUnifiedPartnerData();
  }, []);

  const toggleExpand = (partner) => {
    const partnerId = partner.partner_id;
    if (expandedPartner === partnerId) {
      setExpandedPartner(null);
    } else {
      setExpandedPartner(partnerId);
      // Fetch detailed data for this partner
      fetchPartnerCollections(partnerId, partner.partner_name);
      fetchPartnerSalesLog(partnerId, partner.partner_name);
      if (partner.has_consignment) {
        fetchPartnerStockDetails(partnerId);
      }
    }
  };

  const downloadReport = () => {
    // Export to CSV
    const headers = ['Partner', 'Tracked', 'Stock Value', 'Sold', 'Collected', 'Outstanding'];
    const rows = allPartners.map(p => [
      `"${p.partner_name}"`,
      p.has_consignment ? 'Yes' : 'No',
      p.consignment_value || 0,
      p.total_sold_value || 0,
      p.collected || 0,
      p.outstanding || 0
    ]);
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `partner-stock-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' });
  };

  const getOutstandingColor = (outstanding) => {
    if (outstanding <= 0) return 'text-green-400';
    if (outstanding < 1000) return 'text-teal-400';
    if (outstanding < 5000) return 'text-orange-400';
    return 'text-red-400';
  };

  const getOutstandingBg = (outstanding) => {
    if (outstanding <= 0) return 'bg-green-500/10 border-green-500/20';
    if (outstanding < 1000) return 'bg-teal-500/10 border-teal-500/20';
    if (outstanding < 5000) return 'bg-orange-500/10 border-orange-500/20';
    return 'bg-red-500/10 border-red-500/20';
  };

  // Open Start Tracking modal for untracked stores
  const openStartTrackingModal = (partner) => {
    setSelectedPartner(partner);
    setShowStartTrackingModal(true);
  };

  // Handle successful stock addition
  const handleRestockSuccess = async () => {
    // Refresh data - the store should now appear as tracked
    await fetchUnifiedPartnerData();
    if (selectedPartner) {
      // Expand the partner to show their new stock
      const partnerId = selectedPartner.partner_id || selectedPartner.partner_name.toLowerCase().replace(/\s+/g, '_');
      setExpandedPartner(partnerId);
      fetchPartnerStockDetails(partnerId);
    }
  };

  const openAddCollectionModal = (partner) => {
    setSelectedPartner(partner);
    setCollectionForm({
      date: new Date().toISOString().slice(0, 10),
      amount: '',
      payment_mode: 'Cash',
      collected_by: '',
      notes: ''
    });
    setCollectionFormError(''); // Clear any previous errors
    setProofImageFile(null);
    setProofImagePreview(null);
    setShowAddModal(true);
  };

  const handleSaveCollection = async () => {
    setCollectionFormError(''); // Clear previous errors
    
    if (!collectionForm.amount || parseFloat(collectionForm.amount) <= 0) {
      setCollectionFormError('Please enter a valid amount');
      return;
    }
    if (!collectionForm.collected_by.trim()) {
      setCollectionFormError('Please enter who collected the payment');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('adminToken');
      let proofImageUrl = null;
      
      // Upload proof image first if present
      if (proofImageFile) {
        setUploadingProof(true);
        const formData = new FormData();
        formData.append('file', proofImageFile);
        
        const uploadResponse = await fetch(`${API_URL}/admin/partner-collections/upload-proof`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        const uploadData = await uploadResponse.json();
        setUploadingProof(false);
        
        if (uploadData.success) {
          proofImageUrl = uploadData.url;
        } else {
          setCollectionFormError('Failed to upload proof image. Please try again.');
          setSaving(false);
          return;
        }
      }
      
      const response = await fetch(`${API_URL}/admin/partner-collections`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          partner_id: selectedPartner.partner_id,
          partner_name: selectedPartner.partner_name,
          date: collectionForm.date,
          amount: parseFloat(collectionForm.amount),
          payment_mode: collectionForm.payment_mode,
          collected_by: collectionForm.collected_by.trim(),
          notes: collectionForm.notes.trim(),
          proof_image: proofImageUrl
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowAddModal(false);
        setCollectionFormError('');
        setProofImageFile(null);
        setProofImagePreview(null);
        toast.success('Collection saved successfully');
        // Refresh data
        fetchPartnerCollections(selectedPartner.partner_id, selectedPartner.partner_name);
        fetchUnifiedPartnerData();
      } else {
        setCollectionFormError(data.error || 'Failed to save collection');
      }
    } catch (error) {
      console.error('Error saving collection:', error);
      setCollectionFormError('Failed to save collection. Please try again.');
    }
    setSaving(false);
  };
  
  // Handle proof image selection
  const handleProofImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setCollectionFormError('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setCollectionFormError('Image size must be less than 5MB');
        return;
      }
      setProofImageFile(file);
      setProofImagePreview(URL.createObjectURL(file));
      setCollectionFormError('');
    }
  };
  
  // Remove proof image
  const removeProofImage = () => {
    setProofImageFile(null);
    setProofImagePreview(null);
    if (proofInputRef.current) {
      proofInputRef.current.value = '';
    }
  };

  const handleDeleteCollection = async (collectionId, partnerId) => {
    setDeletingCollection(true);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/admin/partner-collections/${collectionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setDeleteConfirmCollection(null);
        fetchPartnerCollections(partnerId, '');
        fetchUnifiedPartnerData();
        toast.success('Collection deleted');
      } else {
        toast.error(data.error || 'Failed to delete collection');
      }
    } catch (error) {
      console.error('Error deleting collection:', error);
      toast.error('Failed to delete collection');
    }
    setDeletingCollection(false);
  };

  // Calculate unsold stock (only for tracked partners)
  const unsoldStockValue = summary.totalConsignment - summary.totalSold;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-500/20 rounded-lg">
            <Package className="w-6 h-6 text-teal-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Partner Stock</h2>
            <p className="text-sm text-slate-400">
              Track consignment inventory across all retail partners
              <span className="ml-2 text-xs">
                ({summary.trackedCount} tracked, {summary.untrackedCount} untracked)
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchUnifiedPartnerData}
            disabled={loading}
            className="p-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg"
            data-testid="refresh-btn"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={downloadReport}
            disabled={allPartners.length === 0}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg flex items-center gap-2"
            data-testid="export-btn"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <p className="text-sm text-slate-400">Total Consignment</p>
          <p className="text-2xl font-bold text-teal-400">₹{summary.totalConsignment.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">{summary.trackedCount} tracked stores</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <p className="text-sm text-slate-400">Total Sold</p>
          <p className="text-2xl font-bold text-orange-400">₹{summary.totalSold.toLocaleString()}</p>
          <p className="text-xs text-slate-500 mt-1">All {allPartners.length} stores</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <p className="text-sm text-slate-400">Total Collected</p>
          <p className="text-2xl font-bold text-green-400">₹{summary.totalCollected.toLocaleString()}</p>
        </div>
        <div className={`rounded-xl p-4 border ${summary.totalOutstanding > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
          <p className="text-sm text-slate-400">Outstanding</p>
          <p className={`text-2xl font-bold ${summary.totalOutstanding > 0 ? 'text-red-400' : 'text-green-400'}`}>
            ₹{summary.totalOutstanding.toLocaleString()}
          </p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <p className="text-sm text-slate-400">Unsold Stock</p>
          <p className="text-2xl font-bold text-slate-300">
            {summary.totalConsignment > 0 ? `₹${Math.max(0, unsoldStockValue).toLocaleString()}` : '-'}
          </p>
          <p className="text-xs text-slate-500 mt-1">Tracked only</p>
        </div>
      </div>

      {/* Legacy entries note */}
      {legacyEntries.count > 0 && legacyEntries.total_revenue > 0 && (
        <p className="text-xs text-slate-500 -mt-3">
          ₹{legacyEntries.total_revenue.toLocaleString()} from {legacyEntries.count} legacy {legacyEntries.count === 1 ? 'entry' : 'entries'} without store breakdown
          {legacyEntries.entries.length > 0 && (
            <span className="ml-1">
              ({legacyEntries.entries.map(e => formatDate(e.date)).join(', ')})
            </span>
          )}
        </p>
      )}

      {/* Partner Stock Table */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Partner</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase hidden sm:table-cell">Units</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Stock Value</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Sold</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Collected</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Outstanding</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase hidden md:table-cell">Last Given</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-teal-500" />
                    <p className="text-slate-400 mt-2">Loading...</p>
                  </td>
                </tr>
              ) : allPartners.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center">
                    <Package className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                    <p className="text-slate-400">No partner activity recorded yet</p>
                    <p className="text-slate-500 text-sm mt-1">
                      Record sales in Daily Sales to see partners here
                    </p>
                  </td>
                </tr>
              ) : (
                allPartners.map((partner) => {
                  const isTracked = partner.has_consignment;
                  const outstanding = partner.outstanding || 0;
                  
                  return (
                    <React.Fragment key={partner.partner_id}>
                      {/* Partner Row */}
                      <tr
                        className="border-t border-slate-700/50 hover:bg-slate-700/30 cursor-pointer"
                        onClick={() => toggleExpand(partner)}
                        data-testid={`partner-row-${partner.partner_id}`}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {expandedPartner === partner.partner_id ? (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                            <span className="font-medium text-white">{partner.partner_name}</span>
                            {/* Tracked/Untracked Badge */}
                            {isTracked ? (
                              <span className="px-1.5 py-0.5 text-[10px] rounded bg-teal-500/20 text-teal-400 flex items-center gap-0.5">
                                <Eye className="w-2.5 h-2.5" />
                                Tracked
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 text-[10px] rounded bg-slate-600/50 text-slate-400 flex items-center gap-0.5">
                                <EyeOff className="w-2.5 h-2.5" />
                                Untracked
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-300 hidden sm:table-cell">
                          {isTracked ? partner.consignment_quantity : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-medium">
                          {isTracked ? (
                            <span className="text-teal-400">₹{(partner.consignment_value || 0).toLocaleString()}</span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-orange-400 font-medium">
                          ₹{(partner.total_sold_value || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-green-400">
                          ₹{(partner.collected || 0).toLocaleString()}
                        </td>
                        <td className={`px-4 py-3 text-right font-medium ${getOutstandingColor(outstanding)}`}>
                          ₹{outstanding.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-400 text-sm hidden md:table-cell">
                          {isTracked ? formatDate(partner.last_stock_date) : '-'}
                        </td>
                      </tr>
                      
                      {/* Expanded View */}
                      {expandedPartner === partner.partner_id && (
                        <tr>
                          <td colSpan="7" className="bg-slate-900/50 border-t border-slate-700/30">
                            <div className="p-4 space-y-6">
                              {/* Section 1: Current Stock at Store */}
                              <div>
                                <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                                  <Package className="w-4 h-4 text-teal-400" />
                                  Current Stock at Store
                                </h4>
                                {isTracked ? (
                                  <div className="bg-slate-800/50 rounded-lg overflow-hidden">
                                    <p className="px-3 py-1 text-xs text-slate-500 bg-slate-700/20">Click Qty or Value to edit inline</p>
                                    <table className="w-full text-sm">
                                      <thead className="bg-slate-700/30">
                                        <tr>
                                          <th className="px-3 py-2 text-left text-xs text-slate-400">Product</th>
                                          <th className="px-3 py-2 text-right text-xs text-slate-400">Qty</th>
                                          <th className="px-3 py-2 text-right text-xs text-slate-400">Value</th>
                                          <th className="px-3 py-2 text-right text-xs text-slate-400 hidden sm:table-cell">Date</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {(partnerStockDetails[partner.partner_id] || []).length === 0 ? (
                                          <tr>
                                            <td colSpan="4" className="px-3 py-4 text-center text-slate-500 text-sm">
                                              Loading stock details...
                                            </td>
                                          </tr>
                                        ) : (
                                          partnerStockDetails[partner.partner_id].map((item, idx) => (
                                            <tr key={idx} className="border-t border-slate-700/30">
                                              <td className="px-3 py-2 text-slate-300">{item.product_name}</td>
                                              <td className="px-3 py-2 text-right">
                                                <InlineEditCell
                                                  value={item.quantity_remaining}
                                                  displayValue={item.quantity_remaining}
                                                  type="number"
                                                  onSave={(newValue) => handleUpdateStockEntry(partner.partner_id, item.product_id, 'qty', newValue)}
                                                  className="text-slate-300"
                                                  title="Click to edit quantity"
                                                />
                                              </td>
                                              <td className="px-3 py-2 text-right">
                                                <InlineEditCell
                                                  value={item.unit_price || 0}
                                                  displayValue={`₹${(item.stock_value || 0).toLocaleString()}`}
                                                  type="currency"
                                                  onSave={(newValue) => handleUpdateStockEntry(partner.partner_id, item.product_id, 'cost', newValue)}
                                                  className="text-teal-400"
                                                  title={`₹${item.unit_price || 0}/unit - Click to edit cost per unit`}
                                                />
                                              </td>
                                              <td className="px-3 py-2 text-right text-slate-500 hidden sm:table-cell">{formatDate(item.given_date)}</td>
                                            </tr>
                                          ))
                                        )}
                                        <tr className="border-t-2 border-slate-600 bg-slate-700/30">
                                          <td className="px-3 py-2 text-slate-200 font-medium">Total</td>
                                          <td className="px-3 py-2 text-right text-slate-200 font-medium">
                                            {(partnerStockDetails[partner.partner_id] || []).reduce((sum, item) => sum + (item.quantity_remaining || 0), 0)}
                                          </td>
                                          <td className="px-3 py-2 text-right text-teal-400 font-medium">
                                            ₹{(partnerStockDetails[partner.partner_id] || []).reduce((sum, item) => sum + (item.stock_value || 0), 0).toLocaleString()}
                                          </td>
                                          <td className="px-3 py-2 hidden sm:table-cell"></td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </div>
                                ) : (
                                  <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                                    <EyeOff className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                                    <p className="text-slate-400 text-sm">No consignment stock tracked yet</p>
                                    <p className="text-slate-500 text-xs mt-1 mb-3">
                                      Start tracking to monitor stock placement and calculate unsold inventory
                                    </p>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); openStartTrackingModal(partner); }}
                                      className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm rounded-lg inline-flex items-center gap-2"
                                      data-testid="start-tracking-btn"
                                    >
                                      <Play className="w-4 h-4" />
                                      Start Tracking
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Section 2: Sales History (from Daily Sales) */}
                              <div>
                                <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                                  <TrendingDown className="w-4 h-4 text-orange-400" />
                                  Sales History (from Daily Sales)
                                </h4>
                                <div className="bg-slate-800/50 rounded-lg overflow-hidden">
                                  <table className="w-full text-sm">
                                    <thead className="bg-slate-700/30">
                                      <tr>
                                        <th className="px-3 py-2 text-left text-xs text-slate-400">Date</th>
                                        <th className="px-3 py-2 text-right text-xs text-slate-400">Revenue</th>
                                        <th className="px-3 py-2 text-right text-xs text-slate-400">Orders</th>
                                        <th className="px-3 py-2 text-right text-xs text-slate-400">Units</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {(partnerSalesLogs[partner.partner_id] || []).length === 0 ? (
                                        <tr>
                                          <td colSpan="4" className="px-3 py-4 text-center text-slate-500 text-sm">
                                            {partner.total_sold_value > 0 ? 'Loading sales history...' : 'No sales recorded'}
                                          </td>
                                        </tr>
                                      ) : (
                                        partnerSalesLogs[partner.partner_id].map((sale, idx) => (
                                          <tr key={idx} className="border-t border-slate-700/30">
                                            <td className="px-3 py-2 text-slate-300">{formatDate(sale.sale_date)}</td>
                                            <td className="px-3 py-2 text-right text-orange-400 font-medium">₹{(sale.revenue || 0).toLocaleString()}</td>
                                            <td className="px-3 py-2 text-right text-slate-300">{sale.orders || 0}</td>
                                            <td className="px-3 py-2 text-right text-slate-300">{sale.units || 0}</td>
                                          </tr>
                                        ))
                                      )}
                                      {(partnerSalesLogs[partner.partner_id] || []).length > 0 && (
                                        <tr className="border-t-2 border-slate-600 bg-slate-700/30">
                                          <td className="px-3 py-2 text-slate-200 font-medium">Total</td>
                                          <td className="px-3 py-2 text-right text-orange-400 font-medium">
                                            ₹{(partnerSalesLogs[partner.partner_id] || []).reduce((sum, s) => sum + (s.revenue || 0), 0).toLocaleString()}
                                          </td>
                                          <td className="px-3 py-2 text-right text-slate-200 font-medium">
                                            {(partnerSalesLogs[partner.partner_id] || []).reduce((sum, s) => sum + (s.orders || 0), 0)}
                                          </td>
                                          <td className="px-3 py-2 text-right text-slate-200 font-medium">
                                            {(partnerSalesLogs[partner.partner_id] || []).reduce((sum, s) => sum + (s.units || 0), 0)}
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              {/* Section 3: Collections */}
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-green-400" />
                                    Collections
                                  </h4>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); openAddCollectionModal(partner); }}
                                    className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-sm rounded-lg flex items-center gap-1.5"
                                    data-testid="add-collection-btn"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    Add Collection
                                  </button>
                                </div>
                                <div className="bg-slate-800/50 rounded-lg overflow-hidden">
                                  <table className="w-full text-sm">
                                    <thead className="bg-slate-700/30">
                                      <tr>
                                        <th className="px-3 py-2 text-left text-xs text-slate-400">Date</th>
                                        <th className="px-3 py-2 text-right text-xs text-slate-400">Amount</th>
                                        <th className="px-3 py-2 text-left text-xs text-slate-400 hidden sm:table-cell">Mode</th>
                                        <th className="px-3 py-2 text-left text-xs text-slate-400 hidden sm:table-cell">Collected By</th>
                                        <th className="px-3 py-2 text-left text-xs text-slate-400 hidden md:table-cell">Notes</th>
                                        <th className="px-3 py-2 text-center text-xs text-slate-400 w-10">Proof</th>
                                        <th className="px-3 py-2 text-center text-xs text-slate-400 w-10"></th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {(partnerCollections[partner.partner_id] || []).length === 0 ? (
                                        <tr>
                                          <td colSpan="7" className="px-3 py-4 text-center text-slate-500 text-sm">
                                            No collections recorded yet
                                          </td>
                                        </tr>
                                      ) : (
                                        partnerCollections[partner.partner_id].map((c) => (
                                          <tr key={c._id} className={`border-t border-slate-700/30 ${deleteConfirmCollection === c._id ? 'bg-red-500/10' : ''}`}>
                                            <td className="px-3 py-2 text-slate-300">{formatDate(c.date)}</td>
                                            <td className="px-3 py-2 text-right text-green-400 font-medium">₹{c.amount.toLocaleString()}</td>
                                            <td className="px-3 py-2 text-slate-400 hidden sm:table-cell">
                                              <span className={`px-2 py-0.5 rounded text-xs ${
                                                c.payment_mode === 'Cash' ? 'bg-green-500/20 text-green-400' :
                                                c.payment_mode === 'UPI' ? 'bg-purple-500/20 text-purple-400' :
                                                'bg-blue-500/20 text-blue-400'
                                              }`}>
                                                {c.payment_mode}
                                              </span>
                                            </td>
                                            <td className="px-3 py-2 text-slate-400 hidden sm:table-cell">{c.collected_by}</td>
                                            <td className="px-3 py-2 text-slate-500 text-xs hidden md:table-cell">{c.notes || '-'}</td>
                                            <td className="px-3 py-2 text-center">
                                              {c.proof_image ? (
                                                <button
                                                  onClick={(e) => { e.stopPropagation(); setLightboxImage(c.proof_image); }}
                                                  className="p-1 rounded text-slate-400 hover:text-teal-400 hover:bg-teal-500/10 transition-colors"
                                                  title="View payment proof"
                                                >
                                                  <ImageIcon className="w-3.5 h-3.5" />
                                                </button>
                                              ) : (
                                                <span className="text-slate-600">-</span>
                                              )}
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                              {deleteConfirmCollection === c._id ? (
                                                <div className="flex items-center justify-center gap-1">
                                                  <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteCollection(c._id, partner.partner_id); }}
                                                    disabled={deletingCollection}
                                                    className="p-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors"
                                                    title="Confirm delete"
                                                  >
                                                    {deletingCollection ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                                  </button>
                                                  <button
                                                    onClick={(e) => { e.stopPropagation(); setDeleteConfirmCollection(null); }}
                                                    className="p-1 rounded bg-slate-600/50 text-slate-400 hover:bg-slate-600 transition-colors"
                                                    title="Cancel"
                                                  >
                                                    <X className="w-3.5 h-3.5" />
                                                  </button>
                                                </div>
                                              ) : (
                                                <button
                                                  onClick={(e) => { e.stopPropagation(); setDeleteConfirmCollection(c._id); }}
                                                  className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                  title="Delete collection"
                                                >
                                                  <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                              )}
                                            </td>
                                          </tr>
                                        ))
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              {/* Section 4: Outstanding Summary */}
                              <div>
                                <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                                  <IndianRupee className="w-4 h-4 text-teal-400" />
                                  Outstanding Summary
                                </h4>
                                <div className={`rounded-lg p-4 border ${getOutstandingBg(outstanding)}`}>
                                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <div>
                                      <p className="text-xs text-slate-400 mb-1">Stock Given</p>
                                      <p className="text-lg font-semibold text-teal-400">
                                        {isTracked ? `₹${(partner.consignment_value || 0).toLocaleString()}` : '-'}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-slate-400 mb-1">Total Sold</p>
                                      <p className="text-lg font-semibold text-orange-400">₹{(partner.total_sold_value || 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-slate-400 mb-1">Total Collected</p>
                                      <p className="text-lg font-semibold text-green-400">₹{(partner.collected || 0).toLocaleString()}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-slate-400 mb-1">Outstanding Balance</p>
                                      <p className={`text-lg font-semibold ${getOutstandingColor(outstanding)}`}>
                                        ₹{outstanding.toLocaleString()}
                                        {outstanding > 5000 && (
                                          <AlertCircle className="w-4 h-4 inline ml-1 text-red-400" />
                                        )}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-slate-400 mb-1">Unsold Stock</p>
                                      <p className="text-lg font-semibold text-slate-300">
                                        {isTracked ? (
                                          `₹${Math.max(0, (partner.consignment_value || 0) - (partner.total_sold_value || 0)).toLocaleString()}`
                                        ) : (
                                          <span className="text-slate-500">Not tracked</span>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer note */}
      {allPartners.length > 0 && (
        <p className="text-xs text-slate-500 text-center">
          Click on a partner row to expand and see stock details, sales history, and collections. 
          Sorted by sales value (highest first).
        </p>
      )}

      {/* Add Collection Modal */}
      {showAddModal && selectedPartner && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div 
            className="bg-[#1E293B] rounded-2xl w-full max-w-md shadow-xl"
            onClick={(e) => e.stopPropagation()}
            data-testid="add-collection-modal"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
              <div>
                <h3 className="text-lg font-semibold text-white">Log Collection</h3>
                <p className="text-sm text-slate-400">{selectedPartner.partner_name}</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Outstanding Balance Banner */}
            <div className={`mx-4 mt-4 p-3 rounded-lg border ${getOutstandingBg(selectedPartner.outstanding || 0)}`}>
              <p className="text-xs text-slate-400 mb-1">Current Outstanding Balance</p>
              <p className={`text-xl font-bold ${getOutstandingColor(selectedPartner.outstanding || 0)}`}>
                ₹{(selectedPartner.outstanding || 0).toLocaleString()}
              </p>
            </div>

            {/* Form */}
            <div className="p-4 space-y-4">
              {/* Date */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="date"
                    value={collectionForm.date}
                    onChange={(e) => setCollectionForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                    data-testid="collection-date-input"
                  />
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Amount Collected *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">₹</span>
                  <input
                    type="number"
                    value={collectionForm.amount}
                    onChange={(e) => setCollectionForm(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0"
                    min="1"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-8 pr-4 py-2.5 text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                    data-testid="collection-amount-input"
                  />
                </div>
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Payment Mode</label>
                <select
                  value={collectionForm.payment_mode}
                  onChange={(e) => setCollectionForm(prev => ({ ...prev, payment_mode: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                  data-testid="collection-mode-select"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              {/* Collected By */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Collected By *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={collectionForm.collected_by}
                    onChange={(e) => setCollectionForm(prev => ({ ...prev, collected_by: e.target.value }))}
                    placeholder="Agent name"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none"
                    data-testid="collection-agent-input"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Notes (Optional)</label>
                <textarea
                  value={collectionForm.notes}
                  onChange={(e) => setCollectionForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any additional notes..."
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none resize-none"
                  data-testid="collection-notes-input"
                />
              </div>
              
              {/* Payment Proof Upload */}
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Payment Proof (Optional)</label>
                {proofImagePreview ? (
                  <div className="relative inline-block">
                    <img 
                      src={proofImagePreview} 
                      alt="Payment proof preview" 
                      className="w-20 h-20 object-cover rounded-lg border border-slate-600"
                    />
                    <button
                      type="button"
                      onClick={removeProofImage}
                      className="absolute -top-2 -right-2 p-1 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors"
                      title="Remove image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div 
                    onClick={() => proofInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-600 rounded-lg p-4 text-center cursor-pointer hover:border-slate-500 hover:bg-slate-800/50 transition-colors"
                  >
                    <Camera className="w-6 h-6 mx-auto text-slate-500 mb-2" />
                    <p className="text-sm text-slate-500">Tap to upload payment proof</p>
                    <p className="text-xs text-slate-600 mt-1">JPG, PNG, WEBP (max 5MB)</p>
                  </div>
                )}
                <input
                  ref={proofInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleProofImageSelect}
                  className="hidden"
                  data-testid="proof-image-input"
                />
              </div>
            </div>

            {/* Error Message */}
            {collectionFormError && (
              <div className="px-4 pb-2">
                <p className="text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {collectionFormError}
                </p>
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex gap-3 p-4 border-t border-slate-700/50">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCollection}
                disabled={saving || uploadingProof}
                className="flex-1 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 disabled:bg-teal-800 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center justify-center gap-2"
                data-testid="save-collection-btn"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    {uploadingProof ? 'Uploading...' : 'Saving...'}
                  </>
                ) : (
                  'Save Collection'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Proof Image Lightbox */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] p-4">
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-2 right-2 p-2 bg-slate-800/80 rounded-full text-white hover:bg-slate-700 transition-colors z-10"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={lightboxImage} 
              alt="Payment proof" 
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Start Tracking Modal (Add Stock) */}
      <QuickRestockModal
        isOpen={showStartTrackingModal}
        onClose={() => setShowStartTrackingModal(false)}
        partnerName={selectedPartner?.partner_name || ''}
        partnerId={selectedPartner?.partner_id}
        onSuccess={handleRestockSuccess}
        title="Start Tracking"
        showInfoBanner={true}
      />
    </div>
  );
};

export default PartnerStockTab;
