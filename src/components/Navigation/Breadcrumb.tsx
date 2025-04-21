
import React from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  path: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  // Prevent navigation
  const handlePrevent = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        <li className="inline-flex items-center">
          <Link
            to="/"
            className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-custom-blue"
            onClick={handlePrevent}
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
                <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.path}
                  className="ml-1 text-sm font-medium text-gray-700 hover:text-custom-blue md:ml-2"
                  onClick={handlePrevent}
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
