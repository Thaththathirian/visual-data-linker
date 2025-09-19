import React, { useEffect, useMemo, useState, useRef } from "react";
import { IntelliPartsItem } from "@/types";
import { resolveItemThumbnail } from "@/utils/intelliPartsReader";
import dataCache from "@/utils/dataCache";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ProductScrollerProps {
  products: IntelliPartsItem[];
  currentProductPath: string;
  onProductSelect: (product: IntelliPartsItem) => void;
  className?: string;
}

const ScrollerItem: React.FC<{
  item: IntelliPartsItem;
  isActive: boolean;
  onClick: () => void;
}> = ({ item, isActive, onClick }) => {
  const [imageUrl, setImageUrl] = useState<string>("/placeholder.svg");
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const cacheKey = `thumbnail:${item.machine_name}:${item.sparepartspage_path}`;
        const cached = dataCache.getImageUrl(cacheKey);
        if (cached) {
          if (!isMounted) return;
          setImageUrl(cached);
          setIsImageLoaded(true);
          return;
        }

        const url = await resolveItemThumbnail(item);
        if (!isMounted) return;
        setImageUrl(url);
        setIsImageLoaded(true);
      } catch {
        // ignore errors, keep placeholder
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [item.machine_name, item.sparepartspage_path]);

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start shrink-0 select-none rounded-md transition-colors focus:outline-none focus:ring-0 focus:ring-offset-0 text-left px-2 py-2 w-full h-full ${
        isActive
          ? "bg-blue-100"
          : "bg-white hover:bg-blue-50 active:bg-blue-100"
      }`}
      title={item.sparepartspage_name}
    >
      <div className="w-full text-[11px] leading-tight font-medium text-gray-700 line-clamp-2 mb-1 h-[28px] flex items-start">
        {item.sparepartspage_name}
      </div>
      <div className="relative w-full aspect-[4/3] rounded-sm overflow-hidden flex-1">
        {isImageLoaded && (
          <img
            src={imageUrl}
            alt={item.sparepartspage_name}
            className="absolute inset-0 w-full h-full object-contain"
            loading="lazy"
            draggable={false}
          />
        )}
      </div>
    </button>
  );
};

const ProductScroller: React.FC<ProductScrollerProps> = ({
  products,
  currentProductPath,
  onProductSelect,
  className = "",
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const currentIndex = useMemo(
    () => products.findIndex((p) => p.sparepartspage_path === currentProductPath),
    [products, currentProductPath]
  );

  // Sync selectedIndex with currentIndex when currentProductPath changes
  useEffect(() => {
    if (currentIndex !== -1) {
      setSelectedIndex(currentIndex);
    }
  }, [currentIndex]);

  // Function to center the selected product
  const centerSelectedProduct = () => {
    const container = scrollContainerRef.current;
    if (!container || selectedIndex === -1) return;

    const containerWidth = container.clientWidth;
    const scrollWidth = container.scrollWidth;
    
    // Calculate the position to center the selected item
    const itemWidth = scrollWidth / products.length;
    const targetScrollLeft = (selectedIndex * itemWidth) - (containerWidth / 2) + (itemWidth / 2);
    
    // Ensure we don't scroll beyond bounds
    const maxScrollLeft = scrollWidth - containerWidth;
    const finalScrollLeft = Math.max(0, Math.min(targetScrollLeft, maxScrollLeft));
    
    container.scrollTo({
      left: finalScrollLeft,
      behavior: 'smooth'
    });
  };

  // Center the selected product when it changes
  useEffect(() => {
    if (selectedIndex !== -1) {
      // Small delay to ensure DOM is updated
      setTimeout(centerSelectedProduct, 100);
    }
  }, [selectedIndex, products.length]);

  // Check scroll state
  const checkScrollState = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  };

  // Initial scroll state check
  useEffect(() => {
    checkScrollState();
  }, [products.length]);

  // Handle scroll events
  const handleScroll = () => {
    checkScrollState();
  };

  // Scroll functions
  const scrollLeft = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const itemWidth = container.scrollWidth / products.length;
    container.scrollBy({
      left: -itemWidth,
      behavior: 'smooth'
    });
  };

  const scrollRight = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const itemWidth = container.scrollWidth / products.length;
    container.scrollBy({
      left: itemWidth,
      behavior: 'smooth'
    });
  };

  return (
    <div className={"w-full " + className}>
      <div className="relative">
        {/* Left scroll button */}
        {canScrollLeft && (
          <button
            onClick={scrollLeft}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 rounded-full p-1 shadow-md hover:shadow-lg transition-shadow"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
        )}
        
        {/* Right scroll button */}
        {canScrollRight && (
          <button
            onClick={scrollRight}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 rounded-full p-1 shadow-md hover:shadow-lg transition-shadow"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        )}

        <div 
          ref={scrollContainerRef}
          className="w-full overflow-x-auto custom-thin-scrollbar mb-4 pb-2"
          onScroll={handleScroll}
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 #f1f5f9'
          }}
        >
          <div
            className="flex gap-2 md:gap-3 pl-2 pr-2 items-start justify-start"
            style={{
              // Maintain fixed thumbnail sizes while allowing full width container
            }}
          >
            {products.map((item, idx) => (
              <div
                key={item.sparepartspage_path}
                className="snap-start w-[100px] h-[120px] sm:w-[120px] sm:h-[140px] md:w-[140px] md:h-[160px] shrink-0 flex items-start"
              >
                <ScrollerItem
                  item={item}
                  isActive={idx === currentIndex}
                  onClick={() => {
                    setSelectedIndex(idx);
                    onProductSelect(item);
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductScroller;


