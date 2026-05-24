//region Window_InputFrame
import Sprite_InputKeySlot from '../sprites/Sprite_InputKeySlot.js';
/**
 * A window displaying available skills and button inputs.
 */
class Window_InputFrame
  extends Window_Frame
{
  /**
   * Modes for how the input diamond should render.
   * @type {{ Base: string, Skills: string }}
   */
  static Modes = {
    Base: 'base',
    Skills: 'skills',
  };

  /**
   * The visual gap (in pixels) between the top and bottom bodies of the diamond.
   * Also used by the scene’s window sizing to keep things in sync.
   * Tweak this to 4/6/etc to fiddle the spacing.
   * @returns {number}
   */
  static get DiamondGap()
  {
    // default was 2; try 4 or 6 to taste.
    return 6;
  }

  /**
   * Constructor.
   * @param {Rectangle} rect The shape of this window.
   */
  constructor(rect)
  {
    super(rect);
  }

  /**
   * The rough estimate of width for a single input key and all its subsprites.
   * @returns {number}
   */
  inputKeyWidth()
  {
    return 72;
  }

  /**
   * The rough estimate of height for a single input key and all its subsprites.
   * @returns {number}
   */
  inputKeyHeight()
  {
    return 72;
  }

  //region state
  /**
   * Initializes all members of this class.
   */
  initMembers()
  {
    // perform original logic.
    super.initMembers();

    /**
     * The battler of which to track inputs for.
     * @type {Game_Actor}
     */
    this._j._battler = null;

    /**
     * Whether or not the window needs a refresh internally.
     * This is toggled after all draws are executed and tracked to
     * prevent unnecessary redraws.
     * @type {boolean}
     */
    this._j._needsRefresh = true;

    /**
     * A grouping for tracking last-known values used to determine
     * if this HUD requires a refresh.
     */
    this._j._last ||= {};

    /**
     * Tracks whether SkillTrigger was held on the last processed frame.
     * Used to request refreshes only when the held state changes so we
     * preserve the "draw only when needed" behavior.
     * @type {boolean}
     */
    this._j._last._skillTriggerHeld = false;

    /**
     * Tracks whether the party was considered in combat on the last processed frame.
     * Used to request refresh on combat context changes so the left node can
     * swap between Sprint (out of combat) and Mobility/Dodge (in combat).
     * @type {boolean}
     */
    this._j._last._partyInCombat = false;

    /**
     * A grouping for tracking the flip progress and direction.
     */
    this._j._flip ||= {};

    /**
     * The current progress for the flip animation.
     * @type {number}
     */
    this._j._flip._progress = 0;

    /**
     * The maximum duration for the flip animation.
     * @type {number}
     */
    this._j._flip._max = 10;

    /**
     * The current direction of the flip animation.
     * @type {number}
     */
    this._j._flip._direction = 0;
  }

  /**
   * Gets whether or not the skill trigger is held.
   * @returns {boolean}
   */
  skillTriggerHeld()
  {
    return this._j._last._skillTriggerHeld;
  }

  /**
   * Sets whether or not the skill trigger is held.
   * @param {boolean} value True if the skill trigger is held, false otherwise.
   */
  setSkillTriggerHeld(value)
  {
    this._j._last._skillTriggerHeld = value;
  }

  /**
   * Gets whether or not the party is in combat.
   * @returns {boolean}
   */
  partyInCombat()
  {
    return this._j._last._partyInCombat;
  }

  /**
   * Sets whether or not the party is in combat.
   * @param {boolean} value True if the party is in combat, false otherwise.
   */
  setPartyInCombat(value)
  {
    this._j._last._partyInCombat = value;
  }

  /**
   * Gets the current flip progress (0..max).
   * @returns {number}
   */
  getFlipProgress()
  {
    // store under a dedicated bag to avoid accidental overlap.
    return this._j._flip._progress;
  }

  /**
   * Sets the current flip progress (0..max).
   * @param {number} value The new progress.
   */
  setFlipProgress(value)
  {
    this._j._flip._progress = Math.max(0, value);
  }

  /**
   * Gets the maximum flip duration in frames.
   * @returns {number}
   */
  getFlipMax()
  {
    return this._j._flip._max;
  }

  /**
   * Sets the maximum flip duration in frames.
   * @param {number} value The new max duration.
   */
  setFlipMax(value)
  {
    this._j._flip._max = Math.max(0, value);
  }

  /**
   * Gets the current flip direction (-1, 0, +1).
   * @returns {number}
   */
  getFlipDirection()
  {
    return this._j._flip._direction;
  }

  /**
   * Sets the current flip direction (-1, 0, +1).
   * @param {number} value The new direction.
   */
  setFlipDirection(value)
  {
    // cache the numeric direction requested.
    const dir = value;

    // normalize to -1, 0, or +1 only.
    if (dir < 0)
    {
      this._j._flip._direction = -1;
    }
    else if (dir > 0)
    {
      this._j._flip._direction = 1;
    }
    else
    {
      this._j._flip._direction = 0;
    }
  }

  //endregion state

  /**
   * Executes any one-time configuration required for this window.
   */
  configure()
  {
    // perform original logic.
    super.configure();

    // remove opacity for completely transparent window.
    this.opacity = 32;
  }

  //region caching
  /**
   * Ensures all sprites are created and available for use.
   */
  createCache()
  {
    // perform original logic.
    super.createCache();
  }

  /**
   * Creates the key for the input key icon sprite based on the parameters.
   * @param {JABS_SkillSlot} skillSlot The skillslot associated with this input key.
   * @param {JABS_Button} inputType The type of input for this key.
   * @returns {string}
   */
  makeInputKeySlotSpriteKey(skillSlot, inputType)
  {
    return `inputkey-${$gameParty.leader()
      .actorId()}-${inputType}`;
  }

  /**
   * Creates the input key sprite for the given slot.
   * @param {JABS_SkillSlot} skillSlot The skillslot associated with this input key.
   * @param {JABS_Button} inputType The type of input for this key.
   * @returns {Sprite_InputKeySlot}
   */
  getOrCreateInputKeySlotSprite(skillSlot, inputType)
  {
    // determine the key for this sprite.
    const key = this.makeInputKeySlotSpriteKey(skillSlot, inputType);

    // check if the key already maps to a cached sprite.
    if (this._j._spriteCache.has(key))
    {
      // if it does, just return that.
      return this._j._spriteCache.get(key);
    }

    // create a new sprite.
    const sprite = new Sprite_InputKeySlot(skillSlot, $jabsEngine.getPlayer1());

    // cache the sprite.
    this._j._spriteCache.set(key, sprite);

    // hide the sprite for now.
    sprite.hide();

    // add the sprite to tracking.
    this.addChild(sprite);

    // return the created sprite.
    return sprite;
  }

  //endregion caching

  //region refresh
  /**
   * Requests this window to clear and redraw its contents.
   */
  requestInternalRefresh()
  {
    this._j._needsRefresh = true;
  }

  /**
   * Gets whether or not this window needs refresh.
   * @returns {boolean}
   */
  needsInternalRefresh()
  {
    return this._j._needsRefresh;
  }

  /**
   * Flags internally this window for successfully refreshing text.
   */
  acknowledgeInternalRefresh()
  {
    this._j._needsRefresh = false;
  }

  /**
   * Refreshes the contents of this window.
   */
  refresh()
  {
    // clear out the window contents.
    this.contents.clear();

    // rebuilds the contents of the window.
    this.requestInternalRefresh();
  }

  //endregion refresh

  /**
   * Hide all sprites for the hud.
   */
  hideSprites()
  {
    // hide all the sprites.
    this._j._spriteCache.forEach((sprite, _) => sprite.hide());

    this.requestInternalRefresh();
  }

  /**
   * Updates the logic for this window frame.
   */
  updateFrame()
  {
    // perform original logic.
    super.updateFrame();

    // handle the visibility of the hud for dynamic interferences.
    this.manageVisibility();

    // check if the player is holding the skill trigger.
    this.checkSkillTrigger();

    // check if the party combat context changed and request redraw if so.
    this.checkCombatContext();

    // advance the crossfade animator when active (using accessors only).
    this.advanceFlipAnimator();

    // draw the contents.
    this.drawInputFrame();
  }

  /**
   * Checks if the player is holding the SkillTrigger and updates the internal state accordingly.
   */
  checkSkillTrigger()
  {
    // determine whether the SkillTrigger is currently held.
    const currentlyHeld = this.isSkillTriggerHeld();

    // if the held state changed since last frame, request a redraw.
    if (this.skillTriggerHeld() !== currentlyHeld)
    {
      // update last-known held state.
      this.setSkillTriggerHeld(currentlyHeld);

      // kick the flip animator in the correct direction via setter only.
      this.setFlipDirection(currentlyHeld
        ? +1
        : -1);

      // redraw is required to flip between views.
      this.requestInternalRefresh();
    }
  }

  /**
   * Checks if the party combat context changed and updates internal state.
   */
  checkCombatContext()
  {
    // determine whether the party is currently considered in combat.
    const currentlyInCombat = $gameParty.anyMemberInCombat();

    // if the combat context changed since last frame, request a redraw.
    if (this.partyInCombat() !== currentlyInCombat)
    {
      // update last-known in-combat state.
      this.setPartyInCombat(currentlyInCombat);

      // redraw is required to swap the left node (Sprint ↔ Mobility).
      this.requestInternalRefresh();
    }
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
    return (playerX < this.width + 100) && (playerY < this.height + 100);
  }

  /**
   * Manages opacity for all sprites while the player is interfering with the visibility.
   */
  handlePlayerInterference()
  {
    this._j._spriteCache.forEach((sprite, _) =>
    {
      // if we are above 64, rapidly decrement by -15 until we get below 64.
      if (sprite.opacity > 64)
      {
        sprite.opacity -= 15;
      }// if we are below 64, increment by +1 until we get to 64.
      else if (sprite.opacity < 64) sprite.opacity += 1;
    });
  }

  /**
   * Reverts the opacity changes associated with the player getting in the way.
   */
  revertInterferenceOpacity()
  {
    this._j._spriteCache.forEach((sprite, _) =>
    {
      // if we are below 255, rapidly increment by +15 until we get to 255.
      if (sprite.opacity < 255)
      {
        sprite.opacity += 15;
      }// if we are above 255, set to 255.
      else if (sprite.opacity > 255) sprite.opacity = 255;
    });
  }

  //endregion visibility

  /**
   * Advances the flip animator when active; requests refresh while animating.
   * Uses only accessors for state changes.
   */
  advanceFlipAnimator()
  {
    // if idle, nothing to do.
    if (this.getFlipDirection() === 0)
    {
      return;
    }

    // compute new progress.
    const next = this.getFlipProgress() + this.getFlipDirection();
    const max = this.getFlipMax();

    // clamp into [0, max].
    if (next <= 0)
    {
      this.setFlipProgress(0);
      this.setFlipDirection(0);
    }
    else if (next >= max)
    {
      this.setFlipProgress(max);
      this.setFlipDirection(0);
    }
    else
    {
      this.setFlipProgress(next);
    }

    // while animating, ensure redraw continues.
    this.requestInternalRefresh();
  }

  /**
   * Computes current alphas for base and skills diamonds from the flip animator.
   * @returns {{alphaBase:number, alphaSkills:number}}
   */
  computeFlipAlphas()
  {
    // if animator is idle, snap to whichever mode is active.
    if (this.getFlipDirection() === 0)
    {
      const skillsActive = this.isSkillTriggerHeld();
      return {
        alphaBase: skillsActive
          ? 0
          : 255,
        alphaSkills: skillsActive
          ? 255
          : 0,
      };
    }

    // blend based on normalized progress.
    const max = this.getFlipMax();
    const prog = this.getFlipProgress();
    const t = max > 0
      ? (prog / max)
      : 1;

    // direction +1 means transitioning to Skills; -1 to Actions.
    const alphaSkills = Math.round(255 * t);
    const alphaBase = 255 - alphaSkills;
    return {
      alphaBase,
      alphaSkills
    };
  }

  //region draw
  /**
   * Draws the input frame window in its entirety.
   */
  drawInputFrame()
  {
    // don't draw if we don't need to draw.
    if (!this.canDrawInputFrame()) return;

    // wipe the drawn contents.
    this.contents.clear();
    this.contentsBack.clear();

    // hide all the sprites and let each update its own bitmap.
    this._j._spriteCache.forEach((sprite =>
    {
      sprite.hide();
      sprite.drawInputKey();
    }));

    // compute blend alphas between modes (0..255 each) using accessors.
    const alphas = this.computeFlipAlphas();
    const {
      alphaBase,
      alphaSkills
    } = alphas;

    // draw Actions (base) with its alpha when non-zero.
    if (alphaBase > 0)
    {
      // apply paint opacity for gradients/text.
      this.contents.paintOpacity = alphaBase;

      // pass the same alpha down so child slot sprites also fade.
      this.drawDiamond(Window_InputFrame.Modes.Base, alphaBase);
    }

    // draw Skills with its alpha when non-zero.
    if (alphaSkills > 0)
    {
      // apply paint opacity for gradients/text.
      this.contents.paintOpacity = alphaSkills;

      // pass the same alpha down so child slot sprites also fade.
      this.drawDiamond(Window_InputFrame.Modes.Skills, alphaSkills);
    }

    // reset paint opacity for any future draws this frame.
    this.contents.paintOpacity = 255;

    // draw the mode labels with their own fading alphas.
    this.drawModeLabels(alphaBase, alphaSkills);

    // flags that this has been refreshed.
    this.acknowledgeInternalRefresh();
  }

  /**
   * Determines whether or not we can draw the input frame.
   * @returns {boolean} True if we can, false otherwise.
   */
  canDrawInputFrame()
  {
    // if the leader is not present or available, we cannot draw.
    if (!$gameParty.leader()) return false;

    // if we cannot draw the hud, we cannot draw.
    if (!$hudManager.canShowHud()) return false;

    // if we don't need to draw it, we cannot draw.
    if (!this.needsInternalRefresh()) return false;

    // draw it!
    return true;
  }

  /**
   * Checks the current bindings for SkillTrigger and returns true if any bound
   * physical symbol is currently pressed. This is remap‑aware.
   * @returns {boolean}
   */
  isSkillTriggerHeld()
  {
    // get JABS bindings and the physical symbols for the logical SkillTrigger.
    const allBindings = Input.getAllBindings('JABS');
    const bound = allBindings && allBindings[JABS_Button.SkillTrigger]
      ? allBindings[JABS_Button.SkillTrigger]
      : [];

    // if any symbol bound to SkillTrigger is held, return true.
    for (let i = 0; i < bound.length; i++)
    {
      const symbol = bound[i];
      if (Input.isPressed(symbol))
      {
        return true;
      }
    }

    // none of the bound symbols are pressed.
    return false;
  }

  /**
   * Draws the “Actions” and “Skills” labels with matching crossfade alphas.
   * @param {number} alphaBase The opacity (0..255) for the Actions label.
   * @param {number} alphaSkills The opacity (0..255) for the Skills label.
   */
  drawModeLabels(alphaBase, alphaSkills)
  {
    // cache base font settings to restore afterward.
    const prevSize = this.contents.fontSize;
    const prevOutlineW = this.contents.outlineWidth;
    const prevOutlineC = this.contents.outlineColor;
    const prevPaint = this.contents.paintOpacity;

    // choose a slightly larger, bold-ish readable style.
    this.contents.fontSize = prevSize + 2;
    this.contents.outlineWidth = 4;
    this.contents.outlineColor = 'rgba(0, 0, 0, 0.85)';

    // compute margins for label placement inside contents space.
    const leftMargin = 8;
    const rightMargin = 8;
    const topMargin = 2;

    // draw "Actions" in the upper-left, using the base alpha.
    if (alphaBase > 0)
    {
      // apply the alpha for this pass.
      this.contents.paintOpacity = alphaBase;

      // define text and measure for any future adjustments if needed.
      const text = 'Actions';

      // draw the text left-aligned at the top-left margin.
      this.drawText(text, leftMargin, topMargin, 160, 'left');
    }

    // draw "Skills" in the upper-right, using the skills alpha.
    if (alphaSkills > 0)
    {
      // apply the alpha for this pass.
      this.contents.paintOpacity = alphaSkills;

      // define text and measure its width.
      const text = 'Skills';
      const tw = this.textSizeEx(text).width; // consistent with Window_Base API.

      // compute x so the right edge sits at contentsWidth - rightMargin.
      const x = Math.max(0, this.contentsWidth() - rightMargin - tw);

      // draw the text right-aligned at the top-right margin.
      this.drawText(text, x, topMargin, tw, 'right');
    }

    // restore font and opacity.
    this.contents.fontSize = prevSize;
    this.contents.outlineWidth = prevOutlineW;
    this.contents.outlineColor = prevOutlineC;
    this.contents.paintOpacity = prevPaint;
  }

  /**
   * Draws a multi-layer HUD panel background that looks richer than a flat gradient.
   * Renders shadow to contentsBack, then gradient/border/gloss/tint to contents.
   * @param {number} x The left of the panel (contents space).
   * @param {number} y The top of the panel (contents space).
   * @param {number} w The width of the panel.
   * @param {number} h The height of the panel.
   * @param {{
   *   tint?: string,
   *   tintAlpha?: number,
   *   cornerPad?: number,
   * }} [options] Optional styling overrides.
   */
  drawHudPanelFancy(x, y, w, h, options)
  {
    // configure options w/ reasonable defaults.
    const opts = options || {};
    const tint = opts.tint || null;             // e.g., 'rgba(255,64,64,1.0)'
    const tintAlpha = Number(opts.tintAlpha || 0); // 0..1
    const radius = Math.max(0, Number(opts.cornerPad || 0));

    // colors from theme (same family your old panels used).
    const back1 = ColorManager.itemBackColor1(); // darker
    const back2 = ColorManager.itemBackColor2(); // lighter

    // quick guards.
    if (w <= 0 || h <= 0) return;

    // helpers to draw a rounded-rect path into a 2D context.
    const roundRectPath = (ctx, rx, ry, rw, rh, r) =>
    {
      const rr = Math.min(r, Math.floor(Math.min(rw, rh) / 2));
      if (rr <= 0)
      {
        ctx.rect(rx, ry, rw, rh);
        return;
      }
      const r2 = rr * 2;
      ctx.moveTo(rx + rr, ry);
      ctx.lineTo(rx + rw - rr, ry);
      ctx.arc(rx + rw - rr, ry + rr, rr, Math.PI * 1.5, 0);
      ctx.lineTo(rx + rw, ry + rh - rr);
      ctx.arc(rx + rw - rr, ry + rh - rr, rr, 0, Math.PI * 0.5);
      ctx.lineTo(rx + rr, ry + rh);
      ctx.arc(rx + rr, ry + rh - rr, rr, Math.PI * 0.5, Math.PI);
      ctx.lineTo(rx, ry + rr);
      ctx.arc(rx + rr, ry + rr, rr, Math.PI, Math.PI * 1.5);
    };

    // 1) soft shadow to contentsBack (subtle, non-accumulating because we clear each refresh).
    {
      const sb = this.contentsBack;
      const ctx = sb.context;
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      for (let i = 1; i <= 3; i++)
      {
        ctx.beginPath();
        roundRectPath(ctx, x + i, y + i + 1, w, h, radius);
        ctx.fill();
      }
      ctx.restore();
      sb._baseTexture.update();
    }

    // 2) main body gradient fill to contents (3-stop vertical feel).
    const c = this.contents;
    const ctx = c.context;
    ctx.save();
    const grad = ctx.createLinearGradient(0, y + h, 0, y);
    grad.addColorStop(0.00, back1);
    grad.addColorStop(0.50, back2);
    grad.addColorStop(1.00, back1);
    ctx.fillStyle = grad;
    ctx.beginPath();
    roundRectPath(ctx, x, y, w, h, radius);
    ctx.fill();

    // mid highlight band (very soft)
    const midH = Math.max(6, Math.floor(h * 0.25));
    const midY = y + Math.floor((h - midH) / 2);
    const midGrad = ctx.createLinearGradient(0, midY + midH, 0, midY);
    midGrad.addColorStop(0.00, 'rgba(255,255,255,0.00)');
    midGrad.addColorStop(1.00, 'rgba(255,255,255,0.06)');
    ctx.fillStyle = midGrad;
    ctx.beginPath();
    roundRectPath(ctx, x + 1, midY, w - 2, midH, Math.max(0, radius - 1));
    ctx.fill();

    // 3) inner border (crisper than before).
    ctx.lineWidth = 1.0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    roundRectPath(ctx, x + 0.5, y + 0.5, w - 1, h - 1, Math.max(0, radius - 0.5));
    ctx.stroke();

    // 4) top gloss band for a gentle sheen.
    const glossH = Math.max(4, Math.floor(h * 0.20));
    const glossGrad = ctx.createLinearGradient(0, y + glossH, 0, y);
    glossGrad.addColorStop(0.00, 'rgba(255,255,255,0.18)');
    glossGrad.addColorStop(1.00, 'rgba(255,255,255,0.00)');
    ctx.fillStyle = glossGrad;
    ctx.beginPath();
    roundRectPath(ctx, x + 1, y + 1, w - 2, glossH, Math.max(0, radius - 1));
    ctx.fill();

    // 5) optional tint overlay (context-aware color).
    if (tint && tintAlpha > 0)
    {
      ctx.globalAlpha = Math.max(0, Math.min(1, tintAlpha));
      ctx.fillStyle = tint;
      ctx.beginPath();
      roundRectPath(ctx, x, y, w, h, radius);
      ctx.fill();
    }

    ctx.restore();
    c._baseTexture.update();

  }

  /**
   * Renders a diamond from the window's upper-left using shared coordinates.
   * The parent computes x/y once per node and draws exactly four buttons.
   * @param {string} mode One of {@link Window_InputFrame.Modes}.
   * @param {number} slotOpacity The opacity to apply to slot sprites (0..255).
   */
  drawDiamond(mode, slotOpacity)
  {
    // shared key sizes.
    const ikw = this.inputKeyWidth();
    const ikh = this.inputKeyHeight();

    // diamond geometry (centered in the window box; matches Scene sizing math).
    const cx = Math.floor(this.width / 2) + 4;
    const cy = Math.floor(this.height / 2) - 10;

    // use a single desired body-to-body gap in BOTH axes.
    const desiredGap = Window_InputFrame.DiamondGap; // applies horizontally AND vertically

    // half-sizes for converting between centers and sprite origins.
    const halfIkw = Math.floor(ikw / 2);
    const halfIkh = Math.floor(ikh / 2);

    // VERTICAL: distance between centers of top and bottom bodies so that
    // the visible body gap equals desiredGap.
    const verticalCenterDistance = ikh + desiredGap;

    // compute the visual centers for top/bottom.
    const topCenterY = cy - Math.floor(verticalCenterDistance / 2);
    const bottomCenterY = cy + Math.floor(verticalCenterDistance / 2);

    // convert visual centers to sprite origins (compensate for +20 body offset).
    const topY = topCenterY - halfIkh - 20;
    const bottomY = bottomCenterY - halfIkh - 20;

    // HORIZONTAL: Left/Right are DiamondGap away from the center column body.
    // That means each side center is offset by (ikw + desiredGap) from cx.
    const sideCenterOffset = ikw + desiredGap;
    const leftCenterX = cx - sideCenterOffset;
    const rightCenterX = cx + sideCenterOffset;

    // convert centers to sprite origins.
    const leftX = leftCenterX - halfIkw;
    const rightX = rightCenterX - halfIkw;

    // Left/Right share the midline vertically.
    const sideY = cy - halfIkh - 20;

    // Top and Bottom share the same x (center column).
    const topX = cx - halfIkw;
    const bottomX = cx - halfIkw;

    // draw four buttons according to mode.
    switch (mode)
    {
      case Window_InputFrame.Modes.Skills:
      {
        // Top    → Skill 4
        // Left   → Skill 3
        // Right  → Skill 2
        // Bottom → Skill 1
        this.drawButton(topX, topY, JABS_Button.CombatSkill4, slotOpacity);
        this.drawButton(leftX, sideY, JABS_Button.CombatSkill3, slotOpacity);
        this.drawButton(rightX, sideY, JABS_Button.CombatSkill2, slotOpacity);
        this.drawButton(bottomX, bottomY, JABS_Button.CombatSkill1, slotOpacity);
        break;
      }

      case Window_InputFrame.Modes.Base:
      default:
      {
        // decide the left node based on combat context.
        const leftButton = this.partyInCombat()
          ? JABS_Button.Dodge
          : JABS_Button.Sprint;

        // Top    → Tool
        // Left   → Sprint (OoC) or Dodge (In‑combat)
        // Right  → Offhand
        // Bottom → Mainhand
        this.drawButton(topX, topY, JABS_Button.Tool, slotOpacity);
        this.drawButton(leftX, sideY, leftButton, slotOpacity);
        this.drawButton(rightX, sideY, JABS_Button.Offhand, slotOpacity);
        this.drawButton(bottomX, bottomY, JABS_Button.Mainhand, slotOpacity);
        break;
      }
    }
  }

  /**
   * Draw a single button at x,y.
   * Sprint is a special case (not a skillslot), everything else uses drawInputKey().
   * @param {number} x The x coordinate (CONTENTS space).
   * @param {number} y The y coordinate (CONTENTS space).
   * @param {string} button The logical button (from {@link JABS_Button}).
   * @param {number} opacity The per-pass opacity (0..255) for slot sprites.
   */
  drawButton(x, y, button, opacity)
  {
    // sprint is not backed by a JABS_SkillSlot; render its node directly.
    if (button === JABS_Button.Sprint)
    {
      this.drawSprintNode(x, y);
      return;
    }

    // draw the input-key backed slot with the provided opacity.
    this.drawInputKey(button, x, y, opacity);
  }

  /**
   * Draws a Sprint node styled like a skill slot: a panel,
   * a centered icon, and a small label reading "dash".
   * @param {number} x The x coordinate for the node (contents space).
   * @param {number} y The y coordinate for the node (contents space).
   */
  drawSprintNode(x, y)
  {
    // node size, aligned with other keys.
    const ikw = this.inputKeyWidth();
    const ikh = this.inputKeyHeight();

    // panel rectangle aligned to other slot panels.
    const panelX = x - 10;
    const panelY = y + 20;
    const panelW = ikw - 10;
    const panelH = ikh;

    // render the fancy HUD panel background.
    this.drawHudPanelFancy(panelX, panelY, panelW, panelH, {
      tint: null,
      tintAlpha: 0,
    });

    // icon (temporary index 140) centered, biased upward to leave label room.
    const iconIndex = 140;
    const iconW = ImageManager.iconWidth;
    const iconH = ImageManager.iconHeight;
    const labelReserve = 18;
    const iconX = panelX + Math.floor((panelW - iconW) / 2);
    const iconY = panelY + Math.max(0, Math.floor((panelH - labelReserve - iconH) / 2));
    this.drawIcon(iconIndex, iconX, iconY);

    // small label using Window_Base helpers (no direct font pokes).
    const originalSize = this.contents.fontSize;
    const originalOutlineW = this.contents.outlineWidth;
    const originalOutlineC = this.contents.outlineColor;

    // match other slot label sizing (slightly smaller than default).
    this.setFontSize(originalSize - 10);
    this.contents.outlineWidth = 4;
    this.contents.outlineColor = 'rgba(0, 0, 0, 0.85)';

    const text = 'Dash';
    const tw = this.textSizeEx(text).width;
    const labelX = panelX + Math.floor((panelW - tw) / 2) - 5;
    const labelY = panelY + panelH - labelReserve - 16;
    this.drawText(text, labelX, labelY, tw, 'left');

    // restore font settings.
    this.setFontSize(originalSize);
    this.contents.outlineWidth = originalOutlineW;
    this.contents.outlineColor = originalOutlineC;
  }

  /**
   * Draws a single input key of the input frame.
   * @param {string} inputType The type of input key this is.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   * @param {number} opacity The per-pass opacity (0..255) for slot sprites.
   */
  drawInputKey(inputType, x, y, opacity)
  {
    // shorthand the player's JABS battler data.
    const jabsPlayer = $jabsEngine.getPlayer1();

    // grab the cooldown data and the skillslot data from the leader based on the slot.
    const actionKeyData = jabsPlayer.getActionKeyData(inputType);

    // if we have no action key data for this slot, don't draw it.
    if (!actionKeyData) return;

    // extract the input key's data.
    const skillSlot = actionKeyData.skillslot;

    // draw the input key slot's sprite with the provided opacity.
    this.drawInputKeySlotSprite(skillSlot, inputType, x, y, opacity);
  }

  /**
   * Draw the input key associated with a given skill slot.
   * @param {JABS_SkillSlot} skillSlot The skill slot to draw.
   * @param {string} inputType The type of input key this is.
   * @param {number} x The x coordinate (CONTENTS space).
   * @param {number} y The y coordinate (CONTENTS space).
   * @param {number} opacity The per-pass opacity (0..255) for the slot sprite.
   */
  drawInputKeySlotSprite(skillSlot, inputType, x, y, opacity)
  {
    const sprite = this.getOrCreateInputKeySlotSprite(skillSlot, inputType);

    // draw the panel background when the slot isn’t empty.
    if (!skillSlot.isEmpty())
    {
      const width = this.inputKeyWidth() - 10;
      const height = this.inputKeyHeight();

      // fancy multi-layer HUD panel.
      this.drawHudPanelFancy(x - 10, y + 20, width, height, {
        // no tint by default; wire one in later if you theme by state.
        tint: null,
        tintAlpha: 0,
      });
    }

    // TODO: adjust x/y back a bit.

    // position the slot sprite.
    const px = this.padding + x - 4;
    const py = this.padding + y + 14;
    sprite.show();
    sprite.move(px, py);
    sprite.opacity = Math.max(0, Math.min(255, opacity || 255));
  }

  //endregion draw
}

export default Window_InputFrame;
//endregion Window_InputFrame