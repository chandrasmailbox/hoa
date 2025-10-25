import { useEffect, useState } from 'react';
import { FileText, Download } from 'lucide-react';
import { supabase, Transaction, Payment } from '../../lib/supabase';

interface BalanceSheetData {
  assets: {
    cash: number;
    accountsReceivable: number;
    total: number;
  };
  liabilities: {
    accountsPayable: number;
    total: number;
  };
  equity: {
    retainedEarnings: number;
    total: number;
  };
}

export const FinancialStatements = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'current' | 'ytd'>('current');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [transactionsRes, paymentsRes] = await Promise.all([
        supabase.from('transactions').select('*').order('transaction_date', { ascending: false }),
        supabase.from('payments').select('*'),
      ]);

      if (transactionsRes.error) throw transactionsRes.error;
      if (paymentsRes.error) throw paymentsRes.error;

      setTransactions(transactionsRes.data || []);
      setPayments(paymentsRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterByPeriod = (transactions: Transaction[]) => {
    if (period === 'current') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return transactions.filter(t => new Date(t.transaction_date) >= thirtyDaysAgo);
    } else {
      const yearStart = new Date(new Date().getFullYear(), 0, 1);
      return transactions.filter(t => new Date(t.transaction_date) >= yearStart);
    }
  };

  const calculateBalanceSheet = (): BalanceSheetData => {
    const filteredTransactions = filterByPeriod(transactions);
    const totalIncome = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const pendingPayments = payments
      .filter(p => p.status === 'pending' || p.status === 'overdue')
      .reduce((sum, p) => sum + p.amount, 0);

    const cash = totalIncome - totalExpenses;
    const accountsReceivable = pendingPayments;
    const assets = cash + accountsReceivable;

    const accountsPayable = 0;
    const liabilities = accountsPayable;

    const retainedEarnings = assets - liabilities;

    return {
      assets: {
        cash,
        accountsReceivable,
        total: assets,
      },
      liabilities: {
        accountsPayable,
        total: liabilities,
      },
      equity: {
        retainedEarnings,
        total: retainedEarnings,
      },
    };
  };

  const generateIncomeStatement = () => {
    const filteredTransactions = filterByPeriod(transactions);

    const incomeByCategory = new Map<string, number>();
    const expensesByCategory = new Map<string, number>();

    filteredTransactions.forEach(t => {
      if (t.type === 'income') {
        incomeByCategory.set(t.category, (incomeByCategory.get(t.category) || 0) + t.amount);
      } else {
        expensesByCategory.set(t.category, (expensesByCategory.get(t.category) || 0) + t.amount);
      }
    });

    const totalIncome = Array.from(incomeByCategory.values()).reduce((sum, val) => sum + val, 0);
    const totalExpenses = Array.from(expensesByCategory.values()).reduce((sum, val) => sum + val, 0);
    const netIncome = totalIncome - totalExpenses;

    return {
      income: Array.from(incomeByCategory.entries()).map(([category, amount]) => ({
        category: category.replace(/_/g, ' '),
        amount,
      })),
      expenses: Array.from(expensesByCategory.entries()).map(([category, amount]) => ({
        category: category.replace(/_/g, ' '),
        amount,
      })),
      totalIncome,
      totalExpenses,
      netIncome,
    };
  };

  const exportBalanceSheet = () => {
    const bs = calculateBalanceSheet();
    const report = `BALANCE SHEET
As of ${new Date().toLocaleDateString()}
Period: ${period === 'current' ? 'Last 30 Days' : 'Year to Date'}

ASSETS
  Current Assets:
    Cash                          $${bs.assets.cash.toFixed(2)}
    Accounts Receivable           $${bs.assets.accountsReceivable.toFixed(2)}
  Total Assets                    $${bs.assets.total.toFixed(2)}

LIABILITIES
  Current Liabilities:
    Accounts Payable              $${bs.liabilities.accountsPayable.toFixed(2)}
  Total Liabilities               $${bs.liabilities.total.toFixed(2)}

EQUITY
  Retained Earnings               $${bs.equity.retainedEarnings.toFixed(2)}
  Total Equity                    $${bs.equity.total.toFixed(2)}

Total Liabilities & Equity        $${(bs.liabilities.total + bs.equity.total).toFixed(2)}
`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `balance-sheet-${period}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  const exportIncomeStatement = () => {
    const is = generateIncomeStatement();
    const report = `INCOME STATEMENT
For the period: ${period === 'current' ? 'Last 30 Days' : 'Year to Date'}
Generated: ${new Date().toLocaleDateString()}

REVENUE
${is.income.map(item => `  ${item.category.padEnd(30)} $${item.amount.toFixed(2)}`).join('\n')}
  ${'Total Revenue'.padEnd(30)} $${is.totalIncome.toFixed(2)}

EXPENSES
${is.expenses.map(item => `  ${item.category.padEnd(30)} $${item.amount.toFixed(2)}`).join('\n')}
  ${'Total Expenses'.padEnd(30)} $${is.totalExpenses.toFixed(2)}

NET INCOME                        $${is.netIncome.toFixed(2)}
`;

    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `income-statement-${period}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  const balanceSheet = calculateBalanceSheet();
  const incomeStatement = generateIncomeStatement();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Financial Statements</h2>
          <p className="text-slate-600 mt-1">Balance Sheet and Income Statement</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPeriod('current')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              period === 'current'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setPeriod('ytd')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              period === 'ytd'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Year to Date
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-slate-600" />
              <h3 className="text-lg font-semibold text-slate-900">Balance Sheet</h3>
            </div>
            <button
              onClick={exportBalanceSheet}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Export Balance Sheet"
            >
              <Download className="h-5 w-5 text-slate-600" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Assets</h4>
              <div className="space-y-2 ml-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Cash</span>
                  <span className="font-medium text-slate-900">
                    ${balanceSheet.assets.cash.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Accounts Receivable</span>
                  <span className="font-medium text-slate-900">
                    ${balanceSheet.assets.accountsReceivable.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t border-slate-200">
                  <span className="text-slate-900">Total Assets</span>
                  <span className="text-slate-900">
                    ${balanceSheet.assets.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Liabilities</h4>
              <div className="space-y-2 ml-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Accounts Payable</span>
                  <span className="font-medium text-slate-900">
                    ${balanceSheet.liabilities.accountsPayable.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t border-slate-200">
                  <span className="text-slate-900">Total Liabilities</span>
                  <span className="text-slate-900">
                    ${balanceSheet.liabilities.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Equity</h4>
              <div className="space-y-2 ml-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Retained Earnings</span>
                  <span className="font-medium text-slate-900">
                    ${balanceSheet.equity.retainedEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between font-semibold pt-2 border-t border-slate-200">
                  <span className="text-slate-900">Total Equity</span>
                  <span className="text-slate-900">
                    ${balanceSheet.equity.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-4 rounded-lg">
              <div className="flex justify-between font-bold">
                <span>Total Liabilities & Equity</span>
                <span>
                  ${(balanceSheet.liabilities.total + balanceSheet.equity.total).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6 text-slate-600" />
              <h3 className="text-lg font-semibold text-slate-900">Income Statement</h3>
            </div>
            <button
              onClick={exportIncomeStatement}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Export Income Statement"
            >
              <Download className="h-5 w-5 text-slate-600" />
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Revenue</h4>
              <div className="space-y-2 ml-4">
                {incomeStatement.income.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-slate-600 capitalize">{item.category}</span>
                    <span className="font-medium text-slate-900">
                      ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between font-semibold pt-2 border-t border-slate-200">
                  <span className="text-slate-900">Total Revenue</span>
                  <span className="text-emerald-600">
                    ${incomeStatement.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">Expenses</h4>
              <div className="space-y-2 ml-4">
                {incomeStatement.expenses.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-slate-600 capitalize">{item.category}</span>
                    <span className="font-medium text-slate-900">
                      ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between font-semibold pt-2 border-t border-slate-200">
                  <span className="text-slate-900">Total Expenses</span>
                  <span className="text-red-600">
                    ${incomeStatement.totalExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            <div className={`p-4 rounded-lg ${
              incomeStatement.netIncome >= 0
                ? 'bg-emerald-50 border border-emerald-200'
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex justify-between font-bold">
                <span className="text-slate-900">Net Income</span>
                <span className={incomeStatement.netIncome >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                  ${incomeStatement.netIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
