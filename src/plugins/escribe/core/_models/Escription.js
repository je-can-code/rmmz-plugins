//region Escription
/**
 * One thing floating above an event: a line of text, or an icon.
 *
 * Text and icons were originally two parallel features written side by side, but they only ever
 * differed in what they draw and where they park. Modelling them as one kind-tagged thing lets an
 * event hold a list of them, which in turn lets parsing, proximity, sprite construction and
 * visibility each run once in a loop instead of twice in longhand.
 */
class Escription
{
  /**
   * The kinds of thing an escription can be.
   * The kind decides which sprite draws it and where that sprite parks relative to the character.
   */
  static Kinds = {
    /**
     * A line of text.
     */
    Text: 'text',

    /**
     * An icon from the icon sheet.
     */
    Icon: 'icon',
  };

  /**
   * The proximity range meaning "no proximity requirement at all", which is how an escription says
   * it is visible for as long as its event is.
   * @type {number}
   */
  static ALWAYS_VISIBLE = -1;

  /**
   * Which kind of escription this is, from {@link Escription.Kinds}.
   * @type {string}
   */
  _kind = Escription.Kinds.Text;

  /**
   * What this escription draws: the line of text, or the index of the icon.
   * @type {string|number}
   */
  _content = String.empty;

  /**
   * How close the player must stand for this to become visible, in tiles.
   * {@link Escription.ALWAYS_VISIBLE} means there is no requirement to meet.
   * @type {number}
   */
  _proximityRange = Escription.ALWAYS_VISIBLE;

  /**
   * Whether the player is currently close enough to see this.
   * Meaningless for an escription with no proximity requirement, which is always visible.
   * @type {boolean}
   */
  _playerNearby = false;

  /**
   * @param {string} kind Which kind of escription this is, from {@link Escription.Kinds}.
   * @param {string|number} content The text to draw, or the index of the icon to draw.
   * @param {number} proximityRange The tiles the player must be within, or ALWAYS_VISIBLE.
   */
  constructor(kind, content, proximityRange)
  {
    this.initMembers(kind, content, proximityRange);
  }

  /**
   * Initializes the members of this class.
   * @param {string} kind Which kind of escription this is, from {@link Escription.Kinds}.
   * @param {string|number} content The text to draw, or the index of the icon to draw.
   * @param {number} proximityRange The tiles the player must be within, or ALWAYS_VISIBLE.
   */
  initMembers(kind, content, proximityRange)
  {
    this._kind = kind;
    this._content = content;
    this._proximityRange = proximityRange;
  }

  /**
   * Gets which kind of escription this is, from {@link Escription.Kinds}.
   * @returns {string}
   */
  kind()
  {
    return this._kind;
  }

  /**
   * Gets what this escription draws- the line of text, or the index of the icon.
   * @returns {string|number}
   */
  content()
  {
    return this._content;
  }

  /**
   * Gets how close the player must stand for this to become visible, in tiles.
   * @returns {number}
   */
  proximityRange()
  {
    return this._proximityRange;
  }

  /**
   * Whether this only becomes visible once the player has come close enough.
   * @returns {boolean}
   */
  hasProximity()
  {
    return this.proximityRange() > Escription.ALWAYS_VISIBLE;
  }

  /**
   * Whether the player is currently close enough to see this.
   * @returns {boolean}
   */
  isPlayerNearby()
  {
    return this._playerNearby;
  }

  /**
   * Records whether the player has come close enough to see this.
   * @param {boolean} nearby True if the player is within range, false otherwise.
   */
  setPlayerNearby(nearby)
  {
    this._playerNearby = nearby;
  }

  /**
   * Whether this should currently be drawn on the map.
   * @returns {boolean}
   */
  isVisible()
  {
    // something with nothing to wait for is simply always visible.
    if (!this.hasProximity()) return true;

    // everything else is visible exactly while the player is standing close enough.
    return this.isPlayerNearby();
  }

  /**
   * A signature of everything about this escription that decides what its sprite looks like.
   *
   * The sprite layer holds no reference to the escriptions themselves- it compares this signature
   * against the one it last built from, and rebuilds when they differ. Proximity belongs in it
   * because a gated escription is born invisible and an ungated one is not, which is a difference
   * in construction rather than something the update loop could correct afterward.
   * @returns {string}
   */
  key()
  {
    return `${this.kind()}:${this.content()}:${this.proximityRange()}`;
  }
}

export default Escription;
//endregion Escription