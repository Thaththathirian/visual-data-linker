
import React, { useRef, useEffect } from "react";
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
}

const DataTable: React.FC<DataTableProps> = ({
  data,
  highlightedNumber,
  onRowClick,
}) => {
  const handleRowHover = (number: string) => {
    onRowClick(number);
  };

  const handleRowLeave = () => {
    onRowClick('');
  };

  return (
    <ScrollArea className="h-full border rounded-lg">
      <Table>
        <TableHeader className="bg-gray-50 sticky top-0 z-10">
          <ShadcnTableRow className="h-6">
            <TableHead className="text-xs font-medium h-6 py-1">#</TableHead>
            <TableHead className="text-xs font-medium h-6 py-1">Part #</TableHead>
            <TableHead className="text-xs font-medium h-6 py-1">Description</TableHead>
            <TableHead className="text-xs font-medium h-6 py-1">Qty</TableHead>
          </ShadcnTableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <motion.tr
              key={row.id}
              className={`cursor-pointer hover:bg-gray-50 ${
                highlightedNumber === row.number ? "bg-blue-50" : ""
              }`}
              onMouseEnter={() => handleRowHover(row.number)}
              onMouseLeave={handleRowLeave}
              initial={false}
              animate={{
                backgroundColor: highlightedNumber === row.number ? "rgba(59, 130, 246, 0.1)" : "transparent"
              }}
              transition={{ duration: 0.2 }}
            >
              <TableCell className="font-medium">{row.number}</TableCell>
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
