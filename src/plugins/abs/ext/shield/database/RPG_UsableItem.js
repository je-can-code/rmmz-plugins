//region RPG_Skill
Object.defineProperties(RPG_UsableItem.prototype, {
  /**
   * Gets the elementIds that this skill bypasses.
   *
   * Shapes supported:
   * - <shield-bypass> → universal bypass (handled by {@link isShieldBypassUniversal}); this getter returns null.
   * - <shield-bypass: [1, 5, 7]> → typed bypass list; returns an array of element ids.
   *
   * Notes:
   * - Returns null when no tag is present, or when the tag is parameterless (universal form).
   * - The parameterized list must contain only element ids (numbers); names are not supported for this tag.
   *
   * @type {number[]|null}
   */
  shieldBypassElements: {
    get: function()
    {
      // if there is no bypass tag at all, then nothing to parse.
      if (this.hasShieldBypass === false)
      {
        return null;
      }

      // reset the index.
      J.ABS.EXT.SHIELD.RegExp.Bypass.lastIndex = 0;

      // attempt to match the extension-provided bypass regex.
      const match = J.ABS.EXT.SHIELD.RegExp.Bypass.exec(this.note);

      // if somehow we didn't match (shouldn't happen), treat as no list.
      if (!match)
      {
        return null;
      }

      // when the capture group is missing/empty, this is the universal (parameterless) form.
      if (!match[1] || String(match[1])
        .trim().length === 0)
      {
        // universal bypass is handled by a separate boolean; return null here.
        return null;
      }

      // otherwise, parse the numeric list via RPGManager using the same regex.
      const list = RPGManager.getArrayFromNotesByRegex(this, J.ABS.EXT.SHIELD.RegExp.Bypass, true);

      // return the parsed numeric list.
      return list;
    },
    configurable: true
  },

  /**
   * Whether this skill/item declares a shield bypass of any kind.
   * Supports both parameterless and parameterized forms.
   * @type {boolean}
   */
  hasShieldBypass: {
    get: function()
    {
      // reset the index.
      J.ABS.EXT.SHIELD.RegExp.Bypass.lastIndex = 0;

      // simple presence check against the canonical regex.
      return J.ABS.EXT.SHIELD.RegExp.Bypass.test(this.note);
    },
    configurable: true
  },

  /**
   * True when the skill/item has the parameterless universal bypass form: <shield-bypass>
   * (no parameters after the colon). This means bypass ALL shields regardless of typing.
   * @type {boolean}
   */
  isShieldBypassUniversal: {
    get: function()
    {
      // if the tag doesn't exist at all, then it cannot be universal.
      if (this.hasShieldBypass === false)
      {
        return false;
      }

      // reset the index.
      J.ABS.EXT.SHIELD.RegExp.Bypass.lastIndex = 0;

      // exec to inspect the capture; universal form will have no usable group.
      const match = J.ABS.EXT.SHIELD.RegExp.Bypass.exec(this.note);

      // if present and no parameter payload, then it's universal.
      if (match && (!match[1] || String(match[1])
        .trim().length === 0))
      {
        return true;
      }

      // otherwise, it's the parameterized typed form.
      return false;
    },
    configurable: true
  },

  /**
   * A collection of damage formulas that contribute bonus SHIELD-ONLY damage.
   * Multiple tags are allowed; the results are summed when applying shields.
   * Ex: <shield-bonus:[a.atk*0.2]> or <shield-bonus:[p*0.5]> (where p is base HP damage).
   * @type {string[]}
   */
  shieldBonusFormulas: {
    get: function()
    {
      // reset the index.
      J.ABS.EXT.SHIELD.RegExp.ShieldDamage.lastIndex = 0;

      // Retrieve all matching formula strings from the note.
      const formulas = RPGManager.getStringsFromNoteByRegex(this, J.ABS.EXT.SHIELD.RegExp.ShieldDamage);

      // If no tags present, return an empty array for simpler consumers.
      return Array.isArray(formulas)
        ? formulas
        : [];
    },
    configurable: true
  },
});
//endregion RPG_Skill