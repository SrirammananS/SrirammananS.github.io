import { CrimeData, ActiveFilters, KPIData } from '../types';

export const filterData = (data: CrimeData[], filters: ActiveFilters): CrimeData[] => {
  return data.filter(row => {
    return (
      (filters.years.length === 0 || filters.years.includes(String(row.YEAR))) &&
      (filters.zones.length === 0 || filters.zones.includes(String(row.Zone))) &&
      (filters.districts.length === 0 || filters.districts.includes(String(row.DISTRICT))) &&
      (filters.policeStations.length === 0 || filters.policeStations.includes(String(row.PS))) &&
      (filters.crimeTypes.length === 0 || filters.crimeTypes.includes(String(row.HEAD))) &&
      (filters.accusedTypes.length === 0 || filters.accusedTypes.includes(String(row['Accused involved']))) &&
      (filters.timeOccurrence.length === 0 || filters.timeOccurrence.includes(String(row['Occurrence time'])))
    );
  });
};

export const calculateKPIs = (data: CrimeData[]): KPIData => {
  const totalCases = data.length;
  const totalDistricts = new Set(data.map(row => row.DISTRICT)).size;
  
  // Top 5 zones by volume
  const zoneCounts: { [key: string]: number } = {};
  data.forEach(row => {
    const zone = String(row.Zone);
    zoneCounts[zone] = (zoneCounts[zone] || 0) + 1;
  });
  
  const topZones = Object.entries(zoneCounts)
    .map(([zone, count]) => ({ zone, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  // Count repeat offenders (HS === 'Yes' or Goondas === 'Yes')
  const repeatOffenders = data.filter(row => 
    String(row.HS).toLowerCase() === 'yes' || 
    String(row.Goondas).toLowerCase() === 'yes'
  ).length;
  
  // Total accused and arrested (simplified calculation)
  const totalAccused = data.reduce((sum, row) => {
    const accusedCount = parseInt(String(row['TOTAL NUMBER OF ACCUSED'])) || 1;
    return sum + accusedCount;
  }, 0);
  
  const totalArrested = data.filter(row => 
    String(row['ACCUSED ARRESTED ON THE SAME DAY']).toLowerCase() === 'yes'
  ).length;
  
  return {
    totalCases,
    totalDistricts,
    topZones,
    repeatOffenders,
    totalAccused,
    totalArrested
  };
};

export const generateChartData = (data: CrimeData[], xColumn: string, yColumn?: string) => {
  if (!yColumn) {
    // Simple count by column
    const counts: { [key: string]: number } = {};
    data.forEach(row => {
      const key = String(row[xColumn]);
      counts[key] = (counts[key] || 0) + 1;
    });
    
    return {
      labels: Object.keys(counts),
      data: Object.values(counts)
    };
  } else {
    // Cross-tabulation
    const matrix: { [key: string]: { [key: string]: number } } = {};
    data.forEach(row => {
      const x = String(row[xColumn]);
      const y = String(row[yColumn]);
      
      if (!matrix[x]) matrix[x] = {};
      matrix[x][y] = (matrix[x][y] || 0) + 1;
    });
    
    return matrix;
  }
};