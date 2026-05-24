//region engine-stubs
import { DEFAULT_UTILS_PLUGIN_PARAMS } from './utils-plugin-params.js';
import { installPluginManagerWithParams } from '../../../setup/install-plugin-manager-with-params.js';

const noop = function()
{
};

/**
 * Minimal globals so {@link out/utils/J-SystemUtilities.js} can evaluate after {@link out/J-Base.js}.
 *
 * @param {object} sandbox VM global object (after {@link installJBaseHostGlobals}).
 */
export function installUtilsEngineStubs(sandbox)
{
  installPluginManagerWithParams(sandbox, 'J-SystemUtilities', DEFAULT_UTILS_PLUGIN_PARAMS);

  sandbox.setTimeout = function(cb)
  {
    cb();
  };

  sandbox.nw = {
    Window: {
      get()
      {
        return {
          focus: noop,
        };
      },
    },
  };

  sandbox.SceneManager = sandbox.SceneManager || {};
  sandbox.SceneManager.showDevTools = noop;
  sandbox.SceneManager.goto = noop;

  if (typeof sandbox.Bitmap !== 'function')
  {
    function Bitmap()
    {
    }

    Bitmap.prototype = {};
    Bitmap.prototype.constructor = Bitmap;
    Bitmap.prototype._createBaseTexture = noop;
    sandbox.Bitmap = Bitmap;
  }

  sandbox.document = sandbox.document || {
    createElement()
    {
      return {
        getContext()
        {
          return {};
        },
      };
    },
  };

  if (typeof sandbox.Scene_Boot !== 'function')
  {
    function Scene_Boot()
    {
    }

    Scene_Boot.prototype = {};
    Scene_Boot.prototype.constructor = Scene_Boot;
    sandbox.Scene_Boot = Scene_Boot;
  }

  sandbox.Scene_Boot.prototype.checkPlayerLocation = noop;
  sandbox.Scene_Boot.prototype.startNormalGame = function()
  {
    sandbox.__utilsOriginalStartNormalGameCalled = true;
  };
  sandbox.Scene_Boot.prototype.start = function()
  {
    sandbox.__utilsOriginalStartCalled = true;
  };

  sandbox.DataManager.setupNewGame = function()
  {
    sandbox.__utilsSetupNewGameCalled = true;
  };

  if (typeof sandbox.Scene_Map !== 'function')
  {
    function Scene_Map()
    {
    }

    Scene_Map.prototype = {};
    Scene_Map.prototype.constructor = Scene_Map;
    sandbox.Scene_Map = Scene_Map;
  }

  sandbox.Input = sandbox.Input || {};
  sandbox.Input.keyMapper = sandbox.Input.keyMapper || {};
  sandbox.Input.gamepadMapper = sandbox.Input.gamepadMapper || {};
  sandbox.Input._gamepadStates = sandbox.Input._gamepadStates || [];
  sandbox.Input._updateGamepadState = function(gamepad)
  {
    sandbox.Input._gamepadStates[gamepad.index] = [ true ];
  };

  sandbox.DataManager.makeSaveContents = function()
  {
    return {
      map: {
        _events: [],
      },
    };
  };
}
//endregion engine-stubs
