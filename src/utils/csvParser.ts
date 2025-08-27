import { TableRow } from "@/types";
import Papa from "papaparse";

export const parseCSV = (csvContent: string): TableRow[] => {
  const lines = csvContent.trim().split('\n');
  if (lines.length === 0) return [];
  
  // Parse the header line using Papa Parse to handle quotes properly
  const parsedHeader = Papa.parse(lines[0]);
  const headers = parsedHeader.data[0] as string[];
  
  // Find important column indexes
  const numberIndex = headers.findIndex(h => 
    h.toLowerCase() === 'number' || 
    h.toLowerCase() === 's.no.' || 
    h.toLowerCase() === 'sno' ||
    h.toLowerCase() === 'no.'
  );
  const partNoIndex = headers.findIndex(h => /part\s*no/i.test(h));
  const descIndex = headers.findIndex(h => h.toLowerCase().includes('description'));
  const qtyIndex = headers.findIndex(h => 
    h.toLowerCase() === 'qty' || 
    h.toLowerCase() === 'quantity'
  );
  const nameIndex = headers.findIndex(h => h.toLowerCase() === 'name');
  
  console.log(`📊 CSV Headers:`, headers);
  console.log(`📊 Column indexes:`, {
    number: numberIndex,
    partNo: partNoIndex,
    description: descIndex,
    qty: qtyIndex,
    name: nameIndex
  });
  
  // Debug: Show what we found for each column
  if (numberIndex >= 0) console.log(`📊 Found number column: "${headers[numberIndex]}" at index ${numberIndex}`);
  if (partNoIndex >= 0) console.log(`📊 Found part number column: "${headers[partNoIndex]}" at index ${partNoIndex}`);
  if (descIndex >= 0) console.log(`📊 Found description column: "${headers[descIndex]}" at index ${descIndex}`);
  if (qtyIndex >= 0) console.log(`📊 Found qty column: "${headers[qtyIndex]}" at index ${qtyIndex}`);
  if (nameIndex >= 0) console.log(`📊 Found name column: "${headers[nameIndex]}" at index ${nameIndex}`);
  
  return lines.slice(1)
    .map(line => line.trim())
    .filter(line => line.length > 0) // Skip empty lines
    .map((line, index) => {
      // Parse the CSV line properly handling quotes
      const parsedLine = Papa.parse(line);
      const values = parsedLine.data[0] as string[];
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
      // For 'name' field, prioritize Qty/Quantity if available, otherwise use Name
      const qtyValue = qtyIndex >= 0 && qtyIndex < values.length ? values[qtyIndex] : data.Qty || data.qty || data.Quantity || data.quantity || '';
      const nameValue = nameIndex >= 0 && nameIndex < values.length ? values[nameIndex] : '';
      
      // Create the base TableRow with required fields
      const row: TableRow & Record<string, any> = {
        id: index + 1,
        number: numberIndex >= 0 && numberIndex < values.length ? values[numberIndex] : data.Number || data.number || '',
        name: qtyValue || nameValue, // Use qty as the name for display purposes, fall back to actual name if no qty
        description: descIndex >= 0 && descIndex < values.length ? values[descIndex] : data.Description || data.description || '',
        partNumber: partNoIndex >= 0 && partNoIndex < values.length ? values[partNoIndex] : data['Part No.'] || data['part no.'] || data['part no'] || data['Part No'] || '',
      };
      
      // Add all other columns that aren't already mapped to standard fields
      headers.forEach((header) => {
        // Skip the standard fields we've already set
        if (!['id'].includes(header) && 
            !Object.keys(row).some(key => key.toLowerCase() === header.toLowerCase())) {
          row[header] = data[header];
        }
      });
      
      return row;
    })
    .filter(row => row.number.trim() !== ''); // Skip rows with no number
};