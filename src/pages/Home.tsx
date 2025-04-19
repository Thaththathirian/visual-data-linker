
import React from 'react';
import ImageList from '@/components/ImageList/ImageList';

const Home = () => {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Available Images</h1>
      <ImageList />
    </div>
  );
};

export default Home;
