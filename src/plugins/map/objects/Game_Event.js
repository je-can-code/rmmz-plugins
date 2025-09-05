//region Game_Event
/**
 * Extends {@link Game_Event.initMembers}.<br>
 * Initializes minimap-related properties.
 */
J.MAP.Aliased.Game_Event.set('initMembers', Game_Event.prototype.initMembers);
Game_Event.prototype.initMembers = function()
{
  // perform original logic.
  J.MAP.Aliased.Game_Event.get('initMembers')
    .call(this);

  /**
   * The J object where all my additional properties live.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with minimaps.
   */
  this._j._map ||= {};

  /**
   * The cached event type to display on the minimap.
   * @type {MinimapEventType|null}
   */
  this._j._map._cachedMinimapEventType = null;

  /**
   * The cached check of whether or not to show the event on the minimap.
   * @type {boolean}
   */
  this._j._map._cachedShowOnMinimap = null;
};

/**
 * Sets the type of minimap event this event is.
 * @param {MinimapEventType|null} type The type of minimap event.
 */
Game_Event.prototype.setCachedMinimapEventType = function(type)
{
  this._j._map._cachedMinimapEventType = type;
};

/**
 * Gets the type of minimap event this event is.
 * @returns {MinimapEventType|null}
 */
Game_Event.prototype.getCachedMinimapEventType = function()
{
  return this._j._map._cachedMinimapEventType;
};

/**
 * Sets whether or not to show this event on the minimap.
 * @param {boolean} shouldShow True if this should be shown on the minimap, false otherwise.
 */
Game_Event.prototype.setCachedShowOnMinimap = function(shouldShow)
{
  this._j._map._cachedShowOnMinimap = shouldShow;
};

/**
 * Gets whether or not to show this event on the minimap.
 * @returns {boolean|null}
 */
Game_Event.prototype.getCachedShowOnMinimap = function()
{
  return this._j._map._cachedShowOnMinimap;
};

/**
 * Extends {@link #refresh}.<br/>
 * Also clears the minimap cache forcing the next fetch to recalculate the data.
 */
J.MAP.Aliased.Game_Event.set('refresh', Game_Event.prototype.refresh);
Game_Event.prototype.refresh = function()
{
  // perform original logic.
  J.MAP.Aliased.Game_Event.get('refresh')
    .call(this);

  // refresh the minimap cache..
  this.clearMinimapCache();
};

/**
 * Clears the cache for the minimap data.
 */
Game_Event.prototype.clearMinimapCache = function()
{
  // reset back to default.
  this.setCachedShowOnMinimap(null);
  this.setCachedMinimapEventType(null);
};

/**
 * Determines if it should be shown for this event.
 * @returns {boolean} True if it should be shown, false otherwise.
 */
Game_Event.prototype.shouldShowOnMinimap = function()
{
  // if JABS is enabled, there are a couple other things to evaluate first.
  if (J.ABS)
  {
    // if this is still-collectable loot, then it should be visible.
    if (this.isErased() === false && this.isJabsLoot()) return true;

    // grab the battler if one exists for this event.
    const enemy = this.getJabsBattler();

    // validate we have an enemy before checking enemy things.
    if (enemy)
    {
      // alive and revealed enemies should show on the minimap.
      return (!enemy.isDead() && !enemy.isHidden());
    }
  }

  // check if we have a cached value.
  if (this.getCachedShowOnMinimap() !== null)
  {
    // return the cached value.
    return this.getCachedShowOnMinimap();
  }

  // ensure we have an enemy.
  let shouldShow = false;

  // 1) Explicit minimap type tags on the event comments.
  this.getValidCommentCommands()
    .forEach(command =>
    {
      // shorthand the comment into a variable.
      const [ comment, ] = command.parameters;

      // check if the comment contains a minimap type tag.
      J.MAP.RegExp.MinimapEvent.lastIndex = 0;
      if (J.MAP.RegExp.MinimapEvent.test(comment))
      {
        shouldShow = true;
      }
    });

  // 2) Teleport events (auto-detected from page commands) should be shown.
  if (!shouldShow && this.isTeleportEvent())
  {
    shouldShow = true;
  }

  // cache the result for future use.
  this.setCachedShowOnMinimap(shouldShow);

  // return what we found.
  return shouldShow;
};

/**
 * Determines whether this event’s current page contains a transfer (teleport) action.
 * @returns {boolean}
 */
Game_Event.prototype.isTeleportEvent = function()
{
  // pull the current page’s command list.
  let list = [];
  if (this.page() && this.list())
  {
    list = this.list();
  }

  // command code 201 is "Transfer Player" in RMMZ event commands.
  // we scan for any such command on the active page.
  const hasTransfer = !!list.find(cmd => cmd && cmd.code === 201);

  return !!hasTransfer;
};

/**
 * Identify what kind of minimap event type this event is.
 * @returns {MinimapEventType} The type of minimap event.
 */
Game_Event.prototype.minimapEventType = function()
{
  // if JABS is enabled, there are a couple other things to evaluate first.
  if (J.ABS)
  {
    // if this is still-collectable loot, then it should be visible.
    if (this.isErased() === false && this.isJabsLoot()) return MinimapEventType.Loot;

    // grab the battler if one exists for this event.
    const enemy = this.getJabsBattler();

    // validate we have an enemy before checking enemy things.
    if (enemy)
    {
      // dead or hidden enemies don't have an indicator.
      if (enemy.isHidden() || enemy.isDead()) return MinimapEventType.Unset;

      // return the appropriate enemy type marker.
      return enemy.isInanimate()
        ? MinimapEventType.EnemyInanimate
        : MinimapEventType.EnemyHostile;
    }
  }

  // check if we have a cached value.
  if (this.getCachedMinimapEventType() !== null)
  {
    // return the cached value.
    return this.getCachedMinimapEventType();
  }

  // default to hiding the event on the minimap.
  let minimapEventType = MinimapEventType.Unset;

  // check all the valid event commands to see if we have a tag.
  this.getValidCommentCommands()
    .forEach(command =>
    {
      // shorthand the comment into a variable.
      const [ comment, ] = command.parameters;

      // refresh the regex and scan again.
      J.MAP.RegExp.MinimapEvent.lastIndex = 0;
      const match = J.MAP.RegExp.MinimapEvent.exec(comment);

      // if this line doesn't match, then skip it.
      if (!match) return;

      // check the minimap type tag.
      switch (match[1])
      {
        case 'npc':
          minimapEventType = MinimapEventType.Npc;
          break;
        case 'loot':
          minimapEventType = MinimapEventType.Loot;
          break;
        case 'object':
          minimapEventType = MinimapEventType.Object;
          break;
        case 'teleport':
          minimapEventType = MinimapEventType.Teleport;
          break;
        case 'questOffer':
          minimapEventType = MinimapEventType.QuestOffer;
          break;
        case 'questProgress':
          minimapEventType = MinimapEventType.QuestProgress;
          break;
        case 'questTurnIn':
          minimapEventType = MinimapEventType.QuestTurnIn;
          break;
      }
    });

  // Auto-detect: if still unset and the page contains a transfer command, treat as teleport.
  if (minimapEventType === MinimapEventType.Unset && this.isTeleportEvent())
  {
    minimapEventType = MinimapEventType.Teleport;
  }

  // cache the result for future use.
  this.setCachedMinimapEventType(minimapEventType);

  // return what we found.
  return minimapEventType;
};

/**
 * Parses and returns the area rectangle for this event from <areaEvent:WxH>.
 * Defaults to 1x1 when not present or invalid.
 * @returns {{w:number,h:number}}
 */
Game_Event.prototype.getAreaEventRect = function()
{
  // default area is a single tile.
  let w = 1;
  let h = 1;

  // iterate comments for the area tag.
  const commands = this.getValidCommentCommands();
  for (let i = 0; i < commands.length; i++)
  {
    const [ comment, ] = commands[i].parameters;
    if (!comment) continue;

    J.MAP.RegExp.AreaEvent.lastIndex = 0;
    const match = J.MAP.RegExp.AreaEvent.exec(comment);
    if (match)
    {
      const [ , unparsedW, unparsedH ] = match;
      w = Math.max(1, parseInt(unparsedW));
      h = Math.max(1, parseInt(unparsedH));
      break;
    }
  }

  return {
    w,
    h
  };
};
//endregion Game_Event