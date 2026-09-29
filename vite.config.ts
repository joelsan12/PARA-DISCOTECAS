import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isAdmin = mode === 'admin';
  const port = isAdmin ? 5174 : 5173;

  // Los builds con modo propio (client/admin) NO cargan .env.production
  // automáticamente (solo .env.[mode]). Para que build:client/build:admin
  // vean las mismas variables de despliegue que `vite build`, las fusionamos
  // explícitamente aquí; así la lectura dinámica de import.meta.env en
  // src/lib/firebase.ts y ticketPass.ts también las recibe.
  const productionEnv = mode === 'production' ? {} : loadEnv('production', process.cwd(), 'VITE_');
  const productionDefine = Object.fromEntries(
    Object.entries(productionEnv).map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)])
  );

  return {
    plugins: [react()],
    define: productionDefine,
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
