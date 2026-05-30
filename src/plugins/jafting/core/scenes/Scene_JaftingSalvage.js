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

    // when switchId  equals  0, take this branch.
    if (switchId === 0)
    {
      return true;
    }

    // hand back $gameSwitches.value(switchId) to the caller.
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
    // policy step inside create background.
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

    // store  candidate window on the instance for later reads.
    this._candidateWindow = new Window_SalvageCandidateList(candidateRect);
    this._candidateWindow.setHandler('ok', this.onSalvageCandidateOk.bind(this));
    this._candidateWindow.setHandler('cancel', this.popScene.bind(this));

    // store  preview window on the instance for later reads.
    this._previewWindow = new Window_SalvagePreview(previewRect);

    // store  confirmation window on the instance for later reads.
    this._confirmationWindow = new Window_SalvageConfirmation(confirmRect);
    this._confirmationWindow.setHandler('confirm', this.onSalvageConfirmOk.bind(this));
    this._confirmationWindow.setHandler('cancel', this.onSalvageConfirmCancel.bind(this));

    // modal sits invisible until the player commits on the candidate list—mirrors refinement confirmation layering.
    this._confirmationWindow.hide();
    this._confirmationWindow.deactivate();

    // policy step inside create salvage windows.
    this.addWindow(this._candidateWindow);
    this.addWindow(this._previewWindow);
    this.addWindow(this._confirmationWindow);

    // policy step inside create salvage windows.
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

    // hand back { topY, bandH } to the caller.
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
    // capture list w for downstream policy in this routine.
    const listW = this.salvageCandidateListWidth();
    // seed from the old left rail—usually settles in one or two passes once the capped preview width is known.
    let listX = margin;

    // iterate the loop counter until the guard exits.
    for (let iter = 0; iter < 8; iter++)
    {
      const previewX = listX + listW + gapMid;
      const previewW = this.salvagePreviewBandWidth(previewX);
      // capture total w for downstream policy in this routine.
      const totalW = listW + gapMid + previewW;
      const idealX = Math.floor((Graphics.boxWidth - totalW) / 2);
      const maxLeft = Graphics.boxWidth - margin - totalW;
      const nextX = Math.max(margin, Math.min(idealX, maxLeft));

      // when nextX  equals  listX, take this branch.
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

      // policy step inside salvage cluster strip layout.
      listX = nextX;
    }

    // capture preview x for downstream policy in this routine.
    const previewX = listX + listW + gapMid;
    const previewW = this.salvagePreviewBandWidth(previewX);

    // hand back { to the caller.
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

    // policy step inside layout salvage panels.
    this._candidateWindow.move(listX, topY, listW, bandH);

    // capture preview for downstream policy in this routine.
    const preview = this._previewWindow;
    const item = this._candidateWindow.item();
    const n = JaftingSalvageManager.visibleExpandedRefundRowCount(item);
    const linesSingle = JaftingSalvageManager.layoutPreviewLineCountSingle(item);
    const linesTwo = JaftingSalvageManager.layoutPreviewLineCountTwoColumn(item);
    const desiredSingle = preview.fittingHeight(linesSingle);
    const desiredTwo = preview.fittingHeight(linesTwo);

    // capture use two col for downstream policy in this routine.
    let useTwoCol = false;

    // when desiredSingle > bandH  and  n > 1  and  desiredTwo <= bandH, take this branch.
    if (desiredSingle > bandH && n > 1 && desiredTwo <= bandH)
    {
      useTwoCol = true;
    }
    else if (desiredSingle > bandH && n > 1)
    {
      useTwoCol = true;
    }

    // policy step inside layout salvage panels.
    preview.setRefundTwoColumnMode(useTwoCol);
    preview.move(previewX, topY, previewW, bandH);
  }

  /**
   * @returns {Rectangle}
   */
  salvageCandidateWindowRect()
  {
    const s = this.salvageClusterStripLayout();

    // hand back new Rectangle(s.listX, s.topY, s.listW, s.bandH) to the caller.
    return new Rectangle(s.listX, s.topY, s.listW, s.bandH);
  }

  /**
   * @returns {Rectangle}
   */
  salvagePreviewWindowRect()
  {
    const s = this.salvageClusterStripLayout();

    // hand back new Rectangle(s.previewX, s.topY, s.previewW, s.bandH) to the caller.
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

    // hand back new Rectangle(x, y, width, height) to the caller.
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

    // when this._candidateWindow  and  this._candidateWindow.active, take this branch.
    if (this._candidateWindow && this._candidateWindow.active)
    {
      const item = this._candidateWindow.item();
      const stack = item ? $gameParty.numItems(item) : 0;

      // when item  differs from  this._lastPreviewDatum  or  stack  differs from  ..., take this branch.
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

    // when datum  equals  undefined  or  datum  equals  null, take this branch.
    if (datum === undefined || datum === null)
    {
      SoundManager.playBuzzer();

      // exit early without a payload.
      return;
    }

    // policy step inside on salvage candidate ok.
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

    // when datum  equals  undefined  or  datum  equals  null, take this branch.
    if (datum === undefined || datum === null)
    {
      SoundManager.playBuzzer();
      this.onSalvageConfirmCancel();

      // exit early without a payload.
      return;
    }

    // capture ok for downstream policy in this routine.
    const ok = JaftingSalvageManager.executeSalvage(datum, Scene_JaftingSalvage.DismantleBatchSize);

    // when ok  equals  false, take this branch.
    if (ok === false)
    {
      SoundManager.playBuzzer();
    }
    else
    {
      SoundManager.playUseItem();
    }

    // policy step inside on salvage confirm ok.
    this._candidateWindow.refresh();

    // policy step inside on salvage confirm ok.
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

    // store  last preview datum on the instance for later reads.
    this._lastPreviewDatum = item;
    this._lastPreviewStack = stack;
    this.layoutSalvagePanels();
    this._previewWindow.setDatum(item);
  }
}

export default Scene_JaftingSalvage;

//endregion Scene_JaftingSalvage