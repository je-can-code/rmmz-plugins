//region JabsDpsEncounter
/**
 * One fight's worth of landed hits, and the combat-time span they happened across.
 *
 * An encounter opens on the first hit that qualifies and closes when the party leaves combat. It
 * holds the hits and answers questions about them; deciding when to open, extend or close one is
 * the tracker's job, not its own.
 *
 * The span deliberately ends at the last landed hit rather than at the moment combat was declared
 * over. JABS keeps its in-combat countdown alive for between two and ten seconds after the fighting
 * stops, and on a six second encounter that tail would roughly halve every figure derived here.
 */
class JabsDpsEncounter
{
  /**
   * The shortest span any encounter is permitted to be measured across, in frames.
   *
   * Without a floor, the opening hit of a fight divides by roughly one frame and a hundred points
   * of damage reads as six thousand per second before settling. One second of deliberate
   * underreporting decays into correctness within that same second; the spike is wrong at exactly
   * the moment the number is being watched.
   * @type {number}
   */
  static MINIMUM_SPAN_FRAMES = 60;

  /**
   * How many frames make up one second of combat time.
   * @type {number}
   */
  static FRAMES_PER_SECOND = 60;

  /**
   * The combat-time frame this encounter opened on.
   * @type {number}
   */
  #openedAtCombatFrame = 0;

  /**
   * The working end of this encounter, in combat-time frames.
   *
   * While the encounter is open the tracker walks this forward every frame, so a lull in the middle
   * of a fight correctly drags the rate down. On close it snaps back to the last landed hit.
   * @type {number}
   */
  #endCombatFrame = 0;

  /**
   * The combat-time frame of the most recent hit recorded here.
   * @type {number}
   */
  #lastHitCombatFrame = 0;

  /**
   * Whether or not this encounter has been closed out.
   * @type {boolean}
   */
  #closed = false;

  /**
   * Every hit landed during this encounter, in the order they landed.
   * @type {JabsDpsHit[]}
   */
  #hits = [];

  /**
   * Constructor.
   * @param {number} openedAtCombatFrame The combat-time frame this encounter opened on.
   */
  constructor(openedAtCombatFrame)
  {
    this.#openedAtCombatFrame = openedAtCombatFrame;
    this.#endCombatFrame = openedAtCombatFrame;
    this.#lastHitCombatFrame = openedAtCombatFrame;
  }

  /**
   * Gets the combat-time frame this encounter opened on.
   * @returns {number}
   */
  openedAtCombatFrame()
  {
    return this.#openedAtCombatFrame;
  }

  /**
   * Gets whether or not this encounter has been closed out.
   * @returns {boolean}
   */
  isClosed()
  {
    return this.#closed;
  }

  /**
   * Gets every hit landed during this encounter.
   * @returns {JabsDpsHit[]}
   */
  hits()
  {
    return this.#hits;
  }

  /**
   * Records a hit against this encounter.
   * @param {JabsDpsHit} hit The hit that just landed.
   */
  addHit(hit)
  {
    this.#hits.push(hit);

    // the span is measured to the last thing that actually happened, so every hit moves it.
    this.#lastHitCombatFrame = hit.combatFrame();
  }

  /**
   * Walks the working end of this encounter forward to the given combat-time frame.
   * @param {number} combatFrame The current combat-time frame.
   */
  extendTo(combatFrame)
  {
    this.#endCombatFrame = combatFrame;
  }

  /**
   * Closes this encounter out, snapping its span back to the last hit that landed.
   */
  close()
  {
    this.#endCombatFrame = this.#lastHitCombatFrame;
    this.#closed = true;
  }

  /**
   * Gets how many frames of combat time this encounter spans, floored at the minimum.
   * @returns {number}
   */
  spanFrames()
  {
    const span = this.#endCombatFrame - this.#openedAtCombatFrame;

    return Math.max(JabsDpsEncounter.MINIMUM_SPAN_FRAMES, span);
  }

  /**
   * Gets the total hp damage the given battler dealt during this encounter.
   * @param {string} casterUuid The uuid of the battler in question.
   * @returns {number}
   */
  damageBy(casterUuid)
  {
    return this.#hits
      .filter(hit => hit.casterUuid() === casterUuid)
      .reduce((total, hit) => total + hit.hpDamage(), 0);
  }

  /**
   * Gets the hp damage the given battler dealt on or after the given combat-time frame.
   * @param {string} casterUuid The uuid of the battler in question.
   * @param {number} sinceCombatFrame The earliest frame that still counts.
   * @returns {number}
   */
  damageBySince(casterUuid, sinceCombatFrame)
  {
    return this.#hits
      .filter(hit => hit.casterUuid() === casterUuid)
      .filter(hit => hit.combatFrame() >= sinceCombatFrame)
      .reduce((total, hit) => total + hit.hpDamage(), 0);
  }

  /**
   * Gets the given battler's damage per second across this whole encounter.
   * @param {string} casterUuid The uuid of the battler in question.
   * @returns {number}
   */
  dpsBy(casterUuid)
  {
    const damage = this.damageBy(casterUuid);

    return JabsDpsEncounter.toDps(damage, this.spanFrames());
  }

  /**
   * Converts an amount of damage across a span of frames into a per-second rate.
   * @param {number} damage The damage dealt across the span.
   * @param {number} frames The number of frames the damage was dealt across.
   * @returns {number}
   */
  static toDps(damage, frames)
  {
    return (damage * JabsDpsEncounter.FRAMES_PER_SECOND) / frames;
  }
}

export default JabsDpsEncounter;
//endregion JabsDpsEncounter