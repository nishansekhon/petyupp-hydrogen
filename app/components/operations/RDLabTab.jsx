import React, { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '@/config/api';
import { toast } from 'sonner';
import { 
  Beaker, FlaskConical, DollarSign, Rocket, BarChart3, Lightbulb, 
  Plus, ChevronRight, CheckCircle2, Circle, Edit2, Trash2, ArrowRight, 
  ExternalLink, Package, Target, Store, QrCode, Megaphone, X, Save,
  Calculator, ClipboardList, TrendingUp, ChevronDown, Loader2, Layers
} from 'lucide-react';

const API_URL = API_BASE_URL;

// Stage configuration
const STAGES = [
  { id: 'ideation', label: '💡 Ideation', color: '#8B5CF6', bgDim: 'rgba(139,92,246,0.12)', description: 'Initial idea exploration' },
  { id: 'costing', label: '💰 Costing', color: '#F59E0B', bgDim: 'rgba(245,158,11,0.12)', description: 'Unit economics analysis' },
  { id: 'prototype', label: '🔬 Prototype', color: '#3B82F6', bgDim: 'rgba(59,130,246,0.12)', description: 'Sample production' },
  { id: 'approved', label: '✅ Approved', color: '#22C55E', bgDim: 'rgba(34,197,94,0.12)', description: 'Ready for launch' },
  { id: 'campaign', label: '📣 Campaign', color: '#14B8A6', bgDim: 'rgba(20,184,166,0.12)', description: 'Marketing preparation' },
  { id: 'live', label: '🚀 Live', color: '#EC4899', bgDim: 'rgba(236,72,153,0.12)', description: 'In market' }
];

const CATEGORIES = ['Dog Food', 'Dog Grooming', 'Dog Toys', 'Combo Packs', 'Other'];
const PRIORITIES = ['high', 'medium', 'low'];
const ASSIGNEES = ['Nishan', 'Design', 'Sales', 'Operations', 'Marketing'];

const PRIORITY_COLORS = {
  high: { bg: 'rgba(239,68,68,0.12)', text: '#EF4444' },
  medium: { bg: 'rgba(245,158,11,0.12)', text: '#F59E0B' },
  low: { bg: 'rgba(59,130,246,0.12)', text: '#3B82F6' }
};

const RDLabTab = () => {
  const [activeView, setActiveView] = useState('pipeline');
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [savingProject, setSavingProject] = useState(false);
  
  // New project form state
  const [newProject, setNewProject] = useState({
    name: '', category: 'Dog Food', priority: 'medium', stage: 'ideation', hypothesis: '', target_market: ''
  });
  
  // New task form
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [showAddTask, setShowAddTask] = useState(false);
  
  // New note form
  const [newNoteText, setNewNoteText] = useState('');
  const [showAddNote, setShowAddNote] = useState(false);

  // Calculator state
  const [calcCosts, setCalcCosts] = useState({
    raw_material: 0, manufacturing: 0, packaging: 0, labeling: 0, qr_insert: 0, shipping: 0
  });
  const [calcPricing, setCalcPricing] = useState({
    mrp: 0, retailer_margin_pct: 0, distributor_margin_pct: 0, platform_fee_pct: 0, moq: 0, pilot_batch: 0, fixed_costs: 0
  });

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken');
    return { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  };

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/admin/rd-lab/projects`, { headers: getAuthHeaders() });
      const data = await response.json();
      if (data.success) {
        setProjects(data.projects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load R&D projects');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/rd-lab/stats`, { headers: getAuthHeaders() });
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    fetchStats();
  }, [fetchProjects, fetchStats]);

  // Create new project
  const handleCreateProject = async () => {
    if (!newProject.name.trim()) {
      toast.error('Project name is required');
      return;
    }
    
    try {
      setSavingProject(true);
      const response = await fetch(`${API_URL}/api/admin/rd-lab/projects`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newProject)
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success('Project created!');
        setShowNewModal(false);
        setNewProject({ name: '', category: 'Dog Food', priority: 'medium', stage: 'ideation', hypothesis: '', target_market: '' });
        fetchProjects();
        fetchStats();
      } else {
        toast.error(data.detail || 'Failed to create project');
      }
    } catch (error) {
      toast.error('Failed to create project');
    } finally {
      setSavingProject(false);
    }
  };

  // Update project
  const updateProject = async (projectId, updates) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/rd-lab/projects/${projectId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates)
      });
      const data = await response.json();
      
      if (data.success) {
        setSelectedProject(data.project);
        fetchProjects();
        fetchStats();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating project:', error);
      return false;
    }
  };

  // Move to next stage
  const handleMoveStage = async () => {
    if (!selectedProject) return;
    
    const currentIndex = STAGES.findIndex(s => s.id === selectedProject.stage);
    if (currentIndex >= STAGES.length - 1) {
      toast.info('Project is already at final stage');
      return;
    }
    
    const nextStage = STAGES[currentIndex + 1].id;
    
    try {
      const response = await fetch(`${API_URL}/api/admin/rd-lab/projects/${selectedProject.id}/stage`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ stage: nextStage })
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Moved to ${STAGES[currentIndex + 1].label}`);
        setSelectedProject(data.project);
        fetchProjects();
        fetchStats();
      }
    } catch (error) {
      toast.error('Failed to move stage');
    }
  };

  // Add task
  const handleAddTask = async () => {
    if (!newTaskText.trim() || !selectedProject) return;
    
    try {
      const response = await fetch(`${API_URL}/api/admin/rd-lab/projects/${selectedProject.id}/tasks`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ text: newTaskText, assignee: newTaskAssignee })
      });
      const data = await response.json();
      
      if (data.success) {
        setSelectedProject(data.project);
        setNewTaskText('');
        setNewTaskAssignee('');
        setShowAddTask(false);
        fetchProjects();
      }
    } catch (error) {
      toast.error('Failed to add task');
    }
  };

  // Toggle task
  const handleToggleTask = async (taskId, currentDone) => {
    if (!selectedProject) return;
    
    try {
      const response = await fetch(`${API_URL}/api/admin/rd-lab/projects/${selectedProject.id}/tasks/${taskId}?done=${!currentDone}`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      const data = await response.json();
      
      if (data.success) {
        setSelectedProject(data.project);
        fetchProjects();
      }
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  // Add note
  const handleAddNote = async () => {
    if (!newNoteText.trim() || !selectedProject) return;
    
    try {
      const response = await fetch(`${API_URL}/api/admin/rd-lab/projects/${selectedProject.id}/notes`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ text: newNoteText })
      });
      const data = await response.json();
      
      if (data.success) {
        setSelectedProject(data.project);
        setNewNoteText('');
        setShowAddNote(false);
        fetchProjects();
      }
    } catch (error) {
      toast.error('Failed to add note');
    }
  };

  // Update checklist
  const handleToggleChecklist = async (phase, index, currentDone) => {
    if (!selectedProject) return;
    
    try {
      const response = await fetch(`${API_URL}/api/admin/rd-lab/projects/${selectedProject.id}/checklist`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ phase, index, done: !currentDone })
      });
      const data = await response.json();
      
      if (data.success) {
        setSelectedProject(data.project);
        fetchProjects();
      }
    } catch (error) {
      toast.error('Failed to update checklist');
    }
  };

  // Delete project
  const handleDeleteProject = async (projectId) => {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/admin/rd-lab/projects/${projectId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success('Project deleted');
        if (selectedProject?.id === projectId) {
          setSelectedProject(null);
          setActiveView('pipeline');
        }
        fetchProjects();
        fetchStats();
      }
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  // Calculator calculations
  const calcTotalCost = Object.values(calcCosts).reduce((a, b) => a + (parseFloat(b) || 0), 0);
  const calcRetailerPrice = calcPricing.mrp * (1 - (calcPricing.retailer_margin_pct || 0) / 100);
  const calcNetRevenue = calcRetailerPrice * (1 - (calcPricing.distributor_margin_pct || 0) / 100) * (1 - (calcPricing.platform_fee_pct || 0) / 100);
  const calcGrossMargin = calcNetRevenue - calcTotalCost;
  const calcGrossMarginPct = calcPricing.mrp > 0 ? (calcGrossMargin / calcPricing.mrp * 100) : 0;
  const calcBreakeven = calcGrossMargin > 0 ? Math.ceil((calcPricing.fixed_costs || 0) / calcGrossMargin) : 0;
  const calcPilotInvestment = (calcPricing.pilot_batch || 0) * calcTotalCost + (calcPricing.fixed_costs || 0);

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    } catch {
      return dateStr;
    }
  };

  // Get stage info
  const getStageInfo = (stageId) => STAGES.find(s => s.id === stageId) || STAGES[0];

  // ==================== RENDER VIEWS ====================

  // Stats Cards
  const renderStatsCards = () => (
    <div className="grid grid-cols-6 gap-3 mb-6">
      {STAGES.map(stage => (
        <div
          key={stage.id}
          className="bg-[#1E293B] rounded-xl p-4 border border-slate-700 cursor-pointer hover:border-slate-600 transition-colors"
          style={{ borderTop: `3px solid ${stage.color}` }}
          onClick={() => {
            const filtered = projects.filter(p => p.stage === stage.id);
            if (filtered.length > 0) {
              setSelectedProject(filtered[0]);
              setActiveView('detail');
            }
          }}
        >
          <div className="text-3xl font-bold mb-1" style={{ color: stage.color }}>
            {stats[stage.id] || 0}
          </div>
          <div className="text-xs text-slate-400">{stage.label}</div>
        </div>
      ))}
    </div>
  );

  // Project Card
  const renderProjectCard = (project) => {
    const stage = getStageInfo(project.stage);
    const priority = PRIORITY_COLORS[project.priority] || PRIORITY_COLORS.medium;
    const completedTasks = (project.tasks || []).filter(t => t.done).length;
    const totalTasks = (project.tasks || []).length;
    
    return (
      <div
        key={project.id}
        className="bg-[#1E293B] rounded-xl p-3 border border-slate-700 cursor-pointer hover:border-slate-500 transition-all group"
        style={{ borderLeft: `3px solid ${stage.color}` }}
        onClick={() => {
          setSelectedProject(project);
          setActiveView('detail');
        }}
      >
        <div className="flex items-start justify-between mb-2">
          <h4 className="text-xs font-semibold text-slate-100 line-clamp-2 flex-1 pr-2">{project.name}</h4>
          <span 
            className="px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0"
            style={{ background: priority.bg, color: priority.text }}
          >
            {project.priority}
          </span>
        </div>
        <div className="text-[10px] text-slate-500 mb-2">{project.category}</div>
        {project.hypothesis && (
          <p className="text-[10px] text-slate-400 line-clamp-2 mb-2">
            {project.hypothesis.slice(0, 80)}{project.hypothesis.length > 80 ? '...' : ''}
          </p>
        )}
        <div className="flex items-center justify-between text-[10px] text-slate-500">
          <span>{completedTasks}/{totalTasks} tasks</span>
          <span>{formatDate(project.updated_at)}</span>
        </div>
      </div>
    );
  };

  // Pipeline Board View
  const renderPipelineView = () => (
    <div>
      {renderStatsCards()}
      
      <div className="grid grid-cols-6 gap-3" style={{ minHeight: '500px' }}>
        {STAGES.map(stage => {
          const stageProjects = projects.filter(p => p.stage === stage.id);
          return (
            <div key={stage.id} className="flex flex-col">
              {/* Column Header */}
              <div 
                className="rounded-t-xl p-3 mb-2"
                style={{ background: stage.bgDim }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold" style={{ color: stage.color }}>{stage.label}</span>
                  <span 
                    className="px-1.5 py-0.5 rounded text-[10px] font-medium"
                    style={{ background: stage.color, color: '#0F172A' }}
                  >
                    {stageProjects.length}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">{stage.description}</div>
              </div>
              
              {/* Project Cards */}
              <div className="space-y-2 flex-1">
                {stageProjects.map(project => renderProjectCard(project))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // Project Detail View
  const renderDetailView = () => {
    if (!selectedProject) {
      return (
        <div className="text-center py-20 text-slate-400">
          <Beaker size={48} className="mx-auto mb-4 opacity-50" />
          <p>Select a project to view details</p>
        </div>
      );
    }

    const stage = getStageInfo(selectedProject.stage);
    const priority = PRIORITY_COLORS[selectedProject.priority] || PRIORITY_COLORS.medium;
    const stageIndex = STAGES.findIndex(s => s.id === selectedProject.stage);
    const completedTasks = (selectedProject.tasks || []).filter(t => t.done).length;
    const totalTasks = (selectedProject.tasks || []).length;

    return (
      <div className="flex gap-4">
        {/* Left Column */}
        <div className="flex-1 space-y-4">
          {/* Header Card */}
          <div className="bg-[#1E293B] rounded-2xl p-5 border border-slate-700">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-1 rounded text-[10px] font-medium" style={{ background: stage.bgDim, color: stage.color }}>
                {stage.label}
              </span>
              <span className="px-2 py-1 rounded text-[10px] font-medium" style={{ background: priority.bg, color: priority.text }}>
                {selectedProject.priority}
              </span>
              <span className="px-2 py-1 rounded text-[10px] font-medium bg-slate-700 text-slate-300">
                {selectedProject.category}
              </span>
              <div className="flex-1" />
              <button
                onClick={() => handleDeleteProject(selectedProject.id)}
                className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
            
            <h2 className="text-lg font-bold text-white mb-3">{selectedProject.name}</h2>
            
            <button
              onClick={handleMoveStage}
              disabled={stageIndex >= STAGES.length - 1}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-2"
            >
              Move to Next Stage <ArrowRight size={14} />
            </button>
            
            {/* Progress Dots */}
            <div className="flex items-center gap-2 mt-4">
              {STAGES.map((s, idx) => (
                <React.Fragment key={s.id}>
                  <div
                    className="w-3 h-3 rounded-full transition-all"
                    style={{
                      background: idx <= stageIndex ? s.color : '#334155',
                      boxShadow: idx === stageIndex ? `0 0 8px ${s.color}` : 'none'
                    }}
                  />
                  {idx < STAGES.length - 1 && (
                    <div 
                      className="flex-1 h-0.5"
                      style={{ background: idx < stageIndex ? STAGES[idx + 1].color : '#334155' }}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>
            
            {/* Hypothesis */}
            {selectedProject.hypothesis && (
              <div className="mt-4 p-3 bg-[#0F172A] rounded-lg">
                <div className="text-[10px] text-slate-500 uppercase tracking-wide mb-1">Hypothesis</div>
                <p className="text-xs text-slate-300">{selectedProject.hypothesis}</p>
              </div>
            )}
            
            <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-500">
              {selectedProject.target_market && <span>🎯 {selectedProject.target_market}</span>}
              <span>📅 Created {formatDate(selectedProject.created_at)}</span>
            </div>
          </div>
          
          {/* Action Items Card */}
          <div className="bg-[#1E293B] rounded-2xl p-5 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <CheckCircle2 size={16} className="text-teal-400" />
                Action Items ({completedTasks}/{totalTasks})
              </h3>
              <button
                onClick={() => setShowAddTask(!showAddTask)}
                className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1"
              >
                <Plus size={14} /> Add Task
              </button>
            </div>
            
            <div className="space-y-2">
              {(selectedProject.tasks || []).map(task => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
                >
                  <button
                    onClick={() => handleToggleTask(task.id, task.done)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      task.done ? 'bg-green-500 border-green-500' : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    {task.done && <CheckCircle2 size={12} className="text-white" />}
                  </button>
                  <span className={`flex-1 text-xs ${task.done ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                    {task.text}
                  </span>
                  {task.assignee && (
                    <span className="px-2 py-0.5 bg-slate-700 text-slate-400 rounded text-[10px]">
                      {task.assignee}
                    </span>
                  )}
                </div>
              ))}
              
              {showAddTask && (
                <div className="flex items-center gap-2 mt-3 p-2 bg-slate-800/50 rounded-lg">
                  <input
                    type="text"
                    placeholder="Task description..."
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    className="flex-1 bg-transparent border-none text-xs text-white placeholder-slate-500 focus:outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask()}
                  />
                  <select
                    value={newTaskAssignee}
                    onChange={(e) => setNewTaskAssignee(e.target.value)}
                    className="bg-slate-700 text-slate-300 text-[10px] rounded px-2 py-1 border-none"
                  >
                    <option value="">Assignee</option>
                    {ASSIGNEES.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                  <button
                    onClick={handleAddTask}
                    className="px-3 py-1 bg-teal-500 text-white text-[10px] rounded hover:bg-teal-600"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Research Notes Card */}
          <div className="bg-[#1E293B] rounded-2xl p-5 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <ClipboardList size={16} className="text-blue-400" />
                Research Notes & Activity
              </h3>
              <button
                onClick={() => setShowAddNote(!showAddNote)}
                className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1"
              >
                <Plus size={14} /> Add Note
              </button>
            </div>
            
            {showAddNote && (
              <div className="mb-4">
                <textarea
                  placeholder="Add a research note..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="w-full bg-slate-800/50 border border-slate-600 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 resize-none"
                  rows={3}
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleAddNote}
                    className="px-3 py-1.5 bg-teal-500 text-white text-xs rounded hover:bg-teal-600"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            )}
            
            <div className="space-y-3">
              {(selectedProject.notes || []).map(note => (
                <div key={note.id} className="p-3 bg-[#0F172A] rounded-lg">
                  <div className="text-[10px] text-slate-500 mb-1">{formatDate(note.created_at)}</div>
                  <p className="text-xs text-slate-300">{note.text}</p>
                </div>
              ))}
              {(!selectedProject.notes || selectedProject.notes.length === 0) && (
                <p className="text-xs text-slate-500 text-center py-4">No notes yet</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Right Sidebar */}
        <div className="w-80 space-y-4">
          {/* Unit Economics */}
          <div className="bg-[#1E293B] rounded-2xl p-4 border border-slate-700">
            <h3 className="text-xs font-semibold text-orange-400 mb-3 flex items-center gap-2">
              <DollarSign size={14} /> Unit Economics
            </h3>
            <div className="space-y-2 text-xs">
              {Object.entries(selectedProject.costs || {}).map(([key, value]) => {
                if (key === 'total_per_unit' || value === 0) return null;
                return (
                  <div key={key} className="flex justify-between text-slate-400">
                    <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="text-white">₹{value}</span>
                  </div>
                );
              })}
              <div className="flex justify-between pt-2 border-t border-slate-700 font-semibold">
                <span className="text-orange-400">Total Cost/Unit</span>
                <span className="text-orange-400">₹{selectedProject.costs?.total_per_unit || 0}</span>
              </div>
            </div>
          </div>
          
          {/* Pricing Strategy */}
          <div className="bg-[#1E293B] rounded-2xl p-4 border border-slate-700">
            <h3 className="text-xs font-semibold text-teal-400 mb-3 flex items-center gap-2">
              <TrendingUp size={14} /> Pricing Strategy
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>MRP</span>
                <span className="text-white">₹{selectedProject.pricing?.mrp || 0}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Retailer Margin</span>
                <span className="text-white">{selectedProject.pricing?.retailer_margin_pct || 0}% (₹{selectedProject.pricing?.retailer_price || 0})</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-700 font-semibold">
                <span className="text-teal-400">Our Margin</span>
                <span className="text-teal-400">₹{selectedProject.pricing?.our_margin || 0}</span>
              </div>
              <div className="mt-2 p-2 rounded-lg text-center" style={{ background: 'rgba(20,184,166,0.12)' }}>
                <span className="text-lg font-bold text-teal-400">{selectedProject.pricing?.margin_pct || 0}%</span>
                <span className="text-[10px] text-slate-400 block">Margin</span>
              </div>
            </div>
          </div>
          
          {/* Distribution Plan */}
          <div className="bg-[#1E293B] rounded-2xl p-4 border border-slate-700">
            <h3 className="text-xs font-semibold text-blue-400 mb-3 flex items-center gap-2">
              <Store size={14} /> Distribution Plan
            </h3>
            <div className="space-y-2 text-xs">
              <div className="inline-block px-2 py-1 rounded text-[10px] font-medium" 
                style={{ 
                  background: selectedProject.distribution?.channel === 'Retail Only' ? 'rgba(59,130,246,0.12)' : 
                    selectedProject.distribution?.channel === 'Online Only' ? 'rgba(34,197,94,0.12)' : 'rgba(139,92,246,0.12)',
                  color: selectedProject.distribution?.channel === 'Retail Only' ? '#3B82F6' : 
                    selectedProject.distribution?.channel === 'Online Only' ? '#22C55E' : '#8B5CF6'
                }}>
                {selectedProject.distribution?.channel || 'Not set'}
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Target Stores</span>
                <span className="text-white">{selectedProject.distribution?.target_stores || 0}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Pilot Batch</span>
                <span className="text-white">{selectedProject.distribution?.pilot_stores || 0} stores</span>
              </div>
              {selectedProject.distribution?.shelf_placement && (
                <div className="text-slate-400">
                  <span className="block text-slate-500">Shelf Placement:</span>
                  <span className="text-white">{selectedProject.distribution?.shelf_placement}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Go-to-Market */}
          <div className="bg-[#1E293B] rounded-2xl p-4 border border-slate-700">
            <h3 className="text-xs font-semibold text-purple-400 mb-3 flex items-center gap-2">
              <QrCode size={14} /> Go-to-Market
            </h3>
            <div className="space-y-3 text-xs">
              {selectedProject.campaign?.qr_destination && (
                <div>
                  <span className="text-slate-500 block mb-1">QR Destination</span>
                  <span className="text-teal-400 font-mono text-[10px] break-all">{selectedProject.campaign.qr_destination}</span>
                </div>
              )}
              {selectedProject.campaign?.coupon_code && (
                <div className="p-2 rounded-lg text-center" style={{ background: 'rgba(20,184,166,0.12)' }}>
                  <span className="text-lg font-bold text-teal-400">{selectedProject.campaign.coupon_code}</span>
                  <span className="text-[10px] text-slate-400 block">{selectedProject.campaign.coupon_value}</span>
                </div>
              )}
              {selectedProject.campaign?.retailer_training && (
                <div>
                  <span className="text-slate-500 block mb-1">Retailer Kit</span>
                  <span className="text-slate-300">{selectedProject.campaign.retailer_training}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Calculator View
  const renderCalculatorView = () => (
    <div className="bg-[#1E293B] rounded-2xl p-6 border border-slate-700">
      <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <Calculator size={20} className="text-teal-400" />
        Unit Economics Calculator
      </h2>
      
      <div className="grid grid-cols-3 gap-6">
        {/* Costs Column */}
        <div>
          <h3 className="text-sm font-semibold text-teal-400 mb-4 pb-2 border-b border-slate-700">
            COSTS (per unit)
          </h3>
          <div className="space-y-3">
            {['raw_material', 'manufacturing', 'packaging', 'labeling', 'qr_insert', 'shipping'].map(key => (
              <div key={key} className="flex items-center gap-2">
                <label className="text-xs text-slate-400 w-24 capitalize">{key.replace(/_/g, ' ')}</label>
                <div className="flex items-center bg-slate-800 rounded-lg px-2 flex-1">
                  <span className="text-slate-500 text-xs">₹</span>
                  <input
                    type="number"
                    value={calcCosts[key] || ''}
                    onChange={(e) => setCalcCosts({ ...calcCosts, [key]: parseFloat(e.target.value) || 0 })}
                    className="bg-transparent border-none text-white text-xs w-full p-2 focus:outline-none"
                    placeholder="0"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Pricing Column */}
        <div>
          <h3 className="text-sm font-semibold text-orange-400 mb-4 pb-2 border-b border-slate-700">
            PRICING
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 w-24">MRP</label>
              <div className="flex items-center bg-slate-800 rounded-lg px-2 flex-1">
                <span className="text-slate-500 text-xs">₹</span>
                <input
                  type="number"
                  value={calcPricing.mrp || ''}
                  onChange={(e) => setCalcPricing({ ...calcPricing, mrp: parseFloat(e.target.value) || 0 })}
                  className="bg-transparent border-none text-white text-xs w-full p-2 focus:outline-none"
                  placeholder="0"
                />
              </div>
            </div>
            {['retailer_margin_pct', 'distributor_margin_pct', 'platform_fee_pct'].map(key => (
              <div key={key} className="flex items-center gap-2">
                <label className="text-xs text-slate-400 w-24 capitalize">{key.replace(/_pct/g, ' %').replace(/_/g, ' ')}</label>
                <div className="flex items-center bg-slate-800 rounded-lg px-2 flex-1">
                  <input
                    type="number"
                    value={calcPricing[key] || ''}
                    onChange={(e) => setCalcPricing({ ...calcPricing, [key]: parseFloat(e.target.value) || 0 })}
                    className="bg-transparent border-none text-white text-xs w-full p-2 focus:outline-none"
                    placeholder="0"
                  />
                  <span className="text-slate-500 text-xs">%</span>
                </div>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 w-24">Pilot Batch</label>
              <input
                type="number"
                value={calcPricing.pilot_batch || ''}
                onChange={(e) => setCalcPricing({ ...calcPricing, pilot_batch: parseInt(e.target.value) || 0 })}
                className="bg-slate-800 border-none text-white text-xs w-full p-2 rounded-lg focus:outline-none"
                placeholder="0 units"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 w-24">Fixed Costs</label>
              <div className="flex items-center bg-slate-800 rounded-lg px-2 flex-1">
                <span className="text-slate-500 text-xs">₹</span>
                <input
                  type="number"
                  value={calcPricing.fixed_costs || ''}
                  onChange={(e) => setCalcPricing({ ...calcPricing, fixed_costs: parseFloat(e.target.value) || 0 })}
                  className="bg-transparent border-none text-white text-xs w-full p-2 focus:outline-none"
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Results Column */}
        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-4 pb-2 border-b border-slate-700">
            RESULTS
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between p-2 rounded-lg" style={{ background: 'rgba(245,158,11,0.12)' }}>
              <span className="text-xs text-orange-400">Total Cost/Unit</span>
              <span className="text-sm font-bold text-orange-400">₹{calcTotalCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg bg-slate-800">
              <span className="text-xs text-slate-400">Net Revenue/Unit</span>
              <span className="text-sm font-bold text-white">₹{calcNetRevenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg" style={{ background: 'rgba(34,197,94,0.12)' }}>
              <span className="text-xs text-green-400">Gross Margin/Unit</span>
              <span className="text-sm font-bold text-green-400">₹{calcGrossMargin.toFixed(2)}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg" style={{ background: 'rgba(34,197,94,0.12)' }}>
              <span className="text-xs text-green-400">Gross Margin %</span>
              <span className="text-sm font-bold text-green-400">{calcGrossMarginPct.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg" style={{ background: 'rgba(20,184,166,0.12)' }}>
              <span className="text-xs text-teal-400">Break-even Units</span>
              <span className="text-sm font-bold text-teal-400">{calcBreakeven}</span>
            </div>
            <div className="flex justify-between p-2 rounded-lg" style={{ background: 'rgba(139,92,246,0.12)' }}>
              <span className="text-xs text-purple-400">Pilot Investment</span>
              <span className="text-sm font-bold text-purple-400">₹{calcPilotInvestment.toFixed(0)}</span>
            </div>
            
            {/* Verdict */}
            <div 
              className="mt-4 p-3 rounded-lg text-center"
              style={{ 
                background: calcGrossMarginPct >= 15 ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)'
              }}
            >
              <span className={`text-sm font-bold ${calcGrossMarginPct >= 15 ? 'text-green-400' : 'text-red-400'}`}>
                {calcGrossMarginPct >= 15 ? '✅ Viable - Proceed' : '❌ Not Viable - Rethink'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Campaign Planner View
  const renderCampaignView = () => {
    const checklist = selectedProject?.checklist || { pre_launch: [], launch_week: [], post_launch: [] };
    const projection = selectedProject?.pilot_projection || {};
    
    return (
      <div className="grid grid-cols-2 gap-4">
        {/* Checklist Card */}
        <div className="bg-[#1E293B] rounded-2xl p-5 border border-slate-700">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <ClipboardList size={16} className="text-teal-400" />
            Campaign Checklist
          </h3>
          
          {!selectedProject ? (
            <p className="text-xs text-slate-500 text-center py-8">Select a project to view checklist</p>
          ) : (
            <div className="space-y-6">
              {/* Pre-Launch */}
              <div>
                <h4 className="text-xs font-semibold text-teal-400 mb-3 pb-1 border-b border-slate-700">
                  PRE-LAUNCH
                </h4>
                <div className="space-y-2">
                  {(checklist.pre_launch || []).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleChecklist('pre_launch', idx, item.done)}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          item.done ? 'bg-teal-500 border-teal-500' : 'border-slate-600 hover:border-slate-500'
                        }`}
                      >
                        {item.done && <CheckCircle2 size={10} className="text-white" />}
                      </button>
                      <span className={`text-xs ${item.done ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Launch Week */}
              <div>
                <h4 className="text-xs font-semibold text-orange-400 mb-3 pb-1 border-b border-slate-700">
                  LAUNCH WEEK
                </h4>
                <div className="space-y-2">
                  {(checklist.launch_week || []).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleChecklist('launch_week', idx, item.done)}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          item.done ? 'bg-orange-500 border-orange-500' : 'border-slate-600 hover:border-slate-500'
                        }`}
                      >
                        {item.done && <CheckCircle2 size={10} className="text-white" />}
                      </button>
                      <span className={`text-xs ${item.done ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Post-Launch */}
              <div>
                <h4 className="text-xs font-semibold text-green-400 mb-3 pb-1 border-b border-slate-700">
                  POST-LAUNCH TRACKING
                </h4>
                <div className="space-y-2">
                  {(checklist.post_launch || []).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleChecklist('post_launch', idx, item.done)}
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          item.done ? 'bg-green-500 border-green-500' : 'border-slate-600 hover:border-slate-500'
                        }`}
                      >
                        {item.done && <CheckCircle2 size={10} className="text-white" />}
                      </button>
                      <span className={`text-xs ${item.done ? 'text-slate-500 line-through' : 'text-slate-300'}`}>
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Right Column */}
        <div className="space-y-4">
          {/* QR Code & Coupon */}
          <div className="bg-[#1E293B] rounded-2xl p-5 border border-slate-700">
            <h3 className="text-xs font-semibold text-purple-400 mb-4 flex items-center gap-2">
              <QrCode size={14} /> QR Code & Coupon Setup
            </h3>
            {selectedProject ? (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">QR Destination URL</label>
                  <div className="p-2 bg-slate-800 rounded text-teal-400 font-mono text-[10px] break-all">
                    {selectedProject.campaign?.qr_destination || '-'}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Coupon Code</label>
                  <div className="p-3 rounded-lg text-center" style={{ background: 'rgba(20,184,166,0.12)' }}>
                    <span className="text-xl font-bold text-teal-400">
                      {selectedProject.campaign?.coupon_code || '-'}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">Coupon Value</label>
                  <div className="text-xs text-slate-300">
                    {selectedProject.campaign?.coupon_value || '-'}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">Select a project</p>
            )}
          </div>
          
          {/* Pilot ROI Projection */}
          <div className="bg-[#1E293B] rounded-2xl p-5 border border-slate-700">
            <h3 className="text-xs font-semibold text-green-400 mb-4 flex items-center gap-2">
              <TrendingUp size={14} /> Pilot ROI Projection
            </h3>
            {selectedProject ? (
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Units/Store × Stores</span>
                  <span className="text-white">{projection.units_per_store || 0} × {selectedProject.distribution?.pilot_stores || 0}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Total Units</span>
                  <span className="text-white">{projection.total_units || 0}</span>
                </div>
                <div className="flex justify-between text-slate-400 pt-2 border-t border-slate-700">
                  <span>Total Investment</span>
                  <span className="text-red-400 font-semibold">₹{projection.total_investment || 0}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Sachet Revenue</span>
                  <span className="text-white">₹{projection.sachet_revenue || 0}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>QR Scans ({projection.qr_scan_rate_pct || 0}%)</span>
                  <span className="text-white">{projection.estimated_scans || 0}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Conversions ({projection.conversion_rate_pct || 0}%)</span>
                  <span className="text-white">{projection.estimated_conversions || 0}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Conversion Revenue</span>
                  <span className="text-white">₹{projection.conversion_revenue || 0}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-700">
                  <span className="text-green-400 font-semibold">Total Revenue</span>
                  <span className="text-green-400 font-semibold">₹{projection.total_revenue || 0}</span>
                </div>
                <div className="mt-2 p-3 rounded-lg text-center" style={{ background: 'rgba(34,197,94,0.12)' }}>
                  <span className="text-2xl font-bold text-green-400">{projection.roi_pct || 0}%</span>
                  <span className="text-[10px] text-slate-400 block">ROI</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">Select a project</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // New Project Modal
  const renderNewProjectModal = () => (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowNewModal(false)}>
      <div className="bg-[#1E293B] rounded-2xl p-6 w-full max-w-lg border border-slate-700" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Beaker size={20} className="text-teal-400" />
            New R&D Project
          </h2>
          <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1">Project Name *</label>
            <input
              type="text"
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              placeholder="e.g., WagWash Sachet - 30ml Trial Pack"
              className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Category</label>
              <select
                value={newProject.category}
                onChange={(e) => setNewProject({ ...newProject, category: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Priority</label>
              <select
                value={newProject.priority}
                onChange={(e) => setNewProject({ ...newProject, priority: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
              >
                {PRIORITIES.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Stage</label>
              <select
                value={newProject.stage}
                onChange={(e) => setNewProject({ ...newProject, stage: e.target.value })}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-teal-500"
              >
                {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>
          
          <div>
            <label className="text-xs text-slate-400 block mb-1">Hypothesis</label>
            <textarea
              value={newProject.hypothesis}
              onChange={(e) => setNewProject({ ...newProject, hypothesis: e.target.value })}
              placeholder="What business problem does this solve? Why will it work?"
              rows={3}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 resize-none"
            />
          </div>
          
          <div>
            <label className="text-xs text-slate-400 block mb-1">Target Market</label>
            <input
              type="text"
              value={newProject.target_market}
              onChange={(e) => setNewProject({ ...newProject, target_market: e.target.value })}
              placeholder="e.g., Retail pet stores - billing counter impulse buy"
              className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => setShowNewModal(false)}
            className="px-4 py-2 text-slate-400 hover:text-white text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateProject}
            disabled={savingProject || !newProject.name.trim()}
            className="px-6 py-2 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {savingProject ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Create Project
          </button>
        </div>
      </div>
    </div>
  );

  // ==================== MAIN RENDER ====================

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="text-teal-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FlaskConical size={24} className="text-teal-400" />
            R&D Innovation Lab
          </h1>
          
          {/* View Tabs */}
          <div className="flex bg-slate-800 rounded-lg p-1">
            {[
              { id: 'pipeline', label: 'Pipeline Board', icon: Layers },
              { id: 'detail', label: 'Project Detail', icon: ClipboardList },
              { id: 'economics', label: 'Unit Economics', icon: Calculator },
              { id: 'campaigns', label: 'Campaign Planner', icon: Megaphone }
            ].map(view => {
              const Icon = view.icon;
              return (
                <button
                  key={view.id}
                  onClick={() => setActiveView(view.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    activeView === view.id
                      ? 'bg-teal-500 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  data-testid={`rd-lab-view-${view.id}`}
                >
                  <Icon size={14} />
                  {view.label}
                </button>
              );
            })}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {activeView === 'detail' && selectedProject && (
            <button
              onClick={() => setActiveView('pipeline')}
              className="px-3 py-1.5 text-slate-400 hover:text-white text-xs flex items-center gap-1"
            >
              ← Back to Pipeline
            </button>
          )}
          <button
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white text-xs font-medium rounded-lg transition-colors flex items-center gap-2"
            data-testid="new-rd-project-btn"
          >
            <Plus size={14} /> New R&D Project
          </button>
        </div>
      </div>
      
      {/* Content */}
      {activeView === 'pipeline' && renderPipelineView()}
      {activeView === 'detail' && renderDetailView()}
      {activeView === 'economics' && renderCalculatorView()}
      {activeView === 'campaigns' && renderCampaignView()}
      
      {/* New Project Modal */}
      {showNewModal && renderNewProjectModal()}
    </div>
  );
};

export default RDLabTab;
