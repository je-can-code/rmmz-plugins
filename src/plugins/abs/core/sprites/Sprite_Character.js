//region Sprite_Character
import JABS_LootDrop from '../models/JABS_LootDrop.js';
import JABS_BattlerName from '../models/JABS_BattlerName.js';
import JABS_Action from '../models/JABS_Action.js';
import Sprite_MapCastGauge from './Sprite_MapCastGauge.js';
import Sprite_MapHpGauge from './Sprite_MapHpGauge.js';
import Sprite_MapAfflictionStrip from './Sprite_MapAfflictionStrip.js';
import StateAfflictionMapLayoutConfig from '../models/StateAfflictionMapLayoutConfig.js';
//region init
/**
 * Hooks into `Sprite_Character.initMembers` and adds our initiation for damage sprites.
 */
J.ABS.Aliased.Sprite_Character.set('initMembers', Sprite_Character.prototype.initMembers);
Sprite_Character.prototype.initMembers = function()
{
  // initialize all JABS-related members.
  this.initJabsMembers();

  // perform original logic.
  J.ABS.Aliased.Sprite_Character.get('initMembers')
    .call(this);
};

/**
 * Initialize all members for JABS.
 */
Sprite_Character.prototype.initJabsMembers = function()
{
  /**
   * The shared root namespace for all of J's plugin data.
   */
  this._j ||= {};

  /**
   * A grouping of all properties associated with JABS.
   */
  this._j._abs ||= {};

  this._j._abs._visDebugGizmo = null;

  // initialize all extraneous members.
  this.initCombatMembers();
  this.initGaugeMembers();
  this.initLootMembers();
};

/**
 * Initializes all combat-related members.
 */
Sprite_Character.prototype.initCombatMembers = function()
{
  /**
   * Whether or not the map sprite setup has been completed.
   * @type {boolean}
   */
  this._j._abs._jabsBattlerSetupComplete = false;

  /**
   * The state overlay sprite associated with this character's battler.
   * @type {Sprite_StateOverlay|null}
   */
  this._j._abs._stateOverlaySprite = null;

  /**
   * The text sprite displaying the name of this character's battler.
   * @type {Sprite_BaseText|null}
   */
  this._j._abs._battlerName = null;

  /**
   * Thin vertical tier color stripe drawn to the left of the map name text (optional).
   * @type {Sprite|null}
   */
  this._j._abs._battlerNameTierStripe = null;
};

/**
 * Initializes all loot-related members.
 */
Sprite_Character.prototype.initLootMembers = function()
{
  /**
   * The umbrella object for loot information.
   */
  this._j._abs._loot = {};

  /**
   * Whether or not the loot sprite setup has been completed.
   * @type {boolean}
   */
  this._j._abs._loot._lootSetupComplete = false;

  /**
   * The icon sprite that represents this character if it is loot.
   * @type {Sprite_Icon|null}
   */
  this._j._abs._loot._sprite = null;

  /**
   * Whether this is on the up or the down swing.
   * @type {boolean} True if on the upswing, false if on the downswing.
   */
  this._j._abs._loot._swing = false;

  /**
   * The modified x coordinate to draw this character as a result of swinging.
   * @type {number}
   */
  this._j._abs._loot._ox = 0;

  /**
   * The modified y coordinate to draw this character as a result of swinging.
   * @type {number}
   */
  this._j._abs._loot._oy = 0;
};

/**
 * Initializes all gauge-related members.
 */
Sprite_Character.prototype.initGaugeMembers = function()
{
  /**
   * A grouping of all gauges associated with JABS.
   */
  this._j._abs._gauges ||= {};

  /**
   * The hp guage for this sprite.
   * @type {Sprite_MapGauge|null}
   */
  this._j._abs._gauges._hpGauge = null;

  /**
   * The cast gauge for this sprite.
   */
  this._j._abs._gauges._castGauge = null;

  /**
   * The affliction strip for this sprite.
   * @type {Sprite_MapAfflictionStrip|null}
   */
  this._j._abs._gauges._afflictionStrip = null;
};
//endregion init

//region setup & reference
/**
 * Hooks into the `Sprite_Character.update` and adds our ABS updates.
 */
J.ABS.Aliased.Sprite_Character.set('update', Sprite_Character.prototype.update);
Sprite_Character.prototype.update = function()
{
  // perform original logic.
  J.ABS.Aliased.Sprite_Character.get('update')
    .call(this);

  // only update the jabs battler components if they have been initialized.
  if (this.isJabsBattlerReady())
  {
    // update the state overlay for this battler.
    this.updateStateOverlay();

    // update the gauges, if any, for this battler.
    this.updateGauges();

    // update the battler's name, if any.
    this.updateBattlerName();
  }

  // only update the loot components if they have been initialized.
  if (this.isLootReady())
  {
    // update the battler's name, if any.
    this.updateLootFloat();
  }
};

/**
 * Whether or not this map sprite has been setup with all its sprites yet.
 * @returns {boolean} True if this jabs battler has been established, false otherwise.
 */
Sprite_Character.prototype.isJabsBattlerReady = function()
{
  return this.isJabsBattlerSetupComplete();
};

/**
 * Give this map sprite setup a stamp of approval, indicating that it is
 * ready to be processed by our `update()` siblings/overlords!
 */
Sprite_Character.prototype.finalizeJabsBattlerSetup = function()
{
  this.setJabsBattlerSetupComplete(true);
};

/**
 * Returns the `Game_Battler` associated with the current sprite.
 * @returns {Game_Actor|Game_Enemy} The battler this sprite is bound to.
 */
Sprite_Character.prototype.getBattler = function()
{
  // check to make sure this is a JABS battler.
  if (this.isJabsBattler())
  {
    // grab the battler associated with this sprite.
    return this.character().getJabsBattler()
      .getBattler();
  }
  // otherwise, this must be a regular sprite for an event.
  else
  {
    return null;
  }
};

/**
 * Gets whether or not this sprite belongs to a battler.
 * @returns {boolean} True if this sprite belongs to a battler, false otherwise.
 */
Sprite_Character.prototype.isJabsBattler = function()
{
  // if the character doesn't exist, or they are a vehicle, they aren't a battler.
  if (!this.character() || this.character().isVehicle()) return false;

  // return whether or not this has a battler attached to it.
  return !!this.character()
    .hasJabsBattler();
};

/**
 * Gets whether or not the underlying {@link Game_Character} is a {@link JABS_Action}.<br>
 * If there is no underlying character, then it is still considered not a {@link JABS_Action}.<br>
 * @returns {boolean}
 */
Sprite_Character.prototype.isJabsAction = function()
{
  // grab the underlying character for this sprite.
  const character = this.character();

  // if we don't have a character, then it must certainly be erased.
  if (!character)
  {
    console.warn('attempted to check erasure status on a non-existing character:', this);
    return false;
  }

  // return the erasure status.
  return character.isJabsAction();
};

/**
 * Whether or not this loot sprite has been setup with all its sprites yet.
 * @returns {boolean}  True if this loot has been established, false otherwise.
 */
Sprite_Character.prototype.isLootReady = function()
{
  return this.isLootSetupComplete();
};

/**
 * Give this loot sprite setup a stamp of approval, indicating that it is
 * ready to be processed by our `update()` siblings/overlords!
 */
Sprite_Character.prototype.finalizeLootSetup = function()
{
  this.setLootSetupComplete(true);
};

/**
 * Whether or not we should be executing JABS-related updates for this sprite.
 * @returns {boolean} True if updating is available, false otherwise.
 */
Sprite_Character.prototype.canUpdate = function()
{
  return $jabsEngine.absEnabled;
};

/**
 * If the "character" is actually a loot drop, don't identify it as empty for the purposes
 * of drawing the loot icon on the map.
 * @returns {boolean} True if the character should be drawn, false otherwise.
 */
J.ABS.Aliased.Sprite_Character.set('isEmptyCharacter', Sprite_Character.prototype.isEmptyCharacter);
Sprite_Character.prototype.isEmptyCharacter = function()
{
  // check if we're loot.
  return this.isLoot()
    // intercept for the case of loot, as it actually is a character to be updated!
    ? false
    // otherwise, perform original logic.
    : J.ABS.Aliased.Sprite_Character.get('isEmptyCharacter')
      .call(this);
};

/**
 * Hooks into the `Sprite_Character.setCharacter` and sets up the battler sprite.
 * @param {Game_Character} character The character being assigned to this sprite.
 */
J.ABS.Aliased.Sprite_Character.set('setCharacter', Sprite_Character.prototype.setCharacter);
Sprite_Character.prototype.setCharacter = function(character)
{
  // perform original logic.
  J.ABS.Aliased.Sprite_Character.get('setCharacter')
    .call(this, character);

  // if the sprite changed, the JABS-related data probably changed, too.
  this.setupJabsSprite();
};

/**
 * Extends `setCharacterBitmap()` to perform on-graphic-change things.
 */
J.ABS.Aliased.Sprite_Character.set('setCharacterBitmap', Sprite_Character.prototype.setCharacterBitmap);
Sprite_Character.prototype.setCharacterBitmap = function()
{
  // perform original logic.
  J.ABS.Aliased.Sprite_Character.get('setCharacterBitmap')
    .call(this);

  // if the sprite changed, the JABS-related data probably changed, too.
  this.setupJabsSprite();
};

/**
 * Setup this `Sprite_Character` with the additional JABS-related functionalities.
 */
Sprite_Character.prototype.setupJabsSprite = function()
{
  // if this is a battler, configure the visual components of the battler.
  this.handleBattlerSetup();

  // perform logic when the character's bitmap changes, like when an event page is changed.
  this.handleLootSetup();
};

/**
 * Handle battler setup for JABS-related data points.
 */
Sprite_Character.prototype.handleBattlerSetup = function()
{
  // check if this is a battler.
  if (this.isJabsBattler())
  {
    // setup the sprite with all the battler-related data points.
    this.setupMapSprite();
  }
};

/**
 * Sets up this character's sprite for activities on the map.
 */
Sprite_Character.prototype.setupMapSprite = function()
{
  // setup a state overlay sprite to display the state of a given battler.
  this.setupStateOverlay();

  // setup a gauge sprite to display
  this.setupHpGauge();

  // setup the cast gauge above the hp gauge.
  this.setupCastGauge();

  // setup a text sprite to display the name of the battler on the map.
  this.setupBattlerName();

  // setup the affliction strip beneath the hp gauge.
  this.setupAfflictionStrip();

  // flag this character as finalized for the purpose of jabs battler-related updates.
  this.finalizeJabsBattlerSetup();
};
//endregion setup & reference

//region visual offsetting
/**
 * Extends {@link Sprite_Character.prototype.updatePosition}.<br/>
 * Also applies per-skill visual metadata (offset, anchor, z, rotation, scale) to JABS action sprites.
 */
J.ABS.Aliased.Sprite_Character.set('updatePosition', Sprite_Character.prototype.updatePosition);
Sprite_Character.prototype.updatePosition = function()
{
  // perform original logic.
  J.ABS.Aliased.Sprite_Character.get('updatePosition')
    .call(this);

  // only apply to JABS action sprites that still exist and aren’t erased.
  if (!this.isJabsAction() || this.character()
    .isErased())
  {
    return;
  }

  // skip visual manipulation if the underlying action has been flagged for removal.
  if (this.character()
    .getJabsActionNeedsRemoving())
  {
    return;
  }

  // apply all visual manipulations for action sprites (anchor, z, offset, rotation, scale, debug).
  this.applyActionVisuals();
};

/**
 * Applies all visual manipulations for JABS action sprites in a structured manner.
 * This includes: anchor override, z-order, direction-aware offset, rotation, scale, and debug gizmo.
 */
Sprite_Character.prototype.applyActionVisuals = function()
{
  // grab the underlying JABS action + base skill.
  const character = this.character(); // Game_Event hosting the action.
  const jabsAction = character.getJabsAction(); // JABS_Action for this sprite.
  if (!jabsAction) return; // nothing to apply.

  const skill = jabsAction.getBaseSkill(); // RPG_Skill of this action.
  if (!skill) return; // cannot resolve visuals without the skill.

  // 1) Optional anchor override (defaults retained when not present).
  this.applyActionAnchor(skill);

  // 2) Optional z-order override.
  this.applyActionZ(skill);

  // 3) Direction-relative per-skill visual pixel offset.
  this.applyActionOffset(skill, jabsAction);

  // 4) Optional rotation (if <visRotate>).
  this.applyActionRotation(skill, jabsAction);

  // 5) Optional scaling (if <visScale:[sx, sy]>).
  this.applyActionScale(skill);

  // 6) Optional debug gizmo at the visual origin to aid in alignment.
  this.applyActionDebug(skill);
};

/**
 * Applies an anchor override when present.
 * @param {RPG_Skill} skill The base skill of the action.
 */
Sprite_Character.prototype.applyActionAnchor = function(skill)
{
  // resolve anchor override if defined (skill tags override action-map Comment tags).
  const jabsAction = this.character().getJabsAction();
  const visAnchor = skill.getJabsVisAnchorMergedForActionMap(jabsAction); // [ax, ay] or null
  if (!visAnchor) return;

  // destructure anchor components.
  const [ ax, ay ] = visAnchor;

  // only assign if different to avoid churn.
  if (this.anchor.x !== ax || this.anchor.y !== ay)
  {
    this.anchor.set(ax, ay); // update anchor.
  }
};

/**
 * Applies a z-order override when present.
 * @param {RPG_Skill} skill The base skill of the action.
 */
Sprite_Character.prototype.applyActionZ = function(skill)
{
  // resolve z override (nullable); merged with action-map template Comments when present.
  const jabsAction = this.character().getJabsAction();
  const visZ = skill.getJabsVisZMergedForActionMap(jabsAction);
  if (visZ === null) return;

  // assign z if provided.
  this.z = visZ;
};

/**
 * Applies the direction-aware [x,y] pixel offset for the visual.
 * @param {RPG_Skill} skill The base skill.
 * @param {JABS_Action} jabsAction The action providing direction.
 */
Sprite_Character.prototype.applyActionOffset = function(skill, jabsAction)
{
  // full travel direction — must match {@link RPG_Skill#getJabsVisOffsetFor} (8-dir including diagonals).
  const facing = jabsAction.getDirectionForVisOffsetTags();

  // resolve the most-appropriate offset for the facing.
  const [ offX, offY ] = skill.getJabsVisOffsetForMergedActionMap(jabsAction, facing);

  // assign from screen space so we never stack drift (parent already assigned x/y from screenX/Y).
  if (offX !== 0 || offY !== 0)
  {
    const ch = this.character();
    this.x = ch.screenX() + offX;
    this.y = ch.screenY() + offY;
  }
};

/**
 * Applies sprite rotation if enabled via <visRotate>.
 * Rotation is applied around the sprite's anchor.
 * @param {RPG_Skill} skill The base skill containing metadata.
 * @param {JABS_Action} jabsAction The action providing direction.
 */
Sprite_Character.prototype.applyActionRotation = function(skill, jabsAction)
{
  // if rotation not requested, do nothing (merged with action-map Comments).
  if (!skill.getJabsVisRotateMergedForActionMap(jabsAction)) return;

  // same 8-dir travel as offset tags — see {@link JABS_Action#getDirectionForVisOffsetTags}.
  const dir = jabsAction.direction();
  const radians = this.directionToRadians(dir);

  // only assign if different enough to matter.
  if (this.rotation !== radians)
  {
    this.rotation = radians;
  }
};

/**
 * Maps numeric directions (1,2,3,4,6,7,8,9) to radians for rotation.
 * Down (2) is treated as 0 rad to match typical "pointing down is default" slash art.
 * Right (6) → +90°, Up (8) → 180°, Left (4) → -90°.
 * Diagonals are ±45° in between.
 * @param {1|2|3|4|6|7|8|9} dir The direction to convert.
 * @returns {number} The radians to rotate by.
 */
Sprite_Character.prototype.directionToRadians = function(dir)
{
  // precomputed constants for clarity.
  const RAD_0 = 0; // down
  const RAD_45 = Math.PI / 4;
  const RAD_90 = Math.PI / 2;
  const RAD_180 = Math.PI;
  const RAD_N90 = -Math.PI / 2;
  const RAD_N45 = -Math.PI / 4;

  switch (dir)
  {
    case 2:
      return RAD_0;            // down
    case 3:
      return RAD_45;           // down-right
    case 6:
      return RAD_90;           // right
    case 9:
      return RAD_90 + RAD_45;  // up-right (135°)
    case 8:
      return RAD_180;          // up
    case 7:
      return -RAD_90 - RAD_45; // up-left (-135°)
    case 4:
      return RAD_N90;          // left
    case 1:
      return RAD_N45;          // down-left (-45°)
  }

  // default: no rotation.
  return 0;
};

/**
 * Applies sprite scaling if specified via <visScale:[sx, sy]>.
 * @param {RPG_Skill} skill The base skill containing scale metadata.
 */
Sprite_Character.prototype.applyActionScale = function(skill)
{
  // resolve scale if present (merged with action-map Comments).
  const jabsAction = this.character().getJabsAction();
  const visScale = skill.getJabsVisScaleMergedForActionMap(jabsAction); // [sx, sy] or null
  if (!visScale) return;

  // destructure components.
  const [ sx, sy ] = visScale;

  // assign scale if different to avoid churn.
  if (this.scale.x !== sx || this.scale.y !== sy)
  {
    this.scale.set(sx, sy);
  }
};

/**
 * Adds or toggles a small crosshair at the sprite origin if <visDebug> is present.
 * @param {RPG_Skill} skill The base skill containing debug metadata.
 */
Sprite_Character.prototype.applyActionDebug = function(skill)
{
  const jabsAction = this.character().getJabsAction();

  // if debugging is desired, ensure the gizmo is visible (merged with action-map Comments).
  if (skill.getJabsVisDebugMergedForActionMap(jabsAction))
  {
    this._j._abs._visDebugGizmo ||= this.createJabsVisDebugGizmo(); // create once.
    if (!this.children.includes(this._j._abs._visDebugGizmo))
    {
      this.addChild(this._j._abs._visDebugGizmo); // attach gizmo.
    }
    this._j._abs._visDebugGizmo.visible = true; // show while debugging.
    return;
  }

  // hide when not debugging.
  if (this._j._abs._visDebugGizmo)
  {
    this._j._abs._visDebugGizmo.visible = false;
  }
};

/**
 * Creates a tiny crosshair to visualize the sprite’s local origin.
 * @returns {PIXI.Graphics}
 */
Sprite_Character.prototype.createJabsVisDebugGizmo = function()
{
  /** @type {PIXI.Graphics} */
  const g = new PIXI.Graphics();
  g.clear();
  g.lineStyle(1, 0xFF3366, 1.0);
  g.moveTo(-4, 0);
  g.lineTo(4, 0);
  g.moveTo(0, -4);
  g.lineTo(0, 4);
  g.endFill();
  return g;
};
//endregion visual offsetting

//region state overlay
/**
 * Sets up this character's state overlay, to show things like poison or paralysis.
 */
Sprite_Character.prototype.setupStateOverlay = function()
{
  // grab the battler of this character.
  const battler = this.getBattler();

  // check if we already have an overlay sprite available.
  if (this.stateOverlaySprite())
  {
    // assign the current battler to the overlay sprite.
    this.stateOverlaySprite().setup(battler);
  }
  // if we don't have an overlay, the build it.
  else
  {
    // create and assign the state overlay sprite..
    this.setStateOverlaySprite(this.createStateOverlaySprite());

    // assign the current battler to the overlay sprite.
    this.stateOverlaySprite().setup(battler);

    // add it to this sprite's tracking.
    this.addChild(this.stateOverlaySprite());
  }
};

/**
 * Creates the sprite representing the overlay of the state on the map.
 * @returns {Sprite_StateOverlay} The overlay sprite, governing state for this character.
 */
Sprite_Character.prototype.createStateOverlaySprite = function()
{
  return new Sprite_StateOverlay();
};

/**
 * Updates the battler's overlay for states (if applicable).
 */
Sprite_Character.prototype.updateStateOverlay = function()
{
  // check if we can update the state overlay.
  if (this.canUpdateStateOverlay())
  {
    // update it.
    this.showStateOverlay();
  }
  // otherwise, if we can't update it...
  else
  {
    // then hide it.
    this.hideStateOverlay();
  }
};

/**
 * Whether or not we should be executing JABS-related updates for this sprite.
 * @returns {boolean} True if updating is available, false otherwise.
 */
Sprite_Character.prototype.canUpdateStateOverlay = function()
{
  // if we're not using JABS, then it shouldn't update.
  if (!this.canUpdate()) return false;

  // if this sprite doesn't have a battler, then it shouldn't update.
  if (!this.isJabsBattler()) return false;

  // if this sprite doesn't even exist yet, then it shouldn't update.
  if (!this.stateOverlaySprite()) return false;

  // we should update!
  return true;
};

/**
 * Shows the state overlay if it exists.
 */
Sprite_Character.prototype.showStateOverlay = function()
{
  this.stateOverlaySprite().show();
};

/**
 * Hides the state overlay if it exists.
 */
Sprite_Character.prototype.hideStateOverlay = function()
{
  this.stateOverlaySprite().hide();
};
//endregion state overlay

//region gauges
/**
 * Sets up this character's hp gauge, to show the hp bar as-needed.
 */
Sprite_Character.prototype.setupHpGauge = function()
{
  // check if we already have an hp gauge sprite available.
  if (!this._j._abs._gauges._hpGauge)
  {
    // create a generic gauge sprite and keep it deactivated until needed.
    const sprite = new Sprite_MapHpGauge();

    // initialize the hp gauge as a generic map gauge.
    this._j._abs._gauges._hpGauge = sprite;

    // add the sprite to tracking.
    this.addChild(this._j._abs._gauges._hpGauge);
  }

  // bind the current battler to the hp gauge sprite.
  this._j._abs._gauges._hpGauge.setupBattler(this.getBattler());

  // activate it the gauge.
  this._j._abs._gauges._hpGauge.activateGauge();

  // locate the gauge below the character.
  this._j._abs._gauges._hpGauge.move(-(this._j._abs._gauges._hpGauge.bitmapWidth() / 2), -12);
};

/**
 * Sets up this character's cast gauge, which shows progress while casting.
 */
Sprite_Character.prototype.setupCastGauge = function()
{
  // determine the current battler & character for this sprite.
  const jabsBattler = this.character().getJabsBattler();
  const expectedCharacter = this.character();

  // if we already have a cast gauge, rebind it to the current battler/character and exit.
  if (this.castGauge())
  {
    // rebind for cast logic + validity.
    this.castGauge().setupJabs(jabsBattler, expectedCharacter);

    // ensure it’s ready to update when needed (visibility is controlled elsewhere).
    this.castGauge().activateGauge();

    // reposition in case dimensions changed (defensive; typically unchanged).
    const sprite = this.castGauge();

    // Snap to integer pixels to avoid subpixel blur and keep placement predictable.
    const x = -Math.round(sprite.bitmapWidth() / 2);
    const y = -28; // a few pixels higher than -24 to accommodate the taller gauge+icon
    sprite.move(x, y);

    // exit early without a payload.
    return;
  }

  // create a dedicated cast gauge sprite and keep it activated.
  const sprite = new Sprite_MapCastGauge();

  // bind the JABS battler + expected character for cast logic and validity.
  sprite.setupJabs(jabsBattler, expectedCharacter);
  sprite.activateGauge();

  // assign for later access.
  this.setCastGauge(sprite);

  // position above the HP gauge, snapped and slightly raised.
  const x = -Math.round(sprite.bitmapWidth() / 2);
  const y = -28;
  sprite.move(x, y);

  // add to this character's sprite.
  this.addChild(sprite);
};

/**
 * Updates the all gauges associated with this battler
 */
Sprite_Character.prototype.updateGauges = function()
{
  // check if we can update the hp gauge.
  if (this.canUpdateHpGauge())
  {
    // update it.
    this.updateHpGauge();
  }
  // otherwise, if we can't update it...
  else
  {
    // then hide it.
    this.hideHpGauge();
  }

  // check if we can update the cast gauge.
  if (this.canUpdateCastGauge())
  {
    // update it.
    this.updateCastGauge();
  }
  // otherwise, if we can't update it...
  else
  {
    // then hide it.
    this.hideCastGauge();
  }

  // refresh the affliction strip beneath the hp gauge.
  if (this.canUpdateAfflictionStrip() === true)
  {
    this.updateAfflictionStrip();
  }
  else
  {
    this.hideAfflictionStrip();
  }
};

/**
 * Sets up the affliction strip beneath the hp gauge when applicable.
 */
Sprite_Character.prototype.setupAfflictionStrip = function()
{
  if (!this.afflictionStrip())
  {
    const strip = new Sprite_MapAfflictionStrip();

    this.setAfflictionStrip(strip);
    this.addChild(strip);
  }

  this.afflictionStrip().setupBattler(this.getBattler());
  this.repositionAfflictionStrip();
};

/**
 * Updates the affliction strip for this battler.
 */
Sprite_Character.prototype.updateAfflictionStrip = function()
{
  const { _afflictionStrip: strip } = this._j._abs._gauges;

  strip.updateStrip();
  this.repositionAfflictionStrip();
};

/**
 * Repositions the affliction strip below the hp gauge, left-aligned to the hp bar.
 */
Sprite_Character.prototype.repositionAfflictionStrip = function()
{
  const { _afflictionStrip: strip, _hpGauge: hpGauge } = this._j._abs._gauges;

  if (!strip)
  {
    return;
  }

  let x = 0;

  if (hpGauge)
  {
    ({ x } = hpGauge);
  }

  const y = this.mapAfflictionStripY();

  strip.move(x, y);
};

/**
 * Resolves the y coordinate for the affliction strip beneath the hp gauge.
 * @returns {number}
 */
Sprite_Character.prototype.mapAfflictionStripY = function()
{
  const layoutConfig = StateAfflictionMapLayoutConfig.fromMetadata();
  const { gapBelowHpBar } = layoutConfig;
  const hpGauge = this._j._abs._gauges._hpGauge;

  if (this.canUpdateHpGauge() === true && hpGauge)
  {
    return hpGauge.y + hpGauge.bitmapHeight() + gapBelowHpBar;
  }

  return gapBelowHpBar;
};

/**
 * Whether the affliction strip can update for this sprite.
 * @returns {boolean}
 */
Sprite_Character.prototype.canUpdateAfflictionStrip = function()
{
  if (this.canUpdate() === false)
  {
    return false;
  }

  if (this.isJabsBattler() === false)
  {
    return false;
  }

  if (!this.afflictionStrip())
  {
    return false;
  }

  const jabsBattler = this.character().getJabsBattler();

  if (!jabsBattler)
  {
    return false;
  }

  if (jabsBattler.showStates() === false)
  {
    return false;
  }

  return true;
};

/**
 * Hides the affliction strip when it cannot update.
 */
Sprite_Character.prototype.hideAfflictionStrip = function()
{
  if (!this.afflictionStrip())
  {
    return;
  }

  this.afflictionStrip().hide();
};

/**
 * Determines whether or not we can update the hp gauge.
 * @returns {boolean} True if we can update the hp gauge, false otherwise.
 */
Sprite_Character.prototype.canUpdateHpGauge = function()
{
  // if we're not using JABS, then it shouldn't update.
  if (!this.canUpdate()) return false;

  // if this sprite doesn't have a battler, then it shouldn't update.
  if (!this.isJabsBattler()) return false;

  // if we aren't allowed to show the gauge, then it shouldn't update.
  if (!this.character().getJabsBattler()
    .showHpBar())
  {
    return false;
  }

  // we should update!
  return true;
};

/**
 * Determines whether or not we can update the cast gauge.
 * @returns {boolean} True if we can update the cast gauge, false otherwise.
 */
Sprite_Character.prototype.canUpdateCastGauge = function()
{
  // if we're not using JABS, then it shouldn't update.
  if (!this.canUpdate()) return false;

  // if this sprite doesn't have a battler, then it shouldn't update.
  if (!this.isJabsBattler()) return false;

  // if we don't have a cast gauge sprite, we can't update it.
  if (!this.castGauge()) return false;

  // use the current JABS battler's live casting/channeling state as the gate.
  const jabs = this.character().getJabsBattler();
  if (!jabs) return false; // no battler

  // must be actively casting or channeling.
  if (!jabs.isCastingOrChanneling()) return false;

  // must have a decided action.
  const decided = jabs.getDecidedAction();
  if (!decided || decided.length === 0) return false;

  // must have time remaining- whichever of the two states is actually active.
  if (jabs.isCasting() && jabs.getCastTimeCountdown() <= 0) return false;
  if (jabs.isChanneling() && jabs.getChannelDurationRemaining() <= 0) return false;

  // ready to update this frame.
  return true;
};

/**
 * Updates the hp gauge sprite.
 */
Sprite_Character.prototype.updateHpGauge = function()
{
  // show the hp gauge if we should be showing it.
  this.showHpGauge();

  // ensure the hp gauge matches the current battler.
  this.setBattler(this.getBattler());
};

/**
 * Updates the cast gauge sprite.
 */
Sprite_Character.prototype.updateCastGauge = function()
{
  // make sure we show it while casting (we only get here when canUpdateCastGauge() is true).
  this.showCastGauge();

  // ensure the gauge rebinds if host/jabs changed (post-swap safe).
  const gauge = this.castGauge();
  if (gauge)
  {
    const currentJabs = this.character().getJabsBattler();

    // if the bound JABS battler or its expected host changed, rebind.
    // eslint-disable-next-line max-len
    const needsRebind = (gauge._jabsBattler !== currentJabs || gauge._expectedCharacter !== this.character() || gauge._expectedUuid !== (currentJabs
      ? currentJabs.getUuid()
      : null));

    if (needsRebind)
    {
      // bind JABS battler (for casting state) + expected character (host guard) + underlying battler.
      gauge.setupJabs(currentJabs, this.character());
    }

    // keep the underlying base battler fresh for Sprite_Gauge internals.
    gauge._battler = this.getBattler();
  }
};

/**
 * Shows the hp gauge if it exists.
 */
Sprite_Character.prototype.showHpGauge = function()
{
  this._j._abs._gauges._hpGauge.show();
};

/**
 * Hides the hp gauge if it exists.
 */
Sprite_Character.prototype.hideHpGauge = function()
{
  this._j._abs._gauges._hpGauge.hide();
};

/**
 * Shows the cast gauge if it exists.
 */
Sprite_Character.prototype.showCastGauge = function()
{
  const gauge = this.castGauge();
  if (gauge)
  {
    gauge.activateGauge();
    gauge.show();
  }
};

/**
 * Hides the cast gauge if it exists.
 */
Sprite_Character.prototype.hideCastGauge = function()
{
  const gauge = this.castGauge();
  if (gauge)
  {
    gauge.hide();
  }
};
//endregion gauges

//region battler name
/**
 * Sets up this battler's name as a sprite below the character.
 */
Sprite_Character.prototype.setupBattlerName = function()
{
  // check if we already have a battler name present.
  if (this.battlerName())
  {
    // get the name of this battler.
    const { name, colorHex, tier } = this.getBattlerName();

    // redraw the new battler name.
    this.battlerName().setText(name);
    this.battlerName().setColor('#ffffff');

    // refresh the tier stripe bitmap when the stripe exists and the color is still valid.
    if (this._j._abs._battlerNameTierStripe && this.shouldDrawMapTierStripe(colorHex))
    {
      const fontSize = this.battlerName().fontSize();
      this._j._abs._battlerNameTierStripe.bitmap = this.buildMapTierStripeBitmap(colorHex, fontSize, tier);
    }

    // if we already have the sprite, no need to recreate it.
    return;
  }

  // build and assign the battler name sprite.
  this.setBattlerName(this.createBattlerNameSprite());

  // add stripe behind the text so the name draws on top.
  if (this._j._abs._battlerNameTierStripe)
  {
    this.addChild(this._j._abs._battlerNameTierStripe);
  }

  this.addChild(this.battlerName());
};

/**
 * Creates the sprite that contains this battler's name.
 * @returns {Sprite_BaseText} The battlers name, as a sprite.
 */
Sprite_Character.prototype.createBattlerNameSprite = function()
{
  const battlerNameData = this.getBattlerName();
  const { name, colorHex, tier } = battlerNameData;
  const fontSize = 16;

  // construct text sprite for the next step in this routine.
  const textSprite = new Sprite_BaseText()
    .setText(name)
    .setFontSize(fontSize)
    .setAlignment(Sprite_BaseText.Alignments.Left)
    .setColor('#ffffff');

  textSprite.move(-70, 0);

  this._j._abs._battlerNameTierStripe = null;

  if (this.shouldDrawMapTierStripe(colorHex))
  {
    const stripeSprite = new Sprite();
    stripeSprite.bitmap = this.buildMapTierStripeBitmap(colorHex, fontSize, tier);
    const outerW = stripeSprite.bitmap.width;
    const outerH = stripeSprite.bitmap.height;
    const GAP = 4;
    const stripeY = this.computeMapTierStripeY(textSprite, outerH);
    stripeSprite.move(-70 - GAP - outerW, stripeY);
    this._j._abs._battlerNameTierStripe = stripeSprite;
  }

  return textSprite;
};

/**
 * Map nameplate draws {@link JABS_BattlerName#colorHex} on the stripe only; HUD may use the same field for text.
 * @param {string} colorHex The color hex driving this step.
 * @returns {boolean}
 */
Sprite_Character.prototype.shouldDrawMapTierStripe = function(colorHex)
{
  if (colorHex === String.empty) return false;

  if (this.isValidMapTierStripeHex(colorHex) === false) return false;

  const lower = colorHex.toLowerCase();

  if (lower === '#ffffff' || lower === '#fff') return false;

  return true;
};

/**
 * Validates hex color strings before drawing map tier stripe overlays.
 * @param {string} color The color driving this step.
 * @returns {boolean}
 */
Sprite_Character.prototype.isValidMapTierStripeHex = function(color)
{
  const structure = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

  return structure.test(color);
};

/**
 * Clamps a raw tier rank down to the number of pips the stripe should draw.
 * `0` or `1` both mean "no pip subdivision" (single solid block, matches legacy stripe shape).
 * @param {number} tier The raw tier rank from {@link JABS_BattlerName#tier}.
 * @returns {number} The pip count to draw, at least 1 and at most 5.
 */
Sprite_Character.prototype.computeTierPipCount = function(tier)
{
  const MAX_PIPS = 5;

  // no tag (0) or the lowest tier (1) both render as a single solid block, same as before this feature existed.
  if (!tier || tier <= 1) return 1;

  // higher tiers cap at MAX_PIPS so a mis-tagged value cannot blow out the stripe bitmap width.
  return Math.min(tier, MAX_PIPS);
};

/**
 * Builds the bordered stripe bitmap used beside map tier labels.
 * A pip count of 1 draws the original single solid block; anything higher draws that many thin
 * vertical pips instead, so tier rank is visually legible without memorizing per-tier hex colors.
 * @param {string} colorHex The color hex driving this step.
 * @param {number} fontSize The font size driving this step.
 * @param {number} tier The tier rank driving how many pips to draw.
 * @returns {Bitmap}
 */
Sprite_Character.prototype.buildMapTierStripeBitmap = function(colorHex, fontSize, tier)
{
  const BORDER = 1;
  const outerH = fontSize;
  const innerH = outerH - BORDER * 2;
  const pipCount = this.computeTierPipCount(tier);

  // single solid block: identical output to the pre-pip stripe, so untagged/tier-1 states never change visually.
  if (pipCount <= 1)
  {
    const INNER_W = 4;
    const outerW = INNER_W + BORDER * 2;
    const bitmap = new Bitmap(outerW, outerH);
    bitmap.fillRect(0, 0, outerW, outerH, '#000000');
    bitmap.fillRect(BORDER, BORDER, INNER_W, innerH, colorHex);

    return bitmap;
  }

  // multiple pips: each pip is a thin bar with a gap between, sized to fit the pip count.
  const PIP_W = 2;
  const PIP_GAP = 1;
  const innerW = (pipCount * PIP_W) + ((pipCount - 1) * PIP_GAP);
  const outerW = innerW + BORDER * 2;
  const bitmap = new Bitmap(outerW, outerH);

  bitmap.fillRect(0, 0, outerW, outerH, '#000000');

  for (let pipIndex = 0; pipIndex < pipCount; pipIndex++)
  {
    const pipX = BORDER + (pipIndex * (PIP_W + PIP_GAP));
    bitmap.fillRect(pipX, BORDER, PIP_W, innerH, colorHex);
  }

  return bitmap;
};

/**
 * Vertically centers the tier stripe beside the nameplate text sprite.
 * @param {Sprite_BaseText} textSprite The text sprite driving this step.
 * @param {number} outerH The outer h driving this step.
 * @returns {number}
 */
Sprite_Character.prototype.computeMapTierStripeY = function(textSprite, outerH)
{
  const textH = textSprite.bitmap
    ? textSprite.bitmap.height
    : textSprite.fontSize() * 3;

  return Math.max(0, Math.floor((textH - outerH) / 2));
};

/**
 * Gets this battler's name.
 * @returns {JABS_BattlerName}
 */
Sprite_Character.prototype.getBattlerName = function()
{
  // get the battler if we have one.
  const battler = this.getBattler();

  // initialize the battler name.
  const battlerName = new JABS_BattlerName();

  // if we don't, then just return an empty name.
  if (!battler) return battlerName;

  // update the name to reflect the battler's name.
  battlerName.name = battler.databaseData().name;

  // return the battler name.
  return battlerName;
};

/**
 * Updates this battler's name.
 */
Sprite_Character.prototype.updateBattlerName = function()
{
  // check if we can update the battler name.
  if (this.canUpdateBattlerName())
  {
    // update it.
    this.showBattlerName();
  }
  // otherwise, if we can't update it...
  else
  {
    // then hide it.
    this.hideBattlerName();
  }
};

/**
 * Determines whether or not we can update the battler name.
 * @returns {boolean} True if we can update the battler name, false otherwise.
 */
Sprite_Character.prototype.canUpdateBattlerName = function()
{
  // if we're not using JABS, then it shouldn't update.
  if (!this.canUpdate()) return false;

  // if this sprite doesn't have a battler, then it shouldn't update.
  if (!this.isJabsBattler()) return false;

  // if we aren't allowed to show the battler name, then it shouldn't update.
  if (!this.character().getJabsBattler()
    .showBattlerName())
  {
    return false;
  }

  // we should update!
  return true;
};

/**
 * Shows the battler's name if it exists.
 */
Sprite_Character.prototype.showBattlerName = function()
{
  this.battlerName().show();

  if (this._j._abs._battlerNameTierStripe)
  {
    this._j._abs._battlerNameTierStripe.show();
  }
};

/**
 * Hides the battler's name if it exists.
 */
Sprite_Character.prototype.hideBattlerName = function()
{
  this.battlerName().hide();

  if (this._j._abs._battlerNameTierStripe)
  {
    this._j._abs._battlerNameTierStripe.hide();
  }
};
//endregion battler name

//region loot
/**
 * Handle loot setup for loot that hasn't been drawn yet.
 */
Sprite_Character.prototype.handleLootSetup = function()
{
  // check if this is loot.
  if (this.isLoot())
  {
    // check if we've already drawn the loot.
    if (!this.hasLootDrawn())
    {
      // draw the loot sprite for this character.
      this.setupLootSprite();
    }
  }
};

/**
 * Whether or not we've drawn the child sprites that make up the loot.
 * @returns {boolean} True if we've already drawn the loot sprites, false otherwise.
 */
Sprite_Character.prototype.hasLootDrawn = function()
{
  return this.children.length > 0;
};

/**
 * Sets up this character's sprite for activities on the map.
 */
Sprite_Character.prototype.setupLootSprite = function()
{
  // flag this character is "through", so they don't block movement of others.
  this.character()._through = true;

  // create the image sprite icon.
  const lootSprite = this.createLootSprite();

  // assign the image sprite icon.
  this.setLootSprite(lootSprite);

  // add it to this sprite's tracking.
  this.addChild(lootSprite);

  // flag this character as finalized for the purpose of loot-related updates.
  this.finalizeLootSetup();
};

/**
 * Gets the loot sprite associated with this character.
 * Will return null if there is no loot.
 * @returns {Sprite_Icon|null}
 */
Sprite_Character.prototype.getLootSprite = function()
{
  return this._j._abs._loot._sprite;
};

/**
 * Sets the loot sprite associated with this character.
 * @param {Sprite_Icon} sprite The icon sprite for this loot.
 */
Sprite_Character.prototype.setLootSprite = function(sprite)
{
  this._j._abs._loot._sprite = sprite;
};

/**
 * Creates the loot sprite based on the loot the enemy drop.
 */
Sprite_Character.prototype.createLootSprite = function()
{
  // get the loot's icon index.
  const iconIndex = this.getLootIcon();

  // build the sprite from the icon.
  const sprite = new Sprite_Icon(iconIndex);

  // relocate the loot a bit randomly.
  const xOffset = J.BASE.Helpers.getRandomNumber(-30, 0);
  const yOffset = J.BASE.Helpers.getRandomNumber(-90, -70);
  sprite.move(xOffset, yOffset);

  // return the built sprite.
  return sprite;
};

/**
 * Gets the loot data associated with this sprite.
 * @returns {JABS_LootDrop}
 */
Sprite_Character.prototype.getLootData = function()
{
  return this.character().getJabsLoot();
};

/**
 * Gets the loot icon associated with the underlying loot.
 * @returns {number} The icon index of the loot, or -1 if there is none.
 */
Sprite_Character.prototype.getLootIcon = function()
{
  return this.getLootData().lootIcon() ?? -1;
};

/**
 * Gets the loot icon associated with the underlying loot.
 * @returns {number} The icon index of the loot, or -1 if there is none.
 */
Sprite_Character.prototype.getLootExpired = function()
{
  return this.getLootData().isExpired() ?? true;
};

/**
 * Executes the loot's countdown to expiry.
 */
Sprite_Character.prototype.performLootDurationCountdown = function()
{
  // execute a countdown on behalf of the loot.
  this.getLootData()
    .countdownDuration();
};

/**
 * Deletes all child loot sprites from the screen.
 */
Sprite_Character.prototype.deleteLootSprite = function()
{
  if (this.children.length > 0)
  {
    this.children.splice(0, this.children.length);
  }
};

/**
 * Gets whether or not this sprite is actually just some loot to be gathered.
 * @returns {boolean} True if this sprite represents a loot object, false otherwise.
 */
Sprite_Character.prototype.isLoot = function()
{
  return this.character().isJabsLoot();
};

/**
 * The current direction of swing.
 * @returns {boolean} True if we're swinging up, false if we're swinging down.
 */
Sprite_Character.prototype.lootSwing = function()
{
  return this.isSwing();
};

/**
 * Swing the loot up and enforce the direction.
 * @param {number} amount The amount of the direction.
 */
Sprite_Character.prototype.lootSwingUp = function(amount = 0)
{
  this.setSwing(true);

  this.setOy(this.oy() - amount);
};

/**
 * Swing the loot down and enforce the direction.
 * @param {number} amount The amount of the direction.
 */
Sprite_Character.prototype.lootSwingDown = function(amount = 0)
{
  this.setSwing(false);

  this.setOy(this.oy() + amount);
};

/**
 * Updates the loot to give the effect that it is floating in place.
 */
Sprite_Character.prototype.updateLootFloat = function()
{
  // perform the countdown and manage this loot expiration.
  this.handleLootDuration();

  // manage the floaty-ness if we float.
  this.handleLootFloat();
};

/**
 * Handles loot duration and expiration for this sprite.
 */
Sprite_Character.prototype.handleLootDuration = function()
{
  // tick tock the duration countdown of the loot if it has an expiration.
  this.performLootDurationCountdown();

  // check if the loot is now expired.
  if (this.getLootExpired())
  {
    // expire it if it is.
    this.expireLoot();
  }
};

/**
 * Perform all steps to have this loot expired and removed.
 */
Sprite_Character.prototype.expireLoot = function()
{
  // don't reset the removal if its already set.
  if (this.character().getLootNeedsRemoving()) return;

  // set the loot to be removed.
  this.character().setLootNeedsRemoving(true);
  $jabsEngine.requestClearLoot = true;
};

/**
 * Handles the float effect of the loot while on the map.
 */
Sprite_Character.prototype.handleLootFloat = function()
{
  // check if we can update the loot float.
  if (this.canUpdateLootFloat())
  {
    // float the loot.
    this.lootFloat();
  }
};

/**
 * Checks whether or not we can float the loot.
 * @returns {boolean} True if we can, false if we cannot.
 */
Sprite_Character.prototype.canUpdateLootFloat = function()
{
  // if we have no sprite, we can't update it.
  if (!this.getLootSprite()) return false;

  // if the loot is expired, we can't update it.
  if (this.getLootExpired()) return false;

  // we can update!
  return true;
};

/**
 * A basic slow swing up and down a bit for the loot drops.
 */
Sprite_Character.prototype.lootFloat = function()
{
  // Lets swing up and down a bit.
  if (this.lootSwing())
  {
    // ~swing up!
    this.lootFloatUp();
  }
  else
  {
    // !swing down~
    this.lootFloatDown();
  }
};

/**
 * The downswing of a loot sprite while floating.
 */
Sprite_Character.prototype.lootFloatDown = function()
{
  // grab the sprite for floaty goodness- if we have one.
  const lootSprite = this.getLootSprite();

  // swing the loot down.
  this.lootSwingDown(0.3);
  lootSprite.y += 0.3;

  // check if we should swing back up.
  if (this.shouldSwingUp())
  {
    // if so, swing up.
    this.lootSwingUp();
  }
};

/**
 * Determines whether or not we should reverse the swing back upwards.
 * @returns {boolean}
 */
Sprite_Character.prototype.shouldSwingUp = function()
{
  return this.oy() > 5;
};

/**
 * The upswing of a loot sprite while floating.
 */
Sprite_Character.prototype.lootFloatUp = function()
{
  // grab the sprite for floaty goodness- if we have one.
  const lootSprite = this.getLootSprite();

  // swing the loot up.
  this.lootSwingUp(0.3);
  lootSprite.y -= 0.3;

  // check if we've swung too far down.
  if (this.shouldSwingDown())
  {
    // if so, swing up.
    this.lootSwingDown();
  }
};

/**
 * Determines whether or not we should reverse the swing back upwards.
 * @returns {boolean}
 */
Sprite_Character.prototype.shouldSwingDown = function()
{
  return this.oy() < -5;
};
//endregion loot

//region properties
/**
 * Gets the jabs battler setup complete.
 * @returns {*} The jabsBattlerSetupComplete.
 */
Sprite_Character.prototype.isJabsBattlerSetupComplete = function()
{
  // hand back the jabs battler setup complete.
  return this._j._abs._jabsBattlerSetupComplete;
};

/**
 * Sets the jabs battler setup complete.
 * @param {*} newJabsBattlerSetupComplete The new jabsBattlerSetupComplete.
 */
Sprite_Character.prototype.setJabsBattlerSetupComplete = function(newJabsBattlerSetupComplete)
{
  // assign the jabs battler setup complete.
  this._j._abs._jabsBattlerSetupComplete = newJabsBattlerSetupComplete;
};

/**
 * Gets the loot setup complete.
 * @returns {*} The lootSetupComplete.
 */
Sprite_Character.prototype.isLootSetupComplete = function()
{
  // hand back the loot setup complete.
  return this._j._abs._loot._lootSetupComplete;
};

/**
 * Sets the loot setup complete.
 * @param {*} newLootSetupComplete The new lootSetupComplete.
 */
Sprite_Character.prototype.setLootSetupComplete = function(newLootSetupComplete)
{
  // assign the loot setup complete.
  this._j._abs._loot._lootSetupComplete = newLootSetupComplete;
};

/**
 * Gets the state overlay sprite.
 * @returns {*} The stateOverlaySprite.
 */
Sprite_Character.prototype.stateOverlaySprite = function()
{
  // hand back the state overlay sprite.
  return this._j._abs._stateOverlaySprite;
};

/**
 * Sets the state overlay sprite.
 * @param {*} newStateOverlaySprite The new stateOverlaySprite.
 */
Sprite_Character.prototype.setStateOverlaySprite = function(newStateOverlaySprite)
{
  // assign the state overlay sprite.
  this._j._abs._stateOverlaySprite = newStateOverlaySprite;
};

/**
 * Gets the cast gauge.
 * @returns {*} The castGauge.
 */
Sprite_Character.prototype.castGauge = function()
{
  // hand back the cast gauge.
  return this._j._abs._gauges._castGauge;
};

/**
 * Sets the cast gauge.
 * @param {*} newCastGauge The new castGauge.
 */
Sprite_Character.prototype.setCastGauge = function(newCastGauge)
{
  // assign the cast gauge.
  this._j._abs._gauges._castGauge = newCastGauge;
};

/**
 * Gets the affliction strip.
 * @returns {*} The afflictionStrip.
 */
Sprite_Character.prototype.afflictionStrip = function()
{
  // hand back the affliction strip.
  return this._j._abs._gauges._afflictionStrip;
};

/**
 * Sets the affliction strip.
 * @param {*} newAfflictionStrip The new afflictionStrip.
 */
Sprite_Character.prototype.setAfflictionStrip = function(newAfflictionStrip)
{
  // assign the affliction strip.
  this._j._abs._gauges._afflictionStrip = newAfflictionStrip;
};

/**
 * Gets the JABS battler this character sprite is rendering.
 * @returns {JABS_Battler} The rendered battler.
 */
Sprite_Character.prototype.battler = function()
{
  // hand back the battler.
  return this._j._abs._gauges._hpGauge._battler;
};

/**
 * Binds this character sprite to the JABS battler it renders.
 * @param {JABS_Battler} newBattler The battler to render.
 */
Sprite_Character.prototype.setBattler = function(newBattler)
{
  // assign the battler.
  this._j._abs._gauges._hpGauge._battler = newBattler;
};

/**
 * Gets the battler name.
 * @returns {*} The battlerName.
 */
Sprite_Character.prototype.battlerName = function()
{
  // hand back the battler name.
  return this._j._abs._battlerName;
};

/**
 * Sets the battler name.
 * @param {*} newBattlerName The new battlerName.
 */
Sprite_Character.prototype.setBattlerName = function(newBattlerName)
{
  // assign the battler name.
  this._j._abs._battlerName = newBattlerName;
};

/**
 * Gets whether this loot sprite is mid-swing in its idle bobbing animation.
 * @returns {boolean} True while swinging outward.
 */
Sprite_Character.prototype.isSwing = function()
{
  // hand back the swing.
  return this._j._abs._loot._swing;
};

/**
 * Sets which half of the idle bobbing animation this loot sprite is in.
 * @param {boolean} newSwing True to swing outward.
 */
Sprite_Character.prototype.setSwing = function(newSwing)
{
  // assign the swing.
  this._j._abs._loot._swing = newSwing;
};

/**
 * Gets the vertical offset currently applied by the loot bobbing animation.
 * @returns {number} The vertical offset in pixels.
 */
Sprite_Character.prototype.oy = function()
{
  // hand back the oy.
  return this._j._abs._loot._oy;
};

/**
 * Sets the vertical offset applied by the loot bobbing animation.
 * @param {number} newOy The vertical offset in pixels.
 */
Sprite_Character.prototype.setOy = function(newOy)
{
  // assign the oy.
  this._j._abs._loot._oy = newOy;
};
//endregion properties
//endregion Sprite_Character