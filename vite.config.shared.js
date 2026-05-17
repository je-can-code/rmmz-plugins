import { defineConfig } from 'vite';
import { prependMzHeaderPlugin } from "./src/build-tools/vite-plugin_rmmz-header-prepender.js";

export default defineConfig({
  plugins: [prependMzHeaderPlugin()],
  build: {
    outDir: 'out',
    emptyOutDir: false,
    minify: false,
    target: 'esnext',
    sourcemap: true,
    rolldownOptions: {
      output: {
        entryFileNames: '[name].js',
        format: 'es',
        codeSplitting: false,
        minify: false,
      },
      treeshake: false,
    },
  },
});