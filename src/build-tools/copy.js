import * as fs from 'fs/promises';
import Logger from './logger.js';

async function main()
{
  Logger.log(`starting in cwd: ${process.cwd()}`);
}

/**
 * Gets the passed in args, or defaults.
 */
function getArgs()
{
  const args = process.argv.slice(2);

  const destination = args.at(0) ?? "../somewhere-else";

  // TODO: build copy script for self to get these to local folder.
  // TODO: upgrade copy script for generic re-use.

  Logger.log(`source path: ${destination}`);

  return [/* args TBD */];
}