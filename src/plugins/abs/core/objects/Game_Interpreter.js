//region Game_Interpreter
/**
 * Enables setting move routes of `Game_Character`s on the map with JABS.
 * @param {number} param The character/event id to get the data for.
 * @returns {Game_Character}
 */
J.ABS.Aliased.Game_Interpreter.set('character', Game_Interpreter.prototype.character);
Game_Interpreter.prototype.character = function(param)
{
  if ($jabsEngine.absEnabled)
  {
    if (param < 0)
    {
      return $gamePlayer;
    }
    // otherwise when this.isOnCurrentMap(), use this branch.
    else if (this.isOnCurrentMap())
    {
      const id = param > 0
        ? param
        : this.eventId();
      return $gameMap.event(id);
    }
    else
    {
      return null;
    }
  }
  else
  {
    // perform original logic.
    return J.ABS.Aliased.Game_Interpreter.get('character').call(this, param);
  }
};

/**
 * Enables transferring with JABS.
 * Removed the check for seeing if the player is in-battle, because the player
 * is technically ALWAYS in-battle while the ABS is enabled.
 */
J.ABS.Aliased.Game_Interpreter.set('command201', Game_Interpreter.prototype.command201);
Game_Interpreter.prototype.command201 = function(params)
{
  if ($jabsEngine.absEnabled)
  {
    if ($gameMessage.isBusy()) return false;

    let mapId;
    let x;
    let y;
    if (params[0] === 0)
    {
      [, mapId, x, y] = params;
    }
    else
    {
      mapId = $gameVariables.value(params[1]);
      x = $gameVariables.value(params[2]);
      y = $gameVariables.value(params[3]);
    }

    $gamePlayer.reserveTransfer(mapId, x, y, params[4], params[5]);
    this.setWaitMode("transfer");
    return true;
  }
  else
  {
    // perform original logic.
    return J.ABS.Aliased.Game_Interpreter.get('command201').call(this, params);
  }
};

/**
 * Enables map scrolling with JABS.
 * Removed the check for seeing if the player is in-battle, because the player
 * is technically ALWAYS in-battle while the ABS is enabled.
 */
J.ABS.Aliased.Game_Interpreter.set('command204', Game_Interpreter.prototype.command204);
Game_Interpreter.prototype.command204 = function(params)
{
  if ($jabsEngine.absEnabled)
  {
    if ($gameMap.isScrolling())
    {
      this.setWaitMode("scroll");
      return false;
    }

    $gameMap.startScroll(params[0], params[1], params[2]);
    if (params[3])
    {
      this.setWaitMode("scroll");
    }

    return true;
  }
  else
  {
    // perform original logic.
    return J.ABS.Aliased.Game_Interpreter.get('command204').call(this, params);
  }
};

/**
 * Enables changing the weather with JABS.
 * Removed the check for seeing if the player is in-battle, because the player is
 * technically ALWAYS in-battle while the ABS is enabled.
 */
J.ABS.Aliased.Game_Interpreter.set('command236', Game_Interpreter.prototype.command236);
Game_Interpreter.prototype.command236 = function(params)
{
  if ($jabsEngine.absEnabled)
  {
    $gameScreen.changeWeather(params[0], params[1], params[2]);
    if (params[3])
    {
      this.wait(params[2]);
    }

    return true;
  }
  else
  {
    // perform original logic.
    return J.ABS.Aliased.Game_Interpreter.get('command236').call(this, params);
  }
};

/**
 * Enables default battles with JABS.
 * Removed the check for seeing if the player is in-battle, because the player
 * is technically ALWAYS in-battle while the ABS is enabled.
 *
 * NOTE: Though the battling is enabled, the battles may not behave as one would
 * expect from a default battle system when using an ABS as well.
 */
J.ABS.Aliased.Game_Interpreter.set('command301', Game_Interpreter.prototype.command301);
Game_Interpreter.prototype.command301 = function(params)
{
  if ($jabsEngine.absEnabled)
  {
    let troopId;
    switch (params[0])
    {
      case 0:
        // Direct designation
        [, troopId] = params;
        break;
      case 1:
        // Designation with a variable
        troopId = $gameVariables.value(params[1]);
        break;
      default:
        // Same as Random Encounters
        troopId = $gamePlayer.makeEncounterTroopId();
        break;
    }

    if ($dataTroops[troopId])
    {
      BattleManager.setup(troopId, params[2], params[3]);
      BattleManager.setEventCallback(n => this.branch()[this.indent()] = n);
      $gamePlayer.makeEncounterCount();
      SceneManager.push(Scene_Battle);
    }

    return true;
  }
  else
  {
    // perform original logic.
    return J.ABS.Aliased.Game_Interpreter.get('command301').call(this, params);
  }
};

/**
 * Enables the shop scene with JABS.
 * Removed the check for seeing if the player is in-battle, because the player is
 * technically ALWAYS in-battle while the ABS is enabled.
 */
J.ABS.Aliased.Game_Interpreter.set('command302', Game_Interpreter.prototype.command302);
Game_Interpreter.prototype.command302 = function(params)
{
  if ($jabsEngine.absEnabled)
  {
    const goods = [ params ];
    while (this.nextEventCode() === 605)
    {
      this.setIndex(this.index() + 1);
      goods.push(this.currentCommand().parameters);
    }

    // Append the row to the working collection.
    SceneManager.push(Scene_Shop);
    SceneManager.prepareNextScene(goods, params[4]);
    return true;
  }
  else
  {
    // perform original logic.
    return J.ABS.Aliased.Game_Interpreter.get('command302').call(this, params);
  }
};

/**
 * Enables the name input processing with JABS.
 * Removed the check for seeing if the player is in-battle, because the player is
 * technically ALWAYS in-battle while the ABS is enabled.
 */
J.ABS.Aliased.Game_Interpreter.set('command303', Game_Interpreter.prototype.command303);
Game_Interpreter.prototype.command303 = function(params)
{
  if ($jabsEngine.absEnabled)
  {
    if ($dataActors[params[0]])
    {
      SceneManager.push(Scene_Name);
      SceneManager.prepareNextScene(params[0], params[1]);
    }

    return true;
  }

  // perform original logic.
  // perform original logic.
  return J.ABS.Aliased.Game_Interpreter.get('command303').call(this, params);
};

/**
 * Enables opening the menu screen with JABS.
 * Removed the check for seeing if the player is in-battle, because the player is
 * technically ALWAYS in-battle while the ABS is enabled.
 */
J.ABS.Aliased.Game_Interpreter.set('command351', Game_Interpreter.prototype.command351);
Game_Interpreter.prototype.command351 = function()
{
  if ($jabsEngine.absEnabled)
  {
    SceneManager.push(Scene_Menu);
    Window_MenuCommand.initCommandPosition();
    return true;
  }
  else
  {
    // perform original logic.
    return J.ABS.Aliased.Game_Interpreter.get('command351').call(this);
  }
};

/**
 * Enables saving with JABS.
 * Removed the check for seeing if the player is in-battle, because the player is
 * technically ALWAYS in-battle while the ABS is enabled.
 */
J.ABS.Aliased.Game_Interpreter.set('command352', Game_Interpreter.prototype.command352);
Game_Interpreter.prototype.command352 = function()
{
  if ($jabsEngine.absEnabled)
  {
    SceneManager.push(Scene_Save);
    return true;
  }
  // otherwise fall back to the alternate path.
  else
  {
    // perform original logic.
    return J.ABS.Aliased.Game_Interpreter.get('command352').call(this);
  }
};
//endregion Game_Interpreter