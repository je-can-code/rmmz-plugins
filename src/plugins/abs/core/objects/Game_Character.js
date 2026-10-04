//region Game_Character
import JABS_LootDrop from '../models/JABS_LootDrop.js';
import JABS_Engine from './../managers/JABS_Engine.js';
import JABS_Battler from '../models/JABS_Battler.js';
import JABS_AiManager from './../managers/JABS_AiManager.js';
import JABS_Action from '../models/JABS_Action.js';
import JABS_Aabb from '../models/JABS_Aabb.js';
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
  this._j ||= {};

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
  this._j._abs._action = {};

  /**
   * The actual action for this character.
   * @type {JABS_Action|null}
   */
  this._j._abs._action._jabsAction = null;

  /**
   * Whether or not this action needs to be added to the map visually.
   * @type {boolean}
   */
  this._j._abs._action._actionSpriteNeedsAdding = false;

  /**
   * Whether or not this action needs to be removed from the map visually.
   * @type {boolean}
   */
  this._j._abs._action._actionSpriteNeedsRemoving = false;

  /**
   * The uuid for this character.
   * @type {string|String.empty}
   */
  this._j._abs._action._jabsBattlerUuid = String.empty;
};

/**
 * Initializes the battler sprite properties for this character.
 */
Game_Character.prototype.initJabsBattlerMembers = function()
{
  /**
   * The block of all battler-related data associated with this character.
   * This is not combat battler data, but map battler data.
   */
  this._j._abs._battler = {};

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
  this._j._abs._loot = {};

  /**
   * Whether or not this loot needs to be added to the map visually.
   * @type {boolean}
   */
  this._j._abs._loot._needsAdding = false;

  /**
   * Whether or not this loot needs to be removed from the map visually.
   * @type {boolean}
   */
  this._j._abs._loot._needsRemoving = false;

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
  return this._j._abs._action._jabsAction;
};

/**
 * Binds a JABS action to this character.
 * @param {JABS_Action} action The action to assign to this character.
 */
Game_Character.prototype.setJabsAction = function(action)
{
  this._j._abs._action._jabsAction = action;
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
  return this._j._abs._action._actionSpriteNeedsAdding;
};

/**
 * Sets the `needsAdding` property from the `actionSpriteProperties` for this event.
 * @param {boolean} addSprite True if you want this event to be added, false otherwise (default: true).
 */
Game_Character.prototype.setActionSpriteNeedsAdding = function(addSprite = true)
{
  this._j._abs._action._actionSpriteNeedsAdding = addSprite;
};

// TODO: remove getter/setter for sprite removal, shift responsibility to action?
/**
 * Gets the `needsRemoving` property from the `actionSpriteProperties` for this event.
 */
Game_Character.prototype.getActionSpriteNeedsRemoving = function()
{
  return this._j._abs._action._actionSpriteNeedsRemoving;
};

/**
 * Sets the `needsRemoving` property from the `actionSpriteProperties` for this event.
 * @param {boolean} removeSprite True if you want this event to be removed, false otherwise (default: true).
 */
Game_Character.prototype.setActionSpriteNeedsRemoving = function(removeSprite = true)
{
  this._j._abs._action._actionSpriteNeedsRemoving = removeSprite;
};
//endregion JABS action

//region JABS battler
/**
 * Gets the `uuid` of this `JABS_Battler`.
 */
Game_Character.prototype.getJabsBattlerUuid = function()
{
  return this._j._abs._action._jabsBattlerUuid;
};

/**
 * Sets the provided `JABS_Battler` to this character.
 * @param {string} uuid The uuid of the `JABS_Battler` to set to this character.
 */
Game_Character.prototype.setJabsBattlerUuid = function(uuid)
{
  this._j._abs._action._jabsBattlerUuid = uuid;
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

/**
 * Places this loot character at the given continuous map coordinates.
 *
 * Both coordinate pairs are written because vanilla treats a disagreement between them as "this
 * character is mid-step" and spends {@link Game_CharacterBase#updateMove} dragging the real pair
 * back toward the logical one- which would undo a magnet's pull every frame it applied it.
 * @param {number} x The continuous x coordinate to place this loot at.
 * @param {number} y The continuous y coordinate to place this loot at.
 */
Game_Character.prototype.setLootPosition = function(x, y)
{
  this.setRealX(x);
  this.setRealY(y);
  this.setX(x);
  this.setY(y);
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
  const rawDX = this.deltaXFrom(goalX);
  const rawDY = this.deltaYFrom(goalY);

  // snap sub-tile offsets to zero so pixel-movement floating-point noise doesn't
  // force a diagonal when the target is essentially on the same axis as the actor.
  const AXIS_SNAP = 0.3;
  const deltaX2 = Math.abs(rawDX) < AXIS_SNAP ? 0 : rawDX;
  const deltaY2 = Math.abs(rawDY) < AXIS_SNAP ? 0 : rawDY;

  if (deltaX2 === 0 && deltaY2 === 0)
  {
    return 0;
  }

  // whichever axis has strictly greater magnitude wins the primary direction; the other axis
  // (if nonzero) tilts it into a diagonal. Note: within each outer branch below, the "losing"
  // axis's own delta can never be zero here- that combination was already caught by the
  // deltaX2 === 0 && deltaY2 === 0 early return above, or is mathematically impossible given
  // the enclosing magnitude comparison (a zero magnitude cannot exceed a non-negative one).
  if (Math.abs(deltaX2) > Math.abs(deltaY2))
  {
    if (deltaX2 > 0)
    {
      return deltaY2 === 0
        ? 4
        : deltaY2 > 0
          ? 7
          : 1;
    }

    return deltaY2 === 0
      ? 6
      : deltaY2 > 0
        ? 9
        : 3;
  }
  else
  {
    if (deltaY2 > 0)
    {
      return deltaX2 === 0
        ? 8
        : deltaX2 > 0
          ? 7
          : 9;
    }

    return deltaX2 === 0
      ? 2
      : deltaX2 > 0
        ? 1
        : 3;
  }
};

/**
 * Intelligently determines the next step to take on a path to the destination `x,y`.<br/>
 * The search itself is J-Base's {@link TilePathSearch}, stepping all eight ways. This decides only
 * which tiles it runs between - both ends rounded onto the grid - and how its answer becomes a direction.
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

  const startXi = Math.round(this.x);
  const startYi = Math.round(this.y);
  const goalXi = Math.round(goalX);
  const goalYi = Math.round(goalY);

  if (startXi === goalXi && startYi === goalYi)
  {
    return 0;
  }

  // the search itself is J-Base's, stepping all eight ways.
  const request = {
    startX: startXi,
    startY: startYi,
    goalX: goalXi,
    goalY: goalYi,
    searchLimit: this.searchLimit(),
    mapWidth: $gameMap.width(),
    directions: [ 1, 2, 3, 4, 6, 7, 8, 9 ],
    stepFrom: (x, y, direction) => this.stepFromInDirection(x, y, direction),
    canStep: (x, y, direction) => this.canStepInDirection(x, y, direction),
    distance: (x1, y1, x2, y2) => $gameMap.distance(x1, y1, x2, y2),
  };

  // and a search that just failed from this tile toward this goal is not asked again for a moment.
  const node = PathSearchMemory.firstStep(
    this,
    'diagonal',
    Graphics.frameCount,
    request,
    search => TilePathSearch.firstStep(search));

  const deltaX1 = $gameMap.deltaX(node.x, startXi);
  const deltaY1 = $gameMap.deltaY(node.y, startYi);
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

  return this.findDiagonalDirectionToHeuristic(goalX, goalY);
};
/* eslint-enable */

/**
 * Gets the tile one step in any of the eight directions lands on.<br/>
 * A diagonal is its horizontal and vertical halves taken together, and a straight step is its own
 * half on both axes, since the map's rounding leaves alone the axis a direction does not move along.
 * @param {number} x The x tile the step starts from.
 * @param {number} y The y tile the step starts from.
 * @param {number} direction The direction of the step, as a numpad direction.
 * @returns {{x: number, y: number}} The tile the step lands on.
 */
Game_Character.prototype.stepFromInDirection = function(x, y, direction)
{
  // a diagonal moves along both axes at once; a straight step only along its own.
  const [ horz, vert ] = this.isDiagonalDirection(direction)
    ? this.getDiagonalDirections(direction)
    : [ direction, direction ];

  return {
    x: $gameMap.roundXWithDirection(x, horz),
    y: $gameMap.roundYWithDirection(y, vert),
  };
};

/**
 * Determines whether this character may take one step in any of the eight directions from a tile.<br/>
 * A straight step only has to clear the edge it crosses, while a diagonal answers to the map's
 * diagonal rule, which also looks at the corner it cuts.
 * @param {number} x The x tile the step starts from.
 * @param {number} y The y tile the step starts from.
 * @param {number} direction The direction of the step, as a numpad direction.
 * @returns {boolean} True if the step can be taken, false otherwise.
 */
Game_Character.prototype.canStepInDirection = function(x, y, direction)
{
  // a straight step crosses one edge.
  if (this.isStraightDirection(direction)) return this.canPass(x, y, direction);

  // a diagonal step answers to the diagonal rule.
  const [ horz, vert ] = this.getDiagonalDirections(direction);
  return this.canPassDiagonally(x, y, horz, vert);
};
//endregion Game_Character