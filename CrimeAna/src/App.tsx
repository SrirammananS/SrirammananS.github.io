import React, { useState, useCallback, useMemo } from 'react';
import { Shield, Database, FileDown } from 'lucide-react';
import { FileUpload } from './components/FileUpload';
import { FilterPanel } from './components/FilterPanel';
import { KPICards } from './components/KPICards';
import { TopZonesCard } from './components/TopZonesCard';
import { Charts } from './components/Charts';
import { DataTable } from './components/DataTable';
import { CustomAnalysis } from './components/CustomAnalysis';
import { ReportGenerator } from './components/ReportGenerator';
import { parseCSV, getUniqueValues } from './utils/csvParser';
import { filterData, calculateKPIs, generateChartData } from './utils/dataProcessor';
import { CrimeData, FilterOptions, ActiveFilters } from './types';

function App() {
  const [data, setData] = useState<CrimeData[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fileInfo, setFileInfo] = useState<{
    name: string;
    size: number;
    lastModified: number;
    recordCount: number;
  } | null>(null);
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    years: [],
    zones: [],
    districts: [],
    policeStations: [],
    crimeTypes: [],
    accusedTypes: [],
    timeOccurrence: []
  });
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'charts' | 'table' | 'analysis'>('overview');
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const handleFileUpload = useCallback(async (file: File) => {
    setIsLoading(true);
    try {
      const result = await parseCSV(file);
      setData(result.data);
      setHeaders(result.headers);
      setFileInfo({
        name: file.name,
        size: file.size,
        lastModified: file.lastModified,
        recordCount: result.data.length
      });

      // Reset filters
      setActiveFilters({
        years: [],
        zones: [],
        districts: [],
        policeStations: [],
        crimeTypes: [],
        accusedTypes: [],
        timeOccurrence: []
      });
    } catch (error) {
      console.error('Error parsing CSV:', error);
      alert('Error parsing CSV file. Please check the file format.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const filterOptions: FilterOptions = useMemo(() => {
    if (data.length === 0) {
      return {
        years: [],
        zones: [],
        districts: [],
        policeStations: [],
        crimeTypes: [],
        accusedTypes: [],
        timeOccurrence: []
      };
    }

    return {
      years: getUniqueValues(data, 'YEAR'),
      zones: getUniqueValues(data, 'Zone'),
      districts: getUniqueValues(data, 'DISTRICT'),
      policeStations: getUniqueValues(data, 'PS'),
      crimeTypes: getUniqueValues(data, 'HEAD'),
      accusedTypes: getUniqueValues(data, 'Accused involved'),
      timeOccurrence: getUniqueValues(data, 'Occurrence time')
    };
  }, [data]);

  const filteredData = useMemo(() => {
    return filterData(data, activeFilters);
  }, [data, activeFilters]);

  const kpiData = useMemo(() => {
    return calculateKPIs(filteredData);
  }, [filteredData]);

  const chartData = useMemo(() => {
    const yearlyData = generateChartData(filteredData, 'YEAR') as { labels: string[]; data: number[] };
    const zoneData = generateChartData(filteredData, 'Zone') as { labels: string[]; data: number[] };
    const crimeTypeData = generateChartData(filteredData, 'HEAD') as { labels: string[]; data: number[] };
    const accusedTypeData = generateChartData(filteredData, 'Accused involved') as { labels: string[]; data: number[] };

    return {
      yearlyData,
      zoneData,
      crimeTypeData,
      accusedTypeData
    };
  }, [filteredData]);

  const handleFilterChange = useCallback((filterType: keyof ActiveFilters, values: string[]) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: values
    }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setActiveFilters({
      years: [],
      zones: [],
      districts: [],
      policeStations: [],
      crimeTypes: [],
      accusedTypes: [],
      timeOccurrence: []
    });
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview', count: kpiData.totalCases },
    { id: 'charts', label: 'Charts', count: chartData.yearlyData.labels.length },
    { id: 'table', label: 'Data Table', count: filteredData.length },
    { id: 'analysis', label: 'Custom Analysis', count: headers.length }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Crime Analytics Dashboard</h1>
                <p className="text-sm text-gray-600">Interactive data analysis and reporting</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Database className="h-4 w-4" />
              <span>{filteredData.length} records</span>
              {data.length > 0 && (
                <button
                  onClick={() => setIsReportModalOpen(true)}
                  className="ml-4 inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <FileDown className="h-4 w-4" />
                  Generate Report
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* File Upload */}
          <FileUpload
            onFileUpload={handleFileUpload}
            isLoading={isLoading}
            fileInfo={fileInfo}
          />

          {data.length > 0 && (
            <>
              {/* Filters */}
              <FilterPanel
                filterOptions={filterOptions}
                activeFilters={activeFilters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
                isCollapsed={isFiltersCollapsed}
                onToggleCollapse={() => setIsFiltersCollapsed(!isFiltersCollapsed)}
              />

              {/* Navigation Tabs */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="border-b border-gray-200">
                  <nav className="flex space-x-8 px-6" aria-label="Tabs">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                      >
                        {tab.label}
                        <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs">
                          {tab.count}
                        </span>
                      </button>
                    ))}
                  </nav>
                </div>

                <div className="p-6">
                  {activeTab === 'overview' && (
                    <div className="space-y-8">
                      <KPICards kpiData={kpiData} />
                      <TopZonesCard kpiData={kpiData} />
                    </div>
                  )}

                  {activeTab === 'charts' && (
                    <Charts
                      yearlyData={chartData.yearlyData}
                      zoneData={chartData.zoneData}
                      crimeTypeData={chartData.crimeTypeData}
                      accusedTypeData={chartData.accusedTypeData}
                    />
                  )}

                  {activeTab === 'table' && (
                    <DataTable data={filteredData} headers={headers} />
                  )}

                  {activeTab === 'analysis' && (
                    <CustomAnalysis data={filteredData} headers={headers} />
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* Report Generator Modal */}
      <ReportGenerator
        data={filteredData}
        kpiData={kpiData}
        activeFilters={activeFilters}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
}

export default App;