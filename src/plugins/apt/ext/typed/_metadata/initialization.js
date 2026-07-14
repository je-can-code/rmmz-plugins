//region initialization
import JAptitudeTyped_PluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};
J.APT ||= {};
J.APT.EXT ||= {};

// ensure nested namespaces exist.
J.APT.EXT.TYPED = J.APT.EXT.TYPED || {};

/**
 * The plugin umbrella that governs all things related to this extension plugin.
 * Name and Version are owned by the metadata instance.
 */
J.APT.EXT.TYPED.Metadata = new JAptitudeTyped_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.APT.EXT.TYPED.Aliased = {
  ApManager: new Map(),
  Game_Temp: new Map(),
  JABS_Engine: new Map(),
  RPG_Base: new Map(),
  RPG_Enemy: new Map(),
  Window_AptitudeSourceDetails: new Map(),
  Window_AptitudeAggregateDetails: new Map(),
};

/**
 * All regular expressions used by this plugin.
 */
J.APT.EXT.TYPED.RegExp = {
  /**
   * Typed aptitude teachable structure (with domain+idOrName).
   *
   * <pre>
   * Structure:
   *  <aptitudeTyped:[SKILL_ID, REQUIRED_AP, DOMAIN, ID_OR_NAME]>
   *
   * Examples:
   *  <aptitudeTyped:[12, 150, element, fire]>
   *  <aptitudeTyped:[12, 150, weaponType, sword]>
   *  <aptitudeTyped:[12, 150, skillType, magic]>
   * </pre>
   * @type {RegExp}
   */
  AptitudeTeachableTyped: /<aptitudeTyped:[ ]?(\[\d+,[ ]?\d+,[ ]?[A-Za-z]+,[ ]?[A-Za-z0-9_\- ]+])>/gi,

  /**
   * Typed AP reward on enemies (repeatable; flat amounts, post-scaling).
   *
   * <pre>
   * Structure:
   *  <apTyped:[AMOUNT, DOMAIN, ID_OR_NAME]>
   *
   * Examples:
   *  <apTyped:[6, element, fire]>
   *  <apTyped:[3, weaponType, sword]>
   * </pre>
   * @type {RegExp}
   */
  ApTypedReward: /<apTyped:[ ]?(\[\d+,[ ]?[A-Za-z]+,[ ]?[A-Za-z0-9_\- ]+])>/gi,
};
//endregion initialization