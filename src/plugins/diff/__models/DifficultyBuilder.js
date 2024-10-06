//region DifficultyBuilder
/**
 * The fluent-builder for easily creating new difficulties.
 */
class DifficultyBuilder
{
  #name = String.empty;
  #key = String.empty;
  #description = String.empty;
  #iconIndex = 0;
  #cost = 0;

  #actorEffects = new DifficultyBattlerEffects();
  #enemyEffects = new DifficultyBattlerEffects();

  #rewards = new DifficultyBonusEffects();

  #enabled = false;
  #unlocked = true;
  #hidden = false;

  /**
   * Constructor.
   * @param {string} name The name of this difficulty.
   * @param {string} key The unique key of this difficulty.
   */
  constructor(name, key)
  {
    this.setName(name);
    this.setKey(key);
  }

  /**
   * Builds the difficulty with its current configuration.
   * @returns {DifficultyMetadata}
   */
  build()
  {
    // start the difficulty here.
    const difficulty = new DifficultyMetadata();

    // assign the core data.
    difficulty.name = this.#name;
    difficulty.key = this.#key;
    difficulty.description = this.#description;
    difficulty.iconIndex = this.#iconIndex;
    difficulty.cost = this.#cost;

    // assign the battler effects.
    difficulty.actorEffects = this.#actorEffects;
    difficulty.enemyEffects = this.#enemyEffects;

    // assign the bonuses.
    difficulty.rewards = this.#rewards;

    // assign the access booleans.
    difficulty.enabled = this.#enabled;
    difficulty.unlocked = this.#unlocked;
    difficulty.hidden = this.#hidden;

    // return the built product.
    return difficulty;
  }

  buildAsLayer()
  {
    // start the difficulty here.
    const difficulty = new DifficultyLayer(this.#key);

    // assign the core data.
    difficulty.name = this.#name;
    difficulty.description = this.#description;
    difficulty.iconIndex = this.#iconIndex;
    difficulty.cost = this.#cost;

    // assign the battler effects.
    difficulty.actorEffects = this.#actorEffects;
    difficulty.enemyEffects = this.#enemyEffects;

    // assign the bonuses.
    difficulty.rewards = this.#rewards;

    // assign the access booleans.
    difficulty.enabled = this.#enabled;
    difficulty.unlocked = this.#unlocked;
    difficulty.hidden = this.#hidden;

    // return the built product.
    return difficulty;
  }

  setName(name)
  {
    this.#name = name;
    return this;
  }

  setKey(key)
  {
    this.#key = key;
    return this;
  }

  setDescription(description)
  {
    this.#description = description;
    return this;
  }

  setIconIndex(iconIndex)
  {
    this.#iconIndex = iconIndex;
    return this;
  }

  setCost(cost)
  {
    this.#cost = cost;
    return this;
  }

  setActorEffects(effects)
  {
    this.#actorEffects = effects;
    return this;
  }

  setEnemyEffects(effects)
  {
    this.#enemyEffects = effects;
    return this;
  }

  setRewards(rewards)
  {
    this.#rewards = rewards;
    return this;
  }

  setUnlocked(unlocked)
  {
    this.#unlocked = unlocked;
    return this;
  }

  setEnabled(enabled)
  {
    this.#enabled = enabled;
    return this;
  }

  setHidden(hidden)
  {
    this.#hidden = hidden;
    return this;
  }
}

//endregion DifficultyBuilder