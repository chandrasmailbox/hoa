interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

interface FinancialChartProps {
  data: MonthlyData[];
}

export const FinancialChart = ({ data }: FinancialChartProps) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        No data available for the selected period
      </div>
    );
  }

  const maxValue = Math.max(
    ...data.map(d => Math.max(d.income, d.expenses)),
    0
  );
  const chartHeight = 300;
  const barWidth = Math.max(40, (800 - (data.length * 20)) / (data.length * 2));

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <div style={{ minWidth: `${data.length * (barWidth * 2 + 30)}px` }}>
          <div className="relative" style={{ height: `${chartHeight}px` }}>
            <div className="absolute inset-0 flex items-end justify-around gap-2 px-4">
              {data.map((item, index) => {
                const incomeHeight = maxValue > 0 ? (item.income / maxValue) * chartHeight : 0;
                const expenseHeight = maxValue > 0 ? (item.expenses / maxValue) * chartHeight : 0;

                return (
                  <div key={index} className="flex flex-col items-center gap-1" style={{ width: `${barWidth * 2 + 10}px` }}>
                    <div className="flex gap-1 items-end w-full justify-center">
                      <div className="relative group">
                        <div
                          className="bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg transition-all hover:from-emerald-600 hover:to-emerald-500"
                          style={{
                            width: `${barWidth}px`,
                            height: `${incomeHeight}px`,
                            minHeight: item.income > 0 ? '2px' : '0px',
                          }}
                        />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                          Income: ${item.income.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div className="relative group">
                        <div
                          className="bg-gradient-to-t from-red-500 to-red-400 rounded-t-lg transition-all hover:from-red-600 hover:to-red-500"
                          style={{
                            width: `${barWidth}px`,
                            height: `${expenseHeight}px`,
                            minHeight: item.expenses > 0 ? '2px' : '0px',
                          }}
                        />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                          Expenses: ${item.expenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="absolute inset-x-0 bottom-0 border-t-2 border-slate-300" />
            <div className="absolute inset-y-0 left-0 flex flex-col justify-between text-xs text-slate-500 pr-2" style={{ width: '60px' }}>
              <span>${(maxValue).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
              <span>${(maxValue * 0.75).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
              <span>${(maxValue * 0.5).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
              <span>${(maxValue * 0.25).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
              <span>$0</span>
            </div>
          </div>

          <div className="flex items-start justify-around gap-2 mt-3 px-4">
            {data.map((item, index) => (
              <div
                key={index}
                className="text-center text-xs text-slate-600 font-medium"
                style={{ width: `${barWidth * 2 + 10}px` }}
              >
                <div className="truncate">{item.month}</div>
                <div className={`text-xs font-bold mt-1 ${item.net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {item.net >= 0 ? '+' : ''}${item.net.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded"></div>
          <span className="text-sm text-slate-700">Income</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gradient-to-t from-red-500 to-red-400 rounded"></div>
          <span className="text-sm text-slate-700">Expenses</span>
        </div>
      </div>
    </div>
  );
};
