//region plugins/pixel/_component/fixtures/install-pixel-host-globals.js
import { installJBaseHostGlobals } from '../../../_base/_component/fixtures/install-j-base-host-globals.js';
import { installPluginManagerWithParams } from '../../../../setup/install-plugin-manager-with-params.js';
import PluginMetadata from '../../../../../src/plugins/_base/models/PluginMetadata.js';
import { DEFAULT_PIXEL_ABS_EXT_PLUGIN_PARAMS, DEFAULT_PIXEL_CORE_PLUGIN_PARAMS } from './pixel-plugin-params.js';

const noop = function()
{
};

/**
 * `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` are bare identifiers read once, at import time, by both
 * _base/_metadata/initialization.js and pixel/core/_metadata/initialization.js.
 * Call this right before importing J-Base's initialization.js.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJBase(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-Base';
  sandbox.__PLUGIN_VERSION__ = '3.0.0';
}

/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-Pixelistics's own identity. Call
 * this right before importing pixel/core/_metadata/initialization.js.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJPixel(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-Pixelistics';
  sandbox.__PLUGIN_VERSION__ = '1.0.1';
}

/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-ABS-Pixelistics's own identity.
 * Call this right before importing pixel/ext/abs/_metadata/initialization.js.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJPixelAbsExt(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-ABS-Pixelistics';
  sandbox.__PLUGIN_VERSION__ = '1.0.0';
}

/**
 * RMMZ-shaped {@link Game_CharacterBase}/{@link Game_Character}/{@link Game_Player}/{@link Game_Event}
 * prototype chain required before pixel core's own prototype-patch files run.
 * @param {object} sandbox
 */
function installMinimalGameCharacterBasePrototypes(sandbox)
{
  const GCB = sandbox.Game_CharacterBase;

  GCB.prototype.initMembers = function()
  {
    this._x = 0;
    this._y = 0;
    this._realX = 0;
    this._realY = 0;
    this._stopCount = 0;
    this._direction = 2;
    this._movementSuccess = true;
    this._through = false;
  };

  Object.defineProperty(GCB.prototype, 'x', {
    configurable: true,
    enumerable: true,
    get()
    {
      return this._x;
    },
    set(value)
    {
      this._x = value;
    },
  });

  Object.defineProperty(GCB.prototype, 'y', {
    configurable: true,
    enumerable: true,
    get()
    {
      return this._y;
    },
    set(value)
    {
      this._y = value;
    },
  });

  GCB.prototype.update = noop;

  GCB.prototype.screenX = function()
  {
    return (this.x + 0.5) * sandbox.$gameMap.tileWidth();
  };

  GCB.prototype.screenY = function()
  {
    return (this.y + 1.0) * sandbox.$gameMap.tileHeight();
  };

  GCB.prototype.isMoving = function()
  {
    return false;
  };

  GCB.prototype.isThrough = function()
  {
    return this._through === true;
  };

  GCB.prototype.setThrough = function(value)
  {
    this._through = value;
  };

  GCB.prototype.isDebugThrough = function()
  {
    return false;
  };

  GCB.prototype.setMovementSuccess = function(ok)
  {
    this._movementSuccess = ok;
  };

  GCB.prototype.movementSuccess = function()
  {
    return this._movementSuccess !== false;
  };

  sandbox.Game_Character.prototype = Object.create(sandbox.Game_CharacterBase.prototype);
  sandbox.Game_Character.prototype.constructor = sandbox.Game_Character;

  sandbox.Game_Character.prototype.initMembers = function()
  {
    sandbox.Game_CharacterBase.prototype.initMembers.call(this);
  };

  sandbox.Game_Player.prototype = Object.create(sandbox.Game_Character.prototype);
  sandbox.Game_Player.prototype.constructor = sandbox.Game_Player;

  sandbox.Game_Player.prototype.initMembers = function()
  {
    sandbox.Game_Character.prototype.initMembers.call(this);
  };

  sandbox.Game_Event.prototype = Object.create(sandbox.Game_Character.prototype);
  sandbox.Game_Event.prototype.constructor = sandbox.Game_Event;

  sandbox.Game_Event.prototype.initMembers = function()
  {
    sandbox.Game_Character.prototype.initMembers.call(this);
    this._erased = false;
    this._normalPriority = true;
    this._jabsAction = false;
    this._jabsBattler = false;
    this._battlerId = 0;
    this._validCommentCommands = [];
  };

  sandbox.Game_Event.prototype.setupPageSettings = noop;

  sandbox.Game_Event.prototype.isErased = function()
  {
    return this._erased === true;
  };

  sandbox.Game_Event.prototype.isNormalPriority = function()
  {
    return this._normalPriority !== false;
  };

  sandbox.Game_Event.prototype.isJabsAction = function()
  {
    return this._jabsAction === true;
  };

  sandbox.Game_Event.prototype.isJabsBattler = function()
  {
    return this._jabsBattler === true;
  };

  sandbox.Game_Event.prototype.getBattlerId = function()
  {
    return this._battlerId;
  };

  sandbox.Game_Event.prototype.getValidCommentCommands = function()
  {
    return this._validCommentCommands;
  };

  sandbox.Game_Event.prototype.extractValueByRegex = function(structure, defaultValue = null, andParse = true)
  {
    let value = defaultValue;

    this.getValidCommentCommands().forEach(command =>
    {
      const [ comment, ] = command.parameters;
      structure.lastIndex = 0;
      const regexResult = structure.exec(comment);
      if (!regexResult) return;
      [ , value ] = regexResult;
    });

    if (value === defaultValue) return value;
    if (andParse === false) return value;

    return sandbox.JsonMapper.parseObject(value);
  };
}

/**
 * Builds a fresh minimal `$gameMap` stub. Exported so tests that mutate `$gameMap` (replacing it
 * outright, or overriding a single method like `isPassable`) can restore a clean one in their own
 * `beforeEach`, instead of that mutation silently leaking into whichever test happens to run next.
 * @returns {object}
 */
export function buildDefaultPixelGameMap()
{
  return {
    width()
    {
      return 2;
    },
    tileWidth()
    {
      return 48;
    },
    tileHeight()
    {
      return 48;
    },
    height()
    {
      return 2;
    },
    isPassable()
    {
      return true;
    },
    distance(x0, y0, x1, y1)
    {
      const dx = x0 - x1;
      const dy = y0 - y1;

      return Math.sqrt(dx * dx + dy * dy);
    },
    isDashDisabled()
    {
      return false;
    },
    isValid(tx, ty)
    {
      return tx >= 0 && ty >= 0 && tx < this.width() && ty < this.height();
    },
    roundXWithDirection(x, d)
    {
      return x;
    },
    roundYWithDirection(y, d)
    {
      return y;
    },
    isCounter()
    {
      return false;
    },
    events()
    {
      return [];
    },
    eventsXyNt()
    {
      return [];
    },
    requestRefresh: noop,
  };
}

/**
 * Globals required for J-Pixelistics core's prototype-patch source files to evaluate when
 * direct-imported into the real Vitest realm instead of a nested vm context.
 * @param {object} [sandbox] Defaults to `globalThis` so direct-import tests can call this with no target arg.
 * @param {Record<string, string>} [coreParams]
 */
export function installPixelCoreHostGlobals(sandbox = globalThis, coreParams = DEFAULT_PIXEL_CORE_PLUGIN_PARAMS)
{
  if (sandbox.__pixelCoreHostGlobalsInstalled === true)
  {
    return;
  }

  sandbox.__pixelCoreHostGlobalsInstalled = true;

  installJBaseHostGlobals(sandbox);

  sandbox.PluginMetadata ??= PluginMetadata;

  installPluginManagerWithParams(sandbox, 'J-Pixelistics', coreParams);

  installMinimalGameCharacterBasePrototypes(sandbox);

  sandbox.Math.sqrt = Math.sqrt;
  sandbox.Math.hypot = Math.hypot;

  if (typeof sandbox.Array.prototype.contains !== 'function')
  {
    sandbox.Array.prototype.contains = function(entry)
    {
      return this.indexOf(entry) >= 0;
    };
  }

  sandbox.Input = sandbox.Input || {};
  sandbox.Input.dir8 = 0;
  sandbox.Input.keyMapper = sandbox.Input.keyMapper || {};
  sandbox.Input.isTriggered = function()
  {
    return false;
  };

  // globalThis.navigator is a real read-only getter in modern Node, so a plain assignment throws-
  // redefine the property itself instead of assigning to it.
  Object.defineProperty(sandbox, 'navigator', {
    configurable: true,
    value: {
      getGamepads()
      {
        return [];
      },
    },
  });

  function Bitmap()
  {
  }

  sandbox.Bitmap = Bitmap;

  function Spriteset_Map()
  {
  }

  Spriteset_Map.prototype.createUpperLayer = noop;

  sandbox.Spriteset_Map = Spriteset_Map;

  sandbox.$gameMap = buildDefaultPixelGameMap();

  sandbox.$dataMap = {
    width: 2,
    height: 2,
  };

  sandbox.$gameTemp = {
    isDestinationValid()
    {
      return false;
    },
    clearDestination: noop,
    destinationX()
    {
      return 0;
    },
    destinationY()
    {
      return 0;
    },
  };

  sandbox.$gamePlayer = new sandbox.Game_Player();
  sandbox.$gamePlayer.initMembers();
  sandbox.$gamePlayer._followers = { _data: [] };
}

/**
 * Merges additional globals required for J-ABS-Pixelistics's prototype-patch source files to
 * evaluate after pixel core is loaded. Uses hand-rolled duck-typed JABS_Battler/JABS_Engine/
 * JABS_AiManager stand-ins (not the real J-ABS classes)- this extension pack's own tests were
 * designed to exercise its logic in isolation from the real abs plugin.
 * @param {object} [sandbox] Defaults to `globalThis`.
 * @param {Record<string, string>} [extParams]
 */
export function installPixelAbsExtHostGlobals(sandbox = globalThis, extParams = DEFAULT_PIXEL_ABS_EXT_PLUGIN_PARAMS)
{
  const prevPm = sandbox.PluginManager;

  sandbox.PluginManager = {
    parameters(name)
    {
      if (name === 'J-ABS-Pixelistics')
      {
        return extParams;
      }

      return prevPm.parameters(name);
    },
    registerCommand: noop,
  };

  sandbox.J = sandbox.J || {};
  sandbox.J.ABS = sandbox.J.ABS || {};
  sandbox.J.ABS.Directions = {
    DOWN: 2,
    LEFT: 4,
    RIGHT: 6,
    UP: 8,
    LOWERLEFT: 1,
    LOWERRIGHT: 3,
    UPPERLEFT: 7,
    UPPERRIGHT: 9,
  };
  sandbox.J.ABS.EXT = sandbox.J.ABS.EXT || {};

  if (typeof sandbox.JABS_AiManager !== 'function')
  {
    function JABS_AiManager()
    {
    }

    sandbox.JABS_AiManager = JABS_AiManager;
  }

  sandbox.JABS_AiManager.canMoveIdly = function()
  {
    return false;
  };

  sandbox.JABS_AiManager.moveIdly = noop;
  sandbox.JABS_AiManager.goHome = noop;
  sandbox.JABS_AiManager.rubberbandAlly = noop;
  sandbox.JABS_AiManager.moveTowardSlotIfNeeded = noop;

  if (typeof sandbox.RPG_Enemy !== 'function')
  {
    function RPG_Enemy()
    {
      this.note = '';
    }

    sandbox.RPG_Enemy = RPG_Enemy;
  }

  sandbox.$dataEnemies = [];
  sandbox.$gameEnemies = {
    enemy(enemyId)
    {
      return {
        enemy()
        {
          return sandbox.$dataEnemies[enemyId];
        },
      };
    },
  };

  class JABS_Aabb
  {
    constructor(x, y, w, h)
    {
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;
      this.cx = x + (w / 2);
      this.cy = y + (h / 2);
    }

    static fromFeet(feetX, feetY, tw, th)
    {
      return new JABS_Aabb(feetX - (tw / 2), feetY - th, tw, th);
    }
  }

  sandbox.JABS_Aabb = JABS_Aabb;

  class JABS_Engine
  {
    static getBattlerAabbModel(character)
    {
      if (!character)
      {
        return new sandbox.JABS_Aabb(0, 0, 0, 0);
      }

      return sandbox.JABS_Aabb.fromFeet(
        character.screenX(),
        character.screenY(),
        sandbox.$gameMap.tileWidth(),
        sandbox.$gameMap.tileHeight());
    }
  }

  sandbox.JABS_Engine = JABS_Engine;

  function JABS_Battler()
  {
    this.__lastDodgeSteps = null;
    this.__distHome = 0;
    this.__battlerSubject = { isActor: () => true };
    this.__idle = undefined;
  }

  JABS_Battler.prototype.setDodgeSteps = function(stepCount)
  {
    this.__lastDodgeSteps = stepCount;
  };

  JABS_Battler.prototype.getX = function()
  {
    return this.getCharacter().x;
  };

  JABS_Battler.prototype.getY = function()
  {
    return this.getCharacter().y;
  };

  JABS_Battler.prototype.distanceToHome = function()
  {
    return this.__distHome;
  };

  JABS_Battler.prototype.getBattler = function()
  {
    return this.__battlerSubject;
  };

  JABS_Battler.prototype.destroy = noop;
  JABS_Battler.prototype.initIdleInfo = noop;
  JABS_Battler.prototype.isHome = function()
  {
    return true;
  };
  JABS_Battler.prototype.updatePixelIdleWander = noop;
  JABS_Battler.prototype.smartMoveTowardCoordinates = noop;
  JABS_Battler.prototype.setIdle = function(value)
  {
    this.__idle = value;
  };

  JABS_Battler.prototype.canBattlerMove = function()
  {
    return this.__canMove !== false;
  };
  JABS_Battler.prototype.getHomeX = function()
  {
    return 0;
  };
  JABS_Battler.prototype.getHomeY = function()
  {
    return 0;
  };
  JABS_Battler.prototype.getProjectileSpawnBaseDirection = function()
  {
    return this.getCharacter()
      .direction();
  };

  JABS_Battler.prototype.getCharacter = function()
  {
    return {
      x: 0,
      y: 0,
      jumpToPlayer: noop,
      stopPixelMoving: noop,
      direction()
      {
        return 2;
      },
    };
  };
  JABS_Battler.prototype.lockEngagement = noop;
  JABS_Battler.prototype.disengageTarget = noop;
  JABS_Battler.prototype.resetAllAggro = noop;
  JABS_Battler.prototype.unlockEngagement = noop;
  JABS_Battler.prototype.getTarget = function()
  {
    return null;
  };
  JABS_Battler.closeDistance = 1;
  JABS_Battler.isClose = function()
  {
    return false;
  };

  sandbox.JABS_Battler = JABS_Battler;
}
//endregion plugins/pixel/_component/fixtures/install-pixel-host-globals.js
