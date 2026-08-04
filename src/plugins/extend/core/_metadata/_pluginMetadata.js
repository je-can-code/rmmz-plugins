//region plugin metadata
class J_SkillExtendPluginMetadata extends PluginMetadata
{
  /**
   * The set of tag keys whose note lines are appended across extensions rather than replaced.
   * Plugins opt in by calling {@link registerNonCombiningKey} during Scene_Boot.
   * @type {Set<string>}
   */
  _nonCombiningKeys = new Set();

  /**
   * Constructor.
   */
  constructor(name, version)
  {
    super(name, version);
  }

  /**
   * Registers a tag key as non-combining for note merging.
   * When two extensions both carry this tag, their lines are appended rather than the overlay replacing the base.
   * The key is derived automatically from the provided regexp via {@link J.BASE.Helpers.getKeyFromRegexp}.
   * @param {RegExp} regexp The regexp whose tag key should be registered as non-combining.
   * @param {boolean} [asBoolean=false] Pass true for boolean tags (no colon) so the key is derived correctly.
   */
  registerNonCombiningKey(regexp, asBoolean = false)
  {
    // derive the tag key from the regexp and normalize to lowercase for case-insensitive matching.
    const key = J.BASE.Helpers.getKeyFromRegexp(regexp, asBoolean)
      .toLowerCase();

    this.nonCombiningKeys()
      .add(key);
  }

  /**
   * The live set of registered non-combining tag keys.
   * Registration mutates this set directly; readers should prefer {@link getNonCombiningKeys}, which
   * hands back a copy rather than the collection itself.
   * @returns {Set<string>} The backing set.
   */
  nonCombiningKeys()
  {
    return this._nonCombiningKeys;
  }

  /**
   * Gets all registered non-combining tag keys as an array.
   * @returns {string[]} The registered keys, all lowercase.
   */
  getNonCombiningKeys()
  {
    return [ ...this.nonCombiningKeys() ];
  }
}

export default J_SkillExtendPluginMetadata;
//endregion plugin metadata