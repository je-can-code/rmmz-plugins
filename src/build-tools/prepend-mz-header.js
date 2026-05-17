/**
 * PREPENDER
 *
 * OVERVIEW
 * Prepends an MZ _annotations.js comment block onto a built plugin ship file.
 * Combiner includes annotations via concat order; Vite bundles do not, so this
 * runs after vite build to restore the @plugindesc / @base header MZ expects.
 *
 * USAGE:
 *   node ./src/build-tools/prepend-mz-header.js <annotationsPath> <bundlePath>
 *
 * SAMPLE INPUT:
 *   node ./src/build-tools/prepend-mz-header.js \
 *     ./src/plugins/regions/core/_metadata/_annotations.js \
 *     ./out/regions/J-RegionEffects.js
 */

import fs from 'node:fs/promises';
import path from 'node:path';

import Logger, { LogStyle } from './logger.js';

/**
 * Prepends MZ plugin header text onto a bundled ship file.
 */
class Prepender
{
  /**
   * Reads args, validates paths, prepends header onto bundle in place.
   * @returns {Promise<void>}
   */
  static async execute()
  {
    const [ headerFile, pluginFile ] = Prepender.#getArgs();
    const headerPath = await Prepender.#resolveExistingFile(headerFile, 'annotations');
    const bundlePath = await Prepender.#resolveExistingFile(pluginFile, 'bundle');

    Logger.log(`annotations: ${headerPath}`, LogStyle.dim);
    Logger.log(`bundle: ${bundlePath}`, LogStyle.dim);

    const header = await fs.readFile(headerPath, 'utf8');
    const body = await fs.readFile(bundlePath, 'utf8');

    if (Prepender.#bundleAlreadyHasHeader(body, header) === true)
    {
      Logger.log('bundle already starts with this header; leaving file unchanged.', LogStyle.yellow);
      Logger.logAnyway('Prepender™ had nothing to do. 💯✅', LogStyle.rainbow);
      return;
    }

    const combined = `${header}\n\n${body}`;
    const output = Prepender.#stripTrailingNewlines(combined);

    await fs.writeFile(bundlePath, output, 'utf8');

    Logger.log(`prepended header onto ${path.basename(bundlePath)}.`, LogStyle.green);
    Logger.logAnyway('Prepender™ has completed execution. 💯✅', LogStyle.rainbow);
  }

  /**
   * Parses and validates CLI arguments.
   * @returns {[string, string]}
   */
  static #getArgs()
  {
    const [ headerFile, pluginFile ] = process.argv.slice(2);

    if (headerFile === undefined || headerFile === '')
    {
      throw new Error('Missing annotations path. Usage: node prepend-mz-header.js <annotationsPath> <bundlePath>');
    }

    if (pluginFile === undefined || pluginFile === '')
    {
      throw new Error('Missing bundle path. Usage: node prepend-mz-header.js <annotationsPath> <bundlePath>');
    }

    return [ headerFile, pluginFile ];
  }

  /**
   * Resolves a repo-relative or absolute path and ensures the file exists.
   * @param {string} filePath User-supplied path.
   * @param {string} label Short label for error messages.
   * @returns {string} Absolute path.
   */
  static async #resolveExistingFile(filePath, label)
  {
    const absolute = path.resolve(process.cwd(), filePath);

    try
    {
      const stat = await fs.stat(absolute);

      if (stat.isFile() === false)
      {
        throw new Error(`Expected a file for ${label}, but path is not a file: ${absolute}`);
      }
    }
    catch (err)
    {
      if (err !== null && typeof err === 'object' && err.code === 'ENOENT')
      {
        throw new Error(`Missing ${label} file: ${absolute}`);
      }

      throw err;
    }

    return absolute;
  }

  /**
   * Whether the bundle already begins with the same header text.
   * @param {string} body Current bundle contents.
   * @param {string} header Annotations file contents.
   * @returns {boolean}
   */
  static #bundleAlreadyHasHeader(body, header)
  {
    const normalizedHeader = header.trim();
    const normalizedBody = body.trimStart();

    if (normalizedBody.startsWith(normalizedHeader) === true)
    {
      return true;
    }

    // combiner output often starts with //region annotations before /*:
    if (normalizedBody.startsWith('/*:') === true && normalizedHeader.startsWith('/*:') === true)
    {
      return true;
    }

    return false;
  }

  /**
   * Workspace eol-last: never — strip trailing newlines from the final ship file.
   * @param {string} text Combined header and body.
   * @returns {string}
   */
  static #stripTrailingNewlines(text)
  {
    return text.replace(/\n+$/, '');
  }
}

Logger.enableLogging();

await Prepender.execute();