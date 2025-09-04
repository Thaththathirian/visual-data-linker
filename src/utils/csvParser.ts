import { TableRow } from "@/types";

export const parseCSV = async (csvContent: string): Promise<TableRow[]> => {
  console.log(`[CSV Parser] Starting to parse CSV with ${csvContent.length} characters`);

  const Papa = await import('papaparse');

  const lines = csvContent.trim().split('\n');
  console.log(`[CSV Parser] Found ${lines.length} lines`);

  if (lines.length === 0) return [];

  // Parse the header line using Papa Parse to handle quotes properly
  const parsedHeader = Papa.parse(lines[0]);
  const headers = parsedHeader.data[0] as string[];
  console.log(`[CSV Parser] Headers found:`, headers);

  // Find important column indexes
  const numberIndex = headers.findIndex(h => 
    h.toLowerCase() === 'number' || 
    h.toLowerCase() === 's.no.' || 
    h.toLowerCase() === 's.no' || 
    h.toLowerCase() === 'serial' || 
    h.toLowerCase() === 'serial no' || 
    h.toLowerCase() === 'serial no.' ||
    h.toLowerCase() === 'no'
  );
  const partNoIndex = headers.findIndex(h => /part\s*no/i.test(h));
  const descIndex = headers.findIndex(h => h.toLowerCase().includes('description'));
  const qtyIndex = headers.findIndex(h => 
    h.toLowerCase() === 'qty' || 
    h.toLowerCase() === 'quantity'
  );
  const nameIndex = headers.findIndex(h => h.toLowerCase() === 'name');

  console.log(`[CSV Parser] Column indexes - Number: ${numberIndex}, PartNo: ${partNoIndex}, Desc: ${descIndex}, Qty: ${qtyIndex}, Name: ${nameIndex}`);

  const dataRows = lines.slice(1)
    .map(line => line.trim())
    .filter(line => line.length > 0); // Skip empty lines

  console.log(`[CSV Parser] Data rows after filtering: ${dataRows.length}`);

  const processedRows = dataRows.map((line, index) => {
    console.log(`[CSV Parser] Processing line ${index + 1}: ${line}`);

    // Parse the CSV line properly handling quotes
    const parsedLine = Papa.parse(line);
    const values = parsedLine.data[0] as string[];
    console.log(`[CSV Parser] Parsed values for line ${index + 1}:`, values);

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

    console.log(`[CSV Parser] Created row ${index + 1}:`, row);

    // Add all other columns that aren't already mapped to standard fields
    headers.forEach((header) => {
      // Skip the standard fields we've already set
      if (!['id'].includes(header) && 
          !Object.keys(row).some(key => key.toLowerCase() === header.toLowerCase())) {
        row[header] = data[header];
      }
    });

    return row;
  });

  console.log(`[CSV Parser] Total processed rows: ${processedRows.length}`);

  const finalRows = processedRows.filter(row => row.number.trim() !== ''); // Skip rows with no number
  console.log(`[CSV Parser] Final rows after filtering empty numbers: ${finalRows.length}`);

  // Sort rows by their numeric order to ensure 1, 2, 3, 4... sequence
  const sortedRows = finalRows.sort((a, b) => {
    const aStr = a.number.toString();
    const bStr = b.number.toString();

    console.log(`[CSV Parser] Sorting: comparing "${aStr}" vs "${bStr}"`);

    // Extract the base number and any suffix
    const aMatch = aStr.match(/^(\d+)(.*)$/);
    const bMatch = bStr.match(/^(\d+)(.*)$/);

    if (!aMatch || !bMatch) {
      console.log(`[CSV Parser] Regex match failed for "${aStr}" or "${bStr}"`);
      return 0;
    }

    const aNum = parseInt(aMatch[1]);
    const bNum = parseInt(bMatch[1]);
    const aSuffix = aMatch[2];
    const bSuffix = bMatch[2];

    console.log(`[CSV Parser] Extracted: aNum=${aNum}, bNum=${bNum}, aSuffix="${aSuffix}", bSuffix="${bSuffix}"`);

    // If base numbers are different, sort by actual numeric value (not string)
    if (aNum !== bNum) {
      const result = aNum - bNum;
      console.log(`[CSV Parser] Different numbers: ${aNum} - ${bNum} = ${result}`);
      return result;
    }

    // If base numbers are the same, sort by suffix (empty suffix comes first)
    if (aSuffix === '' && bSuffix !== '') return -1;
    if (bSuffix === '' && aSuffix !== '') return 1;
    if (aSuffix === bSuffix) return 0;

    // Sort suffixes alphabetically
    return aSuffix.localeCompare(bSuffix);
  });

  console.log(`[CSV Parser] Sorted rows:`, sortedRows.map(row => row.number));

  return sortedRows;
};