
import React from "react";

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-100 py-4">
      <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
        <p>&copy; {currentYear} Visual Data Linker. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
