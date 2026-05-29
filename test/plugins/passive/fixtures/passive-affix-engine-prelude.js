//region passive-affix-engine-prelude
// Minimal engine surface so {@link out/passive/ext/J-Passive-Affix.js} can evaluate in the test VM
// without loading the full J-ABS bundle (Sprite_Character#getBattlerName, JABS_AiManager shell).
(function()
{
  // J-ABS normally owns these globals; the test VM loads J-Passive-Affix without the full ABS bundle.
  if (typeof globalThis.Sprite_Character !== 'function')
  {
    globalThis.Sprite_Character = function Sprite_Character()
    {
    };

    globalThis.Sprite_Character.prototype = {};
  }

  if (typeof globalThis.Scene_Boot !== 'function')
  {
    function Scene_Boot()
    {
    }

    Scene_Boot.prototype.onDatabaseLoaded = function()
    {
    };

    globalThis.Scene_Boot = Scene_Boot;
  }

  if (typeof globalThis.JABS_BattlerName !== 'function')
  {
    globalThis.JABS_BattlerName = function JABS_BattlerName()
    {
      this.name = String.empty;
      this.colorHex = '#ffffff';
    };
  }

  if (typeof globalThis.JABS_AiManager !== 'object' || globalThis.JABS_AiManager === null)
  {
    globalThis.JABS_AiManager = {};
  }

  if (typeof globalThis.JABS_Engine !== 'function')
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

    globalThis.JABS_Engine = JABS_Engine;
  }

  if (typeof globalThis.JABS_Battler !== 'object' || globalThis.JABS_Battler === null)
  {
    globalThis.JABS_Battler = {};
  }

  if (typeof globalThis.JABS_Battler.prototype === 'undefined')
  {
    globalThis.JABS_Battler.prototype = {};
  }

  if (typeof globalThis.JABS_Battler.prototype.buildFramedTarget !== 'function')
  {
    globalThis.JABS_Battler.prototype.buildFramedTarget = function()
    {
      return {};
    };
  }

  if (typeof globalThis.Sprite_Character.prototype.getBattlerName !== 'function')
  {
    globalThis.Sprite_Character.prototype.getBattlerName = function()
    {
      return new JABS_BattlerName();
    };
  }

  if (typeof globalThis.Scene_Boot.prototype.onDatabaseLoaded !== 'function')
  {
    globalThis.Scene_Boot.prototype.onDatabaseLoaded = function()
    {
    };
  }
})();
//endregion passive-affix-engine-prelude