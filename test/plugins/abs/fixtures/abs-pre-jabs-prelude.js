//region abs-pre-jabs-prelude
/**
 * Seeds {@link J.ABS} namespace slices before {@link out/abs/J-ABS.js} evaluates.
 * The shipped bundle hoists some static fields ahead of `initialization.js`; without
 * this prelude, VM tests throw while class bodies initialize.
 */
(function()
{
  globalThis.J ||= {};
  J.ABS = J.ABS || {};

  J.ABS.Directions = {
    UP: 8,
    RIGHT: 6,
    LEFT: 4,
    DOWN: 2,
    LOWERLEFT: 1,
    LOWERRIGHT: 3,
    UPPERLEFT: 7,
    UPPERRIGHT: 9,
  };

  J.ABS.Shapes = {
    Circle: 'circle',
    Rhombus: 'rhombus',
    Square: 'square',
    Line: 'line',
    Arc: 'arc',
  };

  J.ABS.Metadata = {
    MaxAiUpdateRange: 20,
    DefaultStateSpreadTickInterval: 30,
    HitboxPulse: {
      enabled: false,
      maxConcurrentPulses: 8,
    },
    EnableGlobalCooldown: false,
    GlobalCooldownFrames: 0,
    GlobalCooldownSkillTypeSet: new Set(),
  };

  if (typeof PIXI !== 'undefined')
  {
    PIXI.BLEND_MODES = PIXI.BLEND_MODES || { ADD: 0 };
  }
})();
//endregion abs-pre-jabs-prelude
