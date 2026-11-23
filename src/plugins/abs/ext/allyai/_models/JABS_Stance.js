//region JABS_Stance
/**
 * One of the stances the party's allies can take: where an ally keeps itself around the leader while there
 * is nothing to fight, and whether it goes into a fight before the leader does.
 *
 * A stance describes a zone rather than a single tile. An ally anywhere inside its zone is already in
 * position and stays put, so it is not forever shuffling after a leader who only took a step. One that has
 * strayed walks back to just inside the nearest edge of the zone and no further, which is the least walking
 * that puts it back where it belongs.
 *
 * Every zone is laid out for a leader facing down, and turned to match the leader's real facing by
 * whoever places the ally. In that frame "forward" runs the way the leader faces and "side" runs across
 * it, so a forward of 2 is two tiles in front of the leader whichever way they happen to be facing.
 */
class JABS_Stance
{
  /**
   * The places around the leader a stance can keep an ally.
   */
  static Placements = {
    /**
     * In front of the leader, between them and whatever lies ahead.
     */
    Front: 'front',

    /**
     * Beside the leader, on whichever side the ally already stands nearer.
     */
    Side: 'side',

    /**
     * Behind the leader, out of the way of whatever lies ahead.
     */
    Behind: 'behind',
  };

  /**
   * The nearest an ally kept in front of or behind the leader stands to them, in tiles.
   * @type {number}
   */
  static NearDistance = 1;

  /**
   * The furthest an ally kept in front of or behind the leader strays from them, in tiles.
   * @type {number}
   */
  static FarDistance = 3;

  /**
   * How far out to the leader's side an ally kept beside them stands, in tiles.
   * @type {number}
   */
  static SideDistance = 1;

  /**
   * How far ahead of or behind the leader an ally kept beside them may drift before it moves, in tiles.
   *
   * Without any slack a side stance would be a single tile, and a leader walking forward would leave the
   * ally out of position after every step they took.
   * @type {number}
   */
  static SideSlack = 1;

  /**
   * The key this stance is stored and looked up by.
   * @type {string}
   */
  key = String.empty;

  /**
   * The name of this stance, as the player sees it.
   * @type {string}
   */
  name = String.empty;

  /**
   * The description of this stance, as the player sees it when choosing one.
   * @type {string}
   */
  description = String.empty;

  /**
   * Where around the leader this stance keeps an ally; one of {@link JABS_Stance.Placements}.
   * @type {string}
   */
  placement = JABS_Stance.Placements.Behind;

  /**
   * Whether an ally in this stance takes on anything it can see without waiting for the leader.
   * @type {boolean}
   */
  engagesFirst = false;

  /**
   * Constructor.
   * @param {string} key The key this stance is stored and looked up by.
   * @param {string} name The name of this stance, as the player sees it.
   * @param {string} description The description of this stance, as the player sees it.
   * @param {string} placement Where around the leader this stance keeps an ally.
   * @param {boolean} engagesFirst Whether an ally in this stance goes in before the leader does.
   */
  constructor(key, name, description, placement, engagesFirst)
  {
    this.key = key;
    this.name = name;
    this.description = description;
    this.placement = placement;
    this.engagesFirst = engagesFirst;
  }

  /**
   * Gets the lane an ally keeps within a stance, which spreads several allies apart.
   *
   * Every ally in the party takes the same stance, and without lanes they would all head for the same
   * spot and pile up on one another. The first ally keeps the middle lane; each one after it alternates
   * out to either side of it, one tile further each pair.
   * @param {number} allyIndex The ally's place among the leader's followers; the first is zero.
   * @returns {number} The lane this ally keeps, in tiles from the middle one.
   */
  static laneFor(allyIndex)
  {
    // each pair of allies after the first sits one tile further out than the pair before it.
    const distanceOut = Math.ceil(allyIndex / 2);

    // odd places take the negative side of the middle lane, even places the positive one.
    return allyIndex % 2 === 1
      ? -distanceOut
      : distanceOut;
  }

  /**
   * Pins a value between two bounds.
   *
   * Kept here rather than borrowed from the engine's `Number.prototype.clamp`, so this model stands on
   * its own without anything else having been loaded first.
   * @param {number} value The value to pin.
   * @param {number} min The lowest the value may be.
   * @param {number} max The highest the value may be.
   * @returns {number} The value, moved inside the bounds if it was outside them.
   */
  static clampToRange(value, min, max)
  {
    return Math.min(Math.max(value, min), max);
  }

  /**
   * Finds the nearest spot within this stance to where an ally currently stands.
   *
   * An ally well inside the zone gets its own position straight back, which is what lets it stand still;
   * one outside it gets the closest point near the zone's edge.
   *
   * Every mover counts an ally as arrived once it is within some tolerance of its spot, so a spot right on
   * the zone's edge lets the ally stop that far outside the zone - and the edge nearest the leader is only a
   * tile away, so an ally kept in front would stop half a tile from them, standing in their sprite. The spot
   * is therefore pulled inside the zone by the inset given, which is that tolerance: wherever short of the
   * spot the ally stops, it stops inside the zone.
   * @param {number} side How far across the leader's facing the ally stands, with the leader facing down.
   * @param {number} forward How far ahead of the leader the ally stands; negative when it is behind them.
   * @param {number} lane The lane this ally keeps; see {@link JABS_Stance.laneFor}.
   * @param {number} inset How far inside the zone's edges the spot is pulled.
   * @returns {[number, number]} The [side, forward] spot this ally should stand at.
   */
  nearestSpot(side, forward, lane, inset)
  {
    // the nearest and furthest a spot in front or behind may be, once pulled inside the zone.
    const nearest = JABS_Stance.NearDistance + inset;
    const furthest = JABS_Stance.FarDistance - inset;

    // pivot on where this stance keeps its allies.
    switch (this.placement)
    {
      // in front: one to three tiles ahead, each ally in its own lane across the leader's path.
      case JABS_Stance.Placements.Front:
        return [ lane, JABS_Stance.clampToRange(forward, nearest, furthest) ];

      // behind: one to three tiles back, each ally in its own lane across the leader's path.
      case JABS_Stance.Placements.Behind:
        return [ lane, JABS_Stance.clampToRange(forward, -furthest, -nearest) ];

      // beside: the only placement left.
      default:
        return this.nearestSideSpot(side, forward, lane, inset);
    }
  }

  /**
   * Finds the nearest spot at the leader's side to where an ally currently stands.
   *
   * The ally keeps to whichever side it already stands on, so a leader turning around never sends it
   * across their path to the far side. An ally standing exactly in line with the leader has no nearer
   * side, and takes the positive one. The spot is pulled inside the zone the same way
   * {@link JABS_Stance.nearestSpot} explains: further out to the side, and less far along it.
   * @param {number} side How far across the leader's facing the ally stands, with the leader facing down.
   * @param {number} forward How far ahead of the leader the ally stands; negative when it is behind them.
   * @param {number} lane The lane this ally keeps; see {@link JABS_Stance.laneFor}.
   * @param {number} inset How far inside the zone's edges the spot is pulled.
   * @returns {[number, number]} The [side, forward] spot this ally should stand at.
   */
  nearestSideSpot(side, forward, lane, inset)
  {
    // keep to the side the ally is already on.
    const whichSide = side < 0
      ? -1
      : 1;

    // stand far enough out that stopping short of the spot still leaves a tile between ally and leader.
    const sideSpot = whichSide * (JABS_Stance.SideDistance + inset);

    // lanes slide each extra ally along the leader's side, rather than further out from it.
    const slack = JABS_Stance.SideSlack - inset;
    const forwardSpot = JABS_Stance.clampToRange(forward, lane - slack, lane + slack);

    // stand out at the side, wherever along it the ally already was.
    return [ sideSpot, forwardSpot ];
  }
}

export default JABS_Stance;
//endregion JABS_Stance