interface CategoryData {
  category: string;
  amount: number;
  count: number;
}

interface CategoryBreakdownProps {
  data: CategoryData[];
  type: 'income' | 'expense';
}

export const CategoryBreakdown = ({ data, type }: CategoryBreakdownProps) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        No {type} data available for the selected period
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.amount, 0);
  const colors = type === 'income'
    ? ['bg-emerald-500', 'bg-emerald-400', 'bg-emerald-300', 'bg-emerald-200', 'bg-emerald-100']
    : ['bg-red-500', 'bg-red-400', 'bg-red-300', 'bg-red-200', 'bg-red-100'];

  const pieColors = type === 'income'
    ? ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5']
    : ['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2'];

  const generatePieChart = () => {
    let currentAngle = 0;
    const radius = 100;
    const centerX = 120;
    const centerY = 120;

    return data.map((item, index) => {
      const percentage = (item.amount / total) * 100;
      const angle = (percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;

      currentAngle = endAngle;

      const x1 = centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180);
      const y1 = centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180);
      const x2 = centerX + radius * Math.cos((endAngle - 90) * Math.PI / 180);
      const y2 = centerY + radius * Math.sin((endAngle - 90) * Math.PI / 180);

      const largeArc = angle > 180 ? 1 : 0;

      return (
        <g key={index}>
          <path
            d={`M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`}
            fill={pieColors[index % pieColors.length]}
            className="transition-opacity hover:opacity-80 cursor-pointer"
          >
            <title>{item.category}: ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({percentage.toFixed(1)}%)</title>
          </path>
        </g>
      );
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="flex items-center justify-center">
          <svg width="240" height="240" viewBox="0 0 240 240">
            {generatePieChart()}
            <circle
              cx="120"
              cy="120"
              r="60"
              fill="white"
              className="drop-shadow-lg"
            />
            <text
              x="120"
              y="115"
              textAnchor="middle"
              className="text-sm font-medium fill-slate-600"
            >
              Total {type === 'income' ? 'Income' : 'Expenses'}
            </text>
            <text
              x="120"
              y="135"
              textAnchor="middle"
              className="text-xl font-bold fill-slate-900"
            >
              ${total.toLocaleString('en-US', { maximumFractionDigits: 0 })}
            </text>
          </svg>
        </div>

        <div className="space-y-3">
          {data.map((item, index) => {
            const percentage = ((item.amount / total) * 100).toFixed(1);
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 rounded ${colors[index % colors.length]}`}></div>
                    <span className="text-sm font-medium text-slate-900 capitalize">
                      {item.category}
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900">
                    ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="ml-7">
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-1">
                    <span>{item.count} transaction{item.count !== 1 ? 's' : ''}</span>
                    <span>{percentage}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${colors[index % colors.length]} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-50 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-slate-900 mb-3">Summary Statistics</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-slate-600">Total Amount</p>
            <p className="text-lg font-bold text-slate-900">
              ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-600">Categories</p>
            <p className="text-lg font-bold text-slate-900">{data.length}</p>
          </div>
          <div>
            <p className="text-xs text-slate-600">Transactions</p>
            <p className="text-lg font-bold text-slate-900">
              {data.reduce((sum, item) => sum + item.count, 0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-600">Average</p>
            <p className="text-lg font-bold text-slate-900">
              ${(total / data.reduce((sum, item) => sum + item.count, 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
