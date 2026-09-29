import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isAdmin = mode === 'admin';
  const port = isAdmin ? 5174 : 5173;

  return {
    plugins: [react()],
    server: {
      port,
      strictPort: false
    },
    build: {
      outDir: isAdmin ? 'dist-admin' : 'dist',
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/@firebase/firestore') || id.includes('node_modules/firebase/firestore')) {
              return 'vendor-firestore';
            }
            if (id.includes('node_modules/@firebase/auth') || id.includes('node_modules/firebase/auth')) {
              return 'vendor-auth';
            }
            if (id.includes('node_modules/firebase') || id.includes('node_modules/@firebase')) {
              return 'vendor-firebase-core';
            }
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) {
              return 'vendor-react';
            }
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('node_modules/jose') || id.includes('node_modules/qrcode') || id.includes('node_modules/canvas-confetti')) {
              return 'vendor-utils';
            }
          }
        }
      }
    }
  };
});
