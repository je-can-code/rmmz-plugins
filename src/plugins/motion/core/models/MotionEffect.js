//region MotionEffect
/**
 * One live motion, animating for as long as the declaration that asked for it exists.
 *
 * An effect owns nothing but its own animation state — the frame it is on, the phase it started
 * at, whether it has been asked to stop. It never touches a sprite, never reads another effect,
 * and never removes its own declaration. All of that belongs to the composer, which is why an
 * effect can be tested by handing it a composition and reading what it wrote.
 *
 * Subclasses implement {@link #applyTo}. Everything else has a working default.
 */
class MotionEffect
{
  /**
   * The declaration that asked for this motion.
   * @type {MotionDeclaration}
   */
  #declaration = null;

  /**
   * The resolved parameters, by name, after defaults were applied.
   * @type {Object<string, any>}
   */
  #parameters = {};

  /**
   * How many frames this effect has been running.
   * @type {number}
   */
  #elapsedFrames = 0;

  /**
   * Where in its cycle this effect started, so that identical motions do not animate in lockstep.
   * @type {number}
   */
  #phaseOffset = 0;

  /**
   * Whether the declaration behind this effect has gone away.
   * @type {boolean}
   */
  #removalRequested = false;

  /**
   * Constructor.
   * @param {MotionDeclaration} declaration The declaration that asked for this motion.
   * @param {Object<string, any>} parameters The resolved parameters, by name.
   * @param {number} phaseOffset Where in its cycle this effect starts.
   */
  constructor(declaration, parameters, phaseOffset)
  {
    this.#declaration = declaration;
    this.#parameters = parameters;
    this.#phaseOffset = phaseOffset;
  }

  /**
   * Gets the declaration that asked for this motion.
   * @returns {MotionDeclaration} The declaration.
   */
  declaration()
  {
    // hand back the declaration.
    return this.#declaration;
  }

  /**
   * Gets the resolved parameters.
   * @returns {Object<string, any>} The parameters.
   */
  parameters()
  {
    // hand back the resolved parameters.
    return this.#parameters;
  }

  /**
   * Gets how many frames this effect has been running.
   * @returns {number} The elapsedFrames.
   */
  elapsedFrames()
  {
    // hand back the elapsed frame count.
    return this.#elapsedFrames;
  }

  /**
   * Gets where in its cycle this effect started.
   * @returns {number} The phaseOffset.
   */
  phaseOffset()
  {
    // hand back the phase offset.
    return this.#phaseOffset;
  }

  /**
   * Gets whether this effect's declaration has been removed.
   * @returns {boolean} The removalRequested.
   */
  hasRemovalRequested()
  {
    // hand back whether removal was requested.
    return this.#removalRequested;
  }

  /**
   * Tells this effect that the declaration behind it is gone.
   *
   * Most effects stop immediately, but a transition holding a channel far from its identity needs
   * to travel back before it disappears, so the composer keeps ticking whatever is not yet
   * discardable rather than dropping effects the instant a declaration is removed.
   */
  requestRemoval()
  {
    this.#removalRequested = true;
  }

  /**
   * Takes back a removal request, because whatever withdrew this motion has asked for it again.
   *
   * A state that lapses and is immediately re-applied is the case this exists for. Rebuilding the
   * effect would be visibly wrong — the replacement starts from the channel's rest state, so the
   * character drops all the way back to normal and climbs again — while resuming the one already
   * running simply carries on to where it was going.
   */
  cancelRemoval()
  {
    this.#removalRequested = false;
  }

  /**
   * Advances this effect by one frame.
   */
  tick()
  {
    this.#elapsedFrames++;
  }

  /**
   * Determines whether the composer may forget about this effect.
   *
   * The default is "as soon as its declaration is gone", which is right for anything cycling
   * around the channel identity — the worst a cancelled breathe can do is drop a few percent of
   * scale, which nobody sees. Effects that park a channel somewhere visible override this.
   * @returns {boolean}
   */
  isDiscardable()
  {
    return this.hasRemovalRequested();
  }

  /**
   * The channels this effect takes exclusive ownership of while it runs.
   *
   * Claiming is for effects that must be seen exactly as authored — a combat reaction that has to
   * read clearly regardless of what ambient motion the character happens to have. Ambient motions
   * claim nothing, which is why several of them compose.
   * @returns {string[]}
   */
  claims()
  {
    return [];
  }

  /**
   * Writes this frame's contribution into the composition.
   * @param {MotionComposition} _composition The composition being built for this character.
   */
  // eslint-disable-next-line no-unused-vars
  applyTo(_composition)
  {
    throw new Error('MotionEffect#applyTo must be implemented by a subclass.');
  }
}

export default MotionEffect;
//endregion MotionEffect