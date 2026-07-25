//region plugins/time/_component/fixtures/engine-stubs.js
import { DEFAULT_TIME_PLUGIN_PARAMS } from './time-plugin-params.js';

const noop = function()
{
};

/**
 * Globals so {@link out/J-TIME.js} can evaluate after {@link out/J-Base.js}.
 * Skips window drawing paths in tests; see {@link test/plugins/time/*.test.js}.
 *
 * @param {object} sandbox
 */
export function installTimeEngineStubs(sandbox)
{
  const prevPm = sandbox.PluginManager;

  sandbox.PluginManager = {
    parameters(name)
    {
      if (name === 'J-TIME')
      {
        return DEFAULT_TIME_PLUGIN_PARAMS;
      }

      return prevPm.parameters(name);
    },
    registerCommand()
    {
    },
  };

  sandbox.Graphics.frameCount = 0;

  sandbox.$gameScreen = {
    startTint: noop,
  };

  sandbox.$dataMap = {
    meta: {},
  };

  sandbox.SceneManager = {
    push: noop,
    goto: noop,
    pop: noop,
    _scene: null,
  };

  [
    'Scene_Boot',
    'Scene_Splash',
    'Scene_File',
    'Scene_Save',
    'Scene_Load',
    'Scene_Title',
    'Scene_Gameover',
    'Scene_Map',
  ].forEach(name =>
  {
    if (sandbox[name] === undefined)
    {
      function Placeholder()
      {
      }

      Placeholder.prototype = {};
      sandbox[name] = Placeholder;
    }
  });

  sandbox.Scene_Base.prototype.update = sandbox.Scene_Base.prototype.update || noop;

  sandbox.Scene_Map.prototype.initialize = sandbox.Scene_Map.prototype.initialize || noop;
  sandbox.Scene_Map.prototype.createAllWindows = sandbox.Scene_Map.prototype.createAllWindows || noop;
  sandbox.Scene_Map.prototype.update = sandbox.Scene_Map.prototype.update || noop;
  sandbox.Scene_Map.prototype.onMapLoaded = sandbox.Scene_Map.prototype.onMapLoaded || noop;

  sandbox.Window_Base.prototype.convertEscapeCharacters = sandbox.Window_Base.prototype.convertEscapeCharacters
    || function(text)
    {
      return text;
    };

  function Game_Interpreter()
  {
  }

  Game_Interpreter.prototype.shouldHideChoiceBranch = function()
  {
    return false;
  };

  sandbox.Game_Interpreter = Game_Interpreter;

  if (typeof sandbox.Game_Event !== 'function')
  {
    function Game_Event()
    {
    }

    Game_Event.prototype = {};
    Game_Event.prototype.constructor = Game_Event;
    sandbox.Game_Event = Game_Event;
  }

  // minimal helpers used by TIME page/choice parsing.
  sandbox.Game_Event.getValidCommentCommandsFromPage = function(page)
  {
    const list = page && Array.isArray(page.list) ? page.list : [];
    return list.filter(cmd => cmd && (cmd.code === 108 || cmd.code === 408));
  };

  function JABS_StandardController()
  {
  }

  JABS_StandardController.prototype.update = noop;

  sandbox.JABS_StandardController = JABS_StandardController;

  sandbox.J = sandbox.J || {};
  sandbox.J.ABS = {
    EXT: {
      INPUT: {
        Symbols: {
          L3: 'l3',
        },
      },
    },
  };

  sandbox.Input = {
    isTriggered()
    {
      return false;
    },
  };

  sandbox.JABS_InputAdapter = {};

  sandbox.DataManager.createGameObjects = sandbox.DataManager.createGameObjects || noop;
  sandbox.DataManager.makeSaveContents = sandbox.DataManager.makeSaveContents || function()
  {
    return {};
  };
  sandbox.DataManager.extractSaveContents = sandbox.DataManager.extractSaveContents || noop;
}
//endregion plugins/time/_component/fixtures/engine-stubs.js
