//region OmniQuestBuilder
/**
 * A builder for creating {@link OmniQuest}s.
 */
class OmniQuestBuilder
{
  #name = String.empty;
  #key = String.empty;
  #categoryKey = String.empty;
  #unknownHint = String.empty;
  #objectives = Array.empty;

  build()
  {
    const omniquest = new OmniQuest(this.#name, this.#key, this.#categoryKey, this.#unknownHint, this.#objectives);
    this.clear();
    return omniquest;
  }

  clear()
  {
    this.#name = String.empty;
    this.#key = String.empty;
    this.#categoryKey = String.empty;
    this.#unknownHint = String.empty;
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

  categoryKey(categoryKey)
  {
    this.#categoryKey = categoryKey;
    return this;
  }

  unknownHint(unknownHint)
  {
    this.#unknownHint = unknownHint;
    return this;
  }

  objectives(objectives)
  {
    this.#objectives = objectives;
    return this;
  }
}

//endregion OmniQuestBuilder