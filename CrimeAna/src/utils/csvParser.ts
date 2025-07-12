import Papa from 'papaparse';
import { CrimeData } from '../types';

export const parseCSV = (file: File): Promise<{ data: CrimeData[]; headers: string[] }> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transform: (value, header) => {
        // Auto-detect and transform data types
        if (header === 'S.NO' || header === 'YEAR') {
          const num = parseInt(value);
          return isNaN(num) ? value : num;
        }
        return value.trim();
      },
      complete: (results) => {
        if (results.errors.length > 0) {
          reject(results.errors);
        } else {
          const data = results.data as CrimeData[];
          const headers = results.meta.fields || [];
          resolve({ data, headers });
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
};

export const detectColumnTypes = (data: CrimeData[], headers: string[]) => {
  const types: { [key: string]: 'date' | 'categorical' | 'numerical' } = {};
  
  headers.forEach(header => {
    const sample = data.slice(0, 10).map(row => row[header]);
    
    // Check if numerical
    if (sample.every(val => !isNaN(Number(val)) && val !== '')) {
      types[header] = 'numerical';
    }
    // Check if date-like
    else if (header.toLowerCase().includes('date') || header.toLowerCase().includes('time')) {
      types[header] = 'date';
    }
    // Default to categorical
    else {
      types[header] = 'categorical';
    }
  });
  
  return types;
};

export const getUniqueValues = (data: CrimeData[], column: string): string[] => {
  const values = data.map(row => String(row[column])).filter(val => val && val.trim() !== '');
  return [...new Set(values)].sort();
};