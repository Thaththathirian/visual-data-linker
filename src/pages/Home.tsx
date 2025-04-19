
import React from 'react';
import FileUpload from '@/components/Upload/FileUpload';

const Home = () => {
  const handleFileUpload = async (files: { image: File; json: File; csv: File }) => {
    // Here you would implement the actual file upload logic
    // For now, we'll just log the files
    console.log('Files to upload:', files);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Welcome</h1>
      <FileUpload onUpload={handleFileUpload} />
    </div>
  );
};

export default Home;
