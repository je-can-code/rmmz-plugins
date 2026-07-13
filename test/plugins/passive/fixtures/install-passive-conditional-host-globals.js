//region install-passive-conditional-host-globals
import { installPluginManagerWithParams } from '../../../setup/install-plugin-manager-with-params.js';

/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-Passive-Conditional's own
 * identity. Call this right before importing passive/ext/conditional/_metadata/initialization.js.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJPassiveConditional(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-Passive-Conditional';
  sandbox.__PLUGIN_VERSION__ = '1.0.0';
}

/**
 * Minimal engine surface so J-Passive-Conditional's prototype-patch source files can evaluate when
 * direct-imported into the real Vitest realm instead of a nested vm context.
 * @param {object} [sandbox] Defaults to `globalThis`.
 * @param {Record<string, string>|null} [pluginParams]
 */
export function installPassiveConditionalHostGlobals(sandbox = globalThis, pluginParams = null)
{
  const params = pluginParams ?? {
    'reconcile-delay-frames': '15',
    'default-proximity-tiles': '5',
    'auto-execute-skill-max-depth': '1',
  };

  installPluginManagerWithParams(sandbox, 'J-Passive-Conditional', params);

  sandbox.JABS_Timer = function JABS_Timer(delay)
  {
    this._delay = delay;
    this._frames = 0;
  };
  sandbox.JABS_Timer.prototype.update = function()
  {
    this._frames++;
  };
  sandbox.JABS_Timer.prototype.isTimerComplete = function()
  {
    return this._frames >= this._delay;
  };
  sandbox.JABS_Timer.prototype.reset = function()
  {
    this._frames = 0;
  };

  sandbox.Graphics = sandbox.Graphics || { frameCount: 0 };

  sandbox.JABS_Battler = function JABS_Battler()
  {
  };
  sandbox.JABS_Battler.prototype.update = function()
  {
  };
  sandbox.JABS_Battler.prototype.getBattler = function()
  {
    return null;
  };

  sandbox.JABS_Action = function JABS_Action()
  {
  };
  sandbox.JABS_Action.prototype.preCleanupHook = function()
  {
  };

  sandbox.JABS_Engine = function JABS_Engine()
  {
  };
  sandbox.JABS_Engine.prototype.handleDefeatedEnemy = function()
  {
  };
  sandbox.JABS_Engine.prototype.checkKnockback = function()
  {
  };
  sandbox.JABS_Engine.prototype.postExecuteSkillEffects = function()
  {
  };

  sandbox.JABS_TeamRules = {
    isOpposed(teamA, teamB)
    {
      return teamA !== teamB;
    },
  };

  // conditional aliases updatePixelStepping- seed a noop when J-Pixelistics is not loaded.
  sandbox.Game_CharacterBase.prototype.updatePixelStepping = function()
  {
  };
}
//endregion install-passive-conditional-host-globals
