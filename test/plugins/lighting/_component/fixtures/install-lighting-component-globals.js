//region plugins/lighting/_component/fixtures/install-lighting-component-globals.js
import { installJBaseHostGlobals } from '../../../_base/core/_component/fixtures/install-j-base-host-globals.js';
import { installPluginManagerWithParams } from '../../../../setup/install-plugin-manager-with-params.js';
import PluginMetadata from '../../../../../src/plugins/_base/core/models/PluginMetadata.js';
import JsonMapper from '../../../../../src/plugins/_base/core/_utilities/JsonMapper.js';

/**
 * Points the bare build-time identifiers at J-Base, which reads them at import time.
 * @param {Object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJBase(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-Base';
  sandbox.__PLUGIN_VERSION__ = '3.5.0';
}

/**
 * Points the bare build-time identifiers at J-Lighting.
 * @param {Object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJLighting(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-Lighting';
  sandbox.__PLUGIN_VERSION__ = '1.0.0';
}

/**
 * Points the bare build-time identifiers at J-Lighting-Time.
 * @param {Object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJLightingTime(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-Lighting-Time';
  sandbox.__PLUGIN_VERSION__ = '1.0.0';
}

/**
 * Whatever the stubbed external config loader should appear to contain.
 * @type {Object}
 */
let configuredConfig = {};

/**
 * Chooses what the stubbed external config appears to hold.
 *
 * The real loader reads a file off the game's disk, which a test has neither reason nor ability to
 * provide. Everything downstream of the load cares only about the shape it produces.
 * @param {Object} config The configuration the loader should report.
 */
export function setLightingConfig(config)
{
  configuredConfig = config;
}

/**
 * The configuration J-Lighting ships with, so a test that does not care can say so.
 * @returns {Object}
 */
export function defaultLightingConfig()
{
  return {
    light: {
      radius: 5,
      color: '#FFFFFF',
      intensity: 0,
      effects: {
        flicker: { depth: 0.2, period: 40, chance: 0, variance: 0.18 },
        pulse: { depth: 0.45, period: 165, chance: 0, variance: 0.22 },
        glitch: { depth: 0.85, period: 55, chance: 0.28, variance: 0.12 },
      },
    },
    ambient: { color: '#000000' },
  };
}

/**
 * The day/night curve J-Lighting-Time ships with - the colours J-TIME always used, and no darkness
 * at all until somebody decides what night should be.
 * @returns {Object}
 */
export function defaultLightingTimeConfig()
{
  return {
    phases: {
      Moontide: { tone: [ -100, -100, -30, 100 ], darkness: 0 },
      Dawn: { tone: [ -30, -15, 15, 64 ], darkness: 0 },
      Morning: { tone: [ 0, 0, 0, 0 ], darkness: 0 },
      Afternoon: { tone: [ 10, 10, 10, 10 ], darkness: 0 },
      Evening: { tone: [ 0, -30, -30, -30 ], darkness: 0 },
      Night: { tone: [ -68, -68, 0, 68 ], darkness: 0 },
    },
    sequence: [ 'Moontide', 'Dawn', 'Morning', 'Afternoon', 'Evening', 'Night', 'Moontide' ],
  };
}

/**
 * Installs everything J-Lighting's own source expects a loaded game to already hold.
 * @param {Object} [sandbox] Defaults to `globalThis`.
 */
export function installLightingComponentGlobals(sandbox = globalThis)
{
  installJBaseHostGlobals(sandbox);

  // engine extensions the tag parser and the mask maths both lean on.
  Number.prototype.clamp ??= function(min, max)
  {
    return Math.min(Math.max(this, min), max);
  };
  Math.randomInt ??= max => Math.floor(max * Math.random());

  // the plugin metadata subclasses this as a bare global rather than importing it.
  sandbox.PluginMetadata ??= PluginMetadata;
  sandbox.JsonMapper ??= JsonMapper;

  installPluginManagerWithParams(sandbox, 'J-Lighting', {});

  // the external config loader, stubbed to hand back whatever a test decided it holds.
  sandbox.ExternalJsonConfigLoaderOptions = {
    Builder: () =>
    {
      const builder = {
        pluginName: () => builder,
        configName: () => builder,
        logSummary: () => builder,
        build: () => ({}),
      };

      return builder;
    },
  };
  sandbox.ExternalJsonConfigLoader = {
    load: () => configuredConfig,
  };

  sandbox.Graphics ??= { frameCount: 0 };

  installEngineStubs(sandbox);
}

/**
 * Installs the engine classes J-Lighting augments.
 *
 * These are the real shapes rather than convenient ones. `Game_Screen#startTint` really does write
 * a destination and a duration before anything else gets a turn, and `Game_Event#setupPage` really
 * is what the engine calls on a page change. A fixture that flattened either would let an augment
 * pass a test it would fail in a running game.
 * @param {Object} sandbox The realm to install into.
 */
function installEngineStubs(sandbox)
{
  sandbox.Game_Screen ??= function()
  {
  };
  sandbox.Game_Screen.prototype.startTint = function(tone, duration)
  {
    this._toneTarget = tone.slice();
    this._toneDuration = duration;
    this.engineTintRan = true;
  };
  sandbox.Game_Screen.prototype.tone = function()
  {
    return this._tone ?? [ 0, 0, 0, 0 ];
  };

  sandbox.Game_Event ??= function()
  {
  };
  sandbox.Game_Event.prototype.setupPage = function()
  {
    this.pageSetupRan = true;
  };
  // `getValidCommentCommands` is deliberately NOT stubbed. J-Base's real implementation is imported
  // over the top of this, so these tests exercise the actual comment pipeline - the 108/408 control
  // codes, the parsable-comment expression, all of it.
  sandbox.Game_Event.prototype.page = function()
  {
    return { list: this.commentCommands ?? [] };
  };
  sandbox.Game_Event.prototype.list = function()
  {
    return this.commentCommands ?? [];
  };
  sandbox.Game_Event.prototype.eventId = function()
  {
    return this._eventId ?? 1;
  };
  sandbox.Game_Event.prototype.screenX = function()
  {
    return 0;
  };
  sandbox.Game_Event.prototype.screenY = function()
  {
    return 0;
  };

  // the scene that arrives on a map. `onMapLoaded` deliberately does NOT set up the map's events:
  // the engine only does that on a real transfer, and reproducing that asymmetry is the whole point
  // - a fixture that helpfully called `setupPage` here would hide the exact bug this catches.
  sandbox.Scene_Map ??= function()
  {
  };
  sandbox.Scene_Map.prototype.onMapLoaded = function()
  {
    this.mapLoadRan = true;
  };

  sandbox.Game_Actor ??= function()
  {
  };
  sandbox.Game_Actor.prototype.onBattlerDataChange = function()
  {
    this.dataChangeRan = true;
  };

  sandbox.DataManager ??= {};
  sandbox.DataManager.createGameObjects ??= function()
  {
    this.gameObjectsCreated = true;
  };
}