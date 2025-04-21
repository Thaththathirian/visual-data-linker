
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ImageData } from "@/types";

interface InteractiveImageProps {
  imagePath: string;
  imageData: ImageData;
  highlightedNumber: string | null;
  onCircleHover: (number: string | null) => void;
  onCircleClick: (number: string) => void;
}

const HIGHLIGHT_COLOR = "#F97316";
const DEFAULT_CIRCLE_COLOR = "#E5DEFF"; // Soft Purple

const InteractiveImage: React.FC<InteractiveImageProps> = ({
  imagePath,
  imageData,
  highlightedNumber,
  onCircleHover,
  onCircleClick,
}) => {
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const updateScale = () => {
      if (imageRef.current && imageRef.current.naturalWidth) {
        const naturalWidth = imageRef.current.naturalWidth;
        const displayWidth = imageRef.current.clientWidth;
        setScale(displayWidth / naturalWidth);
        setImageSize({
          width: imageRef.current.clientWidth,
          height: imageRef.current.clientHeight,
        });
      }
    };

    const observer = new ResizeObserver(updateScale);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    if (imageRef.current && imageRef.current.complete) {
      updateScale();
    } else if (imageRef.current) {
      imageRef.current.onload = updateScale;
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, [imagePath]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-white rounded-lg">
      <img
        ref={imageRef}
        src={imagePath}
        alt={imageData.imageName}
        className="w-full h-auto"
        style={{maxWidth: "100%", height: "auto", objectFit: "contain"}}
      />

      {imageData.coordinates.map((coord) => {
        const scaledX = coord.x * scale;
        const scaledY = coord.y * scale;
        const isHighlighted = highlightedNumber === coord.number;
        return (
          <div
            key={coord.id}
            className="absolute"
            style={{
              left: `${scaledX}px`,
              top: `${scaledY}px`,
              transform: "translate(-50%, -50%)",
              pointerEvents: "auto",
              zIndex: 10
            }}
          >
            <motion.div
              className="flex items-center justify-center rounded-full cursor-pointer"
              style={{
                width: "28px",
                height: "28px",
                fontSize: "13px",
                backgroundColor: isHighlighted ? HIGHLIGHT_COLOR : DEFAULT_CIRCLE_COLOR,
                color: isHighlighted ? "white" : "#5411a1",
                border: isHighlighted ? "2px solid #F97316" : "none",
                boxShadow: isHighlighted ? "0 0 0 4px #FFE4BA" : undefined,
                outline: isHighlighted ? "1px solid #FFD580" : undefined,
                fontWeight: isHighlighted ? 700 : 600,
                transition: "background 0.22s, color 0.22s, box-shadow 0.18s"
              }}
              whileHover={{ 
                backgroundColor: HIGHLIGHT_COLOR,
                color: "white",
                scale: 1.08,
                border: "2px solid #F97316"
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
