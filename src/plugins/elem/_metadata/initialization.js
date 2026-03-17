/**
 * The core where all of my extensions live: in the `J` object.
 */
var J = J || {};

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
})();
//endregion version check

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
  Version: '1.0.1',
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