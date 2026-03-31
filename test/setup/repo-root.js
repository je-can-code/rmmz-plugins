//region repo-root
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Absolute path to the rmmz-plugins repository root (parent of `test/`).
 */
export const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
//endregion repo-root
