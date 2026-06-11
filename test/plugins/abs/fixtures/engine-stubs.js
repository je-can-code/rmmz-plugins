//region engine-stubs
import { installJabsOnChanceEffectGlobalStub } from '../../_base/fixtures/install-jabs-onchance-stub.js';
import { installMinimalMenuUiStubs } from '../../../setup/install-minimal-menu-ui-stubs.js';
import { installPluginManagerWithParams } from '../../../setup/install-plugin-manager-with-params.js';

const noop = function()
{
};

/**
 * Minimal globals so {@link out/abs/J-ABS.js} can evaluate after {@link out/J-Base.js}.
 *
 * @param {object} sandbox VM global object (after {@link installJBaseHostGlobals}).
 * @param {Record<string, string>|null} [jAbsPluginParameterStrings]
 */
export function installAbsEngineStubs(sandbox, jAbsPluginParameterStrings = null)
{
  installJabsOnChanceEffectGlobalStub(sandbox);
  installMinimalMenuUiStubs(sandbox);

  const strings = jAbsPluginParameterStrings ?? {
    defaultStateSpreadTickInterval: '30',
    maxAiUpdateRange: '20',
  };

  installPluginManagerWithParams(sandbox, 'J-ABS', strings);

  sandbox.StorageManager.fsReadFile = function(path)
  {
    if (path === 'data/config.jabs.json')
    {
      return JSON.stringify({ teams: [] });
    }

    return null;
  };

  const extraEnginePlaceholders = [
    'Game_Interpreter',
    'Game_Switches',
    'Game_Unit',
    'Spriteset_Base',
    'Spriteset_Map',
    'Sprite_Animation',
    'Sprite_AnimationMV',
    'Sprite_Gauge',
    'Sprite_HitboxPulse',
    'Sprite_MapCastGauge',
    'Sprite_MapHpGauge',
    'Window_AbsMenu',
    'Window_AbsMenuSelect',
    'Bitmap',
    'Input',
    'TouchInput',
    'Scene_Load',
    'Scene_Map',
    'ColorManager',
    'TextManager',
    'AudioManager',
    'ImageManager',
    'DataManager',
  ];

  for (const name of extraEnginePlaceholders)
  {
    if (typeof sandbox[name] !== 'function')
    {
      function Placeholder()
      {
      }

      Placeholder.prototype = {};
      sandbox[name] = Placeholder;
    }
  }

  sandbox.Spriteset_Map.prototype.createUpperLayer = noop;
  sandbox.Scene_Map.prototype.isReady = function()
  {
    return true;
  };

  sandbox.Input = sandbox.Input || {};
  sandbox.Input.dir8 = 0;
  sandbox.Input.keyMapper = sandbox.Input.keyMapper || {};
  sandbox.Input.isTriggered = function()
  {
    return false;
  };

  sandbox.$gameMap = sandbox.$gameMap || {
    width()
    {
      return 2;
    },
    height()
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
    distance()
    {
      return 0;
    },
    requestRefresh: noop,
  };

  function Game_Action()
  {
  }

  Game_Action.prototype.initialize = noop;
  Game_Action.prototype.apply = noop;
  sandbox.Game_Action = Game_Action;

  function Game_ActionResult()
  {
  }

  sandbox.Game_ActionResult = Game_ActionResult;

  function Scene_Map()
  {
  }

  Scene_Map.prototype.isReady = function()
  {
    return true;
  };
  sandbox.Scene_Map = Scene_Map;

  sandbox.$jabsEngine = {
    absEnabled: true,
  };

  sandbox.$dataStates = sandbox.$dataStates || [ null ];

  sandbox.JABS_AiManager = sandbox.JABS_AiManager || {};
  sandbox.JABS_AiManager.getBattlerByUuid = sandbox.JABS_AiManager.getBattlerByUuid || function()
  {
    return null;
  };
  sandbox.JABS_AiManager.getAlliedBattlersWithinRange = sandbox.JABS_AiManager.getAlliedBattlersWithinRange
    || function()
    {
      return [];
    };
  sandbox.JABS_AiManager.getAllBattlersWithinRangeSortedByDistance =
    sandbox.JABS_AiManager.getAllBattlersWithinRangeSortedByDistance || function()
    {
      return [];
    };
}
//endregion engine-stubs
