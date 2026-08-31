//region plugins/motion/_component/fixtures/install-motion-component-globals.js
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
 * Points the bare build-time identifiers at J-Motion.
 * @param {Object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJMotion(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-Motion';
  sandbox.__PLUGIN_VERSION__ = '1.1.0';
}

/**
 * The motion defaults the stubbed config loader will hand back.
 * @type {Object<string, Object>}
 */
let configuredDefaults = {};

/**
 * Chooses what the stubbed external config appears to contain.
 *
 * The real loader reads a file off the game's disk, which a test has neither reason nor ability to
 * provide. Everything downstream of the load cares only about the shape it produces.
 * @param {Object<string, Object>} defaults The motion defaults the config should report.
 */
export function setMotionConfig(defaults)
{
  configuredDefaults = defaults;
}

/**
 * Installs everything J-Motion's own source expects a loaded game to already hold.
 * @param {Object} [sandbox] Defaults to `globalThis`.
 */
export function installMotionComponentGlobals(sandbox = globalThis)
{
  installJBaseHostGlobals(sandbox);

  // engine extensions to the built-in prototypes. the easing curves and the tone combiner both
  // lean on Number#clamp, which RMMZ adds and a bare realm does not have.
  Number.prototype.clamp ??= function(min, max)
  {
    return Math.min(Math.max(this, min), max);
  };
  Math.randomInt ??= max => Math.floor(max * Math.random());

  // motion's _pluginMetadata.js subclasses this as a bare global rather than importing it.
  sandbox.PluginMetadata ??= PluginMetadata;
  sandbox.JsonMapper ??= JsonMapper;

  installPluginManagerWithParams(sandbox, 'J-Motion', {});

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
    load: () => configuredDefaults,
  };

  installEngineCharacterStubs(sandbox);
}

/**
 * Installs the engine classes J-Motion augments.
 *
 * These are the real shapes rather than convenient ones: `Game_Event#setupPage` really is what the
 * engine calls on a page change, and `Sprite_Character#update` really does place the sprite before
 * anything else gets a turn. A fixture that flattened either would let the augments pass a test
 * they would fail in a running game.
 * @param {Object} sandbox The realm to install into.
 */
function installEngineCharacterStubs(sandbox)
{
  sandbox.Game_Event ??= function()
  {
  };
  sandbox.Game_Event.prototype.setupPage = function()
  {
    this.pageSetupRan = true;
  };
  // `getValidCommentCommands` is deliberately NOT stubbed. J-Base's real implementation is imported
  // over the top of this, so these tests exercise the actual comment pipeline- the 108/408 control
  // codes, the parsable-comment expression, all of it. A convenient stub here would have let a tag
  // pass a test that the shipped comment reader would have discarded.
  sandbox.Game_Event.prototype.page = function()
  {
    return { list: this.commentCommands ?? [] };
  };
  sandbox.Game_Event.prototype.list = function()
  {
    return this.commentCommands ?? [];
  };

  sandbox.Sprite_Character ??= function()
  {
  };
  sandbox.Sprite_Character.prototype.initMembers = function()
  {
    this.baseInitMembersRan = true;
  };
  sandbox.Sprite_Character.prototype.update = function()
  {
    // the engine assigns position and opacity every frame, which is the whole reason the motion
    // augment has to run after this rather than before it.
    this.x = this.enginePlacedX ?? 0;
    this.y = this.enginePlacedY ?? 0;
    this.opacity = this.enginePlacedOpacity ?? 255;
  };
  sandbox.Sprite_Character.prototype.character = function()
  {
    return this._character;
  };
  sandbox.Sprite_Character.prototype.setHue = function(hue)
  {
    this.appliedHue = hue;
  };
  sandbox.Sprite_Character.prototype.setColorTone = function(tone)
  {
    this.appliedTone = tone;
  };
  sandbox.Sprite_Character.prototype.setBlendColor = function(color)
  {
    this.appliedBlendColor = color;
  };
}
//endregion plugins/motion/_component/fixtures/install-motion-component-globals.js