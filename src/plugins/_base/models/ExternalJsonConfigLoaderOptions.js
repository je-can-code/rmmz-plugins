//region ExternalJsonConfigLoaderOptions
/**
 * The options for {@link ExternalJsonConfigLoader.load}.<br>
 * This exists to avoid anonymous option objects throughout the codebase.
 * @template TConfigJson The raw JSON shape after {@link JSON.parse}.
 * @template TConfigResult The optional mapped/classified result shape.
 */
class ExternalJsonConfigLoaderOptions
{
  /**
   * A factory for generating {@link ExternalJsonConfigLoaderOptions}.<br>
   * @returns {ExternalJsonConfigLoaderOptionsBuilder}
   * @constructor
   */
  static Builder = () => new ExternalJsonConfigLoaderOptionsBuilder();

  /**
   * The plugin name used for error context.
   * @type {string|null}
   */
  pluginName = null;

  /**
   * A friendly label for the config used for error context.
   * @type {string|null}
   */
  configName = null;

  /**
   * Optional validator; throw an Error to reject the parsed blob.
   * @type {((parsed: TConfigJson) => void)|null}
   */
  validator = null;

  /**
   * Optional mapper/classifier for transforming the parsed blob.
   * @type {((parsed: TConfigJson) => TConfigResult)|null}
   */
  mapper = null;

  /**
   * Optional log builder when info logging is enabled.
   * @type {((result: TConfigResult|TConfigJson) => (string|string[]))|null}
   */
  logSummary = null;

  /**
   * Constructor.
   * @param {string=} pluginName The plugin name used for error context.
   * @param {string=} configName A friendly label for the config used for error context.
   */
  constructor(pluginName = null, configName = null)
  {
    this.pluginName = pluginName;
    this.configName = configName;
  }
}

//region ExternalJsonConfigLoaderOptionsBuilder
/**
 * A builder for {@link ExternalJsonConfigLoaderOptions}.<br>
 * Exists to keep configuration setup explicit and chainable.
 * @template TConfigJson The raw JSON shape after {@link JSON.parse}.
 * @template TConfigResult The optional mapped/classified result shape.
 */
class ExternalJsonConfigLoaderOptionsBuilder
{
  //region properties
  /**
   * The plugin name used for error context.
   * @type {string|null}
   */
  #pluginName = null;

  /**
   * A friendly label for the config used for error context.
   * @type {string|null}
   */
  #configName = null;

  /**
   * Optional validator; throw an Error to reject the parsed blob.
   * @type {((parsed: TConfigJson) => void)|null}
   */
  #validator = null;

  /**
   * Optional mapper/classifier for transforming the parsed blob.
   * @type {((parsed: TConfigJson) => TConfigResult)|null}
   */
  #mapper = null;

  /**
   * Optional log builder when info logging is enabled.
   * @type {((result: TConfigResult|TConfigJson) => (string|string[]))|null}
   */
  #logSummary = null;

  //endregion properties

  /**
   * Builds the {@link ExternalJsonConfigLoaderOptions}.
   * @returns {ExternalJsonConfigLoaderOptions<TConfigJson, TConfigResult>}
   */
  build()
  {
    // build the options model from the provided parameters.
    const options = new ExternalJsonConfigLoaderOptions(this.#pluginName, this.#configName);
    options.validator = this.#validator;
    options.mapper = this.#mapper;
    options.logSummary = this.#logSummary;

    // clear the builder parameters.
    this.#clear();

    // return the newly-built options.
    return options;
  }

  //region setters
  /**
   * Sets the plugin name used for error context.
   * @param {string|null} pluginName The plugin name.
   * @returns {ExternalJsonConfigLoaderOptionsBuilder}
   */
  pluginName(pluginName)
  {
    this.#pluginName = pluginName;
    return this;
  }

  /**
   * Sets the config name used for error context.
   * @param {string|null} configName The config name.
   * @returns {ExternalJsonConfigLoaderOptionsBuilder}
   */
  configName(configName)
  {
    this.#configName = configName;
    return this;
  }

  /**
   * Sets the validator callback used for rejecting invalid parsed blobs.
   * @param {((parsed: TConfigJson) => void)|null} validator The validator callback.
   * @returns {ExternalJsonConfigLoaderOptionsBuilder<TConfigJson, TConfigResult>}
   */
  validator(validator)
  {
    this.#validator = validator;
    return this;
  }

  /**
   * Sets the mapper/classifier callback used for transforming parsed blobs.
   * @param {((parsed: TConfigJson) => TConfigResult)|null} mapper The mapper callback.
   * @returns {ExternalJsonConfigLoaderOptionsBuilder<TConfigJson, TConfigResult>}
   */
  mapper(mapper)
  {
    this.#mapper = mapper;
    return this;
  }

  /**
   * Sets the log summary callback used for information logs.
   * @param {((result: TConfigResult|TConfigJson) => (string|string[]))|null} logSummary The summary callback.
   * @returns {ExternalJsonConfigLoaderOptionsBuilder<TConfigJson, TConfigResult>}
   */
  logSummary(logSummary)
  {
    this.#logSummary = logSummary;
    return this;
  }

  //endregion setters

  /**
   * Clears the data in the builder.
   */
  #clear()
  {
    this.#pluginName = null;
    this.#configName = null;
    this.#validator = null;
    this.#mapper = null;
    this.#logSummary = null;
  }
}
//endregion ExternalJsonConfigLoaderOptionsBuilder
//endregion ExternalJsonConfigLoaderOptions