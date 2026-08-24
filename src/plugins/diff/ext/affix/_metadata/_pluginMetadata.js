//region plugin metadata
import AffixEffects from '../__models/AffixEffects.js';

/**
 * The metadata for this extension, and the home of every calculation it performs.
 *
 * Three things are built here, at three different times, and keeping them apart is what makes the
 * whole extension tractable:
 *
 * 1. The per-layer effects, built once during script evaluation from the configuration J-Difficulty
 *    already parsed. Static data being reshaped; never rebuilt, never saved.
 * 2. The slot split for granted affixes, done once at `onDatabaseLoaded`, because deciding which
 *    pool a granted state belongs to needs its hydrated notetags.
 * 3. The folded pools, rebuilt whenever the set of enabled layers changes. This is the only part
 *    that is genuinely runtime state, because the player toggles layers.
 */
class JDifficultyAffix_PluginMetadata
  extends PluginMetadata
{
  /**
   * Constructor.
   */
  constructor(name, version)
  {
    super(name, version);
  }

  /**
   * Extends {@link #postInitialize}.<br/>
   * Also hands every configured layer the affix effects it declared.
   */
  postInitialize()
  {
    // execute original logic.
    super.postInitialize();

    // decorate the layers J-Difficulty already built with the fields its classifier dropped.
    this.decorateDifficultyMetadatas();
  }

  /**
   * The pool this extension hands out for prefix rolls, or null while the cache is cold.
   * @type {{map: Map<number, number>, totalWeight: number}|null}
   */
  _effectivePrefixPool = null;

  /**
   * The pool this extension hands out for suffix rolls, or null while the cache is cold.
   * @type {{map: Map<number, number>, totalWeight: number}|null}
   */
  _effectiveSuffixPool = null;

  /**
   * The current difficulty-adjusted prefix pool, or null when it has not been built yet.
   * Null is a real answer rather than a missing one: it is what the aliased seam reads to decide it
   * should hand back the untouched base pool, which is correct before any layer has been evaluated.
   * @returns {{map: Map<number, number>, totalWeight: number}|null}
   */
  effectivePrefixPool()
  {
    return this._effectivePrefixPool;
  }

  /**
   * The current difficulty-adjusted suffix pool, or null when it has not been built yet.
   * @returns {{map: Map<number, number>, totalWeight: number}|null}
   */
  effectiveSuffixPool()
  {
    return this._effectiveSuffixPool;
  }

  /**
   * Replaces the cached difficulty-adjusted prefix pool.
   * @param {{map: Map<number, number>, totalWeight: number}} pool The newly folded pool.
   */
  setEffectivePrefixPool(pool)
  {
    this._effectivePrefixPool = pool;
  }

  /**
   * Replaces the cached difficulty-adjusted suffix pool.
   * @param {{map: Map<number, number>, totalWeight: number}} pool The newly folded pool.
   */
  setEffectiveSuffixPool(pool)
  {
    this._effectiveSuffixPool = pool;
  }

  /**
   * Walks every configured difficulty layer and attaches the affix effects it declared.
   *
   * The raw configuration is read from J-Difficulty rather than from disk. That ship parses the file
   * inside its own constructor - during script evaluation, before this ship's script exists - so
   * there is no seam an extension could alias in time to influence the parse. What it can do is read
   * what was parsed, which is why J-Difficulty retains the raw blob alongside the objects it built.
   */
  decorateDifficultyMetadatas()
  {
    J.DIFFICULTY.Metadata.allRawConfigs.forEach((rawConfig, layerKey) =>
    {
      const { affixEffects } = rawConfig;

      // most layers declare no affix effects at all; they keep the prototype's null.
      if (affixEffects === undefined) return;

      const parsedEffects = AffixEffects.fromRaw(layerKey, affixEffects);
      const difficultyMetadata = J.DIFFICULTY.Metadata.allMetadatas.get(layerKey);

      difficultyMetadata.setAffixEffects(parsedEffects);
    });
  }

  /**
   * Validates every configured grant and sorts it into the slot its state belongs to.
   *
   * Every layer is checked, not merely the enabled ones. A grant sitting on a layer the player never
   * turns on is exactly as broken as one on a layer they always use, and the entire value of failing
   * at boot is that it fails for everyone on first launch rather than for one player, hours in, as a
   * silently absent affix that reads like bad luck.
   */
  assertGrantsAreValid()
  {
    J.DIFFICULTY.Metadata.allMetadatas.forEach((difficultyMetadata, layerKey) =>
    {
      const affixEffects = difficultyMetadata.getAffixEffects();

      // layers with no affix block have nothing to check.
      if (affixEffects === null) return;

      affixEffects.rawGrants()
        .forEach((weight, stateId) => this.assertGrantIsValid(layerKey, affixEffects, stateId, weight));
    });
  }

  /**
   * Validates one grant and records which slot (or slots) it applies to.
   * @param {string} layerKey The layer that authored this grant, for the error messages.
   * @param {AffixEffects} affixEffects The effects this grant belongs to.
   * @param {number} stateId The granted state.
   * @param {number} weight The weight this layer hands it.
   */
  assertGrantIsValid(layerKey, affixEffects, stateId, weight)
  {
    const state = $dataStates.at(stateId);

    // a grant naming nothing resolves to nothing at spawn time and simply never appears.
    if (!state)
    {
      throw new Error(
        `[J-Difficulty-Affix] layer [${layerKey}] grants state [${stateId}], which does not exist.`);
    }

    const isPrefix = state.isEnemyPrefix;
    const isSuffix = state.isEnemySuffix;

    // without a slot tag there is no pool to put the weight into, so the grant could never take.
    if (isPrefix === false && isSuffix === false)
    {
      throw new Error(
        `[J-Difficulty-Affix] layer [${layerKey}] grants state [${stateId}], which is neither ` +
        `<enemy-prefix> nor <enemy-suffix>.`);
    }

    // granting is how a reserved affix becomes reachable; applied to one that already rolls, it
    // would silently overwrite an authored weight instead, which no author means by the word.
    if (state.affixWeight !== 0)
    {
      throw new Error(
        `[J-Difficulty-Affix] layer [${layerKey}] grants state [${stateId}], which already has ` +
        `<affix-weight:${state.affixWeight}>; grants are only for states reserved at weight 0.`);
    }

    // a state carrying both tags is a member of both pools, so the grant unlocks it in both.
    if (isPrefix)
    {
      affixEffects.addPrefixGrant(stateId, weight);
    }

    if (isSuffix)
    {
      affixEffects.addSuffixGrant(stateId, weight);
    }
  }

  /**
   * The affix effects of every currently enabled difficulty layer.
   *
   * When nothing at all is enabled this falls back to the default layer's effects, mirroring
   * {@link Game_Temp#buildAppliedDifficulty}, which applies the default layer's parameter effects in
   * exactly that situation. Diverging would mean the default layer's stat half kept applying while
   * its affix half quietly stopped.
   * @returns {AffixEffects[]}
   */
  enabledAffixEffects()
  {
    const enabledKeys = $gameSystem.getAllDifficultyConfigs()
      .filter(config => config.enabled)
      .map(config => config.key);

    const keysToRead = enabledKeys.length === 0
      ? [ J.DIFFICULTY.Metadata.defaultKey ]
      : enabledKeys;

    const effects = [];

    keysToRead.forEach(layerKey =>
    {
      const difficultyMetadata = J.DIFFICULTY.Metadata.allMetadatas.get(layerKey);
      const affixEffects = difficultyMetadata.getAffixEffects();

      // layers declaring no affix block contribute nothing rather than contributing identity.
      if (affixEffects === null) return;

      effects.push(affixEffects);
    });

    return effects;
  }

  /**
   * The combined multiplier applied to a spawn's prefix chance, as a factor rather than a percent.
   * Layers compose multiplicatively, matching how every other difficulty effect combines.
   * @param {AffixEffects[]} allEffects The effects of the currently enabled layers.
   * @returns {number}
   */
  combinedPrefixChanceFactor(allEffects)
  {
    return allEffects.reduce((runningFactor, effects) => runningFactor * (effects.prefixChance / 100), 1);
  }

  /**
   * The combined multiplier applied to a spawn's suffix chance, as a factor rather than a percent.
   * @param {AffixEffects[]} allEffects The effects of the currently enabled layers.
   * @returns {number}
   */
  combinedSuffixChanceFactor(allEffects)
  {
    return allEffects.reduce((runningFactor, effects) => runningFactor * (effects.suffixChance / 100), 1);
  }

  /**
   * The combined flatten of the enabled layers, as a factor between 0 and 1.
   *
   * Flattening rewrites a weight as `mean - (mean - weight) * (1 - f)`, so what each application
   * really does is scale that weight's distance from the mean by `(1 - f)`. Two applications scale it
   * by the product of their complements, which is why layers combine as `1 - product(1 - f)` and not
   * as a sum. Two layers at 40 give 64, not 80.
   *
   * That form is also order-independent, which matters because the enabled layers arrive in map
   * order and nothing about that order is meaningful. It holds because flattening preserves the
   * pool's total, so the mean every layer interpolates toward is the same one.
   * @param {AffixEffects[]} allEffects The effects of the currently enabled layers.
   * @returns {number}
   */
  combinedFlatten(allEffects)
  {
    const remainingDistance = allEffects.reduce(
      (runningDistance, effects) => runningDistance * (1 - (effects.flatten / 100)),
      1);

    return 1 - remainingDistance;
  }

  /**
   * The union of every enabled layer's prefix grants, keyed by state id.
   *
   * Two layers granting the same affix resolve to the larger weight rather than to their sum. A
   * grant is a statement about how rare something ought to be at that difficulty, and two layers
   * each saying "50" both mean 50 - reading them as an accumulating resource would make an affix
   * progressively common purely as a side effect of enabling unrelated layers.
   * @param {AffixEffects[]} allEffects The effects of the currently enabled layers.
   * @returns {Map<number, number>}
   */
  combinedPrefixGrants(allEffects)
  {
    return JDifficultyAffix_PluginMetadata.mergeGrantsByMax(allEffects.map(effects => effects.prefixGrants()));
  }

  /**
   * The union of every enabled layer's suffix grants, keyed by state id.
   * @param {AffixEffects[]} allEffects The effects of the currently enabled layers.
   * @returns {Map<number, number>}
   */
  combinedSuffixGrants(allEffects)
  {
    return JDifficultyAffix_PluginMetadata.mergeGrantsByMax(allEffects.map(effects => effects.suffixGrants()));
  }

  /**
   * Folds several grant maps into one, keeping the largest weight offered for each state.
   * @param {Map<number, number>[]} allGrants The grant maps to merge.
   * @returns {Map<number, number>}
   */
  static mergeGrantsByMax(allGrants)
  {
    const merged = new Map();

    allGrants.forEach(grants =>
    {
      grants.forEach((weight, stateId) =>
      {
        const existing = merged.get(stateId);
        const winner = existing === undefined
          ? weight
          : Math.max(existing, weight);

        merged.set(stateId, winner);
      });
    });

    return merged;
  }

  /**
   * Rebuilds both difficulty-adjusted pools from the currently enabled layers.
   * Called whenever the enabled set changes, which is rare - spawns are frequent and difficulty
   * toggles are not, so the folded result is cached rather than recomputed per enemy.
   */
  buildEffectivePools()
  {
    const allEffects = this.enabledAffixEffects();
    const flatten = this.combinedFlatten(allEffects);

    const {
      prefixMap,
      suffixMap
    } = J.PASSIVE.EXT.AFFIX.Metadata;

    const prefixGrants = this.combinedPrefixGrants(allEffects);
    const suffixGrants = this.combinedSuffixGrants(allEffects);

    this.setEffectivePrefixPool(JDifficultyAffix_PluginMetadata.buildPool(prefixMap, flatten, prefixGrants));
    this.setEffectiveSuffixPool(JDifficultyAffix_PluginMetadata.buildPool(suffixMap, flatten, suffixGrants));
  }

  /**
   * Builds one difficulty-adjusted pool from a base pool, a flatten, and a set of grants.
   *
   * The base pool is copied rather than edited. It belongs to J-Passive-Affix and is that ship's only
   * record of how the affixes were authored, so flattening it in place would not merely leak - it
   * would compound, flattening an already-flattened pool every time the player touched a layer.
   * @param {Map<number, number>} basePool The authored pool for this slot.
   * @param {number} flatten How far to pull each weight toward the mean, between 0 and 1.
   * @param {Map<number, number>} grants The weights to hand to reserved states, keyed by state id.
   * @returns {{map: Map<number, number>, totalWeight: number}}
   */
  static buildPool(basePool, flatten, grants)
  {
    const pool = new Map(basePool);

    // flatten only what was authored as drawable, then let grants speak for what was not.
    JDifficultyAffix_PluginMetadata.flattenPool(pool, flatten);

    // granted weights replace the reserved zero outright and are deliberately never flattened -
    // were they included, a flatten of 100 would lift every reserved affix to the mean and unlock
    // the entire set without any layer having granted anything.
    grants.forEach((weight, stateId) => pool.set(stateId, weight));

    // summed from the finished map rather than carried forward, because grants change the total and
    // any drift between the two lets the roll overshoot the entries and return nothing at all.
    let totalWeight = 0;
    pool.forEach(weight => totalWeight += weight);

    return {
      map: pool,
      totalWeight,
    };
  }

  /**
   * Pulls every drawable weight in a pool toward that pool's mean, in place.
   *
   * Only entries authored above zero participate, and the mean is taken over that same set. Reserved
   * affixes sitting at zero are not part of the distribution being levelled - they are not in the
   * pool in any meaningful sense until something grants them a weight.
   * @param {Map<number, number>} pool The pool to flatten, modified in place.
   * @param {number} flatten How far to pull each weight toward the mean, between 0 and 1.
   */
  static flattenPool(pool, flatten)
  {
    let drawableCount = 0;
    let drawableWeight = 0;

    pool.forEach(weight =>
    {
      if (weight <= 0) return;

      drawableCount++;
      drawableWeight += weight;
    });

    // an all-reserved pool divides by zero here and yields NaN, which is safe only because the
    // assignment below is gated on the same predicate this count was built from: with nothing
    // drawable, nothing is ever assigned, so the NaN has nowhere to go. Widening either predicate
    // without the other is what would let it escape into the weights.
    const mean = drawableWeight / drawableCount;

    pool.forEach((weight, stateId) =>
    {
      if (weight <= 0) return;

      // a flatten of zero lands here too and rewrites each weight as itself, exactly - there is no
      // separate identity case to short-circuit, because the arithmetic already is one.
      pool.set(stateId, weight + ((mean - weight) * flatten));
    });
  }
}

export default JDifficultyAffix_PluginMetadata;
//endregion plugin metadata