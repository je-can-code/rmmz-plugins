//region ColorManager
/**
 * Gets the color index from the "long" parameter id.
 *
 * "Long" parameter ids are used in the context of 0-27, rather than
 * 0-7 for param, 0-9 for xparam, and 0-9 for sparam.
 * @param {number} paramId The "long" parameter id.
 * @returns {number} The color index of the given parameter.
 */
ColorManager.longParam = function(paramId)
{
  switch (paramId)
  {
    // currently there are no special colors for parameters, but just in case...
    default:
      return 0;
  }
};

/**
 * Gets the color index for a given element.
 * @param {number} elementId The element id to get a color for.
 * @returns {number} The color index of the given element.
 */
// eslint-disable-next-line
ColorManager.elementColorHexcode = function(elementId)
{
  switch (elementId)
  {
    case -1:    // inherits element from parent.
      return this.textColor(0);
    case 0:     // true
      return this.textColor(17);
    case 1:     // cut
      return this.textColor(7);
    case 2:     // poke
      return this.textColor(8);
    case 3:     // blunt
      return this.textColor(25);
    case 4:     // heat
      return this.textColor(18);
    case 5:     // liquid
      return this.textColor(23);
    case 6:     // air
      return this.textColor(8);
    case 7:     // ground
      return this.textColor(25);
    case 8:     // energy
      return this.textColor(6);
    case 9:     // void
      return this.textColor(26);
    case 10:    // typeless
      return this.textColor(0);
    case 11:    // vs undead
      return this.textColor(2);
    case 12:    // vs reptile
      return this.textColor(2);
    case 13:    // vs aquatic
      return this.textColor(2);
    case 14:    // vs slime
      return this.textColor(2);
    case 15:    // vs plants
      return this.textColor(2);
    case 16:    // vs beast
      return this.textColor(2);
    case 17:    // vs insect
      return this.textColor(2);
    case 18:    // vs humanoid
      return this.textColor(2);
    case 19:    // vs construct
      return this.textColor(2);
    case 20:    // vs deity
      return this.textColor(2);
    case 21:    // x weaponry
      return this.textColor(27);
    case 22:    // x flying
      return this.textColor(27);
    case 23:    // x shields
      return this.textColor(27);
    case 24:    // x aura
      return this.textColor(27);
    case 25:    // tool shatter
      return this.textColor(20);
    case 26:    // tool crush
      return this.textColor(20);
    case 27:    // tool ignite
      return this.textColor(20);
    case 28:    // tool overload
      return this.textColor(20);
    default:
      return this.textColor(0);
  }
};

/**
 * Gets the color index for a given element.
 * @param {number} elementId The element id to get a color for.
 * @returns {number} The color index of the given element.
 */
// eslint-disable-next-line
ColorManager.elementColorIndex = function(elementId)
{
  switch (elementId)
  {
    case -1:    // inherits element from parent.
      return 0;
    case 0:     // true
      return 17;
    case 1:     // cut
      return 7;
    case 2:     // poke
      return 8;
    case 3:     // blunt
      return 25;
    case 4:     // heat
      return 18;
    case 5:     // liquid
      return 23;
    case 6:     // air
      return 8;
    case 7:     // ground
      return 25;
    case 8:     // energy
      return 6;
    case 9:     // void
      return 26;
    case 10:    // typeless
      return 0;
    case 11:    // vs undead
      return 2;
    case 12:    // vs reptile
      return 2;
    case 13:    // vs aquatic
      return 2;
    case 14:    // vs slime
      return 2;
    case 15:    // vs plants
      return 2;
    case 16:    // vs beast
      return 2;
    case 17:    // vs insect
      return 2;
    case 18:    // vs humanoid
      return 2;
    case 19:    // vs construct
      return 2;
    case 20:    // vs deity
      return 2;
    case 21:    // x weaponry
      return 27;
    case 22:    // x flying
      return 27;
    case 23:    // x shields
      return 27;
    case 24:    // x aura
      return 27;
    case 25:    // tool shatter
      return 20;
    case 26:    // tool crush
      return 20;
    case 27:    // tool ignite
      return 20;
    case 28:    // tool overload
      return 20;
    default:
      return 0;
  }
};

/**
 * Gets the color index of the given skill type.
 * @param {number} skillTypeId The id to get the color for.
 * @returns {rm.types.Color}
 */
ColorManager.skillType = function(skillTypeId)
{
  return this.textColor(1);
};

/**
 * Gets the color index of the given weapon type.
 * @param {number} weaponTypeId The id to get the color for.
 * @returns {rm.types.Color}
 */
ColorManager.weaponType = function(weaponTypeId)
{
  return this.textColor(2);
};

/**
 * Gets the color index of the given armor type.
 * @param {number} armorTypeId The id to get the color for.
 * @returns {rm.types.Color}
 */
ColorManager.armorType = function(armorTypeId)
{
  return this.textColor(3);
};

/**
 * Gets the color index of the given equip type.
 * @param {number} equipTypeId The id to get the color for.
 * @returns {rm.types.Color}
 */
ColorManager.equipType = function(equipTypeId)
{
  return this.textColor(4);
};

/**
 * Gets the color index of the given SDP.
 * @param {string} rarity The key to get the panel for.
 * @returns {rm.types.Color}
 */
ColorManager.sdp = function(rarity)
{
  // parse the rarity color.
  const rarityColorIndex = PanelRarity.fromRarityToColor(rarity);

  // return the text code for it.
  return this.textColor(rarityColorIndex);
};

/**
 * True when {@code colorHex} looks like {@code #RGB} or {@code #RRGGBB} (case-insensitive), including white.
 * @param {string} colorHex Candidate hex string.
 * @returns {boolean}
 */
ColorManager.isValidHexColor = function(colorHex)
{
  if (!colorHex || colorHex === String.empty)
  {
    return false;
  }

  const structure = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

  return structure.test(colorHex.trim());
};

/**
 * Parses {@code #RGB} or {@code #RRGGBB} into RGB components.
 * @param {string} hexString Source color.
 * @returns {{r:number,g:number,b:number}|null}
 */
ColorManager.parseHexStringToRgb = function(hexString)
{
  if (!hexString || hexString === String.empty)
  {
    return null;
  }

  let h = hexString.trim();

  if (h.startsWith('#') === false)
  {
    return null;
  }

  h = h.slice(1);

  if (h.length === 3)
  {
    h = h.split('')
      .map(function(ch)
      {
        return ch + ch;
      })
      .join('');
  }

  if (h.length !== 6)
  {
    return null;
  }

  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);

  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b))
  {
    return null;
  }

  return {
    r,
    g,
    b
  };
};

/**
 * Squared Euclidean distance between two RGB triples (fast compare without sqrt).
 * @param {{r:number,g:number,b:number}} a First color.
 * @param {{r:number,g:number,b:number}} b Second color.
 * @returns {number}
 */
ColorManager.rgbDistanceSquared = function(a, b)
{
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;

  return dr * dr + dg * dg + db * db;
};

/**
 * Picks the windowskin text palette index whose {@link ColorManager.textColor} sample is closest to {@code hexString}.
 * Pure white ({@code #fff} / {@code #ffffff}) returns {@code null} so callers can skip redundant {@code \\C[n]} wraps.
 * @param {string} hexString Candidate {@code #RGB} / {@code #RRGGBB}.
 * @returns {number|null} Palette index, or {@code null} when invalid or white.
 */
ColorManager.colorIndexFromHex = function(hexString)
{
  if (ColorManager.isValidHexColor(hexString) === false)
  {
    return null;
  }

  const lower = hexString.trim()
    .toLowerCase();

  if (lower === '#ffffff' || lower === '#fff')
  {
    return null;
  }

  const targetRgb = ColorManager.parseHexStringToRgb(hexString);

  if (targetRgb === null)
  {
    return null;
  }

  let bestIndex = 0;
  let bestDist = Infinity;

  for (let i = 0; i < 32; i++)
  {
    const sample = ColorManager.textColor(i);
    const sampleRgb = ColorManager.parseHexStringToRgb(sample);

    if (sampleRgb === null)
    {
      continue;
    }

    const d = ColorManager.rgbDistanceSquared(targetRgb, sampleRgb);

    if (d < bestDist)
    {
      bestDist = d;
      bestIndex = i;
    }
  }

  return bestIndex;
};
//endregion ColorManager