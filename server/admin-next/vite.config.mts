import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/admin/',
  plugins: [react(), tailwindcss()],
  server: {
    open: false,
    hmr: { port: 24679 },
  },
  preview: {
    open: false,
  },
});
