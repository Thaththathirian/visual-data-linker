
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
            <li>Add these files with matching names inside the folder:
              <ul className="list-circle pl-5 mt-1 space-y-1">
                <li><FileJson className="inline h-3 w-3 mr-1" /> A JSON file (e.g., <code>diagram.json</code>) with valid JSON format</li>
                <li><FileText className="inline h-3 w-3 mr-1" /> A CSV file (e.g., <code>diagram.csv</code>)</li>
                <li><Image className="inline h-3 w-3 mr-1" /> An image file with the same name (e.g., <code>diagram.png</code>)</li>
              </ul>
            </li>
            <li>The files MUST have the same base name (e.g., <code>diagram.json</code>, <code>diagram.csv</code>, and <code>diagram.png</code>)</li>
            <li>The JSON file must be properly formatted JSON - check for HTML content or syntax errors</li>
            <li>Add your folder name to the <code>folders.json</code> file in the <code>public/data/</code> directory</li>
          </ul>
          
          <pre className="bg-gray-100 p-3 rounded-md text-xs mt-2 mb-2 overflow-x-auto">
{`{
  "imageName": "Your Diagram Name",
  "coordinates": [
    { "id": 1, "x": 100, "y": 100, ... },
    ...
  ]
}`}
          </pre>
          
          <ul className="list-disc pl-5 text-sm space-y-1 text-muted-foreground">
            <li>For image files, we support .png, .jpg, .jpeg, .webp, and .gif formats</li>
            <li>Make sure all files have the same base name (e.g., "Brother814_Needle_Bar_Mechanism")</li>
          </ul>
        </div>
        
        <div className="border border-gray-200 rounded-md p-3 bg-gray-50">
          <h4 className="text-sm font-medium mb-2">Example Folder Structure</h4>
          <pre className="text-xs text-gray-600">
            public/data/Your_Diagram_Name/<br/>
            ├── Brother814_Needle_Bar_Mechanism.json<br/>
            ├── Brother814_Needle_Bar_Mechanism.csv<br/>
            └── Brother814_Needle_Bar_Mechanism.png
          </pre>
        </div>
        
        <Button onClick={onRescan} variant="outline">
          <FolderSearch className="h-4 w-4 mr-2" /> Scan Again
        </Button>
      </div>
    </div>
  );
};
