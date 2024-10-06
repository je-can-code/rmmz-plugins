//region PluginMetadata
class PluginMetadata
{
  /**
   * A name:metadata map of all registered plugins in the this plugin ecosystem.
   * @type {Map<string, PluginMetadata>}
   */
  static #plugins = new Map();

  /**
   * The name of the plugin.
   * This typically matches the filename, without the extension.
   * @type {string}
   */
  name = String.empty;

  /**
   * The version of the plugin.
   * @type {PluginVersion}
   */
  version = null;

  /**
   * The raw plugin parameters string that is supposed to be "JSON-like".
   * @type {string}
   */
  rawPluginParameters = '[]';

  /**
   * The parsed object for later manipulation.
   * This is almost always iterable.
   * @type {any[]}
   */
  parsedPluginParameters = null;

  /**
   * Constructor.
   * @param {string} name The name of this plugin. Should match the filename.
   * @param {string} version The version of this plugin. Should be "semver"-formatted.
   */
  constructor(name = '', version = '')
  {
    if (!name || !version)
    {
      console.trace(`Emergency! Erroneous plugin metadata was provided!`);
      const message = `Erroneous plugin metadata provided: name=[${name}], version=[${version}]`;
      throw new Error(message);
    }

    // assign the required properties.
    this.name = name;
    this.#applyVersion(version);

    // do first-time setup of the plugin.
    this.initializePlugin();
  }

  /**
   * Whether or not a given plugin has registered its metadata.
   * @param {string} pluginName The name of the plugin to check for.
   * @return {boolean}
   */
  static hasPlugin(pluginName)
  {
    return this.#plugins.has(pluginName);
  }

  /**
   * Registers a plugin for tracking.
   * @param {PluginMetadata} pluginMetadata The metadata to track.
   */
  static #registerPlugin(pluginMetadata)
  {
    if (this.hasPlugin(pluginMetadata.name))
    {
      throw new Error(`Duplicate plugin entry detected: [${pluginMetadata.name}] !`);
    }

    this.#plugins.set(pluginMetadata.name, pluginMetadata);
  }

  /**
   * Takes the stringy version of the version to validate and set.
   * @param {string} version The "semver"-formatted string.
   */
  #applyVersion(version)
  {
    // deconstructs the patch values out to ensure we have them all.
    const [ major, minor, patch ] = version
      .split('.')
      .map(parseInt);

    // use the builder to build the version.
    const pluginVersion = PluginVersion.builder
      .major(major)
      .minor(minor)
      .patch(patch)
      .build();

    // set the version for later use.
    this.version = pluginVersion;
  }

  /**
   *  Initializes the plugin.
   *  This method is intended to be extended.
   */
  initializePlugin()
  {
    // assign the raw plugin parameters.
    this.rawPluginParameters = PluginManager.parameters(this.name);

    // set the parsed plugin parameters.
    this.parsedPluginParameters = JsonMapper.parseObject(this.rawPluginParameters);

    // register this plugin.
    PluginMetadata.#registerPlugin(this);

    // execute post initialization logic, like setup of custom child metadata stuff.
    this.postInitialize();
  }

  /**
   * Post initialization logic for setting up additional properties from the
   * plugin parameters or whatever else.
   */
  postInitialize()
  {
  }
}

//endregion PluginMetadata