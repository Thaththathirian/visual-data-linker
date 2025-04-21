
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

interface NavItem {
  name: string;
  path: string;
  dropdown?: NavDropdownItem[];
}

interface NavDropdownItem {
  name: string;
  path: string;
}

const navItems: NavItem[] = [
  {
    name: "Sewing Machines",
    path: "/categories/sewing-machines",
    dropdown: [
      { name: "Industrial", path: "/categories/sewing-machines/industrial" },
      { name: "Domestic", path: "/categories/sewing-machines/domestic" },
    ],
  },
  {
    name: "Accessories",
    path: "/categories/accessories",
    dropdown: [
      { name: "Needles", path: "/categories/accessories/needles" },
      { name: "Bobbins", path: "/categories/accessories/bobbins" },
    ],
  },
  { name: "Spare Parts", path: "/categories/spare-parts" },
  { name: "Events", path: "/events" },
  { name: "Downloads", path: "/downloads" },
  { name: "Blogs & Articles", path: "/blogs" },
  { name: "Support Community", path: "/support" },
];

const Navigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);

  const toggleDropdown = (index: number) => {
    setActiveDropdown(activeDropdown === index ? null : index);
  };

  const closeMenu = () => {
    setIsOpen(false);
    setActiveDropdown(null);
  };

  // Prevent navigation on all links
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const dropdownVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { opacity: 1, height: "auto" },
  };

  return (
    <nav className="bg-[#1d67cdb3] text-white">
      <div className="container mx-auto px-4">
        {/* Mobile Toggle Button */}
        <div className="flex items-center justify-between p-4 md:hidden">
          <span className="font-semibold">Menu</span>
          <button onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex">
          <ul className="flex">
            {navItems.map((item, index) => (
              <li key={index} className="relative group">
                {item.dropdown ? (
                  <>
                    <button
                      className="flex items-center px-4 py-3 hover:bg-custom-blue transition-colors duration-200"
                      onClick={() => toggleDropdown(index)}
                      onMouseEnter={() => setActiveDropdown(index)}
                      onMouseLeave={() => setActiveDropdown(null)}
                    >
                      {item.name}
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </button>
                    <AnimatePresence>
                      {activeDropdown === index && (
                        <motion.div
                          initial="hidden"
                          animate="visible"
                          exit="hidden"
                          variants={dropdownVariants}
                          transition={{ duration: 0.2 }}
                          className="absolute left-0 mt-0 w-48 bg-white shadow-lg z-50"
                          onMouseEnter={() => setActiveDropdown(index)}
                          onMouseLeave={() => setActiveDropdown(null)}
                        >
                          <ul className="py-1">
                            {item.dropdown.map((dropdownItem, dropdownIndex) => (
                              <li key={dropdownIndex}>
                                <Link
                                  to="/"
                                  className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
                                  onClick={handleClick}
                                >
                                  {dropdownItem.name}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <Link
                    to="/"
                    className="block px-4 py-3 hover:bg-custom-blue transition-colors duration-200"
                    onClick={handleClick}
                  >
                    {item.name}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden"
            >
              <ul className="bg-custom-blue">
                {navItems.map((item, index) => (
                  <li key={index} className="border-b border-custom-blue">
                    {item.dropdown ? (
                      <>
                        <button
                          className="flex items-center justify-between w-full px-4 py-3"
                          onClick={() => toggleDropdown(index)}
                        >
                          {item.name}
                          <ChevronDown
                            className={`h-4 w-4 transition-transform duration-200 ${
                              activeDropdown === index ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                        <AnimatePresence>
                          {activeDropdown === index && (
                            <motion.div
                              initial="hidden"
                              animate="visible"
                              exit="hidden"
                              variants={dropdownVariants}
                              transition={{ duration: 0.2 }}
                              className="bg-gray-800"
                            >
                              <ul>
                                {item.dropdown.map((dropdownItem, dropdownIndex) => (
                                  <li key={dropdownIndex}>
                                    <Link
                                      to="/"
                                      className="block pl-8 pr-4 py-2 hover:bg-gray-700"
                                      onClick={handleClick}
                                    >
                                      {dropdownItem.name}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </>
                    ) : (
                      <Link
                        to="/"
                        className="block px-4 py-3"
                        onClick={handleClick}
                      >
                        {item.name}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
};

export default Navigation;
