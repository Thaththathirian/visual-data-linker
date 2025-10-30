
import React from "react";
import { Link } from "react-router-dom";

const Header: React.FC = () => {
  // Prevent navigation for all click handlers for logo/user/store/home/nav
  const handlePrevent = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <header className="bg-white shadow-sm p-2 min-h-0">
      <div className="container mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Link to="/" onClick={handlePrevent} className="flex items-center">
            <img
              src="/swastik_icon.avif"
              alt="Logo"
              className="h-7 w-auto"
              onClick={handlePrevent}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = "/placeholder.svg";
              }}
            />
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
