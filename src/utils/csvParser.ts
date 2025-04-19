
import { TableRow } from "@/types";

export const parseCSV = (csvContent: string): TableRow[] => {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map((line, index) => {
    const values = line.split(',');
    const data: Record<string, any> = {};
    
    headers.forEach((header, idx) => {
      data[header.trim()] = values[idx]?.trim() || '';
    });
    
    return {
      id: index + 1,
      number: data.numbers || '',
      name: '',  // This will be populated based on description
      description: data.description || '',
      partNumber: data['part no.'] || '',
    };
  });
};
