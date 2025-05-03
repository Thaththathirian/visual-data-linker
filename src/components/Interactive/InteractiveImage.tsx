
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ImageData } from "@/types";
import { toast } from "sonner";

interface InteractiveImageProps {
  imagePath: string;
  imageData: ImageData;
  highlightedNumber: string | null;
  onCircleHover: (number: string | null) => void;
  onCircleClick: (number: string) => void;
}

const HIGHLIGHT_COLOR = "#F97316";
const DEFAULT_CIRCLE_COLOR = "#E5DEFF"; // Soft Purple

const BASE_CIRCLE_SIZE = 28; // px, for image natural width
const BASE_FONT_SIZE = 13; // px

// Default min and max sizes
const DEFAULT_MIN_CIRCLE_SIZE = 17; // px, prevent too small on mobile
const DEFAULT_MAX_CIRCLE_SIZE = 32; // px, prevent too big

// Smaller min size on very small screens
const MOBILE_MIN_CIRCLE_SIZE = 12;

// Rectangular shape settings
const BASE_RECT_WIDTH_FACTOR = 0.7; // Reduced factor for tighter fit
const BASE_RECT_HEIGHT = 28; // Base height for rectangle, same as circle
const RECT_HORIZONTAL_PADDING = "2px"; // Consistent minimal horizontal padding for all digits

const InteractiveImage: React.FC<InteractiveImageProps> = ({
  imagePath,
  imageData,
  highlightedNumber,
  onCircleHover,
  onCircleClick,
}) => {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const [naturalWidth, setNaturalWidth] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Use effect to auto-retry loading the image with a delay (up to 3 times)
  useEffect(() => {
    if (imageError && retryCount < 3) {
      const timer = setTimeout(() => {
        console.log(`Retrying image load attempt ${retryCount + 1} for: ${imagePath}`);
        setImageError(false);
        setRetryCount(prev => prev + 1);
      }, 1000 * (retryCount + 1)); // Exponential backoff
      
      return () => clearTimeout(timer);
    }
  }, [imageError, retryCount, imagePath]);

  useEffect(() => {
    const updateScale = () => {
      if (imageRef.current && imageRef.current.naturalWidth) {
        const naturalW = imageRef.current.naturalWidth;
        const displayW = imageRef.current.clientWidth;
        setScale(displayW / naturalW);
        setNaturalWidth(naturalW);
        setImageSize({
          width: displayW,
          height: imageRef.current.clientHeight,
        });
      }
    };

    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    if (imageRef.current && imageRef.current.complete && imageRef.current.naturalWidth) {
      updateScale();
      setImageLoaded(true);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [imagePath]);

  // Detect if screen width is small (mobile)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640); // sm breakpoint approx
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleImageLoad = () => {
    console.log("Image loaded successfully:", imagePath);
    setImageLoaded(true);
    setImageError(false);
    
    if (imageRef.current && imageRef.current.naturalWidth) {
      const naturalW = imageRef.current.naturalWidth;
      const displayW = imageRef.current.clientWidth;
      setScale(displayW / naturalW);
      setNaturalWidth(naturalW);
      setImageSize({
        width: displayW,
        height: imageRef.current.clientHeight,
      });
    }
  };

  const handleImageError = () => {
    console.error("Failed to load image:", imagePath);
    setImageLoaded(false);
    setImageError(true);
    
    if (retryCount >= 3) {
      toast.error("Image could not be loaded after multiple attempts.");
    }
  };
  
  const handleRetryClick = () => {
    setImageError(false);
    setImageLoaded(false);
    setRetryCount(0);
    
    // Add a cache-busting parameter to force a fresh load
    if (imageRef.current) {
      imageRef.current.src = `${imagePath}?t=${Date.now()}`;
    }
  };

  // Choose min circle size depending on mobile or not
  const minCircleSize = isMobile ? MOBILE_MIN_CIRCLE_SIZE : DEFAULT_MIN_CIRCLE_SIZE;

  // Make the circles and font scale with image, clamp for reasonable size
  const circleSize = Math.max(
    minCircleSize,
    Math.min(DEFAULT_MAX_CIRCLE_SIZE, BASE_CIRCLE_SIZE * scale)
  );
  const circleFontSize = Math.max(
    minCircleSize * 0.5,
    Math.min(DEFAULT_MAX_CIRCLE_SIZE * 0.65, BASE_FONT_SIZE * scale)
  );

  // Display placeholder if image fails to load
  if (imageError && retryCount >= 3) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg w-full h-[400px]">
        <div className="text-center p-4">
          <div className="text-red-500 text-4xl mb-4">📷</div>
          <h3 className="text-lg font-semibold text-gray-700">Image Failed to Load</h3>
          <p className="text-gray-500 mt-2">Could not load image: {imagePath}</p>
          <div className="mt-4 p-2 bg-gray-50 rounded text-sm text-gray-600">
            <p className="mb-2"><strong>Troubleshooting:</strong></p>
            <ul className="list-disc pl-5 text-left space-y-1">
              <li>Check that the image exists in <code>public/images/</code> directory</li>
              <li>Verify the image has a supported extension (.jpg, .jpeg, .png, .webp, .gif)</li>
              <li>Ensure the filename matches your JSON file name</li>
            </ul>
          </div>
          <button 
            onClick={handleRetryClick}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="relative w-full h-full bg-white rounded-lg min-h-[400px]"
    >
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-custom-blue"></div>
          <p className="ml-3 text-gray-500">Loading image...</p>
        </div>
      )}
      
      <img
        ref={imageRef}
        src={imagePath}
        alt={imageData.imageName}
        className={`w-full h-auto ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        style={{ maxWidth: "100%", height: "auto", objectFit: "contain", transition: "opacity 0.3s" }}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />

      {imageLoaded && imageData.coordinates.map((coord) => {
        const scaledX = coord.x * scale;
        const scaledY = coord.y * scale;
        const isHighlighted = highlightedNumber === coord.number;
        
        // Determine if we should use rectangle based on number length
        const useRectangle = coord.number.length >= 3;
        const digitCount = coord.number.length;
        
        // Calculate rectangle width based on digit count - tighter fit
        // Use consistent calculation for all digit counts
        const rectWidth = Math.max(
          minCircleSize * 1.1,
          Math.min(DEFAULT_MAX_CIRCLE_SIZE * 1.3, BASE_CIRCLE_SIZE * BASE_RECT_WIDTH_FACTOR * digitCount * scale)
        );
        
        // Calculate rectangle height
        const rectHeight = Math.max(
          minCircleSize,
          Math.min(DEFAULT_MAX_CIRCLE_SIZE, BASE_RECT_HEIGHT * scale)
        );

        return (
          <div
            key={coord.id}
            className="absolute"
            style={{
              left: `${scaledX}px`,
              top: `${scaledY}px`,
              transform: "translate(-50%, -50%)",
              pointerEvents: "auto",
              zIndex: 10,
            }}
          >
            <motion.div
              className={`flex items-center justify-center cursor-pointer ${useRectangle ? 'rounded-md' : 'rounded-full'}`}
              style={{
                width: useRectangle ? `${rectWidth}px` : `${circleSize}px`,
                height: useRectangle ? `${rectHeight}px` : `${circleSize}px`,
                fontSize: `${circleFontSize}px`,
                backgroundColor: isHighlighted ? HIGHLIGHT_COLOR : DEFAULT_CIRCLE_COLOR,
                color: isHighlighted ? "white" : "#5411a1",
                border: isHighlighted ? "2px solid #F97316" : "none",
                boxShadow: isHighlighted ? "0 0 0 4px #FFE4BA" : undefined,
                outline: isHighlighted ? "1px solid #FFD580" : undefined,
                fontWeight: isHighlighted ? 700 : 600,
                padding: useRectangle ? `0 ${RECT_HORIZONTAL_PADDING}` : 0,
                transition: "background 0.2s, color 0.2s, transform 0.15s, width 0.18s, height 0.18s",
              }}
              whileHover={{
                scale: 1.08, 
                // boxShadow: "0 0 0 3px #FFE4BA",
              }}
              onMouseEnter={() => onCircleHover(coord.number)}
              onMouseLeave={() => onCircleHover(null)}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onCircleClick(coord.number);
              }}
            >
              {coord.number}
            </motion.div>
          </div>
        );
      })}
    </div>
  );
};

export default InteractiveImage;
