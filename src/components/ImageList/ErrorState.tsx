
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, FolderSearch, FileText, FileJson, Image } from "lucide-react";
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  error: string;
  troubleshootingInfo: string[];
  onRescan: () => void;
}

export const ErrorState = ({ error, troubleshootingInfo, onRescan }: ErrorStateProps) => {
  return (
    <div className="space-y-4">
      <Alert variant="destructive" className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
      
      {troubleshootingInfo.length > 0 && (
        <Alert variant="default" className="mb-6 border-amber-300 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertTitle>Troubleshooting Information</AlertTitle>
          <AlertDescription>
            <div className="mt-2">
              <details>
                <summary className="cursor-pointer font-medium">View detected issues</summary>
                <ul className="list-disc pl-5 text-sm space-y-1 mt-2 text-muted-foreground">
                  {troubleshootingInfo.map((issue, index) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </details>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex flex-col space-y-4">
        <div>
          <h3 className="font-medium mb-2">Data Folder Setup</h3>
          <p className="text-sm mb-2">To add diagrams to this application:</p>
          <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground">
            <li>Create a folder in <code className="bg-gray-100 px-1">public/data/</code> with your diagram name (e.g., <code className="bg-gray-100 px-1">public/data/Your_Diagram_Name/</code>)</li>
            <li>Add the JSON, CSV and image files with matching names inside that folder</li>
            <li><strong>File naming is important:</strong> All files must have the same base name:</li>
            <ul className="list-circle pl-5 mt-1 space-y-1">
              <li><FileJson className="inline h-3 w-3 mr-1" /> Either name the files with the same name as the folder (e.g., <code>Your_Diagram_Name.json</code>) OR</li>
              <li><FileJson className="inline h-3 w-3 mr-1" /> Use the standard name <code>Brother814_Needle_Bar_Mechanism.json</code></li>
            </ul>
            <li>Add your folder name to the <code>folders.json</code> file in the <code>public/data/</code> directory:</li>
          </ul>
          
          <pre className="bg-gray-100 p-3 rounded-md text-xs mt-2 mb-2 overflow-x-auto">
{`{
  "folders": [
    "Your_Diagram_Name"
  ]
}`}
          </pre>
          
          <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground">
            <li>For image files, we support .png, .jpg, .jpeg, .webp, and .gif formats</li>
            <li>Make sure all files have the same base name</li>
          </ul>
        </div>
        
        <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
          <h4 className="text-sm font-medium mb-2">Example Folder Structure</h4>
          <pre className="text-xs text-gray-600">
            public/data/Your_Diagram_Name/<br/>
            ├── Your_Diagram_Name.json<br/>
            ├── Your_Diagram_Name.csv<br/>
            └── Your_Diagram_Name.png
          </pre>
        </div>
        
        <Button onClick={onRescan} variant="outline">
          <FolderSearch className="h-4 w-4 mr-2" /> Scan Again
        </Button>
      </div>
    </div>
  );
};
