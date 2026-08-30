//region MotionTypeRegistry
import OscillatorMotionEffect from '../models/OscillatorMotionEffect.js';
import SpinMotionEffect from '../models/SpinMotionEffect.js';
import JitterMotionEffect from '../models/JitterMotionEffect.js';
import BounceMotionEffect from '../models/BounceMotionEffect.js';
import TransitionMotionEffect from '../models/TransitionMotionEffect.js';

/**
 * The roster of every motion an author can declare.
 *
 * The roster is data. A type is a name, the implementation that animates it, the parameters it
 * accepts in the order they are written, and what each of those parameters is when the author
 * leaves it out. Adding a tenth oscillator is a row in this table, not a new class, and that is
 * deliberate — the interesting variety in this plugin is in the roster, not in the code.
 *
 * Extensions register their own types through {@link #register} without touching this table, which
 * is how a combat extension adds a death collapse that core has no opinion about.
 */
class MotionTypeRegistry
{
  /**
   * Every registered motion type, keyed by its authored name.
   * @type {Map<string, Object>}
   */
  static #definitions = new Map();

  /**
   * Registers a motion type.
   * @param {string} motionType The name an author writes in a tag, ex: `breathe`.
   * @param {Object} definition The implementation, parameter names, defaults and phase span.
   */
  static register(motionType, definition)
  {
    MotionTypeRegistry.#definitions.set(motionType, definition);
  }

  /**
   * Determines whether a name refers to a motion anybody knows how to animate.
   * @param {string} motionType The name from a tag.
   * @returns {boolean}
   */
  static isRegistered(motionType)
  {
    return MotionTypeRegistry.#definitions.has(motionType);
  }

  /**
   * Gets the definition for a motion type.
   * @param {string} motionType The name from a tag.
   * @returns {Object} The definition.
   */
  static definitionFor(motionType)
  {
    return MotionTypeRegistry.#definitions.get(motionType);
  }

  /**
   * Every registered motion type name.
   * @returns {string[]}
   */
  static registeredTypes()
  {
    return Array.from(MotionTypeRegistry.#definitions.keys());
  }

  /**
   * How many parameters a motion type accepts, which is what a tag is validated against.
   * @param {string} motionType The name from a tag.
   * @returns {number}
   */
  static parameterCountFor(motionType)
  {
    const definition = MotionTypeRegistry.definitionFor(motionType);

    return definition.parameterNames.length;
  }

  /**
   * Builds the live effect for a declaration.
   * @param {MotionDeclaration} declaration The declaration asking for the motion.
   * @param {Object<string, any>} configuredDefaults The defaults from external configuration.
   * @returns {MotionEffect}
   */
  static buildEffect(declaration, configuredDefaults)
  {
    const motionType = declaration.type();
    const definition = MotionTypeRegistry.definitionFor(motionType);
    const authored = declaration.parameters();
    const wantsSync = MotionTypeRegistry.#wantsSync(authored);
    const positional = MotionTypeRegistry.#withoutSyncToken(authored);
    const resolved = MotionTypeRegistry.#resolveParameters(definition, positional, configuredDefaults);
    const phaseOffset = MotionTypeRegistry.#rollPhaseOffset(definition, resolved, wantsSync);

    return new definition.implementation(declaration, resolved, phaseOffset);
  }

  /**
   * Determines whether the author asked for this motion to run in step with its neighbours.
   * @param {Array<string|number>} authored The parameters as written.
   * @returns {boolean}
   */
  static #wantsSync(authored)
  {
    return authored.includes('sync');
  }

  /**
   * The authored parameters with the `sync` token removed.
   *
   * `sync` is a trailing flag rather than a positional parameter, so it has to come out before the
   * remaining values are matched up against parameter names by position.
   * @param {Array<string|number>} authored The parameters as written.
   * @returns {Array<string|number>}
   */
  static #withoutSyncToken(authored)
  {
    return authored.filter(parameter => parameter !== 'sync');
  }

  /**
   * Turns positional authored values into named parameters, filling the gaps.
   *
   * Precedence runs authored, then external config, then the registry's own defaults. That order
   * is what lets a designer retune the whole game in a config file while an individual event stays
   * exactly as it was authored.
   * @param {Object} definition The type definition.
   * @param {Array<string|number>} positional The authored values, sync token already removed.
   * @param {Object<string, any>} configuredDefaults The defaults from external configuration.
   * @returns {Object<string, any>}
   */
  static #resolveParameters(definition, positional, configuredDefaults)
  {
    const resolved = {};

    definition.parameterNames.forEach((parameterName, index) =>
    {
      const authoredValue = positional.at(index);
      const configuredValue = configuredDefaults[parameterName];
      const bakedValue = definition.defaults[parameterName];
      const chosen = MotionTypeRegistry.#firstDefined(authoredValue, configuredValue, bakedValue);

      resolved[parameterName] = MotionTypeRegistry.#coerceParameter(parameterName, chosen);
    }, this);

    return resolved;
  }

  /**
   * The first of three candidate values that was actually supplied.
   * @param {any} authoredValue What the author wrote, if anything.
   * @param {any} configuredValue What the config says, if anything.
   * @param {any} bakedValue What the registry falls back to.
   * @returns {any}
   */
  static #firstDefined(authoredValue, configuredValue, bakedValue)
  {
    if (authoredValue !== undefined) return authoredValue;

    if (configuredValue !== undefined) return configuredValue;

    return bakedValue;
  }

  /**
   * Converts an authored parameter into the form its effect expects.
   *
   * Only colours need this: they are written as `#rrggbb` because that is how a human describes a
   * colour, and consumed as component triplets because that is how a sprite does.
   * @param {string} parameterName The name of the parameter.
   * @param {any} value The chosen value.
   * @returns {any}
   */
  static #coerceParameter(parameterName, value)
  {
    if (parameterName !== 'color') return value;

    return MotionTypeRegistry.parseColor(value);
  }

  /**
   * Turns a `#rrggbb` colour into its `[r, g, b]` components.
   * @param {string} hexColor The authored colour.
   * @returns {number[]}
   */
  static parseColor(hexColor)
  {
    const digits = hexColor.replace('#', String.empty);
    const red = Number.parseInt(digits.substring(0, 2), 16);
    const green = Number.parseInt(digits.substring(2, 4), 16);
    const blue = Number.parseInt(digits.substring(4, 6), 16);

    return [ red, green, blue ];
  }

  /**
   * Picks where in its cycle a new effect starts.
   *
   * Two enemies with the same declaration must not animate in lockstep, so every cycling motion
   * begins somewhere random within its own period. Amplitude is deliberately not randomised: a
   * room where everything breathes by the same amount at different moments reads as alive, while a
   * room where each thing breathes by a different amount reads as a mistake.
   * @param {Object} definition The type definition.
   * @param {Object<string, any>} resolved The resolved parameters.
   * @param {boolean} wantsSync Whether the author asked for lockstep.
   * @returns {number}
   */
  static #rollPhaseOffset(definition, resolved, wantsSync)
  {
    // the author wants these in formation, so every one of them starts at the top of the cycle.
    if (wantsSync === true) return 0;

    const span = definition.phaseSpan(resolved);

    // this motion has no cycle to be offset within.
    if (span <= 0) return 0;

    return Math.randomInt(span);
  }
}

// the cycling motions: one sine wave, nine different places to point it.
MotionTypeRegistry.register('breathe', {
  implementation: OscillatorMotionEffect,
  parameterNames: [ 'amount', 'period' ],
  defaults: { amount: 0.05, period: 150 },
  phaseSpan: parameters => parameters.period,
});
MotionTypeRegistry.register('stretch', {
  implementation: OscillatorMotionEffect,
  parameterNames: [ 'amount', 'period' ],
  defaults: { amount: 0.05, period: 150 },
  phaseSpan: parameters => parameters.period,
});
MotionTypeRegistry.register('pulse', {
  implementation: OscillatorMotionEffect,
  parameterNames: [ 'amount', 'period' ],
  defaults: { amount: 0.05, period: 150 },
  phaseSpan: parameters => parameters.period,
});
MotionTypeRegistry.register('float', {
  implementation: OscillatorMotionEffect,
  parameterNames: [ 'distance', 'period' ],
  defaults: { distance: 12, period: 180 },
  phaseSpan: parameters => parameters.period,
});
MotionTypeRegistry.register('sway', {
  implementation: OscillatorMotionEffect,
  parameterNames: [ 'distance', 'period' ],
  defaults: { distance: 6, period: 200 },
  phaseSpan: parameters => parameters.period,
});
MotionTypeRegistry.register('swing', {
  implementation: OscillatorMotionEffect,
  parameterNames: [ 'angle', 'period' ],
  defaults: { angle: 8, period: 170 },
  phaseSpan: parameters => parameters.period,
});
MotionTypeRegistry.register('ghost', {
  implementation: OscillatorMotionEffect,
  parameterNames: [ 'min', 'max', 'period' ],
  defaults: { min: 0.25, max: 1.0, period: 240 },
  phaseSpan: parameters => parameters.period,
});
MotionTypeRegistry.register('throb', {
  implementation: OscillatorMotionEffect,
  parameterNames: [ 'red', 'green', 'blue', 'gray', 'period' ],
  defaults: { red: 0, green: 0, blue: 80, gray: 0, period: 120 },
  phaseSpan: parameters => parameters.period,
});
MotionTypeRegistry.register('flash', {
  implementation: OscillatorMotionEffect,
  parameterNames: [ 'color', 'period' ],
  defaults: { color: '#ffffff', period: 40 },
  phaseSpan: parameters => parameters.period,
});

// accumulating rotation.
MotionTypeRegistry.register('spin', {
  implementation: SpinMotionEffect,
  parameterNames: [ 'period', 'direction' ],
  defaults: { period: 120, direction: 'cw' },
  phaseSpan: parameters => parameters.period,
});

// discontinuous motions, which need no phase offset because randomness is already the point.
MotionTypeRegistry.register('shake', {
  implementation: JitterMotionEffect,
  parameterNames: [ 'strength', 'axis', 'interval' ],
  defaults: { strength: 4, axis: 'x', interval: 1 },
  phaseSpan: () => 0,
});
MotionTypeRegistry.register('flicker', {
  implementation: JitterMotionEffect,
  parameterNames: [ 'min', 'max', 'interval' ],
  defaults: { min: 0.6, max: 1.0, interval: 6 },
  phaseSpan: () => 0,
});

// an arc and a beat's rest.
MotionTypeRegistry.register('hop', {
  implementation: BounceMotionEffect,
  parameterNames: [ 'height', 'duration', 'rest' ],
  defaults: { height: 24, duration: 24, rest: 30 },
  phaseSpan: parameters => parameters.duration + parameters.rest,
});

// travel somewhere and stay there; no cycle, so no phase.
MotionTypeRegistry.register('scale', {
  implementation: TransitionMotionEffect,
  parameterNames: [ 'percent', 'duration' ],
  defaults: { percent: 150, duration: 30 },
  phaseSpan: () => 0,
});
MotionTypeRegistry.register('angle', {
  implementation: TransitionMotionEffect,
  parameterNames: [ 'degrees', 'duration' ],
  defaults: { degrees: 90, duration: 30 },
  phaseSpan: () => 0,
});
MotionTypeRegistry.register('fade', {
  implementation: TransitionMotionEffect,
  parameterNames: [ 'percent', 'duration' ],
  defaults: { percent: 50, duration: 30 },
  phaseSpan: () => 0,
});
MotionTypeRegistry.register('hue', {
  implementation: TransitionMotionEffect,
  parameterNames: [ 'degrees', 'duration' ],
  defaults: { degrees: 180, duration: 30 },
  phaseSpan: () => 0,
});
MotionTypeRegistry.register('tint', {
  implementation: TransitionMotionEffect,
  parameterNames: [ 'color', 'duration' ],
  defaults: { color: '#ffa0a0', duration: 30 },
  phaseSpan: () => 0,
});

export default MotionTypeRegistry;
//endregion MotionTypeRegistry