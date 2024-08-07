/**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.ELEM = {};

/**
 * The `metadata` associated with this plugin, such as version.
 */
J.ELEM.Metadata = {
  /**
   * The version of this plugin.
   */
  Name: `J-Elementalistics`,

  /**
   * The version of this plugin.
   */
  Version: '1.0.0',
};

J.ELEM.Aliased = {
  Game_Action: new Map(),
  Game_Actor: new Map(),
  Game_Enemy: new Map(),
};

J.ELEM.RegExp = {};
J.ELEM.RegExp.AttackElementIds = /<attackElements:[ ]?(\[[\d, ]+])>/i;
J.ELEM.RegExp.AbsorbElementIds = /<absorbElements:[ ]?(\[[\d, ]+])>/i;
J.ELEM.RegExp.StrictElementIds = /<strictElements:[ ]?(\[[\d, ]+])>/i;
J.ELEM.RegExp.BoostElement = /<boostElement:(\d+):(-?\+?[\d]+)>/i;
//endregion Introduction