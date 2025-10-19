import { useEffect, useState } from 'react';
import { CreditCard, Calendar, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { supabase, Payment, Property } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export const PaymentPortal = () => {
  const { user, isAdmin } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');

  useEffect(() => {
    loadPayments();
  }, [user, isAdmin]);

  const loadPayments = async () => {
    try {
      if (isAdmin) {
        const { data: allPayments, error: paymentsError } = await supabase
          .from('payments')
          .select('*, properties(unit_number, address)')
          .order('due_date', { ascending: false });

        if (paymentsError) throw paymentsError;
        setPayments(allPayments || []);
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
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentStatusUpdate = async (paymentId: string, status: string) => {
    try {
      const updateData: any = { status };
      if (status === 'paid') {
        updateData.payment_date = new Date().toISOString().split('T')[0];
      }

      const { error } = await supabase
        .from('payments')
        .update(updateData)
        .eq('id', paymentId);

      if (error) throw error;
      loadPayments();
    } catch (error) {
      console.error('Error updating payment:', error);
    }
  };

  const filteredPayments = payments.filter((p) => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  const totalPending = payments
    .filter((p) => p.status === 'pending' || p.status === 'overdue')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPaid = payments
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Payment Portal</h2>
        <p className="text-slate-600 mt-1">
          {isAdmin ? 'Manage all HOA payments' : 'View and pay your HOA dues'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-amber-100 p-2 rounded-lg">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <span className="text-sm font-medium text-slate-600">Pending Payments</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            ${totalPending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-slate-600">Total Paid</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">
            ${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 p-2 rounded-lg">
              <CreditCard className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-slate-600">Total Payments</span>
          </div>
          <p className="text-2xl font-bold text-slate-900">{payments.length}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200">
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
}: {
  payment: Payment;
  isAdmin: boolean;
  onStatusUpdate: (id: string, status: string) => void;
}) => {
  const statusConfig = {
    pending: { color: 'bg-amber-100 text-amber-800', icon: Clock },
    paid: { color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
    overdue: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
    cancelled: { color: 'bg-slate-100 text-slate-800', icon: Clock },
  };

  const config = statusConfig[payment.status];
  const StatusIcon = config.icon;

  const isOverdue = payment.status === 'pending' && new Date(payment.due_date) < new Date();

  return (
    <div className="p-6 hover:bg-slate-50 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-slate-900">
              {payment.payment_type.replace('_', ' ')}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${config.color}`}>
              <StatusIcon className="h-3 w-3" />
              {payment.status}
            </span>
            {isOverdue && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                Overdue
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Amount</p>
              <p className="font-semibold text-slate-900">
                ${payment.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                <p className="font-semibold text-slate-900">
                  {new Date(payment.payment_date).toLocaleDateString()}
                </p>
              </div>
            )}
            {payment.payment_method && (
              <div>
                <p className="text-slate-500">Method</p>
                <p className="font-semibold text-slate-900">
                  {payment.payment_method.replace('_', ' ')}
                </p>
              </div>
            )}
          </div>

          {payment.notes && (
            <p className="text-sm text-slate-600 mt-3 bg-slate-50 p-3 rounded-lg">{payment.notes}</p>
          )}
        </div>
      </div>

      {payment.status === 'pending' && (
        <div className="flex gap-3">
          <button
            onClick={() => onStatusUpdate(payment.id, 'paid')}
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
    </div>
  );
};
