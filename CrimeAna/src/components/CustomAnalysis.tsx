import React, { useState } from 'react';
import { BarChart3, Settings } from 'lucide-react';
import { CrimeData, generateChartData } from '../utils/dataProcessor';
import { Bar, Pie } from 'react-chartjs-2';

interface CustomAnalysisProps {
  data: CrimeData[];
  headers: string[];
}

export const CustomAnalysis: React.FC<CustomAnalysisProps> = ({ data, headers }) => {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [analysisType, setAnalysisType] = useState<'bar' | 'pie'>('bar');

  const categoricalHeaders = headers.filter(header =>
    !['S.NO'].includes(header) &&
    typeof data[0]?.[header] !== 'number'
  );

  const handleColumnToggle = (column: string) => {
    setSelectedColumns(prev => {
      if (prev.includes(column)) {
        return prev.filter(c => c !== column);
      } else if (prev.length < 2) {
        return [...prev, column];
      } else {
        return [prev[1], column];
      }
    });
  };

  const generateCustomChart = () => {
    if (selectedColumns.length === 0) return null;

    const chartData = generateChartData(data, selectedColumns[0], selectedColumns[1]);

    if (selectedColumns.length === 1) {
      // Single column analysis
      const singleData = chartData as { labels: string[]; data: number[] };

      const chartConfig = {
        labels: singleData.labels,
        datasets: [
          {
            label: `Count by ${selectedColumns[0]}`,
            data: singleData.data,
            backgroundColor: analysisType === 'bar'
              ? 'rgba(59, 130, 246, 0.5)'
              : singleData.labels.map((_, i) =>
                `hsl(${(i * 360) / singleData.labels.length}, 70%, 60%)`
              ),
            borderColor: analysisType === 'bar'
              ? 'rgb(59, 130, 246)'
              : singleData.labels.map((_, i) =>
                `hsl(${(i * 360) / singleData.labels.length}, 70%, 50%)`
              ),
            borderWidth: 2,
          },
        ],
      };

      const options = {
        responsive: true,
        plugins: {
          legend: {
            position: 'top' as const,
          },
          title: {
            display: true,
            text: `${selectedColumns[0]} Analysis`,
          },
        },
        scales: analysisType === 'bar' ? {
          y: {
            beginAtZero: true,
          },
        } : undefined,
      };

      return analysisType === 'bar' ? (
        <Bar data={chartConfig} options={options} />
      ) : (
        <Pie data={chartConfig} options={options} />
      );
    }

    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Custom Analysis</h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Columns
            </label>
            <select
              multiple
              value={selectedColumns}
              onChange={(e) => {
                const selectedOptions = Array.from(e.target.selectedOptions, (opt) => opt.value);
                setSelectedColumns(selectedOptions.slice(-2)); // only keep last 2 selected
              }}
              className="w-full border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categoricalHeaders.map((header) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>

          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Chart Type
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="bar"
                  checked={analysisType === 'bar'}
                  onChange={(e) => setAnalysisType(e.target.value as 'bar' | 'pie')}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-sm text-gray-700">Bar Chart</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="pie"
                  checked={analysisType === 'pie'}
                  onChange={(e) => setAnalysisType(e.target.value as 'bar' | 'pie')}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-sm text-gray-700">Pie Chart</span>
              </label>
            </div>
          </div>

          {selectedColumns.length > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900 mb-1">Selected:</p>
              {selectedColumns.map((col, index) => (
                <p key={col} className="text-sm text-blue-700">
                  {index + 1}. {col}
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-3">
          {selectedColumns.length > 0 ? (
            <div className="h-96">
              {generateCustomChart()}
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">Select columns to generate analysis</p>
                <p className="text-sm text-gray-500 mt-1">Choose 1-2 columns from the left panel</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};