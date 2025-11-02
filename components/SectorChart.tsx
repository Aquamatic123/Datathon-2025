import { Analytics } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SectorChartProps {
  analytics: Analytics | null;
}

export default function SectorChart({ analytics }: SectorChartProps) {
  const safeAnalytics = analytics || {
    totalLaws: 0,
    totalStocksImpacted: 0,
    sp500AffectedPercentage: 0,
    confidenceWeightedImpact: 0,
    averageImpactBySector: {},
  };

  const chartData = Object.entries(safeAnalytics.averageImpactBySector).map(([sector, impact]) => ({
    sector,
    impact: Number(typeof impact === 'number' ? impact.toFixed(2) : 0),
  }));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Average Impact by Sector
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="sector"
            angle={-45}
            textAnchor="end"
            height={80}
            fontSize={12}
          />
          <YAxis fontSize={12} />
          <Tooltip />
          <Bar dataKey="impact" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

