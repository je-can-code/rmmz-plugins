//region DifficultyMetadata
/**
 * The affix biasing this layer applies while it is enabled, or null when it declares none.
 *
 * Seeded on the prototype rather than in a constructor because this extension has no constructor to
 * seed it in - J-Difficulty builds every layer before this ship's script is ever evaluated. A
 * prototype default is what makes an undecorated layer answer with the cold value that every reader
 * tests against, instead of `undefined`.
 * @type {AffixEffects|null}
 */
DifficultyMetadata.prototype._affixEffects = null;

/**
 * The affix biasing this difficulty layer applies while it is enabled.
 * Most layers declare none and answer null; only the ones authored with an `affixEffects` block in
 * the difficulty configuration carry one.
 * @returns {AffixEffects|null}
 */
DifficultyMetadata.prototype.getAffixEffects = function()
{
  return this._affixEffects;
};

/**
 * Assigns the affix biasing this layer applies.
 * Called once per authored layer during this extension's boot, and never again - the configuration
 * driving it is static for the life of the session.
 * @param {AffixEffects} affixEffects The effects parsed from this layer's configuration.
 */
DifficultyMetadata.prototype.setAffixEffects = function(affixEffects)
{
  this._affixEffects = affixEffects;
};
//endregion DifficultyMetadata