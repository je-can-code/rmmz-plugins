//region Scene_JaftingSalvage
import JaftingSalvageManager from './../managers/JaftingSalvageManager.js';
import Window_SalvageCandidateList from '../windows/Window_SalvageCandidateList.js';
import Window_SalvageConfirmation from '../windows/Window_SalvageConfirmation.js';
import Window_SalvagePreview from '../windows/Window_SalvagePreview.js';

/**
 * First-class salvage scene: pick a stamped item, preview refunds, confirm destruction.
 */
class Scene_JaftingSalvage
  extends Scene_MenuBase
{
  /**
   * How many stamped units one confirmation dismantles (stack splitting can grow this later).
   */
  

  //region properties
  /**
   * Gets the last preview datum.
   * @returns {*} The lastPreviewDatum.
   */
  lastPreviewDatum()
  {
    // hand back the last preview datum.
    return this._lastPreviewDatum;
  }

  /**
   * Sets the last preview datum.
   * @param {*} newLastPreviewDatum The new lastPreviewDatum.
   */
  setLastPreviewDatum(newLastPreviewDatum)
  {
    // assign the last preview datum.
    this._lastPreviewDatum = newLastPreviewDatum;
  }

  /**
   * Gets the last preview stack.
   * @returns {*} The lastPreviewStack.
   */
  lastPreviewStack()
  {
    // hand back the last preview stack.
    return this._lastPreviewStack;
  }

  /**
   * Sets the last preview stack.
   * @param {*} newLastPreviewStack The new lastPreviewStack.
   */
  setLastPreviewStack(newLastPreviewStack)
  {
    // assign the last preview stack.
    this._lastPreviewStack = newLastPreviewStack;
  }

  /**
   * Gets the candidate window.
   * @returns {*} The candidateWindow.
   */
  candidateWindow()
  {
    // hand back the candidate window.
    return this._candidateWindow;
  }

  /**
   * Sets the candidate window.
   * @param {*} newCandidateWindow The new candidateWindow.
   */
  setCandidateWindow(newCandidateWindow)
  {
    // assign the candidate window.
    this._candidateWindow = newCandidateWindow;
  }

  /**
   * Gets the preview window.
   * @returns {*} The previewWindow.
   */
  previewWindow()
  {
    // hand back the preview window.
    return this._previewWindow;
  }

  /**
   * Sets the preview window.
   * @param {*} newPreviewWindow The new previewWindow.
   */
  setPreviewWindow(newPreviewWindow)
  {
    // assign the preview window.
    this._previewWindow = newPreviewWindow;
  }

  /**
   * Gets the confirmation window.
   * @returns {*} The confirmationWindow.
   */
  confirmationWindow()
  {
    // hand back the confirmation window.
    return this._confirmationWindow;
  }

  /**
   * Sets the confirmation window.
   * @param {*} newConfirmationWindow The new confirmationWindow.
   */
  setConfirmationWindow(newConfirmationWindow)
  {
    // assign the confirmation window.
    this._confirmationWindow = newConfirmationWindow;
  }
  //endregion properties

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
    this.setLastPreviewDatum(null);
    this.setLastPreviewStack(null);
    this.createSalvageWindows();
  }

  /**
   * Softens the map backdrop similar to other JAFTING scenes.
   */
  createBackground()
  {
    this.setBackgroundFilter(new PIXI.filters.AlphaFilter(0.1));
    this.setBackgroundSprite(new Sprite());
    this.backgroundSprite().bitmap = SceneManager.backgroundBitmap();
    this.backgroundSprite().filters = [ this.backgroundFilter() ];
    this.addChild(this.backgroundSprite());
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

    // store  candidate window on the instance for later reads.
    this.setCandidateWindow(new Window_SalvageCandidateList(candidateRect));
    this.candidateWindow().setHandler('ok', this.onSalvageCandidateOk.bind(this));
    this.candidateWindow().setHandler('cancel', this.popScene.bind(this));

    // store  preview window on the instance for later reads.
    this.setPreviewWindow(new Window_SalvagePreview(previewRect));

    // store  confirmation window on the instance for later reads.
    this.setConfirmationWindow(new Window_SalvageConfirmation(confirmRect));
    this.confirmationWindow().setHandler('confirm', this.onSalvageConfirmOk.bind(this));
    this.confirmationWindow().setHandler('cancel', this.onSalvageConfirmCancel.bind(this));

    // modal sits invisible until the player commits on the candidate list—mirrors refinement confirmation layering.
    this.confirmationWindow().hide();
    this.confirmationWindow().deactivate();

    this.addWindow(this.candidateWindow());
    this.addWindow(this.previewWindow());
    this.addWindow(this.confirmationWindow());

    this.previewWindow().setDismantleAmount(Scene_JaftingSalvage.DismantleBatchSize);
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

    this.candidateWindow().move(listX, topY, listW, bandH);

    const preview = this.previewWindow();
    const item = this.candidateWindow().item();
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
    this.candidateWindow().open();
    this.previewWindow().open();
    this.confirmationWindow().open();
    this.candidateWindow().refresh();
    this.candidateWindow().activate();
    // windows already exist—now the list has a valid index, so we can move panes and sync preview in one pass.
    this.refreshPreviewFromSelection();
  }

  /**
   * Keeps the preview pane synced with the active cursor row.
   */
  update()
  {
    Scene_MenuBase.prototype.update.call(this);

    if (this.candidateWindow() && this.candidateWindow().active)
    {
      const item = this.candidateWindow().item();
      const stack = item ? $gameParty.numItems(item) : 0;

      if (item !== this.lastPreviewDatum() || stack !== this.lastPreviewStack())
      {
        this.setLastPreviewDatum(item);
        this.setLastPreviewStack(stack);
        this.layoutSalvagePanels();
        this.previewWindow().setDatum(item);
      }
    }
  }

  /**
   * Requests confirmation before dismantling the highlighted entry.
   */
  onSalvageCandidateOk()
  {
    const datum = this.candidateWindow().item();

    if (datum === undefined || datum === null)
    {
      SoundManager.playBuzzer();

      // exit early without a payload.
      return;
    }

    this.confirmationWindow().show();
    this.confirmationWindow().select(0);
    this.confirmationWindow().activate();
    this.candidateWindow().deactivate();
  }

  /**
   * Confirms salvage execution for a single unit.
   */
  onSalvageConfirmOk()
  {
    const datum = this.candidateWindow().item();

    if (datum === undefined || datum === null)
    {
      SoundManager.playBuzzer();
      this.onSalvageConfirmCancel();

      // exit early without a payload.
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

    this.candidateWindow().refresh();

    this.refreshPreviewFromSelection();
    this.onSalvageConfirmCancel();
  }

  /**
   * Closes the confirmation layer and returns focus to the list.
   */
  onSalvageConfirmCancel()
  {
    this.confirmationWindow().hide();
    this.confirmationWindow().deactivate();
    this.candidateWindow().activate();
  }

  /**
   * Forces preview regeneration after list mutations.
   */
  refreshPreviewFromSelection()
  {
    const item = this.candidateWindow().item();
    const stack = item ? $gameParty.numItems(item) : 0;

    // store  last preview datum on the instance for later reads.
    this.setLastPreviewDatum(item);
    this.setLastPreviewStack(stack);
    this.layoutSalvagePanels();
    this.previewWindow().setDatum(item);
  }
}

export default Scene_JaftingSalvage;

//endregion Scene_JaftingSalvage