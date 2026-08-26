//region plugins/time/_component/fixtures/install-time-host-globals.js
import PluginMetadata from '../../../../../src/plugins/_base/core/models/PluginMetadata.js';
import SerializableRegistry from '../../../../../src/plugins/_base/core/core/SerializableRegistry.js';
import { DEFAULT_TIME_PLUGIN_PARAMS } from './time-plugin-params.js';

const noop = function()
{
};

/**
 * Installs the prototype extensions the shipped runtime already provides by the time TIME loads.
 *
 * These live on built-in prototypes rather than on the sandbox, so they are installed globally
 * rather than per-target. Kept apart from the rest of the fixture so neither grows unwieldy.
 */
function installPrototypeExtensions()
{
  // rmmz_core.js defines this and TIME's tone pipeline leans on it when copying a computed tone onto
  // the clock. the fixture ships tone changes disabled, so nothing reached that call until
  // tone-enabled tests arrived- without this the tone path dies on `tone.clone is not a function`.
  // mirrors the engine implementation, including the non-enumerable flag that keeps the method from
  // turning up in for-in loops over arrays.
  if (typeof Array.prototype.clone !== 'function')
  {
    Array.prototype.clone = function()
    {
      return this.slice(0);
    };

    Object.defineProperty(Array.prototype, 'clone', { enumerable: false });
  }

  // J-Base hangs these off Date, and TIME's time-range checking leans on them when a range runs
  // overnight or past the top of an hour. copied from _base/_metadata/initialization.js verbatim,
  // including the asymmetry that addDays hands back a new date while addHours mutates in place-
  // faithfulness matters here, since that difference is itself the source of a bug TIME once had.
  if (typeof Date.prototype.addDays !== 'function')
  {
    Date.prototype.addDays = function(days)
    {
      const result = new Date(this.valueOf());
      result.setDate(result.getDate() + days);
      return result;
    };
  }

  if (typeof Date.prototype.addHours !== 'function')
  {
    Date.prototype.addHours = function(hours)
    {
      this.setTime(this.getTime() + (hours * 60 * 60 * 1000));
      return this;
    };
  }
}

/**
 * Installs the engine globals the tone and variable pipelines reach for.
 * @param {object} sandbox The target to install onto.
 */
function installTonePipelineGlobals(sandbox)
{
  // the tone pipeline hands its final result to the engine's screen tinting; tests only need to know
  // that it was asked, and with what.
  sandbox.$gameScreen = sandbox.$gameScreen || {
    startTint()
    {
    },

    // the tone the screen is heading toward, which is what tells the clock whether a tint on screen
    // is one of its own. a fresh screen is heading nowhere, which is neutral.
    _toneTarget: [ 0, 0, 0, 0 ],

    toneTarget()
    {
      return this._toneTarget;
    },
  };

  // tone changes consult the active map's notes for an opt-out tag.
  sandbox.$dataMap = sandbox.$dataMap || { meta: {} };

  // variable assignment writes the current time out to game variables when enabled.
  sandbox.$gameVariables = sandbox.$gameVariables || {
    setValue()
    {
    },
  };
}

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

  // assigned rather than defaulted: this fixture is declaring that the realm *is* J-TIME, and
  // J-TIME's own _pluginMetadata.js looks its plugin parameters up by this exact name. Deferring to
  // whatever was already there hands it another ship's name and its parameter lookup returns null.
  sandbox.__PLUGIN_NAME__ = 'J-TIME';
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

  installPrototypeExtensions();

  installTonePipelineGlobals(sandbox);

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
//endregion plugins/time/_component/fixtures/install-time-host-globals.js
