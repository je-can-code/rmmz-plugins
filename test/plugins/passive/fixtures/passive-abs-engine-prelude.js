//region passive-abs-engine-prelude
// Minimal engine surface so {@link out/passive/ext/J-Passive-ABS.js} can evaluate in the test VM
// without loading the full J-ABS bundle (Sprite_Character#getBattlerName, JABS_AiManager shell).
(function()
{
  // J-ABS normally owns these globals; the test VM loads J-Passive-ABS without the full ABS bundle.
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

  if (typeof Sprite_Character.prototype.getBattlerName !== 'function')
  {
    Sprite_Character.prototype.getBattlerName = function()
    {
      return new JABS_BattlerName();
    };
  }

  if (typeof Scene_Boot.prototype.onDatabaseLoaded !== 'function')
  {
    Scene_Boot.prototype.onDatabaseLoaded = function()
    {
    };
  }
})();
//endregion passive-abs-engine-prelude