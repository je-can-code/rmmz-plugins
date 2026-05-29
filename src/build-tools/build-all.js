/**
 * BUILDER
 *
 * OVERVIEW
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
import Logger, { LogStyle } from './logger.js';

// start for timings sake.
const start = performance.now();

// don't recursively build everything, or start generating a bunch of empty directories.
const ignoredKeys = [
  'plugin:',
  'copy:',
  'build:all',
  'hotfix',
  'test',
  'clean:',
  'migrate:',
  'verify:',
  'defs:',
];

// extract the scripts section of our package.json.
const { scripts } = pkg;

// initialize the collection of executions.
const executions = [];

// iterate over all the scripts from the "scripts" section of the package.json.
for (const key in scripts)
{
  if (ignoredKeys.some(ignoredKey => key.startsWith(ignoredKey)))
  {
    Logger.log(`skipping: [${key}] because it starts with an ignored prefix.`);
    continue;
  }

  // dictate the command.
  const command = `npm run ${key}`;

  // capture the execution as a promise for parallelization.
  const execution = new Promise((resolve, reject) =>
  {
    const handleOutcome = (error, _stdout, stderr) =>
    {
      if (error)
      {
        const stderrText = stderr === undefined || stderr === null ? '' : String(stderr).trim();
        const snippet = stderrText.length > 0 ? stderrText.slice(0, 800) : '';
        const lines = [`${command} failed: ${error.message}`];
        if (snippet.length > 0)
        {
          lines.push(snippet);
        }
        reject(new Error(lines.join('\n')));
        return;
      }

      resolve();
    };

    Logger.log(command, LogStyle.yellow);

    const childProc = exec(command, handleOutcome);

    childProc.stdout.on('data', data => Logger.log(data));
    childProc.stderr.on('data', data => Logger.log(data));
  });

  // add the execution to the collection.
  executions.push(execution);
}

try
{
  await Promise.all(executions);
}
catch (err)
{
  console.error(err);
  process.exit(1);
}

// capture the duration of this build-all execution in seconds.
const durationSeconds = ((performance.now() - start) / 1000).toFixed(3);
Logger.logAnyway(
  `Builder™ has completed building all ${executions.length} plugins in ${durationSeconds}s.`,
  LogStyle.rainbow
);