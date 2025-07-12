import React from 'react';
import { TrendingUp } from 'lucide-react';
import { KPIData } from '../types';

interface TopZonesCardProps {
  kpiData: KPIData;
}

export const TopZonesCard: React.FC<TopZonesCardProps> = ({ kpiData }) => {
  const maxCount = Math.max(...kpiData.topZones.map(zone => zone.count));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Top 5 Zones by Volume</h3>
      </div>
      
      <div className="space-y-4">
        {kpiData.topZones.map((zone, index) => {
          const percentage = (zone.count / maxCount) * 100;
          return (
            <div key={zone.zone} className="flex items-center gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">{index + 1}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">{zone.zone}</span>
                  <span className="text-sm text-gray-600">{zone.count} cases</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};