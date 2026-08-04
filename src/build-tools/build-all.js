/**
 * BUILDER
 *
 * OVERVIEW
 * Builds every plugin ship in the monorepo, in parallel, by finding them on disk.
 *
 * A ship is defined by its vite config, and that is the whole registry: a directory under
 * src/plugins holding a `vite.config.*.js` is a ship, and it is built. There is no second list to
 * keep in step, which is the point - this used to iterate the `scripts` block of package.json and
 * run each `build:` entry, and every problem that arrangement had came from the same root. A new
 * ship needed a hand-written script or it silently never built. The two lists drifted (three of the
 * seventy-eight spelled their config path differently, and nothing could notice). Any script that
 * did not match one of a dozen ignored prefixes was swept into the build, so adding an unrelated
 * one could make the build invoke itself. And it shelled out to `npm`, in a repo where bun is the
 * only sanctioned runtime.
 *
 * Where each bundle lands is unchanged, because it was never this script's decision: the output
 * path comes from the `input` key inside each ship's own vite config.
 *
 * USAGE:
 * There are no arguments. Run it with bun.
 *
 * SAMPLE INPUT:
 * $ bun ./src/build-tools/build-all.js
 *
 * SAMPLE OUTPUT:
 *
 * // imagine this is all your various build logs being output here.
 *
 * 👊 Builder™ has completed execution. 💯✅
 */

import { exec } from 'child_process';
import { glob } from 'glob';

import Logger, { LogStyle } from './logger.js';

// start for timings sake.
const start = performance.now();

/**
 * Every ship's vite config, which is also the list of ships.
 *
 * Sorted so the build log reads the same way twice, and so a failure is findable in it. `glob`
 * makes no promise about order on its own.
 * @type {string[]}
 */
const configPaths = (await glob('src/plugins/**/vite.config.*.js')).sort();

// a tree with no ships in it means the glob is wrong rather than that there is nothing to do, and
// finishing successfully having built nothing is the one outcome that must not look like success.
if (configPaths.length === 0)
{
  Logger.logAnyway('Builder™ found no vite configs under src/plugins - refusing to report success.', LogStyle.red);
  process.exit(1);
}

// initialize the collection of executions.
const executions = [];

// iterate over every ship discovered on disk.
for (const configPath of configPaths)
{
  // bun runs vite directly; there is no package.json script in between anymore.
  const command = `bunx vite build --config ${configPath}`;

  // capture the execution as a promise for parallelization.
  const execution = new Promise((resolve, reject) =>
  {
    const handleOutcome = (error, _stdout, stderr) =>
    {
      if (error)
      {
        const stderrText = stderr === undefined || stderr === null ? '' : String(stderr).trim();
        const snippet = stderrText.length > 0 ? stderrText.slice(0, 800) : '';
        const lines = [ `${command} failed: ${error.message}` ];
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
