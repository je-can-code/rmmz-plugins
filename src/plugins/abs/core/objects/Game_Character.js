//region Game_Character
import JABS_LootDrop from './../__models/JABS_LootDrop.js';
import JABS_Engine from './../managers/JABS_Engine.js';
import JABS_Battler from './../__models/JABS_Battler.js';
import JABS_AiManager from './../managers/JABS_AiManager.js';
import JABS_Action from './../__models/JABS_Action.js';
import JABS_Aabb from './../__models/JABS_Aabb.js';
/**
 * Hooks into the `Game_Character.initMembers` and adds in action sprite properties.
 */
J.ABS.Aliased.Game_Character.set('initMembers', Game_Character.prototype.initMembers);
Game_Character.prototype.initMembers = function()
{
  // perform original logic.
  J.ABS.Aliased.Game_Character.get('initMembers')
    .call(this);

  // initialize our custom members.
  this.initJabsMembers();
};

/**
 * Initialize any custom JABS properties for this character.
 */
Game_Character.prototype.initJabsMembers = function()
{
  /**
   * The shared root namespace for all of J's plugin data.
   */
  // policy step inside init jabs members.
  this._j ||= {};

  // policy step inside init jabs members.
  /**
   * A grouping of all properties associated with JABS.
   */
  this._j._abs ||= {};

  // initialize the custom properties.
  this.initJabsActionMembers();
  this.initJabsBattlerMembers();
  this.initJabsLootMembers();
};

// TODO: cleanup the getters/setters for action sprites.
/**
 * Initializes the action sprite properties for this character.
 */
Game_Character.prototype.initJabsActionMembers = function()
{
  /**
   * The block of all action-related data associated with this character.
   */
  // policy step inside init jabs action members.
  this._j._abs._action = {};

  // policy step inside init jabs action members.
  /**
   * The actual action for this character.
   * @type {JABS_Action|null}
   // policy step inside init jabs action members.
   */
  this._j._abs._action.actionData = null;

  // policy step inside init jabs action members.
  /**
   * Whether or not this action needs to be added to the map visually.
   * @type {boolean}
   */
  this._j._abs._action.needsAdding = false;

  // policy step inside init jabs action members.
  /**
   * Whether or not this action needs to be removed from the map visually.
   * @type {boolean}
   */
  this._j._abs._action.needsRemoving = false;

  // policy step inside init jabs action members.
  /**
   * The uuid for this character.
   * @type {string|String.empty}
   */
  this._j._abs._action.battlerUuid = String.empty;
};

/**
 * Initializes the battler sprite properties for this character.
 */
Game_Character.prototype.initJabsBattlerMembers = function()
{
  /**
   * The block of all battler-related data associated with this character.
   * This is not combat battler data, but map battler data.
   // policy step inside init jabs battler members.
   */
  this._j._abs._battler = {};

  // policy step inside init jabs battler members.
  /**
   * Whether or not this battler needs to be added to the map visually.
   * @type {boolean}
   */
  this._j._abs._battler._needsAdding = false;
};

/**
 * Initializes the loot sprite properties.
 */
Game_Character.prototype.initJabsLootMembers = function()
{
  /**
   * The block of all loot-related data associated with this character.
   */
  // policy step inside init jabs loot members.
  this._j._abs._loot = {};

  // policy step inside init jabs loot members.
  /**
   * Whether or not this loot needs to be added to the map visually.
   * @type {boolean}
   // policy step inside init jabs loot members.
   */
  this._j._abs._loot._needsAdding = false;

  // policy step inside init jabs loot members.
  /**
   * Whether or not this loot needs to be removed from the map visually.
   * @type {boolean}
   */
  this._j._abs._loot._needsRemoving = false;

  // policy step inside init jabs loot members.
  /**
   * The underlying loot data.
   * @type {JABS_LootDrop|null}
   */
  this._j._abs._loot._data = null;
};

//region JABS action
/**
 * If the event has a JABS action associated with it, return that.
 * @returns {JABS_Action}
 */
Game_Character.prototype.getJabsAction = function()
{
  return this._j._abs._action.actionData;
};

/**
 * Binds a JABS action to this character.
 * @param {JABS_Action} action The action to assign to this character.
 */
Game_Character.prototype.setJabsAction = function(action)
{
  this._j._abs._action.actionData = action;
};

/**
 * Gets whether or not this character is an action.
 * @returns {boolean} True if this is an action, false otherwise.
 */
Game_Character.prototype.isJabsAction = function()
{
  return !!this.getJabsAction();
};

/**
 * Gets whether or not the underlying JABS action requires removal from the map.
 * @returns {boolean} True if removal is required, false otherwise.
 */
Game_Character.prototype.getJabsActionNeedsRemoving = function()
{
  // if it is not an action, don't remove whatever it is.
  if (!this.isJabsAction()) return false;

  // return whether or not the removal is needed.
  return this.getJabsAction()
    .getNeedsRemoval();
};

/**
 * Gets the `uuid` of the underlying {@link JABS_Action}.<br>
 * @return {string|String.empty} The uuid when there is an action, {@link String.empty} otherwise.
 */
Game_Character.prototype.getJabsActionUuid = function()
{
  // grab the underlying action data.
  const jabsAction = this.getJabsAction();

  // validate we have the action data.
  if (jabsAction)
  {
    // return the underlying uuid of the action.
    return jabsAction.getUuid();
  }
  // there is no action data.
  else
  {
    // there is no uuid.
    return String.empty;
  }
};

/**
 * Gets the `needsAdding` property from the `actionSpriteProperties` for this event.
 */
Game_Character.prototype.getActionSpriteNeedsAdding = function()
{
  return this._j._abs._action.needsAdding;
};

/**
 * Sets the `needsAdding` property from the `actionSpriteProperties` for this event.
 * @param {boolean} addSprite True if you want this event to be added, false otherwise (default: true).
 */
Game_Character.prototype.setActionSpriteNeedsAdding = function(addSprite = true)
{
  this._j._abs._action.needsAdding = addSprite;
};

// TODO: remove getter/setter for sprite removal, shift responsibility to action?
/**
 * Gets the `needsRemoving` property from the `actionSpriteProperties` for this event.
 */
Game_Character.prototype.getActionSpriteNeedsRemoving = function()
{
  return this._j._abs._action.needsRemoving;
};

/**
 * Sets the `needsRemoving` property from the `actionSpriteProperties` for this event.
 * @param {boolean} removeSprite True if you want this event to be removed, false otherwise (default: true).
 */
Game_Character.prototype.setActionSpriteNeedsRemoving = function(removeSprite = true)
{
  this._j._abs._action.needsRemoving = removeSprite;
};
//endregion JABS action

//region JABS battler
/**
 * Gets the `uuid` of this `JABS_Battler`.
 */
Game_Character.prototype.getJabsBattlerUuid = function()
{
  return this._j._abs._action.battlerUuid;
};

/**
 * Sets the provided `JABS_Battler` to this character.
 * @param {string} uuid The uuid of the `JABS_Battler` to set to this character.
 */
Game_Character.prototype.setJabsBattlerUuid = function(uuid)
{
  this._j._abs._action.battlerUuid = uuid;
};

/**
 * Gets whether or not this character has a `JABS_Battler` attached to it.
 */
Game_Character.prototype.hasJabsBattler = function()
{
  // grab the uuid of the battler.
  const uuid = this.getJabsBattlerUuid();

  // if we have no uuid, then this character does not have a battler.
  if (!uuid) return false;

  // grab the tracked battler by its uuid.
  const battler = JABS_AiManager.getBattlerByUuid(uuid);

  // if there is no tracked battler, then this character doesn't have a battler.
  if (!battler)
  {
    // clear the battler so we don't check again.
    this.setJabsBattlerUuid(String.empty);

    // there is no battler on this character.
    return false;
  }

  // we have a battler!
  return true;
};

/**
 * Gets the `JABS_Battler` associated with this character.
 * @returns {JABS_Battler}
 */
Game_Character.prototype.getJabsBattler = function()
{
  // grab the uuid of this character.
  const uuid = this.getJabsBattlerUuid();

  // return the tracked battler.
  return JABS_AiManager.getBattlerByUuid(uuid);
};

/**
 * Gets whether or not this character is a newly generated battler needing sprite additions.
 * @returns {boolean}
 */
Game_Character.prototype.doesBattlerNeedAdding = function()
{
  return this._j._abs._battler._needsAdding;
};

/**
 * Flags this character for needing a battler sprite created.
 */
Game_Character.prototype.flagBattlerForAdding = function()
{
  this._j._abs._battler._needsAdding = true;
};

/**
 * Removes the flag for this character indicating their sprite is now added.
 * (or no longer needed)
 */
Game_Character.prototype.removeFlagForAddingBattler = function()
{
  this._j._abs._battler._needsAdding = false;
};

/**
 * Builds the current AABB model (in screen pixels) for this character.
 * Bottom-at-feet, one tile high above feet.
 * @returns {JABS_Aabb}
 */
Game_Character.prototype.getJabsAabb = function()
{
  // delegate to engine helper.
  return JABS_Engine.getBattlerAabbModel(this);
};
//endregion JABS battler

//region JABS loot
/**
 * Gets the loot data for this character/event.
 * @returns {JABS_LootDrop}
 */
Game_Character.prototype.getJabsLoot = function()
{
  return this._j._abs._loot._data;
};

/**
 * Sets the loot data to the provided loot.
 * @param {JABS_LootDrop} data The loot data to assign to this character/event.
 */
Game_Character.prototype.setJabsLoot = function(data)
{
  this._j._abs._loot._data = data;
};

/**
 * Whether or not this character is/has loot.
 */
Game_Character.prototype.isJabsLoot = function()
{
  return !!this.getJabsLoot();
};

/**
 * Gets whether or not this loot needs rendering onto the map.
 * @returns {boolean} True if needing rendering, false otherwise.
 */
Game_Character.prototype.getLootNeedsAdding = function()
{
  return this._j._abs._loot._needsAdding;
};

/**
 * Sets the loot to need rendering onto the map.
 * @param {boolean} needsAdding Whether or not this loot needs adding.
 */
Game_Character.prototype.setLootNeedsAdding = function(needsAdding = true)
{
  this._j._abs._loot._needsAdding = needsAdding;
};

/**
 * Gets whether or not this loot object is flagged for removal.
 */
Game_Character.prototype.getLootNeedsRemoving = function()
{
  return this._j._abs._loot._needsRemoving;
};

/**
 * Sets the loot object to be flagged for removal.
 * @param {boolean} needsRemoving True if we want to remove the loot, false otherwise.
 */
Game_Character.prototype.setLootNeedsRemoving = function(needsRemoving = true)
{
  this._j._abs._loot._needsRemoving = needsRemoving;
};
//endregion JABS loot

/**
 * Execute an animation of a provided id upon this character or event.
 * @param {number} animationId The animation id to execute on this character/event.
 */
Game_Character.prototype.requestAnimation = function(animationId)
{
  $gameTemp.requestAnimation([ this ], animationId);
};

/**
 * Extends {@link Game_Character.isMovementSucceeded}.<br/>
 * Includes handling for battlers being move-locked by JABS.
 * @returns {boolean}
 */
J.ABS.Aliased.Game_Character.set('isMovementSucceeded', Game_Character.prototype.isMovementSucceeded);
Game_Character.prototype.isMovementSucceeded = function()
{
  // grab the underlying battler.
  const battler = this.getJabsBattler();

  // validate we have a battler and that they can move.
  if (battler && !battler.canBattlerMove())
  {
    // if we have a battler that also cannot move, then movement never succeeds.
    return false;
  }

  // otherwise, perform original logic.
  return J.ABS.Aliased.Game_Character.get('isMovementSucceeded')
    .call(this);
};

/* eslint-disable */
/**
 * 8-direction step toward the goal using map wrap deltas only (no A*).
 * Used for through-moving homing so J-Pixelistics is not asked to run subcell {@link #canPass}
 * hundreds of times per frame inside path search.
 *
 * @param {number} goalX The x coordinate trying to be reached.
 * @param {number} goalY The y coordinate trying to be reached.
 * @returns {1|2|3|4|6|7|8|9|0} The direction decided.
 */
Game_Character.prototype.findDiagonalDirectionToHeuristic = function(goalX, goalY)
{
  const deltaX2 = this.deltaXFrom(goalX);
  const deltaY2 = this.deltaYFrom(goalY);
  if (deltaX2 === 0 && deltaY2 === 0)
  {
    // hand back 0 to the caller.
    return 0;
  }

  // when Math.abs(deltaX2) > Math.abs(deltaY2), take this branch.
  if (Math.abs(deltaX2) > Math.abs(deltaY2))
  {
    if (deltaX2 > 0)
    {
      return deltaY2 === 0
        // policy step inside find diagonal direction to heuristic.
        ? 4
        : deltaY2 > 0
          ? 7
          // policy step inside find diagonal direction to heuristic.
          : 1;
    }
    else if (deltaX2 < 0)
    {
      return deltaY2 === 0
        // policy step inside find diagonal direction to heuristic.
        ? 6
        : deltaY2 > 0
          ? 9
          // policy step inside find diagonal direction to heuristic.
          : 3;
    }
    else
    {
      return deltaY2 === 0
        // policy step inside find diagonal direction to heuristic.
        ? 0
        : deltaY2 > 0
          ? 8
          // policy step inside find diagonal direction to heuristic.
          : 2;
    }
  }
  else
  {
    if (deltaY2 > 0)
    {
      // hand back deltaX2 === 0 to the caller.
      return deltaX2 === 0
        ? 8
        : deltaX2 > 0
          // policy step inside find diagonal direction to heuristic.
          ? 7
          : 9;
    }
    else if (deltaY2 < 0)
    {
      return deltaX2 === 0
        ? 2
        : deltaX2 > 0
          ? 1
          : 3;
    }
    else
    {
      return deltaX2 === 0
        ? 0
        : deltaX2 > 0
          ? 4
          : 6;
    }
  }
};

/**
 * Intelligently determines the next step to take on a path to the destination `x,y`.
 * @param {number} goalX The `x` coordinate trying to be reached.
 * @param {number} goalY The `y` coordinate trying to be reached.
 * @returns {1|2|3|4|6|7|8|9} The direction decided.
 */
Game_Character.prototype.findDiagonalDirectionTo = function(goalX, goalY)
{
  if (this.isThrough() || this.isDebugThrough())
  {
    return this.findDiagonalDirectionToHeuristic(goalX, goalY);
  }

  // capture search limit for downstream policy in this routine.
  const searchLimit = this.searchLimit();
  const mapWidth = $gameMap.width();
  const nodeList = [];
  // capture open list for downstream policy in this routine.
  const openList = [];
  const closedList = [];
  const start = {};
  // capture best for downstream policy in this routine.
  let best = start;

  // capture start xi for downstream policy in this routine.
  const startXi = Math.round(this.x);
  const startYi = Math.round(this.y);
  const goalXi = Math.round(goalX);
  // capture goal yi for downstream policy in this routine.
  const goalYi = Math.round(goalY);

  // when startXi  equals  goalXi  and  startYi  equals  goalYi, take this branch.
  if (startXi === goalXi && startYi === goalYi)
  {
    return 0;
  }

  // policy step inside find diagonal direction to.
  start.parent = null;
  start.x = startXi;
  start.y = startYi;
  // policy step inside find diagonal direction to.
  start.g = 0;
  start.f = $gameMap.distance(start.x, start.y, goalXi, goalYi);
  nodeList.push(start);
  // Append the row to the working collection.
  openList.push(start.y * mapWidth + start.x);

  // keep looping while nodeList.length > 0.
  while (nodeList.length > 0)
  {
    let bestIndex = 0;
    for (let i = 0; i < nodeList.length; i++)
    {
      // when nodeList[i].f < nodeList[bestIndex].f, take this branch.
      if (nodeList[i].f < nodeList[bestIndex].f)
      {
        bestIndex = i;
      }
    }

    // capture current for downstream policy in this routine.
    const current = nodeList[bestIndex];
    const x1 = current.x;
    const y1 = current.y;
    // capture pos1 for downstream policy in this routine.
    const pos1 = y1 * mapWidth + x1;
    const g1 = current.g;

    // Mutate the array in place for this edit.
    nodeList.splice(bestIndex, 1);
    openList.splice(openList.indexOf(pos1), 1);
    closedList.push(pos1);

    // when current.x  equals  goalXi  and  current.y  equals  goalYi, take this branch.
    if (current.x === goalXi && current.y === goalYi)
    {
      best = current;
      break;
    }

    // when g1 >= searchLimit, take this branch.
    if (g1 >= searchLimit)
    {
      continue;
    }

    // iterate the loop counter until the guard exits.
    for (let j = 1; j <= 9; j++)
    {
      if (j === 5)
      {
        continue;
      }
      let directions;
      if (this.isDiagonalDirection(j))
      {
        directions = this.getDiagonalDirections(j);
      }
      else
      {
        directions = [ j, j ];
      }

      // policy step inside find diagonal direction to.
      const [ horz, vert ] = directions;
      const x2 = $gameMap.roundXWithDirection(x1, horz);
      const y2 = $gameMap.roundYWithDirection(y1, vert);
      const pos2 = y2 * mapWidth + x2;

      // when closedList.contains(pos2), take this branch.
      if (closedList.contains(pos2))
      {
        continue;
      }

      // when this.isStraightDirection(j), take this branch.
      if (this.isStraightDirection(j))
      {
        if (!this.canPass(x1, y1, j))
        {
          continue;
        }
      }
      else if (this.isDiagonalDirection(j))
      {
        if (!this.canPassDiagonally(x1, y1, horz, vert))
        {
          continue;
        }
      }

      // capture g2 for downstream policy in this routine.
      let g2 = g1 + 1;
      let index2 = openList.indexOf(pos2);

      // when index2 < 0  or  g2 < nodeList[index2].g, take this branch.
      if (index2 < 0 || g2 < nodeList[index2].g)
      {
        let neighbor;
        if (index2 >= 0)
        {
          neighbor = nodeList[index2];
        }
        else
        {
          neighbor = {};
          nodeList.push(neighbor);
          openList.push(pos2);
        }
        neighbor.parent = current;
        neighbor.x = x2;
        neighbor.y = y2;
        neighbor.g = g2;
        neighbor.f = g2 + $gameMap.distance(x2, y2, goalXi, goalYi);
        if (!best || neighbor.f - neighbor.g < best.f - best.g)
        {
          best = neighbor;
        }
      }
    }
  }

  // capture node for downstream policy in this routine.
  let node = best;
  while (node.parent && node.parent !== start)
  {
    node = node.parent;
  }

  // capture delta x1 for downstream policy in this routine.
  const deltaX1 = $gameMap.deltaX(node.x, start.x);
  const deltaY1 = $gameMap.deltaY(node.y, start.y);
  if (deltaY1 > 0)
  {
    return deltaX1 === 0
      ? 2
      : deltaX1 > 0
        ? 3
        : 1;
  }
  else if (deltaY1 < 0)
  {
    return deltaX1 === 0
      ? 8
      : deltaX1 > 0
        ? 9
        : 7;
  }
  else
  {
    if (deltaX1 !== 0)
    {
      return deltaX1 > 0
        ? 6
        : 4;
    }
  }

  // hand back this.findDiagonalDirectionToHeuristic(goalX, goalY) to the caller.
  return this.findDiagonalDirectionToHeuristic(goalX, goalY);
};
/* eslint-enable */
//endregion Game_Character