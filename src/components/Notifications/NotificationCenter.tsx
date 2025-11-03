import { useEffect, useState } from 'react';
import { Bell, CheckCircle, X, Search, Settings, Trash2, Filter } from 'lucide-react';
import { supabase, Notification } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface NotificationPreferences {
  id: string;
  user_id: string;
  payment_reminders: boolean;
  maintenance_updates: boolean;
  announcements: boolean;
  system_notifications: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
}

export const NotificationCenter = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'payment_reminder' | 'maintenance_update' | 'announcement' | 'system'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
      setupRealtimeListener();
    }
  }, [user]);

  const setupRealtimeListener = () => {
    if (!user) return;

    const subscription = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const loadData = async () => {
    try {
      await Promise.all([loadNotifications(), loadPreferences()]);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      setPreferences(data || null);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
      loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user?.id)
        .eq('is_read', false);

      if (error) throw error;
      loadNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      loadNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const deleteAllNotifications = async () => {
    if (!confirm('Delete all notifications? This cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user?.id);

      if (error) throw error;
      loadNotifications();
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  };

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update(updates)
        .eq('user_id', user?.id);

      if (error) throw error;
      await loadPreferences();
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    const matchesFilter = filter === 'all' || n.type === filter || (filter === 'unread' && !n.is_read);
    const matchesSearch = searchQuery === '' ||
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const typeConfig: Record<string, { color: string; label: string; bg: string }> = {
    payment_reminder: { color: 'text-amber-800', label: 'Payment', bg: 'bg-amber-100 border-amber-200' },
    maintenance_update: { color: 'text-blue-800', label: 'Maintenance', bg: 'bg-blue-100 border-blue-200' },
    announcement: { color: 'text-slate-800', label: 'Announcement', bg: 'bg-slate-100 border-slate-200' },
    system: { color: 'text-slate-800', label: 'System', bg: 'bg-slate-100 border-slate-200' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Notifications</h2>
          <p className="text-slate-600 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread message${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <CheckCircle className="h-5 w-5" />
              Mark All Read
            </button>
          )}
          <button
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
          >
            <Settings className="h-5 w-5" />
            Preferences
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'unread'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </button>
          <button
            onClick={() => setFilter('payment_reminder')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'payment_reminder'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Payments
          </button>
          <button
            onClick={() => setFilter('maintenance_update')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'maintenance_update'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Maintenance
          </button>
          <button
            onClick={() => setFilter('announcement')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'announcement'
                ? 'bg-slate-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Announcements
          </button>
          <button
            onClick={() => setFilter('system')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === 'system'
                ? 'bg-slate-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            System
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200">
            <Bell className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">
              {searchQuery ? 'No notifications match your search' : 'No notifications'}
            </p>
          </div>
        ) : (
          <>
            {filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                typeConfig={typeConfig}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
              />
            ))}
            {notifications.length > 0 && (
              <button
                onClick={deleteAllNotifications}
                className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
              >
                <Trash2 className="h-5 w-5" />
                Clear All Notifications
              </button>
            )}
          </>
        )}
      </div>

      {showSettings && preferences && (
        <NotificationPreferencesModal
          preferences={preferences}
          onClose={() => setShowSettings(false)}
          onUpdate={updatePreferences}
        />
      )}
    </div>
  );
};

const NotificationItem = ({
  notification,
  typeConfig,
  onMarkAsRead,
  onDelete,
}: {
  notification: Notification;
  typeConfig: Record<string, any>;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const config = typeConfig[notification.type] || typeConfig.system;
  const timeAgo = getTimeAgo(new Date(notification.created_at));

  return (
    <div
      className={`bg-white rounded-xl p-5 shadow-sm border-2 transition-all hover:shadow-md ${
        notification.is_read ? 'border-slate-200' : 'border-slate-900 shadow-md'
      }`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${config.bg}`}>
              {config.label}
            </span>
            {!notification.is_read && (
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 bg-blue-600 rounded-full animate-pulse"></span>
                <span className="text-xs font-medium text-blue-600">New</span>
              </span>
            )}
            <span className="text-xs text-slate-500 ml-auto">{timeAgo}</span>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-1">{notification.title}</h3>
          <p className="text-slate-600 leading-relaxed">{notification.message}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {!notification.is_read && (
            <button
              onClick={() => onMarkAsRead(notification.id)}
              className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600 hover:text-blue-700"
              title="Mark as read"
            >
              <CheckCircle className="h-5 w-5" />
            </button>
          )}
          <button
            onClick={() => onDelete(notification.id)}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors text-slate-400 hover:text-red-600"
            title="Delete"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

const NotificationPreferencesModal = ({
  preferences,
  onClose,
  onUpdate,
}: {
  preferences: NotificationPreferences;
  onClose: () => void;
  onUpdate: (updates: Partial<NotificationPreferences>) => void;
}) => {
  const [localPrefs, setLocalPrefs] = useState(preferences);

  const handleSave = async () => {
    const updates: Partial<NotificationPreferences> = {
      payment_reminders: localPrefs.payment_reminders,
      maintenance_updates: localPrefs.maintenance_updates,
      announcements: localPrefs.announcements,
      system_notifications: localPrefs.system_notifications,
      email_notifications: localPrefs.email_notifications,
      push_notifications: localPrefs.push_notifications,
    };
    await onUpdate(updates);
    onClose();
  };

  const togglePref = (key: keyof NotificationPreferences) => {
    setLocalPrefs({ ...localPrefs, [key]: !localPrefs[key] });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6">
        <h3 className="text-2xl font-bold text-slate-900 mb-6">Notification Preferences</h3>

        <div className="space-y-4 mb-6">
          <div className="border border-slate-200 rounded-lg p-4">
            <h4 className="font-semibold text-slate-900 mb-4">Notification Types</h4>
            <div className="space-y-3">
              <PreferenceToggle
                label="Payment Reminders"
                description="Get notified about upcoming payments and due dates"
                checked={localPrefs.payment_reminders}
                onChange={() => togglePref('payment_reminders')}
              />
              <PreferenceToggle
                label="Maintenance Updates"
                description="Get updates on maintenance requests and repairs"
                checked={localPrefs.maintenance_updates}
                onChange={() => togglePref('maintenance_updates')}
              />
              <PreferenceToggle
                label="Announcements"
                description="Receive HOA announcements and important messages"
                checked={localPrefs.announcements}
                onChange={() => togglePref('announcements')}
              />
              <PreferenceToggle
                label="System Notifications"
                description="Get system alerts and important information"
                checked={localPrefs.system_notifications}
                onChange={() => togglePref('system_notifications')}
              />
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg p-4">
            <h4 className="font-semibold text-slate-900 mb-4">Delivery Methods</h4>
            <div className="space-y-3">
              <PreferenceToggle
                label="Push Notifications"
                description="Receive in-app notifications"
                checked={localPrefs.push_notifications}
                onChange={() => togglePref('push_notifications')}
              />
              <PreferenceToggle
                label="Email Notifications"
                description="Receive email digests of important notifications"
                checked={localPrefs.email_notifications}
                onChange={() => togglePref('email_notifications')}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};

const PreferenceToggle = ({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) => (
  <div className="flex items-start gap-4">
    <button
      onClick={onChange}
      className={`mt-1 flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
        checked
          ? 'bg-slate-900 border-slate-900'
          : 'bg-white border-slate-300 hover:border-slate-400'
      }`}
    >
      {checked && <CheckCircle className="h-4 w-4 text-white" />}
    </button>
    <div className="flex-1">
      <p className="font-medium text-slate-900">{label}</p>
      <p className="text-sm text-slate-600">{description}</p>
    </div>
  </div>
);

function getTimeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return date.toLocaleDateString();
}
