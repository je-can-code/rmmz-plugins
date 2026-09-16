//region plugin metadata
import MessageConfig from '../services/MessageConfig.js';
import MessageProfileResolver from '../services/MessageProfileResolver.js';

class J_MessagePluginMetadata extends PluginMetadata
{
  /**
   * The project-relative path to this plugin's external configuration file.
   *
   * Unlike every other config in this codebase, **this one is optional**, and deliberately so.
   * J-Message shipped for years without it and every project already using it has thousands of
   * lines of dialogue that must keep rendering exactly as they do today. A voice is an enhancement
   * layered onto text that already works, so its absence means "nobody has written voices yet"
   * rather than "this install is broken".
   *
   * A config that exists and is malformed is still a loud failure, because that is an authoring
   * mistake rather than a choice.
   * @type {string}
   */
  static CONFIG_PATH = 'data/config.message.json';

  /**
   * Constructor.
   */
  constructor(name, version)
  {
    super(name, version);
  }

  /**
   * Extends {@link PluginMetadata.postInitialize}.<br/>
   * Also loads the external config, if this project has written one.
   */
  postInitialize()
  {
    super.postInitialize();

    this.initializeConfiguration();
  }

  /**
   * Reads the external config once and hands it to everything that reads a part of it.
   *
   * One read and one distribution point, so a section can be claimed by a new consumer without the
   * file gaining a second reader that could see a different version of it.
   */
  initializeConfiguration()
  {
    const config = this.readConfig();

    // the whole file, for whoever wants a section of it.
    MessageConfig.load(config);

    // the speaker profiles, which core reads itself on every message.
    MessageProfileResolver.load(config);
  }

  /**
   * Reads and parses the external config.
   * @returns {object} The parsed config, or an empty one if this project has not written the file.
   */
  readConfig()
  {
    const rawConfig = StorageManager.fsReadFile(J_MessagePluginMetadata.CONFIG_PATH);

    // no config at all means nothing has been configured, which leaves every speaker on the default
    // profile and every other knob at whatever its consumer defaults to - and the default profile is
    // the engine's own behaviour, unchanged.
    if (rawConfig === null || rawConfig === String.empty) return {};

    const options = ExternalJsonConfigLoaderOptions.Builder()
      .pluginName('J-Message')
      .configName('message configuration')
      .build();

    return ExternalJsonConfigLoader.load(J_MessagePluginMetadata.CONFIG_PATH, options);
  }
}

export default J_MessagePluginMetadata;
//endregion plugin metadata