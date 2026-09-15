//region plugin metadata
/**
 * The metadata for J-Lighting.
 *
 * Every default a light or an ambient falls back to lives in an external config rather than in
 * plugin parameters, because retuning how dark the game gets is a data edit that should not require
 * opening the plugin manager or rebuilding anything.
 */
class J_LIGHTING_PluginMetadata
  extends PluginMetadata
{
  /**
   * The path where the config for lighting defaults is located.
   * @type {string}
   */
  static CONFIG_PATH = 'data/config.lighting.json';

  /**
   * The tuning handed back for a light that does not animate.
   *
   * A steady light never reaches for these, but the renderer asks for a tuning before it knows that,
   * and answering with nothing would move the question of what a steady light does into the caller.
   * @type {{depth: number, period: number, chance: number, variance: number}}
   */
  static STEADY_TUNING = { depth: 0, period: 1, chance: 0, variance: 0 };

  /**
   * Constructor.
   * @param {string} name The name of this plugin.
   * @param {string} version The version of this plugin.
   */
  constructor(name, version)
  {
    super(name, version);
  }

  /**
   * Extends {@link #postInitialize}.<br>
   * Loads the lighting defaults from external configuration.
   */
  postInitialize()
  {
    // perform original logic.
    super.postInitialize();

    // initialize the lighting defaults from configuration.
    this.initializeLightingDefaults();
  }

  /**
   * Reads the defaults a light and an ambient fall back to out of the external config.
   *
   * The tag grammar makes every parameter optional, so an author writing `<light:[5]>` has silently
   * asked for whatever colour, intensity and behaviour are configured here. That is the whole point -
   * the game's torches should all agree on what a torch looks like without anybody retyping a hex
   * code onto two hundred events.
   */
  initializeLightingDefaults()
  {
    const options = ExternalJsonConfigLoaderOptions.Builder()
      .pluginName(__PLUGIN_NAME__)
      .configName('lighting configuration')
      .build();

    const parsedConfiguration = ExternalJsonConfigLoader.load(J_LIGHTING_PluginMetadata.CONFIG_PATH, options);

    /**
     * The values a `<light:>` tag falls back to for anything it did not spell out.
     * @type {{radius: number, color: string, intensity: number, effects: Object}}
     */
    this.lightDefaults = parsedConfiguration.light;

    /**
     * The values an `<ambient:>` tag falls back to for anything it did not spell out.
     * @type {{color: string}}
     */
    this.ambientDefaults = parsedConfiguration.ambient;
  }

  /**
   * How strong and how fast a given effect runs.
   *
   * Each behaviour is tuned separately because they are not the same thing at different speeds. A
   * flicker takes a fifth of a flame's brightness away and never stops; a glitch drops a tube almost
   * to nothing and then leaves it alone for seconds. One shared pair of numbers could describe
   * neither without ruining the other.
   * @param {string} effect The effect being asked about.
   * @returns {{depth: number, period: number, chance: number, variance: number}}
   */
  tuningFor(effect)
  {
    const configured = this.lightDefaults.effects[effect];

    // a light that does not animate has nothing to tune, and neither does one whose effect the
    // config has never heard of - which the parser would already have refused anyway.
    if (configured === undefined) return J_LIGHTING_PluginMetadata.STEADY_TUNING;

    return configured;
  }
}

export default J_LIGHTING_PluginMetadata;
//endregion plugin metadata