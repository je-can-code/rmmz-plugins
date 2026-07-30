//region Scene_ActorFacetBase
import Scene_MenuFacetBase from './Scene_MenuFacetBase.js';
import Window_ActorRibbon from './../windows/Window_ActorRibbon.js';

/**
 * The shared skeleton for menu scenes scoped to a single actor.
 *
 * Extends the facet skeleton with the one thing those scenes all need and all currently solve
 * separately: showing which actor is being looked at, and letting the player change them. Four scenes
 * already extend {@link Window_ActorRibbon} for the first half and one grew a bespoke header instead;
 * this consolidates that so a fifth cannot diverge again.
 *
 * These scenes are always single-actor. An earlier design showed both party members at once, on the
 * reasoning that the party is permanently a fixed pair- but every one of these scenes carries a
 * picker or a detail panel occupying exactly the space a second actor would need. Rendering more than
 * one actor is therefore a decision for an individual window that can afford it, not a posture of the
 * base, and {@link JABS_Button}-style loadout boards do it themselves.
 *
 * Consequently `actor-prev` and `actor-next` mean the same thing in every scene built on this, with
 * no exceptions to remember.
 */
class Scene_ActorFacetBase
  extends Scene_MenuFacetBase
{
  /**
   * Extends {@link #initMembers}.<br/>
   * Also initializes the actor-scoped members.
   */
  initMembers()
  {
    // perform original logic.
    super.initMembers();

    /**
     * The ribbon identifying the actor currently being viewed.
     * @type {Window_ActorRibbon|null}
     */
    this._j._facet._ribbon = null;
  }

  //region create
  /**
   * Extends {@link #create}.<br/>
   * Also creates the actor ribbon.
   */
  create()
  {
    // perform original logic.
    super.create();

    // build the ribbon identifying who is being viewed.
    this.createActorRibbonWindow();
  }

  /**
   * Creates the actor ribbon window and adds it to tracking.
   */
  createActorRibbonWindow()
  {
    // define the rectangle of the window.
    const rectangle = this.actorRibbonWindowRect();

    // create the window with the rectangle.
    const window = this.buildActorRibbonWindow(rectangle);

    // point it at whoever the menu currently considers selected.
    window.setActor(this.actor());

    // update the tracker with the new window.
    this.setActorRibbonWindow(window);

    // add the window to the scene manager's tracking.
    this.addWindow(window);
  }

  /**
   * Builds the actor ribbon window.
   *
   * Subclasses wanting to render additional information alongside the face- points, slot counts, and
   * the like- override this to return their own subclass of {@link Window_ActorRibbon} rather than
   * building an unrelated window and positioning it themselves.
   * @param {Rectangle} rectangle The rectangle to build the window within.
   * @returns {Window_ActorRibbon}
   */
  buildActorRibbonWindow(rectangle)
  {
    return new Window_ActorRibbon(rectangle);
  }

  /**
   * Gets the currently tracked actor ribbon window.
   * @returns {Window_ActorRibbon|null}
   */
  getActorRibbonWindow()
  {
    return this._j._facet._ribbon;
  }

  /**
   * Sets the currently tracked actor ribbon window to the given window.
   * @param {Window_ActorRibbon} window The window to track.
   */
  setActorRibbonWindow(window)
  {
    this._j._facet._ribbon = window;
  }

  //endregion create

  //region layout
  /**
   * The height of the actor ribbon.
   * @returns {number}
   */
  actorRibbonHeight()
  {
    return this.calcWindowHeight(this.actorRibbonLineCount(), false);
  }

  /**
   * How many lines tall the actor ribbon is.
   *
   * One, because it is a ribbon: a band naming who is being looked at, not a panel about them. The face
   * it draws is cropped to 40px by default precisely so it fits in a single row.
   * @returns {number}
   */
  actorRibbonLineCount()
  {
    return 1;
  }

  /**
   * Builds the rectangle for the actor ribbon, sat at the top of the bounded region.
   * @returns {Rectangle}
   */
  actorRibbonWindowRect()
  {
    // start from the region this scene is allowed to fill.
    const facetArea = this.facetAreaRect();

    // the ribbon spans the full width of that region.
    return new Rectangle(facetArea.x, facetArea.y, facetArea.width, this.actorRibbonHeight());
  }

  /**
   * Extends {@link #facetAreaRect}.<br/>
   * Narrows the region available to subclasses to exclude the actor ribbon.
   *
   * Subclasses therefore never need to account for the ribbon's height themselves- they receive a
   * region that already excludes it, the same way they already receive one excluding help and legend.
   * @returns {Rectangle}
   */
  contentAreaRect()
  {
    // start from the region this scene is allowed to fill.
    const facetArea = this.facetAreaRect();

    // the ribbon consumes the top of it.
    const ribbonHeight = this.actorRibbonHeight();

    // return whatever remains beneath the ribbon.
    return new Rectangle(
      facetArea.x,
      facetArea.y + ribbonHeight,
      facetArea.width,
      facetArea.height - ribbonHeight);
  }

  //endregion layout

  //region actor
  /**
   * Extends {@link #onActorChange}.<br/>
   * Also refreshes the ribbon so it names whoever is now being viewed.
   */
  onActorChange()
  {
    // perform original logic.
    super.onActorChange();

    // point the ribbon at the newly selected actor.
    this.getActorRibbonWindow()
      .setActor(this.actor());
  }

  /**
   * Cycles to the previous actor.
   */
  onCycleActorLeft()
  {
    // move to the previous actor.
    this.previousActor();
  }

  /**
   * Cycles to the next actor.
   */
  onCycleActorRight()
  {
    // move to the next actor.
    this.nextActor();
  }

  //endregion actor
}

export default Scene_ActorFacetBase;
//endregion Scene_ActorFacetBase
