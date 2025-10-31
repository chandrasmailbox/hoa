import { useEffect, useState } from 'react';
import { Wrench, Plus, Calendar, DollarSign, AlertCircle, Pencil, Trash2 } from 'lucide-react';
import { supabase, MaintenanceRequest } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

const priorityColors = {
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-amber-100 text-amber-700',
  urgent: 'bg-red-100 text-red-700',
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-slate-100 text-slate-800',
};

export const MaintenanceList = () => {
  const { isAdmin, user } = useAuth();
  const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRequest, setEditingRequest] = useState<MaintenanceRequest | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    if (!user) {
      setRequests([]);
      setLoading(false);
      return;
    }
    try {
      let query = supabase
        .from('maintenance_requests')
        .select('*')
        .order('created_at', { ascending: false });

      // Admin sees all requests, user only their own
      if (!isAdmin) {
        query = query.eq('requested_by', user.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading maintenance requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (request: MaintenanceRequest) => {
    setEditingRequest(request);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      // Always allow delete if user is admin or request belongs to user AND status is pending
      let query = supabase
        .from('maintenance_requests')
        .delete()
        .eq('id', id);

      if (!isAdmin) {
        query = query.eq('requested_by', user?.id).eq('status', 'pending');
      }

      const { error } = await query;

      if (error) throw error;

      setRequests(requests.filter(req => req.id !== id));
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Error deleting maintenance request:', error);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingRequest(null);
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
          <h2 className="text-2xl font-bold text-slate-900">Maintenance Requests</h2>
          <p className="text-slate-600 mt-1">Track and manage property maintenance</p>
        </div>
        {(isAdmin || user) && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Plus className="h-5 w-5" />
            New Request
          </button>
        )}
      </div>

      {showForm && (
        <MaintenanceForm 
          onClose={handleFormClose} 
          onSuccess={loadRequests} 
          editingRequest={editingRequest}
        />
      )}

      <div className="grid gap-4">
        {requests.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <Wrench className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No maintenance requests yet</p>
          </div>
        ) : (
          requests.map((request) => (
            <div key={request.id} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-slate-900">{request.title}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[request.priority]}`}>
                      {request.priority}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[request.status]}`}>
                      {request.status.replace('_', ' ')}
                    </span>
                  </div>
                  {request.description && (
                    <p className="text-slate-600 mb-3">{request.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {request.category}
                    </span>
                    {request.scheduled_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(request.scheduled_date).toLocaleDateString()}
                      </span>
                    )}
                    {request.estimated_cost && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        ${request.estimated_cost.toLocaleString()}
                      </span>
                    )}
                  </div>
                  {request.assigned_vendor && (
                    <div className="mt-2 text-sm text-slate-600">
                      Vendor: {request.assigned_vendor}
                    </div>
                  )}
                </div>

                {/* Admin can edit/delete all, users only their own AND only if status is 'pending' */}
                {(isAdmin || (user && request.requested_by === user.id && request.status === 'pending')) && (
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(request)}
                      className={`p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors`}
                      title="Edit request"
                      disabled={!isAdmin && request.status !== 'pending'}
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(request.id)}
                      className={`p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors`}
                      title="Delete request"
                      disabled={!isAdmin && request.status !== 'pending'}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>

              {deleteConfirmId === request.id && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800 mb-3">
                    Are you sure you want to delete this maintenance request? This action cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDelete(request.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                    >
                      Confirm Delete
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const MaintenanceForm = ({ 
  onClose, 
  onSuccess, 
  editingRequest 
}: { 
  onClose: () => void; 
  onSuccess: () => void;
  editingRequest?: MaintenanceRequest | null;
}) => {
  const { user, isAdmin } = useAuth();
  const [formData, setFormData] = useState({
    title: editingRequest?.title || '',
    description: editingRequest?.description || '',
    category: editingRequest?.category || 'repairs',
    priority: editingRequest?.priority || 'medium',
    status: editingRequest?.status || 'pending',
    estimated_cost: editingRequest?.estimated_cost?.toString() || '',
    scheduled_date: editingRequest?.scheduled_date || '',
    assigned_vendor: editingRequest?.assigned_vendor || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        estimated_cost: isAdmin ? (formData.estimated_cost ? parseFloat(formData.estimated_cost) : null) : null,
        scheduled_date: isAdmin ? (formData.scheduled_date || null) : null,
        assigned_vendor: isAdmin ? (formData.assigned_vendor || null) : null,
        // Always keep requested_by as the original requester when editing
        requested_by: editingRequest?.requested_by ?? user?.id,
        status: isAdmin ? formData.status : 'pending', // always pending for normal users
      };

      if (editingRequest) {
        // Only allow update if user is admin or request belongs to user AND status is pending
        if (
          isAdmin ||
          (user?.id === editingRequest.requested_by && editingRequest.status === 'pending')
        ) {
          let query = supabase
            .from('maintenance_requests')
            .update(payload)
            .eq('id', editingRequest.id);

          if (!isAdmin) {
            query = query.eq('requested_by', user?.id).eq('status', 'pending');
          }
          const { error } = await query;
          if (error) throw error;
        } else {
          throw new Error('You do not have permission to update this request.');
        }
      } else {
        // Create new request
        const { error } = await supabase
          .from('maintenance_requests')
          .insert(payload);

        if (error) throw error;
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving maintenance request:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-bold text-slate-900 mb-6">
          {editingRequest ? 'Edit Maintenance Request' : 'New Maintenance Request'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
              >
                <option value="landscaping">Landscaping</option>
                <option value="pool">Pool</option>
                <option value="security">Security</option>
                <option value="repairs">Repairs</option>
                <option value="utilities">Utilities</option>
                <option value="cleaning">Cleaning</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
              <select
                value={isAdmin ? formData.status : 'pending'}
                onChange={(e) => isAdmin && setFormData({ ...formData, status: e.target.value })}
                className={`w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 ${isAdmin ? '' : 'bg-gray-100 text-gray-500 cursor-not-allowed'}`}
                disabled={!isAdmin}
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {isAdmin && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Estimated Cost</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.estimated_cost}
                  onChange={(e) => setFormData({ ...formData, estimated_cost: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                  placeholder="0.00"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {isAdmin && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Scheduled Date</label>
                <input
                  type="date"
                  value={formData.scheduled_date}
                  onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                />
              </div>
            )}

            {isAdmin && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Assigned Vendor</label>
                <input
                  type="text"
                  value={formData.assigned_vendor}
                  onChange={(e) => setFormData({ ...formData, assigned_vendor: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                  placeholder="Vendor name"
                />
              </div>
            )}
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
              {loading ? (editingRequest ? 'Updating...' : 'Creating...') : (editingRequest ? 'Update Request' : 'Create Request')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};