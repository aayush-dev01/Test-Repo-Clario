import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three') || id.includes('@react-three')) return 'three';
            if (id.includes('framer-motion'))                         return 'motion';
            if (id.includes('firebase'))                              return 'firebase';
            if (id.includes('react-dom') || id.includes('react-router')) return 'react-vendor';
          }
        },
      },
    },
  },
});
