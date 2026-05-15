//region engine-stubs
import vm from 'node:vm';

import { installPluginManagerWithParams } from '../../../setup/install-plugin-manager-with-params.js';

const hostMath = Math;

import {
  DEFAULT_PIXEL_ABS_EXT_PLUGIN_PARAMS,
  DEFAULT_PIXEL_CORE_PLUGIN_PARAMS,
} from './pixel-plugin-params.js';

const noop = function()
{
};

/**
 * RMMZ-shaped {@link Game_CharacterBase} hooks required before {@link out/pixel/J-Pixelistics.js} aliases run.
 *
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

  GCB.prototype.update = function()
  {
  };

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

  sandbox.Game_Event.prototype.setupPageSettings = function()
  {
  };

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
 * Minimal globals so {@link out/pixel/J-Pixelistics.js} can evaluate after {@link out/J-Base.js}.
 *
 * @param {object} sandbox
 * @param {Record<string, string>} [coreParams]
 */
export function installPixelCoreEngineStubs(sandbox, coreParams = DEFAULT_PIXEL_CORE_PLUGIN_PARAMS)
{
  installPluginManagerWithParams(sandbox, 'J-Pixelistics', coreParams);

  installMinimalGameCharacterBasePrototypes(sandbox);

  sandbox.Math.sqrt = hostMath.sqrt;
  sandbox.Math.hypot = hostMath.hypot;

  vm.runInContext(`
if (typeof Array.prototype.contains !== 'function')
{
  Array.prototype.contains = function(entry)
  {
    return this.indexOf(entry) >= 0;
  };
}
`, sandbox);

  sandbox.Input = sandbox.Input || {};
  sandbox.Input.dir8 = 0;
  sandbox.Input.keyMapper = sandbox.Input.keyMapper || {};
  sandbox.Input.isTriggered = function()
  {
    return false;
  };

  sandbox.navigator = {
    getGamepads()
    {
      return [];
    },
  };

  function Bitmap()
  {
  }

  sandbox.Bitmap = Bitmap;

  function Spriteset_Map()
  {
  }

  Spriteset_Map.prototype.createUpperLayer = noop;

  sandbox.Spriteset_Map = Spriteset_Map;

  sandbox.$gameMap = {
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
 * Merges {@link PluginManager.parameters} for {@link out/pixel/ext/J-Pixel-ABS.js} after core is loaded.
 *
 * @param {object} sandbox
 * @param {Record<string, string>} [extParams]
 */
export function installPixelAbsExtensionEngineStubs(sandbox, extParams = DEFAULT_PIXEL_ABS_EXT_PLUGIN_PARAMS)
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

    registerCommand()
    {
    },
  };

  vm.runInContext(`
globalThis.J = globalThis.J || {};
globalThis.J.ABS = globalThis.J.ABS || {};
globalThis.J.ABS.Directions = {
  DOWN: 2,
  LEFT: 4,
  RIGHT: 6,
  UP: 8,
  LOWERLEFT: 1,
  LOWERRIGHT: 3,
  UPPERLEFT: 7,
  UPPERRIGHT: 9,
};
globalThis.J.ABS.EXT = globalThis.J.ABS.EXT || {};
`, sandbox);

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
//endregion engine-stubs
