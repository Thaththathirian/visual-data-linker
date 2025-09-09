
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import ProductScroller from "./ProductScroller";
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

  const hasScroller = !!(products && products.length > 0 && currentProductPath && onProductSelect);

  return (
    <nav className={`flex ${hasScroller ? "justify-between" : ""} items-start mt-2`} aria-label="Breadcrumb">
      <div className="flex-1 min-w-0">
        <ol className="inline-flex items-start space-x-1 md:space-x-3 flex-wrap gap-y-1 md:gap-y-2">
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
            <div className="flex items-start">
              <ChevronRight className="w-5 h-5 text-gray-400" />
              {index === items.length - 1 ? (
                <div className="flex items-start space-x-2">
                  <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                    {item.label}
                  </span>
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
      </div>
      {hasScroller && (
        <div className="ml-4 w-[220px] sm:w-[320px] md:w-[420px] lg:w-1/3 xl:w-1/3 2xl:w-1/3 min-w-[220px]">
          <ProductScroller
            products={products!}
            currentProductPath={currentProductPath!}
            onProductSelect={onProductSelect!}
          />
        </div>
      )}
    </nav>
  );
};

export default Breadcrumb;
