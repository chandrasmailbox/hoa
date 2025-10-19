import { useEffect, useState } from 'react';
import { Megaphone, Plus, AlertCircle } from 'lucide-react';
import { supabase, Announcement } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export const AnnouncementList = () => {
  const { isAdmin, user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('published_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const priorityConfig = {
    normal: { color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Megaphone },
    important: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: AlertCircle },
    urgent: { color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle },
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
          <h2 className="text-2xl font-bold text-slate-900">Announcements</h2>
          <p className="text-slate-600 mt-1">Stay updated with HOA news and updates</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Plus className="h-5 w-5" />
            New Announcement
          </button>
        )}
      </div>

      {showForm && <AnnouncementForm onClose={() => setShowForm(false)} onSuccess={loadAnnouncements} />}

      <div className="space-y-4">
        {announcements.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-slate-200">
            <Megaphone className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No announcements yet</p>
          </div>
        ) : (
          announcements.map((announcement) => {
            const config = priorityConfig[announcement.priority];
            const Icon = config.icon;

            return (
              <div
                key={announcement.id}
                className={`bg-white rounded-xl p-6 shadow-sm border-l-4 ${
                  announcement.priority === 'urgent'
                    ? 'border-red-500'
                    : announcement.priority === 'important'
                    ? 'border-blue-500'
                    : 'border-slate-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${config.color} border`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-slate-900">{announcement.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color} border`}>
                        {announcement.priority}
                      </span>
                    </div>
                    <p className="text-slate-700 mb-3 leading-relaxed whitespace-pre-wrap">
                      {announcement.content}
                    </p>
                    <p className="text-sm text-slate-500">
                      Published on {new Date(announcement.published_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

const AnnouncementForm = ({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('announcements').insert({
        ...formData,
        published_by: user?.id,
      });

      if (error) throw error;
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating announcement:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6">
        <h3 className="text-2xl font-bold text-slate-900 mb-6">New Announcement</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
              placeholder="Announcement title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              required
              rows={6}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
              placeholder="Announcement details..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
            >
              <option value="normal">Normal</option>
              <option value="important">Important</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Publishing...' : 'Publish Announcement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
