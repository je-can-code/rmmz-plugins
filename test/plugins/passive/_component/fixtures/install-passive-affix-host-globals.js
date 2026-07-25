//region plugins/passive/_component/fixtures/install-passive-affix-host-globals.js
import { installPluginManagerWithParams } from '../../../../setup/install-plugin-manager-with-params.js';

/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-Passive-Affix's own identity.
 * Call this right before importing passive/ext/affix/_metadata/initialization.js.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJPassiveAffix(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-Passive-Affix';
  sandbox.__PLUGIN_VERSION__ = '1.0.0';
}

/**
 * Minimal engine surface so J-Passive-Affix's prototype-patch source files can evaluate when
 * direct-imported into the real Vitest realm instead of a nested vm context- without loading the
 * full J-ABS bundle (Sprite_Character#getBattlerName, JABS_AiManager shell, etc.).
 * @param {object} [sandbox] Defaults to `globalThis`.
 * @param {Record<string, string>|null} [pluginParams]
 */
export function installPassiveAffixHostGlobals(sandbox = globalThis, pluginParams = null)
{
  const params = pluginParams ?? {
    'default-prefix-chance': '33',
    'default-suffix-chance': '33',
  };

  installPluginManagerWithParams(sandbox, 'J-Passive-Affix', params);

  // real RMMZ engine method (rmmz_core.js)- Game_Event#getResolvedPassiveAffixPrefixChance relies on it.
  if (typeof sandbox.Number.prototype.clamp !== 'function')
  {
    sandbox.Number.prototype.clamp = function(min, max)
    {
      return Math.min(Math.max(this, min), max);
    };
  }

  // J-ABS normally owns these globals; direct-import tests exercise J-Passive-Affix without the
  // full ABS bundle.
  if (typeof sandbox.Sprite_Character !== 'function')
  {
    sandbox.Sprite_Character = function Sprite_Character()
    {
    };

    sandbox.Sprite_Character.prototype = {};
  }

  if (typeof sandbox.Scene_Boot !== 'function')
  {
    function Scene_Boot()
    {
    }

    Scene_Boot.prototype.onDatabaseLoaded = function()
    {
    };

    sandbox.Scene_Boot = Scene_Boot;
  }

  if (typeof sandbox.JABS_BattlerName !== 'function')
  {
    sandbox.JABS_BattlerName = function JABS_BattlerName()
    {
      this.name = String.empty;
      this.colorHex = '#ffffff';
    };
  }

  if (typeof sandbox.JABS_AiManager !== 'object' || sandbox.JABS_AiManager === null)
  {
    sandbox.JABS_AiManager = {};
  }

  if (typeof sandbox.JABS_AiManager.postConvertMutate !== 'function')
  {
    sandbox.JABS_AiManager.postConvertMutate = function()
    {
    };
  }

  if (typeof sandbox.JABS_Engine !== 'function')
  {
    function JABS_Engine()
    {
    }

    JABS_Engine.prototype.determineExperienceGained = function()
    {
      return 0;
    };

    JABS_Engine.prototype.determineGoldGained = function()
    {
      return 0;
    };

    JABS_Engine.prototype.determineSdpGained = function()
    {
      return 0;
    };

    JABS_Engine.prototype.determineApGained = function()
    {
      return 0;
    };

    sandbox.JABS_Engine = JABS_Engine;
  }

  if (typeof sandbox.JABS_Battler !== 'object' || sandbox.JABS_Battler === null)
  {
    sandbox.JABS_Battler = {};
  }

  if (typeof sandbox.JABS_Battler.prototype === 'undefined')
  {
    sandbox.JABS_Battler.prototype = {};
  }

  if (typeof sandbox.JABS_Battler.prototype.buildFramedTarget !== 'function')
  {
    sandbox.JABS_Battler.prototype.buildFramedTarget = function()
    {
      return {};
    };
  }

  if (typeof sandbox.Sprite_Character.prototype.getBattlerName !== 'function')
  {
    sandbox.Sprite_Character.prototype.getBattlerName = function()
    {
      return new sandbox.JABS_BattlerName();
    };
  }

  if (typeof sandbox.Scene_Boot.prototype.onDatabaseLoaded !== 'function')
  {
    sandbox.Scene_Boot.prototype.onDatabaseLoaded = function()
    {
    };
  }
}
//endregion plugins/passive/_component/fixtures/install-passive-affix-host-globals.js
