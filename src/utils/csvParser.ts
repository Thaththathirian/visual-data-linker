import { TableRow, IntelliPartsItem } from "@/types";

export const parseIntelliPartsCSV = async (csvContent: string): Promise<IntelliPartsItem[]> => {
  console.log(`[IntelliParts CSV Parser] Starting to parse CSV with ${csvContent.length} characters`);

  const Papa = await import('papaparse');

  const lines = csvContent.trim().split('\n');
  console.log(`[IntelliParts CSV Parser] Found ${lines.length} lines`);

  if (lines.length === 0) return [];

  // Parse the header line using Papa Parse to handle quotes properly
  const parsedHeader = Papa.parse(lines[0]);
  const headers = parsedHeader.data[0] as string[];
  console.log(`[IntelliParts CSV Parser] Headers found:`, headers);

  const dataRows = lines.slice(1)
    .map(line => line.trim())
    .filter(line => line.length > 0); // Skip empty lines

  console.log(`[IntelliParts CSV Parser] Data rows after filtering: ${dataRows.length}`);

  const processedRows = dataRows.map((line, index) => {
    console.log(`[IntelliParts CSV Parser] Processing line ${index + 1}: ${line}`);

    // Parse the CSV line properly handling quotes
    const parsedLine = Papa.parse(line);
    const values = parsedLine.data[0] as string[];
    console.log(`[IntelliParts CSV Parser] Parsed values for line ${index + 1}:`, values);

    const data: Record<string, any> = {};

    // Map values to columns
    headers.forEach((header, idx) => {
      if (idx < values.length) {
        data[header] = values[idx] || '';
      } else {
        data[header] = '';
      }
    });

    // Create IntelliPartsItem with proper field mapping
    // Handle different column name variations
    const item: IntelliPartsItem = {
      category: data.category || data.Category || '',
      sub_category: data['Sub-Category'] || data.sub_category || data.Sub_Category || '',
      machine_name: data.MachineName || data.machine_name || data.Machine_Name || '',
      sparepartspage_name: data.sparepartspage_nam || data.sparepartspage_name || data.SparePartsPage_Name || '',
      sparepartspage_path: data.sparepartspage_path || data.SparePartsPage_Path || '',
      related_machines: data.related_machines || data.Related_Machines || '',
      other_pages: data.Other_Pages || data.other_pages || data.OtherPages || '',
      brand: data.Brand || data.brand || ''
    };

    console.log(`[IntelliParts CSV Parser] Created item ${index + 1}:`, item);
    return item;
  });

  console.log(`[IntelliParts CSV Parser] Total processed items: ${processedRows.length}`);
  
  // Debug: Check if we have categories and subcategories
  const categories = [...new Set(processedRows.map(item => item.category))];
  const subcategories = [...new Set(processedRows.map(item => item.sub_category).filter(Boolean))];
  const machines = [...new Set(processedRows.map(item => item.machine_name).filter(Boolean))];
  
  console.log(`[IntelliParts CSV Parser] Found categories:`, categories);
  console.log(`[IntelliParts CSV Parser] Found subcategories:`, subcategories);
  console.log(`[IntelliParts CSV Parser] Found machines:`, machines);
  console.log(`[IntelliParts CSV Parser] Sample items:`, processedRows.slice(0, 3));
  
  return processedRows;
};

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

  // If no headers found, assume standard order: number, part_number, description, quantity
  const hasHeaders = headers.length > 0 && headers.some(h => h.trim() !== '');
  let finalNumberIndex = numberIndex;
  let finalPartNoIndex = partNoIndex;
  let finalDescIndex = descIndex;
  let finalQtyIndex = qtyIndex;
  let finalNameIndex = nameIndex;

  if (!hasHeaders || (numberIndex === -1 && partNoIndex === -1 && descIndex === -1)) {
    console.log(`[CSV Parser] No recognizable headers found, assuming standard order: number, part_number, description, quantity`);
    // Assume standard order: number, part_number, description, quantity
    finalNumberIndex = 0;
    finalPartNoIndex = 1;
    finalDescIndex = 2;
    finalQtyIndex = 3;
    finalNameIndex = -1;
  }

  console.log(`[CSV Parser] Column indexes - Number: ${finalNumberIndex}, PartNo: ${finalPartNoIndex}, Desc: ${finalDescIndex}, Qty: ${finalQtyIndex}, Name: ${finalNameIndex}`);

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
    const qtyValue = finalQtyIndex >= 0 && finalQtyIndex < values.length ? values[finalQtyIndex] : data.Qty || data.qty || data.Quantity || data.quantity || '';
    const nameValue = finalNameIndex >= 0 && finalNameIndex < values.length ? values[finalNameIndex] : '';

    // Create the base TableRow with required fields
    const row: TableRow & Record<string, any> = {
      id: index + 1,
      number: finalNumberIndex >= 0 && finalNumberIndex < values.length ? values[finalNumberIndex] : data.Number || data.number || '',
      name: qtyValue || nameValue, // Use qty as the name for display purposes, fall back to actual name if no qty
      description: finalDescIndex >= 0 && finalDescIndex < values.length ? values[finalDescIndex] : data.Description || data.description || '',
      partNumber: finalPartNoIndex >= 0 && finalPartNoIndex < values.length ? values[finalPartNoIndex] : data['Part No.'] || data['part no.'] || data['part no'] || data['Part No'] || '',
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