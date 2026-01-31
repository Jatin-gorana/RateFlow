import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ChartDataPoint } from '../types';
import { format } from 'date-fns';

interface YieldChartProps {
  data: ChartDataPoint[];
  timeframe: string;
}

const YieldChart: React.FC<YieldChartProps> = ({ data, timeframe }) => {
  const formatXAxisLabel = (tickItem: string) => {
    const date = new Date(tickItem);
    switch (timeframe) {
      case '1h':
        return format(date, 'HH:mm');
      case '24h':
        return format(date, 'HH:mm');
      case '7d':
        return format(date, 'MM/dd');
      case '30d':
        return format(date, 'MM/dd');
      default:
        return format(date, 'HH:mm');
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm text-gray-600 mb-2">
            {format(new Date(label), 'MMM dd, yyyy HH:mm')}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(4)}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Yield History ({timeframe})
      </h3>
      
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis
            dataKey="timestamp"
            tickFormatter={formatXAxisLabel}
            stroke="#64748b"
            fontSize={12}
          />
          <YAxis
            stroke="#64748b"
            fontSize={12}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Line
            type="monotone"
            dataKey="supplyAPY"
            stroke="#22c55e"
            strokeWidth={2}
            dot={false}
            name="Supply APY"
          />
          <Line
            type="monotone"
            dataKey="borrowAPY"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={false}
            name="Borrow APY"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default YieldChart;