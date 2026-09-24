//region registerFoldMotionTypes
import FoldMotionEffect from '../models/FoldMotionEffect.js';

/**
 * Teaches J-Motion how a battler arrives and leaves.
 *
 * Two types sharing one implementation, the same way J-Motion core's transitions share one: the
 * effect reads which of the two it was declared as. Like the collapse, anything that can declare a
 * motion can declare these, even though the only thing that routinely does is a battler's page
 * bringing it onto the map or taking it off again.
 *
 * There is no phase offset: an entrance or an exit happens when it happens, and starting one halfway
 * through would be nonsense.
 */
[ FoldMotionEffect.FOLD, FoldMotionEffect.UNFOLD ].forEach(motionType =>
{
  MotionTypeRegistry.register(motionType, {
    implementation: FoldMotionEffect,
    parameterNames: [ 'duration' ],
    defaults: {
      duration: 30,
    },
    phaseSpan: () => 0,
  });
});
//endregion registerFoldMotionTypes