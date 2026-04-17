import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Search, CheckSquare, Square, Calendar, Clock, User, Trash2, Edit2, RefreshCw, ClipboardList, X, MessageSquare, ChevronDown, ChevronUp, Send, Bell, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { API_BASE_URL } from '@/utils/api';
import ConfirmationModal from '@/components/common/ConfirmationModal';

const API_URL = API_BASE_URL + '/api';

const TeamTasksTab = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all', // all, pending, done
    assignee: 'all',
    date: 'all' // all, today, week, overdue
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [teamMembers, setTeamMembers] = useState([
    { id: '1', name: 'Akshay' },
    { id: '2', name: 'Rashi' },
    { id: '3', name: 'Eya' },
    { id: '4', name: 'Nishan' }
  ]);
  
  // Comments state
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [commentUser, setCommentUser] = useState('');
  const [commentsExpanded, setCommentsExpanded] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);
  const commentsEndRef = useRef(null);
  
  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, taskId: '', taskTitle: '' });
  
  // Digest sending state
  const [sendingDigest, setSendingDigest] = useState(false);

  // New task form state
  const [newTask, setNewTask] = useState({
    title: '',
    instructions: '',
    assignee: '',
    due_date: new Date().toISOString().slice(0, 10),
    due_time: '',
    repeat: 'none' // none, daily, weekly
  });

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/team-tasks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
    setLoading(false);
  }, []);

  const fetchTeamMembers = useCallback(async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/team-members`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success && data.members) {
        setTeamMembers(data.members);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
      // Keep default team members
    }
  }, []);

  useEffect(() => {
    fetchTasks();
    fetchTeamMembers();
  }, [fetchTasks, fetchTeamMembers]);

  const handleToggleTask = async (taskId, currentStatus) => {
    const newStatus = currentStatus === 'done' ? 'pending' : 'done';
    
    // Optimistic update
    setTasks(tasks.map(task => 
      task._id === taskId ? { ...task, status: newStatus, completed_at: newStatus === 'done' ? new Date().toISOString() : null } : task
    ));
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/team-tasks/${taskId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success(newStatus === 'done' ? 'Task completed! ✓' : 'Task reopened');
      } else {
        // Revert on error
        fetchTasks();
        toast.error('Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      fetchTasks();
      toast.error('Failed to update task');
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title || !newTask.assignee || !newTask.due_date) {
      toast.error('Please fill in title, assignee, and due date');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/team-tasks`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newTask,
          status: 'pending',
          created_at: new Date().toISOString()
        })
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Task added!');
        // Reset filter to 'all' so the new task is visible
        setFilters(prev => ({ ...prev, status: 'all' }));
        fetchTasks();
        setShowAddModal(false);
        setNewTask({
          title: '',
          instructions: '',
          assignee: '',
          due_date: new Date().toISOString().slice(0, 10),
          due_time: '',
          repeat: 'none'
        });
      } else {
        toast.error(data.error || 'Failed to add task');
      }
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask || !editingTask.title || !editingTask.assignee) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/team-tasks/${editingTask._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editingTask)
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Task updated!');
        fetchTasks();
        setEditingTask(null);
      } else {
        toast.error(data.error || 'Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    setDeleteConfirm({ show: false, taskId: '', taskTitle: '' });
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/team-tasks/${taskId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Task deleted');
        setTasks(tasks.filter(t => t._id !== taskId));
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };
  
  // Show delete confirmation
  const confirmDeleteTask = (task) => {
    setDeleteConfirm({ show: true, taskId: task._id, taskTitle: task.title });
  };

  // ============ COMMENTS FUNCTIONS ============
  
  // Fetch comments when editing a task
  const fetchComments = useCallback(async (taskId) => {
    setLoadingComments(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/team-tasks/${taskId}/comments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setComments(data.comments || []);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
    setLoadingComments(false);
  }, []);

  // Handle opening edit modal
  const handleEditTask = (task) => {
    setEditingTask(task);
    setComments(task.comments || []);
    setNewComment('');
    setCommentUser('');
    setCommentsExpanded(true);
    // Fetch latest comments
    fetchComments(task._id);
  };

  // Add comment
  const handleAddComment = async () => {
    if (!newComment.trim() || !commentUser) {
      toast.error('Please select your name and enter a comment');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/team-tasks/${editingTask._id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user: commentUser,
          text: newComment.trim()
        })
      });

      const data = await response.json();

      if (data.success) {
        setComments([...comments, data.comment]);
        setNewComment('');
        toast.success('Comment added');
        // Scroll to bottom
        setTimeout(() => {
          commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      } else {
        toast.error(data.error || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/team-tasks/${editingTask._id}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        setComments(comments.filter(c => c.id !== commentId));
        toast.success('Comment deleted');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  // Format comment timestamp
  const formatCommentTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' ' + 
           date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // Send daily digest to Telegram
  const handleSendDigest = async () => {
    setSendingDigest(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`${API_URL}/team-tasks/send-digest`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast.success('Digest sent to Telegram!', {
          description: `${data.tasks_count || 0} pending tasks • ${data.overdue_count || 0} overdue`
        });
      } else {
        toast.error(data.error || 'Failed to send digest');
      }
    } catch (error) {
      console.error('Error sending digest:', error);
      toast.error('Failed to send digest');
    }
    setSendingDigest(false);
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    // Status filter
    if (filters.status === 'pending' && task.status === 'done') return false;
    if (filters.status === 'done' && task.status !== 'done') return false;

    // Assignee filter
    if (filters.assignee !== 'all' && task.assignee !== filters.assignee) return false;

    // Date filter
    const today = new Date().toISOString().slice(0, 10);
    const taskDate = task.due_date?.slice(0, 10);
    
    if (filters.date === 'today' && taskDate !== today) return false;
    if (filters.date === 'overdue' && (taskDate >= today || task.status === 'done')) return false;
    if (filters.date === 'week') {
      const weekFromNow = new Date();
      weekFromNow.setDate(weekFromNow.getDate() + 7);
      if (taskDate > weekFromNow.toISOString().slice(0, 10)) return false;
    }

    // Search filter
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;

    return true;
  });

  // Sort: pending first, then by due date
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (a.status === 'done' && b.status !== 'done') return 1;
    if (a.status !== 'done' && b.status === 'done') return -1;
    return new Date(a.due_date + ' ' + (a.due_time || '23:59')) - new Date(b.due_date + ' ' + (b.due_time || '23:59'));
  });

  // Stats
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayTasks = tasks.filter(t => t.due_date?.slice(0, 10) === todayStr);
  const todayPending = todayTasks.filter(t => t.status !== 'done').length;
  const todayDone = todayTasks.filter(t => t.status === 'done').length;
  const totalPending = tasks.filter(t => t.status !== 'done').length;
  const totalDone = tasks.filter(t => t.status === 'done').length;

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (dateStr.slice(0, 10) === today.toISOString().slice(0, 10)) return 'Today';
    if (dateStr.slice(0, 10) === tomorrow.toISOString().slice(0, 10)) return 'Tomorrow';
    
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const isOverdue = (task) => {
    if (task.status === 'done') return false;
    const now = new Date();
    const dueDateTime = new Date(task.due_date + ' ' + (task.due_time || '23:59'));
    return dueDateTime < now;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <ClipboardList className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">Team Tasks</h2>
            <p className="text-sm text-slate-400">Manage and track team assignments</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          data-testid="add-task-button"
          className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <p className="text-sm text-slate-400">Today Pending</p>
          <p className="text-2xl font-bold text-orange-400">{todayPending}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <p className="text-sm text-slate-400">Today Done</p>
          <p className="text-2xl font-bold text-green-400">{todayDone}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <p className="text-sm text-slate-400">Total Pending</p>
          <p className="text-2xl font-bold text-white">{totalPending}</p>
        </div>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <p className="text-sm text-slate-400">Total Done</p>
          <p className="text-2xl font-bold text-slate-400">{totalDone}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Status Filter */}
        <div className="flex bg-slate-800 rounded-lg p-1">
          {['all', 'pending', 'done'].map(status => (
            <button
              key={status}
              onClick={() => setFilters({ ...filters, status })}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                filters.status === status
                  ? 'bg-purple-500 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Assignee Filter */}
        <select
          value={filters.assignee}
          onChange={(e) => setFilters({ ...filters, assignee: e.target.value })}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
        >
          <option value="all">All Assignees</option>
          {teamMembers.map(member => (
            <option key={member.id || member.name} value={member.name}>{member.name}</option>
          ))}
        </select>

        {/* Date Filter */}
        <select
          value={filters.date}
          onChange={(e) => setFilters({ ...filters, date: e.target.value })}
          className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
        >
          <option value="all">All Dates</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="overdue">Overdue</option>
        </select>

        {/* Search */}
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>

        {/* Send Digest Button */}
        <button
          onClick={handleSendDigest}
          disabled={sendingDigest}
          data-testid="send-digest-btn"
          title="Send daily digest to Telegram"
          className="p-2 bg-teal-500/20 hover:bg-teal-500/30 rounded-lg text-teal-400 transition-colors disabled:opacity-50"
        >
          {sendingDigest ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Bell className="w-4 h-4" />
          )}
        </button>

        {/* Refresh */}
        <button
          onClick={fetchTasks}
          disabled={loading}
          data-testid="refresh-tasks-btn"
          title="Refresh tasks"
          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Task List */}
      <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-700/50">
            <tr>
              <th className="w-12 px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase"></th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Task</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Assignee</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Due Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-500" />
                  <p className="text-slate-400 mt-2">Loading tasks...</p>
                </td>
              </tr>
            ) : sortedTasks.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-8 text-center">
                  <ClipboardList className="w-12 h-12 mx-auto mb-2 text-slate-600" />
                  <p className="text-slate-400">No tasks found</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-3 text-purple-400 hover:text-purple-300 text-sm"
                  >
                    + Add your first task
                  </button>
                </td>
              </tr>
            ) : (
              sortedTasks.map((task) => (
                <tr
                  key={task._id}
                  className={`border-t border-slate-700/50 hover:bg-slate-700/30 transition-colors ${
                    task.status === 'done' ? 'opacity-60' : ''
                  }`}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleTask(task._id, task.status)}
                      className="text-slate-400 hover:text-purple-400 transition-colors"
                    >
                      {task.status === 'done' ? (
                        <CheckSquare className="w-5 h-5 text-green-400" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </td>

                  {/* Task Title & Instructions */}
                  <td className="px-4 py-3">
                    <div>
                      <p className={`text-sm font-medium ${task.status === 'done' ? 'text-slate-400 line-through' : 'text-white'}`}>
                        {task.title}
                      </p>
                      {task.instructions && (
                        <p className="text-xs text-slate-500 mt-1 truncate max-w-md" title={task.instructions}>
                          {task.instructions}
                        </p>
                      )}
                    </div>
                  </td>

                  {/* Assignee */}
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 text-sm text-slate-300">
                      <User className="w-4 h-4 text-slate-500" />
                      {task.assignee}
                    </span>
                  </td>

                  {/* Due Date */}
                  <td className="px-4 py-3">
                    <span className={`flex items-center gap-2 text-sm ${
                      isOverdue(task) ? 'text-red-400' : 'text-slate-300'
                    }`}>
                      <Calendar className="w-4 h-4" />
                      {formatDate(task.due_date)}
                    </span>
                  </td>

                  {/* Due Time */}
                  <td className="px-4 py-3">
                    {task.due_time ? (
                      <span className="flex items-center gap-2 text-sm text-slate-400">
                        <Clock className="w-4 h-4" />
                        {task.due_time}
                      </span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    {task.status === 'done' ? (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                        ✓ Done
                      </span>
                    ) : isOverdue(task) ? (
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                        Overdue
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-orange-500/20 text-orange-400 text-xs rounded-full">
                        Pending
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleEditTask(task)}
                        className="p-1 text-slate-400 hover:text-white transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => confirmDeleteTask(task)}
                        className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowAddModal(false)}>
          <div className="bg-slate-800 rounded-xl w-full max-w-lg border border-slate-700 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-400" />
                Add Task
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Task Title */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Task Title *</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  placeholder="e.g., Download video from Instagram"
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Instructions / Notes</label>
                <textarea
                  value={newTask.instructions}
                  onChange={(e) => setNewTask({ ...newTask, instructions: e.target.value })}
                  placeholder="Step-by-step instructions, credentials, links..."
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 resize-none focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Assignee & Due Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Assignee *</label>
                  <select
                    value={newTask.assignee}
                    onChange={(e) => setNewTask({ ...newTask, assignee: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">Select...</option>
                    {teamMembers.map(member => (
                      <option key={member.id || member.name} value={member.name}>{member.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Due Date *</label>
                  <input
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Due Time & Repeat */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Due Time (optional)</label>
                  <input
                    type="time"
                    value={newTask.due_time}
                    onChange={(e) => setNewTask({ ...newTask, due_time: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Repeat</label>
                  <select
                    value={newTask.repeat}
                    onChange={(e) => setNewTask({ ...newTask, repeat: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="none">None</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-4 border-t border-slate-700">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTask}
                className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
              >
                Add Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setEditingTask(null)}>
          <div className="bg-slate-800 rounded-xl w-full max-w-lg border border-slate-700 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-purple-400" />
                Edit Task
              </h3>
              <button onClick={() => setEditingTask(null)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Task Title */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Task Title *</label>
                <input
                  type="text"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Instructions */}
              <div>
                <label className="block text-sm text-slate-400 mb-1">Instructions / Notes</label>
                <textarea
                  value={editingTask.instructions || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, instructions: e.target.value })}
                  rows={4}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white resize-none focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Assignee & Due Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Assignee *</label>
                  <select
                    value={editingTask.assignee}
                    onChange={(e) => setEditingTask({ ...editingTask, assignee: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="">Select...</option>
                    {teamMembers.map(member => (
                      <option key={member.id || member.name} value={member.name}>{member.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Due Date *</label>
                  <input
                    type="date"
                    value={editingTask.due_date?.slice(0, 10) || ''}
                    onChange={(e) => setEditingTask({ ...editingTask, due_date: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Due Time & Repeat */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Due Time</label>
                  <input
                    type="time"
                    value={editingTask.due_time || ''}
                    onChange={(e) => setEditingTask({ ...editingTask, due_time: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Repeat</label>
                  <select
                    value={editingTask.repeat || 'none'}
                    onChange={(e) => setEditingTask({ ...editingTask, repeat: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="none">None</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="border-t border-slate-700">
              {/* Comments Header - Collapsible */}
              <button
                onClick={() => setCommentsExpanded(!commentsExpanded)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium text-white">
                    Comments {comments.length > 0 && `(${comments.length})`}
                  </span>
                </div>
                {commentsExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {/* Comments Content */}
              {commentsExpanded && (
                <div className="px-4 pb-4">
                  {/* Comments List */}
                  <div className="max-h-48 overflow-y-auto space-y-3 mb-3">
                    {loadingComments ? (
                      <div className="text-center py-4">
                        <RefreshCw className="w-4 h-4 animate-spin mx-auto text-purple-400" />
                      </div>
                    ) : comments.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-4">
                        No comments yet. Be the first to comment!
                      </p>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="bg-slate-700/50 rounded-lg p-3 group">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-purple-400">{comment.user}</span>
                              <span className="text-xs text-slate-500">·</span>
                              <span className="text-xs text-slate-500">{formatCommentTime(comment.timestamp)}</span>
                            </div>
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-red-400 transition-all"
                              title="Delete comment"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-sm text-slate-300">{comment.text}</p>
                        </div>
                      ))
                    )}
                    <div ref={commentsEndRef} />
                  </div>

                  {/* Add Comment */}
                  <div className="space-y-2">
                    <select
                      value={commentUser}
                      onChange={(e) => setCommentUser(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                    >
                      <option value="">Select your name...</option>
                      {teamMembers.map(member => (
                        <option key={member.id || member.name} value={member.name}>{member.name}</option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                        placeholder="Add a comment..."
                        className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500"
                      />
                      <button
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || !commentUser}
                        className="px-3 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                        title="Post comment"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 p-4 border-t border-slate-700">
              <button
                onClick={() => setEditingTask(null)}
                className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTask}
                className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, taskId: '', taskTitle: '' })}
        onConfirm={() => handleDeleteTask(deleteConfirm.taskId)}
        title="Delete Task"
        message="Are you sure you want to delete this task?"
        itemName={deleteConfirm.taskTitle}
        warning="This action cannot be undone."
        confirmText="Delete"
        confirmColor="red"
      />
    </div>
  );
};

export default TeamTasksTab;
