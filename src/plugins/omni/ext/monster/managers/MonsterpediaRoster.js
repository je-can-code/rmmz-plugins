//region MonsterpediaRoster
/**
 * The map sprite each enemy wears, read off J-ABS's roster of enemy templates.
 *
 * J-ABS loads one map as its roster: one event per enemy, each event's id matching its enemy's, and
 * each wearing the character sheet that enemy wears in the world. The monsterpedia pictures an enemy
 * the way it looks on the map, so it reads those same events rather than keeping a second record of
 * who wears what, which would only ever drift from the first.
 */
class MonsterpediaRoster
{
  /**
   * The character sheet and index an enemy wears on the map.<br/>
   * J-ABS fetches its roster asynchronously at boot, so for the first moments of a session there is no
   * roster to read. Before it lands, and for an enemy the roster holds no event for, the enemy wears
   * nothing, which reads as an empty sheet name.
   * @param {number} enemyId The id of the enemy to picture.
   * @returns {{characterName: string, characterIndex: number}}
   */
  static characterOf(enemyId)
  {
    // the roster's events, indexed by event id, which is also the enemy's id.
    const rosterEvents = JABS_Engine.getEnemyCloneList();

    // there is nothing to read until J-ABS's fetch has landed.
    if (rosterEvents === null) return this.#noCharacter();

    // the event standing in for this enemy; an id past the end of the roster has none.
    const rosterEvent = rosterEvents[enemyId] ?? null;

    // an enemy the roster holds no event for wears nothing.
    if (rosterEvent === null) return this.#noCharacter();

    // the sheet and character the event's first page wears.
    const {
      characterName,
      characterIndex,
    } = rosterEvent.pages[0].image;

    // hand back only what picturing the enemy needs.
    return {
      characterName,
      characterIndex,
    };
  }

  /**
   * The sentinel for an enemy the roster cannot picture.
   * @returns {{characterName: string, characterIndex: number}}
   */
  static #noCharacter()
  {
    return {
      characterName: String.empty,
      characterIndex: 0,
    };
  }
}

export default MonsterpediaRoster;
//endregion MonsterpediaRoster