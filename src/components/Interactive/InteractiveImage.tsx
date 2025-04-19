
import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ImageData, Coordinate } from "@/types";

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

  // Calculate the position scale based on the original image size and current display size
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

    // Initial update
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
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      <img
        ref={imageRef}
        src={imagePath || "/placeholder.svg"}
        alt={imageData.imageName}
        className="w-full h-auto max-w-full"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = "/placeholder.svg";
        }}
      />

      {/* Circles for each coordinate */}
      {imageData.coordinates.map((coord) => {
        const scaledX = coord.x * scale;
        const scaledY = coord.y * scale;

        return (
          <motion.div
            key={coord.id}
            className="absolute"
            style={{
              left: `${scaledX}px`,
              top: `${scaledY}px`,
              transform: "translate(-50%, -50%)",
            }}
            whileHover={{ scale: 1.2 }}
            onHoverStart={() => onCircleHover(coord.number)}
            onHoverEnd={() => onCircleHover(null)}
            onClick={() => onCircleClick(coord.number)}
          >
            <motion.div
              className="flex items-center justify-center rounded-full bg-custom-blue text-white cursor-pointer"
              style={{
                width: "28px",
                height: "28px",
                fontSize: "12px",
              }}
              whileHover={{ backgroundColor: "#F97316" }}
              transition={{ duration: 0.3 }}
            >
              {coord.number}
            </motion.div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default InteractiveImage;
