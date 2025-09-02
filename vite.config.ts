import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { generateDataIndex } from './scripts/generateDataIndex';

// Vite plugin to generate folder structure at build time
const folderStructurePlugin = () => {
  return {
    name: 'folder-structure-generator',
    buildStart() {
      generateDataIndex();
    },
    configureServer() {
      // Generate folder structure when dev server starts
      generateDataIndex();
    }
  };
};

export default defineConfig({
  plugins: [react(), folderStructurePlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    fs: {
      // Allow serving files from outside the project root
      allow: ['..']
    }
  },
  publicDir: 'public',
});
