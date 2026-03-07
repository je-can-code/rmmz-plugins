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
   * Represents the shield points of a shield.
   */
  Points: /<shield:[ ]?(\d+)>/i,

  /**
   * Represents the shield points derived from a damage formula.
   */
  PointsFormula: /<sh-formula:\[([+\-*/ ().\w]+)]>/gi,

  /**
   * Represents the shield cap of a shield.
   */
  Cap: /<shield-cap:[ ]?(\d+)>/i,

  /**
   * Represents the shield cap derived from a damage formula.
   */
  CapFormula: /<sh-cap-formula:\[([+\-*/ ().\w]+)]>/gi,

  /**
   * Represents the priority of a shield.
   */
  Priority: /<shield-priority:[ ]?(\d+)>/i,

  /**
   * Represents the type of shield.
   */
  Type: /<shield-type:[ ]?(\[[\d, ]+])>/gi,

  /**
   * Dictates if the shield should prevent overflow damage upon breaking.
   */
  Protect: /<shield-protect>/i,

  /**
   * On an action, this means it will bypass either all shields or specific shields.
   */
  Bypass: /<shield-bypass(?::[ ]?(\[[\d, ]+]))?>/gi,
};
//endregion initialization