//region Scene_JaftingSalvage
/**
 * First-class salvage scene: pick a stamped item, preview refunds, confirm destruction.
 */
class Scene_JaftingSalvage
  extends Scene_MenuBase
{
  /**
   * How many stamped units one confirmation dismantles (stack splitting can grow this later).
   */
  static DismantleBatchSize = 1;

  /**
   * Hub / handler symbol for {@link Window_JaftingList} and {@link Scene_Jafting#onRootJaftingSelection}.
   * @type {string}
   */
  static KEY = 'jafting-salvage';

  /**
   * Whether the root JAFTING menu should allow choosing Salvage (plugin command {@code call-salvage} ignores this).
   * Switch id {@code 0} skips the gate so designers can leave the parameter unset.
   *
   * @returns {boolean}
   */
  static isSalvageHubCommandEnabled()
  {
    const switchId = J.JAFTING.Metadata.salvageMenuSwitchId;

    if (switchId === 0)
    {
      return true;
    }

    return $gameSwitches.value(switchId);
  }

  /**
   * Opens the salvage workflow.
   */
  static callScene()
  {
    SceneManager.push(this);
  }

  /**
   * Constructor.
   */
  constructor()
  {
    super();
  }

  /**
   * Spawns the window layer, background, and salvage UI.
   */
  create()
  {
    Scene_MenuBase.prototype.create.call(this);

    // tracks last highlighted datum + stack so preview repaints after dismantle without waiting for cursor moves.
    this._lastPreviewDatum = null;
    this._lastPreviewStack = null;
    this.createSalvageWindows();
  }

  /**
   * Softens the map backdrop similar to other JAFTING scenes.
   */
  createBackground()
  {
    this._backgroundFilter = new PIXI.filters.AlphaFilter(0.1);
    this._backgroundSprite = new Sprite();
    this._backgroundSprite.bitmap = SceneManager.backgroundBitmap();
    this._backgroundSprite.filters = [ this._backgroundFilter ];
    this.addChild(this._backgroundSprite);
  }

  /**
   * Suppresses touch UI chrome for parity with Creation / Refinement scenes.
   */
  createButtons()
  {
  }

  /**
   * Builds list, preview, and confirmation chrome.
   */
  createSalvageWindows()
  {
    const candidateRect = this.salvageCandidateWindowRect();
    const previewRect = this.salvagePreviewWindowRect();
    const confirmRect = this.salvageConfirmationWindowRect();

    this._candidateWindow = new Window_SalvageCandidateList(candidateRect);
    this._candidateWindow.setHandler('ok', this.onSalvageCandidateOk.bind(this));
    this._candidateWindow.setHandler('cancel', this.popScene.bind(this));

    this._previewWindow = new Window_SalvagePreview(previewRect);

    this._confirmationWindow = new Window_SalvageConfirmation(confirmRect);
    this._confirmationWindow.setHandler('confirm', this.onSalvageConfirmOk.bind(this));
    this._confirmationWindow.setHandler('cancel', this.onSalvageConfirmCancel.bind(this));

    // modal sits invisible until the player commits on the candidate list—mirrors refinement confirmation layering.
    this._confirmationWindow.hide();
    this._confirmationWindow.deactivate();

    this.addWindow(this._candidateWindow);
    this.addWindow(this._previewWindow);
    this.addWindow(this._confirmationWindow);

    this._previewWindow.setDismantleAmount(Scene_JaftingSalvage.DismantleBatchSize);
    // initial rects come from salvage*WindowRect(); real panel placement waits for start() after refresh()
    // so the candidate cursor (and thus refund row counts) exist—see refreshPreviewFromSelection().
  }

  /**
   * Shared width for the candidate column so create-time rects match {@link #layoutSalvagePanels}.
   *
   * @returns {number}
   */
  salvageCandidateListWidth()
  {
    return Math.min(440, Math.max(280, Math.floor(Graphics.boxWidth * 0.34)));
  }

  /**
   * Preview pane width: never eats the whole screen—refund text rarely needs more than half the box.
   *
   * @param {number} previewX left edge of the preview window in screen space
   * @returns {number}
   */
  salvagePreviewBandWidth(previewX)
  {
    const margin = 18;
    const fullRight = Graphics.boxWidth - margin - previewX;
    const widthCap = Math.min(560, Math.floor(Graphics.boxWidth * 0.48));

    // keep a readable floor when there is room, but never wider than the space to the right edge.
    return Math.min(fullRight, Math.max(200, Math.min(widthCap, fullRight)));
  }

  /**
   * Vertical band shared by the salvage list and preview (full height above the confirm row).
   *
   * @returns {{ topY: number, bandH: number }}
   */
  salvageClusterVerticalBand()
  {
    const topY = 40;
    const confirmRect = this.salvageConfirmationWindowRect();
    const bandBottom = confirmRect.y - 16;
    const bandH = Math.max(160, bandBottom - topY);

    return { topY, bandH };
  }

  /**
   * Places the candidate list and preview as one horizontal cluster, centered with side margins.<br>
   * Iterates a few times because {@link #salvagePreviewBandWidth} depends on the preview's screen-x
   * (free space to the right edge).
   *
   * @returns {{ listX: number, listW: number, previewX: number, previewW: number, topY: number, bandH: number }}
   */
  salvageClusterStripLayout()
  {
    const margin = 18;
    const gapMid = 16;
    const { topY, bandH } = this.salvageClusterVerticalBand();
    const listW = this.salvageCandidateListWidth();
    // seed from the old left rail—usually settles in one or two passes once the capped preview width is known.
    let listX = margin;

    for (let iter = 0; iter < 8; iter++)
    {
      const previewX = listX + listW + gapMid;
      const previewW = this.salvagePreviewBandWidth(previewX);
      const totalW = listW + gapMid + previewW;
      const idealX = Math.floor((Graphics.boxWidth - totalW) / 2);
      const maxLeft = Graphics.boxWidth - margin - totalW;
      const nextX = Math.max(margin, Math.min(idealX, maxLeft));

      if (nextX === listX)
      {
        return {
          listX,
          listW,
          previewX,
          previewW,
          topY,
          bandH,
        };
      }

      listX = nextX;
    }

    const previewX = listX + listW + gapMid;
    const previewW = this.salvagePreviewBandWidth(previewX);

    return {
      listX,
      listW,
      previewX,
      previewW,
      topY,
      bandH,
    };
  }

  /**
   * Candidate list on the left, salvage preview on the right—both use the full vertical band above confirm (no scroll).
   */
  layoutSalvagePanels()
  {
    const strip = this.salvageClusterStripLayout();
    const {
      listX, listW, previewX, previewW, topY, bandH,
    } = strip;

    this._candidateWindow.move(listX, topY, listW, bandH);

    const preview = this._previewWindow;
    const item = this._candidateWindow.item();
    const n = JaftingSalvageManager.visibleExpandedRefundRowCount(item);
    const linesSingle = JaftingSalvageManager.layoutPreviewLineCountSingle(item);
    const linesTwo = JaftingSalvageManager.layoutPreviewLineCountTwoColumn(item);
    const desiredSingle = preview.fittingHeight(linesSingle);
    const desiredTwo = preview.fittingHeight(linesTwo);

    let useTwoCol = false;

    if (desiredSingle > bandH && n > 1 && desiredTwo <= bandH)
    {
      useTwoCol = true;
    }
    else if (desiredSingle > bandH && n > 1)
    {
      useTwoCol = true;
    }

    preview.setRefundTwoColumnMode(useTwoCol);
    preview.move(previewX, topY, previewW, bandH);
  }

  /**
   * @returns {Rectangle}
   */
  salvageCandidateWindowRect()
  {
    const s = this.salvageClusterStripLayout();

    return new Rectangle(s.listX, s.topY, s.listW, s.bandH);
  }

  /**
   * @returns {Rectangle}
   */
  salvagePreviewWindowRect()
  {
    const s = this.salvageClusterStripLayout();

    return new Rectangle(s.previewX, s.topY, s.previewW, s.bandH);
  }

  /**
   * @returns {Rectangle}
   */
  salvageConfirmationWindowRect()
  {
    const width = 420;
    const height = this.calcWindowHeight(2, true);
    const x = (Graphics.boxWidth - width) / 2;
    const y = Graphics.boxHeight - height - 24;

    return new Rectangle(x, y, width, height);
  }

  /**
   * Starts interaction on the candidate list.
   */
  start()
  {
    Scene_MenuBase.prototype.start.call(this);
    this._candidateWindow.open();
    this._previewWindow.open();
    this._confirmationWindow.open();
    this._candidateWindow.refresh();
    this._candidateWindow.activate();
    // windows already exist—now the list has a valid index, so we can move panes and sync preview in one pass.
    this.refreshPreviewFromSelection();
  }

  /**
   * Keeps the preview pane synced with the active cursor row.
   */
  update()
  {
    Scene_MenuBase.prototype.update.call(this);

    if (this._candidateWindow && this._candidateWindow.active)
    {
      const item = this._candidateWindow.item();
      const stack = item ? $gameParty.numItems(item) : 0;

      if (item !== this._lastPreviewDatum || stack !== this._lastPreviewStack)
      {
        this._lastPreviewDatum = item;
        this._lastPreviewStack = stack;
        this.layoutSalvagePanels();
        this._previewWindow.setDatum(item);
      }
    }
  }

  /**
   * Requests confirmation before dismantling the highlighted entry.
   */
  onSalvageCandidateOk()
  {
    const datum = this._candidateWindow.item();

    if (datum === undefined || datum === null)
    {
      SoundManager.playBuzzer();

      return;
    }

    this._confirmationWindow.show();
    this._confirmationWindow.select(0);
    this._confirmationWindow.activate();
    this._candidateWindow.deactivate();
  }

  /**
   * Confirms salvage execution for a single unit.
   */
  onSalvageConfirmOk()
  {
    const datum = this._candidateWindow.item();

    if (datum === undefined || datum === null)
    {
      SoundManager.playBuzzer();
      this.onSalvageConfirmCancel();

      return;
    }

    const ok = JaftingSalvageManager.executeSalvage(datum, Scene_JaftingSalvage.DismantleBatchSize);

    if (ok === false)
    {
      SoundManager.playBuzzer();
    }
    else
    {
      SoundManager.playUseItem();
    }

    this._candidateWindow.refresh();

    this.refreshPreviewFromSelection();
    this.onSalvageConfirmCancel();
  }

  /**
   * Closes the confirmation layer and returns focus to the list.
   */
  onSalvageConfirmCancel()
  {
    this._confirmationWindow.hide();
    this._confirmationWindow.deactivate();
    this._candidateWindow.activate();
  }

  /**
   * Forces preview regeneration after list mutations.
   */
  refreshPreviewFromSelection()
  {
    const item = this._candidateWindow.item();
    const stack = item ? $gameParty.numItems(item) : 0;

    this._lastPreviewDatum = item;
    this._lastPreviewStack = stack;
    this.layoutSalvagePanels();
    this._previewWindow.setDatum(item);
  }
}

/**
 * Routes the Salvage hub row before Creation / Refinement extensions chain their own keys.<br>
 * The alias map is created in core `_metadata/initialization.js` so this `.set` runs after that file loads.
 */
J.JAFTING.Aliased.Scene_Jafting.set('onRootJaftingSelection', Scene_Jafting.prototype.onRootJaftingSelection);
Scene_Jafting.prototype.onRootJaftingSelection = function()
{
  const currentSelection = this.getRootJaftingKey();

  if (currentSelection === Scene_JaftingSalvage.KEY)
  {
    this.jaftingSalvageSelected();
  }
  else
  {
    J.JAFTING.Aliased.Scene_Jafting.get('onRootJaftingSelection').call(this);
  }
};

/**
 * Leaves the hub chrome on the stack and pushes dismantle UI—mirrors {@link Scene_JaftingCreate.callScene} flow.
 */
Scene_Jafting.prototype.jaftingSalvageSelected = function()
{
  this.closeRootJaftingWindows();

  Scene_JaftingSalvage.callScene();
};

//endregion Scene_JaftingSalvage