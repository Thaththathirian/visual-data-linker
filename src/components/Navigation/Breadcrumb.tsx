
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import ProductDropdown from "./ProductDropdown";
import { IntelliPartsItem } from "@/types";

interface BreadcrumbItem {
  label: string;
  path: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  products?: IntelliPartsItem[];
  currentProductPath?: string;
  onProductSelect?: (product: IntelliPartsItem) => void;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ 
  items, 
  products, 
  currentProductPath, 
  onProductSelect 
}) => {
  const navigate = useNavigate();
  
  // Navigate home when clicking the home button
  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate("/");
  };

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        <li className="inline-flex items-center">
          <Link
            to="/"
            className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-custom-blue"
            onClick={handleHomeClick}
          >
            <Home className="w-4 h-4 mr-2" />
            Home
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index}>
            <div className="flex items-center">
              <ChevronRight className="w-5 h-5 text-gray-400" />
              {index === items.length - 1 ? (
                <div className="flex items-center space-x-2">
                  <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                    {item.label}
                  </span>
                  {/* Show product dropdown only on the last breadcrumb item and if we have products */}
                  {products && products.length > 0 && currentProductPath && onProductSelect && (
                    <>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                      <ProductDropdown
                        products={products}
                        currentProductPath={currentProductPath}
                        onProductSelect={onProductSelect}
                      />
                    </>
                  )}
                </div>
              ) : (
                <Link
                  to={item.path}
                  className="ml-1 text-sm font-medium text-gray-700 hover:text-custom-blue md:ml-2"
                >
                  {item.label}
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
