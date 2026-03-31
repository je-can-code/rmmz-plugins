//region engine-stubs
import { installPluginManagerWithParams } from '../../../setup/install-plugin-manager-with-params.js';

const noop = function()
{
};

/**
 * Minimal globals so {@link out/J-MessageTextCodes.js} can evaluate after {@link out/J-Base.js}.
 *
 * @param {object} sandbox VM global object (after {@link installJBaseHostGlobals}).
 */
export function installMessageEngineStubs(sandbox)
{
  installPluginManagerWithParams(sandbox, 'J-MessageTextCodes', {});

  if (typeof Array.prototype.clone !== 'function')
  {
    // match RMMZ behavior: clone returns a shallow copy.
    // eslint-disable-next-line no-extend-native
    Array.prototype.clone = function()
    {
      return this.slice();
    };
  }

  sandbox.$dataWeapons = [ null ];
  sandbox.$dataArmors = [ null ];
  sandbox.$dataItems = [ null ];
  sandbox.$dataStates = [ null ];
  sandbox.$dataSkills = [ null ];
  sandbox.$dataEnemies = [ null ];
  sandbox.$dataSystem = sandbox.$dataSystem || {};
  sandbox.$dataSystem.elements = [ null, 'Fire' ];
  sandbox.$dataSystem.equipTypes = [ null, 'Weapon' ];
  sandbox.$dataSystem.weaponTypes = [ null, 'Sword' ];
  sandbox.$dataSystem.armorTypes = [ null, 'Light' ];
  sandbox.$dataSystem.skillTypes = [ null, 'Magic' ];

  sandbox.IconManager = {
    element()
    {
      return 10;
    },
    equipType()
    {
      return 11;
    },
    weaponType()
    {
      return 12;
    },
    armorType()
    {
      return 13;
    },
    skillType()
    {
      return 14;
    },
  };

  sandbox.ColorManager.elementColorIndex = function()
  {
    return 20;
  };
  sandbox.ColorManager.equipType = function()
  {
    return 21;
  };
  sandbox.ColorManager.weaponType = function()
  {
    return 22;
  };
  sandbox.ColorManager.armorType = function()
  {
    return 23;
  };
  sandbox.ColorManager.skillType = function()
  {
    return 24;
  };

  sandbox.TextManager.element = function(id)
  {
    return sandbox.$dataSystem.elements[id] || '';
  };
  sandbox.TextManager.equipType = function(id)
  {
    return sandbox.$dataSystem.equipTypes[id] || '';
  };
  sandbox.TextManager.weaponType = function(id)
  {
    return sandbox.$dataSystem.weaponTypes[id] || '';
  };
  sandbox.TextManager.armorType = function(id)
  {
    return sandbox.$dataSystem.armorTypes[id] || '';
  };
  sandbox.TextManager.skillType = function(id)
  {
    return sandbox.$dataSystem.skillTypes[id] || '';
  };

  sandbox.Window_Base.prototype.convertEscapeCharacters = function(text)
  {
    return text;
  };
  sandbox.Window_Base.prototype.obtainEscapeCode = function()
  {
    return '';
  };
  sandbox.Window_Base.prototype.processEscapeCharacter = noop;
  sandbox.Window_Base.prototype.contents = {
    fontItalic: false,
    fontBold: false,
    fontSize: 28,
  };

  if (typeof sandbox.Game_Message !== 'function')
  {
    function Game_Message()
    {
    }

    Game_Message.prototype = {};
    Game_Message.prototype.constructor = Game_Message;
    sandbox.Game_Message = Game_Message;
  }

  if (typeof sandbox.Window_ChoiceList !== 'function')
  {
    function Window_ChoiceList()
    {
    }

    Window_ChoiceList.prototype = {};
    Window_ChoiceList.prototype.constructor = Window_ChoiceList;
    sandbox.Window_ChoiceList = Window_ChoiceList;
  }

  if (typeof sandbox.Game_Interpreter !== 'function')
  {
    function Game_Interpreter()
    {
    }

    Game_Interpreter.prototype = {};
    Game_Interpreter.prototype.constructor = Game_Interpreter;
    sandbox.Game_Interpreter = Game_Interpreter;
  }

  sandbox.Game_Message.prototype.clear = noop;
  sandbox.Game_Message.prototype._choices = [];

  sandbox.Window_ChoiceList.prototype.makeCommandList = noop;
  sandbox.Window_ChoiceList.prototype.updatePlacement = noop;
  sandbox.Window_ChoiceList.prototype.index = function()
  {
    return 0;
  };
  sandbox.Window_ChoiceList.prototype.close = noop;
  sandbox.Window_ChoiceList.prototype._messageWindow = { terminateMessage: noop };
  sandbox.Window_ChoiceList.prototype._list = [];

  sandbox.Game_Interpreter.prototype.setupChoices = noop;
  sandbox.Game_Interpreter.prototype.currentCommand = function()
  {
    return { indent: 0, code: 102 };
  };
  sandbox.Game_Interpreter.prototype.eventId = function()
  {
    return 1;
  };

  sandbox.$gameMessage = new sandbox.Game_Message();
  sandbox.$gameMessage.clear();

  sandbox.$gameParty = {
    leader()
    {
      return null;
    },
  };

  sandbox.$gameSwitches = {
    value()
    {
      return false;
    },
  };

  sandbox.$gameMap = {
    event()
    {
      return null;
    },
  };
}
//endregion engine-stubs
