//region plugins/__ca-mods/_component/fixtures/install-camods-host-globals.js
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
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-CA-Mods's own identity.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJCamods(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-CA-Mods';
  sandbox.__PLUGIN_VERSION__ = '1.0.0';
}

/**
 * Globals required for J-CA-Mods's JABS_Engine.js to evaluate when direct-imported into the real
 * Vitest realm instead of a nested vm context. J-CA-Mods only extends JABS_Engine/JABS_Battler
 * prototypes, so a lightweight standalone placeholder suffices- the real JABS plugin ("abs" family)
 * is never loaded here.
 * @param {object} [sandbox] Defaults to `globalThis` so direct-import tests can call this with no target arg.
 */
export function installCamodsHostGlobals(sandbox = globalThis)
{
  if (sandbox.__camodsHostGlobalsInstalled === true)
  {
    return;
  }

  sandbox.__camodsHostGlobalsInstalled = true;

  installJBaseHostGlobals(sandbox);

  // camods's own _pluginMetadata.js subclasses this real J-Base class as a bare global (no import).
  sandbox.PluginMetadata ??= PluginMetadata;

  installPluginManagerWithParams(sandbox, 'J-CA-Mods', {});

  sandbox.JABS_Button = {
    Tool: 'tool',
    Mainhand: 'mainhand',
    Offhand: 'offhand',
  };

  function JABS_Battler()
  {
  }

  JABS_Battler.prototype.getTargetFrameText = function()
  {
    return '';
  };
  sandbox.JABS_Battler = sandbox.JABS_Battler || JABS_Battler;

  function JABS_Engine()
  {
  }

  JABS_Engine.prototype.addLootDropToMap = function(targetX, targetY, item)
  {
    return { targetX, targetY, item };
  };
  JABS_Engine.prototype.handleDefeatedEnemy = noop;
  JABS_Engine.prototype.handleDefeatedPlayer = noop;
  JABS_Engine.prototype.postExecuteSkillEffects = noop;
  JABS_Engine.prototype.executeMapAction = noop;
  JABS_Engine.prototype.handlePartyCycleMemberChanges = noop;
  sandbox.JABS_Engine = sandbox.JABS_Engine || JABS_Engine;

  sandbox.Game_Actor.prototype.equipSlots = function()
  {
    return [];
  };
  sandbox.Game_Actor.prototype.basicFloorDamage = function()
  {
    return 0;
  };

  sandbox.Game_BattlerBase.prototype.recoverAll = noop;

  sandbox.Game_Map.prototype.setup = noop;

  sandbox.Game_Enemy.prototype.dropSources = function()
  {
    return [];
  };

  sandbox.Game_Party.prototype._actors = [];

  sandbox.$gameParty = sandbox.$gameParty || new sandbox.Game_Party();
}
//endregion plugins/__ca-mods/_component/fixtures/install-camods-host-globals.js
