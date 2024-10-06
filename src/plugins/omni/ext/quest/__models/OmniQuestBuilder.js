//region OmniQuestBuilder
/**
 * A builder for creating {@link OmniQuest}s.
 */
class OmniQuestBuilder
{
  #name = String.empty;
  #key = String.empty;
  #categoryKey = String.empty;
  #tagKeys = Array.empty;
  #unknownHint = String.empty;
  #overview = String.empty;
  #recommendedLevel = 0;
  #objectives = Array.empty;

  build()
  {
    const omniquest = new OmniQuest(this.#name,
      this.#key,
      this.#categoryKey,
      this.#tagKeys,
      this.#unknownHint,
      this.#overview,
      this.#recommendedLevel,
      this.#objectives);
    this.clear();
    return omniquest;
  }

  clear()
  {
    this.#name = String.empty;
    this.#key = String.empty;
    this.#categoryKey = Array.empty;
    this.#tagKeys = Array.empty;
    this.#unknownHint = String.empty;
    this.#overview = String.empty;
    this.#recommendedLevel = 0;
    this.#objectives = Array.empty;
  }

  name(name)
  {
    this.#name = name;
    return this;
  }

  key(key)
  {
    this.#key = key;
    return this;
  }

  categoryKey(categoryKeys)
  {
    this.#categoryKey = categoryKeys;
    return this;
  }

  tagKeys(tagKeys)
  {
    this.#tagKeys = tagKeys;
    return this;
  }

  unknownHint(unknownHint)
  {
    this.#unknownHint = unknownHint;
    return this;
  }

  overview(overview)
  {
    this.#overview = overview;
    return this;
  }

  recommendedLevel(recommendedLevel)
  {
    this.#recommendedLevel = recommendedLevel;
    return this;
  }

  objectives(objectives)
  {
    this.#objectives = objectives;
    return this;
  }
}

//endregion OmniQuestBuilder