
import React from 'react';
import ImageList from '@/components/ImageList/ImageList';

const Home = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-3">Interactive Diagrams</h1>
          <p className="text-gray-600">
            Browse and explore available diagrams. Each diagram contains interactive elements that link to part details.
          </p>
        </div>
        <ImageList />
      </div>
    </div>
  );
};

export default Home;
