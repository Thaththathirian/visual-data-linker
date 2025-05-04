
import React from 'react';
import { AlertCircle, FolderSearch } from "lucide-react";
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  onRescan: () => void;
}

export const EmptyState = ({ onRescan }: EmptyStateProps) => {
  return (
    <div className="col-span-2 flex flex-col items-center justify-center p-8 border rounded-md">
      <AlertCircle className="h-10 w-10 text-amber-500 mb-4" />
      <h3 className="text-lg font-medium mb-2">No Diagrams Found</h3>
      <p className="text-center text-gray-600 mb-4">
        We couldn't detect any diagrams in the data directory.
      </p>
      <div className="flex flex-col gap-4 w-full max-w-md">
        <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
          <h4 className="font-medium text-sm mb-2">How to Add Diagrams</h4>
          <p className="text-sm text-gray-600 mb-2">Add your diagram files to:</p>
          <code className="block bg-gray-100 p-2 rounded text-sm mb-2">
            public/data/Your_Diagram_Name/
          </code>
          <p className="text-sm text-gray-600">Include matching JSON, CSV, and image files</p>
        </div>
        <Button onClick={onRescan} variant="outline">
          <FolderSearch className="h-4 w-4 mr-2" /> Try Again
        </Button>
      </div>
    </div>
  );
};
