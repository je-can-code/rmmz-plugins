//region introduction
import JABS_StandardController from './../_models/JABS_StandardController.js';
import JabsInputSymbols from './../_models/JabsInputSymbols.js';
import J_InputPluginMetadata from './_pluginMetadata.js';

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

//region metadata
/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.ABS.EXT.INPUT = {};

/**
 * Cross-ship symbol table for other plugins (map minimap, omni quest, charge, …).
 */
J.ABS.EXT.INPUT.Symbols = {};

// copy symbol strings onto the namespace for cross-ship consumers after this bundle loads.
J.ABS.EXT.INPUT.Symbols.DirUp = JabsInputSymbols.DirUp;
J.ABS.EXT.INPUT.Symbols.DirDown = JabsInputSymbols.DirDown;
J.ABS.EXT.INPUT.Symbols.DirLeft = JabsInputSymbols.DirLeft;
J.ABS.EXT.INPUT.Symbols.DirRight = JabsInputSymbols.DirRight;
J.ABS.EXT.INPUT.Symbols.Mainhand = JabsInputSymbols.Mainhand;
J.ABS.EXT.INPUT.Symbols.Offhand = JabsInputSymbols.Offhand;
J.ABS.EXT.INPUT.Symbols.Dash = JabsInputSymbols.Dash;
J.ABS.EXT.INPUT.Symbols.Tool = JabsInputSymbols.Tool;
J.ABS.EXT.INPUT.Symbols.GuardTrigger = JabsInputSymbols.GuardTrigger;
J.ABS.EXT.INPUT.Symbols.SkillTrigger = JabsInputSymbols.SkillTrigger;
J.ABS.EXT.INPUT.Symbols.MobilitySkill = JabsInputSymbols.MobilitySkill;
J.ABS.EXT.INPUT.Symbols.StrafeTrigger = JabsInputSymbols.StrafeTrigger;
J.ABS.EXT.INPUT.Symbols.Quickmenu = JabsInputSymbols.Quickmenu;
J.ABS.EXT.INPUT.Symbols.PartyCycle = JabsInputSymbols.PartyCycle;
J.ABS.EXT.INPUT.Symbols.Debug = JabsInputSymbols.Debug;
J.ABS.EXT.INPUT.Symbols.R3 = JabsInputSymbols.R3;
J.ABS.EXT.INPUT.Symbols.L3 = JabsInputSymbols.L3;
J.ABS.EXT.INPUT.Symbols.DPadUp = JabsInputSymbols.DPadUp;
J.ABS.EXT.INPUT.Symbols.DPadDown = JabsInputSymbols.DPadDown;
J.ABS.EXT.INPUT.Symbols.DPadLeft = JabsInputSymbols.DPadLeft;
J.ABS.EXT.INPUT.Symbols.DPadRight = JabsInputSymbols.DPadRight;
J.ABS.EXT.INPUT.Symbols.CombatSkill1 = JabsInputSymbols.CombatSkill1;
J.ABS.EXT.INPUT.Symbols.CombatSkill2 = JabsInputSymbols.CombatSkill2;
J.ABS.EXT.INPUT.Symbols.CombatSkill3 = JabsInputSymbols.CombatSkill3;
J.ABS.EXT.INPUT.Symbols.CombatSkill4 = JabsInputSymbols.CombatSkill4;

/**
 * The metadata associated with this plugin.
 */
J.ABS.EXT.INPUT.Metadata = new J_InputPluginMetadata(__PLUGIN_NAME__, __PLUGIN_VERSION__);

/**
 * A collection of all aliased methods for this plugin.
 */
J.ABS.EXT.INPUT.Aliased = {
  DataManager: new Map(),
  Game_Player: new Map(),
  Game_System: new Map(),
  Input: new Map(),
  JABS_Engine: new Map(),
  JABS_Battler: new Map(),
  Window_MenuCommand: new Map(),
  Window_Selectable: new Map(),
  Scene_Menu: new Map(),
};
//endregion metadata

/**
 * The global reference for the player's input manager.
 * This interprets and manages incoming inputs for JABS-related functionality.
 * @type {JABS_StandardController}
 * @global
 */
globalThis.$jabsController1 = null;
//endregion introduction