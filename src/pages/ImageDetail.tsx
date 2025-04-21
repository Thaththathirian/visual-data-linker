import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import InteractiveImage from "@/components/Interactive/InteractiveImage";
import DataTable from "@/components/Table/DataTable";
import Breadcrumb from "@/components/Navigation/Breadcrumb";
import { toast } from "sonner";
import frameAssembly1 from "@/data/images/frame-assembly-1.json";
import { TableRow, ImageData } from "@/types";

// Look for xlsx files in the public directory in production
const getTablePath = (fileName: string) => {
  // In development, we use the src path, in production we use the public path
  const isProd = import.meta.env.PROD;
  return isProd ? `/tables/${fileName}` : `/src/data/tables/${fileName}`;
};

// Modified to use the "Number" column exactly as in the XLSX file
const parseXLSXTable = async (fileName: string): Promise<TableRow[]> => {
  try {
    const filePath = getTablePath(fileName);
    console.log(`Fetching XLSX file from: ${filePath}`);

    const response = await fetch(filePath);
    if (!response.ok) {
      console.error(
        `Failed to load table: ${response.status} ${response.statusText}`
      );
      throw new Error(`Failed to load table from ${filePath}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    console.log("File loaded, parsing XLSX...");
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const sheetName = workbook.SheetNames[0];
    console.log(`Sheet name: ${sheetName}`);
    const sheet = workbook.Sheets[sheetName];
    const json: any[] = XLSX.utils.sheet_to_json(sheet, {
      defval: "",
      raw: false,
    });

    console.log("Parsed JSON data:", json);

    // Map the data to TableRow format, using the exact column names from the XLSX
    return json.map((row, idx) => {
      const tableRow: TableRow = {
        id: idx + 1,
        number: String(row["Number"] || ""), // Use exact column name 'Number'
        name: String(row["Qty"] || ""), // Use quantity for name/qty column
        description: String(row["Description"] || ""),
        partNumber: String(row["Part No."] || ""),
      };
      return tableRow;
    });
  } catch (err) {
    console.error("Error in parseXLSXTable:", err);
    // Return empty array instead of throwing to allow component to render with error state
    return [];
  }
};

const ImageDetail: React.FC = () => {
  const { imageName } = useParams<{ imageName: string }>();
  const navigate = useNavigate();
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [highlightedNumber, setHighlightedNumber] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log(
          `Loading data for image: ${imageName || "frame-assembly-1"}`
        );

        // Default to frame-assembly-1 if no imageName provided
        const currentImageName = imageName || "frame-assembly-1";

        if (currentImageName === "frame-assembly-1") {
          setImageData(frameAssembly1 as ImageData);
          console.log("Loading frame-assembly-1.xlsx");
          const tableRows = await parseXLSXTable("frame-assembly-1.xlsx");
          if (tableRows.length === 0) {
            throw new Error("No data found in the XLSX file");
          }
          console.log("Table rows loaded:", tableRows);
          setTableData(tableRows);
        } else {
          try {
            console.log(`Loading custom image: ${currentImageName}`);
            const imageDataModule = await import(
              `../data/images/${currentImageName}.json`
            );
            setImageData(imageDataModule.default as ImageData);
            const tableRows = await parseXLSXTable(`${currentImageName}.xlsx`);
            if (tableRows.length === 0) {
              throw new Error("No data found in the XLSX file");
            }
            setTableData(tableRows);
          } catch (err) {
            console.error("Error loading image data:", err);
            throw new Error(
              `Failed to load data for image: ${currentImageName}`
            );
          }
        }
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
  }, [imageName]);

  // Handlers linking the highlight for circles and rows via number
  const handleCircleHover = (number: string | null) => {
    setHighlightedNumber(number);
  };

  const handleCircleClick = (number: string) => {
    setHighlightedNumber(number);
    if ((imageName || "frame-assembly-1") && number) {
      navigate(`/api/${imageName || "frame-assembly-1"}/${number}`);
    }
  };

  const handleRowHover = (number: string | null) => {
    setHighlightedNumber(number);
  };

  const handleRowClick = (number: string) => {
    handleCircleClick(number);
  };

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
      path: `/image/${imageName || "frame-assembly-1"}`,
    },
  ];

  console.log("Rendering with tableData:", tableData);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Breadcrumb items={breadcrumbItems} />
      </div>
      <h1 className="text-xl font-bold mb-4 capitalize">
        {imageData.imageName.replace(/-/g, " ")}
      </h1>
      {/* Responsive layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-2/3 bg-white p-4 rounded-lg shadow min-h-[580px] overflow-auto">
          <InteractiveImage
            imagePath={`/images/bedf96be-6a0a-4e22-a17a-0390c7baf82e.png`}
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
      {/* For small screens, show table below image */}
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
