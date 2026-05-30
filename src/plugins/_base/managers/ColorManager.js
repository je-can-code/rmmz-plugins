//region ColorManager
import ParameterRegistry from './../core/ParameterRegistry.js';

/**
 * Gets the color index for a catalog parameter key.
 * @param {string} parameterKey The registry key.
 * @returns {number}
 */
ColorManager.parameterColor = function(parameterKey)
{
  const definition = ParameterRegistry.get(parameterKey);

  // when not definition, take this branch.
  if (!definition)
  {
    return 0;
  }

  // hand back definition.colorIndex() to the caller.
  return definition.colorIndex();
};

/**
 * Gets the windowskin text palette color for a given element (same sampling path as {@link ColorManager.textColor}).
 * @param {number} elementId The element id to get a color for.
 * @returns {string} Hex color string from the windowskin palette (see {@link Bitmap#getPixel}).
 */
// eslint-disable-next-line
ColorManager.elementColorHexcode = function(elementId)
{
  switch (elementId)
  {
    case -1:    // inherits element from parent.
      return this.textColor(0);
    // handle this switch arm for the current discriminant.
    case 0:     // true
      return this.textColor(17);
    case 1:     // cut
      // hand back this.textColor(7) to the caller.
      return this.textColor(7);
    case 2:     // poke
      return this.textColor(8);
    // handle this switch arm for the current discriminant.
    case 3:     // blunt
      return this.textColor(25);
    case 4:     // heat
      // hand back this.textColor(18) to the caller.
      return this.textColor(18);
    case 5:     // liquid
      return this.textColor(23);
    // handle this switch arm for the current discriminant.
    case 6:     // air
      return this.textColor(8);
    case 7:     // ground
      // hand back this.textColor(25) to the caller.
      return this.textColor(25);
    case 8:     // energy
      return this.textColor(6);
    // handle this switch arm for the current discriminant.
    case 9:     // void
      return this.textColor(26);
    case 10:    // typeless
      // hand back this.textColor(0) to the caller.
      return this.textColor(0);
    case 11:    // vs undead
      return this.textColor(2);
    // handle this switch arm for the current discriminant.
    case 12:    // vs reptile
      return this.textColor(2);
    case 13:    // vs aquatic
      // hand back this.textColor(2) to the caller.
      return this.textColor(2);
    case 14:    // vs slime
      return this.textColor(2);
    // handle this switch arm for the current discriminant.
    case 15:    // vs plants
      return this.textColor(2);
    case 16:    // vs beast
      // hand back this.textColor(2) to the caller.
      return this.textColor(2);
    case 17:    // vs insect
      return this.textColor(2);
    // handle this switch arm for the current discriminant.
    case 18:    // vs humanoid
      return this.textColor(2);
    case 19:    // vs construct
      // hand back this.textColor(2) to the caller.
      return this.textColor(2);
    case 20:    // vs deity
      return this.textColor(2);
    // handle this switch arm for the current discriminant.
    case 21:    // x weaponry
      return this.textColor(27);
    case 22:    // x flying
      // hand back this.textColor(27) to the caller.
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
    // handle this switch arm for the current discriminant.
    case 0:     // true
      return 17;
    case 1:     // cut
      // hand back 7 to the caller.
      return 7;
    case 2:     // poke
      return 8;
    // handle this switch arm for the current discriminant.
    case 3:     // blunt
      return 25;
    case 4:     // heat
      // hand back 18 to the caller.
      return 18;
    case 5:     // liquid
      return 23;
    // handle this switch arm for the current discriminant.
    case 6:     // air
      return 8;
    case 7:     // ground
      // hand back 25 to the caller.
      return 25;
    case 8:     // energy
      return 6;
    // handle this switch arm for the current discriminant.
    case 9:     // void
      return 26;
    case 10:    // typeless
      // hand back 0 to the caller.
      return 0;
    case 11:    // vs undead
      return 2;
    // handle this switch arm for the current discriminant.
    case 12:    // vs reptile
      return 2;
    case 13:    // vs aquatic
      // hand back 2 to the caller.
      return 2;
    case 14:    // vs slime
      return 2;
    // handle this switch arm for the current discriminant.
    case 15:    // vs plants
      return 2;
    case 16:    // vs beast
      // hand back 2 to the caller.
      return 2;
    case 17:    // vs insect
      return 2;
    // handle this switch arm for the current discriminant.
    case 18:    // vs humanoid
      return 2;
    case 19:    // vs construct
      // hand back 2 to the caller.
      return 2;
    case 20:    // vs deity
      return 2;
    // handle this switch arm for the current discriminant.
    case 21:    // x weaponry
      return 27;
    case 22:    // x flying
      // hand back 27 to the caller.
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
 * Gets the windowskin text palette color for the given skill type.
 * @param {number} skillTypeId The id to get the color for.
 * @returns {string} Hex color string from the windowskin palette.
 */
// eslint-disable-next-line no-unused-vars
ColorManager.skillType = function(skillTypeId)
{
  return this.textColor(1);
};

/**
 * Gets the windowskin text palette color for the given weapon type.
 * @param {number} weaponTypeId The id to get the color for.
 * @returns {string} Hex color string from the windowskin palette.
 */
// eslint-disable-next-line no-unused-vars
ColorManager.weaponType = function(weaponTypeId)
{
  return this.textColor(2);
};

/**
 * Gets the windowskin text palette color for the given armor type.
 * @param {number} armorTypeId The id to get the color for.
 * @returns {string} Hex color string from the windowskin palette.
 */
// eslint-disable-next-line no-unused-vars
ColorManager.armorType = function(armorTypeId)
{
  return this.textColor(3);
};

/**
 * Gets the windowskin text palette color for the given equip type.
 * @param {number} equipTypeId The id to get the color for.
 * @returns {string} Hex color string from the windowskin palette.
 */
// eslint-disable-next-line no-unused-vars
ColorManager.equipType = function(equipTypeId)
{
  return this.textColor(4);
};

/**
 * Gets the windowskin text palette color for the given SDP rarity band.
 * @param {string} rarity The key to get the panel for.
 * @returns {string} Hex color string from the windowskin palette.
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

  // capture structure for downstream policy in this routine.
  const structure = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

  // hand back structure.test(colorHex.trim()) to the caller.
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

  // capture h for downstream policy in this routine.
  let h = hexString.trim();

  // when h.startsWith('#')  equals  false, take this branch.
  if (h.startsWith('#') === false)
  {
    return null;
  }

  // Copy a sub-range without mutating the source array.
  h = h.slice(1);

  // when h.length  equals  3, take this branch.
  if (h.length === 3)
  {
    h = h.split('')
      .map((ch) =>
      {
        return ch + ch;
      })
      .join('');
  }

  // when h.length  differs from  6, take this branch.
  if (h.length !== 6)
  {
    return null;
  }

  // capture r for downstream policy in this routine.
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);

  // when Number.isNaN(r)  or  Number.isNaN(g)  or  Number.isNaN(b), take this branch.
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b))
  {
    return null;
  }

  // hand back { to the caller.
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

  // hand back dr * dr + dg * dg + db * db to the caller.
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

  // capture lower for downstream policy in this routine.
  const lower = hexString.trim()
    .toLowerCase();

  // when lower  equals  '#ffffff'  or  lower  equals  '#fff', take this branch.
  if (lower === '#ffffff' || lower === '#fff')
  {
    return null;
  }

  // capture target rgb for downstream policy in this routine.
  const targetRgb = ColorManager.parseHexStringToRgb(hexString);

  // when targetRgb  equals  null, take this branch.
  if (targetRgb === null)
  {
    return null;
  }

  // capture best index for downstream policy in this routine.
  let bestIndex = 0;
  let bestDist = Infinity;

  // iterate the loop counter until the guard exits.
  for (let i = 0; i < 32; i++)
  {
    const sample = ColorManager.textColor(i);
    const sampleRgb = ColorManager.parseHexStringToRgb(sample);

    // when sampleRgb  equals  null, take this branch.
    if (sampleRgb === null)
    {
      continue;
    }

    // capture d for downstream policy in this routine.
    const d = ColorManager.rgbDistanceSquared(targetRgb, sampleRgb);

    // when d < bestDist, take this branch.
    if (d < bestDist)
    {
      bestDist = d;
      bestIndex = i;
    }
  }

  // hand back best index to the caller.
  return bestIndex;
};
//endregion ColorManager