//region initialization
/**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.ABS.EXT ||= {};

/**
 * The plugin umbrella that governs all extensions related to the parent.
 */
J.ABS.EXT.SHIELD ||= {};

/**
 * The metadata associated with this plugin.
 */
J.ABS.EXT.SHIELD.Metadata = new JShield_PluginMetadata('J-ABS-Shield', '1.0.0');

/**
 * A collection of all aliased methods for this plugin.
 */
J.ABS.EXT.SHIELD.Aliased = {
  Game_Action: new Map(),
  Game_Actor: new Map(),
  Game_Battler: new Map(),
  JABS_Engine: new Map(),
  JABS_State: new Map(),
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
   */
  ShieldPointsFormula: /<shield:\[([+\-*/ ().\w]+)]>/gi,

  /**
   * Represents the shield cap derived from a damage formula.
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
};
//endregion initialization