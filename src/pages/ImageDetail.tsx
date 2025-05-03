
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import InteractiveImage from "@/components/Interactive/InteractiveImage";
import DataTable from "@/components/Table/DataTable";
import Breadcrumb from "@/components/Navigation/Breadcrumb";
import { toast } from "sonner";
import { TableRow, ImageData } from "@/types";
import { parseXLSXTable, loadImageData, getImagePath } from "@/utils/fileLoader";

const ImageDetail: React.FC = () => {
  const { imageName } = useParams<{ imageName: string }>();
  const navigate = useNavigate();
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [highlightedNumber, setHighlightedNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Default image if none specified in URL
  const currentImageName = imageName || "Brother_814_Needle_Bar_Mechanism";

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
        console.log(`Loading data for image: ${currentImageName}`);

        // Step 1: Find the actual image path
        const imgPath = await getImagePath(currentImageName);
        if (!imgPath) {
          console.error(`Could not find image file for: ${currentImageName}`);
          throw new Error(`Image file not found for: ${currentImageName}`);
        }
        setImagePath(imgPath);
        console.log(`Found image at path: ${imgPath}`);

        // Step 2: Load JSON data for image
        const imgData = await loadImageData(currentImageName);
        if (!imgData) {
          throw new Error(`Failed to load image data for: ${currentImageName}`);
        }
        setImageData(imgData);
        console.log(`Loaded JSON data for: ${currentImageName}`);

        // Step 3: Load XLSX table data
        const tableRows = await parseXLSXTable(currentImageName);
        if (tableRows.length === 0) {
          console.warn(`No data found in the XLSX file for: ${currentImageName}`);
          // Not throwing error here as we might still want to show the image
        }
        setTableData(tableRows);
        console.log(`Loaded ${tableRows.length} table rows for: ${currentImageName}`);
        
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
  }, [currentImageName]);

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

  if (error || !imageData || !imagePath) {
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
      path: `/image/${currentImageName}`,
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
