
import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import FolderExplorer from '@/components/FolderExplorer';

const Home = () => {
  const { folderPath } = useParams();

  // If a folder path is provided, navigate to that folder in the explorer
  if (folderPath) {
    const decodedPath = decodeURIComponent(folderPath);
    return <FolderExplorer initialPath={decodedPath} />;
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-3">Visual Data Linker</h1>
          <p className="text-gray-600">
            Browse and explore your data folders with interactive diagrams and coordinate data.
            Navigate through folders using the breadcrumb navigation below.
          </p>
        </div>
        <FolderExplorer />
      </div>
    </div>
  );
};

export default Home;
