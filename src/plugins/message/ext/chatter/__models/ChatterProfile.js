//region ChatterProfile
/**
 * Everything settled about how one character chatters.
 *
 * Every field is populated, always. A profile is built by laying the page's tags over the project's
 * configured defaults, and those over the defaults written here - so by the time anything reads one,
 * "the author did not say" has already been answered and no consumer has to ask whether a value is
 * present before using it.
 *
 * The three layers exist because the three questions are different. The constants below are what
 * chatter means with nobody having configured anything at all; the config section is what *this*
 * project considers ordinary; the tags are what makes this particular shopkeeper louder than the
 * one across the street. Jeremy's expectation is that the third layer stays small: *"many will use a
 * single default with a couple of tweaks for an excited kid or bemoaning merchant."*
 */
class ChatterProfile
{
  /**
   * How many tiles away a character can be heard from, by default.
   * @type {number}
   */
  static DefaultRadius = 5;

  /**
   * How many frames a character rests after finishing a line, by default.
   * @type {number}
   */
  static DefaultCooldown = 600;

  /**
   * The longest a character waits before starting a line, by default, in frames.
   * @type {number}
   */
  static DefaultDelay = 300;

  /**
   * How many frames a finished line stays on screen, by default.
   * @type {number}
   */
  static DefaultDuration = 180;

  /**
   * How many frames each character of a line takes to appear, by default.
   * @type {number}
   */
  static DefaultSpeed = 2;

  /**
   * Which side of a character their chatter sits on, by default.
   * @type {string}
   */
  static DefaultPosition = 'top';

  /**
   * What a chatter bubble is drawn on, by default.
   * @type {string}
   */
  static DefaultBackground = 'window';

  /**
   * The Show Text Background value each authored word means.
   *
   * The same three the editor's own dropdown has offered since MV, named rather than numbered: a
   * plugin command argument is read by whoever writes the scene, and `dim` says what `1` does not.
   * @type {Object<string, number>}
   */
  static BackgroundTypes = {
    window: 0,
    dim: 1,
    transparent: 2,
  };

  /**
   * The position meaning a bubble hangs beneath its speaker rather than over them.
   *
   * The odd one out on purpose: `top` and `middle` both put a bubble above a character, exactly as
   * the Show Text Position dropdown does for a `\pop` message, so `bottom` is the only one of the
   * three that changes which end of the sprite gets aimed at.
   * @type {string}
   */
  static BelowPosition = 'bottom';

  /**
   * Everything this character may say.
   * @type {string[]}
   */
  #lines = [];

  /**
   * How many tiles away this character can be heard from.
   * @type {number}
   */
  #radius = ChatterProfile.DefaultRadius;

  /**
   * How many frames this character rests after finishing a line.
   * @type {number}
   */
  #cooldown = ChatterProfile.DefaultCooldown;

  /**
   * The longest this character waits before starting a line, in frames.
   * @type {number}
   */
  #delay = ChatterProfile.DefaultDelay;

  /**
   * How many frames a finished line stays on screen.
   * @type {number}
   */
  #duration = ChatterProfile.DefaultDuration;

  /**
   * How many frames each character of a line takes to appear.
   * @type {number}
   */
  #speed = ChatterProfile.DefaultSpeed;

  /**
   * Which side of this character their chatter sits on.
   * @type {string}
   */
  #position = ChatterProfile.DefaultPosition;

  /**
   * What this character's chatter is drawn on.
   * @type {string}
   */
  #background = ChatterProfile.DefaultBackground;

  /**
   * Constructor.
   * @param {string[]} lines Everything this character may say.
   * @param {number} radius How many tiles away they can be heard from.
   * @param {number} cooldown How many frames they rest after finishing a line.
   * @param {number} delay The longest they wait before starting one, in frames.
   * @param {number} duration How many frames a finished line stays on screen.
   * @param {number} speed How many frames each character of a line takes to appear.
   * @param {string} position Which side of them their chatter sits on.
   * @param {string} background What their chatter is drawn on.
   */
  constructor(lines, radius, cooldown, delay, duration, speed, position, background)
  {
    this.#lines = lines;
    this.#radius = radius;
    this.#cooldown = cooldown;
    this.#delay = delay;
    this.#duration = duration;
    this.#speed = speed;
    this.#position = position;
    this.#background = background;
  }

  /**
   * Everything this character may say.
   * @returns {string[]}
   */
  lines()
  {
    return this.#lines;
  }

  /**
   * How many tiles away this character can be heard from.
   * @returns {number}
   */
  radius()
  {
    return this.#radius;
  }

  /**
   * How many frames this character rests after finishing a line.
   * @returns {number}
   */
  cooldown()
  {
    return this.#cooldown;
  }

  /**
   * The longest this character waits before starting a line, in frames.
   * @returns {number}
   */
  delay()
  {
    return this.#delay;
  }

  /**
   * How many frames a finished line stays on screen.
   * @returns {number}
   */
  duration()
  {
    return this.#duration;
  }

  /**
   * How many frames each character of a line takes to appear.
   * @returns {number}
   */
  speed()
  {
    return this.#speed;
  }

  /**
   * Which side of this character their chatter sits on.
   * @returns {string}
   */
  position()
  {
    return this.#position;
  }

  /**
   * What this character's chatter is drawn on.
   * @returns {string}
   */
  background()
  {
    return this.#background;
  }

  /**
   * The Show Text Background value this character's chatter is drawn with.
   * @returns {number}
   */
  backgroundType()
  {
    const known = ChatterProfile.BackgroundTypes[ this.#background ];

    // a word nobody recognises means somebody typed one, and an ordinary bubble is the only answer
    // that is still legible - the transparent form would vanish the backdrop and read as the plugin
    // being broken rather than as the tag being wrong.
    if (known === undefined) return ChatterProfile.BackgroundTypes.window;

    return known;
  }

  /**
   * Whether this character has anything at all to say.
   *
   * An empty pool is the ordinary state of almost every event in a project, and it is how a page
   * turns chatter off: page two simply carries no `<chatter:>` tags.
   * @returns {boolean}
   */
  hasLines()
  {
    return this.#lines.length > 0;
  }

  /**
   * Whether this character's chatter hangs beneath them rather than over their head.
   * @returns {boolean}
   */
  prefersBelow()
  {
    return this.#position === ChatterProfile.BelowPosition;
  }

  /**
   * The profile a project that has configured nothing gets.
   * @returns {ChatterProfile}
   */
  static default()
  {
    return new ChatterProfile(
      [],
      ChatterProfile.DefaultRadius,
      ChatterProfile.DefaultCooldown,
      ChatterProfile.DefaultDelay,
      ChatterProfile.DefaultDuration,
      ChatterProfile.DefaultSpeed,
      ChatterProfile.DefaultPosition,
      ChatterProfile.DefaultBackground);
  }

  /**
   * Lays a set of authored values over an existing profile.
   *
   * One merge rather than one per layer, which is what lets the config section and an event page be
   * applied by the same code in the same order every time. Anything the values do not mention is
   * carried through untouched, so a page saying only `<chatterRadius:2>` keeps every other answer
   * the project already settled.
   * @param {ChatterProfile} profile The profile being overridden.
   * @param {object} values Whatever was authored, with anything unauthored absent.
   * @returns {ChatterProfile}
   */
  static overriddenBy(profile, values)
  {
    return new ChatterProfile(
      values.lines ?? profile.lines(),
      values.radius ?? profile.radius(),
      values.cooldown ?? profile.cooldown(),
      values.delay ?? profile.delay(),
      values.duration ?? profile.duration(),
      values.speed ?? profile.speed(),
      values.position ?? profile.position(),
      values.background ?? profile.background());
  }

  /**
   * Builds a profile from authored values alone, over the defaults written here.
   * @param {object} values Whatever was authored, with anything unauthored absent.
   * @returns {ChatterProfile}
   */
  static fromValues(values)
  {
    const defaults = ChatterProfile.default();

    return ChatterProfile.overriddenBy(defaults, values);
  }
}

export default ChatterProfile;
//endregion ChatterProfile