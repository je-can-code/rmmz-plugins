//region RPG_UsableItem
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

      // universal bypass carries no typed element list.
      if (this.isShieldBypassUniversal)
      {
        return null;
      }

      // parse the numeric list via RPGManager using the canonical regex.
      return RPGManager.getArrayFromNotesByRegex(this, J.ABS.EXT.SHIELD.RegExp.Bypass);
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
      return RPGManager.checkForBooleanFromNoteByRegex(this, J.ABS.EXT.SHIELD.RegExp.Bypass);
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

      // parameterized tags yield a parsed list; parameterless tags do not.
      const list = RPGManager.getArrayFromNotesByRegex(this, J.ABS.EXT.SHIELD.RegExp.Bypass, true);

      return list === null;
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
      // retrieve all matching formula strings from the note.
      const formulas = RPGManager.getStringsFromNoteByRegex(this, J.ABS.EXT.SHIELD.RegExp.ShieldDamage);

      // if no tags present, return an empty array for simpler consumers.
      return Array.isArray(formulas)
        ? formulas
        : [];
    },
    configurable: true
  },
});
//endregion RPG_UsableItem