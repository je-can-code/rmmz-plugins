import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, mergeConfig } from 'vite';
// TODO: adjust ../ count so this resolves to repo-root vite.config.shared.js
//   plugins/<family>/core     → ../../../../vite.config.shared.js (four levels)
//   plugins/<family>/ext/<x> → ../../../../../vite.config.shared.js (five levels)
import shared from '../../../../vite.config.shared.js';

const _dirname = path.dirname(fileURLToPath(import.meta.url));

const thisConfig = defineConfig({
  build: {
    rolldownOptions: {
      input: {
        // TODO: out/ subpath + filename (e.g. template/J-TEMPLATE) must match plugins.js "name".
        '__template__/J-TEMPLATE': path.resolve(_dirname, './entry.js'),
      },
    },
  },
});

export default mergeConfig(shared, thisConfig);