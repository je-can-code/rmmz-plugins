/**
 * INITTER
 *
 * OVERVIEW
 * This nodejs script is intended to be used to quickly scaffold a group of
 * common directories using this opinionated way of dividing up RMMZ plugin
 * code logic. This also assumes it will be ran from the convenient package.json
 * commands found in the root package.json of this plugins monorepo project.
 *
 * USAGE:
 * To use this script, just run it with a single argument:
 *  1st arg = root path directory.
 *
 * SAMPLE INPUT:
 * $ bun init.js abs/ext/charge
 *
 * OR
 * RUNNING FROM THE PLUGIN-PROJECT-LEVEL
 * $ bun run plugin:init abs/ext/charge
 *
 * SAMPLE OUTPUT:
 * 🔉 working directory: Z:\dev\gaming\rmmz-plugins
 * ✨ target directory created: ./src/plugins/abs/ext/poses
 * ✨ copied [Z:\dev\gaming\rmmz-plugins\src\plugin-template] to [Z:\dev\gaming\rmmz-plugins\src\plugins\abs\ext\poses]
 * (the same two lines again, for the book)
 * ✨ Initter™ has completed execution. 💯✅
 *
 * The plugin gets its book at the same time, mirrored from the book template into docs/plugins at the
 * same path. The book is the plugin's manual and the source of its MZ header, and verify:book-freshness
 * fails any plugin without one, so the two always start out together.
 *
 * After init, read SCAFFOLD.md in the new plugin folder (namespace, vite config, entry imports, the book).
 * The vite config is what registers the ship with the build; there is no build script to add.
 */

import Mirror from './mirror.js';
import Logger, { LogStyle } from './logger.js';

/**
 * Initializes a new directory for the purpose of developing a new plugin.
 */
class Initter
{
  /**
   * The path for where the plugin template being mirrored resides.
   * @type {string}
   */
  static PLUGIN_TEMPLATE_PATH = './src/plugin-template';

  /**
   * The base path where all the plugins live that will be prepended to the target plugin path.
   * @type {string}
   */
  static DEFAULT_BASE_PLUGIN_PATH = './src/plugins';

  /**
   * The path for where the book template being mirrored resides.
   * @type {string}
   */
  static BOOK_TEMPLATE_PATH = './src/book-template';

  /**
   * The base path where all the books live that will be prepended to the target plugin path.<br/>
   * A book sits at the same path under here as its plugin does under the plugins path.
   * @type {string}
   */
  static DEFAULT_BASE_BOOK_PATH = './docs/plugins';

  /**
   * Scaffolds a new dev plugin directory at the given destination.
   * @return {Promise<void>}
   */
  static async init()
  {
    Logger.log(`working directory: ${process.cwd()}`, LogStyle.dim);

    // derive a new mirror for mirroring our template.
    const mirror = new Mirror();
    mirror.setSource(this.PLUGIN_TEMPLATE_PATH);

    // clone the template into the destination.
    await mirror.mirrorToDestination(`${this.DEFAULT_BASE_PLUGIN_PATH}/${destinationPath}`);

    // every plugin needs a book, so clone the book template to the same path among the books.
    mirror.setSource(this.BOOK_TEMPLATE_PATH);
    await mirror.mirrorToDestination(`${this.DEFAULT_BASE_BOOK_PATH}/${destinationPath}`);

    // Emit this message even when logging is muted.
    Logger.logAnyway(`Initter™ has completed execution.`, LogStyle.rainbow);
  }
}

// explicitly enable logging.
Logger.enableLogging();

// get the path provided by the user to clone the template into.
const destinationPath = process.argv.slice(2)
  .at(0);

// do the needful.
await Initter.init(destinationPath);