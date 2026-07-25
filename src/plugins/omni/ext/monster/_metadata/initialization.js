//region Metadata
import J_OmniMonster_PluginMetadata from './_pluginMetadata.js';

/**
 * The core where all of my extensions live: in the `J` object.
 */
globalThis.J ||= {};

//region version checks
(() =>
{
  // Check to ensure we have the minimum required version of the J-Base plugin.
  const requiredBaseVersion = '3.2.0';
  const hasBaseRequirement = J.BASE.Helpers.satisfies(J.BASE.Metadata.Version, requiredBaseVersion);
  if (hasBaseRequirement === false)
  {
    throw new Error(`Either missing J-Base or has a lower version than the required: ${requiredBaseVersion}`);
  }

  const requiredOmniVersion = '1.0.0';
  const hasOmniRequirement = J.BASE.Helpers.satisfies(J.OMNI.Metadata.version.version(), requiredOmniVersion);
  if (hasOmniRequirement === false)
  {
    throw new Error(`Either missing J-Omnipedia or has a lower version than the required: ${requiredOmniVersion}`);
  }
})();
//endregion version check

/**
 * The over-arching extensions collection for this plugin.
 */
J.OMNI.EXT ||= {};

/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.OMNI.EXT.MONSTER = {};

/**
 * The `metadata` associated with this plugin, such as version.
 */
J.OMNI.EXT.MONSTER.Metadata = new J_OmniMonster_PluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.OMNI.EXT.MONSTER.Aliased = {};
J.OMNI.EXT.MONSTER.Aliased.Game_Enemy = new Map();
J.OMNI.EXT.MONSTER.Aliased.Game_Party = new Map();
J.OMNI.EXT.MONSTER.Aliased.Game_System = new Map();
J.OMNI.EXT.MONSTER.Aliased.JABS_Battler = new Map();
J.OMNI.EXT.MONSTER.Aliased.JABS_Engine = new Map();
J.OMNI.EXT.MONSTER.Aliased.Scene_Omnipedia = new Map();
J.OMNI.EXT.MONSTER.Aliased.Window_OmnipediaList = new Map();

/**
 * All regular expressions used by this plugin.
 */
J.OMNI.EXT.MONSTER.RegExp = {};
J.OMNI.EXT.MONSTER.RegExp.HideFromMonsterpedia = /<hideFromMonsterpedia>/i;
J.OMNI.EXT.MONSTER.RegExp.MonsterpediaFamilyIcon = /<monsterFamilyIcon:[ ]?(\d+)>/i;
J.OMNI.EXT.MONSTER.RegExp.MonsterpediaDescription = /<descriptionLine:[ ]?([\w\s.?!,\-'"]+)>/i;
J.OMNI.EXT.MONSTER.RegExp.MonsterpediaRegion = /<region:[ ]?([\w\s.?!,'"]+)>/i;
//endregion Metadata