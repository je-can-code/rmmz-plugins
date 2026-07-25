//region plugins/popups/_component/fixtures/install-popups-host-globals.js
import { installJBaseHostGlobals } from '../../../_base/_component/fixtures/install-j-base-host-globals.js';
import { installPluginManagerWithParams } from '../../../../setup/install-plugin-manager-with-params.js';
import PluginMetadata from '../../../../../src/plugins/_base/models/PluginMetadata.js';

const noop = function()
{
};

/**
 * `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` are bare identifiers read once, at import time, by both
 * _base/_metadata/initialization.js and popups/core/_metadata/initialization.js.
 * Call this right before importing J-Base's initialization.js.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJBase(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-Base';
  sandbox.__PLUGIN_VERSION__ = '3.2.0';
}

/**
 * Flips the bare `__PLUGIN_NAME__`/`__PLUGIN_VERSION__` globals to J-Popups's own identity. Call
 * this right before importing popups/core/_metadata/initialization.js.
 * @param {object} [sandbox] Defaults to `globalThis`.
 */
export function setPluginContextToJPopups(sandbox = globalThis)
{
  sandbox.__PLUGIN_NAME__ = 'J-Popups';
  sandbox.__PLUGIN_VERSION__ = '2.1.0';
}

/**
 * Globals required for J-Popups's prototype-patch source files to evaluate when direct-imported
 * into the real Vitest realm instead of a nested vm context.
 * @param {object} [sandbox] Defaults to `globalThis` so direct-import tests can call this with no target arg.
 */
export function installPopupsHostGlobals(sandbox = globalThis)
{
  if (sandbox.__popupsHostGlobalsInstalled === true)
  {
    return;
  }

  sandbox.__popupsHostGlobalsInstalled = true;

  installJBaseHostGlobals(sandbox);

  sandbox.PluginMetadata ??= PluginMetadata;

  installPluginManagerWithParams(sandbox, 'J-Popups', {});

  sandbox.J = sandbox.J || {};
  sandbox.J.ABS = sandbox.J.ABS || {
    Metadata: {
      DisableTextPops: false,
    },
  };

  function Game_Character()
  {
  }

  Game_Character.prototype.initMembers = noop;
  sandbox.Game_Character = Game_Character;

  sandbox.ImageManager = {
    iconWidth: 32,
    iconHeight: 32,
    loadSystem()
    {
      return {
        blt(_source, _sx, _sy, _pw, _ph, _dx, _dy)
        {
        },
      };
    },
  };

  function Sprite_Damage()
  {
    this.initialize();
  }

  Sprite_Damage.prototype = {};
  Sprite_Damage.prototype.constructor = Sprite_Damage;

  Sprite_Damage.prototype.initialize = function()
  {
    this._duration = 0;
    this._flashColor = [ 0, 0, 0, 0 ];
    this._j = { _popups: {} };
    // real PIXI.Container maintains this array; vanilla Sprite_Damage's createChildSprite()
    // calls this.addChild(sprite) to register each digit/icon sprite into it, and
    // repositionChildren() (from the real popups Sprite_Damage.js) reads it back via .find().
    this.children = [];
  };

  Sprite_Damage.prototype.fontSize = function()
  {
    return 20;
  };

  Sprite_Damage.prototype.addChild = function(child)
  {
    this.children.push(child);
    return child;
  };

  Sprite_Damage.prototype.createChildSprite = function()
  {
    const sprite = {
      x: 0,
      y: 0,
      dy: 0,
      ry: 0,
      zt: 0,
      yf: 0,
      yf2: 0,
      yf3: 0,
      ex: false,
      bounceMaxX: 0,
      anchor: { x: 0, y: 0 },
      scale: { x: 1, y: 1 },
      bitmap: {
        blt(_bitmap, _sx, _sy, _pw, _ph, _dx, _dy)
        {
        },
        drawText(_text, _x, _y, _w, _h, _align)
        {
        },
        measureTextWidth(_text)
        {
          return 0;
        },
        width: 0,
        fontBold: false,
        fontItalic: false,
        fontSize: 20,
      },
      setBlendColor: noop,
    };

    // vanilla Sprite_Damage.createChildSprite() registers the new sprite as a child via addChild().
    this.addChild(sprite);

    return sprite;
  };

  sandbox.Sprite_Damage = Sprite_Damage;

  function Spriteset_Map()
  {
  }

  Spriteset_Map.prototype.update = noop;
  sandbox.Spriteset_Map = Spriteset_Map;

  function Sprite_Character()
  {
  }

  Sprite_Character.prototype.updateDamagePopup = noop;
  sandbox.Sprite_Character = Sprite_Character;
}
//endregion plugins/popups/_component/fixtures/install-popups-host-globals.js
