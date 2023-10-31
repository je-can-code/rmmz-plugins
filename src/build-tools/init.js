/**
 * INITTER
 *
 * OVERVIEW:
 * This nodejs script is intended to be used to quickly scaffold a group of
 * common directories using this opinionated way of dividing up RMMZ plugin
 * code logic.
 *
 * USAGE:
 * To use this nodejs script, just run it with a single argument:
 *  1st arg = root path directory.
 *
 * SAMPLE INPUT:
 * $ node init.js ./j/abs/ext/charge
 *
 * SAMPLE OUTPUT:
 * 🔉 working directory: D:\dev\gaming\rmmz-plugins
 * ✨ copied [~\src\plugin-template] to [~\src\plugins\abs\ext\charge]
 * ✨ Initter™ has completed execution. 💯✅
 */

import Mirror from './mirror.js';
import Logger from "./logger.js";

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
   * Scaffolds a new dev plugin directory at the given destination.
   * @return {Promise<void>}
   */
  static async init()
  {
    Logger.log(`working directory: ${process.cwd()}`);

    // derive a new mirror for mirroring our template.
    const mirror = new Mirror();
    mirror.setSource(this.PLUGIN_TEMPLATE_PATH);

    // clone the template into the destination.
    await mirror.mirrorToDestination(destinationPath);

    Logger.logAnyway(`Initter™ has completed execution. 💯✅`);
  }
}

// explicitly enable logging.
Logger.enableLogging();

// get the path provided by the user to clone the template into.
const destinationPath = process.argv.slice(2).at(0);

// do the needful.
await Initter.init(destinationPath);