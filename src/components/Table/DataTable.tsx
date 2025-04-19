
import React, { useRef, useEffect } from "react";
import { TableRow } from "@/types";
import { motion } from "framer-motion";

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
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 sticky top-0">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              #
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Part #
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
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
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {row.number}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {row.name}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {row.description}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {row.partNumber}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
