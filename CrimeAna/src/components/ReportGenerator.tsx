import React, { useState } from 'react';
import { FileDown, FileSpreadsheet, Settings, Download, Calendar, BarChart3, Table, TrendingUp } from 'lucide-react';
import { CrimeData, KPIData, ActiveFilters } from '../types';
import { ReportGenerator as ReportGen, ReportConfig } from '../utils/reportGenerator';

interface ReportGeneratorProps {
  data: CrimeData[];
  kpiData: KPIData;
  activeFilters: ActiveFilters;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportGenerator: React.FC<ReportGeneratorProps> = ({
  data,
  kpiData,
  activeFilters,
  isOpen,
  onClose
}) => {
  const [config, setConfig] = useState<ReportConfig>({
    title: 'Crime Data Analysis Report',
    includeCharts: true,
    includeTable: true,
    includeKPIs: true,
    includeSummary: true,
    tableLimit: 100
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      const generator = new ReportGen(data, kpiData, activeFilters, config);
      await generator.generatePDFReport();
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateExcel = () => {
    setIsGenerating(true);
    try {
      const generator = new ReportGen(data, kpiData, activeFilters, config);
      generator.generateExcelReport();
    } catch (error) {
      console.error('Error generating Excel:', error);
      alert('Error generating Excel report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const updateConfig = (key: keyof ReportConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileDown className="h-6 w-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Generate Report</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Create comprehensive reports based on your current data and filters
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Report Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Report Configuration
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Report Title
              </label>
              <input
                type="text"
                value={config.title}
                onChange={(e) => updateConfig('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter report title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Include Sections
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.includeKPIs}
                    onChange={(e) => updateConfig('includeKPIs', e.target.checked)}
                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">KPI Summary</span>
                  </div>
                </label>

                <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.includeSummary}
                    onChange={(e) => updateConfig('includeSummary', e.target.checked)}
                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium">Executive Summary</span>
                  </div>
                </label>

                <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.includeCharts}
                    onChange={(e) => updateConfig('includeCharts', e.target.checked)}
                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium">Charts & Graphs</span>
                  </div>
                </label>

                <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.includeTable}
                    onChange={(e) => updateConfig('includeTable', e.target.checked)}
                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex items-center gap-2">
                    <Table className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium">Data Table</span>
                  </div>
                </label>
              </div>
            </div>

            {config.includeTable && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Table Row Limit (for PDF)
                </label>
                <select
                  value={config.tableLimit}
                  onChange={(e) => updateConfig('tableLimit', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value={50}>50 rows</option>
                  <option value={100}>100 rows</option>
                  <option value={250}>250 rows</option>
                  <option value={500}>500 rows</option>
                  <option value={0}>All rows</option>
                </select>
              </div>
            )}
          </div>

          {/* Current Data Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Current Data Summary</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Records:</span>
                <span className="font-medium ml-2">{data.length.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-600">Total Districts:</span>
                <span className="font-medium ml-2">{kpiData.totalDistricts}</span>
              </div>
              <div>
                <span className="text-gray-600">Active Filters:</span>
                <span className="font-medium ml-2">
                  {Object.values(activeFilters).reduce((sum, filters) => sum + filters.length, 0)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Top Zone:</span>
                <span className="font-medium ml-2">{kpiData.topZones[0]?.zone || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Generate Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleGeneratePDF}
              disabled={isGenerating}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FileDown className="h-5 w-5" />
              {isGenerating ? 'Generating...' : 'Generate PDF'}
            </button>

            <button
              onClick={handleGenerateExcel}
              disabled={isGenerating}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FileSpreadsheet className="h-5 w-5" />
              {isGenerating ? 'Generating...' : 'Generate Excel'}
            </button>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            <p>• PDF reports include formatted tables, charts, and executive summaries</p>
            <p>• Excel reports contain multiple sheets with raw data and analytics</p>
            <p>• All current filters and data selections will be included in the report</p>
          </div>
        </div>
      </div>
    </div>
  );
};