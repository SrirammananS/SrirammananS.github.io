export interface CrimeData {
  [key: string]: string | number;
  'S.NO': number;
  'Zone': string;
  'DISTRICT': string;
  'YEAR': number;
  'HEAD': string;
  'PS': string;
  'TIME': string;
  'Accused involved': string;
  'Goondas': string;
  'HS': string;
  'Occurrence time': string;
  'Accused Age': string;
}

export interface FilterOptions {
  years: string[];
  zones: string[];
  districts: string[];
  policeStations: string[];
  crimeTypes: string[];
  accusedTypes: string[];
  timeOccurrence: string[];
}

export interface ActiveFilters {
  years: string[];
  zones: string[];
  districts: string[];
  policeStations: string[];
  crimeTypes: string[];
  accusedTypes: string[];
  timeOccurrence: string[];
}

export interface KPIData {
  totalCases: number;
  totalDistricts: number;
  topZones: { zone: string; count: number; }[];
  repeatOffenders: number;
  totalAccused: number;
  totalArrested: number;
}