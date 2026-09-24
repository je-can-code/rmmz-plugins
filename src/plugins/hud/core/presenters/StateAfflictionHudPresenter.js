//region StateAfflictionHudPresenter
/**
 * Renders HUD afflictions with icons, timers, and stack counts.<br/>
 * Where each piece lands- two rows or one, full-size icons or smaller ones on colored squares- is decided
 * by the {@link StateAfflictionHudLayoutSpec} the host window hands over each frame.
 */
class StateAfflictionHudPresenter
{
  /**
   * The host window that owns child sprites.
   * @type {Window_Base}
   */
  #hostWindow = null;

  /**
   * The sprite cache map shared with the host window.
   * @type {Map<string, Sprite_Icon|Sprite_BaseText|Sprite>}
   */
  #spriteCache = null;

  /**
   * The battler rendered in the previous frame, used to detect target switches.
   * @type {Game_Battler|null}
   */
  #lastBattler = null;

  /**
   * Constructor.
   * @param {Window_Base} hostWindow The window that parents affliction sprites.
   * @param {Map<string, Sprite_Icon|Sprite_BaseText|Sprite>} spriteCache The host sprite cache.
   */
  constructor(hostWindow, spriteCache)
  {
    this.#hostWindow = hostWindow;
    this.#spriteCache = spriteCache;
  }

  /**
   * Renders negative and positive affliction rows for a battler.
   * @param {Game_Battler} battler The afflicted battler.
   * @param {StateAfflictionHudLayoutSpec} layoutSpec The layout coordinates.
   */
  render(battler, layoutSpec)
  {
    // when the target changes, hide every sprite from the previous battler so they don't
    // persist as ghost icons behind the new target's afflictions.
    if (this.#lastBattler !== battler)
    {
      this.#hideAllSpritesForBattler(this.#lastBattler);
      this.#lastBattler = battler;
    }

    const collection = StateAfflictionProvider.collectForBattler(battler);

    this.hideStaleSlots(battler, collection);

    if (collection.isEmpty() === true)
    {
      return;
    }

    for (let index = 0; index < collection.negative.length; index++)
    {
      const viewModel = collection.negative[index];
      const x = layoutSpec.slotX(index);
      const y = layoutSpec.negativeRowY();

      this.renderSlot(battler, viewModel, x, y, layoutSpec);
    }

    for (let index = 0; index < collection.positive.length; index++)
    {
      const viewModel = collection.positive[index];

      // buffs may share the debuffs' row, in which case they start past the last debuff.
      const x = layoutSpec.positiveSlotX(index, collection.negative.length);
      const y = layoutSpec.positiveRowY();

      this.renderSlot(battler, viewModel, x, y, layoutSpec);
    }
  }

  /**
   * Hides all affliction sprites belonging to the given battler.
   * Called when the presenter switches to a different battler so ghost sprites
   * from the previous target do not persist in the shared sprite cache.
   * @param {Game_Battler|null} battler The battler whose sprites should be hidden.
   */
  #hideAllSpritesForBattler(battler)
  {
    // nothing to clean up if there was no previous battler.
    if (!battler) return;

    const uuid = battler.getUuid();

    // all affliction sprite keys are suffixed with the owning battler's uuid,
    // so filtering by suffix correctly isolates every icon, timer, and stack
    // sprite that belongs to the departing battler.
    for (const [ key, sprite ] of this.#spriteCache)
    {
      if (key.endsWith(`-${uuid}`))
      {
        sprite.hide();
      }
    }
  }

  /**
   * Hides sprites for expired or removed afflictions.
   * @param {Game_Battler} battler The afflicted battler.
   * @param {StateAfflictionCollection} collection The active affliction collection.
   */
  hideStaleSlots(battler, collection)
  {
    const identity = StateAfflictionBattlerIdentity.fromBattler(battler);
    const activeStateIds = new Set();

    for (const viewModel of collection.allActive())
    {
      activeStateIds.add(viewModel.stateId);
    }

    if (StateAfflictionProvider.canCollect() === true)
    {
      const trackedStateValues = $jabsEngine.getJabsStatesByUuid(battler.getUuid())
        .values();

      const trackedStates = Array.from(trackedStateValues);

      for (const trackedState of trackedStates)
      {
        if (trackedState.expired === false)
        {
          continue;
        }

        this.hideSlotSprites(identity, trackedState.stateId);
      }
    }

    for (const key of this.#spriteCache.keys())
    {
      const stateId = StateAfflictionHudPresenter.parseCachedStateId(key, identity.uuid);

      if (stateId === null)
      {
        continue;
      }

      if (activeStateIds.has(stateId) === true)
      {
        continue;
      }

      this.hideSlotSprites(identity, stateId);
    }
  }

  /**
   * Parses a cached affliction sprite key into a state id when it belongs to the battler.
   * @param {string} key The sprite cache key.
   * @param {string} uuid The battler uuid.
   * @returns {number|null}
   */
  static parseCachedStateId(key, uuid)
  {
    const prefixes = [
      'affliction-icon-',
      'affliction-timer-',
      'affliction-stack-',
      'affliction-backing-',
    ];

    let matchedPrefix = null;

    for (const prefix of prefixes)
    {
      if (key.startsWith(prefix) === true)
      {
        matchedPrefix = prefix;
        break;
      }
    }

    if (matchedPrefix === null)
    {
      return null;
    }

    if (key.endsWith(`-${uuid}`) === false)
    {
      return null;
    }

    const middle = key.slice(matchedPrefix.length, key.length - uuid.length - 1);
    const stateId = Number(middle);

    if (Number.isFinite(stateId) === false)
    {
      return null;
    }

    return stateId;
  }

  /**
   * Renders a single affliction slot.
   * @param {Game_Battler} battler The afflicted battler.
   * @param {StateAfflictionViewModel} viewModel The row to render.
   * @param {number} ox The origin x coordinate.
   * @param {number} y The origin y coordinate.
   * @param {StateAfflictionHudLayoutSpec} layoutSpec The layout the slot is drawn to.
   */
  renderSlot(battler, viewModel, ox, y, layoutSpec)
  {
    const state = battler.state(viewModel.stateId);
    const iconIndex = state
      ? state.iconIndex
      : 0;
    const timerSprite = this.getOrCreateTimerSprite(battler, viewModel.stateId, layoutSpec);

    // the timer and stack count both center on the icon, however large the icon is drawn.
    const centerX = layoutSpec.slotCenterX(ox);

    if (viewModel.isEternal === false)
    {
      const seconds = (viewModel.durationFrames / 60).toFixed(1);

      timerSprite.setText(seconds);
      timerSprite.move(centerX, y + layoutSpec.timerOffsetY);
      timerSprite.show();
    }
    else
    {
      timerSprite.setText(String.empty);
      timerSprite.hide();
    }

    // the colored square goes down before the icon does, so the icon is the one drawn on top.
    this.renderSlotBacking(battler, viewModel, ox, y, layoutSpec);

    const iconSprite = this.getOrCreateIconSprite(battler, viewModel.stateId, iconIndex);

    // draw the icon at whatever size the layout calls for.
    iconSprite.scale.x = layoutSpec.iconScale;
    iconSprite.scale.y = layoutSpec.iconScale;
    iconSprite.move(ox, y);
    iconSprite.show();

    const stackSprite = this.getOrCreateStackSprite(battler, viewModel.stateId, layoutSpec);

    if (viewModel.stackCount > 1)
    {
      // the count rides one icon's height above its icon.
      const stackY = y - layoutSpec.scaledIconHeight();

      stackSprite.setText(`x${viewModel.stackCount}`);
      stackSprite.move(centerX, stackY);
      stackSprite.show();
    }
    else
    {
      stackSprite.setText(String.empty);
      stackSprite.hide();
    }
  }

  /**
   * Places the colored square behind a slot's icon, when the layout draws one.
   * @param {Game_Battler} battler The afflicted battler.
   * @param {StateAfflictionViewModel} viewModel The row the square belongs to.
   * @param {number} ox The origin x coordinate of the slot.
   * @param {number} y The origin y coordinate of the slot.
   * @param {StateAfflictionHudLayoutSpec} layoutSpec The layout the slot is drawn to.
   */
  renderSlotBacking(battler, viewModel, ox, y, layoutSpec)
  {
    // a layout without backing draws its icons bare.
    if (layoutSpec.polarityBacking === false) return;

    const backingSprite = this.getOrCreateBackingSprite(battler, viewModel, layoutSpec);

    // the square reaches past the icon by the same margin on every side.
    const { backingPadding } = layoutSpec;
    backingSprite.move(ox - backingPadding, y - backingPadding);
    backingSprite.show();
  }

  /**
   * Hides the icon, backing, timer, and stack sprites for one state id.
   * @param {StateAfflictionBattlerIdentity} identity The battler cache identity.
   * @param {number} stateId The database state id.
   */
  hideSlotSprites(identity, stateId)
  {
    const iconKey = identity.buildIconKey(stateId);
    const backingKey = identity.buildBackingKey(stateId);
    const timerKey = identity.buildTimerKey(stateId);
    const stackKey = identity.buildStackKey(stateId);

    if (this.#spriteCache.has(iconKey) === true)
    {
      this.#spriteCache.get(iconKey).hide();
    }

    // a square left behind would mark a slot that no longer holds anything.
    if (this.#spriteCache.has(backingKey) === true)
    {
      this.#spriteCache.get(backingKey).hide();
    }

    if (this.#spriteCache.has(timerKey) === true)
    {
      const timerSprite = this.#spriteCache.get(timerKey);

      timerSprite.setText(String.empty);
      timerSprite.hide();
    }

    if (this.#spriteCache.has(stackKey) === true)
    {
      const stackSprite = this.#spriteCache.get(stackKey);

      stackSprite.setText(String.empty);
      stackSprite.hide();
    }
  }

  /**
   * Creates or retrieves the icon sprite for a state.
   * @param {Game_Battler} battler The afflicted battler.
   * @param {number} stateId The database state id.
   * @param {number} iconIndex The icon index to display.
   * @returns {Sprite_Icon}
   */
  getOrCreateIconSprite(battler, stateId, iconIndex)
  {
    const identity = StateAfflictionBattlerIdentity.fromBattler(battler);
    const key = identity.buildIconKey(stateId);

    if (this.#spriteCache.has(key) === true)
    {
      const sprite = this.#spriteCache.get(key);

      sprite.setIconIndex(iconIndex);

      return sprite;
    }

    const sprite = new Sprite_Icon(iconIndex);

    this.#spriteCache.set(key, sprite);
    sprite.hide();
    this.#hostWindow.addChild(sprite);

    return sprite;
  }

  /**
   * Creates or retrieves the timer sprite for a state.
   * @param {Game_Battler} battler The afflicted battler.
   * @param {number} stateId The database state id.
   * @param {StateAfflictionHudLayoutSpec} layoutSpec The layout the timer is drawn to.
   * @returns {Sprite_BaseText}
   */
  getOrCreateTimerSprite(battler, stateId, layoutSpec)
  {
    const identity = StateAfflictionBattlerIdentity.fromBattler(battler);
    const key = identity.buildTimerKey(stateId);

    if (this.#spriteCache.has(key) === true)
    {
      return this.#spriteCache.get(key);
    }

    const spriteText = new Sprite_BaseText();

    spriteText.setFontFace($gameSystem.numberFontFace());
    spriteText.setFontSize($gameSystem.mainFontSize() - layoutSpec.timerFontSizeReduction);
    spriteText.setAlignment(Sprite_BaseText.Alignments.Center);
    spriteText.setMinWidth(layoutSpec.scaledIconWidth());

    // anchored at its middle, so the x it is moved to is its center. The text sits inside an outline
    // margin, and anchoring at the left edge would leave it that margin's width right of its icon.
    spriteText.anchor.x = 0.5;

    this.#spriteCache.set(key, spriteText);
    spriteText.hide();
    this.#hostWindow.addChild(spriteText);

    return spriteText;
  }

  /**
   * Creates or retrieves the stack sprite for a state.
   * @param {Game_Battler} battler The afflicted battler.
   * @param {number} stateId The database state id.
   * @param {StateAfflictionHudLayoutSpec} layoutSpec The layout the stack count is drawn to.
   * @returns {Sprite_BaseText}
   */
  getOrCreateStackSprite(battler, stateId, layoutSpec)
  {
    const identity = StateAfflictionBattlerIdentity.fromBattler(battler);
    const key = identity.buildStackKey(stateId);

    if (this.#spriteCache.has(key) === true)
    {
      return this.#spriteCache.get(key);
    }

    const spriteText = new Sprite_BaseText();

    spriteText.setFontFace($gameSystem.numberFontFace());
    spriteText.setFontSize($gameSystem.mainFontSize() - layoutSpec.stackFontSizeReduction);
    spriteText.setAlignment(Sprite_BaseText.Alignments.Center);
    spriteText.setMinWidth(layoutSpec.scaledIconWidth());

    // anchored at its middle for the same reason as the timer: the x it is moved to is its center.
    spriteText.anchor.x = 0.5;

    this.#spriteCache.set(key, spriteText);
    spriteText.hide();
    this.#hostWindow.addChild(spriteText);

    return spriteText;
  }

  /**
   * Creates or retrieves the colored square drawn behind a state's icon.<br/>
   * The square is painted once, when it is created. Its color follows the state's polarity, and a state
   * on a given battler is a debuff or a buff for as long as it is on them.
   * @param {Game_Battler} battler The afflicted battler.
   * @param {StateAfflictionViewModel} viewModel The row the square belongs to.
   * @param {StateAfflictionHudLayoutSpec} layoutSpec The layout the square is drawn to.
   * @returns {Sprite}
   */
  getOrCreateBackingSprite(battler, viewModel, layoutSpec)
  {
    const identity = StateAfflictionBattlerIdentity.fromBattler(battler);
    const key = identity.buildBackingKey(viewModel.stateId);

    if (this.#spriteCache.has(key) === true)
    {
      return this.#spriteCache.get(key);
    }

    // a square just larger than the icon it sits behind.
    const size = layoutSpec.backingSize();
    const bitmap = new Bitmap(size, size);

    // paint it in the polarity's color, held short of solid so it tints rather than covers.
    const color = StateAfflictionHudPresenter.backingColor(viewModel);
    bitmap.paintOpacity = layoutSpec.backingOpacity;
    bitmap.fillAll(color);

    const sprite = new Sprite(bitmap);

    this.#spriteCache.set(key, sprite);
    sprite.hide();
    this.#hostWindow.addChild(sprite);

    return sprite;
  }

  /**
   * The color of the square behind an affliction's icon: the engine's power-down color for a debuff,
   * and its power-up color for a buff- the same pair the engine uses for stats going down and up.
   * @param {StateAfflictionViewModel} viewModel The row being colored.
   * @returns {string}
   */
  static backingColor(viewModel)
  {
    // a buff reads as a stat going up.
    if (viewModel.polarity === 'positive') return ColorManager.powerUpColor();

    // anything else is a debuff, and reads as a stat going down.
    return ColorManager.powerDownColor();
  }
}

export default StateAfflictionHudPresenter;
//endregion StateAfflictionHudPresenter