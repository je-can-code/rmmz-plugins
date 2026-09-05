//region Window_FoodFrame
/**
 * A HUD window that renders the leader's active food chain status as a tall vertical
 * strip on the map screen. Reads only from:
 *   - $gameParty.leader()                for the current actor
 *   - $jabsEngine.getFoodChainPlanByUuid  for the pre-walked chain plan (built at boot)
 *   - the JABS state tracker              for live remaining duration of the active state
 *
 * Layout, top to bottom:
 *   1. Icon of the currently active food chain state (changes each phase transition).
 *   2. Vertical segmented bar — black bezel and inset track, then segments proportional
 *      to phase duration, colored by <foodGroupColor:#RRGGBB>. The active segment drains
 *      in real time; future segments are muted; past segments are empty.
 *   3. Chain state label list — one label per chain segment, the active one rendered
 *      bold + italic. windowHeight is the only limit on how many label rows fit (no cap —
 *      extra phases may clip). The icon and bar never resize.
 *
 * The window hides itself entirely when no food chain is active.
 */
class Window_FoodFrame
  extends Window_Base
{
  /**
   * Width in pixels of the vertical bar column.
   * @type {number}
   */
  static BAR_WIDTH = 20;

  /**
   * Total height in pixels of the vertical bar (all segments combined).
   * @type {number}
   */
  static BAR_HEIGHT = 180;

  /**
   * Black bezel thickness around the bar track (pixels per side).
   * @type {number}
   */
  static BAR_BORDER_THICKNESS = 2;

  /**
   * Outer frame color for the vertical food bar.
   * @type {string}
   */
  static BAR_FRAME_COLOR = '#000000';

  /**
   * Height reserved for each chain state label row, in pixels.
   * Must exceed {@link Window_Base#lineHeight} so descenders (g, y, etc.) are not clipped.
   * @type {number}
   */
  static LABEL_ROW_HEIGHT = 34;

  /**
   * Extra padding below the last chain label inside the content area.
   * @type {number}
   */
  static LABEL_BOTTOM_PADDING = 24;

  /**
   * Default number of chain-state label rows when deriving height from row count.
   * @type {number}
   */
  static DEFAULT_VISIBLE_CHAIN_LABEL_ROWS = 6;

  /**
   * Standard MZ window padding applied on top and bottom (12 + 12).
   * @type {number}
   */
  static WINDOW_PADDING = 24;

  /**
   * Font size adjustment for chain state names (negative = smaller).
   * Keeps long names like "Overstuffed" inside the narrow strip width.
   * @type {number}
   */
  static CHAIN_LABEL_FONT_DELTA = -6;

  /**
   * Y offset of the icon from the top of the content area.
   * @type {number}
   */
  static ICON_Y = 0;

  /**
   * Y offset where the vertical bar begins, leaving room for the icon above.
   * @type {number}
   */
  static BAR_START_Y = 40;

  /**
   * Y offset where the chain label list begins, below the bar.
   * @type {number}
   */
  static LABELS_START_Y = Window_FoodFrame.BAR_START_Y + Window_FoodFrame.BAR_HEIGHT + 6;

  /**
   * Content height consumed by the icon, bar, and label-region chrome (everything except label rows).
   * @returns {number}
   */
  static fixedChromeContentHeight()
  {
    return Window_FoodFrame.LABELS_START_Y + Window_FoodFrame.LABEL_BOTTOM_PADDING;
  }

  /**
   * Computes total window height for a given number of visible chain-state label rows.
   * @param {number} visibleLabelRows How many chain state names should fit.
   * @returns {number}
   */
  static requiredWindowHeight(visibleLabelRows = Window_FoodFrame.DEFAULT_VISIBLE_CHAIN_LABEL_ROWS)
  {
    const contentBottom = Window_FoodFrame.LABELS_START_Y
      + (visibleLabelRows * Window_FoodFrame.LABEL_ROW_HEIGHT)
      + Window_FoodFrame.LABEL_BOTTOM_PADDING;

    return contentBottom + Window_FoodFrame.WINDOW_PADDING;
  }

  /**
   * Derives how many chain-state labels fit in the given total window height.
   * Icon and bar size are not affected — only the label list grows with height.
   * @param {number} windowHeight Total window height in pixels.
   * @returns {number}
   */
  /**
   * Constructor.
   * @param {Rectangle} rect The rectangle describing this window's dimensions.
   */
  constructor(rect)
  {
    super(rect);

    // apply plugin opacity before the first paint.
    this.configure();

    this.refresh();
  }

  /**
   * One-time window setup: plugin-driven windowskin frame opacity.
   */
  configure()
  {
    // fade only the plated window chrome, not the food strip graphics.
    this.opacity = J.HUD.EXT.FOOD.Metadata.windowOpacity;
  }

  /**
   * Keeps backdrop opacity on the plugin parameter instead of $gameSystem.windowOpacity().
   * MZ calls this every frame from {@link Window_Base#updateBackOpacity}.
   */
  updateBackOpacity()
  {
    this.backOpacity = J.HUD.EXT.FOOD.Metadata.windowOpacity;
  }

  /**
   * Updates this window each frame.
   * Refreshing every frame keeps the drain bar animated in real time and ensures
   * the window hides itself as soon as the tail state fully expires.
   */
  update()
  {
    // perform original logic (cursor blink, tone animation, etc.).
    super.update();

    // refresh the food chain display each frame so the bar drains in real time.
    this.refresh();

    // fade toward or away from the player standing on top of this frame.
    this.alpha = HudInterferenceResolver.nextFrameAlpha(this);
  }

  /**
   * Refreshes the window contents. Hides the frame when no food chain is running.
   */
  refresh()
  {
    this.contents.clear();

    // resolve the player JABS battler for UUID lookup.
    const player = $jabsEngine.getPlayer1();
    if (!player)
    {
      this.hide();
      return;
    }

    // grab the leader.
    const leader = $gameParty.leader();
    if (!leader)
    {
      this.hide();
      return;
    }

    // retrieve the cached food chain plan for this leader.
    const plan = $jabsEngine.getFoodChainPlanByUuid(player.getUuid());
    if (!plan || plan.isEmpty())
    {
      this.hide();
      return;
    }

    // determine which segment is currently active before drawing anything.
    const activeId = this.resolveActiveStateId(leader, plan);

    // if no segment from the plan is active, the chain has fully expired.
    if (activeId === 0)
    {
      this.hide();
      return;
    }

    // chain is running — show the strip and draw the full food chain display.
    this.show();
    this.drawActiveStateIcon(activeId);
    this.drawVerticalBar(plan, player.getUuid(), activeId);
    this.drawChainLabels(plan, activeId);
  }

  /**
   * Draws the icon of the currently active food chain state, centered at the top
   * of the content area.
   * @param {number} activeId The state id currently active on the leader.
   */
  drawActiveStateIcon(activeId)
  {
    // look up the icon index from the active state's database entry.
    const iconIndex = $dataStates[activeId]
      ? $dataStates[activeId].iconIndex
      : 0;

    // center the 32×32 icon horizontally within the content area.
    const iconX = Math.floor((this.contentsWidth() - ImageManager.iconWidth) / 2);
    this.drawIcon(iconIndex, iconX, Window_FoodFrame.ICON_Y);
  }

  /**
   * Draws the vertical segmented bar, with each segment sized proportionally to its
   * phase duration and colored by the state's foodGroupColor notetag.
   *
   * Rendering rules per segment:
   *   - Past (index < activeIndex): gauge background only (fully drained).
   *   - Active: fill from the top by remaining-time ratio; remainder is gauge background.
   *   - Future (index > activeIndex): full-height muted version of the segment color.
   * @param {JABS_FoodChainPlan} plan The active food chain plan.
   * @param {string} uuid The UUID of the leader's JABS battler for duration lookup.
   * @param {number} activeId The state id currently active on the leader.
   */
  drawVerticalBar(plan, uuid, activeId)
  {
    const { segments } = plan;
    const totalFrames = segments.reduce((sum, seg) => sum + seg.frames, 0);

    // if total duration is unknown we cannot proportion the bar.
    if (totalFrames <= 0) return;

    // center the bar column horizontally and paint the outer bezel first.
    const barX = Math.floor((this.contentsWidth() - Window_FoodFrame.BAR_WIDTH) / 2);
    const barY = Window_FoodFrame.BAR_START_Y;
    const barW = Window_FoodFrame.BAR_WIDTH;
    const barH = Window_FoodFrame.BAR_HEIGHT;

    this.drawBarFrame(barX, barY, barW, barH);

    // segments render inside the inset track, not on the raw map tiles.
    const inner = Window_FoodFrame.#barInnerRect(barX, barY, barW, barH);

    // locate the active segment position within the plan.
    const activeIndex = plan.indexOfState(activeId);

    // cumulative Y tracks where each segment starts inside the track.
    let cumY = inner.y;

    const innerBottom = inner.y + inner.height;

    for (let i = 0; i < segments.length; i++)
    {
      const segment = segments[i];
      const isLast = (i === segments.length - 1);

      // each segment's height is proportional to its share of the total duration.
      let segH = Math.floor((segment.frames / totalFrames) * inner.height);

      // last slice absorbs floor rounding slack so no dead track pixels sit under the bezel.
      if (isLast)
      {
        segH = innerBottom - cumY;
      }

      // skip zero-height segments (rounding artifact on very short phases).
      if (segH <= 0) continue;

      const isActive = (i === activeIndex);

      this.drawBarSegment(inner.x, cumY, inner.width, segH, segment, i, activeIndex, isActive, uuid, isLast);

      cumY += segH;
    }
  }

  /**
   * Paints the bar bezel and recessed track behind all segments.
   * @param {number} x Left edge of the outer bar column.
   * @param {number} y Top edge of the outer bar column.
   * @param {number} width Outer width including the frame.
   * @param {number} height Outer height including the frame.
   */
  drawBarFrame(x, y, width, height)
  {
    const border = Window_FoodFrame.BAR_BORDER_THICKNESS;

    // black outer shell so the gauge reads on busy map tiles.
    this.contents.fillRect(x, y, width, height, Window_FoodFrame.BAR_FRAME_COLOR);

    // inset track uses the same back color as drained gauge segments.
    this.contents.fillRect(
      x + border,
      y + border,
      width - (border * 2),
      height - (border * 2),
      ColorManager.gaugeBackColor(),
    );

    // crisp outline on top of the fill so edges stay sharp when scaled.
    this.strokeBarOutline(x, y, width, height);
  }

  /**
   * Strokes a 1px rectangle around the outer bar bounds.
   * @param {number} x Left edge of the outer bar column.
   * @param {number} y Top edge of the outer bar column.
   * @param {number} width Outer width including the frame.
   * @param {number} height Outer height including the frame.
   */
  strokeBarOutline(x, y, width, height)
  {
    const ctx = this.contents.context;

    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 0.5, y + 0.5, width - 1, height - 1);
    ctx.lineWidth = 1;
    ctx.strokeStyle = Window_FoodFrame.BAR_FRAME_COLOR;
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Inner drawable area inside the bar bezel.
   * @param {number} x Left edge of the outer bar column.
   * @param {number} y Top edge of the outer bar column.
   * @param {number} width Outer width including the frame.
   * @param {number} height Outer height including the frame.
   * @returns {{ x: number, y: number, width: number, height: number }}
   */
  static #barInnerRect(x, y, width, height)
  {
    const border = Window_FoodFrame.BAR_BORDER_THICKNESS;

    return {
      x: x + border,
      y: y + border,
      width: width - (border * 2),
      height: height - (border * 2),
    };
  }

  /**
   * Draws a single segment of the vertical bar.
   * @param {number} x Left edge of the bar column.
   * @param {number} y Top edge of this segment.
   * @param {number} width Width of the bar column.
   * @param {number} height Height of this segment.
   * @param {JABS_FoodChainSegment} segment The segment model for this position.
   * @param {number} index The zero-based index of this segment in the plan.
   * @param {number} activeIndex The index of the currently active segment.
   * @param {boolean} isActive Whether this segment is the currently active phase.
   * @param {string} uuid UUID for JABS state tracker duration lookup.
   * @param {boolean} isLast Whether this is the final slice in the chain (touches the track floor).
   */
  drawBarSegment(x, y, width, height, segment, index, activeIndex, isActive, uuid, isLast)
  {
    const bgColor = ColorManager.gaugeBackColor();

    if (index < activeIndex)
    {
      // past segment — fully drained, show only the gauge background.
      this.contents.fillRect(x, y, width, height, bgColor);
    }
    else if (isActive)
    {
      // active segment — fill from the top down by the remaining-time ratio.
      const fillRatio = this.calculateFillRatio(segment, uuid);

      // round so a nearly-full phase does not leave a 1px empty line above the segment floor.
      let fillH = Math.round(height * fillRatio);
      fillH = Math.max(0, Math.min(height, fillH));

      // draw background for the full segment height first.
      this.contents.fillRect(x, y, width, height, bgColor);

      // overlay the fill anchored to the bottom of the segment so the colored portion
      // retreats downward as time expires — creating a continuous top-to-bottom drain.
      if (fillH > 0)
      {
        this.contents.fillRect(x, y + (height - fillH), width, fillH, segment.color);
      }
    }
    else
    {
      // future segment — show at full height with a muted (40% brightness) version
      // of the segment color to preview upcoming phases without overshadowing the active one.
      this.contents.fillRect(x, y, width, height, Window_FoodFrame.#muteColor(segment.color));
    }

    // draw a 1px divider under this slice (not on the bottom slice — the bezel is the floor).
    if (isLast === false)
    {
      this.contents.fillRect(x, y + height - 1, width, 1, Window_FoodFrame.BAR_FRAME_COLOR);
    }
  }

  /**
   * Draws the chain state label list below the vertical bar.
   * Labels are in chain order (entry through tail). The active state's label is
   * rendered bold and italic; inactive labels are dimmed.
   * @param {JABS_FoodChainPlan} plan The active food chain plan.
   * @param {number} activeId The state id currently active on the leader.
   */
  drawChainLabels(plan, activeId)
  {
    const { segments } = plan;
    const rowH = Window_FoodFrame.LABEL_ROW_HEIGHT;

    // locate the active segment position to know which label to embolden.
    const activeIndex = plan.indexOfState(activeId);

    for (let i = 0; i < segments.length; i++)
    {
      const segment = segments[i];
      const state = $dataStates[segment.stateId];

      // skip segments whose state no longer exists in the database.
      if (!state) continue;

      const labelY = Window_FoodFrame.LABELS_START_Y + i * rowH;
      const isActive = (i === activeIndex);

      this.drawChainLabel(state.name, labelY, isActive);
    }
  }

  /**
   * Draws one chain-state label centered under the bar column.
   * @param {string} rawName The state name from the database (may contain $codes).
   * @param {number} y The y coordinate in contents space.
   * @param {boolean} isActive Whether this row is the currently active chain phase.
   */
  drawChainLabel(rawName, y, isActive)
  {
    // expand $codes and \\codes, then apply the smaller chain-label font size.
    let text = this.convertEscapeCharacters(rawName);
    text = this.applyChainLabelFontSize(text);

    if (isActive)
    {
      text = this.boldenText(this.italicizeText(text));
    }

    // measure the rendered width so we can center the row under the bar.
    const { width: textWidth } = this.textSizeEx(text);
    const drawX = this.chainLabelCenterX(textWidth);
    const drawWidth = Math.min(textWidth, this.contentsWidth());

    if (isActive)
    {
      this.drawTextEx(text, drawX, y, drawWidth);
      return;
    }

    // inactive label: dimmed, still fully parsed like the active row.
    this.changeTextColor(ColorManager.dimColor1());
    this.changeOutlineColor(ColorManager.outlineColor());

    const textState = this.createTextState(text, drawX, y, drawWidth);
    this.processAllText(textState);

    this.resetTextColor();
  }

  /**
   * Computes the x offset to center a chain label row under the vertical bar.
   * @param {number} textWidth The measured width of the label text.
   * @returns {number}
   */
  chainLabelCenterX(textWidth)
  {
    const contentsW = this.contentsWidth();

    if (textWidth >= contentsW)
    {
      return 0;
    }

    return Math.floor((contentsW - textWidth) / 2);
  }

  /**
   * Wraps chain label text in a smaller font size for the narrow food strip.
   * @param {string} text The label text (may already include escape codes).
   * @returns {string}
   */
  applyChainLabelFontSize(text)
  {
    return this.modFontSizeForText(Window_FoodFrame.CHAIN_LABEL_FONT_DELTA, text);
  }

  /**
   * Finds the first segment state currently afflicting the leader.
   * Returns 0 when no segment from the plan is currently active.
   * @param {Game_Actor} leader The party leader.
   * @param {JABS_FoodChainPlan} plan The active food chain plan.
   * @returns {number} The active state id, or 0.
   */
  resolveActiveStateId(leader, plan)
  {
    for (const segment of plan.segments)
    {
      if (leader.isStateAffected(segment.stateId)) return segment.stateId;
    }

    return 0;
  }

  /**
   * Calculates the 0.0–1.0 fill ratio for the active segment based on the JABS
   * state tracker's remaining duration for that state.
   * Returns 1.0 (full) when the tracker entry cannot be found.
   * @param {JABS_FoodChainSegment} segment The currently active segment.
   * @param {string} uuid UUID for the JABS battler state tracker.
   * @returns {number} Fill ratio clamped to [0, 1].
   */
  calculateFillRatio(segment, uuid)
  {
    const jabsStateMap = $jabsEngine.getJabsStatesByUuid(uuid);

    // no state map for this battler — default to full.
    if (!jabsStateMap) return 1.0;

    const jabsState = jabsStateMap.get(segment.stateId);

    // no tracker entry for this state — default to full.
    if (!jabsState) return 1.0;

    // a segment with no configured duration cannot drain meaningfully.
    if (segment.frames <= 0) return 1.0;

    // remaining / max gives the drain fraction (1 = fresh, 0 = expired).
    const ratio = jabsState.duration / segment.frames;

    return Math.max(0, Math.min(1, ratio));
  }

  /**
   * Returns a 40%-brightness version of the given CSS hex color string.
   * Used to render upcoming (future) segments in a recognizable but subdued tone.
   * @param {string} hex A '#RRGGBB' hex color string.
   * @returns {string} The muted hex color string.
   */
  static #muteColor(hex)
  {
    // parse the three 8-bit components from the hex string.
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);

    // reduce each component to 40% of its original value.
    const mr = Math.floor(r * 0.4).toString(16).padStart(2, '0');
    const mg = Math.floor(g * 0.4).toString(16).padStart(2, '0');
    const mb = Math.floor(b * 0.4).toString(16).padStart(2, '0');

    return `#${mr}${mg}${mb}`;
  }
}

export default Window_FoodFrame;
//endregion Window_FoodFrame