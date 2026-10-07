import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@harmolody/ui': fileURLToPath(
        new URL('../../dist/ui/fesm2022/harmolody-ui.mjs', import.meta.url),
      ),
    },
  },
});
