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
   * Stands in for the given action, on the spot it would spawn if its cast finished now.
   * @param {JABS_Action} jabsAction The real action winding up.
   */
  set(jabsAction)
  {
    this.#jabsAction = jabsAction;
    this.#wearTemplateArt(jabsAction);

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
   * @param {JABS_Action} jabsAction The real action winding up.
   */
  #wearTemplateArt(jabsAction)
  {
    const [ page ] = $actionMap.events[jabsAction.getActionId()].pages;
    const { tileId, characterName, characterIndex } = page.image;

    // a page shows a tile or a sheet, which is the same fork a real event's page takes.
    if (tileId > 0)
    {
      this.#character.setTileImage(tileId);
      return;
    }

    this.#character.setImage(characterName, characterIndex);
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