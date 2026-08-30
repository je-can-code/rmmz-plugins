//region plugins/hud/_component/fixtures/install-hud-host-globals.js
import { installJBaseHostGlobals } from '../../../_base/core/_component/fixtures/install-j-base-host-globals.js';
import PluginMetadata from '../../../../../src/plugins/_base/core/models/PluginMetadata.js';

/**
 * Production-shaped defaults for J-HUD-TargetFrame, so metadata assertions exercise realistic values
 * instead of `PluginManager.parameters()`'s empty-object default.
 *
 * These were transcribed from a real RPG Maker plugin manifest. There is no manifest in this repo to
 * check them against anymore, so treat them as a fixture in their own right: change one only because
 * a test needs a different value, never in the belief that it is being resynced with somewhere else.
 */
export const DEFAULT_HUD_TARGET_PLUGIN_PARAMS = {
  targetFrameX: '400',
  targetFrameY: '0',
  targetFrameWidth: '320',
  targetFrameHeight: '252',
  backgroundImageFilename: 'img/hud/target-gauge-background',
  backgroundGaugeImageX: '0',
  backgroundGaugeImageY: '0',
  middlegroundGaugeImageX: '2',
  middlegroundGaugeImageY: '2',
  foregroundImageFilename: 'img/hud/target-gauge-foreground',
  foregroundGaugeImageX: '2',
  foregroundGaugeImageY: '3',
  enableHp: 'true',
  hpGaugeScaleX: '2.00',
  hpGaugeScaleY: '1.00',
  hpGaugeRotation: '0',
  enableMp: 'true',
  mpGaugeScaleX: '1.00',
  mpGaugeScaleY: '0.50',
  mpGaugeRotation: '0',
  enableTp: 'true',
  tpGaugeScaleX: '0.30',
  tpGaugeScaleY: '0.40',
  tpGaugeRotation: '270',
};

/**
 * J-HUD-FOOD ships with no explicit plugin parameters configured- every field falls back to its
 * own default, which is what an empty object models here.
 */
export const DEFAULT_HUD_FOOD_PLUGIN_PARAMS = {};

/**
 * J-HUD-InputFrame ships with no explicit plugin parameters configured- every field falls back to
 * its own default, which is what an empty object models here.
 */
export const DEFAULT_HUD_INPUT_PLUGIN_PARAMS = {};

/**
 * J-HUD-PartyFrame has no metadata-parsed plugin parameters at all- the whole file exists to
 * satisfy the direct-import shape.
 */
export const DEFAULT_HUD_PARTY_PLUGIN_PARAMS = {};

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
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-HUD's own identity.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJHud(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-HUD';
  sandbox.__PLUGIN_VERSION__ = '2.0.0';
}

/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-HUD-TargetFrame's own identity.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJHudTarget(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-HUD-TargetFrame';
  sandbox.__PLUGIN_VERSION__ = '1.0.1';
}

/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-HUD-FOOD's own identity.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJHudFood(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-HUD-FOOD';
  sandbox.__PLUGIN_VERSION__ = '1.0.0';
}

/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-HUD-InputFrame's own identity.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJHudInput(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-HUD-InputFrame';
  sandbox.__PLUGIN_VERSION__ = '1.2.0';
}

/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-HUD-PartyFrame's own identity.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJHudParty(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-HUD-PartyFrame';
  sandbox.__PLUGIN_VERSION__ = '1.2.0';
}

/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-HUD-BossFrame's own identity.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJHudBoss(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-HUD-BossFrame';
  sandbox.__PLUGIN_VERSION__ = '1.0.1';
}

/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-HUD-QuestFrame's own identity.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJHudQuest(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-HUD-QuestFrame';
  sandbox.__PLUGIN_VERSION__ = '1.0.0';
}

/**
 * Layers each hud extension's plugin parameters on top of whatever `PluginManager.parameters()`
 * stub is already installed (typically J-Base's, from {@link installJBaseHostGlobals}).
 * @param {object} sandbox
 * @param {object} [options]
 * @param {Record<string, string>} [options.target]
 * @param {Record<string, string>} [options.food]
 * @param {Record<string, string>} [options.input]
 * @param {Record<string, string>} [options.party]
 */
export function installHudFamilyPluginManager(sandbox, options = {})
{
  const {
    target = DEFAULT_HUD_TARGET_PLUGIN_PARAMS,
    food = DEFAULT_HUD_FOOD_PLUGIN_PARAMS,
    input = DEFAULT_HUD_INPUT_PLUGIN_PARAMS,
    party = DEFAULT_HUD_PARTY_PLUGIN_PARAMS,
  } = options;

  const prevPm = sandbox.PluginManager;

  sandbox.PluginManager = {
    parameters(name)
    {
      if (name === 'J-HUD-TargetFrame')
      {
        return target;
      }

      if (name === 'J-HUD-FOOD')
      {
        return food;
      }

      if (name === 'J-HUD-InputFrame')
      {
        return input;
      }

      if (name === 'J-HUD-PartyFrame')
      {
        return party;
      }

      return prevPm.parameters(name);
    },
    registerCommand()
    {
    },
  };
}

/**
 * Globals required for J-HUD core and its `target` extension to evaluate when direct-imported
 * into the real Vitest realm instead of a nested vm context.
 * @param {object} [sandbox] Defaults to `globalThis` so direct-import tests can call this with no target arg.
 */
export function installHudHostGlobals(sandbox = globalThis)
{
  if (sandbox.__hudHostGlobalsInstalled === true)
  {
    return;
  }

  sandbox.__hudHostGlobalsInstalled = true;

  installJBaseHostGlobals(sandbox);
  installHudFamilyPluginManager(sandbox);

  // hud core and target ext's own _pluginMetadata.js subclass this real J-Base class as a bare
  // global (no import), same as every other plugin family's _pluginMetadata.js.
  sandbox.PluginMetadata ??= PluginMetadata;

  // J-HUD core's version check only needs J.ABS.Metadata.version.version() to exist and satisfy
  // its minimum- the real J-ABS plugin is not under test here, so a bare stub is sufficient.
  sandbox.J ||= {};
  sandbox.J.ABS = {
    Metadata: {
      version: {
        version: () => '99.0.0',
      },
    },
  };
}
//endregion plugins/hud/_component/fixtures/install-hud-host-globals.js
