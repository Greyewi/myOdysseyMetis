/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  root: __dirname,
  base: '/',
  server: { port: 4200, host: true },
  preview: { port: 4200, host: true },
  plugins: [react()],
  build: { outDir: 'dist', emptyOutDir: true },
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
});
