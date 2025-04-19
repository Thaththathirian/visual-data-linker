
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ImageData } from "@/types";

interface InteractiveImageProps {
  imagePath: string;
  imageData: ImageData;
  onCircleHover: (number: string | null) => void;
  onCircleClick: (number: string) => void;
}

const InteractiveImage: React.FC<InteractiveImageProps> = ({
  imagePath,
  imageData,
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

  const handleCircleClick = (e: React.MouseEvent, number: string) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div ref={containerRef} className="relative w-full overflow-auto bg-white rounded-lg">
      <img
        ref={imageRef}
        src={imagePath}
        alt={imageData.imageName}
        className="w-full h-auto"
      />

      {imageData.coordinates.map((coord) => {
        const scaledX = coord.x * scale;
        const scaledY = coord.y * scale;

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
              className="flex items-center justify-center rounded-full bg-custom-blue text-white cursor-pointer"
              style={{
                width: "26px",
                height: "26px",
                fontSize: "12px",
              }}
              whileHover={{ 
                backgroundColor: "#F97316",
                scale: 1.05
              }}
              transition={{ duration: 0.2 }}
              onMouseEnter={() => onCircleHover(coord.number)}
              onMouseLeave={() => onCircleHover(null)}
              onClick={(e) => handleCircleClick(e, coord.number)}
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
