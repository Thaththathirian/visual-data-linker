import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { parseCSV } from "@/utils/csvParser";
import InteractiveImage from "@/components/Interactive/InteractiveImage";
import DataTable from "@/components/Table/DataTable";
import Breadcrumb from "@/components/Navigation/Breadcrumb";
import { toast } from "sonner";
import frameAssembly1 from "@/data/images/frame-assembly-1.json";

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
        if (imageName === 'frame-assembly-1') {
          setImageData(frameAssembly1);
          const response = await fetch(`/src/data/tables/${imageName}.csv`);
          if (!response.ok) {
            throw new Error('Failed to load CSV data');
          }
          const csvText = await response.text();
          const parsedData = parseCSV(csvText);
          setTableData(parsedData);
        } else {
          try {
            const imageDataModule = await import(`../data/images/${imageName}.json`);
            setImageData(imageDataModule.default);
            const response = await fetch(`/src/data/tables/${imageName}.csv`);
            if (!response.ok) {
              throw new Error('Failed to load CSV data');
            }
            const csvText = await response.text();
            const parsedData = parseCSV(csvText);
            setTableData(parsedData);
          } catch (err) {
            console.error("Error loading image data:", err);
            throw new Error(`Failed to load data for image: ${imageName}`);
          }
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
    setHighlightedNumber(number);
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
      label: imageData?.imageName.replace(/-/g, " "),
      path: `/image/${imageName}`,
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Breadcrumb items={breadcrumbItems} />
      </div>

      <h1 className="text-xl font-bold mb-4 capitalize">
        {imageData?.imageName.replace(/-/g, " ")}
      </h1>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-2/3 bg-white p-4 rounded-lg shadow min-h-[580px] overflow-auto">
          <InteractiveImage
            imagePath={`/lovable-uploads/bedf96be-6a0a-4e22-a17a-0390c7baf82e.png`}
            imageData={imageData}
            onCircleHover={handleCircleHover}
            onCircleClick={handleCircleClick}
          />
        </div>

        <div className="w-full lg:w-1/3 bg-white p-4 rounded-lg shadow h-[580px]">
          <h2 className="text-lg font-semibold mb-2">Parts List</h2>
          <div className="h-[530px] overflow-auto">
            <DataTable
              data={tableData}
              highlightedNumber={highlightedNumber}
              onRowClick={(number) => handleCircleClick(number)}
              onRowHover={handleCircleHover}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageDetail;
