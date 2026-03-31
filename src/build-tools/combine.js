/**
 * COMBINER
 *
 * OVERVIEW
 * This nodejs script is intended to be used to quickly combine all files from
 * a single given directory and its subdirectories into a single long file. This
 * can allow an RMMZ plugin dev to build out all the different functions and
 * overrides into separate files to keep things as organized as needed.
 *
 * NOTE:
 * This does not actually transpile or do any fancy footwork about bundling.
 * It literally just concatenates the files together, but thanks to the directory
 * structure convention laid out by the Initter utility I wrote, it works pretty
 * well anyway.
 *
 * USAGE:
 * To use this nodejs script, just run it with three arguments:
 *  1st arg = directory path to combine files from.
 *  2nd arg = output directory path for the single combined file.
 *  3rd arg = The name of the output file.
 *
 * SAMPLE INPUT:
 * $ node combine.js ./j/abs/ext/star ../plugins/j/abs/ext J-ABS-Star.js
 *
 * SAMPLE OUTPUT:
 * 🔊 starting cwd: /mnt/d/dev/code/gaming/ca/chef-adventure/js/src.
 * 🔊 source path: ./j/abs/ext/star
 * 🔊 output path: ../plugins/j/abs/ext
 * 🔊 output filename: J-ABS-Star.js
 * 🔊 output directory already exists; ../plugins/j/abs/ext
 * 🔊 found 12 files to combine.
 * 🔊 finished combining 13 files into 1 as J-ABS-Star.js
 * 👊 Combiner™ has completed execution. 💯✅
 */

import { globSync } from 'glob';
import * as fs from 'fs/promises';
import path from 'node:path';
import { SourceMapGenerator } from 'source-map';
import Logger, { LogStyle } from './logger.js';

// whether or not to include a timestamp of when this was bundled up.
const USE_BUNDLE_TIMESTAMP = false;

// do the work.
await main();

/**
 * The main function that will do the work.
 */
async function main()
{
  Logger.log(`starting in cwd: ${process.cwd()}`);

  // get the args.
  const [ SRC_PATH, OUT_PATH, OUT_FILENAME ] = getArgs();

  // determine the name.
  const filepathAndName = `${OUT_PATH}/${OUT_FILENAME}`;

  // validate the output directory exists.
  await validateOutputDir(OUT_PATH);

  // get the file paths for all js files to combine.
  const filePaths = getFilepaths(SRC_PATH, OUT_PATH);

  filePaths.forEach(filepath => Logger.log(filepath));

  // the files to concat.
  const files = await getFiles(filePaths);

  // check if we're adding the bundle timestamp.
  if (USE_BUNDLE_TIMESTAMP)
  {
    // determine the current timestamp for this bundle.
    const timestamp = new Date(Date.now()).toString();

    // transform the timestamp into a comment at the top of the files.
    const timestampString = `/*  BUNDLED TIME: ${timestamp}  */`;

    // add our timestamp to the front.
    files.unshift(timestampString);
  }

  // concat the files into 1.
  const separator = '\n\n';
  const bundledJs = files.join(separator);

  // build the sourcemap for mapping out/ back to src/ files.
  const bundleMap = buildSourceMap({
    files,
    filePaths,
    outFilename: OUT_FILENAME,
    separator,
  });

  // append sourcemap reference.
  const mapBasename = `${OUT_FILENAME}.map`;
  const bundledJsWithMapRef = `${bundledJs}\n\n//# sourceMappingURL=${mapBasename}\n`;

  // write the file to the designated location.
  await fs.writeFile(filepathAndName, bundledJsWithMapRef, 'utf-8');
  await fs.writeFile(`${filepathAndName}.map`, bundleMap, 'utf-8');

  Logger.log(`finished combining all files into 1.`, LogStyle.magenta);
  Logger.logAnyway(`Combiner™ has completed execution for ${OUT_FILENAME}.`, LogStyle.rainbow);
}

/**
 * Gets the passed in args, or defaults.
 * @returns {[string, string, string]} The three args.
 */
function getArgs()
{
  const args = process.argv.slice(2);

  const SRC_PATH = args[0] ?? './src';
  const OUT_PATH = args[1] ?? '../plugins/j';
  const OUT_FILENAME = args[2] ?? 'some_plugin.js';

  Logger.log(`source path: ${SRC_PATH}`, LogStyle.yellow);
  Logger.log(`output path: ${OUT_PATH}`, LogStyle.yellow);
  Logger.log(`output filename: ${OUT_FILENAME}`, LogStyle.yellow);

  return [ SRC_PATH, OUT_PATH, OUT_FILENAME ];
}

/**
 * Ensures the output directory exists, creating it (and any parents) if needed.
 * Uses recursive mkdir which is idempotent and safe under parallel execution.
 * @param {string} output_path The output path to confirm exists.
 */
async function validateOutputDir(output_path)
{
  // always call mkdir with recursive; it is a no-op if the directory already exists
  // and avoids a TOCTOU race when multiple builds run in parallel.
  await fs.mkdir(output_path, { recursive: true });

  Logger.log(`output directory ready: ${output_path}`, LogStyle.dim);
}

/**
 * Gets all paths associated with the
 * @returns {string[]} An array of the absolute paths to the js files.
 */
function getFilepaths(src, out)
{
  const options = {
    ignore: [ 'node_modules/**/*', out ],
    absolute: true
  };

  const filepaths = globSync(`${src}/**/*.js`, options);

  return filepaths.sort((a, b) =>
  {
    const left = a.toLowerCase();
    const right = b.toLowerCase();
    if (left < right) //sort string ascending
    {
      return -1;
    }
    if (left > right)
    {
      return 1;
    }
    return 0; //default return value (no sorting)
  });
}

/**
 * Retrieves all the js files as strings.
 * @param {string[]} filePaths The file paths to get js files.
 * @returns {Promise<string[]>} The js files.
 */
async function getFiles(filePaths)
{
  // initialize the files to collect.
  const files = [];

  // iterate over all the file paths.
  for (const filePath of filePaths)
  {
    // read the file.
    const file = await fs.readFile(filePath, 'utf-8');
    files.push(file);
  }

  Logger.log(`found ${files.length} files to combine.`, LogStyle.dim);

  // returns all the found files.
  return files;
}

/**
 * Builds a sourcemap that maps each generated line back to the original source file.
 * Because this build is pure concatenation, we map line-to-line at column 0.
 *
 * @param {object} args
 * @param {string[]} args.files The source file contents (in bundle order).
 * @param {string[]} args.filePaths The absolute paths for {@link args.files}.
 * @param {string} args.outFilename The output filename.
 * @param {string} args.separator The separator used between files.
 * @returns {string} The sourcemap json.
 */
function buildSourceMap(args)
{
  const {
    files,
    filePaths,
    outFilename,
    separator,
  } = args;

  const map = new SourceMapGenerator({ file: outFilename });

  // the current 1-based line number in the generated output.
  let generatedLine = 1;

  for (let fileIndex = 0; fileIndex < files.length; fileIndex++)
  {
    const content = files[fileIndex];
    const absolute = filePaths[fileIndex];
    const repoRelative = path.relative(process.cwd(), absolute).replaceAll('\\', '/');

    map.setSourceContent(repoRelative, content);

    // count lines in this file; split preserves a 1:1 line mapping for sourcemaps.
    const lines = content.split('\n');
    for (let originalLine = 1; originalLine <= lines.length; originalLine++)
    {
      map.addMapping({
        source: repoRelative,
        original: { line: originalLine, column: 0 },
        generated: { line: generatedLine, column: 0 },
      });
      generatedLine++;
    }

    // account for the separator between files, except after the last file.
    if (fileIndex < files.length - 1)
    {
      const separatorLines = separator.split('\n').length - 1;
      generatedLine += separatorLines;
    }
  }

  return map.toString();
}