//region passive-conditional-engine-prelude
// Minimal engine surface so {@link out/passive/ext/J-Passive-Conditional.js} can evaluate in the test VM.
(function()
{
  if (typeof globalThis.JABS_Timer !== 'function')
  {
    globalThis.JABS_Timer = function JABS_Timer(delay)
    {
      this._delay = delay;
      this._frames = 0;
    };

    globalThis.JABS_Timer.prototype.update = function()
    {
      this._frames++;
    };

    globalThis.JABS_Timer.prototype.isTimerComplete = function()
    {
      return this._frames >= this._delay;
    };

    globalThis.JABS_Timer.prototype.reset = function()
    {
      this._frames = 0;
    };
  }

  if (typeof globalThis.Graphics === 'undefined')
  {
    globalThis.Graphics = { frameCount: 0 };
  }

  if (typeof globalThis.JABS_Battler !== 'function')
  {
    function JABS_Battler()
    {
    }

    JABS_Battler.prototype.update = function()
    {
    };

    JABS_Battler.prototype.getBattler = function()
    {
      return null;
    };

    globalThis.JABS_Battler = JABS_Battler;
  }

  // conditional aliases updatePixelStepping — seed a noop when J-Pixelistics is not in the test prelude.
  if (typeof globalThis.Game_CharacterBase !== 'undefined'
    && typeof globalThis.Game_CharacterBase.prototype.updatePixelStepping !== 'function')
  {
    globalThis.Game_CharacterBase.prototype.updatePixelStepping = function()
    {
    };
  }
})();
//endregion passive-conditional-engine-prelude