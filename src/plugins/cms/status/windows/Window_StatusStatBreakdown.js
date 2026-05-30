//region Window_StatusStatBreakdown
import StatusParameter from './../_models/StatusParameter.js';
import StatusHelper from './../helpers/StatusHelper.js';

/**
 * A read-only window that explains where a stat comes from.
 */
class Window_StatusStatBreakdown
  extends Window_Base
{
  /**
   * The various kinds of breakdowns we can draw.
   * @type {{Base: string, Ex: string, Special: string, Mtp: string, Crit: string, Custom: string}}
   */
  static KINDS = {
    Base: 'bparam',
    Ex: 'xparam',
    Special: 'sparam',
    Mtp: 'mtp',
    Crit: 'crit',
    Custom: 'custom',
  };

  /**
   * Constructor.
   * @param {Rectangle} rect The window rectangle.
   */
  constructor(rect)
  {
    super(rect);
    this.initMembers();
  }

  //region init
  initMembers()
  {
    if (!this._j) this._j = {};
    if (!this._j._cms_s) this._j._cms_s = {};
    if (!this._j._cms_s._status) this._j._cms_s._status = {};
    this._j._cms_s._status._breakdown = {
      _actor: null,
      _parameterKey: String.empty,
    };
  }

  //endregion init

  //region accessors
  /** @returns {Game_Actor} */
  getActor()
  {
    return this._j._cms_s._status._breakdown._actor;
  }

  /** @param {Game_Actor} v */
  setActor(v)
  {
    this._j._cms_s._status._breakdown._actor = v;
  }

  /** @returns {string} */
  getParameterKey()
  {
    return this._j._cms_s._status._breakdown._parameterKey;
  }

  /** @param {string} v */
  setParameterKey(v)
  {
    this._j._cms_s._status._breakdown._parameterKey = v;
  }

  //endregion accessors

  //region public api
  /**
   * Sets the context and refreshes the panel.
   * @param {Game_Actor} actor The actor.
   * @param {string} parameterKey The registry key.
   */
  setContext(actor, parameterKey)
  {
    this.setActor(actor);
    this.setParameterKey(parameterKey);
    this.refresh();
  }

  //endregion public api

  //region draw lifecycle
  lineHeight()
  {
    return 28;
  }

  refresh()
  {
    this.contents.clear();
    if (!this.getActor()) return;
    this.drawBreakdown();
  }

  //endregion draw lifecycle

  //region drawing (orchestration)
  /**
   * Orchestrates the breakdown drawing for the current stat, including
   * a two-line description beneath the header pulled from TextManager.
   */
  drawBreakdown()
  {
    // gather context.
    const actor = this.getActor();
    const parameterKey = this.getParameterKey();

    // header visuals.
    const name = TextManager.parameterLabel(parameterKey);
    const icon = IconManager.parameterIcon(parameterKey);
    const color = ColorManager.parameterColor(parameterKey);

    // final value mirrors Page 1 formatting.
    const finalValue = new StatusParameter(actor.parameter(parameterKey), parameterKey).prettyValue(false);

    // layout.
    const gutter = 16;
    const widthUsable = this.innerWidth - gutter;
    const headerX = 0;
    const headerY = 0;

    // draw the header (icon + name on the left, value on the right).
    this.changeTextColor(ColorManager.textColor(color));
    this.drawIcon(icon, headerX, headerY + 2);
    this.drawText(name, headerX + 36, headerY, widthUsable - 36, 'left');
    this.resetTextColor();
    this.drawText(finalValue, headerX, headerY, widthUsable, 'right');

    // draw the two-line description just under the header.
    const descriptionLines = TextManager.parameterDescription(parameterKey);

    // establish the starting y for descriptions (one row below the header).
    let cursorY = headerY + this.lineHeight();

    // draw the first description line.
    if (descriptionLines && descriptionLines.length >= 1)
    {
      this.drawText(descriptionLines[0], headerX, cursorY, widthUsable, 'left');
      cursorY += this.lineHeight();
    }

    // draw the second description line, if provided.
    if (descriptionLines && descriptionLines.length >= 2)
    {
      this.drawText(descriptionLines[1], headerX, cursorY, widthUsable, 'left');
      cursorY += this.lineHeight();
    }

    // add a small gap after the descriptions for readability.
    cursorY += 16;

    // resolve kind and draw body accordingly.
    const kind = this.resolveKind(parameterKey);

    switch (kind)
    {
      case Window_StatusStatBreakdown.KINDS.Base:
        this.drawBParamBreakdown(actor, ParameterKeys.bparamId(parameterKey), headerX, cursorY, widthUsable);
        break;
      case Window_StatusStatBreakdown.KINDS.Ex:
        this.drawXParamBreakdown(actor, ParameterKeys.xparamId(parameterKey), headerX, cursorY, widthUsable);
        break;
      case Window_StatusStatBreakdown.KINDS.Special:
        this.drawSParamBreakdown(actor, ParameterKeys.sparamId(parameterKey), headerX, cursorY, widthUsable);
        break;
      case Window_StatusStatBreakdown.KINDS.Mtp:
        this.drawMtpBreakdown(actor, headerX, cursorY, widthUsable);
        break;
      case Window_StatusStatBreakdown.KINDS.Crit:
        this.drawCritBreakdown(actor, parameterKey === 'cdm' ? 0 : 1, headerX, cursorY, widthUsable);
        break;
      case Window_StatusStatBreakdown.KINDS.Custom:
        this.drawCustomBreakdown(actor, parameterKey, headerX, cursorY, widthUsable);
        break;
      default:
        this.drawText('No breakdown available for this stat.', headerX, cursorY, widthUsable, 'left');
        break;
    }
  }

  //endregion drawing (orchestration)

  //region kind resolution
  /**
   * Resolves the kind from a registry parameter key.
   * @param {string} parameterKey The registry key.
   * @returns {string}
   */
  resolveKind(parameterKey)
  {
    if (parameterKey === 'mtp') return Window_StatusStatBreakdown.KINDS.Mtp;
    if (parameterKey === 'cdm' || parameterKey === 'cdr') return Window_StatusStatBreakdown.KINDS.Crit;
    if (ParameterKeys.bparamId(parameterKey) >= 0) return Window_StatusStatBreakdown.KINDS.Base;
    if (ParameterKeys.xparamId(parameterKey) >= 0) return Window_StatusStatBreakdown.KINDS.Ex;
    if (ParameterKeys.sparamId(parameterKey) >= 0) return Window_StatusStatBreakdown.KINDS.Special;
    return Window_StatusStatBreakdown.KINDS.Custom;
  }

  //endregion kind resolution

  //region drawing
  /**
   * Draws the b-param breakdown.
   * @param {Game_Actor} actor The actor driving this step.
   * @param {number} longId The long id driving this step.
   * @param {number} x The x driving this step.
   * @param {number} y The y driving this step.
   * @param {number} w The w driving this step.
   * @returns {number}
   */
  drawBParamBreakdown(actor, longId, x, y, w)
  {
    // Map longId directly to b-parameter id.
    const paramId = longId;

    // Derive the pre-NATURAL base using the NATURAL-only accessor.
    const baseNaturalOnly = actor.paramBaseNaturalBonuses(paramId);

    // Pull the base with NATURAL from the actor.
    const baseWithNatural = actor.paramBase(paramId);

    // Compute the vanilla (pre-NATURAL) base.
    const baseVanilla = baseWithNatural - baseNaturalOnly;

    // Read NATURAL Growth components.
    const natGrowthPlus = actor.bParamGrowthPlus(paramId);
    const natGrowthRate = actor.bParamGrowthRate(paramId);

    // Convert plus/rate pair into a concrete delta against the vanilla base.
    const natGrowthDeltaRaw = this.calcPlusRate(actor, baseVanilla, natGrowthPlus, natGrowthRate);
    const natGrowthDelta = Math.round(natGrowthDeltaRaw);

    // Read NATURAL Buff components.
    const natBuffPlus = actor.bParamBuffPlus(paramId);
    const natBuffRate = actor.bParamBuffRate(paramId);

    // Compute the concrete buff delta against the vanilla base.
    const natBuffDeltaRaw = this.calcPlusRate(actor, baseVanilla, natBuffPlus, natBuffRate);
    const natBuffDelta = Math.round(natBuffDeltaRaw);

    // NATURAL-inclusive base we’ll use as the baseline for flats/traits (Growths + Buffs).
    const baseNatural = baseVanilla + natGrowthDelta + natBuffDelta;

    // Flats by source (equips/states) from core param arrays.
    const equipFlat = this.sumEquipBParamFlat(actor, paramId);
    const stateFlat = this.sumStateBParamFlat(actor, paramId);

    // Trait multipliers by group.
    const trActor = this.paramRateFromTraits([ actor.actor() ], paramId);
    const trClass = this.paramRateFromTraits([ actor.currentClass() ], paramId);
    const trEquips = this.paramRateFromTraits(actor.equips()
      .filter(equip => !!equip), paramId);
    const trStates = this.paramRateFromTraits(actor.states(), paramId);

    // Multiply them together for a single product.
    const traitsProduct = trActor * trClass * trEquips * trStates;

    // Numeric baseline that traits will act upon.
    const preRateBase = baseNatural + (equipFlat + stateFlat);

    // Compute the absolute delta from traits.
    const traitsDelta = Math.round(preRateBase * (traitsProduct - 1.0));

    // SDP (Panels) — compute contribution and gather non-zero rows.
    const totalWithSdp = actor.param(paramId);
    const sdpCore = this._sdpCoreCoefficients(actor, paramId);
    const preSdpBase = this._solvePreSdpBaseCore(totalWithSdp, sdpCore.k, sdpCore.c);
    const rawPanelDeltas = this._computeSdpCorePanelDeltas(preSdpBase, sdpCore.panels);
    const sdpPanelDeltas = rawPanelDeltas.filter(p => p.delta !== 0);
    const sdpTotalDelta = sdpPanelDeltas.reduce((n, p) => n + p.delta, 0);

    // Begin drawing.
    let cursorY = y;

    // Base section (always shown). Include Growths/Buffs only if they contribute.
    const baseRows = [];
    baseRows.push({
      key: 'Base (Actor/Class)',
      value: baseVanilla
    });

    if (natGrowthPlus !== 0 || natGrowthRate !== 0 || natGrowthDelta !== 0)
    {
      const growthText = this.formatPlusRate(natGrowthPlus, natGrowthRate, natGrowthDelta);
      baseRows.push({
        key: '+ Natural (Growths)',
        value: growthText
      });
    }

    if (natBuffPlus !== 0 || natBuffRate !== 0 || natBuffDelta !== 0)
    {
      const buffText = this.formatPlusRate(natBuffPlus, natBuffRate, natBuffDelta);
      baseRows.push({
        key: '+ Natural (Buffs)',
        value: buffText
      });
    }

    // Append the row to the working collection.
    baseRows.push({
      key: '= Base (with NATURAL)',
      value: baseNatural
    });
    cursorY = this.drawSectionWithRows(x, cursorY, w, 'Base', baseRows);

    // Flats section (only if non-zero).
    const flatsRows = [];
    if (equipFlat !== 0) flatsRows.push({
      key: '+ Equips',
      value: equipFlat
    });
    if (stateFlat !== 0) flatsRows.push({
      key: '+ States',
      value: stateFlat
    });
    cursorY = this.drawSectionWithRows(x, cursorY, w, 'Flats', flatsRows);

    // Traits section (only non-neutral rows; include combined delta if non-zero).
    const traitsRows = [];
    if (trActor !== 1.0) traitsRows.push({
      key: '× Actor',
      value: StatusHelper.toRateString(trActor)
    });
    if (trClass !== 1.0) traitsRows.push({
      key: '× Class',
      value: StatusHelper.toRateString(trClass)
    });
    if (trEquips !== 1.0) traitsRows.push({
      key: '× Equips',
      value: StatusHelper.toRateString(trEquips)
    });
    if (trStates !== 1.0) traitsRows.push({
      key: '× States',
      value: StatusHelper.toRateString(trStates)
    });
    if (traitsDelta !== 0)
    {
      const sign = traitsDelta >= 0
        ? '+'
        : String.empty;
      traitsRows.push({
        key: '= Traits',
        value: `${sign}${traitsDelta}`
      });
    }
    cursorY = this.drawSectionWithRows(x, cursorY, w, 'Traits (×)', traitsRows);

    // SDP section (only if any non-zero panel rows contribute and net isn’t neutral).
    if (sdpTotalDelta !== 0 && sdpPanelDeltas.length > 0)
    {
      const totalSign = sdpTotalDelta >= 0
        ? '+'
        : String.empty;
      const totalText = `${totalSign}${sdpTotalDelta}`;
      cursorY = this.drawSdpPanelsSection(x, cursorY, w, totalText, sdpPanelDeltas);
    }

    // Final small separator before returning.
    return cursorY + 10;
  }

  /**
   * Draws the x-param breakdown.
   * @param {Game_Actor} actor The actor driving this step.
   * @param {number} xId The x id driving this step.
   * @param {number} x The x driving this step.
   * @param {number} y The y driving this step.
   * @param {number} w The w driving this step.
   * @returns {number}
   */
  drawXParamBreakdown(actor, xId, x, y, w)
  {
    // If HRG/MRG/TRG (ids 7/8/9), use the regen rendering pipeline.
    const isRegen = (xId === 7 || xId === 8 || xId === 9);

    // Delegate to the appropriate renderer to keep this method simple.
    if (isRegen)
    {
      return this._drawXParamBreakdownRegen(actor, xId, x, y, w);
    }

    return this._drawXParamBreakdownPercent(actor, xId, x, y, w);
  }

  /**
   * Renders the xparam breakdown for the three repurposed regen stats (HRG/MRG/TRG).
   * These use flat native units and are displayed as "per 5s" values for readability.
   * The section includes Baseline, Natural (growth), Natural (buffs), Traits (+), and SDP (Panels).
   * @param {Game_Actor} actor The actor whose regen xparam is being explained.
   * @param {number} xId The xparam id (7=HRG, 8=MRG, 9=TRG).
   * @param {number} x The x coordinate to start drawing.
   * @param {number} y The y coordinate to start drawing.
   * @param {number} w The width available to draw within.
   * @returns {number} The next y position after finishing this breakdown section.
   */
  _drawXParamBreakdownRegen(actor, xId, x, y, w)
  {
    // Gather the common xparam pieces (traits adds, NATURAL delta, total with SDP).
    const common = this._gatherXparamCommon(actor, xId);

    // Destructure the common pieces for readability.
    const addActorDec = common.adds.actor;   // editor decimal for traits
    const addClassDec = common.adds.class;   // editor decimal for traits
    const addEquipsDec = common.adds.equips; // editor decimal for traits
    const addStatesDec = common.adds.states; // editor decimal for traits
    const { natGrowthDelta } = common;       // should already be native from J.NATURAL
    const { totalWithSdp } = common;

    // Local helpers for regen display math.
    // - Traits come from editor decimals → convert to native by *100 before display.
    // - NATURAL deltas should be integer-native; if they slipped in as decimals (0<x<1), coerce to native by *100.
    const toNativeFromEditorDec = v => v * 100;
    const normalizeNaturalNative = n =>
    {
      if (n === 0) return 0;
      const abs = Math.abs(n);
      return abs < 1
        ? (n * 100)
        : n;
    };

    // Compute NATURAL Buffs as native flat delta (base 0.0 per JABS regen convention).
    const natBuffDeltaRaw = this.calcPlusRate(actor, 0.0, actor.xParamBuffPlus(xId), actor.xParamBuffRate(xId));

    // Normalize growth/buff deltas into integer-native space if they came in as editor decimals.
    const natGrowthDeltaNative = normalizeNaturalNative(natGrowthDelta);
    const natBuffDeltaNative = normalizeNaturalNative(natBuffDeltaRaw);

    // Compute SDP for regen (flats = native units, percents = decimal).
    const rSdp = this._computeNonCoreSdpContributionRegen(actor, xId, 8, totalWithSdp);
    const { sdpPanelDeltas } = rSdp;
    const sdpTotalFlat = rSdp.sdpTotal;

    // Begin drawing regen layout.
    let cursorY = y;

    // Baseline section: explicit “per 5s” labeling and a 0 baseline.
    cursorY = this.drawSectionTitle(x, cursorY, w, 'Baseline');
    this.drawKeyValue(x + 12, cursorY, w - 12, 'Baseline', this.formatPerFiveFlat(0), 'left');
    cursorY += this.lineHeight() + 6;

    // Natural (Growths): only if non-zero. Show delta as flat-per-5s.
    if (natGrowthDeltaNative !== 0)
    {
      cursorY = this.drawSectionTitle(x, cursorY, w, 'Natural');
      const growthText = this.formatPlusRatePerFive(natGrowthDeltaNative, actor.xParamGrowthRate(xId));
      this.drawKeyValue(x + 12, cursorY, w - 12, '+ Natural (Growths)', growthText, 'left');
      cursorY += this.lineHeight() + 6;
    }

    // Natural (Buffs): only if non-zero. Show delta as flat-per-5s.
    if (natBuffDeltaNative !== 0)
    {
      const buffText = this.formatSignedFlatPerFive(natBuffDeltaNative);
      this.drawKeyValue(x + 12, cursorY, w - 12, '+ Natural (Buffs)', buffText, 'left');
      cursorY += this.lineHeight() + 6;
    }

    // Traits (+) section: convert editor decimals to native (*100) and draw per‑5s.
    const traitRows = [
      {
        key: '+ Actor',
        valueNative: toNativeFromEditorDec(addActorDec)
      },
      {
        key: '+ Class',
        valueNative: toNativeFromEditorDec(addClassDec)
      },
      {
        key: '+ Equips',
        valueNative: toNativeFromEditorDec(addEquipsDec)
      },
      {
        key: '+ States',
        valueNative: toNativeFromEditorDec(addStatesDec)
      },
    ]
      .filter(r => r.valueNative !== 0)
      .map(r => ({
        key: r.key,
        value: this.formatPerFiveFlat(r.valueNative)
      }));

    cursorY = this.drawSectionWithRows(x, cursorY, w, 'Traits (+)', traitRows);

    // SDP (Panels) for regen — draw in flat-per-5s terms.
    if (sdpPanelDeltas.length > 0 && sdpTotalFlat !== 0)
    {
      const totalText = this.formatSignedFlatPerFive(sdpTotalFlat);
      cursorY = this.drawSdpPanelsFlatPerFiveSection(x, cursorY, w, totalText, sdpPanelDeltas);
    }

    // Return small tailing gap.
    return cursorY + 10;
  }

  /**
   * Renders the xparam breakdown for standard percent-based xparams.
   * These are displayed in percent space (e.g., +4.0%).
   * The section includes Baseline, Natural (growths), Natural (buffs), Traits (+), and SDP (Panels).
   * @param {Game_Actor} actor The actor whose xparam is being explained.
   * @param {number} xId The xparam id (0..9), excluding the regen ids 7/8/9.
   * @param {number} x The x coordinate to start drawing.
   * @param {number} y The y coordinate to start drawing.
   * @param {number} w The width available to draw within.
   * @returns {number} The next y position after finishing this breakdown section.
   */
  _drawXParamBreakdownPercent(actor, xId, x, y, w)
  {
    // Gather the common xparam pieces (traits adds, NATURAL delta, total with SDP).
    const common = this._gatherXparamCommon(actor, xId);

    // Destructure the common pieces for readability.
    const addActor = common.adds.actor;
    const addClass = common.adds.class;
    const addEquips = common.adds.equips;
    const addStates = common.adds.states;
    const { natGrowthDelta } = common;
    const { totalWithSdp } = common;

    // NATURAL Buffs as decimal delta around 0.0 baseline.
    const natBuffDeltaDec = this.calcPlusRate(actor, 0.0, actor.xParamBuffPlus(xId), actor.xParamBuffRate(xId));

    // SDP (non-core; idExtra = 8) — compute deltas and total via shared helper.
    const xSdp = this._computeNonCoreSdpContribution(actor, xId, 8, totalWithSdp);
    const { sdpPanelDeltas } = xSdp;
    const { sdpTotal } = xSdp;

    // Baseline section (always draw for orientation).
    let cursorY = y;
    cursorY = this.drawSectionTitle(x, cursorY, w, 'Baseline');
    this.drawKeyValue(x + 12, cursorY, w - 12, 'Baseline', StatusHelper.toPercentString(0, false), 'left');
    cursorY += this.lineHeight() + 6;

    // Natural (Growths): only if non-zero.
    if (natGrowthDelta !== 0)
    {
      cursorY = this.drawSectionTitle(x, cursorY, w, 'Natural');
      this.drawKeyValue(
        x + 12,
        cursorY,
        w - 12,
        '+ Natural (Growths)',
        StatusHelper.toPercentString(natGrowthDelta * 100, true),
        'left'
      );
      cursorY += this.lineHeight() + 6;
    }

    // Natural (Buffs): only if non-zero.
    if (natBuffDeltaDec !== 0)
    {
      this.drawKeyValue(
        x + 12,
        cursorY,
        w - 12,
        '+ Natural (Buffs)',
        StatusHelper.toPercentString(natBuffDeltaDec * 100, true),
        'left'
      );
      cursorY += this.lineHeight() + 6;
    }

    // Traits (+) section (data-driven rows, formatted as percents).
    const traitRows = [
      {
        key: '+ Actor',
        value: addActor
      },
      {
        key: '+ Class',
        value: addClass
      },
      {
        key: '+ Equips',
        value: addEquips
      },
      {
        key: '+ States',
        value: addStates
      },
    ].filter(r => r.value !== 0.0)
      .map(r => ({
        key: r.key,
        value: StatusHelper.toPercentString(r.value * 100, true)
      }));

    cursorY = this.drawSectionWithRows(x, cursorY, w, 'Traits (+)', traitRows);

    // SDP (Panels) for xparams — omit if total is 0 or no non-zero panels; use helper.
    if (sdpTotal !== 0 && sdpPanelDeltas.length > 0)
    {
      const totalText = StatusHelper.toPercentString(sdpTotal * 100, true);
      cursorY = this.drawSdpPanelsPercentSection(x, cursorY, w, totalText, sdpPanelDeltas);
    }

    // Return small tailing gap.
    return cursorY + 10;
  }

  /* eslint-disable max-len */
  /**
   * Gathers the common xparam inputs used by both regen and percent renderers.
   * Returns trait adds by source, the NATURAL delta against a 0.0 base, and the
   * post-SDP total (for solving SDP pre-base in the caller).
   * @param {Game_Actor} actor The actor.
   * @param {number} xId The xparam id (0..9).
   * @returns {{ adds:{actor:number,class:number,equips:number,states:number}, natGrowthDelta:number, totalWithSdp:number }}
   */

  /* eslint-enable max-len */
  _gatherXparamCommon(actor, xId)
  {
    // Aggregate trait adds for each source group.
    const addActor = this.xparamAddFromTraits([ actor.actor() ], xId);
    const addClass = this.xparamAddFromTraits([ actor.currentClass() ], xId);
    const addEquips = this.xparamAddFromTraits(actor.equips()
      .filter(e => !!e), xId);
    const addStates = this.xparamAddFromTraits(actor.states(), xId);

    // Compute NATURAL delta on the 0.0 baseline (plus/rate → concrete delta).
    const natGrowthDelta = this.calcPlusRate(actor, 0.0, actor.xParamGrowthPlus(xId), actor.xParamGrowthRate(xId));

    // Read the total including SDP for this xparam.
    const totalWithSdp = actor.xparam(xId);

    // Return the composed bundle for callers.
    return {
      adds: {
        actor: addActor,
        class: addClass,
        equips: addEquips,
        states: addStates,
      },
      natGrowthDelta,
      totalWithSdp,
    };
  }

  /**
   * Draws the s-param breakdown.
   * @param {Game_Actor} actor The actor driving this step.
   * @param {number} sId The s id driving this step.
   * @param {number} x The x driving this step.
   * @param {number} y The y driving this step.
   * @param {number} w The w driving this step.
   * @returns {number}
   */
  drawSParamBreakdown(actor, sId, x, y, w)
  {
    // trait multipliers by group (omit neutral later).
    const rActor = this.sparamRateFromTraits([ actor.actor() ], sId);
    const rClass = this.sparamRateFromTraits([ actor.currentClass() ], sId);
    const rEquips = this.sparamRateFromTraits(actor.equips()
      .filter(equip => !!equip), sId);
    const rStates = this.sparamRateFromTraits(actor.states(), sId);

    // NATURAL Growth as multiplier around baseline 1.0 (rate only previously shown).
    const natGrowthPlus = actor.sParamGrowthPlus(sId);
    const natGrowthRate = actor.sParamGrowthRate(sId);

    // Compute growth delta in percent-points using the NATURAL calculator and a 1.0 base.
    const growthDeltaPct = actor.calculatePlusRate(1.0, natGrowthPlus, natGrowthRate);

    // NATURAL Buffs: compute buff delta in percent-points against 1.0 base as well.
    const natBuffPlus = actor.sParamBuffPlus(sId);
    const natBuffRate = actor.sParamBuffRate(sId);
    const buffDeltaPct = actor.calculatePlusRate(1.0, natBuffPlus, natBuffRate);

    // Compose a product for summary delta (only if anything changes) using trait multipliers and growth as multiplier.
    const natGrowthMult = (natGrowthRate + 100) / 100;
    const product = rActor * rClass * rEquips * rStates * natGrowthMult;
    const deltaPct = (product - 1.0) * 100;

    // SDP (non-core; idExtra = 18) — compute deltas and total via shared helper.
    const totalWithSdp = actor.sparam(sId);
    const sSdp = this._computeNonCoreSdpContribution(actor, sId, 18, totalWithSdp);
    const { sdpPanelDeltas } = sSdp;
    const sdpTotalDec = sSdp.sdpTotal; // decimal space (ex: 0.03 = +3%)

    // Baseline (always draw for orientation).
    let cursorY = y;
    cursorY = this.drawSectionTitle(x, cursorY, w, 'Baseline');
    this.drawKeyValue(x + 12, cursorY, w - 12, 'Baseline', StatusHelper.toRateString(1.0), 'left');
    cursorY += this.lineHeight() + 6;

    // Natural (Growths): show if non-zero.
    if (natGrowthPlus !== 0 || natGrowthRate !== 0 || growthDeltaPct !== 0)
    {
      this.drawKeyValue(
        x + 12,
        cursorY,
        w - 12,
        '+ Natural (Growths)',
        StatusHelper.toPercentString(growthDeltaPct, true),
        'left'
      );
      cursorY += this.lineHeight() + 6;
    }

    // Natural (Buffs): show if non-zero.
    if (natBuffPlus !== 0 || natBuffRate !== 0 || buffDeltaPct !== 0)
    {
      this.drawKeyValue(
        x + 12,
        cursorY,
        w - 12,
        '+ Natural (Buffs)',
        StatusHelper.toPercentString(buffDeltaPct, true),
        'left'
      );
      cursorY += this.lineHeight() + 6;
    }

    // Traits (×) section (omit neutral rows; omit entire section if no rows and no net delta).
    const showActor = rActor !== 1.0;
    const showClass = rClass !== 1.0;
    const showEquips = rEquips !== 1.0;
    const showStates = rStates !== 1.0;
    const anyTraits = showActor || showClass || showEquips || showStates;

    if (anyTraits)
    {
      cursorY = this.drawSectionTitle(x, cursorY, w, 'Traits (×)');

      if (showActor)
      {
        this.drawKeyValue(x + 12, cursorY, w - 12, '× Actor', StatusHelper.toRateString(rActor), 'left');
        cursorY += this.lineHeight();
      }

      if (showClass)
      {
        this.drawKeyValue(x + 12, cursorY, w - 12, '× Class', StatusHelper.toRateString(rClass), 'left');
        cursorY += this.lineHeight();
      }

      if (showEquips)
      {
        this.drawKeyValue(x + 12, cursorY, w - 12, '× Equips', StatusHelper.toRateString(rEquips), 'left');
        cursorY += this.lineHeight();
      }

      if (showStates)
      {
        this.drawKeyValue(x + 12, cursorY, w - 12, '× States', StatusHelper.toRateString(rStates), 'left');
        cursorY += this.lineHeight();
      }

      // show a composed delta only if non-neutral overall.
      if (deltaPct !== 0)
      {
        this.drawKeyValue(x + 12, cursorY, w - 12, '= Total', StatusHelper.toPercentString(deltaPct, true), 'left');
        cursorY += this.lineHeight();
      }

      cursorY += 6;
    }

    // SDP (Panels) for sparams — use percent helper to avoid duplication.
    const anySdp = sdpTotalDec !== 0 && sdpPanelDeltas.length > 0;
    if (anySdp)
    {
      const totalText = StatusHelper.toPercentString(sdpTotalDec * 100, true);
      cursorY = this.drawSdpPanelsPercentSection(x, cursorY, w, totalText, sdpPanelDeltas);
    }

    // Return small tailing gap.
    return cursorY + 10;
  }

  /**
   * Draws the max tp breakdown.
   * @param {Game_Actor} actor The actor driving this step.
   * @param {number} x The x driving this step.
   * @param {number} y The y driving this step.
   * @param {number} w The w driving this step.
   * @returns {number}
   */
  drawMtpBreakdown(actor, x, y, w)
  {
    // base and natural pieces for Max TP.
    const baseMaxTp = actor.getBaseMaxTp();

    // Growths (permanent).
    const natGrowthPlus = actor.maxTpGrowthPlus();
    const natGrowthRate = actor.maxTpGrowthRate();
    const growthDeltaRaw = this.calcPlusRate(actor, baseMaxTp, natGrowthPlus, natGrowthRate);
    const growthDelta = Math.round(growthDeltaRaw);

    // Buffs (temporary while equipped/stated/etc.).
    const natBuffPlus = actor.maxTpBuffPlus
      ? actor.maxTpBuffPlus()
      : 0;
    const natBuffRate = actor.maxTpBuffRate
      ? actor.maxTpBuffRate()
      : 0;
    const buffDeltaRaw = this.calcPlusRate(actor, baseMaxTp, natBuffPlus, natBuffRate);
    const buffDelta = Math.round(buffDeltaRaw);

    // SDP (Panels) for Max TP (id = 30); filter to non-zero rows.
    const totalWithSdp = actor.maxTp();
    const sdp = this._sdpCoreCoefficients(actor, 30);
    const preSdpBase = this._solvePreSdpBaseCore(totalWithSdp, sdp.k, sdp.c);
    const rawPanelDeltas = this._computeSdpCorePanelDeltas(preSdpBase, sdp.panels);
    const sdpPanelDeltas = rawPanelDeltas.filter(p => p.delta !== 0);
    const sdpTotal = sdpPanelDeltas.reduce((n, p) => n + p.delta, 0);

    // draw Base (always); show Growths/Buffs only if they contribute.
    let cursorY = y;
    cursorY = this.drawSectionTitle(x, cursorY, w, 'Base');
    this.drawKeyValue(x + 12, cursorY, w - 12, 'Base (Actor/Class)', baseMaxTp, 'left');
    cursorY += this.lineHeight();

    if (natGrowthPlus !== 0 || natGrowthRate !== 0 || growthDelta !== 0)
    {
      const growthText = this.formatPlusRate(natGrowthPlus, natGrowthRate, growthDelta);
      this.drawKeyValue(x + 12, cursorY, w - 12, '+ Natural (Growths)', growthText, 'left');
      cursorY += this.lineHeight();
    }

    if (natBuffPlus !== 0 || natBuffRate !== 0 || buffDelta !== 0)
    {
      const buffText = this.formatPlusRate(natBuffPlus, natBuffRate, buffDelta);
      this.drawKeyValue(x + 12, cursorY, w - 12, '+ Natural (Buffs)', buffText, 'left');
      cursorY += this.lineHeight();
    }

    cursorY += 6;

    // SDP (Panels) for Max TP — use helper to avoid duplication.
    const anySdp = sdpTotal !== 0 && sdpPanelDeltas.length > 0;
    if (anySdp)
    {
      const totalSign = sdpTotal >= 0
        ? '+'
        : String.empty;
      const totalText = `${totalSign}${sdpTotal}`;
      cursorY = this.drawSdpPanelsSection(x, cursorY, w, totalText, sdpPanelDeltas);
    }

    // Return small tailing gap.
    return cursorY + 10;
  }

  /**
   * Draws the crit breakdown (28 = Crit Amp, 29 = Crit Block).
   * @param {Game_Actor} actor The actor.
   * @param {number} critId 0 for amp (28), 1 for block (29).
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   * @param {number} w The width available.
   * @returns {number}
   */
  drawCritBreakdown(actor, critId, x, y, w)
  {
    // resolve which param functions to use.
    const isAmp = critId === 0;

    // base factors (decimal space: 0.25 => 25%).
    const base = isAmp
      ? actor.baseCriticalMultiplier()
      : actor.baseCriticalReduction();

    // additive sources in percent space (ex: 15 => +15%).
    const notes = isAmp
      ? actor.getCriticalDamageMultiplier()
      : actor.getCriticalDamageReduction();

    // total including SDP (decimal space) for solving panel deltas later.
    const totalWithSdp = isAmp
      ? actor.criticalDamageMultiplier()
      : actor.criticalDamageReduction();

    // SDP (non-core; idExtra = 28) — compute deltas and total via shared helper.
    const cSdp = this._computeNonCoreSdpContribution(actor, critId, 28, totalWithSdp);
    const { sdpPanelDeltas } = cSdp;
    const sdpTotalDec = cSdp.sdpTotal; // decimal space

    // draw sections.
    let cursorY = y;

    // Baseline (always draw) — show base as percent.
    cursorY = this.drawSectionTitle(x, cursorY, w, 'Baseline');
    this.drawKeyValue(x + 12, cursorY, w - 12, 'Baseline', StatusHelper.toPercentString(base * 100, false), 'left');
    cursorY += this.lineHeight() + 6;

    // Growth inputs (percent space: points, not decimals).
    const growthPlus = isAmp
      ? actor.cdmPlus()
      : actor.cdrPlus();
    const growthRate = isAmp
      ? actor.cdmRate()
      : actor.cdrRate();

    // Solve the delta against the base.
    const growthDelta = actor.calculatePlusRate(base, growthPlus, growthRate);

    // Only draw if something contributes.
    if (growthPlus !== 0 || growthRate !== 0 || growthDelta !== 0)
    {
      console.log('growthPlus', growthPlus);
      console.log('growthRate', growthRate);
      console.log('growthDelta', growthDelta);
      cursorY = this.drawSectionTitle(x, cursorY, w, 'Natural');
      const growthText = this.formatPlusRatePercent(growthPlus, growthRate, growthDelta);
      this.drawKeyValue(x + 12, cursorY, w - 12, '+ Natural (Growths)', growthText, 'left');
      cursorY += this.lineHeight() + 6;
    }

    // Gather raw buff inputs from notes (percent points), then solve.
    const notesSources = actor.getAllNotes();

    // Buff plus/rate regex per mode.
    const buffPlusRegex = isAmp
      ? J.CRIT.RegExp.CritDamageMultiplierBuffPlus
      : J.CRIT.RegExp.CritDamageReductionBuffPlus;
    const buffPlusSum = RPGManager.getSumFromAllNotesByRegex(notesSources, buffPlusRegex);

    const buffRateRegex = isAmp
      ? J.CRIT.RegExp.CritDamageMultiplierBuffRate
      : J.CRIT.RegExp.CritDamageReductionBuffRate;
    const buffRateSum = RPGManager.getSumFromAllNotesByRegex(notesSources, buffRateRegex);

    // Solve the delta against the base.
    const buffDelta = actor.calculatePlusRate(base, buffPlusSum, buffRateSum);

    // Only draw if something contributes.
    if (buffPlusSum !== 0 || buffRateSum !== 0 || buffDelta !== 0)
    {
      const buffText = this.formatPlusRatePercent(buffPlusSum, buffRateSum, buffDelta);
      this.drawKeyValue(x + 12, cursorY, w - 12, '+ Natural (Buffs)', buffText, 'left');
      cursorY += this.lineHeight() + 6;
    }

    // Notes (only if any contribution).
    if (notes !== 0)
    {
      cursorY = this.drawSectionTitle(x, cursorY, w, 'Notes');
      this.drawKeyValue(
        x + 12,
        cursorY,
        w - 12,
        '+ Notes',
        StatusHelper.toPercentString(notes, true),
        'left'
      );
      cursorY += this.lineHeight() + 6;
    }

    // SDP (Panels) — use percent helper to avoid duplication.
    if (sdpPanelDeltas.length > 0 && sdpTotalDec !== 0)
    {
      const totalText = StatusHelper.toPercentString(sdpTotalDec * 100, true);
      cursorY = this.drawSdpPanelsPercentSection(x, cursorY, w, totalText, sdpPanelDeltas);
    }

    // small tailing gap.
    return cursorY + 10;
  }

  /**
   * Draws a breakdown for custom long parameters that don’t fit the base/x/s/crit/mtp families.
   * Currently supported custom params:
   * - 31: Move Speed Boost (MSB)
   * - 32: Skill Proficiency Boost (SPB)
   * - 33: SDP Multiplier Bonus (SMB)
   * @param {Game_Actor} actor The actor whose stat is being explained.
   * @param {string} parameterKey The registry key to render.
   * @param {number} x The x coordinate to start drawing.
   * @param {number} y The y coordinate to start drawing.
   * @param {number} w The width available to draw within.
   * @returns {number} The next y position after finishing this section.
   */
  drawCustomBreakdown(actor, parameterKey, x, y, w)
  {
    // Dispatch to the appropriate custom renderer.
    if (parameterKey === 'msb')
    {
      return this._drawMsbBreakdown(actor, x, y, w);
    }
    if (parameterKey === 'prof')
    {
      return this._drawSpbBreakdown(actor, x, y, w);
    }
    if (parameterKey === 'sdr')
    {
      return this._drawSmbBreakdown(actor, x, y, w);
    }

    // Fallback if an unknown custom id sneaks in.
    return this.drawSectionWithRows(x, y, w, 'Details', [
      {
        key: 'Info',
        value: 'No breakdown available for this custom stat.'
      },
    ]);
  }

  //endregion drawing

  //region helpers (SDP)
  /**
   * Builds SDP percent (k) and flat (c) coefficients for core params (incl. MTP=30),
   * and collects per-panel rows including icon and rarity.
   * @param {Game_Actor} actor The actor.
   * @param {number} paramId The core param id (0..7) or 30 for MTP.
   * @returns {{k:number,c:number,panels:Array}}
   */
  _sdpCoreCoefficients(actor, paramId)
  {
    // initialize and iterate ranked panels.
    let k = 0.0;
    let c = 0;
    const rows = [];

    // get all ranked panels for this actor.
    const rankings = actor.getAllSdpRankings();

    // iterate all rankings to accumulate coefficients.
    rankings.forEach(ranking =>
    {
      // get the panel metadata for this ranking.
      const panel = J.SDP.Metadata.panelsMap.get(ranking.key);

      // if the panel doesn't exist, skip it.
      if (!panel) return;

      // fetch all parameters for this panel that affect the target param id.
      const parameterKey = ParameterKeys.bparamKey(paramId);
      const panelParams = panel.getPanelParameterByKey(parameterKey);

      // if the panel has no relevant parameters, skip it.
      if (!panelParams.length) return;

      // iterate each parameter entry from the panel.
      panelParams.forEach(pp =>
      {
        // extract panel visuals.
        const { name } = panel;
        const { iconIndex } = panel;
        const { rarity } = panel;

        // extract parameter data.
        const { isFlat } = pp;
        const { perRank } = pp;
        const curRank = ranking.currentRank;

        // if flat, accumulate the flat amount per current rank.
        if (isFlat)
        {
          const flat = curRank * perRank;
          c += flat;
          rows.push({
            name,
            iconIndex,
            rarity,
            isFlat: true,
            amount: flat
          });
        }
        // if rate, accumulate the percent coefficient as decimal.
        else
        {
          const pct = (curRank * perRank) / 100;
          k += pct;
          rows.push({
            name,
            iconIndex,
            rarity,
            isFlat: false,
            amount: pct
          });
        }
      });
    });

    // return the combined coefficients and detailed rows.
    return {
      k,
      c,
      panels: rows
    };
  }

  /**
   * Computes each core panel's exact delta against the pre‑SDP base.
   * Floors percent pieces to match J.SDP’s behavior for core params.
   * Carries icon/rarity for rendering.
   * @param {number} basePreSdp The pre-SDP base value.
   * @param {Array} rows The rows from _sdpCoreCoefficients().
   * @returns {{name:string,delta:number,iconIndex:number,rarity:number}[]}
   */
  _computeSdpCorePanelDeltas(basePreSdp, rows)
  {
    // initialize output collection.
    const deltas = [];

    // for each row, compute its concrete delta value.
    rows.forEach(row =>
    {
      // extract visuals and data.
      const { name } = row;
      const { iconIndex } = row;
      const { rarity } = row;

      // declare the delta for this row.
      let delta;

      // optional percent rate for percent‑type rows (decimal; ex: 0.05 for +5%).
      let rateDec = 0;

      // if the row is flat, the delta is the flat amount.
      if (row.isFlat)
      {
        delta = row.amount;
      }
      // if the row is percent, floor product to match in‑plugin math.
      else
      {
        const pct = row.amount; // decimal rate
        delta = Math.floor(basePreSdp * pct);

        // carry the decimal rate for display (e.g., “+5% (+63)”).
        rateDec = pct;
      }

      // add the computed row for rendering.
      deltas.push({
        name,
        delta,
        iconIndex,
        rarity,
        // include rateDec only when non‑zero to keep objects light.
        ...(rateDec !== 0
          ? { rateDec }
          : {}),
      });
    });

    // return the collection of panel deltas.
    return deltas;
  }

  /**
   * Builds SDP coefficients for non-core params (x/s) using an id offset.
   * Includes icon and rarity for rendering.
   * For xparams use idExtra=8, for sparams use idExtra=18.
   * @param {Game_Actor} actor The actor.
   * @param {number} subId The x/s id (0..9).
   * @param {number} idExtra The offset into panel parameter ids.
   * @returns {{k:number,c:number,panels:Array}}
   */
  _sdpNonCoreCoefficients(actor, subId, idExtra)
  {
    // initialize coefficients and rows.
    let k = 0.0;
    let c = 0.0; // flats for non-core are stored as decimal (value/100)
    const rows = [];

    // get all ranked panels for this actor.
    const rankings = actor.getAllSdpRankings();

    // iterate rankings to accumulate coefficients.
    rankings.forEach(ranking =>
    {
      // get panel metadata for this ranking.
      const panel = J.SDP.Metadata.panelsMap.get(ranking.key);

      // if panel doesn’t exist, skip it.
      if (!panel) return;

      // fetch panel parameters for this non-core id (offset by idExtra).
      const parameterKey = ParameterKeys.legacyLongParamKey(subId + idExtra);
      const panelParams = panel.getPanelParameterByKey(parameterKey);

      // if no relevant parameters, skip.
      if (!panelParams.length) return;

      // iterate each parameter entry.
      panelParams.forEach(pp =>
      {
        // extract panel visuals and parameter data.
        const { name } = panel;
        const iconIndex = panel.iconIndex | 0;  // guarantee a concrete icon index
        const rarity = panel.getPanelRarityColorIndex();
        const { isFlat } = pp;
        const { perRank } = pp;
        const curRank = ranking.currentRank;

        // if flat, store as decimal add.
        if (isFlat)
        {
          const add = (curRank * perRank) / 100; // percent-as-decimal
          c += add;
          rows.push({
            name,
            iconIndex,
            rarity,
            isFlat: true,
            amount: add
          });
        }
        // if percent, accumulate as decimal rate.
        else
        {
          const pct = (curRank * perRank) / 100;
          k += pct;
          rows.push({
            name,
            iconIndex,
            rarity,
            isFlat: false,
            amount: pct
          });
        }
      });
    });

    // return the combined coefficients and rows.
    return {
      k,
      c,
      panels: rows
    };
  }

  /**
   * Builds SDP coefficients for regen xparams (7/8/9) using id offset 8.
   * Flats are native units (not divided by 100). Percents remain decimal.
   * @param {Game_Actor} actor The actor.
   * @param {number} subId The xparam id (7,8,9).
   * @param {number} idExtra The offset (8 for xparams).
   * @returns {{k:number,c:number,panels:Array}}
   */
  _sdpNonCoreCoefficientsRegen(actor, subId, idExtra)
  {
    // initialize coefficients and rows.
    let k = 0.0;
    let c = 0.0; // flats in native units
    const rows = [];

    // get all ranked panels for this actor.
    const rankings = actor.getAllSdpRankings();

    // iterate rankings to accumulate coefficients.
    rankings.forEach(ranking =>
    {
      // get panel metadata for this ranking.
      const panel = J.SDP.Metadata.panelsMap.get(ranking.key);

      // if panel doesn’t exist, skip it.
      if (!panel) return;

      // fetch panel parameters for this regen sub-id.
      const parameterKey = ParameterKeys.legacyLongParamKey(subId + idExtra);
      const panelParams = panel.getPanelParameterByKey(parameterKey);

      // if no relevant parameters, skip.
      if (!panelParams.length) return;

      // iterate each parameter entry.
      panelParams.forEach(pp =>
      {
        // visuals and data.
        const { name } = panel;
        const iconIndex = panel.iconIndex | 0;
        const rarity = panel.getPanelRarityColorIndex();
        const { isFlat } = pp;
        const { perRank } = pp;
        const curRank = ranking.currentRank;

        // if flat, keep native units (no /100). Example: +3 regen per 5s is represented natively.
        if (isFlat)
        {
          const add = (curRank * perRank);
          c += add;
          rows.push({
            name,
            iconIndex,
            rarity,
            isFlat: true,
            amount: add
          });
        }
        // if percent, accumulate as decimal multiplier.
        else
        {
          const pct = (curRank * perRank) / 100;
          k += pct;
          rows.push({
            name,
            iconIndex,
            rarity,
            isFlat: false,
            amount: pct
          });
        }
      });
    });

    // return combined coefficients and rows.
    return {
      k,
      c,
      panels: rows
    };
  }

  /**
   * Computes the regen (HRG/MRG/TRG) SDP contribution in native flat units.
   * @param {Game_Actor} actor The actor.
   * @param {number} subId The xparam id (7,8,9).
   * @param {number} idExtra The offset (8 for xparams).
   * @param {number} totalWithSdp The final value including SDP (native units).
   * @returns {{ sdpPanelDeltas: {name:string,delta:number,iconIndex:number,rarity:number}[], sdpTotal: number }}
   */
  _computeNonCoreSdpContributionRegen(actor, subId, idExtra, totalWithSdp)
  {
    // Build regen-specific coefficients for this sub-stat.
    const sdp = this._sdpNonCoreCoefficientsRegen(actor, subId, idExtra);

    // Solve the pre-SDP base using T = B*(1+K) + C (all native units).
    const preSdpBase = this._solvePreSdpBaseNonCore(totalWithSdp, sdp.k, sdp.c);

    // Compute individual panel deltas using the shared non-core implementation.
    const rawPanelDeltas = this._computeSdpNonCorePanelDeltas(preSdpBase, sdp.panels);

    // Filter to only non-zero contributions for rendering.
    const sdpPanelDeltas = rawPanelDeltas.filter(p => p.delta !== 0);

    // Sum the native flat deltas for a net total.
    const sdpTotal = sdpPanelDeltas.reduce((n, p) => n + p.delta, 0);

    // Return both detailed rows and the net total.
    return {
      sdpPanelDeltas,
      sdpTotal
    };
  }

  /**
   * Computes each non-core panel's exact delta against a pre‑SDP base (no floors).
   * Returns icon/rarity for rendering.
   * @param {number} basePreSdp The pre-SDP base value (x/s param before SDP).
   * @param {Array} rows The rows from _sdpNonCoreCoefficients().
   * @returns {{name:string,delta:number,iconIndex:number,rarity:number}[]}
   */
  _computeSdpNonCorePanelDeltas(basePreSdp, rows)
  {
    // initialize output.
    const deltas = [];

    // compute deltas for all rows.
    rows.forEach(row =>
    {
      // extract visuals.
      const { name } = row;
      const iconIndex = row.iconIndex | 0;
      const rarity = row.rarity | 0;

      // declare delta and optional decimal rate.
      let delta;
      let rateDec = 0;

      // if flat, delta is the flat amount in the caller’s native space.
      if (row.isFlat)
      {
        delta = row.amount;
      }
      // if rate, multiply the base by the rate (no floor for non-core stats).
      else
      {
        const pct = row.amount; // decimal rate
        delta = basePreSdp * pct;
        rateDec = pct;
      }

      // store computed row with visuals (and percent when relevant).
      deltas.push({
        name,
        delta,
        iconIndex,
        rarity,
        ...(rateDec !== 0
          ? { rateDec }
          : {}),
      });
    });

    // return rows with visuals for drawing.
    return deltas;
  }

  /**
   * Computes the non-core SDP contribution for a given subId/offset and total.
   * Returns both the filtered per-panel rows and the net decimal total.
   * Example: a return total of 0.04 represents +4%.
   * @param {Game_Actor} actor The actor.
   * @param {number} subId The x/s/crit sub-id (x:0..9, s:0..9, crit:0..1).
   * @param {number} idExtra The offset to map into panel parameter ids (x:+8, s:+18, crit:+28).
   * @param {number} totalWithSdp The final value including SDP.
   * @returns {{ sdpPanelDeltas: {name:string,delta:number,iconIndex:number,rarity:number}[], sdpTotal: number }}
   */
  _computeNonCoreSdpContribution(actor, subId, idExtra, totalWithSdp)
  {
    // Build non-core coefficients for this sub-stat.
    const sdp = this._sdpNonCoreCoefficients(actor, subId, idExtra);

    // Solve the pre-SDP base using T = B*(1+K) + C.
    const preSdpBase = this._solvePreSdpBaseNonCore(totalWithSdp, sdp.k, sdp.c);

    // Compute individual panel deltas in decimal space.
    const rawPanelDeltas = this._computeSdpNonCorePanelDeltas(preSdpBase, sdp.panels);

    // Filter to only non-zero contributions for rendering.
    const sdpPanelDeltas = rawPanelDeltas.filter(p => p.delta !== 0);

    // Sum the decimal deltas for a net total.
    const sdpTotal = sdpPanelDeltas.reduce((n, p) => n + p.delta, 0);

    // Return both detailed rows and the net total.
    return {
      sdpPanelDeltas,
      sdpTotal,
    };
  }

  /**
   * Solves for the pre‑SDP base for core params using T = B*(1+K) + C.
   * @param {number} totalWithSdp The final actor value including SDP.
   * @param {number} k The percent coefficient sum (as decimal).
   * @param {number} c The flat coefficient sum.
   * @returns {number}
   */
  _solvePreSdpBaseCore(totalWithSdp, k, c)
  {
    const numerator = totalWithSdp - c;
    const denom = 1 + k;
    const base = denom !== 0
      ? Math.round(numerator / denom)
      : 0;
    return Math.max(0, base);
  }

  /**
   * Solves for the pre‑SDP base for non-core params using T = B*(1+K) + C.
   * @param {number} totalWithSdp The final actor value including SDP.
   * @param {number} k The percent coefficient sum (as decimal).
   * @param {number} c The flat coefficient sum (already in decimal space).
   * @returns {number}
   */
  _solvePreSdpBaseNonCore(totalWithSdp, k, c)
  {
    const numerator = totalWithSdp - c;
    const denom = 1 + k;
    const base = denom !== 0
      ? (numerator / denom)
      : 0;
    return Math.max(0, base);
  }

  /**
   * Draws a single SDP panel entry (icon + colored name + right-aligned value).
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   * @param {number} w The width available.
   * @param {string} name The panel name.
   * @param {number} iconIndex The icon index to draw.
   * @param {number} rarityColorIndex The ColorManager index for rarity.
   * @param {string} valueText The right-aligned value text to draw.
   */
  drawSdpPanelEntry(x, y, w, name, iconIndex, rarityColorIndex, valueText)
  {
    // coerce visuals to concrete numbers for stability.
    const safeIcon = iconIndex | 0;
    const safeRarity = rarityColorIndex | 0;

    // draw the panel icon on the left.
    this.drawIcon(safeIcon, x, y + 2);

    // compute text area for the name.
    const nameX = x + 36;
    const nameW = Math.floor(w * 0.6) - 36;

    // draw the name using rarity color.
    this.changeTextColor(ColorManager.textColor(safeRarity));
    this.drawText(name, nameX, y, nameW, 'left');
    this.resetTextColor();

    // draw the value on the right.
    this.drawText(valueText, x, y, w, 'right');
  }

  /**
   * An SDP (Panels) section renderer for regen showing flat values per 5s.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate to start drawing.
   * @param {number} w The width.
   * @param {string} totalValueText The right-aligned signed total in per‑5s units.
   * @param {{ name:string, iconIndex:number, rarity:number, delta:number }[]} panels The per-panel rows.
   * @returns {number} The next y after drawing (or unchanged if skipped).
   */
  drawSdpPanelsFlatPerFiveSection(x, y, w, totalValueText, panels)
  {
    // Determine if the section is relevant at all.
    const anyPanels = panels && panels.length > 0;
    if (!anyPanels)
    {
      return y;
    }

    // Draw the section title.
    let cursorY = this.drawSectionTitle(x, y, w, 'SDP (Panels)');

    // Draw the total row as flat-per-5s.
    this.drawKeyValue(x + 12, cursorY, w - 12, '+ Total ', totalValueText, 'left');
    cursorY += this.lineHeight();

    // Draw each panel entry formatted as flat-per-5s.
    panels.forEach(panel =>
    {
      const { name } = panel;
      const { iconIndex } = panel;
      const { rarity } = panel;

      // Compose a per‑panel value string.
      // If the panel originated from a percent rate, show both: "+5% (+0.6)".
      let valueText;
      if (panel.rateDec)
      {
        const pctText = StatusHelper.toPercentString(panel.rateDec * 100, true);
        const flatText = this.formatSignedFlatPerFive(panel.delta);
        valueText = `${pctText} (${flatText})`;
      }
      else
      {
        valueText = this.formatSignedFlatPerFive(panel.delta);
      }

      // Draw the panel line with icon and rarity coloring.
      this.drawSdpPanelEntry(x + 24, cursorY, w - 24, name, iconIndex, rarity, valueText);

      // Advance to next row.
      cursorY += this.lineHeight();
    });

    // Add a small end-cap gap.
    cursorY += 6;

    // Return the next Y.
    return cursorY;
  }

  /**
   * Formats a native flat value as a per‑5s display string, with simple rounding.
   * Example: native 6 → "1.2" (per 5 seconds).
   * @param {number} nativeFlat The native flat amount (pre‑division).
   * @returns {string}
   */
  formatPerFiveFlat(nativeFlat)
  {
    // Convert native units to a per‑5s value.
    const perFive = nativeFlat / 5;

    // Show to one decimal place for readability (ex: 2.4 per 5s).
    const text = perFive.toFixed(1);
    return text;
  }

  /**
   * Formats a native flat delta as a signed per‑5s string (ex: "+1.2").
   * @param {number} nativeFlat The native flat delta (pre‑division).
   * @returns {string}
   */
  formatSignedFlatPerFive(nativeFlat)
  {
    // Determine sign character.
    const sign = nativeFlat >= 0
      ? '+'
      : String.empty;

    // Convert to per‑5s with one decimal using the shared formatter.
    const absPerFive = this.formatPerFiveFlat(Math.abs(nativeFlat));

    // Prepend the sign to the absolute value.
    return `${sign}${absPerFive}`;
  }

  /**
   * Formats NATURAL growth for regen as "<rate%> → +<per5s>" where the delta
   * is expressed as per‑5s. Example: "+20% → +0.6".
   * @param {number} deltaNative The computed delta in native flat units.
   * @param {number} ratePercent The growth rate percent (for display only).
   * @returns {string}
   */
  formatPlusRatePerFive(deltaNative, ratePercent)
  {
    // Render the rate as a percent string (signed).
    const rateText = StatusHelper.toPercentString(ratePercent, true);

    // Convert native delta to per‑5s text with sign.
    const deltaText = this.formatSignedFlatPerFive(deltaNative);

    // Keep the regen NATURAL line concise.
    return `${rateText} → ${deltaText}`;
  }

  /**
   * Formats a pair of inputs (plus, rate) and the solved percent delta into
   * a compact string: "+Plus%, +Rate% → +Delta%".
   * @param {number} plus The flat percent-points input (e.g., 15 for +15%).
   * @param {number} rate The multiplier percent input (e.g., 20 for +20%).
   * @param {number} delta The solved percent-points delta (may be fractional).
   * @returns {string}
   */
  formatPlusRatePercent(plus, rate, delta)
  {
    // Build signed pieces.
    const plusText = StatusHelper.toPercentString(plus, true);
    const rateText = StatusHelper.toPercentString(rate, true);
    const deltaText = StatusHelper.toPercentString(delta, true);

    // Return the unified, readable string.
    return `${plusText}, ${rateText} → ${deltaText}`;
  }

  //endregion helpers (SDP)

  //region custom
  /**
   * Renders the breakdown for Move Speed Boost (longId 31).
   * Source is equips/states only via the `jabsSpeedBoost` note property.
   * Values are whole-number bonuses (Page 1 shows this as a raw number, not a percent).
   * @param {Game_Actor} actor The actor whose stat is being explained.
   * @param {number} x The x coordinate to start drawing.
   * @param {number} y The y coordinate to start drawing.
   * @param {number} w The width available to draw within.
   * @returns {number} The next y position after finishing this section.
   */
  _drawMsbBreakdown(actor, x, y, w)
  {
    // Gather equip/state contributions directly from note properties.
    const equipTotal = (actor.equippedEquips() || [])
      .filter(e => !!e)
      .reduce((n, e) => n + (e.jabsSpeedBoost | 0), 0);
    const stateTotal = (actor.states() || [])
      .filter(s => !!s)
      .reduce((n, s) => n + (s.jabsSpeedBoost | 0), 0);

    // Total should match Page 1’s msb value.
    const total = (equipTotal + stateTotal);

    // Build rows — MSB is shown as whole numbers (Page 1 omits % for 31).
    const rows = [];
    rows.push({
      key: 'Baseline',
      value: 0
    });
    if (equipTotal !== 0) rows.push({
      key: '+ Equips',
      value: equipTotal
    });
    if (stateTotal !== 0) rows.push({
      key: '+ States',
      value: stateTotal
    });
    rows.push({
      key: '= Total',
      value: total
    });

    // Render the section.
    return this.drawSectionWithRows(x, y, w, 'Sources (Equips/States)', rows);
  }

  /**
   * Renders the breakdown for Skill Proficiency Boost (longId 32).
   * Source is equips/states only via `J.PROF.RegExp.ProficiencyBonus`.
   * Values are flat integers (added directly to skill proficiency gains).
   * @param {Game_Actor} actor The actor whose stat is being explained.
   * @param {number} x The x coordinate to start drawing.
   * @param {number} y The y coordinate to start drawing.
   * @param {number} w The width available to draw within.
   * @returns {number} The next y position after finishing this section.
   */
  _drawSpbBreakdown(actor, x, y, w)
  {
    // Sum SPB bonuses by regex over equips/states only.
    const eq = RPGManager.getSumFromAllNotesByRegex(
      actor.equippedEquips()
        .filter(e => !!e),
      J.PROF.RegExp.ProficiencyBonus
    );
    const st = RPGManager.getSumFromAllNotesByRegex(
      actor.states()
        .filter(s => !!s),
      J.PROF.RegExp.ProficiencyBonus
    );

    const total = (eq + st); // equals Page 1’s bonusSkillProficiencyGains()

    const rows = [];
    rows.push({
      key: 'Baseline',
      value: 0
    });
    if (eq !== 0) rows.push({
      key: '+ Equips',
      value: eq
    });
    if (st !== 0) rows.push({
      key: '+ States',
      value: st
    });
    rows.push({
      key: '= Total',
      value: total
    });

    return this.drawSectionWithRows(x, y, w, 'Sources (Equips/States)', rows);
  }

  /**
   * Renders the breakdown for SDP Multiplier Bonus (longId 33).
   * Source is equips/states only via `J.SDP.RegExp.SdpMultiplier`.
   * Rows render in percent points around a 100% baseline; Page 1 shows factor (total/100).
   * @param {Game_Actor} actor The actor whose stat is being explained.
   * @param {number} x The x coordinate to start drawing.
   * @param {number} y The y coordinate to start drawing.
   * @param {number} w The width available to draw within.
   * @returns {number} The next y position after finishing this section.
   */
  _drawSmbBreakdown(actor, x, y, w)
  {
    // Sum percent-point bonuses by regex over equips/states only.
    const eqPct = RPGManager.getSumFromAllNotesByRegex(
      actor.equippedEquips()
        .filter(e => !!e),
      J.SDP.RegExp.SdpMultiplier
    );
    const stPct = RPGManager.getSumFromAllNotesByRegex(
      actor.states()
        .filter(s => !!s),
      J.SDP.RegExp.SdpMultiplier
    );

    // Compose totals around a 100% baseline (factor 1.00 on Page 1).
    const basePct = 100;
    const totalPct = basePct + eqPct + stPct;

    // Local helpers for factor formatting to mirror Page 1.
    const formatFactor = n =>
    {
      // If under 1 in magnitude, show two decimals (ex: 0.40, 0.03).
      if (Math.abs(n) < 1)
      {
        return n.toFixed(2);
      }

      // If whole number, omit decimals (ex: 1, 2).
      if (Number.isInteger(n))
      {
        return `${n}`;
      }

      // Otherwise, show up to two decimals (trim .00 if present).
      const txt = n.toFixed(2);
      return txt.endsWith('.00')
        ? txt.slice(0, -3)
        : txt;
    };

    const formatSignedFactor = n =>
    {
      // Determine sign for the factor delta.
      const sign = n >= 0
        ? '+'
        : String.empty;

      // Always format using absolute value + sign prefix.
      return `${sign}${formatFactor(Math.abs(n))}`;
    };

    // Convert percent-points into factor deltas.
    const baseFactor = basePct / 100;     // => 1.00
    const eqFactor = eqPct / 100;       // => e.g., +0.40
    const stFactor = stPct / 100;       // => e.g., -0.03
    const totalFactor = totalPct / 100;   // => e.g., 1.37

    // Build rows rendered in factor space to match Page 1’s display.
    const rows = [];

    // Baseline shown as factor (not percent).
    rows.push({
      key: 'Baseline',
      value: formatFactor(baseFactor)
    });

    // Equips contribution as a signed factor delta.
    if (eqPct !== 0)
    {
      rows.push({
        key: '+ Equips',
        value: formatSignedFactor(eqFactor)
      });
    }

    // States contribution as a signed factor delta.
    if (stPct !== 0)
    {
      rows.push({
        key: '+ States',
        value: formatSignedFactor(stFactor)
      });
    }

    // Total as a factor (mirrors Page 1).
    rows.push({
      key: '= Total',
      value: formatFactor(totalFactor)
    });

    // Render the section.
    return this.drawSectionWithRows(x, y, w, 'Sources (Equips/States)', rows);
  }

  //endregion custom

  //region math helpers
  /**
   * Calculates the amount to add to a parameter.
   * @param {Game_Actor} actor The actor driving this step.
   * @param {number} base The base driving this step.
   * @param {number} plus The plus driving this step.
   * @param {number} rate The rate driving this step.
   * @returns {number}
   */
  calcPlusRate(actor, base, plus, rate)
  {
    // use the provided helper from NATURAL layer.
    const computed = actor.calculatePlusRate(base, plus, rate);
    return computed;
  }

  /**
   * Formats the plus and rate into a readable string.
   * @param {number} plus The plus driving this step.
   * @param {number} rate The rate driving this step.
   * @param {number} delta The delta driving this step.
   * @returns {string}
   */
  formatPlusRate(plus, rate, delta)
  {
    const plusSign = plus >= 0
      ? '+'
      : String.empty;
    const deltaSign = delta >= 0
      ? '+'
      : String.empty;
    const rateText = StatusHelper.toPercentString(rate, true);
    return `${plusSign}${plus}, ${rateText} → ${deltaSign}${Math.round(delta)}`;
  }

  /**
   * Sums the flat bonus parameter from equips.
   * @param {Game_Actor} actor The actor driving this step.
   * @param {number} paramId The param id driving this step.
   * @returns {number}
   */
  sumEquipBParamFlat(actor, paramId)
  {
    let total = 0;
    actor.equips()
      .forEach(equip =>
      {
        if (!equip) return;
        const arr = equip.params;
        total += arr
          ? (arr[paramId] | 0)
          : 0;
      });
    return total;
  }

  /**
   * Sums the flat bonus parameter from states.
   * @param {Game_Actor} actor The actor driving this step.
   * @param {number} paramId The param id driving this step.
   * @returns {number}
   */
  sumStateBParamFlat(actor, paramId)
  {
    let total = 0;
    actor.states()
      .forEach(state =>
      {
        if (!state) return;
        const arr = state.params;
        total += arr
          ? (arr[paramId] | 0)
          : 0;
      });
    return total;
  }

  /**
   * Determines the b-param bonuses from traits.
   * @param {RPG_Traited[]} objs The objs driving this step.
   * @param {number} paramId The param id driving this step.
   * @returns {number}
   */
  paramRateFromTraits(objs, paramId)
  {
    const CODE = Game_BattlerBase.TRAIT_PARAM;
    let rate = 1.0;
    objs.forEach(source =>
    {
      if (!source || !source.traits) return;
      source.traits.forEach(trait =>
      {
        if (trait.code === CODE && trait.dataId === paramId)
        {
          rate *= trait.value;
        }
      });
    });
    return rate;
  }

  /**
   * Determines the x-param bonuses from traits.
   * @param {RPG_Traited[]} objs The objs driving this step.
   * @param {number} xId The x id driving this step.
   * @returns {number}
   */
  xparamAddFromTraits(objs, xId)
  {
    const CODE = Game_BattlerBase.TRAIT_XPARAM;
    let add = 0.0;
    objs.forEach(source =>
    {
      if (!source || !source.traits) return;
      source.traits.forEach(trait =>
      {
        if (trait.code === CODE && trait.dataId === xId)
        {
          add += trait.value;
        }
      });
    });
    return add;
  }

  /**
   * Determines the s-param bonuses from traits.
   * @param {RPG_Traited[]} objs The objs driving this step.
   * @param {number} sId The s id driving this step.
   * @returns {number}
   */
  sparamRateFromTraits(objs, sId)
  {
    const CODE = Game_BattlerBase.TRAIT_SPARAM;
    let rate = 1.0;
    objs.forEach(source =>
    {
      if (!source || !source.traits) return;
      source.traits.forEach(trait =>
      {
        if (trait.code === CODE && trait.dataId === sId)
        {
          rate *= trait.value;
        }
      });
    });
    return rate;
  }

  //endregion math helpers

  //region layout helpers
  /**
   * Draws a small section title without any horizontal line.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate.
   * @param {number} w The width.
   * @param {string} text The section title.
   * @returns {number} The next y after drawing.
   */
  drawSectionTitle(x, y, w, text)
  {
    // set the color and draw the title.
    this.changeTextColor(ColorManager.systemColor());
    this.drawText(text, x, y, w, 'left');
    // reset color to normal.
    this.resetTextColor();

    // advance a small gap beneath the title for readability.
    const nextY = y + this.lineHeight() + 4;
    return nextY;
  }

  /**
   * Draws the value at the designated location.
   * @param x
   * @param y
   * @param w
   * @param key
   * @param value
   * @param align
   */
  drawKeyValue(x, y, w, key, value, align)
  {
    this.drawText(key, x, y, Math.floor(w * 0.6), align || 'left');
    const text = `${value}`;
    this.drawText(text, x, y, w, 'right');
  }

  /**
   * Draws a section title and a list of key/value rows.
   * If `rows` is empty, the section is skipped and the original `y` is returned.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate to start drawing.
   * @param {number} w The width.
   * @param {string} title The section title.
   * @param {{ key:string, value:string|number }[]} rows The rows to draw.
   * @returns {number} The next y after drawing (or unchanged if skipped).
   */
  drawSectionWithRows(x, y, w, title, rows)
  {
    // Bail out if there is nothing to draw for this section.
    if (!rows || rows.length === 0)
    {
      return y;
    }

    // Draw the section title.
    let cursorY = this.drawSectionTitle(x, y, w, title);

    // Draw each key/value row in order.
    rows.forEach(row =>
    {
      this.drawKeyValue(x + 12, cursorY, w - 12, row.key, row.value, 'left');

      // Advance the cursor after each row.
      cursorY += this.lineHeight();
    });

    // Add a little gap beneath sections for readability.
    cursorY += 6;

    // Return the next line to start drawing on.
    return cursorY;
  }

  /* eslint-disable max-len */
  /**
   * Draws an SDP (Panels) section consisting of a "+ Total" line and panel entries.
   * If there are no non-zero panels or the overall total is neutral, the section is skipped.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate to start drawing.
   * @param {number} w The width.
   * @param {string|number} totalValueText The right-aligned text for the total row.
   * @param {{ name:string, iconIndex:number, rarity:number, delta:number }[]} panels The per-panel rows; caller ensures non-zero filtering if desired.
   * @returns {number} The next y after drawing (or unchanged if skipped).
   */

  /* eslint-enable max-len */
  drawSdpPanelsSection(x, y, w, totalValueText, panels)
  {
    // Determine if the section is relevant at all.
    const anyPanels = panels && panels.length > 0;
    if (!anyPanels)
    {
      return y;
    }

    // Draw the section title.
    let cursorY = this.drawSectionTitle(x, y, w, 'SDP (Panels)');

    // Draw the total row.
    this.drawKeyValue(x + 12, cursorY, w - 12, '+ Total', totalValueText, 'left');
    cursorY += this.lineHeight();

    // Draw each panel entry.
    panels.forEach(panel =>
    {
      const { name } = panel;
      const { iconIndex } = panel;
      const { rarity } = panel;

      // Build signed flat text (e.g., "+63").
      const sign = panel.delta >= 0
        ? '+'
        : String.empty;
      const flatText = `${sign}${panel.delta}`;

      // If there is a percent component, show it as well: "+5% (+63)".
      const valueText = panel.rateDec
        ? `${StatusHelper.toPercentString(panel.rateDec * 100, true)} (${flatText})`
        : flatText;

      // Draw the panel line with icon and rarity coloring.
      this.drawSdpPanelEntry(x + 24, cursorY, w - 24, name, iconIndex, rarity, valueText);

      // Advance to next row.
      cursorY += this.lineHeight();
    });

    // Add a small end-cap gap.
    cursorY += 6;

    // Return the next Y.
    return cursorY;
  }

  /**
   * Same as `drawSdpPanelsSection`, but formats each panel delta as a percent string (e.g., "+4.0%")
   * and expects `totalValueText` to also be percent-formatted already.
   * Useful for xparams/sparams where contribution space is decimal/percentage.
   * @param {number} x The x coordinate.
   * @param {number} y The y coordinate to start drawing.
   * @param {number} w The width.
   * @param {string} totalValueText The right-aligned text for the total row, already formatted.
   * @param {{ name:string, iconIndex:number, rarity:number, delta:number }[]} panels The per-panel rows.
   * @returns {number} The next y after drawing (or unchanged if skipped).
   */
  drawSdpPanelsPercentSection(x, y, w, totalValueText, panels)
  {
    // Determine if the section is relevant at all.
    const anyPanels = panels && panels.length > 0;
    if (!anyPanels)
    {
      return y;
    }

    // Draw the section title.
    let cursorY = this.drawSectionTitle(x, y, w, 'SDP (Panels)');

    // Draw the total row.
    this.drawKeyValue(x + 12, cursorY, w - 12, '+ Total', totalValueText, 'left');
    cursorY += this.lineHeight();

    // Draw each panel entry with percent formatting.
    panels.forEach(panel =>
    {
      const { name } = panel;
      const { iconIndex } = panel;
      const { rarity } = panel;
      const pct = panel.delta * 100;
      const valueText = StatusHelper.toPercentString(pct, true);

      this.drawSdpPanelEntry(x + 24, cursorY, w - 24, name, iconIndex, rarity, valueText);
      cursorY += this.lineHeight();
    });

    // Add a small end-cap gap.
    cursorY += 6;

    // Return the next Y.
    return cursorY;
  }

  //endregion layout helpers
}

export default Window_StatusStatBreakdown;
//endregion Window_StatusStatBreakdown