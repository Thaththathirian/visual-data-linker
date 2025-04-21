
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
  return (
    <ScrollArea className="h-full">
      <Table>
        <TableHeader className="bg-gray-50 sticky top-0 z-10">
          <ShadcnTableRow>
            <TableHead className="text-xs font-medium py-2 h-8">#</TableHead>
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
