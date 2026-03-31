//region install-j-base-host-globals
const noop = function()
{
};

/**
 * Globals required for {@link out/J-Base.js} to evaluate in a VM (discovered via host probe).
 * Game/Window/Sprite constructors are placeholders; tests should replace key classes (e.g. {@link Game_Battler})
 * before J-Base runs via {@link evaluateShippedPlugin}'s `afterHostGlobalsInstall` hook.
 *
 * @param {object} sandbox
 * @param {Record<string, string>} jBasePluginParameterStrings Values as RMMZ would provide for `J-Base`.
 */
export function installJBaseHostGlobals(sandbox, jBasePluginParameterStrings)
{
  if (sandbox.__jBaseHostGlobalsInstalled === true)
  {
    return;
  }

  sandbox.__jBaseHostGlobalsInstalled = true;

  sandbox.PluginManager = {
    parameters(name)
    {
      if (name === 'J-Base')
      {
        return jBasePluginParameterStrings;
      }

      return {};
    },
  };

  sandbox.ColorManager = {
    textColor()
    {
      return 0;
    },
    itemBackColor1()
    {
      return 0;
    },
    itemBackColor2()
    {
      return 0;
    },
  };

  sandbox.PanelRarity = {
    fromRarityToColor()
    {
      return 0;
    },
  };

  sandbox.DataManager = {
    isDatabaseLoaded()
    {
      return true;
    },
    setupNewGame: noop,
    extractSaveContents: noop,
    setupBattleTest: noop,
  };

  sandbox.Graphics = {
    width: 816,
    height: 624,
    boxWidth: 816,
    boxHeight: 624,
  };

  sandbox.ImageManager = {};
  sandbox.SoundManager = {};
  sandbox.StorageManager = {};
  sandbox.TextManager = {};

  class EventEmitter
  {
  }

  function GraphicsCtor()
  {
  }

  sandbox.PIXI = {
    utils: { EventEmitter },
    Graphics: GraphicsCtor,
  };

  const placeholderNames = [
    'Game_Actor',
    'Game_Actors',
    'Game_Battler',
    'Game_BattlerBase',
    'Game_Character',
    'Game_CharacterBase',
    'Game_Enemy',
    'Game_Event',
    'Game_Follower',
    'Game_Map',
    'Game_Party',
    'Game_Player',
    'Game_System',
    'Game_Temp',
    'Game_Timer',
    'Game_Vehicle',
    'Scene_Base',
    'Sprite',
    'Sprite_Character',
    'Sprite_Gauge',
    'Tilemap',
    'Window_Base',
    'Window_Command',
    'Window_EquipItem',
    'Window_Help',
    'Window_Selectable',
    'WindowLayer',
  ];

  for (const name of placeholderNames)
  {
    function Placeholder()
    {
    }

    Placeholder.prototype = {};
    sandbox[name] = Placeholder;
  }

  sandbox.Game_Battler.prototype.initMembers = function()
  {
    this._states = [];
  };

  sandbox.$dataActors = [];
  sandbox.$dataClasses = [];
  sandbox.$dataSkills = [];
  sandbox.$dataItems = [];
  sandbox.$dataWeapons = [];
  sandbox.$dataArmors = [];
  sandbox.$dataEnemies = [];
  sandbox.$dataTroops = [];
  sandbox.$dataStates = [];
  sandbox.$dataAnimations = [];
  sandbox.$dataTilesets = [];
  sandbox.$dataCommonEvents = [];
  sandbox.$dataSystem = [];
  sandbox.$dataMapInfos = [];
  sandbox.$dataMap = [];

  sandbox.$gameTemp = null;
  sandbox.$gameSystem = null;
  sandbox.$gameScreen = null;
  sandbox.$gameTimer = null;
  sandbox.$gameMessage = null;
  sandbox.$gameSwitches = null;
  sandbox.$gameVariables = {
    _data: [],
    value: noop,
    setValue: noop,
  };
  sandbox.$gameSelfSwitches = null;
  sandbox.$gameActors = null;
  sandbox.$gameParty = null;
  sandbox.$gameTroop = null;
  sandbox.$gameMap = {
    requestRefresh: noop,
  };
  sandbox.$gamePlayer = null;
  sandbox.$testEvent = null;

  if (!sandbox.Math)
  {
    sandbox.Math = {
      abs: Math.abs,
      ceil: Math.ceil,
      floor: Math.floor,
      max: Math.max,
      min: Math.min,
      random: Math.random,
      round: Math.round,
      randomInt(n)
      {
        return Math.floor(Math.random() * n);
      },
    };
  }
  else if (typeof sandbox.Math.randomInt !== 'function')
  {
    sandbox.Math.randomInt = function(n)
    {
      return Math.floor(Math.random() * n);
    };
  }
}
//endregion install-j-base-host-globals
