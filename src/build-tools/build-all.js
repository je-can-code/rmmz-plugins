/**
 * BUILDER
 *
 * OVERVIEW:
 * This nodejs script is intended to be used to quickly execute ALL "once:" types
 * of builds present in ../ directory's package.json. This is designed to run them
 * in parallel
 *
 * NOTE:
 * This takes advantage of import assertions to get the package.json. You may need
 * to ensure you have the latest nodejs installed to run it.
 *
 * USAGE:
 * There are no additional arguments required, just use node to run it.
 *
 * SAMPLE INPUT:
 * $ node build-all.js
 *
 * SAMPLE OUTPUT:
 *
 * // imagine this is all your various build logs being output here.
 *
 * 👊 Builder™ has completed execution. 💯✅
 */

import { exec } from 'child_process';
import * as fs from 'fs/promises';
const pkg = JSON.parse(await fs.readFile('./package.json', 'utf-8'));
import Logger from './logger.js';

// start for timings sake.
const start = performance.now();

// don't recursively build everything, or start generating a bunch of empty directories.
const ignoredKeys = ["plugin:", "copy:", "build:all", "hotfix"];

// extract the scripts section of our package.json.
const { scripts } = pkg;

// initialize the collection of executions.
const executions = [];

// iterate over all the scripts from the "scripts" section of the package.json.
for (const key in scripts)
{
  if (ignoredKeys.some(ignoredKey => key.startsWith(ignoredKey)))
  {
    Logger.log(`skipping: [${key}] because it starts with an ignored prefix.`)
    continue;
  }

  // dictate the command.
  const command = `npm run ${key}`;

  // capture the execution as a promise for parallelization.
  const execution = new Promise(resolve =>
  {
    const handleOutcome = (error, stdout, stderr) =>
    {
      if (error)
      {
        console.error(`exec error: ${error}`);
        return;
      }

      resolve();
    }

    Logger.log(command);

    // kick off the command.
    const process = exec(command, handleOutcome);

    // track the output and log it.
    process.stdout.on('data', data => Logger.log(data));
  })

  // add the execution to the collection.
  executions.push(execution);
}

// wait for all the promises to finish.
await Promise.all(executions);

// capture the duration of this build-all execution in seconds.
const durationSeconds = ((performance.now() - start) / 1000).toFixed(3);
Logger.logAnyway(`Builder™ has completed building all plugins in ${durationSeconds}s. 💯✅`);
