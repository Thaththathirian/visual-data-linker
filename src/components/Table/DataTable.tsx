
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
  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

  // Scroll to highlighted row without affecting page scroll
  useEffect(() => {
    if (highlightedNumber && rowRefs.current.has(highlightedNumber)) {
      const row = rowRefs.current.get(highlightedNumber);
      if (row) {
        const scrollArea = row.closest('.scrollarea-viewport');
        if (scrollArea) {
          row.scrollIntoView({ behavior: 'auto', block: 'nearest' });
        }
      }
    }
  }, [highlightedNumber]);

  const handleRowMouseEnter = (number: string) => {
    // This will be handled by parent component
    onRowClick(number);
  };

  const handleRowMouseLeave = () => {
    // Reset highlighting by passing null
    onRowClick('');
  };

  return (
    <ScrollArea className="h-full border rounded-lg scrollarea-viewport">
      <Table>
        <TableHeader className="bg-gray-50 sticky top-0 z-10">
          <ShadcnTableRow className="h-8">
            <TableHead className="text-xs font-medium h-8 py-1">#</TableHead>
            <TableHead className="text-xs font-medium h-8 py-1">Part #</TableHead>
            <TableHead className="text-xs font-medium h-8 py-1">Description</TableHead>
            <TableHead className="text-xs font-medium h-8 py-1">Qty</TableHead>
          </ShadcnTableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <motion.tr
              key={row.id}
              ref={(el) => {
                if (el) rowRefs.current.set(row.number, el);
              }}
              className={`cursor-pointer hover:bg-gray-50 ${
                highlightedNumber === row.number ? "bg-blue-50" : ""
              }`}
              onClick={() => onRowClick(row.number)}
              onMouseEnter={() => handleRowMouseEnter(row.number)}
              onMouseLeave={handleRowMouseLeave}
              animate={
                highlightedNumber === row.number
                  ? { backgroundColor: "rgba(59, 130, 246, 0.1)" }
                  : { backgroundColor: "transparent" }
              }
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
