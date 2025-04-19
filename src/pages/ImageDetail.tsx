import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { parseCSV } from "@/utils/csvParser";
import { TableRow, ImageData } from "@/types";
import InteractiveImage from "@/components/Interactive/InteractiveImage";
import DataTable from "@/components/Table/DataTable";
import Breadcrumb from "@/components/Navigation/Breadcrumb";
import { toast } from "sonner";
import frameAssembly1 from "@/data/images/frame-assembly-1.json";
import frameAssemblyImage from "@/assets/frame-assembly-1.png";

const ImageDetail: React.FC = () => {
  const { imageName } = useParams<{ imageName: string }>();
  const navigate = useNavigate();
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [tableData, setTableData] = useState<TableRow[]>([]);
  const [highlightedNumber, setHighlightedNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // For frame-assembly-1, use the JSON data directly
        if (imageName === 'frame-assembly-1') {
          setImageData(frameAssembly1);
          
          // Fetch the CSV file and parse it
          const response = await fetch(`/src/data/tables/${imageName}.csv`);
          if (!response.ok) {
            throw new Error('Failed to load CSV data');
          }
          
          const csvText = await response.text();
          const parsedData = parseCSV(csvText);
          setTableData(parsedData);
        } else {
          // For other images
          const imageDataModule = await import(`../data/images/${imageName}.json`);
          setImageData(imageDataModule.default);
          
          // Fetch the CSV file and parse it
          const response = await fetch(`/src/data/tables/${imageName}.csv`);
          if (!response.ok) {
            throw new Error('Failed to load CSV data');
          }
          
          const csvText = await response.text();
          const parsedData = parseCSV(csvText);
          setTableData(parsedData);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load data for this image");
        setLoading(false);
        toast.error("Error loading data");
      }
    };

    if (imageName) {
      fetchData();
    }
  }, [imageName]);

  const handleCircleHover = (number: string | null) => {
    setHighlightedNumber(number);
  };

  const handleCircleClick = (number: string) => {
    navigate(`/image/${imageName}/${number}`);
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
      path: `/image/${imageName}`,
    },
  ];

  const getImagePath = () => {
    if (imageName === 'frame-assembly-1') {
      return frameAssemblyImage;
    } else {
      return `/src/assets/${imageName}.png`;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <h1 className="text-2xl font-bold mb-6 capitalize">
        {imageData.imageName.replace(/-/g, " ")}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-4 rounded-lg shadow">
          <InteractiveImage
            imagePath={getImagePath()}
            imageData={imageData}
            onCircleHover={handleCircleHover}
            onCircleClick={handleCircleClick}
          />
        </div>

        <div className="bg-white p-4 rounded-lg shadow h-[500px] lg:h-auto">
          <h2 className="text-xl font-semibold mb-4">Parts List</h2>
          <DataTable
            data={tableData}
            highlightedNumber={highlightedNumber}
            onRowClick={handleCircleClick}
          />
        </div>
      </div>
    </div>
  );
};

export default ImageDetail;
