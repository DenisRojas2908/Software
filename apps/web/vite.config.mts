import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// En desarrollo la web corre en :5173 y reenvía /api a Nest (:3000). En producción Nest sirve el build.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { proxy: { '/api': 'http://localhost:3000' } },
});
