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
      className={`flex flex-col items-start justify-start shrink-0 select-none rounded-md border transition-colors focus:outline-none focus:ring-0 focus:ring-offset-0 overflow-hidden text-left px-2 py-1 w-full h-full ${
        isActive
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 hover:border-gray-300 bg-white hover:bg-blue-50 active:bg-blue-100"
      }`}
      title={item.sparepartspage_name}
    >
      <div className="w-full text-[11px] leading-tight font-medium text-gray-700 line-clamp-2 mb-1">
        {item.sparepartspage_name}
      </div>
      <div className="relative w-full aspect-[4/3] rounded-sm bg-gray-100 overflow-hidden">
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

  const currentIndex = useMemo(
    () => products.findIndex((p) => p.sparepartspage_path === currentProductPath),
    [products, currentProductPath]
  );

  // Function to center the current product
  const centerCurrentProduct = () => {
    const container = scrollContainerRef.current;
    if (!container || currentIndex === -1) return;

    const containerWidth = container.clientWidth;
    const scrollWidth = container.scrollWidth;
    
    // Calculate the position to center the current item
    const itemWidth = scrollWidth / products.length;
    const targetScrollLeft = (currentIndex * itemWidth) - (containerWidth / 2) + (itemWidth / 2);
    
    // Ensure we don't scroll beyond bounds
    const maxScrollLeft = scrollWidth - containerWidth;
    const finalScrollLeft = Math.max(0, Math.min(targetScrollLeft, maxScrollLeft));
    
    container.scrollTo({
      left: finalScrollLeft,
      behavior: 'smooth'
    });
  };

  // Center the current product when it changes
  useEffect(() => {
    if (currentIndex !== -1) {
      // Small delay to ensure DOM is updated
      setTimeout(centerCurrentProduct, 100);
    }
  }, [currentIndex, products.length]);

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
    <div className={"ml-2 flex-1 min-w-0 " + className}>
      <div className="relative">
        {/* Left scroll button */}
        {canScrollLeft && (
          <button
            onClick={scrollLeft}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 rounded-full p-1 shadow-md hover:shadow-lg transition-shadow"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
        )}
        
        {/* Right scroll button */}
        {canScrollRight && (
          <button
            onClick={scrollRight}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 rounded-full p-1 shadow-md hover:shadow-lg transition-shadow"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        )}

        <div 
          ref={scrollContainerRef}
          className="w-full overflow-x-auto no-scrollbar"
          onScroll={handleScroll}
        >
          <div
            className="flex gap-2 md:gap-3 pr-1 items-start"
            style={{
              // use flex-basis to get 2/3/4 visible items depending on width
              // Tailwind doesn't have basis fractions for arbitrary containers, so combine classes below
            }}
          >
            {products.map((item, idx) => (
              <div
                key={item.sparepartspage_path}
                className="snap-start basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/4 xl:basis-1/4 max-w-[50%] sm:max-w-[33.333%] md:max-w-[25%] shrink-0"
              >
                <ScrollerItem
                  item={item}
                  isActive={idx === currentIndex}
                  onClick={() => onProductSelect(item)}
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


