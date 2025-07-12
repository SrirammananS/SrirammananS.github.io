import React from 'react';
import { Filter, X } from 'lucide-react';
import { FilterOptions, ActiveFilters } from '../types';

interface FilterPanelProps {
  filterOptions: FilterOptions;
  activeFilters: ActiveFilters;
  onFilterChange: (filterType: keyof ActiveFilters, values: string[]) => void;
  onClearFilters: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filterOptions,
  activeFilters,
  onFilterChange,
  onClearFilters,
  isCollapsed,
  onToggleCollapse
}) => {
  const filterConfigs = [
    { key: 'years' as const, label: 'Year', options: filterOptions.years },
    { key: 'zones' as const, label: 'Zone', options: filterOptions.zones },
    { key: 'districts' as const, label: 'District', options: filterOptions.districts },
    { key: 'policeStations' as const, label: 'Police Station', options: filterOptions.policeStations },
    { key: 'crimeTypes' as const, label: 'Crime Type', options: filterOptions.crimeTypes },
    { key: 'accusedTypes' as const, label: 'Accused Type', options: filterOptions.accusedTypes },
    { key: 'timeOccurrence' as const, label: 'Time of Occurrence', options: filterOptions.timeOccurrence }
  ];

  const handleSelectChange = (filterType: keyof ActiveFilters, value: string) => {
    const currentValues = activeFilters[filterType];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    onFilterChange(filterType, newValues);
  };

  const getTotalActiveFilters = () => {
    return Object.values(activeFilters).reduce((sum, filters) => sum + filters.length, 0);
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 transition-all duration-300 ${
      isCollapsed ? 'h-16' : 'h-auto'
    }`}>
      <div 
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center gap-3">
          <Filter className="h-5 w-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
          {getTotalActiveFilters() > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {getTotalActiveFilters()} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {getTotalActiveFilters() > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClearFilters();
              }}
              className="text-sm text-red-600 hover:text-red-700 px-2 py-1 rounded hover:bg-red-50 transition-colors"
            >
              Clear All
            </button>
          )}
          <div className={`transform transition-transform duration-200 ${isCollapsed ? '' : 'rotate-180'}`}>
            ▼
          </div>
        </div>
      </div>

      {!isCollapsed && (
        <div className="px-4 pb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filterConfigs.map(({ key, label, options }) => (
              <div key={key} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">{label}</label>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md bg-white">
                  {options.slice(0, 50).map((option) => (
                    <label
                      key={option}
                      className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={activeFilters[key].includes(option)}
                        onChange={() => handleSelectChange(key, option)}
                        className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="truncate" title={option}>{option}</span>
                    </label>
                  ))}
                  {options.length > 50 && (
                    <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50">
                      +{options.length - 50} more options...
                    </div>
                  )}
                </div>
                {activeFilters[key].length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {activeFilters[key].slice(0, 3).map((value) => (
                      <span
                        key={value}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {value.length > 15 ? `${value.substring(0, 15)}...` : value}
                        <button
                          onClick={() => handleSelectChange(key, value)}
                          className="hover:bg-blue-200 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    {activeFilters[key].length > 3 && (
                      <span className="text-xs text-gray-500 px-2 py-1">
                        +{activeFilters[key].length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};