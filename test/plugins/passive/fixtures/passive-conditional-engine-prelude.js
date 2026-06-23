//region passive-conditional-engine-prelude
// Minimal engine surface so {@link out/passive/ext/J-Passive-Conditional.js} can evaluate in the test VM.
(function()
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

  globalThis.Graphics = { frameCount: 0 };

  globalThis.JABS_Battler = function JABS_Battler()
  {
  };

  globalThis.JABS_Battler.prototype.update = function()
  {
  };

  globalThis.JABS_Battler.prototype.getBattler = function()
  {
    return null;
  };

  globalThis.JABS_Action = function JABS_Action()
  {
  };

  globalThis.JABS_Action.prototype.preCleanupHook = function()
  {
  };

  // conditional aliases updatePixelStepping — seed a noop when J-Pixelistics is not in the test prelude.
  globalThis.Game_CharacterBase.prototype.updatePixelStepping = function()
  {
  };
})();
//endregion passive-conditional-engine-prelude
