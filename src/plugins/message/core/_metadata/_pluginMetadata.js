//region plugin metadata
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
   * Also loads the speaker profiles, if this project has written any.
   */
  postInitialize()
  {
    super.postInitialize();

    this.initializeSpeakerProfiles();
  }

  /**
   * Reads the speaker profiles out of the external config.
   */
  initializeSpeakerProfiles()
  {
    const rawConfig = StorageManager.fsReadFile(J_MessagePluginMetadata.CONFIG_PATH);

    // no config at all means no voices configured, which leaves every speaker on the default
    // profile - and the default profile is the engine's own behaviour, unchanged.
    if (rawConfig === null || rawConfig === String.empty)
    {
      MessageProfileResolver.load({});
      return;
    }

    const options = ExternalJsonConfigLoaderOptions.Builder()
      .pluginName('J-Message')
      .configName('message speaker profiles')
      .build();

    const config = ExternalJsonConfigLoader.load(J_MessagePluginMetadata.CONFIG_PATH, options);

    MessageProfileResolver.load(config);
  }
}

export default J_MessagePluginMetadata;
//endregion plugin metadata