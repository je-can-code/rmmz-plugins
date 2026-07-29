//region Window_PartyFrame
import Sprite_ActorValue from '../sprites/Sprite_ActorValue.js';
/**
 * A window containing the HUD data for the {@link Game_Party}.
 */
class Window_PartyFrame
  extends Window_Base
{
  /**
   * The static collection of gauge types supported.
   */
  static gaugeTypes = {
    /**
     * The type of gauge for hp.
     */
    HP: 'hp',

    /**
     * The type of gauge for mp.
     */
    MP: 'mp',

    /**
     * The type of gauge for tp.
     */
    TP: 'tp',

    /**
     * The type of gauge for xp.
     * We borrow the "time" gauge for this, though.
     */
    XP: 'time',

    /**
     * Not actually a gauge, but does have an actorvalue representing
     * the actor's level.
     */
    Level: 'lvl'
  };

  /**
   * Constructor.
   * @param {Rectangle} rect The shape representing this window.
   */
  constructor(rect)
  {
    // required when extending a base class.
    super(rect);
  }

  /**
   * Initializes this class.
   * @param {Rectangle} rect The shape representing this window.
   */
  initialize(rect)
  {
    // perform original logic.
    super.initialize(rect);

    // initialize our properties.
    this.initMembers();

    // run our one-time setup and configuration.
    this.configure();

    // refresh the window for the first time.
    this.refresh();
  }

  /**
   * Initialize all properties of this class.
   */
  initMembers()
  {
    /**
     * The cached collection of hud sprites.
     * @type {Map<string, Sprite_Face|Sprite_MapGauge|Sprite_ActorValue|Sprite_Icon|Sprite_BaseText>}
     */
    this._hudSprites = new Map();

    /**
     * Shared affliction presenter for the leader row.
     * @type {StateAfflictionHudPresenter}
     */
    this._afflictionPresenter = new StateAfflictionHudPresenter(this, this._hudSprites);
  }

  //region properties
  /**
   * Gets the hud sprites.
   * @returns {Map<string, Sprite_Face|Sprite_MapGauge|Sprite_ActorValue|Sprite_Icon|Sprite_BaseText>} The hudSprites.
   */
  hudSprites()
  {
    // hand back the hud sprites.
    return this._hudSprites;
  }

  /**
   * Gets the affliction presenter.
   * @returns {StateAfflictionHudPresenter} The afflictionPresenter.
   */
  afflictionPresenter()
  {
    // hand back the affliction presenter.
    return this._afflictionPresenter;
  }
  //endregion properties

  /**
   * Performs the one-time setup and configuration per instantiation.
   */
  configure()
  {
    // make the window's background opacity transparent.
    this.opacity = 0;

    // initialize the cache.
    this.refreshCache();
  }

  /**
   * Redraw all contents of the window.
   */
  refresh()
  {
    // clear the contents of the hud.
    this.contents.clear();

    // hide all the sprites.
    this.hideSprites();

    // draw the hud anew.
    this.drawHud();
  }

  /**
   * Hide all sprites for the hud.
   */
  hideSprites()
  {
    // hide all the sprites; gauges self-deactivate via their hide() override.
    this.hudSprites().forEach((sprite, _) =>
    {
      // when refreshing, always hide all the sprites.
      sprite.hide();
    });
  }

  //region caching
  /**
   * Empties and recreates the entire cache of sprites.
   */
  refreshCache()
  {
    // destroy and empty all sprites within the cache.
    this.emptyCache();

    // recreate all sprites for the cache.
    this.createCache();
  }

  /**
   * Empties the cache of all sprites.
   */
  emptyCache()
  {
    // iterate over each sprite and destroy it properly.
    this.hudSprites().forEach((value, _) => value.destroy());

    // empty the collection of all references.
    this.hudSprites().clear();
  }

  /**
   * Creates all sprites for this hud and caches them.
   */
  static createCache()
  {
    // establish the gauge types we will create.
    const gaugeTypes = this.gaugeTypes();

    // iterate over each of the battle members in the party.
    $gameParty.battleMembers()
      .forEach(actor =>
      {
        // cache the full-sized face images for each actor.
        this.getOrCreateFullSizeFaceSprite(actor);

        // cache the mini-sized face images for each actor.
        this.getOrCreateMiniSizeFaceSprite(actor);

        // for this actor, create all the gauges, too.
        gaugeTypes.forEach(gaugeType =>
        {
          // create the full-sized gauge sprite for this type.
          this.getOrCreateFullSizeGaugeSprite(actor, gaugeType);

          // create the mini-sized gauge sprite for this type.
          this.getOrCreateMiniSizeGaugeSprite(actor, gaugeType);

          // create the corresponding actor value sprite for this gauge.
          this.getOrCreateActorValueSprite(actor, gaugeType);
        });
      });
  }

  /**
   * Creates the key for an actor's face sprite based on the parameters.
   * @param {Game_Actor} actor The actor to create a key for.
   * @param {boolean} isFull Whether or not this is for a full-sized sprite.
   * @returns {string}
   */
  makeFaceSpriteKey(actor, isFull)
  {
    return isFull
      ? `face-full-${actor.name()}-${actor.actorId()}`
      : `face-mini-${actor.name()}-${actor.actorId()}`;
  }

  /**
   * Creates a full-sized face sprite for the given actor and caches it.
   * @param {Game_Actor} actor The actor to draw a full face sprite for.
   * @returns {Sprite_Face} The full face sprite of the actor.
   */
  getOrCreateFullSizeFaceSprite(actor)
  {
    // the key for this actor's full face sprite.
    const key = this.makeFaceSpriteKey(actor, true);

    // check if the key already maps to a cached sprite.
    if (this.hudSprites().has(key))
    {
      // if it does, just return that.
      return this.hudSprites().get(key);
    }

    // create a new full-sized face sprite of the actor.
    const sprite = new Sprite_Face(actor.faceName(), actor.faceIndex());

    // set the scale to a fixed 80%.
    sprite.scale.x = 1;
    sprite.scale.y = 1;

    // cache the sprite.
    this.hudSprites().set(key, sprite);

    // hide the sprite for now.
    sprite.hide();

    // add the sprite to tracking.
    this.addChild(sprite);

    // return the created full sprite.
    return sprite;
  }

  /**
   * Creates a mini-sized face sprite for the given actor and caches it.
   * @param {Game_Actor} actor The actor to draw a mini face sprite for.
   * @returns {Sprite_Face} The mini face sprite of the actor.
   */
  getOrCreateMiniSizeFaceSprite(actor)
  {
    // the key for this actor's full face sprite.
    const key = this.makeFaceSpriteKey(actor, false);

    // check if the key already maps to a cached sprite.
    if (this.hudSprites().has(key))
    {
      // if it does, just return that.
      return this.hudSprites().get(key);
    }

    // create a new full-sized face sprite of the actor.
    const sprite = new Sprite_Face(actor.faceName(), actor.faceIndex());

    // set the scale to a fixed 80%.
    sprite.scale.x = 0.3;
    sprite.scale.y = 0.3;

    // cache the sprite.
    this.hudSprites().set(key, sprite);

    // hide the sprite for now.
    sprite.hide();

    // add the sprite to tracking.
    this.addChild(sprite);

    // return the created mini sprite.
    return sprite;
  }

  /**
   * An array of all gauge types; for convenience.
   * @returns {string[]} The gauge types in a given order.
   */
  gaugeTypes()
  {
    return [
      Window_PartyFrame.gaugeTypes.HP,
      Window_PartyFrame.gaugeTypes.MP,
      Window_PartyFrame.gaugeTypes.TP,
      Window_PartyFrame.gaugeTypes.XP
    ];
  }

  /**
   * Creates the key for an actor's gauge sprite based on the parameters.
   * @param {Game_Actor} actor The actor to draw a full gauge sprite for.
   * @param {boolean} isFull Whether or not this is for a full-sized sprite.
   * @param {Window_PartyFrame.gaugeTypes} gaugeType The type of gauge this is.
   * @returns {string} The key for this gauge sprite.
   */
  makeGaugeSpriteKey(actor, isFull, gaugeType)
  {
    const gaugeSize = isFull
      ? `full`
      : `mini`;
    return `gauge-${gaugeType}-${gaugeSize}-${actor.name()}-${actor.actorId()}`;
  }

  /**
   * Creates a full-sized gauge sprite for the given actor and caches it.
   * @param {Game_Actor} actor The actor to draw a gauge sprite for.
   * @param {Window_PartyFrame.gaugeTypes} gaugeType The type of gauge this is.
   * @returns {Sprite_MapGauge} The gauge sprite.
   */
  getOrCreateFullSizeGaugeSprite(actor, gaugeType)
  {
    // the key for this actor's full gauge sprite.
    const key = this.makeGaugeSpriteKey(actor, true, gaugeType);

    // check if the key already maps to a cached sprite.
    if (this.hudSprites().has(key))
    {
      // if it does, just return that.
      return this.hudSprites().get(key);
    }

    // gets the full-sized gauge height for this gauge type.
    const gaugeHeight = gaugeType === Window_PartyFrame.gaugeTypes.XP
      ? 12
      : 24;

    // determine gauge width based on gauge type.
    const gaugeWidth = gaugeType === Window_PartyFrame.gaugeTypes.XP
      ? 114
      : 144;

    // create a new full-sized gauge sprite of the actor.
    const sprite = new Sprite_MapGauge(gaugeWidth, gaugeHeight, gaugeHeight);

    // setup the gauge sprite to point to the actor.
    sprite.setup(actor, gaugeType);

    // deactivate the gauge to prevent updating until its necessary.
    sprite.deactivateGauge();

    // cache the sprite.
    this.hudSprites().set(key, sprite);

    // hide the sprite for now.
    sprite.hide();

    // add the sprite to tracking.
    this.addChild(sprite);

    // return the created sprite.
    return sprite;
  }

  /**
   * Creates a mini-sized gauge sprite for the given actor and caches it.
   * @param {Game_Actor} actor The actor to draw a gauge sprite for.
   * @param {Window_PartyFrame.gaugeTypes} gaugeType The type of gauge this is.
   * @returns {Sprite_MapGauge} The gauge sprite.
   */
  getOrCreateMiniSizeGaugeSprite(actor, gaugeType)
  {
    // the key for this actor's full gauge sprite.
    const key = this.makeGaugeSpriteKey(actor, false, gaugeType);

    // check if the key already maps to a cached sprite.
    if (this.hudSprites().has(key))
    {
      // if it does, just return that.
      return this.hudSprites().get(key);
    }

    // gets the mini-sized gauge height for this gauge type.
    const bitmapHeight = 12;

    // determine gauge width based on gauge type.
    const bitmapWidth = gaugeType === Window_PartyFrame.gaugeTypes.XP
      ? 42
      : 96;

    // create a new mini-sized gauge sprite of the actor.
    const sprite = new Sprite_MapGauge(bitmapWidth, bitmapHeight, bitmapHeight);

    // setup the gauge sprite to point to the actor.
    sprite.setup(actor, gaugeType);

    // deactivate the gauge to prevent updating until its necessary.
    sprite.deactivateGauge();

    // cache the sprite.
    this.hudSprites().set(key, sprite);

    // hide the sprite for now.
    sprite.hide();

    // add the sprite to tracking.
    this.addChild(sprite);

    // return the created sprite.
    return sprite;
  }

  /**
   * Creates the key for an actor's gauge value sprite based on the parameters.
   * @param {Game_Actor} actor The actor to draw a actor value sprite for.
   * @param {Window_PartyFrame.gaugeTypes} gaugeType The type of actor value this is.
   * @returns {string} The key for this actor value sprite.
   */
  makeValueSpriteKey(actor, gaugeType)
  {
    return `value-${gaugeType}-${actor.name()}-${actor.actorId()}`;
  }

  /**
   * Creates a actor value sprite for the given actor's gauge and caches it.
   *
   * It is important to note that there is no "mini" size of actor values!
   * Allies simply will not display the values, only gauges.
   * @param {Game_Actor} actor The actor to draw a gauge sprite for.
   * @param {Window_PartyFrame.gaugeTypes} gaugeType The type of gauge this is.
   * @returns {Sprite_MapGauge} The gauge sprite.
   */
  getOrCreateActorValueSprite(actor, gaugeType)
  {
    // the key for this actor's full face sprite.
    const key = this.makeValueSpriteKey(actor, gaugeType);

    // check if the key already maps to a cached sprite.
    if (this.hudSprites().has(key))
    {
      // if it does, just return that.
      return this.hudSprites().get(key);
    }

    // determine the font size.
    const valueFontSize = gaugeType === Window_PartyFrame.gaugeTypes.XP
      ? -6
      : -2;

    // create a new full-sized face sprite of the actor.
    const sprite = new Sprite_ActorValue(actor, gaugeType, valueFontSize);

    // cache the sprite.
    this.hudSprites().set(key, sprite);

    // hide the sprite for now.
    sprite.hide();

    // add the sprite to tracking.
    this.addChild(sprite);

    // return the created sprite.
    return sprite;
  }

  /**
   * Creates or retrieves the combat icon sprite for the given actor.
   * @param {Game_Actor} actor The actor this icon represents.
   * @returns {Sprite_Icon} The combat icon sprite.
   */
  getOrCreateCombatIcon(actor)
  {
    // create a unique cache key for the icon.
    const key = `combat-icon-${actor.name()}-${actor.actorId()}`;

    // if cached already, return it.
    if (this.hudSprites().has(key))
    {
      return this.hudSprites().get(key);
    }

    // in-combat icon index is two fists punching.
    const iconIndex = 31;

    // create the icon sprite.
    const sprite = new Sprite_Icon(iconIndex);

    // indicate we'll manage the opacity ourselves.
    sprite.selfManageOpacity();

    // cache and stage it.
    this.hudSprites().set(key, sprite);
    sprite.hide();
    this.addChild(sprite);

    // return the created sprite.
    return sprite;
  }

  /**
   * Creates or retrieves the combat timer sprite for the given actor.
   * @param {Game_Actor} actor The actor this timer represents.
   * @returns {Sprite_BaseText} The combat seconds text sprite.
   */
  getOrCreateCombatTimer(actor)
  {
    // create a unique cache key for the timer.
    const key = `combat-timer-${actor.name()}-${actor.actorId()}`;

    // if cached already, return it.
    if (this.hudSprites().has(key))
    {
      return this.hudSprites().get(key);
    }

    // create a text sprite.
    const sprite = new Sprite_BaseText(String.empty);

    // configure the font for a small numeric readout (seconds, one decimal).
    sprite.setFontFace($gameSystem.numberFontFace());
    sprite.setFontSize($gameSystem.mainFontSize() - 8);
    sprite.setAlignment(Sprite_BaseText.Alignments.Center);
    sprite.setMinWidth(ImageManager.iconWidth);

    // this sprite manages its own opacity (for fade out), so opt out of auto-managed opacity.
    sprite.selfManageOpacity();

    // start hidden until we actually show it in-combat.
    sprite.hide();

    // cache and stage it.
    this.hudSprites().set(key, sprite);

    // add the sprite to tracking.
    this.addChild(sprite);

    // return the created sprite.
    return sprite;
  }

  /**
   * Creates or retrieves the combat label sprite for the given actor.
   * Shows a text blurb like "IN COMBAT" or "FREE" near the combat icon.
   * @param {Game_Actor} actor The actor this label represents.
   * @returns {Sprite_BaseText} The combat status label sprite.
   */
  getOrCreateCombatLabel(actor)
  {
    // create a unique cache key for the label.
    const key = `combat-label-${actor.name()}-${actor.actorId()}`;

    // if cached already, return it.
    if (this.hudSprites().has(key))
    {
      return this.hudSprites().get(key);
    }

    // create a text sprite.
    const sprite = new Sprite_BaseText(String.empty);

    // configure the font for emphasis and readability.
    sprite
      .setFontFace($gameSystem.mainFontFace())
      .setFontSize($gameSystem.mainFontSize() - 8)
      .setAlignment(Sprite_BaseText.Alignments.Center)
      .setBold(true)
      .setItalics(true)
      .setMinWidth(Math.round(ImageManager.iconWidth * 2.5))
      .selfManageOpacity();

    // cache and stage it.
    this.hudSprites().set(key, sprite);
    this.addChild(sprite);

    // return the created sprite.
    return sprite;
  }

  //endregion caching

  /**
   * The per-frame update of this window.
   */
  update()
  {
    // perform original logic.
    super.update();

    // update our stuff.
    this.drawHud();
  }

  //region visibility
  /**
   * Manages visibility for the hud.
   */
  manageVisibility()
  {
    // handle interference from the message window popping up.
    this.handleMessageWindowInterference();

    // check if the player is interfering with visibility.
    if (this.playerInterference())
    {
      // if so, adjust opacity accordingly.
      this.handlePlayerInterference();
    }
    // the player isn't interfering.
    else
    {
      // undo the opacity changes.
      this.revertInterferenceOpacity();
    }
  }

  /**
   * Close and open the window based on whether or not the message window is up.
   */
  handleMessageWindowInterference()
  {
    // check if the message window is up.
    if ($gameMessage.isBusy() || $gameMap.isEventRunning())
    {
      // check to make sure we haven't closed this window yet.
      if (!this.isClosed())
      {
        // hide all the sprites.
        this.hideSprites();

        // and close the window.
        this.close();
      }
    }
    // otherwise, the message window isn't there.
    else
    {
      // just open the window.
      this.open();
    }
  }

  /**
   * Determines whether or not the player is in the way (or near it) of this window.
   * @returns {boolean} True if the player is in the way, false otherwise.
   */
  playerInterference()
  {
    const playerX = $gamePlayer.screenX();
    const playerY = $gamePlayer.screenY();
    return (playerX < (this.width - 100)) && (playerY > (this.y + 200));
  }

  /**
   * Manages opacity for all sprites while the player is interfering with the visibility.
   */
  handlePlayerInterference()
  {
    this.hudSprites().forEach((sprite, _) =>
    {
      // if the interference shouldn't be handled for this sprite, then don't.
      if (this.canHandleSpriteInterference(sprite) === false) return;

      // if we are above 64, rapidly decrement by -15 until we get below 64.
      if (sprite.opacity > 64)
      {
        sprite.opacity -= 15;
      }
      // if we are below 64, increment by +1 until we get to 64.
      else if (sprite.opacity < 64)
      {
        sprite.opacity += 1;
      }
    }, this);
  }

  /**
   * Reverts the opacity changes associated with the player getting in the way.
   */
  revertInterferenceOpacity()
  {
    this.hudSprites().forEach((sprite, _) =>
    {
      // if the interference shouldn't be handled for this sprite, then don't.
      if (this.canHandleSpriteInterference(sprite) === false) return;

      // if we are below 255, rapidly increment by +15 until we get to 255.
      if (sprite.opacity < 255)
      {
        sprite.opacity += 15;
      }
      // if we are above 255, set to 255.
      else if (sprite.opacity > 255)
      {
        sprite.opacity = 255;
      }
    }, this);
  }

  /**
   * Checks if the given sprite should be handled for interference.
   * @param {Sprite_Face|Sprite_MapGauge|Sprite_ActorValue|Sprite_Icon|Sprite_BaseText} sprite The sprite driving this step.
   * @returns {boolean}
   */
  canHandleSpriteInterference(sprite)
  {
    // sprites that self-manage opacity should not be handled by the system.
    if (sprite.hasSelfManagedOpacity() === true) return false;

    // let the system handle the opacity management.
    return true;
  }

  //endregion visibility

  //region draw
  /**
   * Draws the contents of the HUD.
   */
  drawHud()
  {
    // if we cannot draw the hud, then do not.
    if (!$hudManager.canShowHud()) return;

    // handle the visibility of the hud for dynamic interferences.
    this.manageVisibility();

    // draw the leader data.
    const leaderX = 0;
    const leaderY = 0;
    this.drawLeader(leaderX, leaderY);

    // if we cannot draw your allies, then do not.
    if (!$hudManager.canShowAllies()) return;

    // draw all allies' data.
    const alliesY = this.height - ImageManager.faceHeight - (this.lineHeight() + 12);
    this.drawAllies(leaderX, alliesY);
  }

  /**
   * Draw the leader's data for the HUD.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   */
  drawLeader(x, y)
  {
    // if we don't have a leader, don't try to draw it!
    if (!$gameParty.leader()) return;

    // draw the face for the leader.
    const faceY = y + (this.height - ImageManager.faceHeight);
    this.drawLeaderFace(x, faceY);

    // render the resource gauges: hp/mp/tp.
    const gaugesX = x + ImageManager.faceWidth;
    const gaugeHeight = 24;
    const gaugesY = this.height - (gaugeHeight * 3);
    this.drawLeaderResourceGauges(gaugesX, gaugesY);

    // render the extraneous gauges: just experience.
    const extraneousX = x + 12;
    const extraneousY = faceY;
    this.drawLeaderExtraneousGauges(extraneousX, extraneousY);

    // draw afflictions for the leader.
    const layout = new StateAfflictionHudLayoutSpec();

    layout.originX = gaugesX;
    layout.originY = gaugesY - (ImageManager.iconHeight * 2) - 48;
    this.afflictionPresenter().render($gameParty.leader(), layout);

    // draw the in‑combat indicator (icon + timer) just to the right of the gauges.
    this.drawLeaderCombatIndicator(gaugesX, gaugesY);
  }

  /**
   * Draw the leader's face.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   */
  drawLeaderFace(x, y)
  {
    // grab the leader of the party.
    const leader = $gameParty.leader();

    // grab and locate the sprite.
    const sprite = this.getOrCreateFullSizeFaceSprite(leader);
    sprite.move(x, y);
    sprite.show();
  }

  /**
   * Draws all the various resource gauges for the leader.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   */
  drawLeaderResourceGauges(x, y)
  {
    // grab the leader of the party.
    const leader = $gameParty.leader();

    const numbersX = x + 12;

    // locate the hp gauge.
    const hpGauge = this.getOrCreateFullSizeGaugeSprite(leader, Window_PartyFrame.gaugeTypes.HP);
    hpGauge.activateGauge();
    hpGauge.move(x, y);
    hpGauge.show();

    // locate the hp numbers.
    const hpNumbers = this.getOrCreateActorValueSprite(leader, Window_PartyFrame.gaugeTypes.HP);
    hpNumbers.move(numbersX, y - 2);
    hpNumbers.show();

    // grab and locate the sprite.
    const mpGaugeY = y + 24;
    const mpGauge = this.getOrCreateFullSizeGaugeSprite(leader, Window_PartyFrame.gaugeTypes.MP);
    mpGauge.activateGauge();
    mpGauge.move(x, mpGaugeY);
    mpGauge.show();

    // locate the mp numbers.
    const mpNumbers = this.getOrCreateActorValueSprite(leader, Window_PartyFrame.gaugeTypes.MP);
    mpNumbers.move(numbersX, mpGaugeY - 2);
    mpNumbers.show();

    // grab and locate the sprite.
    const tpGaugeY = y + 48;
    const tpGauge = this.getOrCreateFullSizeGaugeSprite(leader, Window_PartyFrame.gaugeTypes.TP);
    tpGauge.activateGauge();
    tpGauge.move(x, tpGaugeY);
    tpGauge.show();

    // locate the tp numbers.
    const tpNumbers = this.getOrCreateActorValueSprite(leader, Window_PartyFrame.gaugeTypes.TP);
    tpNumbers.move(numbersX, tpGaugeY - 2);
    tpNumbers.show();
  }

  /**
   * Draws all the extraneous resource gauges for the leader.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   */
  drawLeaderExtraneousGauges(x, y)
  {
    // grab the leader of the party.
    const leader = $gameParty.leader();

    // grab and locate the xp gauge.
    const xpY = y;
    const xpGauge = this.getOrCreateFullSizeGaugeSprite(leader, Window_PartyFrame.gaugeTypes.XP);
    xpGauge.activateGauge();
    xpGauge.move(x, xpY);
    xpGauge.show();

    // locate the xp numbers.
    const xpNumbers = this.getOrCreateActorValueSprite(leader, Window_PartyFrame.gaugeTypes.XP);
    xpNumbers.move(x + 4, xpY);
    xpNumbers.show();

    // locate the level numbers.
    const levelNumbers = this.getOrCreateActorValueSprite(leader, Window_PartyFrame.gaugeTypes.Level);
    levelNumbers.move(x + 80, xpY);
    levelNumbers.show();
  }

  /**
   * Draws the leader's "in‑combat" indicator to the right of the gauges.
   * @param {number} gaugesX The x coordinate where gauges start.
   * @param {number} gaugesY The y coordinate where gauges start.
   */
  drawLeaderCombatIndicator(gaugesX, gaugesY)
  {
    // grab the leader and their tracked battler.
    const leader = $gameParty.leader();
    const leaderBattler = $gameParty.leaderJabsBattler();

    // if we cannot resolve the tracked battler, don't draw.
    if (!leader || !leaderBattler) return;

    // decide visibility based on the combat rules.
    const inCombat = leaderBattler.isInCombat();

    // grab the hp gauge sprite for width math (hp/mp/tp share the same width).

    // fetch or create the three sprites we need.
    const icon = this.getOrCreateCombatIcon(leader);
    const timer = this.getOrCreateCombatTimer(leader);
    const label = this.getOrCreateCombatLabel(leader);

    // determine anchor coordinates to the immediate right of the gauges.
    const hpGauge = this.getOrCreateFullSizeGaugeSprite(leader, Window_PartyFrame.gaugeTypes.HP);
    const iconX = gaugesX + hpGauge.bitmapWidth() + ImageManager.iconWidth;
    const iconY = gaugesY + 10; // align with the HP row.
    icon.move(iconX, iconY);

    // move the timer to be centered below the icon.
    const timerWidth = timer.bitmap
      ? timer.bitmap.width
      : ImageManager.iconWidth;
    const timerX = iconX + Math.floor((ImageManager.iconWidth - timerWidth) / 2);
    const timerY = iconY + ImageManager.iconHeight - 16;
    timer.move(timerX, timerY);

    // move the label to be centered above the icon.
    const labelX = iconX - Math.floor((label.bitmap.width - ImageManager.iconWidth) / 2);
    const labelY = iconY - label.bitmap.height + 20;
    label.move(labelX, labelY);

    // configure a per‑frame fade step for ~0.5 seconds at 60fps.
    const fadeStep = 9; // 255 / 30 ≈ 8.5 → 9

    // we only branch once on inCombat for all three sprites.
    if (inCombat)
    {
      // icon: snap visible and fully opaque while in combat.
      icon.visible = true;
      icon.opacity = 255;

      // timer: update text, show, fully opaque.
      const seconds = leaderBattler.getCombatSecondsRemaining();
      const secondsText = Number(seconds)
        .toFixed(1);
      timer.setText(secondsText);
      timer.show();
      timer.opacity = 255;

      // label: red "IN COMBAT" above the icon.
      label.setColor('#ff3b3b');
      label.setText('IN COMBAT');
      label.show();
      label.opacity = 255;
    }
    else
    {
      // not in combat: fade the icon and timer out over ~0.5s, then hide.

      // icon fade.
      if (icon.opacity > 0)
      {
        icon.opacity = Math.max(0, icon.opacity - fadeStep);
        icon.visible = true;
        if (icon.opacity === 0) icon.visible = false;
      }
      else
      {
        icon.visible = false;
      }

      // timer fade.
      if (timer.opacity > 0)
      {
        timer.opacity = Math.max(0, timer.opacity - fadeStep);
        if (timer.opacity === 0) timer.hide();
      }
      else
      {
        timer.hide();
      }

      // label: instant green "FREE" for strong visual contrast when idle.
      label.setColor('#44ff66');
      label.setText('FREE');
      label.show();
      label.opacity = 255;
    }
  }

  /**
   * Draw all allies data for the hud.
   * @param {number} x The x coordinate.
   * @param {number} oy The origin y coordinate.
   */
  drawAllies(x, oy)
  {
    // grab the line height for re-use.
    const lh = this.lineHeight() + 26;

    // iterate over each ally.
    $gameParty.battleMembers()
      .forEach((ally, index) =>
      {
        // the leader is always index 0, and they are being drawn separately.
        if (index === 0) return;

        const adjustedIndex = index - 1;

        // draw the ally at the designated coordinates.
        const y = oy - (lh * adjustedIndex);
        this.drawAlly(ally, x, y);
      });
  }

  /**
   * Draws a single ally's data for the hud.
   * @param {Game_Actor} ally The ally to draw.
   * @param {number} x The x coordinate.
   * @param {number} oy The origin y coordinate.
   */
  drawAlly(ally, x, oy)
  {
    // draw the ally's mini face.
    this.drawAllyFace(ally, x, oy);

    // draw the ally's mini gauges.
    this.drawAllyGauges(ally, x + 40, oy + 6);
  }

  /**
   * Draws a single ally's mini face for the hud.
   * @param {Game_Actor} ally The ally to draw the face of.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   */
  drawAllyFace(ally, x, y)
  {
    // grab and locate the sprite.
    const sprite = this.getOrCreateMiniSizeFaceSprite(ally);
    sprite.move(x, y);
    sprite.show();
  }

  /**
   * Draws a single ally's mini gauges.
   * @param {Game_Actor} ally The ally to draw the gauges for.
   * @param {number} x The x coordinate.
   * @param {number} oy The original y coordinate.
   */
  drawAllyGauges(ally, x, oy)
  {
    // shorthand the line height variable.
    const lh = 12;

    // locate the hp gauge.
    const hpGauge = this.getOrCreateMiniSizeGaugeSprite(ally, Window_PartyFrame.gaugeTypes.HP);
    hpGauge.activateGauge();
    hpGauge.move(x, oy + lh * 0);
    hpGauge.show();

    // grab and locate the sprite.
    const mpGauge = this.getOrCreateMiniSizeGaugeSprite(ally, Window_PartyFrame.gaugeTypes.MP);
    mpGauge.activateGauge();
    mpGauge.move(x, oy + lh * 1);
    mpGauge.show();

    // grab and locate the sprite.
    const tpGauge = this.getOrCreateMiniSizeGaugeSprite(ally, Window_PartyFrame.gaugeTypes.TP);
    tpGauge.activateGauge();
    tpGauge.move(x, oy + lh * 2);
    tpGauge.show();
  }

  //endregion draw
}

export default Window_PartyFrame;
//endregion Window_PartyFrame