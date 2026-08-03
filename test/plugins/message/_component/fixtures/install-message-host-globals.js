//region plugins/message/_component/fixtures/install-message-host-globals.js
import { installJBaseHostGlobals } from '../../../_base/core/_component/fixtures/install-j-base-host-globals.js';
import { installPluginManagerWithParams } from '../../../../setup/install-plugin-manager-with-params.js';
import PluginMetadata from '../../../../../src/plugins/_base/core/models/PluginMetadata.js';

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
  sandbox.__PLUGIN_VERSION__ = '3.2.0';
}

/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-MessageTextCodes's own identity.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJMessage(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-MessageTextCodes';
  sandbox.__PLUGIN_VERSION__ = '1.0.0';
}

/**
 * Globals required for J-MessageTextCodes's Game_Event/Game_Message/Window_Base.js to evaluate when
 * direct-imported into the real Vitest realm instead of a nested vm context.
 * @param {object} [sandbox] Defaults to `globalThis` so direct-import tests can call this with no target arg.
 */
export function installMessageHostGlobals(sandbox = globalThis)
{
  if (sandbox.__messageHostGlobalsInstalled === true)
  {
    return;
  }

  sandbox.__messageHostGlobalsInstalled = true;

  installJBaseHostGlobals(sandbox);

  // message's own _pluginMetadata.js subclasses this real J-Base class as a bare global (no import).
  sandbox.PluginMetadata ??= PluginMetadata;

  installPluginManagerWithParams(sandbox, 'J-MessageTextCodes', {});

  // Array.prototype.clone is a J-Base/vanilla RMMZ polyfill; Game_Message.js's backup/restore
  // choices rely on it.
  if (typeof Array.prototype.clone !== 'function')
  {
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
    element: () => 10,
    equipType: () => 11,
    weaponType: () => 12,
    armorType: () => 13,
    skillType: () => 14,
  };

  sandbox.ColorManager.elementColorIndex = () => 20;
  sandbox.ColorManager.equipType = () => 21;
  sandbox.ColorManager.weaponType = () => 22;
  sandbox.ColorManager.armorType = () => 23;
  sandbox.ColorManager.skillType = () => 24;

  sandbox.TextManager.element = id => sandbox.$dataSystem.elements[id] || '';
  sandbox.TextManager.equipType = id => sandbox.$dataSystem.equipTypes[id] || '';
  sandbox.TextManager.weaponType = id => sandbox.$dataSystem.weaponTypes[id] || '';
  sandbox.TextManager.armorType = id => sandbox.$dataSystem.armorTypes[id] || '';
  sandbox.TextManager.skillType = id => sandbox.$dataSystem.skillTypes[id] || '';

  // Window_Base.js's convertEscapeCharacters alias captures whatever's here as "original" before
  // overwriting it with the database-text-code-aware version.
  sandbox.Window_Base.prototype.convertEscapeCharacters = function(text)
  {
    return text;
  };
  sandbox.Window_Base.prototype.contents = {
    fontItalic: false,
    fontBold: false,
    fontSize: 28,
  };

  // Game_Message is not one of installJBaseHostGlobals's placeholder classes.
  function Game_Message()
  {
  }

  Game_Message.prototype.clear = noop;
  Game_Message.prototype._choices = [];
  sandbox.Game_Message = Game_Message;

  sandbox.$gameMessage = new sandbox.Game_Message();
  sandbox.$gameMessage.clear();

  sandbox.$gameParty = {
    leader: () => null,
  };

  sandbox.$gameSwitches = {
    value: () => false,
  };
}
//endregion plugins/message/_component/fixtures/install-message-host-globals.js
