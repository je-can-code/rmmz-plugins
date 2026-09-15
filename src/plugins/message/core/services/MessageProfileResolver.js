//region MessageProfileResolver
import MessageSpeakerProfile from '../__models/MessageSpeakerProfile.js';

/**
 * Works out who is talking, so their profile can be applied to what they say.
 *
 * There is no speaker id in an RMMZ message. There is a Name field and a face image, and between
 * them they identify almost everybody: a project that has been filling in either one has been
 * building this index for years without meaning to, which is what makes a voice system something
 * that can be switched on rather than something that has to be migrated toward.
 *
 * **The name is asked first, and it is matched literally.** The Name field holds whatever the
 * author typed, and `\N[1]` is a perfectly ordinary thing to type there - the message window
 * resolves that code into an actor's name at draw time, but the field itself never does. So the key
 * is the code, not the name it renders as, and a config entry written under the rendered name would
 * match nothing at all. It is the single most likely way to author this wrong.
 *
 * The face is asked second and keyed with its index as well as its filename, because a shared sheet
 * is eight different people. Keying on the sheet alone would hand one voice to all of them.
 *
 * Anyone neither question identifies gets the default profile, and that is a correct answer rather
 * than a fallback: narration, signposts and system text have no speaker, and giving them one would
 * be the actual mistake.
 */
class MessageProfileResolver
{
  /**
   * Separates a face sheet's filename from the index within it, in a config key.
   * @type {string}
   */
  static FaceKeySeparator = ':';

  /**
   * The profiles keyed by the literal contents of a message's Name field.
   * @type {Map<string, MessageSpeakerProfile>}
   */
  static #bySpeakerName = new Map();

  /**
   * The profiles keyed by face sheet and index.
   * @type {Map<string, MessageSpeakerProfile>}
   */
  static #byFace = new Map();

  /**
   * The profile handed to anyone the other two cannot identify.
   * @type {MessageSpeakerProfile}
   */
  static #fallback = MessageSpeakerProfile.default();

  /**
   * Replaces everything this resolver knows with the contents of a parsed config.
   *
   * Wholesale rather than incremental, because a reload during development should leave no trace of
   * the profile it replaced - a speaker deleted from the config must stop being recognised.
   * @param {object} config The parsed message config.
   */
  static load(config)
  {
    MessageProfileResolver.#bySpeakerName = MessageProfileResolver.buildProfiles(config.bySpeakerName);
    MessageProfileResolver.#byFace = MessageProfileResolver.buildProfiles(config.byFace);
    MessageProfileResolver.#fallback = MessageProfileResolver.buildFallback(config.defaultProfile);
  }

  /**
   * Turns one keyed section of the config into profiles.
   * @param {object} section The config section, or nothing if it was omitted.
   * @returns {Map<string, MessageSpeakerProfile>}
   */
  static buildProfiles(section)
  {
    const profiles = new Map();

    // a config that never mentions a section is saying there are none, which is a valid config.
    const entries = Object.entries(section ?? {});
    entries.forEach(([ key, entry ]) =>
    {
      profiles.set(key, MessageSpeakerProfile.fromConfig(entry));
    });

    return profiles;
  }

  /**
   * Builds the profile used for unidentified speakers.
   * @param {object} entry The config's default profile entry, or nothing if it was omitted.
   * @returns {MessageSpeakerProfile}
   */
  static buildFallback(entry)
  {
    // omitting it means "leave unidentified speakers exactly as the engine renders them".
    if (entry === undefined) return MessageSpeakerProfile.default();

    return MessageSpeakerProfile.fromConfig(entry);
  }

  /**
   * The config key a face sheet and index are stored under.
   * @param {string} faceName The face sheet's filename.
   * @param {number} faceIndex The index within that sheet.
   * @returns {string}
   */
  static faceKey(faceName, faceIndex)
  {
    return `${faceName}${MessageProfileResolver.FaceKeySeparator}${faceIndex}`;
  }

  /**
   * Resolves the profile for whoever is speaking the current message.
   * @param {string} speakerName The literal contents of the message's Name field.
   * @param {string} faceName The face sheet's filename, or empty if the message has no face.
   * @param {number} faceIndex The index within that sheet.
   * @returns {MessageSpeakerProfile}
   */
  static resolve(speakerName, faceName, faceIndex)
  {
    const named = MessageProfileResolver.#bySpeakerName.get(speakerName);
    if (named !== undefined) return named;

    const key = MessageProfileResolver.faceKey(faceName, faceIndex);
    const faced = MessageProfileResolver.#byFace.get(key);
    if (faced !== undefined) return faced;

    return MessageProfileResolver.#fallback;
  }
}

export default MessageProfileResolver;
//endregion MessageProfileResolver