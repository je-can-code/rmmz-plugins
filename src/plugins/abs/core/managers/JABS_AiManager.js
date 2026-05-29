//region JABS_AiManager
import JABS_TeamRules from './JABS_TeamRules.js';
import JABS_Location from './../__models/JABS_Location.js';
import JABS_BattlerCoreData from './../__models/JABS_BattlerCoreData.js';
import JABS_Battler from './../__models/JABS_Battler/_initialization.js';
import JABS_ActionOptions from './../__models/JABS_ActionOptions.js';
import JABS_Action from './../__models/JABS_Action.js';
/**
 * This static class tracks and manages all {@link JABS_Battler}s on the map.
 */
class JABS_AiManager
{
  /**
   * Converts a dir8 code into a normalized unit vector in map space (RMMZ Y-down).
   * @param {1|2|3|4|6|7|8|9} dir8 The direction code.
   * @returns {{x: number, y: number}} The unit vector.
   */
  static dir8ToUnitVector(dir8)
  {
    let x = 0;
    let y = 0;

    switch (dir8)
    {
      case J.ABS.Directions.DOWN:
        y = 1;
        break;
      case J.ABS.Directions.UP:
        y = -1;
        break;
      case J.ABS.Directions.RIGHT:
        x = 1;
        break;
      case J.ABS.Directions.LEFT:
        x = -1;
        break;
      case J.ABS.Directions.LOWERRIGHT:
        x = 1;
        y = 1;
        break;
      case J.ABS.Directions.LOWERLEFT:
        x = -1;
        y = 1;
        break;
      case J.ABS.Directions.UPPERRIGHT:
        x = 1;
        y = -1;
        break;
      case J.ABS.Directions.UPPERLEFT:
        x = -1;
        y = -1;
        break;
      default:
        y = 1;
        break;
    }

    const len = Math.hypot(x, y);
    return {
      x: x / len,
      y: y / len,
    };
  }

  /**
   * Converts an angle in degrees (0=right, 90=down) into an 8-direction code.
   * @param {number} angleDegrees The angle in degrees (RMMZ Y-down).
   * @returns {1|2|3|4|6|7|8|9} The closest dir8 code.
   */
  static angleToDir8(angleDegrees)
  {
    // normalize to [0, 360).
    let a = angleDegrees % 360;
    if (a < 0) a += 360;

    // 8 sectors of 45°; add half-sector to round to nearest.
    const idx = Math.floor((a + 22.5) / 45) % 8;
    const dirs = [
      J.ABS.Directions.RIGHT,       // 0°
      J.ABS.Directions.LOWERRIGHT,  // 45°
      J.ABS.Directions.DOWN,        // 90°
      J.ABS.Directions.LOWERLEFT,   // 135°
      J.ABS.Directions.LEFT,        // 180°
      J.ABS.Directions.UPPERLEFT,   // 225°
      J.ABS.Directions.UP,          // 270°
      J.ABS.Directions.UPPERRIGHT,  // 315°
    ];

    return dirs[idx];
  }

  /**
   * Derives a fire-time facing for AI volleys from caster→target, falling back to map facing when:
   * - no target exists, or
   * - the target vector is "behind" the battler's current facing (dot ≤ 0).
   * @param {JABS_Battler} battler The battler firing.
   * @returns {1|2|3|4|6|7|8|9} The derived dir8 facing.
   */
  static deriveFreshFacingForAi(battler)
  {
    // start from the conventional facing hook.
    const fallbackFacing = battler.getProjectileSpawnBaseDirection();

    // grab the relevant target (ally or enemy).
    const target = battler.getAllyTarget() ?? battler.getTarget();
    if (!target)
    {
      return fallbackFacing;
    }

    const bx = battler.getX();
    const by = battler.getY();
    const tx = target.getX();
    const ty = target.getY();

    // if overlapping, keep facing.
    const dx = tx - bx;
    const dy = ty - by;
    if (dx === 0 && dy === 0)
    {
      return fallbackFacing;
    }

    // check if the target is generally in front; if behind, do not "snap-aim" through the body.
    const fv = this.dir8ToUnitVector(fallbackFacing);
    const tLen = Math.hypot(dx, dy);
    const tvx = dx / tLen;
    const tvy = dy / tLen;
    const dot = (fv.x * tvx) + (fv.y * tvy);
    if (dot <= 0)
    {
      return fallbackFacing;
    }

    // derive the RMMZ angle in degrees (0=right, 90=down).
    const angleDegrees = Math.atan2(dy, dx) * 180 / Math.PI;

    return this.angleToDir8(angleDegrees);
  }

  /**
   * A collection of all battlers being managed by this manager.
   * @type {Map<string, JABS_Battler>}
   */
  static battlers = new Map();

  /**
   * The maximum update range for AI to be cognizant of eachother.
   * @type {number}
   */
  static maxAiRange = J.ABS.Metadata.MaxAiUpdateRange;

  /**
   * The spatial index mapping "x,y" keys to sets of battlers occupying that tile.
   * Used for broad-phase collision queries to avoid scanning all battlers.
   * @type {Map<string, Set<JABS_Battler>>}
   */
  static spatialIndex = new Map();

  /**
   * The size of each spatial cell in tiles for the broad-phase grid.
   * Currently fixed to 1 tile per cell to align with tile-based JABS.
   * @type {number}
   */
  static spatialCellSize = 1;

  /**
   * The constructor is not designed to be called.
   * This is a static class.
   */
  constructor()
  {
    throw new Error('This is a static class.');
  }

  //region get battlers
  /**
   * Gets all battlers as an array for iterative purposes.
   * @returns {JABS_Battler[]} The currently tracked battlers.
   */
  static getAllBattlers()
  {
    // return an array form of the battlers.
    return Array
      .from(this.battlers.values());
  }

  /**
   * Find a battler by its uuid.
   * @param {string} uuid The uuid of the battler to find.
   * @returns {JABS_Battler|undefined}
   */
  static getBattlerByUuid(uuid)
  {
    // return what is found by that uuid.
    return this.battlers.get(uuid);
  }

  /**
   * Finds a battler by its {@link Game_Event.eventId}.
   * @param {number} eventId The event id to find a battler for.
   * @returns {JABS_Battler|undefined}
   */
  static getBattlerByEventId(eventId)
  {
    // find the battler with the matching event id.
    return this.getAllBattlers()
      .find(battler => battler.getCharacter()
        .eventId() === eventId);
  }

  /**
   * Gets all battlers within a given distance from given battler.
   * @param {JABS_Battler} user The target to get battlers within range of.
   * @param {number} maxRange The maximum range to check for battlers within.
   * @returns {JABS_Battler[]}
   */
  static getBattlersWithinRange(user, maxRange)
  {
    // find all battlers that are within the max range.
    return this.getAllBattlers()
      .filter(battler => user.distanceToDesignatedTarget(battler) <= maxRange);
  }

  /**
   * Gets all followers that the given leader battler has.
   * @param {JABS_Battler} leaderBattler
   * @returns {JABS_Battler[]}
   */
  static getLeaderFollowers(leaderBattler)
  {
    // if we're not a leader role, there are no followers.
    if (!leaderBattler.getBattlerRole().leader) return [];

    // determine all nearby battlers of the same team.
    const nearbyBattlers = this.getAlliedBattlersWithinRange(leaderBattler, leaderBattler.getPursuitRadius());

    /**
     * @param {JABS_Battler} battler
     */
    const filtering = battler =>
    {
      // actors are not considered for leader/follower.
      if (battler.isActor()) return false;

      const { follower, leader, solo } = battler.getBattlerRole();

      // solo battlers never participate in coordination.
      if (solo) return false;

      // check if they can become a follower to the designated leader.
      const canLead = !battler.hasLeader() || (leaderBattler.getUuid() === battler.getLeader());

      // if they are a follower, not a leader, and can be led, then lead them.
      return (follower && !leader && canLead);
    };

    // return the filtered nearby battlers that are followers.
    return nearbyBattlers.filter(filtering);
  }

  /**
   * Gets all battlers in order from closest to farthest in relation
   * to the given origin battler.
   * @param {JABS_Battler} originBattler The origin battler to sort all other battlers by.
   * @returns {JABS_Battler[]}
   */
  static getAllBattlersDistanceSortedFromBattler(originBattler)
  {
    // grab all the battlers available.
    const battlers = this.getAllBattlers();

    // return them sorted, closest to farthest.
    return this.#sortBattlersByDistanceFromBattlerAscending(battlers, originBattler);
  }

  /**
   * Gets all battlers within a given distance from given battler, sorted closest to farthest.
   * @param {JABS_Battler} originBattler The target to get battlers within range of.
   * @param {number} maxRange The maximum range to check for battlers within.
   * @returns {JABS_Battler[]}
   */
  static getAllBattlersWithinRangeSortedByDistance(originBattler, maxRange)
  {
    // find all battlers that are within the max range.
    const battlers = this.getBattlersWithinRange(originBattler, maxRange);

    // return them sorted, closest to farthest.
    return this.#sortBattlersByDistanceFromBattlerAscending(battlers, originBattler);
  }

  /**
   * Gets all battlers that are of an opposing team to the selected battler.
   * @param {JABS_Battler} selectedBattler The battler to get the opposing battlers list for.
   * @returns {JABS_Battler[]} All opposing battlers being tracked.
   */
  static getOpposingBattlers(selectedBattler)
  {
    // grab all the battlers available.
    const battlers = this.getAllBattlers();

    // return the opposing battlers.
    return this.#filterBattlersByOpposingTeam(battlers, selectedBattler);
  }

  /**
   * Gets all opposing battlers to the selected battler within a given range.
   * @param {JABS_Battler} selectedBattler The selected battler to compare range and opposition with.
   * @param {number} maxRange The maximum range from the selected battler; inclusive.
   * @returns {JABS_Battler[]} The double-filtered list of opposing battlers within range.
   */
  static getOpposingBattlersWithinRange(selectedBattler, maxRange)
  {
    // grab all opposing battlers available.
    const opposingBattlers = this.getOpposingBattlers(selectedBattler);

    // return the range-filtered opposing battlers.
    return this.#filterBattlersByRangeFromBattler(opposingBattlers, selectedBattler, maxRange);
  }

  /**
   * Gets the closest opposing battler in the selected battler's sight range.
   * @param {JABS_Battler} selectedBattler The battler to find the closest opponent for.
   * @returns {JABS_Battler|null} The closest battler, or null if no opponent is in sight.
   */
  static getClosestOpposingBattler(selectedBattler)
  {
    // grab all opposing battlers within the selected battlers sight.
    const battlers = this.getOpposingBattlersWithinRange(selectedBattler, selectedBattler.getSightRadius());

    // if we have no visible opposing battlers, then there is no closest.
    if (!battlers.length) return null;

    // sort the closest battler out.
    const [ closestBattler, ] = this.#sortBattlersByDistanceFromBattlerAscending(battlers, selectedBattler);

    // return the closest we found.
    return closestBattler;
  }

  /**
   * Gets all battlers that are of an allied team to the selected battler.
   * @param {JABS_Battler} selectedBattler The battler to get the allied battlers list for.
   * @returns {JABS_Battler[]} All allied battlers being tracked.
   */
  static getAlliedBattlers(selectedBattler)
  {
    // grab all the battlers available.
    const battlers = this.getAllBattlers();

    // return the allied battlers.
    return this.#filterBattlersByAlliedTeam(battlers, selectedBattler);
  }

  /**
   * Gets all allied battlers to the selected battler within a given range.
   * @param {JABS_Battler} selectedBattler The selected battler to compare range and alliance with.
   * @param {number} maxRange The maximum range from the selected battler; inclusive.
   * @returns {JABS_Battler[]} The double-filtered list of allied battlers within range.
   */
  static getAlliedBattlersWithinRange(selectedBattler, maxRange)
  {
    // grab all allied battlers available.
    const alliedBattlers = this.getAlliedBattlers(selectedBattler);

    // return the range-filtered allied battlers.
    return this.#filterBattlersByRangeFromBattler(alliedBattlers, selectedBattler, maxRange);
  }

  /**
   * Gets all battlers that use {@link Game_Actor} for their battler.
   * @returns {JABS_Battler[]}
   */
  static getActorBattlers()
  {
    // filter on whether or not the battler is a {@link Game_Actor}.
    return this.getAllBattlers()
      .filter(battler => battler.isActor());
  }

  /**
   * Gets all battlers that use {@link Game_Enemy} for their battler.
   * @returns {JABS_Battler[]}
   */
  static getEnemyBattlers()
  {
    // filter on whether or not the battler is a {@link Game_Enemy}.
    return this.getAllBattlers()
      .filter(battler => battler.isEnemy());
  }

  /**
   * Filters the battlers based on whether or not the battler is on an opposing
   * team from the selected battler.
   * @param {JABS_Battler[]} battlers The battlers to be filtered by team opposition.
   * @param {JABS_Battler} selectedBattler The battler to compare for team opposition.
   * @returns {JABS_Battler[]} The filtered list of only opposing battlers.
   */
  static #filterBattlersByOpposingTeam(battlers, selectedBattler)
  {
    // a filter function for determining whether or not the battler is of the opposing team.
    const filtering = battler =>
    {
      // neutral battlers are never an opposition.
      if (battler.getTeam() === JABS_Battler.neutralTeamId()) return false;

      // invisible followers are not combat-eligible; enemies should not target or aggro them.
      if (battler.isFollower() && battler.getCharacter().isVisible() === false) return false;

      // check if the selected battler is opposed to the target battler's team.
      const isOpposingTeam = JABS_TeamRules.isOpposed(selectedBattler.getTeam(), battler.getTeam());

      // return what we found.
      return isOpposingTeam;
    };

    // return the battlers filtered by team opposition of the selected battler.
    return battlers.filter(filtering);
  }

  /**
   * Filters the battlers based on whether or not the battler is on an allied
   * team from the selected battler.
   * @param {JABS_Battler[]} battlers The battlers to be filtered by team alliance.
   * @param {JABS_Battler} selectedBattler The battler to compare for team alliance.
   * @returns {JABS_Battler[]} The filtered list of only allied battlers.
   */
  static #filterBattlersByAlliedTeam(battlers, selectedBattler)
  {
    // a filter function for determining whether or not the battler is of the same team.
    const filtering = battler =>
    {
      // neutral battlers are never an ally.
      if (battler.getTeam() === JABS_Battler.neutralTeamId()) return false;

      // check if the selected battler is friendly with the target battler's team.
      const isSameTeam = JABS_TeamRules.isFriendly(selectedBattler.getTeam(), battler.getTeam());

      // return what we found.
      return isSameTeam;
    };

    // return the battlers filtered by team alliance of the selected battler.
    return battlers.filter(filtering);
  }

  /**
   * Filters the battlers based on whether or not they are within the maximum range from the origin battler.
   * @param {JABS_Battler[]} battlers The battlers to be filtered by team opposition.
   * @param {JABS_Battler} originBattler The battler to filter by maximum range from.
   * @param {number} maxRange The maximum range from the origin battler; inclusive.
   * @returns {JABS_Battler[]} The filtered list of only battlers within the max range from the origin.
   */
  static #filterBattlersByRangeFromBattler(battlers, originBattler, maxRange)
  {
    // a filter function for removing battlers outside of a given range.
    const filtering = battler =>
    {
      // grab the distance from the origin battler to the given battler.
      const distance = originBattler.distanceToDesignatedTarget(battler);

      // whether or not the battler is in range.
      const inRange = distance <= maxRange;

      // return the result.
      return inRange;
    };

    // return the battlers filtered by maximum range.
    return battlers.filter(filtering);
  }

  /**
   * Sorts the battlers in order from closest to farthest from the origin battler.
   * @param {JABS_Battler[]} battlers The collection of battlers to sort.
   * @param {JABS_Battler} originBattler The origin battler to check distance against.
   * @returns {JABS_Battler[]} The battlers sorted from closest to farthest.
   */
  static #sortBattlersByDistanceFromBattlerAscending(battlers, originBattler)
  {
    // a compare function for comparing the distance between two battlers.
    const comparing = (battlerA, battlerB) =>
    {
      const distanceA = originBattler.distanceToDesignatedTarget(battlerA);
      const distanceB = originBattler.distanceToDesignatedTarget(battlerB);
      return distanceA - distanceB;
    };

    // return the battlers sorted by distance from closest to farthest.
    return battlers.sort(comparing);
  }

  /**
   * Determines whether any living enemy currently has aggro on any party member.
   * @returns {boolean}
   */
  static anyLivingEnemiesAggroedToParty()
  {
    // get all tracked enemy battlers from your registry.
    const enemies = JABS_AiManager.getEnemyBattlers()
      .filter(enemy => enemy.isDead() === false);

    // if there are no enemies, then there is no aggro.
    if (!enemies.length) return false;

    // iterate for any enemy who is alive and has aggro on a party target.
    const hasAggroOnParty = enemies.some(enemy =>
    {
      // grab all the aggros for this enemy for reference.
      const aggros = enemy.getAllAggros();

      // if there are no aggros, then this enemy has no aggro for the party.
      if (aggros.length === 0) return false;

      // return whether or not there are active aggros for a living actor.
      return aggros.some(aggro => aggro.isForLivingActor());
    });

    // one or more of the enemies has active aggro on the party.
    if (hasAggroOnParty) return true;

    // nobody has aggro on the party.
    return false;
  }

  //endregion get battlers

  //region manage battlers
  /**
   * Adds a battler to tracking.
   * @param {JABS_Battler} battler The battler to add to tracking.
   */
  static addOrUpdateBattler(battler)
  {
    // grab the key, aka the uuid of the battler.
    const key = battler.getUuid();

    // check if the battler already is being tracked.
    if (this.battlers.has(key))
    {
      // if it is, just update the battler data.
      this.updateBattler(key, battler);
    }
    // the battler isn't being tracked.
    else
    {
      // just add the battler anew.
      this.addBattler(battler);
    }
  }

  /**
   * Adds a battler to tracking based on the battler's own uuid.
   * @param {JABS_Battler} battler The battler to add to tracking.
   */
  static addBattler(battler)
  {
    // grab the key, aka the uuid of the battler.
    const key = battler.getUuid();

    // update the battler key with the newest battler.
    this.battlers.set(key, battler);
  }

  /**
   * Updates a given key in the battler tracking with new battler data.
   * @param {string} key The key of the battler to replace the slot of.
   * @param {JABS_Battler} battler The updated battler data.
   */
  static updateBattler(key, battler)
  {
    // update the battler key with the newest battler.
    this.battlers.set(key, battler);
  }

  /**
   * Adds a collection of battlers to tracking.
   * @param {JABS_Battler} battlers The battler to add to tracking.
   */
  static addOrUpdateBattlers(battlers)
  {
    battlers.forEach(this.addOrUpdateBattler, this);
  }

  /**
   * Removes a battler from tracking.
   * @param {JABS_Battler} battler The battler to remove from tracking.
   */
  static removeBattler(battler)
  {
    // grab the key, aka the uuid of the battler.
    const key = battler.getUuid();

    // check if the battler is currently being tracked.
    if (this.battlers.has(key))
    {
      // remove battler from tracking.
      this.battlers.delete(key);
    }
  }

  /**
   * Removes a collection of battlers from tracking.
   * @param {JABS_Battler[]} battlers The battler to remove from tracking.
   */
  static removeBattlers(battlers)
  {
    battlers.forEach(this.removeBattler, this);
  }

  /**
   * Clears the currently tracked battlers.
   */
  static clearBattlers()
  {
    this.battlers.clear();
  }

  /**
   * Converts an event into an enemy if possible.
   * @param {Game_Event} event The event to potentially convert.
   * @returns {JABS_Battler|null} A battler if the event had one available, null otherwise.
   */
  static convertEventToBattler(event)
  {
    // verify we can conver the event to a battler.
    if (!this.canConvertEventToBattler(event))
    {
      // if the battler has no id, it is likely being hidden/transformed to non-battler.
      event.setJabsBattlerUuid(String.empty);

      // null is the default for non-enemies.
      return null;
    }

    // create the underlying battler associated with the event.
    const battler = new Game_Enemy(event.getBattlerId(), null, null);

    // create the battler with the new data.
    const jabsBattler = new JABS_Battler(event, battler, event.getBattlerCoreData());

    // update the battler with the latest uuid.
    event.setJabsBattlerUuid(jabsBattler.getUuid());

    // execute any post conversion mutation necessary.
    this.postConvertMutate(battler, jabsBattler);

    // if there is something affecting max hp- such as natural growths- they should be fully healed on-creation.
    battler.recoverAll();

    // return the newly created battler.
    return jabsBattler;
  }

  /**
   * A hook for mutating the {@link Game_Enemy} or the {@link JABS_Battler} after binding.
   * @param {Game_Enemy} battler The enemy battler that was converted from the event.
   * @param {JABS_Battler} jabsBattler The created JABS battler from the event.
   */
  // eslint-disable-next-line no-unused-vars
  static postConvertMutate(battler, jabsBattler)
  {
    // hook for mutation.
  }

  /**
   * Converts a collection of events into enemies if possible.
   * @param {Game_Event[]} events The events to potentially convert to battlers.
   * @returns {JABS_Battler[]} The converted collection of battlers (possibly empty).
   */
  static convertEventsToBattlers(events)
  {
    return events
      .map(event => this.convertEventToBattler(event))
      .filter(event => !!event);
  }

  /**
   * Determines whether or not the event can be converted into a battler.
   * @param {Game_Event} event The event to potentially convert.
   * @returns {boolean} True if the event is convertable, false otherwise.
   */
  static canConvertEventToBattler(event)
  {
    // if the event isn't a JABS battler, then don't try to convert it.
    if (!event.isJabsBattler()) return false;

    // convert it!
    return true;
  }

  /**
   * Converts a collection of followers into allies if possible.
   * @param {Game_Follower[]} followers The followers to potentially convert to battlers.
   * @returns {JABS_Battler[]} The converted collection of battlers (possibly empty).
   */
  static convertFollowersToBattlers(followers)
  {
    return followers
      .map(this.convertFollowerToBattler, this)
      .filter(follower => !!follower);
  }

  /**
   * Converts an follower into an ally if possible.
   * @param {Game_Follower} follower The follower to potentially convert.
   * @returns {JABS_Battler|null} A battler if the follower had one available, null otherwise.
   */
  static convertFollowerToBattler(follower)
  {
    // verify we can conver the follower to a battler.
    if (!this.canConvertFollowerToBattler(follower))
    {
      // null is the default.
      return null;
    }

    // grab the battler of the follower.
    const battler = follower.actor();

    // create a builder to step through for this battler.
    const builder = JABS_BattlerCoreData.Builder();

    // set the battler.
    builder.setBattler(battler);

    // check if we're using the danger indicators.
    if (J.ABS.EXT.DANGER)
    {
      // never show the danger indicator for allies.
      builder.setShowDangerIndicator(false);
    }

    // build the core data.
    const coreData = builder.build();

    // instantiate the battler.
    const jabsBattler = new JABS_Battler(follower, battler, coreData);

    // assign the map battler to the follower.
    follower.setJabsBattlerUuid(jabsBattler.getUuid());

    // return the built ally map battler.
    return jabsBattler;
  }

  /**
   * Determines whether or not the follower can be converted into a battler.
   * @param {Game_Follower} follower The follower to potentially convert.
   * @returns {boolean} True if the follower is convertable, false otherwise.
   */
  static canConvertFollowerToBattler(follower)
  {
    // If the follower has an actor bound, we should convert it regardless of transient visibility.
    // Party-cycling can momentarily flip visibility; do not block creation of the battler.
    const hasActor = !!follower.actor();
    if (!hasActor) return false;

    // convert it!
    return true;
  }

  //endregion manage battlers

  //region spatial indexing
  /**
   * Rebuilds the tile-based spatial index for all tracked battlers.
   * Should be called once per frame after battlers move and before action collisions.
   */
  static rebuildSpatialIndex()
  {
    // reset the spatial index for this frame.
    this.spatialIndex.clear();

    // grab all battlers currently tracked.
    const allBattlers = this.getAllBattlers();

    // index each battler by the tile they occupy.
    allBattlers.forEach(battler =>
    {
      // get the tile coordinates for this battler.
      const x = Math.floor(battler.getX());
      const y = Math.floor(battler.getY());

      // build the spatial key for this tile.
      const key = this._spatialKey(x, y);

      // get the existing bucket for this cell.
      let bucket = this.spatialIndex.get(key);

      // if there is no bucket yet, create one.
      if (!bucket)
      {
        bucket = new Set();
        this.spatialIndex.set(key, bucket);
      }

      // add the battler to this cell's bucket.
      bucket.add(battler);
    });
  }

  /**
   * Queries the spatial grid for battlers overlapping the inclusive AABB in tile-space.
   * Returns candidates de-duplicated across all covered cells.
   * @param {number} minX The minimum tile x.
   * @param {number} minY The minimum tile y.
   * @param {number} maxX The maximum tile x.
   * @param {number} maxY The maximum tile y.
   * @returns {JABS_Battler[]} The candidate battlers.
   */
  static queryBattlersInAabb(minX, minY, maxX, maxY)
  {
    // normalize the bounds to integers and proper ordering.
    const x0 = Math.floor(Math.min(minX, maxX));
    const y0 = Math.floor(Math.min(minY, maxY));
    const x1 = Math.floor(Math.max(minX, maxX));
    const y1 = Math.floor(Math.max(minY, maxY));

    // collect candidates from each cell within the bounds.
    const result = new Set();

    // iterate the grid rows.
    for (let y = y0; y <= y1; y++)
    {
      // iterate the grid columns.
      for (let x = x0; x <= x1; x++)
      {
        // get the bucket for this cell.
        const bucket = this.spatialIndex.get(this._spatialKey(x, y));

        // add all battlers in the bucket if present.
        if (bucket)
        {
          bucket.forEach(b => result.add(b));
        }
      }
    }

    // return the result as a proper array.
    return Array.from(result);
  }

  /**
   * Builds a stable key for a tile cell based on x,y.
   * @param {number} x The tile x.
   * @param {number} y The tile y.
   * @returns {string} The key in the form "x,y".
   */
  static _spatialKey(x, y)
  {
    // build the key using the coordinates.
    return `${x},${y}`;
  }

  //endregion spatial indexing

  //region update loop
  /**
   * Handles updating all the logic of the JABS engine.
   */
  static update()
  {
    // check if the AI manager can execute.
    if (!this.canUpdate()) return;

    // execute AI management.
    this.manageAi();
  }

  /**
   * Whether or not the ai manager can process an update.
   * @return {boolean} True if the manager can update, false otherwise.
   */
  static canUpdate()
  {
    // do not manage if the engine is paused.
    if ($jabsEngine.absPause) return false;

    // do not manage if the message window is up.
    if ($gameMessage.isBusy()) return false;

    // do not manage if the map is handling an event.
    if ($gameMap.isEventRunning()) return false;

    // update!
    return true;
  }

  /**
   * Define whether or not the player is engaged in combat with any of the current battlers.
   */
  static manageAi()
  {
    // grab all available battlers within a fixed range.
    const battlers = this.getAllBattlersWithinRangeSortedByDistance(
      $jabsEngine.getPlayer1(),
      J.ABS.Metadata.MaxAiUpdateRange
    );

    // if we have no battlers, then do not process AI.
    if (!battlers.length) return;

    // iterate over each battler available.
    battlers.forEach(this.handleBattlerAi, this);
  }

  /**
   * Handles the AI management of this battler.
   * @param {JABS_Battler} battler The battler to potentially handle AI of.
   */
  static handleBattlerAi(battler)
  {
    // check if we can manage the AI of this battler.
    if (!this.canManageAi(battler)) return;

    // execute the AI loop for this battler.
    this.executeAi(battler);
  }

  /**
   * Determines whether or not this battler can have its AI managed.
   * @param {JABS_Battler} battler The battler to check if AI is manageable.
   * @returns {boolean} True if the AI should be managed, false otherwise.
   */
  static canManageAi(battler)
  {
    // do not manage dead battlers.
    if (battler.isDead()) return false;

    // do not manage the player.
    if (battler.isPlayer()) return false;

    // do not manage inanimate battlers.
    if (battler.isInanimate()) return false;

    // invisible followers are not combat-eligible; the battler object persists for party cycling,
    // but AI should not tick while the follower is hidden.
    if (battler.isFollower() && battler.getCharacter().isVisible() === false) return false;

    // manage that AI!
    return true;
  }

  /**
   * Executes the interactions specified by the combination of the AI mode bits.
   * @param {JABS_Battler} battler The battler executing on the AI mode.
   */
  static executeAi(battler)
  {
    // no AI is executed when waiting.
    if (battler.isWaiting()) return;

    // drop ally guard when idle, missing guard skill, or threat disappeared while engaged.
    this.releaseAllyCombatGuardIfStale(battler);

    // if the battler is engaged, then do AI things.
    if (battler.isEngaged())
    {
      // adjust the targets based on aggro and presence.
      battler.adjustTargetByAggro();

      // if we are no longer engaged due to removing dead aggros, then stop.
      if (!battler.isEngaged()) return;

      // guardian role: override the current target if a nearby ward is under attack.
      if (battler.getBattlerRole().guardian)
      {
        this.applyGuardianTargeting(battler);
      }

      // don't try to idle while engaged.
      battler.setIdle(false);

      // defensive interrupt: near opposing pressure can preempt the normal phase work for this tick.
      if (this.tryDefensiveInterrupt(battler)) return;

      // raise held guard after dodge priority when pressure exists (followers only).
      this.tryRaiseAllyCombatGuard(battler);

      // determine the phase and perform actions accordingly.
      const phase = battler.getPhase();
      switch (phase)
      {
        case 1:
          this.aiPhase1(battler);
          break;
        case 2:
          this.aiPhase2(battler);
          break;
        case 3:
          this.aiPhase3(battler);
          break;
        default:
          this.aiPhase0(battler);
          break;
      }
    }
    else
    {
      // guardian role: proactively engage if a nearby ward is under attack while idle.
      if (battler.getBattlerRole().guardian)
      {
        this.applyGuardianTargeting(battler);
      }

      // the battler is not engaged, instead just idle about.
      this.aiPhase0(battler);
    }
  }

  //region guardian
  /**
   * Applies guardian-role targeting for the given battler.
   * If a nearby allied ward is under attack, this guardian redirects its focus to that attacker.
   * When not yet engaged, the guardian will engage the attacker directly.
   * Falls through silently when no ward attacker is found.
   * @param {JABS_Battler} battler The guardian battler to retarget.
   */
  static applyGuardianTargeting(battler)
  {
    const attacker = this.getGuardianWardAttacker(battler);

    // no one is threatening a nearby ward; nothing to do.
    if (!attacker) return;

    // if the guardian isn't yet engaged, engage the attacker.
    if (battler.isEngaged() === false)
    {
      battler.engageTarget(attacker);
      return;
    }

    // guardian is already engaged; redirect to the ward's attacker.
    // only show the anger balloon when the target is actually changing.
    if (battler.getTarget() !== attacker)
    {
      battler.showBalloon(J.ABS.Balloons.Anger);
    }

    battler.setTarget(attacker);
  }

  /**
   * Scans for the first opposing battler that is currently targeting a ward-role ally
   * within this guardian's sight range.
   * @param {JABS_Battler} guardian The guardian battler performing the scan.
   * @returns {JABS_Battler|null} The attacker of the nearest ward, or null if none is found.
   */
  static getGuardianWardAttacker(guardian)
  {
    // use explicit guard range if available; otherwise limit the scan to the guardian's sight radius.
    const guardRange = guardian.getGuardRange();
    const scanRange = guardRange !== null ? guardRange : guardian.getSightRadius();

    // gather allied battlers within scan range and filter to those with the ward role.
    const nearbyWards = this.getAlliedBattlersWithinRange(guardian, scanRange)
      .filter(ally => ally.getBattlerRole().ward);

    // no wards nearby means nothing to protect.
    if (nearbyWards.length === 0) return null;

    // gather all opposing battlers once to avoid repeated calls.
    const enemies = this.getOpposingBattlers(guardian);

    // find the first enemy whose current target is one of the nearby wards.
    for (const ward of nearbyWards)
    {
      const wardUuid = ward.getUuid();
      const attacker = enemies.find(enemy =>
      {
        const enemyTarget = enemy.getTarget();
        return enemyTarget && enemyTarget.getUuid() === wardUuid;
      });

      if (attacker) return attacker;
    }

    // no ward is currently being attacked.
    return null;
  }
  //endregion guardian

  //endregion update loop

  //region Phase 0 - Idle Phase
  /**
   * The zero-th phase, when the battler is not engaged- it's idle action.
   * @param {JABS_Battler} battler The battler executing this phase of the AI.
   */
  static aiPhase0(battler)
  {
    // if the battler cannot idle, then do not idle.
    if (!battler.canIdle()) return;

    // grab whether or not the battler is currently idle.
    const isIdle = battler.isIdle();

    // check if the battler is currently not in-motion.
    if (battler.getCharacter()
      .isStopping())
    {
      // check if the battler is alerted.
      if (battler.isAlerted())
      {
        // if stopped and alerted, then go try to find the one triggering the alert.
        this.seekForAlerter(battler);
      }
      // check if we aren't idle, and also aren't home.
      else if (!isIdle && !battler.isHome())
      {
        // try to go back towards the home coordinates.
        this.goHome(battler);
      }
      // check if we are idle (implicitly also home)
      else if (isIdle)
      {
        // move about idly.
        this.moveIdly(battler);
      }
    }
  }

  /**
   * If a battler is idle but alerted, then they will try to seek out what
   * disturbed their idling.
   * @param {JABS_Battler} battler The battler seeking for the alerter.
   */
  static seekForAlerter(battler)
  {
    // grab the x:y coordinates that we last "heard" the one triggering the alert from.
    const [ alertX, alertY ] = battler.getAlertedCoordinates();

    // attempt to move intelligently towards those coordiantes.
    battler.smartMoveTowardCoordinates(alertX, alertY);
  }

  /**
   * Progresses the battler towards their home coordinates.
   * @param {JABS_Battler} battler The battler going home.
   */
  static goHome(battler)
  {
    // grab the character of the battler trying to go home.
    const character = battler.getCharacter();

    // determine the next direction to face when going home.
    const nextDir = character.findDirectionTo(battler.getHomeX(), battler.getHomeY());

    // take a step in the right direction.
    character.moveStraight(nextDir);

    // check if we've made it home.
    if (battler.isHome())
    {
      // flag this battler as being idle.
      battler.setIdle(true);
    }
  }

  /**
   * Executes whatever the idle action is for this battler.
   * @param {JABS_Battler} battler The battler moving idly.
   */
  static moveIdly(battler)
  {
    // if we're not able to move idly, then do not.
    if (!this.canMoveIdly(battler)) return;

    // grab the character of the battler.
    const character = battler.getCharacter();

    // check if they are "close" to their home point.
    if (JABS_Battler.isClose(battler.distanceToHome()))
    {
      // move randomly.
      character.moveRandom();
    }
    // they are not "close" to their home point.
    else
    {
      // determine the direction to face to move towards home.
      const nextDir = character.findDirectionTo(battler.getHomeX(), battler.getHomeY());

      // move towards home.
      character.moveStraight(nextDir);
    }

    // reset the idle action counter.
    battler.resetIdleAction();
  }

  /**
   * Determiens whether or not this battler can move idly.
   * @param {JABS_Battler} battler The battler trying to move idly.
   * @returns {boolean} True if this battler can movie idly, false otherwise.
   */
  static canMoveIdly(battler)
  {
    // if we're not able to move idly, then do not.
    if (!battler.isIdleActionReady()) return false;

    // we idle about infrequently.
    if (!this.shouldMoveIdly()) return false;

    // idle about!
    return true;
  }

  /**
   * Determines whether or not RNG favored this battler to move.
   * @returns {boolean} True if we should take a step, false otherwise.
   */
  static shouldMoveIdly()
  {
    // roll a d100.
    const chance = (Math.randomInt(100) + 1);

    // need a nat100 to move.
    const shouldMove = (chance === 100);

    // to move or not to move?
    return shouldMove;
  }

  //endregion Phase 0 - Idle Phase

  //region Phase 1 - Pre-Action Movement Phase
  /**
   * Phase 1 for AI is the phase where the battler will count down its "prepare" timer.
   * While in this phase, the battler will make an effort to maintain a "safe" distance
   * from its current target.
   * @param {JABS_Battler} battler The battler executing this phase of the AI.
   */
  static aiPhase1(battler)
  {
    // check if the battler has their prepare timer ready for action.
    // if this battler is a follower that has a leader, it will automatically proceed.
    if (this.canTransitionToPhase2(battler))
    {
      // move to the next phase of AI.
      this.transitionToPhase2(battler);

      // stop processing.
      return;
    }

    // check if the battler is able to move and isn't moving.
    if (this.canDecidePhase1Movement(battler))
    {
      // move around as-necessary.
      this.decideAiMovement(battler);
    }

    // otherwise, we must be processing a movement command from before.
  }

  /**
   * Determines whether or not this battler is ready to transition to AI phase 2.
   * @param {JABS_Battler} battler The battler to transition.
   * @returns {boolean} True if this battler should transition, false otherwise.
   */
  static canTransitionToPhase2(battler)
  {
    // check if the battler has decided an action yet.
    if (!battler.isActionReady()) return false;

    // move to phase 2!
    return true;
  }

  /**
   * Transitions this battler to AI phase 2, action decision and repositioning.
   * @param {JABS_Battler} battler The battler to transition.
   */
  static transitionToPhase2(battler)
  {
    // move to the next phase of AI.
    battler.setPhase(2);
  }

  /**
   * Determines whether or not this battler can perform pre-action movement.
   * @param {JABS_Battler} battler The battler to move.
   * @returns {boolean} True if this battler should move, false otherwise.
   */
  static canDecidePhase1Movement(battler)
  {
    // check if the battler is currently moving.
    if (battler.getCharacter()
      .isMoving())
    {
      return false;
    }

    // check if the battler is unable to move.
    if (!battler.canBattlerMove()) return false;

    // move!
    return true;
  }

  /**
   * Moves the battler around in an effort to maintain a "comfortable" distance
   * away from their current target.
   * @param {JABS_Battler} battler The battler deciding movement strategy.
   */
  static decideAiMovement(battler)
  {
    // check if the distance is invalid or too great.
    if (this.shouldDisengageTarget(battler))
    {
      // just give up on this target.
      battler.disengageTarget();

      // stop processing.
      return;
    }

    // check if the battler is "close".
    this.maintainSafeDistance(battler);

    // always turn toward the target during movement.
    // with pixel movement, moveStraight is called every frame and setDirection
    // keeps facing current regardless; a random non-turn here is cosmetically
    // misleading without meaningful gameplay effect. the anti-parry roll has
    // been moved to execution time where it actually controls fire direction.
    battler.turnTowardTarget();
  }

  /**
   * Determines whether or not this battler should disengage from its target
   * due to distancing concerns.
   * @param {JABS_Battler} battler The battler to disengage.
   * @returns {boolean} True if this battler needs to disengage, false otherwise.
   */
  static shouldDisengageTarget(battler)
  {
    // calculate the distance to this battler's current target.
    const distance = battler.distanceToCurrentTarget();

    // check if the distance is invalid.
    if (distance === null) return true;

    // guardian role: effective pursuit respects <guardRange> or the max ward pursuit fallback.
    // this is evaluated before the hard cap since guard ranges can exceed it intentionally.
    if (battler.getBattlerRole().guardian)
    {
      return distance > this.getGuardianEffectivePursuitRadius(battler);
    }

    // check if the distance arbitrarily is too great.
    if (distance > 20) return true;

    // check if the distance is outside of the pursuit radius of this battler.
    if (battler.getPursuitRadius() < distance) return true;

    // sentinel role: disengage once the target leaves the sentinel's home sight radius.
    if (battler.getBattlerRole().sentinel && this.hasSentinelTargetExceededHomeRange(battler)) return true;

    // do not disengage.
    return false;
  }

  /**
   * Computes the effective pursuit radius for a guardian-role battler.
   * If the guardian has an explicit `<guardRange:N>` tag, that value is used directly.
   * Otherwise, the result is the larger of the guardian's own pursuit radius and the greatest
   * pursuit radius among all allied ward-role battlers currently on the map.
   * @param {JABS_Battler} guardian The guardian battler to evaluate.
   * @returns {number} The effective pursuit radius the guardian should honor.
   */
  static getGuardianEffectivePursuitRadius(guardian)
  {
    // explicit tag takes priority over any calculated fallback.
    const guardRange = guardian.getGuardRange();
    if (guardRange !== null) return guardRange;

    // fallback: use the guardian's own pursuit or the largest ward pursuit, whichever is greater.
    const allAllies = this.getAlliedBattlers(guardian);
    const maxWardPursuit = allAllies
      .filter(ally => ally.getBattlerRole().ward)
      .reduce((max, ward) => Math.max(max, ward.getPursuitRadius()), 0);

    return Math.max(guardian.getPursuitRadius(), maxWardPursuit);
  }

  /**
   * Determines whether or not a sentinel battler's current target has left the sentinel's home range.
   * Sentinels hold their home position and refuse to pursue targets that escape that zone.
   * Pursuit radius is used (not sight) so the sentinel stays engaged while the target retreats
   * within normal chase distance, matching standard engage/disengage semantics anchored to home.
   * @param {JABS_Battler} battler The sentinel battler to evaluate.
   * @returns {boolean} True if the target is beyond the sentinel's home pursuit radius, false otherwise.
   */
  static hasSentinelTargetExceededHomeRange(battler)
  {
    const target = battler.getTarget();

    // no target means nothing to chase; treat as exceeded to trigger disengage.
    if (!target) return true;

    // measure how far the target is from this sentinel's home coordinates.
    const distanceFromHome = target.distanceToPoint(battler.getHomeX(), battler.getHomeY());

    // disengage when the target has left the home pursuit zone.
    return distanceFromHome > battler.getPursuitRadius();
  }

  /**
   * This battler will attempt to keep a "safe" distance of not-too-far and
   * not-too-close to its target.
   * @param {JABS_Battler} battler The battler to do the distancing.
   */
  static maintainSafeDistance(battler)
  {
    // calculate the distance to this battler's current target.
    const distance = battler.distanceToCurrentTarget();

    // if we are safe, then do nothing.
    if (JABS_Battler.isSafe(distance)) return;

    switch (true)
    {
      case JABS_Battler.isClose(distance):
        battler.smartMoveAwayFromTarget();
        break;
      case JABS_Battler.isFar(distance):
        battler.smartMoveTowardTarget();
        break;
    }
  }

  //endregion Phase 1 - Pre-Action Movement Phase

  //region Phase 2 - Execute Action Phase
  /**
   * Phase 2 for AI is the phase where the battler will decide and execute its action.
   * While in this phase, the battler will decide its action, and attempt to move
   * into the required range to execute the action if necessary and execute it.
   * @param {JABS_Battler} battler The ai battler being managed.
   */
  static aiPhase2(battler)
  {
    // check if the distance is invalid or too great.
    if (this.shouldDisengageTarget(battler))
    {
      // just give up on this target.
      battler.disengageTarget();

      // stop processing.
      return;
    }

    // check if the battler has decided their action yet.
    if (this.needsActionDecision(battler))
    {
      // make a decision about what to do.
      this.decideAiPhase2Action(battler);

      // stop processing.
      return;
    }

    // check if we need to reposition.
    if (this.needsRepositioning(battler))
    {
      // move into a better position based on the decided action.
      this.decideAiPhase2Movement(battler);

      // stop processing.
      return;
    }

    // check if we're ready to execute actions.
    if (this.needsActionExecution(battler))
    {
      // execute the decided action.
      this.executeAiPhase2Action(battler);
    }
  }

  /**
   * Determines whether or not this battler needs to decide an action.
   * @param {JABS_Battler} battler The battler to decide an action.
   * @returns {boolean} True if this battler needs to decide, false otherwise.
   */
  static needsActionDecision(battler)
  {
    // check if the battler has not yet decided an action.
    if (!battler.isActionDecided()) return true;

    // battler already has already made a decision.
    return false;
  }

  /**
   * Determines whether or not this battler needs to get into position.
   * @param {JABS_Battler} battler The battler to reposition.
   * @returns {boolean} True if this battler needs to move, false otherwise.
   */
  static needsRepositioning(battler)
  {
    // if the battler is casting, then they can't do repositioning things.
    if (battler.isCasting()) return false;

    // if we are already in position, then we don't need repositioning.
    if (battler.isInPosition()) return false;

    // if the battler is moving, then they can't do repositioning things.
    if (battler.getCharacter()
      .isMoving())
    {
      return false;
    }

    // if we can't even move, we aren't able to reposition.
    if (!battler.canBattlerMove()) return false;

    // we need repositioning!
    return true;
  }

  /**
   * Determines whether or not this battler needs to execute queued actions.
   * @param {JABS_Battler} battler The battler to take action.
   * @returns {boolean} True if this battler needs to take action, false otherwise.
   */
  static needsActionExecution(battler)
  {
    // check if this battler has decided on an action to take.
    if (!battler.isActionDecided()) return false;

    // check if this battler is in position.
    if (!battler.isInPosition()) return false;

    // check if the battler is still casting.
    if (battler.isCasting()) return false;

    // we need action!
    return true;
  }

  /**
   * Execute the decided queued actions for this battler.
   * @param {JABS_Battler} battler The battler to take action.
   */
  static executeAiPhase2Action(battler)
  {
    // face the target and re-orient the volley to the fresh facing.
    // anti-parry protection is provided by cast time: the enemy commits a
    // direction when the cast begins, giving the player the cast window to
    // read the angle and dodge or parry. skills with zero cast time fire
    // instantly and are not intended to be parried.
    battler.turnTowardTarget();
    this.restampActionDirections(battler);

    // destructure the primary action from the decided actions.
    const [ action, ] = battler.getDecidedAction();
    if (!action) return;

    // check if this action is already cast.
    if (action.isCastComplete())
    {
      // execute the queued action(s) now that we are in position and not casting.
      battler.processQueuedActions();

      // force a brief wait after executing to prevent immediate re-action.
      battler.setWaitCountdown(15);

      // switch to cooldown phase.
      battler.setPhase(3);

      // stop processing.
      return;
    }

    // if we are currently casting, then do not process further.
    if (battler.isCasting()) return;

    // start the cast timer.
    battler.setCastCountdown(action.getCastTime());
  }

  /**
   * Re-orients the decided action volley to the battler's current facing direction.
   * The spoke pattern (formation + count) is re-derived from the primary action's
   * skill and rotated around the fresh facing so the volley reflects the actual
   * target position at fire time, not the position captured at decision time.
   * @param {JABS_Battler} battler The battler whose decided actions should be re-stamped.
   */
  static restampActionDirections(battler)
  {
    // grab the decided actions; nothing to do if empty.
    const decidedActions = battler.getDecidedAction();
    if (!decidedActions || decidedActions.length === 0) return;

    // derive formation and count from the primary action's skill.
    const [ primaryAction ] = decidedActions;
    const skill = battler.getSkill(primaryAction.getBaseSkill().id);
    const formation = $jabsEngine.resolveProjectileFormationForSkill(skill);
    const projectileCount = $jabsEngine.resolveProjectileCountForSkill(skill);

    // compute spoke directions from the fresh facing (AI aims at its target when possible).
    const freshFacing = this.deriveFreshFacingForAi(battler);
    const freshDirections = $jabsEngine.determineActionDirections(freshFacing, formation, projectileCount);

    // stamp each action with its corresponding fresh spoke direction.
    decidedActions.forEach((action, index) =>
    {
      // only stamp if a direction exists for this spoke index.
      if (freshDirections[index] !== undefined)
      {
        action.setFacing(freshDirections[index]);
      }
    });
  }

  /**
   * The battler decides what action to execute.
   * @param {JABS_Battler} battler The battler deciding the actions.
   */
  static decideAiPhase2Action(battler)
  {
    this.decideEnemyAiPhase2Action(battler);
  }

  /**
   * The enemy battler decides what action to take.
   * Coordination roles are resolved here before delegating to the AI's skill selection.
   * @param {JABS_Battler} battler The enemy battler deciding the action.
   */
  static decideEnemyAiPhase2Action(battler)
  {
    const role = battler.getBattlerRole();

    // solo battlers skip all coordination and go straight to skill selection.
    // leaders coordinate their followers before deciding their own action.
    if (role.leader && !role.solo)
    {
      battler.getAiMode().decideActionsForFollowers(battler);
    }

    // followers defer to their leader; if no leader is ready they basic attack.
    if (role.follower && !role.leader && !role.solo)
    {
      const followerPicks = battler.getAiMode().decideFollowerAi(battler);
      if (followerPicks.length === 0 || !this.isSkillIdValid(followerPicks[0]))
      {
        this.cancelActionSetup(battler);
        return;
      }

      const [followerSkillId] = followerPicks;
      const followerSkill = battler.getSkill(followerSkillId);
      if (!followerSkill)
      {
        this.cancelActionSetup(battler);
        return;
      }

      const followerCooldownKey = this.buildEnemyCooldownType(followerSkill);
      this.setupActionForNextPhase(battler, followerSkillId, followerCooldownKey);
      return;
    }

    // use the battler's AI to decide the skill.
    const decidedPicks = battler
      .getAiMode()
      .decideAction(battler, battler.getTarget(), battler.getSkillIdsFromEnemy());

    // validate the skill chosen.
    if (decidedPicks.length === 0 || !this.isSkillIdValid(decidedPicks[0]))
    {
      // cancel the setup.
      this.cancelActionSetup(battler);

      // stop processing.
      return;
    }

    const [decidedSkillId] = decidedPicks;

    // construct the skill from the battler's perspective.
    const skill = battler.getSkill(decidedSkillId);

    // check to make sure we actually constructed a skill.
    if (!skill)
    {
      // cancel the setup if we decided on nothing.
      this.cancelActionSetup(battler);

      // stop processing.
      return;
    }

    // build the cooldown from the skill.
    const cooldownKey = this.buildEnemyCooldownType(skill);

    // setup the skill for use.
    this.setupActionForNextPhase(battler, decidedSkillId, cooldownKey);
  }

  /**
   * Determines whether or not the parameter provided is a valid skill id.
   * @param {number|number[]|null} skillId The skill id or ids to validate.
   * @returns {boolean} True if it is a single skill id, false otherwise.
   */
  static isSkillIdValid(skillId)
  {
    // if the skill id is something falsy like 0/null/undefined, not valid.
    if (!skillId) return false;

    // if the skill id somehow managed to become many skill ids, not valid.
    if (Array.isArray(skillId)) return false;

    // skill id is valid!
    return true;
  }

  /**
   * Sets up the battler and the action in preparation for the next phase.
   * @param {JABS_Battler} battler The battler performing the action.
   * @param {number} skillId The id of the skill to perform the action for.
   * @param {string} cooldownKey The type of cooldown to set to the action.
   */
  static setupActionForNextPhase(battler, skillId, cooldownKey)
  {
    // check if we can setup this action.
    if (!this.canSetupActionForNextPhase(battler, skillId))
    {
      // cancel the action setup.
      this.cancelActionSetup(battler);

      // do not process.
      return;
    }

    // build action options; try to snapshot location for direct skills unless <directLock>.
    const skill = battler.getSkill(skillId);
    const optionsBuilder = JABS_ActionOptions.Builder()
      .setCooldownKey(cooldownKey);

    if (skill.jabsDirect && !skill.jabsDirectLock)
    {
      // capture [x,y] at decision time.
      const [ x, y ] = battler.resolveDirectActionTargetCoordinatesForSkill(skill);

      // if we got a coordinate, embed it.
      if (x !== null && y !== null)
      {
        const frozen = JABS_Location.Builder()
          .setX(x)
          .setY(y)
          .build();
        optionsBuilder.setLocation(frozen);
      }
    }

    // finalize options.
    const actionOptions = optionsBuilder.build();

    // generate the actions based on the given skill id.
    const actions = battler.createJabsActionFromSkill(skillId, actionOptions);

    // set the cooldown type for all actions.
    actions.forEach(action => action.setCooldownType(cooldownKey));

    // destructure the "primary" action out.
    const [ action, ] = actions;

    // perform the execution animation.
    this.performExecutionAnimation(battler, action);

    // set the decided action.
    battler.setDecidedAction(actions);
  }

  /**
   * Constructs a cooldown key based on the skill.
   * @param {RPG_Skill} skill The chosen skill to determine a cooldown type for.
   * @returns {string} The cooldown key.
   */
  static buildEnemyCooldownType(skill)
  {
    return `${skill.id}-${skill.name}`;
  }

  /**
   * Determines whether or not the given skill can be transformed into an action
   * by the given battler.
   * @param {JABS_Battler} battler The battler performing the action.
   * @param {number} skillId The id of the skill to perform the action for.
   * @returns {boolean} True if we can setup an action with this skill id, false otherwise.
   */
  static canSetupActionForNextPhase(battler, skillId)
  {
    // check if we even have a skill to setup.
    if (!skillId) return false;

    // check if this battler can execute this skill.
    if (!battler.canExecuteSkill(skillId)) return false;

    // setup the action!
    return true;
  }

  /**
   * Cancel the setup process for this battler.
   * @param {JABS_Battler} battler The battler canceling the action.
   */
  static cancelActionSetup(battler)
  {
    // set the decided action to null.
    battler.setDecidedAction(null);

    // if we can't setup this skill for some reason, then wait before trying again.
    battler.setWaitCountdown(20);
  }

  /**
   * Performs a brief animation to indicate that the battler has decided an action.
   * The animation depends on whether or not the action was a support action or not.
   * @param {JABS_Battler} battler The battler performing the action.
   * @param {JABS_Action} action The action used to gauge which animation to show.
   */
  static performExecutionAnimation(battler, action)
  {
    // check if this action is a support action.
    if (action.isSupportAction())
    {
      // show the "support decision" animation on the battler.
      battler.showAnimation(J.ABS.Metadata.SupportDecidedAnimationId);
    }
    // the action is not a support action.
    else
    {
      // show the "attack decision" animation on the battler.
      battler.showAnimation(J.ABS.Metadata.AttackDecidedAnimationId);
    }
  }

  /**
   * The battler attempts to move into a position where they can execute
   * their decided skill and land a hit.
   * @param {JABS_Battler} battler The battler trying to get into position.
   */
  static decideAiPhase2Movement(battler)
  {
    // check if we can actually perform phase 2 movement.
    if (!this.canPerformPhase2Movement(battler)) return;

    // check if we need to move closer.
    if (this.needsToMoveCloser(battler))
    {
      // get closer to the target so we can execute the skill.
      this.phase2MoveCloser(battler);
    }
    // within proximity; check lateral axis alignment for narrow directional hitboxes.
    else if (this.needsAxisAlignment(battler))
    {
      // step laterally so the target falls within the skill's effective hitbox path.
      this.phase2AlignOnAxis(battler);
    }
    // the battler is close enough and aligned.
    else
    {
      // flag this battler as in-position to execute.
      battler.setInPosition(true);
    }
  }

  /**
   * Determines whether or not this battler can (or needs to) perform ai phase 2 movement.
   * @param {JABS_Battler} battler The battler to check if movement is needed.
   * @returns {boolean} True if this battler needs to move closer, false otherwise.
   */
  static canPerformPhase2Movement(battler)
  {
    // check if this battler has decided on an action yet.
    if (!battler.isActionDecided()) return false;

    // check if we're already in position.
    if (battler.isInPosition()) return false;

    // move closer!
    return true;
  }

  /**
   * Determines whether or not to move closer in AI phase 2.
   * @param {JABS_Battler} battler The battler to check if movement is needed.
   * @returns {boolean} True if this battler needs to move closer, false otherwise.
   */
  static needsToMoveCloser(battler)
  {
    // grab the action.
    const [ action, ] = battler.getDecidedAction();

    // check if the action is self-targeting; we can cast these wherever.
    if (action.isForSelf()) return false;

    // calculate distance to target to determine if we need to get closer.
    const distanceToTarget = battler.getAllyTarget()
      ? battler.distanceToAllyTarget()
      : battler.distanceToCurrentTarget();

    // check if we are further away than the minimum proximity.
    if (distanceToTarget > action.getProximity()) return true;

    // no need to move.
    return false;
  }

  /**
   * Moves this battler closer to the relevant target.
   * @param {JABS_Battler} battler The battler to move.
   */
  static phase2MoveCloser(battler)
  {
    // check if this battler has an ally target first.
    if (battler.getAllyTarget())
    {
      // move towards the ally.
      battler.smartMoveTowardAllyTarget();
    }
    // this battler does not have an ally target.
    else
    {
      // move towards the target instead.
      battler.smartMoveTowardTarget();
    }
  }

  /**
   * Determines whether this battler needs to step laterally to align with the target
   * along the axis the decided skill's hitbox travels.
   * Only applies to narrow directional shapes: {@link J.ABS.Shapes.Line},
   * {@link J.ABS.Shapes.Wall}, and {@link J.ABS.Shapes.Arc} with a narrow degree sweep.
   * @param {JABS_Battler} battler The battler to check.
   * @returns {boolean} True if a lateral alignment step is required before firing.
   */
  static needsAxisAlignment(battler)
  {
    // grab the decided action.
    const [ action, ] = battler.getDecidedAction();

    // only narrow directional hitboxes require lateral alignment.
    const shape = action.getShape();
    const isNarrowShape = (
      shape === J.ABS.Shapes.Line ||
      shape === J.ABS.Shapes.Wall ||
      shape === J.ABS.Shapes.Arc
    );

    // self-targeting and wide shapes do not benefit from alignment.
    if (isNarrowShape === false) return false;

    // grab the relevant target (ally or enemy).
    const target = battler.getAllyTarget() ?? battler.getTarget();
    if (!target) return false;

    const bx = battler.getX();
    const by = battler.getY();
    const tx = target.getX();
    const ty = target.getY();

    // derive the perpendicular misalignment based on the dominant approach axis.
    const absDx = Math.abs(tx - bx);
    const absDy = Math.abs(ty - by);
    const misalignment = (absDx >= absDy)
      ? Math.abs(ty - by)
      : Math.abs(tx - bx);

    // compute the effective half-width tolerance for the shape.
    let tolerance;
    if (shape === J.ABS.Shapes.Arc)
    {
      // chord half-width at the arc's outer edge: range * sin(halfAngle).
      // the half-angle is clamped to 90 degrees so arcs >= 180 degrees always use the
      // full radius as tolerance, matching the geometric widest-point behavior for wide sweeps.
      const degrees = action.getDegrees();
      const clampedHalfRad = Math.min(degrees / 2, 90) * (Math.PI / 180);
      tolerance = action.getRange() * Math.sin(clampedHalfRad);
    }
    else
    {
      // line and wall use the physical tile half-thickness as their tolerance.
      tolerance = action.getThicknessTiles() / 2;
    }

    // alignment is needed when the lateral gap exceeds the shape's effective half-width.
    return misalignment > tolerance;
  }

  /**
   * Steps this battler one tile laterally toward the axis shared with its target,
   * so the decided skill's narrow hitbox will cover the target when fired.
   * Falls back to setting in-position if the lateral tile is not passable.
   * @param {JABS_Battler} battler The battler to align.
   */
  static phase2AlignOnAxis(battler)
  {
    // grab the relevant target (ally or enemy).
    const target = battler.getAllyTarget() ?? battler.getTarget();

    const bx = battler.getX();
    const by = battler.getY();
    const tx = target.getX();
    const ty = target.getY();

    const absDx = Math.abs(tx - bx);
    const absDy = Math.abs(ty - by);
    const character = battler.getCharacter();

    // for a horizontal approach, slide along Y to match the target's row;
    // for a vertical approach, slide along X to match the target's column.
    const alignX = (absDx >= absDy) ? bx : tx;
    const alignY = (absDx >= absDy) ? ty : by;

    // verify the lateral step is passable before committing.
    const direction = character.findDirectionTo(alignX, alignY);
    if (character.canPass(character.x, character.y, direction))
    {
      // step toward the aligned position.
      battler.smartMoveTowardCoordinates(alignX, alignY);
    }
    else
    {
      // tile is blocked; fire from current position rather than stalling indefinitely.
      battler.setInPosition(true);
    }
  }

  //endregion Phase 2 - Execute Action Phase

  //region Phase 3 - Post-Action Cooldown Phase
  /**
   * Phase 3 for AI is the phase where the battler is cooling down from its skill usage.
   * While in this phase, the battler will attempt to maintain a "safe" distance from
   * its current target.
   * @param {JABS_Battler} battler The battler for this AI.
   */
  static aiPhase3(battler)
  {
    // check if we are ready for a phase reset.
    if (this.canResetAiPhases(battler))
    {
      // AI loop complete, reset back to phase 1.
      this.resetAiPhases(battler);
    }
    // the battler's post-action cooldown is not finished.
    else
    {
      // check if they are able to move while cooling down.
      if (this.canPerformPhase3Movement(battler))
      {
        // move around while you're waiting for the cooldown.
        this.decideAiPhase3Movement(battler);
      }
    }
  }

  /**
   * Determines wehther or not this battler is ready to reset its AI phases.
   * @param {JABS_Battler} battler The battler to reset phases for.
   * @returns {boolean} True if the battler is ready to reset, false otherwise.
   */
  static canResetAiPhases(battler)
  {
    // check if the battler's cooldown is complete.
    if (!battler.isPostActionCooldownComplete()) return false;

    // ready for reset!
    return true;
  }

  /**
   * Resets the phases for this battler back to phase 1.
   * @param {JABS_Battler} battler The battler to reset phases for.
   */
  static resetAiPhases(battler)
  {
    // AI loop complete, reset back to phase 1.
    battler.resetPhases();
  }

  /**
   * Determines whether or not this battler can move around while waiting for
   * its AI phase reset.
   * @param {JABS_Battler} battler The battler to move.
   * @returns {boolean} True if the battler can move, false otherwise.
   */
  static canPerformPhase3Movement(battler)
  {
    // check if the battler is able to move.
    if (!battler.canBattlerMove()) return false;

    // check if the battler is currently moving.
    if (battler._event.isMoving()) return false;

    // move!
    return true;
  }

  /**
   * Decides where to move while waiting for cooldown to complete from the skill.
   * @param {JABS_Battler} battler The battler in this cooldown phase.
   */
  static decideAiPhase3Movement(battler)
  {
    // move around as-necessary.
    this.decideAiMovement(battler);
  }

  //endregion Phase 3 - Post-Action Cooldown Phase

  //region Ally defensive guard (held offhand)
  /**
   * Drops ally held guard when gear/combat state is invalid, pressure eases, or max hold elapses.
   * @param {JABS_Battler} battler The battler receiving ally AI (followers only consume raises).
   */
  static releaseAllyCombatGuardIfStale(battler)
  {
    if (!battler.isActor() || battler.isPlayer())
    {
      return;
    }

    const gb = battler.getBattler();

    // use the resolved skill id so guard-type classification matches the transformed skill.
    const guardSkillId = gb.getResolvedSkillId(JABS_Button.Offhand);

    if (!guardSkillId || !JABS_Battler.isGuardSkillById(guardSkillId))
    {
      if (battler.guarding())
      {
        battler.executeGuard(false, JABS_Button.Offhand);
      }

      return;
    }

    if (!battler.guarding())
    {
      return;
    }

    if (battler._aiAllyGuardRaiseFrame === 0)
    {
      battler._aiAllyGuardRaiseFrame = Graphics.frameCount;
    }

    const heldFrames = Graphics.frameCount - battler._aiAllyGuardRaiseFrame;

    if (heldFrames >= J.ABS.Metadata.AiAllyDefensiveGuardMaxHoldFrames)
    {
      battler.executeGuard(false, JABS_Button.Offhand);

      return;
    }

    if (!battler.isEngaged())
    {
      battler.executeGuard(false, JABS_Button.Offhand);

      return;
    }

    const closestHostile = JABS_AiManager.getClosestOpposingBattler(battler);

    if (!closestHostile || closestHostile.isDead())
    {
      battler.executeGuard(false, JABS_Button.Offhand);

      return;
    }

    const separation = battler.distanceToDesignatedTarget(closestHostile);

    if (separation === null || separation > J.ABS.Metadata.AiAllyDefensiveGuardMaintainMaxTiles)
    {
      battler.executeGuard(false, JABS_Button.Offhand);

      return;
    }

    const threat = JABS_AiManager.findDefensiveThreatBattler(battler);

    if (!threat)
    {
      battler.executeGuard(false, JABS_Button.Offhand);
    }
  }

  /**
   * Raises held guard for follower actors under the same threat footprint as defensive dodge (after dodge priority).
   * @param {JABS_Battler} battler The ally battler.
   */
  static tryRaiseAllyCombatGuard(battler)
  {
    if (!battler.isActor() || battler.isPlayer())
    {
      return;
    }

    if (!battler.isEngaged() || battler.guarding())
    {
      return;
    }

    const gb = battler.getBattler();
    const hpGate = J.ABS.Metadata.AiAllyDefensiveGuardHpThresholdPercent;

    if (hpGate < 1 && hpGate > 0 && gb.mhp > 0)
    {
      if (gb.hp / gb.mhp > hpGate)
      {
        return;
      }
    }

    // use the resolved skill id so guard-type classification matches the transformed skill.
    const guardSkillId = gb.getResolvedSkillId(JABS_Button.Offhand);

    if (!guardSkillId || !JABS_Battler.isGuardSkillById(guardSkillId))
    {
      return;
    }

    const threat = JABS_AiManager.findDefensiveThreatBattler(battler);

    if (!threat)
    {
      return;
    }

    if (Graphics.frameCount < battler._aiAllyDefensiveGuardReadyFrame)
    {
      return;
    }

    if (!RPGManager.chanceIn100(J.ABS.Metadata.AiAllyDefensiveGuardChancePercent))
    {
      return;
    }

    if (!battler.isGuardSkillByKey(JABS_Button.Offhand))
    {
      return;
    }

    const guardData = battler.getGuardData(JABS_Button.Offhand);

    if (!guardData || !guardData.canGuard())
    {
      return;
    }

    battler.executeGuard(true, JABS_Button.Offhand);
    battler._aiAllyGuardRaiseFrame = Graphics.frameCount;
    battler._aiAllyDefensiveGuardReadyFrame = Graphics.frameCount
      + J.ABS.Metadata.AiAllyDefensiveGuardCooldownFrames;
  }

  //endregion Ally defensive guard (held offhand)

  //region Defensive interrupt (MVP — AI dodge)
  /**
   * Attempts a dodge away from the most urgent nearby hostile before normal AI phase logic.
   * @param {JABS_Battler} battler The battler potentially reacting.
   * @returns {boolean} True when dodge consumed this AI tick.
   */
  static tryDefensiveInterrupt(battler)
  {
    if (!battler.isEngaged())
    {
      return false;
    }

    if (battler.isCasting())
    {
      return false;
    }

    if (battler.isDodging())
    {
      return false;
    }

    if (Graphics.frameCount < battler._aiDefensiveDodgeReadyFrame)
    {
      return false;
    }

    const threat = JABS_AiManager.findDefensiveThreatBattler(battler);

    if (!threat)
    {
      return false;
    }

    if (!RPGManager.chanceIn100(J.ABS.Metadata.AiDefensiveDodgeChancePercent))
    {
      return false;
    }

    const dodged = battler.tryExecuteAiEmergencyDodgeAwayFrom(threat);

    if (!dodged)
    {
      return false;
    }

    battler._aiDefensiveDodgeReadyFrame = Graphics.frameCount + J.ABS.Metadata.AiDefensiveDodgeCooldownFrames;
    battler.clearDecidedAction();
    battler.setInPosition(false);

    return true;
  }

  /**
   * Picks the hostile battler that should drive a defensive dodge — closest opponent in threat radius,
   * slightly biased when their map action is currently active.
   * @param {JABS_Battler} selfBattler The defender.
   * @returns {JABS_Battler|null}
   */
  static findDefensiveThreatBattler(selfBattler)
  {
    const radius = J.ABS.Metadata.AiDefensiveThreatRadiusTiles;
    const candidates = JABS_AiManager.getOpposingBattlersWithinRange(selfBattler, radius);

    if (!candidates.length)
    {
      return null;
    }

    const actions = $jabsEngine.getAllActionEvents();

    let best = null;
    let bestScore = Infinity;

    for (let i = 0; i < candidates.length; i++)
    {
      const other = candidates[i];
      let score = selfBattler.distanceToDesignatedTarget(other);

      if (score === null)
      {
        continue;
      }

      for (let j = 0; j < actions.length; j++)
      {
        const caster = actions[j].getCaster();

        if (caster === other)
        {
          score -= 0.35;
          break;
        }
      }

      if (score < bestScore)
      {
        bestScore = score;
        best = other;
      }
    }

    return best;
  }

  //endregion Defensive interrupt (MVP — AI dodge)
}

export default JABS_AiManager;
//endregion JABS_AiManager