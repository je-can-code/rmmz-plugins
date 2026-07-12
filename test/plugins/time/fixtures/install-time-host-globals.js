//region install-time-host-globals
import PluginMetadata from '../../../../src/plugins/_base/models/PluginMetadata.js';
import SerializableRegistry from '../../../../src/plugins/_base/core/SerializableRegistry.js';
import { DEFAULT_TIME_PLUGIN_PARAMS } from './time-plugin-params.js';

const noop = function()
{
};

/**
 * Globals required for J-TIME's prototype-patch source files (objects/Game_Event.js,
 * objects/Game_Interpreter.js, objects/JABS_InputController.js, managers/JABS_InputAdapter.js) to evaluate
 * when direct-imported into the real Vitest realm instead of a nested vm context. Mirrors the shape of
 * {@link installTimeEngineStubs} in engine-stubs.js, but targets `globalThis` by default so bare-global
 * identifiers (Game_Event, Game_Interpreter, JABS_StandardController, JABS_InputAdapter) resolve the same
 * way they would in a real RPG Maker script-concatenation runtime.
 *
 * @param {object} [sandbox] Defaults to `globalThis` so direct-import tests can call this with no target arg.
 */
export function installTimeHostGlobals(sandbox = globalThis)
{
  if (sandbox.__timeHostGlobalsInstalled === true)
  {
    return;
  }

  sandbox.__timeHostGlobalsInstalled = true;

  sandbox.__PLUGIN_NAME__ ??= 'J-TIME';
  sandbox.__PLUGIN_VERSION__ ??= '0.0.0-test';

  // real J-Base class- the shipped runtime concatenates J-Base ahead of every extension plugin, so
  // PluginMetadata is always a bare global by the time a plugin's own _pluginMetadata.js subclass runs.
  sandbox.PluginMetadata ??= PluginMetadata;
  sandbox.SerializableRegistry ??= SerializableRegistry;

  const prevPm = sandbox.PluginManager;

  sandbox.PluginManager = {
    parameters(name)
    {
      if (name === 'J-TIME')
      {
        return DEFAULT_TIME_PLUGIN_PARAMS;
      }

      return prevPm ? prevPm.parameters(name) : undefined;
    },
    registerCommand: noop,
  };

  if (typeof sandbox.Game_Event !== 'function')
  {
    function Game_Event()
    {
    }

    Game_Event.prototype = {};
    Game_Event.prototype.constructor = Game_Event;
    sandbox.Game_Event = Game_Event;
  }

  // minimal helper used by TIME page/choice parsing; real J-Base/J-Message logic in the shipped runtime.
  sandbox.Game_Event.getValidCommentCommandsFromPage = function(page)
  {
    const list = page && Array.isArray(page.list) ? page.list : [];
    return list.filter(cmd => cmd && (cmd.code === 108 || cmd.code === 408));
  };

  sandbox.Game_Event.filterInvalidEventCommand = sandbox.Game_Event.filterInvalidEventCommand
    || function(command)
    {
      if (!command) return false;
      const [ comment, ] = command.parameters;
      return Boolean(comment);
    };

  if (typeof sandbox.Game_Interpreter !== 'function')
  {
    function Game_Interpreter()
    {
    }

    Game_Interpreter.prototype = {};
    Game_Interpreter.prototype.constructor = Game_Interpreter;
    Game_Interpreter.prototype.shouldHideChoiceBranch = function()
    {
      return false;
    };
    sandbox.Game_Interpreter = Game_Interpreter;
  }

  if (typeof sandbox.JABS_StandardController !== 'function')
  {
    function JABS_StandardController()
    {
    }

    JABS_StandardController.prototype = {};
    JABS_StandardController.prototype.constructor = JABS_StandardController;
    JABS_StandardController.prototype.update = noop;
    sandbox.JABS_StandardController = JABS_StandardController;
  }

  sandbox.Input = sandbox.Input || {
    isTriggered()
    {
      return false;
    },
  };

  sandbox.JABS_InputAdapter = sandbox.JABS_InputAdapter || {};

  sandbox.Graphics = sandbox.Graphics || { frameCount: 0 };

  sandbox.J = sandbox.J || {};
  sandbox.J.ABS = sandbox.J.ABS || {
    EXT: {
      INPUT: {
        Symbols: {
          L3: 'l3',
        },
      },
    },
  };
}
//endregion install-time-host-globals
