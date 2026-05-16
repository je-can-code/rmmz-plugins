//region Introduction
/* eslint-disable max-len */
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

  // Check to ensure we have the minimum required version of the J-ABS plugin.
  const requiredJabsVersion = '4.10.0';
  const hasJabsRequirement = J.BASE.Helpers.satisfies(J.ABS.Metadata.Version, requiredJabsVersion);
  if (!hasJabsRequirement)
  {
    throw new Error(`Either missing J-ABS or has a lower version than the required: ${requiredJabsVersion}`);
  }
})();
//endregion version check

//region plugin setup and configuration
/**
 * The plugin umbrella that governs all things related to this plugin.
 */
J.ABS.EXT.ALLYAI = {};

/**
 * The `metadata` associated with this plugin, such as version.
 */
J.ABS.EXT.ALLYAI.Metadata = {};
J.ABS.EXT.ALLYAI.Metadata.Name = `J-ABS-AllyAI`;
J.ABS.EXT.ALLYAI.Metadata.Version = '3.0.0';

/**
 * The actual `plugin parameters` extracted from RMMZ.
 */
J.ABS.EXT.ALLYAI.PluginParameters = PluginManager.parameters(J.ABS.EXT.ALLYAI.Metadata.Name);

// configuration for the main JABS quick menu command for ally AI.
J.ABS.EXT.ALLYAI.Metadata.AllyAiCommandName = J.ABS.EXT.ALLYAI.PluginParameters['jabsMenuAllyAiCommandName'];
J.ABS.EXT.ALLYAI.Metadata.AllyAiCommandIconIndex = Number(J.ABS.EXT.ALLYAI.PluginParameters['jabsMenuAllyAiCommandIconIndex']);
J.ABS.EXT.ALLYAI.Metadata.AllyAiCommandSwitchId = Number(J.ABS.EXT.ALLYAI.PluginParameters['jabsMenuAllyAiCommandSwitchId']);

// configuration for party-wide commands.
J.ABS.EXT.ALLYAI.Metadata.PartyAiPassiveText = J.ABS.EXT.ALLYAI.PluginParameters['partyWidePassiveText'];
J.ABS.EXT.ALLYAI.Metadata.PartyAiPassiveIconIndex = Number(J.ABS.EXT.ALLYAI.PluginParameters['partyWidePassiveIconIndex']);
J.ABS.EXT.ALLYAI.Metadata.PartyAiAggressiveText = J.ABS.EXT.ALLYAI.PluginParameters['partyWideAggressiveText'];
J.ABS.EXT.ALLYAI.Metadata.PartyAiAggressiveIconIndex = Number(J.ABS.EXT.ALLYAI.PluginParameters['partyWideAggressiveIconIndex']);

// configuration for the various ai modes.
J.ABS.EXT.ALLYAI.Metadata.AiModeEquippedIconIndex = Number(J.ABS.EXT.ALLYAI.PluginParameters['aiModeEquipped']);
J.ABS.EXT.ALLYAI.Metadata.AiModeNotEquippedIconIndex = Number(J.ABS.EXT.ALLYAI.PluginParameters['aiModeNotEquipped']);
J.ABS.EXT.ALLYAI.Metadata.AllyFormationsCommandName = J.ABS.EXT.ALLYAI.PluginParameters['allyFormationsCommandName'] || 'Ally Formations';
J.ABS.EXT.ALLYAI.Metadata.AllyFormationsCommandIconIndex = Number(J.ABS.EXT.ALLYAI.PluginParameters['allyFormationsCommandIconIndex'] || 289);


J.ABS.EXT.ALLYAI.Metadata.FormationTolerance = 0.5;

/**
 * All available formations that a party can take.
 * @type {JABS_Formation[]}
 */
J.ABS.EXT.ALLYAI.Metadata.FormationTypes = [
  {
    key: "fan-behind",
    name: "Rear Support",
    description: "The rear-wedge formation.\nAllies will fan out behind you for support.",
    formation:
      [
        // 1 back-left (behind is negative Y when facing DOWN).
        [ -1, -1 ],
        // 2 back-right.
        [  1, -1 ],
        // 3 two tiles behind.
        [  0, -2 ],
        // 4 farther back-left.
        [ -1, -2 ],
        // 5 farther back-right.
        [  1, -2 ],
        // 6 three tiles behind.
        [  0, -4 ],
      ],
    effects: [],
  },
  {
    key: "flank-sides",
    name: "Wings",
    description: "A side- flank formation.\nAllies will flank you at either side to look extra menacing.",
    formation:
      [
        // 1 left.
        [ -1,  0 ],
        // 2 right.
        [  1,  0 ],
        // 3 far-left.
        [ -2,  0 ],
        // 4 far-right.
        [  2,  0 ],
        // 5 farther-left.
        [ -3,  0 ],
        // 6 farther-right.
        [  3,  0 ],
      ],
    effects: [],
  },
  {
    key: "close-circle",
    name: "Body Barricade",
    description: "The tight circle formation.\nNo one will get to most delicate squishy innard!",
    formation:
      [
        // 1 below.
        [  0,  1 ],
        // 2 right.
        [  1,  0 ],
        // 3 above.
        [  0, -1 ],
        // 4 left.
        [ -1,  0 ],
        // 5 lower-right.
        [  1,  1 ],
        // 6 lower-left.
        [ -1,  1 ],
        // 7 upper-right.
        [  1, -1 ],
        // 8 upper-left.
        [ -1, -1 ],
      ],
    effects: [],
  },
];

/**
 * The default formation type if none is selected.
 * @type {string}
 */
J.ABS.EXT.ALLYAI.Metadata.DefaultFormationType = J.ABS.EXT.ALLYAI.Metadata.FormationTypes[0].key;

/**
 * A collection of all aliased methods for this plugin.
 */
J.ABS.EXT.ALLYAI.Aliased = {
  Game_Actor: new Map(),
  Game_Battler: new Map(),
  Game_Follower: new Map(),
  Game_Followers: new Map(),
  Game_Interpreter: new Map(),
  Game_Map: new Map(),
  Game_Party: new Map(),
  Game_Player: new Map(),

  JABS_AiManager: new Map(),
  JABS_Battler: new Map(),
  JABS_Engine: new Map(),

  Scene_Map: new Map(),

  Spriteset_Map: new Map(),

  Window_AbsMenu: new Map(),
  Window_AbsMenuSelect: new Map(),
};

/**
 * All regular expressions used by this plugin.
 */
J.ABS.EXT.ALLYAI.RegExp = {};
J.ABS.EXT.ALLYAI.RegExp.DefaultAi =
  /<defaultAi:(berserker|guardian|vanguard|war-priest|skirmisher|generalist|cleric|artillery|wizard|medic)>/i;
//endregion plugin setup and configuration
//endregion Introduction