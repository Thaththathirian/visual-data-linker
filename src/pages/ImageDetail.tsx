
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import InteractiveImage from "@/components/Interactive/InteractiveImage";
import DataTable from "@/components/Table/DataTable";
import Breadcrumb from "@/components/Navigation/Breadcrumb";
import { toast } from "sonner";
import { TableRow, ImageData } from "@/types";
import { parseCSVFile, loadImageData, getImagePath, checkFolderContents } from "@/utils/fileLoader";

const ImageDetail: React.FC = () => {
  const { folderName, partNumber } = useParams<{ folderName: string; partNumber: string }>();
  const navigate = useNavigate();
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [imagePath, setImagePath] = useState<string>('/placeholder.svg'); // Default placeholder
  const [highlightedNumber, setHighlightedNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [baseName, setBaseName] = useState<string | null>(null);

  // Fall back to a default folder if none specified in URL
  const currentFolderName = folderName || "test_Brother_814_Needle_Bar_Mechanism";

  const numberToPartNumberMap = useMemo(() => {
    const map: Record<string, string> = {};
    tableData.forEach(row => {
      if (row.number && row.partNumber) {
        map[row.number] = row.partNumber;
      }
    });
    return map;
  }, [tableData]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log(`Loading data for folder: ${currentFolderName}`);

        // Step 1: Check folder contents to find files
        const folderContents = await checkFolderContents(currentFolderName);
        if (!folderContents.hasJson || !folderContents.hasCsv || !folderContents.baseName) {
          throw new Error(`Required files not found in folder: ${currentFolderName}`);
        }
        
        setBaseName(folderContents.baseName);
        
        // Step 2: Load JSON data for image
        const imgData = await loadImageData(currentFolderName, folderContents.baseName);
        if (!imgData) {
          throw new Error(`Failed to load image data for: ${currentFolderName}`);
        }
        setImageData(imgData);
        console.log(`Loaded JSON data for: ${currentFolderName}/${folderContents.baseName}`);
        
        // Step 3: Find the actual image path
        const imgPath = await getImagePath(currentFolderName, folderContents.baseName);
        if (imgPath) {
          setImagePath(imgPath);
          console.log(`Found image at path: ${imgPath}`);
        } else {
          console.warn(`Could not locate image for: ${currentFolderName}/${folderContents.baseName}, using placeholder`);
        }

        // Step 4: Load CSV table data
        const tableRows = await parseCSVFile(currentFolderName, folderContents.baseName);
        if (tableRows.length === 0) {
          console.warn(`No data found in the CSV file for: ${currentFolderName}/${folderContents.baseName}`);
          toast.warning("No part data found for this image");
        }
        setTableData(tableRows);
        console.log(`Loaded ${tableRows.length} table rows for: ${currentFolderName}/${folderContents.baseName}`);
        
        setLoading(false);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to load data for this image";
        console.error("Error loading data:", errorMessage);
        setError(errorMessage);
        setLoading(false);
        toast.error("Error loading data: " + errorMessage);
      }
    };

    fetchData();
  }, [currentFolderName]);

  const handleCircleHover = (number: string | null) => setHighlightedNumber(number);
  const handleRowHover = (number: string | null) => setHighlightedNumber(number);

  const handleShapeOrRowClick = (number: string) => {
    const partNum = numberToPartNumberMap[number];
    if (!partNum) {
      toast.error("Part number not found for this item.");
      return;
    }
    const url = `https://www.swastiksew.com/search?q=${encodeURIComponent(partNum)}`;
    window.open(url, "_blank");
  };

  const handleCircleClick = handleShapeOrRowClick;
  const handleRowClick = handleShapeOrRowClick;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-custom-blue mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !imageData) {
    return (
      <div className="container mx-auto px-4 py-8 min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-500 mb-4">Error</h2>
          <p>{error || "Failed to load image data"}</p>
          <button
            onClick={() => navigate("/")}
            className="mt-4 px-4 py-2 bg-custom-blue text-white rounded hover:bg-custom-blue-light"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    {
      label: imageData.imageName.replace(/-/g, " "),
      path: `/${currentFolderName}`,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Breadcrumb items={breadcrumbItems} />
      </div>
      <h1 className="text-xl font-bold mb-4 capitalize">
        {imageData.imageName.replace(/-/g, " ")}
      </h1>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-2/3 bg-white p-4 rounded-lg shadow min-h-[580px] overflow-auto">
          <InteractiveImage
            imagePath={imagePath}
            imageData={imageData}
            highlightedNumber={highlightedNumber}
            onCircleHover={handleCircleHover}
            onCircleClick={handleCircleClick}
          />
        </div>
        <div
          className="hidden lg:block w-full lg:w-1/3 bg-white p-4 rounded-lg shadow"
          style={{ minHeight: "580px", height: "100%" }}
        >
          <h2 className="text-lg font-semibold mb-2">Parts List</h2>
          <div
            style={{ height: "530px", maxHeight: "530px", overflow: "auto" }}
          >
            <DataTable
              data={tableData}
              highlightedNumber={highlightedNumber}
              onRowClick={handleRowClick}
              onRowHover={handleRowHover}
            />
          </div>
        </div>
      </div>
      <div
        className="lg:hidden mt-6 bg-white p-4 rounded-lg shadow"
        style={{ minHeight: "200px" }}
      >
        <h2 className="text-lg font-semibold mb-2">Parts List</h2>
        <div style={{ maxHeight: "530px", overflow: "auto" }}>
          <DataTable
            data={tableData}
            highlightedNumber={highlightedNumber}
            onRowClick={handleRowClick}
            onRowHover={handleRowHover}
          />
        </div>
      </div>
    </div>
  );
};

export default ImageDetail;
