//region engine-stubs
import { installPluginManagerWithParams } from '../../../setup/install-plugin-manager-with-params.js';

const noop = function()
{
};

/**
 * Minimal globals so {@link out/J-TextPops.js} can evaluate after {@link out/J-Base.js}.
 *
 * @param {object} sandbox VM global object (after {@link installJBaseHostGlobals}).
 */
export function installPopupsEngineStubs(sandbox)
{
  installPluginManagerWithParams(sandbox, 'J-TextPops', {});

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
        // eslint-disable-next-line no-unused-vars
        blt(source, sx, sy, pw, ph, dx, dy)
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
  };

  Sprite_Damage.prototype.fontSize = function()
  {
    return 20;
  };

  Sprite_Damage.prototype.createChildSprite = function()
  {
    return {
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
        // eslint-disable-next-line no-unused-vars
        blt(bitmap, sx, sy, pw, ph, dx, dy)
        {
        },
        // eslint-disable-next-line no-unused-vars
        drawText(text, x, y, w, h, align)
        {
        },
        fontBold: false,
        fontItalic: false,
        fontSize: 20,
      },
      setBlendColor: noop,
    };
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
//endregion engine-stubs
