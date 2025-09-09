import React, { useEffect, useMemo, useState } from "react";
import { IntelliPartsItem } from "@/types";
import { resolveItemThumbnail } from "@/utils/intelliPartsReader";
import dataCache from "@/utils/dataCache";

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
  const currentIndex = useMemo(
    () => products.findIndex((p) => p.sparepartspage_path === currentProductPath),
    [products, currentProductPath]
  );

  return (
    <div className={"ml-2 flex-1 min-w-0 " + className}>
      <div className="w-full overflow-x-auto no-scrollbar">
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
  );
};

export default ProductScroller;


