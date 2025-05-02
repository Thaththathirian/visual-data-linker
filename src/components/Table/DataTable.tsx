
import React from "react";
import { TableRow } from "@/types";
import { motion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow as ShadcnTableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DataTableProps {
  data: TableRow[];
  highlightedNumber: string | null;
  onRowClick: (number: string) => void;
  onRowHover: (number: string | null) => void;
}

const DataTable: React.FC<DataTableProps> = ({
  data,
  highlightedNumber,
  onRowClick,
  onRowHover,
}) => {
  console.log("DataTable rendering with data:", data);
  
  if (!data || data.length === 0) {
    return (
      <div className="p-4 text-center">
        <div className="mb-4 text-amber-600 font-semibold">No data available</div>
        <div className="text-gray-500 text-sm">
          <p>Possible reasons:</p>
          <ul className="list-disc list-inside mt-2">
            <li>The data file couldn't be located</li>
            <li>The file format is incorrect</li>
            <li>The file path is incorrect in the deployed environment</li>
          </ul>
          <p className="mt-4 text-xs">
            Check the deployment instructions to ensure all XLSX files are correctly copied to the public/tables directory.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <ScrollArea className="h-full">
      <Table>
        <TableHeader className="bg-gray-50 sticky top-0 z-10">
          <ShadcnTableRow>
            <TableHead className="text-xs font-medium py-2 h-8 whitespace-nowrap">#</TableHead>
            <TableHead className="text-xs font-medium py-2 h-8">Part #</TableHead>
            <TableHead className="text-xs font-medium py-2 h-8">Description</TableHead>
            <TableHead className="text-xs font-medium py-2 h-8">Qty</TableHead>
          </ShadcnTableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <motion.tr
              key={row.id}
              className={`cursor-pointer hover:bg-orange-50 ${
                highlightedNumber === row.number ? "!bg-orange-100" : ""
              }`}
              onMouseEnter={() => onRowHover(row.number)}
              onMouseLeave={() => onRowHover(null)}
              onClick={() => onRowClick(row.number)}
              initial={false}
              animate={{
                backgroundColor: highlightedNumber === row.number ? "rgba(251,146,60,0.2)" : "transparent"
              }}
              transition={{ duration: 0.15 }}
            >
              <TableCell className="font-medium whitespace-nowrap">{row.number}</TableCell>
              <TableCell>{row.partNumber}</TableCell>
              <TableCell>{row.description}</TableCell>
              <TableCell>{row.name}</TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};

export default DataTable;
