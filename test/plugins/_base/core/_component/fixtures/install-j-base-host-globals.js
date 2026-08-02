//region plugins/_base/_component/fixtures/install-j-base-host-globals.js
const noop = function()
{
};

/**
 * Globals required for J-Base source to evaluate, for individual `src/plugins/_base/core/**` files imported
 * directly into the real test realm. Game/Window/Sprite constructors are placeholders; tests should replace
 * key classes (e.g. {@link Game_Battler}) by mutating `globalThis` directly before a direct `import()` of the
 * target file.
 *
 * @param {object} [sandbox] Defaults to `globalThis` so direct-import tests can call this with no target arg.
 * @param {Record<string, string>} jBasePluginParameterStrings Values as RMMZ would provide for `J-Base`.
 */
export function installJBaseHostGlobals(
  sandbox = globalThis,
  jBasePluginParameterStrings = { actorBaseTp: '0', enemyBaseTp: '100' },
)
{
  if (sandbox.__jBaseHostGlobalsInstalled === true)
  {
    return;
  }

  sandbox.__jBaseHostGlobalsInstalled = true;

  // J-Base aliases Bitmap#drawText at parse time; NW.js provides Bitmap in the real player.
  if (typeof sandbox.Bitmap !== 'function')
  {
    function Bitmap()
    {
    }

    Bitmap.prototype.drawText = noop;
    Bitmap.prototype._createBaseTexture = noop;
    sandbox.Bitmap = Bitmap;
  }

  // JsonEx is an engine global used for deep copying and save/load serialization.
  // J-Base extends JsonEx in core/JsonEx.js at parse time.
  if (typeof sandbox.JsonEx !== 'function')
  {
    function JsonEx()
    {
      throw new Error('This is a static class');
    }

    JsonEx.maxDepth = 100;

    JsonEx.stringify = function(object)
    {
      return JSON.stringify(this._encode(object, 0));
    };

    JsonEx.parse = function(json)
    {
      return this._decode(JSON.parse(json));
    };

    JsonEx.makeDeepCopy = function(object)
    {
      return this.parse(this.stringify(object));
    };

    JsonEx._encode = function(value, depth)
    {
      if (depth >= this.maxDepth)
      {
        throw new Error('Object too deep');
      }

      const type = Object.prototype.toString.call(value);
      if (type === '[object Object]' || type === '[object Array]')
      {
        const constructorName = value.constructor.name;
        if (constructorName !== 'Object' && constructorName !== 'Array')
        {
          value['@'] = constructorName;
        }

        Object.keys(value).forEach(key =>
        {
          value[key] = this._encode(value[key], depth + 1);
        });
      }

      return value;
    };

    JsonEx._decode = function(value)
    {
      const type = Object.prototype.toString.call(value);
      if (type === '[object Object]' || type === '[object Array]')
      {
        if (value['@'])
        {
          const constructor = sandbox.window[value['@']];
          if (constructor)
          {
            Object.setPrototypeOf(value, constructor.prototype);
          }
        }

        Object.keys(value).forEach(key =>
        {
          value[key] = this._decode(value[key]);
        });
      }

      return value;
    };

    sandbox.JsonEx = JsonEx;
  }

  // emulate the browser global object for lookups like `window[className]`.
  if (sandbox.window === undefined)
  {
    sandbox.window = sandbox;
  }

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

  // vite's `define` plugin substitutes these at build time, so they never appear in out/J-Base.js- but
  // direct-import tests exercise raw src/plugins/_base source, where these are still bare identifiers.
  sandbox.__PLUGIN_NAME__ ??= 'J-Base';
  sandbox.__PLUGIN_VERSION__ ??= '0.0.0-test';

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
  sandbox.IconManager = {};

  // models register their save codec at import time against the registry J-Base hoists as a global.
  // a stub rather than the real class, because a test that cares about codecs imports the registry
  // itself, and one that does not should not have registrations from an unrelated realm leaking in.
  sandbox.SerializableRegistry = {
    register: noop,
    extend: noop,
  };

  class EventEmitter
  {
    constructor()
    {
      /** @type {Map<string, Function[]>} */
      this._jListeners = new Map();
    }

    emit(event, ...args)
    {
      const list = this._jListeners.get(event);
      if (list === undefined || list.length === 0)
      {
        return false;
      }

      list.forEach(fn =>
      {
        fn(...args);
      });

      return true;
    }

    on(event, fn)
    {
      if (this._jListeners.has(event) === false)
      {
        this._jListeners.set(event, []);
      }

      this._jListeners.get(event)
        .push(fn);

      return this;
    }

    off(event, fn)
    {
      const list = this._jListeners.get(event);

      if (list === undefined)
      {
        return this;
      }

      const idx = list.indexOf(fn);

      if (idx >= 0)
      {
        list.splice(idx, 1);
      }

      return this;
    }

    removeAllListeners(event)
    {
      if (event === undefined)
      {
        this._jListeners.clear();
      }
      else
      {
        this._jListeners.delete(event);
      }

      return this;
    }
  }

  function GraphicsCtor()
  {
  }

  sandbox.PIXI = {
    utils: { EventEmitter },
    Graphics: GraphicsCtor,
  };

  const placeholderNames = [
    'Game_Action',
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
    'Scene_Boot',
    'Scene_Map',
    'Scene_Menu',
    'Sprite',
    'Sprite_Character',
    'Sprite_Gauge',
    'Tilemap',
    'Window_Base',
    'Window_Command',
    'Window_EquipItem',
    'Window_Help',
    'Window_Selectable',
    'Window_StatusBase',
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

  // Wire the standard RMMZ inheritance chain so J-Base prototype extensions on
  // Game_BattlerBase (e.g. setCachedTraitObjects) are reachable from Game_Battler,
  // Game_Actor, and Game_Enemy instances in all test VMs that use these placeholders.
  Object.setPrototypeOf(sandbox.Scene_Map.prototype, sandbox.Scene_Base.prototype);
  Object.setPrototypeOf(sandbox.Game_Battler.prototype, sandbox.Game_BattlerBase.prototype);
  Object.setPrototypeOf(sandbox.Game_Actor.prototype, sandbox.Game_Battler.prototype);
  Object.setPrototypeOf(sandbox.Game_Enemy.prototype, sandbox.Game_Battler.prototype);
  sandbox.Game_Actor.prototype.constructor = sandbox.Game_Actor;
  sandbox.Game_Enemy.prototype.constructor = sandbox.Game_Enemy;

  // Provide no-op initMembers on BattlerBase so J.BASE.Aliased.Game_BattlerBase has a real
  // function to save (not undefined), preventing "cannot read .call of undefined" when
  // plugin alias chains invoke it.
  sandbox.Game_BattlerBase.prototype.initMembers = function() {};

  // In real RMMZ, Game_Battler.prototype.initMembers calls Game_BattlerBase.prototype.initMembers.
  // Replicate that so plugin extensions on Game_BattlerBase (e.g. J-LevelMaster's _j._level setup)
  // are properly invoked whenever a test actor or enemy calls initMembers().
  sandbox.Game_Battler.prototype.initMembers = function()
  {
    sandbox.Game_BattlerBase.prototype.initMembers.call(this);
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
//endregion plugins/_base/_component/fixtures/install-j-base-host-globals.js
