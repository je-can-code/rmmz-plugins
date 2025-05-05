import fs from 'fs';
import path from 'path';
import Logger from './logger.js';

/**
 * A utility class that is a wrapper over {@link fs.cp}.
 */
class Mirror
{
  //region properties
  /**
   * The source from which to mirror the structure of.
   * @type {string}
   */
  #source = "./out";

  /**
   * The destinations currently designated to this mirroring utility.
   * @type {[]}
   */
  #destinations = [ "./project/js/plugins" ];

  /**
   * Gets the destinations that have been assigned to this mirror.
   * @returns {string[]}
   */
  getDestinations()
  {
    return this.#destinations;
  }

  /**
   * Sets the destinations of which this mirror will mirror to.
   * @param {string[]} destinations
   */
  setDestinations(destinations)
  {
    this.#destinations = destinations
  }

  /**
   * Gets the currently set source to mirror from.
   * @returns {string}
   */
  getSource()
  {
    return this.#source;
  }

  /**
   * Sets a new source to mirror from.
   * @param {string} source
   */
  setSource(source)
  {
    this.#source = source;
  }

  //#endregion properties

  /**
   * Mirrors the directory structure including all files from
   * the source directory to all currently-set destinations.
   */
  async mirrorToAllDestinations()
  {
    // grab all destinations we're working with.
    const destinations = this.getDestinations();

    // iterate over each one for copying.
    for (const destination of destinations)
    {
      // clone the directory in its entirety.
      await this.mirrorToDestination(destination);
    }
  }

  /**
   * Mirrors one directory structure over to a target destination.
   * @param {string} destination The destination path, relative or absolute.
   */
  async mirrorToDestination(destination)
  {
    // validate the output directory exists.
    await this.#validateDestinationDir(destination);

    // grab the source to mirror from.
    const source = this.getSource();

    // better resolve the whole path.
    const resolvedSource = path.resolve(source);

    // better resolve this path one, too.
    const resolvedDestination = path.resolve(destination);

    // experimental folder mirroring isn't too shabby!
    await fs.cp(
      resolvedSource,
      resolvedDestination,
      { recursive: true },
      this.#handleFileError);
    Logger.logAnyway(`copied [${resolvedSource}] to [${resolvedDestination}]`);
  }

  /**
   * Validates that the target directory exists.
   * If it does not exist, it will be created.
   * @param {string} targetPath The target path to confirm exists.
   */
  async #validateDestinationDir(targetPath)
  {
    // check if the directory is missing.
    if (!fs.existsSync(`${targetPath}`))
    {
      // make sure the directory is created.
      await fs.mkdir(targetPath,
        {
          force: true,
          recursive: true
        },
        this.#handleFileError);
      Logger.logAnyway(`target directory created: ${targetPath}`);
    }
    else
    {
      Logger.log(`target directory already exists; ${targetPath}`);
    }
  }

  /**
   * Handles the errors associated with copying files via fs.
   * @param {Error?} error The error being handled, if any.
   */
  #handleFileError(error)
  {
    if (error) throw error;
  }
}

export default Mirror;