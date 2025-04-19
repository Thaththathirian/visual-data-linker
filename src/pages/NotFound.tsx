
import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const NotFound: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-16 min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <motion.h1
          className="text-6xl font-bold text-custom-blue"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          404
        </motion.h1>
        <motion.h2
          className="text-2xl font-semibold mt-4 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Page Not Found
        </motion.h2>
        <motion.p
          className="text-gray-600 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          The page you are looking for doesn't exist or has been moved.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Link
            to="/"
            className="px-6 py-2 bg-custom-blue text-white rounded-md hover:bg-custom-blue-light transition-colors duration-300"
          >
            Return Home
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
