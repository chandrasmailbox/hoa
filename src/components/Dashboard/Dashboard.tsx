import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle, Home, Wrench } from 'lucide-react';
import { supabase, Transaction, Payment, MaintenanceRequest } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  pendingPayments: number;
  upcomingMaintenance: number;
  activeMaintenance: number;
}

export const Dashboard = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalIncome: 0,
    totalExpenses: 0,
    balance: 0,
    pendingPayments: 0,
    upcomingMaintenance: 0,
    activeMaintenance: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [recentMaintenance, setRecentMaintenance] = useState<MaintenanceRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []); // Remove isAdmin dependency so Dashboard loads for all users

  const loadDashboardData = async () => {
    try {
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .order('transaction_date', { ascending: false });

      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('status', 'pending');

      const { data: maintenance } = await supabase
        .from('maintenance_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      const totalIncome = (transactions || [])
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpenses = (transactions || [])
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const activeMaintenance = (maintenance || []).filter(
        (m) => m.status === 'in_progress'
      ).length;

      const upcomingMaintenance = (maintenance || []).filter(
        (m) => m.status === 'pending'
      ).length;

      setStats({
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
        pendingPayments: (payments || []).reduce((sum, p) => sum + p.amount, 0),
        upcomingMaintenance,
        activeMaintenance,
      });

      setRecentTransactions((transactions || []).slice(0, 5));
      setRecentMaintenance(maintenance || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome back, {profile?.full_name}
        </h1>
        <p className="text-slate-600 mt-1">
          Dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6" />
            </div>
            <span className="text-sm opacity-90">This Period</span>
          </div>
          <div className="space-y-1">
            <p className="text-sm opacity-90">Total Income</p>
            <p className="text-3xl font-bold">
              ${stats.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <TrendingDown className="h-6 w-6" />
            </div>
            <span className="text-sm opacity-90">This Period</span>
          </div>
          <div className="space-y-1">
            <p className="text-sm opacity-90">Total Expenses</p>
            <p className="text-3xl font-bold">
              ${stats.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <DollarSign className="h-6 w-6" />
            </div>
            <span className="text-sm opacity-90">Current</span>
          </div>
          <div className="space-y-1">
            <p className="text-sm opacity-90">Balance</p>
            <p className="text-3xl font-bold">
              ${stats.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Always show these cards, regardless of role */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-amber-100 p-3 rounded-lg">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-slate-600">Pending Payments</p>
            <p className="text-3xl font-bold text-slate-900">
              ${stats.pendingPayments.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Wrench className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-slate-600">Active Maintenance</p>
            <p className="text-3xl font-bold text-slate-900">{stats.activeMaintenance}</p>
            <p className="text-xs text-slate-500">{stats.upcomingMaintenance} pending</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Recent Transactions</h3>
          </div>
          <div className="divide-y divide-slate-200">
            {recentTransactions.length === 0 ? (
              <div className="p-8 text-center">
                <DollarSign className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600">No recent transactions</p>
              </div>
            ) : (
              recentTransactions.map((transaction) => (
                <div key={transaction.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{transaction.category.replace('_', ' ')}</p>
                      <p className="text-sm text-slate-500">
                        {new Date(transaction.transaction_date).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`text-lg font-semibold ${
                        transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {transaction.type === 'income' ? '+' : '-'}$
                      {transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Recent Maintenance</h3>
          </div>
          <div className="divide-y divide-slate-200">
            {recentMaintenance.length === 0 ? (
              <div className="p-8 text-center">
                <Wrench className="h-10 w-10 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-600">No recent maintenance requests</p>
              </div>
            ) : (
              recentMaintenance.map((request) => (
                <div key={request.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{request.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            request.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : request.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {request.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-500">{request.category}</span>
                      </div>
                    </div>
                    {request.estimated_cost && (
                      <span className="text-sm font-medium text-slate-600">
                        ${request.estimated_cost.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
