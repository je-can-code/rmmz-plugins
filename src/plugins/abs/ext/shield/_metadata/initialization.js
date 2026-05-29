//region initialization
import JShield_PluginMetadata from './_pluginMetadata.js';

globalThis.J ||= {};

//region version checks
(() =>
{
  // Check to ensure we have the minimum required version of the J-Base plugin.
  const requiredBaseVersion = '3.0.0';
  const hasBaseRequirement = J.BASE.Helpers.satisfies(J.BASE.Metadata.Version, requiredBaseVersion);
  if (!hasBaseRequirement)
  {
    throw new Error(`Either missing J-Base or has a lower version than the required: ${requiredBaseVersion}`);
  }

  // Check to ensure we have the minimum required version of the J-ABS plugin.
  const requiredJabsVersion = '4.6.0';
  const hasJabsRequirement = J.BASE.Helpers.satisfies(J.ABS.Metadata.version.version(), requiredJabsVersion);
  if (!hasJabsRequirement)
  {
    throw new Error(`Either missing J-ABS or has a lower version than the required: ${requiredJabsVersion}`);
  }
})();
//endregion version check

/**
 * The plugin umbrella that governs all extensions related to the parent.
 */
J.ABS.EXT ||= {};

/**
 * The plugin umbrella that governs all extensions related to the parent.
 */
J.ABS.EXT.SHIELD ||= {};

/**
 * The metadata associated with this plugin.
 */
J.ABS.EXT.SHIELD.Metadata = new JShield_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.ABS.EXT.SHIELD.Aliased = {
  Game_Action: new Map(),
  Game_Actor: new Map(),
  Game_Battler: new Map(),
  JABS_Engine: new Map(),
  JABS_State: new Map(),
  JABS_StateBuilder: new Map(),
  Sprite_ActorValue: new Map(),
  Sprite_Character: new Map(),
  Window_PartyFrame: new Map(),
};

/**
 * All regular expressions used by this plugin.
 */
J.ABS.EXT.SHIELD.RegExp = {
  /**
   * Represents the shield points derived from a damage formula.
   * 'a' is the attacker, 'b' is the shielded battler.
   */
  ShieldPointsFormula: /<shield:\[([+\-*/ ().\w]+)]>/gi,

  /**
   * Represents the shield cap derived from a damage formula.
   * 'a' is the attacker, 'b' is the shielded battler.
   */
  ShieldCapFormula: /<shieldCap:\[([+\-*/ ().\w]+)]>/gi,

  /**
   * Represents the priority of a shield.
   */
  Priority: /<shieldPriority:[ ]?(\d+)>/i,

  /**
   * Dictates if the shield should prevent overflow damage upon breaking.
   */
  Protect: /<shieldProtect>/i,

  /**
   * Represents the type of shield.
   */
  Type: /<shieldType:[ ]?(\[[\d, ]+])>/gi,

  /**
   * On an action, this means it will bypass either all shields or specific shields.
   */
  Bypass: /<shieldBypass(?::[ ]?(\[[\d, ]+]))?>/gi,

  /**
   * Represents an additional damage formula for shield-only damage from the action.
   * 'a' is the attacker, 'b' is the shielded battler, 'o' is the original damage before mitigation.
   */
  ShieldDamage: /<shieldDamage:\[([+\-*/ ().\w]+)]>/gi,

  /**
   * Represents one or many skills to fire when this state’s shield breaks.
   */
  Break: /<shieldBreak:[ ]?(\[[\d, ]+])>/i,

  /** Outgoing shield point amplification (`<sar:25>` = +25%). */
  ShieldAmplification: /<sar:(-?\d+)>/gi,

  /** Incoming shield effectiveness (`<ser:25>` = +25%). */
  ShieldEffectiveness: /<ser:(-?\d+)>/gi,
};

/** Legacy SDP panel parameter ids for shield stats. */
J.ABS.EXT.SHIELD.SdpParamId = {
  SAR: 38,
  SER: 39,
};
//endregion initialization