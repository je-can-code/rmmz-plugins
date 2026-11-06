//region JABS_CastPreviewAction
/**
 * A stand-in for the action event a cast has yet to spawn, so its telegraph can be drawn by the
 * same code, and from the same origin, as the hit it warns about.<br/>
 * Answers the three members every hitbox helper reads from a real action event: `screenX()`,
 * `screenY()`, and `getJabsAction()`. Meant to be one reusable instance per telegraph, re-`set()`
 * every frame so it follows the cast.
 */
class JABS_CastPreviewAction
{
  /**
   * How many frames of a flight a telegraph shows. Past this a shot can be sidestepped on sight,
   * so drawing further would only claim danger that is seconds away.
   * @type {number}
   */
  static FlightPreviewFrames = 60;

  /**
   * The event page move type that runs its move route; a template on any other ignores it.
   * @type {number}
   */
  static CustomMoveType = 3;

  /**
   * The headless character reporting the spawn position in screen pixels, the same way the event
   * placed there will.
   * @type {Game_Character}
   */
  #character = new Game_Character();

  /**
   * The real action winding up, or null until one is assigned.
   * @type {JABS_Action|null}
   */
  #jabsAction = null;

  /**
   * The action map template page the action will spawn from, or null until one is assigned.
   * @type {RPG_MapEventPage|null}
   */
  #page = null;

  /**
   * Stands in for the given action, on the spot it would spawn if its cast finished now.
   * @param {JABS_Action} jabsAction The real action winding up.
   */
  set(jabsAction)
  {
    this.#jabsAction = jabsAction;
    [ this.#page ] = $actionMap.events[jabsAction.getActionId()].pages;
    this.#wearTemplateArt();

    // ask what firing will ask, so the telegraph lands wherever the action does.
    const caster = jabsAction.getCaster();
    const [ targetX, targetY ] = caster.resolveActionTargetCoordinates(jabsAction);
    const [ spawnX, spawnY ] = $jabsEngine.determineActionSpawnCoordinates(caster, jabsAction, targetX, targetY);

    // stand on that spot.
    this.#character.locate(spawnX, spawnY);
  }

  /**
   * Dresses the headless character in the art the action's template will give its event. A tile or
   * an object sheet rests on its tile where a character stands a few pixels above it, and that
   * difference carries through to the screen position.
   */
  #wearTemplateArt()
  {
    const { tileId, characterName, characterIndex } = this.#page.image;

    // a page shows a tile or a sheet, which is the same fork a real event's page takes.
    if (tileId > 0)
    {
      this.#character.setTileImage(tileId);
      return;
    }

    this.#character.setImage(characterName, characterIndex);
  }

  /**
   * How far the action will fly in the stretch of its flight a telegraph shows, in tiles.
   * @returns {number} The distance; 0 for an action that stays where it spawns, or whose route
   * can't promise where it is going.
   */
  flightPreviewTiles()
  {
    if (this.#fliesStraight() === false) return 0;

    // a short-lived shot stops when it expires, however far the rest of the preview would reach.
    const frames = Math.min(JABS_CastPreviewAction.FlightPreviewFrames, this.#jabsAction.getMaxDuration());

    // the headless character does the speed math, the same way the event will.
    this.#character.setMoveSpeed(this.#templateMoveSpeed());
    return this.#character.distancePerFrame() * frames;
  }

  /**
   * Whether the action will leave its spawn in a straight line along its aim.
   * @returns {boolean} True if it will fly straight, false otherwise.
   */
  #fliesStraight()
  {
    // a direct action lands on its target, it does not fly there.
    if (this.#jabsAction.isDirectAction()) return false;

    // a route only runs at all on a custom template, and only a looping one keeps going.
    const { moveType, moveRoute } = this.#page;
    if (moveType !== JABS_CastPreviewAction.CustomMoveType) return false;
    if (moveRoute.repeat === false) return false;

    // anything but stepping forward could end up anywhere, so stepping forward is all that's promised.
    const steps = moveRoute.list.filter(command => command.code !== Game_Character.ROUTE_END);
    return steps.length > 0 && steps.every(command => command.code === Game_Character.ROUTE_MOVE_FORWARD);
  }

  /**
   * The speed the action's template will give its event: its comments outrank the page.
   * @returns {number}
   */
  #templateMoveSpeed()
  {
    const comments = Game_Event.getValidCommentCommandsFromPage(this.#page);
    return Game_Event.readCustomMoveSpeed(comments) ?? this.#page.moveSpeed;
  }

  /**
   * The screen X the spawned action event would report.
   * @returns {number}
   */
  screenX()
  {
    return this.#character.screenX();
  }

  /**
   * The screen Y the spawned action event would report.
   * @returns {number}
   */
  screenY()
  {
    return this.#character.screenY();
  }

  /**
   * The real action this stands in for, or null until one is assigned.
   * @returns {JABS_Action|null}
   */
  getJabsAction()
  {
    return this.#jabsAction;
  }
}

export default JABS_CastPreviewAction;
//endregion JABS_CastPreviewAction