//region JABS_Engine
/**
 * This class is the engine that manages JABS and how JABS actions interact
 * with the `JABS_Battler`s on the map.
 */
class JABS_Engine
{
  /**
   * The events array of the enemy cloning map.
   * @type {rm.types.Event[]|null}
   */
  static #enemyCloneList = null;

  /**
   * A cached collection of actions keyed by their uuids.
   */
  cachedActions = new Map();

  //region properties
  /**
   * Retrieves whether or not the ABS is currently enabled.
   * @returns {boolean} True if enabled, false otherwise.
   */
  absEnabled = true;

  /**
   * Retrieves whether or not the ABS is currently paused.
   * @returns {boolean} True if paused, false otherwise.
   */
  absPause = false;

  /**
   * Checks whether or not we have a need to request the JABS quick menu.
   * @returns {boolean} True if menu requested, false otherwise.
   */
  requestAbsMenu = false;

  /**
   * Gets whether or not there is a request to cycle through party members.
   * @returns {boolean}
   */
  requestPartyRotation = false;

  /**
   * Gets whether or not there is a request to refresh the JABS menu.
   * The most common use case for this is adding new commands to the menu.
   * @returns {boolean}
   */
  requestJabsMenuRefresh = false;

  /**
   * Checks whether or not we have a need to request rendering for new actions.
   * @returns {boolean} True if needing to render actions, false otherwise.
   */
  requestActionRendering = false;

  /**
   * Checks whether or not we have a need to request rendering for new loot sprites.
   * @returns {boolean} True if needing to render loot, false otherwise.
   */
  requestLootRendering = false;

  /**
   * Checks whether or not we have a need to request a clearing of the action sprites
   * on the current map.
   * @returns {boolean} True if clear map requested, false otherwise.
   */
  requestClearMap = false;

  /**
   * Checks whether or not we have a need to request a clearing of the loot sprites
   * on the current map.
   * @returns {boolean} True if clear loot requested, false otherwise.
   */
  requestClearLoot = false;

  /**
   * Checks whether or not we have a need to refresh all character sprites on the current map.
   * @returns {boolean} True if refresh is requested, false otherwise.
   */
  requestSpriteRefresh = false;

  /**
   * Whether or not there is a request issued for rendering newly generated battler sprites.
   * @type {boolean}
   */
  requestBattlerRendering = false;

  /**
   * Whether or not there is a request issued for toggling the visibility of the hitbox overlays.
   * @type {boolean}
   */
  requestToggleHitboxOverlays = false;

  /**
   * Whether or not the hitbox overlays are presently visible.
   * @type {boolean}
   */
  hitboxOverlaysVisible = false;

  /**
   * When `true`, all non‑enemies are considered in combat (UI and mechanics that consult the engine).
   * Useful for boss phases or scripted moments.
   * @type {boolean}
   */
  forcedCombat = false;

  //endregion properties

  /**
   * @constructor
   */
  constructor()
  {
    // initialize the engine.
    this.initialize();

    // check if we've yet to initialize the enemy map.
    if (!JABS_Engine.#isEnemyMapInitialized())
    {
      // also initialize the enemy map if necessary.
      JABS_Engine.initializeEnemyMap();
    }
  }

  //region static
  /**
   * Gets the collection of enemy clone events currently tracked.
   * @returns {rm.types.Event[]}
   */
  static getEnemyCloneList()
  {
    return this.#enemyCloneList;
  }

  /**
   * Sets the enemy clone collection to the given collection.
   * @param {rm.types.Event[]} enemies The enemy events from the enemy clone map.
   */
  static setEnemyCloneList(enemies)
  {
    this.#enemyCloneList = enemies;
  }

  /**
   * Determines if the enemy clone list has yet to be populated.
   * @returns {boolean}
   */
  static #isEnemyMapInitialized()
  {
    return !!this.#enemyCloneList;
  }

  /**
   * Initializes the enemy clone data from the configured map.
   */
  static initializeEnemyMap()
  {
    // determine the map that is configured for enemy clones.
    const mapFilename = 'Map%1.json'.format(J.ABS.Metadata.DefaultEnemyMapId.padZero(3));

    // fetch the data and update the data into the enemy clone tracker list.
    fetch(`data/${mapFilename}`)
      .then(data => data.json())
      .then(dataMap => JABS_Engine.setEnemyCloneList(dataMap.events));
  }

  /**
   * Computes the battler’s Axis-Aligned Bounding Box (AABB) model in screen pixels,
   * using the “bottom-at-feet” convention (one tile above the feet).
   * @param {Game_CharacterBase} character The character whose AABB is being queried.
   * @returns {JABS_Aabb}
   */
  static getBattlerAabbModel(character)
  {
    // guard against missing character; provide empty rect model.
    if (!character)
    {
      return new JABS_Aabb(0, 0, 0, 0);
    }

    // tile and feet info.
    const tw = $gameMap.tileWidth();
    const th = $gameMap.tileHeight();
    const feetX = character.screenX();
    const feetY = character.screenY();

    // build AABB one tile above feet.
    return JABS_Aabb.fromFeet(feetX, feetY, tw, th);
  }

  /**
   * Computes the on-screen pixel origin for an action event, aligned to the
   * center of the tile above the feet (the corrected physics origin).
   * @param {Game_Event} actionEvent The action event to compute the origin for.
   * @returns {{ x:number, y:number }} The origin in screen pixels.
   */
  static getActionOriginPixels(actionEvent)
  {
    // guard against missing action event; return neutral origin.
    if (!actionEvent)
    {
      return {
        x: 0,
        y: 0
      };
    }

    // tile height is needed to vertically center the origin above the feet.
    const th = $gameMap.tileHeight();

    // center the origin one tile above the feet position.
    const x = actionEvent.screenX();
    const y = actionEvent.screenY() - (th / 2);

    return {
      x,
      y
    };
  }

  //endregion static

  //region init
  /**
   * Creates all members available in this class.
   */
  initialize(isMapTransfer = true)
  {
    /**
     * The `JABS_Battler` representing the player.
     * @type {JABS_Battler}
     */
    this._player1 = null;

    /**
     * A collection to manage all JABS actions on this battle map.
     * @type {JABS_Action[]}
     */
    this._actionEvents = [];

    /**
     * A collection of the metadata of all action-type events.
     * @type {rm.types.Event[]}
     */
    this._activeActions = isMapTransfer
      ? Array.empty
      : this._activeActions ?? Array.empty;

    /**
     * A collection of all ongoing states that are affecting battlers on the map.
     * @type {Map<string, Map<number, JABS_State>>}
     */
    this._jabsStates = isMapTransfer
      ? this._jabsStates ?? new Map()
      : new Map();

    this.hitboxOverlaysVisible = isMapTransfer
      ? this.hitboxOverlaysVisible ?? J.ABS.Metadata.HitboxOverlaysInitiallyVisible
      : J.ABS.Metadata.HitboxOverlaysInitiallyVisible;
  }

  /**
   * Gets all currently tracked actions on the map.
   * @returns {JABS_Action[]}
   */
  getAllActionEvents()
  {
    return this._actionEvents;
  }

  setAllActionEvents(actionEvents)
  {
    this._actionEvents = actionEvents;
  }

  /**
   * Adds a new JABS action to this battle map for tracking.
   * The additional metadata is optional, omitted when executing direct actions.
   * @param {JABS_Action} actionEvent The JABS action to add.
   * @param {rm.types.Event} actionEventData The event metadata, if anything.
   */
  addActionEvent(actionEvent, actionEventData)
  {
    // grab the current collection of actions.
    const actions = this.getAllActionEvents();

    // add the new event to the list.
    actions.push(actionEvent);

    // if the event is a physical event on the map, track that data too.
    if (actionEventData)
    {
      this._activeActions.push(actionEventData);
    }
  }

  /**
   * Finds the event metadata associated with the given `uuid`.
   * This is used when a given event has an underlying action associated with it and
   * we want that action data.
   * @param {string} uuid The `uuid` to find.
   * @returns {rm.types.Event} The event associated with the `uuid`.
   */
  event(uuid)
  {
    return this._activeActions
      .find(eventData => eventData.uniqueId === uuid);
  }

  /**
   * Clears all currently managed JABS actions on this battle map that are marked
   * for removal.
   */
  clearActionEvents()
  {
    // grab the current collection of actions.
    const actionEvents = this.getAllActionEvents();

    // filter out the events that are on track for removal.
    const updatedActionEvents = actionEvents.filter(action => !action.getNeedsRemoval());

    // check if we have any events that are in need of removal.
    if (updatedActionEvents.length < actionEvents.length)
    {
      // request a refresh of the map.
      this.requestClearMap = true;
    }

    // update the action events to be the filtered events.
    this.setAllActionEvents(updatedActionEvents);
  }

  /**
   * Determines the animation id for this particular attack.
   * -1 as an animation id represents "use normal attack", but enemies don't have that!
   * So for the case of enemies, it'll instead return the default.
   * @param {object} skill The $dataSkills object for this skill.
   * @param {JABS_Battler} caster The caster of this skill.
   */
  getAnimationId(skill, caster)
  {
    // grab the animation id from the skill.
    const { animationId } = skill;

    // check if the animation id indicates we should look to the weapon.
    if (animationId === -1)
    {
      // check if the caster is an enemy.
      if (caster.isEnemy())
      {
        // return the default attack animation id.
        return J.ABS.DefaultValues.AttackAnimationId;
      }
      // the caster was not an enemy.

      // grab the weapons of the caster.
      const weapons = caster.getBattler()
        .weapons();

      // check to make sure we have weapons.
      if (weapons.length > 0)
      {
        // grab the first weapon's attack animation.
        return weapons[0].animationId;
      }
      // we are barefisting it.

      // just return the default attack animation id.
      return J.ABS.DefaultValues.AttackAnimationId;
    }

    return animationId;
  }

  /**
   * Gets the {@link JABS_Battler} associated with the player.
   * @returns {JABS_Battler} The battler associated with the player.
   */
  getPlayer1()
  {
    return this._player1;
  }

  /**
   * Sets the battler associated with the player.
   * @param {JABS_Battler} battler The battler to set as player.
   */
  setPlayer1(battler)
  {
    this._player1 = battler;
  }

  /**
   * Determine whether or not the underlying {@link Game_Battler} is actually player 1.
   * @param {Game_Battler} battler The battler to compare.
   * @returns {boolean} True if this battler is currently player 1, false otherwise.
   */
  isBattlerPlayer1(battler)
  {
    // grab player 1.
    const player1 = this.getPlayer1();

    // if we currently have no player 1, then it must be false.
    if (!player1) return false;

    // if they are not the same battler, then they are not.
    if (player1.getBattler() !== battler) return false;

    // they are the same!
    return true;
  }

  /**
   * Initializes the player properties associated with this battle map.
   */
  initializePlayer1()
  {
    // check if we can initialize the player.
    if (!this.canInitializePlayer1()) return;

    // create a new player object.
    this.refreshPlayer1Data();
  }

  /**
   * Updates player 1 with a new player based off the current data.
   */
  refreshPlayer1Data()
  {
    // created a battler for player1.
    const player1 = JABS_Battler.createPlayer();

    // create a new player object.
    this.setPlayer1(player1);

    // assign the uuid to the player.
    $gamePlayer.setJabsBattlerUuid(player1.getUuid());

    // update player 1 in the tracker.
    JABS_AiManager.addOrUpdateBattler(player1);
  }

  /**
   * Determines whether or not the player should be initialized.
   * @returns {boolean}  True if the player should, false otherwise.
   */
  canInitializePlayer1()
  {
    // if the player doesn't exist, initialize it.
    if (this._player1 === null) return true;

    // check if the player is currently assigned a battler.
    if (!this._player1.getBattlerId()) return true;

    // initialize the player!
    return false;
  }

  //endregion init

  //region update
  /**
   * Updates all the battlers on the current map.
   * Also, this includes managing player input and updating active JABS actions.
   */
  update()
  {
    // update the player and things related to the player.
    this.updatePlayers();

    // update the AI of non-player battlers.
    this.updateAiBattlers();

    // rebuild the spatial index once per frame before action processing.
    JABS_AiManager.rebuildSpatialIndex();

    // update all active actions on the map.
    this.updateActions();

    // update all JABS states being tracked.
    this.updateJabsStates();

    // handle input from the player(s).
    this.updateInput();
  }

  /**
   * Updates all battlers registered as "players" to JABS.
   * "Players" are battlers that are always polling for actions rather
   * than only as a part of {@link JABS_AiManager.aiPhase2}.
   */
  updatePlayers()
  {
    // grab all the players to update.
    const players = this.getPlayers();

    // update all of them.
    players.forEach(this.updatePlayer, this);
  }

  /**
   * Gets all players that are observed as "players" to JABS.
   * @returns {JABS_Battler[]}
   */
  getPlayers()
  {
    // initialize our player collection.
    const players = [];

    // add the only player we know about: player 1.
    players.push(this.getPlayer1());

    // return that collection.
    return players;
  }

  //region update player
  /**
   * Updates this player's current state.
   */
  updatePlayer(player)
  {
    // if we cannot update the player, then do not.
    if (!this.canUpdatePlayer(player)) return;

    // if the player is dead, handle player defeat.
    if (player.isDead())
    {
      // handle the defeat of the player gracefully.
      this.handleDefeatedPlayer();

      // stop processing.
      return;
    }

    // process any queued actions executed in prior frame.
    player.processQueuedActions();

    // perform all battler updates.
    player.update();
  }

  /**
   * Determines whether or not we can update the player battler.
   * @returns {boolean}
   */
  canUpdatePlayer(player)
  {
    // if we don't have a player, do not update.
    if (player === null) return false;

    // update!
    return true;
  }

  //region state tracking
  /**
   * Gets all ongoing states organized by the uuid of a battler being the key,
   * and a map of all states applied to the battler as the value.
   * @returns {Map<string, Map<number, JABS_State>>}
   */
  getJabsStates()
  {
    return this._jabsStates;
  }

  /**
   * Gets the collection of states that are currently tracked for a given battler's uuid.
   * @param {string} uuid The uuid of the battler to get tracked states for.
   * @returns {Map<number, JABS_State>} The currently tracked states for the given battler.
   */
  getJabsStatesByUuid(uuid)
  {
    // grab a reference to the state tracker.
    const jabsStates = this.getJabsStates();

    // check if the battler has never yet been afflicted with a state.
    if (!jabsStates.has(uuid))
    {
      // initialize this battler.
      jabsStates.set(uuid, new Map());
    }

    // return what exists by that uuid.
    return jabsStates.get(uuid);
  }

  /**
   * Gets all positive states currently tracked for a given battler.
   * @param {string} uuid The uuid of the battler to find positive states for.
   * @returns {JABS_State[]} An array of positive tracked states.
   */
  getPositiveJabsStatesByUuid(uuid)
  {
    // a filter function defining what is a "positive" state.
    /**
     * @param {JABS_State} trackedState
     */
    const filtering = trackedState =>
    {
      // if the state is expired, it is not positive.
      if (trackedState.expired) return false;

      // if the state is the battler's death state, then it is not positive.
      if (trackedState.stateId === trackedState.battler.deathStateId()) return false;

      // grab the state for reference.
      const state = trackedState.battler.state(trackedState.stateId);

      // if it is flagged as a negative state, then it is explicitly negative.
      if (state.jabsNegative) return false;

      // it is positive!
      return true;
    };

    // grab all of this battler's states.
    const jabsStates = this.getJabsStatesByUuid(uuid);

    // convert them to a proper array.
    const states = Array.from(jabsStates.values());

    // return our positive-only filtered states.
    return states.filter(filtering);
  }

  /**
   * Gets all negative states currently tracked for a given battler.
   * @param {string} uuid The uuid of the battler to find negative states for.
   * @returns {JABS_State[]} An array of negative tracked states.
   */
  getNegativeJabsStatesByUuid(uuid)
  {
    // a filter function defining what is a "negative" state.
    const filtering = trackedState =>
    {
      // if the state is expired, it is not negative.
      if (trackedState.expired) return false;

      // if the state is the battler's death state, then it is not negative.
      if (trackedState.stateId === trackedState.battler.deathStateId()) return false;

      // grab the state for reference.
      const state = trackedState.battler.state(trackedState.stateId);

      // if it is not flagged as a negative state, then it is implicitly positive.
      if (!state.jabsNegative) return false;

      // it is negative!
      return true;
    };

    // grab all of this battler's states.
    const jabsStates = this.getJabsStatesByUuid(uuid);

    // convert them to a proper array.
    const states = Array.from(jabsStates.values());

    // return our negative-only filtered states.
    return states.filter(filtering);
  }

  /**
   * Checks whether or not if a given battler has a given state.
   * @param {string} uuid The battler's uuid to check a state for.
   * @param {number} stateId The state id to check if a battler is afflicted with.
   * @returns {boolean} True if the battler is currently afflicted with the given state, false otherwise.
   */
  hasJabsStateByUuid(uuid, stateId)
  {
    // grabs a list of tracked states the battler is currently afflicted with.
    const jabsStates = this.getJabsStatesByUuid(uuid);

    // checks whether or not the state in question has already been applied to the battler.
    return jabsStates.has(stateId);
  }

  /**
   * Gets a tracked state applied against a specific battler.
   * @param {string} uuid The uuid of the battler to find the state for.
   * @param {number} stateId The id of the state to find.
   * @returns {JABS_State|undefined} The tracked state data, or undefined if the battler isn't afflicted.
   */
  getJabsStateByUuidAndStateId(uuid, stateId)
  {
    // grabs a list of tracked states the battler is currently afflicted with.
    const jabsStates = this.getJabsStatesByUuid(uuid);

    // return the tracked state by that id.
    return jabsStates.get(stateId);
  }

  /**
   * Adds anew or updates an existing application of a given state on the given battler.
   * @param {string} uuid The uuid of the battler.
   * @param {JABS_State} jabsState The state in to add or update.
   */
  addOrUpdateStateByUuid(uuid, jabsState)
  {
    // check if the battler has the given state.
    if (this.hasJabsStateByUuid(uuid, jabsState.stateId))
    {
      // reapply the state if its already applied.
      this.updateJabsStateByUuid(uuid, jabsState);

      // stop processing.
      return;
    }

    // add the state anew.
    this.addJabsStateByUuid(uuid, jabsState);
  }

  /**
   * Updates the jabs state applied to a given battler.
   * @param {string} uuid The uuid of the battler.
   * @param {JABS_State} newJabsState The state in to update.
   */
  updateJabsStateByUuid(uuid, newJabsState)
  {
    // get the states afflicted upon this battler.
    const jabsStates = this.getJabsStatesByUuid(uuid);

    // grab the tracked state being updated.
    const oldJabsState = jabsStates.get(newJabsState.stateId);

    // grab the database data of the state being updated.
    const state = oldJabsState.battler.state(oldJabsState.stateId);

    // the type of update to perform on the state.
    const updateType = state.jabsStateReapplyType ?? J.ABS.Metadata.DefaultStateReapplyType;

    // handle the state tracker data update.
    this.handleJabsStateUpdate(updateType, oldJabsState, newJabsState);
  }

  /**
   * Handles the refresh/extend/stack of the tracked state data.
   * @param {string} updateType The type of update to perform on the state.
   * @param {JABS_State} jabsState The previous tracked state data.
   * @param {JABS_State} newJabsState The new tracked state data.
   */
  handleJabsStateUpdate(updateType, jabsState, newJabsState)
  {
    switch (updateType)
    {
      case JABS_State.reapplicationType.Refresh:
        this.refreshJabsState(jabsState, newJabsState);
        break;
      case JABS_State.reapplicationType.Extend:
        this.extendJabsState(jabsState, newJabsState);
        break;
      case JABS_State.reapplicationType.Stack:
        this.stackJabsState(jabsState, newJabsState);
        break;
    }
  }

  /**
   * Refreshes a jabs state with the new duration (typically the same as before).
   * This enables refreshing of a state when afflicted with the same state twice.
   * @param {JABS_State} jabsState The previous tracked state data.
   * @param {JABS_State} newJabsState The new tracked state data.
   */
  refreshJabsState(jabsState, newJabsState)
  {
    // don't refresh the state if it was just applied.
    if (jabsState.wasRecentlyApplied()) return;

    // grab the database data of the state being refreshed.
    const state = jabsState.battler.state(jabsState.stateId);

    // calculate the amount to diminish from the refresh.
    const diminishmentAmount = jabsState.timesRefreshed * state.jabsStateRefreshDiminish;

    // calculate the refreshed amount.
    const refreshAmount = newJabsState.duration - diminishmentAmount;

    // safely capture the duration.
    const actualDuration = Math.max(refreshAmount, -1);

    // refresh the refresh reset counter since this state is being refreshed.
    jabsState.refreshRefreshResetCounter(state.jabsStateRefreshReset);

    // refresh the duration of the existing state.
    jabsState.refreshDuration(actualDuration);
  }

  /**
   * Extends a jabs state with the newly added duration.
   * This permits states to last longer and longer if reapplied repeatedly.
   * @param {JABS_State} jabsState The previous tracked state data.
   * @param {JABS_State} newJabsState The new tracked state data.
   */
  extendJabsState(jabsState, newJabsState)
  {
    // don't refresh the state if it was just applied.
    if (jabsState.wasRecentlyApplied()) return;

    // grab the database data of the state being extended.
    const state = jabsState.battler.state(newJabsState.stateId);

    // amount to extend the state.
    const amountToExtend = state.jabsStateExtendAmount;

    // calculate the new duration.
    const newDuration = jabsState.duration + amountToExtend;

    // determine the capped extended duration.
    const actualDuration = Math.min(newDuration, state.jabsStateExtendMax);

    // refresh the duration of the state.
    jabsState.refreshDuration(actualDuration);
  }

  /**
   * Adds a stack of the given state onto the running tally for this state if available.
   * Also refreshes duration.
   * @param {JABS_State} jabsState The previous tracked state data.
   * @param {JABS_State} newJabsState The new tracked state data.
   */
  stackJabsState(jabsState, newJabsState)
  {
    // don't refresh the state if it was just applied.
    if (jabsState.wasRecentlyApplied()) return;

    // grab the added stacks from the state if applicable.
    const addedStackAmount = newJabsState.battler.state(newJabsState.stateId).jabsStateStacksApplied;

    // increment the stack of the state.
    jabsState.incrementStacks(addedStackAmount);

    // update the underlying base duration to the latest stack's duration.
    jabsState.setBaseDuration(newJabsState.duration);

    // refresh the state as well.
    this.refreshJabsState(jabsState, newJabsState);
  }

  /**
   * Adds the state tracker anew of a given state on the given battler.
   * @param {string} uuid The uuid of the battler.
   * @param {JABS_State} jabsState The state in to add.
   */
  addJabsStateByUuid(uuid, jabsState)
  {
    // get the states afflicted upon this battler.
    const jabsStates = this.getJabsStatesByUuid(uuid);

    // set the state anew.
    jabsStates.set(jabsState.stateId, jabsState);
  }

  /**
   * Updates all JABS states for all battlers that are afflicted.
   */
  updateJabsStates()
  {
    // grab all the battlers and their states being tracked.
    const allBattlersAndStates = this.getJabsStates();

    // iterate over all the battlers and their states.
    allBattlersAndStates.forEach(battlerAndStates =>
    {
      // grab a proper array of the tracked states for this battler.
      const jabsStates = Array.from(battlerAndStates.values());

      // iterate over each of them and update them.
      jabsStates.forEach(jabsState => jabsState.update());
    });
  }

  //endregion state tracking
  //endregion update player

  //region update ai battlers
  /**
   * Updates all battler's
   */
  updateAiBattlers()
  {
    // if we cannot update the battlers controlled by AI, then do not.
    if (!this.canUpdateAiBattlers()) return;

    // grab all on-screen battlers to the player.
    const onScreenBattlers = JABS_AiManager.getBattlersWithinRange(this.getPlayer1(), 30);

    // update each of them.
    onScreenBattlers.forEach(this.performAiBattlerUpdate, this);
  }

  /**
   * Determines whether or not we can update the ai-controlled battlers.
   * @returns {boolean}
   */
  canUpdateAiBattlers()
  {
    return true;
  }

  /**
   * Performs the update against this non-player battler.
   *
   * NOTE: The player's battler gets duplicated once into the "all battlers"
   * collection after the first party cycle. The initial check prevents updating
   * the player battler twice if they are in that collection.
   * @param {JABS_Battler} battler
   */
  performAiBattlerUpdate(battler)
  {
    // if this battler is the player, do not update.
    if (battler === this.getPlayer1()) return;

    // update the battler.
    battler.update();

    // check if the battler was defeated and needs handling.
    if (this.shouldHandleDefeatedTarget(battler))
    {
      // render battler invincible while processing defeat.
      battler.setInvincible();

      // process defeat.
      this.handleDefeatedTarget(battler, this.getPlayer1());
    }
  }

  /**
   * Determines whether or not a battler should be handled as defeated.
   * @param {JABS_Battler} target The potentially defeated battler.
   * @returns {boolean} true if the battler should be handled for defeat, false otherwise.
   */
  shouldHandleDefeatedTarget(target)
  {
    // target is not considered defeated if not dead.
    if (!target.isDead()) return false;

    // target is not considered defeated while dying.
    if (target.isDying()) return false;

    // do not re-handle defeated targets.
    if (target.isEnemy() && target.getCharacter()
      .isErased())
    {
      return false;
    }

    // target is defeated!
    return true;
  }

  //endregion update ai battlers

  //region update input
  /**
   * Handles the player input.
   */
  updateInput()
  {
    // do not process input if we cannot process it.
    if (!this.canUpdateInput()) return;

    // update the input.
    if (!JABS_InputAdapter.hasControllers())
    {
      console.warn(`No input managers have been registered with the input adapter!`);
      console.warn(`if you built your own, be sure to run "JABS_InputAdapter.register(controller)"!`);
    }
  }

  /**
   * Determines whether or not to process JABS input.
   * @returns {boolean}
   */
  canUpdateInput()
  {
    // if an event is executing on the map, do not update.
    if ($gameMap.isEventRunning()) return false;

    // if the message window is up, do not update.
    if ($gameMessage.isBusy()) return false;

    // if the jabs menu is up, do not update.
    if ($jabsEngine.requestAbsMenu) return false;

    // if the JABS engine is paused, do not update.
    if ($jabsEngine.absPause) return false;

    // if the JABS engine is disabled, do not update.
    if (!$jabsEngine.absEnabled) return false;

    // update!
    return true;
  }

  /**
   * Actually executes the party cycling and swaps to the next living member.
   */
  performPartyCycling()
  {
    // if we cannot party cycle, then do not.
    if (!this.canPerformPartyCycling()) return;

    // a hook for things to do immediately before party cycling.
    this.prePartyCycling();

    // the management of party rearrangement during party cycling.
    this.handlePartyCycleMemberChanges();

    // perform hook for party cycling.
    this.onPartyCycling();

    // perform hook for post party cycling.
    this.postPartyCycling();
  }

  /**
   * Determines whether or not party cycling can be performed with any of the
   * current members of the party.
   * @returns {boolean} True if party cycling can be performed, false otherwise.
   */
  canPerformPartyCycling()
  {
    // determine which battler in the party is the next living battler.
    const nextAllyIndex = $gameParty._actors.findIndex(this.canCycleToAlly);

    // if we have no next ally index, we cannot party cycle.
    if (nextAllyIndex === -1) return false;

    // lets party cycle!
    return true;
  }

  /**
   * A hook for things to do prior to party cycling.
   */
  prePartyCycling()
  {
    // do nothing.
  }

  /**
   * Handles the shift or changes in party line up when party cycling.
   */
  handlePartyCycleMemberChanges()
  {
    for (let partyIndex = 0; partyIndex < $gameParty._actors.length; partyIndex++)
    {
      // and swap them to the end.
      $gameParty._actors.push($gameParty._actors.shift());

      // you can't cycle to yourself.
      if (partyIndex === 0) continue;

      // identify the newly swapped actorId.
      const [ currentActorId ] = $gameParty._actors;

      // grab the actor we are attempting to cycle to.
      const actor = $gameActors.actor(currentActorId);

      // don't switch to a dead member.
      if (actor.isDead()) continue;

      // don't switch with a member that is locked.
      if (actor.switchLocked()) continue;

      // we can stop cycling!
      break;
    }

    $gamePlayer.refresh();

    // also trigger an update against the new leader.
    $gameParty.leader()
      .onBattlerDataChange();

    // recreate the JABS player battler and set it to the player character.
    this.refreshPlayer1Data();
  }

  /**
   * A hook for things to do upon party cycling successfully.
   */
  onPartyCycling()
  {
    // perform the various effects for party cycling.
    this.partyCyclingEffects();
  }

  /**
   * The various effects of party cycling, such as animations and logging.
   */
  partyCyclingEffects()
  {
    // perform the party cycle animation.
    this.partyCycleAnimation();

    // handle the party cycle logging.
    this.partyCycleLogging();
  }

  /**
   * Handle the animation for party cycling.
   */
  partyCycleAnimation()
  {
    // grab the current player 1.
    const player1 = this.getPlayer1();

    // perform the party cycle animation.
    player1.getCharacter()
      .requestAnimation(40);
  }

  /**
   * Handle logging for party cycling.
   */
  partyCycleLogging()
  {
    // if we are not logging, then do not.
    if (!J.LOG) return;

    // grab the current player 1.
    const player1 = this.getPlayer1();

    // build and write the log.
    const partyCycleLog = new ActionLogBuilder()
      .setupPartyCycle(player1.battlerName())
      .build();
    $actionLogManager.addLog(partyCycleLog);
  }

  /**
   * Handle actions to perform after party cycling, such as flagging the engine for refresh.
   */
  postPartyCycling()
  {
    // request the scene overlord to take notice and react accordingly (refresh hud etc).
    this.requestPartyRotation = true;

    // request a map-wide sprite refresh on cycling.
    this.requestSpriteRefresh = true;
  }

  /**
   * Determines whether or not this member can be party cycled to.
   * @param {number} actorId The id of the actor.
   * @param {number} partyIndex The index of the member in the party.
   * @returns
   */
  canCycleToAlly(actorId, partyIndex)
  {
    // ignore switching to self.
    if (partyIndex === 0) return false;

    // grab the actor we are attempting to cycle to.
    const actor = $gameActors.actor(actorId);

    // don't switch to a dead member.
    if (actor.isDead()) return false;

    // don't switch with a member that is locked.
    if (actor.switchLocked()) return false;

    // perform!
    return true;
  }

  //endregion update input

  //region update actions
  /**
   * Updates all tracked actions currently on the battle map.
   */
  updateActions()
  {
    // grab the current collection of actions.
    const actionEvents = this.getAllActionEvents();

    // if we have no actions currently tracked, then do not process them.
    if (actionEvents.length === 0) return;

    // update each of the actions.
    actionEvents.forEach(action => action.update());
  }

  //endregion update actions
  //endregion update

  //region actions
  /**
   * Generates a new JABS action based on a skillId, and executes the skill.
   * This overrides the need for costs or cooldowns.<br/>
   * This is intended to be used for programmatically forcing battlers to execute skills, and can be
   * used from within an event's move route, or anywhere else you have a reference to a {@link JABS_Battler}.
   * @param {JABS_Battler} caster The battler executing the skill.
   * @param {number} skillId The skill to be executed.
   * @param {boolean=} isRetaliation Whether or not this skill is from a retaliation; defaults to false.
   * @param {number=} targetX The target's `x` coordinate; defaults to null.
   * @param {number=} targetY The target's `y` coordinate; defaults to null.
   * @param {boolean=} isMapDamage Whether or not this skill is from an environmental hazard.
   */
  forceMapAction(caster, skillId, isRetaliation = false, targetX = null, targetY = null, isMapDamage = false)
  {
    // build options based on inputs.
    const actionLocation = JABS_Location.Builder()
      .setX(targetX)
      .setY(targetY)
      .build();
    const actionOptions = JABS_ActionOptions.Builder()
      .setIsRetaliation(isRetaliation)
      .setLocation(actionLocation)
      .setIsTerrainDamage(isMapDamage)
      .build();

    // generate the forced actions based on the given skill id.
    const actions = caster.createJabsActionFromSkill(skillId, actionOptions);

    // if we cannot execute map actions, then do not.
    if (!this.canExecuteMapActions(caster, actions)) return;

    // iterate over each action and execute them as the caster.
    actions.forEach(action => this.executeMapAction(caster, action, targetX, targetY));
  }

  /**
   * Executes all provided actions at the given coordinates if possible.
   * @param {JABS_Battler} caster The battler executing the action.
   * @param {JABS_Action[]} actions All actions to perform.
   * @param {number|null} targetX The target's `x` coordinate, if applicable.
   * @param {number|null} targetY The target's `y` coordinate, if applicable.
   */
  executeMapActions(caster, actions, targetX = null, targetY = null)
  {
    // if we cannot execute map actions, then do not.
    if (!this.canExecuteMapActions(caster, actions)) return;

    // apply on-execution effects for this action.
    this.applyOnExecutionEffects(caster, actions[0]);

    // assign locally because overwriting input args is bad etiquette.
    let actualX = targetX;
    let actualY = targetY;

    // if coordinates were not provided, consult the decision-time location captured in options.
    if (targetX === null || targetY === null)
    {
      // grab the primary action from the collection.
      const [ primary ] = actions;

      // retrieve the options from the primary action.
      const options = primary.getActionOptions();

      // attempt to read a frozen location from the options.
      const loc = options
        ? options.getTargetLocation()
        : null;

      // if available, extract coordinates and override null inputs.
      if (loc)
      {
        // assign the frozen x coordinate.
        actualX = loc.getX();

        // assign the frozen y coordinate.
        actualY = loc.getY();
      }
    }

    // iterate over each action and execute them as the caster.
    actions.forEach(action => this.executeMapAction(caster, action, actualX, actualY));
  }

  /**
   * Determines whether or not the given map actions can be executed by the caster.
   * @param {JABS_Battler} caster The battler executing the action.
   * @param {JABS_Action[]} actions All actions to perform.
   * @returns {boolean} True if the actions can be executed, false otherwise.
   */
  canExecuteMapActions(caster, actions)
  {
    // if there are no actions to execute, then do not execute.
    if (!actions.length) return false;

    // execute!
    return true;
  }

  /**
   * Applies any on-execution effects to the caster based on the actions.
   * @param {JABS_Battler} caster The battler executing the skill.
   * @param {JABS_Action} primaryAction The 0th index action.
   */
  applyOnExecutionEffects(caster, primaryAction)
  {
    // retaliation skills are exempt from execution effects.
    if (primaryAction.isRetaliation()) return;

    // pay the primary action's skill costs.
    this.paySkillCosts(caster, primaryAction);

    // apply the necessary cooldowns for the action against the caster.
    this.applyCooldownCounters(caster, primaryAction);
  }

  /**
   * Executes the provided JABS action.
   * It generates a copy of an event from the "ActionMap" and fires it off
   * based on it's move route.
   * @param {JABS_Battler} caster The `JABS_Battler` executing the JABS action.
   * @param {JABS_Action} action The JABS action to execute.
   * @param {number?} targetX The target's `x` coordinate, if applicable.
   * @param {number?} targetY The target's `y` coordinate, if applicable.
   */
  executeMapAction(caster, action, targetX, targetY)
  {
    // handle the possibility of "freecombo".
    this.handleActionCombo(caster, action);

    // handle the cast animation for this action.
    this.handleActionCastAnimation(caster, action);

    // handle the one-off on-cast animation on the caster at execution time.
    this.handleActionOnCastAnimation(caster, action);

    // handle the generation of the action on the map.
    this.handleActionGeneration(caster, action, targetX, targetY);
  }

  /**
   * Handles the combo functionality behind this action.
   * @param {JABS_Battler} caster The `JABS_Battler` executing the JABS action.
   * @param {JABS_Action} action The JABS action to execute.
   */
  handleActionCombo(caster, action)
  {
    // check if this action has the "freecombo" tag.
    if (action.getBaseSkill().jabsFreeCombo)
    {
      // trigger the free combo effect for this action.
      this.checkComboSequence(caster, action);
    }
  }

  /**
   * Handles the cast animation functionality behind this action.
   * @param {JABS_Battler} caster The `JABS_Battler` executing the JABS action.
   * @param {JABS_Action} action The JABS action to execute.
   */
  handleActionCastAnimation(caster, action)
  {
    // check if a cast animation exists.
    const casterAnimation = action.getCastAnimation();
    if (casterAnimation)
    {
      // execute the cast animation.
      caster.getCharacter()
        .requestAnimation(casterAnimation);
    }
  }

  /**
   * Handles the single-fire, on-cast animation on the caster at execution time.
   * @param {JABS_Battler} caster The `JABS_Battler` executing the JABS action.
   * @param {JABS_Action} action The JABS action to execute.
   */
  handleActionOnCastAnimation(caster, action)
  {
    // only perform if an on-cast animation id is configured.
    if (action.hasOnCastAnimationId())
    {
      // play it once on the caster’s character.
      action.performOnCastAnimation(caster);
    }
  }

  /**
   * Handles adding this action to the map if applicable.
   * @param {JABS_Battler} caster The `JABS_Battler` executing the JABS action.
   * @param {JABS_Action} action The JABS action to execute.
   * @param {number|null} x The target's `x` coordinate, if applicable.
   * @param {number|null} y The target's `y` coordinate, if applicable.
   */
  handleActionGeneration(caster, action, x, y)
  {
    // all actions start with null.
    let actionEventData = null;

    // determine if this action should create an event on the map.
    // non-direct actions always create events; direct actions only do so if coords are provided.
    const shouldCreateEvent = (!action.isDirectAction()) || (x !== null && y !== null);

    // check if we determined we should create an event.
    if (shouldCreateEvent)
    {
      // construct the action event data to appear visually on the map.
      actionEventData = this.buildActionEventData(caster, action, x, y);

      // add the event to the map and bind it to the action.
      this.addJabsActionToMap(actionEventData, action);
    }

    // add the action to the tracker regardless of whether an event was created.
    this.addActionEvent(action, actionEventData);
  }

  /**
   * It generates a copy of an event from the "ActionMap".
   * @param {JABS_Battler} caster The `JABS_Battler` executing the JABS action.
   * @param {JABS_Action} action The JABS action to execute.
   * @param {number|null} x The target's `x` coordinate, if applicable.
   * @param {number|null} y The target's `y` coordinate, if applicable.
   * @returns {rm.types.Event}
   */
  buildActionEventData(caster, action, x, y)
  {
    // reference the action event id defined on the action.
    const eventId = action.getActionId();

    // copy the event data from the action map for this action.
    const actionEventData = JsonEx.makeDeepCopy($actionMap.events[eventId]);

    // derive spawn coordinates from provided or caster position.
    let spawnX = x ?? caster.getX();

    // this aligns with AABB/collision using `screenY() - (th / 2)` for origin.
    let spawnY = (y ?? caster.getY());

    // apply per-projectile lateral offset if present; defaults are 0 so single-projectile
    // skills are unaffected. for multi-projectile volleys, the delta was stored at decision
    // time and is applied here against the caster's fire-time position.
    const options = action.getActionOptions();
    if (options)
    {
      spawnX += options.getSpawnOffsetX();
      spawnY += options.getSpawnOffsetY();
    }

    // assign the spawn coordinates to the action event.
    actionEventData.x = spawnX;
    actionEventData.y = spawnY;

    // flag this event data as an action for downstream handling.
    actionEventData.isAction = true;

    // bump id to avoid conflicts.
    actionEventData.id += 1000;

    // attach the action uuid for cross-referencing.
    actionEventData.uniqueId = action.getUuid();

    // default the deletion flag.
    // not deleted by default.
    actionEventData.actionDeleted = false;

    // return the mutated copy.
    return actionEventData;
  }

  /**
   * Determines the directions of all projectiles for a given formation and count.
   * @param {number} facing The base direction the battler is facing (2/4/6/8 and diagonals).
   * @param {string} formation The formation name.
   * @param {number} count The projectile count per direction.
   * @returns {number[]} The flat collection of directions to fire projectiles.
   */
  determineActionDirections(facing, formation, count = 1)
  {
    // resolve the spokes for the requested formation.
    const spokes = this.resolveFormationSpokes(facing, formation);

    // determine whether count is per spoke or total.
    const perSpoke = this.isPerSpokeFormation(formation);

    // initialize the collection of directions.
    const directions = [];

    // if count is per-spoke, repeat each spoke count times.
    if (perSpoke)
    {
      // iterate over each spoke direction.
      spokes.forEach(dir =>
      {
        // push this spoke direction once per count.
        for (let i = 0; i < count; i++)
        {
          // add the direction.
          directions.push(dir);
        }
      });
    }
    // otherwise, count is total for a single spoke.
    else
    {
      // use the first (and only) spoke when not per-spoke.
      const forward = spokes[0] ?? facing;

      // push the single spoke direction once per count.
      for (let i = 0; i < count; i++)
      {
        // add the direction.
        directions.push(forward);
      }
    }

    // return the built collection of directions.
    return directions;
  }

  /**
   * Resolves the spoke directions for a formation relative to a given facing.
   * Assumes `formation` is a valid token from `J.ABS.ProjectileFormations`.
   * @param {number} facing The base direction the battler is facing.
   * @param {string} formation One of the `J.ABS.ProjectileFormations.*` values.
   * @returns {number[]} The ordered list of spoke directions.
   */
  resolveFormationSpokes(facing, formation)
  {
    // initialize the canonical spokes as if facing were up.
    let canonical;

    // choose spokes based on the provided formation constant.
    switch (formation)
    {
      case J.ABS.ProjectileFormations.Spray:
      {
        // forward, forward-right, forward-left (relative to up).
        canonical = [
          J.ABS.Directions.UP,
          J.ABS.Directions.UPPERRIGHT,
          J.ABS.Directions.UPPERLEFT,
        ];
        break;
      }
      case J.ABS.ProjectileFormations.Cross:
      {
        // the four cardinals.
        canonical = [
          J.ABS.Directions.UP,
          J.ABS.Directions.RIGHT,
          J.ABS.Directions.DOWN,
          J.ABS.Directions.LEFT,
        ];
        break;
      }
      case J.ABS.ProjectileFormations.Xburst:
      {
        // diagonals only.
        canonical = [
          J.ABS.Directions.UPPERRIGHT,
          J.ABS.Directions.LOWERRIGHT,
          J.ABS.Directions.LOWERLEFT,
          J.ABS.Directions.UPPERLEFT,
        ];
        break;
      }
      case J.ABS.ProjectileFormations.Nova:
      {
        // all eight directions.
        canonical = [
          J.ABS.Directions.UP,
          J.ABS.Directions.UPPERRIGHT,
          J.ABS.Directions.RIGHT,
          J.ABS.Directions.LOWERRIGHT,
          J.ABS.Directions.DOWN,
          J.ABS.Directions.LOWERLEFT,
          J.ABS.Directions.LEFT,
          J.ABS.Directions.UPPERLEFT,
        ];
        break;
      }
      case J.ABS.ProjectileFormations.Line:
      default:
      {
        // single forward spoke.
        canonical = [ J.ABS.Directions.UP ];
        break;
      }
    }

    // rotate the canonical spokes such that canonical forward(UP) becomes the actual facing.
    const rotated = canonical.map(dir => this.rotateSpokeFromUpToFacing(dir, facing));

    // return the rotated spokes.
    return rotated;
  }

  /**
   * Determines if a formation interprets `count` as per-spoke multiplier.
   * @param {string} formation The formation name.
   * @returns {boolean} True if per-spoke, false if total.
   */
  isPerSpokeFormation(formation)
  {
    // multi-spoke formations use per-spoke counts; line is total.
    if (formation === J.ABS.ProjectileFormations.Spray) return true;
    if (formation === J.ABS.ProjectileFormations.Cross) return true;
    if (formation === J.ABS.ProjectileFormations.Xburst) return true;
    if (formation === J.ABS.ProjectileFormations.Nova) return true;

    // otherwise, interpreted as total (line, default).
    return false;
  }

  /**
   * Rotates a canonical direction (defined relative to UP) to the provided facing.
   * Composes 45° steps so cardinals and diagonals share one code path.
   * @param {number} canonicalDir The canonical direction (as-if facing were UP).
   * @param {number} facing The actual facing to rotate into.
   * @returns {number} The rotated direction code.
   */
  rotateSpokeFromUpToFacing(canonicalDir, facing)
  {
    // no twist when already aligned with the canonical "up" forward axis.
    if (facing === J.ABS.Directions.UP)
    {
      return canonicalDir;
    }

    // clockwise order of 8-direction codes starting at UP (map space, Y-down).
    const clockwiseFromUp = [
      J.ABS.Directions.UP,
      J.ABS.Directions.UPPERRIGHT,
      J.ABS.Directions.RIGHT,
      J.ABS.Directions.LOWERRIGHT,
      J.ABS.Directions.DOWN,
      J.ABS.Directions.LOWERLEFT,
      J.ABS.Directions.LEFT,
      J.ABS.Directions.UPPERLEFT,
    ];

    const steps = clockwiseFromUp.indexOf(facing);

    // guard unknown facings so we never rotate into garbage.
    if (steps === -1)
    {
      return canonicalDir;
    }

    // each step is 45° clockwise; compose with the existing helper.
    let rotated = canonicalDir;
    for (let i = 0; i < steps; i++)
    {
      rotated = this.rotate45degrees(rotated, true);
    }

    return rotated;
  }

  /**
   * Converts logical travel facing into a direction safe for RMMZ character sheet rows.
   * {@link Sprite_Character#characterPatternY} uses `(direction - 2) / 2`, which only works for
   * cardinals; diagonals yield fractional rows and corrupt `$` single-character sheets.
   * @param {number} travelDir The JABS / map travel direction (1–9).
   * @param {number} castedCardinal The caster's facing at fire time (expects 2/4/6/8).
   * @returns {2|4|6|8} A cardinal for {@link Game_Character#setDirection} on action sprites.
   */
  // eslint-disable-next-line complexity
  actionTravelDirectionToSpritePatternDirection(travelDir, castedCardinal)
  {
    // TODO: reduce complexity via lookup matrix by castedCardinal+travelDir.
    if (travelDir === 2 || travelDir === 4 || travelDir === 6 || travelDir === 8)
    {
      return travelDir;
    }

    const casted = castedCardinal;
    const rev = d =>
    {
      if (d === 2) return 8;
      if (d === 8) return 2;
      if (d === 4) return 6;
      if (d === 6) return 4;
      return d;
    };

    if (travelDir !== 1 && travelDir !== 3 && travelDir !== 7 && travelDir !== 9)
    {
      if (casted === 2 || casted === 4 || casted === 6 || casted === 8)
      {
        return casted;
      }

      return 2;
    }

    let result;
    switch (casted)
    {
      case 2:
      {
        switch (travelDir)
        {
          case 1:
          case 3:
            result = casted;
            break;
          case 7:
          case 9:
            result = rev(casted);
            break;
          default:
            result = casted;
            break;
        }
        break;
      }
      case 4:
      {
        switch (travelDir)
        {
          case 1:
          case 7:
            result = casted;
            break;
          case 3:
          case 9:
            result = rev(casted);
            break;
          default:
            result = casted;
            break;
        }
        break;
      }
      case 6:
      {
        switch (travelDir)
        {
          case 3:
          case 9:
            result = casted;
            break;
          case 1:
          case 7:
            result = rev(casted);
            break;
          default:
            result = casted;
            break;
        }
        break;
      }
      case 8:
      {
        switch (travelDir)
        {
          case 7:
          case 9:
            result = casted;
            break;
          case 1:
          case 3:
            result = rev(casted);
            break;
          default:
            result = casted;
            break;
        }
        break;
      }
      default:
      {
        result = casted;
        break;
      }
    }

    if (result === 2 || result === 4 || result === 6 || result === 8)
    {
      return result;
    }

    return 2;
  }

  /**
   * Resolves the projectile formation for a given skill.
   * Parsing is responsible for validation; engine code assumes correctness.
   * Defaults to `line` when not provided.
   * @param {RPG_Skill} skill The skill being executed.
   * @returns {string} The formation name.
   */
  resolveProjectileFormationForSkill(skill)
  {
    // default to line if nothing is specified on the skill.
    const formation = skill.jabsProjectileFormation ?? J.ABS.ProjectileFormations.Line;

    // return the resolved formation.
    return formation;
  }

  /**
   * Resolves the projectile count for a given skill.
   * Defaults to `1` when not provided.
   * @param {RPG_Skill} skill The skill being executed.
   * @returns {number} The projectile count.
   */
  resolveProjectileCountForSkill(skill)
  {
    // default to 1 if nothing is specified on the skill.
    const count = skill.jabsProjectile ?? 1;

    // return the resolved projectile count.
    return count;
  }

  /**
   * Rotates the direction provided 45 degrees.
   * @param {number} direction The base direction to rotate from.
   * @param {boolean} clockwise True if rotating clockwise, false otherwise.
   * @returns {number} The direction after rotation.
   */
  rotate45degrees(direction, clockwise)
  {
    let newDirection = direction;
    switch (direction)
    {
      case J.ABS.Directions.UP:
        newDirection = clockwise
          ? J.ABS.Directions.UPPERRIGHT
          : J.ABS.Directions.UPPERLEFT;
        break;
      case J.ABS.Directions.RIGHT:
        newDirection = clockwise
          ? J.ABS.Directions.LOWERRIGHT
          : J.ABS.Directions.UPPERRIGHT;
        break;
      case J.ABS.Directions.LEFT:
        newDirection = clockwise
          ? J.ABS.Directions.UPPERLEFT
          : J.ABS.Directions.LOWERLEFT;
        break;
      case J.ABS.Directions.DOWN:
        newDirection = clockwise
          ? J.ABS.Directions.LOWERLEFT
          : J.ABS.Directions.LOWERRIGHT;
        break;
      case J.ABS.Directions.LOWERLEFT:
        newDirection = clockwise
          ? J.ABS.Directions.LEFT
          : J.ABS.Directions.DOWN;
        break;
      case J.ABS.Directions.LOWERRIGHT:
        newDirection = clockwise
          ? J.ABS.Directions.DOWN
          : J.ABS.Directions.RIGHT;
        break;
      case J.ABS.Directions.UPPERLEFT:
        newDirection = clockwise
          ? J.ABS.Directions.UP
          : J.ABS.Directions.LEFT;
        break;
      case J.ABS.Directions.UPPERRIGHT:
        newDirection = clockwise
          ? J.ABS.Directions.RIGHT
          : J.ABS.Directions.UP;
        break;
    }
    return newDirection;
  }

  /**
   * Rotates the direction provided 90 degrees.
   * @param {number} direction The base direction to rotate from.
   * @param {boolean} clockwise True if rotating clockwise, false otherwise.
   * @returns {number} The direction after rotation.
   */
  rotate90degrees(direction, clockwise)
  {
    let newDirection = direction;
    switch (direction)
    {
      case J.ABS.Directions.UP:
        newDirection = clockwise
          ? 6
          : 4;
        break;
      case J.ABS.Directions.RIGHT:
        newDirection = clockwise
          ? 2
          : 8;
        break;
      case J.ABS.Directions.LEFT:
        newDirection = clockwise
          ? 8
          : 2;
        break;
      case J.ABS.Directions.DOWN:
        newDirection = clockwise
          ? 4
          : 6;
        break;
      case J.ABS.Directions.LOWERLEFT:
        newDirection = clockwise
          ? 7
          : 3;
        break;
      case J.ABS.Directions.LOWERRIGHT:
        newDirection = clockwise
          ? 1
          : 9;
        break;
      case J.ABS.Directions.UPPERLEFT:
        newDirection = clockwise
          ? 9
          : 1;
        break;
      case J.ABS.Directions.UPPERRIGHT:
        newDirection = clockwise
          ? 3
          : 7;
        break;
      default:
        console.warn('non-dir8 provided, no rotation performed.');
        break;
    }

    return newDirection;
  }

  /**
   * Rotates the direction provided 180 degrees.
   * @param {number} direction The base direction to rotate from.
   * @returns {number} The direction after rotation.
   */
  rotate180degrees(direction)
  {
    let newDirection = direction;
    switch (direction)
    {
      case J.ABS.Directions.UP:
        newDirection = 2;
        break;
      case J.ABS.Directions.RIGHT:
        newDirection = 4;
        break;
      case J.ABS.Directions.LEFT:
        newDirection = 6;
        break;
      case J.ABS.Directions.DOWN:
        newDirection = 8;
        break;
      case J.ABS.Directions.LOWERLEFT:
        newDirection = 9;
        break;
      case J.ABS.Directions.LOWERRIGHT:
        newDirection = 7;
        break;
      case J.ABS.Directions.UPPERLEFT:
        newDirection = 3;
        break;
      case J.ABS.Directions.UPPERRIGHT:
        newDirection = 1;
        break;
      default:
        console.warn('non-dir8 provided, no rotation performed.');
        break;
    }

    return newDirection;
  }

  /**
   * Checks whether or not this skill is a basic attack.
   * @param {string} cooldownKey The cooldown key to check.
   * @returns {boolean} True if the skill is a basic attack, false otherwise.
   */
  isBasicAttack(cooldownKey)
  {
    const isMainHand = cooldownKey === JABS_Button.Mainhand;
    const isOffHand = cooldownKey === JABS_Button.Offhand;
    return (isMainHand || isOffHand);
  }

  /**
   * Pays the costs for the skill (mp/tp default) if applicable.
   * @param {JABS_Battler} caster The battler casting the action.
   * @param {JABS_Action} action The action(skill) to pay the cost for.
   */
  paySkillCosts(caster, action)
  {
    const battler = caster.getBattler();
    const skill = action.getBaseSkill();
    battler.paySkillCost(skill);
  }

  /**
   * Applies the cooldowns to the battler.
   * @param {JABS_Battler} caster The `JABS_Battler` executing the JABS action.
   * @param {JABS_Action} action The JABS action to execute.
   */
  applyCooldownCounters(caster, action)
  {
    this.applyPlayerCooldowns(caster, action);
  }

  /**
   * Applies per-slot (or unique) skill cooldowns for the player after an action, then optionally stamps the
   * battler-wide GCD. When global cooldown is enabled and the skill is subject to it,
   * {@link J.ABS.Globals.GlobalCooldownKey} is set to the computed duration so other GCD-subject skills cannot fire
   * until it elapses.
   * @param {JABS_Battler} caster The player.
   * @param {JABS_Action} action The JABS action to execute.
   */
  applyPlayerCooldowns(caster, action)
  {
    const cooldownType = action.getCooldownType();
    const cooldownValue = action.getCooldown();
    const skill = action.getBaseSkill();

    // if the skill has a unique cooldown functionality,
    // then each slot will have an independent cooldown.
    if (skill.jabsUniqueCooldown || this.isBasicAttack(cooldownType))
    {
      // if the skill is unique, only apply the cooldown to the slot assigned.
      caster.setCooldownCounter(cooldownType, cooldownValue);
    }
    else
    {
      // if the skill is not unique, then the cooldown applies to all slots it is equipped to.
      const equippedSkills = caster.getBattler()
        .getAllEquippedSkills();
      equippedSkills.forEach(skillSlot =>
      {
        if (skillSlot.id === skill.id)
        {
          caster.setCooldownCounter(skillSlot.key, cooldownValue);
        }
      });
    }

    if (JABS_GlobalCooldown.skillIsSubjectToGlobalCooldown(skill))
    {
      const gcdFrames = JABS_GlobalCooldown.framesForSkill(skill);
      caster.setCooldownCounter(J.ABS.Globals.GlobalCooldownKey, gcdFrames);
    }
  }

  /**
   * Creates a new JABS action and adds it to the map and tracking.
   * @param {rm.types.Event} actionEventData An object representing the data of a `Game_Event`.
   * @param {JABS_Action} action An object representing the data of a `Game_Event`.
   */
  addJabsActionToMap(actionEventData, action)
  {
    // find the first available hole in the data map event list.
    // the index we will insert at.
    let index = -1;
    for (let i = 0; i < $dataMap.events.length; i++)
    {
      // if an empty spot is found, use that.
      if (!$dataMap.events[i])
      {
        // capture the hole index.
        index = i;
        // stop searching.
        break;
      }
    }

    // if no hole was found, append to the end.
    if (index === -1)
    {
      // assign next index.
      index = $dataMap.events.length;
    }

    // add the data to the $dataMap.events at the chosen index.
    // keep array dense.
    $dataMap.events[index] = actionEventData;
    // persist the action index.
    actionEventData.actionIndex = index;

    // assign this so it exists, but isn't valid.
    // not a loot event.
    actionEventData.lootIndex = 0;

    // create the event by hand with this new data.
    // construct sprite.
    const actionEventSprite = new Game_Event(J.ABS.DefaultValues.ActionMap, index);

    const {
      x: actionX,
      y: actionY
      // extract coordinates.
    } = actionEventData;
    // align position.
    actionEventSprite._realX = actionX;
    // align position.
    actionEventSprite._realY = actionY;
    // align grid x.
    actionEventSprite._x = actionX;
    // align grid y.
    actionEventSprite._y = actionY;

    // give it a name.
    // get skill name.
    const skillName = action.getBaseSkill().name;
    const casterName = action.getCaster()
      // get caster name.
      .battlerName();
    // tag for debugging/tools.
    actionEventSprite.__actionName = `_${casterName}-${skillName}-${index}`;

    // on rare occasions, the timing of adding an action to the map coincides with the removal of the caster.
    if (!actionEventData || !actionEventData.pages.length)
    {
      // preserve existing behavior.
      console.error('that rare error occurred!');
      // stop if invalid.
      return;
    }

    // resolve page index.
    const pageIndex = actionEventSprite.findProperPageIndex();
    const {
      characterIndex,
      characterName
      // extract image data.
    } = actionEventData.pages[pageIndex].image;

    // flag to add sprite.
    actionEventSprite.setActionSpriteNeedsAdding();
    // assign event id.
    actionEventSprite._eventId = actionEventData.id;
    // assign sprite name.
    actionEventSprite._characterName = characterName;
    // assign sprite index.
    actionEventSprite._characterIndex = characterIndex;
    // get page.
    const pageData = actionEventData.pages[pageIndex];
    // stamp synthetic note once from template event + this page so Comment `<vis*>` tags merge with skill notes later.
    action.stampActionMapVisualNoteFromActionEvent(actionEventData, pageData);
    // frequency.
    actionEventSprite.setMoveFrequency(pageData.moveFrequency);
    // route.
    actionEventSprite.setMoveRoute(pageData.moveRoute);
    // stamp which way the caster was facing at fire time (cardinal row hint for $ sheets).
    actionEventSprite.setCastedDirection(action.getCaster()
      .getCharacter()
      .direction());

    this.applyActionToActionEventSprite(actionEventSprite, action);

    // prevent player interaction with the action event.
    // no-op start.
    actionEventSprite.start = () => false;

    // associate back.
    action.setActionSprite(actionEventSprite);
    // add to map, with hole reuse.
    $gameMap.addEvent(actionEventSprite);
    // trigger render.
    this.requestActionRendering = true;
  }

  /**
   * Applies the {@link JABS_Action} to the {@link Game_Event}
   * @param {Game_Event} actionEventSprite The event being created for the action.
   * @param {JABS_Action} action The action being applied.
   */
  applyActionToActionEventSprite(actionEventSprite, action)
  {
    // wire action.
    actionEventSprite.setJabsAction(action);

    // logical travel can be diagonal (8-dir projectiles), but RMMZ sprite framing
    // only supports four rows — keep map facing cardinal for the bitmap slice.
    const travel = action.direction();
    const casted = actionEventSprite.getCastedDirection();
    const patternDir = this.actionTravelDirectionToSpritePatternDirection(travel, casted);
    actionEventSprite.setDirection(patternDir);
  }

  /**
   * Adds the loot to the map.
   * @param {number} x The `x` coordinate of the battler dropping the loot.
   * @param {number} y The `y` coordinate of the battler dropping the loot.
   * @param {RPG_EquipItem|RPG_Item} item The loot's raw data object.
   */
  addLootDropToMap(x, y, item)
  {
    // clone the loot data from the action map event id of 1.
    // base template.
    const lootEventData = JsonEx.makeDeepCopy($actionMap.events[1]);

    // position x.
    lootEventData.x = x;
    // position y.
    lootEventData.y = y;

    // find the first available hole in the data map event list.
    // the index we will insert at.
    let index = -1;
    for (let i = 0; i < $dataMap.events.length; i++)
    {
      // if an empty spot is found, use that.
      if (!$dataMap.events[i])
      {
        // capture the hole index.
        index = i;
        // stop searching.
        break;
      }
    }

    // if no hole was found, append to the end.
    if (index === -1)
    {
      // assign next index.
      index = $dataMap.events.length;
    }

    // add the loot event to the datamap list of events.
    // keep array dense.
    $dataMap.events[index] = lootEventData;
    // persist the loot index.
    lootEventData.lootIndex = index;

    // create the loot event by hand with this new data.
    // create loot model.
    const jabsLootData = new JABS_LootDrop(item);
    // associate unique id.
    lootEventData.uuid = jabsLootData.uuid;

    // set the duration of this loot drop
    // if a custom time is available, then use that, otherwise use the default.
    // lifetime.
    jabsLootData.duration = item.jabsExpiration ?? J.ABS.Metadata.DefaultLootExpiration;

    // generate a new event to visually represent the loot drop and flag it for adding.
    // use the reused/appended index.
    const eventId = index;
    // construct sprite.
    const lootEvent = new Game_Event($gameMap.mapId(), eventId);
    // attach loot.
    lootEvent.setJabsLoot(jabsLootData);

    // flag for adding a character sprite later via HUD/spriteset integration (unchanged elsewhere).
    // if your code uses such a flag.
    lootEvent.setLootNeedsAdding();

    // add to the map, reusing holes in the live event list as well.
    // will reuse holes per updated addEvent().
    $gameMap.addEvent(lootEvent);

    // trigger the spriteset to scan and add loot sprites.
    // ensure loot renders this frame.
    this.requestLootRendering = true;

    // return the loot drop that was added.
    return lootEvent;
  }

  /**
   * Generates an enemy and transplants it in the place of the corresponding index
   * of the eventId on the battle map.
   * @param {number} x The x coordinate of where to place the enemy on the map.
   * @param {number} y The y coordinate of where to place the enemy on the map.
   * @param {number} enemyCloneEventId The eventId from the enemy clone map identifying the enemy to clone.
   */
  addEnemyToMap(x, y, enemyCloneEventId)
  {
    // check if we've initialized the enemy map, yet.
    if (!JABS_Engine.#isEnemyMapInitialized())
    {
      // if not, then initialize the enemy map data and load it up for use.
      JABS_Engine.initializeEnemyMap();
    }

    // grab the enemy event data to clone from.
    const originalEnemyData = JABS_Engine.getEnemyCloneList()
      .at(enemyCloneEventId);

    // if there is no data, then we can't clone that id.
    if (!originalEnemyData)
    {
      console.error(`The enemy id of [ ${enemyCloneEventId} ] did not align with an event on the enemy clone map.`);
      return;
    }

    // clone the enemy data from the enemy map.
    const enemyData = JsonEx.makeDeepCopy(originalEnemyData);

    // assign our cloned event the original event's x and y coordinates.
    enemyData.x = x;
    enemyData.y = y;

    // for usage in the arrays around the database, the 1st item of the arrays are null.
    const normalizedIndex = $dataMap.events.length;

    // update the metadata of the map with our data instead.
    $dataMap.events[normalizedIndex] = enemyData;

    // generate a new event based on this JABS enemy.
    const newEnemy = new Game_Event($gameMap.mapId(), normalizedIndex);

    // add the enemy to the map and flag it for adding (visually).
    $gameMap.addEvent(newEnemy);
    newEnemy.flagBattlerForAdding();
    this.requestBattlerRendering = true;

    // return the event in case callers need it.
    return newEnemy;
  }

  /**
   * Applies an action against a designated target battler.
   *
   * This is the orchestration method that manages the execution of an action against
   * a given target.
   * @param {JABS_Action} action The JABS action containing the action data.
   * @param {JABS_Battler} target The target having the action applied against.
   */
  applyPrimaryBattleEffects(action, target)
  {
    // execute the action against the target.
    this.executeSkillEffects(action, target);

    // apply effects that require landing a successful hit.
    this.applyOnHitEffects(action, target);

    // applies additional effects that come after the skill execution.
    this.continuedPrimaryBattleEffects(action, target);

    // run any additional functionality that we needed to run after a skill is executed.
    this.postPrimaryBattleEffects(action, target);
  }

  /**
   * Attempts to execute the skill effects of this action against the target.
   * @param {JABS_Action} action The action being executed.
   * @param {JABS_Battler} target The target to apply skill effects against.
   * @returns {Game_ActionResult}
   */
  executeSkillEffects(action, target)
  {
    // grab the battler of the target.
    const targetBattler = target.getBattler();

    // grab the result.
    const result = targetBattler.result();

    // first thing's first, clear the action from any historical action data.
    result.clear();

    // handle any pre-execution effects.
    this.preExecuteSkillEffects(action, target);

    // get whether or not this action was unparryable.
    let isUnparryable = action.isUnparryable();

    // check if this is for healing.
    if (action.isHealing())
    {
      // targets cannot parry healing-exclusive abilities.
      isUnparryable = true;
    }

    // check whether or not this action was parried.
    const caster = action.getCaster();

    let willParry = false;
    if (isUnparryable === false && this.canAttemptImplicitParry(target))
    {
      willParry = this.checkParry(caster, target, action);
    }

    // check if the action is parryable and was parried.
    if (willParry)
    {
      // when an action is parried, it gets completely undone.
      result.clear();

      // flag the result for being parried.
      result.parried = true;
    }

    // check if the action was guarded.
    if (target.guarding())
    {
      // grab the result.
      const nextResult = targetBattler.result();

      // flag that the action was guarded.
      nextResult.guarded = true;
    }

    // apply the action to the target.
    const gameAction = action.getAction();
    gameAction.apply(targetBattler);

    // handle any post-execution effects.
    this.postExecuteSkillEffects(action, target);
  }

  /**
   * Execute any pre-execution effects.<br>
   * This occurs before the actual skill is applied against the target battler to get the `Game_ActionResult` that is
   * then used throughout execution.
   * @param {JABS_Action} action The JABS action containing the action data.
   * @param {JABS_Battler} target The target having the action applied against.
   */
  // eslint-disable-next-line no-unused-vars
  preExecuteSkillEffects(action, target)
  {
  }

  /**
   * Execute any post-execution effects.
   * This occurs after the actual skill is executed against the target battler.
   * @param {JABS_Action} action The action being executed.
   * @param {JABS_Battler} target The target to apply skill effects against.
   */
  postExecuteSkillEffects(action, target)
  {
    // apply aggro regardless of successful hit.
    this.applyAggroEffects(action, target);
  }

  /**
   * Applies all aggro effects against the target.
   * @param {JABS_Action} action The JABS action containing the action data.
   * @param {JABS_Battler} target The target having the action applied against.
   */
  applyAggroEffects(action, target)
  {
    // grab the attacker.
    const attacker = action.getCaster();

    // don't aggro your allies against you! That's dumb.
    if (JABS_TeamRules.isFriendly(attacker.getTeam(), target.getTeam())) return;

    // grab the result on the target, from the action executed.
    const result = target.getBattler()
      .result();

    // the default/base aggro.
    let aggro = J.ABS.Metadata.BaseAggro;

    // hp damage counts for 1.
    if (result.hpDamage > 0)
    {
      aggro += result.hpDamage * J.ABS.Metadata.AggroPerHp;
    }

    // mp damage counts for 2.
    if (result.mpDamage > 0)
    {
      aggro += result.mpDamage * J.ABS.Metadata.AggroPerMp;
    }

    // tp damage counts for 10.
    if (result.tpDamage > 0)
    {
      aggro += result.tpDamage * J.ABS.Metadata.AggroPerTp;
    }

    // if the attacker also healed from it, extra aggro for each point healed!
    if (result.drain)
    {
      aggro += result.hpDamage * J.ABS.Metadata.AggroDrain;
    }

    // if the attacker was parried, reduce aggro on this battler...
    if (result.parried)
    {
      aggro += J.ABS.Metadata.AggroParryFlatAmount;
      // ...and also increase the aggro of the attacking battler!
      attacker.addUpdateAggro(target.getUuid(), J.ABS.Metadata.AggroParryUserGain);
    }

    // apply any bonus aggro from the underlying skill.
    aggro += action.bonusAggro();

    // apply the aggro multiplier from the underlying skill.
    aggro *= action.aggroMultiplier();

    // apply any aggro amplification from states.
    attacker.getBattler()
      .states()
      .forEach(state =>
      {
        if (state.jabsAggroOutAmp >= 0)
        {
          aggro *= state.jabsAggroOutAmp;
        }
      });

    // apply any aggro reduction from states.
    target.getBattler()
      .states()
      .forEach(state =>
      {
        if (state.jabsAggroInAmp >= 0)
        {
          aggro *= state.jabsAggroInAmp;
        }
      });

    // apply the TGR multiplier from the attacker.
    aggro *= attacker.getBattler().tgr;

    // the player can attack tremendously faster than the AI can...
    // ...so reduce the aggro dealt to compensate.
    if (attacker.isPlayer())
    {
      aggro *= J.ABS.Metadata.AggroPlayerReduction;
    }

    // apply the aggro to the target.
    target.addUpdateAggro(attacker.getUuid(), aggro);
  }

  /**
   * Applies on-hit effects against the target.
   * @param {JABS_Action} action The JABS action containing the action data.
   * @param {JABS_Battler} target The target having the action applied against.
   */
  applyOnHitEffects(action, target)
  {
    // if the result isn't a hit or a parry, then we don't process on-hit effects.
    const result = target.getBattler()
      .result();
    if (!result.isHit() && !result.parried) return;

    // it was a hit, so process the on-hit effects.
    this.processOnHitEffects(action, target);
  }

  /**
   * Processes the various on-hit effects against the target.
   * @param {JABS_Action} action The JABS action containing the action data.
   * @param {JABS_Battler} target The target having the action applied against.
   */
  processOnHitEffects(action, target)
  {
    // grab some shorthand variables for local use.
    const caster = action.getCaster();
    const targetCharacter = target.getCharacter();
    const skill = action.getBaseSkill();

    // get the animation id associated with this skill.
    const targetAnimationId = this.getAnimationId(skill, caster);

    const result = target.getBattler()
      .result();

    // if the skill should animate on the target, then animate as normal.
    const animationId = result.parried
      ? 122
      : targetAnimationId;
    targetCharacter.requestAnimation(animationId);

    // if there is a self-animation id, apply that to yourself for every hit.
    if (action.hasSelfAnimationId())
    {
      action.performSelfAnimation();
    }

    // if freecombo-ing, then we already checked for combo when executing the action.
    if (!skill.jabsFreeCombo)
    {
      this.checkComboSequence(caster, action);
    }

    this.checkKnockback(action, target);
    this.triggerAlert(caster, target);

    // if the attacker and the target are the same team, then don't set that as "last hit".
    if (JABS_TeamRules.isOpposed(caster.getTeam(), target.getTeam()))
    {
      caster.setBattlerLastHit(target);

      // refresh in‑combat timers on real engagements only.
      const isHealing = action.isHealing();
      const hitOrParry = (result.isHit() || result.parried);
      if (hitOrParry && isHealing === false && target.isInanimate() === false)
      {
        // both sides are considered engaged.
        caster.enterCombat();
        target.enterCombat();
      }
    }
  }

  /**
   * Forces the target hit to be knocked back.
   * @param {JABS_Action} action The action potentially knocking the target back.
   * @param {JABS_Battler} target The map battler to potentially knockback.
   */
  // eslint-disable-next-line complexity
  checkKnockback(action, target)
  {
    // if we can't be knocked back, don't process.
    if (!this.canBeKnockedBack(action, target)) return;

    // you cannot be knocked back by healing-exclusive actions.
    if (action.isHealing()) return;

    const targetNotes = target.getBattler()
      .getAllNotes();

    // determine the current knockback resist of the target.
    const targetKnockbackResist = RPGManager.getSumFromAllNotesByRegex(targetNotes, J.ABS.RegExp.KnockbackResist);

    // don't even knock them up or around at all, they are immune to knockback.
    // having 100 or more resistance means they don't even hop in place.
    if (targetKnockbackResist >= 100) return;

    // get the knockback value from the skill if applicable.
    let knockback = action.getKnockback();

    // check to make sure the skill has knockback before processing.
    if (knockback === null) return;

    // multiply the knockback by the remaining effectiveness (100 - resistance).
    knockback *= ((100 - targetKnockbackResist) / 100);

    const targetSprite = target.getCharacter();

    // check if the knockback is 0, or the action is direct.
    if (knockback === 0 || action.isDirectAction())
    {
      // hop in place.
      targetSprite.jump(0, 0);

      // stop processing.
      return;
    }

    // calculate where the knockback would send the target.
    const actionSprite = action.getActionSprite();
    const knockbackDirection = actionSprite.direction();
    let xPlus = 0;
    let yPlus = 0;
    switch (knockbackDirection)
    {
      case J.ABS.Directions.UP:
        yPlus -= Math.ceil(knockback);
        break;
      case J.ABS.Directions.DOWN:
        yPlus += Math.ceil(knockback);
        break;
      case J.ABS.Directions.LEFT:
        xPlus -= Math.ceil(knockback);
        break;
      case J.ABS.Directions.RIGHT:
        xPlus += Math.ceil(knockback);
        break;
    }

    const maxX = targetSprite.x + xPlus;
    const maxY = targetSprite.y + yPlus;
    let realX = targetSprite.x;
    let realY = targetSprite.y;
    let canPass = true;

    // dynamically test each square to ensure you don't cross any unpassable tiles.
    while (canPass && (realX !== maxX || realY !== maxY))
    {
      switch (knockbackDirection)
      {
        case J.ABS.Directions.UP:
          realY--;
          canPass = targetSprite.canPass(realX, realY, knockbackDirection);
          if (!canPass) realY++;
          break;
        case J.ABS.Directions.DOWN:
          realY++;
          canPass = targetSprite.canPass(realX, realY, knockbackDirection);
          if (!canPass) realY--;
          break;
        case J.ABS.Directions.LEFT:
          realX--;
          canPass = targetSprite.canPass(realX, realY, knockbackDirection);
          if (!canPass) realX++;
          break;
        case J.ABS.Directions.RIGHT:
          realX++;
          canPass = targetSprite.canPass(realX, realY, knockbackDirection);
          if (!canPass) realX--;
          break;
        default:
          canPass = false;
          break;
      }
    }

    // execute the jump to the new destination.
    targetSprite.jump(realX - targetSprite.x, realY - targetSprite.y);
  }

  canBeKnockedBack(action, target)
  {
    // don't knockback if already being knocked back.
    if (target.getCharacter()
      .isJumping())
    {
      return false;
    }

    // don't knockback if the attack was parried with finesse.
    if (target.getBattler()
      .result().parried)
    {
      return false;
    }

    // being knocked back is possible.
    return true;
  }

  /**
   * Determines if there is a combo action that should succeed this skill.
   * @param {JABS_Battler} caster The battler that casted this skill.
   * @param {JABS_Action} action The action that contains the skill to check for combos.
   */
  checkComboSequence(caster, action)
  {
    // check to make sure we have combo data before processing the combo.
    if (!this.canUpdateComboSequence(caster, action)) return;

    // execute the combo action.
    this.updateComboSequence(caster, action);
  }

  /**
   * Determines whether or not the caster can update their combo data based on
   * the given action.
   * @param {JABS_Battler} caster The caster of the action.
   * @param {JABS_Action} action The action executed.
   * @returns {boolean} True if the combo action should be updated, false otherwise.
   */
  canUpdateComboSequence(caster, action)
  {
    // grab the skill out of the action.
    const skill = action.getBaseSkill();

    // if we do not have a combo, we cannot combo.
    if (!skill.jabsComboAction) return false;

    // if the battler doesn't know the combo skill, we cannot combo.
    if (!caster.getBattler()
      .hasSkill(skill.jabsComboSkillId))
    {
      return false;
    }

    // execute combo actions!
    return true;
  }

  /**
   * Updates the combo action data for the caster.
   * The next time the appropriate slot is executed, the combo skill will execute instead.
   * @param {JABS_Battler} caster The caster of the action.
   * @param {JABS_Action} action The action executed.
   */
  updateComboSequence(caster, action)
  {
    // extract the combo data out of the skill.
    const {
      jabsComboSkillId,
      jabsComboDelay
    } = action.getBaseSkill();

    // determine which slot to apply cooldowns to.
    const cooldownKey = action.getCooldownType();

    // clarifies that this check is whether or not the next combo skill is a continuation of the combo.
    const isComboAction = (caster.getComboNextActionId(cooldownKey) !== jabsComboSkillId);

    // check if this is actually a combo action to the last action.
    if (isComboAction)
    {
      // its a combo skill, so also extend the base cooldown by the combo cooldown.
      caster.modCooldownCounter(cooldownKey, jabsComboDelay);

      caster.setPhase(2);
    }

    // update the next combo data.
    caster.setComboFrames(cooldownKey, jabsComboDelay);
    caster.setComboNextActionId(cooldownKey, jabsComboSkillId);
  }

  /**
   * Whether implicit (facing + GRD vs HIT) parry may roll for this target.
   * While guarding, only explicit timed parry applies; casting and dashing
   * suppress implicit parry only.
   * @param {JABS_Battler} target The defender.
   * @returns {boolean} True if implicit parry is allowed this frame.
   */
  canAttemptImplicitParry(target)
  {
    if (target.guarding()) return false;

    if (target.isCasting()) return false;

    const character = target.getCharacter();
    if (character && character.isDashing()) return false;

    return true;
  }

  /**
   * Calculates whether or not the attack was parried by implicit (passive) parry.
   * Uses ratio of attacker pressure A to defender pressure D with dominance
   * multiplier M from plugin metadata. Baseline pressure uses floor + per-level on each
   * side: attacker from caster level, defender from target level. Caller must use
   * {@link #canAttemptImplicitParry} first; timed parry while guarding is handled in
   * {@link Game_Action.handleGuardEffects}.
   * @param {JABS_Battler} caster The battler performing the action.
   * @param {JABS_Battler} target The target the action is against.
   * @param {JABS_Action} action The action being executed.
   * @returns {boolean} True if the action was parried, false otherwise.
   */
  checkParry(caster, target, action)
  {
    // cannot parry if not facing target.
    if (!this.isParryPossible(caster, target)) return false;

    // grab the caster and target battlers.
    const targetBattler = target.getBattler();
    const casterBattler = caster.getBattler();

    // grab the amount of parry ignored.
    const parryIgnoredFactor = (100 - (action.getBaseSkill().jabsIgnoreParry ?? 0)) / 100;

    const hundredX = value => parseFloat((value * 100).toFixed(3));
    const tenPercent = value => parseFloat((value * 0.1).toFixed(3));

    const baselineFloor = J.ABS.Metadata.ImplicitParryBaselineFloor;
    const baselinePerLevel = J.ABS.Metadata.ImplicitParryBaselinePerLevel;
    const baselineA = baselineFloor + baselinePerLevel * Math.max(0, casterBattler.level - 1);
    const baselineD = baselineFloor + baselinePerLevel * Math.max(0, targetBattler.level - 1);

    // defender pressure D (scaled by ignoreParry on the skill).
    const baseGrd = baselineD + hundredX(targetBattler.grd - 1);
    const bonusGrdFromAgi = tenPercent(targetBattler.agi);
    const bonusGrdFromLuk = tenPercent(targetBattler.luk);
    const D = (baseGrd + bonusGrdFromAgi + bonusGrdFromLuk) * parryIgnoredFactor;

    // attacker pressure A (level scaling matches Game_Action: caster vs target).
    const baseHit = hundredX(casterBattler.hit) + baselineA;
    const bonusHitFromAgi = tenPercent(casterBattler.agi);
    const bonusHitFromLuk = tenPercent(casterBattler.luk);
    let A = baseHit + bonusHitFromAgi + bonusHitFromLuk;

    if (J.LEVEL && J.LEVEL.Metadata.enabled)
    {
      const levelMul = LevelScaling.multiplier(
        casterBattler.level,
        targetBattler.level,
        LevelScaling.Scope.COMBAT
      );
      A *= levelMul;
    }

    const defenderFloor = 1;
    const ratio = A / Math.max(D, defenderFloor);

    let M = J.ABS.Metadata.ImplicitParryDominanceMultiplier;
    if (!Number.isFinite(M) || M <= 1)
    {
      M = 2;
    }

    const invM = 1 / M;

    if (ratio >= M)
    {
      return false;
    }

    if (ratio <= invM)
    {
      return true;
    }

    const span = M - invM;
    const t = (ratio - invM) / span;
    const parryChancePercent = Math.round(100 * (1 - t));

    if (parryChancePercent >= 100)
    {
      return true;
    }

    if (parryChancePercent <= 0)
    {
      return false;
    }

    const rng = Math.randomInt(100) + 1;
    return rng <= parryChancePercent;
  }

  /**
   * Prerequisites for implicit {@link #checkParry} (facing, GRD, attacker ignore-parry states).
   * @param {JABS_Battler} caster The one executing the skill against the target.
   * @param {JABS_Battler} target The one being attacked by the caster.
   */
  isParryPossible(caster, target)
  {
    // cannot parry if not facing target.
    const isFacing = caster.isFacingTarget(target.getCharacter());
    if (!isFacing) return false;

    // if the target battler has 0 GRD, they can't parry.
    if (target.getBattler().grd <= 0) return false;

    // if the attacker has a state that ignores all parry, then skip parrying.
    if (caster.getBattler()
      .ignoreAllParry())
    {
      return false;
    }

    // parrying is possible!
    return true;
  }

  /**
   * If the battler is hit from outside of it's engagement range,
   * trigger the alert state.
   * @param {JABS_Battler} attacker The battler triggering the alert.
   * @param {JABS_Battler} target The battler entering the alert state.
   */
  triggerAlert(attacker, target)
  {
    // check if the target can actually be alerted first.
    if (!this.canBeAlerted(attacker, target)) return;

    // alert the target!
    target.showBalloon(J.ABS.Balloons.Question);
    target.setAlertedCoordinates(attacker.getX(), attacker.getY());
    const alertDuration = target.getAlertDuration();
    target.setAlertedCounter(alertDuration);

    // a brief pause the first time entering the alerted state.
    if (!target.isAlerted())
    {
      target.setWaitCountdown(45);
    }
  }

  /**
   * Checks if the battler can even be alerted in the first place.
   * @param {JABS_Battler} attacker The battler that initiated the alert.
   * @param {JABS_Battler} battler The battler to be alerted.
   * @return {boolean} True if they can be alerted, false otherwise.
   */
  canBeAlerted(attacker, battler)
  {
    // cannot be alerted by inanimate battlers.
    if (attacker.isInanimate()) return false;

    // cannot alert your own allies.
    if (JABS_TeamRules.isFriendly(attacker.getTeam(), battler.getTeam())) return false;

    // cannot alert the player.
    if (battler.isPlayer()) return false;

    // cannot alert battlers that are already engaged.
    if (battler.isEngaged()) return false;

    // cannot alert inanimate objects.
    if (battler.isInanimate()) return false;

    return true;
  }

  /**
   * Applies all effects to the target that occur after the skill execution is complete.
   * @param {JABS_Action} action The JABS action containing the action data.
   * @param {JABS_Battler} target The target having the action applied against.
   */
  continuedPrimaryBattleEffects(action, target)
  {
    // checks for retaliation from the target.
    this.checkRetaliate(action, target);
  }

  /**
   * Executes a retalation if necessary on receiving a hit.
   * @param {JABS_Action} action The action affecting the target.
   * @param {JABS_Battler} targetBattler The target having the action applied against.
   */
  checkRetaliate(action, targetBattler)
  {
    // do not retaliate against other battler's retaliations.
    if (action.isRetaliation()) return;

    // do not retaliate against being targeted by battlers of the same team.
    if (JABS_TeamRules.isFriendly(action.getCaster().getTeam(), targetBattler.getTeam()))
    {
      return;
    }

    // check if the target battler is an actor.
    if (targetBattler.isActor())
    {
      // handle player retaliations.
      this.handleActorRetaliation(targetBattler);
    }
    // they must be an enemy.
    else
    {
      // handle non-player retaliations.
      this.handleEnemyRetaliation(targetBattler);
    }
  }

  /**
   * Executes any retaliation the player may have when receiving a hit.
   * @param {JABS_Battler} battler The battler doing the retaliating.
   */
  handleActorRetaliation(battler)
  {
    // grab the action result.
    const actionResult = battler.getBattler()
      .result();

    // for tracking to prevent both counterguarding AND counterparrying simultaneously.
    let didCounterParry = false;

    // check if the action was parried and the battler isn't guarding.
    if (actionResult.parried || battler.parrying())
    {
      // handle the battler's parry reaction.
      didCounterParry = this.handleCounterParry(battler);
    }

    // handle counter-guarding next.
    const didCounterGuard = this.handleCounterGuard(battler, didCounterParry);

    // if we have autocounter, trigger those if we haven't already done the other.
    if (!didCounterParry && !didCounterGuard)
    {
      // TODO: is it unbalanced to auto-counter with every hit?
      this.handleAutoCounter(battler);
    }

    // grab all the retaliation skills for this battler.
    const retaliationSkills = battler.getBattler()
      .retaliationSkills();

    // if there are any passive retaliation skills to perform...
    if (retaliationSkills.length)
    {
      // ...perform them!
      retaliationSkills.forEach(skillChance =>
      {
        if (skillChance.shouldTrigger())
        {
          this.forceMapAction(battler, skillChance.skillId, true);
        }
      });
    }
  }

  /**
   * Handles the parry actions.
   * @param {JABS_Battler} battler The battler to parry with.
   */
  handleCounterParry(battler)
  {
    // validate the battler can parry.
    if (!this.canBattlerParry(battler)) return false;

    // execute the counterparry.
    this.doCounterParry(battler, JABS_Button.Offhand);

    // indicate we did a counterparry.
    return true;
  }

  /**
   * Executes any retaliation the player may have when receiving a hit.
   * @param {JABS_Battler} battler The battler doing the retaliating.
   * @returns {boolean} True if the battler can parry, false otherwise.
   */
  canBattlerParry(battler)
  {
    // there is nothing to parry with if the battler has no parry ids.
    if (battler.counterParry().length === 0) return false;

    // the battler can parry!
    return true;
  }

  handleCounterGuard(battler, alreadyCounterParried)
  {
    // do nothing if the battler already counter-parried, no double-dipping!
    if (alreadyCounterParried) return false;

    // NOTE: you cannot perform both a counterguard AND a counterparry- counterparry takes priority!
    const needsCounterGuard = battler.guarding() && battler.counterGuard().length;

    // if we should be counter-guarding.
    if (needsCounterGuard)
    {
      // execute the counterguard.
      this.doCounterGuard(battler, JABS_Button.Offhand);

      // indicate we did counterguard.
      return true;
    }

    // we did not counterguard.
    return false;
  }

  /**
   * If the counter rate is sufficient, then automatically perform your counterskills on any
   * incoming passive parry!
   * @param {JABS_Battler} battler The battler performing the counter.
   */
  handleAutoCounter(battler)
  {
    // stop processing if we cannot autocounter.
    if (!this.canAutoCounter(battler)) return;

    // check if RNG favors you.
    const shouldAutoCounter = battler.getBattler().cnt > Math.random();

    // if RNG did actually favor you, then proceed.
    if (shouldAutoCounter)
    {
      // perform the autocounter.
      this.doAutoCounter(battler, JABS_Button.Offhand);
    }
  }

  /**
   * Commands the {@link JABS_Battler} to perform an autocounter.
   * This will attempt to execute all counterguard/counterparry skill ids available
   * in the given slot.
   * @param {JABS_Battler} battler The battler doing the autocounter.
   * @param {string=} slot The skill slot key; defaults to {@link JABS_Button.Offhand}.<br>
   */
  doAutoCounter(battler, slot = JABS_Button.Offhand)
  {
    // execute counterparrying.
    this.doCounterParry(battler, slot);

    // execute counterguarding.
    this.doCounterGuard(battler, slot);
  }

  /**
   * Executes any counterguard skills available to the given battler.
   * @param {JABS_Battler} battler The battler to perform the skills.
   * @param {string=} slot The skill slot key; defaults to {@link JABS_Button.Offhand}.<br>
   */
  doCounterGuard(battler, slot = JABS_Button.Offhand)
  {
    // destructure out the guard and parry ids.
    const { counterGuardIds } = battler.getGuardData(slot);

    // check if we even have any skills to counterguard with.
    if (counterGuardIds.length)
    {
      // iterate over each of them and auto-counterguard!
      counterGuardIds.forEach(id => this.forceMapAction(battler, id, true));
    }
  }

  /**
   * Executes any counterparry skills available to the given battler.
   * @param {JABS_Battler} battler The battler to perform the skills.
   * @param {string=} slot The skill slot key; defaults to {@link JABS_Button.Offhand}.<br>
   */
  doCounterParry(battler, slot = JABS_Button.Offhand)
  {
    // destructure out the parry ids.
    const { counterParryIds } = battler.getGuardData(slot);

    // check if we even have any skills to counterparry with.
    if (counterParryIds.length)
    {
      // iterate over each of them and auto-counterparry!
      counterParryIds.forEach(id => this.forceMapAction(battler, id, true));
    }
  }

  /**
   * Determines whether or not the battler can perform any sort of autocountering.
   * @param {JABS_Battler} battler The battler to potentially autocounter.
   * @returns {boolean} True if we should try to autocounter, false otherwise.
   */
  canAutoCounter(battler)
  {
    // shorthand the guard data from your offhand.
    const guardData = battler.getGuardData(JABS_Button.Offhand);

    // if we have no guard data, don't try to autocounter.
    if (!guardData) return false;

    // if we are unable to perform a counter, don't try to autocounter.
    if (!guardData.canCounter()) return false;

    // we should try to autocounter.
    return true;
  }

  /**
   * Executes any retaliation the enemy may have when receiving a hit at any time.
   * @param {JABS_Battler} enemy The enemy's `JABS_Battler`.
   */
  handleEnemyRetaliation(enemy)
  {
    // assumes enemy battler is enemy.
    const retaliationSkills = enemy.getBattler()
      .retaliationSkills();

    // if there are any passive retaliation skills to perform...
    if (retaliationSkills.length)
    {
      // ...perform them!
      retaliationSkills.forEach(skillChance =>
      {
        if (skillChance.shouldTrigger())
        {
          this.forceMapAction(enemy, skillChance.skillId, true);
        }
      });
    }
  }

  /**
   * Executes a retalation if necessary on receiving a hit.
   * @param {JABS_Action} action The action affecting the target.
   * @param {JABS_Battler} target The target having the action applied against.
   */
  postPrimaryBattleEffects(action, target)
  {
    // generate log for this action.
    this.createAttackLog(action, target);

  }

  /**
   * Generates a log in the `Map_TextLog` if applicable.
   * It is important to note that only HP damage is published to the log.
   * @param {JABS_Action} action The action affecting the target.
   * @param {JABS_Battler} target The `JABS_Battler` who was the target of the action.
   */
  createAttackLog(action, target)
  {
    // if not enabled, skip this.
    if (!J.LOG) return;

    // gather shorthand variables for use.
    const result = target.getBattler()
      .result();
    const caster = action.getCaster();
    const skill = action.getBaseSkill();

    const casterName = caster.getBattlerDatabaseData().name;
    const targetName = target.getBattlerDatabaseData().name;

    // create parry logs if it was parried.
    if (result.parried)
    {
      const parryLog = new ActionLogBuilder()
        .setupParry(targetName, casterName, skill.id, target.parrying())
        .build();
      $actionLogManager.addLog(parryLog);
      return;
    }
    // create evasion logs if it was evaded.
    else if (result.evaded)
    {
      const dodgeLog = new ActionLogBuilder()
        .setupDodge(targetName, casterName, skill.id)
        .build();
      $actionLogManager.addLog(dodgeLog);
      return;
    }
    // create retaliation logs if it was a retaliation.
    else if (action.isRetaliation())
    {
      const retaliationLog = new ActionLogBuilder()
        .setupRetaliation(casterName)
        .build();
      $actionLogManager.addLog(retaliationLog);
    }
    // if no damage of any kind was dealt, and no states were applied, then you get a special message!
    else if (!result.hpDamage && !result.mpDamage && !result.tpDamage && !result.addedStates.length)
    {
      const undamagedLog = new ActionLogBuilder()
        .setupUndamaged(targetName, casterName, skill.id)
        .build();
      $actionLogManager.addLog(undamagedLog);
      return;
    }
    if (result.hpDamage)
    {
      // otherwise, it must be a regular damage type log.
      // get the base damage dealt and clean that up.
      let roundedDamage = Math.round(result.hpDamage);
      const isNotHeal = roundedDamage > 0;
      roundedDamage = roundedDamage >= 0
        ? roundedDamage
        : roundedDamage.toString()
          .replace('-', String.empty);
      const damageReduction = Math.round(result.reduced);
      let reducedAmount = String.empty;
      if (damageReduction)
      {
        reducedAmount = `(${parseInt(damageReduction)})`;
      }

      // when its terrain damage slapping you, show the logs a bit differently.
      if (action.isTerrainDamage())
      {
        const terrainAttackLog = new ActionLogBuilder()
          .setupTerrainDamage(targetName, skill.id, roundedDamage, reducedAmount, !isNotHeal, result.critical)
          .build();
        $actionLogManager.addLog(terrainAttackLog);
      }
      else
      {
        const actionExecutedLog = new ActionLogBuilder()
          .setupExecution(targetName, casterName, skill.id, roundedDamage, reducedAmount, !isNotHeal, result.critical)
          .build();
        $actionLogManager.addLog(actionExecutedLog);
      }

      // fall through in case there were states that were also applied, such as defeating the target.
    }

    // also publish any logs regarding application of states against the target.
    if (result.addedStates.length)
    {
      result.addedStates.forEach(stateId =>
      {
        // show a custom line when an enemy is defeated.
        if (stateId === target.getBattler()
          .deathStateId())
        {
          const targetDefeatedLog = new ActionLogBuilder()
            .setupTargetDefeated(targetName)
            .build();
          $actionLogManager.addLog(targetDefeatedLog);
          return;
        }

        // show all the rest of the non-death states.
        const stateAfflictedLog = new ActionLogBuilder()
          .setupStateAfflicted(targetName, stateId)
          .build();
        $actionLogManager.addLog(stateAfflictedLog);
      });
    }
  }

  /**
   * Translates a skill's elemental affiliation into the icon id representing it.
   * @param {RPG_Skill} skill The skill reference data itself.
   * @param {JABS_Battler} caster The battler performing the action.
   * @returns {number} The icon index to use for this popup.
   */
  determineElementalIcon(skill, caster)
  {
    // if not using the elemental icons, don't return one.
    if (!J.ABS.Metadata.UseElementalIcons) return 0;

    let { elementId } = skill.damage;

    // if the battler is an actor and the action is based on the weapon's elements
    // probe the weapon's traits for its actual element.
    if (elementId === -1 && caster.isActor())
    {
      const attackElements = caster.getBattler()
        .attackElements();
      if (attackElements.length)
      {
        // we pick only the first element!
        [ elementId, ] = attackElements;
      }
      else
      {
        elementId = 0;
      }
    }

    // if its an item, then use the item's icon index.
    if (DataManager.isItem(skill))
    {
      return $dataItems[skill.id].iconIndex;
    }

    const iconData = J.ABS.Metadata.ElementalIcons;
    const elementalIcon = iconData.find(data => data.element === elementId);
    return elementalIcon
      ? elementalIcon.icon
      : 0;
  }

  //endregion actions

  //region collision
  /**
   * Checks this JABS action against all map battlers to determine collision.
   * If there is a collision, then a `Game_Action` is applied.
   * @param {JABS_Action} jabsAction The JABS action to check against all battlers.
   * @returns {JABS_Battler[]} A collection of `JABS_Battler`s that this action hit.
   */
  getCollisionTargets(jabsAction)
  {
    // start by grabbing the action and running through priority of collision.
    const gameAction = jabsAction.getAction();
    const casterJabsBattler = jabsAction.getCaster();

    // self-targeting takes FIRST PRIORITY.
    if (gameAction.isForUser())
    {
      // return only the caster as the target.
      return [ casterJabsBattler ];
    }

    // grab the allied target selected by the caster of this action.
    const allyTarget = casterJabsBattler.getAllyTarget();

    // ally targeting takes SECOND PRIORITY.
    if (allyTarget && gameAction.isForOne())
    {
      // validate the action can connect with the targeted ally.
      if (allyTarget.canActionConnect() && allyTarget.isWithinScope(jabsAction, allyTarget, false))
      {
        // hit the ally only.
        return [ allyTarget ];
      }
    }

    // filter to only the battlers that can connect with this action.
    const canActionConnectWithBattler = battler =>
    {
      // this battler is untargetable.
      if (!battler.canActionConnect()) return false;

      // the action's scopes don't meet the criteria for this target.
      // excludes the "single"-hitonce check.
      if (!battler.isWithinScope(jabsAction, battler)) return false;

      // if the attacker is an enemy, do not consider inanimate targets.
      if (casterJabsBattler.isEnemy() && battler.isInanimate()) return false;

      // this battler is potentially hit-able.
      return true;
    };

    // a few definitions used within collision processing.
    const actionSprite = jabsAction.getActionSprite();
    const range = jabsAction.getRange();
    const shape = jabsAction.getShape();
    const targetsHit = [];
    let hitOne = false;

    // define a helper to query spatial candidates by AABB in tile-space.
    const queryCandidates = () =>
    {
      // direct actions that have an action sprite (spatialized) use sprite position.
      if (jabsAction.isDirectAction() && actionSprite)
      {
        // read the center tile from the action sprite.
        const cx = actionSprite.x;
        const cy = actionSprite.y;

        // build the inclusive bounds using the action range.
        const minX = Math.floor(cx - range);
        const minY = Math.floor(cy - range);
        const maxX = Math.ceil(cx + range);
        const maxY = Math.ceil(cy + range);

        // return the candidates from the spatial index.
        return JABS_AiManager.queryBattlersInAabb(minX, minY, maxX, maxY);
      }

      // direct actions without a sprite use caster proximity and/or target coordinates.
      if (jabsAction.isDirectAction() && !actionSprite)
      {
        // grab the caster location in tiles.
        const cx = Math.floor(casterJabsBattler.getX());
        const cy = Math.floor(casterJabsBattler.getY());

        // use proximity radius for the AABB.
        const radius = jabsAction.getProximity();

        // build the inclusive bounds using the proximity value.
        const minX = cx - radius;
        const minY = cy - radius;
        const maxX = cx + radius;
        const maxY = cy + radius;

        // return the candidates from the spatial index.
        return JABS_AiManager.queryBattlersInAabb(minX, minY, maxX, maxY);
      }

      // non-direct actions will have an action sprite; anchor on sprite.
      if (!jabsAction.isDirectAction() && actionSprite)
      {
        // read the sprite center in tiles.
        const cx = actionSprite.x;
        const cy = actionSprite.y;

        // build the bounds using the action range.
        const minX = Math.floor(cx - range);
        const minY = Math.floor(cy - range);
        const maxX = Math.ceil(cx + range);
        const maxY = Math.ceil(cy + range);

        // return the candidates from the spatial index.
        return JABS_AiManager.queryBattlersInAabb(minX, minY, maxX, maxY);
      }

      // fallback if no anchor is available; return all battlers.
      return JABS_AiManager.getAllBattlers();
    };

    // grab the candidate battlers from the spatial index.
    const candidates = queryCandidates();

    // actually process the collision for each candidate.
    const battlerCollisionProccessor = battler =>
    {
      // this time, it is effectively checking for the single-scope.
      if (!battler.isWithinScope(jabsAction, battler, hitOne)) return;

      // if the action is a direct-targeting action,
      // then choose collision method based on whether it is spatialized.
      if (jabsAction.isDirectAction())
      {
        // direct actions that have an action sprite (spatialized) use spatial collision.
        if (actionSprite)
        {
          // perform standard spatial collision against the action's event.
          const sprite = battler.getCharacter();
          const actionDirection = actionSprite.getJabsAction()
            .direction();
          const result = this.isTargetWithinRange(actionDirection, sprite, actionSprite, range, shape);
          if (result)
          {
            // add this battler to the list of targets hit.
            targetsHit.push(battler);

            // if we only hit one, ensure subsequent single-scope checks respect that.
            hitOne = true;
          }

          // stop processing for this battler either way.
          return;
        }

        // non-spatial direct actions use proximity between caster and target.
        if (gameAction.isForUser())
        {
          // self-targeting direct actions always hit the target candidate.
          targetsHit.push(battler);
          hitOne = true;
          return;
        }

        // check caster-to-target proximity for direct actions without a sprite.
        const maxDistance = jabsAction.getProximity();
        const distance = casterJabsBattler.distanceToDesignatedTarget(battler);
        if (distance <= maxDistance)
        {
          // add this battler to the list of targets hit.
          targetsHit.push(battler);
          hitOne = true;
        }

        // finished with this battler for direct actions.
        return;
      }

      // check to see if this battler is now in range for non-direct actions.
      const sprite = battler.getCharacter();
      const actionDirection = actionSprite.getJabsAction()
        .direction();
      const result = this.isTargetWithinRange(actionDirection, sprite, actionSprite, range, shape);
      if (result)
      {
        // add this battler to the list of targets hit.
        targetsHit.push(battler);

        // if we only hit one, ensure subsequent single-scope checks respect that.
        hitOne = true;
      }
    };

    // LAST PRIORITY is just regular "did I get hit" sort of stuff.
    candidates
      .filter(canActionConnectWithBattler, this)
      .forEach(battlerCollisionProccessor, this);

    // return the list of targets hit.
    return targetsHit;
  }

  /**
   * Determines collision of a given shape vs coordinates.
   * @param {1|2|3|4|6|7|8|9} facing Logical dir8 travel direction for the action.
   * @param {Game_Event|Game_Player|Game_Character} targetCharacter The target being hit.
   * @param {Game_Event} actionEvent The action sprite against the target.
   * @param {number} range How big the collision shape is.
   * @param {string} shape The collision formula based on shape.
   */
  isTargetWithinRange(facing, targetCharacter, actionEvent, range, shape)
  {
    // determine collision based on the selected shape.
    switch (shape)
    {
      // shapes that do not care about direction by default.
      case J.ABS.Shapes.Circle:
        // full circle collision.
        return this.collisionCircle(targetCharacter, actionEvent, range);

      case J.ABS.Shapes.Rhombus:
        // diamond (Manhattan/L1) semantics; see upgraded AABB-aware implementation below.
        return this.collisionRhombus(targetCharacter, actionEvent, range);

      case J.ABS.Shapes.Square:
        // full square centered at the action origin.
        return this.collisionSquare(targetCharacter, actionEvent, range);

      case J.ABS.Shapes.Cross:
        // cross union (vertical + horizontal bars).
        return this.collisionCross(targetCharacter, actionEvent, range);

      // shapes that require action direction.
      case J.ABS.Shapes.Line:
        // directional bar extending outward from the origin.
        return this.collisionLine(targetCharacter, actionEvent, range, facing);

      case J.ABS.Shapes.Arc:
      {
        // Arc is the sector/wedge. Default to 180° if not specified.
        const degrees = this.getActionDegrees(actionEvent) ?? 180;
        return this.collisionSector(targetCharacter, actionEvent, range, facing, degrees);
      }

      case J.ABS.Shapes.Wall:
        // shallow depth, broad breadth wall immediately in front.
        return this.collisionWall(targetCharacter, actionEvent, range, facing);
      default:
        // unknown shape → no collision.
        return false;
    }
  }

  /**
   * Reads the <degrees:N> tag from the action’s underlying skill notes.
   * Will return null if nothing is found.
   * @param {Game_Event} actionEvent The action event that carries the JABS_Action.
   * @returns {number|null} The degrees sweep (0–360), defaults to null if not found.
   */
  getActionDegrees(actionEvent)
  {
    // attempt to retrieve the underlying JABS_Action model.
    const jabsAction = actionEvent.getJabsAction();

    // retrieve the base skill for this action.
    const baseSkill = jabsAction.getBaseSkill();

    // read the capture from the notes.
    const found = RPGManager.getNumberFromNoteByRegex(baseSkill, J.ABS.RegExp.Degrees, true);

    // if we found nothing, or found nonsense, we return nothing.
    if (found === null || found === 0) return null;

    // validate the found value and clamp to [0, 360].
    return Math.max(0, Math.min(360, found));
  }

  /**
   * Reads the thickness tag from the action’s underlying skill notes.
   * Will return null if nothing is found.
   * @param {Game_Event} actionEvent The action event that carries the JABS_Action.
   * @returns {number|null} The thickness in tiles; null if not specified.
   */
  getActionThicknessTiles(actionEvent)
  {
    // attempt to retrieve the underlying JABS_Action model.
    const jabsAction = actionEvent.getJabsAction();

    // retrieve the base skill for this action.
    const baseSkill = jabsAction.getBaseSkill();

    // read the capture from the notes using the canonical <thickness:N> tag.
    const found = RPGManager.getNumberFromNoteByRegex(baseSkill, J.ABS.RegExp.Thickness, true);

    // if nothing found, return null to allow defaulting upstream.
    if (found === null) return null;

    // ensure non-negative thickness (0 is allowed but clamped later in px space).
    return Math.max(0, found);
  }

  /**
   * Performs Euclidean sector (wedge) collision.
   * Range is in tiles and is converted to pixels via tile width; this matches circle behavior.
   * The target is checked via a circle-fast reject followed by an angle gate.
   * @param {Game_Event|Game_Player|Game_Character} target The target being hit.
   * @param {Game_Event} action The action event representing the origin.
   * @param {number} range The size in tiles (converted to px radius for the circle test).
   * @param {2|4|6|8} facing The action’s facing (cardinals only for gate).
   * @param {number} degrees The wedge sweep in degrees (0–360); <360 enables angle gate.
   * @returns {boolean} True if the sector overlaps the target.
   */
  collisionSector(target, action, range, facing, degrees)
  {
    // derive pixel radius from tiles.
    // tile width in px.
    const tw = $gameMap.tileWidth();
    // tile height in px.
    const th = $gameMap.tileHeight();
    // convert to pixels (use tw for circles/sectors).
    const rPx = range * tw;

    // get the unified, corrected origin for the action.
    const {
      x: cx,
      y: cy
    } = JABS_Engine.getActionOriginPixels(action);

    // compute the target’s AABB.
    const targetRect = JABS_Engine.getBattlerAabbModel(target);

    // quick reject: outside circle area means outside wedge.
    if (!targetRect.intersectsCircle(cx, cy, rPx))
    {
      // no overlap with circle → no overlap with wedge.
      return false;
    }

    // a full 360° wedge is equivalent to the circle; we’ve already passed the circle test.
    if (degrees >= 360)
    {
      // immediate success for full sweep.
      return true;
    }

    // build a unit facing vector from the numeric direction (supports diagonals).
    const { x: fx, y: fy } = this.dir8ToUnitVector(facing);

    // compute vector from origin to the target rect’s center.
    // delta x to target center.
    const tx = targetRect.cx - cx;
    // delta y to target center.
    const ty = targetRect.cy - cy;

    // degenerate case: target’s center exactly at origin → accept.
    if (tx === 0 && ty === 0)
    {
      // overlapping centers are inside any wedge.
      return true;
    }

    // normalize the target vector for dot-product angle testing.
    // euclidean length.
    const tLen = Math.hypot(tx, ty);
    // unit x.
    const tnx = tx / tLen;
    // unit y.
    const tny = ty / tLen;

    // compute cosine threshold for the half-angle.
    // half-angle in radians.
    const halfAngleRad = (degrees * 0.5) * (Math.PI / 180);
    // cosine threshold.
    const cosHalf = Math.cos(halfAngleRad);

    // dot-product with the facing unit vector yields cos(theta).
    // cos(theta).
    const dot = (fx * tnx) + (fy * tny);

    // accept if the angle is within the wedge sweep.
    return dot >= cosHalf;
  }

  /**
   * A circle-shaped collision in pixel space.
   * Range is in tiles; converted to pixels using tile width.
   * @param {Game_Event|Game_Player|Game_Character} target The target being hit.
   * @param {Game_Event} action The action sprite against the target.
   * @param {number} range How big the collision shape is (tiles).
   * @returns {boolean}
   */
  collisionCircle(target, action, range)
  {
    // derive circle parameters in pixels.
    // assume square tiles unless specified otherwise.
    const tw = $gameMap.tileWidth();
    // radius in pixels.
    const rPx = range * tw;

    // centralized, corrected origin for action.
    const {
      x: originCx,
      y: originCy
      // unified origin.
    } = JABS_Engine.getActionOriginPixels(action);

    // build the target’s AABB.
    // target rect.
    const targetRect = JABS_Engine.getBattlerAabbModel(target);

    // circle-vs-rect test.
    // overlap?
    return targetRect.intersectsCircle(originCx, originCy, rPx);
  }

  /**
   * A rhombus-shaped (diamond) collision using AABB-aware Manhattan (L1) distance in pixel space.
   * Range is specified in tiles; we normalize pixel gaps by tile size to preserve N-tile semantics.
   * @param {Game_Event|Game_Player|Game_Character} target The target being hit.
   * @param {Game_Event} action The action sprite against the target.
   * @param {number} range How big the collision shape is (tiles).
   * @returns {boolean} True if the target is within the diamond.
   */
  collisionRhombus(target, action, range)
  {
    // grab tile dimensions for normalization.
    // tile width in px.
    const tw = $gameMap.tileWidth();
    // tile height in px.
    const th = $gameMap.tileHeight();

    // unified action origin in pixels.
    const {
      x: cx,
      y: cy
      // action origin.
    } = JABS_Engine.getActionOriginPixels(action);

    // target’s AABB in pixels.
    // target rect.
    const rect = JABS_Engine.getBattlerAabbModel(target);

    // initialize the unsigned horizontal pixel gap from origin point to rect.
    let dxPx = 0;

    // if the origin is left of the rect, gap is the distance to the left edge.
    if (cx < rect.x)
    {
      dxPx = rect.x - cx;
    }
    // if the origin is right of the rect, gap is the distance to the right edge.
    else if (cx > (rect.x + rect.w))
    {
      dxPx = cx - (rect.x + rect.w);
    }

    // initialize the unsigned vertical pixel gap from origin point to rect.
    let dyPx = 0;

    // if the origin is above the rect, gap is the distance to the top edge.
    if (cy < rect.y)
    {
      dyPx = rect.y - cy;
    }
    // if the origin is below the rect, gap is the distance to the bottom edge.
    else if (cy > (rect.y + rect.h))
    {
      dyPx = cy - (rect.y + rect.h);
    }

    // convert pixel gaps to tile distances.
    // x in tiles.
    const dxTiles = dxPx / tw;
    // y in tiles.
    const dyTiles = dyPx / th;

    // inside the diamond if L1 distance in tile units is within range.
    return (dxTiles + dyTiles) <= range;
  }

  /**
   * A square-shaped collision area centered on the action origin in pixel space.
   * Range N tiles creates a (2N+1)×(2N+1) tile square.
   * @param {Game_Event|Game_Player|Game_Character} target The target being hit.
   * @param {Game_Event} action The action sprite against the target.
   * @param {number} range The range in tiles.
   * @returns {boolean}
   */
  collisionSquare(target, action, range)
  {
    // compute action-centered square size in pixels.
    // tile width.
    const tw = $gameMap.tileWidth();
    // tile height.
    const th = $gameMap.tileHeight();
    // width in tiles.
    const tilesW = (2 * range + 1);
    // height in tiles.
    const tilesH = (2 * range + 1);
    // width in px.
    const wPx = tilesW * tw;
    // height in px.
    const hPx = tilesH * th;

    // centralized, corrected origin for action.
    const {
      x: originCx,
      y: originCy
      // unified origin.
    } = JABS_Engine.getActionOriginPixels(action);

    // build action area rect centered at the corrected origin.
    // action rect.
    const actionRect = JABS_Aabb.centerSized(originCx, originCy, wPx, hPx);

    // build target AABB.
    // target rect.
    const targetRect = JABS_Engine.getBattlerAabbModel(target);

    // rect-rect test.
    // overlap?
    return actionRect.intersectsRect(targetRect);
  }

  /**
   * A line-shaped collision approximated as a thin rectangle extending from the action origin.
   * Range in tiles is converted to pixels. Thickness defaults to one tile, or <thickness:N> tiles if provided.
   * @param {Game_Event|Game_Player|Game_Character} target The target.
   * @param {Game_Event} action The action sprite.
   * @param {number} range Range in tiles.
   * @param {2|4|6|8} facing Facing direction.
   * @returns {boolean}
   */
  collisionLine(target, action, range, facing)
  {
    // acquire tile dimensions.
    // tile width in px.
    const tw = $gameMap.tileWidth();
    // tile height in px.
    const th = $gameMap.tileHeight();

    // line length in pixels (use major axis for length, matching visualization elsewhere).
    // length in px.
    const lengthPx = range * Math.max(tw, th);

    // determine configured thickness in tiles, fallback to default of 1 tile.
    // tiles.
    const thicknessTiles = this.getActionThicknessTiles(action) ?? 1;

    // clamp to a very small positive minimum in pixels to ensure the AABB has area.
    // small positive safeguard.
    const minPx = 1;

    // compute thickness in pixels along each orientation.
    // horizontal thickness.
    const thicknessX = Math.max(minPx, thicknessTiles * tw);
    // vertical thickness.
    const thicknessY = Math.max(minPx, thicknessTiles * th);

    // centralized, corrected origin.
    const {
      x: originCx,
      y: originCy
      // unified origin.
    } = JABS_Engine.getActionOriginPixels(action);

    // build target AABB.
    const targetRect = JABS_Engine.getBattlerAabbModel(target);

    // treat the line as an oriented rectangle extending from the origin.
    // forward length includes a small extra half-tile pad, matching cardinal behavior.
    const lengthWithPad = lengthPx + (Math.max(tw, th) / 2);

    // thickness is expressed per-axis for cardinals; convert to a symmetric half-breadth in pixels for
    // diagonal support.
    const halfBreadth = Math.max(thicknessX, thicknessY) / 2;

    return this.collisionOrientedRectFromOrigin(targetRect, originCx, originCy, facing, lengthWithPad, halfBreadth);
  }

  /**
   * A wall-shaped collision approximated as a wide/long rect immediately in front of the origin.
   * Breadth spans (2*range+1) tiles perpendicular to facing. Depth uses <thickness:N> tiles (default 1).
   * @param {Game_Event|Game_Player|Game_Character} target The target.
   * @param {Game_Event} action The action sprite.
   * @param {number} range Range in tiles.
   * @param {2|4|6|8} facing Facing direction.
   * @returns {boolean}
   */
  collisionWall(target, action, range, facing)
  {
    const tw = $gameMap.tileWidth();
    const th = $gameMap.tileHeight();

    // resolve thickness (depth) in tiles (default 1 tile if not specified).
    const thicknessTiles = this.getActionThicknessTiles(action) ?? 1;
    const minPx = 1;
    // depth when vertical.
    const depthW = Math.max(minPx, thicknessTiles * tw);
    // depth when horizontal.
    const depthH = Math.max(minPx, thicknessTiles * th);

    // unified origin consistent with other shapes.
    const {
      x: originCx,
      y: originCy
    } = JABS_Engine.getActionOriginPixels(action);

    // breadth spans perpendicular axis.
    const breadthTiles = (2 * range + 1);
    const breadthW = breadthTiles * tw;
    const breadthH = breadthTiles * th;

    const targetRect = JABS_Engine.getBattlerAabbModel(target);

    // wall is also an oriented rectangle: small depth along forward, wide breadth perpendicular.
    const depthPx = Math.max(depthW, depthH);
    const halfBreadth = Math.max(breadthW, breadthH) / 2;

    return this.collisionOrientedRectFromOrigin(targetRect, originCx, originCy, facing, depthPx, halfBreadth);
  }

  /**
   * Collision helper: tests a target AABB against an oriented rectangle that starts at the origin and extends forward.
   * This supports diagonal facings by projecting into the forward/perpendicular basis and padding by the target AABB
   * extents.
   * @param {JABS_Aabb} targetRect The target's AABB in pixel space.
   * @param {number} originCx Origin X in pixels.
   * @param {number} originCy Origin Y in pixels.
   * @param {1|2|3|4|6|7|8|9} facing Dir8 facing.
   * @param {number} lengthPx The forward length in pixels.
   * @param {number} halfBreadthPx Half-width in pixels along the perpendicular axis.
   * @returns {boolean} True if the target overlaps the oriented rectangle.
   */
  collisionOrientedRectFromOrigin(targetRect, originCx, originCy, facing, lengthPx, halfBreadthPx)
  {
    // derive forward unit vector from dir8.
    const { x: fx, y: fy } = this.dir8ToUnitVector(facing);

    // perpendicular unit vector (rotate 90° clockwise).
    const px = fy;
    const py = -fx;

    // delta from origin to target center.
    const dx = targetRect.cx - originCx;
    const dy = targetRect.cy - originCy;

    // target center in local forward/perp frame.
    const u = (dx * fx) + (dy * fy);
    const v = (dx * px) + (dy * py);

    // target half extents in world space.
    const hx = targetRect.w / 2;
    const hy = targetRect.h / 2;

    // project the target AABB half-extents into the local frame (conservative).
    const extU = (Math.abs(fx) * hx) + (Math.abs(fy) * hy);
    const extV = (Math.abs(px) * hx) + (Math.abs(py) * hy);

    // overlap if within breadth band and within forward span [0, length].
    const withinBreadth = Math.abs(v) <= (halfBreadthPx + extV);
    const withinForward = (u >= -extU) && (u <= (lengthPx + extU));

    return withinBreadth && withinForward;
  }

  /**
   * Converts a dir8 code into a normalized unit vector in map space (RMMZ Y-down).
   * @param {1|2|3|4|6|7|8|9} dir8 The direction code.
   * @returns {{x: number, y: number}} The unit vector.
   */
  dir8ToUnitVector(dir8)
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
   * A cross-shaped collision approximated as the union of a vertical and horizontal bar.
   * Thickness for both bars uses <thickness:N> tiles (default 1).
   * @param {Game_Event|Game_Player|Game_Character} target The target.
   * @param {Game_Event} action The action sprite.
   * @param {number} range Range in tiles (extends out from origin on each arm).
   * @returns {boolean}
   */
  collisionCross(target, action, range)
  {
    const tw = $gameMap.tileWidth();
    const th = $gameMap.tileHeight();

    // resolve thickness in tiles (default 1 tile if not specified).
    const thicknessTiles = this.getActionThicknessTiles(action) ?? 1;
    const minPx = 1;
    const thicknessX = Math.max(minPx, thicknessTiles * tw);
    const thicknessY = Math.max(minPx, thicknessTiles * th);

    // unified origin consistent with other shapes.
    const {
      x: originCx,
      y: originCy
    } = JABS_Engine.getActionOriginPixels(action);

    // total arm extents include the center tile.
    const totalW = (2 * range + 1) * tw;
    const totalH = (2 * range + 1) * th;

    // horizontal bar centered at corrected origin.
    const horiz = new JABS_Aabb(originCx - (totalW / 2), originCy - (thicknessY / 2), totalW, thicknessY);

    // vertical bar centered at corrected origin.
    const vert = new JABS_Aabb(originCx - (thicknessX / 2), originCy - (totalH / 2), thicknessX, totalH);

    const targetRect = JABS_Engine.getBattlerAabbModel(target);
    return horiz.intersectsRect(targetRect) || vert.intersectsRect(targetRect);
  }

  //endregion collision

  //region defeated target aftermath
  /**
   * Handles the defeat of a given `Game_Battler` on the map.
   * @param {JABS_Battler} target The `Game_Battler` that was defeated.
   * @param {JABS_Battler} caster The `Game_Battler` that defeated the target.
   */
  handleDefeatedTarget(target, caster)
  {
    // handle on-defeat effects, but before the battler is actually removed.
    this.predefeatHandler(target, caster);

    // switch over all the options.
    switch (true)
    {
      // handle a dying player.
      case (target.isPlayer()):
        this.handleDefeatedPlayer();
        break;
      // handle a dying actor.
      case (target.isActor() && !target.isPlayer() && !target.isDying()):
        this.handleDefeatedAlly(target);
        break;
      // handle a dying enemy.
      case (target.isEnemy()):
        this.handleDefeatedEnemy(target, caster);
        break;
    }

    this.postDefeatHandler(target, caster);
  }

  /**
   * Handles the effects that occur before a target's defeat is processed,
   * such as "executes skill on death".
   * @param {JABS_Battler} target The `Game_Battler` that was defeated.
   * @param {JABS_Battler} caster The `Game_Battler` that defeated the target.
   */
  predefeatHandler(target, caster)
  {
    target.performPredefeatEffects(caster);
  }

  /**
   * Handles the effects that occur after a target's defeat is processed.
   * @param {JABS_Battler} target The `Game_Battler` that was defeated.
   * @param {JABS_Battler} caster The `Game_Battler` that defeated the target.
   */
  postDefeatHandler(target, caster)
  {
    target.performPostdefeatEffects(caster);
  }

  /**
   * Handles the defeat of the battler the player is currently controlling.
   */
  handleDefeatedPlayer()
  {
    // the party will party cycle upon death of the player.
    this.performPartyCycling();

    // if there are no other members, then this will automatically gameover.
  }

  /**
   * Handles a non-player ally that was defeated.
   * @param {JABS_Battler} defeatedAlly The ally that was defeated.
   */
  // eslint-disable-next-line no-unused-vars
  handleDefeatedAlly(defeatedAlly)
  {
  }

  /**
   * Handles an enemy that was defeated, including dolling out exp/gold and loot drops.
   * @param {JABS_Battler} defeatedTarget The `JABS_Battler` that was defeated.
   * @param {JABS_Battler} caster The `JABS_Battler` that defeated the target.
   */
  handleDefeatedEnemy(defeatedTarget, caster)
  {
    // remove all leader/follower data the battler may have.
    defeatedTarget.clearFollowers();
    defeatedTarget.clearLeader();

    // perform the death cry if they are dunzo.
    const targetCharacter = defeatedTarget.getCharacter();
    if (!defeatedTarget.isInanimate())
    {
      SoundManager.playEnemyCollapse();
    }

    // if the defeated target is an enemy, check for death controls.
    if (defeatedTarget.hasEventActions())
    {
      targetCharacter.start();
    }

    // if the caster is player/actor, gain aftermath.
    if (caster && caster.isActor())
    {
      const targetBattler = defeatedTarget.getBattler();
      this.gainBasicRewards(targetBattler, caster);
      this.createLootDrops(defeatedTarget, caster);
    }

    // remove the target's character from the map.
    defeatedTarget.setDying(true);
  }

  /**
   * Grants experience/gold/loot rewards to the battler that defeated the target.
   * If the level scaling plugin is available, both experience and gold are scaled.
   * @param {Game_Enemy} enemy The target battler that was defeated.
   * @param {JABS_Battler} actor The map battler that defeated the target.
   */
  gainBasicRewards(enemy, actor)
  {
    // identify the character who defeated the enemy.
    const actorCharacter = actor.getCharacter();

    // determine and gain the experience.
    const experience = this.determineExperienceGained(enemy, actor.getBattler());
    this.gainExperienceReward(experience, actorCharacter);

    // determine and gain the gold.
    const gold = this.determineGoldGained(enemy, actor.getBattler());
    this.gainGoldReward(gold, actorCharacter);

    // TODO: extract this logging reference out of this plugin and into the J.LOG plugin.
    this.createRewardsLog(experience, gold, actor);
  }

  /**
   * Determines how much experience the defeated enemy yielded.
   * @param {Game_Enemy} defeatedEnemy The enemy that was defeated.
   * @param {Game_Actor} victoriousActor The actor that defeated the enemy.
   */
  determineExperienceGained(defeatedEnemy, victoriousActor)
  {
    // identify the amount the enemy yielded.
    const experience = defeatedEnemy.exp();

    // determine the scaling multiplier.
    const rewardScalingMultiplier = this.getRewardScalingMultiplier(defeatedEnemy, victoriousActor);

    // apply the reward scaling.
    const scaledExperience = Math.ceil(experience * rewardScalingMultiplier);

    // normalize it.
    const normalizedExperience = Math.max(scaledExperience, 0);

    // return the amount.
    return normalizedExperience;
  }

  /**
   * Determines how much gold the defeated enemy yielded.
   * @param {Game_Enemy} defeatedEnemy The enemy that was defeated.
   * @param {Game_Actor} victoriousActor The actor that defeated the enemy.
   */
  determineGoldGained(defeatedEnemy, victoriousActor)
  {
    // identify the amount the enemy yielded.
    const gold = defeatedEnemy.gold();

    // determine the scaling multiplier.
    const rewardScalingMultiplier = this.getRewardScalingMultiplier(defeatedEnemy, victoriousActor);

    // apply the reward scaling.
    const scaledGold = Math.ceil(gold * rewardScalingMultiplier);

    // normalize it.
    const normalizedGold = Math.max(scaledGold, 0);

    // return the amount.
    return normalizedGold;
  }

  /**
   * Gets the multiplier based on difference in level between attacker and
   * target to determine if the battle was "too easy" or "very hard", resulting
   * in reduced or increased numeric rewards (excludes loot drops).
   * @param {Game_Enemy} enemy The enemy that was defeated.
   * @param {Game_Actor} actor The actor that defeated the target.
   */
  getRewardScalingMultiplier(enemy, actor)
  {
    // default the multiplier to 1x.
    let multiplier = 1.0;

    // check if we are using the level scaling functionality.
    if (J.LEVEL && J.LEVEL.Metadata.enabled)
    {
      // calculate the reverse multiplier using scaling based on enemy and actor.
      // if the enemy is higher, then the rewards will be greater.
      // if the actor is higher, then the rewards will be lesser.
      multiplier = LevelScaling.multiplier(
        enemy.level,
        actor.level,
        LevelScaling.Scope.REWARD
      );
    }

    // return the findings.
    return multiplier;
  }

  /**
   * Gains experience from battle rewards.
   * @param {number} experience The experience to be gained as a reward.
   * @param {Game_Character} casterCharacter The character who defeated the target.
   */
  // eslint-disable-next-line no-unused-vars
  gainExperienceReward(experience, casterCharacter)
  {
    // don't do anything if the enemy didn't grant any experience.
    if (!experience) return;

    $gameParty.battleMembers()
      .forEach(member => member.gainExp(experience));
  }

  /**
   * Gains gold from battle rewards.
   * @param {number} gold The gold to be gained as a reward.
   * @param {Game_Character} character The character who defeated the target.
   */
  // eslint-disable-next-line no-unused-vars
  gainGoldReward(gold, character)
  {
    // don't do anything if the enemy didn't grant any gold.
    if (!gold) return;

    // actually gain the gold.
    $gameParty.gainGold(gold);
  }

  /**
   * Create a log entry for both experience earned and gold dropped.
   * @param {number} experience The amount of experience gained.
   * @param {number} gold The gold to be gained as a reward.
   * @param {JABS_Battler} caster The ally gaining the experience and gold.
   */
  createRewardsLog(experience, gold, caster)
  {
    if (!J.LOG) return;

    if (experience !== 0)
    {
      const expLog = new ActionLogBuilder()
        .setupExperienceGained(caster.getBattlerDatabaseData().name, experience)
        .build();
      $actionLogManager.addLog(expLog);
    }

    if (gold !== 0)
    {
      const goldLog = new LootLogBuilder()
        .setupGoldFound(gold)
        .build();
      $lootLogManager.addLog(goldLog);
    }
  }

  /**
   * Create all drops for a defeated enemy and gain them.
   * @param {JABS_Battler} target The enemy dropping the loot.
   * @param {JABS_Battler} caster The ally that defeated the enemy.
   */
  // eslint-disable-next-line no-unused-vars
  createLootDrops(target, caster)
  {
    // actors don't drop loot.
    if (target.isActor()) return;

    // if we have no drops, don't bother.
    const items = target.getBattler()
      .makeDropItems();
    if (items.length === 0) return;

    items.forEach(item => this.addLootDropToMap(target.getX(), target.getY(), item));
  }

  /**
   * Creates a log for an item earned as a loot drop from an enemy.
   * @param {object} item The reference data for the item loot that was picked up.
   */
  createLootLog(item)
  {
    if (!J.LOG) return;

    let lootType = String.empty;
    if (item.atypeId)
    {
      lootType = 'armor';
    }
    else if (item.wtypeId)
    {
      lootType = 'weapon';
    }
    else if (item.itypeId)
    {
      lootType = 'item';
    }

    // the player is always going to be the one collecting the loot- for now.
    const lootLog = new LootLogBuilder()
      .setupLootObtained(lootType, item.id)
      .build();
    $lootLogManager.addLog(lootLog);
  }

  /**
   * Lifecycle event: items were picked up by a character on the map.
   * Extended by optional plugins (e.g. J-Popups-ABS) to surface map feedback.
   * @param {RPG_BaseItem[]} itemDataList All items picked up.
   * @param {Game_Character} character The character who picked them up.
   */
  // eslint-disable-next-line no-unused-vars
  onItemPickedUp(itemDataList, character)
  {
  }

  /**
   * Handles a level up for the leader while on the map.
   * @param {string} uuid The uuid of the battler leveling up.
   */
  battlerLevelup(uuid)
  {
    const battler = JABS_AiManager.getBattlerByUuid(uuid);
    if (battler)
    {
      const character = battler.getCharacter();
      this.playLevelUpAnimation(character);
      this.createLevelUpLog(battler);
    }
  }

  /**
   * Creates a level up log for the given battler.
   * @param {JABS_Battler} jabsBattler The given JABS battler.
   */
  createLevelUpLog(jabsBattler)
  {
    if (!J.LOG) return;

    const battler = jabsBattler.getBattler();
    const log = this.configureLevelUpLog(battler.name(), battler.level);
    $actionLogManager.addLog(log);
  }

  /**
   * Configures the log for the actor reaching a new level.
   * @param {string} targetName The name of the battler leveling up.
   * @param {number} newLevel The level being reached.
   * @returns {ActionLog}
   */
  configureLevelUpLog(targetName, newLevel)
  {
    return new ActionLogBuilder()
      .setupLevelUp(targetName, newLevel)
      .build();
  }

  /**
   * Plays the level up animation on the character.
   * @param {Game_Character} character The player's `Game_Character`.
   */
  playLevelUpAnimation(character)
  {
    character.requestAnimation(49);
  }

  /**
   * Handles a skill being learned for a battler while on the map.
   * @param {RPG_Skill} skill The skill being learned.
   * @param {string} uuid The uuid of the battler leveling up.
   */
  battlerSkillLearn(skill, uuid)
  {
    const battler = JABS_AiManager.getBattlerByUuid(uuid);
    if (battler)
    {
      const character = battler.getCharacter();
      this.createSkillLearnLog(skill, battler);
    }
  }

  /**
   * Creates a skill learning log for the player.
   * @param {RPG_Skill} skill The skill being learned.
   * @param {JABS_Battler} player The player's `JABS_Battler`.
   */
  createSkillLearnLog(skill, player)
  {
    if (!J.LOG) return;

    const log = this.configureSkillLearnLog(player.getBattlerDatabaseData().name, skill.id);
    $actionLogManager.addLog(log);
  }

  /**
   * Configures the log for the skill learned.
   * @param {string} targetName The name of the target learning the skill.
   * @param {number} learnedSkillId The id of the skill learned.
   * @returns {ActionLog}
   */
  configureSkillLearnLog(targetName, learnedSkillId)
  {
    return new ActionLogBuilder()
      .setupSkillLearn(targetName, learnedSkillId)
      .build();
  }

//endregion defeated target aftermath
}

//endregion JABS_Engine