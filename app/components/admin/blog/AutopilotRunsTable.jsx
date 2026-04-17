/**
 * AutopilotRunsTable Component
 * 
 * Displays recent autopilot runs with:
 * - Desktop: Table view with Date, Title, Topic Source, SEO Score, Word Count, Status, Distribution, Actions
 * - Mobile: Card view
 */

import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useNavigate } from 'react-router';
import { API_BASE_URL } from '@/config/api';
import { 
  Calendar, Key, TrendingUp, Check, X, ExternalLink, 
  Loader2, Clock, Bot
} from 'lucide-react';
import { toast } from 'react-toastify';

const AutopilotRunsTable = forwardRef((props, ref) => {
  const navigate = useNavigate();
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  useImperativeHandle(ref, () => ({
    refresh: fetchRuns
  }));

  useEffect(() => {
    fetchRuns();
  }, []);

  const fetchRuns = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/blog/autopilot/runs?limit=10`);
      if (response.ok) {
        const data = await response.json();
        setRuns(data.runs || []);
      }
    } catch (error) {
      console.error('Failed to fetch runs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (runId) => {
    setActionLoading(prev => ({ ...prev, [runId]: 'approve' }));
    try {
      const response = await fetch(`${API_BASE_URL}/api/blog/autopilot/runs/${runId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        toast.success('Blog approved and published!');
        fetchRuns();
      } else {
        toast.error('Failed to approve blog');
      }
    } catch (error) {
      console.error('Failed to approve:', error);
      toast.error('Failed to approve blog');
    } finally {
      setActionLoading(prev => ({ ...prev, [runId]: null }));
    }
  };

  const handleReject = async (runId) => {
    setActionLoading(prev => ({ ...prev, [runId]: 'reject' }));
    try {
      const response = await fetch(`${API_BASE_URL}/api/blog/autopilot/runs/${runId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (response.ok) {
        toast.success('Blog rejected');
        fetchRuns();
      } else {
        toast.error('Failed to reject blog');
      }
    } catch (error) {
      console.error('Failed to reject:', error);
      toast.error('Failed to reject blog');
    } finally {
      setActionLoading(prev => ({ ...prev, [runId]: null }));
    }
  };

  // Filter out broken test runs (failed with no title)
  const filteredRuns = runs.filter(run => {
    const title = run.blog_title || run.title;
    const isBrokenRun = (!title || title === 'Untitled') && run.status === 'failed';
    return !isBrokenRun;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const truncateTitle = (title, maxLength = 50) => {
    if (!title) return 'Untitled';
    return title.length > maxLength ? title.substring(0, maxLength) + '...' : title;
  };

  const getTopicSourcePill = (source) => {
    const sourceConfig = {
      calendar: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: Calendar, label: 'Calendar' },
      keyword: { bg: 'bg-teal-500/20', text: 'text-teal-400', icon: Key, label: 'Keyword' },
      keywords: { bg: 'bg-teal-500/20', text: 'text-teal-400', icon: Key, label: 'Keyword' },
      trending: { bg: 'bg-orange-500/20', text: 'text-orange-400', icon: TrendingUp, label: 'Trending' },
      auto: { bg: 'bg-slate-500/20', text: 'text-slate-400', icon: Bot, label: 'Auto' },
      blog_autopilot: { bg: 'bg-slate-500/20', text: 'text-slate-400', icon: Bot, label: 'Auto' },
      default: { bg: 'bg-slate-500/20', text: 'text-slate-400', icon: Bot, label: 'Auto' }
    };
    
    const config = sourceConfig[source?.toLowerCase()] || sourceConfig.default;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${config.bg} ${config.text} text-[10px] font-bold uppercase`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  };

  const getSeoScoreColor = (score) => {
    if (score >= 85) return '#22C55E';
    if (score >= 70) return '#F59E0B';
    return '#EF4444';
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      published: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Published' },
      pending_approval: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Pending' },
      rejected: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Rejected' },
      needs_review: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Review' },
      failed: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Failed' },
      draft: { bg: 'bg-slate-500/20', text: 'text-slate-400', label: 'Draft' }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full ${config.bg} ${config.text} text-[10px] font-bold uppercase`}>
        {config.label}
      </span>
    );
  };

  const getDistributionDots = (distribution) => {
    if (!distribution || Object.keys(distribution).length === 0) return <span className="text-slate-600">—</span>;
    
    const platforms = {
      twitter: '#1DA1F2',
      instagram: '#E4405F',
      facebook: '#1877F2',
      linkedin: '#0A66C2'
    };
    
    return (
      <div className="flex items-center gap-1">
        {Object.entries(distribution).map(([platform, value]) => {
          if (!value) return null;
          return (
            <span
              key={platform}
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: platforms[platform] || '#64748B' }}
              title={platform}
            />
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-[#1E293B] border border-slate-700 rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (filteredRuns.length === 0) {
    return (
      <div className="bg-[#1E293B] border border-slate-700 rounded-2xl p-6 mb-6" data-testid="autopilot-runs-table">
        <h3 className="text-sm font-semibold text-white mb-4">Recent Autopilot Runs</h3>
        <div className="text-center py-8">
          <Clock className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-sm text-slate-400">No autopilot runs yet</p>
          <p className="text-xs text-slate-500 mt-1">Trigger the autopilot to generate your first post</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1E293B] border border-slate-700 rounded-2xl overflow-hidden mb-6" data-testid="autopilot-runs-table">
      <div className="px-4 md:px-6 py-4 border-b border-slate-700">
        <h3 className="text-sm font-semibold text-white">Recent Autopilot Runs</h3>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-800/50">
            <tr>
              <th className="px-4 py-3 text-left text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Date</th>
              <th className="px-4 py-3 text-left text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Title</th>
              <th className="px-4 py-3 text-left text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Source</th>
              <th className="px-4 py-3 text-left text-[10px] text-slate-500 uppercase tracking-wider font-semibold">SEO</th>
              <th className="px-4 py-3 text-left text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Words</th>
              <th className="px-4 py-3 text-left text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Status</th>
              <th className="px-4 py-3 text-left text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Distributed</th>
              <th className="px-4 py-3 text-right text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {filteredRuns.map((run) => (
              <tr key={run.run_id || run.id || run._id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-4 py-3 text-xs text-slate-400">
                  {formatDate(run.started_at)}
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm font-semibold text-white">
                    {truncateTitle(run.blog_title || run.title)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {getTopicSourcePill(run.topic_source)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: getSeoScoreColor(run.seo_score) }}
                    />
                    <span className="text-xs text-slate-300">{run.seo_score || '-'}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-slate-400">
                  {run.word_count?.toLocaleString() || '-'}
                </td>
                <td className="px-4 py-3">
                  {getStatusBadge(run.status)}
                </td>
                <td className="px-4 py-3">
                  {getDistributionDots(run.distribution)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {run.status === 'pending_approval' ? (
                      <>
                        <button
                          onClick={() => handleApprove(run.run_id || run.id || run._id)}
                          disabled={actionLoading[run.run_id || run.id || run._id]}
                          className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                          title="Approve"
                          data-testid={`approve-btn-${run.run_id || run.id || run._id}`}
                        >
                          {actionLoading[run.run_id || run.id || run._id] === 'approve' ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleReject(run.run_id || run.id || run._id)}
                          disabled={actionLoading[run.run_id || run.id || run._id]}
                          className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                          title="Reject"
                          data-testid={`reject-btn-${run.run_id || run.id || run._id}`}
                        >
                          {actionLoading[run.run_id || run.id || run._id] === 'reject' ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <X className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => navigate(`/admin/blog/edit/${run.blog_id}`)}
                        className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-300 transition-colors"
                        title="Edit Blog"
                        data-testid={`edit-btn-${run.run_id || run.id || run._id}`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-slate-700/50">
        {filteredRuns.map((run) => (
          <div key={run.run_id || run.id || run._id} className="p-3" data-testid={`run-card-${run.run_id || run.id || run._id}`}>
            <p className="text-sm font-semibold text-white mb-1.5 line-clamp-1">
              {run.blog_title || run.title || 'Untitled'}
            </p>
            
            <div className="flex items-center flex-wrap gap-2 mb-2">
              <span className="text-xs text-slate-400">{formatDate(run.started_at)}</span>
              {getTopicSourcePill(run.topic_source)}
              <div className="flex items-center gap-1">
                <span 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: getSeoScoreColor(run.seo_score) }}
                />
                <span className="text-xs text-slate-300">{run.seo_score || '-'}</span>
              </div>
              <span className="text-xs text-slate-500">{run.word_count?.toLocaleString() || '-'} words</span>
            </div>
            
            <div className="flex items-center justify-between">
              {getStatusBadge(run.status)}
              
              <div className="flex items-center gap-1">
                {run.status === 'pending_approval' ? (
                  <>
                    <button
                      onClick={() => handleApprove(run.run_id || run.id || run._id)}
                      disabled={actionLoading[run.run_id || run.id || run._id]}
                      className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                    >
                      {actionLoading[run.run_id || run.id || run._id] === 'approve' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => handleReject(run.run_id || run.id || run._id)}
                      disabled={actionLoading[run.run_id || run.id || run._id]}
                      className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                    >
                      {actionLoading[run.run_id || run.id || run._id] === 'reject' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => navigate(`/admin/blog/edit/${run.blog_id}`)}
                    className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-lg hover:bg-slate-700 text-slate-400 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

AutopilotRunsTable.displayName = 'AutopilotRunsTable';

export default AutopilotRunsTable;
