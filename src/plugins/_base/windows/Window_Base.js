//region Window_Base
/**
 * All alignments available for {@link Window_Base.prototype.drawText}.<br>
 */
Window_Base.TextAlignments = {
  /**
   * The "left" text alignment.
   * This is the default and not normally required to be set.
   */
  Left: 'left',

  /**
   * The "center" text alignment.
   * This requires the full width of the area attempting to be centered within
   * be provided (such as the whole window's width).
   */
  Center: 'center',

  /**
   * The "right" text alignment.
   * It is encouraged to use {@link Window_Base.prototype.textWidth} to define the
   * width parameter in order to properly right-align.
   */
  Right: 'right'
};

/**
 * Enumerates built-in gauge types for {@link Window_Base#drawGauge}.
 */
Window_Base.GAUGE_TYPES = {
  // a bordered rectangular gauge with gradient fill.
  Rectangle: 'rect',

  // a segmented gauge.
  Segmented: 'segmented',

  // a rounded-corner style.
  Pill: 'pill',

  // a circular ring gauge.
  Radial: 'radial',
};

//region draw text

/**
 * Draws a horizontal "line" with the given parameters.
 *
 * The origin coordinate is always the upper left corner.
 * @param {number} x The x coordinate of the line.
 * @param {number} y The y coordinate of the line.
 * @param {number} width The width in pixels of the line.
 * @param {number=} height The height in pixels of the line; defaults to 2.
 */
Window_Base.prototype.drawHorizontalLine = function(x, y, width, height = 2)
{
  this.drawRect(x, y, width, height);
};

/**
 * Draws a vertical "line" with the given parameters.
 *
 * The origin coordinate is always the upper left corner.
 * @param {number} x The x coordinate of the line.
 * @param {number} y The y coordinate of the line.
 * @param {number} height The height in pixels of the line.
 * @param {number=} width The width in pixels of the line; defaults to 2.
 */
Window_Base.prototype.drawVerticalLine = function(x, y, height, width = 2)
{
  this.drawRect(x, y, width, height);
};

/**
 * Clears the bitmaps associated with the window if available.
 */
Window_Base.prototype.clearContent = function()
{
  // check if we have a bitmap to clear.
  if (this.contents)
  {
    // clear it.
    this.contents.clear();
  }

  // check if we have a background to clear.
  if (this.contentsBack)
  {
    // clear it, too.
    this.contentsBack.clear();
  }
};

/**
 * Refreshes the window by clearing its bitmaps and redrawing the content.
 */
Window_Base.prototype.refresh = function()
{
  // clears the existing bitmaps' content.
  this.clearContent();

  // redraws all the content.
  this.drawContent();
};

/**
 * Draws the content of this window.
 */
Window_Base.prototype.drawContent = function()
{
  // implement.
};

/**
 * Extends {@link Window_Base.resetFontSettings}.<br>
 * Also resets bold and italics.
 */
J.BASE.Aliased.Window_Base.set('resetFontSettings', Window_Base.prototype.resetFontSettings);
Window_Base.prototype.resetFontSettings = function()
{
  // perform original logic.
  J.BASE.Aliased.Window_Base.get('resetFontSettings')
    .call(this);

  // also reset the italics/bold back to false.
  this.resetFontFormatting();
};

/**
 * Resets bold and italics for this bitmap.
 */
Window_Base.prototype.resetFontFormatting = function()
{
  this.contents.fontItalic = false;
  this.contents.fontBold = false;
};

/**
 * Gets the minimum font size.
 * @returns {number}
 */
Window_Base.prototype.minimumFontSize = function()
{
  return 8;
};

/**
 * Gets the maximum font size.
 * @returns {number}
 */
Window_Base.prototype.maximumFontSize = function()
{
  return 96;
};

/**
 * Clamps a font size value to fit within the min and max font size.
 * @param {number} fontSize The font size to normalize.
 * @returns {number}
 */
Window_Base.prototype.normalizeFontSize = function(fontSize)
{
  // calculate the projected font size.
  let projectedFontSize = fontSize;

  // clamp our minimum value.
  projectedFontSize = Math.max(this.minimumFontSize(), projectedFontSize);

  // clamp our maximum value.
  projectedFontSize = Math.min(this.maximumFontSize(), projectedFontSize);

  // return our acceptale font size value.
  return projectedFontSize;
};

/**
 * Modify the font size by a given amount.
 * Will clamp the value between the min and max font sizes.
 * @param {number} amount The amount to add to the font size to change it.
 */
Window_Base.prototype.modFontSize = function(amount)
{
  // calculate the projected font size.
  const projectedFontSize = this.contents.fontSize + amount;

  // normalize the font size.
  const normalizedFontSize = this.normalizeFontSize(projectedFontSize);

  // assign the projected size as the real size.
  this.contents.fontSize = normalizedFontSize;
};

/**
 * Sets the font size to a given amount.
 * Will clamp the value between the min and max font sizes.
 * @param {number} fontSize The new potential font size to change it to.
 */
Window_Base.prototype.setFontSize = function(fontSize)
{
  // calculate the projected font size.
  const projectedFontSize = fontSize;

  // normalize the font size.
  const normalizedFontSize = this.normalizeFontSize(projectedFontSize);

  // set the font size to the new size.
  this.contents.fontSize = normalizedFontSize;
};

/**
 * Wraps text with `\\C[colorIndex]…\\C[0]` for {@link Window_Base#drawTextEx} (same idea as {@link #boldenText}).
 * @param {number} colorIndex Palette index for the opening `\\C` code.
 * @param {string} text Inner text.
 * @returns {string} Tinted fragment; reset keeps later text from inheriting the color.
 */
Window_Base.prototype.colorizeText = function(colorIndex, text)
{
  return `\\C[${colorIndex}]${text}\\C[0]`;
};

/**
 * Wraps the given text with a font-size modifier shorthand.
 * @param {number} modifier The size modification.
 * @param {string} text The text to modify size for.
 * @returns {string} The fontsize modified text like this: `\\FS[${number}]${string}\\FS[${number}]`
 */
Window_Base.prototype.modFontSizeForText = function(modifier, text)
{
  const currentFontSize = this.contents.fontSize;

  const modifiedFontSize = currentFontSize + modifier;

  return `\\FS[${modifiedFontSize}]${text}\\FS[${currentFontSize}]`;
};

//region font style + escape codes
/**
 * Extends text analysis to check for our custom escape codes, too.
 *
 * This enables bold and italics parsing for {@link Window_Base.prototype.drawTextEx}
 * globally via `\\*` and `\\_`.
 */
J.BASE.Aliased.Window_Base.set('obtainEscapeCode', Window_Base.prototype.obtainEscapeCode);
Window_Base.prototype.obtainEscapeCode = function(textState)
{
  const originalEscape = J.BASE.Aliased.Window_Base.get('obtainEscapeCode')
    .call(this, textState);
  if (!originalEscape)
  {
    return this.customEscapeCodes(textState);
  }
  else
  {
    return originalEscape;
  }
};

/**
 * Retrieves additional escape codes that are our custom creation.
 * @param {any} textState The rolling text state.
 * @returns {string} The found escape code, if any.
 */
Window_Base.prototype.customEscapeCodes = function(textState)
{
  if (!textState) return String.empty;

  const regExp = this.escapeCodes();
  const arr = regExp.exec(textState.text.slice(textState.index));
  if (arr)
  {
    textState.index += arr[0].length;
    return arr[0].toUpperCase();
  }
  else
  {
    return String.empty;
  }
};

/**
 * Gets the regex escape code structure.
 *
 * This includes our added custom escape code symbols to look for.
 * @returns {RegExp}
 */
Window_Base.prototype.escapeCodes = function()
{
  return /^[$.|^!><{}*_\\]|^[A-Z]+/i;
};

/**
 * Extends the processing of escape codes to include our custom ones.
 *
 * This adds italics and bold to the possible list of escape codes.
 */
J.BASE.Aliased.Window_Base.set('processEscapeCharacter', Window_Base.prototype.processEscapeCharacter);
Window_Base.prototype.processEscapeCharacter = function(code, textState)
{
  J.BASE.Aliased.Window_Base.get('processEscapeCharacter')
    .call(this, code, textState);
  switch (code)
  {
    case "_":
      this.toggleItalics();
      break;
    case "*":
      this.toggleBold();
      break;
  }
};

/**
 * Toggles the italics for the rolling text state.
 *
 * This does not apply to {@link Window_Base.prototype.drawTextEx}, but alternatively
 * you can interpolate `\"\\_\"` before and after the text desired to be italics to
 * achieve the same effect.
 * @param {?boolean} force Optional. If provided, will force one way or the other.
 */
Window_Base.prototype.toggleItalics = function(force = null)
{
  this.contents.fontItalic = force ?? !this.contents.fontItalic;
};

/**
 * Wraps the given text with the message code for italics.
 * @param {string} text The text to italicize.
 * @returns {string} The italicized text like this: `\\_${text}\\_`
 */
Window_Base.prototype.italicizeText = function(text)
{
  return `\\_${text}\\_`;
};

/**
 * Toggles the bold for the rolling text state.
 *
 * This does not apply to {@link Window_Base.prototype.drawTextEx}, but alternatively
 * you can interpolate `\"\\*\"` before and after the text desired to be bold to
 * achieve the same effect.
 * @param {?boolean} force Optional. If provided, will force one way or the other.
 */
Window_Base.prototype.toggleBold = function(force = null)
{
  this.contents.fontBold = force ?? !this.contents.fontBold;
};

/**
 * Wraps the given text with the message code for bold.
 * @param {string} text The text to bolden.
 * @returns {string} The bolded text like this: `\\*${text}\\*`
 */
Window_Base.prototype.boldenText = function(text)
{
  return `\\*${text}\\*`;
};

//endregion font style + escape codes

//region styled padded values
/**
 * Builds a per-character mask: true where a `'0'` is **leading padding** inside a contiguous digit run
 * (zeros before the first `'1'`–`'9'` in that run). Internal zeros (for example the middle `0` in `2088`)
 * are false so they render like other significant digits.
 *
 * @param {string} value The full string being rendered (may include `(-…)`, `|`, `+`, etc.).
 * @returns {boolean[]} Same length as `value`; non-digit indices are always false.
 */
Window_Base.prototype.buildLeadingPadZeroMask = function(value)
{
  const mask = [];

  for (let i = 0; i < value.length; i++)
  {
    mask.push(false);
  }

  let i = 0;

  while (i < value.length)
  {
    const ch = value[i];

    if (ch >= '0' && ch <= '9')
    {
      const runStart = i;

      while (i < value.length && value[i] >= '0' && value[i] <= '9')
      {
        i++;
      }

      let firstSignificant = -1;

      for (let j = runStart; j < i; j++)
      {
        const c = value[j];

        if (c >= '1' && c <= '9')
        {
          firstSignificant = j;
          break;
        }
      }

      if (firstSignificant === -1)
      {
        for (let j = runStart; j < i; j++)
        {
          mask[j] = true;
        }
      }
      else
      {
        for (let j = runStart; j < firstSignificant; j++)
        {
          mask[j] = true;
        }
      }
    }
    else
    {
      i++;
    }
  }

  return mask;
};

/**
 * Draws a padded value where leading zeroes are dim, and significant digits are bold.
 * This is intended for controller-first numeric scanning (Monsterpedia, SDP, etc.).
 *
 * @param {number} x The left-most x.
 * @param {number} y The y.
 * @param {string} value The padded value to render.
 * @param {number} width The width to work within.
 * @param {number=} zeroColorIndex Palette index for leading zeros; defaults to 8.
 * @param {number=} valueColorIndex Palette index for significant digits; defaults to 0.
 */
Window_Base.prototype.drawStyledPaddedValue = function(
  x,
  y,
  value,
  width,
  zeroColorIndex = 8,
  valueColorIndex = 0)
{
  // assumes monospaced digits (matches the Monsterpedia presentation); keeps numbers stable and scan-friendly.
  // use a digit for width so wrapped cost strings like `(-00000042)` don't inherit '(' sizing.
  const charWidth = this.textWidth('0');
  const totalCharWidth = value.length * charWidth;
  const startX = x + width - totalCharWidth;
  const leadingPadZeroMask = this.buildLeadingPadZeroMask(value);

  [ ...value ].forEach((char, index) =>
  {
    const isDigit = char >= '0' && char <= '9';
    const isLeadingPadZero = isDigit && char === '0' && leadingPadZeroMask[index];
    const isSignificantDigit = isDigit && isLeadingPadZero === false;

    // color rules:
    // - leading pad `'0'` digits stay dim.
    // - all other digits (`'1'`–`'9'` and non-leading `'0'`) use value color + bold.
    // - non-digits (like '(' / '-' / ')') stay normal.
    if (isSignificantDigit)
    {
      this.processColorChange(valueColorIndex);
    }
    else if (isLeadingPadZero)
    {
      this.processColorChange(zeroColorIndex);
    }
    else
    {
      this.processColorChange(0);
    }

    this.toggleBold(isSignificantDigit);

    const charX = startX + (index * charWidth);
    this.drawText(char, charX, y, charWidth, Window_Base.TextAlignments.Left);

    // do not allow bold to bleed.
    this.toggleBold(false);
  });

  this.processColorChange(0);
};

/**
 * Draws a number padded with zeros, with leading zeros dimmed and significant digits bolded.
 * @param {number} x The left-most x.
 * @param {number} y The y.
 * @param {number} number The numeric value.
 * @param {number} width The width to work within.
 * @param {number=} padZeroCount The digits to pad to; defaults to 8.
 * @param {number=} zeroColorIndex Palette index for leading zeros; defaults to 8.
 * @param {number=} valueColorIndex Palette index for significant digits; defaults to 0.
 */
Window_Base.prototype.drawStyledZeroPaddedNumber = function(
  x,
  y,
  number,
  width,
  padZeroCount = 8,
  zeroColorIndex = 8,
  valueColorIndex = 0)
{
  const padded = number.padZero(padZeroCount);
  this.drawStyledPaddedValue(x, y, padded, width, zeroColorIndex, valueColorIndex);
};

/**
 * Draws a cost value wrapped in parenthesis like `(-00000042)` with styled padding.
 * @param {number} x The left-most x.
 * @param {number} y The y.
 * @param {number} cost The cost value.
 * @param {number} width The width to work within.
 * @param {number=} padZeroCount The digits to pad to; defaults to 8.
 * @param {number=} zeroColorIndex Palette index for leading zeros; defaults to 8.
 * @param {number=} valueColorIndex Palette index for significant digits; defaults to 0.
 */
Window_Base.prototype.drawStyledZeroPaddedCost = function(
  x,
  y,
  cost,
  width,
  padZeroCount = 8,
  zeroColorIndex = 8,
  valueColorIndex = 0)
{
  const padded = cost.padZero(padZeroCount);
  const text = `(-${padded})`;
  this.drawStyledPaddedValue(x, y, text, width, zeroColorIndex, valueColorIndex);
};

//endregion styled padded values

//endregion draw text

/**
 * Renders a "background" of a given rectangle.
 * This is centralized for all windows to leverage if necessary.
 * @param {Rectangle} rect The rectangle representing the background shape to render.
 */
Window_Base.prototype.drawBackgroundRect = function(rect)
{
  // grab the color gradient for the background.
  const color1 = ColorManager.itemBackColor1();
  const color2 = ColorManager.itemBackColor2();

  // extract the data from the rectangle.
  const {
    x,
    y,
    width,
    height
  } = rect;

  // render the background.
  this.contentsBack.gradientFillRect(x, y, width, height, color1, color2, true);
  this.contentsBack.strokeRect(x, y, width, height, color1);
};

// region draw gauge

/**
 * The height of this gauge.
 */
Window_Base.prototype.gaugeHeight = function()
{
  return 10;
};

/**
 * The backdrop color.
 * Defaults to black with 50% opacity.
 * @returns {string}
 */
Window_Base.prototype.gaugeBackColor = function()
{
  return 'rgba(0, 0, 0, 0.5)';
};

/**
 * Draws a gauge using a {@link Rectangle} and a {@link WindowGaugeOptions}.
 * @param {Rectangle} rect The rectangle area to draw within.
 * @param {number} rate The 0..1 fill amount.
 * @param {WindowGaugeOptions} options The gauge options.
 */
Window_Base.prototype.drawGauge = function(rect, rate, options,)
{
  // delegate to the Rectangle-based switch.
  this.drawGaugeRect(rect, rate, options);
};

/**
 * Dispatches to the specific gauge renderer based on the options.
 * Provides an inner-rect (padding) and delegates shape/back/border to the style.
 * @param {Rectangle} rect The rectangle area.
 * @param {number} rate The 0..1 fill amount.
 * @param {WindowGaugeOptions} options The strongly-typed gauge options.
 */
Window_Base.prototype.drawGaugeRect = function(rect, rate, options)
{
  // clamp the rate to the 0..1 range.
  const clampedRate = Math.max(0, Math.min(1, rate));

  // compute the inner rectangle to avoid the border padding.
  const inner = this._computeGaugeInnerRect(rect, options);

  // extract the inner rectangle coordinates.
  const {
    x,
    y,
    width,
    height
  } = inner;

  // route to the appropriate style.
  switch (options.gaugeType)
  {
    case Window_Base.GAUGE_TYPES.Segmented:
    {
      this.drawGaugeSegmented(x, y, width, height, clampedRate, options);
      break;
    }
    case Window_Base.GAUGE_TYPES.Pill:
    {
      this.drawGaugePill(x, y, width, height, clampedRate, options);
      break;
    }
    case Window_Base.GAUGE_TYPES.Radial:
    {
      this.drawGaugeRadial(x, y, width, height, clampedRate, options);
      break;
    }
    case Window_Base.GAUGE_TYPES.Rectangle:
    default:
    {
      this.drawGaugeBorderedRect(x, y, width, height, clampedRate, options);
      break;
    }
  }
};

/**
 * Draws a rectangular gauge with a gradient fill and a rectangle border that
 * hugs the fill area. Back color is rendered first.
 * @param {number} x The x coordinate inside the inner rect.
 * @param {number} y The y coordinate inside the inner rect.
 * @param {number} w The inner width.
 * @param {number} h The inner height.
 * @param {number} rate The 0..1 fill amount.
 * @param {WindowGaugeOptions} options The strongly-typed gauge options.
 */
Window_Base.prototype.drawGaugeBorderedRect = function(x, y, w, h, rate, options)
{
  // styling.
  const { backColor } = options;
  const { borderColor } = options;
  const { borderThickness } = options;

  // fill back area.
  this.contents.fillRect(x, y, w, h, backColor);

  // fill gradient portion.
  const fw = Math.max(0, Math.floor(w * Math.max(0, Math.min(1, rate))));
  if (fw > 0 && h > 0)
  {
    this.contents.gradientFillRect(x, y, fw, h, options.leftGradientColor, options.rightGradientColor);
  }

  // stroke rectangular border.
  const ctx = this.contents._context;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.lineWidth = borderThickness;
  ctx.strokeStyle = borderColor;
  ctx.stroke();
  ctx.restore();
};

/**
 * Draws a segmented gauge with a single continuous gradient across the filled length.
 * Then carves gap bars so color transitions don’t reset per segment.
 * Border is a simple rectangle following the gauge.
 * @param {number} x The x coordinate.
 * @param {number} y The y coordinate.
 * @param {number} w The inner width.
 * @param {number} h The inner height.
 * @param {number} rate The 0..1 fill amount.
 * @param {WindowGaugeOptions} options The strongly-typed gauge options.
 */
Window_Base.prototype.drawGaugeSegmented = function(x, y, w, h, rate, options)
{
  // pull styling.
  const { backColor } = options;
  const { borderColor } = options;
  const { borderThickness } = options;

  // divider styling (defaults to border color so it remains visible on any fill).
  const dividerColor = options.dividerColor || borderColor;

  // coerce parameters.
  const count = Math.max(1, Number(options.segments));
  const spacing = Math.max(0, Number(options.gap));

  // compute the filled width and early outs.
  const clamped = Math.max(0, Math.min(1, rate));
  const fw = Math.max(0, Math.floor(w * clamped));
  if (h <= 0) return;

  // BACK: whole rect.
  this.contents.fillRect(x, y, w, h, backColor);

  // FILL: one continuous gradient across fw.
  if (fw > 0)
  {
    this.contents.gradientFillRect(x, y, fw, h, options.leftGradientColor, options.rightGradientColor);

    // carve gaps without breaking the gradient.
    if (count > 1 && spacing > 0)
    {
      const totalGap = spacing * (count - 1);
      const segW = Math.max(1, Math.floor((w - totalGap) / count));
      for (let i = 1; i < count; i++)
      {
        // location of the i-th divider (left edge of the gap)
        const gx = x + i * segW + (i - 1) * spacing;

        // only carve within the filled area.
        if (gx < x + fw)
        {
          // width to carve for this divider (may be truncated if near the fill edge).
          const carve = Math.min(spacing, (x + fw) - gx);

          // draw the divider using its own color for strong contrast.
          if (carve > 0)
          {
            this.contents.fillRect(gx, y, carve, h, dividerColor);
          }
        }
      }
    }
  }

  // BORDER: rectangular stroke around the shape.
  const ctx = this.contents._context;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.lineWidth = borderThickness;
  ctx.strokeStyle = borderColor;
  ctx.stroke();
  ctx.restore();
};

/**
 * Draws a pill gauge with a true rounded-rectangle path (no scanlines),
 * then outlines it so the border follows the pill shape.
 * @param {number} x The x coordinate.
 * @param {number} y The y coordinate.
 * @param {number} w The inner width.
 * @param {number} h The inner height.
 * @param {number} rate The 0..1 fill amount.
 * @param {WindowGaugeOptions} options The strongly-typed gauge options.
 */
Window_Base.prototype.drawGaugePill = function(x, y, w, h, rate, options)
{
  // clamp the radius to avoid pointy ends.
  const maxR = Math.max(0, Math.floor(h / 2) - 1);
  const r = Math.max(0, Math.min(Number(options.radius), maxR));

  // derive styling.
  const { backColor } = options;
  const { borderColor } = options;
  const { borderThickness } = options;

  // compute the filled width.
  const fw = Math.max(0, Math.floor(w * Math.max(0, Math.min(1, rate))));
  if (h <= 0) return;

  // get 2D context and gradient.
  const ctx = this.contents._context;
  const grad = ctx.createLinearGradient(x, y, x + w, y);
  grad.addColorStop(0, options.leftGradientColor);
  grad.addColorStop(1, options.rightGradientColor);

  // helper to draw a rounded-rect path.
  const roundedRectPath = () =>
  {
    const x2 = x + w;
    const y2 = y + h;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x2 - r, y);
    ctx.arcTo(x2, y, x2, y + r, r);
    ctx.lineTo(x2, y2 - r);
    ctx.arcTo(x2, y2, x2 - r, y2, r);
    ctx.lineTo(x + r, y2);
    ctx.arcTo(x, y2, x, y2 - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  };

  // BACK: pill outline filled with back color.
  ctx.save();
  roundedRectPath();
  ctx.fillStyle = backColor;
  ctx.fill();
  ctx.restore();

  // FILL: draw only the left fw portion — clip to the pill shape for clean ends.
  if (fw > 0)
  {
    ctx.save();
    roundedRectPath();
    ctx.clip();
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, fw, h);
    ctx.restore();
  }

  // BORDER: stroke the pill outline.
  ctx.save();
  roundedRectPath();
  ctx.lineWidth = borderThickness;
  ctx.strokeStyle = borderColor;
  ctx.stroke();
  ctx.restore();
};

/**
 * Draws an elliptical (oval-capable) radial gauge inside the given rect.
 * Renders: back ring → filled wedge → border strokes that follow outer+inner ellipses.
 * @param {number} x The inner-rect x.
 * @param {number} y The inner-rect y.
 * @param {number} w The inner-rect width.
 * @param {number} h The inner-rect height.
 * @param {number} rate The 0..1 fill amount.
 * @param {WindowGaugeOptions} options The strongly-typed gauge options.
 */
Window_Base.prototype.drawGaugeRadial = function(x, y, w, h, rate, options)
{
  // compute outer radii and center.
  const rx = Math.max(2, Math.floor(w / 2) - 1);
  const ry = Math.max(2, Math.floor(h / 2) - 1);
  const cx = x + Math.floor(w / 2);
  const cy = y + Math.floor(h / 2);

  // clamp rate and angles.
  const r = Math.max(0, Math.min(1, rate));
  const a0 = options.startAngle;
  const a1 = a0 + (Math.PI * 2 * r);

  // inner radii from thickness.
  const t = Math.max(1, Math.floor(options.thickness));
  const irx = Math.max(1, rx - t);
  const iry = Math.max(1, ry - t);

  // styling.
  const { backColor } = options;
  const { borderColor } = options;
  const { borderThickness } = options;

  // acquire 2D context and gradient.
  const ctx = this.contents._context;
  const midAngle = a0 + (a1 - a0) / 2;
  const gx0 = cx + Math.cos(a0) * irx;
  const gy0 = cy + Math.sin(a0) * iry;
  const gx1 = cx + Math.cos(midAngle) * rx;
  const gy1 = cy + Math.sin(midAngle) * ry;
  const grad = ctx.createLinearGradient(gx0, gy0, gx1, gy1);
  grad.addColorStop(0, options.leftGradientColor);
  grad.addColorStop(1, options.rightGradientColor);

  // BACK: full ring.
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2, false);
  ctx.ellipse(cx, cy, irx, iry, 0, Math.PI * 2, 0, true);
  ctx.closePath();
  ctx.fillStyle = backColor;
  ctx.fill();
  ctx.restore();

  // FILL: wedge slice (donut section) if any progress.
  if (r > 0)
  {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, a0, a1, false);
    ctx.ellipse(cx, cy, irx, iry, 0, a1, a0, true);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.restore();
  }

  // BORDER: outer + inner ellipses stroked to match the ring’s shape.
  ctx.save();
  ctx.lineWidth = borderThickness;
  ctx.strokeStyle = borderColor;

  // outer ring border.
  ctx.beginPath();
  ctx.ellipse(
    cx,
    cy,
    rx - (borderThickness % 2
      ? 0.5
      : 0),
    ry - (borderThickness % 2
      ? 0.5
      : 0),
    0,
    0,
    Math.PI * 2,
    false
  );
  ctx.stroke();

  // inner ring border.
  ctx.beginPath();
  ctx.ellipse(
    cx,
    cy,
    irx + (borderThickness % 2
      ? 0.5
      : 0),
    iry + (borderThickness % 2
      ? 0.5
      : 0),
    0,
    0,
    Math.PI * 2,
    false
  );
  ctx.stroke();
  ctx.restore();
};

/**
 * Computes the inner rectangle to draw into by applying border/padding options.
 * This prevents the fill from touching the border while letting each style
 * render its own border/backdrop shape.
 * @param {Rectangle} rect The outer rectangle passed to drawGauge.
 * @param {WindowGaugeOptions} options The gauge options (includes border settings).
 * @returns {Rectangle} The inner rect.
 */
Window_Base.prototype._computeGaugeInnerRect = function(rect, options)
{
  // pull padding factors.
  const borderThickness = Math.max(1, options.borderThickness);
  const borderGap = Math.max(0, options.borderGap);

  // compute inner rect inside the padding.
  const ix = rect.x + borderThickness + borderGap;
  const iy = rect.y + borderThickness + borderGap;
  const iw = Math.max(0, rect.width - ((borderThickness + borderGap) * 2));
  const ih = Math.max(0, rect.height - ((borderThickness + borderGap) * 2));

  // return the inner rect.
  return {
    x: ix,
    y: iy,
    width: iw,
    height: ih
  };
};

//endregion draw gauge
//endregion Window_Base