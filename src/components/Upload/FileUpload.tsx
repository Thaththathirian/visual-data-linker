
import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface FileUploadProps {
  onUpload: (files: { image: File; json: File; csv: File }) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUpload }) => {
  const [files, setFiles] = useState<{
    image?: File;
    json?: File;
    csv?: File;
  }>({});

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'json' | 'csv') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file types
    if (type === 'image' && !file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }
    if (type === 'json' && file.type !== 'application/json') {
      toast.error("Please upload a JSON file");
      return;
    }
    if (type === 'csv' && file.type !== 'text/csv') {
      toast.error("Please upload a CSV file");
      return;
    }

    setFiles(prev => ({ ...prev, [type]: file }));
  };

  const handleSubmit = () => {
    if (!files.image || !files.json || !files.csv) {
      toast.error("Please upload all required files");
      return;
    }

    // Extract the base name (without extension) from the image file
    const baseName = files.image.name.split('.')[0];
    
    // Validate that all files share the same base name
    const jsonName = files.json.name.split('.')[0];
    const csvName = files.csv.name.split('.')[0];
    
    if (jsonName !== baseName || csvName !== baseName) {
      toast.error("All files must have the same name (before extension)");
      return;
    }

    onUpload({
      image: files.image,
      json: files.json,
      csv: files.csv,
    });
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Upload Files</CardTitle>
        <CardDescription>
          Upload an image with its corresponding JSON coordinates and CSV table data.
          All files must share the same base name.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Image File</label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => document.getElementById('image-upload')?.click()}
              >
                <Upload className="mr-2" />
                {files.image ? files.image.name : "Select Image"}
              </Button>
              <input
                id="image-upload"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={(e) => handleFileChange(e, 'image')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">JSON Coordinates</label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => document.getElementById('json-upload')?.click()}
              >
                <Upload className="mr-2" />
                {files.json ? files.json.name : "Select JSON"}
              </Button>
              <input
                id="json-upload"
                type="file"
                className="hidden"
                accept=".json"
                onChange={(e) => handleFileChange(e, 'json')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">CSV Table</label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => document.getElementById('csv-upload')?.click()}
              >
                <Upload className="mr-2" />
                {files.csv ? files.csv.name : "Select CSV"}
              </Button>
              <input
                id="csv-upload"
                type="file"
                className="hidden"
                accept=".csv"
                onChange={(e) => handleFileChange(e, 'csv')}
              />
            </div>
          </div>
        </div>

        <Button 
          className="w-full mt-4"
          onClick={handleSubmit}
          disabled={!files.image || !files.json || !files.csv}
        >
          Upload Files
        </Button>
      </CardContent>
    </Card>
  );
};

export default FileUpload;
