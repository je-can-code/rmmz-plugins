//region registerCollapseMotionType
import CollapseMotionEffect from '../models/CollapseMotionEffect.js';

/**
 * Teaches J-Motion how to animate a death.
 *
 * The registry is additive by design, so an extension adds a motion the same way core declares one
 * and core never learns that this exists. Anything that can declare a motion can now declare a
 * collapse — a plugin command, a state, an event page — even though the only thing that routinely
 * does is a battler dying.
 *
 * There is no phase offset: a death happens when it happens, and starting one halfway through its
 * own animation would be nonsense.
 */
MotionTypeRegistry.register('collapse', {
  implementation: CollapseMotionEffect,
  parameterNames: [ 'style', 'duration' ],
  defaults: {
    style: CollapseMotionEffect.SWIFT,
    duration: 30,
  },
  phaseSpan: () => 0,
});
//endregion registerCollapseMotionType