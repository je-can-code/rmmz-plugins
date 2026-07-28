//region Window_LoadoutActorHeader
/**
 * The column headers naming which party member each column of the loadout board belongs to.
 *
 * This exists instead of an actor ribbon because the board renders every member at once- a ribbon
 * names the single actor a scene is currently about, and this scene is about all of them. The headers
 * sit directly above the board and share its column geometry so each name lands over its own column.
 */
class Window_LoadoutActorHeader
  extends Window_Base
{
  /**
   * @constructor
   * @param {Rectangle} rect The rectangle that defines this window's shape.
   */
  constructor(rect)
  {
    // perform original logic.
    super(rect);

    // initialize our custom members.
    this.initMembers();
  }

  /**
   * Initializes all custom members of this window.
   */
  initMembers()
  {
    /**
     * The width of a single actor's column on the board beneath.
     * @type {number}
     */
    this._actorColumnWidth = 0;

    /**
     * The width of the slot spine running between those columns.
     * @type {number}
     */
    this._slotSpineWidth = 0;
  }

  /**
   * Adopts the board's column geometry so each name lands over its own column.
   *
   * The geometry is handed over rather than recalculated because two windows deriving the same layout
   * independently is precisely how they end up disagreeing- the board owns the arithmetic, this window
   * only follows it.
   * @param {number} actorColumnWidth The width of a single actor column.
   * @param {number} slotSpineWidth The width of the spine between them.
   */
  setColumnGeometry(actorColumnWidth, slotSpineWidth)
  {
    this._actorColumnWidth = actorColumnWidth;
    this._slotSpineWidth = slotSpineWidth;

    // the geometry is the only thing this window renders against, so redraw once it is known.
    this.refresh();
  }

  /**
   * Gets the party members being named, in column order.
   * @returns {Game_Actor[]}
   */
  members()
  {
    return $gameParty.members();
  }

  /**
   * Renders one name per column.
   */
  refresh()
  {
    // wipe whatever was previously rendered.
    this.contents.clear();

    // there is nothing meaningful to place until the board has shared its geometry.
    if (this._actorColumnWidth === 0) return;

    // render each member over their own column.
    this.members()
      .forEach((actor, index) => this.drawColumnHeader(actor, index));
  }

  /**
   * Renders a single column's header.
   * @param {Game_Actor} actor The member owning this column.
   * @param {number} index The column index.
   */
  drawColumnHeader(actor, index)
  {
    // everything past the first column is pushed clear of the spine, exactly as the board does it.
    const spineOffset = index === 0
      ? 0
      : this._slotSpineWidth;

    // work out where this column begins.
    const x = (this._actorColumnWidth * index) + spineOffset;

    // headers are chrome rather than content, so they render in the system color.
    this.changeTextColor(ColorManager.systemColor());

    // center the name over its column so it reads as a heading rather than a list entry.
    this.drawText(actor.name(), x, 0, this._actorColumnWidth, 'center');

    // leave the color as we found it for anything else drawing into these contents.
    this.resetTextColor();
  }
}

export default Window_LoadoutActorHeader;
//endregion Window_LoadoutActorHeader
