import { defineConfig } from 'vitest/config';

// Block EditForms are React components, so the block tests render in jsdom.
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
});
