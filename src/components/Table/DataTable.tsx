
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

  // Scroll to highlighted row
  useEffect(() => {
    if (highlightedNumber && rowRefs.current.has(highlightedNumber)) {
      const row = rowRefs.current.get(highlightedNumber);
      if (row) {
        row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [highlightedNumber]);

  return (
    <div className="overflow-y-auto h-full border rounded-lg">
      <Table>
        <TableHeader className="bg-gray-50 sticky top-0">
          <ShadcnTableRow>
            <TableHead className="text-xs font-medium">#</TableHead>
            <TableHead className="text-xs font-medium">Part #</TableHead>
            <TableHead className="text-xs font-medium">Description</TableHead>
            <TableHead className="text-xs font-medium">Qty</TableHead>
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
              whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.1)" }}
              animate={
                highlightedNumber === row.number
                  ? { backgroundColor: ["rgba(59, 130, 246, 0.2)", "rgba(59, 130, 246, 0)", "rgba(59, 130, 246, 0.2)"] }
                  : {}
              }
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <TableCell className="font-medium">{row.number}</TableCell>
              <TableCell>{row.partNumber}</TableCell>
              <TableCell>{row.description}</TableCell>
              <TableCell>{row.name}</TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DataTable;
