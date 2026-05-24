//region engine-stubs
import { installPluginManagerWithParams } from '../../../setup/install-plugin-manager-with-params.js';

const noop = function()
{
};

/**
 * Minimal globals so {@link out/escribe/J-Escriptions.js} can evaluate after {@link out/J-Base.js}.
 *
 * @param {object} sandbox VM global object (after {@link installJBaseHostGlobals}).
 */
export function installEscribeEngineStubs(sandbox)
{
  installPluginManagerWithParams(sandbox, 'J-Escriptions', {});

  sandbox.J = sandbox.J || {};
  sandbox.J.ABS = null;

  if (typeof sandbox.Game_Event !== 'function')
  {
    function Game_Event()
    {
      this._pageIndex = 0;
    }

    Game_Event.prototype = {};
    Game_Event.prototype.constructor = Game_Event;
    sandbox.Game_Event = Game_Event;
  }

  sandbox.Game_Event.prototype.initMembers = noop;
  sandbox.Game_Event.prototype.setupPage = noop;
  sandbox.Game_Event.prototype.update = noop;
  sandbox.Game_Event.prototype.eventId = function()
  {
    return 1;
  };
  sandbox.Game_Event.prototype.isJabsAction = function()
  {
    return false;
  };
  sandbox.Game_Event.prototype.isJabsLoot = function()
  {
    return false;
  };
  sandbox.Game_Event.prototype.getValidCommentCommands = function()
  {
    return [];
  };

  sandbox.Game_Event.prototype.extractValueByRegex = function(regex, defaultValue)
  {
    const commands = this.getValidCommentCommands();
    for (const command of commands)
    {
      const [ comment, ] = command.parameters;
      regex.lastIndex = 0;
      const match = regex.exec(comment);
      if (!match) continue;

      const value = match[1];
      if (typeof defaultValue === 'number')
      {
        return Number(value);
      }

      return value;
    }

    return defaultValue;
  };

  if (typeof sandbox.Sprite_Character !== 'function')
  {
    function Sprite_Character()
    {
    }

    Sprite_Character.prototype = {};
    Sprite_Character.prototype.constructor = Sprite_Character;
    sandbox.Sprite_Character = Sprite_Character;
  }

  sandbox.Sprite_Character.prototype.initMembers = noop;
  sandbox.Sprite_Character.prototype.isEmptyCharacter = function()
  {
    return false;
  };
  sandbox.Sprite_Character.prototype.setCharacterBitmap = noop;
  sandbox.Sprite_Character.prototype.update = noop;
}
//endregion engine-stubs
