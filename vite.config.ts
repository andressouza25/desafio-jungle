import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Trace/report HTML is test output, not application content to hot-reload.
  server: { watch: { ignored: ['**/playwright-report/**', '**/test-results/**', '**/output/playwright/**'] } },
});
