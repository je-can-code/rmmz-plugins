//region SaveFileEntryMode
/**
 * Where the files scene was opened from, and what each origin is willing to offer.
 *
 * The three origins are named for the place the player came from rather than for the commands they
 * omit. Origin is the stable fact, and it is the actual reason the sets differ - a name like "without
 * save" says nothing about what *is* offered, and stops being descriptive the moment a sixth command
 * exists.
 *
 * **Availability is a function of the origin only, never of `$gameSystem`.** That is not a stylistic
 * preference. `_saveEnabled` is an own enumerable field on {@link Game_System}, the codec seeds it, and
 * nothing declares it transient - so it persists into savefiles. Gating the menu's Save by toggling
 * save access around a platform would leak: the file captures `_saveEnabled: true`, and loading it
 * later restores saving-everywhere until the player touches another platform. Silently, and looking for
 * all the world like the gate randomly stopped working. The origin lives and dies with the scene, which
 * is the only lifetime that is correct here.
 */
class SaveFileEntryMode
{
  /**
   * Opened by stepping onto a save platform in the world.
   * @type {string}
   */
  static Platform = 'platform';

  /**
   * Opened from the ordinary start-button menu.
   * @type {string}
   */
  static Menu = 'menu';

  /**
   * Opened from the title screen's Continue command.
   * @type {string}
   */
  static Title = 'title';

  /**
   * Which command keys each origin offers.
   *
   * This is the one table. Changing what an origin offers is a single row here, and nothing else in
   * the feature has an opinion about it - the modes ask this, the command window asks the modes, and
   * the scene asks the command window.
   *
   * Commands an origin does not offer are **omitted, not greyed**. A greyed Rewind on the title screen
   * is an invitation to wonder what you did wrong; an absent one just reads as a different screen. The
   * player should never learn that these are the same scene.
   * @type {Map<string, string[]>}
   */
  static offerings = new Map([
    // a platform is the one place saving happens, and the player has a game loaded to rewind within.
    [ SaveFileEntryMode.Platform, [ 'save', 'load', 'rewind' ] ],

    // the menu offers everything the platform does except saving; that stays the platform's job, and
    // that is the entire point of having platforms.
    [ SaveFileEntryMode.Menu, [ 'load', 'rewind' ] ],

    // deleting is the one irreversible thing here, and it lives where the player arrives with nothing
    // loaded - so it can never interact with the game currently in memory. Rewind is absent for the
    // mirror-image reason: there is no loaded game to rewind and no current slot to rewind within.
    [ SaveFileEntryMode.Title, [ 'load', 'delete' ] ],
  ]);

  /**
   * Determines whether an origin offers a given command.
   * @param {string} entryMode The origin the scene was opened from.
   * @param {string} key The command's key, ex: `save`.
   * @returns {boolean}
   */
  static offers(entryMode, key)
  {
    // an origin nobody has described offers nothing, which fails closed rather than open.
    const offered = SaveFileEntryMode.offerings.get(entryMode) ?? [];

    return offered.includes(key);
  }
}

export default SaveFileEntryMode;
//endregion SaveFileEntryMode