
import { TableRow } from "@/types";

export const parseCSV = (csvContent: string): TableRow[] => {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const tableRow: Record<string, any> = {};
    
    headers.forEach((header, index) => {
      tableRow[header] = values[index];
    });
    
    return {
      id: parseInt(tableRow.id),
      number: tableRow.number,
      name: tableRow.name,
      description: tableRow.description,
      partNumber: tableRow.partNumber,
    };
  });
};
