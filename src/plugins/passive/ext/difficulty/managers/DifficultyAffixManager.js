//region DifficultyAffixManager
/**
 * The home of every calculation that lets difficulty layers bias how enemy affixes roll.
 *
 * Three things are built for this, at three different times, and keeping them apart is what makes the
 * whole feature tractable:
 *
 * 1. The per-layer effects, parsed once while the difficulty configuration is classified. Static data
 *    being reshaped; never rebuilt, never saved.
 * 2. The slot split for granted affixes, done once at `onDatabaseLoaded`, because deciding which pool a
 *    granted state belongs to needs its hydrated notetags.
 * 3. The folded pools, rebuilt whenever the set of layers in force changes. This is the only part that is
 *    genuinely runtime state, because the player toggles layers.
 *
 * Everything here reaches into J-Passive-Affix, so nothing calls it unless that plugin is installed.
 */
class DifficultyAffixManager
{
  //region caches
  /**
   * The pool handed out for prefix rolls, or null while the cache is cold.
   * Null is a real answer rather than a missing one: it is what the aliased seam reads to decide it
   * should hand back the untouched base pool, which is correct before any layer has been evaluated.
   * @type {{map: Map<number, number>, totalWeight: number}|null}
   */
  static #effectivePrefixPool = null;

  /**
   * The pool handed out for suffix rolls, or null while the cache is cold.
   * @type {{map: Map<number, number>, totalWeight: number}|null}
   */
  static #effectiveSuffixPool = null;

  /**
   * The multiplier the layers in force apply to a spawn's prefix chance, as a factor.
   * Identity until the layers have been folded, which is the honest answer before then.
   * @type {number}
   */
  static #prefixChanceFactor = 1;

  /**
   * The multiplier the layers in force apply to a spawn's suffix chance, as a factor.
   * @type {number}
   */
  static #suffixChanceFactor = 1;
  //endregion caches

  /**
   * The constructor is not designed to be called.
   * This is a static class.
   */
  constructor()
  {
    throw new Error('This is a static class.');
  }

  //region cache accessors
  /**
   * The current difficulty-adjusted prefix pool, or null when it has not been built yet.
   * @returns {{map: Map<number, number>, totalWeight: number}|null}
   */
  static effectivePrefixPool()
  {
    return DifficultyAffixManager.#effectivePrefixPool;
  }

  /**
   * The current difficulty-adjusted suffix pool, or null when it has not been built yet.
   * @returns {{map: Map<number, number>, totalWeight: number}|null}
   */
  static effectiveSuffixPool()
  {
    return DifficultyAffixManager.#effectiveSuffixPool;
  }

  /**
   * Replaces the cached difficulty-adjusted prefix pool.
   * @param {{map: Map<number, number>, totalWeight: number}|null} pool The newly folded pool.
   */
  static setEffectivePrefixPool(pool)
  {
    DifficultyAffixManager.#effectivePrefixPool = pool;
  }

  /**
   * Replaces the cached difficulty-adjusted suffix pool.
   * @param {{map: Map<number, number>, totalWeight: number}|null} pool The newly folded pool.
   */
  static setEffectiveSuffixPool(pool)
  {
    DifficultyAffixManager.#effectiveSuffixPool = pool;
  }

  /**
   * The multiplier the layers in force apply to a spawn's prefix chance.
   * Cached rather than folded per spawn: spawns are frequent, difficulty toggles are not, and the answer
   * cannot change between the two.
   * @returns {number}
   */
  static prefixChanceFactor()
  {
    return DifficultyAffixManager.#prefixChanceFactor;
  }

  /**
   * The multiplier the layers in force apply to a spawn's suffix chance.
   * @returns {number}
   */
  static suffixChanceFactor()
  {
    return DifficultyAffixManager.#suffixChanceFactor;
  }

  /**
   * Replaces the cached prefix chance multiplier.
   * @param {number} factor The newly folded factor.
   */
  static setPrefixChanceFactor(factor)
  {
    DifficultyAffixManager.#prefixChanceFactor = factor;
  }

  /**
   * Replaces the cached suffix chance multiplier.
   * @param {number} factor The newly folded factor.
   */
  static setSuffixChanceFactor(factor)
  {
    DifficultyAffixManager.#suffixChanceFactor = factor;
  }
  //endregion cache accessors

  //region grant validation
  /**
   * Validates every configured grant and sorts it into the slot its state belongs to.
   *
   * Every layer is checked, not merely the enabled ones. A grant sitting on a layer the player never
   * turns on is exactly as broken as one on a layer they always use, and the entire value of failing at
   * boot is that it fails for everyone on first launch rather than for one player, hours in, as a
   * silently absent affix that reads like bad luck.
   */
  static assertGrantsAreValid()
  {
    J.PASSIVE.EXT.DIFFICULTY.Metadata.allMetadatas.forEach((difficultyMetadata, layerKey) =>
    {
      const { affixEffects } = difficultyMetadata;

      // layers with no affix block have nothing to check.
      if (affixEffects === null) return;

      affixEffects.rawGrants()
        .forEach((weight, stateId) =>
          DifficultyAffixManager.assertGrantIsValid(layerKey, affixEffects, stateId, weight));
    });
  }

  /**
   * Validates one grant and records which slot (or slots) it applies to.
   * @param {string} layerKey The layer that authored this grant, for the error messages.
   * @param {AffixEffects} affixEffects The effects this grant belongs to.
   * @param {number} stateId The granted state.
   * @param {number} weight The weight this layer hands it.
   */
  static assertGrantIsValid(layerKey, affixEffects, stateId, weight)
  {
    // indexed rather than `at`, which wraps on a negative index and would resolve a grant keyed "-1"
    // to the last state in the database instead of to nothing at all.
    const state = $dataStates[stateId];

    // a grant naming nothing resolves to nothing at spawn time and simply never appears.
    if (!state)
    {
      throw new Error(
        `[${__PLUGIN_NAME__}] layer [${layerKey}] grants state [${stateId}], which does not exist.`);
    }

    const isPrefix = state.isEnemyPrefix;
    const isSuffix = state.isEnemySuffix;

    // without a slot tag there is no pool to put the weight into, so the grant could never take.
    if (isPrefix === false && isSuffix === false)
    {
      throw new Error(
        `[${__PLUGIN_NAME__}] layer [${layerKey}] grants state [${stateId}], which is neither ` +
        `<enemy-prefix> nor <enemy-suffix>.`);
    }

    // granting is how a reserved affix becomes reachable; applied to one that already rolls, it would
    // silently overwrite an authored weight instead, which no author means by the word.
    if (state.affixWeight !== 0)
    {
      throw new Error(
        `[${__PLUGIN_NAME__}] layer [${layerKey}] grants state [${stateId}], which already has ` +
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
  //endregion grant validation

  //region folding
  /**
   * The affix effects of every difficulty layer in force.
   * Which layers are in force, including the fall back to the default layer when nothing is enabled,
   * is decided in one place, {@link Game_Temp#difficultyLayersInForce}, so the affix half of a layer can
   * never disagree with its state half about whether that layer applies.
   * @returns {AffixEffects[]}
   */
  static affixEffectsInForce()
  {
    return $gameTemp.difficultyLayersInForce()
      .map(layer => layer.affixEffects)
      .filter(affixEffects => affixEffects !== null);
  }

  /**
   * The combined multiplier applied to a spawn's prefix chance, as a factor rather than a percent.
   * Layers compose multiplicatively.
   * @param {AffixEffects[]} allEffects The effects of the layers in force.
   * @returns {number}
   */
  static combinedPrefixChanceFactor(allEffects)
  {
    return allEffects.reduce((runningFactor, effects) => runningFactor * (effects.prefixChance / 100), 1);
  }

  /**
   * The combined multiplier applied to a spawn's suffix chance, as a factor rather than a percent.
   * @param {AffixEffects[]} allEffects The effects of the layers in force.
   * @returns {number}
   */
  static combinedSuffixChanceFactor(allEffects)
  {
    return allEffects.reduce((runningFactor, effects) => runningFactor * (effects.suffixChance / 100), 1);
  }

  /**
   * The combined flatten of the layers in force, as a factor between 0 and 1.
   *
   * Flattening rewrites a weight as `mean - (mean - weight) * (1 - f)`, so what each application really
   * does is scale that weight's distance from the mean by `(1 - f)`. Two applications scale it by the
   * product of their complements, which is why layers combine as `1 - product(1 - f)` and not as a sum.
   * Two layers at 40 give 64, not 80.
   *
   * That form is also order-independent, which matters because the layers arrive in config order and
   * nothing about that order is meaningful. It holds because flattening preserves the pool's total, so
   * the mean every layer interpolates toward is the same one.
   * @param {AffixEffects[]} allEffects The effects of the layers in force.
   * @returns {number}
   */
  static combinedFlatten(allEffects)
  {
    const remainingDistance = allEffects.reduce(
      (runningDistance, effects) => runningDistance * (1 - (effects.flatten / 100)),
      1);

    return 1 - remainingDistance;
  }

  /**
   * The union of every in-force layer's prefix grants, keyed by state id.
   *
   * Two layers granting the same affix resolve to the larger weight rather than to their sum. A grant is
   * a statement about how rare something ought to be at that difficulty, and two layers each saying "50"
   * both mean 50 - reading them as an accumulating resource would make an affix progressively common
   * purely as a side effect of enabling unrelated layers.
   * @param {AffixEffects[]} allEffects The effects of the layers in force.
   * @returns {Map<number, number>}
   */
  static combinedPrefixGrants(allEffects)
  {
    return DifficultyAffixManager.mergeGrantsByMax(allEffects.map(effects => effects.prefixGrants()));
  }

  /**
   * The union of every in-force layer's suffix grants, keyed by state id.
   * @param {AffixEffects[]} allEffects The effects of the layers in force.
   * @returns {Map<number, number>}
   */
  static combinedSuffixGrants(allEffects)
  {
    return DifficultyAffixManager.mergeGrantsByMax(allEffects.map(effects => effects.suffixGrants()));
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
   * Rebuilds both difficulty-adjusted pools and both chance factors from the layers in force.
   * Called whenever the set of layers in force changes, which is rare - spawns are frequent and
   * difficulty toggles are not, so the folded result is cached rather than recomputed per enemy.
   */
  static buildEffectivePools()
  {
    const allEffects = DifficultyAffixManager.affixEffectsInForce();
    const flatten = DifficultyAffixManager.combinedFlatten(allEffects);

    const {
      prefixMap,
      suffixMap
    } = J.PASSIVE.EXT.AFFIX.Metadata;

    const prefixGrants = DifficultyAffixManager.combinedPrefixGrants(allEffects);
    const suffixGrants = DifficultyAffixManager.combinedSuffixGrants(allEffects);

    const prefixPool = DifficultyAffixManager.buildPool(prefixMap, flatten, prefixGrants);
    const suffixPool = DifficultyAffixManager.buildPool(suffixMap, flatten, suffixGrants);

    DifficultyAffixManager.setEffectivePrefixPool(prefixPool);
    DifficultyAffixManager.setEffectiveSuffixPool(suffixPool);

    // folded here alongside the pools rather than at each spawn: the chance a layer asks for cannot
    // change between two spawns, and a spawn is the one place in this system that is genuinely hot.
    const prefixChanceFactor = DifficultyAffixManager.combinedPrefixChanceFactor(allEffects);
    const suffixChanceFactor = DifficultyAffixManager.combinedSuffixChanceFactor(allEffects);

    DifficultyAffixManager.setPrefixChanceFactor(prefixChanceFactor);
    DifficultyAffixManager.setSuffixChanceFactor(suffixChanceFactor);
  }

  /**
   * Builds one difficulty-adjusted pool from a base pool, a flatten, and a set of grants.
   *
   * The base pool is copied rather than edited. It belongs to J-Passive-Affix and is that ship's only
   * record of how the affixes were authored, so flattening it in place would not merely leak - it would
   * compound, flattening an already-flattened pool every time the player touched a layer.
   * @param {Map<number, number>} basePool The authored pool for this slot.
   * @param {number} flatten How far to pull each weight toward the mean, between 0 and 1.
   * @param {Map<number, number>} grants The weights to hand to reserved states, keyed by state id.
   * @returns {{map: Map<number, number>, totalWeight: number}}
   */
  static buildPool(basePool, flatten, grants)
  {
    const pool = new Map(basePool);

    // flatten only what was authored as drawable, then let grants speak for what was not.
    DifficultyAffixManager.flattenPool(pool, flatten);

    // granted weights replace the reserved zero outright and are deliberately never flattened - were
    // they included, a flatten of 100 would lift every reserved affix to the mean and unlock the
    // entire set without any layer having granted anything.
    grants.forEach((weight, stateId) => pool.set(stateId, weight));

    // summed from the finished map rather than carried forward, because grants change the total and any
    // drift between the two lets the roll overshoot the entries and return nothing at all.
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
   * affixes sitting at zero are not part of the distribution being levelled - they are not in the pool
   * in any meaningful sense until something grants them a weight.
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
  //endregion folding
}

export default DifficultyAffixManager;
//endregion DifficultyAffixManager