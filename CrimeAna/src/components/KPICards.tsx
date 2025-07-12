import React from 'react';
import { TrendingUp, MapPin, Users, AlertTriangle, UserCheck, FileText } from 'lucide-react';
import { KPIData } from '../types';

interface KPICardsProps {
  kpiData: KPIData;
}

export const KPICards: React.FC<KPICardsProps> = ({ kpiData }) => {
  const cards = [
    {
      title: 'Total Cases',
      value: kpiData.totalCases.toLocaleString(),
      icon: FileText,
      color: 'blue',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      change: '+12%',
      trend: 'up'
    },
    {
      title: 'Districts Involved',
      value: kpiData.totalDistricts.toString(),
      icon: MapPin,
      color: 'emerald',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      change: '+5%',
      trend: 'up'
    },
    {
      title: 'Total Accused',
      value: kpiData.totalAccused.toLocaleString(),
      icon: Users,
      color: 'orange',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      change: '+8%',
      trend: 'up'
    },
    {
      title: 'Repeat Offenders',
      value: kpiData.repeatOffenders.toLocaleString(),
      icon: AlertTriangle,
      color: 'red',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      change: '-3%',
      trend: 'down'
    },
    {
      title: 'Arrested',
      value: kpiData.totalArrested.toLocaleString(),
      icon: UserCheck,
      color: 'indigo',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      change: '+15%',
      trend: 'up'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <div
            key={index}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <Icon className={`h-6 w-6 ${card.textColor}`} />
              </div>
              <div className={`flex items-center text-sm ${
                card.trend === 'up' ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp className={`h-4 w-4 mr-1 ${
                  card.trend === 'down' ? 'rotate-180' : ''
                }`} />
                {card.change}
              </div>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{card.value}</p>
              <p className="text-sm font-medium text-gray-600">{card.title}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};