import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, mergeConfig } from 'vite';
import shared from '../../../../../vite.config.shared.js';

const _dirname = path.dirname(fileURLToPath(import.meta.url));

const thisConfig = defineConfig({
  build: {
    rolldownOptions: {
      // StorageManager uses runtime require('path'/'fs') under NW.js — do not browser-stub them.
      external: [ 'path', 'fs' ],
      input: {
        'base/ext/J-Base-Save': path.resolve(_dirname, './entry.js'),
      },
    },
  },
});

export default mergeConfig(shared, thisConfig);
