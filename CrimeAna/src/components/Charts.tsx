import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { BarChart3, PieChart, TrendingUp } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement
);

interface ChartData {
  labels: string[];
  data: number[];
}

interface ChartsProps {
  yearlyData: ChartData;
  zoneData: ChartData;
  crimeTypeData: ChartData;
  accusedTypeData: ChartData;
}

export const Charts: React.FC<ChartsProps> = ({
  yearlyData,
  zoneData,
  crimeTypeData,
  accusedTypeData
}) => {
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  };

  const barData = {
    labels: yearlyData.labels,
    datasets: [
      {
        label: 'Cases by Year',
        data: yearlyData.data,
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
      },
    ],
  };

  const zoneBarData = {
    labels: zoneData.labels,
    datasets: [
      {
        label: 'Cases by Zone',
        data: zoneData.data,
        backgroundColor: 'rgba(16, 185, 129, 0.5)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
      },
    ],
  };

  const crimeTypePieData = {
    labels: crimeTypeData.labels,
    datasets: [
      {
        data: crimeTypeData.data,
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(16, 185, 129)',
          'rgb(249, 115, 22)',
          'rgb(239, 68, 68)',
          'rgb(139, 92, 246)',
          'rgb(236, 72, 153)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const accusedTypePieData = {
    labels: accusedTypeData.labels,
    datasets: [
      {
        data: accusedTypeData.data,
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 191, 36, 0.8)',
        ],
        borderColor: [
          'rgb(239, 68, 68)',
          'rgb(34, 197, 94)',
          'rgb(251, 191, 36)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const lineData = {
    labels: yearlyData.labels,
    datasets: [
      {
        label: 'Crime Trend',
        data: yearlyData.data,
        borderColor: 'rgb(249, 115, 22)',
        backgroundColor: 'rgba(249, 115, 22, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Yearly Bar Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Cases by Year</h3>
        </div>
        <div className="h-80">
          <Bar data={barData} options={chartOptions} />
        </div>
      </div>

      {/* Zone Bar Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="h-5 w-5 text-emerald-600" />
          <h3 className="text-lg font-semibold text-gray-900">Cases by Zone</h3>
        </div>
        <div className="h-80">
          <Bar data={zoneBarData} options={chartOptions} />
        </div>
      </div>

      {/* Crime Type Pie Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <PieChart className="h-5 w-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">Crime Type Distribution</h3>
        </div>
        <div className="h-80">
          <Pie data={crimeTypePieData} options={pieOptions} />
        </div>
      </div>

      {/* Trend Line Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingUp className="h-5 w-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">Crime Trend Over Years</h3>
        </div>
        <div className="h-80">
          <Line data={lineData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};