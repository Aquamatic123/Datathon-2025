import { Analytics } from '@/types';
import { TrendingUp, Building2, BarChart3, Target } from 'lucide-react';

interface AnalyticsCardsProps {
  analytics: Analytics;
}

export default function AnalyticsCards({ analytics }: AnalyticsCardsProps) {
  const cards = [
    {
      title: 'Total Laws',
      value: analytics.totalLaws,
      icon: Building2,
      color: 'bg-blue-500',
    },
    {
      title: 'Stocks Impacted',
      value: analytics.totalStocksImpacted,
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      title: 'SP500 Affected',
      value: `${analytics.sp500AffectedPercentage.toFixed(2)}%`,
      icon: BarChart3,
      color: 'bg-purple-500',
    },
    {
      title: 'Avg Impact Score',
      value: analytics.confidenceWeightedImpact.toFixed(2),
      icon: Target,
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {card.value}
                </p>
              </div>
              <div className={`${card.color} p-3 rounded-lg`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

