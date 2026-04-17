import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '@/config/api';
import { motion } from 'framer-motion';
import { 
  Calendar,
  MapPin,
  Clock,
  Users,
  FileText,
  Mail,
  AlertTriangle,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Bell
} from 'lucide-react';
import { useAdminTheme } from '@/contexts/AdminThemeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const API_URL = API_BASE_URL + '/api';

function EventsPage() {
  const { isDarkMode } = useAdminTheme();
  const [event, setEvent] = useState(null);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [schedulerStatus, setSchedulerStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedDays, setExpandedDays] = useState({});
  const [testingReminder, setTestingReminder] = useState(false);

  useEffect(() => {
    fetchEventData();
  }, []);

  const fetchEventData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch all events
      const eventsRes = await fetch(`${API_URL}/admin/expo/events`, { headers });
      const events = await eventsRes.json();
      
      if (events && events.length > 0) {
        const primaryEvent = events[0]; // GPE 2026
        setEvent(primaryEvent);

        // Fetch logs for this event
        const logsRes = await fetch(`${API_URL}/admin/expo/events/${primaryEvent._id}/logs`, { headers });
        const logsData = await logsRes.json();
        setLogs(logsData);

        // Fetch stats
        const statsRes = await fetch(`${API_URL}/admin/expo/events/${primaryEvent._id}/stats`, { headers });
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Fetch scheduler status
      const schedulerRes = await fetch(`${API_URL}/admin/expo/scheduler/status`, { headers });
      const schedulerData = await schedulerRes.json();
      setSchedulerStatus(schedulerData);

    } catch (error) {
      console.error('Failed to fetch event data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendTestReminder = async () => {
    try {
      setTestingReminder(true);
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/admin/expo/test-reminder`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        alert('Test reminder sent to Telegram!');
      } else {
        alert('Failed to send test reminder: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Failed to send test reminder:', error);
      alert('Failed to send test reminder');
    } finally {
      setTestingReminder(false);
    }
  };

  const exportContacts = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/admin/expo/events/${event._id}/export`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `expo_contacts_${event._id}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export contacts:', error);
      alert('Failed to export contacts');
    }
  };

  const toggleDayExpand = (date) => {
    setExpandedDays(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const getLogTypeColor = (type) => {
    switch (type) {
      case 'note': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'contact': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'reminder': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'action': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'followup': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const filteredLogs = activeFilter === 'all' 
    ? logs 
    : logs.filter(log => log.log_type === activeFilter);

  const pendingActions = logs.filter(log => 
    log.log_type === 'action' && log.action_status === 'pending'
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Expo Intelligence
            </h1>
            <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Trade show management and networking hub
            </p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={fetchEventData}
              className={isDarkMode ? 'border-gray-700' : ''}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button 
              onClick={sendTestReminder}
              disabled={testingReminder}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Bell className="w-4 h-4 mr-2" />
              {testingReminder ? 'Sending...' : 'Test Reminder'}
            </Button>
          </div>
        </div>

        {/* Active Event Banner */}
        {event && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl p-6 ${isDarkMode ? 'bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-blue-500/30' : 'bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200'}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <Badge className="mb-2 bg-green-500/20 text-green-400 border-green-500/30">
                  Upcoming Event
                </Badge>
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {event.event_name}
                </h2>
                <div className="flex items-center gap-4 mt-2">
                  <span className={`flex items-center gap-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <Calendar className="w-4 h-4" />
                    {formatDate(event.event_date_start)} - {formatDate(event.event_date_end).split(',')[1]}
                  </span>
                  <span className={`flex items-center gap-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    <MapPin className="w-4 h-4" />
                    {event.location}
                  </span>
                </div>
              </div>
              {schedulerStatus && (
                <div className={`text-right ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <p className="text-sm">Scheduled Reminders</p>
                  <p className="text-2xl font-bold text-blue-400">{schedulerStatus.total_scheduled || 0}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <FileText className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Notes</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.total_notes}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <Users className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Contacts</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.total_contacts}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-yellow-500/20">
                    <Bell className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Reminders</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.total_reminders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-500/20">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Pending Actions</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.pending_actions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Mail className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Follow-ups</p>
                    <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{stats.total_followups}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Session Schedule */}
          <div className="lg:col-span-2">
            <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
              <CardHeader>
                <CardTitle className={isDarkMode ? 'text-white' : ''}>
                  Session Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {event?.sessions?.map((day, dayIndex) => (
                  <div key={dayIndex} className={`rounded-lg border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    <button
                      onClick={() => toggleDayExpand(day.date)}
                      className={`w-full flex items-center justify-between p-4 ${isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}
                    >
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-blue-400" />
                        <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {formatDate(day.date)}
                        </span>
                        <Badge variant="outline" className={isDarkMode ? 'border-gray-600' : ''}>
                          {day.sessions.length} sessions
                        </Badge>
                      </div>
                      {expandedDays[day.date] ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    {expandedDays[day.date] && (
                      <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                        {day.sessions.map((session, sessionIndex) => (
                          <div 
                            key={sessionIndex}
                            className={`p-4 ${sessionIndex !== day.sessions.length - 1 ? `border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}` : ''}`}
                          >
                            <div className="flex items-start gap-4">
                              <div className={`px-3 py-1 rounded-lg text-sm font-medium ${isDarkMode ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                                {session.time}
                              </div>
                              <div className="flex-1">
                                <h4 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {session.title}
                                </h4>
                                <p className={`text-sm flex items-center gap-1 mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  <MapPin className="w-3 h-3" />
                                  {session.location}
                                </p>
                                <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                  <span className="font-medium text-yellow-500">Why: </span>
                                  {session.why_it_matters}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Pending Actions & Export */}
          <div className="space-y-6">
            {/* Pending Actions */}
            <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className={isDarkMode ? 'text-white' : ''}>
                  Pending Actions
                </CardTitle>
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                  {pendingActions.length}
                </Badge>
              </CardHeader>
              <CardContent>
                {pendingActions.length === 0 ? (
                  <p className={`text-sm text-center py-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    No pending actions
                  </p>
                ) : (
                  <div className="space-y-3">
                    {pendingActions.slice(0, 5).map((action, index) => (
                      <div 
                        key={index}
                        className={`p-3 rounded-lg border ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                      >
                        <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {action.content?.substring(0, 100)}...
                        </p>
                        <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {formatTime(action.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Export */}
            <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
              <CardHeader>
                <CardTitle className={isDarkMode ? 'text-white' : ''}>
                  Export Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={exportContacts}
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={!event}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Contacts CSV
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Activity Timeline */}
        <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className={isDarkMode ? 'text-white' : ''}>
                Activity Timeline
              </CardTitle>
              <div className="flex gap-2">
                {['all', 'note', 'contact', 'reminder', 'action', 'followup'].map((filter) => (
                  <Button
                    key={filter}
                    variant={activeFilter === filter ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveFilter(filter)}
                    className={activeFilter !== filter && isDarkMode ? 'border-gray-600' : ''}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredLogs.length === 0 ? (
              <div className={`text-center py-12 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No activity logs yet.</p>
                <p className="text-sm mt-1">Send a message or photo to Telegram during the expo to start logging!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredLogs.map((log, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                  >
                    <div className="flex items-start gap-4">
                      <Badge className={getLogTypeColor(log.log_type)}>
                        {log.log_type}
                      </Badge>
                      <div className="flex-1">
                        {log.session_title && (
                          <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {log.session_title}
                          </p>
                        )}
                        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {log.content}
                        </p>
                        {log.cloudinary_image_url && (
                          <a 
                            href={log.cloudinary_image_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 mt-2 text-blue-400 hover:text-blue-300"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View Image
                          </a>
                        )}
                        {log.follow_up_email_draft && (
                          <div className={`mt-2 p-3 rounded-lg ${isDarkMode ? 'bg-gray-600/50' : 'bg-white'}`}>
                            <p className={`text-xs font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              Email Draft:
                            </p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              {log.follow_up_email_draft.substring(0, 200)}...
                            </p>
                          </div>
                        )}
                        <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default EventsPage;
