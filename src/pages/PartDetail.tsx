
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { parseCSVFile } from "@/utils/fileLoader";
import { TableRow, ImageData } from "@/types";
import Breadcrumb from "@/components/Navigation/Breadcrumb";
import { toast } from "sonner";
import { loadImageData, checkFolderContents } from "@/utils/fileLoader";

const PartDetail: React.FC = () => {
  const { folderName, partNumber } = useParams<{ folderName: string; partNumber: string }>();
  const navigate = useNavigate();
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [partData, setPartData] = useState<TableRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (!folderName || !partNumber) {
          throw new Error('Missing folder name or part number');
        }

        // Step 1: Check folder contents to find files
        const folderContents = await checkFolderContents(folderName);
        if (!folderContents.hasJson || !folderContents.hasCsv || !folderContents.baseName) {
          throw new Error(`Required files not found in folder: ${folderName}`);
        }
        
        // Step 2: Load the image metadata from JSON
        const imageDataResult = await loadImageData(folderName, folderContents.baseName);
        if (!imageDataResult) {
          throw new Error('Failed to load image data');
        }
        setImageData(imageDataResult);
        
        // Step 3: Parse CSV data
        const csvData = await parseCSVFile(folderName, folderContents.baseName);
        if (!csvData || csvData.length === 0) {
          throw new Error('Failed to load CSV data');
        }
        
        // Step 4: Find the part with the matching number
        const part = csvData.find(row => row.number === partNumber);
        if (!part) {
          throw new Error(`Part #${partNumber} not found`);
        }
        
        setPartData(part);
        setLoading(false);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error("Error loading part data:", errorMessage);
        setError(errorMessage);
        setLoading(false);
        toast.error("Error loading part data: " + errorMessage);
      }
    };

    if (folderName && partNumber) {
      fetchData();
    }
  }, [folderName, partNumber]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-custom-blue mx-auto"></div>
          <p className="mt-4">Loading part data...</p>
        </div>
      </div>
    );
  }

  if (error || !imageData || !partData) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p>{error || "Failed to load part data"}</p>
          <button
            onClick={() => navigate(`/${folderName}`)}
            className="mt-4 px-4 py-2 bg-custom-blue text-white rounded hover:bg-custom-blue-light"
          >
            Back to Image
          </button>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    {
      label: imageData.imageName.replace(/-/g, " "),
      path: `/${folderName}`,
    },
    {
      label: `Part ${partNumber} - ${partData.name}`,
      path: `/${folderName}/${partNumber}`,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-6">
          {partData.name} <span className="text-gray-500 text-lg">(#{partNumber})</span>
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Details</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Part Number</h3>
                <p className="mt-1">{partData.partNumber}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Description</h3>
                <p className="mt-1">{partData.description}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Reference Number</h3>
                <p className="mt-1">{partData.number}</p>
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={() => navigate(`/${folderName}`)}
                className="px-4 py-2 bg-custom-blue text-white rounded hover:bg-custom-blue-light"
              >
                Back to Image
              </button>
            </div>
          </div>

          <div className="border-t pt-6 md:border-t-0 md:pt-0 md:border-l md:pl-8">
            <h2 className="text-xl font-semibold mb-4">Location on Diagram</h2>
            <div className="aspect-video bg-gray-100 rounded flex items-center justify-center">
              <p className="text-gray-500">
                Part #{partNumber} is located on the "{imageData.imageName.replace(/-/g, " ")}" diagram
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartDetail;
