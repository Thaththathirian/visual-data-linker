import React, { useState, useEffect, useRef, memo } from "react";
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

const DEFAULT_MIN_CIRCLE_SIZE = 17;
const DEFAULT_MAX_CIRCLE_SIZE = 32;
const MOBILE_MIN_CIRCLE_SIZE = 12;

// Improved rectangle settings for better text alignment
const BASE_RECT_WIDTH_FACTOR = 0.55;
const BASE_RECT_HEIGHT = 28;

// Create a memoized component for individual coordinate points
const CoordinatePoint = memo(
  ({
    coord,
    isHighlighted,
    scale,
    circleSize,
    circleFontSize,
    minCircleSize,
    maxCircleSize,
    onMouseEnter,
    onMouseLeave,
    onClick,
  }: {
    coord: any;
    isHighlighted: boolean;
    scale: number;
    circleSize: number;
    circleFontSize: number;
    minCircleSize: number;
    maxCircleSize: number;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
    onClick: (e: React.MouseEvent) => void;
  }) => {
    const useRectangle = coord.number.length >= 3;
    const digitCount = coord.number.length;

    // Adjust position for multi-digit labels
    const xOffset = digitCount >= 3 ? 28 : 0;
    const yOffset = digitCount >= 3 ? 15 : 0;

    // Calculate rectangle dimensions based on digit count
    const rectWidthFactor = digitCount >= 3 ? 0.45 : BASE_RECT_WIDTH_FACTOR;
    const rectWidth = Math.max(
      minCircleSize * 1.2,
      Math.min(
        maxCircleSize * 1.6,
        BASE_CIRCLE_SIZE * rectWidthFactor * digitCount * scale
      )
    );

    const rectHeight = Math.max(
      minCircleSize,
      Math.min(
        maxCircleSize,
        digitCount >= 3
          ? BASE_RECT_HEIGHT * scale * 0.9
          : BASE_RECT_HEIGHT * scale
      )
    );

    // Calculate the position with scaling and apply offsets
    const scaledX = (coord.x + xOffset) * scale;
    const scaledY = (coord.y + yOffset) * scale;

    return (
      <div
        className="absolute"
        style={{
          left: `${scaledX}px`,
          top: `${scaledY}px`,
          transform: `translate(-50%, -50%)`,
          pointerEvents: "auto",
          zIndex: 10,
        }}
      >
        <motion.div
          className={`flex items-center justify-center cursor-pointer ${
            useRectangle ? "rounded-md" : "rounded-full"
          }`}
          style={{
            width: useRectangle ? `${rectWidth}px` : `${circleSize}px`,
            height: useRectangle ? `${rectHeight}px` : `${circleSize}px`,
            fontSize: `${circleFontSize}px`,
            backgroundColor: isHighlighted
              ? HIGHLIGHT_COLOR
              : DEFAULT_CIRCLE_COLOR,
            color: isHighlighted ? "white" : "#5411a1",
            border: isHighlighted ? "2px solid #F97316" : "none",
            boxShadow: isHighlighted ? "0 0 0 4px #FFE4BA" : undefined,
            outline: isHighlighted ? "1px solid #FFD580" : undefined,
            fontWeight: isHighlighted ? 700 : 600,
            padding: useRectangle ? "0 6px" : 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: "1",
            textAlign: "center",
            transition: "background 0.2s, color 0.2s, transform 0.15s",
            whiteSpace: "nowrap",
            boxSizing: "border-box",
          }}
          whileHover={{
            scale: 1.08,
          }}
          animate={{
            backgroundColor: isHighlighted
              ? "rgba(249, 115, 22, 1)"
              : "rgba(229, 222, 255, 1)",
          }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onClick={onClick}
        >
          <span
            style={{
              display: "inline-block",
              lineHeight: "1",
              // padding: useRectangle ? "1px 1px 0" : 0,
              margin: 0,
              position: "relative",
              top: useRectangle ? "1px" : 0,
              // This is crucial for vertical alignment
              transform: "translateY(0)",
              textAlign: "center",
              width: "100%",
            }}
          >
            {coord.number}
          </span>
        </motion.div>
      </div>
    );
  }
);

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

  // Implement lazy loading for images
  const [imageStartedLoading, setImageStartedLoading] = useState(false);

  // Use intersection observer for lazy loading
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !imageStartedLoading) {
          setImageStartedLoading(true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [imageStartedLoading]);

  // Auto-retry loading the image with a delay
  useEffect(() => {
    if (imageError && retryCount < 3) {
      const timer = setTimeout(() => {
        console.log(
          `Retrying image load attempt ${retryCount + 1} for: ${imagePath}`
        );
        setImageError(false);
        setRetryCount((prev) => prev + 1);
      }, 1000 * (retryCount + 1));

      return () => clearTimeout(timer);
    }
  }, [imageError, retryCount, imagePath]);

  // Handle image resizing
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

    if (
      imageRef.current &&
      imageRef.current.complete &&
      imageRef.current.naturalWidth
    ) {
      updateScale();
      setImageLoaded(true);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [imagePath, imageStartedLoading]);

  // Detect mobile devices
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleImageLoad = () => {
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
  const minCircleSize = isMobile
    ? MOBILE_MIN_CIRCLE_SIZE
    : DEFAULT_MIN_CIRCLE_SIZE;
  const maxCircleSize = DEFAULT_MAX_CIRCLE_SIZE;

  // Make the circles and font scale with image
  const circleSize = Math.max(
    minCircleSize,
    Math.min(maxCircleSize, BASE_CIRCLE_SIZE * scale)
  );

  const circleFontSize = Math.max(
    minCircleSize * 0.5,
    Math.min(maxCircleSize * 0.65, BASE_FONT_SIZE * scale)
  );

  // Display placeholder if image fails to load
  if (imageError && retryCount >= 3) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg w-full h-[400px]">
        <div className="text-center p-4">
          <div className="text-red-500 text-4xl mb-4">📷</div>
          <h3 className="text-lg font-semibold text-gray-700">
            Image Failed to Load
          </h3>
          <p className="text-gray-500 mt-2">
            Could not load image: {imagePath}
          </p>
          <div className="mt-4 p-2 bg-gray-50 rounded text-sm text-gray-600">
            <p className="mb-2">
              <strong>Troubleshooting:</strong>
            </p>
            <ul className="list-disc pl-5 text-left space-y-1">
              <li>Check that the image exists in the correct folder</li>
              <li>
                Verify the image has a supported extension (.jpg, .jpeg, .png,
                .webp, .gif)
              </li>
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

      {imageStartedLoading && (
        <img
          ref={imageRef}
          src={imagePath}
          alt={imageData.imageName}
          className={`w-full h-auto ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          style={{
            maxWidth: "100%",
            height: "auto",
            objectFit: "contain",
            transition: "opacity 0.3s",
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
      )}

      {imageLoaded &&
        imageData.coordinates.map((coord) => (
          <CoordinatePoint
            key={coord.id}
            coord={coord}
            isHighlighted={highlightedNumber === coord.number}
            scale={scale}
            circleSize={circleSize}
            circleFontSize={circleFontSize}
            minCircleSize={minCircleSize}
            maxCircleSize={maxCircleSize}
            onMouseEnter={() => onCircleHover(coord.number)}
            onMouseLeave={() => onCircleHover(null)}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCircleClick(coord.number);
            }}
          />
        ))}
    </div>
  );
};

export default memo(InteractiveImage);
