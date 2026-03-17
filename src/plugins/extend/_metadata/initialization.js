//region Metadata
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
J.EXTEND = {};

/**
 * The `metadata` associated with this plugin, such as version.
 */
J.EXTEND.Metadata = {};

/**
 * The name of this plugin.
 */
J.EXTEND.Metadata.Name = `J-SkillExtend`;

/**
 * The version of this plugin.
 */
J.EXTEND.Metadata.Version = '1.2.0';

/**
 * A collection of all aliased methods for this plugin.
 */
J.EXTEND.Aliased = {};
J.EXTEND.Aliased.DataManager = new Map();
J.EXTEND.Aliased.Game_Action = new Map();
J.EXTEND.Aliased.Game_Actor = new Map();
J.EXTEND.Aliased.Game_Enemy = new Map();
J.EXTEND.Aliased.Game_Item = new Map();
J.EXTEND.Aliased.Game_Item = new Map();
J.EXTEND.Aliased.JABS_SkillSlotManager = new Map();

/**
 * All regular expressions used by this plugin.
 */
J.EXTEND.RegExp = {};
J.EXTEND.RegExp.SkillExtend = /<skillExtend:[ ]?(\[[ ]?\d+(?:,[ ]?\d+)*[ ]?])>/i;
J.EXTEND.RegExp.OnHitSelfState = /<onHitSelfState:[ ]?(\[\d+,[ ]?\d+])>/i;
J.EXTEND.RegExp.OnCastSelfState = /<onCastSelfState:[ ]?(\[\d+,[ ]?\d+])>/i;
//endregion Metadata