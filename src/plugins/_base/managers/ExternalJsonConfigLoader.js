//region ExternalJsonConfigLoader
import ExternalJsonConfigLoaderOptions from './../models/ExternalJsonConfigLoaderOptions.js';

/**
 * A centralized loader for external JSON configuration files in the project.
 *
 * This is intended to eliminate duplicated "read file → guard null/empty → JSON.parse try/catch → validate → classify"
 * boilerplate across plugin metadata initializers.
 *
 * This loader is deliberately "domain-agnostic": it knows how to read and parse JSON, but it does not know what the
 * JSON means. Callers can provide a validator and/or mapper to enforce plugin-specific shapes and transform the parsed
 * blob into a classified result.
 */
// eslint-disable-next-line no-unused-vars
class ExternalJsonConfigLoader
{
  /**
   * Loads, parses, validates, and optionally maps JSON configuration from a project-relative path.
   * @template TConfigJson The raw JSON shape after {@link JSON.parse}.
   * @template TConfigResult The optional mapped/classified result shape.
   * @param {string} configPath Project-relative path, ex: `data/config.sdp.json`.
   * @param {ExternalJsonConfigLoaderOptions<TConfigJson, TConfigResult>=} options Additional options to customize
   * behavior.
   * @returns {TConfigResult|TConfigJson} The parsed JSON blob, or mapped result if a mapper was provided.
   */
  static load(configPath, options = null)
  {
    const actualOptions = options ?? new ExternalJsonConfigLoaderOptions();

    // read the raw json text from the filesystem.
    const rawConfig = StorageManager.fsReadFile(configPath);

    // missing or empty config is a fatal error for plugins that rely on external configuration.
    if (rawConfig === null || rawConfig === String.empty)
    {
      throw this.#missingConfigError(configPath, actualOptions.pluginName, actualOptions.configName);
    }

    // parse the json in a way that always includes the file path.
    let parsed;
    try
    {
      parsed = /** @type {TConfigJson} */ (JSON.parse(rawConfig));
    }
    catch (e)
    {
      const prefix = this.#errorPrefix(actualOptions.pluginName, actualOptions.configName);
      throw new Error(`${prefix}failed to parse JSON at ${configPath}: ${e.message}`);
    }

    // json can parse to null; treat that the same as "missing", because downstream logic expects an object/array.
    if (parsed === null)
    {
      throw this.#missingConfigError(configPath, actualOptions.pluginName, actualOptions.configName);
    }

    // if provided, validate the parsed blob before mapping/classifying.
    if (actualOptions.validator)
    {
      try
      {
        actualOptions.validator(parsed);
      }
      catch (e)
      {
        const prefix = this.#errorPrefix(actualOptions.pluginName, actualOptions.configName);
        throw new Error(`${prefix}invalid JSON config at ${configPath}: ${e.message}`);
      }
    }

    // map/classify the parsed blob when requested.
    const result = actualOptions.mapper
      ? actualOptions.mapper(parsed)
      : parsed;

    // optionally log what was loaded, if enabled at the base level.
    if (J.BASE.Metadata.ShowExternalFileLoadInfo)
    {
      this.#logLoadInfo(configPath, result, actualOptions.logSummary);
    }

    // return the parsed blob or mapped result.
    return result;
  }

  /**
   * Builds and returns a standardized "missing config" Error.
   * @param {string} configPath The path that was attempted.
   * @param {string=} pluginName The plugin name for message context.
   * @param {string=} configName The config name for message context.
   * @returns {Error}
   */
  static #missingConfigError(configPath, pluginName, configName)
  {
    const prefix = this.#errorPrefix(pluginName, configName);
    const label = configName ?? 'configuration';
    // hand back new Error(`${prefix}missing ${label} file at ${config... to the caller.
    return new Error(`${prefix}missing ${label} file at ${configPath}.`);
  }

  /**
   * Builds a consistent prefix for all errors emitted by this loader.
   * @param {string=} pluginName The plugin name for message context.
   * @param {string=} configName The config name for message context.
   * @returns {string}
   */
  static #errorPrefix(pluginName, configName)
  {
    // build the context prefix.
    const parts = [];
    if (pluginName) parts.push(pluginName);
    if (configName) parts.push(configName);

    // if we have no context, then don't add one.
    if (parts.length === 0) return String.empty;

    // return the bracketed prefix with a trailing space.
    return `[${parts.join('::')}] `;
  }

  /**
   * Logs informational details about what was loaded from disk.
   * @param {string} configPath The project-relative config path.
   * @param {any} result The result of loading (parsed or mapped).
   * @param {(result: any) => string|string[]=} logSummary Optional summary builder.
   */
  static #logLoadInfo(configPath, result, logSummary)
  {
    // if a summary builder was provided, use it.
    if (logSummary)
    {
      const built = logSummary(result);
      const lines = Array.isArray(built)
        ? built
        : [ built ];

      // Emit progress to the build log for operator visibility.
      console.log(`loaded:
${lines.map(line => `      ${line}`)
    .join('\n')}
      from file ${configPath}.`);
      return;
    }

    // without a summary, fall back to a minimal single-line log.
    console.log(`loaded external JSON from file ${configPath}.`);
  }
}


export default ExternalJsonConfigLoader;
//endregion ExternalJsonConfigLoader