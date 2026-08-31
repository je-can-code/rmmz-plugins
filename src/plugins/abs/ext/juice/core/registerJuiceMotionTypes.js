//region registerJuiceMotionTypes
import JuiceSquishMotionEffect from '../models/JuiceSquishMotionEffect.js';
import JuiceTiltMotionEffect from '../models/JuiceTiltMotionEffect.js';
import JuiceFlipBodyMotionEffect from '../models/JuiceFlipBodyMotionEffect.js';
import JuiceCastingPulseMotionEffect from '../models/JuiceCastingPulseMotionEffect.js';

/**
 * Teaches J-Motion the four shapes a battler makes when it does something.
 *
 * These are registered rather than kept private because the registry is the only way into the
 * composer, and going through it has a second benefit worth having: a combat reaction becomes
 * something an event page or a state can ask for by name, so the squish a sword makes is available
 * to a cutscene without a line of code being written for it.
 *
 * None of them take a phase offset. Every other motion in the ecosystem starts somewhere random in
 * its cycle so that a room full of them does not animate in lockstep, but a reaction happens because
 * something just happened — starting one halfway through would drop the frame the player is watching
 * for.
 *
 * The defaults here are the fallback for a hand-authored tag. Combat passes every parameter
 * explicitly, resolved from this plugin's own metadata and the skill's notetags, so nothing on this
 * page affects what a weapon does.
 */
MotionTypeRegistry.register('squish', {
  implementation: JuiceSquishMotionEffect,
  parameterNames: [ 'intensity', 'duration', 'repeats' ],
  defaults: {
    intensity: 0.12,
    duration: 12,
    repeats: 1,
  },
  phaseSpan: () => 0,
});

MotionTypeRegistry.register('tilt', {
  implementation: JuiceTiltMotionEffect,
  parameterNames: [ 'peak', 'duration' ],
  defaults: {
    peak: 0.35,
    duration: 12,
  },
  phaseSpan: () => 0,
});

MotionTypeRegistry.register('flip', {
  implementation: JuiceFlipBodyMotionEffect,
  parameterNames: [ 'turns', 'duration', 'direction' ],
  defaults: {
    turns: 1,
    duration: 24,
    direction: 'cw',
  },
  phaseSpan: () => 0,
});

MotionTypeRegistry.register('charge', {
  implementation: JuiceCastingPulseMotionEffect,
  parameterNames: [ 'amplitude' ],
  defaults: { amplitude: 0.04 },
  phaseSpan: () => 0,
});
//endregion registerJuiceMotionTypes