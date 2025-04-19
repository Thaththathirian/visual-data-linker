
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const availableImages = [
  {
    id: "page-1-circle",
    name: "Page 1 Circle",
    path: "/image/page-1-circle",
    thumbnail: "/placeholder.svg",
  },
  {
    id: "sewing-machine-x200",
    name: "Sewing Machine X200",
    path: "/image/sewing-machine-x200",
    thumbnail: "/placeholder.svg",
  },
];

const Home: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <section className="mb-12">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Visual Data Linker
        </h1>
        <p className="text-center text-gray-600 max-w-3xl mx-auto mb-8">
          Interactive visual system for linking coordinates on images with corresponding data tables.
          Click on an image below to explore parts and components.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {availableImages.map((image) => (
          <motion.div
            key={image.id}
            className="bg-white rounded-lg shadow-md overflow-hidden"
            whileHover={{ y: -5, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)" }}
            transition={{ duration: 0.3 }}
          >
            <Link to={image.path}>
              <div className="aspect-video bg-gray-100">
                <img
                  src={image.thumbnail}
                  alt={image.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-4">
                <h2 className="text-xl font-semibold">{image.name}</h2>
                <p className="text-gray-500 mt-2">
                  View interactive diagram
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </section>

      <section className="mt-12 p-6 bg-gray-50 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">How to Use</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4">
            <div className="text-custom-blue text-xl font-bold mb-2">1</div>
            <h3 className="font-semibold mb-2">Select an Image</h3>
            <p className="text-gray-600">
              Choose from the available diagrams to get started
            </p>
          </div>
          <div className="p-4">
            <div className="text-custom-blue text-xl font-bold mb-2">2</div>
            <h3 className="font-semibold mb-2">Explore Components</h3>
            <p className="text-gray-600">
              Hover over numbered circles to see corresponding table rows highlighted
            </p>
          </div>
          <div className="p-4">
            <div className="text-custom-blue text-xl font-bold mb-2">3</div>
            <h3 className="font-semibold mb-2">Click for Details</h3>
            <p className="text-gray-600">
              Click on any circle or table row to view detailed information
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
