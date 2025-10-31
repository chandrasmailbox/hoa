import { useEffect, useState } from 'react';
import { CreditCard, Calendar, CheckCircle, Clock, AlertTriangle, Plus, Search, Download, Building2 } from 'lucide-react';
import { supabase, Payment, Property } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
// --- PayPal integration import ---
import { PayWithPayPal } from './PayWithPayPal';

interface PaymentWithProperty extends Payment {
  properties?: {
    unit_number: string;
    address: string;
  };
}

export const PaymentPortal = () => {
  const { user, isAdmin } = useAuth();
  const [payments, setPayments] = useState<PaymentWithProperty[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithProperty | null>(null);

  useEffect(() => {
    loadData();
  }, [user, isAdmin]);

  const loadData = async () => {
    try {
      if (isAdmin) {
        const [paymentsRes, propertiesRes] = await Promise.all([
          supabase
            .from('payments')
            .select('*, properties(unit_number, address)')
            .order('due_date', { ascending: false }),
          supabase
            .from('properties')
            .select('*')
            .order('unit_number', { ascending: true }),
        ]);

        if (paymentsRes.error) throw paymentsRes.error;
        if (propertiesRes.error) throw propertiesRes.error;

        setPayments(paymentsRes.data || []);
        setProperties(propertiesRes.data || []);
      } else {
        const { data: userProperties, error: propError } = await supabase
          .from('properties')
          .select('*')
          .eq('owner_id', user?.id);

        if (propError) throw propError;
        setProperties(userProperties || []);

        if (userProperties && userProperties.length > 0) {
          const propertyIds = userProperties.map((p) => p.id);
          const { data: userPayments, error: paymentsError } = await supabase
            .from('payments')
            .select('*')
            .in('property_id', propertyIds)
            .order('due_date', { ascending: false });

          if (paymentsError) throw paymentsError;
          setPayments(userPayments || []);
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentStatusUpdate = async (paymentId: string, status: string, paymentMethod?: string) => {
    try {
      const updateData: any = { status };
      if (status === 'paid') {
        updateData.payment_date = new Date().toISOString().split('T')[0];
        if (paymentMethod) {
          updateData.payment_method = paymentMethod;
        }
      }

      const { error } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', paymentId);

      if (error) throw error;

      const payment = payments.find(p => p.id === paymentId);
      if (payment && status === 'paid') {
        await supabase.from('transactions').insert({
          type: 'income',
          category: payment.payment_type === 'monthly_dues' ? 'hoa_fees' : 'other_income',
          amount: payment.amount,
          description: `Payment for ${payment.payment_type.replace('_', ' ')} - ${payment.properties?.unit_number || 'Property'}`,
          transaction_date: new Date().toISOString().split('T')[0],
          property_id: payment.property_id,
          payment_method: paymentMethod || payment.payment_method,
          created_by: user?.id,
        });
      }

      loadData();
    } catch (error) {
      console.error('Error updating payment:', error);
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('Are you sure you want to delete this payment?')) return;

    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', paymentId);

      if (error) throw error;
      loadData();
    } catch (error) {
      console.error('Error deleting payment:', error);
    }
  };

  const exportPayments = () => {
    const csvContent = [
      ['Property', 'Unit', 'Type', 'Amount', 'Due Date', 'Payment Date', 'Status', 'Method', 'Notes'],
      ...filteredPayments.map(p => [
        p.properties?.address || '',
        p.properties?.unit_number || '',
        p.payment_type.replace('_', ' '),
        p.amount.toString(),
        p.due_date,
        p.payment_date || '',
        p.status,
        p.payment_method || '',
        p.notes || '',
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredPayments = payments.filter((p) => {
    const matchesFilter = filter === 'all' || p.status === filter;
    const matchesSearch = searchQuery === '' ||
      p.properties?.unit_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.properties?.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.payment_type.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const totalPending = payments
    .filter((p) => p.status === 'pending' || p.status === 'overdue')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPaid = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  const overdueCount = payments.filter((p) =>
    p.status === 'pending' && new Date(p.due_date) < new Date()
  ).length;

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
          <h2 className="text-2xl font-bold text-slate-900">Payment Management</h2>
          <p className="text-slate-600 mt-1">
            {isAdmin ? 'Manage all HOA payments and dues' : 'View and pay your HOA dues'}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <button
                onClick={exportPayments}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="h-5 w-5" />
                Export
              </button>
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Create Payment
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-amber-100 p-2 rounded-lg">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <span className="text-sm font-medium text-slate-600">Pending</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            ${totalPending.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {payments.filter(p => p.status === 'pending').length} payments
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-slate-600">Paid</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            ${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {payments.filter(p => p.status === 'paid').length} payments
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-red-100 p-2 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <span className="text-sm font-medium text-slate-600">Overdue</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{overdueCount}</p>
          <p className="text-xs text-slate-500 mt-1">Need attention</p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-slate-600">Properties</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{properties.length}</p>
          <p className="text-xs text-slate-500 mt-1">Total units</p>
        </div>
      </div>

      {showCreateForm && (
        <PaymentForm
          properties={properties}
          onClose={() => setShowCreateForm(false)}
          onSuccess={loadData}
        />
      )}

      {selectedPayment && (
        <PaymentDetailsModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onUpdate={loadData}
          onStatusChange={handlePaymentStatusUpdate}
          onDelete={handleDeletePayment}
          isAdmin={isAdmin}
        />
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200 space-y-4">
          <div className="flex gap-2">
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
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'pending'
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('paid')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'paid'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Paid
            </button>
            <button
              onClick={() => setFilter('overdue')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                filter === 'overdue'
                  ? 'bg-red-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Overdue
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by property or unit..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="divide-y divide-slate-200">
          {filteredPayments.length === 0 ? (
            <div className="p-12 text-center">
              <CreditCard className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No payments found</p>
            </div>
          ) : (
            filteredPayments.map((payment) => (
              <PaymentCard
                key={payment.id}
                payment={payment}
                isAdmin={isAdmin}
                onStatusUpdate={handlePaymentStatusUpdate}
                onClick={() => setSelectedPayment(payment)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const PaymentCard = ({
  payment,
  isAdmin,
  onStatusUpdate,
  onClick,
}: {
  payment: PaymentWithProperty;
  isAdmin: boolean;
  onStatusUpdate: (id: string, status: string, method?: string) => void;
  onClick: () => void;
}) => {
  const [showPaymentMethod, setShowPaymentMethod] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('online');

  const statusConfig = {
    pending: { color: 'bg-amber-100 text-amber-800', icon: Clock },
    paid: { color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
    overdue: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
    cancelled: { color: 'bg-slate-100 text-slate-800', icon: Clock },
  };

  const config = statusConfig[payment.status];
  const StatusIcon = config.icon;

  const isOverdue = payment.status === 'pending' && new Date(payment.due_date) < new Date();

  const handleMarkAsPaid = () => {
    setShowPaymentMethod(true);
  };

  const confirmPayment = () => {
    onStatusUpdate(payment.id, 'paid', paymentMethod);
    setShowPaymentMethod(false);
  };

  return (
    <div className="p-6 hover:bg-slate-50 transition-colors cursor-pointer" onClick={onClick}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {payment.properties && (
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Building2 className="h-4 w-4" />
                {payment.properties.unit_number}
              </div>
            )}
            <h3 className="text-lg font-semibold text-slate-900 capitalize">
              {payment.payment_type.replace('_', ' ')}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${config.color}`}>
              <StatusIcon className="h-3 w-3" />
              {payment.status}
            </span>
            {isOverdue && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 animate-pulse">
                Overdue
              </span>
            )}
          </div>

          {payment.properties && (
            <p className="text-sm text-slate-600 mb-3">{payment.properties.address}</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Amount</p>
              <p className="font-semibold text-slate-900 text-lg">
                ${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <p className="text-slate-500">Due Date</p>
              <p className="font-semibold text-slate-900 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(payment.due_date).toLocaleDateString()}
              </p>
            </div>
            {payment.payment_date && (
              <div>
                <p className="text-slate-500">Paid Date</p>
                <p className="font-semibold text-emerald-600">
                  {new Date(payment.payment_date).toLocaleDateString()}
                </p>
              </div>
            )}
            {payment.payment_method && (
              <div>
                <p className="text-slate-500">Method</p>
                <p className="font-semibold text-slate-900 capitalize">
                  {payment.payment_method.replace('_', ' ')}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {payment.status === 'pending' && !showPaymentMethod && (
        <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={handleMarkAsPaid}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
          >
            Mark as Paid
          </button>
          {isAdmin && (
            <button
              onClick={() => onStatusUpdate(payment.id, 'cancelled')}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          )}
        </div>
      )}

      {showPaymentMethod && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg" onClick={(e) => e.stopPropagation()}>
          <p className="text-sm font-medium text-slate-900 mb-3">Select Payment Method:</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {['online', 'credit_card', 'bank_transfer', 'check', 'cash'].map((method) => (
              <button
                key={method}
                onClick={() => setPaymentMethod(method)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                  paymentMethod === method
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {method.replace('_', ' ')}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              onClick={confirmPayment}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
            >
              Confirm Payment
            </button>
            <button
              onClick={() => setShowPaymentMethod(false)}
              className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* --- PayPal "Pay Now" Button for pending payments --- */}
      {payment.status === 'pending' && (
        <div className="mt-2" onClick={e => e.stopPropagation()}>
          <PayWithPayPal
            payment={payment}
            onPaid={() => onStatusUpdate(payment.id, 'paid', 'paypal')}
          />
        </div>
      )}
    </div>
  );
};

const PaymentForm = ({
  properties,
  onClose,
  onSuccess,
}: {
  properties: Property[];
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    property_id: '',
    amount: '',
    payment_type: 'monthly_dues',
    due_date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from('payments').insert({
        ...formData,
        amount: parseFloat(formData.amount),
        status: 'pending',
      });

      if (error) throw error;
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating payment:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6">
        <h3 className="text-2xl font-bold text-slate-900 mb-6">Create New Payment</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Property</label>
            <select
              value={formData.property_id}
              onChange={(e) => setFormData({ ...formData, property_id: e.target.value })}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
            >
              <option value="">Select a property</option>
              {properties.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.unit_number} - {property.address}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Payment Type</label>
              <select
                value={formData.payment_type}
                onChange={(e) => setFormData({ ...formData, payment_type: e.target.value })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
              >
                <option value="monthly_dues">Monthly Dues</option>
                <option value="special_assessment">Special Assessment</option>
                <option value="fine">Fine</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Amount</label>
              <input
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Due Date</label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500"
              placeholder="Optional notes..."
            />
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
              {loading ? 'Creating...' : 'Create Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const PaymentDetailsModal = ({
  payment,
  onClose,
  onUpdate,
  onStatusChange,
  onDelete,
  isAdmin,
}: {
  payment: PaymentWithProperty;
  onClose: () => void;
  onUpdate: () => void;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  isAdmin: boolean;
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-2xl w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-2xl font-bold text-slate-900 mb-6">Payment Details</h3>

        <div className="space-y-4">
          {payment.properties && (
            <div>
              <p className="text-sm text-slate-600">Property</p>
              <p className="text-lg font-semibold text-slate-900">
                {payment.properties.unit_number} - {payment.properties.address}
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-600">Payment Type</p>
              <p className="text-lg font-semibold text-slate-900 capitalize">
                {payment.payment_type.replace('_', ' ')}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-600">Amount</p>
              <p className="text-lg font-semibold text-slate-900">
                ${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-600">Due Date</p>
              <p className="text-lg font-semibold text-slate-900">
                {new Date(payment.due_date).toLocaleDateString()}
              </p>
            </div>
            {payment.payment_date && (
              <div>
                <p className="text-sm text-slate-600">Payment Date</p>
                <p className="text-lg font-semibold text-emerald-600">
                  {new Date(payment.payment_date).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-600">Status</p>
              <p className="text-lg font-semibold text-slate-900 capitalize">{payment.status}</p>
            </div>
            {payment.payment_method && (
              <div>
                <p className="text-sm text-slate-600">Payment Method</p>
                <p className="text-lg font-semibold text-slate-900 capitalize">
                  {payment.payment_method.replace('_', ' ')}
                </p>
              </div>
            )}
          </div>

          {payment.notes && (
            <div>
              <p className="text-sm text-slate-600">Notes</p>
              <p className="text-slate-900 bg-slate-50 p-3 rounded-lg">{payment.notes}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-6 border-t border-slate-200 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Close
          </button>
          {isAdmin && payment.status === 'pending' && (
            <button
              onClick={() => {
                onDelete(payment.id);
                onClose();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};