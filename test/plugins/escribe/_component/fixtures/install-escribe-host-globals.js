//region plugins/escribe/_component/fixtures/install-escribe-host-globals.js
import { installJBaseHostGlobals } from '../../../_base/_component/fixtures/install-j-base-host-globals.js';

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
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-Escriptions's own identity.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJEscribe(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-Escriptions';
  sandbox.__PLUGIN_VERSION__ = '1.0.0';
}

/**
 * Globals required for J-Escriptions's Game_Event.js to evaluate when direct-imported into the
 * real Vitest realm instead of a nested vm context.
 * @param {object} [sandbox] Defaults to `globalThis` so direct-import tests can call this with no target arg.
 */
export function installEscribeHostGlobals(sandbox = globalThis)
{
  if (sandbox.__escribeHostGlobalsInstalled === true)
  {
    return;
  }

  sandbox.__escribeHostGlobalsInstalled = true;

  // the placeholder Game_Event/Game_Character constructors from installJBaseHostGlobals cover the
  // inheritance chain; J-Escriptions itself only needs the engine surface its source code calls.
  installJBaseHostGlobals(sandbox);

  // _base/_metadata/initialization.js (which creates globalThis.J) hasn't necessarily run yet at
  // this point, so seed the namespace defensively before flagging J-ABS as absent.
  sandbox.J = sandbox.J || {};
  sandbox.J.ABS = null;

  sandbox.Game_Event.prototype.initMembers = function()
  {
  };

  sandbox.Game_Event.prototype.setupPage = function()
  {
  };

  sandbox.Game_Event.prototype.update = function()
  {
  };

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

  // real Game_Event#extractValueByRegex (vanilla engine) scans this event's comment commands for
  // the first regex match; escribe's parseEscription*Value() methods all delegate to this.
  sandbox.Game_Event.prototype.extractValueByRegex = function(regex, defaultValue)
  {
    const commands = this.getValidCommentCommands();

    for (const command of commands)
    {
      const [ comment ] = command.parameters;
      regex.lastIndex = 0;
      const match = regex.exec(comment);
      if (!match) continue;

      const [ , value ] = match;
      if (typeof defaultValue === 'number')
      {
        return Number(value);
      }

      return value;
    }

    return defaultValue;
  };
}
//endregion plugins/escribe/_component/fixtures/install-escribe-host-globals.js
