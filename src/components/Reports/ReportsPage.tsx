import { useEffect, useState } from 'react';
import { BarChart3, Download, TrendingUp, PieChart, Calendar } from 'lucide-react';
import { supabase, Transaction } from '../../lib/supabase';
import { FinancialChart } from './FinancialChart';
import { CategoryBreakdown } from './CategoryBreakdown';

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

interface CategoryData {
  category: string;
  amount: number;
  count: number;
}

export const ReportsPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'30' | '90' | '180' | '365'>('90');
  const [reportType, setReportType] = useState<'overview' | 'income' | 'expenses'>('overview');

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('transaction_date', { ascending: true });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactionsByDateRange = (transactions: Transaction[]) => {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));
    return transactions.filter(t => new Date(t.transaction_date) >= daysAgo);
  };

  const getMonthlyData = (): MonthlyData[] => {
    const filteredTransactions = filterTransactionsByDateRange(transactions);
    const monthlyMap = new Map<string, { income: number; expenses: number }>();

    filteredTransactions.forEach(t => {
      const date = new Date(t.transaction_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { income: 0, expenses: 0 });
      }

      const data = monthlyMap.get(monthKey)!;
      if (t.type === 'income') {
        data.income += t.amount;
      } else {
        data.expenses += t.amount;
      }
    });

    return Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        income: data.income,
        expenses: data.expenses,
        net: data.income - data.expenses,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  };

  const getCategoryData = (type: 'income' | 'expense'): CategoryData[] => {
    const filteredTransactions = filterTransactionsByDateRange(transactions)
      .filter(t => t.type === type);

    const categoryMap = new Map<string, { amount: number; count: number }>();

    filteredTransactions.forEach(t => {
      if (!categoryMap.has(t.category)) {
        categoryMap.set(t.category, { amount: 0, count: 0 });
      }
      const data = categoryMap.get(t.category)!;
      data.amount += t.amount;
      data.count += 1;
    });

    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category: category.replace(/_/g, ' '),
        amount: data.amount,
        count: data.count,
      }))
      .sort((a, b) => b.amount - a.amount);
  };

  const exportToCSV = () => {
    const filteredTransactions = filterTransactionsByDateRange(transactions);
    const headers = ['Date', 'Type', 'Category', 'Amount', 'Description', 'Payment Method', 'Reference'];
    const rows = filteredTransactions.map(t => [
      t.transaction_date,
      t.type,
      t.category,
      t.amount.toString(),
      t.description || '',
      t.payment_method || '',
      t.reference_number || '',
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hoa-report-${dateRange}days-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportToJSON = () => {
    const filteredTransactions = filterTransactionsByDateRange(transactions);
    const monthlyData = getMonthlyData();
    const incomeCategories = getCategoryData('income');
    const expenseCategories = getCategoryData('expense');

    const report = {
      generatedDate: new Date().toISOString(),
      dateRange: `Last ${dateRange} days`,
      summary: {
        totalIncome: filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0),
        totalExpenses: filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0),
        transactionCount: filteredTransactions.length,
      },
      monthlyData,
      incomeCategories,
      expenseCategories,
      transactions: filteredTransactions,
    };

    const json = JSON.stringify(report, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hoa-report-${dateRange}days-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const filteredTransactions = filterTransactionsByDateRange(transactions);
  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netIncome = totalIncome - totalExpenses;

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
          <h2 className="text-2xl font-bold text-slate-900">Reports & Analytics</h2>
          <p className="text-slate-600 mt-1">Financial insights and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Download className="h-5 w-5" />
            Export CSV
          </button>
          <button
            onClick={exportToJSON}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download className="h-5 w-5" />
            Export JSON
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Calendar className="h-5 w-5 text-slate-600" />
        <span className="text-sm font-medium text-slate-700">Date Range:</span>
        <div className="flex gap-2">
          {(['30', '90', '180', '365'] as const).map((days) => (
            <button
              key={days}
              onClick={() => setDateRange(days)}
              className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                dateRange === days
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {days === '365' ? '1 Year' : `${days} Days`}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
          <p className="text-sm opacity-90 mb-1">Total Income</p>
          <p className="text-3xl font-bold">
            ${totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs opacity-75 mt-2">
            {filteredTransactions.filter(t => t.type === 'income').length} transactions
          </p>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 rotate-180" />
            </div>
          </div>
          <p className="text-sm opacity-90 mb-1">Total Expenses</p>
          <p className="text-3xl font-bold">
            ${totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs opacity-75 mt-2">
            {filteredTransactions.filter(t => t.type === 'expense').length} transactions
          </p>
        </div>

        <div className={`rounded-xl p-6 text-white shadow-lg ${
          netIncome >= 0
            ? 'bg-gradient-to-br from-slate-700 to-slate-900'
            : 'bg-gradient-to-br from-amber-500 to-amber-600'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white bg-opacity-20 p-3 rounded-lg">
              <BarChart3 className="h-6 w-6" />
            </div>
          </div>
          <p className="text-sm opacity-90 mb-1">Net Income</p>
          <p className="text-3xl font-bold">
            ${netIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs opacity-75 mt-2">
            {netIncome >= 0 ? 'Positive balance' : 'Budget deficit'}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setReportType('overview')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            reportType === 'overview'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setReportType('income')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            reportType === 'income'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Income Analysis
        </button>
        <button
          onClick={() => setReportType('expenses')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            reportType === 'expenses'
              ? 'bg-red-600 text-white'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Expense Analysis
        </button>
      </div>

      {reportType === 'overview' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Monthly Trends</h3>
          <FinancialChart data={getMonthlyData()} />
        </div>
      )}

      {reportType === 'income' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Income by Category</h3>
          <CategoryBreakdown data={getCategoryData('income')} type="income" />
        </div>
      )}

      {reportType === 'expenses' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Expenses by Category</h3>
          <CategoryBreakdown data={getCategoryData('expense')} type="expense" />
        </div>
      )}
    </div>
  );
};
