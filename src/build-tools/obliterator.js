/**
 * OBLITERATOR
 *
 * OVERVIEW
 * This nodejs script is intended to be used to quickly remove all files from a
 * given directory.
 *
 * NOTE:
 * Obviously you should be careful with where you point this thing, its loaded and dangerous!
 *
 * USAGE:
 * Supply a space-seperated list of directories to obliterate.
 *
 * SAMPLE INPUT:
 * $ node obliterator.js ./out ./dist
 *
 * SAMPLE OUTPUT:
 *
 * obliterated: /path/to/out
 * obliterated: /path/to/dist
 * Obliterator™ finished in 0.123s.
 */

import * as fs from 'fs/promises';
import path from 'path';
import Logger, { LogStyle } from './logger.js';

// start timer for funsies.
const start = performance.now();

// Directories to obliterate; defaults to ./out if none given.
const targets = process.argv.slice(2);
const directories = targets.length
  ? targets
  : [ './out' ];

for (const dir of directories)
{
  // Resolve to absolute path for clear logs.
  const resolved = path.resolve(dir);

  // Remove the directory and everything inside it, no questions asked.
  await fs.rm(
    resolved,
    {
      recursive: true,
      force: true
    }
  );

  // Recreate the (now-empty) directory.
  await fs.mkdir(resolved, { recursive: true });

  // Loud and proud.
  Logger.logAnyway(`erased [${resolved}]`, LogStyle.magenta);
}

// victory lap!
const durationSeconds = ((performance.now() - start) / 1000).toFixed(3);
Logger.logAnyway(
  `Obliterator™ has finished erasing [ ${directories.join(', ')} ] in ${durationSeconds}s.`,
  LogStyle.rainbow
);