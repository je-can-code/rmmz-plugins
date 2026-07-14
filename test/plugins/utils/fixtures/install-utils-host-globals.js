//region install-utils-host-globals
import { installJBaseHostGlobals } from '../../_base/fixtures/install-j-base-host-globals.js';
import { installPluginManagerWithParams } from '../../../setup/install-plugin-manager-with-params.js';
import { DEFAULT_UTILS_PLUGIN_PARAMS } from './utils-plugin-params.js';
import PluginMetadata from '../../../../src/plugins/_base/models/PluginMetadata.js';

const noop = function()
{
};

/**
 * `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` are bare identifiers read once, at import time, by
 * _base/_metadata/initialization.js.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJBase(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-Base';
  sandbox.__PLUGIN_VERSION__ = '3.0.0';
}

/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-SystemUtilities's own identity.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJUtils(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-SystemUtilities';
  sandbox.__PLUGIN_VERSION__ = '1.0.0';
}

/**
 * Globals required for J-SystemUtilities's Input.js/Scene_Boot.js to evaluate when direct-imported
 * into the real Vitest realm instead of a nested vm context.
 * @param {object} [sandbox] Defaults to `globalThis` so direct-import tests can call this with no target arg.
 */
export function installUtilsHostGlobals(sandbox = globalThis)
{
  if (sandbox.__utilsHostGlobalsInstalled === true)
  {
    return;
  }

  sandbox.__utilsHostGlobalsInstalled = true;

  installJBaseHostGlobals(sandbox);

  // utils's own _pluginMetadata.js subclasses this real J-Base class as a bare global (no import).
  sandbox.PluginMetadata ??= PluginMetadata;

  installPluginManagerWithParams(sandbox, 'J-SystemUtilities', DEFAULT_UTILS_PLUGIN_PARAMS);

  // real _base Scene_Boot.js's start() schedules a devtools-focus timer; run it synchronously.
  sandbox.setTimeout = function(cb)
  {
    cb();
  };

  sandbox.nw = {
    Window: {
      get()
      {
        return { focus: noop };
      },
    },
  };

  sandbox.SceneManager = sandbox.SceneManager || {};
  sandbox.SceneManager.showDevTools = noop;
  sandbox.SceneManager.goto = noop;

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

  // Input is not one of installJBaseHostGlobals's placeholder classes; seed it ourselves.
  sandbox.Input = sandbox.Input || {};
  sandbox.Input.keyMapper = sandbox.Input.keyMapper || {};
  sandbox.Input.gamepadMapper = sandbox.Input.gamepadMapper || {};
  sandbox.Input._gamepadStates = sandbox.Input._gamepadStates || [];
  sandbox.Input._updateGamepadState = function(gamepad)
  {
    sandbox.Input._gamepadStates[gamepad.index] = [ true ];
  };
}
//endregion install-utils-host-globals
