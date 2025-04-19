
import React from "react";
import { AnimatePresence } from "framer-motion";
import Home from "./Home";

const Index = () => {
  return (
    <AnimatePresence mode="wait">
      <Home />
    </AnimatePresence>
  );
};

export default Index;
