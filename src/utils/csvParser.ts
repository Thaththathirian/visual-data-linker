
import { TableRow } from "@/types";

export const parseCSV = (csvContent: string): TableRow[] => {
  const lines = csvContent.trim().split('\n');
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(header => header.trim());
  
  // Find important column indexes
  const numberIndex = headers.findIndex(h => h.toLowerCase() === 'number');
  const partNoIndex = headers.findIndex(h => /part\s*no/i.test(h));
  const descIndex = headers.findIndex(h => h.toLowerCase().includes('description'));
  const nameOrQtyIndex = headers.findIndex(h => 
    h.toLowerCase() === 'name' || 
    h.toLowerCase() === 'qty' || 
    h.toLowerCase() === 'quantity'
  );
  
  return lines.slice(1)
    .map(line => line.trim())
    .filter(line => line.length > 0) // Skip empty lines
    .map((line, index) => {
      const values = line.split(',').map(val => val.trim());
      const data: Record<string, any> = {};
      
      // Map values to columns
      headers.forEach((header, idx) => {
        if (idx < values.length) {
          data[header] = values[idx] || '';
        } else {
          data[header] = '';
        }
      });
      
      // Create TableRow with appropriate field mapping
      return {
        id: index + 1,
        number: numberIndex >= 0 && numberIndex < values.length ? values[numberIndex] : data.Number || data.number || '',
        name: nameOrQtyIndex >= 0 && nameOrQtyIndex < values.length ? values[nameOrQtyIndex] : data.Qty || data.qty || data.Quantity || data.quantity || '',
        description: descIndex >= 0 && descIndex < values.length ? values[descIndex] : data.Description || data.description || '',
        partNumber: partNoIndex >= 0 && partNoIndex < values.length ? values[partNoIndex] : data['Part No.'] || data['part no.'] || data['part no'] || data['Part No'] || '',
      };
    })
    .filter(row => row.number.trim() !== ''); // Skip rows with no number
};
