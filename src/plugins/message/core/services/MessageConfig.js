//region MessageConfig
/**
 * The parsed contents of J-Message's external config, held where anything can ask for its own part
 * of it.
 *
 * The config file is read exactly once, at load, and this is what keeps that true as the number of
 * things reading it grows. An extension that read the file a second time would work, and would be
 * wrong: two readers means two moments at which the file can disagree with itself, and the one that
 * loses is whichever happened to run first.
 *
 * Sections are addressed by name rather than exposed as fields, so a ship that does not exist yet
 * can claim a section of the config without anything in core changing to let it.
 *
 * **An absent section is an answer, not a failure.** The whole file is optional by design - a
 * project that has written no config at all is a supported project - so every consumer has to hold
 * its own defaults regardless, and handing back an empty section lets it merge over them with no
 * special case for "the file was never written".
 */
class MessageConfig
{
  /**
   * Every section of the config, exactly as the file was parsed.
   * @type {object}
   */
  static #config = {};

  /**
   * Replaces everything this holds with the contents of a parsed config.
   *
   * Wholesale rather than incremental, for the same reason the profile resolver does it wholesale: a
   * reload during development must leave no trace of what it replaced, or a section deleted from the
   * file would go on being answered from memory.
   * @param {object} config The parsed message config.
   */
  static load(config)
  {
    MessageConfig.#config = config;
  }

  /**
   * Hands back one named section of the config.
   * @param {string} name The section's key in the config file, ex: `chatter`.
   * @returns {object} The section, or an empty one if the config never mentioned it.
   */
  static section(name)
  {
    const section = MessageConfig.#config[name];

    // a fresh object rather than a shared one, so a consumer merging its defaults into what it was
    // handed cannot accidentally write those defaults into everyone else's answer.
    if (section === undefined) return {};

    return section;
  }
}

export default MessageConfig;
//endregion MessageConfig