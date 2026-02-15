//region IconManager (JABS-Input helpers)
/**
 * Resolves a combined (controller/keyboard) icon ex-text for a physical input symbol.
 * Falls back to raw symbol text when unmapped.
 * @param {string} symbol The physical input symbol (ex: "ok", "pagedown", "l2", "start").
 * @returns {string} The ex-text to render (may include one or more `\I[...]` tokens).
 */
IconManager.jabsIconTextForSymbol = function(symbol)
{
  // handle empty/unbound case.
  if (!symbol) return "(unbound)";

  // translate common engine/gamepad symbols to paired glyphs.
  switch (symbol)
  {
    // confirm / cancel
    case "ok":
      // Cross (pad) / Z (kb)
      return "\\I[2448] / \\I[2432]";
    case "cancel":
      // Circle (pad) / X (kb)
      return "\\I[2449] / \\I[2433]";

    // face buttons / modifiers
    case "shift":
      // Square (pad) / Shift (kb)
      return "\\I[2450] / \\I[2434]";
    case "tab":
      // Triangle (pad) / C (kb)
      return "\\I[2451] / \\I[2435]";

    // bumpers / triggers
    case "pageup":
      // L1 (pad) / Q (kb)
      return "\\I[2452] / \\I[2436]";
    case "pagedown":
      // R1 (pad) / E (kb)
      return "\\I[2453] / \\I[2438]";
    case "l2":
      // L2 (pad) / Ctrl (kb)
      return "\\I[2454] / \\I[2437]";
    case "r2":
      // R2 (pad) / Tab (kb)
      return "\\I[2455] / \\I[2439]";

    // meta buttons
    case "start":
      // Options/Menu (pad) / Enter (kb)
      return "\\I[2456] / \\I[2440]";
    case "select":
      // Select/Share (pad) / Del (kb)
      return "\\I[2457] / \\I[2441]";

    // default fallback
    default:
      // fall back to raw text if unmapped.
      return String(symbol);
  }
};

/**
 * Resolves a single icon index for a physical input symbol by consulting J.ABS.Input.
 * Useful for left-column glyphs. Returns 0 when unmapped.
 * @param {string} symbol The physical input symbol.
 * @returns {number} The icon index to draw, or 0 if none.
 */
IconManager.jabsIconIndexForSymbol = function(symbol)
{
  // if nothing is bound, do not draw an icon.
  if (!symbol) return 0;

  // reference the configured input constants (source of truth for symbols).
  const I = J.ABS.Input;

  // normalize any aliases if needed (currently a pass-through).
  const normalized = symbol;

  // map configured inputs to icon indices (single-glyph usage).
  const iconByInput = {
    // primaries
    [I.Mainhand]: 76,         // Cross / Z
    [I.Offhand]: 77,          // Circle / X
    [I.Tool]: 176,            // Triangle / C
    [I.Dash]: 140,            // Square / Shift

    // modifiers & mobility
    [I.SkillTrigger]: 86,     // L1 / Q
    [I.StrafeTrigger]: 82,    // L2 / Ctrl
    [I.GuardTrigger]: 83,     // R1 / E
    [I.MobilitySkill]: 13,    // R2 / Tab

    // menu-ish
    [I.Quickmenu]: 2563,      // Start / Enter
    [I.PartyCycle]: 75,       // Select / Del

    // combat face button triggers (shared glyph, by choice)
    [I.CombatSkill1]: 79,
    [I.CombatSkill2]: 79,
    [I.CombatSkill3]: 79,
    [I.CombatSkill4]: 79,
  };

  // return the matching icon index or 0 if not mapped.
  return iconByInput[normalized] || 0;
};
//endregion IconManager (JABS-Input helpers)