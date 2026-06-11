//region StateAfflictionHudPresenter
/**
 * Renders dual-row HUD afflictions with icons, timers, and stack counts.
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

      this.renderSlot(battler, viewModel, x, y);
    }

    for (let index = 0; index < collection.positive.length; index++)
    {
      const viewModel = collection.positive[index];
      const x = layoutSpec.slotX(index);
      const y = layoutSpec.positiveRowY();

      this.renderSlot(battler, viewModel, x, y);
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
      const trackedStates = Array.from($jabsEngine.getJabsStatesByUuid(battler.getUuid()).values());

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
   */
  renderSlot(battler, viewModel, ox, y)
  {
    const state = battler.state(viewModel.stateId);
    const iconIndex = state
      ? state.iconIndex
      : 0;
    const timerSprite = this.getOrCreateTimerSprite(battler, viewModel.stateId);

    if (viewModel.isEternal === false)
    {
      const seconds = (viewModel.durationFrames / 60).toFixed(1);

      timerSprite.setText(seconds);
      timerSprite.move(ox, y + 20);
      timerSprite.show();
    }
    else
    {
      timerSprite.setText(String.empty);
      timerSprite.hide();
    }

    const iconSprite = this.getOrCreateIconSprite(battler, viewModel.stateId, iconIndex);

    iconSprite.move(ox, y);
    iconSprite.show();

    const stackSprite = this.getOrCreateStackSprite(battler, viewModel.stateId);

    if (viewModel.stackCount > 1)
    {
      stackSprite.setText(`x${viewModel.stackCount}`);
      stackSprite.move(ox, y - ImageManager.iconHeight);
      stackSprite.show();
    }
    else
    {
      stackSprite.setText(String.empty);
      stackSprite.hide();
    }
  }

  /**
   * Hides the icon, timer, and stack sprites for one state id.
   * @param {StateAfflictionBattlerIdentity} identity The battler cache identity.
   * @param {number} stateId The database state id.
   */
  hideSlotSprites(identity, stateId)
  {
    const iconKey = identity.buildIconKey(stateId);
    const timerKey = identity.buildTimerKey(stateId);
    const stackKey = identity.buildStackKey(stateId);

    if (this.#spriteCache.has(iconKey) === true)
    {
      this.#spriteCache.get(iconKey).hide();
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
   * @returns {Sprite_BaseText}
   */
  getOrCreateTimerSprite(battler, stateId)
  {
    const identity = StateAfflictionBattlerIdentity.fromBattler(battler);
    const key = identity.buildTimerKey(stateId);

    if (this.#spriteCache.has(key) === true)
    {
      return this.#spriteCache.get(key);
    }

    const spriteText = new Sprite_BaseText();

    spriteText.setFontFace($gameSystem.numberFontFace());
    spriteText.setFontSize($gameSystem.mainFontSize() - 6);
    spriteText.setAlignment(Sprite_BaseText.Alignments.Center);
    spriteText.setMinWidth(ImageManager.iconWidth);

    this.#spriteCache.set(key, spriteText);
    spriteText.hide();
    this.#hostWindow.addChild(spriteText);

    return spriteText;
  }

  /**
   * Creates or retrieves the stack sprite for a state.
   * @param {Game_Battler} battler The afflicted battler.
   * @param {number} stateId The database state id.
   * @returns {Sprite_BaseText}
   */
  getOrCreateStackSprite(battler, stateId)
  {
    const identity = StateAfflictionBattlerIdentity.fromBattler(battler);
    const key = identity.buildStackKey(stateId);

    if (this.#spriteCache.has(key) === true)
    {
      return this.#spriteCache.get(key);
    }

    const spriteText = new Sprite_BaseText();

    spriteText.setFontFace($gameSystem.numberFontFace());
    spriteText.setFontSize($gameSystem.mainFontSize() - 4);
    spriteText.setAlignment(Sprite_BaseText.Alignments.Center);
    spriteText.setMinWidth(ImageManager.iconWidth);

    this.#spriteCache.set(key, spriteText);
    spriteText.hide();
    this.#hostWindow.addChild(spriteText);

    return spriteText;
  }
}

export default StateAfflictionHudPresenter;
//endregion StateAfflictionHudPresenter