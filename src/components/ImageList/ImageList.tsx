
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Import the data directly from the files
// import page1CircleData from '@/data/images/page-1-circle.json';
// import sewingMachineData from '@/data/images/sewing-machine-x200.json';
import frameAssemblyData from '@/data/images/Brother_814_Needle_Bar_Mechanism.json';

const availableImages = [
  {
    name: 'Frame Assembly',
    path: 'Brother_814_Needle_Bar_Mechanism',
    data: frameAssemblyData,
  },
  // {
  //   name: 'Page 1 Circle',
  //   path: 'page-1-circle',
  //   data: page1CircleData,
  // },
  // {
  //   name: 'Sewing Machine X200',
  //   path: 'sewing-machine-x200',
  //   data: sewingMachineData,
  // },
];

const ImageList = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {availableImages.map((image) => (
        <Card key={image.path} className="hover:shadow-lg transition-shadow">
          <CardHeader className="font-semibold text-lg">{image.name}</CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Contains {image.data.coordinates.length} interactive points
            </p>
            <Link
              to={`/image/${image.path}`}
              className="inline-block bg-custom-blue text-white px-4 py-2 rounded hover:bg-custom-blue-light transition-colors"
            >
              View Details
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ImageList;
